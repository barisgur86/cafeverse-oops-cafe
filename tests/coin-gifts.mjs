import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {PGlite} from '@electric-sql/pglite';import pg from 'pg';
import {Economy} from '../source/server/secure/economy.mjs';import {catalog} from '../source/server/secure/engine.mjs';import {handler} from '../source/server/secure/http.mjs';
const url=process.env.CAFE_TEST_DATABASE_URL;if(url&&!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('Disposable localhost database only');
const schema='gift_'+crypto.randomBytes(6).toString('hex'),authSchema=schema+'_auth';
const real=url?new pg.Pool({connectionString:url,options:'-c search_path='+schema}):null,db=real?{query:(...a)=>real.query(...a),exec:s=>real.query(s),close:()=>real.end()}:new PGlite();
await db.exec(`create schema ${schema};create schema ${authSchema};set search_path=${schema};create table ${authSchema}.users(id uuid primary key);create function ${authSchema}.uid() returns uuid language sql as $$select null::uuid$$;do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;end$$;`);
await db.exec('create table cafe_cloud_saves(user_id uuid,save jsonb)');
for(const file of ['2026111701_authoritative_economy.sql','20261119230914_earned_coin_gifts.sql'])await db.exec(fs.readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8').replaceAll('public.',schema+'.').replaceAll('auth.',authSchema+'.'));
let tail=Promise.resolve();const pool=real||{query:(...a)=>db.query(...a),async connect(){let release;const next=new Promise(r=>release=r),old=tail;tail=next;await old;return {query:(...a)=>db.query(...a),release};}};
let now=Date.now();const apple={environment:'Sandbox',transaction:async(_,id)=>({appAccountToken:id,environment:'Sandbox',transactionId:'60001',originalTransactionId:'60001',productId:'com.cafeverse.oopscafe.coins250',coins:250})};
const e=new Economy(pool,apple,{features:{coinGifts:true},clock:()=>now}),user=async()=>{const id=crypto.randomUUID();await db.query(`insert into ${authSchema}.users values($1)`,[id]);await e.me(id);return id};
try{
 const sender100=await user(),recipient100=await user();await db.query('update cafe_game_accounts set giftable_coins=382 where user_id=$1',[sender100]);const before100A=(await e.me(sender100)).state,before100B=(await e.me(recipient100)).state,id100=crypto.randomUUID(),code100=(await e.me(recipient100)).state.code;await Promise.all([e.sendCoins(sender100,{amount:100,code:code100,request_id:id100}),e.sendCoins(sender100,{amount:100,code:code100,request_id:id100})]);const after100A=(await e.me(sender100)).state,after100B=(await e.me(recipient100)).state;assert.equal(after100A.coins,before100A.coins-100);assert.equal(after100A.giftableCoins,before100A.giftableCoins-100);assert.equal(after100B.coins,before100B.coins+100);assert.equal(after100B.giftableCoins,before100B.giftableCoins+100);console.log('PASS disposable database 100-coin transfer: sender 500/382 → 400/282, recipient 500/0 → 600/100; concurrent same ID once. NOT real authenticated accounts.');
 const a=await user(),b=await user(),outsider=await user(),code=(await e.me(b)).state.code;
 const send=(amount,request_id=crypto.randomUUID(),target=code)=>e.sendCoins(a,{amount,code:target,request_id});
 assert.equal((await e.me(a)).state.giftableCoins,0);await assert.rejects(send(1),/kazanılmış/);
 // Synthetic earned allowance in this disposable DB only, never a live user.
 await db.query('update cafe_game_accounts set giftable_coins=100 where user_id=$1',[a]);
 const rid=crypto.randomUUID();await Promise.all([send(20,rid),send(20,rid)]);assert.equal((await e.me(a)).state.coins,480);assert.equal((await e.me(a)).state.giftableCoins,80);assert.equal((await e.me(b)).state.coins,520);
 await assert.rejects(send(21,rid),/kimliği/);
 const race=await Promise.allSettled([send(50),send(50)]);assert.equal(race.filter(x=>x.status==='fulfilled').length,1);assert.equal((await e.me(a)).state.giftableCoins,30);assert.equal((await e.me(b)).state.coins,570);
 for(const amount of [0,-1,1.5,NaN,Infinity,'1',1000001])await assert.rejects(send(amount));
 await assert.rejects(send(1,crypto.randomUUID(),(await e.me(a)).state.code),/Kendine/);await assert.rejects(send(1,crypto.randomUUID(),'FFFFFFFFFF'),/bulunamadı/);
 const beforeA=await e.me(a),beforeB=await e.me(b),save=e.save.bind(e);let count=0;e.save=async(...args)=>{await save(...args);if(++count===2)throw Error('injected persistence failure')};
 await assert.rejects(send(5),/injected/);e.save=save;assert.deepEqual((await e.me(a)).state,beforeA.state);assert.deepEqual((await e.me(b)).state,beforeB.state);
 // Lost response/restart repeats the receipt, never the wallet mutation.
 const retry=crypto.randomUUID();await send(5,retry);const restarted=new Economy(pool,apple,{features:{coinGifts:true}});await restarted.sendCoins(a,{amount:5,code,request_id:retry});assert.equal((await e.me(a)).state.coins,425);
 await e.credit(outsider,'fixture');assert.equal((await e.me(outsider)).state.coins,750);assert.equal((await e.me(outsider)).state.giftableCoins,0);
 const privacy=await e.coinGifts(outsider);assert.equal(privacy.gifts.length,0);assert.equal((await e.coinGifts(a)).gifts.length,3);
 const allowed=(await db.query("select has_table_privilege('authenticated',$1,'UPDATE') as ok",[schema+'.cafe_coin_gifts'])).rows[0].ok;assert.equal(allowed,false);
 const app=handler(e,async h=>{if(h!=='Bearer A')throw Object.assign(Error('session required'),{status:401});return a});
 assert.equal((await app(new Request('https://test/api/coin-gifts'))).status,401);
 const req=new Request('https://test/api/coin-gifts',{method:'POST',headers:{authorization:'Bearer A','content-type':'application/json'},body:JSON.stringify({amount:1,code,request_id:crypto.randomUUID(),user_id:outsider})});assert.equal((await app(req)).status,200);assert.equal((await e.me(outsider)).state.coins,750);
 // Genuine game reward path certifies earned coins; purchase replay does not.
 const gamer=await user(),order={id:crypto.randomUUID(),mode:'table',table:1,items:[{recipe:0}]};const game=(path,body)=>e.game(gamer,path,{request_id:crypto.randomUUID(),...body});
 await game('/api/service-orders/open',{order});now+=2200;const prep=await game('/api/preparations',{amounts:catalog.FORMULAS[0],order_id:order.id,customer_id:order.id+':0'});now+=6000;
 const old=await e.me(gamer);const body={order_id:order.id,mode:'table',table:1,customers:[order.id+':0'],preparations:[prep.preparation.id]};await game('/api/service-batches/serve',body);const earned=await e.me(gamer);assert.ok(earned.state.giftableCoins>0);assert.equal(earned.state.giftableCoins,earned.state.coins-old.state.coins);
 const receiverDebt=await user(),debtCode=(await e.me(receiverDebt)).state.code;await db.query('update cafe_game_accounts set refund_debt=3 where user_id=$1',[receiverDebt]);await e.sendCoins(gamer,{code:debtCode,amount:3,request_id:crypto.randomUUID()});assert.equal((await e.me(receiverDebt)).state.refundDebt,0);assert.equal((await e.me(receiverDebt)).state.giftableCoins,0);
 const transfer=async(from,to)=>e.sendCoins(from,{code:to,amount:1,request_id:crypto.randomUUID()});await Promise.all([transfer(a,code),transfer(b,(await e.me(a)).state.code)]);
 console.log('PASS coin gifts: earned-only source, purchase exclusion, atomic transfer/rollback, replay/restart, overspend race, opposite-direction locks, self/invalid target/amount rejection, actor authorization, private history, debt repayment and actual game earning path. '+(real?'localhost multi-connection PostgreSQL':'PGlite serialized concurrency')+'; no real devices or live users.');
}finally{if(real){await db.exec(`drop schema ${schema} cascade;drop schema ${authSchema} cascade`);}await db.close();}

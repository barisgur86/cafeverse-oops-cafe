import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import pg from 'pg';
import {Economy} from '../source/server/secure/economy.mjs';
import {gameEngine} from '../source/server/secure/engine.mjs';
import {AppleVerifier,bundleID} from '../source/server/secure/apple.mjs';
import {handler,supabaseAuthenticator} from '../source/server/secure/http.mjs';
const databaseURL=process.env.CAFE_TEST_DATABASE_URL;
if(databaseURL&&!['localhost','127.0.0.1'].includes(new URL(databaseURL).hostname))throw Error('Tests require a disposable localhost database');
const pgPool=databaseURL?new pg.Pool({connectionString:databaseURL}):null;
const db=pgPool?{query:(...a)=>pgPool.query(...a),exec:s=>pgPool.query(s),close:()=>pgPool.end()}:new PGlite();
await db.exec(`create schema auth;create table auth.users(id uuid primary key);create role anon;create role authenticated;create function auth.uid() returns uuid language sql as 'select null::uuid';create table cafe_cloud_saves(user_id uuid,save jsonb);`);
await db.exec(fs.readFileSync(new URL('../supabase/migrations/2026111701_authoritative_economy.sql',import.meta.url),'utf8'));
// PGlite runs PostgreSQL in-process on one connection. Serialize transactions;
// real multi-connection lock races are additionally covered by postgres CI.
let tail=Promise.resolve();
const pool=pgPool||{query:(...args)=>db.query(...args),async connect(){let unlock;const next=new Promise(r=>unlock=r),previous=tail;tail=next;await previous;return {query:(...args)=>db.query(...args),release:()=>unlock()};}};
let now=Date.now();const alice=crypto.randomUUID(),bob=crypto.randomUUID(),mallory=crypto.randomUUID();
for(const id of [alice,bob,mallory])await db.query('insert into auth.users values($1)',[id]);
let tx={bundleId:bundleID,environment:'Sandbox',transactionId:'1234',originalTransactionId:'1234',productId:'com.cafeverse.oopscafe.coins250',type:'Consumable',quantity:1,appAccountToken:alice,purchaseDate:now};
// Inject only the cryptographic boundary; business validation is the production code.
const verifier=Object.create(AppleVerifier.prototype);verifier.environment='Sandbox';verifier.verifier={async verifyAndDecodeTransaction(jws){if(jws!=='signed-fixture')throw Error('invalid signature');return {...tx};},async verifyAndDecodeNotification(){throw Error('invalid signature');}};
const economy=new Economy(pool,verifier,{clock:()=>now});
const a=await economy.me(alice),b=await economy.me(bob);assert.equal(a.state.coins,500);
await assert.rejects(economy.credit(alice,'forged'),/imzası/);
for(const patch of [{bundleId:'other'},{environment:'Production'},{productId:'invalid'},{transactionId:''},{originalTransactionId:''},{quantity:2},{appAccountToken:bob},{revocationDate:now}]){const prior=tx;tx={...tx,...patch};await assert.rejects(economy.credit(alice,'signed-fixture'));tx=prior;}
const credit=await economy.credit(alice,'signed-fixture');assert.equal(credit.state.coins,750);
const retried=await Promise.all([economy.credit(alice,'signed-fixture'),economy.credit(alice,'signed-fixture')]);assert.ok(retried.every(r=>r.state.coins===750));
assert.equal((await economy.history(alice)).history.length,1);
// Response lost / process restart: persisted transaction is still delivered once.
assert.equal((await new Economy(pool,verifier).credit(alice,'signed-fixture')).state.coins,750);
const app=handler(economy,async token=>{if(token!=='Bearer alice')throw Object.assign(Error('Unauthorized'),{status:401});return alice;});
assert.equal((await app(new Request('https://cafe/api/me',{headers:{'oai-authenticated-user-id':bob}}))).status,401);
const spoof=await app(new Request('https://cafe/api/stock',{method:'POST',headers:{authorization:'Bearer alice','content-type':'application/json'},body:JSON.stringify({user_id:bob,item:'milk',request_id:crypto.randomUUID()})}));assert.equal(spoof.status,200);assert.equal((await economy.me(bob)).state.coins,500);
const stock=await economy.me(alice),before=stock.state.pantry;
const offer={request_id:crypto.randomUUID(),code:b.state.code,give_item:'milk',give_qty:2,want_item:'berry',want_qty:3};
await economy.offer(alice,offer);assert.equal((await economy.me(alice)).state.pantry.milk,before.milk-2);
await economy.offer(alice,offer);assert.equal((await economy.me(alice)).state.pantry.milk,before.milk-2);
await assert.rejects(economy.offer(alice,{...offer,give_qty:1}),/kimliği/);
await assert.rejects(economy.settle(mallory,offer.request_id,'accept',crypto.randomUUID()),/yetkin/);
const accepted=await economy.settle(bob,offer.request_id,'accept',crypto.randomUUID());assert.equal(accepted.status,'accepted');
assert.equal((await economy.me(alice)).state.pantry.berry,before.berry+3);assert.equal((await economy.me(bob)).state.pantry.milk,6);
await economy.settle(bob,offer.request_id,'accept',crypto.randomUUID());assert.equal((await economy.me(bob)).state.pantry.milk,6);
await assert.rejects(economy.settle(alice,offer.request_id,'cancel',crypto.randomUUID()),/işlendi/);
await assert.rejects(economy.offer(alice,{...offer,request_id:crypto.randomUUID(),give_qty:99}),/yeterli/);
for(const give_qty of [-1,0,100,1.5,100000000000])await assert.rejects(economy.offer(alice,{...offer,request_id:crypto.randomUUID(),give_qty}));
await assert.rejects(economy.offer(alice,{...offer,request_id:crypto.randomUUID(),give_item:'coins'}));
const cancel={...offer,request_id:crypto.randomUUID(),give_qty:1,want_qty:1};await economy.offer(alice,cancel);
const race=await Promise.allSettled([economy.settle(bob,cancel.request_id,'accept',crypto.randomUUID()),economy.settle(alice,cancel.request_id,'cancel',crypto.randomUUID())]);assert.equal(race.filter(r=>r.status==='fulfilled').length,1);
const expired={...cancel,request_id:crypto.randomUUID()};const milk=(await economy.me(alice)).state.pantry.milk;await economy.offer(alice,expired);now+=86400001;await economy.trades(bob);assert.equal((await economy.me(alice)).state.pantry.milk,milk);await assert.rejects(economy.settle(bob,expired.request_id,'accept',crypto.randomUUID()),/işlendi/);
const insufficient={...cancel,request_id:crypto.randomUUID(),want_qty:99};await economy.offer(alice,insufficient);const snapshots=[await economy.me(alice),await economy.me(bob)];await assert.rejects(economy.settle(bob,insufficient.request_id,'accept',crypto.randomUUID()),/yeterli/);assert.deepEqual((await economy.me(alice)).state.pantry,snapshots[0].state.pantry);assert.deepEqual((await economy.me(bob)).state.pantry,snapshots[1].state.pantry);
await economy.settle(bob,insufficient.request_id,'reject',crypto.randomUUID());
// Fail after both stock updates: PostgreSQL rolls every change back.
const failure={...cancel,request_id:crypto.randomUUID()};await economy.offer(alice,failure);const saved=[await economy.me(alice),await economy.me(bob)];
const originalSave=economy.save.bind(economy);let writes=0;economy.save=async(...args)=>{await originalSave(...args);if(++writes===2)throw Error('database failure');};
await assert.rejects(economy.settle(bob,failure.request_id,'accept',crypto.randomUUID()),/database failure/);economy.save=originalSave;
assert.deepEqual((await economy.me(alice)).state.pantry,saved[0].state.pantry);assert.deepEqual((await economy.me(bob)).state.pantry,saved[1].state.pantry);
let notificationID=crypto.randomUUID();verifier.notification=async()=>({notification:{notificationUUID:notificationID,notificationType:'REFUND',signedDate:now},transaction:{...tx,coins:250},jws:'signed-fixture'});
const coins=(await economy.me(alice)).state.coins;await economy.notification('fixture');assert.equal((await economy.me(alice)).state.coins,coins-250);await economy.notification('fixture');assert.equal((await economy.me(alice)).state.coins,coins-250);await assert.rejects(economy.credit(alice,'signed-fixture'),/iade/);
// Failed coin save rolls the ledger INSERT back as well; retry credits once.
tx={...tx,transactionId:'5678',originalTransactionId:'5678'};const beforeFailure=(await economy.me(alice)).state.coins;
economy.save=async()=>{throw Error('coin database failure');};await assert.rejects(economy.credit(alice,'signed-fixture'),/coin database failure/);economy.save=originalSave;
assert.equal((await economy.me(alice)).state.coins,beforeFailure);assert.equal((await economy.credit(alice,'signed-fixture')).state.coins,beforeFailure+250);
// Spent refunds never make a negative wallet; debt is paid by future credits.
await db.query("update cafe_game_accounts set save=jsonb_set(save,'{coins}','10') where user_id=$1",[alice]);notificationID=crypto.randomUUID();await economy.notification('fixture');
assert.equal((await economy.me(alice)).state.coins,0);assert.equal((await economy.me(alice)).state.refundDebt,240);
notificationID=crypto.randomUUID();await economy.notification('fixture');assert.equal((await economy.me(alice)).state.refundDebt,240);
verifier.notification=async()=>({notification:{notificationUUID:crypto.randomUUID(),notificationType:'REFUND_REVERSED',signedDate:now+1},transaction:{...tx,coins:250},jws:'signed-fixture'});
await economy.notification('fixture');assert.equal((await economy.me(alice)).state.refundDebt,0);assert.equal((await economy.me(alice)).state.coins,10);
// Older refund notification cannot undo a later reversal.
verifier.notification=async()=>({notification:{notificationUUID:crypto.randomUUID(),notificationType:'REFUND',signedDate:now},transaction:{...tx,coins:250},jws:'signed-fixture'});await economy.notification('fixture');assert.equal((await economy.me(alice)).state.coins,10);
// Migrated history is adopted after verification, never credited twice.
tx={...tx,transactionId:'6789',originalTransactionId:'6789'};const legacyAccount=await economy.me(alice);legacyAccount.save.storePurchases['Sandbox:6789']={productID:tx.productId,coins:250,environment:'Sandbox'};await db.query('update cafe_game_accounts set save=$2 where user_id=$1',[alice,legacyAccount.save]);
assert.equal((await economy.credit(alice,'signed-fixture')).state.coins,legacyAccount.state.coins);
// Bearer validation always asks Supabase; never trusts actor IDs from headers/body.
let checked=false;const auth=supabaseAuthenticator('https://example.supabase.co','public',async(url,options)=>{checked=true;assert.equal(options.headers.Authorization,'Bearer token');return Response.json({id:alice});});assert.equal(await auth('Bearer token'),alice);assert.ok(checked);await assert.rejects(auth(null));
// Authenticated clients have no direct economic table privileges.
const privileges=await db.query("select has_table_privilege('authenticated','cafe_game_accounts','UPDATE') as allowed");assert.equal(privileges.rows[0].allowed,false);
await db.close();console.log('PASS secure economy: server validation, replay/restart, refund, escrow, atomic transfers/rollback, expiry, authorization, RLS. Crypto boundary uses fixtures; not a real Apple purchase.');

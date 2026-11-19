// Runs only during a temporary staging verification deployment. Every test
// table is private, synthetic and removed in finally; no auth/cloud rows touched.
import crypto from 'node:crypto';
import {Economy} from '../source/server/secure/economy.mjs';
export async function verifyHostedPostgres(rawPool){
 const schema='cafe_verify_'+crypto.randomUUID().replaceAll('-','');
 const names=['cafe_game_accounts','cafe_apple_transactions','cafe_trade_offers','cafe_secure_requests','cafe_apple_notifications'];
 const passed=[];const assert=(ok,label)=>{if(!ok)throw Error(label);passed.push(label);};
 await rawPool.query('create schema '+schema);
 try{
  for(const n of names)await rawPool.query(`create table ${schema}.${n} (like cafe_stage_062.${n} including all)`);
  const scope=sql=>sql.replace(/\b(cafe_game_accounts|cafe_apple_transactions|cafe_trade_offers|cafe_secure_requests|cafe_apple_notifications)\b/g,schema+'.$1');
  const pool={query:(sql,args)=>rawPool.query(scope(sql),args),async connect(){const c=await rawPool.connect();return {query:(sql,args)=>c.query(scope(sql),args),release:()=>c.release()};}};
  const alice=crypto.randomUUID(),bob=crypto.randomUUID(),other=crypto.randomUUID();
  const tx={environment:'Sandbox',transactionId:'10001',originalTransactionId:'10001',appAccountToken:alice,productId:'com.cafeverse.oopscafe.coins250',coins:250};
  let now=Date.now();const verifier={async transaction(jws,id){if(jws!=='fixture'||id!==alice)throw Error('fixture denied');return tx;}};
  const e=new Economy(pool,verifier,{clock:()=>now});
  await e.me(alice);const recipient=await e.me(bob);
  const credits=await Promise.all([e.credit(alice,'fixture'),e.credit(alice,'fixture'),e.credit(alice,'fixture')]);
  assert(credits.every(c=>c.state.coins===750),'concurrent_purchase_credited_once');
  const make=()=>({request_id:crypto.randomUUID(),code:recipient.state.code,give_item:'milk',give_qty:1,want_item:'berry',want_qty:1});
  const offer=make();await e.offer(alice,offer);
  const accepted=await Promise.all([e.settle(bob,offer.request_id,'accept',crypto.randomUUID()),e.settle(bob,offer.request_id,'accept',crypto.randomUUID())]);
  assert(accepted.every(r=>r.status==='accepted')&&(await e.me(bob)).state.pantry.milk===5,'concurrent_accept_transfers_once');
  const race=make();await e.offer(alice,race);
  const results=await Promise.allSettled([e.settle(alice,race.request_id,'cancel',crypto.randomUUID()),e.settle(bob,race.request_id,'accept',crypto.randomUUID())]);
  assert(results.filter(r=>r.status==='fulfilled').length===1,'accept_cancel_exactly_one_winner');
  const fail=make();await e.offer(alice,fail);const beforeA=await e.me(alice),beforeB=await e.me(bob);
  const save=e.save.bind(e);let count=0;e.save=async(...args)=>{await save(...args);if(++count===2)throw Error('injected failure');};
  let failed=false;try{await e.settle(bob,fail.request_id,'accept',crypto.randomUUID());}catch{failed=true;}e.save=save;
  assert(failed&&JSON.stringify((await e.me(alice)).state.pantry)===JSON.stringify(beforeA.state.pantry)&&JSON.stringify((await e.me(bob)).state.pantry)===JSON.stringify(beforeB.state.pantry),'database_failure_rolls_back_both_inventories');
  let forbidden=false;try{await e.settle(other,fail.request_id,'accept',crypto.randomUUID());}catch(e){forbidden=e.status===403;}assert(forbidden,'unauthorized_actor_denied');
  now+=86400001;await e.trades(alice);assert((await e.me(alice)).state.pantry.milk===beforeA.state.pantry.milk+1,'expired_escrow_returned_once');
  return {passed,realPostgres:true,realApplePayment:false};
 }finally{await rawPool.query('drop schema '+schema+' cascade');}
}

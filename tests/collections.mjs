import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {weeklySets,weeklyItems,weeklyAvailable} from '../source/server/collections.mjs';
const C=JSON.parse(fs.readFileSync(new URL('catalog.json',import.meta.url),'utf8'));
const ctx={CafeTestCatalog:C,__CAFE_TEST_NODE__:true,structuredClone};vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../offline-runtime.js',import.meta.url),'utf8'),ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/appearance.js',import.meta.url),'utf8'),ctx);
assert.equal(new Set(weeklyItems.map(i=>i.id)).size,weeklyItems.length);
for(const i of weeklyItems){let now=i.release-1;const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};let engine=ctx.CafeOfflineFactory(storage,()=>now);const buy=()=>engine.handle(i.kind==='outfit'?'/api/outfit':'/api/decor',{request_id:crypto.randomUUID(),...(i.kind==='outfit'?{item:i.id}:{decor:i.id})});
 assert.equal(weeklyAvailable(i.id,now),false);assert.equal(buy().status,403);assert.equal(engine.snapshot().coins,500);
 now=i.release;assert.equal(weeklyAvailable(i.id,now),true);let result=buy();assert.equal(result.status,200);assert.equal(result.state.coins,500-i.cost);
 assert.equal(buy().state.coins,500-i.cost);engine=ctx.CafeOfflineFactory(storage,()=>now);now=i.release-1;assert.equal(buy().state.coins,500-i.cost);
 const saved=engine.snapshot();if(i.kind==='outfit'){assert.equal(saved.look.apron,i.id);assert.ok(ctx.CafeAppearance.apronSvg(saved.look).includes(`data-apron="${i.id}"`));}else{assert.ok(ctx.CafeAppearance.decorSvg(saved).includes(`data-decor="${i.id}"`));assert.ok(ctx.CafeAppearance.decorSvg(saved).includes('data-decor="plant"'));}
}
assert.equal(weeklySets.length,4);const dec=ctx.CafeAppearance.decorSvg({owned:['plant','cloudlamp','cloudlamp','bad" onload="alert(1)'],decor:'moonclock'});assert.equal((dec.match(/data-decor=/g)||[]).length,2);assert.ok(!dec.includes('moonclock'));assert.ok(!dec.includes('onload'));assert.equal(ctx.CafeAppearance.apronSvg({apron:'<script>'}),'');
console.log('PASS collections: exact release boundary, locked items never charged, owned items survive restart/clock rollback, no repeat debit, cumulative decor, all weekly aprons render and unknown IDs are ignored.');

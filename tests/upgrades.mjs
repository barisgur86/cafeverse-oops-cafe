import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';
import {upgrades,prepareSeconds} from '../source/server/progression.mjs';
const C=JSON.parse(fs.readFileSync(new URL('catalog.json',import.meta.url),'utf8')),context={CafeTestCatalog:C,__CAFE_TEST_NODE__:true,structuredClone};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../offline-runtime.js',import.meta.url),'utf8'),context);
const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};let engine=context.CafeOfflineFactory(storage,()=>1000);const request=(url,body)=>engine.handle(url,{request_id:crypto.randomUUID(),...body});
assert.equal(upgrades.length,12);assert.equal(new Set(upgrades.map(u=>u.id)).size,12);
assert.equal(request('/api/upgrades',{upgrade:'table2'}).status,403);assert.equal(engine.snapshot().coins,500);
const save=engine.exportSave();save.served=27;save.coins=20000;save.pantry=Object.fromEntries(C.ITEMS.map(id=>[id,999]));engine.importSave(save);
assert.equal(request('/api/upgrades',{upgrade:'espresso3'}).status,403);assert.equal(engine.snapshot().coins,20000);
let expected=20000;for(const u of [...upgrades].sort((a,b)=>a.level-b.level)){const r=request('/api/upgrades',{upgrade:u.id});assert.equal(r.status,200,u.id);expected-=u.cost;assert.equal(r.state.coins,expected,u.id);assert.equal(request('/api/upgrades',{upgrade:u.id}).state.coins,expected,'repeat '+u.id)}
const snapshot=engine.snapshot();assert.equal(snapshot.progression.upgrades.length,12);assert.equal(snapshot.progression.capacity,9);assert.equal(snapshot.progression.upgrades.filter(id=>/^table[234]$/.test(id)).length,3);
for(let recipe=0;recipe<C.FORMULAS.length;recipe++){const p=request('/api/preparations',{amounts:C.FORMULAS[recipe]});assert.equal(p.status,200);assert.ok(Math.abs(p.preparation.duration-prepareSeconds(recipe,upgrades.map(u=>u.id))*1000)<.001);assert.equal(p.preparation.duration,3000)}
engine=context.CafeOfflineFactory(storage,()=>1000);assert.equal(engine.snapshot().progression.upgrades.length,12);assert.equal(engine.snapshot().progression.capacity,9);assert.equal(engine.snapshot().coins,expected);
const poor=engine.exportSave();poor.coins=0;poor.bought=[];engine.importSave(poor);assert.equal(request('/api/upgrades',{upgrade:'table2'}).status,409);assert.equal(engine.snapshot().coins,0);assert.equal(engine.snapshot().progression.upgrades.length,0);
assert.equal(prepareSeconds(2,['espresso2']),4.25);assert.equal(prepareSeconds(0,['espresso2']),5);assert.equal(prepareSeconds(0,['blender2','blender3']),3.5);
console.log('PASS upgrades: all 12 coin purchases, level/prerequisite/funds gates, exact single debit, four tables, capacity 36 products, 3-second fully upgraded preparation, all 18 server/device timings match, restart persistence.');

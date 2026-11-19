import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',import.meta.url),'utf8'));
const source=fs.readFileSync(new URL('../offline-runtime.js',import.meta.url),'utf8');
const context={CafeTestCatalog:catalog,__CAFE_TEST_NODE__:true,structuredClone};vm.createContext(context);vm.runInContext(source,context);
const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};let now=1000000;let engine=context.CafeOfflineFactory(storage,()=>now);
const call=(url,body)=>engine.handle(url,body?{request_id:crypto.randomUUID(),...body}:undefined);
const deliverTakeaway=prep=>{const id=crypto.randomUUID(),order={id,mode:'takeaway',table:null,items:[{recipe:prep.recipe,preparation:prep.id}]};assert.equal(call('/api/service-orders/open',{order}).status,200);return call('/api/service-batches/serve',{order_id:id,mode:'takeaway',table:null,customers:[id+':0'],preparations:[prep.id]})};
assert.equal(call('/api/me').state.coins,500);assert.equal(call('/api/me').state.progression.xp,0);
const amounts={berry:3,milk:1,ice:4,vanilla:1,cream:1};let p=call('/api/preparations',{amounts});assert.equal(p.status,200);assert.equal(p.state.coins,491);assert.equal(call('/api/preparations/'+p.preparation.id+'/serve',{}).status,409);
now+=5001;let d=deliverTakeaway(p.preparation);assert.equal(d.state.coins,526);assert.equal(d.state.progression.xp,35);assert.equal(call('/api/preparations/'+p.preparation.id+'/serve',{}).status,409);assert.equal(call('/api/me').state.coins,526);
const id=crypto.randomUUID();d=call('/api/outfit',{item:'bow',request_id:id});assert.equal(d.state.coins,481);assert.equal(d.state.look.head,'bow');assert.equal(call('/api/outfit',{item:'bow',request_id:id}).state.coins,481);
assert.equal(call('/api/preparations',{amounts:{milk:2,ice:3,vanilla:1,cream:2}}).status,403);
assert.equal(call('/api/decor',{decor:'bluechick'}).state.coins,381);assert.ok(call('/api/me').state.owned.includes('bluechick'));
for(let i=0;i<2;i++){p=call('/api/preparations',{amounts});assert.equal(p.status,200);now+=5001;d=deliverTakeaway(p.preparation);assert.equal(d.status,200)}
assert.equal(d.state.progression.level,2);assert.equal(d.state.progression.xp,105);
const expectedCoins=d.state.coins;engine=context.CafeOfflineFactory(storage,()=>now);assert.equal(call('/api/me').state.coins,expectedCoins);assert.equal(call('/api/me').state.look.head,'bow');assert.ok(call('/api/me').state.owned.includes('bluechick'));
assert.equal(call('/api/upgrades',{upgrade:'table2'}).status,200);assert.equal(call('/api/me').state.progression.capacity,2);
p=call('/api/preparations',{amounts});assert.equal(p.status,200);assert.equal(call('/api/preparations',{amounts}).status,200);for(let j=0;j<6;j++)assert.equal(call('/api/preparations',{amounts}).status,200);assert.equal(call('/api/preparations',{amounts}).status,409);
const shopID=crypto.randomUUID(),before=call('/api/me').state.coins;d=call('/api/demo-purchases',{pack_id:'pocket',request_id:shopID});assert.equal(d.state.coins,before+250);assert.equal(call('/api/demo-purchases',{pack_id:'pocket',request_id:shopID}).state.coins,before+250);assert.equal(call('/api/demo-purchases',{pack_id:'chest',request_id:shopID}).status,409);
assert.equal(call('/api/cafes?code=AABBCCDDEE').status,503);assert.equal(call('/api/trades',{}).status,503);
const coins=call('/api/me').state.coins;assert.equal(call('/api/outfit',{item:'made-up'}).status,400);assert.equal(call('/api/me').state.coins,coins);
let round=call('/api/calls/start',{}).round;assert.ok(round);for(let i=0;i<3;i++){now+=20;d=call('/api/calls/'+round.id+'/tap',{});assert.equal(d.status,200)}assert.equal(d.round.status,'finished');assert.equal(d.state.coins,coins);assert.ok(d.state.attracted>=1);assert.equal(call('/api/calls/start',{}).status,409);
// A failed localStorage save must not leave an in-memory credit or inventory change.
let failWrites=false;const failing={getItem:k=>storage.getItem(k),setItem:(k,v)=>{if(failWrites)throw Error('quota');storage.setItem(k,v)}};const fragile=context.CafeOfflineFactory(failing,()=>now);const stable=fragile.snapshot().coins;failWrites=true;assert.equal(fragile.handle('/api/demo-purchases',{pack_id:'pocket',request_id:crypto.randomUUID()}).status,500);assert.equal(fragile.snapshot().coins,stable);
// Validate every inline script as JavaScript; each remains in its own classic-script scope.
const html=fs.readFileSync(new URL('../iOS/App/Web/index.html',import.meta.url),'utf8');let count=0;for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)){new vm.Script(match[1]);count++}assert.ok(count>=10);assert.ok(!html.includes('fonts.googleapis.com'));assert.ok(!fs.readFileSync(new URL('../iOS/App/CafeverseApp.swift',import.meta.url),'utf8').includes('http://localhost'));
console.log('PASS: offline prepare/serve/readiness, XP/levels/rewards, retry safety, clothing/pets, restart persistence, upgrades/capacity, demo coin purchase, call cooldown, online features clearly blocked, '+count+' inline scripts parse.');

// A four-person table is delivered atomically, including retries and a late fourth drink.
const trayValues=new Map();const trayStorage={getItem:k=>trayValues.get(k)||null,setItem:(k,v)=>trayValues.set(k,v)};const tray=context.CafeOfflineFactory(trayStorage,()=>now);
const tc=(url,body)=>tray.handle(url,body?{request_id:crypto.randomUUID(),...body}:undefined);
let ids=[];for(let j=0;j<3;j++)ids.push(tc('/api/preparations',{amounts}).preparation.id);now+=5001;ids.push(tc('/api/preparations',{amounts}).preparation.id);
const orderID=crypto.randomUUID();const order={id:orderID,mode:'table',table:1,items:ids.map(id=>({recipe:catalog.FORMULAS.findIndex(f=>JSON.stringify(f)===JSON.stringify(amounts)),preparation:id}))};assert.equal(tc('/api/service-orders/open',{order}).status,200);
const serveContext={order_id:orderID,mode:'table',table:1,customers:ids.map((_,i)=>orderID+':'+i)};
const cb=tc('/api/me').state.coins;assert.equal(tc('/api/service-batches/serve',{...serveContext,preparations:ids}).status,409);assert.equal(tc('/api/me').state.served,0);assert.equal(tc('/api/me').state.coins,cb);
assert.equal(tc('/api/service-batches/serve',{...serveContext,preparations:[ids[0],ids[0]]}).status,400);
now+=5001;const trayID=crypto.randomUUID();let served=tc('/api/service-batches/serve',{...serveContext,preparations:ids,request_id:trayID});assert.equal(served.status,200);assert.equal(served.state.served,4);assert.equal(served.state.coins,cb+240);assert.equal(served.state.progression.xp,140);assert.equal(tc('/api/service-batches/serve',{...serveContext,preparations:ids}).status,409);assert.equal(tc('/api/service-batches/serve',{...serveContext,preparations:ids,request_id:trayID}).state.coins,served.state.coins);
console.log('PASS: four-product tray readiness, atomic delivery, no duplicate reward, no coins for door calls.');

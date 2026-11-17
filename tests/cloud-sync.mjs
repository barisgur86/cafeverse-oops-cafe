import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../source/public/cloud-sync.js',import.meta.url),'utf8');
const factory={CafeTestCatalog:JSON.parse(fs.readFileSync(new URL('catalog.json',import.meta.url),'utf8')),__CAFE_TEST_NODE__:true,structuredClone};vm.createContext(factory);vm.runInContext(fs.readFileSync(new URL('../offline-runtime.js',import.meta.url),'utf8'),factory);
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
const reorder=v=>Array.isArray(v)?v.map(reorder):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).reverse().map(k=>[k,reorder(v[k])])):v;
const settle=async()=>{for(let n=0;n<4;n++)await new Promise(r=>setImmediate(r))};const server={version:0,save:null};
function device(storage=memory()){
 const engine=factory.CafeOfflineFactory(storage),events=new Map();let offline=false;
 const element=()=>({children:[],open:false,textContent:'',appendChild(n){this.children.push(n)},replaceChildren(){this.children=[]},showModal(){this.open=true},close(){this.open=false}});
 const context={CafeCloudEngine:engine,CafeAccountID:'test',structuredClone,localStorage:storage,setTimeout:()=>1,clearTimeout:()=>{},document:{getElementById:()=>null,createElement:element,head:element(),body:element()},addEventListener:(n,f)=>events.set(n,f),webkit:{messageHandlers:{cafeCloud:{postMessage:async p=>{if(offline)throw Error('offline');if(p.action==='pull')return {version:server.version,save:reorder(structuredClone(server.save))};if(p.expectedVersion!==server.version)throw Error('[40001] conflict');server.save=structuredClone(p.save);return {version:++server.version}}}}}};
 vm.createContext(context);vm.runInContext(source,context);
 return {engine,storage,sync:context.CafeCloudSync,context,change(item='bow'){const r=engine.handle('/api/outfit',{item,request_id:crypto.randomUUID()});assert.equal(r.status,200);events.get('cafeverse-local-save')()},set offline(v){offline=v}};
}
const a=device();await settle();assert.equal(a.sync.getStatus().ready,true);a.change();await a.sync.push();assert.equal(server.save.coins,455);
const b=device();await settle();assert.equal(b.engine.snapshot().coins,455);assert.equal(b.sync.getStatus().blocked,false);
a.change('beret');const pending=a.engine.snapshot().coins;const resumed=device(a.storage);await settle();assert.equal(resumed.sync.getStatus().blocked,false);await resumed.sync.push();assert.equal(server.save.coins,pending);
b.change('glasses');const localB=b.engine.snapshot().coins;const conflict=device(b.storage);await settle();assert.equal(conflict.sync.getStatus().blocked,false);const remoteCoins=server.save.coins;assert.equal(conflict.engine.snapshot().coins,remoteCoins);assert.equal(JSON.parse(conflict.storage.getItem('cafe-cloud-base:test:recovery')).coins,localB);assert.ok(conflict.storage.getItem('cafe-cloud-base:test:recovery'));assert.equal(conflict.sync.getStatus().blocked,false);
conflict.change('cap');conflict.offline=true;const beforeOffline=conflict.engine.snapshot().coins;await conflict.sync.push();assert.equal(conflict.sync.getStatus().dirty,true);assert.equal(conflict.engine.snapshot().coins,beforeOffline);conflict.offline=false;await conflict.sync.push();assert.equal(server.save.coins,beforeOffline);
// Legacy baselines and JSONB key reordering must not ask the player to choose.
const legacySave=conflict.engine.exportSave(),legacyKey='cafe-cloud-base:test';
conflict.storage.setItem(legacyKey,JSON.stringify({version:server.version,baseline:JSON.stringify(reorder(legacySave))}));
const legacy=device(conflict.storage);await settle();assert.equal(legacy.sync.getStatus().blocked,false);assert.equal(legacy.engine.snapshot().coins,beforeOffline);
// Key order is irrelevant, but genuine changes to stock/orders/coins remain protected.
legacy.change('headphones');const localCoins=legacy.engine.snapshot().coins;
server.save=structuredClone(server.save);server.save.pantry.berry+=1;server.version++;
const divergent=device(legacy.storage);await settle();assert.equal(divergent.sync.getStatus().blocked,false);assert.equal(divergent.engine.snapshot().coins,server.save.coins);assert.equal(JSON.parse(divergent.storage.getItem('cafe-cloud-base:test:recovery')).coins,localCoins);assert.equal(divergent.context.document.body.children.length,0);
// An Apple transaction must reach the cloud before the native purchase may finish.
server.save=null;server.version=0;factory.CafeNativeStore=true;factory.CafeAccountID='test';
const paid=device();await settle();const tx={transactionID:'123456',productID:'com.cafeverse.oopscafe.coins250',coins:250,environment:'Sandbox'};
assert.equal(paid.engine.handle('/api/ios-store-credit',{request_id:crypto.randomUUID(),transaction:tx}).status,200);
paid.offline=true;await assert.rejects(paid.sync.ensurePurchaseSaved(tx),/buluta/);assert.equal(server.save,null);
paid.offline=false;await paid.sync.ensurePurchaseSaved(tx);assert.equal(server.save.coins,750);assert.equal(server.save.storePurchases['Sandbox:123456'].coins,250);
await paid.sync.ensurePurchaseSaved(tx);assert.equal(server.save.coins,750);
console.log('PASS cloud sync: JSONB key ordering, legacy baseline migration, fresh-device restore, offline restart, cloud-authoritative conflict recovery without a dialog, purchase cloud-ack barrier, network failure/retry.');

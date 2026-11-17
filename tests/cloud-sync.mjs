import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../source/public/cloud-sync.js',import.meta.url),'utf8');
const factory={CafeTestCatalog:JSON.parse(fs.readFileSync(new URL('catalog.json',import.meta.url),'utf8')),__CAFE_TEST_NODE__:true,structuredClone};vm.createContext(factory);vm.runInContext(fs.readFileSync(new URL('../offline-runtime.js',import.meta.url),'utf8'),factory);
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
const settle=async()=>{for(let n=0;n<4;n++)await new Promise(r=>setImmediate(r))};const server={version:0,save:null};
function device(storage=memory()){
 const engine=factory.CafeOfflineFactory(storage),events=new Map();let offline=false;
 const element=()=>({children:[],open:false,textContent:'',appendChild(n){this.children.push(n)},replaceChildren(){this.children=[]},showModal(){this.open=true},close(){this.open=false}});
 const context={CafeCloudEngine:engine,CafeAccountID:'test',structuredClone,localStorage:storage,setTimeout:()=>1,clearTimeout:()=>{},document:{getElementById:()=>null,createElement:element,head:element(),body:element()},addEventListener:(n,f)=>events.set(n,f),webkit:{messageHandlers:{cafeCloud:{postMessage:async p=>{if(offline)throw Error('offline');if(p.action==='pull')return structuredClone(server);if(p.expectedVersion!==server.version)throw Error('[40001] conflict');server.save=structuredClone(p.save);return {version:++server.version}}}}}};
 vm.createContext(context);vm.runInContext(source,context);
 return {engine,storage,sync:context.CafeCloudSync,context,change(item='bow'){const r=engine.handle('/api/outfit',{item,request_id:crypto.randomUUID()});assert.equal(r.status,200);events.get('cafeverse-local-save')()},set offline(v){offline=v}};
}
const a=device();await settle();assert.equal(a.sync.getStatus().ready,true);a.change();await a.sync.push();assert.equal(server.save.coins,455);
const b=device();await settle();assert.equal(b.engine.snapshot().coins,455);assert.equal(b.sync.getStatus().blocked,false);
a.change('beret');const pending=a.engine.snapshot().coins;const resumed=device(a.storage);await settle();assert.equal(resumed.sync.getStatus().blocked,false);await resumed.sync.push();assert.equal(server.save.coins,pending);
b.change('glasses');const localB=b.engine.snapshot().coins;const conflict=device(b.storage);await settle();assert.equal(conflict.sync.getStatus().blocked,true);assert.equal(conflict.engine.snapshot().coins,localB);const remoteCoins=server.save.coins;
await conflict.sync.resolve('remote');assert.equal(conflict.engine.snapshot().coins,remoteCoins);assert.ok(conflict.storage.getItem('cafe-cloud-base:test:recovery'));assert.equal(conflict.sync.getStatus().blocked,false);
conflict.change('cap');conflict.offline=true;const beforeOffline=conflict.engine.snapshot().coins;await conflict.sync.push();assert.equal(conflict.sync.getStatus().dirty,true);assert.equal(conflict.engine.snapshot().coins,beforeOffline);conflict.offline=false;await conflict.sync.push();assert.equal(server.save.coins,beforeOffline);
console.log('PASS cloud sync: fresh-device restore, offline restart, divergent-device conflict, explicit restore with recovery copy, network failure/retry.');

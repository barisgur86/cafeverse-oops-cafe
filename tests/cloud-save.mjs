import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',import.meta.url),'utf8'));
const source=fs.readFileSync(new URL('../offline-runtime.js',import.meta.url),'utf8');
const context={CafeTestCatalog:catalog,__CAFE_TEST_NODE__:true,structuredClone};vm.createContext(context);vm.runInContext(source,context);
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)}};
const a=context.CafeOfflineFactory(memory()),b=context.CafeOfflineFactory(memory());
const original=a.exportSave();assert.equal(original.coins,500);
a.handle('/api/outfit',{request_id:'11111111-1111-4111-8111-111111111111',item:'bow'});
const backup=a.exportSave();assert.equal(backup.coins,455);
b.importSave(backup);assert.equal(b.snapshot().coins,455);assert.equal(b.snapshot().look.head,'bow');
assert.throws(()=>b.importSave({...backup,coins:-1}));assert.equal(b.snapshot().coins,455);
for(const invalid of [
 {...backup,code:'OTHER-ACCOUNT'}, {...backup,pantry:null}, {...backup,pantry:{milk:-1}},
 {...backup,look:null}, {...backup,bought:null}, {...backup,calls:null},
 {...backup,storePurchases:[]}, {...backup,attracted:'4'}, {...backup,wardrobe:[null]}
]) { assert.throws(()=>b.importSave(invalid));assert.equal(b.snapshot().coins,455);assert.equal(b.snapshot().look.head,'bow'); }
const persisted=memory();let failWrites=false;
const disk={getItem:persisted.getItem,setItem:(k,v)=>{if(failWrites)throw Error('disk full');persisted.setItem(k,v)}};
const c=context.CafeOfflineFactory(disk);failWrites=true;assert.throws(()=>c.importSave(backup));assert.equal(c.snapshot().coins,500);
console.log('PASS: cloud snapshot export/import, wardrobe and coin restoration, invalid payload rejection.');

import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const context={CafeTestCatalog:JSON.parse(fs.readFileSync(new URL('catalog.json',import.meta.url),'utf8')),__CAFE_TEST_NODE__:true,CafeNativeStore:true,CafeAccountID:crypto.randomUUID(),structuredClone};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../offline-runtime.js',import.meta.url),'utf8'),context);
const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},engine=context.CafeOfflineFactory(storage);
for(const transaction of [null,{transactionID:'123',productID:'com.cafeverse.oopscafe.coins250',coins:250,environment:'Sandbox'}])assert.equal(engine.handle('/api/ios-store-credit',{request_id:crypto.randomUUID(),transaction}).status,503);
assert.equal(engine.snapshot().coins,500);assert.equal(engine.handle('/api/demo-purchases',{request_id:crypto.randomUUID(),pack_id:'pocket'}).status,403);
console.log('PASS StoreKit device boundary: client transaction metadata cannot grant coins; native demo grants remain disabled. Server credit is covered by secure-economy tests.');

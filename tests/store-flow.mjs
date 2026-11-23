import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};const element=()=>({dataset:{},appendChild(){},addEventListener(){},querySelector:()=>({}),querySelectorAll:()=>[],setAttribute(){},innerHTML:'',open:false});
let writes=0,finishes=0,failCredit=false,failFinish=false,releaseCredit;const events=[];
const ctx={document:{createElement:element,body:{appendChild(){}},querySelector:element},localStorage:storage,CafeAccountID:'test-account',CafeNativeStore:true,webkit:{messageHandlers:{cafeStore:{postMessage:async b=>{events.push(b.action);if(b.action==='finish'){assert.ok(writes>0);finishes++;if(failFinish)throw Error('finish unavailable');}return {finished:true}}}}},window:{addEventListener(){}},setTimeout(){},state:{coins:500},connected:true,render(){},hydrate(){},safe:String,api:async()=>{events.push('credit');if(failCredit)throw Error('disk full');if(releaseCredit)await new Promise(r=>releaseCredit.resolve=r);writes++;return {state:{coins:750},purchase:{coins:250}}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/coin-shop.js',import.meta.url),'utf8'),ctx);const deliver=vm.runInContext('deliverNativeTransaction',ctx),tx={transactionID:'123',productID:'com.cafeverse.oopscafe.coins250',environment:'Sandbox'};
releaseCredit={};const a=deliver(tx),b=deliver(tx);assert.equal(a,b);assert.equal(events.filter(x=>x==='credit').length,1);releaseCredit.resolve();await Promise.all([a,b]);releaseCredit=null;assert.equal(finishes,1);assert.deepEqual(events,['credit','finish']);
failCredit=true;await assert.rejects(deliver({...tx,transactionID:'124'}),/disk full/);assert.equal(finishes,1);failCredit=false;await deliver({...tx,transactionID:'124'});assert.equal(finishes,2);
failFinish=true;await assert.rejects(deliver({...tx,transactionID:'125'}),/finish unavailable/);failFinish=false;await deliver({...tx,transactionID:'125'});assert.equal(finishes,4);
let acknowledged=false;ctx.CafeCloudSync={ensurePurchaseSaved:async()=>{events.push('cloud');if(!acknowledged)throw Error('cloud unavailable')}};
const beforeCloud=finishes;await assert.rejects(deliver({...tx,transactionID:'126'}),/cloud unavailable/);assert.equal(finishes,beforeCloud);
acknowledged=true;await deliver({...tx,transactionID:'126'});assert.equal(finishes,beforeCloud+1);assert.deepEqual(events.slice(-3),['credit','cloud','finish']);
console.log('PASS store flow: concurrent purchase/update delivery is serialized, credit precedes finish, failed credit never finishes, and failures remain retryable, and native finish waits for cloud acknowledgement. Apple payment itself requires a device test.');

// Recovery must not let one rejected delivery starve every later Apple purchase.
ctx.CafeServerEnabled=true;ctx.CafeFeatures={iap:true};
ctx.api=async(_path,{transaction})=>{events.push('credit:'+transaction.transactionID);if(transaction.transactionID==='bad')throw Error('receipt rejected');writes++;return {state:{coins:750},purchase:{coins:250}}};
const bridge=ctx.webkit.messageHandlers.cafeStore,originalPost=bridge.postMessage;
bridge.postMessage=async b=>b.action==='pending'?{transactions:[{...tx,transactionID:'bad'},{...tx,transactionID:'good'}]}:originalPost(b);
const recover=vm.runInContext('recoverNativePurchases',ctx);
const beforeRecovery=finishes;
await assert.rejects(recover(),/receipt rejected/);
assert.equal(finishes,beforeRecovery+1);assert.ok(events.includes('credit:good'));
assert.equal(vm.runInContext('shopRecovering',ctx),false);
// Retry after the failed receipt is resolved remains possible; no in-flight lock leaks.
bridge.postMessage=async b=>b.action==='pending'?{transactions:[]}:originalPost(b);
await recover();
// Calling the function directly must not bypass the disabled shop UI.
let purchaseCalls=0;bridge.postMessage=async()=>{purchaseCalls++;throw Error('must not reach StoreKit')};
const purchase=vm.runInContext('purchaseNativePack',ctx);
for(const [server,enabled] of [[false,true],[true,false],[false,false]]){
 ctx.CafeServerEnabled=server;ctx.CafeFeatures={iap:enabled};
 await purchase(tx.productID);
}
assert.equal(purchaseCalls,0);
console.log('PASS store recovery isolation: failed receipt does not block later delivery, recovery lock releases, and direct purchase calls require server authority plus enabled IAP.');

// Late credit responses must not hydrate or finish against a replacement login.
ctx.CafeServerEnabled=true;ctx.CafeFeatures={iap:true};ctx.connected=true;
let releaseLate,hydrations=0,lateFinishes=0;ctx.hydrate=()=>hydrations++;
ctx.api=async()=>{await new Promise(resolve=>releaseLate=resolve);return {state:{coins:750},purchase:{id:'late-account',coins:250}}};
bridge.postMessage=async body=>{if(body.action==='finish')lateFinishes++;return {finished:true}};
const late=deliver({...tx,transactionID:'late-account'});ctx.CafeAccountID='replacement-account';releaseLate();await assert.rejects(late,/ilk oyun hesabında/);assert.equal(hydrations,0);assert.equal(lateFinishes,0);
await assert.rejects(deliver({...tx,transactionID:'wrong-login'}),/ilk oyun hesabında/);assert.equal(lateFinishes,0);
ctx.CafeAccountID='test-account';ctx.api=async()=>({state:{coins:750},purchase:{id:'late-account',coins:250,duplicate:true}});await deliver({...tx,transactionID:'late-account'});assert.equal(hydrations,1);assert.equal(lateFinishes,1);
console.log('PASS store account switch: late server credit cannot hydrate/finish in new login; original account retry recovers duplicate result then finishes. Server ownership/atomic credit separately tested.');

vm.runInContext("pendingStoreProducts.add('legacy');approvalStoreProducts.clear();creditedStoreProducts.clear()",ctx);assert.equal(vm.runInContext("pendingStoreLabel('legacy')",ctx),'İşlem durumu kontrol edilmeli');vm.runInContext("approvalStoreProducts.add('legacy')",ctx);assert.equal(vm.runInContext("pendingStoreLabel('legacy')",ctx),'Apple onayı bekleniyor');vm.runInContext("creditedStoreProducts.add('legacy')",ctx);assert.equal(vm.runInContext("pendingStoreLabel('legacy')",ctx),'Coinler eklendi · Apple işlemi kapanıyor');
console.log('PASS store phase labels: legacy unknown never claims Apple approval; actual deferred approval and durable credited/unfinished are distinct; no cache reset or economic write.');

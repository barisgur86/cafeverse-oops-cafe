/* Native StoreKit 2 supplies products, localized prices and verified transactions. */
const shopDialog=document.createElement('dialog');shopDialog.id='coin-shop';document.body.appendChild(shopDialog);
let shopPacks=[],shopBusy=false,shopRecovering=false,shopLoading=false,shopInventoryLoading=false,shopBuyingProduct=null,shopView='catalog',shopCanPay=false,storeNotice="";
const storeAccountID=globalThis.CafeAccountID;
function assertStoreAccount(){if(globalThis.CafeAccountID!==storeAccountID||globalThis.CafeAccountDeleted)throw Error('Satın alma ilk oyun hesabında bekliyor. O hesapla yeniden giriş yap.');}
const pendingStoreKey='cafe-store-pending:'+(globalThis.CafeAccountID||'device');
let pendingStoreProducts;try{pendingStoreProducts=new Set(JSON.parse(localStorage.getItem(pendingStoreKey)||'[]'))}catch{pendingStoreProducts=new Set()}
// Legacy product-only flags do not prove Apple approval is pending.
const approvalStoreKey=pendingStoreKey+':approval',creditedStoreKey=pendingStoreKey+':credited';
function readStoreSet(key){try{return new Set(JSON.parse(localStorage.getItem(key)||'[]'))}catch{return new Set()}}
const approvalStoreProducts=readStoreSet(approvalStoreKey),creditedStoreProducts=readStoreSet(creditedStoreKey);
function saveStorePhases(){localStorage.setItem(approvalStoreKey,JSON.stringify([...approvalStoreProducts]));localStorage.setItem(creditedStoreKey,JSON.stringify([...creditedStoreProducts]));}
function pendingStoreLabel(id){return creditedStoreProducts.has(id)?'Coinler eklendi · Apple işlemi kapanıyor':approvalStoreProducts.has(id)?'Apple onayı bekleniyor':'İşlem durumu kontrol edilmeli';}
const shopEntry=document.createElement('button');shopEntry.className='coin-shop-entry';shopEntry.textContent='+ Coin';shopEntry.setAttribute('aria-label','Coin mağazasını aç');document.querySelector('.stats').appendChild(shopEntry);shopEntry.onclick=openCoinShop;
const shopNav=document.createElement('button');shopNav.dataset.tab='shop';shopNav.textContent='🪙 Coin mağazası';shopNav.onclick=openCoinShop;document.querySelector('.tabs').appendChild(shopNav);
const storeAvailable=()=>!!globalThis.CafeNativeStore&&!!globalThis.webkit?.messageHandlers?.cafeStore;
const nativeStore=body=>{if(!storeAvailable())return Promise.reject(Error('Coin satın alma iPhone ve iPad uygulamasında kullanılabilir.'));return globalThis.webkit.messageHandlers.cafeStore.postMessage(body)};
// Closing the panel does not cancel a purchase or its durable delivery.
// Keep the payment lock until completion, but let the player return to the café.
function shopShell(content){shopDialog.innerHTML=`<div class="shop-heading"><div><small>CAFÉVERSE · COIN MAĞAZASI</small><h2>Biraz daha sihir 🪙</h2></div><button class="shop-close" aria-label="Coin mağazasını kapat">×</button></div><p class="shop-demo-note">Satın alma Apple onay ekranında tamamlanır. Coinler hesabındaki kafeye eklenir.</p><div class="shop-balance">Bakiyen: <strong>${state.coins} coin</strong></div>${content}<p id="shop-error" role="status" aria-live="polite">${safe(storeNotice)}</p>`;shopDialog.querySelector('.shop-close').onclick=()=>shopDialog.close()}
let storeOperationGeneration=0;
const storeDeliveries=new Map(),storeFinalizations=new Map();
function beginStoreFinalization(transaction,key){
 if(storeFinalizations.has(key))return;
 const finish=(async()=>{
  await nativeStore({action:'finish',transactionID:transaction.transactionID});assertStoreAccount();
  pendingStoreProducts.delete(transaction.productID);creditedStoreProducts.delete(transaction.productID);saveStorePhases();localStorage.setItem(pendingStoreKey,JSON.stringify([...pendingStoreProducts]));
 })();
 storeFinalizations.set(key,finish);
 finish.then(()=>{storeFinalizations.delete(key);storeDeliveries.delete(key);render();if(shopDialog.open&&!shopBusy&&shopView==='catalog')renderShopPacks()},()=>{storeFinalizations.delete(key);storeDeliveries.delete(key);if(globalThis.CafeAccountID===storeAccountID){storeNotice='Coinler eklendi. Apple işlemi arka planda tamamlanacak.';if(shopDialog.open&&!shopBusy&&shopView==='catalog')renderShopPacks()}});
}

function deliverNativeTransaction(transaction){
 // Purchase completion and Transaction.updates may report the same transaction together.
 const key=transaction.environment+':'+transaction.transactionID;
 if(storeDeliveries.has(key))return storeDeliveries.get(key);
 storeOperationGeneration++;
 const delivery=(async()=>{
  assertStoreAccount();
  approvalStoreProducts.delete(transaction.productID);saveStorePhases();
  pendingStoreProducts.add(transaction.productID);localStorage.setItem(pendingStoreKey,JSON.stringify([...pendingStoreProducts]));
  const d=await api('/api/ios-store-credit',{transaction});assertStoreAccount();hydrate(d.state);
  if(!globalThis.CafeServerEnabled&&globalThis.CafeCloudSync?.ensurePurchaseSaved)await globalThis.CafeCloudSync.ensurePurchaseSaved(transaction);
  else if(!globalThis.CafeServerEnabled&&globalThis.webkit?.messageHandlers?.cafeCloud)throw Error('Satın alma buluta kaydedilemedi. Bağlantını kontrol edip yeniden dene.');
  creditedStoreProducts.add(transaction.productID);saveStorePhases();render();if(shopDialog.open&&shopView==='catalog')renderShopPacks();
  beginStoreFinalization(transaction,key);
  render();return d;
 })();
 storeDeliveries.set(key,delivery);
 delivery.then(()=>{if(!storeFinalizations.has(key))storeDeliveries.delete(key)},()=>storeDeliveries.delete(key));
 return delivery;
}
async function recoverNativePurchases(allowFollowup=true){
 if(!globalThis.CafeServerEnabled||globalThis.CafeFeatures?.iap!==true)return;
 if(!storeAvailable()||!connected||shopRecovering)return;
 shopRecovering=true;shopInventoryLoading=true;let followup=false;
 try{
  const generation=storeOperationGeneration,data=await nativeStore({action:'pending'}),failures=[];
  if(data.inventoryVersion===2){for(const id of data.approvalProducts||[]){approvalStoreProducts.add(id);pendingStoreProducts.add(id)}for(const id of data.unresolvedProducts||[])pendingStoreProducts.add(id);localStorage.setItem(pendingStoreKey,JSON.stringify([...pendingStoreProducts]));}
  for(const transaction of data.transactions||[])pendingStoreProducts.add(transaction.productID);
  saveStorePhases();shopInventoryLoading=false;if(shopDialog.open&&!shopBusy&&shopView==='catalog')renderShopPacks();
  // A rejected or temporarily unavailable receipt must not starve other deliveries.
  // Failed transactions remain unfinished so StoreKit can retry them later.
  for(const transaction of data.transactions||[]){
   try{await deliverNativeTransaction(transaction)}catch(error){failures.push(error)}
  }
  if(failures.length)throw failures[0];
  // Retire a legacy UI flag only after a complete native inventory and a
  // server-confirmed credit agree. Never cancel or finish a payment here.
  if(data.inventoryVersion===2&&Array.isArray(data.transactions)&&generation===storeOperationGeneration&&!shopBusy){
   const nativePending=new Set([...data.transactions.map(t=>t.productID),...(data.approvalProducts||[]),...(data.unresolvedProducts||[])]);
   const candidates=[...pendingStoreProducts].filter(id=>!nativePending.has(id)&&!approvalStoreProducts.has(id));
   if(candidates.length){assertStoreAccount();const d=await api('/api/me');assertStoreAccount();
    if(generation===storeOperationGeneration&&!shopBusy){
     const credited=new Set(Object.values(d.save?.storePurchases||{}).map(p=>p.productID));
     for(const id of candidates)if(credited.has(id)){
      const key=pendingStoreKey+':retired-ui';let audit;try{audit=JSON.parse(localStorage.getItem(key)||'[]')}catch{audit=[]}
      localStorage.setItem(key,JSON.stringify([...audit,{productID:id,reason:'credited-no-native-pending',at:Date.now()}].slice(-20)));
      pendingStoreProducts.delete(id);creditedStoreProducts.delete(id);
     }
     localStorage.setItem(pendingStoreKey,JSON.stringify([...pendingStoreProducts]));saveStorePhases();if(d.state)hydrate(d.state);
    }
   }
  }
  followup=allowFollowup&&(data.transactions||[]).length>0&&pendingStoreProducts.size>0;
 }finally{shopRecovering=false;shopInventoryLoading=false}
 if(followup)await recoverNativePurchases(false);
}
async function automaticallyRecoverShop(){
 try{await recoverNativePurchases()}catch(error){storeNotice=error.message||String(error)}
 finally{if(shopDialog.open&&!shopBusy&&shopView==='catalog')renderShopPacks()}
}
async function openCoinShop(){
 if(!connected||shopBusy||shopLoading)return;
 shopLoading=true;shopView='loading';storeNotice='';
 shopShell('<p role="status">App Store paketleri yükleniyor…</p>');if(!shopDialog.open)shopDialog.showModal();
 try{
  const data=await nativeStore({action:'products'});shopPacks=data.products;shopCanPay=data.canPay;shopLoading=false;
  const recovery=automaticallyRecoverShop();renderShopPacks();await recovery;
 }catch(error){
  shopShell('<button class="secondary" id="shop-reload">Tekrar dene</button>');shopDialog.querySelector('#shop-error').textContent=error.message||String(error);shopDialog.querySelector('#shop-reload').onclick=openCoinShop;
 }finally{shopLoading=false}
}

function renderShopPacks(){shopView='catalog';const enabled=globalThis.CafeServerEnabled&&globalThis.CafeFeatures?.iap===true;shopShell((!enabled?'<p class="shop-restriction" role="status">Coin paketleri ve fiyatları görüntülenebilir. Satın alma şu anda kapalı.</p>':'')+(!shopCanPay?'<p class="shop-restriction" role="status">Bu cihazda satın alma kapalı. App Store ve Ekran Süresi satın alma izinlerini kontrol et.</p>':'')+(shopPacks.length?`<div class="coin-packs">${shopPacks.map(pack=>`<button class="coin-pack" data-pack="${safe(pack.id)}" ${!enabled||shopBusy||shopInventoryLoading||!shopCanPay||pendingStoreProducts.has(pack.id)?'disabled':''}><span class="pack-icon">${pack.coins>=2000?'🎁':pack.coins>=750?'🏺':'🪙'}</span><strong>${pack.coins.toLocaleString(globalThis.CafeI18n?.locale||'tr-TR')} coin</strong><span>${safe(pack.name)}</span><small>${safe(pack.price)}</small><b>${!enabled?'Satın alma kapalı':pendingStoreProducts.has(pack.id)?pendingStoreLabel(pack.id):shopBusy&&shopBuyingProduct===pack.id?'Apple ile bağlanıyor…':'Satın al →'}</b></button>`).join('')}</div><p class="shop-help">Coinler kıyafet, dekor, pet ve kafe geliştirmelerinde kullanılır. XP satın alınmaz.</p>`:'<p role="status">Coin paketleri App Store tarafından henüz sunulmuyor. Ürün tanımları ve Apple satış sözleşmesi tamamlanınca burada görünecek.</p>'));shopDialog.querySelectorAll('[data-pack]').forEach(b=>b.onclick=()=>purchaseNativePack(b.dataset.pack));}

async function purchaseNativePack(productID){if(!globalThis.CafeServerEnabled||globalThis.CafeFeatures?.iap!==true){storeNotice='Bu özellik test onayından sonra açılacak.';renderShopPacks();return;}if(shopBusy||shopInventoryLoading||shopLoading)return;if(!connected||!shopCanPay||!shopPacks.some(pack=>pack.id===productID)||pendingStoreProducts.has(productID)){storeNotice=pendingStoreProducts.has(productID)?'Bu paket için Apple işlemi bekleniyor.':'Bu ürün şu anda satın alınamıyor.';renderShopPacks();return;}shopBusy=true;shopBuyingProduct=productID;storeOperationGeneration++;storeNotice='';renderShopPacks();try{assertStoreAccount();const result=await nativeStore({action:'purchase',productID});assertStoreAccount();if(result.status==='cancelled'){storeNotice='Satın alma iptal edildi.';return}if(result.status==='pending'){approvalStoreProducts.add(productID);saveStorePhases();storeNotice='Ödeme Apple onayı bekliyor. Henüz coin eklenmedi.';pendingStoreProducts.add(productID);localStorage.setItem(pendingStoreKey,JSON.stringify([...pendingStoreProducts]));return}if(result.status!=='purchased'||!result.transaction)throw Error('Satın alma sonucu doğrulanamadı.');const d=await deliverNativeTransaction(result.transaction);shopBusy=false;shopView='success';shopShell(`<section class="demo-success"><span class="shop-check">✓</span><h3>+${d.purchase.coins.toLocaleString('tr-TR')} coin eklendi</h3><p>${result.transaction.environment==='Sandbox'?'Apple test satın alımı tamamlandı; gerçek ücret alınmadı.':'Apple satın alımı tamamlandı.'}</p><button class="primary" id="shop-done">Oyuna dön</button></section>`);shopDialog.querySelector('#shop-done').onclick=()=>shopDialog.close()}catch(error){shopBusy=false;renderShopPacks();shopDialog.querySelector('#shop-error').textContent=(error.message||String(error))+' Teslim bekleyen satın almalar yeniden açılışta kontrol edilir.'}finally{shopBuyingProduct=null;if(shopBusy){shopBusy=false;renderShopPacks()}}}
let initialStoreRecovery=false;
window.addEventListener('cafeverse-features',()=>{if(!initialStoreRecovery&&connected&&globalThis.CafeFeatures?.iap===true){initialStoreRecovery=true;automaticallyRecoverShop()}});
window.addEventListener('cafeverse-store-updates',automaticallyRecoverShop);
window.addEventListener('online',automaticallyRecoverShop);
window.addEventListener('pageshow',automaticallyRecoverShop);
window.addEventListener('focus',automaticallyRecoverShop);
document.addEventListener?.('visibilitychange',()=>{if(!document.hidden)automaticallyRecoverShop()});
setTimeout(automaticallyRecoverShop,1500);

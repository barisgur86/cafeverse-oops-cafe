/* Account-scoped cloud save. Cloud wins divergent-device conflicts; local recovery is silent. */
(function(g){
'use strict';
if(g.CafeServerEnabled)return;
if(!g.CafeCloudEngine||!g.webkit?.messageHandlers?.cafeCloud)return;
const engine=g.CafeCloudEngine,bridge=g.webkit.messageHandlers.cafeCloud;
const metaKey='cafe-cloud-base:'+(g.CafeAccountID||'device');
const encode=s=>JSON.stringify(s,(_key,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.keys(value).sort().map(key=>[key,value[key]])):value);
let meta;try{meta=JSON.parse(localStorage.getItem(metaKey));if(meta)meta.baseline=encode(JSON.parse(meta.baseline))}catch{meta=null}
let remoteVersion=null,ready=false,busy=false,dirty=false,timer,retryTimer,changes=0,pulling=false,applying=false,initialized=false,activePush=null,activePull=null;
const status=message=>{g.CafeCloudStatus=message};
const invoke=async(action,save,expectedVersion)=>{if(g.CafeAccountDeleted)throw Error('Hesap silindi.');const result=await bridge.postMessage({action,...(save===undefined?{}:{save}),...(expectedVersion===undefined?{}:{expectedVersion})});if(g.CafeAccountDeleted)throw Error('Hesap silindi.');return result;};
function exportLocal(){const save=engine.exportSave();try{const board=localStorage.getItem('cafe-service-board:'+save.code);if(board)save._serviceBoard=JSON.parse(board)}catch{}return save}
function remember(save,version){if(g.CafeAccountDeleted)return;meta={version,baseline:encode(save)};localStorage.setItem(metaKey,JSON.stringify(meta))}
function refreshGame(){if(typeof hydrate==='function'){const d=engine.handle('/api/me');hydrate(d.state);if(typeof state!=='undefined')state.readyQueue=d.preparations||[];if(typeof serviceBoards!=='undefined')serviceBoards={};if(typeof clearTicketPreparation==='function')clearTicketPreparation();if(typeof restoreReady==='function')restoreReady(d.preparation);for(const id of ['order-flow','prep-screen','service-screen'])document.getElementById(id)?.close();if(typeof render==='function')render()}}
function applyRemote(save){if(g.CafeAccountDeleted)return;const before=exportLocal();localStorage.setItem(metaKey+':recovery',encode(before));applying=true;try{engine.importSave(save);if(save._serviceBoard)localStorage.setItem('cafe-service-board:'+save.code,encode(save._serviceBoard));else localStorage.removeItem('cafe-service-board:'+save.code);refreshGame()}finally{applying=false}}
function schedule(delay=1200){if(g.CafeAccountDeleted)return;clearTimeout(timer);timer=setTimeout(push,delay)}
function retryPull(){if(g.CafeAccountDeleted)return;if(ready||retryTimer)return;retryTimer=setTimeout(()=>{retryTimer=null;pull()},15000)}
function adopt(result){
 const local=exportLocal(),localText=encode(local),remoteText=encode(result?.save);remoteVersion=result.version;
 if(!result?.save){dirty=true;changes++;return}
 if(localText===remoteText){remember(local,remoteVersion);dirty=false;return}
 // The cloud has not advanced: finish uploading this device's pending changes.
 if(meta&&remoteText===meta.baseline){dirty=true;changes++;return}
 // A different cloud save is authoritative. Preserve, never merge, the previous wallet.
 applyRemote(result.save);remember(result.save,remoteVersion);dirty=false;
}
function pull(){
 if(activePull)return activePull;if(ready)return Promise.resolve();pulling=true;
 activePull=(async()=>{try{adopt(await invoke('pull'));ready=true;status('Kafe hazır');if(dirty)schedule(100)}catch{status('Bağlantı bekleniyor');retryPull()}finally{pulling=false;initialized=true;if(ready)g.dispatchEvent?.(new Event('cafeverse-cloud-ready'))}})().finally(()=>{activePull=null});return activePull;
}
function push(){
 if(activePush)return activePush;if(!ready||!dirty)return Promise.resolve();busy=true;
 activePush=(async()=>{try{const local=exportLocal(),sent=changes,result=await invoke('push',local,remoteVersion);remoteVersion=result.version;remember(local,remoteVersion);dirty=changes!==sent;status('Kaydedildi')}
 catch(e){if(/conflict|409|40001/i.test(String(e?.message||e))){try{adopt(await invoke('pull'));status('Kafe eşitlendi')}catch{status('Bağlantı bekleniyor')}}else status('Bağlantı bekleniyor')}
 finally{busy=false}})().finally(()=>{activePush=null;if(dirty)schedule(15000)});return activePush;
}
async function ensurePurchaseSaved(transaction){
 if(!ready)await pull();if(!ready)throw Error('Satın alma buluta kaydedilemedi. Bağlantını kontrol edip yeniden dene.');
 const key=transaction.environment+':'+transaction.transactionID;
 dirty=true;changes++;await push();
 let saved;try{saved=JSON.parse(meta?.baseline||'null')?.storePurchases?.[key]}catch{}
 if(!saved||saved.productID!==transaction.productID||saved.coins!==transaction.coins)throw Error('Satın alma buluta kaydedilemedi. Bağlantını kontrol edip yeniden dene.');
}
g.addEventListener('cafeverse-local-save',()=>{if(applying||g.CafeAccountDeleted)return;dirty=true;changes++;if(ready)schedule()});
g.addEventListener('online',()=>{if(!ready){clearTimeout(retryTimer);retryTimer=null;pull()}else if(dirty)schedule(100)});
g.CafeCloudSync={pull,push,ensurePurchaseSaved,getStatus:()=>({ready,busy,dirty,pulling,applying,initialized,blocked:false,remoteVersion})};
pull();
})(globalThis);

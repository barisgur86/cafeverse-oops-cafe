/* Account-scoped backup, with revision checks and explicit conflict choices. */
(function(g){
'use strict';
if(!g.CafeCloudEngine||!g.webkit?.messageHandlers?.cafeCloud)return;
const engine=g.CafeCloudEngine,bridge=g.webkit.messageHandlers.cafeCloud;
const metaKey='cafe-cloud-base:'+(g.CafeAccountID||'device');
let meta;try{meta=JSON.parse(localStorage.getItem(metaKey))}catch{}
let remoteVersion=null,ready=false,busy=false,dirty=false,timer,retryTimer,changes=0,blocked=false,pulling=false,applying=false,conflict=null;
let dialog;
// Keep routine synchronization quiet; only a conflicting save needs a choice.
const status=message=>{g.CafeCloudStatus=message;};
const invoke=(action,save,expectedVersion)=>bridge.postMessage({action,...(save===undefined?{}:{save}),...(expectedVersion===undefined?{}:{expectedVersion})});
const encode=s=>JSON.stringify(s);
function exportLocal(){const save=engine.exportSave();try{const board=localStorage.getItem('cafe-service-board:'+save.code);if(board)save._serviceBoard=JSON.parse(board)}catch{}return save;}
function remember(save,version){meta={version,baseline:encode(save)};localStorage.setItem(metaKey,JSON.stringify(meta));}
function hasProgress(s){return !!s&&(s.served>0||s.version>0||s.coins!==500||s.wardrobe?.length>3||s.owned?.length>1||Object.keys(s.storePurchases||{}).length>0||s._serviceBoard?.tickets?.length>0);}
function refreshGame(){if(typeof hydrate==='function'){const d=engine.handle('/api/me');hydrate(d.state);if(typeof state!=='undefined')state.readyQueue=d.preparations||[];if(typeof serviceBoards!=='undefined')serviceBoards={};if(typeof clearTicketPreparation==='function')clearTicketPreparation();if(typeof restoreReady==='function')restoreReady(d.preparation);for(const id of ['order-flow','prep-screen','service-screen'])document.getElementById(id)?.close();if(typeof render==='function')render();}}
function applyRemote(save){const before=exportLocal();localStorage.setItem(metaKey+':recovery',encode(before));applying=true;try{engine.importSave(save);if(save._serviceBoard)localStorage.setItem('cafe-service-board:'+save.code,encode(save._serviceBoard));else localStorage.removeItem('cafe-service-board:'+save.code);refreshGame();}finally{applying=false}}
function schedule(delay=1200){clearTimeout(timer);timer=setTimeout(push,delay)}
function retryPull(){if(ready||blocked||retryTimer)return;retryTimer=setTimeout(()=>{retryTimer=null;pull()},15000)}
function showConflict(result){blocked=true;conflict=result;remoteVersion=result.version;status('Kayıt çakışması · Yerel kayıt korundu');showPanel();}
async function pull(){
 if(pulling||ready||blocked)return;pulling=true;
 try{
  const result=await invoke('pull'),local=exportLocal(),localText=encode(local),remoteText=encode(result?.save);
  remoteVersion=result.version;
  if(result?.save){
   if(localText===remoteText){remember(local,remoteVersion)}
   else if(meta&&remoteText===meta.baseline){dirty=true;changes++}
   else if(!hasProgress(local)||(meta&&localText===meta.baseline)){applyRemote(result.save);remember(result.save,remoteVersion)}
   else{showConflict(result);return}
  }else if(hasProgress(local)){dirty=true;changes++}
  ready=true;status('Bulut kayıt bağlı');if(dirty)schedule(100);
 }catch(e){status('Bulut bağlantısı yok · Yerel kayıt korunuyor');retryPull()}
 finally{pulling=false}
}
async function push(){
 if(!ready||busy||!dirty||blocked)return;busy=true;
 try{const local=exportLocal(),sent=changes,result=await invoke('push',local,remoteVersion);remoteVersion=result.version;remember(local,remoteVersion);dirty=changes!==sent;status('Buluta kaydedildi')}
 catch(e){if(/conflict|409|40001/i.test(String(e?.message||e))){blocked=true;status('Kayıt çakışması · Yerel kayıt korundu');try{showConflict(await invoke('pull'))}catch{}}else status('Bulut eşitleme bekliyor · Yerel kayıt korundu')}
 finally{busy=false;if(dirty&&!blocked)schedule(15000)}
}
async function resolve(choice){
 if(!blocked||!conflict||busy)return;busy=true;const target=conflict;
 try{
  if(choice==='local'){const local=exportLocal(),result=await invoke('push',local,target.version);remoteVersion=result.version;remember(local,remoteVersion)}
  else if(choice==='remote'){applyRemote(target.save);remoteVersion=target.version;remember(target.save,remoteVersion)}
  else return;
  conflict=null;blocked=false;dirty=false;ready=true;status('Bulut kayıt bağlı');dialog?.close();
 }catch(e){status('Kayıt seçimi tamamlanamadı · İki kayıt da korundu');if(/conflict|409|40001/i.test(String(e?.message||e))){try{conflict=await invoke('pull')}catch{}}showPanel()}
 finally{busy=false}
}
function showPanel(){
 if(!dialog){dialog=document.createElement('dialog');dialog.className='cloud-save-dialog';document.body.appendChild(dialog)}
 dialog.replaceChildren();const title=document.createElement('h2');title.textContent=blocked?'Hangi kafeyle devam edelim?':'Bulut kaydın';dialog.appendChild(title);
 const p=document.createElement('p');p.textContent=blocked?'Bu cihaz ve bulut farklı ilerlemeler içeriyor. Buluttaki kafeyi seçersen mevcut yerel kaydın bu cihazda kurtarma kopyası olarak saklanır. Coinler birleştirilmez.':(g.CafeCloudStatus||'Bağlantı kontrol ediliyor…');dialog.appendChild(p);
 if(blocked&&conflict){const local=exportLocal();for(const [choice,label,save] of [['local','Bu cihazdaki kafeyi kullan',local],['remote','Buluttaki kafeyi kullan',conflict.save]]){const b=document.createElement('button');b.textContent=label+' · '+(save?.served||0)+' servis · '+(save?.coins||0)+' coin';b.onclick=()=>resolve(choice);dialog.appendChild(b)}}
 const close=document.createElement('button');close.textContent=blocked?'Şimdilik bu cihazda oyna':'Kapat';close.onclick=()=>dialog.close();dialog.appendChild(close);if(!dialog.open)dialog.showModal();
}
if(document.createElement){const style=document.createElement('style');style.textContent='.cloud-save-dialog{width:min(90vw,480px);padding:24px;border:3px solid #f9bfdf;border-radius:24px;background:#fff0f8;color:#542044}.cloud-save-dialog p{font-size:18px;line-height:1.5}.cloud-save-dialog button{display:block;width:100%;margin-top:12px;padding:14px;border-radius:16px;background:#f3d3e9;color:#542044;font-size:17px;font-weight:800}';document.head.appendChild(style)}
g.addEventListener('cafeverse-local-save',()=>{if(applying||blocked)return;dirty=true;changes++;if(ready)schedule()});
g.addEventListener('online',()=>{if(!ready){clearTimeout(retryTimer);retryTimer=null;pull()}else if(dirty&&!blocked)schedule(100)});
g.CafeCloudSync={pull,push,resolve,getStatus:()=>({ready,blocked,dirty,remoteVersion})};
pull();
})(globalThis);

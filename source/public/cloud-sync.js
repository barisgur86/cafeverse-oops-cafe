/* Account-bound Supabase backup beta. Client coin snapshots are never a payment ledger. */
(function(g){
'use strict';
if(!g.CafeCloudEngine||!g.webkit?.messageHandlers?.cafeCloud)return;
const engine=g.CafeCloudEngine,bridge=g.webkit.messageHandlers.cafeCloud;
let remoteVersion=null,ready=false,busy=false,dirty=false,timer,retryTimer,changes=0,blocked=false,pulling=false;
const status=message=>{const el=document.getElementById('online-status');if(el)el.textContent=message;};
const invoke=(action,save,expectedVersion)=>{const payload={action};if(save!==undefined)payload.save=save;if(expectedVersion!==undefined)payload.expectedVersion=expectedVersion;return bridge.postMessage(payload);};
function hasProgress(save){return !!save&&(save.served>0||save.version>0||save.coins!==500||save.wardrobe?.length>3||save.owned?.length>1||Object.keys(save.storePurchases||{}).length>0);}
function retryPull(){if(ready||blocked||retryTimer)return;retryTimer=setTimeout(()=>{retryTimer=null;pull();},15000);}
async function pull(){
 if(pulling||ready||blocked)return;
 pulling=true;
 try{
  const local=engine.exportSave(),result=await invoke('pull');
  if(result?.save){
   // Never overwrite a progressed local save without an explicit conflict-resolution flow.
   if(hasProgress(local)&&JSON.stringify(local)!==JSON.stringify(result.save)){
    blocked=true;remoteVersion=result.version;status('Kayıt çakışması · Yerel kayıt korundu');return;
   }
   engine.importSave(result.save);remoteVersion=result.version;
  }else{remoteVersion=0;if(hasProgress(local)){dirty=true;changes++;}}
  ready=true;status('Bulut kayıt bağlı');if(dirty)schedule(100);
 }catch(e){status('Bulut bağlantısı yok · Yerel kayıt korunuyor');retryPull();}
 finally{pulling=false;}
}
function schedule(delay){clearTimeout(timer);timer=setTimeout(push,delay);}
async function push(){
 if(!ready||busy||!dirty||blocked)return;
 busy=true;
 try{
  const local=engine.exportSave(),sentChanges=changes;
  const result=await invoke('push',local,remoteVersion);
  remoteVersion=result.version;dirty=changes!==sentChanges;status('Buluta kaydedildi');
 }catch(e){
  if(/conflict|409|40001/i.test(String(e?.message||e))){blocked=true;status('Kayıt çakışması · Yerel kayıt korundu');}
  else status('Bulut eşitleme bekliyor · Yerel kayıt korundu');
 }finally{busy=false;if(dirty&&!blocked)schedule(15000);}
}
g.addEventListener('cafeverse-local-save',()=>{if(blocked)return;dirty=true;changes++;if(ready)schedule(1200);});
g.addEventListener('online',()=>{if(!ready){clearTimeout(retryTimer);retryTimer=null;pull();}else if(dirty&&!blocked)schedule(100);});
pull();
})(globalThis);

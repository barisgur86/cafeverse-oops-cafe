/* Native authenticated API: all economic operations execute on the server.
   The existing device engine is a display cache only in this mode. */
(() => {
 if(!globalThis.CafeServerEnabled)return;
 const bridge=globalThis.webkit?.messageHandlers?.cafeGame,cache=globalThis.CafeCloudEngine;
 if(!bridge||!cache)throw Error('Güvenli oyun bağlantısı bulunamadı.');
 let revision=0,initialized=false,applying=false,sequence=Promise.resolve(),timer,boardDirty=false,boardChanges=0;
 const originalFetch=globalThis.fetch;
 const pendingKey='cafeverse-secure-requests:'+(globalThis.CafeAccountID||'device');
 let pending;try{pending=JSON.parse(localStorage.getItem(pendingKey)||'{}');}catch{pending={};}
 const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
 const persistPending=()=>localStorage.setItem(pendingKey,JSON.stringify(pending));
 const queue=fn=>{const task=sequence.then(fn);sequence=task.catch(()=>{});return task;};
 function apply(d,restoreBoard=false){
  if(d.features){globalThis.CafeFeatures=d.features;globalThis.dispatchEvent?.(new Event('cafeverse-features'));}
  if(!d.save)return;applying=true;
  try{cache.importSave(d.save);revision=d.revision;
   if(restoreBoard&&d.save._serviceBoard&&d.state?.code)localStorage.setItem('cafe-service-board:'+d.state.code,JSON.stringify(d.save._serviceBoard));
  }finally{applying=false;}
 }
 async function invoke(path,body){const d=await bridge.postMessage({action:'game',path,...(body?{body}:{})});apply(d,!initialized);initialized=true;return d;}
 globalThis.fetch=async(input,options={})=>{
  const path=String(input);if(!path.startsWith('/api/'))return originalFetch(input,options);
  return queue(async()=>{
   let fingerprint;
   try{
    const body=options.body?JSON.parse(options.body):undefined;
    if(body){const {request_id,...payload}=body;fingerprint=canonical([path,payload]);
     if(!pending[fingerprint]){if(Object.keys(pending).length>=100)throw Error('Bekleyen işlemleri bağlantı gelince tamamla.');pending[fingerprint]=request_id||crypto.randomUUID();persistPending();}
     body.request_id=pending[fingerprint];
    }
    const d=await invoke(path,body);if(fingerprint){delete pending[fingerprint];persistPending();}return Response.json(d);
   }catch(e){
    const code=Number(String(e.message||e).match(/\[(\d{3})\]/)?.[1])||503;
    if(fingerprint&&code>=400&&code<500){delete pending[fingerprint];persistPending();}
    return Response.json({error:e.message||String(e)},{status:code});
   }
  });
 };
 async function flushBoard(){
  if(!initialized||!boardDirty)return;
  return queue(async()=>{
   const code=typeof state!=='undefined'?state.cafeCode:null;if(!code)return;
   const raw=localStorage.getItem('cafe-service-board:'+code);if(!raw)return;
   const board=JSON.parse(raw),sent=boardChanges;await invoke('/api/board',{board,expectedRevision:revision});boardDirty=boardChanges!==sent;
   if(boardDirty){clearTimeout(timer);timer=setTimeout(()=>flushBoard().catch(()=>{}),1500);}
  });
 }
 globalThis.addEventListener('cafeverse-board-save',()=>{if(applying)return;boardDirty=true;boardChanges++;clearTimeout(timer);timer=setTimeout(()=>flushBoard().catch(()=>{}),1500);});
 globalThis.addEventListener('online',()=>flushBoard().catch(()=>{}));
 globalThis.CafeCloudSync={getStatus:()=>({initialized,applying,ready:initialized,blocked:false}),pull:()=>queue(()=>invoke('/api/me')),push:flushBoard};
})();

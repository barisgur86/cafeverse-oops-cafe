/* Native authenticated API: all economic operations execute on the server.
   The existing device engine is a display cache only in this mode. */
(() => {
 if(!globalThis.CafeServerEnabled)return;
 const bridge=globalThis.webkit?.messageHandlers?.cafeGame,cache=globalThis.CafeCloudEngine;
 if(!bridge||!cache)throw Error('Güvenli oyun bağlantısı bulunamadı.');
 let revision=0,initialized=false,applying=false,sequence=Promise.resolve(),timer,boardDirty=false;
 const originalFetch=globalThis.fetch;
 const queue=fn=>{const task=sequence.then(fn);sequence=task.catch(()=>{});return task;};
 function apply(d,restoreBoard=false){
  if(!d.save)return;applying=true;
  try{cache.importSave(d.save);revision=d.revision;
   if(restoreBoard&&d.save._serviceBoard&&d.state?.code)localStorage.setItem('cafe-service-board:'+d.state.code,JSON.stringify(d.save._serviceBoard));
  }finally{applying=false;}
 }
 async function invoke(path,body){const d=await bridge.postMessage({action:'game',path,...(body?{body}:{})});apply(d,!initialized);initialized=true;return d;}
 globalThis.fetch=async(input,options={})=>{
  const path=String(input);if(!path.startsWith('/api/'))return originalFetch(input,options);
  return queue(async()=>{try{const body=options.body?JSON.parse(options.body):undefined;const d=await invoke(path,body);return Response.json(d);}catch(e){return Response.json({error:e.message||String(e)},{status:/401|403/.test(String(e))?401:503});}});
 };
 async function flushBoard(){
  if(!initialized||!boardDirty)return;
  return queue(async()=>{
   const code=typeof state!=='undefined'?state.cafeCode:null;if(!code)return;
   const raw=localStorage.getItem('cafe-service-board:'+code);if(!raw)return;
   const board=JSON.parse(raw);await invoke('/api/board',{board,expectedRevision:revision});boardDirty=false;
  });
 }
 globalThis.addEventListener('cafeverse-board-save',()=>{if(applying)return;boardDirty=true;clearTimeout(timer);timer=setTimeout(()=>flushBoard().catch(()=>{}),1500);});
 globalThis.addEventListener('online',()=>flushBoard().catch(()=>{}));
 globalThis.CafeCloudSync={getStatus:()=>({initialized,applying,ready:initialized,blocked:false}),pull:()=>queue(()=>invoke('/api/me')),push:flushBoard};
})();

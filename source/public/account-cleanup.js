/* Native invokes this only after the server confirms completed account deletion.
   Never clear shared language/audio preferences or another player's café. */
(() => {
 const id=globalThis.CafeAccountID;if(!id)return;
 globalThis.addEventListener('cafeverse-account-deleted',()=>{
  globalThis.CafeAccountDeleted=true;
  const codes=new Set(['USER-'+id]);if(globalThis.CafeDeletedCafeCode)codes.add(globalThis.CafeDeletedCafeCode);
  try{const save=JSON.parse(localStorage.getItem('cafeverse-device-beta-v1:'+id)||'null');if(save?.code)codes.add(save.code);}catch{}
  if(typeof state!=='undefined'&&state.cafeCode)codes.add(state.cafeCode);
  for(const code of codes)localStorage.removeItem('cafe-service-board:'+code);
  for(const key of ['cafe-store-pending:','cafeverse-device-beta-v1:','cafeverse-secure-requests:','cafeverse-cutover-ack:','cafeverse-cutover-recovery:','cafe-cloud-base:'])localStorage.removeItem(key+id);
  localStorage.removeItem('cafe-cloud-base:'+id+':recovery');
 });
})();

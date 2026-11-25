/* Hints only: eligibility is persisted when a new server save is created.
   Missing eligibility in an older save never starts an upgrade-time tutorial. */
(() => {
 const key=s=>'cafeverse-tutorial-skip:'+(s.cafeCode||s.code||'device');
 const tr=(a,b)=>globalThis.CafeI18n?.language==='en'?b:a;
 function eligible(s){try{return s.tutorial?.eligible===true&&!s.tutorial.skipped&&!localStorage.getItem(key(s));}catch{return false;}}
 function hint(s,t,{delivered=false,modal=false,door=false}={}){
  if(!eligible(s)||!t)return null;
  const orders=Object.entries(s.serviceOrders||{}),done=mode=>orders.some(([id,o])=>id!==t.id&&o.mode===mode&&o.status==='served');
  if(t.mode==='table'){
   if(done('table')||(!modal&&s.serviceStats?.table>0))return null;
   if(delivered)return tr('İlk ödülün hesabına eklendi!','Your first reward is in your account!');
   if(s.serviceOrders?.[t.id]?.status==='served')return null;
   if(globalThis.CafeService?.stage(t,Date.now(),s.serviceOrders?.[t.id])==='arriving')return null;
   return globalThis.CafeService?.ready(t)?tr('Hazır! Şimdi masaya servis et.','Ready! Serve the table now.'):tr('İlk sipariş: Hazırla düğmesine dokun.','First order: tap Prepare.');
  }
  if(t.mode==='takeaway'&&!done('takeaway')&&globalThis.CafeService?.ready(t)&&!delivered&&s.serviceOrders?.[t.id]?.status!=='served')return door||modal?tr('Müşteri kapıda. Teslim et düğmesine dokun.','Your customer is at the door. Tap Deliver.'):tr('Kapıya çık ve müşteriye teslim et.','Go to the door and deliver to your customer.');
  return null;
 }
 function attach(root,button,text,s){
  root.querySelector('.first-service-hint')?.remove();if(!button||!text)return;
  const box=document.createElement('aside');box.className='first-service-hint';box.dataset.noI18n='';box.setAttribute('role','status');
  const copy=document.createElement('span');copy.textContent=text;
  const skip=document.createElement('button');skip.type='button';skip.textContent=tr('İpuçlarını atla','Skip tips');
  skip.onclick=async()=>{try{localStorage.setItem(key(s),'1');}catch{}box.remove();try{await transact('/api/tutorial/skip',{skip:true});}catch{/* Persisted local opt-out is retried on a later explicit skip, never blocks play. */}};
  box.append(copy,skip);button.before(box);
 }
 function show(root,{ticket,state,door=false}){attach(root,root.querySelector(door?'#door-package-deliver':'[data-act="action"]'),hint(state,ticket,{door}),state);}
 function showDelivery(root,t,{state,delivered}){attach(root,root.querySelector('.service-reference-action'),hint(state,t,{modal:true,delivered}),state);}
 globalThis.CafeOnboarding=Object.freeze({eligible,hint,show,showDelivery});
})();

/* Self-contained device-only beta engine. No login, network, real payments or real player trades. */
(function(global){
'use strict';
const C=global.CafeTestCatalog;
function createOfflineCafe(storage,clock=()=>Date.now()){
 const KEY='cafeverse-device-beta-v1'+(global.CafeAccountID?':'+global.CafeAccountID:'');
 const initial=()=>({code:global.CafeAccountID?'USER-'+global.CafeAccountID:'OFFLINETST',name:'Test Kafesi',character:0,coins:500,served:0,claimed:false,reputation:0,attracted:0,nextCall:0,version:0,pantry:{milk:4,coffee:4,berry:6,ice:0,vanilla:0,cream:0,cocoa:3,star:2,syrup:0},found:[],trades:{},owned:['plant'],decor:'plant',wardrobe:['chef','pink','none'],look:{head:'chef',face:'none',apron:'pink'},bought:[],preparations:[],receipts:{},calls:[],history:[]});
 let s;try{s=JSON.parse(storage.getItem(KEY))}catch{}if(!s)s=initial();
 const persist=()=>{if(global.CafeAccountDeleted)throw Error('Hesap silindi.');storage.setItem(KEY,JSON.stringify(s));if(!global.__CAFE_TEST_NODE__)global.dispatchEvent?.(new Event('cafeverse-local-save'));};
 const exportSave=()=>structuredClone(s);
 const importSave=(candidate)=>{
  if(!candidate||typeof candidate!=='object'||Array.isArray(candidate)||!Number.isSafeInteger(candidate.version)||candidate.version<0||!Number.isSafeInteger(candidate.coins)||candidate.coins<0||!Number.isSafeInteger(candidate.served)||candidate.served<0||!Array.isArray(candidate.wardrobe)||!Array.isArray(candidate.owned)||!Array.isArray(candidate.preparations)||!candidate.receipts||typeof candidate.receipts!=='object'||Array.isArray(candidate.receipts))throw Error('Bulut kaydı geçersiz.');
  const record=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const count=v=>Number.isSafeInteger(v)&&v>=0;
  if(candidate.code!==s.code||!record(candidate.pantry)||!record(candidate.look)||!record(candidate.trades)||!Array.isArray(candidate.bought)||!Array.isArray(candidate.found)||!Array.isArray(candidate.calls)||!Array.isArray(candidate.history)||!count(candidate.attracted)||!count(candidate.reputation)||Object.values(candidate.pantry).some(n=>!count(n))||candidate.wardrobe.some(x=>typeof x!=='string')||candidate.owned.some(x=>typeof x!=='string')||candidate.bought.some(x=>typeof x!=='string')||(candidate.storePurchases!==undefined&&!record(candidate.storePurchases)))throw Error('Bulut kaydı eksik veya başka hesaba ait. Yerel kayıt korundu.');
  const before=s;s=structuredClone(candidate);try{persist()}catch(e){s=before;throw e}return snapshot();
 };
 const progress=()=>{const level=Math.min(10,1+Math.floor(s.served/3));return {xp:s.served*35,level,levelStart:(level-1)*105,nextXP:level===10?null:level*105,upgrades:s.bought,capacity:1+C.upgrades.filter(u=>s.bought.includes(u.id)).reduce((n,u)=>n+(u.capacity||0),0),catalog:C.upgrades,recipeLevels:C.recipeLevels}};
 const questCatalog=[{id:'first-three',kind:'cups',target:3,reward:50,to:'cafe'},{id:'table-one',kind:'table',target:1,reward:10,to:'cafe'},{id:'table-three',kind:'table',target:3,reward:15,to:'cafe',requires:'table-one'},{id:'pickup-one',kind:'takeaway',target:1,reward:10,to:'door'},{id:'pickup-three',kind:'takeaway',target:3,reward:15,to:'door',requires:'pickup-one'},{id:'discover-six',kind:'found',target:6,reward:10,to:'book'},{id:'discover-twelve',kind:'found',target:12,reward:15,to:'book',requires:'discover-six'},{id:'place-one',kind:'decor',target:1,reward:10,to:'decor'},{id:'place-three',kind:'decor',target:3,reward:15,to:'decor',requires:'place-one'}];
 const questProgress=q=>q.kind==='cups'?s.served:q.kind==='found'?new Set(s.found.filter(i=>integer(i,0,C.FORMULAS.length-1))).size:q.kind==='decor'?new Set((s.placedDecor||s.owned).filter(x=>x!=='plant')).size:Object.values(s.serviceOrders||{}).filter(o=>o.status==='served'&&o.mode===q.kind).length;
 const snapshot=()=>structuredClone({...s,serviceOrders:Object.fromEntries(Object.entries(s.serviceOrders||{}).map(([id,o])=>[id,{...o,items:o.items.map(it=>{const p=s.preparations.find(p=>p.status==='ready'&&p.order_id===id&&p.customer_id===it.customer_id&&p.recipe===it.recipe);return p?{...it,preparation:p.id,readyAt:p.ready_at*1000}:it})}])),questCatalog:questCatalog.map(q=>({...q,progress:questProgress(q),claimed:q.id==='first-three'?s.claimed:!!s.quests?.[q.id]})),progression:progress(),now:clock(),preparations:undefined,receipts:undefined,calls:undefined,history:undefined,bought:undefined});
 const failure=(message,status=400)=>{throw Object.assign(Error(message),{status})};
 const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
 const debit=cost=>{if(s.coins<cost)failure('Yeterli coin yok.',409);s.coins-=cost};
 function route(path,body){
  const stateResult=extra=>({state:snapshot(),...extra});
  if(path==='/api/me'){const queue=s.preparations.filter(p=>p.status==='ready'&&p.recipe>=0);return stateResult({preparations:queue,preparation:queue[0]||null})}
  if(path==='/api/coin-shop')return stateResult({demo:true,packs:C.coinPacks,history:s.history.slice(-5).reverse()});
  if(path==='/api/trades'&&!body)return stateResult({trades:[]});
  if(path.startsWith('/api/cafes')||path.startsWith('/api/trades'))failure('Bu beta çevrimdışı. Gerçek oyuncularla takas bu sürümde kapalı.',503);
  if(!body)failure('İşlem bulunamadı.',404);
  const rid=body.request_id;if(typeof rid!=='string'||!/^[a-f0-9-]{36}$/i.test(rid))failure('Geçersiz işlem kimliği.');
  const fingerprint=JSON.stringify([path,Object.fromEntries(Object.entries(body).filter(([k])=>k!=='request_id').sort(([a],[b])=>a.localeCompare(b)))]);
  if(s.receipts[rid]){if(s.receipts[rid].fingerprint!==fingerprint)failure('İşlem kimliği başka bir işlem için kullanılmış.',409);return stateResult(s.receipts[rid].extra)}
  let extra={};
  if(path==='/api/ios-store-credit')failure('Satın alma sunucusu gerekli. Coin teslimi cihazda yapılamaz.',503);
  else if(path==='/api/quests/claim'){const q=questCatalog.find(q=>q.id===body.quest);if(!q)failure('Görev bulunamadı.');s.quests??={};if(q.id==='first-three'?s.claimed:s.quests[q.id])extra.claimed=false;else {if(questProgress(q)<q.target||q.requires&&!s.quests[q.requires])failure('Görev henüz tamamlanmadı.',409);if(q.id==='first-three')s.claimed=true;else s.quests[q.id]=true;s.coins+=q.reward;extra.claimed=true;extra.reward=q.reward;}}
  else if(path==='/api/world'){if(!integer(body.world,0,2)||s.served<[0,3,6][body.world])failure('Dünya henüz açılmadı.',403);s.world=body.world;}
  else if(path==='/api/profile'){const name=String(body.name||'').trim();if(!name||name.length>24||!integer(body.character,0,5))failure('Geçerli bir ad ve karakter seç.');s.name=name;s.character=body.character}
  else if(path==='/api/stock'){if(!C.PRICE[body.item])failure('Malzeme bulunamadı.');debit(C.PRICE[body.item]);s.pantry[body.item]=(s.pantry[body.item]||0)+1}
  else if(path==='/api/outfit'){const weekly=C.weekly?.find(i=>i.id===body.item);if(weekly&&clock()<weekly.release&&!s.wardrobe.includes(body.item))failure('Bu koleksiyon henüz açılmadı.',403);const item=C.outfits[body.item];if(!item)failure('Kıyafet bulunamadı.');if(!s.wardrobe.includes(body.item)){debit(item[0]);s.wardrobe.push(body.item)}s.look[item[1]]=body.item}
  else if(path==='/api/decor'){const weekly=C.weekly?.find(i=>i.id===body.decor);if(weekly&&clock()<weekly.release&&!s.owned.includes(body.decor))failure('Bu koleksiyon henüz açılmadı.',403);const price=C.decor[body.decor];if(price===undefined)failure('Dekor bulunamadı.');if(body.place!==undefined&&typeof body.place!=='boolean')failure('Yerleşim seçimi geçersiz.');s.placedDecor??=[...s.owned];if(!s.owned.includes(body.decor)){debit(price);s.owned.push(body.decor)}if(body.place!==false){if(!s.placedDecor.includes(body.decor))s.placedDecor.push(body.decor);s.decor=body.decor}}

  else if(path==='/api/upgrades'){const u=C.upgrades.find(u=>u.id===body.upgrade);if(!u)failure('Geliştirme bulunamadı.');if(progress().level<u.level)failure('Bu geliştirme '+u.level+'. seviyede açılıyor.',403);if(u.requires&&!s.bought.includes(u.requires))failure('Önce gerekli geliştirmeyi satın al.',403);if(!s.bought.includes(u.id)){debit(u.cost);s.bought.push(u.id)}}
  else if(path==='/api/npc-trade'){const o=C.NPC[body.offer];if(!o||(s.trades[body.offer]||0)>=o[4])failure('Teklif tükendi.');if((s.pantry[o[0]]||0)<o[1])failure('Depoda yeterli malzeme yok.',409);s.pantry[o[0]]-=o[1];s.pantry[o[2]]=(s.pantry[o[2]]||0)+o[3];s.trades[body.offer]=(s.trades[body.offer]||0)+1}
  else if(path==='/api/demo-purchases'){if(global.CafeNativeStore)failure('Demo satın alma bu uygulamada kapalı.',403);const pack=C.coinPacks.find(p=>p.id===body.pack_id);if(!pack)failure('Coin paketi bulunamadı.');s.coins+=pack.coins;extra.purchase={id:rid,pack_id:pack.id,coins:pack.coins,demo:true};s.history.push({...extra.purchase,name:pack.name})}
  else if(path==='/api/service-orders/open'){
   const t=body.order,uuid=v=>typeof v==='string'&&/^[a-f0-9-]{36}$/i.test(v);
   if(!t||!uuid(t.id)||!['table','takeaway'].includes(t.mode)||!Array.isArray(t.items)||t.items.length<1||t.items.length>4||t.mode==='takeaway'&&t.items.length!==1||t.mode==='table'&&!integer(t.table,1,1+['table2','table3','table4'].filter(id=>s.bought.includes(id)).length)||t.mode==='takeaway'&&t.table!==null)failure('Masa veya müşteri kaydı geçersiz.');
   const guestCount=t.guestCount??t.items.length;if(!integer(guestCount,1,t.mode==='table'?4:1))failure('Müşteri sayısı geçersiz.');
   const customers=t.items.map((it,i)=>t.id+':'+i),guestIds=Array.from({length:guestCount},(_,i)=>t.id+':'+i),definition=JSON.stringify([t.mode,t.table,t.items.map(it=>it.recipe),...(t.guestCount===undefined?[]:[guestCount])]);
   if(t.items.some(it=>!integer(it.recipe,0,C.FORMULAS.length-1)||progress().level<C.recipeLevels[it.recipe]))failure('Sipariş tarifi geçersiz.');
   s.serviceOrders??={};const old=s.serviceOrders[t.id];
   if(old){if(old.definition!==definition||!['arriving','seated','served'].includes(old.status))failure('Sipariş artık bu masada beklemiyor.',409);if(old.status!=='served')t.items.forEach((it,i)=>{if(!it.preparation)return;const prep=s.preparations.find(p=>p.id===it.preparation);if(!prep||prep.status!=='ready'||prep.recipe!==it.recipe||prep.order_id&&prep.order_id!==t.id||prep.customer_id&&prep.customer_id!==customers[i])failure('Hazırlık başka müşteriye ait.',409);prep.order_id=t.id;prep.customer_id=customers[i];});extra.order=old;}
   else{
    if(Object.values(s.serviceOrders).some(o=>['arriving','seated'].includes(o.status)&&o.mode===t.mode&&(t.mode==='takeaway'||o.table===t.table)))failure('Bu masanın başka siparişi var.',409);
    const used=s.serviceAdmitted??Math.max(0,(s._serviceBoard?.admitted||0)-(s._serviceBoard?.tickets||[]).reduce((n,o)=>n+(o.guestCount??o.items?.length??0),0));
    const packageAdmissions=Object.values(s.serviceOrders).filter(o=>o.mode==='takeaway').reduce((n,o)=>n+(o.guestCount||1),0);
    if(t.mode==='table'&&Math.max(0,used-packageAdmissions)+guestCount>4+(s.attracted||0))failure('Masaya oturacak müşteri yok.',409);
    const items=t.items.map((it,i)=>{if(it.preparation){const prep=s.preparations.find(p=>p.id===it.preparation);if(!prep||prep.status!=='ready'||prep.recipe!==it.recipe||prep.order_id&&prep.order_id!==t.id)failure('Eski sipariş hazırlığı eşleşmiyor.',409);prep.order_id=t.id;prep.customer_id=customers[i];}return {recipe:it.recipe,customer_id:customers[i]};});
    extra.order=s.serviceOrders[t.id]={id:t.id,mode:t.mode,table:t.table,customers,guestIds,guestCount,items,definition,status:t.items.some(it=>it.preparation)?'seated':'arriving',arrives_at:t.items.some(it=>it.preparation)?clock():clock()+2200};s.serviceAdmitted=used+guestCount;
   }
  }else if(path==='/api/service-orders/leave'){
   const o=s.serviceOrders?.[body.order_id];if(!o||!['arriving','seated'].includes(o.status))failure('Müşteri artık masada değil.',409);o.status='left';extra.order=o;
  }
  else if(path==='/api/preparations'){
   if(!body.amounts||typeof body.amounts!=='object'||Array.isArray(body.amounts))failure('Malzemeler eksik.');
   const amounts=Object.fromEntries(Object.entries(body.amounts).filter(([,n])=>n!==0));if(!Object.keys(amounts).length||Object.entries(amounts).some(([k,n])=>!C.ITEMS.includes(k)||!integer(n,1,6)))failure('Malzeme ölçüleri geçersiz.');
   if(s.preparations.filter(p=>p.status==='ready'&&p.recipe>=0).length>=progress().capacity*4)failure('Servis kapasitesi dolu. Önce servis et.',409);
   const recipe=C.FORMULAS.findIndex(f=>C.ITEMS.every(k=>(f[k]||0)===(amounts[k]||0)));if(recipe>=0&&progress().level<C.recipeLevels[recipe])failure('Bu tarif '+C.recipeLevels[recipe]+'. seviyede açılıyor.',403);
   const order=body.order_id?s.serviceOrders?.[body.order_id]:null;
   if(order?.status==='arriving'&&clock()>=order.arrives_at)order.status='seated';
   if(body.order_id&&(!order||order.status!=='seated'||!order.items.some(it=>it.customer_id===body.customer_id&&it.recipe===recipe)||s.preparations.some(p=>p.order_id===order.id&&p.customer_id===body.customer_id&&p.status==='ready')))failure('Müşteri siparişi eşleşmiyor.',409);
   const stock={},cost=Object.entries(amounts).reduce((sum,[k,n])=>{stock[k]=Math.min(s.pantry[k]||0,n);return sum+(n-stock[k])*C.PRICE[k]},0);debit(cost);for(const [k,n] of Object.entries(stock))s.pantry[k]-=n;
   const machine=C.FORMULAS[recipe]?.coffee?'espresso':'blender',saving=C.upgrades.filter(u=>s.bought.includes(u.id)&&(!u.machine||u.machine===machine)).reduce((sum,u)=>sum+(u.speed||0),0),duration=Math.round(5000*(1-Math.min(.6,saving)));
   const preparation={id:rid,recipe,stock,cost,duration,ready_at:(clock()+duration)/1000,status:'ready',...(order?{order_id:order.id,customer_id:body.customer_id}:{})};s.preparations.push(preparation);if(order){const item=order.items.find(it=>it.customer_id===body.customer_id);item.preparation=preparation.id;item.readyAt=preparation.ready_at*1000;}if(recipe>=0&&!s.found.includes(recipe))s.found.push(recipe);extra.preparation=preparation;
  }else if(path==='/api/service-batches/serve'){
   const ids=body.preparations;if(!Array.isArray(ids)||ids.length<1||ids.length>4||new Set(ids).size!==ids.length||ids.some(x=>typeof x!=='string'))failure('Servis tepsisi geçersiz.');
   const ps=ids.map(id=>s.preparations.find(p=>p.id===id));if(ps.some(p=>!p))failure('Sipariş bulunamadı.',404);
   const order=s.serviceOrders?.[body.order_id];
   if(order?.status==='arriving'&&clock()>=order.arrives_at)order.status='seated';
   if(!order||order.status!=='seated'||order.mode!==body.mode||order.table!==body.table||ps.length!==order.items.length||JSON.stringify(body.customers)!==JSON.stringify(order.customers)||ps.some((p,i)=>p.order_id!==order.id||p.customer_id!==order.customers[i]||p.recipe!==order.items[i].recipe))failure('Masa ve müşteri siparişi eşleşmiyor.',409);
   if(!ps.every(p=>p.status==='served')){order.status='served';order.served_at=clock();
    if(ps.some(p=>p.status!=='ready'||p.recipe<0||p.ready_at>clock()/1000))failure('Tüm ürünler hazır olmadan birlikte servis edilemez.',409);
    const balanceBefore=s.coins;for(const prep of ps){const before=progress().level;prep.status='served';s.served++;s.coins+=35;if(s.served>=3&&!s.claimed){s.coins+=50;s.claimed=true}if(progress().level>before)s.coins+=50}s.trades={};order.deliveryReceipt={orderId:order.id,requestId:rid,coins:s.coins-balanceBefore,xp:ps.length*35,servedAt:order.served_at};
   }extra.deliveryReceipt=order.deliveryReceipt;
  }else if(/^\/api\/preparations\/[^/]+\/serve$/.test(path)){
   const prep=s.preparations.find(p=>p.id===path.split('/')[3]);if(!prep)failure('Sipariş bulunamadı.',404);
   failure('Önce geçerli masa veya paket siparişini seç; tepsiyi birlikte teslim et.',409);
  }else if(path==='/api/calls/start'){
   if(clock()<s.nextCall)failure('Yeniden çağırmak için biraz bekle.',409);
   let round=s.calls.find(c=>c.status==='active'&&clock()-c.started<120000);if(!round){round={id:rid,started:clock(),taps:0,hits:0,status:'active'};s.calls.push(round)}extra.round=round;
  }else if(/^\/api\/calls\/[^/]+\/tap$/.test(path)){
   const round=s.calls.find(c=>c.id===path.split('/')[3]);if(!round||round.status!=='active'||clock()-round.started>120000)failure('Çağrı turu sona erdi.',409);
   const value=(Math.sin((clock()-round.started)/480)+1)/2,hit=value>=.3&&value<=.7;round.taps++;round.hits+=hit?1:0;
   if(round.taps===3){round.status='finished';s.reputation=Math.min(100,s.reputation+4+round.hits*4);s.attracted+=1+round.hits;s.nextCall=clock()+60000}extra={round,hit};
  }else failure('Bu işlem çevrimdışı testte kullanılamıyor.',404);
  s.version++;s.receipts[rid]={fingerprint,extra:structuredClone(extra)};persist();return stateResult(extra);
 }
 function handle(path,body){const readOnly=!body&&['/api/me','/api/coin-shop','/api/trades'].includes(path);const before=readOnly?null:structuredClone(s);try{return {status:200,...route(path,body)}}catch(e){if(before)s=before;return {status:e.status||500,error:e.status?e.message:'Kayıt tamamlanamadı; tekrar dene.'}}}
 persist();return {handle,snapshot,exportSave,importSave};
}
global.CafeOfflineFactory=createOfflineCafe;
if(global.__CAFE_TEST_NODE__)return;
const engine=createOfflineCafe(global.localStorage);
global.CafeCloudEngine=engine;
sessionStorage.setItem('cafeverse-local-player','device-test');
global.fetch=async function(input,options={}){const path=String(input);if(path.startsWith('/api/')){let body;try{body=options.body?JSON.parse(options.body):undefined}catch{return Response.json({error:'Geçersiz istek.'},{status:400})}const d=engine.handle(path,body);const {status,...payload}=d;return Response.json(payload,{status})}const asset=path.split('/').pop();if(global.CafeTestSVG?.[asset])return new Response(global.CafeTestSVG[asset],{headers:{'Content-Type':'image/svg+xml'}});return Response.json({error:'Bu test sürümünde ağ bağlantısı kapalı.'},{status:503})};
})(globalThis);

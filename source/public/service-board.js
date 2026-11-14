/* Table tickets are device/account scoped; a tray is settled atomically by the API. */
let serviceMode='table',activeTicket=null,activeTicketSlot=null,serviceBoards={};
const tableCount=()=>1+['table2','table3','table4'].filter(id=>state.progression?.upgrades.includes(id)).length;
function serviceBoard(){const key=state.cafeCode||'device-test';if(!serviceBoards[key]){try{serviceBoards[key]=JSON.parse(localStorage.getItem('cafe-service-board:'+key))}catch{}serviceBoards[key]||={admitted:0,tickets:[]};}return serviceBoards[key]}
function saveBoard(){localStorage.setItem('cafe-service-board:'+(state.cafeCode||'device-test'),JSON.stringify(serviceBoard()));globalThis.dispatchEvent(new Event('cafeverse-local-save'))}
const waitingCustomers=()=>Math.max(0,4+(state.attracted||0)-serviceBoard().admitted);
function ticketReady(t){return t.items.every(i=>i.preparation&&i.readyAt<=Date.now())}
function ticketName(t){return t.mode==='table'?'Masa '+t.table:'Paket #'+t.number}
function clearTicketPreparation(){pending=null;madeRecipe=null;serverPreparation=null;$('serve').hidden=true;activeTicket=null;activeTicketSlot=null}
function createTicket(){const board=serviceBoard(),guests=serviceMode==='table'?Number($('table-guests').value):1,table=serviceMode==='table'?Number($('table-choice').value):null;
 if(!Number.isInteger(guests)||guests<1||guests>4||guests>waitingCustomers())return toast('Yeterli müşteri yok. Kapıya çıkıp müşteri çağır.');
 if(serviceMode==='table'&&(!table||board.tickets.some(t=>t.mode==='table'&&t.table===table)))return toast('Bu masa dolu. Önce masanın siparişini servis et.');
 if(board.tickets.length>=(state.progression?.capacity||1)+tableCount())return toast('Sipariş panosu dolu. Önce bekleyen siparişleri servis et.');
 const unlocked=availableRecipeIndices();const number=1+(board.sequence||0);board.sequence=number;
 board.tickets.push({id:crypto.randomUUID(),number,mode:serviceMode,table,items:Array.from({length:guests},(_,i)=>({recipe:unlocked[(state.served+i)%unlocked.length],preparation:null,readyAt:0}))});board.admitted+=guests;saveBoard();render();}
function prepareTicket(id){const t=serviceBoard().tickets.find(t=>t.id===id);if(!t)return;const slot=t.items.findIndex(i=>!i.preparation);if(slot<0)return toast('Bu tepsinin tüm ürünleri hazırlanmış.');
 const reserved=new Set(serviceBoard().tickets.flatMap(t=>t.items.map(i=>i.preparation).filter(Boolean)));
 if(serverPreparation&&!reserved.has(serverPreparation.id))return toast('Önce açık içeceği servis et veya tezgâha bırak.');
 activeTicket=id;activeTicketSlot=slot;recipeIndex=t.items[slot].recipe;pending=null;madeRecipe=null;serverPreparation=null;openLab();}
function renderServiceBoard(){const board=serviceBoard(),count=tableCount();
 $('left').innerHTML=`<div class="service-heading"><strong>🍽️ ${count} masa · ${count*4} kişilik</strong><span>🚶 ${waitingCustomers()} müşteri bekliyor</span></div><div class="table-floor" aria-label="Masa ve dört sandalye yerleşimi">${Array.from({length:count},(_,i)=>{const ticket=board.tickets.find(t=>t.mode==='table'&&t.table===i+1);return `<figure class="floor-table ${ticket?'occupied':''}"><img src="/assets/table-four.svg" alt="Masa ${i+1}: bir masa ve dört sandalye"><figcaption>Masa ${i+1}<small>${ticket?ticket.items.length+'/4 kişi oturuyor':'4 sandalye · Boş'}</small></figcaption></figure>`}).join('')}</div><div class="service-modes"><button data-service-mode="table" aria-pressed="${serviceMode==='table'}">Masa siparişi</button><button data-service-mode="takeaway" aria-pressed="${serviceMode==='takeaway'}">🥡 Paket servis</button></div><div class="ticket-new">${serviceMode==='table'?`<label>Masa<select id="table-choice">${Array.from({length:count},(_,i)=>`<option value="${i+1}" ${board.tickets.some(t=>t.mode==='table'&&t.table===i+1)?'disabled':''}>Masa ${i+1} · 4 kişilik</option>`).join('')}</select></label><label>Müşteri sayısı<select id="table-guests">${[1,2,3,4].map(n=>`<option value="${n}" ${n===4?'selected':''}>${n} kişi</option>`).join('')}</select></label>`:'<p>Bir müşterinin siparişini paketle ve teslim et.</p>'}<button class="primary" id="create-ticket" ${waitingCustomers()?'':'disabled'}>Sipariş al</button></div><button class="secondary" id="board-call">🎈 Kapıya çık · Müşteri çağır</button><div class="ticket-list">${board.tickets.filter(t=>t.mode===serviceMode).map(t=>{const done=t.items.filter(i=>i.preparation).length,ready=ticketReady(t);return `<article class="ticket-card"><h3>${t.mode==='table'?'🍽️':'🥡'} ${ticketName(t)} ${t.mode==='table'?`· ${t.items.length}/4 kişi`:''}</h3><p>${t.mode==='table'?'Tüm ürünler tek tepside birlikte gider.':'Hazır olunca paket olarak teslim edilir.'}</p><ul>${t.items.map((i,n)=>`<li>${i.preparation?'✅':'○'} ${n+1}. ${safe(recipes[i.recipe].name)}</li>`).join('')}</ul><strong>${done}/${t.items.length} ürün hazır</strong><button class="primary" data-ticket-prepare="${t.id}" ${done===t.items.length?'hidden':''}>${done?'Sıradaki ürünü':'Ürünü'} hazırla</button><button class="primary" data-ticket-serve="${t.id}" ${ready?'':'disabled'}>${t.mode==='table'?'Tepsiyi birlikte servis et':'Paketi teslim et'}</button></article>`}).join('')||'<p class="ticket-empty">Henüz sipariş yok. Müşterileri karşılayıp sipariş al.</p>'}</div>`;
 document.querySelectorAll('[data-service-mode]').forEach(b=>b.onclick=()=>{serviceMode=b.dataset.serviceMode;renderServiceBoard()});$('create-ticket').onclick=createTicket;$('board-call').onclick=()=>navigateGame('door');document.querySelectorAll('[data-ticket-prepare]').forEach(b=>b.onclick=()=>prepareTicket(b.dataset.ticketPrepare));document.querySelectorAll('[data-ticket-serve]').forEach(b=>b.onclick=()=>openTicketService(b.dataset.ticketServe));}
const beforeServiceBoard=renderLeft;renderLeft=function(){if(tab==='cafe')return renderServiceBoard();return beforeServiceBoard()};
const beforeTicketBrew=$('brew').onclick;$('brew').onclick=async()=>{const ticket=activeTicket,slot=activeTicketSlot;await beforeTicketBrew();if(ticket&&serverPreparation&&serverPreparation.recipe>=0){const t=serviceBoard().tickets.find(t=>t.id===ticket),item=t?.items[slot];if(item&&item.recipe===serverPreparation.recipe){item.preparation=serverPreparation.id;item.readyAt=serverPreparation.ready_at?serverPreparation.ready_at*1000:Date.now()+(serverPreparation.duration||5000);saveBoard()}}};
const beforeTicketFlow=renderOrderFlow;renderOrderFlow=function(step){beforeTicketFlow(step);if(!activeTicket)return;const t=serviceBoard().tickets.find(t=>t.id===activeTicket);if(!t)return;const footer=flowDialog.querySelector('.flow-footer');if(step==='ready'){footer.querySelectorAll('button').forEach(b=>b.remove());const b=document.createElement('button');b.className='flow-primary';const next=t.items.some(i=>!i.preparation);b.textContent=next?'🥤 Tepsiye bırak · Sıradaki ürünü hazırla':'✓ Tepsi hazır · Sipariş panosuna dön';footer.appendChild(b);b.onclick=()=>{const id=t.id;flowDialog.close();clearTicketPreparation();if(next)prepareTicket(id);else{tab='cafe';render()}};footer.querySelector('p').textContent=t.mode==='table'?ticketName(t)+' · Ürünler birlikte servis edilecek.':'Paket siparişin hazır.';}}
function openTicketService(id){
 const t=serviceBoard().tickets.find(t=>t.id===id);if(!t||!ticketReady(t))return;
 const dialog=document.createElement('dialog');dialog.className='ticket-service service-reference';
 let sending=false,delivered=false,earned=0;
 function draw(){
  const table=t.mode==='table',asset=table?(delivered?'table-service-done.png':'table-service-ready.png'):'takeaway-service.png';
  dialog.innerHTML=`<div class="service-reference-stage ${table?'table-art':'takeaway-art'}"><img class="service-reference-image" src="/assets/${asset}" alt="${table?'Dört kişilik masaya servis':'Paket servis'}"><button class="service-reference-close" aria-label="Kafeye dön" ${sending?'disabled':''}>×</button><div class="service-reference-wallet" aria-label="Coin bakiyesi">🪙 ${state.coins.toLocaleString('tr-TR')}</div><div class="service-reference-gems">${ticketName(t)}</div><div class="service-reference-detail">${delivered?`✓ ${t.items.length} ürün teslim edildi · +${earned} coin · +${t.items.length*35} XP`:t.items.map(i=>safe(recipes[i.recipe].name)).join(' · ')}</div><p class="service-reference-status" role="status" aria-live="polite"></p><button class="service-reference-action" ${sending?'disabled':''}>${sending?'Teslim ediliyor…':delivered?'Devam Et ▶':table?'🔔 Servis Et!':'🥡 Teslim Et!'}</button></div>`;
  dialog.querySelector('.service-reference-close').onclick=close;
  dialog.querySelector('.service-reference-action').onclick=()=>delivered?close():deliver();
 }
 function close(){if(sending)return;dialog.close();dialog.remove()}
 async function deliver(){
  if(sending||delivered)return;sending=true;draw();const before=state.coins;
  try{
   await transact('/api/service-batches/serve',{preparations:t.items.map(i=>i.preparation)});
   serviceBoard().tickets=serviceBoard().tickets.filter(x=>x.id!==id);saveBoard();clearTicketPreparation();
   earned=state.coins-before;delivered=true;
   const d=await api('/api/me');state.readyQueue=d.preparations||[];render();celebrate();
  }catch(e){if(!delivered){sending=false;draw();dialog.querySelector('[role=status]').textContent=e.message;return}}
  sending=false;draw();
 }
 dialog.addEventListener('cancel',e=>{if(sending)e.preventDefault();else dialog.remove()});
 document.body.appendChild(dialog);draw();dialog.showModal();
}
const beforeTicketQueue=renderQueue;renderQueue=function(){beforeTicketQueue();const assigned=new Set(serviceBoard().tickets.flatMap(t=>t.items.map(i=>i.preparation)));const root=$('queue-items');if(!root)return;[...root.children].forEach((b,i)=>{if(assigned.has(state.readyQueue?.[i]?.id))b.remove()})};
setInterval(()=>{if(tab==='cafe'&&document.querySelector('[data-ticket-serve]:disabled')&&!document.querySelector('dialog[open]'))renderServiceBoard()},1000);
render();
const beforeTicketRestore=restoreReady;restoreReady=function(prep){if(prep&&serviceBoard().tickets.some(t=>t.items.some(i=>i.preparation===prep.id)))return;return beforeTicketRestore(prep)};
const beforeTicketService=openService;openService=function(){const t=serverPreparation&&serviceBoard().tickets.find(t=>t.items.some(i=>i.preparation===serverPreparation.id));if(t){if(ticketReady(t))return openTicketService(t.id);return toast('Masanın tüm ürünlerini hazırla; sipariş birlikte servis edilir.')}return beforeTicketService()};

// Keep the full recipe readable outside the cropped mixer illustration.
const readableRecipe=document.querySelector('#prep-screen .studio-recipe');if(readableRecipe)$('prep-stage').before(readableRecipe);
$('step-ready').textContent='3 · Servis';

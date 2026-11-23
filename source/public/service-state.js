/* One ticket model for visible customers, preparation and delivery identity. */
(() => {
 function valid(t){return !!t&&(t.guestCount===undefined||Number.isInteger(t.guestCount)&&t.guestCount>=1&&t.guestCount<=(t.mode==='table'?4:1))&&typeof t.id==='string'&&['table','takeaway'].includes(t.mode)&&Array.isArray(t.items)&&t.items.length>0&&t.items.length<=4&&(t.mode==='table'?Number.isInteger(t.table)&&t.table>0:t.table===null&&t.items.length===1)&&!['served','left','cancelled','canceled'].includes(t.status);}
 function reconcile(board,state,now=Date.now()){
  board.departures=(board.departures||[]).filter(d=>valid(d.ticket)&&Number.isFinite(d.at)&&now<d.at+4300);
  const departing=new Set(board.departures.map(d=>d.ticket.id));
  board.tickets=board.tickets.filter(t=>{const order=state.serviceOrders?.[t.id];if(order?.status==='served'){
   if(valid(t)&&!departing.has(t.id)){board.departures.push({ticket:t,at:Number(order.served_at)||now});departing.add(t.id)}return false;
  }return !['left','cancelled','canceled'].includes(order?.status)});
  board.departures=board.departures.filter(d=>now<d.at+4300);return board;
 }
 function arrival(t,order){return Math.max(t.enteredAt?Number(t.enteredAt)+2200:0,Number(order?.arrives_at)||0)}
 function motion(t,now=Date.now(),order,departure){
  if(departure){const q=Math.max(0,Math.min(1,(now-departure.at-2000)/2200));return {progress:q,walking:q>0&&q<1,opacity:1-q,phase:q?'leaving':'thanking'}}
  const q=Math.max(0,Math.min(1,(now-(arrival(t,order)-2200))/2200));return {progress:q,walking:q<1,opacity:1,phase:q<1?'arriving':'seated'};
 }
 function destination(t,locations){if(!valid(t))throw Error('Geçersiz müşteri konumu.');if(t.mode==='takeaway')return [1050,350];const point=locations[t.table-1];if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite))throw Error('Masa konumu bulunamadı.');return [...point];}
 function deliveryPoint(t,locations){const point=destination(t,locations);return t.mode==='takeaway'?[960,300]:[point[0]-130,point[1]+70];}
 function customers(t){return valid(t)?t.items.map((_,i)=>t.id+':'+i):[];}
 function stage(t,now=Date.now(),order){if(!valid(t)||['served','left','cancelled','canceled'].includes(order?.status))return 'empty';if(now<arrival(t,order))return 'arriving';if(t.items.every(i=>typeof i.preparation==='string'&&Number.isFinite(i.readyAt)&&i.readyAt<=now))return 'ready';return t.items.some(i=>i.preparation)?'preparing':'ordered';}
 function view(board,{attracted=0,serviceOrders={}}={},now=Date.now()){
  const tickets=board.tickets.filter(t=>valid(t)&&stage(t,now,serviceOrders[t.id])!=='empty');
  const tables=tickets.filter(t=>t.mode==='table'),packages=tickets.filter(t=>t.mode==='takeaway');
  const stages=packages.map(t=>stage(t,now,serviceOrders[t.id]));
  // Product preparation capacity is deliberately not an order limit.
  const takeawayOrders={active:packages.length,waiting:stages.filter(s=>s==='arriving'||s==='ordered').length,preparing:stages.filter(s=>s==='preparing').length,ready:stages.filter(s=>s==='ready').length};
  return {tickets,waiting:Math.max(0,4+attracted-(board.admitted||0)),seated:tables.filter(t=>stage(t,now,serviceOrders[t.id])!=='arriving').reduce((n,t)=>n+guestIds(t,serviceOrders[t.id]).length,0),occupiedTables:tables.length,arriving:tickets.filter(t=>stage(t,now,serviceOrders[t.id])==='arriving').reduce((n,t)=>n+guestIds(t,serviceOrders[t.id]).length,0),takeaway:packages.reduce((n,t)=>n+guestIds(t,serviceOrders[t.id]).length,0),takeawayOrders};
 }
 function welcome(board,attracted=0){board.welcomed=4+attracted;return board.welcomed;}
 function ready(t,now=Date.now()){return stage(t,now)==='ready'&&t.items.every(i=>typeof i.preparation==='string'&&Number.isFinite(i.readyAt)&&i.readyAt<=now);}
 function guestIds(t,order){return [...(order?.guestIds||t.guestIds||Array.from({length:t.guestCount??t.items.length},(_,i)=>t.id+':'+i))];}
 function presentation(t,order){
  const orderedItems=(order?.items||t.items).map((item,index)=>({recipe:item.recipe,index}));
  const people=guestIds(t,order);
  const quantities=[];for(const item of orderedItems){const row=quantities.find(x=>x.recipe===item.recipe);if(row)row.quantity++;else quantities.push({recipe:item.recipe,quantity:1});}
  return {tableCapacity:t.mode==='table'?4:0,seatedGuestCount:people.length,guestIds:people,orderedItems,quantities};
 }
 function context(t){return {order_id:t.id,mode:t.mode,table:t.table,customers:customers(t)};}
 async function register(t,transact,{waitForArrival=true}={}){if(!valid(t))throw Error('Bu masada geçerli müşteri siparişi yok.');t.registered=true;const d=await transact('/api/service-orders/open',{order:{id:t.id,mode:t.mode,table:t.table,...(t.guestCount===undefined?{}:{guestCount:t.guestCount}),items:t.items.map(i=>({recipe:i.recipe,preparation:i.preparation}))}});if(!d?.order)throw Error('Müşteri siparişi doğrulanamadı.');const delay=Math.max(0,(d.order.arrives_at||0)-Date.now());if(delay&&waitForArrival)await new Promise(resolve=>setTimeout(resolve,delay));return d.order;}
 globalThis.CafeService=Object.freeze({valid,guestIds,presentation,reconcile,arrival,motion,destination,deliveryPoint,customers,stage,view,welcome,ready,context,register});
})();

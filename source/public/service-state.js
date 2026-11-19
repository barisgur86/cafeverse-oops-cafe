/* One ticket model for visible customers, preparation and delivery identity. */
(() => {
 function valid(t){return !!t&&typeof t.id==='string'&&['table','takeaway'].includes(t.mode)&&Array.isArray(t.items)&&t.items.length>0&&t.items.length<=4&&(t.mode==='table'?Number.isInteger(t.table)&&t.table>0:t.table===null&&t.items.length===1)&&!['served','left'].includes(t.status);}
 function customers(t){return valid(t)?t.items.map((_,i)=>t.id+':'+i):[];}
 function stage(t,now=Date.now(),order){if(!valid(t)||['served','left'].includes(order?.status))return 'empty';if(now<Math.max(t.enteredAt?Number(t.enteredAt)+2200:0,Number(order?.arrives_at)||0))return 'arriving';if(t.items.every(i=>typeof i.preparation==='string'&&Number.isFinite(i.readyAt)&&i.readyAt<=now))return 'ready';return t.items.some(i=>i.preparation)?'preparing':'ordered';}
 function view(board,{attracted=0,serviceOrders={}}={},now=Date.now()){const tickets=board.tickets.filter(t=>valid(t)&&stage(t,now,serviceOrders[t.id])!=='empty');return {tickets,waiting:Math.max(0,4+attracted-(board.admitted||0)),seated:tickets.filter(t=>t.mode==='table'&&stage(t,now,serviceOrders[t.id])!=='arriving').reduce((n,t)=>n+t.items.length,0),arriving:tickets.filter(t=>stage(t,now,serviceOrders[t.id])==='arriving').reduce((n,t)=>n+t.items.length,0),takeaway:tickets.filter(t=>t.mode==='takeaway').reduce((n,t)=>n+t.items.length,0)};}
 function welcome(board,attracted=0){board.welcomed=4+attracted;return board.welcomed;}
 function ready(t,now=Date.now()){return stage(t,now)==='ready'&&t.items.every(i=>typeof i.preparation==='string'&&Number.isFinite(i.readyAt)&&i.readyAt<=now);}
 function context(t){return {order_id:t.id,mode:t.mode,table:t.table,customers:customers(t)};}
 async function register(t,transact,{waitForArrival=true}={}){if(!valid(t))throw Error('Bu masada geçerli müşteri siparişi yok.');t.registered=true;const d=await transact('/api/service-orders/open',{order:{id:t.id,mode:t.mode,table:t.table,items:t.items.map(i=>({recipe:i.recipe,preparation:i.preparation}))}});if(!d?.order)throw Error('Müşteri siparişi doğrulanamadı.');const delay=Math.max(0,(d.order.arrives_at||0)-Date.now());if(delay&&waitForArrival)await new Promise(resolve=>setTimeout(resolve,delay));return d.order;}
 globalThis.CafeService=Object.freeze({valid,customers,stage,view,welcome,ready,context,register});
})();

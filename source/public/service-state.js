/* One ticket model for visible customers, preparation and delivery identity. */
(() => {
 function valid(t){return !!t&&typeof t.id==='string'&&['table','takeaway'].includes(t.mode)&&Array.isArray(t.items)&&t.items.length>0&&t.items.length<=4&&(t.mode==='table'?Number.isInteger(t.table)&&t.table>0:t.table===null&&t.items.length===1)&&!['served','left'].includes(t.status);}
 function customers(t){return valid(t)?t.items.map((_,i)=>t.id+':'+i):[];}
 function ready(t,now=Date.now()){return valid(t)&&t.items.every(i=>typeof i.preparation==='string'&&Number.isFinite(i.readyAt)&&i.readyAt<=now);}
 function context(t){return {order_id:t.id,mode:t.mode,table:t.table,customers:customers(t)};}
 async function register(t,transact){if(!valid(t))throw Error('Bu masada geçerli müşteri siparişi yok.');t.registered=true;const d=await transact('/api/service-orders/open',{order:{id:t.id,mode:t.mode,table:t.table,items:t.items.map(i=>({recipe:i.recipe,preparation:i.preparation}))}});if(!d?.order)throw Error('Müşteri siparişi doğrulanamadı.');t.registered=true;return d.order;}
 globalThis.CafeService=Object.freeze({valid,customers,ready,context,register});
})();

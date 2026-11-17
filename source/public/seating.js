/* Plan automatic seating without changing orders, ingredients, coins or XP. */
(() => {
 function plan({board,tables,waiting,blocked=[],recipes,served=0,now,id,reserve=0,capacity=1}){
  let remaining=Math.max(0,waiting-reserve),sequence=board.sequence||0,admitted=board.admitted||0;
  const tickets=[...board.tickets],occupied=new Set([...blocked,...tickets.filter(t=>t.mode==='table').map(t=>t.table)]);
  if(!recipes.length||!remaining)return null;
  for(let table=1;table<=tables&&remaining>0;table++){
   if(occupied.has(table)||tickets.length>=capacity+tables)continue;
   const count=Math.min(4,remaining);sequence++;
   tickets.push({id:id(),number:sequence,mode:'table',table,enteredAt:now,items:Array.from({length:count},(_,i)=>({recipe:recipes[(served+admitted+i)%recipes.length],preparation:null,readyAt:0}))});
   admitted+=count;remaining-=count;occupied.add(table);
  }
  return tickets.length===board.tickets.length?null:{tickets,sequence,admitted};
 }
 globalThis.CafeSeating=Object.freeze({plan});
})();

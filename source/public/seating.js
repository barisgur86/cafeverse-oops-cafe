/* Plan automatic seating without changing orders, ingredients, coins or XP. */
(() => {
 function plan({board,tables,waiting,blocked=[],recipes,served=0,now,id,reserve=0,capacity=1,fullTables=false,takeaway=false,tableService=true,independentTakeaway=false}){
  let remaining=Math.max(0,waiting-reserve),sequence=board.sequence||0,admitted=board.admitted||0;
  const tickets=[...board.tickets],occupied=new Set([...blocked,...tickets.filter(t=>t.mode==='table').map(t=>t.table)]);
  if(!recipes.length||!remaining&&!independentTakeaway)return null;
  let changed=false,packageAdmissions=board.packageAdmissions||0;
  if(tableService&&fullTables){for(let i=0;i<tickets.length&&remaining>0;i++){
   const t=tickets[i];if(t.mode!=='table'||t.registered||t.registering||t.items.length>=4||t.items.some(it=>it.preparation))continue;
   const count=Math.min(4-t.items.length,remaining);tickets[i]={...t,items:[...t.items,...Array.from({length:count},(_,i)=>({recipe:recipes[(served+admitted+i)%recipes.length],preparation:null,readyAt:0}))]};admitted+=count;remaining-=count;changed=true;
  }}
  for(let table=1;tableService&&table<=tables&&remaining>0;table++){
   if(occupied.has(table)||tickets.length>=capacity+tables)continue;
   if(fullTables&&remaining<4)break;
   const count=Math.min(4,remaining);sequence++;
   tickets.push({id:id(),number:sequence,mode:'table',table,enteredAt:now,items:Array.from({length:count},(_,i)=>({recipe:recipes[(served+admitted+i)%recipes.length],preparation:null,readyAt:0}))});
   admitted+=count;remaining-=count;occupied.add(table);
  }
  if(takeaway&&(remaining>0||independentTakeaway)&&!tickets.some(t=>t.mode==='takeaway')&&tickets.length<capacity+tables){
   sequence++;tickets.push({id:id(),number:sequence,mode:'takeaway',table:null,enteredAt:now,items:[{recipe:recipes[(served+admitted)%recipes.length],preparation:null,readyAt:0}]});admitted++;packageAdmissions++;remaining=Math.max(0,remaining-1);
  }
  return !changed&&tickets.length===board.tickets.length?null:{tickets,sequence,admitted,packageAdmissions};
 }
 globalThis.CafeSeating=Object.freeze({plan});
})();

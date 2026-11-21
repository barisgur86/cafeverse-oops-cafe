import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx={};vm.createContext(ctx);
for(const name of ['service-state','seating'])vm.runInContext(fs.readFileSync(new URL('../source/public/'+name+'.js',import.meta.url),'utf8'),ctx);
const S=ctx.CafeService;
const ticket=(id,count=2,table=1,enteredAt=1000)=>({id,mode:table===null?'takeaway':'table',table,enteredAt,items:Array.from({length:count},()=>({recipe:0,preparation:null,readyAt:0}))});
for(const count of [1,2,3,4]){
 const t=ticket('party-'+count,count),b={admitted:count,tickets:[t]},state={};
 for(const at of [1000,1100,2100,3199]){assert.equal(S.stage(t,at),'arriving');assert.equal(S.motion(t,at).opacity,1);assert.ok(S.motion(t,at).progress>=0);assert.equal(S.customers(t).length,count)}
 assert.equal(S.stage(t,3200),'ordered');assert.equal(S.motion(t,3200).progress,1);assert.equal(S.view(b,state,3200).seated,count);
 const restored=JSON.parse(JSON.stringify(b));assert.deepEqual(Array.from(S.customers(restored.tickets[0])),Array.from(S.customers(t)));
}
const delayed=ticket('server-delay');assert.equal(S.stage(delayed,4000,{arrives_at:6000}),'arriving');assert.equal(S.motion(delayed,4000,{arrives_at:6000}).progress,200/2200);assert.equal(S.motion(delayed,-1000).progress,0);
const pair=ticket('served-pair'),b={admitted:2,tickets:[pair]},state={coins:765,served:2,serviceOrders:{'served-pair':{status:'served',served_at:4000}}};
S.reconcile(b,state,4000);assert.equal(b.tickets.length,0);assert.equal(b.departures.length,1);assert.equal(S.motion(pair,4000,undefined,b.departures[0]).opacity,1);
const restored=JSON.parse(JSON.stringify(b));S.reconcile(restored,state,6500);assert.equal(restored.departures.length,1);assert.ok(S.motion(pair,6500,undefined,restored.departures[0]).opacity>0);S.reconcile(restored,state,8300);assert.equal(restored.departures.length,0);assert.equal(state.coins,765);
const p=ctx.CafeSeating.plan({board:{admitted:0,tickets:[]},tables:3,waiting:2,recipes:[0],now:1000,id:()=> 'pack-only',takeaway:true,tableService:false,capacity:3});
assert.equal(p.tickets.length,1);assert.equal(p.tickets[0].mode,'takeaway');assert.equal(p.tickets[0].table,null);assert.equal(S.view(p,{},4000).seated,0);
assert.notDeepEqual(Array.from(S.destination(p.tickets[0],[[705,375],[1015,450],[420,520]])),[705,375]);
// Thirty minutes of virtual game time: arrival, service, departure, reload and reuse.
let board={admitted:0,tickets:[]};const world={coins:9876,serviceOrders:{}};let parties=0;
for(let at=0;at<1800000;at+=80){
 S.reconcile(board,world,at);
 if(at%10000===0){const t=ticket('soak-'+parties,1+parties%4,1,at+1);parties++;board.tickets.push(t);board.admitted+=t.items.length;world.serviceOrders[t.id]={status:'arriving',arrives_at:at+2201}}
 for(const t of board.tickets){const order=world.serviceOrders[t.id];if(at>=order.arrives_at){assert.equal(S.motion(t,at,order).opacity,1);assert.equal(S.view(board,world,at).seated,t.items.length)}if(at>=t.enteredAt+4000){order.status='served';order.served_at=at}}
 if(at%800===0)board=JSON.parse(JSON.stringify(board));
 const ids=[...board.tickets,...board.departures.map(d=>d.ticket)].flatMap(t=>Array.from(S.customers(t)));assert.equal(new Set(ids).size,ids.length);assert.ok(board.tickets.length+board.departures.length<=1);assert.equal(world.coins,9876);
}
S.reconcile(board,world,1805000);assert.equal(board.tickets.length,0);assert.equal(board.departures.length,0);assert.equal(parties,180);
console.log('PASS customer lifecycle: 1/2/3/4 people, opaque seating, shared arrival clock, delayed registration, restart during departure, independent takeaway and 30-minute VIRTUAL soak (180 parties); not a 30-minute physical-device run.');

for(const point of [[NaN,1],[1,Infinity],[1],null])assert.throws(()=>S.destination(ticket('bad-route'),[point]),/konumu/);
console.log('PASS invalid route rejects non-finite coordinates before movement; no invented delivery or reward.');

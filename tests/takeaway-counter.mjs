import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(new URL('../source/public/service-state.js',import.meta.url),'utf8'),c);const api=c.CafeService,now=10000;
const table=(id,n,count)=>({id,mode:'table',table:n,items:Array.from({length:count},()=>({recipe:0}))});
const board={admitted:6,tickets:[table('two',1,2),table('three',2,3)]},state={attracted:2,progression:{capacity:99},serviceOrders:{}};
const pack={id:'package',mode:'takeaway',table:null,enteredAt:now,items:[{recipe:0}]};board.tickets.push(pack);
function check(active,ready,time=now+2200){const v=api.view(board,state,time);assert.equal(v.seated,5);assert.equal(v.occupiedTables,2);assert.equal(v.waiting,0);assert.equal(v.takeawayOrders.active,active);assert.equal(v.takeawayOrders.ready,ready);assert.equal(v.takeawayOrders.waiting+v.takeawayOrders.preparing+v.takeawayOrders.ready,active);assert.equal(v.takeawayOrders.capacity,undefined);return v;}
assert.equal(check(1,0).takeawayOrders.waiting,1);assert.equal(check(1,0,now).arriving,1);assert.deepEqual(Array.from(api.destination(pack,[[705,375],[1015,450],[420,520]])),[1050,350]);
pack.items[0].preparation='p';pack.items[0].readyAt=now+5000;assert.equal(check(1,0).takeawayOrders.preparing,1);check(1,1,now+5000);
for(const status of ['served','left','cancelled','canceled']){state.serviceOrders.package={status};check(0,0,now+5000);}
state.serviceOrders={};board.tickets=board.tickets.filter(t=>t!==pack);check(0,0);const restored=JSON.parse(JSON.stringify(board));assert.equal(api.view(restored,state,now).seated,5);
console.log('PASS takeaway counters: 2/4 + 3/4 + empty = 5/12 seats, 2/3 tables; waiting/preparing/ready/served/cancelled, ready included in active, product capacity excluded, dedicated counter route and restart.');

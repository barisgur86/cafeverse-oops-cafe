import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',import.meta.url),'utf8'));let now=1000000;const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const engineContext={CafeTestCatalog:catalog,__CAFE_TEST_NODE__:true,structuredClone};vm.createContext(engineContext);vm.runInContext(fs.readFileSync(new URL('../offline-runtime.js',import.meta.url),'utf8'),engineContext);const engine=engineContext.CafeOfflineFactory(storage,()=>now);
const intervals=[];const board={admitted:0,tickets:[]},buttons=['action','call','grow','menu','decor','outfit'].map(act=>({dataset:{act}})),selectors=[{dataset:{select:'1'}},{dataset:{select:'takeaway'}}],frames=[];
const dummy=()=>({attributes:{},setAttribute(k,v){this.attributes[k]=v},hasAttribute(k){return k in this.attributes},classList:{toggle(){}},style:{},querySelector(){return null}});const element=dummy();Object.defineProperty(element,'innerHTML',{get(){return this.html||''},set(v){this.html=v;frames.push(v);for(const key of nodes.keys())if(key.startsWith('[data-person'))nodes.delete(key);for(const m of v.matchAll(/<g data-person="([^"]+)"([^>]+)>/g)){const person=dummy();if(m[2].includes('data-world-person'))person.attributes['data-world-person']='true';nodes.set('[data-person="'+m[1]+'"]',person)}}});element.querySelectorAll=s=>s==='[data-act]'?buttons:s==='[data-select]'?selectors:[];const nodes=new Map();element.querySelector=s=>{if(s.startsWith('[data-person'))return nodes.get(s)||null;if(!nodes.has(s))nodes.set(s,dummy());return nodes.get(s)};
const ctx={renderDoor(){},waveDoor(){},clearTimeout(){},document:{createElement:()=>element,body:{append(){},classList:{toggle(){}}},querySelectorAll:()=>[]},matchMedia:()=>({matches:false}),Date:class extends Date{static now(){return now}},setTimeout:f=>{queueMicrotask(f)},setInterval(f){intervals.push(f)},crypto,state:engine.snapshot(),tab:'cafe',render(){},safe:String,recipes:catalog.FORMULAS.map((formula,i)=>({formula,icon:'🍓',name:'Recipe '+i,color:'#ed80b1'})),serviceBoard:()=>board,tableCount:()=>1,waitingCustomers:()=>Math.max(0,4+(ctx.state.attracted||0)-board.admitted),ticketReady:t=>t.items.every(i=>i.preparation&&i.readyAt<=now),availableRecipeIndices:()=>[0,7],saveBoard(){storage.setItem('board',JSON.stringify(board))},toast(){},navigateGame(){},netBusy:false,openTicketService(id,{deliver}){return deliver()}};
// Timers advance the real offline engine clock so readiness checks remain meaningful.
ctx.setTimeout=(f,ms)=>queueMicrotask(()=>{now+=ms;f()});ctx.transact=async(url,body)=>{const d=engine.handle(url,{request_id:crypto.randomUUID(),...body});if(d.status!==200)throw Error(d.error);ctx.state=d.state;return d};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/service-state.js',import.meta.url),'utf8'),ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/appearance.js',import.meta.url),'utf8'),ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/seating.js',import.meta.url),'utf8'),ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/door-balloons.js',import.meta.url),'utf8'),ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/door-balloon.js',import.meta.url),'utf8'),ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/iso-cafe.js',import.meta.url),'utf8'),ctx);
const action=()=>buttons.find(b=>b.dataset.act==='action').onclick();assert.equal(board.tickets.length,0);await action();assert.ok(frames.at(-1).includes('Misafirler yerleşiyor'));await action();assert.equal(ctx.state.served,0);now+=2200;ctx.render();assert.equal(board.tickets[0].items.length,4);assert.equal(board.admitted,4);const ids=ctx.CafeService.customers(board.tickets[0]);assert.equal(new Set(ids).size,4);for(const id of ids)assert.ok(frames.at(-1).includes('data-person="'+id+'"'));assert.ok(!frames.at(-1).includes('data-world-person="true"'),'seated customers stay attached to the table');
const preparing=action();await action();await preparing;assert.equal(board.tickets[0].items.filter(i=>i.preparation).length,4);assert.equal(ctx.state.served,0);const cost=500-ctx.state.coins;assert.ok(cost>0);assert.ok(frames.some(h=>h.includes('Makine çalışıyor')));assert.ok(frames.some(h=>h.includes('tepsiye bırakıyor')));
const serving=action();await action();await serving;assert.equal(ctx.state.served,4);assert.equal(board.tickets.length,0);intervals[0]();assert.ok(frames.at(-1).includes('data-world-person="true"'),'departing customers move above table layers');assert.equal(ctx.state.progression.xp,140);assert.equal(ctx.state.progression.level,2);const balance=ctx.state.coins;assert.equal(engine.snapshot().coins,balance);assert.ok(frames.some(h=>h.includes('Harika servis!')));assert.ok(frames.every(h=>!h.includes('<dialog')));
now+=4301;intervals[0]();assert.ok(!frames.at(-1).includes('data-person='),'Departed customer sprites must leave with table occupancy');
// Continue through the same real APIs for one takeaway order.
let b=buttons.find(b=>b.dataset.act==='call');await b.onclick();for(let pump=0;pump<3;pump++)await nodes.get('#door-call').onclick();assert.equal(ctx.state.coins,balance);assert.ok(ctx.state.attracted>0);nodes.get('#door-enter').onclick();ctx.navigateGame('cafe');selectors[1].onclick();assert.equal(ctx.CafeService.stage(board.tickets[0],now,ctx.state.serviceOrders?.[board.tickets[0].id]),'arriving');assert.ok(!frames.at(-1).includes('title="Recipe'),'two-person order stays hidden until both are seated');now+=2200;ctx.render();assert.equal(board.tickets[0].mode,'table');assert.equal(board.tickets[0].items.length,2);assert.equal((frames.at(-1).match(/data-person="[^"]+:\d"/g)||[]).length,2);now+=60001;await b.onclick();for(let pump=0;pump<3;pump++)await nodes.get('#door-call').onclick();nodes.get('#door-enter').onclick();ctx.navigateGame('cafe');selectors[1].onclick();now+=2200;ctx.render();assert.equal(board.tickets.find(t=>t.mode==='takeaway').table,null);await action();await action();assert.equal(ctx.state.served,5);assert.ok(board.tickets.filter(t=>t.mode==='takeaway').every(t=>t.items.every(i=>!i.preparation)));
console.log('PASS simulation: four guests, live machine/tray route, atomic batch, rapid double tap guard, durable rewards, no scene-changing dialog, takeaway and customer-only calls.');

// Purchasing more tables must render every table and its selector immediately.
ctx.tableCount=()=>3;ctx.navigateGame('cafe');ctx.render();
assert.ok(frames.at(-1).includes('data-scene-table="3"'));
assert.ok(frames.at(-1).includes('data-select="3"'));
ctx.tableCount=()=>4;ctx.render();
assert.ok(frames.at(-1).includes('data-scene-table="4"'));
assert.ok(frames.at(-1).includes('data-select="4"'));
console.log('PASS expanded cafe: third and fourth tables and selectors render after purchase.');

// Empty table: one call-to-action only; its primary button still opens the
// real call flow. Existing orders and takeaway retain their distinct actions.
board.tickets=[];board.departures=[];board.admitted=4+(ctx.state.attracted||0);ctx.waitingCustomers=()=>0;ctx.render=()=>{};
vm.runInContext(fs.readFileSync(new URL('../source/public/door-balloon.js',import.meta.url),'utf8'),ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/iso-cafe.js',import.meta.url),'utf8'),ctx);ctx.render();
selectors[0].onclick();
const emptyTable=frames.at(-1);
assert.equal((emptyTable.match(/data-act="action"/g)||[]).length,1);
assert.equal((emptyTable.match(/data-act="call"/g)||[]).length,0);
assert.ok(emptyTable.includes('🎈 Müşteri çağır'));
await action();
assert.ok(frames.at(-1).includes('id="door-call"'));
assert.ok(frames.at(-1).includes('id="door-enter"'));
ctx.navigateGame('cafe');ctx.render();selectors[1].onclick();
const emptyTakeaway=frames.at(-1);
assert.ok(emptyTakeaway.includes('🎈 Müşteri çağır'));
assert.equal((emptyTakeaway.match(/data-act="call"/g)||[]).length,0);
board.tickets=[{id:'regression-table',mode:'table',table:1,enteredAt:now,items:[{recipe:0,preparation:null,readyAt:0}]}];
selectors[0].onclick();assert.ok(frames.at(-1).includes('Misafirler yerleşiyor'));now+=2200;ctx.render();
assert.ok(frames.at(-1).includes('Siparişi hazırla'));
assert.equal((frames.at(-1).match(/data-act="call"/g)||[]).length,1);
console.log('PASS call-button regression: empty table has one working call action; takeaway and occupied table retain distinct controls.');

const welcome=frames.find(h=>h.includes('sim-door-success'));
assert.ok(welcome,'completed call renders a status');assert.equal((welcome.match(/class="sim-door-count"/g)||[]).length,1);
assert.ok(!welcome.includes('id="door-call"'));assert.ok(welcome.includes('id="door-enter" class="iso-primary"'));
console.log('PASS welcome UI states: one customer count, passive completion status, enter-cafe primary action.');

board.departures=[];const tableTicket={id:'pair-visible',mode:'table',table:1,enteredAt:now,items:[{recipe:0},{recipe:0}]};board.tickets=[tableTicket];ctx.render();assert.equal((frames.at(-1).match(/data-world-person="true"/g)||[]).length,2);now+=1100;intervals.at(-1)();for(const id of ctx.CafeService.customers(tableTicket)){const e=nodes.get('[data-person="'+id+'"]');assert.ok(e.attributes.transform);assert.ok(!e.attributes.transform.includes('NaN'));}now+=1100;intervals.at(-1)();assert.equal((frames.at(-1).match(/data-person="pair-visible:/g)||[]).length,2);assert.ok(!frames.at(-1).includes('data-world-person="true"'));const pack={id:'pack-route',mode:'takeaway',table:null,items:[{recipe:0}]};assert.deepEqual(Array.from(ctx.CafeService.destination(pack,[[1,2]])),[1050,350]);assert.deepEqual(Array.from(ctx.CafeService.destination(tableTicket,[[705,375]])),[705,375]);
console.log('PASS customer scene: unique identities persist while walking, seated and leaving; world-layer motion and dedicated package destination.');
assert.deepEqual(Array.from(ctx.CafeService.deliveryPoint(pack,[[705,375],[1015,450]])),[960,300]);assert.deepEqual(Array.from(ctx.CafeService.deliveryPoint(tableTicket,[[705,375]])),[575,445]);

const pairFrame=frames.at(-1);assert.ok(pairFrame.indexOf('href="/assets/sim-table.png"')<pairFrame.indexOf('data-person="pair-visible:0"'),'table artwork must not cover seated customer faces');
console.log('PASS customer layer regression: rear-seat characters render above the supplied chair artwork; DOM harness clears removed people on every paint.');

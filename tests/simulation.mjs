import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',import.meta.url),'utf8'));let now=1000000;const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const engineContext={CafeTestCatalog:catalog,__CAFE_TEST_NODE__:true,structuredClone};vm.createContext(engineContext);vm.runInContext(fs.readFileSync(new URL('../offline-runtime.js',import.meta.url),'utf8'),engineContext);const engine=engineContext.CafeOfflineFactory(storage,()=>now);
const board={admitted:0,tickets:[]},buttons=['action','call','grow','menu','decor','outfit'].map(act=>({dataset:{act}})),selectors=[{dataset:{select:'1'}},{dataset:{select:'takeaway'}}],frames=[];
const dummy=()=>({setAttribute(){},classList:{toggle(){}},style:{},querySelector(){return null}});const element=dummy();Object.defineProperty(element,'innerHTML',{get(){return this.html||''},set(v){this.html=v;frames.push(v)}});element.querySelectorAll=s=>s==='[data-act]'?buttons:s==='[data-select]'?selectors:[];element.querySelector=s=>s.startsWith('[data-person')?null:dummy();
const ctx={document:{createElement:()=>element,body:{append(){},classList:{toggle(){}}},querySelectorAll:()=>[]},matchMedia:()=>({matches:false}),Date:class extends Date{static now(){return now}},setTimeout:f=>{queueMicrotask(f)},setInterval(){},crypto,state:engine.snapshot(),tab:'cafe',render(){},safe:String,recipes:catalog.FORMULAS.map((formula,i)=>({formula,icon:'🍓',name:'Recipe '+i,color:'#ed80b1'})),serviceBoard:()=>board,tableCount:()=>1,waitingCustomers:()=>Math.max(0,4+(ctx.state.attracted||0)-board.admitted),ticketReady:t=>t.items.every(i=>i.preparation&&i.readyAt<=now),availableRecipeIndices:()=>[0,7],saveBoard(){storage.setItem('board',JSON.stringify(board))},toast(){},navigateGame(){},netBusy:false};
// Timers advance the real offline engine clock so readiness checks remain meaningful.
ctx.setTimeout=(f,ms)=>queueMicrotask(()=>{now+=ms;f()});ctx.transact=async(url,body)=>{const d=engine.handle(url,{request_id:crypto.randomUUID(),...body});if(d.status!==200)throw Error(d.error);ctx.state=d.state;return d};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/appearance.js',import.meta.url),'utf8'),ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/seating.js',import.meta.url),'utf8'),ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/iso-cafe.js',import.meta.url),'utf8'),ctx);
const action=()=>buttons.find(b=>b.dataset.act==='action').onclick();assert.equal(board.tickets[0].items.length,4);assert.equal(board.admitted,4);
const preparing=action();await action();await preparing;assert.equal(board.tickets[0].items.filter(i=>i.preparation).length,4);assert.equal(ctx.state.served,0);const cost=500-ctx.state.coins;assert.ok(cost>0);assert.ok(frames.some(h=>h.includes('Makine çalışıyor')));assert.ok(frames.some(h=>h.includes('tepsiye bırakıyor')));
const serving=action();await action();await serving;assert.equal(ctx.state.served,4);assert.equal(board.tickets.length,0);assert.equal(ctx.state.progression.xp,140);assert.equal(ctx.state.progression.level,2);const balance=ctx.state.coins;assert.equal(engine.snapshot().coins,balance);assert.ok(frames.some(h=>h.includes('Harika servis!')));assert.ok(frames.every(h=>!h.includes('<dialog')));
// Continue through the same real APIs for one takeaway order.
let b=buttons.find(b=>b.dataset.act==='call');await b.onclick();for(let i=0;i<3;i++)await b.onclick();assert.equal(ctx.state.coins,balance);assert.ok(ctx.state.attracted>0);selectors[1].onclick();await action();assert.equal(board.tickets[0].mode,'takeaway');assert.equal(board.tickets[0].items.length,1);await action();await action();assert.equal(ctx.state.served,5);assert.equal(board.tickets.length,0);
console.log('PASS simulation: four guests, live machine/tray route, atomic batch, rapid double tap guard, durable rewards, no scene-changing dialog, takeaway and customer-only calls.');

// Purchasing more tables must render every table and its selector immediately.
ctx.tableCount=()=>3;ctx.navigateGame('cafe');ctx.render();
assert.ok(frames.at(-1).includes('data-scene-table="3"'));
assert.ok(frames.at(-1).includes('data-select="3"'));
ctx.tableCount=()=>4;ctx.render();
assert.ok(frames.at(-1).includes('data-scene-table="4"'));
assert.ok(frames.at(-1).includes('data-select="4"'));
console.log('PASS expanded cafe: third and fourth tables and selectors render after purchase.');

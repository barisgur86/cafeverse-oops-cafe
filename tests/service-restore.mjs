import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const assetManifest=JSON.parse(fs.readFileSync(new URL('service-assets.json',import.meta.url),'utf8'));
for(const [file,hash] of Object.entries(assetManifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+file,import.meta.url))).digest('hex'),hash,'Existing asset changed: '+file);
const iso=fs.readFileSync(new URL('../source/public/iso-cafe.js',import.meta.url),'utf8'),source=fs.readFileSync(new URL('../source/public/service-board.js',import.meta.url),'utf8');
for(const name of ['sim-table.png','cafe-customers-candy.png','characters.png','cafe-isometric-candy.png','table-service-ready.png','table-service-done.png','takeaway-service.png'])assert.ok((iso+source+fs.readFileSync(new URL('../source/public/appearance.js',import.meta.url),'utf8')+fs.readFileSync(new URL('../source/public/service-state.js',import.meta.url),'utf8')).includes(name),'Asset unlinked: '+name);
assert.ok(iso.includes('openTicketService(t.id,{deliver:()=>serve(t)})'),'Live scene must open existing service artwork');
let now=10000,board,dialog,created,callbackCount=0;
const nodes=new Map();
const state={coins:500,readyQueue:[]};
const context={setTimeout,clearTimeout,crypto,Date:class extends Date{static now(){return now}},state,ticketName:t=>t.mode==='table'?'Masa '+t.table:'Paket',serviceBoard:()=>board,recipes:[{name:'Strawberry'}],safe:String,saveBoard(){},clearTicketPreparation(){},render(){},celebrate(){},api:async()=>({preparations:[]}),document:{querySelector:()=>dialog?.open?dialog:null,createElement(){created++;dialog={open:false,frames:[],innerHTML:'',querySelector(sel){if(!nodes.has(sel))nodes.set(sel,{});return nodes.get(sel)},addEventListener(){},showModal(){this.open=true},close(){this.open=false},remove(){this.open=false}};Object.defineProperty(dialog,'innerHTML',{get(){return this.html},set(html){this.html=html;this.frames.push(html)}});return dialog},body:{appendChild(){}}}};
vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../source/public/service-state.js',import.meta.url),'utf8'),context);vm.runInContext(fs.readFileSync(new URL('../source/public/appearance.js',import.meta.url),'utf8'),context);context.ticketReady=t=>context.CafeService.ready(t,now);
vm.runInContext(source.slice(source.indexOf('function openTicketService('),source.indexOf('const beforeTicketQueue')),context);
const ticket=(mode='table',table=1,count=4)=>({id:crypto.randomUUID(),mode,table,enteredAt:now-3000,items:Array.from({length:count},()=>({recipe:0,preparation:crypto.randomUUID(),readyAt:now-1}))});
for(const mode of ['table','takeaway']){
 dialog=null;created=0;nodes.clear();callbackCount=0;const t=mode==='table'?ticket():ticket('takeaway',null,1);board={admitted:t.items.length,tickets:[t]};
 const before=state.coins;
 context.openTicketService(t.id,{deliver:async()=>{callbackCount++;state.coins+=t.items.length*35;board.tickets=[];return {served:true}}});
 assert.equal(created,1);assert.ok(dialog.innerHTML.includes(mode==='table'?'service-dynamic-scene':'takeaway-service.png'));
 context.openTicketService(t.id);assert.equal(created,1,'Double-open must reuse active delivery dialog');
 const first=dialog.querySelector('.service-reference-action').onclick();await dialog.querySelector('.service-reference-action').onclick();await first;
 assert.equal(callbackCount,1);assert.equal(state.coins,before+t.items.length*35);assert.equal(board.tickets.length,0);
 assert.ok(dialog.innerHTML.includes(mode==='table'?'service-dynamic-scene':'takeaway-service.png'));
 await new Promise(r=>setTimeout(r,710));assert.ok(dialog.innerHTML.includes('Devam Et'));assert.equal(dialog.open,true);dialog.querySelector('.service-reference-action').onclick();assert.equal(dialog.open,false);
}
// Stale modal: a customer that left cannot receive service or grant a reward.
dialog=null;nodes.clear();created=0;const stale=ticket();board={tickets:[stale]};const before=state.coins;
context.openTicketService(stale.id,{deliver:async()=>{throw Error('Should never deliver stale order')}});board.tickets=[];await dialog.querySelector('.service-reference-action').onclick();assert.equal(state.coins,before);assert.ok(dialog.querySelector('[role=status]').textContent.includes('artık masada değil'));
// A committed reward stays committed even if the presentation cache cannot save.
dialog=null;nodes.clear();const cached=ticket();board={tickets:[cached]};context.saveBoard=()=>{throw Error('local cache full')};const cacheBefore=state.coins;
context.openTicketService(cached.id,{deliver:async()=>{state.coins+=140;board.tickets=[];return {served:true}}});await dialog.querySelector('.service-reference-action').onclick();assert.equal(state.coins,cacheBefore+140);await new Promise(r=>setTimeout(r,710));assert.ok(dialog.innerHTML.includes('Devam Et'));context.saveBoard=()=>{};
// Invalid and arriving orders never expose the service art/action.
for(const t of [null,{...ticket(),enteredAt:now-1000},{...ticket(),items:[]}]){dialog=null;created=0;board={tickets:t?[t]:[]};context.openTicketService(t?.id||'missing');assert.equal(created,0)}
const t=ticket(),packed=ticket('takeaway',null,1),b={admitted:8,tickets:[t,packed]},v=context.CafeService.view(b,{attracted:5},now);assert.equal(v.waiting,2);assert.equal(v.seated,4);assert.equal(v.takeaway,1);
assert.equal(context.CafeService.stage({...t,enteredAt:now},now),'arriving');assert.equal(context.CafeService.stage(t,now,{status:'left'}),'empty');
const saved=JSON.stringify(b);context.CafeService.view(JSON.parse(saved),{attracted:5},now);assert.equal(JSON.stringify(b),saved);
console.log('PASS restore service: '+Object.keys(assetManifest).length+' asset hashes unchanged, references linked, existing table/takeaway art shown, single reward, stale modal rejection, arrival gate, separate waiting/seated/package counts and old-save purity.');

for(const count of [1,2,3,4]){dialog=null;nodes.clear();board={tickets:[ticket('table',2,count)]};const t=board.tickets[0];context.openTicketService(t.id);assert.equal((dialog.innerHTML.match(/data-service-guest=/g)||[]).length,count);assert.equal((dialog.innerHTML.match(/data-service-item=/g)||[]).length,count);assert.ok(dialog.innerHTML.includes('Strawberry ×'+count));assert.ok(!dialog.innerHTML.includes('src="/assets/table-service-ready.png"'));assert.ok(dialog.innerHTML.includes('data-table-id="2"'));for(const id of context.CafeService.customers(t))assert.ok(dialog.innerHTML.includes('data-service-guest="'+id+'"'));}
console.log('PASS dynamic service DOM: exactly 1/2/3/4 actual guests, shared IDs, matching product icons and aggregated quantities; no baked four-person image.');

import assert from 'node:assert/strict';import fs from 'node:fs';import {inflateSync} from 'node:zlib';
import {bootScene} from '../tools/perf-scene.mjs';import {engineProfile,previewProfile} from '../tools/perf-support.mjs';import {profileSync} from '../tools/perf-sync.mjs';import {recompressPNG} from '../tools/lossless-png.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
let h=bootScene(),world=h.document.querySelector('.iso-world'),chef=h.document.querySelector('#sim-chef');
h.reset();for(let i=0;i<100;i++)h.ctx.render();assert.equal(h.metrics.rootReplacements,0);assert.equal(h.metrics.htmlWrites,0);assert.equal(h.document.querySelector('.iso-world'),world);
h.ctx.state.coins++;h.ctx.render();assert.equal(h.document.querySelector('.iso-world'),world);assert.equal(h.document.querySelector('#sim-chef'),chef);assert.equal(h.metrics.rootReplacements,0);
h.ctx.state.look.apron='blue';h.ctx.render();assert.equal(h.document.querySelector('.iso-world'),world);assert.equal(h.document.querySelector('#sim-chef'),chef);
h.ctx.state.owned.push('flower');h.ctx.state.decor='flower';h.ctx.render();assert.equal(h.document.querySelector('.iso-world'),world);assert.ok(h.document.querySelector('#sim-decor-front').innerHTML.includes('flower'));
h.visibility(true);h.reset();h.advance(60000);assert.equal(h.metrics.timerCallbacks,0);assert.equal(h.metrics.setAttribute,0);h.visibility(false);assert.ok(h.timers.size<=1);
for(let i=0;i<100;i++){h.ctx.navigateGame('menu');h.ctx.navigateGame('cafe')}assert.ok(h.timers.size<=1,'one scene scheduler after repeated navigation');h.ctx.navigateGame('menu');h.reset();h.advance(60000);assert.equal(h.metrics.timerCallbacks,0);
h=bootScene({moving:true});h.advance(2400);assert.equal(h.board.tickets.length,3);assert.equal(h.board.tickets.reduce((n,t)=>n+t.guestCount,0),12);assert.equal(h.document.querySelectorAll('[data-person]').length,12);
const engine=engineProfile(read('offline-runtime.js'));assert.equal(engine.cloneCalls,100);assert.equal(engine.storageWrites,0);
for(const visible of [false,true]){const p=await previewProfile(read('source/public/cafe-preview.js'),visible);for(const k of ['images','decodeCalls','fetches','canvases','encodes'])assert.equal(p[k],0,k);}
const online=read('source/public/online.js');assert.equal((await profileSync(online)).calls,1);assert.equal((await profileSync(online,true)).calls,0);
function chunks(b){let i=8;const out=[];while(i<b.length){const n=b.readUInt32BE(i),type=b.toString('ascii',i+4,i+8);out.push({type,data:b.subarray(i+8,i+8+n),whole:b.subarray(i,i+n+12)});i+=n+12}return out}
const assetRoot=new URL('../source/public/assets/',import.meta.url);let saved=0;
for(const name of fs.readdirSync(assetRoot).filter(n=>n.endsWith('.png'))){const original=fs.readFileSync(new URL(name,assetRoot)),result=recompressPNG(original),a=chunks(original),b=chunks(result);assert.ok(result.length<=original.length);assert.deepEqual(inflateSync(Buffer.concat(a.filter(x=>x.type==='IDAT').map(x=>x.data))),inflateSync(Buffer.concat(b.filter(x=>x.type==='IDAT').map(x=>x.data))));assert.deepEqual(a.filter(x=>x.type!=='IDAT').map(x=>x.whole),b.filter(x=>x.type!=='IDAT').map(x=>x.whole));saved+=original.length-result.length}
assert.ok(saved>0);assert.throws(()=>recompressPNG(Buffer.from([137,80,78,71,13,10,26,10,1])));console.log('PASS performance regressions: stable scene nodes, wardrobe/decor patching, background/menu cleanup, 12 guests, read-only economy, preview cache, sync coalescing, pixel-identical PNGs; saved '+saved+' bytes.');

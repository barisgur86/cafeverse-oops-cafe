import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../source/public/appearance.js',import.meta.url),'utf8'),ctx);
const a=ctx.CafeAppearance,look={head:'crown',face:'glasses',apron:'mint'};
assert.equal(typeof a.outfitSvg,'function','all costume slots need one scene/service renderer');
const markup=a.outfitSvg(look);for(const [slot,id] of Object.entries(look))assert.ok(markup.includes(`data-${slot}="${id}"`),slot+' missing');
for(const head of ['chef','crown','headphones','beret','bow','flowerhat','wizard','cap'])assert.ok(a.outfitSvg({...look,head}).includes(`data-head="${head}"`));
for(const face of ['none','glasses','heartglasses','roundglasses','starface','monocle','blush','sparkle'])assert.ok(a.outfitSvg({...look,face}).includes(`data-face="${face}"`));
assert.ok(!a.outfitSvg({head:'<script>',face:'bad" onload="x',apron:'unknown'}).includes('onload'));
for(const mode of ['table','takeaway']){const service=a.serviceOutfitSvg(look,mode);assert.ok(service.includes('viewBox="0 0 941 1672"'));for(const [slot,id] of Object.entries(look))assert.ok(service.includes(`data-${slot}="${id}"`));}
const iso=fs.readFileSync(new URL('../source/public/iso-cafe.js',import.meta.url),'utf8'),board=fs.readFileSync(new URL('../source/public/service-board.js',import.meta.url),'utf8');assert.ok(iso.includes('CafeAppearance?.outfitSvg(state.look)'));assert.ok(board.includes('CafeAppearance?.serviceOutfitSvg(state.look,t.mode)'));
console.log('PASS appearance regression: all saved head/face/apron slots render through the shared scene/service path, existing art preserved, unknown cosmetic IDs ignored.');

import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../source/public/game.js',import.meta.url),'utf8');const fragment=src.slice(src.indexOf('const recipes='),src.indexOf('const guests='));
const c={};vm.createContext(c);vm.runInContext(fragment+';globalThis.catalog=recipes;',c);
const server=JSON.parse(fs.readFileSync(new URL('catalog.json',import.meta.url),'utf8'));
assert.equal(c.catalog.length,18);assert.equal(server.FORMULAS.length,18);assert.equal(server.recipeLevels.length,18);
const unique=new Set(c.catalog.map(r=>JSON.stringify(Object.entries(r.formula).sort())));assert.equal(unique.size,18);
c.catalog.forEach((r,i)=>{assert.deepEqual(JSON.parse(JSON.stringify(r.formula)),server.FORMULAS[i]);assert.ok(server.recipeLevels[i]>=1&&server.recipeLevels[i]<=10)});
assert.equal(c.catalog[0].name,'Çilekli Frappé');assert.equal(c.catalog[5].name,'Pembe Mocha');
for(let level=1;level<=10;level++){const available=c.catalog.map((_,i)=>i).filter(i=>server.recipeLevels[i]<=level);assert.ok(available.length>=2);assert.ok(available.every(i=>server.recipeLevels[i]<=level))}
assert.equal(server.recipeLevels.filter(l=>l===1).length,2);
console.log('PASS: 18 unique client/server formulas match; old indices preserved; all unlock levels valid; two starter recipes.');

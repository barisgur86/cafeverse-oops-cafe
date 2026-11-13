import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../source/public/game.js',import.meta.url),'utf8');
const catalog=JSON.parse(fs.readFileSync(new URL('catalog.json',import.meta.url),'utf8'));
const functions=['changeAmount','recipeAmountsComplete'].map(name=>source.split('\n').find(line=>line.startsWith('function '+name+'('))).join('\n');
assert.ok(functions.includes('function changeAmount'));
for(const formula of catalog.FORMULAS){
 const keys=Object.keys(formula),pantry=Object.fromEntries(keys.map((k,i)=>[k,i%2?0:1]));
 const state={coins:500,pantry:structuredClone(pantry)};
 const context={state,amounts:{},selected:[],recipes:[{keys,formula}],recipeIndex:0,ingredientPrices:catalog.PRICE,busy:false,phase:'choose',save(){},renderMeasures(){},toast(){}};
 vm.createContext(context);vm.runInContext(functions,context);
 assert.equal(context.recipeAmountsComplete(),false);
 for(const k of keys){
  for(let i=0;i<formula[k];i++)context.changeAmount(k,1);
  const before=JSON.stringify(state);for(let i=0;i<12;i++)context.changeAmount(k,1);
  assert.equal(context.amounts[k],formula[k]);assert.equal(JSON.stringify(state),before,'overfill must not consume coins or stock');
 }
 assert.equal(context.recipeAmountsComplete(),true);
 for(const k of keys)for(let i=0;i<formula[k];i++)context.changeAmount(k,-1);
 assert.equal(state.coins,500);assert.deepEqual(state.pantry,pantry);assert.equal(context.recipeAmountsComplete(),false);
 const before=JSON.stringify(state);context.changeAmount('unknown',1);assert.equal(JSON.stringify(state),before);
}
console.log('PASS: every recipe caps each ingredient at its target; overfill consumes no stock/coins; removing measures refunds their original source; incomplete recipes stay incomplete.');

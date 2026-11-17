import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {upgrades,recipeLevels} from '../progression.mjs';
import {weeklyItems,weeklyOutfits,weeklyDecor} from '../collections.mjs';
import {coinPacks} from '../coin-shop.mjs';
const api=fs.readFileSync(new URL('../game-api.mjs',import.meta.url),'utf8');
const literal=name=>new Function('return ('+api.match(new RegExp('const '+name+'=(.*?);'))[1]+')')();
export const catalog={ITEMS:literal('ITEMS'),PRICE:literal('PRICE'),FORMULAS:literal('FORMULAS'),NPC:literal('NPC'),outfits:{...literal('catalog'),...weeklyOutfits},decor:{...literal('prices'),...weeklyDecor},weekly:weeklyItems,upgrades,recipeLevels,coinPacks};
const runtime=fs.readFileSync(new URL('../../../offline-runtime.js',import.meta.url),'utf8');
export function gameEngine(userID,save,clock=Date.now){
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 const context={__CAFE_TEST_NODE__:true,CafeAccountID:userID,CafeTestCatalog:catalog,structuredClone,crypto,Date};
 vm.createContext(context);vm.runInContext(runtime,context);
 const engine=context.CafeOfflineFactory(storage,clock);
 if(save)engine.importSave(save);
 return engine;
}

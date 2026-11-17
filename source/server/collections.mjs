// Weekly sets open Mondays at 00:00 Europe/Istanbul. IDs never change.
export const weeklySets=[
 {id:'cloud-week',name:'Bulut Bahçesi',en:'Cloud Garden',release:Date.parse('2026-11-16T00:00:00+03:00'),rarity:'Nadir',color:'#91dfdf',items:[{id:'cloudapron',kind:'outfit',slot:'apron',name:'Bulut bahçesi önlüğü',en:'Cloud Garden Apron',icon:'☁️',cost:160},{id:'cloudlamp',kind:'decor',name:'Bulut gece lambası',en:'Cloud Night Lamp',icon:'☁️',cost:140}]},
 {id:'moon-week',name:'Ay Işığı',en:'Moonlight',release:Date.parse('2026-11-23T00:00:00+03:00'),rarity:'Epik',color:'#a79be9',items:[{id:'moonapron',kind:'outfit',slot:'apron',name:'Ay ışığı önlüğü',en:'Moonlight Apron',icon:'🌙',cost:190},{id:'moonclock',kind:'decor',name:'Ay saati',en:'Moon Clock',icon:'🌙',cost:170}]},
 {id:'rose-week',name:'Gül Sarayı',en:'Rose Palace',release:Date.parse('2026-11-30T00:00:00+03:00'),rarity:'Epik',color:'#f09cc8',items:[{id:'roseapron',kind:'outfit',slot:'apron',name:'Gül sarayı önlüğü',en:'Rose Palace Apron',icon:'🌹',cost:210},{id:'rosefountain',kind:'decor',name:'Gül çeşmesi',en:'Rose Fountain',icon:'🌹',cost:190}]},
 {id:'royal-week',name:'Altın Festival',en:'Golden Festival',release:Date.parse('2026-12-07T00:00:00+03:00'),rarity:'Efsanevi',color:'#efcb6b',items:[{id:'royalapron',kind:'outfit',slot:'apron',name:'Altın festival önlüğü',en:'Golden Festival Apron',icon:'👑',cost:240},{id:'royalstand',kind:'decor',name:'Altın tatlı standı',en:'Golden Dessert Stand',icon:'👑',cost:220}]}
];
export const weeklyItems=weeklySets.flatMap(s=>s.items.map(i=>({...i,set:s.id,release:s.release,color:s.color,rarity:s.rarity})));
export const weeklyOutfits=Object.fromEntries(weeklyItems.filter(i=>i.kind==='outfit').map(i=>[i.id,[i.cost,i.slot]]));
export const weeklyDecor=Object.fromEntries(weeklyItems.filter(i=>i.kind==='decor').map(i=>[i.id,i.cost]));
export function weeklyAvailable(id,now,owned=[]){const item=weeklyItems.find(i=>i.id===id);return !item||owned.includes(id)||now>=item.release}

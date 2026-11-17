export const recipeLevels=[1,2,3,4,5,6,2,1,2,3,4,3,2,4,6,5,7,8];
export const upgrades=[
 {id:'table2',name:'İkinci masa',level:2,cost:250,capacity:1},
 {id:'espresso2',name:'Espresso makinesi II',level:3,cost:400,speed:.15},
 {id:'blender2',name:'Blender II',level:4,cost:450,speed:.15},
 {id:'table3',name:'Üçüncü masa',level:6,cost:650,capacity:1},
 {id:'counter',name:'Geniş servis tezgâhı',level:7,cost:800,capacity:1},
 {id:'table4',name:'Dördüncü masa',level:9,cost:900,capacity:1},
 {id:'expansion',name:'Kafe genişletme',level:10,cost:1500,capacity:2}
];
export function progress(served,bought=[]){const xp=served*35,level=Math.min(10,1+Math.floor(xp/105));return {xp,level,nextXP:level===10?null:level*105,levelStart:(level-1)*105,upgrades:bought,capacity:1+upgrades.filter(u=>bought.includes(u.id)).reduce((n,u)=>n+(u.capacity||0),0),catalog:upgrades,recipeLevels}}
export function prepareSeconds(recipe,bought){return 5*(bought.includes([2,5,6,8,10,14,17].includes(recipe)?'espresso2':'blender2')?.85:1)}

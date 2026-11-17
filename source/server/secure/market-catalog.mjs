// Initial market eligibility is limited to stackable pantry ingredients.
export const marketCatalog=Object.freeze({
 milk:{tr:'Süt',en:'Milk',icon:'🥛',category:'dairy',rarity:'common'},
 coffee:{tr:'Kahve',en:'Coffee',icon:'☕',category:'base',rarity:'common'},
 berry:{tr:'Çilek',en:'Strawberry',icon:'🍓',category:'fruit',rarity:'common'},
 ice:{tr:'Buz',en:'Ice',icon:'🧊',category:'base',rarity:'common'},
 vanilla:{tr:'Vanilya',en:'Vanilla',icon:'🌼',category:'topping',rarity:'rare'},
 cream:{tr:'Krema',en:'Cream',icon:'🍦',category:'dairy',rarity:'common'},
 cocoa:{tr:'Kakao',en:'Cocoa',icon:'🍫',category:'topping',rarity:'rare'},
 star:{tr:'Yıldız şekeri',en:'Star candy',icon:'⭐',category:'topping',rarity:'legendary'},
 syrup:{tr:'Şurup',en:'Syrup',icon:'🍯',category:'topping',rarity:'rare'}
});
export const commission=price=>Math.ceil(price/20);

/* Shared cosmetic rendering. Stable IDs match the saved wardrobe and decor catalog. */
(() => {
 const aprons={
  pink:{color:'#f7c1d8',icon:'☕'},mint:{color:'#a1e9ce',icon:'☕'},blue:{color:'#9fd4fa',icon:'☕'},galaxy:{color:'#ad86d0',icon:'✦'},lemon:{color:'#ffe68b',icon:'🍋'},berryapron:{color:'#f7a5be',icon:'🍓'},cocoaapron:{color:'#b87e5c',icon:'🍫'},rainbowapron:{color:'#e6accf',icon:'🌈'},
  cloudapron:{color:'#94deec',icon:'☁️'},moonapron:{color:'#a79be9',icon:'🌙'},roseapron:{color:'#ed82b7',icon:'🌹'},royalapron:{color:'#b76bc0',icon:'👑'}
 };
 const decorIds=['plant','flower','cat','mushroom','piranha','pineapple','sadcupcake','cherryjelly','bluechick','cloudlamp','moonclock','rosefountain','royalstand','cafesign'];
 const locations={plant:{x:105,y:425,w:124,h:138,zone:'floor',layer:'back'},flower:{x:705,y:345,w:44,h:60,zone:'table',layer:'front'},cat:{x:835,y:195,w:110,h:125,zone:'sill',layer:'back'},mushroom:{x:1155,y:320,w:112,h:126,zone:'floor',layer:'back'},piranha:{x:100,y:535,w:114,h:126,zone:'floor',layer:'back'},pineapple:{x:980,y:170,w:104,h:118,zone:'counter',layer:'back'},sadcupcake:{x:350,y:240,w:112,h:124,zone:'counter',layer:'back'},cherryjelly:{x:1160,y:405,w:112,h:124,zone:'floor',layer:'back'},bluechick:{x:1115,y:600,w:112,h:124,zone:'floor',layer:'back'},cloudlamp:{x:305,y:175,w:126,h:126,zone:'wall',layer:'back'},moonclock:{x:815,y:135,w:132,h:132,zone:'wall',layer:'back'},rosefountain:{x:1175,y:620,w:132,h:140,zone:'floor',layer:'back'},royalstand:{x:430,y:635,w:132,h:120,zone:'floor',layer:'back'},cafesign:{zone:'exterior'}};
 function ownedDecor(state,{previewId}={}){const owned=new Set(state.owned||[]),placed=new Set(state.placedDecor||state.owned||[]);return decorIds.filter(id=>owned.has(id)&&placed.has(id)||id===previewId);}
 function decorSvg(state,{layer,previewId}={}){return ownedDecor(state,{previewId}).filter(id=>locations[id].zone!=='exterior'&&(!layer||locations[id].layer===layer)).map(id=>{const {x,y,w,h}=locations[id],highlight=globalThis.CafeDecorHighlight?.id===id&&globalThis.CafeDecorHighlight.until>Date.now();return `<g class="sim-owned-decor ${highlight?'decor-new':''} ${previewId===id?'decor-ghost':''}" data-decor="${id}" data-zone="${locations[id].zone}" transform="translate(${x} ${y})" pointer-events="none"><ellipse class="decor-halo" cy="${h*.36}" rx="${w*.55}" ry="${w*.16}" fill="#ffde8b99"/><image href="/assets/decor-${id}.svg" x="${-w/2}" y="${-h*.65}" width="${w}" height="${h}"/></g>`}).join('');}
 function exteriorDecorHtml(state,{previewId}={}){return ownedDecor(state,{previewId}).includes('cafesign')?`<img class="cafe-exterior-sign ${previewId==='cafesign'?'decor-ghost':''} ${globalThis.CafeDecorHighlight?.id==='cafesign'?'decor-new':''}" data-decor="cafesign" src="/assets/decor-cafesign.svg" alt="Caféverse"/>`:'';}
 function apronSvg(look){const id=look?.apron,a=aprons[id];if(!a||id==='pink')return '';return `<g class="sim-apron" data-apron="${id}" pointer-events="none"><path d="M-26-55Q8-47 42-56L40-22Q9-6-28-25Z" fill="${a.color}" stroke="#fff1df" stroke-width="2"/><path d="M-22-50Q9-43 37-51" fill="none" stroke="#ffffff88" stroke-width="3"/><text x="7" y="-27" font-size="20" text-anchor="middle">${a.icon}</text></g>`;}
 const heads={chef:'',crown:'👑',headphones:'🎧',beret:'',bow:'🎀',flowerhat:'🌸',wizard:'🎩',cap:'🧢'};
 const faces={none:'',glasses:'🕶️',heartglasses:'💗',roundglasses:'👓',starface:'⭐',monocle:'🧐',blush:'🌷',sparkle:'✨'};
 function outfitSvg(look={}){
  const head=Object.hasOwn(heads,look?.head)?look.head:'chef',face=Object.hasOwn(faces,look?.face)?look.face:'none',apron=Object.hasOwn(aprons,look?.apron)?look.apron:'pink';
  const hat=head==='beret'?'<path d="M-35-128Q-42-158 6-155Q40-156 37-133Z" fill="#ad86d0" stroke="#814b9f" stroke-width="3"/><path d="M3-155v-7" stroke="#814b9f" stroke-width="5"/>':heads[head]?`<text x="0" y="-126" text-anchor="middle" font-size="43">${heads[head]}</text>`:'';
  const accessory=faces[face]?`<text x="0" y="-74" text-anchor="middle" font-size="38">${faces[face]}</text>`:'';
  return `<g class="sim-outfit" data-head="${head}" data-face="${face}" data-apron="${apron}" pointer-events="none">${apronSvg({apron})}${accessory}${hat}</g>`;
 }
 function serviceOutfitSvg(look,mode){
  // Existing service illustrations remain intact. Their chef gets the same
  // account-owned cosmetic overlays as the moving café sprite.
  const transform=mode==='takeaway'?'translate(235 1055) scale(2.75)':'translate(110 1090) scale(1.6)';
  return `<svg class="service-reference-outfit" viewBox="0 0 941 1672" aria-hidden="true" focusable="false"><g transform="${transform}">${outfitSvg(look)}</g></svg>`;
 }
 globalThis.CafeAppearance=Object.freeze({aprons:Object.freeze(aprons),ownedDecor,decorSvg,exteriorDecorHtml,locations,apronSvg,outfitSvg,serviceOutfitSvg});
})();

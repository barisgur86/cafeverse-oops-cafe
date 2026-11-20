/* Shared cosmetic rendering. Stable IDs match the saved wardrobe and decor catalog. */
(() => {
 const aprons={
  pink:{color:'#f7c1d8',icon:'☕'},mint:{color:'#a1e9ce',icon:'☕'},blue:{color:'#9fd4fa',icon:'☕'},galaxy:{color:'#ad86d0',icon:'✦'},lemon:{color:'#ffe68b',icon:'🍋'},berryapron:{color:'#f7a5be',icon:'🍓'},cocoaapron:{color:'#b87e5c',icon:'🍫'},rainbowapron:{color:'#e6accf',icon:'🌈'},
  cloudapron:{color:'#94deec',icon:'☁️'},moonapron:{color:'#a79be9',icon:'🌙'},roseapron:{color:'#ed82b7',icon:'🌹'},royalapron:{color:'#b76bc0',icon:'👑'}
 };
 const decorIds=['plant','flower','cat','mushroom','piranha','pineapple','sadcupcake','cherryjelly','bluechick','cloudlamp','moonclock','rosefountain','royalstand'];
 const anchors=[[105,425],[280,230],[835,195],[1110,300],[100,535],[970,160],[350,240],[1160,405],[1115,530],[305,340],[815,250],[1175,620],[430,635]];
 function ownedDecor(state){const owned=new Set(state.owned||[]);return decorIds.filter(id=>owned.has(id));}
 function decorSvg(state){return ownedDecor(state).map(id=>{const [x,y]=anchors[decorIds.indexOf(id)];return `<g class="sim-owned-decor" data-decor="${id}" transform="translate(${x} ${y})"><ellipse cy="48" rx="41" ry="10" fill="#78275d22"/><image href="/assets/decor-${id}.svg" x="-48" y="-45" width="96" height="96"/></g>`}).join('');}
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
  const transform=mode==='takeaway'?'translate(235 1055) scale(2.75)':'translate(235 1040) scale(2.35)';
  return `<svg class="service-reference-outfit" viewBox="0 0 941 1672" aria-hidden="true" focusable="false"><g transform="${transform}">${outfitSvg(look)}</g></svg>`;
 }
 globalThis.CafeAppearance=Object.freeze({aprons:Object.freeze(aprons),ownedDecor,decorSvg,apronSvg,outfitSvg,serviceOutfitSvg});
})();

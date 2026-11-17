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
 globalThis.CafeAppearance=Object.freeze({aprons:Object.freeze(aprons),ownedDecor,decorSvg,apronSvg});
})();

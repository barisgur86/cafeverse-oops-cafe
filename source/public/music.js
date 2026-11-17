/* Bundled café theme. Playback starts only after a player gesture. */
(() => {
 const audio=new Audio('/assets/audio/cafe-verse.m4a');
 audio.loop=true;audio.volume=.3;audio.preload='none';
 let enabled=localStorage.getItem('cafeverse.music')!=='off',unlocked=false;
 const label=()=>globalThis.CafeI18n?.language==='en'?(enabled?'Music on':'Music off'):(enabled?'Müzik açık':'Müzik kapalı');
 const button=document.createElement('button');button.className='secondary';button.id='cafe-music';button.style.minHeight='44px';
 function update(){button.textContent=(enabled?'🎵 ':'🔇 ')+label();button.setAttribute('aria-pressed',String(enabled));}
 function play(){if(enabled&&unlocked&&!document.hidden)audio.play().catch(()=>{});}
 button.onclick=()=>{enabled=!enabled;localStorage.setItem('cafeverse.music',enabled?'on':'off');unlocked=true;if(enabled)play();else audio.pause();update();};
 document.querySelector('#app-menu')?.appendChild(button);update();
 document.addEventListener('pointerdown',()=>{unlocked=true;play()},{passive:true});
 document.addEventListener('keydown',()=>{unlocked=true;play()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();else play();});
 globalThis.addEventListener('pagehide',()=>audio.pause());
 globalThis.addEventListener('cafeverse-language',update);
 globalThis.CafeMusic={get enabled(){return enabled}};
})();

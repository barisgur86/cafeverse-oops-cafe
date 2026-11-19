/* Native AVAudioPlayer on iOS; Web Audio gains in browsers. Never changes OS volume. */
(() => {
 const defaults={master:.7,music:.35,effects:.5,muted:false},key='cafeverse.audio.v1';
 const clamp=(v,f)=>Number.isFinite(Number(v))?Math.max(0,Math.min(1,Number(v))):f;
 let raw;try{raw=JSON.parse(localStorage.getItem(key)||'null');}catch{}
 let settings={master:clamp(raw?.master,defaults.master),music:clamp(raw?.music,localStorage.getItem('cafeverse.music')==='off'?0:defaults.music),effects:clamp(raw?.effects,localStorage.getItem('cafeverse.callSound')==='off'?0:defaults.effects),muted:raw?.muted===true};
 const native=globalThis.webkit?.messageHandlers?.cafeAudio;
 let unlocked=false,context,element,source,musicGain,effectsGain,masterGain,compressor,voices=[],revision=0;
 const listeners=new Set();
 const gain=type=>settings.muted?0:settings.master*settings[type];
 function send(body){try{return Promise.resolve(native?.postMessage(body)).catch(()=>null);}catch{return Promise.resolve(null);}}
 function graph(){if(context)return;const AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AudioContext)return;
  context=new AudioContext();masterGain=context.createGain();musicGain=context.createGain();effectsGain=context.createGain();compressor=context.createDynamicsCompressor();compressor.threshold.value=-12;compressor.ratio.value=8;
  musicGain.connect(masterGain);effectsGain.connect(masterGain);masterGain.connect(compressor);compressor.connect(context.destination);
  element=new Audio('/assets/audio/cafe-verse.m4a');element.loop=true;element.preload='none';source=context.createMediaElementSource(element);source.connect(musicGain);apply(false);
 }
 function apply(persist=true,notifyNative=true){if(persist){localStorage.setItem(key,JSON.stringify(settings));revision++;}if(native&&notifyNative)send({action:'configure',...settings});
  if(context){masterGain.gain.value=settings.muted?0:settings.master;musicGain.gain.value=settings.music;effectsGain.gain.value=settings.effects;if(gain('music')===0)element.pause();}
  globalThis.CafeCallVoice?.stop();listeners.forEach(fn=>fn({...settings}));
 }
 function play(){unlocked=true;if(native)return send({action:'play'});graph();if(context&&!document.hidden&&gain('music')>0){context.resume().catch(()=>{});element.play().catch(()=>{});}}
 function pause(){if(native)send({action:'pause'});element?.pause();voices.forEach(v=>{try{v.stop();}catch{}});voices=[];}
 function set(patch){for(const type of ['master','music','effects'])if(type in patch)settings[type]=clamp(patch[type],settings[type]);if(typeof patch.muted==='boolean')settings.muted=patch.muted;apply();if(unlocked&&!document.hidden)play();return {...settings};}
 function effect(kind){if(!unlocked||document.hidden||gain('effects')===0)return false;if(native){send({action:'effect',kind});return true;}graph();if(!context)return false;voices=voices.filter(v=>!v.finished);if(voices.length>=3)return false;const frequency=({prepare:523,coin:880,xp:659,trade:784,menu:440})[kind];if(!frequency)return false;
  context.resume().catch(()=>{});const oscillator=context.createOscillator(),envelope=context.createGain();oscillator.frequency.value=frequency;envelope.gain.setValueAtTime(.12,context.currentTime);envelope.gain.exponentialRampToValueAtTime(.001,context.currentTime+.12);oscillator.connect(envelope);envelope.connect(effectsGain);oscillator.onended=()=>{oscillator.finished=true;oscillator.disconnect();envelope.disconnect();};voices.push(oscillator);oscillator.start();oscillator.stop(context.currentTime+.14);return true;
 }
 globalThis.CafeAudio={set,effect,play,pause,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},get settings(){return {...settings};},get effectsGain(){return gain('effects');}};
 globalThis.CafeMusic={get enabled(){return gain('music')>0;}};
 const modal=document.createElement('dialog');modal.className='audio-settings';modal.setAttribute('data-no-i18n','');document.body.append(modal);
 const t=(a,b)=>globalThis.CafeI18n?.language==='en'?b:a;
 function paint(){modal.innerHTML=`<h2>${t('Ses ayarları','Audio settings')}</h2>${['master','music','effects'].map(type=>`<label>${({master:t('Ana ses','Master'),music:t('Müzik','Music'),effects:t('Efektler','Effects')})[type]} <output id="audio-value-${type}">${Math.round(settings[type]*100)}%</output><input id="audio-${type}" aria-label="${({master:t('Ana ses','Master'),music:t('Müzik','Music'),effects:t('Efektler','Effects')})[type]}" type="range" min="0" max="100" value="${Math.round(settings[type]*100)}"></label>`).join('')}<button id="audio-mute" aria-pressed="${settings.muted}">${settings.muted?t('Sesi aç','Unmute'):t('Sessize al','Mute')}</button><button id="audio-test">${t('Efekti dene','Test effect')}</button><p>${t('Bu ayarlar oyun sesini değiştirir. Telefonun ses tuşları sistem sesini değiştirir.','These settings control game audio. Your phone buttons control system volume.')}</p><button id="audio-close">${t('Kapat','Close')}</button>`;
  for(const type of ['master','music','effects'])modal.querySelector('#audio-'+type).oninput=e=>{set({[type]:Number(e.target.value)/100});modal.querySelector('#audio-value-'+type).textContent=e.target.value+'%';};
  modal.querySelector('#audio-mute').onclick=()=>{set({muted:!settings.muted});paint();};modal.querySelector('#audio-test').onclick=()=>effect('coin');modal.querySelector('#audio-close').onclick=()=>modal.close();
 }
 const button=document.createElement('button');button.className='secondary';const label=()=>button.textContent='🔊 '+t('Ses ayarları','Audio settings');label();button.onclick=()=>{play();paint();modal.showModal();};document.querySelector('#app-menu')?.append(button);
 document.addEventListener('pointerdown',()=>{if(!unlocked)play();},{passive:true});document.addEventListener('keydown',()=>{if(!unlocked)play();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else if(unlocked)play();});globalThis.addEventListener('pagehide',pause);globalThis.addEventListener('cafeverse-language',()=>{label();if(modal.open)paint();});
 if(typeof transact==='function'){const previous=transact;transact=async function(path,body){const before=state.served,level=state.progression?.level;const result=await previous(path,body);if(path==='/api/preparations')effect('prepare');if(path.includes('/serve')&&state.served>before)effect('coin');if(level&&state.progression?.level>level)effect('xp');if(path.includes('/trades/')||path==='/api/npc-trade')effect('trade');return result;};}
 document.addEventListener('click',e=>{if(e.target?.closest?.('button')&&!e.target?.closest?.('.audio-settings'))effect('menu');});
 apply(false,false);if(native){const before=revision;send({action:'get'}).then(value=>{if(revision!==before)return;if(value?.configured)set(value);else apply();});}
})();

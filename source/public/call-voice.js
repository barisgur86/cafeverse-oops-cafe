/* Call audio is opt-in by the player's button; no microphone or recording. */
(() => {
 let enabled=localStorage.getItem('cafeverse.callSound')!=='off';
 function stop(){globalThis.speechSynthesis?.cancel();globalThis.webkit?.messageHandlers?.cafeSpeak?.postMessage('stop')}
 function speak(){if((globalThis.CafeAudio?globalThis.CafeAudio.effectsGain===0:!enabled))return false;const lang=globalThis.CafeI18n?.language||'tr',native=globalThis.webkit?.messageHandlers?.cafeSpeak;if(native){native.postMessage(globalThis.CafeAudio?.commandStamp?{language:lang,...globalThis.CafeAudio.commandStamp}:lang);return true}if(!globalThis.speechSynthesis||!globalThis.SpeechSynthesisUtterance)return false;stop();const u=new SpeechSynthesisUtterance(lang==='en'?'Come, come!':'Gel, gel!');u.lang=lang==='en'?'en-US':'tr-TR';u.rate=.95;u.pitch=1.2;u.volume=globalThis.CafeAudio?.effectsGain??.5;const voice=speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith(lang));if(voice)u.voice=voice;speechSynthesis.speak(u);return true;}
 globalThis.CafeCallVoice={speak,stop,toggle(){if(globalThis.CafeAudio){globalThis.CafeAudio.toggleMute();return !globalThis.CafeAudio.settings.muted;}enabled=!enabled;localStorage.setItem('cafeverse.callSound',enabled?'on':'off');if(!enabled)stop();return enabled},get enabled(){return globalThis.CafeAudio?globalThis.CafeAudio.effectsGain>0:enabled}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});globalThis.addEventListener('cafeverse-language',stop);
})();

/* One direct, server-authoritative coin gift. No ingredient offers or acceptance. */
let coinGiftRows=[],coinGiftDraft={code:'',amount:''},coinGiftTarget=null,coinGiftBusy=false,coinGiftConfirm=false,coinGiftNotice='',coinGiftAttempt=null;
const giftError=e=>globalThis.CafeI18n?.translate?.(e.message)||e.message;
const giftText=(tr,en)=>globalThis.CafeI18n?.language==='en'?en:tr;
async function refreshCoinGifts(paint=true){
 if(!globalThis.CafeServerEnabled||globalThis.CafeFeatures?.coinGifts!==true)return;
 const d=await api('/api/coin-gifts');hydrate(d.state);coinGiftRows=d.gifts||[];const recovered=coinGiftAttempt&&coinGiftRows.find(g=>g.id===coinGiftAttempt&&g.direction==='outgoing');if(recovered){coinGiftNotice=giftText(`${recovered.amount} coin gönderildi.`,`${recovered.amount} coins sent.`);coinGiftDraft.amount='';coinGiftAttempt=null;coinGiftConfirm=false;}if(paint&&tab==='players')render();
}
renderPlayers=function(){
 const enabled=globalThis.CafeServerEnabled&&globalThis.CafeFeatures?.coinGifts===true;
 const amount=Number(coinGiftDraft.amount),available=Number(state.giftableCoins||0),valid=coinGiftTarget&&Number.isSafeInteger(amount)&&amount>0&&(amount<=available||!!coinGiftAttempt)&&amount<=1000000;
 $('left').innerHTML=`<section class="coin-gift-screen" data-no-i18n><h2>🪙 ${giftText('Coin gönder','Send coins')}</h2><div class="cafe-code"><span>${giftText('Senin kafe kodun','Your café code')}</span><strong>${safe(state.cafeCode||'…')}</strong><button class="secondary" id="gift-copy">${giftText('Kodu kopyala','Copy code')}</button></div>${enabled?`<p class="gift-balance">${giftText('Gönderebileceğin','Available to send')}: <strong>${available} coin</strong></p><p>${giftText('Bu güncellemeden sonra oyunda kazandığın coinleri gönderebilirsin. Satın alınan ve eski bakiyen harcanabilir; gönderilemez.','You can send coins earned in play after this update. Purchased and previous balances remain spendable but cannot be sent.')}</p><label for="gift-code">1. ${giftText('Arkadaşının kafe kodu','Friend’s café code')}</label><div class="find-cafe"><input id="gift-code" maxlength="10" value="${safe(coinGiftDraft.code)}" autocapitalize="characters" autocomplete="off" ${coinGiftBusy||coinGiftConfirm?'disabled':''}><button class="secondary" id="gift-find" ${coinGiftBusy||coinGiftConfirm?'disabled':''}>${giftText('Kafeyi bul','Find café')}</button></div>${coinGiftTarget?`<p class="gift-recipient">✓ ${safe(coinGiftTarget.name||coinGiftTarget.code)} · ${safe(coinGiftTarget.code)}</p>`:''}<label for="gift-amount">2. ${giftText('Coin miktarı','Coin amount')}</label><input id="gift-amount" type="number" inputmode="numeric" min="1" max="${Math.min(available,1000000)}" step="1" value="${safe(coinGiftDraft.amount)}" ${coinGiftBusy||coinGiftConfirm?'disabled':''}>${coinGiftConfirm&&valid?`<div class="gift-confirm" role="group" aria-label="${giftText('Gönderimi onayla','Confirm gift')}"><p><strong>${safe(coinGiftTarget.name||coinGiftTarget.code)}</strong> · ${safe(coinGiftTarget.code)}<br><strong>${amount} coin</strong> ${giftText('gönderilecek. Bu işlem geri alınamaz.','will be sent. This cannot be undone.')}</p><button class="primary" id="gift-confirm" ${coinGiftBusy?'disabled':''}>${coinGiftBusy?giftText('Gönderiliyor…','Sending…'):giftText('Onayla ve gönder','Confirm and send')}</button><button class="secondary" id="gift-back" ${coinGiftBusy?'disabled':''}>${giftText('Vazgeç','Cancel')}</button></div>`:`<button class="primary" id="gift-send" ${valid&&!coinGiftBusy?'':'disabled'}>3. ${giftText('Coin gönder','Send coins')}</button>`}<p role="status" aria-live="polite">${safe(coinGiftNotice)}</p><h3>${giftText('Son gönderimler','Recent gifts')}</h3><div class="gift-history">${coinGiftRows.map(g=>`<p><strong>${g.direction==='outgoing'?'−':'+'}${g.direction==='outgoing'?g.amount:g.credited_amount} coin</strong> · ${safe(g.code)}${Number(g.debt_repaid)>0&&g.direction==='incoming'?` · ${g.debt_repaid} ${giftText('coin iade mahsubu','coins refund adjustment')}`:''}</p>`).join('')||`<p>${giftText('Henüz gönderim yok.','No gifts yet.')}</p>`}</div><button class="secondary" id="gift-refresh" ${coinGiftBusy?'disabled':''}>${giftText('Yenile','Refresh')}</button>`:`<p>${giftText('Coin gönderme bu sürümde açık değil.','Coin gifts are not enabled in this build.')}</p>`}</section>`;
 $('gift-copy').onclick=()=>navigator.clipboard.writeText(state.cafeCode).then(()=>toast(giftText('Kafe kodun kopyalandı.','Café code copied.'))).catch(()=>toast(state.cafeCode));
 if(!enabled)return;
 $('gift-code').oninput=e=>{coinGiftDraft.code=e.target.value.trim().toUpperCase();coinGiftTarget=null;coinGiftConfirm=false;coinGiftAttempt=null;$('gift-send')&&($('gift-send').disabled=true)};
 $('gift-amount').oninput=e=>{coinGiftDraft.amount=e.target.value;coinGiftConfirm=false;coinGiftAttempt=null;const n=Number(e.target.value);const b=$('gift-send');if(b)b.disabled=!coinGiftTarget||!Number.isSafeInteger(n)||n<1||n>available||n>1000000};
 $('gift-find').onclick=findCoinGiftCafe;
 const send=$('gift-send');if(send)send.onclick=()=>{coinGiftConfirm=true;coinGiftNotice='';render()};
 const back=$('gift-back');if(back)back.onclick=()=>{coinGiftConfirm=false;render()};
 const confirm=$('gift-confirm');if(confirm)confirm.onclick=sendCoinGift;
 $('gift-refresh').onclick=()=>refreshCoinGifts().catch(e=>{coinGiftNotice=giftError(e);render()});
};
async function findCoinGiftCafe(){
 if(coinGiftBusy)return;const code=coinGiftDraft.code;
 if(!/^[A-F0-9]{10}$/.test(code)){coinGiftNotice=giftText('10 karakterli kafe kodunu yaz.','Enter the 10-character café code.');render();return;}
 coinGiftBusy=true;coinGiftNotice='';render();
 try{const d=await api('/api/cafes?code='+encodeURIComponent(code));if(coinGiftDraft.code===code)coinGiftTarget=d.cafe;}catch(e){coinGiftNotice=giftError(e);}finally{coinGiftBusy=false;render();}
}
async function sendCoinGift(){
 if(coinGiftBusy||!coinGiftConfirm||!coinGiftTarget)return;
 const amount=Number(coinGiftDraft.amount),code=coinGiftTarget.code;
 if(coinGiftDraft.code!==code||!Number.isSafeInteger(amount)||amount<1||(!coinGiftAttempt&&amount>Number(state.giftableCoins||0))||amount>1000000)return;
 coinGiftBusy=true;coinGiftNotice='';coinGiftAttempt??=crypto.randomUUID();render();
 try{const d=await api('/api/coin-gifts',{code,amount,request_id:coinGiftAttempt});hydrate(d.state);coinGiftNotice=giftText(`${amount} coin gönderildi.`,`${amount} coins sent.`);coinGiftDraft.amount='';coinGiftAttempt=null;coinGiftConfirm=false;try{await refreshCoinGifts(false)}catch{}}
 catch(e){coinGiftNotice=giftError(e);try{await refreshCoinGifts(false)}catch{}}
 finally{coinGiftBusy=false;render();}
}

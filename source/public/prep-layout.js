/* Keep the title and actions fixed; only the ingredient list scrolls. */
(function(){
 const dialog=$('prep-screen'),bottom=dialog.querySelector('.studio-bottom');
 const actions=document.createElement('footer');actions.className='prep-actions';
 for(const node of [bottom.querySelector('.studio-progress'),$('prep-copy'),$('brew'),$('prep-continue'),$('lab-back')])if(node)actions.appendChild(node);
 bottom.appendChild(actions);
 const close=document.createElement('button');close.className='prep-close';close.type='button';close.textContent='×';close.setAttribute('aria-label','Hazırlamayı kapat ve kafeye dön');
 close.onclick=()=>{if(!$('lab-back').disabled)$('lab-back').click()};dialog.querySelector('.studio-head').appendChild(close);
 const originalOpenLab=openLab;openLab=function(){originalOpenLab();dialog.scrollTop=0;$('measure-cards').scrollTop=0};
})();

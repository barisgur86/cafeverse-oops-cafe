/* Overflowing sections advance in pages; navigation remains inside the viewport. */
(() => {
 const pages = new Map();
 let scheduled = false;
 function fitSection() {
  scheduled = false;
  if(['outfit','decor','weekly'].includes(document.body.dataset.screen))return;
  const panel = document.querySelector('#left');
  if (!panel || !panel.getClientRects().length) return;
  panel.querySelector(':scope > .viewport-pager')?.remove();
  for (const child of panel.children) if (child.dataset.viewportHidden) {
   child.hidden = false; delete child.dataset.viewportHidden;
  }
  const children = [...panel.children].filter(child => !child.hidden && child.getClientRects().length);
  if (panel.scrollHeight <= panel.clientHeight + 2) return;
  const style = getComputedStyle(panel);
  const budget = panel.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - 58;
  if (budget <= 0) return;
  const groups = [[]]; let used = 0;
  for (const child of children) {
   const css = getComputedStyle(child);
   const height = child.getBoundingClientRect().height + parseFloat(css.marginTop) + parseFloat(css.marginBottom);
   if (used + height > budget && groups.at(-1).length) { groups.push([]); used = 0; }
   groups.at(-1).push(child); used += height;
  }
  if (groups.length < 2) return;
  const key = document.body.dataset.screen;
  const page = Math.min(pages.get(key) || 0, groups.length - 1);
  for (const child of children) if (!groups[page].includes(child)) {
   child.hidden = true; child.dataset.viewportHidden = 'true';
  }
  const nav = document.createElement('nav'); nav.className = 'screen-pager viewport-pager';
  nav.setAttribute('aria-label','Bölüm sayfaları');
  nav.innerHTML = `<button aria-label="Önceki bölüm sayfası" ${page ? '' : 'disabled'}>‹</button><span aria-live="polite">${page+1} / ${groups.length}</span><button aria-label="Sonraki bölüm sayfası" ${page === groups.length-1 ? 'disabled' : ''}>›</button>`;
  const buttons = nav.querySelectorAll('button');
  buttons[0].onclick = () => { pages.set(key,page-1); fitSection(); };
  buttons[1].onclick = () => { pages.set(key,page+1); fitSection(); };
  panel.append(nav); panel.scrollTop = 0;
 }
 const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(fitSection); } };
 const previous = refreshAppScreen;
 refreshAppScreen = function() { previous(); schedule(); };
 window.addEventListener('resize',schedule);
 document.fonts?.ready.then(schedule);
 schedule();
})();

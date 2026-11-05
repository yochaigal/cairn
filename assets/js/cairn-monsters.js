// The Monsters page: the filter, and the letter rail with its scroll spy. The list itself is in the page; without
// JavaScript it shows in full and the rail's letters still jump.
(() => {
  const $ = s => document.querySelector(s);
  const input = $('#mq'), list = $('#monsterList'), rail = $('#azRail');
  if (!input || !list) return;
  const cards = [...list.querySelectorAll('.monster')].map(el => ({el, text: el.textContent.toLowerCase()}));
  const total = cards.length;
  let say = 0;

  function filter() {
    const q = input.value.trim().toLowerCase();
    let hits = 0;
    for (const c of cards) { const on = !q || c.text.includes(q); c.el.hidden = !on; hits += on; }
    // a letter the filter empties is hidden in the list and greyed out on the rail
    for (const g of list.querySelectorAll('.letter-group')) {
      const empty = !g.querySelector('.monster:not([hidden])');
      g.hidden = empty;
      const a = rail.querySelector(`[data-l="${g.id.slice(2)}"]`);
      if (a) { a.parentNode.classList.toggle('empty', empty); if (empty) a.setAttribute('aria-disabled', 'true'); else a.removeAttribute('aria-disabled'); }
    }
    $('#mqNone').hidden = hits > 0;
    clearTimeout(say);  // as search: announced once typing pauses
    say = setTimeout(() => { $('#mqStatus').textContent = q ? `${hits} of ${total} monsters` : `${total} monsters`; }, q ? 500 : 0);
    active = null; spy();
  }

  // scroll spy: the current letter is the last group whose top has reached just under the sticky header. Near the end
  // of the page the last letters can't reach that line, so a letter picked from the rail stays current until the reader
  // scrolls up
  let active = null, picked = null, pausedUntil = 0;
  function setActive(l) {
    if (l === active) return;
    active = l;
    for (const a of rail.querySelectorAll('a')) a.setAttribute('aria-current', String(a.dataset.l === l));
    const a = l && rail.querySelector(`[data-l="${l}"]`);
    if (a && rail.scrollHeight > rail.clientHeight) rail.scrollTop = a.offsetTop - (rail.clientHeight - a.offsetHeight) / 2;
  }
  function spy() {
    if (performance.now() < pausedUntil) return;
    const groups = [...list.querySelectorAll('.letter-group:not([hidden])')];
    if (!groups.length) return setActive(null);
    const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    if (picked && atEnd && groups.some(g => g.id === 'm-' + picked)) return setActive(picked);
    picked = null;
    const line = $('#main-header').getBoundingClientRect().bottom + 24;
    let cur = groups[0];
    for (const g of groups) if (g.getBoundingClientRect().top <= line) cur = g;
    setActive(cur.id.slice(2));
  }
  let queued = false;
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; spy(); }); } }, {passive: true});
  // a letter picked from the rail is current at once, and stays so while the page glides there
  rail.addEventListener('click', e => {
    const a = e.target.closest('[data-l]');
    if (!a) return;
    if (a.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
    picked = a.dataset.l; setActive(picked); pausedUntil = performance.now() + 1000;
  });
  addEventListener('scrollend', () => { pausedUntil = 0; spy(); });
  input.addEventListener('input', filter);
  new ResizeObserver(spy).observe(list);
  document.fonts.ready.then(spy);
  spy();
})();

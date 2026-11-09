// The Monsters page: the filter (name matches first, kept in ?q=), and the letter rail with its scroll spy. The list
// itself is in the page; without JavaScript it shows in full and the rail's letters still jump.
(() => {
  const $ = s => document.querySelector(s);
  const input = $('#mq'), list = $('#monsterList'), rail = $('#azRail');
  if (!input || !list) return;
  // each card's home is its letter group; while filtering, matches move into the two sections instead
  const cards = [...list.querySelectorAll('.monster')].map(el =>
    ({el, home: el.parentNode, name: el.querySelector('h3').textContent.toLowerCase(), text: el.textContent.toLowerCase()}));
  const groups = [...list.querySelectorAll('.letter-group')];
  const byName = $('#mqByName'), byText = $('#mqByText'), count = $('#mqStatus');
  const marks = CSS.highlights;  // undefined where the Highlight API isn't supported
  let say = 0;

  function status(raw, n, t) {
    if (!raw) return `${cards.length} monsters`;
    const hits = n + t;
    if (!hits) return `No monsters match “${raw}”`;
    const head = `${hits} monster${hits === 1 ? ' matches' : 's match'} “${raw}”`;
    if (!t) return head + (hits === 1 ? ', by name' : ', all by name');
    if (!n) return head + (hits === 1 ? ', in its text' : ', all in their text');
    return `${head}: ${n} by name, ${t} in ${t === 1 ? 'its' : 'their'} text`;
  }

  // the matched text in each shown card, highlighted without touching the DOM (dice links keep working). Matches
  // are found one text node at a time, so a match split across elements isn't marked
  function highlight(q, shown) {
    if (!marks) return;
    if (!q) return marks.delete('mq');
    const ranges = [];
    for (const c of shown) {
      const walk = document.createTreeWalker(c.el, NodeFilter.SHOW_TEXT);
      for (let node; (node = walk.nextNode());) {
        const low = node.data.toLowerCase();
        if (low.length !== node.data.length) continue;  // lowercasing changed the length: offsets wouldn't line up
        for (let i = low.indexOf(q); i >= 0; i = low.indexOf(q, i + q.length)) {
          const r = new Range(); r.setStart(node, i); r.setEnd(node, i + q.length); ranges.push(r);
        }
      }
    }
    marks.set('mq', new Highlight(...ranges));
  }

  function filter(now) {
    const raw = input.value.trim(), q = raw.toLowerCase();
    const hits = q ? cards.filter(c => c.text.includes(q)) : [];  // a card's text includes its name
    const named = [], texted = [];
    for (const c of hits) (c.name.includes(q) ? named : texted).push(c);
    for (const c of cards) c.home.append(c.el);
    byName.append(...named.map(c => c.el)); byText.append(...texted.map(c => c.el));
    // while filtering the letter groups and the rail are hidden, as the rail's letters would jump nowhere
    for (const g of groups) g.hidden = !!q;
    byName.hidden = !named.length; byText.hidden = !texted.length;
    rail.hidden = !!q;
    // highlights last: a range collapses when its node moves
    highlight(q, hits);
    const settle = () => {
      count.textContent = status(raw, named.length, texted.length);
      const url = new URL(location.href);
      if (raw) { url.searchParams.set('q', raw); url.hash = ''; } else url.searchParams.delete('q');  // a letter's hash would point at a hidden group
      history.replaceState(history.state, '', url);
    };
    clearTimeout(say);  // as search: announced, and kept in the address, once typing pauses
    if (now) settle(); else say = setTimeout(settle, q ? 500 : 0);
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
    if (a && !rail.contains(document.activeElement) && rail.scrollHeight > rail.clientHeight) rail.scrollTop = a.offsetTop - (rail.clientHeight - a.offsetHeight) / 2;
  }
  function spy() {
    if (performance.now() < pausedUntil) return;
    if (rail.hidden) return setActive(null);  // filtering: the letter groups are hidden
    const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    if (picked && atEnd) return setActive(picked);
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
    picked = a.dataset.l; setActive(picked); pausedUntil = performance.now() + 1000;
  });
  addEventListener('scrollend', () => { pausedUntil = 0; spy(); });
  input.addEventListener('input', () => filter());
  // a filter from the address sets the count at once, so it is right before a screen reader reaches it
  const asked = new URLSearchParams(location.search).get('q');
  if (asked) { input.value = asked; filter(true); }
  new ResizeObserver(spy).observe(list);
  document.fonts.ready.then(spy);
  spy();
})();

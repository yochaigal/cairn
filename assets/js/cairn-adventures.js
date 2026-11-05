// The Adventures catalog: filters and sort over the cards in the page. The filters live in the address
// (?g=originals&q=forest), so a reload, Back and shared links keep them; a value the form doesn't offer (an unknown
// author or tag) falls back to All.
(() => {
  const $ = s => document.querySelector(s);
  const form = $('#advFilters'), list = $('#advList');
  if (!form || !list) return;
  const DEFAULTS = {g: '', q: '', a: '', p: '', t: '', s: 'az'};
  const cards = [...list.children].map(el => ({
    el, g: el.dataset.g, a: el.dataset.a, p: el.dataset.p, n: el.dataset.n,
    price: el.dataset.price === '' ? null : parseFloat(el.dataset.price),
    t: el.dataset.t ? el.dataset.t.split('|') : [], text: el.textContent.toLowerCase() + ' ' + el.dataset.t.toLowerCase(),
  }));
  const filters = () => ({...DEFAULTS, ...Object.fromEntries(new FormData(form))});
  function fromQuery() {
    const p = new URLSearchParams(location.search);
    for (const [k, d] of Object.entries(DEFAULTS)) {
      const el = form.elements[k], v = p.get(k) || d;
      if (el) { el.value = v; if (el.value !== v) el.value = d; }
    }
  }
  const query = () => new URLSearchParams(Object.entries(filters()).filter(([k, v]) => v !== DEFAULTS[k])).toString();
  const byName = (x, y) => x.n.localeCompare(y.n, 'en', {sensitivity: 'base', numeric: true});
  let say = 0;
  function render() {
    const S = filters(), q = S.q.trim().toLowerCase();
    const hits = cards.filter(c => (!S.g || c.g === S.g) && (!S.a || c.a === S.a) && (!S.p || c.p === S.p) && (!S.t || c.t.includes(S.t))
      && (!q || c.text.includes(q)));
    hits.sort(S.s === 'za' ? (x, y) => byName(y, x) : S.s === 'price' ? (x, y) => (x.price ?? Infinity) - (y.price ?? Infinity) || byName(x, y) : byName);
    const on = new Set(hits);
    for (const c of cards) c.el.hidden = !on.has(c);
    list.append(...hits.map(c => c.el));  // the order; hidden cards stay where they are at the end
    const text = hits.length ? `${hits.length} adventure${hits.length === 1 ? '' : 's'}` : 'No adventures match. Try fewer filters.';
    clearTimeout(say); say = setTimeout(() => { $('#advCount').textContent = text; }, q ? 500 : 0);
    const qs = query();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }
  form.addEventListener('submit', e => e.preventDefault());
  form.addEventListener('input', render);
  addEventListener('popstate', () => { fromQuery(); render(); });
  fromQuery(); render();
})();

// a cover that doesn't load (offline, or gone) becomes a panel with the adventure's name
document.addEventListener('error', ev => {
  const img = ev.target;
  if (img.matches?.('img.adv-cover')) { img.closest('.adv-art').classList.add('no-cover'); img.remove(); }
}, true);

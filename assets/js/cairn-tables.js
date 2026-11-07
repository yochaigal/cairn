// Tables in the rules: runs of same-shaped roll tables share one set of column widths, so their columns line up down
// the page; and a table wider than the column (which scrolls sideways) can be reached and scrolled with the keyboard.
(() => {
  const $ = s => document.querySelector(s);
  // sections (by page, then heading id) whose tables line up: each is a run of same-shaped roll tables. A page listed
  // with no ids lines up all its tables (Marketplace's six price lists).
  const ALIGNED = {
    '/second-edition/players-guide/character-creation/': ['character-traits-d10'],
    '/second-edition/wardens-guide/dungeon-seeds/': ['creating-a-dungeon', 'draw-paths'],
    '/second-edition/wardens-guide/forest-seeds/': ['the-spirit-of-the-forest', 'trails'],
    '/second-edition/wardens-guide/npc-tables/': ['traits'],
    '/second-edition/players-guide/marketplace/': [],
  };

  function alignTables(prose) {
    const page = Object.keys(ALIGNED).find(p => location.pathname.endsWith(p));
    if (!page) return;
    const ids = ALIGNED[page];
    const groups = ids.length ? ids.map(id => {
      const h = document.getElementById(id), ts = [];
      for (let el = h?.nextElementSibling; el && el.tagName !== 'H2'; el = el.nextElementSibling) ts.push(...(el.matches('table') ? [el] : el.querySelectorAll('table')));
      return ts;
    }) : [[...prose.querySelectorAll('table')]];
    for (const tables of groups) {
      const n = tables.length && tables[0].rows[0].cells.length;
      if (tables.length < 2 || tables.some(t => t.rows[0].cells.length !== n)) continue;
      // a short column (a die, a price) gets a fixed width in characters, so a phone never squeezes it; the long columns
      // share the rest in proportion to their longest entry in any of the tables
      const len = Array(n).fill(0);
      for (const t of tables) for (const r of t.rows) [...r.cells].forEach((c, i) => { len[i] = Math.max(len[i], c.textContent.trim().length); });
      const short = len.map(l => l <= 10), fixed = len.reduce((x, l, i) => x + (short[i] ? l + 3 : 0), 0);
      const long = len.reduce((x, l, i) => x + (short[i] ? 0 : l), 0);
      const width = (l, i) => short[i] ? `${l + 3}ch` : `calc((100% - ${fixed}ch) * ${(l / long).toFixed(4)})`;
      const cols = `<colgroup>${len.map((l, i) => `<col style="width:${width(l, i)}">`).join('')}</colgroup>`;
      for (const t of tables) {
        t.classList.add('aligned');
        const cap = t.querySelector('caption');
        if (cap) cap.insertAdjacentHTML('afterend', cols); else t.insertAdjacentHTML('afterbegin', cols);
      }
    }
  }

  // a table or code block wider than the column scrolls sideways: that one becomes focusable and named, so the keyboard
  // can scroll it too (WCAG 2.1.1)
  function scrollable(prose) {
    for (const w of prose.querySelectorAll('.table-wrapper, div.highlight')) {
      let h = w.previousElementSibling;
      while (h && !/^H[2-6]$/.test(h.tagName)) h = h.previousElementSibling;  // the nearest heading above it
      const wide = w.scrollWidth > w.clientWidth + 1, kind = w.matches('.highlight') ? 'code' : 'table';
      const name = w.querySelector('caption')?.textContent || (h ? `${h.textContent.trim()}, ${kind}` : kind[0].toUpperCase() + kind.slice(1));
      if (wide) { w.tabIndex = 0; w.setAttribute('role', 'region'); w.setAttribute('aria-label', name); }
      else if (!w.contains(document.activeElement) && w.matches('.table-wrapper')) { w.removeAttribute('tabindex'); w.removeAttribute('role'); w.removeAttribute('aria-label'); }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const prose = $('.rules-main .prose');
    if (!prose) return;
    alignTables(prose);
    scrollable(prose);
    let queued = false;
    addEventListener('resize', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; scrollable(prose); }); } }, {passive: true});
    // the builder adds its background panel's tables after load
    new MutationObserver(() => scrollable(prose)).observe(prose, {childList: true});
  });
})();

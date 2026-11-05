// The redesign's page chrome: header menus, the Menu drawer, the sidebar scoped to the current section,
// "On this page", previous / next and the ⋯ menu. Runs after Just the Docs' own script has marked the current page
// in the sidebar (it adds .active to the link and to each enclosing .nav-list-item).
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);
  const PHONE = matchMedia('(max-width: 759px)');

  // a small menu behind a button (the ⋯ page actions, the language list): arrows move, Escape closes, a click outside closes
  function menu(wrap, btn, list, sel) {
    const items = () => [...list.querySelectorAll(sel)].filter(x => !x.closest('[hidden]'));
    const setOpen = (open, focus) => {
      btn.setAttribute('aria-expanded', String(open)); list.hidden = !open;
      const xs = items(), cur = xs.findIndex(x => x.getAttribute('aria-current') === 'true');
      if (open && focus) xs[focus === 'last' ? xs.length - 1 : focus === 'current' && cur >= 0 ? cur : 0].focus();
      if (!open && focus) btn.focus();
    };
    btn.addEventListener('click', () => setOpen(list.hidden, list.hidden ? 'current' : false));
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true, e.key === 'ArrowUp' ? 'last' : 'first'); }
      if (e.key === 'Escape' && !list.hidden) { e.stopPropagation(); setOpen(false); }
    });
    list.addEventListener('keydown', e => {
      const xs = items(), i = xs.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); xs[(i + 1) % xs.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); xs[(i - 1 + xs.length) % xs.length].focus(); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false, true); }
    });
    list.addEventListener('click', e => {
      const x = e.target.closest(sel);
      if (!x || x.getAttribute('aria-disabled') === 'true') return;
      setOpen(false);
    });
    wrap.addEventListener('focusout', e => { if (!wrap.contains(e.relatedTarget)) setOpen(false); });
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) setOpen(false); });
  }

  // ---------- header menus: Escape dismisses a list (a hovered one until the pointer leaves, a focused one until focus leaves its item)
  function headerMenus() {
    const nav = $('#primaryNav');
    if (!nav) return;
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (nav.matches(':hover')) nav.classList.add('no-hover');
      const item = document.activeElement.closest?.('#primaryNav li[data-menu]');
      if (item) { item.classList.add('dismissed'); item.querySelector('a').focus(); }
    });
    nav.addEventListener('pointerleave', () => nav.classList.remove('no-hover'));
    nav.addEventListener('focusout', e => {
      const item = e.target.closest('li[data-menu]');
      if (item && !item.contains(e.relatedTarget)) item.classList.remove('dismissed');
    });
  }

  // ---------- the Menu drawer (narrow screens). On pages with the sidebar, Just the Docs' script toggles .nav-open on the
  // header, the button and the sidebar; the full-width pages have no sidebar, and the theme then leaves the button
  // alone, so it's toggled here. This moves focus in, and closes it on Escape, on following a link, on a click outside,
  // or when focus moves on past it. While it's open the breadcrumbs (under it, between the header and the sidebar in
  // the page) are inert, so Tab goes from the header straight into the sidebar.
  function drawer() {
    const header = $('#main-header'), btn = $('#menu-button'), siteNav = $('#site-nav'), crumbs = $('.rules-layout > .crumbs');
    if (!header || !btn) return;
    if (!siteNav) {
      btn.setAttribute('aria-controls', 'primaryNav');
      btn.addEventListener('click', () => {
        const open = btn.classList.toggle('nav-open');
        header.classList.toggle('nav-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    }
    const inside = el => header.contains(el) || !!siteNav?.contains(el);
    if (crumbs) new MutationObserver(() => { crumbs.inert = btn.classList.contains('nav-open'); }).observe(btn, {attributes: true, attributeFilter: ['class']});
    const close = returnFocus => {
      if (!btn.classList.contains('nav-open')) return;
      btn.click();
      if (returnFocus) btn.focus();
    };
    btn.addEventListener('click', () => { if (btn.classList.contains('nav-open')) $('#primaryNav a')?.focus(); });
    // Escape in search clears it first (the theme's); once there's nothing to clear, it closes the drawer
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (e.target.closest?.('.cairn-search') && (e.target.value || document.documentElement.classList.contains('search-active'))) return;
      close(true);
    });
    for (const el of [header, siteNav]) {
      if (!el) continue;
      el.addEventListener('click', e => { if (e.target.closest('a') && !e.target.closest('.nav-list-expander')) close(); });
      el.addEventListener('focusout', e => { if (e.relatedTarget && !inside(e.relatedTarget)) close(); });
    }
    document.addEventListener('click', e => { if (!inside(e.target)) close(); });
    // the theme's Ctrl/⌘+K also opens the header as a drawer on narrow screens; the shortcut only focuses search here
    // (after the theme's own handler, which runs later in the same keydown)
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') setTimeout(() => { if (!btn.classList.contains('nav-open')) header.classList.remove('nav-open'); });
    });
  }

  // ---------- search: the theme writes its results into #search-results; this says how many there are, and exposes the
  // result the arrow keys pick (the theme marks it .active and opens it on Enter) as the input's active option
  function searchStatus() {
    const input = $('#search-input'), results = $('#search-results'), say = $('#search-status');
    if (!input || !results || !say) return;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    let timer = 0;
    new MutationObserver(() => {
      const list = results.querySelector('.search-results-list'), items = list ? [...list.querySelectorAll('.search-result')] : [];
      if (list) { list.id = 'search-results-list'; list.setAttribute('role', 'listbox'); input.setAttribute('aria-controls', list.id); }
      for (const li of results.querySelectorAll('.search-results-list-item')) li.setAttribute('role', 'none');
      for (const [i, a] of items.entries()) { a.id ||= `search-result-${i}`; a.setAttribute('role', 'option'); a.setAttribute('aria-selected', String(a.classList.contains('active'))); }
      const active = items.find(a => a.classList.contains('active'));
      if (active) { input.setAttribute('aria-activedescendant', active.id); active.scrollIntoView({block: 'nearest'}); } else input.removeAttribute('aria-activedescendant');
      expanded();
      const text = !input.value.trim() ? '' : items.length ? `${items.length} result${items.length === 1 ? '' : 's'}` : results.textContent.trim() ? 'No results found' : '';
      clearTimeout(timer);
      timer = setTimeout(() => { if (say.textContent !== text) say.textContent = text; }, 500);  // once typing pauses
    }).observe(results, {childList: true, subtree: true, attributes: true, attributeFilter: ['class']});
    // open only while the theme shows the results
    const expanded = () => {
      const open = document.documentElement.classList.contains('search-active') && !!results.querySelector('.search-result');
      input.setAttribute('aria-expanded', String(open));
      if (!open) input.removeAttribute('aria-activedescendant');
    };
    new MutationObserver(expanded).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
  }

  // an adventure cover that doesn't load (offline, or gone) becomes a panel with the adventure's name
  document.addEventListener('error', ev => {
    const img = ev.target;
    if (img.matches?.('img.adv-cover')) { img.closest('.adv-art').classList.add('no-cover'); img.remove(); }
  }, true);

  // ---------- the sidebar shows only the current top-level section (Second Edition, Resources, Hacks...)
  // Just the Docs renders the whole site's nav once for every page, so the scoping happens here. Without JavaScript the
  // whole nav shows.
  function sectionNav() {
    const siteNav = $('#site-nav');
    if (!siteNav) return null;
    const top = siteNav.querySelector(':scope > ul > li.nav-list-item.active');
    // Just the Docs removes the current page's href; put it back, marked as the current page
    const cur = siteNav.querySelector('a.nav-list-link.active');
    if (cur) { cur.href = location.pathname; cur.setAttribute('aria-current', 'page'); }
    if (!top) return null;
    const link = top.querySelector(':scope > a');
    siteNav.classList.add('scoped');
    top.classList.add('section-root');
    for (const li of siteNav.querySelectorAll(':scope > ul > li')) if (li !== top) li.classList.add('other-section');
    const name = link.textContent.trim();
    siteNav.setAttribute('aria-label', name);
    siteNav.insertAdjacentHTML('afterbegin', `<p class="nav-title"><a href="${esc(link.getAttribute('href') || location.pathname)}"${link === cur ? ' aria-current="page"' : ''}>${esc(name)}</a></p>`);
    return top;
  }

  // ---------- previous / next: the page before and after this one in its section, in the sidebar's order
  function pager(top) {
    const el = $('#pager'), cur = $('#site-nav a[aria-current="page"]');
    if (!el || !top || !cur) return;
    const links = [top.querySelector(':scope > a'), ...top.querySelectorAll(':scope > ul a.nav-list-link')];
    const i = links.indexOf(cur);
    if (i < 0) return;
    const prev = links[i - 1], next = links[i + 1];
    const a = (x, cls, label) => `<a class="${cls}" href="${esc(x.getAttribute('href'))}"><small>${label}</small>${esc(x.textContent.trim())}</a>`;
    if (!prev && !next) return;
    el.innerHTML = (prev ? a(prev, 'prev', 'Previous') : '<span></span>') + (next ? a(next, 'next', 'Next') : '');
    el.hidden = false;
  }

  // ---------- the title row: the page's own H1 with the ⋯ menu at its right
  function titleRow() {
    const actions = $('#titleActions'), h1 = $('.rules-main .prose h1');
    if (!actions) return;
    if (h1) {
      const row = document.createElement('div');
      row.className = 'title-row';
      h1.before(row); row.append(h1, actions);
    }
    menu(actions.querySelector('.page-actions'), $('#actionsBtn'), $('#actionsList'), 'a');
    if ($('#langPicker')) menu($('#langPicker'), $('#langBtn'), $('#langList'), 'a');
  }

  // ---------- "On this page": the page's H2s and H3s (not the children list Just the Docs adds after the text)
  function onThisPage() {
    const toc = $('#toc'), list = $('#tocList'), main = $('.rules-main .prose');
    if (!toc || !main) return;
    const hs = [...main.querySelectorAll('h2[id], h3[id]')].filter(h => !h.closest('.child-list, nav') && !h.classList.contains('text-delta'));
    if (hs.length < 2) return;
    const text = h => { const c = h.cloneNode(true); c.querySelectorAll('.anchor-heading, .sr-only').forEach(x => x.remove()); return c.textContent.trim(); };
    list.innerHTML = '<ul>' + hs.map(h => `<li${h.tagName === 'H3' ? ' class="lvl3"' : ''}><a href="#${esc(h.id)}">${esc(text(h))}</a></li>`).join('') + '</ul>';
    toc.hidden = false;
    const toggle = $('#tocToggle');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open)); list.hidden = !open;
    });
    // on phones it sits in the article, under the title; wider, in its own column
    const home = toc.parentNode, next = toc.nextSibling;
    const place = () => {
      if (PHONE.matches) { const row = $('.title-row'); if (row) row.after(toc); else main.prepend(toc); }
      else home.insertBefore(toc, next);
    };
    place(); PHONE.addEventListener('change', place);
    // following a link in it on a phone folds it away again
    list.addEventListener('click', e => { if (PHONE.matches && e.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); list.hidden = true; } });
  }

  function searchKey() {
    const k = $('.search-key');
    if (k && /Mac|iPhone|iPad/.test(navigator.platform)) k.textContent = '⌘K';
  }

  // the header's height, for sticky offsets and scroll padding
  function headHeight() {
    const h = $('#main-header');
    if (!h) return;
    const set = () => document.documentElement.style.setProperty('--head', h.offsetHeight + 'px');
    set(); new ResizeObserver(set).observe(h);
  }

  document.addEventListener('DOMContentLoaded', () => {
    headerMenus(); drawer(); searchKey(); searchStatus(); headHeight();
    const top = sectionNav();
    titleRow(); onThisPage(); pager(top);
  });
})();

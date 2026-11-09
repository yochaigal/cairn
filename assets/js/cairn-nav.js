// The redesign's page chrome: header menus, the Menu drawer, the sidebar scoped to the current section,
// "On this page", previous / next and the ⋯ menu. Runs after Just the Docs' own script has marked the current page
// in the sidebar (it adds .active to the link and to each enclosing .nav-list-item).
(() => {
  const $ = s => document.querySelector(s);
  const path = a => new URL(a.href, location.href).pathname;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);
  const PHONE = matchMedia('(max-width: 759px)');
  const NARROW = matchMedia('(max-width: 959px)');  // the Menu button opens the header full screen

  // a small menu behind a button (the ⋯ page actions, the language list): arrows move, Escape closes, a click outside closes
  function menu(wrap, btn, list, sel) {
    const items = () => [...list.querySelectorAll(sel)].filter(x => !x.closest('[hidden]'));
    const setOpen = (open, focus) => {
      btn.setAttribute('aria-expanded', String(open)); list.hidden = !open;
      const xs = items(), cur = xs.findIndex(x => x.getAttribute('aria-current') === 'true');
      const first = Math.max(0, xs.findIndex(x => x.getAttribute('aria-disabled') !== 'true'));  // skip a language this page isn't in
      if (open && focus) xs[focus === 'last' ? xs.length - 1 : focus === 'current' && cur >= 0 ? cur : first].focus();
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
      if (e.key !== 'Escape' || NARROW.matches) return;  // narrower, Escape closes the full-screen menu (drawer)
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

  // ---------- the Menu drawer. Below 960px it's the header opened full screen; from 960 to 1099px, the sidebar under the
  // header. On pages with the sidebar, Just the Docs' script toggles .nav-open on the header, the button and the sidebar;
  // the full-width pages have no sidebar, and the theme then leaves the button alone, so it's toggled here. This moves
  // focus in, and closes it on Escape, on following a link, on a click outside, when focus moves on past it, or when
  // the window crosses 960px.
  function drawer() {
    const header = $('#main-header'), btn = $('#menu-button'), siteNav = $('#site-nav'), nav = $('#primaryNav');
    if (!header || !btn || !nav) return;
    if (!siteNav) {
      btn.setAttribute('aria-controls', 'primaryNav');
      btn.addEventListener('click', () => {
        const open = btn.classList.toggle('nav-open');
        header.classList.toggle('nav-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    }
    const isOpen = () => btn.classList.contains('nav-open');
    const inside = el => header.contains(el) || !!siteNav?.contains(el);

    nav.addEventListener('click', e => { const t = e.target.closest('.nav-sub-toggle'); if (t) t.setAttribute('aria-expanded', String(t.getAttribute('aria-expanded') !== 'true')); });

    // below 960px the header's controls go in the order they're shown (logo, Dice, Menu, search, the menus), so Tab
    // follows the screen; wider, they go back. Whatever had focus keeps it
    const wrap = header.querySelector('.wrap'), dice = $('#diceBtn'), search = $('.cairn-search');
    const place = () => {
      const focused = document.activeElement;
      for (const el of NARROW.matches ? [dice, btn, search, nav] : [btn, nav, search, dice]) if (el) wrap.append(el);
      if (siteNav) btn.setAttribute('aria-controls', NARROW.matches ? 'primaryNav' : 'primaryNav site-nav');  // the sidebar is inert under the full-screen menu
      if (focused !== document.activeElement && focused?.isConnected) focused.focus({preventScroll: true});
    };
    place();

    // the full-screen menu, like the phone's modal dice tray, makes the page under it inert (the tray and notices stay
    // usable); from 960px only the crumbs are, so Tab goes from the header into the open sidebar
    const behind = document.querySelectorAll('.cairn > .skip, .cairn > main, .cairn > .rules-layout, .cairn > .cairn-footer');
    const crumbs = $('.rules-layout > .crumbs'), tray = $('#diceTray');
    const sync = () => {
      const open = isOpen(), trayModal = tray?.getAttribute('aria-modal') === 'true';
      for (const el of behind) el.inert = (open && NARROW.matches) || trayModal;
      if (crumbs) crumbs.inert = (open && !NARROW.matches) || trayModal;
    };
    new MutationObserver(sync).observe(btn, {attributes: true, attributeFilter: ['class']});
    tray?.addEventListener('toggle', sync);

    const close = returnFocus => {
      if (!isOpen()) return;
      btn.click();
      if (returnFocus) btn.focus();
    };
    // focus on something crossing 960px hides (Close, or the sidebar going back into its hidden column) moves to Menu, or
    // to the first header link
    NARROW.addEventListener('change', () => {
      const had = inside(document.activeElement);
      close(); place();
      if (had && !document.activeElement.checkVisibility()) (NARROW.matches ? btn : nav.querySelector('a')).focus();
    });
    // each time it opens, the lists on the way to the current page start open and the others closed, and focus goes to
    // the first control shown
    btn.addEventListener('click', () => {
      if (!isOpen()) return;
      for (const t of nav.querySelectorAll('.nav-sub-toggle')) t.setAttribute('aria-expanded', String(!!t.parentNode.querySelector('a[aria-current]')));
      [...nav.querySelectorAll('a, button')].find(x => x.checkVisibility())?.focus();
    });
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') setTimeout(() => { if (!isOpen()) header.classList.remove('nav-open'); });
    });
  }

  // ---------- one menu below 960px: under each header link with pages of its own in the sidebar (Player's Guide, Hacks...),
  // the full-screen menu nests them, the link itself first as "Table of contents". Built from the sidebar after
  // sectionNav() has marked the current page
  function menuTree() {
    const nav = $('#primaryNav'), siteNav = $('#site-nav');
    if (!nav || !siteNav) return;
    const pages = new Map([...siteNav.querySelectorAll('li.nav-list-item > a.nav-list-link')].map(a => [path(a), a.parentNode]));
    const chevron = nav.querySelector('.nav-sub-toggle svg').outerHTML;
    let n = 0;
    const current = a => a.getAttribute('aria-current') === 'page' ? ' aria-current="page"' : '';
    const link = a => `<a href="${esc(a.getAttribute('href'))}"${current(a)}>`;
    // li: the theme's sidebar item; a: the row's own link (the header's, or the sidebar's)
    const branch = (li, a) => {
      const kids = [...li.querySelectorAll(':scope > ul.nav-list > li.nav-list-item')];
      if (!kids.length) return '';
      const id = `navtree-${++n}`, name = esc(a.textContent.trim());
      return `<button class="btn-icon nav-sub-toggle" type="button" aria-expanded="false" aria-controls="${id}"${li.classList.contains('active') ? ' aria-current="true"' : ''}>${name}${chevron}</button>`
        + `<div class="nav-menu" id="${id}"><ul><li>${link(a)}Table of contents<span class="sr-only">, ${name}</span></a></li>${kids.map(k => {
          const ka = k.querySelector(':scope > a');
          return `<li>${link(ka)}${esc(ka.textContent.trim())}</a>${branch(k, ka)}</li>`;
        }).join('')}</ul></div>`;
    };
    // a link to a header section's own page (Resources › All resources, Resources › Adventures) would repeat that section
    const sections = new Set([...nav.querySelectorAll(':scope > ul > li > a')].map(path));
    for (const a of nav.querySelectorAll(':scope > ul > li > .nav-menu > ul > li > a')) {
      const li = !sections.has(path(a)) && pages.get(path(a));
      if (li) a.insertAdjacentHTML('afterend', branch(li, a));
    }
    // a page can be listed twice (Core Rules under Rules and in the Player's Guide): only the most deeply nested copy is
    // styled as the current page (copies tied at that depth all keep it)
    const depth = x => { let d = 0; for (let m = x.closest('.nav-menu'); m; m = m.parentNode.closest('.nav-menu')) d++; return d; };
    const cur = [...nav.querySelectorAll('.nav-menu a[aria-current="page"]')], ds = cur.map(depth), deepest = Math.max(...ds);
    cur.forEach((x, i) => { if (ds[i] < deepest) x.classList.add('current-copy'); });
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
      else input.removeAttribute('aria-controls');  // the theme empties the results on each query
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
    if (!top) { siteNav.setAttribute('aria-label', 'All pages'); return null; }
    const link = top.querySelector(':scope > a');
    siteNav.classList.add('scoped');
    top.classList.add('section-root');
    for (const li of siteNav.querySelectorAll(':scope > ul > li')) if (li !== top) li.classList.add('other-section');
    const name = link.textContent.trim();
    siteNav.setAttribute('aria-label', name);
    // the heading goes where the header's link of the same name goes, when that is inside this section (Barebones › its rules)
    const root = path(link);
    const hit = [...document.querySelectorAll('#primaryNav .nav-menu a')].find(a => a.textContent.trim() === name && path(a).startsWith(root));
    const href = hit ? path(hit) : root;
    siteNav.insertAdjacentHTML('afterbegin', `<p class="nav-title"><a href="${esc(href)}"${href === location.pathname ? ' aria-current="page"' : ''}>${esc(name)}</a></p>`);
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
    if ($('#langPicker')) menu($('#langPicker'), $('#langBtn'), $('#langList'), 'a, button');
  }

  // ---------- "On this page": the page's H2s and H3s (not the children list Just the Docs adds after the text)
  function onThisPage() {
    const toc = $('#toc'), list = $('#tocList'), main = $('.rules-main .prose');
    if (!toc || !main) return;
    const hs = [...main.querySelectorAll('h2[id], h3[id]')].filter(h => !h.closest('.child-list, nav') && !h.classList.contains('text-delta'));
    if (hs.length < 2) return;
    const text = h => { const c = h.cloneNode(true); c.querySelectorAll('.anchor-heading, .sr-only').forEach(x => x.remove()); return c.textContent.trim(); };
    const lang = main.getAttribute('lang');  // a translated page's headings keep their language out here
    list.innerHTML = `<ul${lang ? ` lang="${esc(lang)}"` : ''}>` + hs.map(h => `<li${h.tagName === 'H3' ? ' class="lvl3"' : ''}><a href="#${esc(h.id)}">${esc(text(h))}</a></li>`).join('') + '</ul>';
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
    menuTree(); titleRow(); onThisPage(); pager(top);
  });
})();

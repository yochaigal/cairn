// The prophecy (#advProphecy, beside the catalog's count): one adventure from those the filters show, revealed in a
// full-screen dialog. The page fades to black, haze swirls in the middle of it with rings of rippled glass, and a book
// with the adventure's cover fades in behind the haze, which then clears (prophecy/book.js, three.js); then its
// name, byline, summary, and "New vision" and "Get" slide up from the bottom. The scene loads when the link is
// first pointed at or focused.
// "New vision" draws another, with no repeats until every adventure the filters show has come up.
// While it plays, a click or any key skips to the end (Escape too; the close button closes at any time). After that,
// Escape, the close button or a click away from the book and its text closes it. With reduced motion, or without
// WebGL, the book is drawn in CSS instead: still, or fading in under a CSS haze.
const $ = s => document.querySelector(s);
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
// the timeline in ms: the first from when the scene is ready (the page itself fades to black over the first 500, in
// CSS), "again" from when the next adventure is in. The text comes once the haze has cleared
const INTRO = {haze: 400, hazeMs: 1100, book: 1300, bookMs: 1200, clear: 2400, clearMs: 900, text: 3300, end: 3700};
const AGAIN = {cloud: 500, book: 100, bookMs: 800, clear: 800, clearMs: 800, text: 1600, end: 1900};
const WAIT = 2500;        // the longest the first open waits for the scene before using the CSS book
const SAY_LOADING = 400;  // when "Loading…" shows, if it's still coming

const list = $('#advList'), btn = $('#advProphecy'), dlg = $('#advOracle');
if (list && btn && dlg) prophecy();

function prophecy() {
  const sep = $('#advProphecySep'), title = $('#advOracleTitle'), by = $('#oracleBy'), sum = $('#oracleSum');
  const again = $('#oracleAgain'), get = $('#oracleGet'), getName = $('#oracleGetName'), out = $('#oracleOut');
  const text = dlg.querySelector('.oracle-text'), wipeHost = dlg.querySelector('.oracle-wipe'), bookHost = $('#oracleBook');

  // ---------- the pool: the cards the filters show that lead somewhere, drawn from a shuffled bag
  const pool = () => [...list.children].filter(li => !li.hidden && li.querySelector('a')?.getAttribute('href'));
  let bag = [], bagKey = '', shown = null;
  function draw() {
    const p = pool(), key = p.map(li => li.dataset.n).sort().join('\n');
    if (key !== bagKey) { bagKey = key; bag = []; }
    if (!bag.length) {
      bag = p.slice();
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      if (bag.length > 1 && bag[bag.length - 1] === shown) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
    }
    return (shown = bag.pop());
  }
  let syncing = 0;
  function sync() {
    syncing = 0;
    const n = pool().length;
    btn.hidden = sep.hidden = n === 0;
    again.hidden = n < 2;
  }
  // the filters hide and show cards; once a frame is enough, however many changed
  new MutationObserver(() => { syncing ||= requestAnimationFrame(sync); })
    .observe(list, {subtree: true, attributes: true, attributeFilter: ['hidden']});
  sync();

  // ---------- an adventure into the dialog's text, from its card's own markup; returns what the book needs
  function fill(li) {
    const name = li.querySelector('.adv-name').textContent, o = li.querySelector('.adv-out');
    title.textContent = name;
    by.textContent = li.querySelector('.adv-by')?.textContent || '';
    sum.textContent = li.querySelector('.adv-sum')?.textContent || '';
    by.hidden = !by.textContent; sum.hidden = !sum.textContent;
    get.href = li.querySelector('a').getAttribute('href');
    // the card's "On itch.io ↗" makes the button "Get on itch.io ↗"; screen readers also hear which adventure
    const where = o ? o.firstChild.textContent.trim() : '';
    const arrow = document.createElement('span');
    arrow.textContent = ' ↗'; arrow.setAttribute('aria-hidden', 'true');
    out.replaceChildren(...(where ? [' ' + where[0].toLowerCase() + where.slice(1), arrow] : []));
    getName.textContent = (where ? ': ' : ' ') + name;
    const img = li.querySelector('img.adv-cover');
    return {name, group: li.querySelector('.adv-panel small')?.textContent || '', cover: li.dataset.cover || '',
      hotlink: img ? img.currentSrc || img.src : '', panel: li.querySelector('.adv-panel')};
  }

  // ---------- the scene, loaded once
  let loading = null;
  const load = () => loading ||= import('./prophecy/book.js').then(m => m.createScene, () => null);
  btn.addEventListener('pointerenter', load, {once: true});
  btn.addEventListener('focus', load, {once: true});

  // where the book sits: the space above the text. The text's resting place (offsetTop), not where it is now: before it
  // arrives it's translated below the screen
  const area = () => ({top: 56, bottom: Math.max(text.offsetTop - 12, 200)});
  // the CSS book, without WebGL or with reduced motion: the same cover in CSS, fitted above the text, fading in under
  // a CSS haze (or, with reduced motion, simply there)
  function cssBook() {
    const book = $('#oracleFlatTpl').content.firstElementChild.cloneNode(true), pic = book.querySelector('img');
    pic.addEventListener('error', () => book.classList.add('no-cover'));
    bookHost.classList.add('flat');
    bookHost.replaceChildren(book);
    wipeHost.classList.add('no-gl');
    const a = area(), h = Math.min(a.bottom - a.top - 16, 420);
    book.style.top = a.top + 'px';
    book.style.setProperty('--h', h + 'px');
    wipeHost.style.setProperty('--cy', (a.top + a.bottom) / 2 + 'px');
    // the book fades in or out, the haze comes or goes (each over ms); resolves when it has
    const fade = (cls, ms) => {
      bookHost.style.setProperty('--book-ms', ms + 'ms');
      bookHost.classList.remove('rise', 'drop', 'still'); void bookHost.offsetWidth;
      bookHost.classList.add(cls);
      return new Promise(r => setTimeout(r, ms));
    };
    const mist = (on, ms) => {
      wipeHost.style.setProperty('--wipe-ms', ms + 'ms');
      wipeHost.classList.remove('swept');
      wipeHost.classList.toggle('go', on);
      return new Promise(r => setTimeout(r, ms));
    };
    return {
      // the card's own image first: the browser has it already (the copy here is for WebGL)
      async show(e) {
        const src = e.hotlink || e.cover;
        book.classList.toggle('no-cover', !src);
        if (src) pic.src = src; else pic.removeAttribute('src');
        book.querySelector('.adv-panel').replaceChildren(...e.panel.cloneNode(true).childNodes);
        book.querySelector('.flat-title').textContent = e.name;
      },
      haze: ms => mist(true, ms),
      appear: ms => fade('rise', ms),
      clear: ms => mist(false, ms),
      cloud: ms => Promise.all([mist(true, ms), fade('drop', ms)]),
      skip() { bookHost.classList.remove('drop'); bookHost.classList.add('rise', 'still'); wipeHost.classList.remove('go'); wipeHost.classList.add('swept'); },
      wasDrag: () => false, onBook: () => false,
      destroy() { bookHost.className = 'oracle-book'; bookHost.removeAttribute('style'); bookHost.replaceChildren(); wipeHost.className = 'oracle-wipe'; wipeHost.removeAttribute('style'); },
    };
  }

  // ---------- playing: timers for each step, any of which finish() can cut short
  let active = false, playing = false, timers = [], book = null;
  const later = (ms, f) => timers.push(setTimeout(f, ms));
  const stop = () => { timers.forEach(clearTimeout); timers = []; };
  const reveal = on => { dlg.classList.toggle('is-revealed', on); book?.text?.(on, 500); };
  function finish() {
    if (!playing) return;
    playing = false;
    stop();
    book?.skip();
    dlg.classList.remove('is-loading');
    reveal(true);
  }
  function play(T) {
    if (REDUCE.matches) return finish();
    if (T.haze != null) later(T.haze, () => book.haze(T.hazeMs));
    later(T.book, () => book.appear(T.bookMs));
    later(T.clear, () => book.clear(T.clearMs));
    later(T.text, () => reveal(true));
    later(T.end, finish);
  }
  async function open() {
    const entry = fill(draw());
    dlg.showModal();
    title.focus({preventScroll: true});
    active = playing = true;
    reveal(false);
    if (REDUCE.matches) { book = cssBook(); await book.show(entry); return finish(); }
    const saying = setTimeout(() => dlg.classList.add('is-loading'), SAY_LOADING);
    const create = await Promise.race([load(), new Promise(r => setTimeout(r, WAIT, null))]);
    if (!dlg.open) return clearTimeout(saying);
    try { book = create ? create(bookHost, {area}) : cssBook(); }
    catch { book = cssBook(); }
    await book.show(entry);
    clearTimeout(saying); dlg.classList.remove('is-loading');
    if (!dlg.open) return;
    if (!playing) return book.skip();  // skipped while it loaded
    play(INTRO);
  }
  async function next() {
    if (playing || !book) return;
    playing = true;
    const entry = fill(draw());
    title.focus({preventScroll: true});  // before the text fades, so focus is never on a button that's fading out
    reveal(false);                       // the text slides away while the haze closes over the book
    const saying = setTimeout(() => dlg.classList.add('is-loading'), AGAIN.cloud + SAY_LOADING);
    if (!REDUCE.matches) await book.cloud(AGAIN.cloud);
    if (book) await book.show(entry);
    clearTimeout(saying); dlg.classList.remove('is-loading');
    if (book && playing) play(AGAIN);
  }

  // closing: the close button, a click away, or Escape (the dialog's own cancel). The close event is the usual hook,
  // but it isn't always delivered (a page in a hidden pane may never get it), so every way out tears down directly too
  function teardown() {
    if (!active) return;
    active = playing = false;
    stop();
    book?.destroy(); book = null;
    dlg.classList.remove('is-loading');
    reveal(false);
    btn.focus();
  }
  const shut = () => { dlg.close(); teardown(); };
  btn.addEventListener('click', open);
  again.addEventListener('click', next);
  dlg.addEventListener('cancel', e => { e.preventDefault(); if (playing) finish(); else shut(); });
  // any key skips the intro (but on the close button, closes); Enter or Space that skips doesn't also press the
  // button it's on, and Tab moves on as usual
  dlg.addEventListener('keydown', e => {
    if (!playing || e.key === 'Escape' || e.target.closest('.oracle-close')) return;
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key) || e.ctrlKey || e.altKey || e.metaKey) return;  // a modifier alone, or a shortcut, isn't a skip
    finish();
    if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
  });
  dlg.addEventListener('click', e => {
    if (e.target.closest('.oracle-close')) shut();
    else if (playing) { e.preventDefault(); e.stopPropagation(); finish(); }
    else if (e.detail && book?.wasDrag()) e.stopPropagation();  // the click at the end of a drag (not one from a key)
    else if (!e.target.closest('.oracle-text, .flat-book') && !book?.onBook(e.clientX, e.clientY)) shut();
  }, true);
  dlg.addEventListener('close', () => { if (!dlg.open) teardown(); });  // a late one mustn't end the next prophecy
}

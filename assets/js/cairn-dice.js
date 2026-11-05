// The dice: a Dice pill in the header opens a tray; dice-box rolls 3D dice over the page (loaded on first use, from
// assets/vendor/dice-box/). Dice in the text roll themselves, and in a roll table the row a roll lands on is marked.
// Other scripts (the character builder) roll through the same API:
//   await CairnDice.roll('3d6', {label: 'Strength'})
(() => {
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
if (!$('#diceTray')) return;
const header = $('#main-header');
// ---------- notices: notify('Roll history cleared.') or notify(message, {kind: 'error'})
const notices = $('#notices'), NOTICE_MS = 5000, NOTICE_MAX = 3, NOTICE_ICON = {success: '✓', error: '!', info: 'i'};
const liveNotices = () => [...notices.querySelectorAll('.notice:not(.is-leaving)')];
// re-showing a manual popover puts it back on top, over a drawer or modal opened since; hiding it drops focus, so it's put back
function restackNotices() {
  const open = notices.matches(':popover-open');
  if (!liveNotices().length) { if (open) notices.hidePopover(); return; }
  const had = notices.contains(document.activeElement) && document.activeElement;
  if (open) notices.hidePopover();
  notices.showPopover();
  if (had) had.focus();
}
function dismissNotice(card, animate = true) {
  clearTimeout(card.timer);
  if (card.contains(document.activeElement)) {
    // focus goes back where it was when the notice came, unless that's gone, hidden or behind the builder's modal
    const walk = $('#cbWalk'), shown = el => el?.isConnected && !el.disabled && el.checkVisibility({opacityProperty: true, visibilityProperty: true});
    const tries = [card.from, ...(walk.open ? ['#cbRoll', '#cbNext', '#cbClose'] : ['#diceBtn']).map(q => $(q))]
      .filter(el => shown(el) && el !== document.body && !notices.contains(el) && (!walk.open || walk.contains(el)));
    tries.find(el => { el.focus(); return document.activeElement === el; });
  }
  if (animate) card.classList.add('is-leaving');
  const anims = card.getAnimations();
  Promise.all(anims.map(a => a.finished)).catch(() => {}).then(() => { card.remove(); if (!notices.children.length) restackNotices(); });
  if (!animate) card.classList.add('is-leaving');
}
function notify(message, {kind = 'success'} = {}) {
  // the cards are hidden from screen readers; these always-rendered regions say it (cleared first, so a repeat is heard)
  const say = $(kind === 'error' ? '#noticeAlert' : '#noticeSay');
  // a frame is too short for some screen readers to hear the clear; messages in the same moment are said together
  say.pending = [...(say.pending || []), message]; say.textContent = ''; clearTimeout(say.timer);
  say.timer = setTimeout(() => { say.textContent = say.pending.join(' '); say.pending = []; }, 100);
  for (const old of liveNotices()) if (old.dataset.msg === message) dismissNotice(old, false);
  const card = document.createElement('div');
  card.className = 'notice'; card.dataset.kind = kind; card.dataset.msg = message; card.from = document.activeElement;
  card.innerHTML = '<span class="notice-icon" aria-hidden="true"></span><p aria-hidden="true"></p><button class="btn-icon" type="button">✕</button>';
  card.firstChild.textContent = NOTICE_ICON[kind] || NOTICE_ICON.info;
  card.querySelector('p').textContent = message;
  const x = card.querySelector('button'); x.setAttribute('aria-label', `Dismiss: ${message}`);
  x.addEventListener('click', () => dismissNotice(card));
  card.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dismissNotice(card); } });  // without closing the builder's modal too
  const arm = () => { clearTimeout(card.timer); if (kind !== 'error') card.timer = setTimeout(() => dismissNotice(card), NOTICE_MS); };
  for (const ev of ['pointerenter', 'focusin']) card.addEventListener(ev, () => clearTimeout(card.timer));
  card.addEventListener('pointerleave', () => { if (!card.contains(document.activeElement)) arm(); });
  card.addEventListener('focusout', e => { if (!card.contains(e.relatedTarget) && !card.matches(':hover')) arm(); });
  notices.prepend(card);
  for (const extra of liveNotices().slice(NOTICE_MAX)) dismissNotice(extra, false);
  restackNotices(); arm();
}

// dice-box is served from this site (assets/vendor/dice-box/), next to this script's folder
const DICE_CDN = new URL('../vendor/dice-box/', document.currentScript.src).href;
const SIDES = [4, 6, 8, 10, 12, 20], TYPE_MAX = 10, POOL_MAX = 20, SETTLE_MS = 8000;
// colours sampled from the hero art (the tree's teal and deep purple, the monster's reds), plus a truer red; the tray's Colour choice picks one
const COLOURS = [['Tree teal', '#41697d'], ['Hero deep rose', '#ae3f6c'], ['Tree purple', '#44345c'], ['Blood red', '#b3122e']];
const tray = $('#diceTray'), toast = $('#diceToast'), stage = $('#diceStage'), isOpen = () => tray.matches(':popover-open');
let box = null, boxLoad = null, offline = false;
let clearTimer = 0, toastTimer = 0, onTable = false, last = null, seq = 0, queue = Promise.resolve();
// the drawer's open state, the 3D switch and the history are kept between visits
const OPEN_KEY = 'cairn-dice-open', THREE_D_KEY = 'cairn-dice-3d', HISTORY_KEY = 'cairn-dice-history', COLOUR_KEY = 'cairn-dice-colour', HISTORY_MAX = 50;
const stored = k => { try { return localStorage.getItem(k); } catch { return null; } };
const store = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
let colour = (COLOURS.find(([, c]) => c === stored(COLOUR_KEY)) || COLOURS[0])[1];
document.documentElement.style.setProperty('--dice', colour);
const rolls = [];
try { rolls.push(...(JSON.parse(stored(HISTORY_KEY)) || []).slice(0, HISTORY_MAX)); } catch {}

// notation: '3d6', '1d8+1d6', '2d6+1', or arrays of those or of {sides, qty, modifier}. With highest, a sum of single
// dice and nothing else ('d8+d8', 'd10+d8') keeps the highest die, as Cairn reads a weapon's damage
function parse(request, highest = false) {
  const terms = [], bad = x => new Error(`CairnDice: can't read ${JSON.stringify(x)}. Use notation like 3d6, 1d8+1d6 or 2d6+1.`);
  let modifier = 0;
  const add = (qty, sides, x) => {
    qty = Number(qty); sides = Number(sides);
    if (!Number.isInteger(qty) || !Number.isInteger(sides) || qty < 1 || qty > 50 || sides < 2 || sides > 100) throw bad(x);
    const t = terms.find(t => t.sides === sides); t ? t.qty += qty : terms.push({sides, qty});
  };
  for (const x of Array.isArray(request) ? request : [request]) {
    if (x && typeof x === 'object') { add(x.qty ?? 1, x.sides, x); modifier += Number(x.modifier) || 0; continue; }
    const str = String(x ?? '').replace(/\s+/g, '').toLowerCase().replace(/[−–]/g, '-');
    if (!/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(str)) throw bad(x);
    for (const [, sign, qty, sides, k] of str.matchAll(/([+-]?)(?:(\d*)d(\d+)|(\d+))/g)) {
      if (sides) { if (sign === '-') throw bad(x); add(qty || 1, sides, x); }
      else modifier += (sign === '-' ? -1 : 1) * Number(k);
    }
  }
  if (!terms.length) throw new Error('CairnDice: there are no dice to roll.');
  return {terms, modifier, highest: highest && typeof request === 'string' && /^1?d\d+(?:\+1?d\d+)+$/.test(request.replace(/\s+/g, '').toLowerCase())};
}
const notation = ({terms, modifier}) => terms.map(t => `${t.qty}d${t.sides}`).join('+') + (modifier ? (modifier > 0 ? '+' : '-') + Math.abs(modifier) : '');
const randomDie = sides => { const a = new Uint32Array(1), lim = Math.floor(2 ** 32 / sides) * sides; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % sides + 1; };
const hasWebGL = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } };

// dice-box loads once, on the tray's first open or the first roll; without WebGL, or offline, rolls fall back to plain random numbers
function loadBox() {
  if (!boxLoad) boxLoad = (async () => {
    if (!hasWebGL()) return null;
    const {default: DiceBox} = await import(DICE_CDN + 'dice-box.es.min.js');
    const b = new DiceBox({container: '#diceStage', origin: DICE_CDN, assetPath: 'assets/', theme: 'default', themeColor: colour, scale: 4});
    await b.init();
    return b;
  })().then(b => (box = b), err => { offline = true; console.warn('CairnDice: 3D dice unavailable, rolling without them.', err); return null; });
  return boxLoad;
}
// with fade, the dice fade out and stay, unseen, until the next roll (dice-box's roll() clears the table first)
function clearTable(fade = false) {
  clearTimeout(clearTimer);
  if (fade && onTable && !REDUCE.matches) { onTable = false; stage.classList.add('dice-fade'); return; }
  onTable = false; if (box) box.clear();
}

// rolls run one at a time: dice-box drops a roll still in flight when a new one starts
// record: into the history (the builder's rolls aren't); detail: a line for the result, given the total (a table's row)
function roll(request, {label = '', show3d = use3d(), highest = false, record = !walking(), detail = null} = {}) {
  let parsed;
  try { parsed = parse(request, highest); } catch (err) { return Promise.reject(err); }
  const run = async () => {
    clearTimeout(clearTimer);
    const b = show3d && !REDUCE.matches ? (box || (showStatus('Loading dice…', true), await loadBox())) : null;
    let dice;
    if (b) {
      const rolling = b.roll(parsed.terms.map(({sides, qty}) => ({sides, qty})));
      stage.classList.remove('dice-fade');  // only after b.roll() has queued its clear, so the faded dice can't flash back
      const out = await rolling;
      dice = out.map(d => ({sides: Number(String(d.sides).replace(/\D/g, '')), value: d.value}));
      onTable = true; clearTimer = setTimeout(clearTable, SETTLE_MS);
    } else {
      dice = parsed.terms.flatMap(({sides, qty}) => Array.from({length: qty}, () => ({sides, value: randomDie(sides)})));
    }
    const groups = parsed.terms.map(({sides}) => { const values = dice.filter(d => d.sides === sides).map(d => d.value);
      return {sides, qty: values.length, values, subtotal: values.reduce((n, v) => n + v, 0)}; });
    const total = parsed.highest ? Math.max(...dice.map(d => d.value)) : groups.reduce((n, g) => n + g.subtotal, 0) + parsed.modifier;
    const result = {id: `roll-${++seq}`, label, notation: parsed.highest ? parsed.terms.flatMap(t => Array(t.qty).fill(`d${t.sides}`)).join('+') : notation(parsed),
      total, mode: parsed.highest ? 'highest' : 'sum', detail: detail ? detail(total) : '',
      modifier: parsed.modifier, dice, groups, method: b ? '3d' : 'random', fallback: show3d && !b ? (offline ? 'offline' : 'plain') : '', rolledAt: new Date().toISOString()};
    last = parsed;
    if (record) { rolls.unshift(result); rolls.length = Math.min(rolls.length, HISTORY_MAX); store(HISTORY_KEY, JSON.stringify(rolls)); }
    document.dispatchEvent(new CustomEvent('cairn-dice:rolled', {detail: result}));
    return result;
  };
  const p = queue.then(run, run);
  queue = p.catch(() => {});
  return p;
}

// ---------- the tray
// flat silhouettes: the shape says how many sides; the number is the same size on every die
const shapes = {
  4: '<polygon class="shape" points="24,4 45,42 3,42"/><text class="num" x="24" y="27">4</text>',
  6: '<rect class="shape" x="6" y="6" width="36" height="36" rx="5"/><text class="num" x="24" y="24">6</text>',
  8: '<polygon class="shape" points="24,2 46,24 24,46 2,24"/><text class="num" x="24" y="24">8</text>',
  10: '<polygon class="shape" points="24,2 45,21 24,46 3,21"/><text class="num" x="24" y="23">10</text>',
  12: '<polygon class="shape" points="24,3 45,18 37,44 11,44 3,18"/><text class="num" x="24" y="26">12</text>',
  20: '<polygon class="shape" points="24,2 44,13 44,35 24,46 4,35 4,13"/><text class="num" x="24" y="24">20</text>',
};
const pool = new Map(SIDES.map(n => [n, 0]));
const ICON_MINUS = '<svg class="i-minus" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const ICON_BIN = '<svg class="i-trash" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
$('#diceGrid').innerHTML = SIDES.map(n => `<li data-sides="${n}"><button class="die-add" type="button"><svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">${shapes[n]}</svg></button>`
  + `<div class="die-qty" role="group" aria-label="d${n} count" hidden><button class="die-minus" type="button">${ICON_MINUS}${ICON_BIN}</button><button class="die-count" type="button" aria-expanded="false"></button>`
  + `<button class="die-plus" type="button" aria-label="Add another d${n}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button></div></li>`).join('');
$('#diceColours').innerHTML = COLOURS.map(([name, c]) => `<label><input type="radio" name="dice-colour" value="${c}"${c === colour ? ' checked' : ''}><span class="sw" style="--c:${c}"></span>${name}</label>`).join('');
const poolTerms = () => SIDES.filter(n => pool.get(n)).map(n => ({sides: n, qty: pool.get(n)}));
const poolSize = () => [...pool.values()].reduce((a, b) => a + b, 0), poolFull = n => pool.get(n) >= TYPE_MAX || poolSize() >= POOL_MAX;
const cell = n => tray.querySelector(`#diceGrid li[data-sides="${n}"]`), field = $('#diceExpr');
let editing = null, collapseTimer = 0;  // the die whose stepper is open
function edit(n) {
  editing = n; clearTimeout(collapseTimer);
  for (const li of tray.querySelectorAll('#diceGrid li')) { const on = +li.dataset.sides === n; li.classList.toggle('is-editing', on); li.querySelector('.die-count').setAttribute('aria-expanded', String(on)); }
  // like a cart's stepper it folds back to the count after a moment, unless a keyboard user is in it (they close it with Escape or Tab)
  if (n !== null) collapseTimer = setTimeout(() => {
    const qty = cell(n).querySelector('.die-qty');
    if (qty.querySelector(':focus-visible')) return;
    const inside = qty.contains(document.activeElement); edit(null);
    if (inside) qty.querySelector('.die-count').focus();
  }, 500);
}
function renderPool() {
  for (const n of SIDES) {
    const k = pool.get(n), li = cell(n), qty = li.querySelector('.die-qty'), count = li.querySelector('.die-count'), minus = li.querySelector('.die-minus'), plus = li.querySelector('.die-plus');
    li.querySelector('.die-add').setAttribute('aria-label', `Add a d${n}${k ? `, ${k} in the pool` : ''}`);
    qty.hidden = !k; count.textContent = k; count.setAttribute('aria-label', `d${n} count, ${k} in the pool`);
    minus.toggleAttribute('data-one', k <= 1); minus.setAttribute('aria-label', k > 1 ? `Remove one d${n}, ${k} in the pool` : `Remove the d${n} from the pool`);
    plus.setAttribute('aria-disabled', String(poolFull(n)));
  }
  const terms = poolTerms(), atEnd = body.scrollHeight - body.scrollTop - body.clientHeight < 4;
  $('#dicePool').textContent = terms.map(t => `${t.qty}d${t.sides}`).join(' + ');
  $('#dicePoolClear').hidden = !terms.length;
  $('#diceSend').disabled = !terms.length && !field.value.trim();
  if (atEnd) toEnd(false);  // the pool line comes and goes, resizing the history
}
// a result is a message in the drawer's history; while the drawer is closed it's a card under the pill until the dice
// clear. A status ("Loading dice…") takes the pool line while the drawer is open
function show(html, keep, status) {
  if (isOpen()) { if (status) $('#dicePool').textContent = status; return; }
  // in the builder's walkthrough the 3D dice and its footer are enough: no card. A status during its own roll ("Loading
  // dice…") shows in the footer until the roll's result replaces it
  if (walking()) { hideToast(); if (status) window.CairnBuilderStatus?.(status); return; }
  toast.innerHTML = html; toast.hidden = false; place();
  clearTimeout(toastTimer); if (!keep) toastTimer = setTimeout(hideToast, SETTLE_MS);
}
// inside the character builder's walkthrough (a modal), the header's pill is out of reach: its Roll button stands in
const walking = () => !!toast.closest('dialog[open]'), pill = () => walking() ? $('#cbRoll') : $('#diceBtn');
function hideToast() { clearTimeout(toastTimer); if (toast.contains(document.activeElement)) pill().focus(); toast.hidden = true; }
const showStatus = (text, keep) => show(`<p class="dice-note">${esc(text)}</p>`, keep, text);
const fallbackText = f => f === 'offline' ? '3D dice need an internet connection, so this was rolled without them.' : f ? 'Rolled without 3D dice.' : '';
const valuesOf = r => { const parts = r.groups.map(g => `d${g.sides}: ${g.values.join(', ')}`);
  if (r.modifier) parts.push(`${r.modifier > 0 ? '+' : '−'}${Math.abs(r.modifier)}`); return parts.join(' · '); };
function showResult(r) {
  const why = fallbackText(r.fallback);
  show((r.label ? `<p class="dice-label">${esc(r.label)}</p>` : '') +
    `<p class="dice-total">${r.mode === 'highest' ? 'Highest' : 'Total'} ${r.total}</p><p>${esc(valuesOf(r))}</p>` + (r.detail ? `<p>${esc(r.detail)}</p>` : '') + (why ? `<p class="dice-note">${esc(why)}</p>` : ''));
}
// the history is a chat: oldest first, the newest at the foot. A roll appends one message, so a screen reader hears only it
const body = $('#diceBody'), hist = $('#diceHist');
const clock = iso => new Date(iso).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
const message = r => `<li class="dice-msg"><span class="what">${esc([r.label, (r.mode === 'highest' ? 'highest of ' : '') + r.notation].filter(Boolean).join(' · '))}</span>`
  + `<span class="total">${r.total}</span><span class="how">${esc(valuesOf(r))}</span>` + (r.detail ? `<span class="how">${esc(r.detail)}</span>` : '')
  + (r.fallback ? `<span class="note">${esc(fallbackText(r.fallback))}</span>` : '') + `<span class="time">${clock(r.rolledAt)}</span></li>`;
const toEnd = smooth => body.scrollTo({top: body.scrollHeight, behavior: smooth && !REDUCE.matches ? 'smooth' : 'auto'});
function renderHistory() {
  hist.innerHTML = rolls.slice().reverse().map(message).join('');
  $('#diceHistNone').hidden = !!rolls.length; toEnd(false);
}
// a new roll appends its message (renderHistory redraws the whole list, on load and on Clear), so nothing is re-announced
document.addEventListener('cairn-dice:rolled', e => {
  showResult(e.detail); renderPool();
  if (rolls[0] !== e.detail) return;  // the builder's rolls aren't kept
  setView('rolls');
  hist.insertAdjacentHTML('beforeend', message(e.detail));
  while (hist.children.length > HISTORY_MAX) hist.firstElementChild.remove();
  $('#diceHistNone').hidden = true; toEnd(true);
});

// tapping a die adds one and opens its stepper; the badge opens it without adding. It closes on a click or
// Tab elsewhere, on Escape, after half a second untouched, or when the die's count reaches 0
function bump(n, by) {
  if (by > 0 && poolFull(n)) { showStatus(`Up to ${TYPE_MAX} of each die, ${POOL_MAX} in all.`); return; }
  pool.set(n, Math.max(0, pool.get(n) + by));
  renderPool(); void cell(n).offsetWidth;  // lay out the circle first, so the stepper grows out of it
  edit(pool.get(n) ? n : null);
  if (!pool.get(n)) cell(n).querySelector('.die-add').focus();
}
tray.addEventListener('click', e => {
  const hit = e.target.closest('.die-add, .die-count, .die-plus, .die-minus');
  if (!hit) return;
  const n = +hit.closest('li').dataset.sides;
  if (hit.matches('.die-count')) edit(editing === n ? null : n);
  else bump(n, hit.matches('.die-minus') ? -1 : 1);
});
// pointing at a die's gold count opens its stepper (without adding); pointing at the stepper holds it open; pointing at the die itself does neither
tray.addEventListener('pointerover', e => {
  const qty = e.pointerType === 'mouse' && e.target.closest('.die-qty'), n = qty && +qty.closest('li').dataset.sides;
  if (n && editing !== n) edit(n);
  if (editing !== null && qty) clearTimeout(collapseTimer);
});
tray.addEventListener('pointerout', e => { if (editing !== null && e.target.closest('.die-qty') && !e.relatedTarget?.closest('.die-qty')) edit(editing); });
document.addEventListener('pointerdown', e => { if (editing !== null && !e.target.closest('#diceGrid li.is-editing')) edit(null); });
tray.addEventListener('focusout', e => { if (editing !== null && e.relatedTarget && !e.relatedTarget.closest('li.is-editing')) edit(null); });
// the 3D switch; it's off, with the reason, where 3D dice can't run
const sw = $('#dice3d'), use3d = () => sw.checked && !sw.disabled, narrow = () => document.documentElement.clientWidth < 760;
function setSwitch() {
  const off = REDUCE.matches ? 'Off because your device is set to reduce motion.' : !hasWebGL() ? 'Off because this browser can’t show 3D graphics.' : '';
  sw.disabled = !!off; sw.checked = !off && stored(THREE_D_KEY) !== '0'; $('#dice3dWhy').textContent = off; $('#dice3dWhy').hidden = !off;
}
sw.addEventListener('change', () => { store(THREE_D_KEY, sw.checked ? null : '0'); sw.checked ? loadBox() : clearTable(); });
REDUCE.addEventListener('change', setSwitch);
setSwitch();
// a roll from the drawer keeps it open, except on a phone with 3D dice, where it covers the page: it steps aside for the
// dice, and the result appears under the pill
function rollHere(request, opts) {
  if (use3d() && narrow()) tray.hidePopover();
  return roll(request, {show3d: use3d(), ...opts}).catch(err => showStatus(err.message));
}
// Roll sends the field's text if it has any, otherwise the picked dice
$('#diceType').addEventListener('submit', e => {
  e.preventDefault();
  const err = $('#diceExprErr'), x = field.value.trim();
  if (!x) { const terms = poolTerms(); if (terms.length) rollHere(terms); return; }
  let bad = ''; try { parse(x); } catch { bad = `Can’t read “${x}”. Type dice like 2d6+1 or d8+d8.`; }
  bad ? field.setAttribute('aria-invalid', 'true') : field.removeAttribute('aria-invalid'); err.textContent = bad; err.hidden = !bad;
  if (bad) { field.focus(); return; }
  field.value = ''; renderPool(); rollHere(x, {highest: true});
});
field.addEventListener('input', () => { const err = $('#diceExprErr'); field.removeAttribute('aria-invalid'); err.hidden = true; err.textContent = ''; renderPool(); });
$('#dicePoolClear').addEventListener('click', () => { for (const n of SIDES) pool.set(n, 0); edit(null); renderPool(); clearTable(); hideToast(); tray.querySelector('.die-add').focus(); });
toast.addEventListener('click', () => { focusOnOpen = true; tray.showPopover(); saveOpen(); });
// the gear swaps the history for Settings, and Back (the same button) swaps it back
function setView(v, moveFocus) {
  if (tray.dataset.view === v) return;
  const settings = v === 'settings', back = $('#diceSettingsBtn');
  const hadFocus = $('#diceSettings').contains(document.activeElement);
  edit(null); tray.dataset.view = v;
  $('#diceChat').hidden = $('#diceFoot').hidden = settings; $('#diceSettings').hidden = !settings;
  $('#diceTitle').textContent = settings ? 'Settings' : 'Dice';
  back.setAttribute('aria-label', settings ? 'Back to rolls' : 'Dice settings');
  if (settings) $('#diceSettings').querySelector('input:not(:disabled)').focus();
  else { toEnd(false); if (moveFocus && hadFocus) back.focus(); }
}
$('#diceSettingsBtn').addEventListener('click', () => setView(tray.dataset.view === 'settings' ? 'rolls' : 'settings'));
$('#diceHistClear').addEventListener('click', () => {
  rolls.length = 0; store(HISTORY_KEY, null); renderHistory();
  notify('Roll history cleared.');
});
$('#diceColours').addEventListener('change', e => {
  colour = e.target.value; document.documentElement.style.setProperty('--dice', colour); store(COLOUR_KEY, colour);
  if (box) box.updateConfig({themeColor: colour});
  // the colour applies to the next roll; re-roll what's on the table so it shows at once
  if (onTable && last) roll(last.terms.map((t, i) => i ? t : {...t, modifier: last.modifier}));
});

// the result card hangs under the header, right-aligned with its content (the drawer fills the window; this only clears what the builder's walkthrough set on it)
function place() {
  if (walking()) { for (const el of [tray, toast]) { el.style.top = '16px'; el.style.right = '16px'; } tray.style.maxHeight = `${innerHeight - 28}px`; return; }
  const wrap = header.querySelector('.wrap'), w = wrap.getBoundingClientRect(), vw = document.documentElement.clientWidth;
  const foot = Math.round(Math.max(0, header.getBoundingClientRect().bottom));
  toast.style.top = `${foot + 6}px`; toast.style.right = vw >= 760 ? `${Math.round(vw - (w.right - parseFloat(getComputedStyle(wrap).paddingRight)))}px` : '';
  tray.style.top = tray.style.right = tray.style.maxHeight = '';
}
addEventListener('scroll', () => { if (isOpen() || !toast.hidden) place(); }, {passive: true});
addEventListener('resize', () => { if (isOpen() || !toast.hidden) place(); });
// the drawer is a manual popover, so the page stays usable while it's open: the pill opens and closes it, and so do
// its close button and Escape, returning focus to the pill. It stays open from page to page, and from visit to visit
let focusOnOpen = false;
const saveOpen = () => store(OPEN_KEY, isOpen() ? '1' : null);  // only on the reader's own open and close, never a move
// focus goes back to what opened it: a die in the text, or the Dice pill
let opener = null;
function collapse() { setView('rolls'); tray.hidePopover(); saveOpen(); (opener?.isConnected ? opener : $('#diceBtn')).focus(); opener = null; }
$('#diceBtn').addEventListener('click', () => { focusOnOpen = !isOpen(); setTimeout(saveOpen); });  // the pill's own toggle runs after this
$('#diceCollapse').addEventListener('click', collapse);
tray.addEventListener('beforetoggle', e => {  // before it's shown, so it never paints unplaced
  if (e.newState !== 'open') return;
  hideToast(); place();
  if (use3d()) loadBox();
});
tray.addEventListener('toggle', e => {
  if (e.newState !== 'open') setTimeout(() => { opener = null; });  // after collapse() has used it
  if (e.newState === 'open') { toEnd(false); if (focusOnOpen) tray.querySelector('.die-add').focus(); focusOnOpen = false; restackNotices(); }  // notices still up go back above it
  else { edit(null); setView('rolls'); if (!walking() && document.activeElement === document.body) pill().focus(); }
  if (box && !walking()) dispatchEvent(new Event('resize'));  // the dice table narrows and widens with the drawer
});
// capture phase: keeps the page's own Escape handler (which would move focus to Menu) from seeing the tray's Escape
// Escape also clears the result card while it shows
// Escape closes the topmost layer: the open stepper, then Settings, then the drawer
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.target.closest?.('#notices')) return;  // a notice's Escape closes only it
  if (isOpen() && tray.contains(e.target)) {
    e.stopPropagation();
    if (editing !== null) { const n = editing; edit(null); cell(n).querySelector('.die-add').focus(); }
    else if (tray.dataset.view === 'settings') setView('rolls', true);
    else collapse();
  } else if (!toast.hidden) hideToast();
}, true);
// the builder's walkthrough takes the tray in while it's open; when it closes, the drawer comes back as the reader left it
const reopen = () => { if (stored(OPEN_KEY) === '1' && !walking() && !isOpen()) tray.showPopover(); };
$('#cbWalk')?.addEventListener('close', reopen);  // after the builder's own close listener, which moves the tray back

// ---------- a die in the text rolls itself; in a roll table's header, the row it lands on is marked
const headingBefore = el => {
  for (let n = el; n && n !== document.body; n = n.parentElement)
    for (let p = n.previousElementSibling; p; p = p.previousElementSibling) {
      const h = p.matches('h1,h2,h3,h4,h5,h6') ? p : [...p.querySelectorAll('h1,h2,h3,h4,h5,h6')].pop();
      if (h) return h.textContent.trim();
    }
  return '';
};
// a cell's own text, without the builder's hidden "Your roll:" prefix
const cellText = c => [...c.childNodes].filter(x => !x.classList?.contains('sr-only')).map(x => x.textContent).join('');
// "1", "1-3", "1–3", "5+" or, on a d100, "96-00"
const keyHas = (key, n) => {
  const k = key.replace(/\s+/g, '').replace(/[–—]/g, '-'), num = x => x === '00' ? 100 : +x;
  let m;
  if ((m = k.match(/^(\d+)-(\d+)$/))) return n >= num(m[1]) && n <= num(m[2]);
  if ((m = k.match(/^(\d+)\+$/))) return n >= num(m[1]);
  return /^\d+$/.test(k) && num(k) === n;
};
function rollLabel(btn, table, head) {
  if (table) return table.caption?.textContent.trim() || (head && table.tHead.rows[0].cells[1]?.innerText.split('\n')[0].trim()) || headingBefore(table);
  // a stat line's attack: "flaming sword (d10)" is the creature's flaming sword
  const before = (btn.previousSibling?.textContent || '').trim(), weapon = before.endsWith('(') ? before.slice(0, -1).split(/,|\bor\b/).pop().trim() : '';
  return [headingBefore(btn), weapon].filter(Boolean).join(' · ');
}
// the dice in the text are jekyll-dice-tray's links (<a class="dice-tray-roll" data-dice="2d6">; its own tray is
// switched off in _config.yml); a roll table is one whose header's first cell is a die ("d6")
for (const t of document.querySelectorAll('.prose table')) {
  const m = t.tHead?.rows[0]?.cells[0]?.textContent.trim().toLowerCase().match(/^1?d(\d+)$/);
  if (m && SIDES.includes(+m[1])) t.dataset.die = 'd' + m[1];
}
for (const a of document.querySelectorAll('a.dice-tray-roll')) { a.setAttribute('role', 'button'); a.setAttribute('aria-label', `Roll ${a.textContent.trim()}`); a.dataset.roll = (a.dataset.dice || a.textContent).replace(/\s+/g, '').toLowerCase(); }
document.addEventListener('keydown', e => { if (e.key === ' ' && e.target.matches?.('a.dice-tray-roll')) { e.preventDefault(); e.target.click(); } });
document.addEventListener('click', e => {
  const btn = e.target.closest('a.dice-tray-roll, button.roll');
  if (!btn) return;
  e.preventDefault();
  if (walking()) return;
  // "2-in-6": roll the die; it succeeds on that number or under
  const chance = btn.dataset.roll.match(/^(\d+)-in-(\d+)$/);
  if (chance) {
    if (!isOpen() && !(use3d() && narrow())) { opener = btn; tray.showPopover(); }
    const [, k, n] = chance;
    roll('d' + n, {label: [headingBefore(btn), btn.dataset.roll].filter(Boolean).join(' · '), show3d: use3d(), detail: v => v <= +k ? 'Success' : 'Failure'})
      .catch(err => showStatus(err.message));
    return;
  }
  const table = btn.closest('table'), inHead = table?.dataset.die && btn.closest('thead') && btn.dataset.roll.replace(/^1d/, 'd') === table.dataset.die;
  const rowOf = n => inHead ? [...table.tBodies[0].rows].find(tr => keyHas(cellText(tr.cells[0]), n)) : null;
  if (!isOpen() && !(use3d() && narrow())) { opener = btn; tray.showPopover(); }  // on a phone, 3D dice and the result card show instead
  roll(btn.dataset.roll, {label: rollLabel(btn, table, inHead), show3d: use3d(), highest: true,
    detail: inHead && (n => { const tr = rowOf(n); return tr ? [...tr.cells].slice(1).map(c => c.textContent.trim()).join(' · ').slice(0, 160) : ''; })})
    .then(r => {
      if (!inHead) return;
      table.querySelector('tr.hit')?.classList.remove('hit');
      const tr = rowOf(r.total);
      if (tr) { tr.classList.add('hit'); tr.scrollIntoView({block: 'nearest', behavior: REDUCE.matches ? 'auto' : 'smooth'}); }
    }, err => showStatus(err.message));
});
renderPool();
renderHistory();
reopen();

window.CairnNotify = notify;
window.CairnRestackNotices = restackNotices;
window.CairnDice = Object.freeze({roll, clear: ({fade = false} = {}) => clearTable(fade), open: () => isOpen() || tray.showPopover(), close: () => isOpen() && tray.hidePopover(), get history() { return rolls.slice(); }});
})();

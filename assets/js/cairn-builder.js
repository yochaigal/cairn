// The character builder: "Roll a Character right now!" on Character Creation. A walkthrough rolls each step in turn,
// fills the official Fillable Letter sheet (pdf-lib, loaded on first use from assets/vendor/pdf-lib/) and prints it.
// Its data is read from Character Creation and the background pages at build time (_plugins/cairn_builder.rb) and
// sits in the page as JSON. Rolls go through the dice (assets/js/cairn-dice.js, window.CairnDice).
(() => {
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);
const li = (...xs) => xs.map(x => `<li>${x}</li>`).join('');
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
const dataEl = $('#cairnBuilderData'), PROSE = $('.rules-main .prose');
if (!dataEl || !PROSE || !window.CairnDice) return;
const CB = JSON.parse(dataEl.textContent), CB_KEY = 'cairn-builder';
const BASE = dataEl.dataset.base, here = document.currentScript.src;
const CARD_IMG = new URL('../redesign/builder/cards/', here).href, SHEETS = new URL('../redesign/builder/sheets/', here).href;
const PDF_LIB = new URL('../vendor/pdf-lib/pdf-lib.min.js', here).href;
const notices = $('#notices');
const notify = (...a) => window.CairnNotify(...a), restackNotices = () => window.CairnRestackNotices?.();
// the builder's additions to the page: the background panel, the rolled rows' highlights and the review card
function renderPage() {
  for (const el of PROSE.querySelectorAll('#cbPanel, #cbReview, .cb-sr')) el.remove();
  for (const el of PROSE.querySelectorAll('.cb-hit')) el.classList.remove('cb-hit');
  builderDecorate();
}
// ---------- character builder
let cb = null;  // {i: step index, v: {step id: rolled total}, edits: {review field: text}, sheet, sheetPicked, active, grown, allTraits}
try { cb = JSON.parse(localStorage.getItem(CB_KEY)); } catch {}
const NO_CHAR = {slots: [], petty: [], traits: [], bonds: [], notes: []};  // before the first roll
const cbSwapped = () => `Swapped ${cb.v.swap.map(k => k.toUpperCase()).join(' and ')}`;
const cbSave = () => { try { cb ? localStorage.setItem(CB_KEY, JSON.stringify(cb)) : localStorage.removeItem(CB_KEY); } catch {} };
const ccEl = id => document.getElementById(id);  // kramdown's heading ids on Character Creation
const cbBg = () => cb?.v.bg ? CB.backgrounds[cb.v.bg - 1] : null;
const cbRow = t => { const b = cbBg(); return b && cb.v['t' + t] ? b.tables[t].rows[cb.v['t' + t] - 1] : null; };
const cbBond = k => cb.v[k] ? CB.bonds[cb.v[k] - 1] : null;
const TYPED = ['name', 'age'];  // the steps with a type-your-own field
const CB_AGE_MSG = 'Type the age in digits, like 34.';  // the Age step's and a phone review's error
// an Age field holds digits or nothing: marks it invalid, and says the message once when it appears (a live region); true if bad
function cbAgeCheck(input, err) {
  const bad = !/^\d*$/.test(input.value.trim()), say = bad ? CB_AGE_MSG : '';
  if (bad) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', err.id); } else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
  if (err.textContent !== say) err.textContent = say;
  return bad;
}
const cbTyped = id => (cb.edits?.[id] || '').trim();  // what the player typed for one (or edited at the review)
const cbTraitsIn = v => CB.traits.filter((t, i) => v?.[i]).length;
const cbAge = () => cbTyped('age') || cb.v.age || '';  // typed (or edited at the review) beats rolled
const cbFx = () => [cbBg(), cbRow(0), cbRow(1), cbBond('bond'), cbBond('bond2')].map(x => x?.fx).filter(Boolean);
const tableAfter = h => { for (let el = h?.nextElementSibling; el && !/^H[1-6]$/.test(el.tagName); el = el.nextElementSibling) { const t = el.matches('table') ? el : el.querySelector('table'); if (t) return t; } return null; };
// a d-table written as column pairs (| d20 | Background | d20 | Background |): the rolled number's cell and its entry
const pairCells = (table, n) => { for (const r of table ? table.tBodies[0].rows : []) { const c = [...r.cells]; for (let i = 0; i < c.length - 1; i += 2) if (c[i].textContent.trim() === String(n)) return [c[i], c[i + 1]]; } return []; };
const rowCells = (table, n) => { const r = table?.tBodies[0].rows[n - 1]; return r ? [...r.cells] : []; };
const ATTR = [['str', 'Strength (STR)'], ['dex', 'Dexterity (DEX)'], ['wil', 'Willpower (WIL)']];
const firstSentence = t => (t || '').split(/(?<=[.!?])\s/)[0];
// each step: what to roll, a line saying so (tip), and the sheet fields it fills (fill),
// which wait highlighted on the stage
const bondStep = (id, label, tip) => ({id, label, tip, dice: '1d20', fill: ['bonds'], hit: n => rowCells(tableAfter(ccEl('bonds')), n), say: n => firstSentence(CB.bonds[n - 1].text)});
function cbSteps() {
  const fx = cb ? cbFx() : [], b = cbBg();
  const s = [{id: 'bg', label: 'Background', tip: 'Roll a d20: the number picks your background from the table.', dice: '1d20', fill: ['background'],
    hit: n => pairCells(tableAfter(ccEl('backgrounds')), n), say: n => CB.backgrounds[n - 1].name}];
  // the background's own area first: what you fight with, your gear and gold, then its tables (the first on Inventory, the
  // second on Notes), so the sheet's focus moves through one area at a time
  s.push({id: 'arms', label: 'Armor and weapon', tip: 'What you fight and protect yourself with. It’s already on your sheet.', fill: [],
    hit: () => []});
  s.push({id: 'gold', label: 'Gold', tip: 'Roll 3d6 for your gold. Your background’s gear is already on your sheet.', dice: '3d6', fill: ['gold'],
    hit: () => [], say: n => n + 'gp'});
  for (const t of [0, 1]) s.push({id: 't' + t, area: t ? 'notes' : 'inv', label: b ? b.tables[t].title.replace(/\s*Roll 1d6:?$/i, '') : 'Background table', tip: 'Roll a d6 on your background’s table. What it gives you goes on your sheet.',
    dice: '1d6', fill: [], hit: n => rowCells(tableAfter($('#cb-t' + t)), n), say: n => b.tables[t].rows[n - 1].text.split(/(?<=[.!?])\s|\s—\s/)[0]});
  for (const [k, l] of ATTR) s.push({id: k, label: l, tip: `Roll 3d6 for your ${l.replace(/ \(.*/, '')}.`, dice: '3d6', fill: [k], hit: () => [], say: n => String(n)});
  s.push({id: 'swap', kind: 'swap', label: 'Swap two attributes?', tip: 'You may swap any two attributes, or keep them as rolled.', fill: [], hit: () => []});
  s.push({id: 'hp', label: 'Hit Protection', tip: 'Roll a d6 for your Hit Protection (HP).', dice: '1d6', fill: ['hp'], hit: () => [], say: n => n + ' HP'});
  if (fx.some(f => f.hp)) s.push({id: 'hp2', label: 'Bonus HP (from your background)', tip: 'Your background adds a d4 to your HP.', dice: '1d4', fill: ['hp'],
    hit: () => [], say: n => '+' + n + ' HP'});
  // the traits: all eight in one 8d10 (one die per table, in the book's order), or with the toggle off one d10 at a time
  const all = cb?.allTraits !== false, next = CB.traits.findIndex((t, i) => !cb?.v.traits?.[i]);
  s.push({id: 'traits', label: 'Traits', dice: all ? '8d10' : '1d10', fill: CB.traits.map((t, i) => 'traits.' + i),
    tip: all ? 'Roll 8d10: one die for each trait table, in order from Physique to Vice.' : next < 0 ? 'All eight rolled. Roll again to start over.'
      : `Roll a d10 for ${CB.traits[next].name}: one table at a time, Physique to Vice.`,
    hit: v => CB.traits.flatMap((t, i) => pairCells(tableAfter(ccEl(t.name.toLowerCase())), v[i])),
    say: v => { const n = cbTraitsIn(v); return n === 8 && all ? '8 traits rolled: they’re on your sheet' : all ? `${n} of 8 traits rolled` : `${CB.traits[n - 1].name}: ${CB.traits[n - 1].values[v[n - 1] - 1]}`; }});
  s.push({id: 'age', label: 'Age', tip: 'Roll 2d20 and add 10 for your age, or type your own.', dice: '2d20+10', fill: ['traits.8'], hit: () => [], say: n => n + ' years old'});
  s.push(bondStep('bond', 'Bond', 'Roll a d20 for a bond: someone or something that ties you to the world.'));
  if (fx.some(f => f.bonds)) s.push(bondStep('bond2', 'Second bond (from your background)', 'Your background gives you a second bond. Roll another d20.'));
  const forced = fx.some(f => f.omen);
  s.push({id: 'omen', label: forced ? 'Omen (your background calls for one: keep it to yourself)' : 'Omen (if you are the youngest)', dice: '1d20', optional: !forced, fill: ['omen'],
    tip: forced ? 'Roll a d20 for an omen. Only you and the Warden should know it.' : 'Only the youngest character in your group rolls an omen. Otherwise, skip it.',
    hit: n => rowCells(tableAfter(ccEl('omens')), n), say: n => firstSentence(CB.omens[n - 1].text)});
  s.push({id: 'name', label: 'Name', tip: 'Roll a d10 for your name, from your background’s list, or type your own.', dice: '1d10', fill: ['name'],
    hit: n => [document.querySelectorAll('#cb-names-list li')[n - 1]], say: n => b.names[n - 1]});
  s.push({id: 'review', kind: 'review', label: 'Review and print', tip: 'Your sheet is filled in. Change anything on it, then print it.', hit: () => []});
  return s;
}
const cbAttrs = () => { const a = {str: cb.v.str, dex: cb.v.dex, wil: cb.v.wil}, sw = cb.v.swap; if (sw) [a[sw[0]], a[sw[1]]] = [a[sw[1]], a[sw[0]]]; return a; };

// an item as the sheet writes it: its name and first bracket, without "petty" or "bulky"
const cbItemLabel = it => (it.full ? it.full.replace(/^([^(]*\([^)]*\)).*$/, '$1') : it.name).replace(/,?\s*_?(petty|bulky)_?(?=\s*[,)])/gi, '').replace(/\(\s*,\s*/g, '(').replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').trim();
const WEAPON = /\(\s*(d(?:4|6|8|10|12)[^,)]*)/;
const cbWeapons = b => b.items.flatMap(it => {
  if (it.from_table) return [`${it.name} (from your tables)`];
  const m = (it.full || '').match(WEAPON); return m ? [`${it.name} · ${m[1].trim()}`] : []; });
// ---------- the character, as sheet values
function cbCharacter() {
  const b = cbBg(), fx = cbFx(), a = cbAttrs(), out = {warnings: [], notes: []};
  if (!b) return null;
  out.name = b.names[cb.v.name - 1] || ''; out.background = b.name;  // the sheet's Name stays blank until it's rolled
  out.str = a.str || ''; out.dex = a.dex || ''; out.wil = a.wil || '';
  out.hp = (cb.v.hp || 0) + (cb.v.hp2 || 0) || '';
  const gold = (cb.v.gold || 0) + fx.reduce((x, f) => x + (f.gold || 0), 0);
  out.gold = gold || '';
  // items: the gear (its "Bow (see table)" filled from the table), then what each rolled result and bond hands out
  const bow = [cbRow(0), cbRow(1)].filter(Boolean).flatMap(r => r.fx.bow ? r.fx.items : []);
  const items = [...b.items.flatMap(g => g.from_table ? bow : [g]), ...fx.flatMap(f => f.bow ? [] : (f.items || []))];
  const label = cbItemLabel;
  out.slots = []; out.petty = [];
  for (const it of items) { if (it.petty) out.petty.push(label(it)); else { out.slots.push(label(it)); if (it.bulky) out.slots.push('(bulky)'); } }
  if (gold >= 100) out.slots.push(`Coins (${gold}gp)`);  // 100gp or more isn't petty any more (Inventory Slots)
  out.armor = Math.min(3, items.reduce((x, it) => x + (it.armor || 0), 0) + fx.reduce((x, f) => x + (f.armor || 0), 0)) || '';
  out.traits = CB.traits.map((t, i) => ({label: t.name, value: cb.v.traits?.[i] ? t.values[cb.v.traits[i] - 1] : ''})).concat([{label: 'Age', value: cb.v.age || ''}]);
  out.bonds = ['bond', 'bond2'].map(cbBond).filter(Boolean).map(x => x.text);
  out.omen = cb.v.omen && cb.v.omen !== 'skip' ? CB.omens[cb.v.omen - 1].text : '';
  // notes, in the order they matter; item descriptions last
  out.notes.push('Backpack (holds 6 slots of items or Fatigue).');
  if (cb.v.swap) out.notes.push(`${cbSwapped()}.`);
  for (const t of [0, 1]) { const r = cbRow(t), tb = b.tables[t]; if (!r) continue;
    if (tb.kind === 'result') out.notes.push(r.text.split(/\s(?:Take|Start with|You start with)\b/)[0].trim());
    else out.notes.push(`${plainText(r.cells[0])}: ${r.cells.slice(1).map(plainText).join(' ')}`); }
  for (const f of fx) if (f.marketplace) { out.notes.push(`Pick ${f.marketplace} from the Marketplace.`); out.warnings.push(`Your background lets you pick ${f.marketplace} from the Marketplace: add it to your inventory.`); }
  out.notes.push(plainText(b.quote));  // the background's description, last: Print leaves it out first when Notes is full
  if (out.slots.length >= 10) out.warnings.push(`That's ${out.slots.length} slots. A full inventory (all 10 slots) reduces you to 0 HP, and anything past 10 won't fit.`);
  for (const k of Object.keys(cb.edits || {})) if (k !== 'age') out[k] = cb.edits[k];  // the player's edits win
  out.traits[8] = {label: 'Age', value: cbAge()};  // Age is kept on its own, whatever a traits edit held
  return out;
}
const plainText = md => (md || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_]/g, '').trim();

// ---------- on the page: the callout, the background panel, the tallies, the highlights and the review card
function builderDecorate() {
  const prose = PROSE, callout = $('#cbCallout');
  callout.hidden = false;
  const steps = cbSteps();
  // one line: what it is on the left, the button on the right
  callout.innerHTML = !cb ? `<p class="cb-callout-title">Roll a Character right now!</p><button class="btn btn-primary" type="button" data-cb="start">Start</button>`
    : `<p class="cb-callout-title">Continue your character <span class="muted">· Step ${Math.min(cb.i + 1, steps.length)} of ${steps.length}</span></p><div class="cb-callout-btns"><button class="btn btn-secondary" type="button" data-cb="reset">Start over</button><button class="btn btn-primary" type="button" data-cb="start">Continue</button></div>`;
  if (!cb) { cbBar(); return; }
  const b = cbBg();
  if (b) {  // the rolled background's own names, gear and tables, so the next steps roll right here
    const strip = h => h.replace(/ id="[^"]*"/g, '').replace(/ tabindex="-1"/g, '');
    const sec = t => (b.sections.find(s => s.title === t) || {html: ''}).html, tabs = b.sections.filter(s => s.title !== 'Names' && s.title !== 'Starting Gear');
    const panel = `<section class="cb-panel" id="cbPanel" aria-labelledby="cb-bg-title"><h3 id="cb-bg-title" tabindex="-1">Your background: <a href="${esc(BASE + b.url.replace(/^\//, ''))}">${esc(b.name)}</a></h3>
      <blockquote><p>${esc(b.quote)}</p></blockquote>
      <h4 id="cb-names" tabindex="-1">Names</h4><ul class="cb-names" id="cb-names-list">${li(...b.names.map(esc))}</ul>
      <h4 id="cb-gear" tabindex="-1">Starting gear</h4>${strip(sec('Starting Gear'))}
      ${tabs.slice(0, 2).map((s, t) => `<h4 id="cb-t${t}" tabindex="-1">${esc(s.title)}</h4>${strip(s.html)}`).join('')}</section>`;
    const bgTable = tableAfter(ccEl('backgrounds'));
    (bgTable.closest('.table-wrapper') || bgTable).insertAdjacentHTML('afterend', panel);
  }
  // the rolled rows, highlighted, as a trail of choices
  for (const st of steps) if (st.hit && cb.v[st.id] && cb.v[st.id] !== 'skip') {
    for (const c of st.hit(cb.v[st.id]).filter(Boolean)) { c.classList.add('cb-hit'); if (!c.parentElement.querySelector('.cb-sr')) c.insertAdjacentHTML('afterbegin', '<span class="sr-only cb-sr">Your roll: </span>'); }  // said once per row
  }
  const review = cb.i >= steps.length - 1;  // the review card, once every step is done
  // the portrait sheet is what the wide walkthrough's review edits, so Print fills it, unless a sheet was picked (an old
  // save's "landscape" was only ever the default)
  if (review && cb.active && !CB_NARROW.matches && !cb.sheetPicked) cb.sheet = 'portrait';
  if (review) prose.insertAdjacentHTML('beforeend', cbReviewHtml());
  if (cb.active) cbWalkRender(steps[Math.min(cb.i, steps.length - 1)]);
  cbFitText();
  cbBar();
  if (review) cbSoon(100);  // the status region is new: write to it once it's in the tree, so it's announced
}

// ---------- the walkthrough: a full-screen dialog over the vines, one step at a time, with the step in a drawer.
// Each step is a card built from CB; only the review is the page's own section, moved in so its ids stay single.
// Every refresh rebuilds the page from scratch.
const walk = $('#cbWalk'), walkMain = $('#cbWalkMain'), walkStep = $('#cbWalkStep');
// the first start: the whole sheet while the vines grow, then (when they finish) the zoom to Background and the drawer
let cbIntro = false, cbIntroTimer = 0, cbEnterTimer = 0;
function cbEndIntro(cancel) {
  if (!cbIntro) return;
  cbIntro = false; clearTimeout(cbIntroTimer); walk.classList.remove('cb-intro');
  if (cancel) return;
  // phones: the footer and the step rise in from the bottom rather than appearing at once
  if (CB_NARROW.matches && !REDUCE.matches) { walk.classList.add('cb-enter'); clearTimeout(cbEnterTimer); cbEnterTimer = setTimeout(cbEndEnter, 1200); }
  const waiting = [walkMain, walk, document.body].includes(document.activeElement);
  cbFocusSheet();
  if (waiting) cbGo(true);
  cbPlaceStep();  // the stage's own name back, and no tab stop, once focus has moved on
}
function cbEndEnter() { clearTimeout(cbEnterTimer); walk.classList.remove('cb-enter'); }
walkStep.addEventListener('animationend', e => { if (e.animationName === 'cb-rise-far') cbEndEnter(); });
// the vines' last column (cb-v6) finishes at 5s; timers cover a missed event
walk.querySelector('.cb-walk-vines').addEventListener('animationend', e => { if (e.animationName === 'cb-v6') { walk.classList.remove('cb-grow'); cbEndIntro(); } });
function cbWalkRender(st) {
  const grow = !cb.grown && st.id === 'bg' && !REDUCE.matches;
  if (grow) { cbIntro = true; walk.classList.add('cb-intro'); clearTimeout(cbIntroTimer); cbIntroTimer = setTimeout(() => cbEndIntro(), 6000); }
  walkStep.textContent = '';
  walk.classList.toggle('cb-at-review', st.kind === 'review');
  if (st.kind === 'review') { const r = $('#cbReview'); if (r) walkStep.append(r); } else walkStep.innerHTML = cbStepCard(st);
  cbSheetRender(st);
  if (st.kind === 'review') cbSheetShow(false);
  // the vines grow in the first time the first table shows; after that (and with reduced motion) they're simply there
  if (!cb.grown) { cb.grown = true; cbSave(); if (grow) { walk.classList.add('cb-grow'); setTimeout(() => walk.classList.remove('cb-grow'), 6500); } }
}
// the source's Markdown in a card: links become their words, then bold and italics
const mdInline = md => esc((md || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^\w*])[_*]([^_*]+)[_*](?![\w*])/g, '$1<i>$2</i>');
const ATTR_RULE = 'Roll 3d6 for each attribute, in order. You may swap two of them after.';
const RULE = {str: ATTR_RULE, dex: ATTR_RULE, wil: ATTR_RULE, hp: 'Hit Protection is how well you avoid harm in a fight, not your health.',
  hp2: 'Your background adds a d4 to your Hit Protection.', age: 'How old your character is.'};
// the step's dice read as pills inside its tip ("Roll a d6 …"); a tip that never names them ends with one
const DICE_IN_TEXT = /\b\d*d\d+(?:\+\d+)?\b/g;
const cbTipDice = st => { const t = esc(st.tip), pill = d => `<span class="cb-dice">${d}</span>`;
  return DICE_IN_TEXT.test(t) ? t.replace(DICE_IN_TEXT, pill) : st.dice ? `${t} ${pill(st.dice.replace(/^1d/, 'd'))}` : t; };
// each step is a card: a header (step, name, dice, what to do) and a body built from CB, its table as clean
// numbered rows with the roll marked
function cbStepCard(st) {
  const steps = cbSteps(), v = cb.v[st.id], b = cbBg(), own = ['arms', 'name', 'gold', 't0', 't1'].includes(st.id);
  const rows = (list, rolled, cls = '') => `<ol class="cb-rows${cls}">` + list.map(([n, html]) => `<li data-n="${n}"${n === rolled ? ' class="cb-hit"' : ''}>`
    + `<span class="cb-rn">${n === rolled ? '<span class="sr-only">Your roll: </span>' : ''}${n}</span><span class="cb-rt">${html}</span></li>`).join('') + '</ol>';
  const val = (label, x, hit) => `<div class="cb-val${x ? '' : ' cb-val-empty'}${hit ? ' cb-hit' : ''}"><span class="cb-val-l">${label}</span><b>${x || '–'}</b></div>`;
  const typedIn = (id, label, value, num) => `<div class="field cb-typed-in"><label for="cbTyped-${id}">${label}</label><input id="cbTyped-${id}" data-typed="${id}" autocomplete="off" enterkeyhint="next"`
    + (num ? ' inputmode="numeric"' : '') + ` value="${esc(value)}">` + (num ? `<p class="cb-typed-err" id="cbTyped-${id}-err" role="status"></p>` : '') + '</div>';
  let body = '';
  if (own && !b) body = '';  // the background's own steps, before one is rolled (a resumed save)
  // the rolled background's own description sits under its name, where the eye already is
  else if (st.id === 'bg') body = rows(CB.backgrounds.map(x => [x.n, esc(x.name) + (x.n === v ? `<span class="cb-rdesc">${mdInline(x.quote)}</span>` : '')]), v, ' cb-rows-2');
  else if (st.id === 'name') body = rows(b.names.map((x, i) => [i + 1, esc(x)]), v, ' cb-rows-2')
    + typedIn('name', 'Or type a name', cbCharacter()?.name || '');
  else if (st.id === 'gold') body = `<h3 class="cb-sc-sub">Your starting gear</h3><ul class="cb-gear">${b.items.map(it => `<li>${esc(it.from_table ? it.full || it.name : cbItemLabel(it))}</li>`).join('')}</ul>`
    + `<div class="cb-vals">${val('Gold', v && v + 'gp', !!v)}</div>`;
  else if (st.id === 't0' || st.id === 't1') body = rows(b.tables[+st.id[1]].rows.map(r => [r.n, r.cells.length > 1  // a two-column row: its first cell heads the second
    ? `<b class="cb-rh">${mdInline(r.cells[0])}</b> ${r.cells.slice(1).map(mdInline).join(' ')}` : mdInline(r.cells[0] ?? r.text)]), v);
  else if (st.kind === 'swap') { const a = cbAttrs(); body = `<p class="cb-sc-rule">${cb.v.swap ? `${cbSwapped()}.` : 'Keep them as rolled, or swap two.'}</p><div class="cb-vals">${ATTR.map(([k]) => val(k.toUpperCase(), a[k], cb.v.swap?.includes(k))).join('')}</div>`; }
  else if (st.id === 'age') body = `<p class="cb-sc-rule">${RULE.age}</p><div class="cb-vals">${val('Age', cbAge(), !!cbAge())}</div>` + typedIn('age', 'Or type an age', cbTyped('age'), true);
  else if (RULE[st.id]) body = `<p class="cb-sc-rule">${RULE[st.id]}</p><div class="cb-vals">${val(st.id === 'hp2' ? '+HP' : st.id.toUpperCase(), v, !!v)}</div>`;
  // armor and weapon, celebrated before the rest of the gear is listed
  else if (st.id === 'arms') { const c = cbCharacter(), worn = b.items.filter(it => it.armor).map(it => esc(it.name)), wp = cbWeapons(b);
    body = `<div class="cb-vals cb-arms"><div class="cb-val cb-hit"><span class="cb-val-l">Armor</span><b>${c.armor || 'None'}</b>${worn.length ? `<small>${worn.join(', ')}</small>` : ''}</div>`
      + `<div class="cb-val cb-hit cb-val-list"><span class="cb-val-l">Weapon${wp.length > 1 ? 's' : ''}</span>${wp.map(w => `<b>${esc(w)}</b>`).join('')}</div></div>`
      + (c.armor ? '' : '<p class="cb-sc-rule">Many backgrounds start without armor.</p>') + '<p class="cb-sc-note">Your background’s tables may add more.</p>'; }
  else if (st.id === 'traits') body = `<div class="cb-traits">${CB.traits.map((t, k) => `<section class="cb-trait-b"><h3>${esc(t.name)}</h3>${rows(t.values.map((x, j) => [j + 1, esc(x)]), v?.[k], ' cb-rows-tight')}</section>`).join('')}</div>`;
  else if (st.id === 'bond' || st.id === 'bond2') body = rows(CB.bonds.map(x => [x.n, mdInline(x.text)]), v);
  else if (st.id === 'omen') body = (v === 'skip' ? '<p class="cb-skipped">Skipped</p>' : '') + rows(CB.omens.map(x => [x.n, mdInline(x.text)]), v);
  return `<article class="cb-sc" aria-labelledby="cbScTitle"><header class="cb-sc-head"><p class="cb-sc-eye">Step ${steps.findIndex(x => x.id === st.id) + 1} of ${steps.length}${own && b ? ` · Your background: ${esc(b.name)}` : ''}</p>`
    + `<div class="cb-sc-title"><h2 id="cbScTitle" tabindex="-1">${esc(st.label)}</h2>`
    + (st.id === 'traits' ? `<label class="cb-switch"><input type="checkbox" role="switch" id="cbAllTraits" aria-describedby="cbScTip"${cb.allTraits !== false ? ' checked' : ''}>All 8d10<span class="cb-switch-ui" aria-hidden="true"></span></label>` : '') + '</div>'
    + `<p class="cb-sc-tip" id="cbScTip">${cbTipDice(st)}</p></header><div class="cb-sc-body">${body}</div></article>`;
}
let cbSheetLast = '';  // the newest filled row, for the footer's sheet row
// the sheet so far: phones list it in the footer's panel, wider screens fill in the portrait sheet beside the step
const cbSheetRender = st => { if (CB_NARROW.matches) $('#cbSheetList').innerHTML = st.kind === 'review' ? '' : cbSummary(st); else cbStageRender(st); };
// phones: the footer's "Your sheet" row opens the list full screen; the step and the footer behind it go inert
function cbSheetShow(open) {
  const panel = $('#cbSheetPanel'); if (panel.hidden === !open) return;
  panel.hidden = !open; $('.cb-walk-in').inert = open; $('#cbSheetBtn').setAttribute('aria-expanded', String(open));
  if (open) { $('#cbSheetCollapse').focus({preventScroll: true}); $('#cbSheetList .cb-now')?.scrollIntoView({block: 'center', behavior: 'instant'}); }
  else if (walk.open && CB_NARROW.matches) $('#cbSheetBtn').focus({preventScroll: true});  // going wide, the change handler places focus
}
$('#cbSheetBtn').addEventListener('click', () => cbSheetShow(true));
$('#cbSheetCollapse').addEventListener('click', () => cbSheetShow(false));
// Escape closes the panel only, not the walkthrough, wherever focus is (even dropped to the body); the dialog's cancel is the backstop
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#cbSheetPanel').hidden) { e.preventDefault(); e.stopPropagation(); cbSheetShow(false); } });
walk.addEventListener('cancel', e => { if (!$('#cbSheetPanel').hidden) { e.preventDefault(); cbSheetShow(false); } });
// the sheet so far: a row per result in the order they were rolled; the current step's row waits, dashed
function cbSummary(cur) {
  const steps = cbSteps(), at = steps.findIndex(x => x.id === cur.id), c = cbCharacter(), b = cbBg(), rows = [];
  cbSheetLast = '';
  const row = (label, value, now, under = false) => {  // under: a row under another (the gear, under Gold), never the newest
    const v = value == null || value === '' ? '' : String(value); if (v && !under) cbSheetLast = `${label}: ${v}`;
    const fresh = !cbInkQuiet && v && label in cbInk && cbInk[label] !== v; cbInk[label] = v;
    rows.push(`<div class="cb-sum-row${now ? ' cb-now' : ''}${now && !v ? ' cb-want' : ''}${fresh ? ' cb-new' : ''}"><dt>${esc(label)}</dt><dd>${v ? esc(v) : '<span class="cb-sum-empty">—</span>'}</dd></div>`);
  };
  for (const st of steps.slice(0, at + 1)) {
    const v = cb.v[st.id], now = st.id === cur.id, skip = v === 'skip';
    if (!now && v == null && st.dice && !(TYPED.includes(st.id) && cbTyped(st.id))) continue;  // a step with no dice keeps its row
    const said = skip ? 'Skipped' : v != null && st.say ? st.say(v) : '';
    if (st.id === 'bg') row('Background', c?.background, now);
    else if (st.id === 'arms') row('Armor and weapon', [c.armor ? `Armor ${c.armor}` : 'No armor', ...cbWeapons(b)].join(' · '), now);
    else if (st.id === 'name') row('Name', c?.name, now);
    else if (st.id === 'gold') {
      row('Gold', v ? c.gold + 'gp' : '', now);
      // the gear as the sheet will hold it; an item a table hands out reads as the book has it until that table is rolled
      const tablesRolled = cb.v.t0 || cb.v.t1;
      const held = c.slots.reduce((a, x) => (x === '(bulky)' && a.length ? (a[a.length - 1] += ' (bulky)') : a.push(x), a), []);  // a bulky item's second slot
      row('Gear', tablesRolled ? [...held, ...c.petty].join(', ') : b.items.map(it => it.from_table ? it.full || it.name : cbItemLabel(it)).join(', '), false, true);
    }
    else if (st.id === 't0' || st.id === 't1') row(st.label, said, now);
    else if (ATTR.some(([k]) => k === st.id)) row(st.id.toUpperCase(), v ? c[st.id] : '', now);
    else if (st.kind === 'swap') { if (cb.v.swap) row('Swap', cbSwapped(), now); else if (now) row('Swap', 'Keep as rolled, or swap two', now); }
    else if (st.id === 'hp') row('HP', cb.edits?.hp != null ? cb.edits.hp : v || '', now);  // Bonus HP, when it comes, rewrites this row
    else if (st.id === 'hp2') { const r = rows.findIndex(x => x.includes('<dt>HP</dt>')); if (r >= 0) rows.splice(r, 1); row('HP', cb.edits?.hp != null ? cb.edits.hp : `${cb.v.hp} + ${v || '—'}`, now); }
    else if (st.id === 'traits') CB.traits.forEach((t, i) => row(t.name, v ? c.traits[i].value : '', now));
    else if (st.id === 'bond' || st.id === 'bond2') row(st.id === 'bond' ? 'Bond' : 'Second bond', said, now);
    else if (st.id === 'age') row('Age', cbAge(), now);
    else if (st.id === 'omen') row('Omen', said, now);
  }
  return `<dl class="cb-sum">${rows.join('')}</dl>`;
}
// ---------- the sheet stage (760px and up): the official portrait sheet filling in, zoomed and spotlit on the step's
// section, panning to the next on Next. The step itself moves into the drawer there; phones keep it in the main column.
function cbPlaceStep() {
  const wide = !CB_NARROW.matches, host = wide ? $('#cbDrawerBody') : walkMain;
  if (walkStep.parentElement !== host) host.prepend(walkStep);
  walkMain.setAttribute('aria-label', wide ? 'Your sheet' : 'This step'); wide ? walkMain.removeAttribute('tabindex') : walkMain.tabIndex = 0;
}
// each step's section of the portrait sheet, in points: its fields and its printed title (measured on the image), padded
const PSEC = {name: [38, 232, 248, 284], bg: [340, 140, 566, 192], traits: [341, 190, 581, 290], age: [341, 190, 581, 290],
  str: [316, 358, 550, 490], dex: [316, 358, 550, 490], wil: [316, 358, 550, 490], swap: [316, 358, 550, 490], hp: [36, 488, 294, 534], hp2: [36, 488, 294, 534],
  gold: [345, 490, 585, 770], inv: [345, 490, 585, 698], notes: [34, 372, 296, 492], arms: [228, 486, 590, 702], bond: [40, 624, 266, 694], bond2: [40, 624, 266, 694], omen: [40, 684, 266, 750], review: [0, 0, 612, 792]};
let cbSecNow = null, cbDims = [612, 792];  // the stage's sheet, in points: portrait while rolling; at the review, the one picked
function cbStageRender(st) {
  const c = cbCharacter() || NO_CHAR, edit = st.kind === 'review';
  const want = edit ? [] : (st.fill || []).map(k => { const m = k.match(/^traits\.(\d)$/); return m ? 'ptraits.' + PTRAIT_GROUPS.findIndex(g => g.includes(+m[1])) : k; });
  // the review previews the picked sheet, landscape or portrait, with the same data, editable
  const land = edit && cb.sheet === 'landscape';
  // Armor and weapon: the Armor box and each weapon's slots (a bulky one's second too) get a gold ring, filled as they are
  const star = st.id !== 'arms' ? [] : ['armor', ...c.slots.flatMap((x, i) => WEAPON.test(x) || (x === '(bulky)' && WEAPON.test(c.slots[i - 1])) ? ['slots.' + i] : [])];
  $('#cbPCard').innerHTML = land ? cbCard('sheet', c, true, []) : cbCard('portrait', c, edit, want, star);
  cbDims = land ? [792, 612] : [612, 792];
  cbSecNow = edit ? [0, 0, ...cbDims] : PSEC[st.area || st.id] || PSEC.review;
  cbFocusSheet();
}
// the paper runs full bleed off the stage; wherever one of its own edges comes into view, that edge stops 66px in, so a band
// of vines shows beyond it. The section is scaled to fill 60% of the stage (at most 1.8x) and centred; the review, and the
// first start while the vines grow, fit the whole page 66px inside the stage. The glow sits on the section.
const CB_PAD = 66;
// a zoomed section never shows both of the paper's edges on one axis: it zooms in just enough that one edge sits 66px in
// and the other runs flush
const cbLift = (k, view, base) => base * k < view - CB_PAD ? (view - CB_PAD) / base : k;
function cbFocusSheet() {
  const stage = $('#cbStage'), sheet = $('#cbPSheet'), spot = $('#cbSpot'), W = stage.clientWidth, H = stage.clientHeight;
  if (!W || !H || !cbSecNow) return;
  const [PT_W, PT_H] = cbDims, bw = Math.min(W, H * PT_W / PT_H), bh = bw * PT_H / PT_W;
  const [x0, y0, x1, y1] = cbIntro ? [0, 0, PT_W, PT_H] : cbSecNow, whole = x1 - x0 >= PT_W;  // what's framed
  const rw = (x1 - x0) / PT_W * bw, rh = (y1 - y0) / PT_H * bh;
  const k = whole ? Math.min((W - 2 * CB_PAD) / bw, (H - 2 * CB_PAD) / bh)
    : cbLift(cbLift(Math.max(1, Math.min(1.8, .6 * W / rw, .6 * H / rh)), W, bw), H, bh);
  const cx = (x0 + x1) / 2 / PT_W * bw, cy = (y0 + y1) / 2 / PT_H * bh;
  sheet.style.width = bw + 'px';
  // the section centred, then snapped: an edge that would show sits exactly 66px in, never a sliver; one that doesn't runs
  // past, flush. Paper narrower than the stage less both bands (the whole page at the review) sits in the middle
  const fit = (t, view, size) => size < view - 2 * CB_PAD ? (view - size) / 2 : t > 0 ? CB_PAD : t + size < view ? view - size - CB_PAD : t;
  const tx = fit(W / 2 - cx * k, W, bw * k), ty = fit(H / 2 - cy * k, H, bh * k);
  sheet.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${k.toFixed(3)})`;
  const [g0, h0, g1, h1] = cbSecNow; spot.hidden = whole;
  Object.assign(spot.style, {left: g0 / PT_W * 100 + '%', top: h0 / PT_H * 100 + '%', width: (g1 - g0) / PT_W * 100 + '%', height: (h1 - h0) / PT_H * 100 + '%'});
  cbFitText(sheet);
}
// at any width the cards' words wrap differently as they resize, so their bonds and omens are fitted again (hidden cards are skipped)
addEventListener('resize', () => { if (walk.open && !CB_NARROW.matches) { cbFocusSheet(); cbDiceBounds(false); } cbFitText(); });
// the 3D dice roll inside the stage: their canvas takes the stage's box, and dice-box re-fits its world on resize
function cbDiceBounds(announce = true) {
  const d = $('#diceStage'), wide = walk.open && !CB_NARROW.matches, r = wide && $('#cbStage').getBoundingClientRect();
  d.style.cssText = wide ? `inset:auto;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px` : '';
  if (announce) dispatchEvent(new Event('resize'));
}
// a modal covers the dice, their result card and the tray, and leaves them inert, so while it's open they move into it
// (a result card still up from a header roll is hidden: in the walkthrough, rolls show only on the dice and in the footer)
let diceHome = null;
function cbDiceIn(into) {
  $('#noticeSay').textContent = $('#noticeAlert').textContent = '';  // re-inserting a filled alert can read it again
  if (into && !diceHome) { $('#diceToast').hidden = true; const els = [$('#diceStage'), $('#diceToast').parentElement, $('#diceTray'), notices, $('#noticeSay'), $('#noticeAlert')]; diceHome = els.map(el => [el, el.parentNode, el.nextSibling]); walk.append(...els); }
  if (!into && diceHome) { for (const [el, p, next] of diceHome.reverse()) p.insertBefore(el, next); diceHome = null; restackNotices(); }  // moving a shown popover hides it
}
// ✕, Escape and leaving the page all end here: progress is kept, the page is rebuilt whole, and focus goes back to Continue
walk.addEventListener('close', () => {
  cbEndIntro(true); cbEndEnter(); cbSheetShow(false); walk.classList.remove('cb-grow'); cbDiceIn(false); cbDiceBounds(); CairnDice.clear();
  if (!cb?.active) return;
  cb.active = false; cbSave();
  cbRefresh(); $('#cbCallout [data-cb="start"]')?.focus();
});
// on a phone the controls are a footer fixed to the bottom; the walkthrough keeps that much room free under the step
const cbBarRoom = () => { walk.style.setProperty('--bar-h', $('#cbBar').offsetHeight + 'px'); walk.style.setProperty('--head-h', $('#cbDrawerHead').offsetHeight + 'px'); };
const cbRoom = new ResizeObserver(cbBarRoom); cbRoom.observe($('#cbBar')); cbRoom.observe($('#cbDrawerHead'));  // phones: the fixed header and footer
const walkScroller = () => CB_NARROW.matches ? $('.cb-walk-in') : $('#cbDrawerBody');  // what scrolls the step: the drawer, or (phones) the whole walkthrough

// ---------- the bar
function cbBar(say) {  // say: write the result line even while the name field has focus
  const bar = $('#cbBar'), on = !!(cb && cb.active);
  bar.hidden = !on;
  if (on && !walk.open) { cbDiceIn(true); cbPlaceStep(); walk.showModal(); restackNotices(); cbFocusSheet(); cbDiceBounds(); requestAnimationFrame(() => cbGo(true)); }  // laid out once it's open; focus on the step's heading, a resumed one too
  if (!on && walk.open) walk.close();
  if (!on) return;
  const steps = cbSteps(), st = steps[Math.min(cb.i, steps.length - 1)], v = cb.v[st.id], typed = TYPED.includes(st.id) && cbTyped(st.id), done = st.id === 'traits' ? cbTraitsIn(v) === 8 : !!v;
  const said = st.kind === 'swap' ? (cb.v.swap ? cbSwapped() : 'Keep them as rolled, or swap two.')
    : st.kind === 'review' ? '' : v === 'skip' ? 'Skipped' : typed ? `<b>${esc(typed)}</b>` : v ? `<b>${esc(st.say(v))}</b>${Array.isArray(v) ? '' : ` <span class="muted">(rolled ${v})</span>`}` : '';
  // a live region: rewriting the same result would read it again, and a name being typed is read once it's done, not per letter
  if (said !== cbSaid && (say || !document.activeElement?.dataset?.typed)) $('#cbResult').innerHTML = cbSaid = said;
  // the footer's sheet row: how much is filled, and the newest result (inked in when it changes, not per letter typed)
  const todo = steps.filter(x => x.kind !== 'review'), filled = todo.filter((x, i) => x.id === 'traits' ? cbTraitsIn(cb.v.traits) === 8
    : cb.v[x.id] != null || (TYPED.includes(x.id) && cbTyped(x.id)) || (!x.dice && i < cb.i)).length;
  for (const n of document.querySelectorAll('.cb-sheet-n')) n.textContent = ` · ${filled} of ${todo.length} filled`;
  for (const last of document.querySelectorAll('.cb-sheet-last')) if (last.textContent !== cbSheetLast) { last.textContent = cbSheetLast;
    last.classList.remove('cb-new'); if (!cbInkQuiet && !document.activeElement?.dataset?.typed) { void last.offsetWidth; last.classList.add('cb-new'); } }
  $('#cbRoll').hidden = !st.dice; $('#cbRoll').textContent = cbBusy ? 'Rolling…' : done && v !== 'skip' ? 'Roll again' : 'Roll'; $('#cbRoll').disabled = cbBusy;
  // once a step is rolled, Next is the way on: it takes the primary style, and Roll again steps back
  const rolled = !!st.dice && (done || !!typed), ready = rolled || !st.dice;  // a typed value counts as rolled; traits, once all eight are in
  $('#cbRoll').classList.toggle('btn-primary', !rolled); $('#cbRoll').classList.toggle('btn-secondary', rolled);
  $('#cbNext').classList.toggle('btn-primary', ready); $('#cbNext').classList.toggle('btn-secondary', !ready);
  $('#cbNext').hidden = st.kind === 'review'; $('#cbNext').disabled = cbBusy || !ready;
  $('#cbNext').textContent = st.kind === 'swap' && !cb.v.swap ? 'Keep as rolled' : 'Next';
  $('#cbSkip').hidden = !st.optional || !!v; $('#cbSkip').disabled = cbBusy;
  $('#cbBack').disabled = cbBusy || cb.i === 0;
  $('#cbSwap').hidden = st.kind !== 'swap';
  if (st.kind === 'swap') $('#cbSwap').innerHTML = [['str', 'dex'], ['str', 'wil'], ['dex', 'wil']].map(p => `<button class="btn-icon cb-swap" type="button" data-swap="${p}" aria-pressed="${String(cb.v.swap) === String(p)}">Swap ${p.map(k => k.toUpperCase()).join(' <span aria-hidden="true">↔</span><span class="sr-only">and</span> ')}</button>`).join('');
  cbBarRoom();  // its height changes with the step (and the observer may lag)
}
const cbMotion = () => REDUCE.matches ? 'instant' : 'smooth';
function cbGo(focus) {  // a new step starts at its top, with focus on its heading
  walkScroller().scrollTo({top: 0, behavior: 'instant'});
  if (cbIntro) {  // the drawer is hidden, so the stage holds focus until the intro ends
    if (!focus) return;
    walkMain.tabIndex = -1; walkMain.setAttribute('aria-label', (CB_NARROW.matches ? '' : 'Your sheet. ') + 'The first step opens in a moment'); walkMain.focus({preventScroll: true});
    return;
  }
  const h = walkStep.querySelector('h1, h2, h3, h4');
  if (focus && h) { if (!h.hasAttribute('tabindex')) h.tabIndex = -1; h.focus({preventScroll: true}); }
}
// the page and the step are rebuilt; the step's own scroll stays where it was (Roll again, Swap)
function cbRefresh() { const y = scrollY, sc = walkScroller(), t = sc.scrollTop; walkStep.textContent = ''; renderPage(); scrollTo({top: y, behavior: 'instant'}); sc.scrollTop = t; }
let cbBusy = false, cbSaid = null;
// a dice status while the walkthrough holds the dice ("Loading dice…") is said in the builder's own result line
window.CairnBuilderStatus = text => { $('#cbResult').textContent = text; cbSaid = null; };
async function cbRollStep() {
  if (cbBusy) return;
  const st = cbSteps()[cb.i]; if (!st || !st.dice) return;
  cbBusy = true; for (const id of ['cbRoll', 'cbNext', 'cbBack', 'cbSkip']) $('#' + id).disabled = true; $('#cbRoll').textContent = 'Rolling…';
  try {
    let r = await CairnDice.roll(st.dice, {label: st.label});
    if (st.id === 'bond2') for (let n = 0; r.total === cb.v.bond && n < 5; n++) r = await CairnDice.roll(st.dice, {label: st.label + ' (again: same bond)'});
    // traits keep each die, one per table: all eight at once, or (the toggle off) the next empty one, starting over once all are in
    if (st.id === 'traits' && cb.allTraits === false) { const t = cbTraitsIn(cb.v.traits) === 8 ? [] : [...(cb.v.traits || [])], i = CB.traits.findIndex((x, j) => !t[j]); t[i] = r.total; cb.v.traits = CB.traits.map((x, j) => t[j] || null); }
    else cb.v[st.id] = st.id === 'traits' ? r.groups[0].values : r.total;
    if (TYPED.includes(st.id) && cb.edits) delete cb.edits[st.id];  // the roll replaces a typed value
    if (st.id === 'bg') for (const k of ['name', 't0', 't1', 'hp2', 'bond2']) delete cb.v[k];  // a new background: its own rolls start over
    if (st.id === 't0' || st.id === 't1' || st.id === 'bond') { const ids = cbSteps().map(s => s.id); for (const k of ['hp2', 'bond2']) if (!ids.includes(k)) delete cb.v[k]; }
    if (/^(str|dex|wil)$/.test(st.id)) delete cb.v.swap;
    cbSave(); cbSaid = null;  // every roll is said, even one that lands where the last did
    cbRefresh();
    // the rolled row comes into view with room round it; in the drawer, the table's last row takes it to its bottom, clear of the footer
    const hit = walkStep.querySelector('.cb-hit');
    if (hit && !hit.nextElementSibling && !CB_NARROW.matches) walkScroller().scrollTo({top: walkScroller().scrollHeight, behavior: cbMotion()});
    else hit?.scrollIntoView({block: 'nearest', behavior: cbMotion()});
    CairnDice.clear({fade: true});  // the row is lit: the dice step aside so it can be read
  } finally { cbBusy = false; cbBar(); if (document.activeElement === document.body) $('#cbRoll').focus(); }  // disabling Roll dropped focus
}
// typing a name or an age: the sheet (or a phone's list) and the bar follow each letter; the step card stays, so the caret does
walkStep.addEventListener('input', e => {
  const id = e.target.dataset?.typed; if (!id) return;
  let val = e.target.value.trim();
  if (id === 'age' && cbAgeCheck(e.target, $('#cbTyped-age-err'))) val = '';  // a number, or nothing yet
  if (val && cb.v[id]) { delete cb.v[id]; const hit = walkStep.querySelector('.cb-hit'); hit?.querySelector('.sr-only')?.remove(); hit?.classList.remove('cb-hit'); }
  if (val) cbApplyEdit(id, val); else { delete cb.edits?.[id]; cbSave(); }
  const box = id === 'age' && walkStep.querySelector('.cb-vals .cb-val');  // the card's Age box follows too
  if (box) { box.querySelector('b').textContent = val || '–'; box.classList.toggle('cb-hit', !!val); box.classList.toggle('cb-val-empty', !val); }
  const st = cbSteps()[cb.i];
  cbInkQuiet = true; cbSheetRender(st); cbInkQuiet = false;
  cbBar();
});
walkStep.addEventListener('change', e => {
  if (e.target.id === 'cbAllTraits') { cb.allTraits = e.target.checked; cbSave(); cbRefresh(); $('#cbAllTraits').focus(); return; }
  if (e.target.dataset?.typed && e.target.isConnected) cbBar(true); });
walkStep.addEventListener('keydown', e => { if (!e.target.dataset?.typed || e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;  // 229: Safari's IME commit
  e.preventDefault(); if (!$('#cbNext').disabled) { cbMove(1); return; }
  $('#cbResult').textContent = `Roll, or type ${e.target.dataset.typed === 'age' ? 'an age' : 'a name'}, to go on.`; cbSaid = null; });
function cbMove(d) {
  CairnDice.clear();  // the next table starts clear
  const n = cbSteps().length;
  cb.i = Math.max(0, Math.min(n - 1, cb.i + d)); cbSave(); cbRefresh(); cbGo(true);
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-cb]');
  if (c) {
    if (c.dataset.cb === 'reset' && confirm('Start a new character? This one will be cleared.')) { cb = null; cbSave(); cbRefresh(); $('#cbCallout button')?.focus(); }  // the walkthrough closed with it
    if (c.dataset.cb === 'start') { cb = cb || {i: 0, v: {}, edits: {}, sheet: 'landscape'}; cb.active = true; cbSave(); cbRefresh(); cbGo(true); }
  }
  const sw = e.target.closest('[data-swap]');
  if (sw) { const p = sw.dataset.swap.split(','); cb.v.swap = String(cb.v.swap) === String(p) ? null : p; cbSave(); cbRefresh();
    $(`#cbSwap [data-swap="${sw.dataset.swap}"]`)?.focus(); }  // the buttons were re-rendered; keep focus on the one pressed
});
$('#cbRoll').addEventListener('click', cbRollStep);
$('#cbNext').addEventListener('click', () => cbMove(1));
$('#cbBack').addEventListener('click', () => cbMove(-1));
$('#cbSkip').addEventListener('click', () => { const st = cbSteps()[cb.i]; cb.v[st.id] = 'skip'; cbSave(); cbMove(1); });
$('#cbClose').addEventListener('click', () => walk.close());

// ---------- review and print
const SHEET = {
  landscape: {slots: n => 'Slot.0.0.' + n, petty: n => 'Petty Items.0.' + n, pettyN: 7, traits: n => 'Traits1.' + n, traitsN: 10, bonds: n => 'Bonds.0.' + n, bondsN: 4, omens: n => 'Omens.0.' + n, omensN: 4, notes: 7, ruled: true},
  portrait: {slots: n => 'Slot.' + n, petty: n => 'Petty Items.' + n, pettyN: 5, traits: n => 'Traits' + (n + 1), traitsN: 4, bonds: n => 'Bonds.' + n, bondsN: 3, omens: n => 'Omens.' + n, omensN: 3, notes: 7},
};
// ---------- the sheet's cards, cut from the official sheets, with the character written on them.
// The review is the whole sheet, editable (a phone lists it instead: cbReviewList). Fields are the fillable PDF's own rects
// in points, so what's typed lands where Print writes it.
const CARDS = CB.cards, PX = CARDS.size[0] / 792;  // sheet pixels per point
// [card, edit key, label, rect in points, line height in points (multi-line fields only), r/e: only while rolling or only in
// the review]; a null label is MAX, a copy of CURRENT. The multi-line fields match the printed rules (measured on the image),
// so each line of text sits just above one. In the review, the slots and traits are one box each, a line per item: their
// rules are 19–24px apart, too close for one input per line (2.5.8).
const SF = [['who', 'name', 'Name', [44, 168, 192, 186]], ['who', 'background', 'Background', [43, 211, 192, 225]],
  // the score's own box only: the one under it is for the character's current state in play, kept blank
  ...[['str', 110, 'STR'], ['dex', 175, 'DEX'], ['wil', 237, 'WIL'], ['hp', 307, 'HP']].map(([k, x, l]) => [k, k, l, [x, 288, x + 40, 314]]),
  ['armor', 'armor', 'Armor', [441, 140, 464, 164]], ['petty', 'petty', 'Petty items', [376, 200.9, 468, 308], 15.1], ['petty', 'gold', 'Gold', [427, 324, 455, 350]],
  ...[172, 192, 209, 226, 244, 261, 278, 295, 313, 331].map((y, i) => ['inventory', 'slots.' + i, 'Slot ' + (i + 1), [504, y, 665, y + 13], 0, 'r']),
  ['inventory', 'slots', 'Inventory, one item per slot (line)', [504, 172.3, 665, 346], 17.5, 'e'],
  ...[[213, 401, 331], [213, 415, 330], [213, 432, 331], [213, 448, 331], [226, 463, 325], [234, 476, 324], [242, 493, 327], [242, 510, 326], [247, 523, 322]]
    .map(([x0, y, x1], i) => ['traits', 'traits.' + i, null, [x0, y, x1, y + 15], 0, 'r']),
  // starts where the lowest rules do, clear of the skulls
  ['traits', 'traits', 'Traits, one per line', [244, 400.9, 331, 560], 15.4, 'e'],
  ['bonds', 'bonds', 'Bonds', [340, 401.4, 472, 465], 15.6], ['bonds', 'omen', 'Omen', [340, 493.5, 472, 558], 15.8], ['notes', 'notes', 'Notes', [488, 400.6, 708, 558], 15.8]];
// landscape only: [right, down] in points, measured on the image, to set each field on its printed rule (multi-line boxes all drop 3)
const LAND_NUDGE = {name: [0, 4.4], background: [0, 6.1], str: [-1.6, 2], dex: [0, 2], wil: [4.2, 2], hp: [0, 2], armor: [-2.6, 4.2]};
// the portrait sheet's fields, from its fillable PDF (points, top-down); its traits are four lines of pairs, as Print writes them
const SF_P = [['portrait', 'name', 'Name', [66, 248, 218, 266]], ['portrait', 'background', 'Background', [350, 171, 553, 184]],
  ...[[218, 231], [235, 248], [251, 264], [268, 281]].map(([y0, y1], i) => ['portrait', 'ptraits.' + i, 'Traits', [351, y0, 571, y1], 0, 'r']),
  ['portrait', 'ptraits', 'Traits, four lines of pairs (· between)', [351, 216, 571, 284], 16.7, 'e'],
  // STR, DEX, WIL and HP fill only the box left of the slash: the one right of it is for the character's current state, in play
  ...[['str', 389, 374, 394, 'STR'], ['dex', 390, 417, 437, 'DEX'], ['wil', 390, 459, 479, 'WIL']].map(([k, a, y0, y1, l]) => ['portrait', k, l, [a, y0, a + 35, y1]]),
  ['portrait', 'hp', 'HP', [141, 500, 187, 526]], ['portrait', 'armor', 'Armor', [237, 590, 256, 607]],
  ...[537, 551, 566, 581, 595, 610, 624, 639, 653, 668].map((y, i) => ['portrait', 'slots.' + i, 'Slot ' + (i + 1), [375, y, 547, y + 12.5], 0, 'r']),
  ['portrait', 'slots', 'Inventory, one item per slot (line)', [375, 535, 547, 683], 14.6, 'e'],
  ['portrait', 'petty', 'Petty items', [374, 709, 495, 765], 10.5], ['portrait', 'gold', 'Gold', [530, 723, 557, 749]],
  ['portrait', 'bonds', 'Bonds', [49, 641, 254, 689], 15], ['portrait', 'omen', 'Omen', [50, 700, 256, 745], 13.3], ['portrait', 'notes', 'Notes', [44, 400, 262, 488], 11]];
const PTRAIT_GROUPS = [[0, 1], [2, 3], [4, 5], [6, 7, 8]];
// the portrait sheet's four trait lines; with blanks, an empty trait stays as "—" so an edited line maps back by position
const cbPortraitTraits = (c, blanks) => PTRAIT_GROUPS.map(g => g.map(i => { const t = c.traits[i], v = t && t.value; return v ? (t.label === 'Age' ? 'Age ' + v : v) : blanks ? '—' : ''; }).filter(Boolean).join(' · '));
const CB_NARROW = matchMedia('(max-width: 759px)');
CB_NARROW.addEventListener('change', () => { if (!walk.open) return;
  const a = document.activeElement, d = a?.dataset || {}, caret = d.typed && [a.selectionStart, a.selectionEnd];
  const fromSheet = $('#cbSheetPanel').contains(a), sel = !walk.contains(a) || fromSheet || a === walkMain ? null : d.typed ? `[data-typed="${d.typed}"]` : d.edit ? `[data-edit="${d.edit}"]` : d.swap ? `[data-swap="${d.swap}"]` : a.id ? '#' + a.id : null;
  cbEndIntro(true); cbEndEnter(); cbSheetShow(false); cbPlaceStep(); cbRefresh(); cbFocusSheet(); cbDiceBounds();
  if (!sel) { if (fromSheet || a === walkMain) cbGo(true); return; }  // the sheet panel closed, or the stage's tab stop went: the step's heading
  const f = walk.querySelector(sel);  // what had focus, rebuilt; or the step's heading
  if (f) { f.focus({preventScroll: true}); if (caret) f.setSelectionRange(...caret); } else cbGo(true); });
const cbVal = (c, k) => { const m = k.match(/^(slots|traits)\.(\d+)$/);
  if (k === 'ptraits') return cbPortraitTraits(c, true).join('\n');
  if (k.startsWith('ptraits.')) return cbPortraitTraits(c)[+k.slice(8)];
  return m ? (m[1] === 'slots' ? c.slots[+m[2]] : c.traits[+m[2]]?.value) : k === 'slots' ? c.slots.slice(0, 10).join('\n')
    : k === 'traits' ? c.traits.map(t => `${t.label}: ${t.value}`).join('\n') : Array.isArray(c[k]) ? c[k].join('\n') : c[k]; };
const cbInk = {};  // what each field showed last, so a value the latest roll wrote fades in like ink
let cbInkQuiet = false;  // set while a typed value redraws, so the field doesn't fade in again on every letter
// a long bond or omen is set just small enough (down to three quarters) to fit its box whole. The line height stays on the
// printed rules, so each line just holds more words. On a review card the text is in a textarea, which is what scrolls, so
// that's what's measured. A card with no size yet (hidden) is fitted on a later call
function cbFitText(root = document) {
  for (const f of root.querySelectorAll('.cb-f-bonds, .cb-f-omen')) {
    const el = f.querySelector('textarea') || f; if (!el.clientHeight) continue;
    let fit = 1; f.style.setProperty('--fit', 1);
    while (el.scrollHeight > el.clientHeight + 1 && fit > .75) { fit = +(fit - .05).toFixed(2); f.style.setProperty('--fit', fit); }
  }
}
// a card (or 'sheet', the whole sheet) with its fields; read-only while rolling, inputs in the review
function cbCard(n, c, edit, want, star = []) {
  const r = n === 'sheet' ? [0, 0, ...CARDS.size] : n === 'portrait' ? [0, 0, ...CARDS.portrait] : CARDS.cards[n], w = r[2] - r[0], h = r[3] - r[1], pc = x => +(x * 100).toFixed(3) + '%';
  const land = n !== 'portrait';
  const field = ([, k, label, p, lh]) => {
    const [x0, y0, x1, y1] = p.map(v => v * PX), i = +k.split('.')[1];
    const nudge = land && (LAND_NUDGE[k] || lh && [0, 3]);
    const pos = `left:${pc((x0 - r[0]) / w)};top:${pc((y0 - r[1]) / h)};width:${pc((x1 - x0) / w)};height:${pc((y1 - y0) / h)};--f:${lh ? 32 : Math.min(90, (y1 - y0) * .82).toFixed(1)}${lh ? ';--lh:' + (lh * PX).toFixed(1) : ''}`
      + (nudge ? `;--dx:${(nudge[0] * PX).toFixed(1)};--dy:${(nudge[1] * PX).toFixed(1)}` : '');
    const v = String(cbVal(c, k) ?? ''), trait = k.startsWith('traits.') ? (c.traits[i]?.label || CB.traits[i]?.name || 'Age') : '';
    const score = /^(str|dex|wil|hp|armor|gold)$/.test(k);
    const cls = `cb-fld${lh ? ' cb-multi' : ''}${y1 - y0 > 90 || score ? ' cb-big' : ''}${score ? ' cb-score' : ''} cb-f-${k.replace(/\./g, '-')}${star.includes(k) ? ' cb-star' : ''}`;  // the scores, Armor and Gold: bold, centred
    if (!label && !trait) return `<span class="${cls} cb-max" style="${pos}" aria-hidden="true" data-mirror="${k}">${esc(v)}</span>`;
    if (edit) return `<label class="${cls}" style="${pos}"><span class="sr-only">${label}</span>`
      + (lh ? `<textarea data-edit="${k}"${k === 'slots' || k === 'traits' ? ' wrap="off"' : ''}>${esc(v)}</textarea>` : `<input data-edit="${k}" value="${esc(v)}">`) + '</label>';
    const fresh = !cbInkQuiet && v && k in cbInk && cbInk[k] !== v; cbInk[k] = v;
    return `<span class="${cls}${!v && want.includes(k) ? ' cb-want' : ''}${fresh ? ' cb-new' : ''}" style="${pos}">`
      + (trait ? `<span class="cb-tl">${esc(trait)}</span> ` : `<span class="sr-only">${label}: </span>`) + `${esc(v)}</span>`;
  };
  const fields = n === 'portrait' ? SF_P : SF.filter(f => n === 'sheet' || f[0] === n);
  return `<div class="cb-card${n === 'sheet' || n === 'portrait' ? ' cb-card-sheet' : ''}${land ? ' cb-land' : ''}" style="--cw:${w};--ch:${h}"><img src="${CARD_IMG}${n === 'portrait' ? 'sheet-portrait' : n}.webp" alt="" width="${w}" height="${h}" decoding="async">`
    + fields.filter(f => !f[5] || f[5] === (edit ? 'e' : 'r')).map(field).join('') + '</div>';
}
function cbCards(names, edit) {
  const c = cbCharacter() || NO_CHAR, want = edit ? [] : cbSteps()[cb.i]?.fill || [];
  return `<div class="cb-cards">${names.map(n => cbCard(n, c, edit, want)).join('')}</div>`;
}
// a phone's review: the sheet as its drawer listed it, in the steps' order, every value editable through the cards' own keys
function cbReviewList(c) {
  const fields = [['background', 'Background'], ['armor', 'Armor', 'n'], ['gold', 'Gold (gp)', 'n'], ['slots', 'Inventory, one item per line', 't'],
    ['petty', 'Petty items, one per line', 't'], ...['str', 'dex', 'wil', 'hp'].map(k => [k, k.toUpperCase(), 'n']), ...CB.traits.map((t, i) => ['traits.' + i, t.name]),
    ['age', 'Age', 'n'], ['bonds', 'Bonds, one per line', 't'], ['omen', 'Omen', 't'], ['name', 'Name'], ['notes', 'Notes, one per line', 't']];
  return '<dl class="cb-sum cb-sum-edit">' + fields.map(([k, label, kind]) => {
    const id = 'cbRv-' + k.replace(/\./g, '-'), v = String((k === 'age' ? cbAge() : cbVal(c, k)) ?? '');  // Age isn't on the character, only in its traits
    // rows for browsers without field-sizing: a line each, and the long prose fields a line per ~35 characters, as they wrap on a phone
    const rows = Math.max(2, v.split('\n').reduce((n, l) => n + (k === 'notes' || k === 'omen' ? Math.ceil(l.length / 35) || 1 : 1), 0));
    const field = kind === 't' ? `<textarea id="${id}" data-edit="${k}" rows="${rows}" autocomplete="off"${k === 'slots' ? ' wrap="off"' : ''}>${esc(v)}</textarea>`
      : `<input id="${id}" data-edit="${k}" autocomplete="off"${kind === 'n' ? ' inputmode="numeric"' : ''} value="${esc(v)}">`;
    return `<div class="cb-sum-row"><dt><label for="${id}">${label}</label></dt><dd>${field}`
      + (k === 'age' ? `<p class="cb-typed-err" id="${id}-err" role="status"></p>` : '') + '</dd></div>';
  }).join('') + '</dl>';
}
function cbReviewHtml() {
  const c = cbCharacter(), kw = cbBg()?.kw; if (!c) return '';
  // #cbStatus keeps its message only while the sheet is unchanged, so a rebuild stays quiet
  return `<section class="cb-review" id="cbReview" aria-labelledby="cb-review-title"><h2 id="cb-review-title" tabindex="-1">Your character</h2>
    <p class="muted">This is your sheet. Change anything on it, then print: Print fills the official Fillable Letter sheet, which stays fillable.</p>
    ${CB_NARROW.matches ? cbReviewList(c) : cb.active ? '<p class="muted">Your sheet is beside this: change anything on it.</p>' : cbCards(['sheet'], true)}
    ${c.slots.length > 10 ? `<p class="cb-warn">These don't fit in the 10 slots: ${esc(c.slots.slice(10).join(', '))}.</p>` : ''}${c.warnings.map(w => `<p class="cb-warn">${esc(w)}</p>`).join('')}
    <div class="cb-print"><fieldset class="sheet-pick"><legend class="sr-only">Sheet layout</legend><div class="seg">${['landscape', 'portrait'].map(k => `<label><input type="radio" name="cb-sheet" value="${k}"${(cb.sheet || 'landscape') === k ? ' checked' : ''}><span>${k[0].toUpperCase() + k.slice(1)}</span></label>`).join('')}</div></fieldset>
      <button class="btn btn-primary" type="button" id="cbPrint">Print</button><a class="btn btn-secondary" id="cbDownload" role="link" aria-disabled="true" aria-describedby="cbStatus">Download PDF</a>${kw ? '<button class="btn btn-secondary" type="button" id="cbKw" aria-describedby="cbKwHelp">Export for Kettlewright</button>' : ''}<button class="btn btn-secondary" type="button" data-cb="reset">Start over</button></div>
    <p class="cb-status" id="cbStatus" role="status">${cbPdf.url && cbPdf.key === cbPdfKey(c) ? esc(cbPdf.msg) : ''}</p>
    ${kw ? `<p class="cb-status">For Kettlewright: <span id="cbKwHelp">the export saves a JSON file. Sign in, then open <a href="https://kettlewright.com/new_from_json/">Kettlewright’s New from JSON page</a> to import it.</span></p>
    <p class="cb-status" id="cbKwErr"></p>` : ''}</section>`;
}
// edits are kept by field; slots and traits live in arrays
const cbApplyEdit = (k, v) => {
  const c = cbCharacter(); cb.edits = cb.edits || {};
  const m = k.match(/^(slots|traits)\.(\d+)$/);
  if (m) { const arr = m[1] === 'slots' ? [...c.slots] : c.traits.map(t => ({...t})); if (m[1] === 'slots') arr[+m[2]] = v; else arr[+m[2]].value = v; cb.edits[m[1]] = arr; }
  // the review's slots keep their places (a blank line is an empty slot); its traits are "Label: value", a line each
  else if (k === 'slots') cb.edits.slots = [...v.split('\n'), ...c.slots.slice(10)].map(x => x.trim()).reduceRight((a, x) => a.length || x ? [x, ...a] : a, []);
  else if (k === 'ptraits') { const ls = v.split('\n'), tr = c.traits.map(t => ({...t}));
    PTRAIT_GROUPS.forEach((g, li) => { const parts = (ls[li] || '').split(/\s*·\s*/); g.forEach((ti, pi) => { if (pi < parts.length && tr[ti]) tr[ti].value = parts[pi].replace(/^Age\s+/i, '').replace(/^—$/, '').trim(); }); });
    cb.edits.traits = tr; }
  else if (k === 'traits') { const ls = v.split('\n'); cb.edits.traits = c.traits.map((t, i) => ({label: t.label, value: (ls[i] || '').replace(/^[^:]*:\s*/, '').trim()})); }
  else cb.edits[k] = ['petty', 'bonds', 'notes'].includes(k) ? v.split('\n').filter(Boolean) : v;  // one per line
  if (/^p?traits/.test(k)) { const age = String(cb.edits.traits?.find(t => t.label === 'Age')?.value || '').trim(); if (age) cb.edits.age = age; else delete cb.edits.age; }
  cbSave();
};
document.addEventListener('input', e => { const k = e.target.dataset?.edit; if (!k) return;
  if (k === 'age' && cbAgeCheck(e.target, $('#cbRv-age-err'))) return;  // a phone's review: digits, as in the Age step
  cbApplyEdit(k, e.target.value); cbSoon();
  const card = e.target.closest('.cb-card'); if (card && (k === 'bonds' || k === 'omen')) cbFitText(card);
  for (const m of document.querySelectorAll(`[data-mirror="${k}"]`)) m.textContent = e.target.value; });  // MAX follows CURRENT
document.addEventListener('change', e => { if (e.target.name === 'cb-sheet') { cb.sheet = e.target.value; cb.sheetPicked = true; cbSave(); cbSoon(0);
  if (walk.open && !CB_NARROW.matches) cbStageRender(cbSteps()[cb.i]); } });  // the stage previews the sheet just picked
let pdfLibP = null, cbPdf = {url: null, key: ''}, cbTimer = 0;
const loadPdfLib = () => pdfLibP || (pdfLibP = new Promise((res, rej) => { const s = document.createElement('script');
  s.src = PDF_LIB; s.onload = () => res(window.PDFLib); s.onerror = () => { pdfLibP = null; rej(new Error('pdf-lib could not load')); }; document.head.appendChild(s); }));
const sheetBytes = {};
const cbPdfKey = c => JSON.stringify([c, cb.sheet || 'landscape']);  // what the filled PDF was made from
function cbSoon(ms = 600) { clearTimeout(cbTimer); cbTimer = setTimeout(cbPrepare, ms); }
// Download PDF has no href until a sheet is filled, so it can't save the page instead; an unchanged message isn't re-announced
const cbShowPdf = status => { if (status.textContent !== cbPdf.msg) status.textContent = cbPdf.msg; const dl = $('#cbDownload'); if (dl) { dl.href = cbPdf.url; dl.download = cbPdf.file; dl.removeAttribute('aria-disabled'); } };
// fill the chosen sheet ahead of time, so Print only has to open it (a late window.open would be blocked as a pop-up)
async function cbPrepare() {
  const status = $('#cbStatus'); if (!status || !cb) return;
  const c = cbCharacter(), sheet = cb.sheet || 'landscape', key = cbPdfKey(c);
  if (key === cbPdf.key && cbPdf.url) { cbShowPdf(status); return; }
  if (!cbPdf.url) status.textContent = 'Filling in your sheet…';  // a refill after an edit stays quiet unless the message changes
  try {
    const PDFLib = await loadPdfLib();
    sheetBytes[sheet] = sheetBytes[sheet] || await fetch(`${SHEETS}${sheet}.pdf`).then(r => { if (!r.ok) throw new Error('sheet ' + r.status); return r.arrayBuffer(); });
    const {bytes, warn} = await cbFill(PDFLib, sheetBytes[sheet], sheet, c);
    if (cbPdf.url) URL.revokeObjectURL(cbPdf.url);
    cbPdf = {url: URL.createObjectURL(new Blob([bytes], {type: 'application/pdf'})), key, file: `${(c.name || 'character').replace(/[^\w-]+/g, '-')}-${sheet}.pdf`,
             msg: warn.length ? `Ready to print. ${warn.join(' ')}` : `Ready to print, on the ${sheet} sheet.`};
    cbShowPdf(status);
  } catch (e) {
    cbPdf = {url: null, key: ''}; const dl = $('#cbDownload'); dl?.removeAttribute('href'); dl?.setAttribute('aria-disabled', 'true'); console.error(e);
    status.textContent = location.protocol === 'file:' ? 'The sheets load from this site, so open the page from a web server to print.' : "Couldn't fill the sheet. Check your connection and try again.";
  }
}
async function cbFill(PDFLib, bytes, sheet, c) {
  const S = SHEET[sheet], doc = await PDFLib.PDFDocument.load(bytes), form = doc.getForm(), font = await doc.embedFont(PDFLib.StandardFonts.Helvetica), warn = [];
  // the sheet font writes WinAnsi only; anything else is simplified
  const clean = t => [...String(t == null ? '' : t)].map(ch => { if (ch === '\n') return ch; try { font.widthOfTextAtSize(ch, 8); return ch; } catch { const p = ch.normalize('NFD').replace(/[̀-ͯ]/g, ''); try { font.widthOfTextAtSize(p, 8); return p; } catch { return ''; } } }).join('');
  const field = n => form.getTextField(n), width = n => field(n).acroField.getWidgets()[0].getRectangle().width - 4;
  const fits = (t, n, size) => font.widthOfTextAtSize(clean(t), size) <= width(n);
  const set = (n, t, size) => { const f = field(n), da = `/Helv ${size} Tf 0 g`; f.acroField.setDefaultAppearance(da); for (const w of f.acroField.getWidgets()) w.setDefaultAppearance(da); f.setText(clean(t)); };
  const wrap = (text, n, size) => { const out = []; let line = ''; for (const w of clean(text).split(/\s+/).filter(Boolean)) { const tryL = line ? line + ' ' + w : w; if (fits(tryL, n, size) || !line) line = tryL; else { out.push(line); line = w; } } if (line) out.push(line); return out; };
  for (const [n, v] of [['Name', c.name], ['Background', c.background]]) set(n, v, 10);
  // each score's second box (under it on Landscape, right of the slash on Portrait) is for the character's current state in play, so it's printed blank
  for (const k of ['str', 'dex', 'wil', 'hp']) { set(k.toUpperCase() + '_CURRENT', c[k], 12); set(k.toUpperCase() + '_MAX', '', 12); }
  set('Armor', c.armor, 12); set('Gold', c.gold, 11);
  for (let i = 0; i < 10; i++) set(S.slots(i), c.slots[i] || '', 8);
  const petty = [...c.petty], notes = [...c.notes];
  for (let i = 0; i < S.pettyN; i++) set(S.petty(i), petty[i] || '', 7);
  if (petty.length > S.pettyN) warn.push(`${petty.length - S.pettyN} petty item${petty.length - S.pettyN === 1 ? '' : 's'} won't fit: ${petty.slice(S.pettyN).join(', ')}.`);
  if (c.slots.length > 10) warn.push(`${c.slots.length - 10} item${c.slots.length === 11 ? '' : 's'} won't fit in the 10 slots.`);
  // traits: one per line on Landscape (the label dropped when a line is too short); three lines of pairs and one of three on Portrait
  const T = c.traits.filter(t => t.value !== '');
  const lines = sheet === 'landscape' ? T.map(t => `${t.label}: ${t.value}`) : cbPortraitTraits(c);
  for (let i = 0; i < S.traitsN; i++) { let t = lines[i] || ''; if (t && !fits(t, S.traits(i), 8)) t = t.replace(/^[^:]+:\s*/, ''); set(S.traits(i), t, 8); }
  // bonds and omens wrap over their lines, each text starting a line of its own. The whole set takes one size: the largest
  // of 8 to 6pt at which every text fits whole. If none does, the set is printed at 8pt: on Portrait (3 lines each),
  // each text's first sentence
  const over = [];  // what doesn't fit on the bond and omen lines continues in Notes, after the backpack and swap notes
  const fill = (texts, name, count, what) => { let li = 0;
    const narrow = [...Array(count).keys()].map(name).reduce((a, b) => width(b) < width(a) ? b : a);  // wrapped to the narrowest line
    const size = [8, 7.5, 7, 6.5, 6].find(z => texts.reduce((n, t) => n + wrap(t, narrow, z).length, 0) <= count);
    if (size) for (const t of texts) wrap(t, narrow, size).forEach(w => set(name(li++), w, size));
    else for (const t of texts) { const short = sheet === 'portrait' ? firstSentence(t) : t, ws = wrap(short, narrow, 8), room = count - li;
      ws.slice(0, room).forEach(w => set(name(li++), w, 8));
      const rest = [ws.slice(room).join(' '), short !== t ? t.slice(short.length).trim() : ''].filter(Boolean).join(' ');
      if (rest) over.push(`${what} (continued): ${rest}`); }
    while (li < count) set(name(li++), '', size || 8); };
  fill(c.bonds, S.bonds, S.bondsN, 'Bond'); fill(c.omen ? [c.omen] : [], S.omens, S.omensN, 'Omen');
  const quote = plainText(cbBg().quote), qi = notes.indexOf(quote); if (qi >= 0) notes.splice(qi, 1);  // found even after a Notes edit
  const at = notes.findIndex(n => !/^(Backpack|Swapped)/.test(n));
  notes.splice(at < 0 ? notes.length : at, 0, ...over);
  // notes: as many lines as fit at a readable size, never shrunk
  const nf = field('Notes'), nr = nf.acroField.getWidgets()[0].getRectangle(), cap = Math.floor((nr.height - 4) / (S.notes * 1.2));
  // Landscape's Notes has printed rules: one line of text per rule, a blank line between, so it sits on them
  const per = S.ruled ? 2 : 1, room = Math.floor(cap / per), nl = notes.flatMap(t => wrap(t, 'Notes', S.notes)), kept = nl.slice(0, room);
  const ql = qi >= 0 ? wrap(quote, 'Notes', S.notes) : []; if (nl.length + ql.length <= room) kept.push(...ql);  // whole, or left out
  nf.enableMultiline(); set('Notes', (S.ruled ? kept.flatMap(l => [l, '']) : kept).join('\n'), S.notes);
  if (nl.length > room) warn.push(`Notes is full: ${nl.length - room} line${nl.length - room === 1 ? '' : 's'} won't fit on the printed sheet. Shorten Notes.`);
  form.updateFieldAppearances(font);
  return {bytes: await doc.save(), warn};
}
document.addEventListener('click', e => {
  if (e.target.id !== 'cbPrint') return;
  const status = $('#cbStatus');
  if (!cbPdf.url || cbPdf.key !== cbPdfKey(cbCharacter())) { notify('Your sheet is still being filled in. Try again in a moment.', {kind: 'error'}); cbPrepare(); return; }
  // Chrome and Edge print a PDF from an iframe; Safari and Firefox don't, so they get a tab, opened inside this click
  if (/Chrome|Chromium|Edg\//.test(navigator.userAgent) && !/Firefox|FxiOS/.test(navigator.userAgent)) {
    let f = $('#cbPrintFrame');
    if (!f) { f = document.createElement('iframe'); f.id = 'cbPrintFrame'; f.title = 'Character sheet, for printing'; f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
      f.style.cssText = 'position:fixed;right:0;bottom:0;width:2px;height:2px;border:0;opacity:0;pointer-events:none'; document.body.appendChild(f); }
    status.textContent = 'Opening the print dialog…';
    f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); status.textContent = cbPdf.msg; } catch { if (!window.open(cbPdf.url, '_blank')) { status.textContent = ''; notify('Printing was blocked. Use Download PDF, then print it.', {kind: 'error'}); } } };
    f.src = cbPdf.url;
  } else if (!window.open(cbPdf.url, '_blank')) notify('A pop-up blocker stopped the sheet opening. Use Download PDF, then print it.', {kind: 'error'});
});

// ---------- Export for Kettlewright: a file its New from JSON page imports (yochaigal/kettlewright, app/main.py).
// The gear, containers and pets are Kettlewright's own for the rolled rows (each record's kw, from
// _plugins/cairn_kettlewright.rb); everything else is this character, edits included. Its numbers must be whole
// numbers, or Kettlewright refuses the file.
// A refusal names the review field to fix (field: its data-edit key).
function cbKettlewright() {
  const b = cbBg(), c = cbCharacter(), rows = [cbRow(0), cbRow(1)].filter(Boolean), bonds = ['bond', 'bond2'].map(cbBond).filter(Boolean);
  const name = String(c.name ?? '').trim();
  if (!name) return {field: 'name', error: 'Your character needs a name: add one on your sheet, then export.'};
  if (name.length > 64) return {field: 'name', error: 'Kettlewright takes names of up to 64 characters: shorten it on your sheet, then export.'};
  const out = {name, custom_name: name, background: b.kw.key, custom_background: ''};  // Kettlewright reads custom_name for a character named "Custom"
  for (const [k, field, label] of [['str', 'strength', 'STR'], ['dex', 'dexterity', 'DEX'], ['wil', 'willpower', 'WIL'], ['hp', 'hp', 'HP'], ['gold', 'gold', 'Gold']]) {
    const v = String(c[k] ?? '').trim();
    if (!/^\d+$/.test(v)) return {field: k, error: `${label} isn’t a whole number: fix it on your sheet, then export.`};
    out[field] = +v; if (field !== 'gold') out[field + '_max'] = +v;
  }
  const seen = new Set();
  out.items = [...b.kw.gear, ...rows.flatMap(r => r.kw.items), ...bonds.flatMap(x => x.kw)].filter(it => !seen.has(it.name) && seen.add(it.name))
    .map((it, i) => ({...it, tags: it.tags || [], id: String(i + 1), location: 0}));
  out.containers = [{id: 0, name: 'Main', slots: 10}, ...[...b.kw.containers, ...rows.flatMap(r => r.kw.containers)].map((x, i) => ({...x, id: i + 1}))];
  out.pets = [...new Set(rows.flatMap(r => r.kw.pets))].map(k => { const t = CB.kw_pets[k];
    const pet = {name: t.name, role: t.name, notes: t.notes || '', attack: t.attack || '', armor: t.armor || 0, gold: 0, items: [], containers: [{id: 0, name: 'Main', slots: t.slots || 0}]};
    for (const s of ['hp', 'strength', 'dexterity', 'willpower']) pet[s] = pet[s + '_max'] = t.mirror ? out[s] : t[s] ?? null;  // a mirror pet has your Attributes and HP
    return pet; });
  // the traits as Kettlewright's own sentence (CB.traits is in its order, Physique to Vice), or "Label: value" lines if any is blank
  const T = c.traits.slice(0, 8), tr = T.map(t => String(t.value || '').trim()), age = String(cbAge()).trim();
  const [phy, skin, hair, face, speech, cloth, virtue, vice] = tr.map(v => v.toLowerCase());
  out.traits = [tr.every(Boolean) ? `You have a ${phy} physique, ${skin} skin, and ${hair} hair. Your face is ${face}, your speech ${speech}. You have ${cloth} clothing. You are ${virtue} and ${vice}.`
    : T.map((t, i) => tr[i] && `${t.label}: ${tr[i]}`).filter(Boolean).join('\n'), /^\d+$/.test(age) && +age > 0 ? `You are ${age} years old.` : ''].filter(Boolean).join(' ');
  const quote = plainText(b.quote);
  Object.assign(out, {bonds: c.bonds.join('\n\n'), omens: c.omen || '', scars: '', description: quote, notes: c.notes.filter(n => n !== quote).join('\n'),
    deprived: false, panicked: false, dead: false, image_url: 'default-portrait.webp', custom_image: false, armor: +c.armor || 0});
  rows.forEach((r, t) => { out[`background_table${t + 1}_question`] = b.kw.questions[t]; out[`background_table${t + 1}_answer`] = r.kw.answer; });
  for (const [k, field, label] of [['notes', 'notes', 'Notes'], ['bonds', 'bonds', 'Bonds'], ['omens', 'omen', 'Omen'], ['traits', 'traits', 'Your traits']])
    if (out[k].length > 2000) return {field, error: `${label}: over Kettlewright’s 2,000-character limit. Shorten it on your sheet, then export.`};
  return {data: out};
}
const cbKwErrs = new Set();  // this export's refusal notices, dismissed once an export works
document.addEventListener('click', e => {
  if (e.target.id !== 'cbKw') return;
  const {data, error, field} = cbKettlewright(), msg = $('#cbKwErr');
  if (error) {
    cbKwErrs.add(notify(error, {kind: 'error'}));
    msg.textContent = error;  // also kept by the field, for when the alert has been and gone
    // the field to fix (traits: whichever traits box this layout has), marked until it's edited
    const el = [`[data-edit="${field}"]`, field === 'traits' && '[data-edit="ptraits"], [data-edit^="traits."]'].filter(Boolean)
      .flatMap(sel => [...document.querySelectorAll(`#cbReview :is(${sel}), #cbWalk :is(${sel})`)]).find(x => x.checkVisibility());  // not the sheet stage's hidden copy
    if (el && el.getAttribute('aria-invalid') !== 'true') {
      const was = el.getAttribute('aria-describedby');
      el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', [was, 'cbKwErr'].filter(Boolean).join(' '));
      el.addEventListener('input', () => { el.removeAttribute('aria-invalid'); was ? el.setAttribute('aria-describedby', was) : el.removeAttribute('aria-describedby'); }, {once: true});
    }
    el?.focus();
    return;
  }
  const alert = $('#noticeAlert');
  for (const card of cbKwErrs) { if (alert.textContent === card.dataset.msg) alert.textContent = ''; if (card.isConnected) card.querySelector('button').click(); }
  cbKwErrs.clear(); msg.textContent = '';
  const file = `${data.name.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'character'}-kettlewright.json`;
  // a data URL on an anchor that isn't in the page: nothing to revoke, and not inert behind the walkthrough's modal
  Object.assign(document.createElement('a'), {href: 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 4)), download: file}).click();
  notify(`Exported ${file}.${cb.edits?.slots || cb.edits?.petty ? ' Your inventory edits aren’t in it: it has your background’s gear as Kettlewright lists it.' : ''} Import it on Kettlewright with New from JSON.`);
});

// the callout sits under the page title (cairn-nav.js builds the title row first)
document.addEventListener('DOMContentLoaded', () => {
  const callout = $('#cbCallout'), row = $('.title-row');
  if (row) row.after(callout);
  renderPage();
});
})();

// The home page: the "Start playing" slideshow and the character sheet picker.
(() => {
  const $ = s => document.querySelector(s);
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');

  // the two switches pick a file; the Download button says which one (it opens the Player's Guide on itch.io)
  const sheetPick = () => {
    const v = n => document.querySelector(`input[name="${n}"]:checked`).value;
    $('#sheetDownload')?.setAttribute('aria-label', `Download the ${v('sheet-layout')} sheet, ${v('sheet-paper')}, from itch.io`);
  };
  document.querySelectorAll('.sheet-pick input').forEach(r => r.addEventListener('change', sheetPick));

  const band = $('#stepsBand');
  if (!band) return;

  // from 760px up the band is a short strip and slides crop from their `top`; below it the band shows the whole art
  const WIDE = matchMedia('(min-width: 760px)');
  const fitScenes = () => { for (const s of document.querySelectorAll('.step-scene')) s.setAttribute('viewBox', WIDE.matches ? s.dataset.wide : s.dataset.full); };
  fitScenes(); WIDE.addEventListener('change', fitScenes);

  // the slideshow: arrows move one step and wrap around; it advances on its own, but never with reduced motion,
  // and it holds while hovered, focused, paused, scrolled out of view, or in a hidden tab
  const show = $('.steps-show'), pauseBtn = $('#stepsPause'), JOIN = 48, EVERY = 7000, ANIM = 7000;
  const steps = () => band.querySelectorAll('.step');
  const width = () => steps()[0].offsetWidth - JOIN;
  const count = () => steps().length;
  const at = () => Math.round(band.scrollLeft / width());
  let paused = REDUCE.matches, seen = true, timer = 0, target = 0, shown = -1, played = false;
  const go = i => { target = (i + count()) % count(); band.scrollTo({left: target * width(), behavior: REDUCE.matches ? 'auto' : 'smooth'}); };
  // a step's animation plays each time it's arrived at, and once when the slideshow first comes into view
  const stepAt = i => steps()[i];
  const moves = i => !!stepAt(i)?.querySelector('.step-scene');
  const play = i => { if (REDUCE.matches || !moves(i)) return; const s = stepAt(i); s.classList.remove('is-animating'); void s.offsetWidth; s.classList.add('is-animating'); };
  // how long a step stays before the next: a step that moves waits for its animation to finish first
  const dwell = () => moves(target) && !REDUCE.matches ? ANIM + EVERY : EVERY;
  const label = () => { pauseBtn.textContent = paused ? 'Play' : 'Pause'; pauseBtn.setAttribute('aria-label', paused ? 'Play the steps slideshow' : 'Pause the steps slideshow'); };
  // hover and focus are read when the timer fires, so they hold it however they came about
  const held = () => paused || !seen || document.hidden || show.matches(':hover, :focus-within');
  const arm = () => { clearTimeout(timer); if (!paused && seen && !document.hidden) timer = setTimeout(() => { if (!held()) go(at() + 1); arm(); }, dwell()); };
  // when a scroll settles on a new step (arrows, swipe, keyboard or the timer), note it, restart the clock, and animate it
  let settle = 0, asked = false;
  band.addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      const i = at(); target = i;
      if (asked) { asked = false; $('#stepsSay').textContent = `Step ${i + 1} of ${count()}: ${stepAt(i).querySelector('h3 a')?.textContent || ''}`; }
      if (i !== shown) { stepAt(shown)?.classList.remove('is-animating'); shown = i; if (seen) play(i); arm(); }
    }, 160);
  }, {passive: true});
  $('#stepsPrev').addEventListener('click', () => { asked = true; go(at() - 1); arm(); });
  $('#stepsNext').addEventListener('click', () => { asked = true; go(at() + 1); arm(); });
  pauseBtn.addEventListener('click', () => { paused = !paused; label(); arm(); });
  show.addEventListener('mouseleave', arm); show.addEventListener('focusout', arm);  // a fresh wait once they leave
  document.addEventListener('visibilitychange', arm);
  new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    if (seen && !played) { played = true; shown = at(); play(shown); }
    arm();
  }, {threshold: .5}).observe(show);
  REDUCE.addEventListener('change', () => { if (REDUCE.matches) { paused = true; label(); arm(); } });
  label(); arm();
})();

// a cover that doesn't load (offline, or gone) becomes a panel with the adventure's name
document.addEventListener('error', ev => {
  const img = ev.target;
  if (img.matches?.('img.adv-cover')) { img.closest('.adv-art').classList.add('no-cover'); img.remove(); }
}, true);

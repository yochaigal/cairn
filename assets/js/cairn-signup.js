// The newsletter signup forms (_includes/cairn/signup.html). Sendy's list checks reCAPTCHA v2, so the box is
// loaded on the first touch of a form, not on every page view. A form posts into a hidden iframe so the
// visitor stays on the page; Sendy's answer is cross-origin and can't be read, so the thank-you is hedged.
(() => {
  const forms = [...document.querySelectorAll('form[data-signup]')];
  if (!forms.length) return;

  const sink = document.createElement('iframe');
  sink.name = 'signup-sink';
  sink.title = 'Newsletter signup response';
  sink.hidden = true;
  document.body.append(sink);

  // cleared first, so the same message written twice is announced twice
  const say = (form, text) => {
    const status = form.querySelector('.signup-status');
    clearTimeout(status.timer);  // a quick answer can follow "Sending…" within the delay
    status.textContent = '';
    if (text) status.timer = setTimeout(() => { status.textContent = text; }, 100);  // as notify() in cairn-dice.js
  };
  const showFallback = (form, on) => { form.querySelector('[data-signup-fallback]').hidden = !on; };

  let captcha = 'idle';  // idle → loading → ready, or failed (a late load still makes it ready)
  const widgets = new Map();

  window.cairnSignupCaptcha = () => {
    const late = captcha === 'failed';
    captcha = 'ready';
    for (const form of forms) {
      const box = form.querySelector('.signup-captcha');
      widgets.set(form, grecaptcha.render(box, { sitekey: box.dataset.sitekey, theme: 'dark' }));
      showFallback(form, false);
      if (form.dataset.waiting || late) {
        delete form.dataset.waiting;
        say(form, "The “I'm not a robot” box is ready, just above Subscribe. Tick it, then subscribe.");
      }
    }
  };
  const fail = () => {
    if (captcha === 'ready') return;
    captcha = 'failed';
    for (const form of forms) { say(form, "The signup box couldn't load; see the link below."); showFallback(form, true); }
  };
  const loadCaptcha = () => {
    if (captcha !== 'idle') return;
    captcha = 'loading';
    for (const form of forms) form.dataset.captcha = '';  // holds the box's space (_components.scss)
    const s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?onload=cairnSignupCaptcha&render=explicit';
    s.async = true;
    s.onerror = fail;
    document.head.append(s);
    setTimeout(fail, 10000);  // a load that hangs without erroring
  };

  for (const form of forms) {
    form.target = sink.name;
    form.addEventListener('focusin', loadCaptcha);
    form.addEventListener('pointerdown', loadCaptcha);
    form.addEventListener('input', () => { form.querySelector('.signup-captcha').hidden = false; });  // back for the next address
    form.addEventListener('submit', e => {
      if (form.dataset.pending) { e.preventDefault(); say(form, 'Still sending…'); return; }
      if (captcha === 'failed') { e.preventDefault(); fail(); return; }
      if (captcha !== 'ready') {
        e.preventDefault();
        loadCaptcha();
        form.dataset.waiting = '1';
        say(form, "One moment, loading the “I'm not a robot” box…");
        return;
      }
      if (!grecaptcha.getResponse(widgets.get(form))) {
        e.preventDefault();
        say(form, "Tick the “I'm not a robot” box first.");
        form.querySelector('.signup-captcha iframe')?.focus();
        return;
      }
      form.dataset.pending = '1';
      say(form, 'Sending…');
    });
  }

  sink.addEventListener('load', () => {
    const form = forms.find(f => f.dataset.pending);
    if (!form) return;  // the iframe's own about:blank load
    delete form.dataset.pending;
    form.reset();
    grecaptcha.reset(widgets.get(form));
    form.querySelector('.signup-captcha').hidden = true;
    const thanks = "Thanks! If this address is new to the list, you'll get an email to confirm.";
    say(form, '');
    window.CairnNotify(thanks);  // the site's notice (assets/js/cairn-dice.js), which screen readers hear too
  });
})();

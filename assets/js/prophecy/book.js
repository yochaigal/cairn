/*
 * The prophecy's scene: a three.js book on a near-black stage, seen through haze and rippled glass (ripple-pass.js).
 * The book is drawn into a texture each frame and the glass pass draws that to the screen, so the glass bends the
 * book itself: the haze gathers first, the book fades in behind it, then the haze clears.
 *
 * The scene follows TechTronixx's 3D-Ball-3js (https://github.com/TechTronixx/3D-Ball-3js), used as a reference only
 * (no code copied; see THIRD-PARTY-NOTICES.md): a 40° perspective camera, a point light up front, and OrbitControls
 * with damping and no pan or zoom. three.js is MIT (assets/vendor/three/LICENSE).
 *
 * The world is measured in CSS pixels at the book's own scale: a portrait volume, its pages 200 × 300, its boards a
 * little larger. Its cover is drawn per adventure on a canvas: cloth, a gilt border, the adventure's cover image set in
 * as a framed plate, and its name stamped below. The cover image is the site's own copy (_plugins/cairn_covers.rb),
 * since WebGL can't read most covers where they're hotlinked from.
 */
import * as THREE from '../../vendor/three/three.module.min.js';
import {OrbitControls} from '../../vendor/three/OrbitControls.js';
import {ripplePass} from './ripple-pass.js';

const W = 200, H = 300, D = 36, BOARD = 4, OVER = 5;   // the page block W × H × D; boards OVER larger round it
const BW = W + OVER, BH = H + 2 * OVER;                // a board, overhanging the pages at the top, bottom and fore-edge
const CLOTH = '#3a2219', GILT = ['#f3dba0', '#c9a063', '#8a6a35'], PAGE = '#e8dcc4';
const REST = {x: 0.04, y: 0.42};                       // the resting turn: the spine shows on the left
const FOV = 40, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const ease = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = x => 1 - Math.pow(1 - x, 3);
const SWAY_FOR = 4000, STILL_AFTER = 8000;             // ms at rest: the sway fades out, then the motes stop, then nothing is drawn

// createScene(host, {area}): area() is where the book sits ({top, bottom}, px within host). Throws without WebGL2.
export function createScene(host, {area}) {
  const renderer = new THREE.WebGLRenderer({antialias: false});
  const canvas = renderer.domElement;
  host.append(canvas);
  const target = new THREE.WebGLRenderTarget(1, 1, {samples: 4, colorSpace: THREE.SRGBColorSpace});

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 10000);
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x141218, 1.1));
  const key = new THREE.PointLight(0xffecd2, 2.6, 0, 0);
  key.position.set(-260, 340, 700);
  scene.add(key);
  const rim = new THREE.PointLight(0x9fb4ff, 0.8, 0, 0);
  rim.position.set(420, -80, -200);
  scene.add(rim);

  // ---------- the book: boards, a spine, and the page block between them
  const book = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({color: CLOTH, roughness: 0.85});
  const coverTex = canvasTexture(1, 1), spineTex = canvasTexture(1, 1);  // drawn per adventure by show()
  coverTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const front = new THREE.MeshStandardMaterial({map: coverTex, roughness: 0.75});
  const spineMat = new THREE.MeshStandardMaterial({map: spineTex, roughness: 0.8});
  const edge = canvasTexture(64, 512, pagesArt), edgeTurned = edge.clone();
  edgeTurned.center.set(0.5, 0.5); edgeTurned.rotation = Math.PI / 2;
  const pages = new THREE.MeshStandardMaterial({map: edge, roughness: 0.95});
  const pagesTop = new THREE.MeshStandardMaterial({map: edgeTurned, roughness: 0.95});
  const board = (z, faces) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BOARD), faces);
    m.position.set(OVER / 2, 0, z);
    return m;
  };
  // box faces: +x, -x, +y, -y, +z, -z
  book.add(board(D / 2 + BOARD / 2, [cloth, cloth, cloth, cloth, front, cloth]));
  book.add(board(-D / 2 - BOARD / 2, [cloth, cloth, cloth, cloth, cloth, cloth]));
  const spine = new THREE.Mesh(new THREE.BoxGeometry(BOARD, BH, D + 2 * BOARD), [cloth, spineMat, cloth, cloth, cloth, cloth]);
  spine.position.x = -W / 2 - BOARD / 2;
  book.add(spine);
  const block = new THREE.Mesh(new THREE.BoxGeometry(W - 2, H, D), [pages, pages, pagesTop, pagesTop, pages, pages]);
  block.position.x = 1;
  book.add(block);
  scene.add(book);

  // ---------- the glass pass, over the whole screen
  const glass = ripplePass(target.texture), U = glass.uniforms;
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glass);
  quad.frustumCulled = false;
  const screen = new THREE.Scene();
  screen.add(quad);
  const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ---------- dragging to turn: a press on the book turns it; any other press is a click. After a drag the book
  // settles, then swings back to the front. Only sideways, so a phone can still scroll the dialog by swiping up or down.
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, {enableDamping: true, dampingFactor: 0.08, enablePan: false, enableZoom: false, enabled: false,
    minAzimuthAngle: -1.2, maxAzimuthAngle: 1.2, minPolarAngle: Math.PI / 2, maxPolarAngle: Math.PI / 2});
  canvas.style.touchAction = 'pan-y';
  const ray = new THREE.Raycaster(), point = new THREE.Vector2();
  function onBook(x, y) {
    camera.updateMatrixWorld();
    const r = canvas.getBoundingClientRect();
    point.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(point, camera);
    return ray.intersectObject(book, true).length > 0;
  }
  let dist, returning = null, settle = 0, downAt = null, dragged = false;
  // the motion's state, declared before resize() below, whose wake() reads raf and last. tweens holds what's running
  // (haze, book, clear, text)
  const tweens = {};
  let restAt = 0, raf = 0, clock = 0, last = 0, dead = false;
  // any press: decided before OrbitControls sees it (on the window, in the capture phase), so a press anywhere else
  // ends the last drag, and only a press on the book can turn it
  const onDown = e => {
    dragged = false;
    const hit = e.target === canvas && onBook(e.clientX, e.clientY);
    controls.enabled = hit;
    downAt = hit ? [e.clientX, e.clientY] : null;
    if (hit) { clearTimeout(settle); returning = null; wake(); }
  };
  const onMove = e => { if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 4) dragged = true; };
  const onUp = () => { downAt = null; };
  addEventListener('pointerdown', onDown, true);
  addEventListener('pointermove', onMove);
  addEventListener('pointerup', onUp);
  addEventListener('pointercancel', onUp);
  controls.addEventListener('end', () => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      // against the turn limit the camera doesn't move, so the loop sleeps and the drag's momentum never fades: drop it, or it
      // would carry the book back out once the swing back is done
      controls.enableDamping = false; controls.update(); controls.enableDamping = true;
      returning = {from: new THREE.Spherical().setFromVector3(camera.position), t0: performance.now()};
      wake();
    }, 700);
  });

  // ---------- fitting the book in its area: the camera backs off until the book is the right height, and a view offset
  // puts its centre in the middle of the area rather than of the screen
  let cy, hostH, dpr;
  function resize() {
    const a = area(), hostW = host.clientWidth;
    hostH = host.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(hostW, hostH, false);
    target.setSize(Math.round(hostW * dpr), Math.round(hostH * dpr));
    const px = Math.max(150, Math.min((a.bottom - a.top) * 0.86, hostW * 0.62 * BH / BW, 460));
    dist = (BH * hostH) / (2 * TAN * px);
    cy = (a.top + a.bottom) / 2;
    camera.aspect = hostW / hostH;  // before updateProjectionMatrix
    camera.setViewOffset(hostW, hostH, 0, hostH / 2 - cy, hostW, hostH);
    camera.near = dist / 10; camera.far = dist * 10;
    if (!returning) camera.position.setLength(dist);  // (a drag in progress keeps its angle)
    camera.updateProjectionMatrix();
    controls.update();
    U.uResolution.value.set(hostW * dpr, hostH * dpr);
    U.uGlow.value.set(0.5, 1 - cy / hostH);
    U.uWavelength.value = 50 * dpr; U.uWidth.value = 80 * dpr; U.uRefraction.value = 34 * dpr; U.uDpr.value = dpr;
    U.uCalm.value = (hostH - a.bottom - 12) * dpr;              // where the text starts, px up from the bottom
    wake();
  }
  camera.position.set(0, 0, 1);
  addEventListener('resize', resize);
  resize();

  // ---------- motion. The haze gathers on the black, the book fades in inside it (turned a little away, easing to its
  // rest), then the haze clears. Then the book sways a little, then stills.
  const pose = {rx: REST.x, ry: REST.y};
  const turnTo = p => { pose.rx = REST.x + 0.2 * (1 - p); pose.ry = REST.y + 0.45 * (1 - p); };  // p: 0 turned away, 1 at rest
  const lerp = (u, from, to) => x => { u.value = from + (to - from) * easeOut(x); };
  function wake() { if (!raf && !dead) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function frame(now) {
    raf = 0;
    const dt = Math.min(now - last, 50); last = now;
    let moving = false;
    for (const [name, tw] of Object.entries(tweens)) {
      const x = Math.min((now - tw.start) / tw.ms, 1);
      tw.step(x);
      if (x < 1) { moving = true; continue; }
      delete tweens[name];
      if (name === 'clear' && U.uClear.value === 1) restAt = now;
      tw.done();
    }
    if (returning) {
      const x = Math.min((now - returning.t0) / 600, 1), e = easeOut(x), f = returning.from;
      camera.position.setFromSphericalCoords(dist, f.phi + (Math.PI / 2 - f.phi) * e, f.theta * (1 - e));
      camera.lookAt(0, 0, 0);
      moving = true;
      if (x === 1) returning = null;
    } else if (controls.update()) moving = true;
    const hazy = U.uHaze.value > 0 && U.uClear.value < 1;
    const live = hazy || now - restAt < STILL_AFTER;
    if (live) clock += dt / 1000;                                // the glass and the motes keep their own time, and stop
    render(hazy ? 0 : THREE.MathUtils.clamp(1 - (now - restAt - SWAY_FOR) / 2000, 0, 1));
    if (moving || live || downAt) raf = requestAnimationFrame(frame);  // (a press on the book keeps drawing: OrbitControls moves the camera between frames)
  }
  function place(sway) {
    book.position.y = Math.sin(clock * 0.9) * 3 * sway;
    book.rotation.set(pose.rx + Math.sin(clock * 0.5) * 0.02 * sway, pose.ry + Math.sin(clock * 0.6) * 0.06 * sway, 0);
  }
  function render(sway = 0) {
    place(sway);
    U.uTime.value = clock;
    renderer.setRenderTarget(target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(screen, flat);
  }
  const run = (name, ms, step) => new Promise(done => { tweens[name] = {start: performance.now(), ms, step, done}; wake(); });

  turnTo(0);
  render();

  return {
    // the adventure on the cover and the spine (resolves once its cover image has loaded, failed, or taken too long)
    async show(entry) {
      const img = entry.cover ? await loadImage(entry.cover) : null;
      await document.fonts.load('700 64px Alegreya').catch(() => {});
      if (dead) return;  // closed while the cover loaded
      // dispose first: the placeholders were uploaded 1 × 1, and a bigger image can't be written into that storage
      coverTex.dispose(); spineTex.dispose();
      coverTex.image = coverArt(entry, img); coverTex.needsUpdate = true;
      spineTex.image = spineArt(entry.name); spineTex.needsUpdate = true;
      wake();
    },
    // the haze gathers, the book fades in inside it, the haze clears (the controller times each)
    haze: ms => run('haze', ms, x => { U.uHaze.value = ease(x); }),
    appear: ms => run('book', ms, x => { U.uBook.value = ease(x); turnTo(U.uBook.value); }),
    clear: ms => run('clear', ms, lerp(U.uClear, 0, 1)),
    // the text is in (or away): only then is the area behind it kept dark
    text: (on, ms) => run('text', ms, lerp(U.uText, U.uText.value, on ? 1 : 0)),
    // the haze closes back over the book and the book fades from it, ready for the next
    cloud(ms) {
      restAt = 0;  // no sway while it's hidden
      const b = U.uBook.value;
      return Promise.all([
        run('clear', ms, lerp(U.uClear, U.uClear.value, 0)),
        run('book', ms, x => { U.uBook.value = b * (1 - easeOut(x)); turnTo(U.uBook.value); }),
      ]);
    },
    // straight to the end. If that cuts the reveal short, the motion stops too; if it had already finished, the
    // sway and motes run their course
    skip() {
      const cut = U.uClear.value < 1;
      for (const name in tweens) { tweens[name].done(); delete tweens[name]; }
      U.uHaze.value = 1; U.uBook.value = 1; U.uClear.value = 1; U.uText.value = 1;
      turnTo(1);
      if (cut) restAt = performance.now() - STILL_AFTER;
      wake();
    },
    wasDrag: () => dragged,
    onBook,
    destroy() {
      dead = true;
      cancelAnimationFrame(raf); clearTimeout(settle);
      removeEventListener('resize', resize);
      removeEventListener('pointerdown', onDown, true);
      removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
      controls.dispose();
      for (const s of [scene, screen]) s.traverse(o => { o.geometry?.dispose(); [].concat(o.material || []).forEach(m => { m.map?.dispose(); m.dispose(); }); });
      target.dispose();
      renderer.dispose(); renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

// a cover that won't load, or takes longer than 2.5 s, becomes the name plate. (onload, not decode(): decode() can
// wait indefinitely in a page that isn't being painted)
function loadImage(src) {
  return new Promise(done => {
    const img = new Image();
    img.onload = () => done(img);
    img.onerror = () => done(null);
    setTimeout(done, 2500, null);
    img.src = src;
  });
}

function canvasTexture(w, h, paint) {
  const c = Object.assign(document.createElement('canvas'), {width: w, height: h});
  paint?.(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function gilt(g, y0, y1) {
  const r = g.createLinearGradient(0, y0, 0, y1);
  r.addColorStop(0, GILT[0]); r.addColorStop(0.5, GILT[1]); r.addColorStop(1, GILT[2]);
  return r;
}
// cloth: its colour, a fine weave, darker at the edges
function clothArt(g, w, h) {
  g.fillStyle = CLOTH; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h / 90; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,230,200'}, ${0.03 + Math.random() * 0.04})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
}
// the cover: cloth, a gilt double rule, the cover image in a gilt frame (or the group and name, as on the cards'
// panel), and the name stamped below with a gilt diamond rule
function coverArt(entry, img) {
  const w = 1024, h = Math.round(w * BH / BW);
  const c = Object.assign(document.createElement('canvas'), {width: w, height: h}), g = c.getContext('2d');
  clothArt(g, w, h);
  g.strokeStyle = gilt(g, 0, h);
  g.lineWidth = 6; g.strokeRect(46, 46, w - 92, h - 92);
  g.lineWidth = 2; g.strokeRect(62, 62, w - 124, h - 124);
  // the plate and the name below it, centred on the cover a little above the middle
  const pw = w - 240, ph = Math.round(pw * 250 / 315), px = 120, py = Math.round((h - ph - 380) / 2);
  g.save();
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
  g.fillStyle = '#1b1517'; g.fillRect(px - 18, py - 18, pw + 36, ph + 36);
  g.restore();
  if (img) {
    const s = Math.max(pw / img.naturalWidth, ph / img.naturalHeight), iw = img.naturalWidth * s, ih = img.naturalHeight * s;
    g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
    g.drawImage(img, px + (pw - iw) / 2, py + (ph - ih) / 2, iw, ih);
    g.restore();
  } else {
    g.fillStyle = '#26212a'; g.fillRect(px, py, pw, ph);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = GILT[1]; g.font = '700 34px Alegreya, Georgia, serif';
    g.fillText(entry.group.toUpperCase(), w / 2, py + 70);
    stamp(g, entry.name, w / 2, py + ph / 2 + 20, pw - 80, 64, 2, '#e3e9f0');
  }
  g.strokeStyle = gilt(g, py - 18, py + ph + 18);
  g.lineWidth = 10; g.strokeRect(px - 14, py - 14, pw + 28, ph + 28);
  g.lineWidth = 2; g.strokeRect(px - 4, py - 4, pw + 8, ph + 8);
  const end = stamp(g, entry.name, w / 2, py + ph + 150, w - 240, 84, 3);
  const ry = Math.min(end + 70, h - 120);
  g.fillStyle = gilt(g, ry - 12, ry + 12);
  g.fillRect(w / 2 - 160, ry - 1.5, 130, 3); g.fillRect(w / 2 + 30, ry - 1.5, 130, 3);
  g.beginPath(); g.moveTo(w / 2, ry - 12); g.lineTo(w / 2 + 12, ry); g.lineTo(w / 2, ry + 12); g.lineTo(w / 2 - 12, ry); g.fill();
  return c;
}
// words centred and wrapped to at most `lines` lines, shrunk until they fit, stamped in gilt (or `colour`) with a
// pressed-in shadow. Returns the bottom of the last line.
function stamp(g, text, x, y, width, size, lines, colour) {
  let rows = [text];
  for (; size > 20; size -= 4) {
    g.font = `700 ${size}px Alegreya, Georgia, serif`;
    rows = wrap(g, text, width);
    if (rows.length <= lines && rows.every(r => g.measureText(r).width <= width)) break;
  }
  const lh = size * 1.15, top = y - ((rows.length - 1) * lh) / 2;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  rows.forEach((r, i) => {
    const ry = top + i * lh;
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillText(r, x + 2, ry + 3);
    g.fillStyle = colour || gilt(g, ry - size / 2, ry + size / 2); g.fillText(r, x, ry);
  });
  return top + (rows.length - 1) * lh + size / 2;
}
function wrap(g, text, width) {
  const rows = [];
  let row = '';
  for (const word of text.split(/\s+/)) {
    const next = row ? row + ' ' + word : word;
    if (row && g.measureText(next).width > width) { rows.push(row); row = word; } else row = next;
  }
  if (row) rows.push(row);
  return rows;
}
// the spine: cloth, gilt bands, and the name running down it
function spineArt(name) {
  const w = 128, h = 1536, c = Object.assign(document.createElement('canvas'), {width: w, height: h}), g = c.getContext('2d');
  clothArt(g, w, h);
  g.fillStyle = gilt(g, 0, h);
  for (const y of [0.06, 0.075, 0.925, 0.94]) g.fillRect(0, h * y, w, h * 0.006);
  g.save();
  g.translate(w / 2, h / 2); g.rotate(Math.PI / 2);
  stamp(g, name, 0, 0, h * 0.72, 56, 1);
  g.restore();
  return c;
}
// the page block's edges: cream leaves, a line for each few, across the book's depth
function pagesArt(g, w, h) {
  g.fillStyle = PAGE; g.fillRect(0, 0, w, h);
  for (let x = 1; x < w - 1; x += 2) { g.fillStyle = `rgba(120, 100, 70, ${0.07 + Math.random() * 0.12})`; g.fillRect(x, 0, 1, h); }
  g.fillStyle = 'rgba(0, 0, 0, .2)'; g.fillRect(0, 0, 1, h); g.fillRect(w - 1, 0, 1, h);
}

/*
 * The prophecy's glass: haze swirling at the book's centre, rings of rippled glass spreading from it, and the book
 * coming into view through them, bent and split into colour, then clearing as the haze disperses.
 *
 * Adapted from the Ripple effect in canvas-ui by David Haz (https://github.com/DavidHDev/canvas-ui,
 * src/lib/Ripple/RippleVanilla.ts at commit a0be3b7e1f42d0d1bafde470b6794b39f6729502). Kept from it: its wave model
 * (a Gaussian train of crests, their slope summed into a gradient, the glint and shade read off that gradient, and the
 * gradient's refraction of the content split into red, green and blue) and its clamped sampling of the content texture.
 * Changed: the rings are born at the book's centre and repeat while the haze is up, instead of following a pointer;
 * the content is the prophecy's own scene (the book, drawn by three.js into a texture) over a near-black stage with
 * drifting motes, instead of a capture of the page; and a swirl and a fog turn about the centre. It runs as a three.js
 * full-screen pass rather than its own WebGL program.
 *
 * MIT + Commons Clause License Condition v1.0
 *
 * Copyright (c) 2026 David Haz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, and distribute the Software **as part of
 * an application, website, or product**, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * Commons Clause Restriction
 *
 * You may use this Software, including for any commercial purpose, **so long as
 * you do not sell, sublicense, or redistribute the components themselves -
 * whether alone, in a bundle, or as a ported version.**
 *
 * No Warranty
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import * as THREE from '../../vendor/three/three.module.min.js';

const VERT = `void main () { gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// gl_FragCoord runs from the bottom left. The glass is centred on uGlow (the book). veil is how much haze there is:
// it gathers (uHaze), then disperses (uClear); with none the picture is the plain scene.
const FRAG = `
out vec4 outColor;
const float TAU = 6.28318530718;
const float DISPERSION = 0.9;   // Ripple's uDispersion and uShine, fixed here
const float SHINE = 0.3;
const float CYCLE = 3.2;        // seconds for a ring to travel out; a second one runs half a cycle behind
uniform sampler2D tScene;
uniform vec2 uResolution;
uniform vec2 uGlow;
uniform float uHaze;
uniform float uBook;
uniform float uClear;
uniform float uTime;
uniform float uWavelength;
uniform float uWidth;
uniform float uRefraction;
uniform float uDpr;
uniform float uCalm;
uniform float uText;   // 0 while the text is away, 1 once it's in: only then is the area behind it kept dark

float veil;

float hash (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise (vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm (vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; }
  return s;
}

// Ripple's page(): the content, clamped to its edges. The scene is stored linear; the glass mixes in display (sRGB)
// colours, as its stage and motes are written. The book fades in as uBook (its edges are premultiplied, so alpha goes
// with it)
vec3 toSrgb (vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec4 page (vec2 p) {
  vec4 c = texture(tScene, clamp(p, vec2(0.0005), vec2(0.9995)));
  return vec4(toSrgb(c.rgb), c.a) * uBook;
}

// the stage: near-black, the faintest warm glow where the book sits, a lattice that's barely there
vec3 stage (vec2 f) {
  vec2 uv = f / uResolution;
  vec3 col = vec3(0.018, 0.017, 0.024);
  vec2 g = (uv - uGlow) * vec2(uResolution.x / uResolution.y, 1.0);
  col += vec3(0.95, 0.72, 0.45) * 0.045 * exp(-dot(g, g) * 4.0);
  vec2 q = vec2(f.x + f.y, f.x - f.y) / (46.0 * uDpr);
  vec2 e = abs(fract(q) - 0.5);
  col += vec3(0.62, 0.55, 0.45) * (1.0 - smoothstep(0.0, 0.03, min(e.x, e.y))) * 0.016;
  return col * (1.0 - 0.6 * smoothstep(0.3, 0.85, length((uv - 0.5) * vec2(1.1, 1.0))));
}

// motes: sparse specks, warm and cool, drifting up and twinkling; one in about three cells of a 64px grid. None drift
// behind the text (below uCalm), so they never cross its letters; the glass is whole to the bottom of the screen until
// the text comes
float calm (float y) { return mix(1.0, smoothstep(uCalm - 40.0 * uDpr, uCalm + 20.0 * uDpr, y), uText); }
vec3 motes (vec2 f) {
  float k = calm(f.y);
  if (k <= 0.0) return vec3(0.0);
  float cell = 64.0 * uDpr;
  vec2 g = f / cell + vec2(0.0, -uTime * 0.08);
  vec2 id = floor(g), q = fract(g);
  float r = hash(id);
  if (r > 0.34) return vec3(0.0);
  vec2 c = vec2(hash(id + 1.7), hash(id + 3.1)) * 0.7 + 0.15 + 0.07 * vec2(sin(uTime * 0.7 + r * 40.0), cos(uTime * 0.5 + r * 20.0));
  float d = length((q - c) * cell) / uDpr;
  float tw = 0.55 + 0.45 * sin(uTime * (1.3 + r * 3.0) + r * 60.0);
  float a = (exp(-d * d / 1.4) + 0.18 * exp(-d * d / 26.0)) * tw;
  return mix(vec3(1.0, 0.8, 0.52), vec3(0.62, 0.76, 1.0), step(0.17, r)) * a * 0.6 * k;
}

// the swirl: positions are carried round the centre, most at the middle, so everything seen through it turns a little
vec2 twirl (vec2 f) {
  vec2 c = uGlow * uResolution, d = f - c;
  float r = length(d) / (0.5 * uResolution.y);
  float a = 1.5 * veil * exp(-r * r * 1.6) * (0.8 + 0.2 * sin(uTime * 0.8));
  float cs = cos(a), sn = sin(a);
  return c + mat2(cs, -sn, sn, cs) * d;
}

// what's behind the glass: the stage, the motes, and the book over them, all through the swirl
vec3 world (vec2 f) {
  vec2 p = twirl(f);
  vec4 b = page(p / uResolution);
  return (stage(p) + motes(p)) * (1.0 - b.a) + b.rgb;  // the scene's edges come premultiplied
}

void main () {
  vec2 frag = gl_FragCoord.xy;
  veil = uHaze * (1.0 - uClear);
  vec2 rv = frag - uGlow * uResolution;
  float r = length(rv);
  vec2 n = rv / max(r, 0.001);
  float rr = r / (0.5 * uResolution.y);       // distance from the centre in half screen heights
  float core = exp(-rr * rr * 0.9);
  float k = TAU / uWavelength;
  float w2 = uWidth * uWidth;
  float reach = 0.62 * length(uResolution);

  // Ripple's wave train, its source the centre: two rings, each born there, travelling out and fading. Their edges
  // wobble a little so they aren't perfect circles
  float wob = (noise(rv * 0.012 / uDpr + uTime * 0.4) - 0.5) * 18.0 * uDpr;
  float dh = 0.0;
  for (int i = 0; i < 2; i++) {
    float t = fract(uTime / CYCLE + 0.5 * float(i));
    float s = r - t * reach + uWidth * 0.55 + wob;
    float env = exp(-s * s / w2) * (1.0 - t) * smoothstep(0.0, 0.1, t);
    dh += (k * cos(s * k) - 2.0 * s / w2 * sin(s * k)) * env;
  }
  vec2 grad = n * dh * uWavelength * 0.16 * veil;

  // the haze: thickest at the middle, thinner towards the edges
  float haze = veil * (0.5 + 0.5 * core);
  // the picture shimmers like heat over water while it's there
  vec2 shimmer = vec2(sin(frag.y * 0.045 / uDpr + uTime * 3.1), cos(frag.x * 0.04 / uDpr + uTime * 2.3)) * 4.0 * uDpr * haze;
  vec2 offs = grad * uRefraction + shimmer;

  // refraction split into red, green and blue (Ripple's dispersion)
  float d = DISPERSION * 0.35;
  vec3 col = vec3(world(frag + offs * (1.0 + d)).r, world(frag + offs).g, world(frag + offs * (1.0 - d)).b);
  // and seen through haze: softened by a ring of taps
  float quiet = calm(frag.y);  // none of what follows lies behind the text
  if (haze > 0.01) {
    float rad = haze * 18.0 * uDpr;
    vec3 soft = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float a = float(i) * TAU / 8.0 + uTime * 0.6;
      soft += world(frag + offs + vec2(cos(a), sin(a)) * rad);
    }
    soft /= 8.0;
    col = mix(col, soft, haze * 0.85);
    col += soft * haze * 0.35 * quiet;
  }

  // the fog: noise carried round the centre, the inner part turning faster so it winds into arms, warm and cool
  float turn = uTime * 0.25 + 2.6 * exp(-rr * rr * 1.0);
  float ct = cos(turn), st = sin(turn);
  vec2 fq = mat2(ct, -st, st, ct) * rv / (240.0 * uDpr);
  float f = smoothstep(0.25, 0.85, fbm(fq + vec2(0.0, uTime * 0.05)));
  float fog = f * (0.35 + 0.65 * core) * veil * quiet;
  vec3 tint = mix(vec3(1.0, 0.78, 0.5), vec3(0.6, 0.72, 1.0), noise(fq * 1.7 + 4.0));
  col += tint * fog * 0.3;

  // Ripple's glint and shade, lit along the ring's own normal so both sides of each crest catch it, with an
  // iridescent edge
  float g = dot(grad, n) * 0.9 + dot(grad, vec2(-0.55, -0.8)) * 0.3;
  float glint = pow(clamp(g * 1.8, 0.0, 1.0), 3.0) * SHINE * quiet;
  float shade = pow(clamp(-g * 1.6, 0.0, 1.0), 2.0) * SHINE * 0.35;
  vec3 irid = 0.55 + 0.45 * cos(TAU * (r / uWavelength * 0.35 + vec3(0.0, 0.33, 0.67)));
  col += glint * mix(vec3(1.0, 0.92, 0.8), irid, 0.2);
  col *= 1.0 - shade;

  outColor = vec4(col, 1.0);
}`;

// the pass's material; book.js draws it over a full-screen quad, with its scene in tScene, and sets the sizes (the
// zeros below) from the screen's
export function ripplePass(tScene) {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tScene: {value: tScene},
      uResolution: {value: new THREE.Vector2()}, uGlow: {value: new THREE.Vector2()},
      uHaze: {value: 0}, uBook: {value: 0}, uClear: {value: 0}, uTime: {value: 0}, uText: {value: 0},
      uWavelength: {value: 0}, uWidth: {value: 0}, uRefraction: {value: 0}, uDpr: {value: 1}, uCalm: {value: 0},
    },
  });
}

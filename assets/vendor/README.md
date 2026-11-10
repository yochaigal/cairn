# Vendored libraries

Served from this site instead of a CDN. Each is loaded only when it's used.

- `dice-box/`: [@3d-dice/dice-box](https://github.com/3d-dice/dice-box) 1.1.4 (MIT; see `dice-box/LICENSE`).
  The runtime files from its npm package's `dist/`: `dice-box.es.min.js`, the `world.*.min.js` and `Dice.min.js` it
  imports, and `assets/` (the physics engine and the default dice theme; the models and textures are CC0). Loaded the
  first time someone rolls 3D dice.
- `pdf-lib/`: [pdf-lib](https://github.com/Hopding/pdf-lib) 1.17.1 (MIT; see `pdf-lib/LICENSE.md`), its
  `dist/pdf-lib.min.js`. Loaded by the character builder when it fills in a character sheet.
- `three/`: [three.js](https://github.com/mrdoob/three.js) 0.186.1 (MIT; see `three/LICENSE`). jsDelivr's Terser
  builds of its npm package's `build/three.module.js` and `build/three.core.js` (the package ships no minified ES
  modules), saved as `three.module.min.js` and `three.core.min.js`, and the `examples/jsm/controls/OrbitControls.js`
  addon, from `https://cdn.jsdelivr.net/npm/three@0.186.1/`. Their imports are rewritten to point at each other, so no
  import map is needed: both `"./three.core.js"` in `three.module.min.js` (the `import` and the `export … from`)
  became `"./three.core.min.js"`, and the addon's `from 'three'` became `from './three.module.min.js'`. Loaded by the
  Adventures page's prophecy (`assets/js/prophecy/book.js`) when it's first wanted.

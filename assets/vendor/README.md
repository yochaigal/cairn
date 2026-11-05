# Vendored libraries

Served from this site instead of a CDN. Each is loaded only when it's used.

- `dice-box/`: [@3d-dice/dice-box](https://github.com/3d-dice/dice-box) 1.1.4 (MIT; see `dice-box/LICENSE`).
  The runtime files from its npm package's `dist/`: `dice-box.es.min.js`, the `world.*.min.js` and `Dice.min.js` it
  imports, and `assets/` (the physics engine and the default dice theme; the models and textures are CC0). Loaded the
  first time someone rolls 3D dice.
- `pdf-lib/`: [pdf-lib](https://github.com/Hopding/pdf-lib) 1.17.1 (MIT; see `pdf-lib/LICENSE.md`), its
  `dist/pdf-lib.min.js`. Loaded by the character builder when it fills in a character sheet.

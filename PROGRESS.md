# Progress

## M0 — Scaffold (2026-11-10)

**Built**
- Vite 8 + TypeScript 7 (strict) + Vitest 5 project on branch `m0-scaffold`.
- `src/sim/`: seeded RNG (mulberry32, serializable state), world state from `balance.json`, game commands that never throw. An architecture test keeps `sim/` pure (no `Math.random`, DOM, storage, `render/`, `ui/` or `three` imports).
- Dev-only debug hook `window.__hearthcrown` (`getState()`, `cmd(name, args)`), loaded by a dynamic import so production builds don't contain it.
- The world: a Three.js 3D papercraft diorama (PLAN.md 2.2, chosen after a hands-on test). M0 shows the empty board: grass with a tile grid, 3.5px ink edges, a wooden base standing on a plank stage floor, sun shadows. The camera turns in 45° steps (Q/E or on-screen buttons, PC only) and zooms (+/− or wheel), animating smoothly unless reduced motion is set.
- UI direction "Toy Theatre" chosen on the Impeccable decision page: red scalloped pelmet top bar with Day, Time, Gold and the Loved/Feared meter read from the sim; desktop key hints; marigold reserved for focus. `DESIGN.md` + `.impeccable/design.json` written from the build after the Impeccable finish review shipped.
- 58 unit tests (RNG, sim, debug hook, architecture, view size, camera math, camera keys, top-bar formatting).

**Browser check (Playwright, dev server)**
- Console: no errors or warnings.
- Debug hook: starts at seed 7, day 1, 6:00, 100 gold, reputation 0; mutating `getState()` output doesn't change the game; `setSeed 42` works; unknown or malformed commands return `{ ok: false, error }`.
- Keyboard only: Tab focuses the map with the marigold frame; E twice turns 90°; − zooms out; Esc does nothing.
- Screenshots at 1280×800 and 844×390: the diorama fills the window, no scrollbars, the WebGL canvas matches the window size, the top bar fits on one line at phone size.
- `npm run build`: no type errors, and `__hearthcrown` does not appear in `dist/`.

**Choices made** (details in the M0 ledger)
- `startingGold` 100 (set by the human). Only `setSeed` exists in `cmd` so far.
- Three.js 0.186.1 and @types/three 0.186.0, pinned exactly. Its soft shadow mode was removed in 0.186, so standard PCF shadows are used.
- Fonts self-hosted with @fontsource (Lilita One, Nunito 5.3.0).
- Camera and map numbers live in `balance.json`. Until M2 gives the camera a princess to follow, it frames the board's south-east corner.
- The top bar, turn buttons, wheel zoom and key hints were added to M0 so Impeccable had a real shell to document; the plan only required the map.

**Known issues / left for later**
- Pinch-to-zoom on phones is not built yet (proposed for M2, waiting on the human's OK). Phones currently can't zoom.
- Grass tufts are painted into the ground texture and lie sideways when the camera turns.
- The JS bundle is 538 kB (135 kB gzipped), almost all Three.js; Vite warns about chunk size.
- Not yet built from the design contract: panel flats, Back button, proscenium dialogs, princess chip, Emberstone and speed in the top bar, day/dusk lighting.

**Next:** M1, Map & placement.

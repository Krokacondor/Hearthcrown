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
- After the final code review: `cmd()` now truly never throws (null args, odd names), phones pinch to zoom (one step per 15% finger spread), and wheel zoom builds up small trackpad movements (one step per 100px).
- Smaller review notes deferred to later milestones (seed normalising, deep-readonly world, DPR change on monitor switch, no-WebGL focus label, top-bar refresh, wider purity guard, texture size limit) are listed in the M0 ledger and below.
- The top bar, turn buttons, wheel zoom and key hints were added to M0 so Impeccable had a real shell to document; the plan only required the map.

**Known issues / left for later**
- Grass tufts are painted into the ground texture and lie sideways when the camera turns.
- The JS bundle is 538 kB (135 kB gzipped), almost all Three.js; Vite warns about chunk size.
- `setSeed 3.7` reports 3.7 but plays as seed 3; normalise the stored seed before saves exist (M18).
- The top bar renders once; it needs a refresh path when time starts moving (M3).
- Without WebGL the map stays focusable with a camera-keys label.
- Not yet built from the design contract: panel flats, Back button, proscenium dialogs, princess chip, Emberstone and speed in the top bar, day/dusk lighting.

**Next:** M1, Map & placement.

## M1: Map & placement (2026-11-16)

**Built**
- `data/map.json` and `sim/townMap.ts`: a 66×48 board with wall stages (stage 1 is the chapter 1 town, 40×32 inside the walls), three gates, the plaza with the statue, castle grounds on the north wall, the quest board, the citizens' 78 starting roads (the north-south road through the plaza is 2 squares wide, and so is the south gate) and dirt roads out of the gates. Gates have a width in map.json. Bad data fails at startup with a message naming the field.
- `data/buildings.json` and `sim/buildings.ts`: Cottage 1×1, Family Home 2×1, Manor 2×2, Adventurers' Lodge 3×2 and the Castle 6×4, each with its own door squares, turned to 4 facings.
- `sim/grid.ts`: open-grid placement rules (inside the walls, no overlap, a road at the door) and roads that must join the network. The no-stranding rule refuses removing a road that would cut off a building, a gate or a piece of road, and names what would be cut off.
- Game commands `placeBuilding`, `placeRoad`, `removeRoad`, `checkPlacement`; a new game starts with the castle standing (until the M15 cutscene) and the snapshot counts roads.
- Art registry and packs (`render/art/`): art by ID, pack manifests that fall back to built-in SVG drawings piece by piece, panels for every building, tiles, wall stone, the statue and quest board.
- The walled town in 3D: walls with corner towers, gatehouses, cobbled roads joined into one surface, plaza, cut-out statue and quest board, papercraft buildings from five panels. Buildings, walls and gatehouses fade when they block what you are placing.
- Build menu and build mode (brief: `docs/design/build-menu-brief.md`): Build button bottom-left, the Build flat slides on from the right and shrinks to a tray while placing. Marigold footprint, green or red tint, ink door arrows, paper drop on placing, "Cottage built" in the tray. Keyboard (arrows square by square relative to the camera, R turns, Enter places, hold Enter to paint roads), mouse (point, click, drag to paint) and touch (tap to preview, tap again or Place, drag to paint, a second finger cancels). Back goes tray, flat, closed by Esc, right-click or Back buttons.
- Every key comes from `data/keybindings.json`; on-screen key hints are gone (a Settings key bindings screen is planned for M18).
- PLAN.md updated: open grid, wall stages, the opening cutscene, the quest board and Lodge, pillar 9 "Room for everything", no well, Settings key bindings.
- 169 unit tests.

**Browser check (Playwright, dev server)**
- Console: no errors or warnings at 1280×800 or 844×390.
- New game: `getState()` shows buildings 1 (the castle) and roads 56 (78 after the road was widened on 2026-11-16).
- Keyboard only: Tab to the map, B, arrows and Enter built a Cottage and an Adventurers' Lodge; R turns; holding Enter painted 4 connected road squares; Esc twice closed everything; right-click went back one level.
- Mouse: a fast two-event drag painted 9 connected squares with no gaps. Touch (synthesized finger events at 844×390): tap previews, Place builds, a drag painted 11 squares, a second finger cancelled a stroke.
- `cmd("removeRoad")` refused cutting off the west gate and the castle with their messages and allowed removing a dead end.
- Screenshots at both sizes looked at: walls, gates, plaza, roads, castle, quest board, buildings, preview, tray and flat.
- Impeccable critique (24/36), fixes for all 5 priority issues, an audit pass (a11y, performance, theming, responsive all 3/4) and DESIGN.md updated.

**Choices made** (details in the M1 ledger)
- One grid square is one world unit; the ground's corner sits at the origin. Camera zoom 1.0 to 7.6 (start 4.2) so the whole town fits.
- Building colours live with the art (`render/art/builtins.ts`), not in buildings.json. Pack and file names must be plain names.
- Placing opens on the nearest square that fits. A touch drag on a building moves the preview; the release arms it.
- Later wall stages are planned to grow south, east and west while the castle keeps its spot (human to confirm when expansion is designed).

**Known issues / left for later**
- Screen readers are not told where the highlight is; only the verdict is announced.
- "Something is in the way" doesn't say what is in the way.
- The build grid also draws over the plaza; the Build icon's hammer is thin at 26px; the flat covers the camera buttons on desktop.
- The map's aria-label still names the default camera keys.
- Menu rows show name and size only; pictures, purposes and costs come with M4.
- Bundle is about 540 kB (mostly Three.js).

**Next:** M2, Paths, walkers, princess.


## M2: Walking the town (2026-11-16)

**Built**
- **Road grid.** Roads are 2 wide, laid as 2×2 pieces on a road grid that starts at the inside corner of the walls (40×32 = 20×16 cells). The starting town moved one square east to line up: 2-wide gates (west, south, east), plaza x31..36 z17..22, castle at (31,3), and a paved forecourt in front of the castle with the quest board standing on it (a prop, not a reserved square). Placement, joining and the no-stranding rule work per cell; the forecourt counts as road and can't be removed. Build mode shows a 2×2 road ghost, moves 2 squares a step and paints whole cells.
- **Homes** have resident ranges (Cottage 1-2, Family Home 3-5, Manor 4-6); citizens move in up to the top of the range.
- **Pathfinding** (`sim/route.ts`): walkable road cells, shortest routes (breadth-first Dijkstra), right-hand lanes so people pass side by side.
- **The princess** (`sim/princess.ts`): rigid moves, diagonals, sprint with hover, slides along buildings, walls, the statue and the quest board, can never leave town. Click or tap a spot to walk there around obstacles (`sim/openRoute.ts`); tap a person to walk over and talk.
- **Seven townsfolk** (`sim/people.ts`): six citizens and the advisor (Bertram, lives at the castle), placeholder looks, wandering the roads, re-routing when a road is removed, moving into homes as they're built.
- **Talking** (`sim/talk.ts`): a marigold marker over the nearest person in reach; talk for a one-liner from `data/dialogue.json` (never the same line twice in a row). Townsfolk chat in pairs: bubbles show the words within 4 squares of the princess and dots farther away.
- **Game**: fixed 1/60 s ticks through `game.advance`, new commands (setWalkInput, advance, teleportPrincess, talk, advanceDialogue, closeDialogue, walkTo, walkToPerson), snapshot adds the princess, housed, dialogueOpen and talkTarget; building on the princess steps her onto the door road. Debug hook adds `people()` and only redraws the town for town changes.
- **Input**: walk keys and Shift sprint from `data/keybindings.json`, a controller through `data/gamepad.json` (stick, talk, sprint, camera turn and zoom), click/tap to walk or talk, Esc and right-click close a talk. Walking pauses while the Build menu is open, and the Build menu can't open while talking.
- **Render**: paper placeholder people (code SVG by art ID: `figure.*`, `portrait.*`) facing the camera with ground shadows, hover easing, an ink-edged talk marker kept about 14px on screen, wide invisible tap cards. The camera follows the princess; phones held sideways start closer (zoom 0.8, desktop 1.4).
- **Dialogue box and chat bubbles** (brief: `docs/design/dialogue-brief.md`), recorded in DESIGN.md.
- PLAN.md updated: road grid, scale, princess movement, wings later, controller, homes and family rule, Cottage-only start, three cottages in the opening, the advisor, M2/M2b split, map editor moved to M15.
- 298 unit tests.

**Browser check (Playwright, dev server)**
- No console errors or warnings at 1280×800 or 844×390.
- Keyboard only: walking 2.4 squares/s, diagonals, Shift sprint (hover with the shadow left on the ground), up stays "away from the camera" after Q/E, B pauses walking.
- Stops at x 12.25 at the west gate; slides along a building (unit tested and seen); click to walk; walk-to-person opens the dialogue.
- Built a Cottage, a Family Home and a Manor from the keyboard: housed 6 (2 in the cottage, 4 in the Family Home). A 2×2 road piece from the keyboard adds one cell; painting with Enter held lays a joined 2-wide road.
- Talking: the box shows name, portrait and line at both sizes, each line is announced, the second press closes it, Esc closes it, B does nothing while talking. Chats show words close up and dots farther away.
- Impeccable critique 22/40 (dual-agent), all 5 priority issues fixed; detector clean on the new UI.
- Final whole-branch code review: 8 important findings, all fixed with tests (walk keys survive a talk, Build stops a click-to-walk, six distinct citizen looks, no stacking or walking through the statue, no stuck princess after a teleport or a building across her route, keys work after the turn buttons), plus two promoted minors (people on a removed road head back even mid-chat; talking drops an earlier tap-to-walk).

**Choices made** (details in the M2 ledger)
- Click-to-walk routes avoid the squares under the statue and quest board. The dialogue box flips to the top only below 70% of the view. Advisor name "Bertram".
- Walking speeds 2.4 (walk) and 4.8 (sprint) squares/s: about 17 s to cross the town at a walk. People 1.2 squares/s; chat chance 0.35 with a 20 s cooldown.

**Known issues / left for later**
- Bubbles for people off screen stay in the page; a bubble at the very edge can show as a sliver. Long bubble lines can wrap with one word on the last line and cover the princess on phones.
- The statue doesn't fade when it hides the princess. A camera turn mid-line can flip the dialogue box between edges.
- "Someone is in reach" and overheard chats aren't announced to screen readers; a failed talk is silent.
- Placeholder figures always show their front (back views and the paper flip are M2b); their ink reads thin at the default zoom.
- The town size is unchanged (revisit now that walking exists). The clock doesn't run yet (M3).
- From the final code review (deferred): walkers can stand on the outer half of a gate; no smoothing between 60 Hz ticks on high-refresh screens; the statue/board collision sizes and tap thresholds are constants in code rather than data; the princess can block a tap on a person standing behind her; the click-to-walk route search is a simple linear scan; the westward forecourt lane grazes the quest board.

**Next:** M2b, Paper people.

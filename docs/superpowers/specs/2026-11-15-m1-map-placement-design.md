# M1: Map & Placement, design

Date: 2026-11-15. Status: draft for approval.
Builds on: PLAN.md (2.1, 2.2, 3, 4.14, 5.1), DESIGN.md (Toy Theatre), M0 as merged on main.

## Intent

M1 turns the empty M0 board into the princess's town and lets the player shape it. The player designs their own layout, so placement is an **open grid**, not a set of pre-made lots. Roads are part of that design: the princess lays them, buildings must touch them, and later (M2) everyone except the princess walks only on them. The rules have to make it impossible to break the town, so nobody can ever be stranded.

M1 also starts the art pipeline (PLAN 2.1): ground, roads, walls and papercraft buildings are drawn through an art registry by ID, so a human artist can replace any piece later without code changes.

## Story context (decided by the human)

The opening cutscene (built in M15, not M1) sets up the starting map:
- Before the princess wakes, a group of citizens has built the town in rough form. They worry their work will be in vain. The only other thing in town is a **statue of the princess**.
- She breaks out of the statue, and her magic revitalizes the land. The people call her a saint, royalty, maybe their savior.
- With her magic she builds a **house on a spot the player chooses**. This is the player's first action and the build tutorial.
- The people celebrate. She then builds the **castle at the top (north) of town**.
- One citizen offers to help with day-to-day tasks (the advisor from PLAN 4.3).
- This mirrors the ending, where she turns back to stone.

## Goals

1. `data/map.json` describes the starting town, and the diorama draws it: town walls, three gatehouses (west, south, east), the castle grounds on the north wall, a central plaza with the statue, the citizens' starting roads (cobbled inside the walls, dirt outside the gates), and grass everywhere else.
2. An **open placement grid** inside the walls. Buildings of any footprint (1×1, 2×1, 2×2, 3×2) can go on any free squares that pass the rules.
3. **Roads** are placed by the princess one square at a time, from the Build menu.
4. **Placement rules**, all in `src/sim/` and unit-tested:
   - A building or road must be fully inside the buildable area (inside the walls, not on walls, gates, plaza or castle grounds).
   - It must not overlap any building, road, or reserved square.
   - A building's door must face a road: at least one square directly in front of the door has to be road. Each building defines its own door in `data/buildings.json` as one or more squares along its front side (a 3×2 might use the middle of its 3 front squares; a 2×1 might use one square, or both when the door sits in the middle of the building). The ghost shows the door clearly, so the player can see where the road has to go.
   - A new road square must touch the existing road network (side by side, not diagonally).
   - Each building can be turned to 4 facings before placing, so its door faces the road the player wants.
5. **The no-stranding rule for removing roads** (rule built and tested now; the player-facing Demolish arrives in M4):
   - A road square can be removed only if, afterward, every building's door still faces a road, and all remaining road squares form one network that still reaches all three gates and the castle's door.
   - If removal would break that, it is refused with a reason that names what would be cut off, for example "The Bakery would be cut off."
   - To reroute, the player lays the new road first, then removes the old one.
6. **A Build menu and build mode** that the player can use with keyboard, mouse or touch (PLAN 5.1):
   - Opens from a key or an on-screen button, lists the M1 buildings and Road.
   - Choosing one enters build mode: a highlight square and a ghost of the building or road appear on the map. The ghost is green where it fits and red where it doesn't, with a short reason ("Needs a road at the door", "Something is in the way", "Outside the town walls").
   - Arrow keys/WASD move the highlight one square at a time, relative to the camera (up moves away from the viewer). At the diagonal camera angles, each arrow still steps to a side-by-side square (never corner to corner), so painted roads always connect. R (or an on-screen button) turns the building. Enter places it.
   - Mouse: the highlight follows the pointer, and a click places.
   - Touch: the first tap moves the highlight there and shows the green or red preview with its reason. A second tap on the same square, or an on-screen Place button, places it. Nothing is ever built by a single accidental tap.
   - Roads paint: holding Enter, holding the mouse button, or dragging a finger lays road on each square the highlight passes, skipping squares that fail the rules.
   - The camera follows the highlight when it moves by keyboard. It stays still while the player points, taps or drags, so the map never slides under the pointer or finger.
   - Esc, right-click or the on-screen Back button leaves build mode, then closes the menu (Back goes up one level at a time).
   - The camera follows the highlight in build mode.
   - Any building that blocks the view of the highlight fades to see-through until it doesn't.
7. **Art registry and packs** (PLAN 2.1): art is looked up by stable ID (`tile.grass`, `tile.road.cobble`, `tile.road.dirt`, `wall.segment`, `building.cottage.1.front`, and so on). A pack manifest maps IDs to `code` or an image file in `public/art/<pack>/`. Any ID a pack doesn't cover falls back to the built-in code drawing. Papercraft buildings are built from their panel set (front, side, back, gable, roof).
8. **Debug hook** commands for tests and the Playwright check: place a building, place a road, remove a road, and ask whether a placement is legal (with its reason). `getState()` reports building and road counts.

## Starting state until the cutscene exists

The cutscene lands in M15. Until then, a new game starts **as if the opening had just finished, minus the house**: the castle and the quest board are standing, and the player's first action is placing a house anywhere they like. The map data keeps the castle as a normal placement on its reserved grounds, so M15 can start from the earlier moment (statue intact, no castle) without changing the map.

## Decided by the human

- Open grid, so the player designs their own layout.
- The princess places new roads. A building must be next to a road; roads are how walking paths are found.
- Removing a road must never strand anything (the rule in goal 5).
- The starting ground is just grass. Her magic revitalizes the land in the opening; nothing needs clearing. No rubble.
- The **quest board** (PLAN's "decree board") is a temporary fixture in front of the castle, not in the plaza. When the **Adventurers' Lodge** is built, it takes over the board's job and adventurers go there to look at quests. Adventurers do not live at the Lodge.
- **Pointer and touch building**: hover-to-highlight and click to place on PC; tap to preview, tap again or Place to build on phones; the camera holds still during pointing and dragging (goal 6).
- **Doors are case by case**: each building defines which front squares its door covers (goal 4).
- **The walls expand.** The chapter 1 town is 40×32 squares inside the walls. In later chapters the walls move outward to give more room. The map lists the walls as stages; M1 builds and draws stage 1 only, and the board has fields around the town for later stages to grow into. When and how each expansion unlocks is decided in a later milestone.
- **Room for everything (a whole-game rule).** By the end of the game the player can build every single building, with room to spare, without giving up citizens or other buildings to make space. Travel inside town must also stay short, so adventurers never spend too long walking before they leave. (The human's reason: a game this one is inspired by fails at both.) Final wall sizes, walking speed and gate placement are set to honor this; the M19 balance pass checks it.
- **No well anywhere.** It serves no purpose, so it is dropped from the game (remove it from PLAN 2.2 and the cut-out examples).
- The Build menu acts directly; it is fine to build from wherever the princess is.
- Unchanged from earlier decisions: camera turning is a PC extra and nothing may require it; buildings fade when they block the highlight; papercraft buildings, cut-out small things.

## Builder's calls made in brainstorming (the human should check these)

- **Roads paint while held** (Enter, mouse or finger), as described in goal 6.
- **Building is free in M1.** Costs, Emberstone, daily caps and the Demolish unlock arrive in M4.
- **A new road must connect** to the existing network, so no stray road pieces float in fields.
- **After she breaks out, the statue's empty pedestal stays in the plaza** as a reminder of the opening (and of the ending). Until M15 it is drawn as the statue.
- **Building happens inside the walls only.** The fields outside are scenery with the dirt roads to the gates.
- **The plaza counts as road** for the road network and later walking, but nothing can be built on it.
- **M1 building set**: Cottage (1×1), Family Home (2×1), Manor (2×2) from PLAN 4.14, plus one 3×2 building from PLAN's list (the Adventurers' Lodge) so every footprint is exercised. They live in `data/buildings.json` with id, name, footprint, door squares, and panel art IDs. My door picks: Cottage on its one square; Family Home on its long side, door in the middle so it covers both front squares; Manor on one of its two front squares; Lodge on the middle of its three. Everything else about buildings (cost, unlock, cap, effects) is M4.
- **The castle and quest board are special**: the castle can only stand on the castle grounds; the quest board is a fixed prop in front of it. Neither is in the Build menu.

## Non-goals (later milestones)

- The cutscene, dialogue and the advisor (M15).
- Paths and Dijkstra, walkers, the princess walking, the map editor (M2). M1's network check is a connectivity test only.
- Costs, Emberstone, caps, demolish UI, upgrades (M4).
- The Lodge taking over from the quest board (M8).
- Character parts, the art gallery page and ART-GUIDE.md (M2).
- Saving the town (M18).

## Anti-goals (failure even if it technically works)

- A building or citizen can end up unreachable.
- The town runs out of room before every building is built, or the player must give up citizens or buildings to fit the rest.
- Adventurers lose a long stretch of the day walking across town before they leave.
- Any build action needs the camera turned (phones can't turn).
- The highlight or ghost gets hidden behind a building.
- The grid feels like a spreadsheet: the town should still look like a papercraft diorama, with the grid shown only while building.
- Art drawn outside `render/art/`, or sim code knowing how anything is drawn.
- Anything recognizably copied from an existing game.

## Constraints

- PLAN.md and CLAUDE.md rules: `src/sim/` pure and seeded, all content and numbers in `src/data/*.json`, Three.js only (no engine), TypeScript strict, TDD, no em dashes in player-facing text.
- Every action works with keyboard alone, mouse, and touch (except camera turning).
- Layouts work at 1280×800 and 844×390. The Build menu follows DESIGN.md (Toy Theatre) and goes through `/impeccable shape` before it is built.
- `sim/` never imports `three`, `render/` or `ui/` (the architecture test already enforces this).

## Left to the builder

- **Grid scale.** Pick a placement-square size so a 1×1 cottage reads as a house next to a person and roads read as streets. The chapter 1 town is 40×32 squares inside the walls (decided by the human). Keep the grid square the one unit used everywhere in sim code.
- The exact shape of the walls, gate positions, plaza size, castle-grounds size and starting roads (gate to plaza, plaza to castle), drawn to match `docs/art/world-reference.png`.
- How road squares join visually (one cobbled surface with an ink edge only on the outside is the expected look).
- The map.json and buildings.json schemas, and the art pack manifest format.
- Which keys open the Build menu and turn buildings (R is suggested), within PLAN 5.1.
- How the fade-when-blocking works in Three.js.
- Whether the art registry gets a small test pack that proves the image override and the fallback.

## PLAN.md changes this needs

- **Section 3** rewritten: open grid instead of lots; map.json lists walls, gates, plaza, castle grounds, starting roads and the statue; placement and road rules (goals 4 and 5); the starting state from the opening; no rubble.
- **Section 2.2**: the plaza has the statue (later its pedestal); the well is removed from the game (also from the cut-out examples list); the quest board stands in front of the castle.
- **Section 4.3**: add the opening cutscene as described above.
- **Section 4.14**: Demolish covers roads, under the no-stranding rule. Sections 4.11, 4.14 and the M8 row: once the Lodge is built (wherever the player puts it), it takes over the quest board's job; adventurers look at quests there but do not live there.
- **Section 5 and 5.1**: "select a lot" becomes "pick squares"; the Build row becomes "Arrows move a highlight square by square, R turns, Enter places (hold to paint roads)".
- **Section 3 and a new whole-game principle**: walls in stages that expand in later chapters; the "room for everything" rule and short in-town travel; M19 checks that a full end-game town fits.
- **Section 6, M1 row**: "Map JSON loads. Walls, gates, plaza, statue, roads and castle draw. Open-grid placement of buildings and roads follows the rules, including no stranding (tested). Build menu and build mode. Art registry and packs with fallback (2.1) draw ground and papercraft buildings from panels."

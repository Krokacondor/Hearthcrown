# M2: Walking the Town, design

Date: 2026-11-16. Status: draft for approval.
Builds on: PLAN.md (2.1, 2.2, 3, 4.2, 4.3, 5, 5.1), DESIGN.md (Toy Theatre), M1 as merged on main (HEAD 20e54de).

## Intent

M1 made a town you can lay out. M2 makes it a place you can walk around in. The princess steps out onto her streets, the first citizens wander them, and you can walk up to anyone and hear what they think. Early on the town should feel **barren**: there is not much to do, people mill about, chat with each other now and then, and tell the princess they hope it gets busier soon. That emptiness is the point; it is what the rest of the game fills.

M2 is also where the scale of the world gets fixed: people sized true to the houses, and roads wide enough for people to pass each other comfortably. That forces one rework of M1: **roads become 2 squares wide**.

PLAN.md's M2 row is split in two (decided by the human):
- **M2, Walking the town** (this document): road grid rework, pathfinding, the princess, the walkers, talking, simple placeholder figures.
- **M2b, Paper people**: the real character art pipeline (cut-out characters from parts, front and back views, paper flip, part frames, art gallery page, `ART-GUIDE.md` and templates). M2b gets its own brainstorm and design.

## Goals

1. **Roads on a 2-square road grid.** Every road is 2 squares wide, laid as 2×2 pieces that snap to a road grid. The starting roads, gates, plaza and castle grounds move onto that grid. All M1 rules (joining, door at a road, no stranding) work on the new grid.
2. **Pathfinding.** A tested shortest-route finder (Dijkstra, per PLAN) over the road network, used by the walkers.
3. **The princess walks the town.** Keyboard, controller, mouse and touch. Rigid movement, sprint (hover), collision with buildings and walls, never leaving town. The camera follows her up close.
4. **Seven walkers.** Six citizens and the advisor wander the roads. Each has a home once one exists. Now and then two of them stop and chat.
5. **Talking.** Walk up to anyone and talk: a dialogue box with their portrait, name and a one-liner. Chats between citizens show as bubbles: real words when the princess is close, animated dots when she is not.
6. **Placeholder figures.** Simple paper cut-out people that face the camera, sized true to the houses, easy to tell apart. They are drawn through the art registry by ID so M2b replaces them without touching sim or UI code.
7. **Debug hook and Playwright check** cover all of the above.
8. **PLAN.md updates** for every decision below.

## Decided by the human

**Scale and roads**
- Houses keep their current size. People are sized **true to the houses**: about two thirds of a cottage wall's height, the door just above head height. Four or five people fit side by side across a road.
- Roads must be wide enough for two people to pass without colliding, and should look roomy. Roads are **2 squares wide, as 2×2 pieces snapped to a 2-square road grid** (option A in the brainstorm). Painting a road jumps 2 squares at a time.
- The starting roads, the gates and the no-stranding rule move onto the road grid. Whether the town should grow (bigger board or walls) is revisited after walking it in M2.

**The princess**
- Movement is **rigid**: instant start and instant stop, no acceleration or easing. Diagonals are allowed. Directions are relative to the camera.
- A **sprint** button makes her move faster. While sprinting she **hovers** a little off the ground; her shadow stays on the ground.
- Buildings, walls and gatehouses **stop her**; she does not walk through them. (Sliding along them is my call; see "My calls".)
- She **can never leave town**. There is nothing outside the gates for her; she is bound there by her fate. This holds even after she has wings.
- **Wings (a later milestone, not M2):** she sprouts wings and can fly over buildings, but only while sprinting. She cruises at the same hover height as sprinting and rises to clear a building as she approaches it, then settles back. M2 should not block this (keep a "height" on her that render reads).
- **Controller support**: the left stick moves her in any direction, with the same rigid feel. Controller is a fourth control scheme next to keyboard, mouse and touch.
- The camera **follows the princess up close**.

**The people**
- **Seven people** at the start: six citizens plus the **advisor**, who lives at the castle with the princess. The advisor (he) walks around and acts as a regular citizen; his purpose is story, which comes in later milestones.
- Citizens wander and sometimes **chat with each other**. If the princess is close, small **chat bubbles** above their heads show what they say. If she is not close enough, the bubbles show an animated **". . ."**.
- **Talking to anyone** gives a line like *"I appreciate you, your highness. I hope our town becomes bustling soon, because there's nothing to do right now..."* The full talk system (icons over heads, real conversations) is M14.
- When the princess talks to someone, a **dialogue box** appears at the top or bottom of the screen, whichever keeps the speakers in view, with a **portrait** of the person and their line next to it. (Approved from the mockup: name tag on top, small bobbing arrow when there is more, no key hints.)

**Homes and the start of the game**
- Home sizes (replacing PLAN.md section 5's single numbers): **Cottage 1 to 2 people, Family Home 3 to 5, Manor 4 to 6** (the Manor pays more taxes).
- A family with children needs a Family Home or Manor, except a single parent with one child. A couple in a cottage (for example two adventurers who married) who want children must move to a Family Home. Every adventurer is a young adult and needs a home; nobody lives at the Lodge. (Recorded in PLAN for M6 and M11; not built in M2.)
- At the start the player has access to **only the Cottage**. Family Homes and Manors are unlocked later. In the opening, the player builds **three cottages** (the cutscene's first house plus two more) for the six citizens, two per cottage. Roads are optional at the start; the starting houses and roads are free.

**Scope**
- The **map editor** leaves M2. It moves to the milestone that designs the chapter 2+ wall stages, since that is when there is something to edit and the map format will have settled.
- Character art pipeline moves to **M2b** (above).

## My calls (Claude's, for the human to check)

- She **slides** along buildings and walls rather than stopping dead when she walks into them at an angle.
- Click or tap a spot to walk there (PLAN 4.2 already says this), routing around buildings; tapping a person walks to them and talks.
- The controller button layout in "The princess"; controller-driven menus wait for a later milestone.
- A marigold marker over the nearest person in talking range.
- Dialogue text appears all at once (no typewriter); the person stops and faces her; talking to someone mid-chat ends the chat.
- Bubbles turn to words within about 4 squares; talking range about 1.5 squares.
- Homeless citizens fill cottages in order, 2 per cottage, as soon as one is placed.
- The road grid is anchored at the inside corner of the walls so the town divides evenly.
- Any home takes homeless citizens up to the top of its size (Cottage 2, Family Home 5, Manor 6). The bottom of each range is for families (M6) and is not enforced in M2. Data stores each home's size as a smallest and largest number.
- If the player places a building where the princess is standing, the placement goes ahead and she is moved to the nearest free spot that touches the building's door road (she never ends up inside anything). The same push applies to any future case that leaves her inside something.
- People stand a little shorter than the cottage door (about 0.55 of the wall height), so the door is just above head height. Doors are not redrawn.
- The approved mockups are copied into `docs/design/m2-mockups/` (dialogue box, people-to-house scale) so `/impeccable shape` and the plan can reference them.

## The road grid (goal 1)

- The road grid is made of 2×2 **road cells** anchored at the inside corner of the chapter 1 walls (x13, z3). The inside of the walls (40×32 squares) divides into exactly 20×16 road cells.
- A road is always a whole road cell. Placing a road at any square fills the cell that square belongs to. Removing works the same way.
- A new road cell must touch the network side by side (sharing a 2-square edge), as in M1.
- Buildings stay on the 1-square grid, unchanged in size. A building still needs at least one square in front of its door to be road. Buildings never overlap road squares.
- Gates are 2 squares wide and line up with a road cell. The plaza and castle grounds line up with the road grid so roads meet them cleanly.
- The no-stranding rule, "Roads must join a road", door checks and all M1 reason messages keep working, now per road cell. A removal that would cut something off is refused with the same named reasons.
- In build mode, the road ghost is a 2×2 footprint; arrow steps and painting move one road cell (2 squares) at a time; drag painting fills whole cells. Buildings still move 1 square at a time.
- Outside the walls, the dirt roads to the gates become 2 wide as well.
- **Castle forecourt** (decided by the human from the layout picture, 2026-11-16): the paving in front of the castle door is 6 wide, the castle's full width (the north road plus one road cell either side). The quest board stands on the forecourt's back edge as a prop (like the statue, not a reserved square), so adventurers can gather in front of it. The forecourt counts as road and can never be removed, like the plaza and gates. Picture: `docs/design/m2-mockups/town-layout.html`.

## Pathfinding (goal 2)

- `sim/` gets a route finder over the walkable network for townsfolk: road cells, the plaza and the gates. Shortest route by distance (Dijkstra; A* is fine if it gives the same answers). Unit-tested: straight road, corner, around a missing cell, no route, start equals goal, and a route that crosses the plaza.
- Routes go from road cell to road cell; walkers move continuously along them (see "Walkers").
- The pathfinder is the shared piece adventurers and the M3 day routines will use.

## The princess (goal 3)

- She lives in sim state: position (continuous), facing, height above ground, and whether she is sprinting. Sim advances her each tick from the current movement input. Render only reads her.
- **Walk and sprint speeds** are in `balance.json`. Starting values are a builder's call, tuned so crossing the chapter 1 town at a walk takes roughly 15 to 20 seconds and sprint is roughly twice as fast (pillar 9: travel stays short).
- **Collision**: she is a small circle. Building footprints, walls, towers and gatehouses are solid. Moving into a solid slides her along it instead of stopping dead. Gate squares are walkable up to the line of the wall, never past it. Other people do not block her.
- **Keyboard**: arrows/WASD move (camera-relative, diagonals by holding two), Shift held sprints, Space or Enter talks / advances dialogue. Q/E still turn the camera, +/- zoom. Keys come from `data/keybindings.json` (new `walk` context).
- **Controller** (Gamepad API): left stick moves; a press past a small deadzone means full speed in that direction (rigid, no slow walk). A face button talks / advances, another face button or the right trigger sprints while held, the shoulder buttons turn the camera, the right stick zooms. Mappings live in data, next to the key bindings. Menus driven by controller (Build menu, future panels) are a later milestone; in M2 the controller covers walking, sprinting, talking and the camera.
- **Mouse and touch**: click or tap a spot on the ground and she walks there, routing around buildings by the shortest way (a grid route over open squares, separate from the road pathfinder). Clicking or tapping a person walks her to them and opens the talk when she arrives. Any keyboard or stick input cancels a click-to-walk.
- **Camera**: follows her up close with a new start zoom, closer than M1's town view (exact value a builder's call, tuned so people read clearly). Q/E turning and zoom still work. When build mode opens, the camera follows the build highlight as in M1; when build mode closes, it returns to her.
- While the Build menu or a dialogue box is open, she does not move.
- **Fading**: buildings that hide her from the camera fade, using M1's occlusion rule.

## Walkers (goal 4)

- Sim creates seven people at game start from data: six citizens and the advisor. Each has a name (from an original name list in `data/`), a placeholder look (a color pair) picked with the seeded RNG, and a role (`citizen` or `advisor`).
- **Homes**: the advisor's home is the castle. Citizens start without homes. When a cottage is placed, homeless citizens move in, up to 2 per cottage, in order. (Family Home and Manor capacities from the home sizes above, so the data is right when they unlock in M4.) M2 records the home; going home at night is M3.
- **Wandering**: each walker repeatedly picks a destination road cell, routes there with the pathfinder, walks, idles a few seconds, then picks again. Citizens without a home start from the plaza. Speeds and idle times are in `balance.json`; walkers are slower than the princess's walk.
- **Passing**: walkers keep to the right-hand half of the road relative to their direction, so two people coming toward each other pass side by side and both stay visible. Nobody collides with anybody: walkers pass through each other and through the princess when they meet at corners, in the plaza or when catching up. **Some overlap is fine** (decided by the human); the goal is only that people are not fully hidden behind each other.
- **Chatting**: when two idle or passing walkers are near each other, there is a chance (tunable) that both stop, face each other, and run a short exchange from `data/dialogue.json`: line, reply, and sometimes one more back and forth, each shown for a few seconds. Then they go on their way. The advisor chats too.
- All randomness uses the seeded RNG. The same seed and the same inputs give the same walks.

## Talking (goal 5)

- **Who can be talked to**: everyone. When the princess is within talking range (about 1.5 squares, tunable) of someone, the nearest such person gets a small marigold marker above their head (marigold means "what you are doing right now" in DESIGN.md). Talk opens the dialogue box with that person.
- **Lines**: `data/dialogue.json` holds a pool of one-liners for citizens, a pool for the advisor, and a pool of chat exchanges. Early lines are about the town being quiet and hoping it gets busier. A line is picked with the seeded RNG and does not repeat for the same person back to back.
- **The dialogue box** (approved mockup): a card at the bottom of the screen, flipped to the top when the speakers are in the lower part of the view. Portrait on the left, red name tag on top, the line beside it, a small bobbing arrow when there is more. Talk, click or tap advances; the last line closes it. Text appears all at once. The person stops, turns to face her, and resumes wandering when the box closes. If they were mid-chat, the chat ends and the other person wanders off.
- **Chat bubbles**: small cards above each chatting walker's head, in the Toy Theatre style. Within about 4 squares of the princess (tunable) they show the words; farther away they show an animated ". . .". Walking into or out of range switches them on the current line.
- **Accessibility**: the dialogue box is real HTML and announces its text to screen readers. Chat bubbles are decoration and are not announced. The bobbing arrow and dot animation respect reduced motion.
- Both the dialogue box and the chat bubbles go through `/impeccable shape` before they are built (CLAUDE.md), starting from the approved mockup.

## Placeholder figures (goal 6)

- Each person is a flat paper cut-out standing upright on the ground, turned to face the camera, with an ink outline and a soft ground shadow. Height about two thirds of a cottage wall (tunable).
- Drawn by art ID through the registry (for example `figure.placeholder.<look>`), with a code fallback, so M2b swaps in real characters without changing sim or UI code.
- Citizens are a body color and a head; the **princess** is clearly different (pink with a marigold crown in the mockups); the **advisor** is clearly different from citizens (for example a robe color nobody else uses).
- Portraits for the dialogue box are placeholders drawn from the same colors (`portrait.<id>`), replaced in M2b.
- Sprinting lifts the princess a little off the ground; her shadow stays put.

## Debug hook and checks (goal 7)

- `getState()` adds: the princess's position and whether she is sprinting, the number of walkers, how many have homes, and whether a dialogue is open.
- New `cmd`s: set movement input, advance the sim by N seconds, teleport the princess, talk to the nearest person, list walkers with positions.
- Playwright check: no console errors; place cottages and see citizens move in; walk the princess with keys and see her stop against a building and slide along it; sprint; reach a gate and confirm she cannot pass; talk to a walker and see the dialogue box; see two walkers chat with bubbles; screenshots of each. Recorded in PROGRESS.md.

## PLAN.md updates (goal 8)

- Section 6: split the M2 row into M2 (Walking the town) and M2b (Paper people); move the map editor to the wall-expansion milestone. Note the controller in M2.
- Section 3: roads are 2 wide on a 2-square road grid; "the princess can walk anywhere" becomes "anywhere not blocked by buildings or walls, never outside the gates"; map editor note moves.
- Section 4.2: rigid movement, sprint and hover, collision, wings (later), controller, camera follow.
- Section 4.3: the opening has three cottages for six citizens; the advisor (he) lives at the castle and wanders like a citizen.
- Section 5: home sizes as ranges; the family rule; only the Cottage at the start, Family Home and Manor unlocked later.
- Section 5.1: controller as a fourth control scheme.
- Section 2.2 (or wherever scale lives): people true to house scale.

## Non-goals

- Day and night, going home, routines (M3). Walking does not cost in-game time yet.
- Locking buildings in the Build menu (M4). In M2 the menu still lists all homes so they can be tested.
- Costs (M4). Placing is still free.
- Adventurers, apprentices, families, marriage, moving house (M6, M11).
- The real talk system, icons over heads with meaning, conversations with choices (M14).
- The opening cutscene (M15). M2 starts as M1 does: castle standing, the player places homes.
- Wings (later milestone).
- Character art, gallery, ART-GUIDE (M2b). Map editor (wall-expansion milestone).
- Driving menus with a controller.

## Anti-goals

- People who look tiny next to houses, or houses that look like toys next to people. Scale is true to the house.
- Roads that feel cramped, or people fully hidden behind each other as they pass. Some overlap is fine (decided by the human); there must be room for people to stay visible.
- Floaty, slidey princess movement. It should feel crisp: she moves when you press, stops when you let go.
- Any way for the princess to get outside the walls or stuck inside a building.
- On-screen key hints (key bindings belong in Settings, M18).
- A busy-feeling town. Early on it should feel empty and a little lonely.

## Constraints

- All CLAUDE.md rules: `src/sim/` pure and seeded, render and UI read state and call commands, numbers and content in `src/data/*.json`, original names and text, TDD, Playwright check, PROGRESS.md entry.
- Existing M1 tests change with the road grid; the rules they pin still hold, just per road cell.
- Works at 844×390 (phone landscape) for the dialogue box and touch walking.

## Left to the builder

- Exact new coordinates for the plaza, statue, castle grounds, quest board, gates and starting roads on the road grid (keep the castle on the north wall, the plaza central, three gates west/south/east).
- How road cells are stored (cell coordinates or pairs of squares) and how M1's road code is reshaped.
- Speeds, idle times, chat chance, talk and bubble ranges, figure height, camera zoom (all in `balance.json`).
- The grid route for click-to-walk and how it handles diagonals around corners.
- Fixed sim tick rate and how render smooths between ticks.
- Gamepad button choices within the scheme above.
- The name list and the dialogue lines (original, warm, in the barren-town mood).

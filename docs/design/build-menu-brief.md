# Build menu and build mode: shape brief

Status: approved 2026-11-16 with one change (no key hints; key bindings live in Settings). Inside the established Toy Theatre world (DESIGN.md, `.impeccable/surfaces/index-html.md`); no new visual world.

## 1. Job and audience
- Mode: **Operate**. The player is laying out their town: choosing what to build, finding a spot, turning it to face a road, placing it, and painting roads.
- Desktop with keyboard first; mouse optional; phones held sideways (844×390) by touch. The town must stay visible while placing.

## 2. Outcome and proof
- Success: pick an item, see at a glance whether the spot works and why not, place it, keep going. Never build by accident.
- Product truth: placement rules come from the sim (`checkPlacement`); the UI only shows their verdict and message ("Needs a road at the door", "Something is in the way", "Outside the town walls", "Roads must join a road", "The castle belongs on the castle grounds").

## 3. Selected direction (decided by the human)
- **The menu is a panel flat** on the right wing (about 420px wide on desktop, about 45% on phones): printed card body, royal-blue header with the title "Build" and a Back button, rows in aligned columns (name, footprint), one rule weight, column labels said once. Slides on from the wing with the small paper settle.
- **Choosing an item shrinks the flat to a tray**: the flat slides away and a slim printed-card tray rests at the bottom centre of the stage. It shows the item name and footprint, the reason line (red verdicts only, `aria-live="polite"`), and buttons **Turn**, **Place** (leaf green, the primary action) and **Back**. Back returns to the full flat.
- **Placement preview in the town**: a **marigold outline** on the squares under the highlight (Right Now Rule), the ground beneath filled **soft green** when it fits or **soft red** when it doesn't, a **see-through papercraft ghost** of the building standing on it (turned with R), and a small **ink arrow** on the ground pointing into the door from each square where the road must be. Roads show the same outline and fill on a single square, with no ghost.
- **Build button** on the stage, **bottom-left**: a round printed-card button (52px, ink outline, paper lift) with a hammer-and-house line icon, labelled "Build" for screen readers. The camera turn buttons stay bottom-right.
- **No key hints on screen** (decided by the human), in build mode or otherwise; the M0 camera hints are removed too. Players look up and change keys in a Settings menu (key bindings screen, M18). Every key comes from one bindings table (`src/data/keybindings.json`) so that screen can read and change them.

## 4. Scope and boundaries
- Production-ready for M1: the flat, the tray, the Build button, the key hints and the 3D preview.
- Untouched: the pelmet, the camera buttons, the Loved/Feared meter. Removed: the bottom-centre key hint chips.
- Anti-goals: no hover-only info; no marigold on idle things; the tray never covers the highlighted squares (if the highlight would sit under the tray, the camera follow keeps it above); no costs or locks shown yet (M4).

## 5. States and ranges
- Items: Road plus 4 buildings in M1; the list must take 15 or more later without redesign (it scrolls inside the flat).
- Tray states: fits (no reason line, Place enabled), doesn't fit (reason shown, Place disabled), touch armed (first tap made; Place enabled when it fits).
- Selected row in the flat: marigold focus only while it has keyboard focus.

## 6. Interaction and layout
- Open: B or the Build button. In the flat, arrows move between rows and Enter chooses; focus starts on the first row.
- Back goes up one level: tray → flat → closed. Esc, right-click and the Back buttons all do this.
- The Place button is always shown on touch; on desktop it is shown too (mouse users can use it), with Enter as the keyboard way.
- Phones: Turn button replaces R; the second tap or Place builds; dragging on Road paints.

## 7. Constraints and open decisions
- Keyboard, mouse and touch parity (PLAN.md 5.1); 4px marigold focus on every control; touch targets at least 44px.
- Left to the builder: exact tray width (fit content, max about 560px), the green and red fill strengths (they must read on grass and cobble and stay hard-edged), the icon drawing, and the slide timing (match the planned flat settle; still under reduced motion).

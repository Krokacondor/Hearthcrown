---
name: Hearthcrown
description: A kingdom on a paper stage. A papercraft diorama town under a red theatre pelmet, in printed card stock with ink outlines.
colors:
  curtain: "#c8324a"
  curtain-deep: "#a8253b"
  curtain-label: "#fff2f4"
  pelmet-text: "#ffffff"
  marigold: "#f2b233"
  royal: "#2f5fa8"
  loved: "#f59ac0"
  leaf: "#5aa04a"
  leaf-button: "#6ab05a"
  leaf-button-hover: "#7cbd6b"
  leaf-deep: "#3d7a30"
  ink: "#3b2a2e"
  ink-faint: "#9a8c8f"
  rule: "#e4dcd4"
  card: "#fffdf8"
  card-hover: "#fff6dc"
  sky: "#cfe3ea"
  grass: "#9fcf7c"
  grid-line: "#8dbf6c"
  tuft: "#6fae55"
  cobble: "#d1bd96"
  dirt: "#e8cf9e"
  stone: "#d9d2c8"
  base-wood: "#b07a4c"
  stage-floor: "#e2bd8b"
  stage-plank: "#c79a68"
typography:
  display:
    fontFamily: "Lilita One, Nunito, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Lilita One, Nunito, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.05
  flat-title:
    fontFamily: "Lilita One, Nunito, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1
  title:
    fontFamily: "Lilita One, Nunito, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.15
  item-name:
    fontFamily: "Lilita One, Nunito, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1
  action:
    fontFamily: "Lilita One, Nunito, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1
  size-tag:
    fontFamily: "Lilita One, Nunito, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1
  row:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.2
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.35
    fontFeature: "\"tnum\" 1"
  button:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    lineHeight: 1
  label:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.12em"
rounded:
  thumb: "4px"
  meter: "9px"
  button: "10px"
  card: "14px"
  round: "50%"
spacing:
  label-gap: "3px"
  cluster: "10px"
  row-gap: "12px"
  button-x: "16px"
  stage-inset: "20px"
  row-x: "22px"
  edge: "24px"
  card-y: "22px"
  card-x: "26px"
components:
  pelmet:
    backgroundColor: "{colors.curtain}"
    textColor: "{colors.pelmet-text}"
    height: "76px"
    padding: "0 24px"
  pelmet-short:
    backgroundColor: "{colors.curtain}"
    textColor: "{colors.pelmet-text}"
    height: "56px"
  stat-label:
    textColor: "{colors.curtain-label}"
    typography: "{typography.label}"
  stat-value:
    textColor: "{colors.pelmet-text}"
    typography: "{typography.headline}"
  meter:
    rounded: "{rounded.meter}"
    height: "14px"
    width: "clamp(110px, 12vw, 170px)"
  meter-thumb:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.thumb}"
    width: "12px"
    height: "22px"
  stage-button:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round}"
    size: "52px"
  stage-button-hover:
    backgroundColor: "{colors.card-hover}"
    textColor: "{colors.ink}"
  card-button:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "0 16px"
    height: "44px"
  card-button-hover:
    backgroundColor: "{colors.card-hover}"
    textColor: "{colors.ink}"
  card-button-disabled:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-faint}"
  place-button:
    backgroundColor: "{colors.leaf-button}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.button}"
    padding: "0 16px"
    height: "44px"
  place-button-hover:
    backgroundColor: "{colors.leaf-button-hover}"
    textColor: "{colors.ink}"
  flat:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    width: "min(420px, 45vw)"
  flat-head:
    backgroundColor: "{colors.royal}"
    textColor: "{colors.pelmet-text}"
    padding: "12px 14px 12px 22px"
  flat-title:
    textColor: "{colors.pelmet-text}"
    typography: "{typography.flat-title}"
  flat-column-label:
    textColor: "{colors.royal}"
    typography: "{typography.label}"
    padding: "12px 22px 6px"
  flat-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.row}"
    padding: "0 22px"
    height: "48px"
  flat-row-hover:
    backgroundColor: "{colors.card-hover}"
    textColor: "{colors.ink}"
  size-tag:
    textColor: "{colors.royal}"
    typography: "{typography.size-tag}"
  groove:
    backgroundColor: "{colors.base-wood}"
    rounded: "{rounded.thumb}"
    height: "8px"
  tray:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "10px 12px 10px 18px"
    width: "min(560px, calc(100% - 288px))"
  tray-name:
    textColor: "{colors.ink}"
    typography: "{typography.item-name}"
  tray-success:
    textColor: "{colors.leaf-deep}"
    typography: "{typography.button}"
  tray-problem:
    textColor: "{colors.curtain-deep}"
    typography: "{typography.button}"
  notice:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "22px 26px"
    width: "min(520px, calc(100% - 32px))"
  notice-title:
    textColor: "{colors.royal}"
    typography: "{typography.title}"
---

# Design System: Hearthcrown

## Overview

**Creative North Star: "The Toy Theatre"**

The kingdom is a paper stage. The papercraft diorama town is the stage floor and owns the whole window; the interface is theatre trim around its edges. M0 built the first of that trim: a curtain-red pelmet with a scalloped hem across the top, carrying the kingdom's name and its numbers, and round printed-card buttons resting on the stage. M1 added the first panel flat (the Build list, sliding on from the right wing in its wooden groove) and the placing tray at the foot of the stage. Everything, chrome and world alike, reads as printed card stock: flat hand-coloured fills, one dark ink outline, and soft paper shadows.

The feel is bright, warm and readable: a storybook kingdom made of simple shapes. Density is low; the town comes first and the chrome second. Big numerals over tiny capital labels let the player read their day at a glance. The world refuses the category default of parchment scrolls in carved wood frames; the wood here is a toy stage's base, floorboards and the grooves the flats run in, not ornament.

The diorama sits on an ink-edged wooden board (base wood) standing on a plank stage floor, lit by a white sun with real soft shadows over a pale sky. Inside stone walls with gatehouses lie a flagstone plaza, cobble and dirt roads, a statue and a quest board as camera-facing cut-outs, and papercraft buildings folded from drawn panels. Grass carries fixed-seed tufts, so the board looks the same on every load; the square grid appears only while building.

**Key Characteristics:**
- One ink colour outlines everything, in the UI and in the 3D world.
- Flat fills only; colour changes are hard edges, never blends.
- Marigold means "what you are doing right now" and nothing else.
- Display numerals in a heavy rounded playbill face; body in a rounded workhorse.
- Theatre trim stays on the edges of the stage; the map is never boxed in.
- Keyboard first, with a visible marigold focus on everything focusable.

## Colors

A warm, hand-coloured toy-theatre palette: one saturated curtain red, one royal blue, one reserved marigold, a leaf green for confirm, and soft card, sky and grass neutrals, all held together by a single plum-brown ink.

### Primary
- **Curtain Red** (curtain): the pelmet, the theme colour and the favicon ground. The stage's frame colour; it belongs to the top edge and to story moments, not to lists or rows. In the world it fills the placement squares when a spot does not fit.
- **Deep Curtain** (curtain-deep): problem text in the placing tray (6.9:1 on card). The text form of curtain red, never a fill.
- **Pelmet White** (pelmet-text): the crest, the big stat numerals on the curtain, and the inked flat title on the royal header.
- **Blush Label** (curtain-label): the tiny capital stat labels on the curtain (about 4.8:1 on curtain red). Labels are never plain white; the tint keeps them a step quieter than the numerals.

### Secondary
- **Royal Blue** (royal): the panel-flat header, the column labels and size tags in flats and the tray, the notice heading, and the Feared half of the meter.
- **Loved Pink** (loved): the Loved half of the Loved/Feared meter. The world palette reuses the same pink for the castle roof.

### Tertiary
- **Marigold** (marigold): reserved. Keyboard focus rings, the map's focus frame, text selection, and the placement footprint outline. Never decoration, never a brand accent, never a fill for an idle element.
- **Leaf Green** (leaf): confirm. In the world it fills the placement squares when a spot fits.
- **Leaf Button** (leaf-button) with **Leaf Button Hover** (leaf-button-hover): the primary action, currently Place in the tray. A lighter leaf so ink text reads on it (5.1:1).
- **Deep Leaf** (leaf-deep): success text in the placing tray (5.1:1 on card). The text form of leaf, never a fill.

### Neutral
- **Ink** (ink): the one outline colour (3px UI lines, 3.5px world edges), body text, the meter's centre tick, the pelmet's bottom rule and scallop edge, the keyline under inked display titles, and the door arrows in the placement preview.
- **Faint Ink** (ink-faint): disabled controls only, as both their text and their outline. Ink tinted into card, about 3.2:1.
- **Row Rule** (rule): the one divider between rows in a flat (2px). Ink tinted into card.
- **Printed Card** (card): every card-like surface: stage buttons, flats, the tray, card buttons, the notice, the meter thumb.
- **Warm Card** (card-hover): hover on card buttons and flat rows, and the Build button while its flat is open.
- **Pale Sky** (sky): page background and the 3D scene background.

### World palette (3D diorama)
- **Meadow** (grass): the board's grass texture, with **Tuft** (tuft) strokes (4px, round caps) scattered at a fixed seed.
- **Grid Line** (grid-line): the square grid over the town inside the walls, an overlay shown only while placing (thin lines at 0.9 opacity). It is never painted into the grass.
- **Cobble** (cobble): the built road network and the gate passages, drawn as rounded setts in two darker cobble shades. Ink runs only on the outer edge where road meets grass; the plaza counts as road, so no ink line ever crosses between road and plaza.
- **Dirt** (dirt): the fixed dirt roads outside the walls, speckled with darker pebbles and inked on their outer edges.
- **Stone** (stone): walls, corner towers and gatehouses (a tower each side of the gate and a lintel over the passage), drawn with mortar lines in a darker stone and ink on every box edge. The statue cut-out is stone too.
- The plaza is a paler flagstone tile (#ddd2bf, drawn in the art builtins, not yet a palette token).
- **Base Wood** (base-wood): the diorama's wooden board, outlined in ink. The quest-board cut-out and the flat's groove reuse it.
- **Stage Floor** (stage-floor) with **Plank Line** (stage-plank): the staggered floorboards under the board.
- Building panels carry their own per-building wall, roof, shade, door and trim colours inside the drawn art.

### Named Rules
**The Right Now Rule.** Marigold (#f2b233) marks only what the player is doing right now: keyboard focus, the placement footprint, the chosen route. If an element is marigold while idle, it is wrong. When two right-now signals would compete, one steps aside: while placing, the map's focus frame hides and the footprint outline carries the focus.

**The One Ink Rule.** Ink (#3b2a2e) is the only outline colour, for the UI and the world. No grey borders, no coloured strokes, no second ink. The two ink tints are part of the same ink, not new colours: the row rule divides rows inside a flat, and faint ink outlines a disabled control.

**The Flat Fill Rule.** Fills are flat. Where CSS gradients appear (the meter halves, the scallops) they are hard stops used to draw shapes, never blends. No soft colour gradients anywhere.

## Typography

**Display Font:** Lilita One 400 (with Nunito, system-ui, sans-serif), self-hosted via @fontsource.
**Body Font:** Nunito 600 and 800 (with system-ui, sans-serif), self-hosted via @fontsource.

**Character:** A heavy rounded playbill face for names, numbers and the primary action, with a soft rounded workhorse for everything read. Numerals are tabular everywhere so ticking stats do not jitter.

### Hierarchy
- **Display** (crest): the game name in the pelmet, white with a 5px ink keyline drawn under the fill (stroke painted first), like a printed card's outline.
- **Headline** (stat value): the big top-bar numerals (Day, Time, Gold).
- **Flat Title**: the title in a flat's royal header, white over a 4px ink keyline painted first.
- **Title**: card headings, currently the no-WebGL notice heading, in royal blue.
- **Item Name**: what is being placed, in the tray, in ink.
- **Action**: the primary action's label (Place), in display type.
- **Size Tag**: footprint sizes (2×2) in flat rows and the tray, in royal blue.
- **Row**: flat row names, Nunito 800.
- **Body**: all running text, Nunito 600 at 16px, max line length 60ch inside cards.
- **Button**: card button labels (Back, Turn) and the tray's verdict line, Nunito 800.
- **Label**: tiny uppercase tracked caps that name a column once: stat labels in blush on the pelmet, column labels (What, Size) in royal on a flat.

At heights of 500px and below (phones held sideways) the ramp tightens: display 22px (keyline 4px), headline 24px, label 10px, flat title 24px, tray item name 19px, flat row 16px, tray verdict 14px.

### Named Rules
**The Big Number, Tiny Label Rule.** Readouts are large display type over a tiny uppercase label. The label names the column once; it is never repeated per row.

## Layout

The 3D map is full-bleed and fixed to the window; all chrome floats above it. The pelmet spans the top (76px tall, 22px scallop hem; 56px and 16px at heights of 500px and below), with the crest and stats in one row, gaps clamped between about 18 and 44px. The Build button sits bottom-left and the camera turn buttons bottom-right (10px apart), each inset 20px from the edges and respecting safe-area insets. The fallback notice centres below the pelmet at up to 520px wide.

Panel flats stand on the right wing: flush to the right edge, from 10px below the pelmet hem down to 16px above the bottom, at min(420px, 45vw). The placing tray centres at the foot of the stage, 18px up, at min(560px, 100% minus 288px) so it clears the corner buttons. Only one of flat and tray shows at a time.

There are no on-screen key hints. Every key comes from the bindings table (`src/data/keybindings.json`); a Settings key-bindings screen is planned for M18.

Smallest supported target: 844x390 CSS px landscape. The short-height breakpoint (max-height: 500px) is the phone-landscape layout.

Camera turning is a PC extra: on coarse pointers without hover, the turn buttons are hidden and the camera keeps a fixed angle. The Build button stays on every device. Nothing is hover-only.

The 3D camera uses a narrow 24 degree field of view for a near-orthographic tabletop look, turning in 45 degree steps, zoom between 1.0 and 7.6 (start 4.2, step 0.4), starting on the plaza at square (33, 19); exact values live in `src/data/balance.json`.

### Named Rules
**The Stage Owns the Screen Rule.** Chrome lives on the edges; the town is never boxed in or covered by a frame.

## Elevation & Depth

Depth comes from the paper itself: ink outlines separate layers, and a single soft, warm, ink-tinted shadow lifts loose card pieces off the stage. In the 3D world, depth is real: a white sun casts soft PCF shadows across the board onto the stage floor under bright ambient light. Walls, gatehouses and buildings that stand between the camera and the placement footprint fade to 0.3 opacity (their ink lines drop out below 0.6), then return when the view clears.

### Shadow Vocabulary
- **Paper lift** (`box-shadow: 0 3px 10px rgb(59 42 46 / 0.22)`): every floating card piece (stage buttons, flats, the tray, the notice).

### Named Rules
**The Soft Shadow Rule.** Shadows are soft and ink-tinted only. No hard offset block shadows.

## Shapes

Rounded, cut-out card shapes with a 3px ink outline on every UI piece. Corners scale with the piece: 4px on the meter thumb and the groove, 9px on the meter, 10px on card buttons, 14px on cards, flats and the tray, fully round on stage buttons. A flat rounds only its stage-side corners (its open edge runs off the wing). The pelmet's hem is a row of whole ink-edged semicircle scallops (48px pitch, 36px when short) that always end on whole scallops at both sides. Icons are inline SVG line drawings, 26px, stroke 2.6 with round caps and joins, in ink. The favicon is a crown and ember drawn in ink-outlined flat fills on a rounded curtain-red tile.

In the world, buildings are papercraft: a box and a gable roof folded from five drawn panels (front, side, back, gable, roof), inset from their footprint so neighbours never touch, with ink on the wall-box edges and the roof outline. The statue and quest board are flat cut-outs that turn to face the camera.

## Components

### Pelmet (top bar)
A red theatre valance across the top of the stage. Curtain-red fill, 3px ink bottom rule, scalloped hem below. Holds the crest, then stats as a description list. It is read-only and passes pointer events through to the map.

### Stat
Big numeral over a tiny label, stacked with a 3px gap. Labels in blush, values in white display type.

### Loved/Feared Meter
A 14px ink-outlined pill with flat halves (Loved pink left, royal blue right) and a 3px ink tick at even. A white card thumb (12x22px, ink outline) slides to the position over 400ms on the ease-out curve; it is still under reduced motion. Exposed as a `meter` role with readable value text (Even, Loved n, Feared n).

### Buttons (stage buttons)
One shared round card button for everything that rests on the stage: the camera turn buttons and the Build button (hammer-and-house icon, bottom-left).
- **Shape:** fully round, 52px, 3px ink outline, paper-lift shadow.
- **Default:** printed card with an ink line icon.
- **Hover:** warm card fill. The Build button keeps the warm card fill while its flat is open.
- **Active:** presses down 2px and shrinks to 0.96.
- **Focus:** 4px marigold outline, 2px offset.
- The turn buttons are hidden on coarse pointers (PC extra); the Build button is not.

### Buttons (card buttons)
Rectangular card buttons inside flats and the tray (Back, Turn).
- **Shape:** 44px tall, 16px side padding, 10px corners, 3px ink outline, no shadow (they sit on a card already).
- **Hover:** warm card. **Active:** presses down 2px. **Focus:** 4px marigold outline, 2px offset.
- **Disabled:** card fill with faint ink text and outline, no press.
- **Primary (Place):** leaf button fill with ink text in display type; hover lifts to the lighter leaf. Disabled Place drops to the disabled card look, not a pale green.

### Panel flat (Build)
A printed card flat on the right wing. It slides on from off the wing over 420ms on the ease-out curve, overshoots 6px and tips back 0.4 degrees, then settles flat (a small paper settle); under reduced motion it simply appears. Under it runs a wooden groove: an 8px base-wood strip with an ink outline and 4px corners, starting 18px in from the flat's left edge and running off the wing.
- **Header:** royal blue with a 3px ink bottom rule, holding the inked white title on the left and the Back button on the right.
- **Column labels:** said once under the header (What, Size), in royal label caps.
- **Rows:** full-width buttons, 48px tall, name in ink and size tag in royal. One 2px row rule between rows, none above the first. Hover is warm card; keyboard focus is a 4px marigold outline drawn inside the row. The list scrolls inside the flat.
- Back, Esc and right-click all go up one level.

### Placing tray
A printed card at the foot of the stage, sliding up over 320ms when placing starts (still under reduced motion). The verdict row sits on top so the buttons below never move when it appears or changes: success in deep leaf, problems in deep curtain, hidden when empty, announced politely to screen readers. Below it, the item name with its size tag on the left, and Turn, Place and Back on the right (Turn is hidden for roads).

### Placement preview (world)
What the player is placing, drawn on the board:
- A 4.5px marigold outline around the footprint's outer edge (the Right Now Rule).
- Leaf fill on the footprint squares when the spot fits, curtain fill when it does not, both at 0.72 opacity.
- A see-through papercraft ghost (0.55 opacity, no ink) tinted pale leaf when it fits and pale curtain when it does not, so the verdict reads on the building itself.
- Ink arrows on the road squares in front of the door, pointing into it.
- While placing, the build grid shows and the map's marigold focus frame hides; anything blocking the footprint fades (see Elevation & Depth).
- A newly placed building drops onto the board: it starts 0.7 above the board, tilted 0.12 radians, and lands flat over 0.42s on a cubic ease-out. Skipped under reduced motion; the starting town never drops.

### Notice (card)
A printed card at 14px corners with paper lift: royal display heading, body text. Shown when WebGL is unavailable.

### Map focus
When the map has keyboard focus, a 4px marigold frame outlines the visible stage below the pelmet (no top edge, so the pelmet hem stays clean). It hides while placing.

### Planned (not yet implemented)
Recorded from the direction contract so future surfaces follow the world; exact values are not set and must be derived from the build when made.
- **Tabs** on a flat's top edge, for flats that need them.
- **Proscenium dialogs:** story moments (events, Audience Hall, night report) play inside a red proscenium; the pelmet and side curtains drop around the stage.
- **Princess chip** bottom-left (the Build button holds that corner today; their arrangement is not yet decided).
- **Emberstone** stat and **speed buttons** in the pelmet.
- **Party line colours:** one line colour per party, used everywhere.
- **Portrait baseline:** one shared portrait baseline and scale in every list.
- **Chosen route** in marigold.
- **Settings key-bindings screen** (M18).
- **Characters:** chibi camera-facing cut-outs with thick ink outlines, flat fills and a slight wobble, front and back views (see PLAN.md 2.1 and 2.2).

## Do's and Don'ts

### Do:
- **Do** outline every UI piece and world edge in ink (#3b2a2e): 3px in the UI, 3.5px in the world.
- **Do** keep marigold (#f2b233) for what the player is doing right now: focus, placement footprint, chosen route.
- **Do** give every focusable element a visible 4px marigold focus outline.
- **Do** set stat labels in blush (#fff2f4) on curtain red (#c8324a), as tiny tracked caps over big numerals.
- **Do** use the single paper-lift shadow (0 3px 10px rgb(59 42 46 / 0.22)) for floating card pieces.
- **Do** use the shared 52px round stage button for anything resting on the stage.
- **Do** put a flat's primary action in leaf button with ink text, and write success and problem text in deep leaf and deep curtain.
- **Do** keep a verdict on its own row so the buttons never move.
- **Do** check every layout at 844x390 landscape.
- **Do** keep camera turning a PC extra, hidden on coarse pointers.
- **Do** keep theatre trim on the edges of the stage and in story moments.

### Don't:
- **Don't** use marigold as decoration, brand accent or idle fill.
- **Don't** introduce a second outline colour or grey borders.
- **Don't** blend gradients; colour changes are hard edges.
- **Don't** use hard offset block shadows.
- **Don't** put theatre trim inside lists.
- **Don't** make anything hover-only.
- **Don't** print key hints on screen; keys come from the bindings table.
- **Don't** paint the build grid into the grass; it shows only while building.
- **Don't** reach for parchment scrolls or carved wood frames.

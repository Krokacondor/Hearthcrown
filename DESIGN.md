---
name: Hearthcrown
description: A kingdom on a paper stage. A papercraft diorama town under a red theatre pelmet, in printed card stock with ink outlines.
colors:
  curtain: "#c8324a"
  curtain-label: "#fff2f4"
  pelmet-text: "#ffffff"
  marigold: "#f2b233"
  royal: "#2f5fa8"
  loved: "#f59ac0"
  leaf: "#5aa04a"
  ink: "#3b2a2e"
  card: "#fffdf8"
  card-hover: "#fff6dc"
  sky: "#cfe3ea"
  grass: "#9fcf7c"
  grid-line: "#8dbf6c"
  tuft: "#6fae55"
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
  title:
    fontFamily: "Lilita One, Nunito, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.15
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.35
    fontFeature: "\"tnum\" 1"
  label:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.12em"
  hint:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1
  keycap:
    fontFamily: "Lilita One, Nunito, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1
rounded:
  thumb: "4px"
  meter: "9px"
  chip: "10px"
  card: "14px"
  round: "50%"
spacing:
  label-gap: "3px"
  chip-y: "6px"
  cluster: "10px"
  chip-x: "12px"
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
  turn-button:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round}"
    size: "52px"
  turn-button-hover:
    backgroundColor: "{colors.card-hover}"
    textColor: "{colors.ink}"
  key-chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.hint}"
    rounded: "{rounded.chip}"
    padding: "6px 12px"
  key-cap:
    textColor: "{colors.royal}"
    typography: "{typography.keycap}"
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

The kingdom is a paper stage. The papercraft diorama town is the stage floor and owns the whole window; the interface is theatre trim around its edges. M0 builds the first of that trim: a curtain-red pelmet with a scalloped hem across the top, carrying the kingdom's name and its numbers, and small white printed-card pieces (camera buttons, key hints, a fallback notice) resting on the stage. Everything, chrome and world alike, reads as printed card stock: flat hand-coloured fills, one dark ink outline, and soft paper shadows.

The feel is bright, warm and readable: a storybook kingdom made of simple shapes. Density is low; the town comes first and the chrome second. Big numerals over tiny capital labels let the player read their day at a glance. The world refuses the category default of parchment scrolls in carved wood frames; the wood here is a toy stage's base and floorboards, not ornament.

The diorama sits on an ink-edged wooden board (base wood) standing on a plank stage floor, lit by a white sun with real soft shadows over a pale sky. Grass carries a faint tile grid and fixed-seed tufts, so the board looks the same on every load.

**Key Characteristics:**
- One ink colour outlines everything, in the UI and in the 3D world.
- Flat fills only; colour changes are hard edges, never blends.
- Marigold means "what you are doing right now" and nothing else.
- Display numerals in a heavy rounded playbill face; body in a rounded workhorse.
- Theatre trim stays on the edges of the stage; the map is never boxed in.
- Keyboard first, with a visible marigold focus on everything focusable.

## Colors

A warm, hand-coloured toy-theatre palette: one saturated curtain red, one royal blue, one reserved marigold, and soft card, sky and grass neutrals, all held together by a single plum-brown ink.

### Primary
- **Curtain Red** (curtain): the pelmet, the theme colour and the favicon ground. The stage's frame colour; it belongs to the top edge and to story moments, not to lists or rows.
- **Pelmet White** (pelmet-text): the crest and the big stat numerals on the curtain.
- **Blush Label** (curtain-label): the tiny capital stat labels on the curtain (about 4.8:1 on curtain red). Labels are never plain white; the tint keeps them a step quieter than the numerals.

### Secondary
- **Royal Blue** (royal): key caps in the hint chips, the notice heading, and the Feared half of the meter. Planned as the panel-header colour (see Components, Planned).
- **Loved Pink** (loved): the Loved half of the Loved/Feared meter. The world palette reuses the same pink for roofs.

### Tertiary
- **Marigold** (marigold): reserved. Keyboard focus rings, the map's focus frame, text selection, and (planned) the placement ghost and the chosen route. Never decoration, never a brand accent, never a fill for an idle element.
- **Leaf Green** (leaf): reserved for confirm, the primary action at the bottom of a panel. Declared in M0 but not yet applied; no M0 surface has a confirm action.

### Neutral
- **Ink** (ink): the one outline colour (3px UI lines, 3.5px world edges), body text, the meter's centre tick, the pelmet's bottom rule and scallop edge.
- **Printed Card** (card): every card-like surface: buttons, chips, the notice, the meter thumb.
- **Warm Card** (card-hover): the hover state of card buttons only.
- **Pale Sky** (sky): page background and the 3D scene background.

### World palette (3D diorama)
- **Meadow** (grass): the board's grass texture. **Grid Line** (grid-line): the faint 2px tile grid on the grass. **Tuft** (tuft): 4px round-capped grass tufts.
- **Base Wood** (base-wood): the diorama's wooden board, outlined in ink.
- **Stage Floor** (stage-floor) with **Plank Line** (stage-plank): the staggered floorboards under the board.
- Declared in `src/render/palette.ts` for the castle town but not yet painted in M0: cobble (#d1bd96), dirt (#e8cf9e), stone (#d9d2c8). Promote them to tokens when M1 paints them.

### Named Rules
**The Right Now Rule.** Marigold (#f2b233) marks only what the player is doing right now: keyboard focus, the placement ghost, the chosen route. If an element is marigold while idle, it is wrong.

**The One Ink Rule.** Ink (#3b2a2e) is the only outline colour, for the UI and the world. No grey borders, no coloured strokes, no second ink.

**The Flat Fill Rule.** Fills are flat. Where CSS gradients appear (the meter halves, the scallops) they are hard stops used to draw shapes, never blends. No soft colour gradients anywhere.

## Typography

**Display Font:** Lilita One 400 (with Nunito, system-ui, sans-serif), self-hosted via @fontsource.
**Body Font:** Nunito 600 and 800 (with system-ui, sans-serif), self-hosted via @fontsource.

**Character:** A heavy rounded playbill face for names and numbers, with a soft rounded workhorse for everything read. Numerals are tabular everywhere so ticking stats do not jitter.

### Hierarchy
- **Display** (crest): the game name in the pelmet, white with a 5px ink keyline drawn under the fill (stroke painted first), like a printed card's outline.
- **Headline** (stat value): the big top-bar numerals (Day, Time, Gold).
- **Title**: card headings, currently the no-WebGL notice heading, in royal blue.
- **Body**: all running text, Nunito 600 at 16px, max line length 60ch inside cards.
- **Label** (stat label): tiny uppercase tracked caps over each numeral, said once.
- **Hint**: key-hint chip text, Nunito 800.
- **Keycap**: the key letters inside hint chips, Lilita One in royal blue.

At heights of 500px and below (phones held sideways) the ramp tightens: display 22px (keyline 4px), headline 24px, label 10px.

### Named Rules
**The Big Number, Tiny Label Rule.** Top-bar readouts are large display numerals over a tiny uppercase label. The label names the column once; it is never repeated per row.

## Layout

The 3D map is full-bleed and fixed to the window; all chrome floats above it. The pelmet spans the top (76px tall, 22px scallop hem; 56px and 16px at heights of 500px and below), with the crest and stats in one row, gaps clamped between about 18 and 44px. Camera buttons sit bottom-right and key hints bottom-centre, each inset 20 to 24px from the edges and respecting safe-area insets. The fallback notice centres below the pelmet at up to 520px wide.

Smallest supported target: 844x390 CSS px landscape. The short-height breakpoint (max-height: 500px) is the phone-landscape layout.

Camera turning is a PC extra: on coarse pointers without hover, the turn buttons and key hints are hidden and the camera keeps a fixed angle. Nothing is hover-only.

The 3D camera uses a narrow 24 degree field of view for a near-orthographic tabletop look, turning in 45 degree steps, zoom between 0.9 and 3.4 (start 2.45, step 0.15); exact values live in `src/data/balance.json`.

### Named Rules
**The Stage Owns the Screen Rule.** Chrome lives on the edges; the town is never boxed in or covered by a frame.

## Elevation & Depth

Depth comes from the paper itself: ink outlines separate layers, and a single soft, warm, ink-tinted shadow lifts loose card pieces off the stage. In the 3D world, depth is real: a white sun casts soft PCF shadows across the board onto the stage floor under bright ambient light.

### Shadow Vocabulary
- **Paper lift** (`box-shadow: 0 3px 10px rgb(59 42 46 / 0.22)`): every floating card piece (camera buttons, key chips, the notice).

### Named Rules
**The Soft Shadow Rule.** Shadows are soft and ink-tinted only. No hard offset block shadows.

## Shapes

Rounded, cut-out card shapes with a 3px ink outline on every UI piece. Corners scale with the piece: 4px on the meter thumb, 9px on the meter, 10px on chips, 14px on cards, fully round on icon buttons. The pelmet's hem is a row of whole ink-edged semicircle scallops (48px pitch, 36px when short) that always end on whole scallops at both sides. Icons are inline SVG line drawings, 26px, stroke 2.6 with round caps and joins, in ink. The favicon is a crown and ember drawn in ink-outlined flat fills on a rounded curtain-red tile.

## Components

### Pelmet (top bar)
A red theatre valance across the top of the stage. Curtain-red fill, 3px ink bottom rule, scalloped hem below. Holds the crest, then stats as a description list. It is read-only and passes pointer events through to the map.

### Stat
Big numeral over a tiny label, stacked with a 3px gap. Labels in blush, values in white display type.

### Loved/Feared Meter
A 14px ink-outlined pill with flat halves (Loved pink left, royal blue right) and a 3px ink tick at even. A white card thumb (12x22px, ink outline) slides to the position over 400ms on the ease-out curve; it is still under reduced motion. Exposed as a `meter` role with readable value text (Even, Loved n, Feared n).

### Buttons (camera turn)
- **Shape:** fully round, 52px, 3px ink outline, paper-lift shadow.
- **Default:** printed card with an ink line icon.
- **Hover:** warm card fill.
- **Active:** presses down 2px and shrinks to 0.96.
- **Focus:** 4px marigold outline, 2px offset.
- Hidden on coarse pointers (PC extra).

### Chips (key hints)
Printed card with ink outline and paper lift, 10px corners. Key letters in royal Lilita One, the action word in Nunito 800. Desktop only, not interactive.

### Notice (card)
A printed card at 14px corners with paper lift: royal display heading, body text. Currently the only card, shown when WebGL is unavailable.

### Map focus
When the map has keyboard focus, a 4px marigold frame outlines the visible stage below the pelmet (no top edge, so the pelmet hem stays clean).

### Planned (not yet implemented in M0)
Recorded from the direction contract so future surfaces follow the world; exact values are not set and must be derived from the build when made.
- **Panel flats:** white card flats on the right wing (about 420px desktop, about 45% on phones) with a royal-blue header, title and Back button, tabs on the top edge, aligned-column rows with one rule weight, a wooden groove under each flat, and a slide-on from the wings with a small paper settle.
- **Proscenium dialogs:** story moments (events, Audience Hall, night report) play inside a red proscenium; the pelmet and side curtains drop around the stage.
- **Back button** in every flat (Esc, right-click and phone back also go Back).
- **Primary action** at the bottom of a flat in leaf green.
- **Princess chip** bottom-left.
- **Emberstone** stat and **speed buttons** in the pelmet.
- **Party line colours:** one line colour per party, used everywhere.
- **Portrait baseline:** one shared portrait baseline and scale in every list.
- **Placement ghost** and **chosen route** in marigold.
- **Characters and props:** chibi camera-facing cut-outs with thick ink outlines, flat fills and a slight wobble, front and back views; papercraft buildings with flat panel faces (see PLAN.md 2.1 and 2.2).

## Do's and Don'ts

### Do:
- **Do** outline every UI piece and world edge in ink (#3b2a2e): 3px in the UI, 3.5px in the world.
- **Do** keep marigold (#f2b233) for what the player is doing right now: focus, placement ghost, chosen route.
- **Do** give every focusable element a visible 4px marigold focus outline.
- **Do** set stat labels in blush (#fff2f4) on curtain red (#c8324a), as tiny tracked caps over big numerals.
- **Do** use the single paper-lift shadow (0 3px 10px rgb(59 42 46 / 0.22)) for floating card pieces.
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
- **Don't** reach for parchment scrolls or carved wood frames.

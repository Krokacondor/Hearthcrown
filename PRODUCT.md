# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Decided in `PLAN.md` section 2: TypeScript + Vite, Three.js for the 3D diorama map, HTML/CSS for panels and dialogs, Vitest for tests. No game engine and no UI framework. No backend; saves live in `localStorage`. An installable web app comes in M18. Store apps (Android, iPhone) may wrap the same build later with Capacitor, so the design language stays web, not native.

## Users

- **The maker, friends and family first**, then **the general public**: teens and adults who enjoy cozy city-building and management games, playing in a desktop browser or on a phone held sideways.
- They play in sessions of a few in-game days (one day is about 6 real minutes at 1× speed), often pausing to read events, petitions and the night report.

## Product Purpose

Hearthcrown is a kingdom-management game set in a 3D papercraft diorama: papercraft buildings you can turn the camera around, flat cut-out characters with front and back views, inside a walled castle town. You play a young princess rebuilding her fallen capital from an empty field. You never fight. You build the city, issue decrees, walk the streets, and hear your people's pleas. Adventurers live in the city and clear dungeons on their own; once they leave the gates they are out of your hands until dusk.

Success is the three feelings the maker named:
1. **Building a city from nothing.** Every building makes the place more alive, and named citizens move in.
2. **Being a leader to real people.** You walk among them, answer them in the Audience Hall, and each morning starts with a choice. Loved ↔ Feared reflects the ruler you become.
3. **Guiding adventurers without controlling them.** You prepare them well, then trust them, and learn how it went in the night report.

## Positioning

A management game where the ruler is a person on the map, not a cursor: the princess walks her own streets, and walking costs her time. Combat is never controlled; only preparation, decrees and nudges are. There is no game over, debt or failure screen. Bad choices close doors and slow you down, but the city always keeps running.

## Operating Context

- A daily loop: morning event (paused) → preparation and sign-ups → day (parties leave; the princess walks, builds, holds audiences) → dusk returns → night report.
- Many panels (Build, Decrees, Adventurers, Guilds, Research, World Map, Inventory, Story, Promises) and dialogs (events, story scenes, petitions, conversations, style requests, guild petitions, retirement).
- The Audience Hall is a quick Yes / No / Promise court, one petitioner at a time.

## Capabilities and Constraints

- Targets **desktop browsers and phones in landscape**. Smallest supported viewport: 844×390 CSS px.
- **The keyboard alone must play the whole game.** Mouse is optional and behaves like touch (click = tap). Touch on phones: tap, drag, pinch.
- **Back** goes up one level: Esc, right-click, or an on-screen Back button (plus the phone's back gesture). With nothing open it does nothing.
- Nothing is hover-only. Panels slide in from the side so the map stays visible.
- Terminology: classes are **Styles**; adventurers start as **Novice**; adventurers never die. Gold never goes below zero.
- Art is a flat, hand-drawn chibi cartoon drawn in code for v1: thick dark outlines (#3b2a2e), flat fills, a slight wobble filter. Reference: `docs/art/princess-reference.png` (option B). All art is referenced by stable IDs so human-made art packs can replace it later (`PLAN.md` 2.1).
- All names, characters, text and art are original. Nothing may be taken from existing games, including the games that inspired it.

## Brand Commitments

- Name: **Hearthcrown** (working title).
- Feel, as the maker put it: **bright and warm**. A readable storybook kingdom built from simple shapes.
- Voice: **funny, but not overboard.** Warm writing with real humor in petitions, events and townsfolk chatter, never constant gags or snark.
- Recurring cast: the princess, her advisor, a rival noble, a mysterious traveler (all original, details still undecided).

## Evidence on Hand

- `PLAN.md`: full game design. `CLAUDE.md`: working rules.
- No art, logo, screenshots, testimonials or players yet. Do not invent any.

## Product Principles

1. **You rule, they adventure.** The interface never offers control over a party outside the gates.
2. **Every choice is a person.** Requests come from named citizens and adventurers who remember your answers.
3. **Cozy, never punishing.** No game-over states and no panic UI. Being broke only greys out options.
4. **Readable first.** Busy days must stay scannable at a glance on a phone held sideways.
5. **Keyboard parity.** Any action the mouse or a finger can do, the keyboard can do too.

## Accessibility & Inclusion

- Full keyboard play with visible focus states on every focusable element.
- Touch targets sized for phones; no hover-only information.
- Readable text sizes at 844×390.

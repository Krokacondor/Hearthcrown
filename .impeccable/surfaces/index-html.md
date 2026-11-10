---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["src/style.css","src/ui"]
---

# Game shell (top bar, side panels, dialogs over the 3D map)

Mode: Operate. Visitors: the maker, friends and family, then the public; desktop with keyboard first, phones held sideways (smallest 844×390). Job: run the kingdom without losing sight of the papercraft town. Every panel, dialog and the top bar must be readable at a glance and fully keyboard-driven, with Back always one key (Esc) away.

Constraints carried from PLAN.md: the map is the 3D papercraft diorama (2.2) and owns the screen; panels slide in from the side; nothing hover-only; people are dealt with face to face, so panels never offer "talk" or "book" actions (4.2); camera turning is a PC extra.

## Direction contract

THESIS: The kingdom is a paper stage. The papercraft town is the stage floor, panels are scenery flats that slide on from the wings, and story moments (events, Audience Hall, night report) play inside a red proscenium. It refuses the category default of parchment scrolls in carved wood frames.

OWN-WORLD: Printed card stock with thick ink outlines (#3b2a2e, 3–4px) and flat hand-coloured fills: curtain red #c8324a for the pelmet, royal blue #2f5fa8 for panel headers, leaf green #5aa04a for confirm, white card #fffdf8 for panel bodies, a wooden groove under each flat. Marigold #f2b233 is reserved for "what you are doing right now" (keyboard focus, placement ghost, chosen route) and nothing else. Display type is a heavy rounded playbill face (Lilita One); body is a rounded workhorse (Nunito). Raised from the declined hands: one shared portrait baseline and scale in every list (botanical folio); one line colour per party everywhere (transit diagram); aligned columns with one rule weight and column labels said once, never per row (design annual); big numbers with tiny labels in the top bar (type specimen).

STORY: The player sees the town first and the chrome second, knows their day, time, gold, Emberstone and standing in one glance, opens a flat to act, and feels each story beat as a small performance.

FIRST VIEWPORT: Full-bleed 3D map. Across the top, a red pelmet with a scalloped bottom edge: the name, then Day, Time, Gold, Emberstone as large numerals over tiny caps labels, the Loved/Feared meter, and speed buttons at the right. When a panel is open it is a white card flat on the right wing (about 420px on desktop, about 45% on phones) with a blue header, title, and a Back button; tabs sit on its top edge; rows are aligned columns. The princess chip sits bottom-left. Key hints sit bottom-centre on desktop only. The primary action of a panel sits at the bottom of its flat in leaf green.

FORM: Toy theatre, position 3 of my ordered list (market signboards 1, heraldic banners 2, toy theatre 3, felt appliqué 4, sticker book 5, board-game punchboard 6, enamelware 7); seed:8df2bf4f95c599c7. Signature move: flats slide on from the wings with a small paper settle, and dialogs drop the pelmet and side curtains around the stage. Theatre trim stays on the edges and in story moments, never inside lists.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

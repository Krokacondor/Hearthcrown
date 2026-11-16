# Dialogue box and chat bubbles: brief (M2)

Surface: the game shell (`.impeccable/surfaces/index-html.md`), Operate mode. Starts from the approved mockup `docs/design/m2-mockups/dialogue-box.html` and the M2 spec's "Talking" section.

## Job and audience
The player has walked the princess up to someone and talked to them, or is passing two townsfolk who are chatting. They need to read one short line without losing the town, then carry on walking. Early lines are about the town being quiet; the feeling is warm and a little lonely, funny but not overboard.

## Selected direction (inside the Toy Theatre world)
- **The dialogue box is a printed card at the foot of the stage**, using the placing tray's geometry: centred, 18px up, `min(560px, 100% - 288px)` wide so it clears the corner buttons. It only flips to the top (10px under the pelmet hem) when the speakers sit in the lowest 30% of the view, where the box would cover them (the camera keeps her just below the middle, so the bottom is the usual spot). The tray and the box never show together (the Build menu can't open while talking, and walking stops while building).
- **Inside:** the person's portrait on the left (a square printed card, 3px ink, 10px corners, about 76px; 60px at heights of 500px and below), their line beside it in Nunito body size, ink on card. Their **name tag** is a small curtain-red card with Lilita One in curtain-label white, sitting on the box's top edge at the left, like a playbill label pinned on.
- **More to read:** a small ink ▼ at the bottom-right corner bobs gently. It shows only when there is another line. No key hints anywhere.
- **Arrival:** the box slides up from the bottom edge (or down from the pelmet) over 320ms on the ease-out curve, like the tray; under reduced motion it simply appears, and the arrow and dots stop moving.
- **Chat bubbles:** small printed cards above each speaker's head with a short ink tail pointing down at them; 2px ink outline (lighter than chrome, they belong to the world), 10px corners, Nunito 800 at label-ish size, at most about 200px wide and 3 lines. Far from the princess the bubble shows three ink dots that rise and fall in turn. Only the speaker of the current line shows a bubble; the listener shows none.
- **Marker:** the marigold diamond over the nearest person in reach (already in the 3D view) is the "right now" signal for talking. Marigold appears nowhere in the box or bubbles.

## Behaviour
- Talk key, a click or a tap anywhere on the stage (or on the box) moves to the next line; after the last line the box slides away.
- The box is real HTML: `role="dialog"` labelled by the name, the line in an `aria-live="polite"` region so each line is announced. Focus stays on the map so keys keep working; the box never traps focus.
- Bubbles are `aria-hidden` decoration and never take clicks (pointer events pass through to the map).
- Bubbles hide while the dialogue box is open over them, and whenever their head is off screen or behind the camera.

## States and ranges
- Lines run from a few words to about 110 characters (the longest current line). The box grows in height to fit, never scrolls; at 844×390 the longest line still fits in three lines next to the 60px portrait.
- Up to three chats at once (seven people); bubbles may overlap a little, which is acceptable (the human accepted some overlap of people).

## Out of scope
- Choices or replies inside the dialogue (M14). The princess's own portrait. Character art (M2b; portraits are placeholders from the art registry).

## Confirmed by the maker (2026-11-16)
- The box reuses the tray's position and width rather than spanning the full width as the mockup sketch did, so it clears the corner buttons on phones.
- Only the current speaker shows a bubble (not both people at once).

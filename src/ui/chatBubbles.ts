// Chat bubbles over townsfolk (docs/design/dialogue-brief.md): the words when the princess is close enough
// to overhear, three bobbing dots when she isn't. Decoration only: hidden from screen readers, never clickable.

export type BubbleContent = { kind: "words"; text: string } | { kind: "dots" };

/** Words within `wordsRange` squares of the princess, dots farther away. */
export function bubbleContent(line: string, distance: number, wordsRange: number): BubbleContent {
  return distance <= wordsRange ? { kind: "words", text: line } : { kind: "dots" };
}

export interface BubbleItem { id: number; x: number; y: number; content: BubbleContent }

export function installChatBubbles(root: HTMLElement): { sync(items: readonly BubbleItem[]): void } {
  const bubbles = new Map<number, { el: HTMLElement; key: string }>();
  const DOTS = '<span class="bubble__dots"><i></i><i></i><i></i></span>';

  return {
    sync(items) {
      const seen = new Set<number>();
      for (const it of items) {
        seen.add(it.id);
        let b = bubbles.get(it.id);
        if (!b) {
          const el = document.createElement("div");
          el.className = "bubble";
          root.append(el);
          b = { el, key: "" };
          bubbles.set(it.id, b);
        }
        const key = it.content.kind === "words" ? `w:${it.content.text}` : "dots";
        if (key !== b.key) {
          b.key = key;
          if (it.content.kind === "words") b.el.textContent = it.content.text;
          else b.el.innerHTML = DOTS;
          b.el.classList.toggle("bubble--dots", it.content.kind === "dots");
        }
        b.el.style.transform = `translate(${Math.round(it.x)}px, ${Math.round(it.y)}px) translate(-50%, -100%)`;
      }
      for (const [id, b] of bubbles) {
        if (seen.has(id)) continue;
        b.el.remove();
        bubbles.delete(id);
      }
    },
  };
}

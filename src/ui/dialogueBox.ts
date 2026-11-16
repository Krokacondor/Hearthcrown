// The dialogue box (docs/design/dialogue-brief.md): a printed card at the foot of the stage with the person's
// portrait, a red name tag and their line. It flips under the pelmet when the speakers are low on screen.

export type DialogueEdge = "top" | "bottom";

/** Bottom, unless the speakers stand in the lowest 30% of the view, where the box would cover them. */
export function dialogueEdge(speakerScreenY: number, viewHeight: number): DialogueEdge {
  return speakerScreenY > viewHeight * 0.7 ? "top" : "bottom";
}

export interface DialogueView { name: string; portrait: string; text: string; more: boolean; edge: DialogueEdge }

export interface DialogueBox {
  show(d: DialogueView): void;
  hide(): void;
}

/** Wires the box in `root` (#dialogue) and the screen-reader line (#dialogue-live). `onNext` runs on a click or tap. */
export function installDialogueBox(root: HTMLElement, live: HTMLElement, onNext: () => void): DialogueBox {
  const q = <T extends Element>(sel: string): T => {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(`Missing ${sel} in #dialogue`);
    return el;
  };
  const portrait = q<HTMLImageElement>(".dialogue__portrait");
  const name = q<HTMLElement>(".dialogue__name");
  const line = q<HTMLElement>(".dialogue__line");
  const more = q<SVGElement>(".dialogue__more");
  let shown = "";

  root.addEventListener("click", onNext);

  return {
    show(d) {
      const key = `${d.name}|${d.portrait}|${d.text}|${d.more}|${d.edge}`;
      if (key === shown) return;
      const sameLine = shown.startsWith(`${d.name}|${d.portrait}|${d.text}|`);
      shown = key;
      if (portrait.dataset.id !== d.portrait) {
        portrait.src = d.portrait;
        portrait.dataset.id = d.portrait;
      }
      name.textContent = d.name;
      line.textContent = d.text;
      more.style.visibility = d.more ? "visible" : "hidden";
      root.dataset.edge = d.edge;
      root.hidden = false;
      // Announced once per line, not again when the box only flips edge.
      if (!sameLine) live.textContent = `${d.name}: ${d.text}`;
    },
    hide() {
      if (root.hidden) return;
      shown = "";
      root.hidden = true;
      live.textContent = "";
    },
  };
}

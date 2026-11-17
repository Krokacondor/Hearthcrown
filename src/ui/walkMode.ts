// Walking the princess (M2): held keys or the controller stick become a ground direction relative to the
// camera; Space/Enter or the controller's talk button talks; a click or tap walks her there (or to a
// person, to talk). Everything goes through sim commands. Nothing here runs while the Build menu is open.
import { screenToWorld } from "../render/camera";
import type { DioramaView } from "../render/scene";
import type { Game } from "../sim/game";
import type { Arrow } from "./buildInput";
import type { CameraAction } from "./keys";
import { heldToScreen, isTap, padEdges, readPad, walkKeyFor, type PadState } from "./walkInput";

export interface WalkModeDeps {
  game: Game;
  view: DioramaView;
  map: HTMLElement;
  cameraStep(): number;
  buildOpen(): boolean;
  applyCamera(a: CameraAction): void;
}

const NO_PAD: PadState = { dx: 0, dz: 0, sprint: false, talk: false, turn: 0, zoom: 0 };
/** The princess's id in picks (townsfolk are 1 and up). */
const PRINCESS = 0;

/** Keys typed into buttons and fields keep their usual meaning. */
const typingTarget = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement && t.closest("button, input, textarea, select, [contenteditable]") !== null;

export function installWalkMode(deps: WalkModeDeps): { poll(): void } {
  const { game, view, map } = deps;
  const held = new Set<Arrow>();
  let shift = false;
  let lastPad = NO_PAD;
  let sent = "";

  const talkOrNext = (): void => {
    if (game.world.dialogue) game.command("advanceDialogue");
    else game.command("talk");
  };
  const send = (x: number, z: number, sprint: boolean): void => {
    const key = `${x},${z},${sprint}`;
    if (key === sent) return;
    sent = key;
    game.command("setWalkInput", { x, z, sprint });
  };

  document.addEventListener("keydown", (e) => {
    if (deps.buildOpen() || e.ctrlKey || e.metaKey || e.altKey || typingTarget(e.target)) return;
    const k = walkKeyFor(e.key);
    if (!k) return;
    e.preventDefault();
    if (k.kind === "move") held.add(k.dir);
    else if (k.kind === "sprint") shift = true;
    else if (k.kind === "back") { if (game.world.dialogue) game.command("closeDialogue"); }
    else if (!e.repeat) talkOrNext();
  });
  document.addEventListener("keyup", (e) => {
    const k = walkKeyFor(e.key);
    if (k?.kind === "move") held.delete(k.dir);
    else if (k?.kind === "sprint") shift = false;
  });
  window.addEventListener("blur", () => { held.clear(); shift = false; });

  // ---- Click or tap: walk there, or walk to a person and talk. A drag or a two-finger pinch is not a tap.
  let down: { x: number; y: number; t: number; id: number } | null = null;
  let fingers = 0;
  map.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") fingers++;
    if (deps.buildOpen() || (e.pointerType === "mouse" && e.button !== 0)) { down = null; return; }
    down = fingers > 1 ? null : { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId };
  });
  const lift = (e: PointerEvent): void => {
    if (e.pointerType === "touch") fingers = Math.max(0, fingers - 1);
    const d = down;
    down = null;
    if (!d || d.id !== e.pointerId || e.type === "pointercancel" || deps.buildOpen()) return;
    if (!isTap(d, { x: e.clientX, y: e.clientY, t: e.timeStamp })) return;
    if (game.world.dialogue) { game.command("advanceDialogue"); return; }
    const person = view.pickPerson(e.clientX, e.clientY);
    if (person !== null && person !== PRINCESS) { game.command("walkToPerson", { id: person }); return; }
    const sq = view.pickSquare(e.clientX, e.clientY);
    if (sq) game.command("walkTo", { x: sq.x, z: sq.z });
  };
  // Right-click is Back (PLAN.md 5.1): it closes an open dialogue. Build mode handles its own.
  window.addEventListener("contextmenu", (e) => {
    if (!deps.buildOpen() && game.world.dialogue && (e as PointerEvent).pointerType !== "touch") game.command("closeDialogue");
  });
  map.addEventListener("pointerup", lift);
  map.addEventListener("pointercancel", lift);

  return {
    poll() {
      if (deps.buildOpen()) {
        send(0, 0, false);
        lastPad = NO_PAD;
        return;
      }
      const gp = navigator.getGamepads?.().find((g) => g?.connected) ?? null;
      const pad = gp ? readPad(gp) : NO_PAD;
      const edge = padEdges(lastPad, pad);
      lastPad = pad;
      if (edge.talk) talkOrNext();
      if (edge.turn) deps.applyCamera({ kind: "turn", dir: edge.turn });
      if (edge.zoom) deps.applyCamera({ kind: "zoom", dir: edge.zoom });

      const keys = heldToScreen(held);
      const screen = pad.dx !== 0 || pad.dz !== 0 ? pad : keys;
      const dir = screenToWorld(screen.dx, screen.dz, deps.cameraStep());
      send(dir.x, dir.z, shift || pad.sprint);
    },
  };
}

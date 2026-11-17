// Pure walking input: keys from data/keybindings.json and a controller read through data/gamepad.json
// (standard mapping). The stick is rigid: past the deadzone it means full speed in that direction.
import pad from "../data/gamepad.json";
import { actionFor } from "./bindings";
import type { Arrow } from "./buildInput";

export type WalkKey = { kind: "move"; dir: Arrow } | { kind: "sprint" } | { kind: "talk" } | { kind: "back" };

/** Walk keys from the bindings table. Camera and menu keys return null so they pass through. */
export function walkKeyFor(key: string): WalkKey | null {
  const action = actionFor("walk", key);
  switch (action) {
    case "up": case "down": case "left": case "right": return { kind: "move", dir: action };
    case "sprint": return { kind: "sprint" };
    case "talk": return { kind: "talk" };
    case "back": return { kind: "back" };
    default: return null;
  }
}

/** Held arrows as a screen direction (right = +dx, down = +dz). Opposite keys cancel. */
export function heldToScreen(held: ReadonlySet<Arrow>): { dx: number; dz: number } {
  const dx = (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0);
  const dz = (held.has("down") ? 1 : 0) - (held.has("up") ? 1 : 0);
  return { dx: dx + 0, dz: dz + 0 };
}

export interface PadState { dx: number; dz: number; sprint: boolean; talk: boolean; turn: -1 | 0 | 1; zoom: -1 | 0 | 1 }

interface PadLike { axes: readonly number[]; buttons: readonly { pressed: boolean }[] }

const pressed = (p: PadLike, list: readonly number[]): boolean => list.some((i) => p.buttons[i]?.pressed === true);
const sign = (v: number): -1 | 0 | 1 => (v > 0 ? 1 : v < 0 ? -1 : 0);

/** One controller's state: the left stick as a unit direction (or 0), and the buttons we use. */
export function readPad(p: PadLike): PadState {
  const [ax, az] = pad.moveAxes;
  const x = p.axes[ax!] ?? 0, z = p.axes[az!] ?? 0;
  const len = Math.hypot(x, z);
  const moving = len > pad.deadzone;
  const zoomAxis = p.axes[pad.zoomAxis] ?? 0;
  return {
    dx: moving ? x / len : 0,
    dz: moving ? z / len : 0,
    sprint: pressed(p, pad.sprint),
    talk: pressed(p, pad.talk),
    turn: sign((pressed(p, pad.turnRight) ? 1 : 0) - (pressed(p, pad.turnLeft) ? 1 : 0)),
    zoom: Math.abs(zoomAxis) > pad.deadzone ? sign(zoomAxis) : 0,
  };
}

/** What was just pressed between two reads: talk, camera turn and zoom act once per press. */
export function padEdges(prev: PadState, next: PadState): { talk: boolean; turn: -1 | 0 | 1; zoom: -1 | 0 | 1 } {
  return {
    talk: next.talk && !prev.talk,
    turn: next.turn !== 0 && next.turn !== prev.turn ? next.turn : 0,
    zoom: next.zoom !== 0 && next.zoom !== prev.zoom ? next.zoom : 0,
  };
}

/** A pointer press that barely moved and was short: a tap or click, not a drag or a long press. */
export function isTap(down: { x: number; y: number; t: number }, up: { x: number; y: number; t: number }): boolean {
  return Math.hypot(up.x - down.x, up.y - down.y) <= 8 && up.t - down.t <= 300;
}

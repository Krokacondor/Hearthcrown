// Pure build-mode input logic: keys, camera-relative moves, road strokes and two-tap placing on phones.
import { screenToWorld } from "../render/camera";
import type { Rot, Square } from "../sim/townMap";
import { actionFor } from "./bindings";

export type Arrow = "up" | "down" | "left" | "right";
export type BuildKey =
  | { kind: "move"; dir: Arrow }
  | { kind: "turn" }
  | { kind: "place" }
  | { kind: "back" };

/** Build-mode keys from the bindings table. Camera and menu keys return null so they pass through. */
export function buildKeyFor(key: string): BuildKey | null {
  const action = actionFor("build", key);
  switch (action) {
    case "up": case "down": case "left": case "right": return { kind: "move", dir: action };
    case "turn": return { kind: "turn" };
    case "place": return { kind: "place" };
    case "back": return { kind: "back" };
    default: return null;
  }
}

const SCREEN: Record<Arrow, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/**
 * The square-to-square move for an arrow, relative to the camera. At the diagonal angles (odd steps)
 * it uses the angle below, so every move goes to a side-by-side square and painted roads connect.
 */
export function arrowStep(dir: Arrow, cameraStep: number): { dx: number; dz: number } {
  const [sx, sz] = SCREEN[dir];
  const { x, z } = screenToWorld(sx, sz, cameraStep - (cameraStep % 2));
  return { dx: Math.round(x) + 0, dz: Math.round(z) + 0 };
}

export function clampToBoard(s: Square, width: number, depth: number): Square {
  return { x: Math.min(width - 1, Math.max(0, s.x)), z: Math.min(depth - 1, Math.max(0, s.z)) };
}

export function turnRot(rot: Rot): Rot {
  return ((rot + 1) % 4) as Rot;
}

/**
 * The squares a road stroke passes through going from `from` (already handled) to `to`, side by side
 * with no gaps, so a fast drag never skips a square. Walks the axis with more distance left first.
 */
export function strokeSquares(from: Square, to: Square): Square[] {
  const out: Square[] = [];
  let { x, z } = from;
  while (x !== to.x || z !== to.z) {
    if (Math.abs(to.x - x) >= Math.abs(to.z - z)) x += Math.sign(to.x - x);
    else z += Math.sign(to.z - z);
    out.push({ x, z });
  }
  return out;
}

export interface TapState { armed: Square | null }

/** Phones: the first tap previews a square; tapping the same square again places. */
export function tap(state: TapState, at: Square): { state: TapState; place: boolean } {
  const again = state.armed !== null && state.armed.x === at.x && state.armed.z === at.z;
  return { state: { armed: { x: at.x, z: at.z } }, place: again };
}

/**
 * The nearest square to `start` (by rings outward, then by walking distance) where `fits` is true,
 * staying on the board and within `maxRadius` rings. Null when nothing nearby fits.
 */
export function nearestFit(start: Square, fits: (s: Square) => boolean, width: number, depth: number,
  maxRadius = 12): Square | null {
  for (let r = 0; r <= maxRadius; r++) {
    const ring: Square[] = [];
    for (let z = start.z - r; z <= start.z + r; z++) {
      for (let x = start.x - r; x <= start.x + r; x++) {
        if (Math.max(Math.abs(x - start.x), Math.abs(z - start.z)) !== r) continue;
        if (x < 0 || z < 0 || x >= width || z >= depth) continue;
        ring.push({ x, z });
      }
    }
    ring.sort((a, b) =>
      Math.abs(a.x - start.x) + Math.abs(a.z - start.z) - (Math.abs(b.x - start.x) + Math.abs(b.z - start.z)) || a.z - b.z || a.x - b.x);
    const hit = ring.find(fits);
    if (hit) return hit;
  }
  return null;
}

// The princess walking her town (PLAN.md 4.2, M2 spec): rigid moves, sprint and hover, and collision with
// buildings, walls and props. She can never leave town: outside squares are solid.
import balance from "../data/balance.json";
import { occupied } from "./grid";
import { kindAt } from "./townMap";
import type { Town, World } from "./world";

export interface Princess {
  x: number;
  z: number;
  /** The way she last moved, length 1. */
  facing: { x: number; z: number };
  sprinting: boolean;
  /** Height above the ground: hover while sprinting. Render eases toward it. */
  height: number;
  /** Points to walk through (click or tap to walk), in order. Empty when she isn't following one. */
  route: { x: number; z: number }[];
}

/** A ground direction of length 0 or 1, already turned from screen to world by the UI. */
export interface WalkInput { x: number; z: number; sprint: boolean }

export function startPrincess(town: Town): Princess {
  const s = town.map.princessStart;
  return { x: s.x, z: s.z, facing: { x: 0, z: 1 }, sprinting: false, height: 0, route: [] };
}

interface Box { x0: number; z0: number; x1: number; z1: number }
const EPS = 1e-9;
const STATUE_HALF = 0.35;
const BOARD_HALF = { x: 0.45, z: 0.2 };
/** How close she has to get to a route point before taking the next one. */
const ARRIVE = 0.05;

/** Walls, the fields outside, and anything a building stands on. Roads, the plaza and gates are open. */
export function isSolidSquare(town: Town, world: World, x: number, z: number, taken?: Set<string>): boolean {
  const k = kindAt(town.map, world.wallStage, x, z);
  if (k === "wall" || k === "outside") return true;
  return (taken ?? occupied(town, world)).has(`${x},${z}`);
}

/** Solid boxes a circle at (x, z) with this radius could touch: nearby solid squares plus the props. */
function solidsNear(town: Town, world: World, x: number, z: number, radius: number, taken: Set<string>): Box[] {
  const out: Box[] = [];
  for (let sz = Math.floor(z - radius) - 1; sz <= Math.floor(z + radius) + 1; sz++) {
    for (let sx = Math.floor(x - radius) - 1; sx <= Math.floor(x + radius) + 1; sx++) {
      if (isSolidSquare(town, world, sx, sz, taken)) out.push({ x0: sx, z0: sz, x1: sx + 1, z1: sz + 1 });
    }
  }
  const { statue, questBoard } = town.map;
  out.push({ x0: statue.x - STATUE_HALF, z0: statue.z - STATUE_HALF, x1: statue.x + STATUE_HALF, z1: statue.z + STATUE_HALF });
  out.push({ x0: questBoard.x - BOARD_HALF.x, z0: questBoard.z - BOARD_HALF.z, x1: questBoard.x + BOARD_HALF.x, z1: questBoard.z + BOARD_HALF.z });
  return out;
}

const overlaps = (a0: number, a1: number, b0: number, b1: number): boolean => a0 < b1 - EPS && a1 > b0 + EPS;

/**
 * Moves a circle by `delta`, along x first and then z. On each axis it stops at the edge of anything solid,
 * so walking into a wall at an angle slides along it.
 */
export function moveCircle(town: Town, world: World, at: { x: number; z: number }, delta: { x: number; z: number },
  radius: number): { x: number; z: number } {
  const taken = occupied(town, world);
  let { x, z } = at;
  if (delta.x !== 0) {
    let nx = x + delta.x;
    for (const b of solidsNear(town, world, nx, z, radius, taken)) {
      if (!overlaps(nx - radius, nx + radius, b.x0, b.x1) || !overlaps(z - radius, z + radius, b.z0, b.z1)) continue;
      nx = delta.x > 0 ? Math.min(nx, b.x0 - radius) : Math.max(nx, b.x1 + radius);
    }
    // Never pushed backwards by something she was already touching.
    x = delta.x > 0 ? Math.max(x, nx) : Math.min(x, nx);
  }
  if (delta.z !== 0) {
    let nz = z + delta.z;
    for (const b of solidsNear(town, world, x, nz, radius, taken)) {
      if (!overlaps(x - radius, x + radius, b.x0, b.x1) || !overlaps(nz - radius, nz + radius, b.z0, b.z1)) continue;
      nz = delta.z > 0 ? Math.min(nz, b.z0 - radius) : Math.max(nz, b.z1 + radius);
    }
    z = delta.z > 0 ? Math.max(z, nz) : Math.min(z, nz);
  }
  return { x, z };
}

/** One tick: held input moves her at once (and drops any route); otherwise she follows her route, if any. */
export function stepPrincess(town: Town, world: World, dt: number): void {
  const p = world.princess;
  const input = world.walkInput;
  const w = balance.walk;
  const speed = input.sprint ? w.princessSprintSpeed : w.princessWalkSpeed;
  let dir: { x: number; z: number } | null = null;
  let distance = speed * dt;

  if (input.x !== 0 || input.z !== 0) {
    p.route = [];
    dir = { x: input.x, z: input.z };
  } else {
    while (p.route.length > 0 && Math.hypot(p.route[0]!.x - p.x, p.route[0]!.z - p.z) <= ARRIVE) p.route.shift();
    const next = p.route[0];
    if (next) {
      const d = Math.hypot(next.x - p.x, next.z - p.z);
      dir = { x: (next.x - p.x) / d, z: (next.z - p.z) / d };
      distance = Math.min(distance, d);
    }
  }

  if (!dir) {
    p.sprinting = false;
    p.height = 0;
    return;
  }
  const moved = moveCircle(town, world, p, { x: dir.x * distance, z: dir.z * distance }, w.princessRadius);
  p.x = moved.x;
  p.z = moved.z;
  p.facing = dir;
  p.sprinting = input.sprint;
  p.height = input.sprint ? w.hoverHeight : 0;
  if (p.route.length > 0 && Math.hypot(p.route[0]!.x - p.x, p.route[0]!.z - p.z) <= ARRIVE) p.route.shift();
}

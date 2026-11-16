// Click or tap to walk (PLAN.md 4.2): the princess's route over open ground, around buildings and walls.
// Separate from the road pathfinder: she can walk on grass, townsfolk can't.
import { occupied } from "./grid";
import { isSolidSquare } from "./princess";
import { inBoard, type Square } from "./townMap";
import type { Town, World } from "./world";

const SIDE: readonly [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG: readonly [number, number][] = [[1, 1], [-1, 1], [1, -1], [-1, -1]];

/** The free square closest to `target` (breadth first: east, west, south, north), or null if none on the board. */
export function nearestFreeSquare(town: Town, world: World, target: Square): Square | null {
  const taken = occupied(town, world);
  const free = (s: Square): boolean => inBoard(town.map, s.x, s.z) && !isSolidSquare(town, world, s.x, s.z, taken);
  const start = { x: Math.round(target.x), z: Math.round(target.z) };
  const seen = new Set([`${start.x},${start.z}`]);
  const queue: Square[] = [start];
  for (let head = 0; head < queue.length; head++) {
    const s = queue[head]!;
    if (free(s)) return s;
    for (const [dx, dz] of SIDE) {
      const n = { x: s.x + dx, z: s.z + dz };
      const k = `${n.x},${n.z}`;
      if (!seen.has(k) && inBoard(town.map, n.x, n.z)) { seen.add(k); queue.push(n); }
    }
  }
  return null;
}

/**
 * The shortest walk from `from` to `to` over free squares, side steps costing 1 and diagonal steps √2. A diagonal
 * step needs both squares beside it free, so it never squeezes between two corners. A solid target is swapped
 * for the nearest free square. Returns the squares after `from`, ending at the goal; [] when already there.
 */
export function findOpenRoute(town: Town, world: World, from: Square, to: Square): Square[] | null {
  const taken = occupied(town, world);
  const free = (x: number, z: number): boolean => inBoard(town.map, x, z) && !isSolidSquare(town, world, x, z, taken);
  const goal = free(to.x, to.z) ? to : nearestFreeSquare(town, world, to);
  if (!goal) return null;
  if (from.x === goal.x && from.z === goal.z) return [];

  const key = (x: number, z: number): number => z * town.map.width + x;
  const h = (x: number, z: number): number => {
    const dx = Math.abs(x - goal.x), dz = Math.abs(z - goal.z);
    return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
  };
  const cost = new Map<number, number>([[key(from.x, from.z), 0]]);
  const cameFrom = new Map<number, Square>();
  const done = new Set<number>();
  const open: { s: Square; f: number; order: number }[] = [{ s: from, f: h(from.x, from.z), order: 0 }];
  let order = 0;

  while (open.length > 0) {
    // Lowest f first; ties go to the earliest found, so routes are the same every time.
    let best = 0;
    for (let i = 1; i < open.length; i++) {
      const a = open[i]!, b = open[best]!;
      if (a.f < b.f - 1e-9 || (Math.abs(a.f - b.f) <= 1e-9 && a.order < b.order)) best = i;
    }
    const { s } = open.splice(best, 1)[0]!;
    const k = key(s.x, s.z);
    if (done.has(k)) continue;
    done.add(k);
    if (s.x === goal.x && s.z === goal.z) {
      const route: Square[] = [];
      for (let at: Square | undefined = s; at && !(at.x === from.x && at.z === from.z); at = cameFrom.get(key(at.x, at.z))) route.push(at);
      return route.reverse();
    }
    const here = cost.get(k)!;
    for (const [dx, dz] of [...SIDE, ...DIAG]) {
      const nx = s.x + dx, nz = s.z + dz;
      if (!free(nx, nz)) continue;
      const diagonal = dx !== 0 && dz !== 0;
      if (diagonal && (!free(s.x + dx, s.z) || !free(s.x, s.z + dz))) continue;
      const nk = key(nx, nz);
      const c = here + (diagonal ? Math.SQRT2 : 1);
      if (done.has(nk) || c >= (cost.get(nk) ?? Infinity) - 1e-9) continue;
      cost.set(nk, c);
      cameFrom.set(nk, s);
      open.push({ s: { x: nx, z: nz }, f: c + h(nx, nz), order: ++order });
    }
  }
  return null;
}

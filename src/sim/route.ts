// Routes for townsfolk over the road network (PLAN.md 3, M2). Roads are 2×2 road cells, so routes go
// from cell to cell; walkers then keep to the right-hand half of the road (laneWaypoints).
import { cellCenter, cellKey, cellOf, type Cell, type TownMap } from "./townMap";
import type { Town, World } from "./world";

/** Neighbour order: east, west, south, north. It decides ties, so the same request always gets the same route. */
const STEPS: readonly [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Keys of every cell people can walk: laid road cells, the plaza, the castle forecourt and the current gates. */
export function walkableCells(town: Town, world: World): Set<string> {
  const { map } = town;
  const out = new Set<string>();
  for (const r of world.roads) out.add(cellKey(cellOf(map, r.x, r.z)));
  for (const rect of [map.plaza, map.forecourt]) {
    for (let z = rect.z0; z <= rect.z1; z++) for (let x = rect.x0; x <= rect.x1; x++) out.add(cellKey(cellOf(map, x, z)));
  }
  for (const g of map.stages[world.wallStage]?.gates ?? []) for (const s of g.squares) out.add(cellKey(cellOf(map, s.x, s.z)));
  return out;
}

/**
 * The shortest route from one cell to another over `walkable`, including both ends. Every step costs the
 * same, so Dijkstra here is a breadth-first search. Null when either end isn't walkable or nothing joins them.
 */
export function findRoute(walkable: ReadonlySet<string>, from: Cell, to: Cell): Cell[] | null {
  if (!walkable.has(cellKey(from)) || !walkable.has(cellKey(to))) return null;
  const cameFrom = new Map<string, Cell | null>([[cellKey(from), null]]);
  const queue: Cell[] = [from];
  for (let head = 0; head < queue.length; head++) {
    const c = queue[head]!;
    if (c.cx === to.cx && c.cz === to.cz) {
      const route: Cell[] = [];
      for (let at: Cell | null = c; at; at = cameFrom.get(cellKey(at)) ?? null) route.push(at);
      return route.reverse();
    }
    for (const [dx, dz] of STEPS) {
      const n = { cx: c.cx + dx, cz: c.cz + dz };
      const k = cellKey(n);
      if (walkable.has(k) && !cameFrom.has(k)) {
        cameFrom.set(k, c);
        queue.push(n);
      }
    }
  }
  return null;
}

const rightOf = (d: { x: number; z: number }): { x: number; z: number } => ({ x: -d.z, z: d.x });

/**
 * One point per route cell, shifted `offset` toward the walker's right so people heading opposite ways pass
 * side by side. At a corner the point sits where the two shifted lanes meet.
 */
export function laneWaypoints(map: TownMap, route: Cell[], offset: number): { x: number; z: number }[] {
  const dir = (a: Cell, b: Cell) => ({ x: b.cx - a.cx, z: b.cz - a.cz });
  return route.map((c, i) => {
    const p = cellCenter(map, c);
    const into = i > 0 ? rightOf(dir(route[i - 1]!, c)) : null;
    const out = i < route.length - 1 ? rightOf(dir(c, route[i + 1]!)) : null;
    let sx = 0, sz = 0;
    if (into && out && (into.x !== out.x || into.z !== out.z)) {
      sx = into.x + out.x;
      sz = into.z + out.z;
    } else if (into ?? out) {
      sx = (into ?? out)!.x;
      sz = (into ?? out)!.z;
    }
    return { x: p.x + sx * offset + 0, z: p.z + sz * offset + 0 };
  });
}

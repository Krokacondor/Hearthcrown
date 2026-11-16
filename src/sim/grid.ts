// Placement rules for buildings and roads, and the no-stranding rule for removing roads (PLAN.md 3).
import { footprint } from "./buildings";
import { kindAt, squareKey, type Rot, type Square } from "./townMap";
import type { Town, World } from "./world";

export type Reason =
  | "outside" | "blocked" | "noRoad" | "notConnected" | "wrongSite"
  | "notRoad" | "permanent" | "cutsOff";
export type Check = { ok: true } | { ok: false; reason: Reason; message: string };

const OK: Check = { ok: true };
const no = (reason: Reason, message: string): Check => ({ ok: false, reason, message });
const OUTSIDE = (): Check => no("outside", "Outside the town walls");
const BLOCKED = (): Check => no("blocked", "Something is in the way");

const NEIGHBOURS: readonly [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Keys of squares covered by buildings. */
function occupied(town: Town, world: World): Set<string> {
  const out = new Set<string>();
  for (const b of world.buildings) {
    const def = town.defs.get(b.type);
    if (!def) continue;
    for (const c of footprint(def, b.x, b.z, b.rot).cells) out.add(squareKey(c));
  }
  return out;
}

/** The plaza and the current gates: always road, never removable. */
function permanentRoad(town: Town, world: World, x: number, z: number): boolean {
  const k = kindAt(town.map, world.wallStage, x, z);
  return k === "plaza" || k === "gate";
}

/** Every square people can walk on: laid roads, the plaza and the current gates. */
function networkSquares(town: Town, world: World, without?: Square): Set<string> {
  const out = new Set<string>();
  for (const r of world.roads) out.add(squareKey(r));
  const { plaza } = town.map;
  for (let z = plaza.z0; z <= plaza.z1; z++) for (let x = plaza.x0; x <= plaza.x1; x++) out.add(`${x},${z}`);
  for (const g of town.map.stages[world.wallStage]?.gates ?? []) out.add(squareKey(g));
  if (without) out.delete(squareKey(without));
  return out;
}

const touchesAny = (set: Set<string>, x: number, z: number): boolean =>
  NEIGHBOURS.some(([dx, dz]) => set.has(`${x + dx},${z + dz}`));

export function canPlaceBuilding(town: Town, world: World, type: string, x: number, z: number, rot: Rot): Check {
  const def = town.defs.get(type);
  if (!def) return no("blocked", `Unknown building: ${type}`);
  const { cells, doorFront } = footprint(def, x, z, rot);
  const kinds = cells.map((c) => kindAt(town.map, world.wallStage, c.x, c.z));
  if (kinds.some((k) => k === "outside" || k === "wall")) return OUTSIDE();
  if (def.site === "castleGrounds") {
    if (kinds.some((k) => k !== "castleGrounds")) return no("wrongSite", "The castle belongs on the castle grounds");
  } else if (kinds.some((k) => k !== "open")) {
    return BLOCKED();
  }
  const taken = occupied(town, world);
  const roads = new Set(world.roads.map(squareKey));
  if (cells.some((c) => taken.has(squareKey(c)) || roads.has(squareKey(c)))) return BLOCKED();
  const network = networkSquares(town, world);
  if (!doorFront.some((s) => network.has(squareKey(s)))) return no("noRoad", "Needs a road at the door");
  return OK;
}

export function canPlaceRoad(town: Town, world: World, x: number, z: number): Check {
  const kind = kindAt(town.map, world.wallStage, x, z);
  if (kind === "outside" || kind === "wall") return OUTSIDE();
  if (kind !== "open") return BLOCKED();
  const key = `${x},${z}`;
  if (occupied(town, world).has(key) || world.roads.some((r) => r.x === x && r.z === z)) return BLOCKED();
  if (!touchesAny(networkSquares(town, world), x, z)) return no("notConnected", "Roads must join a road");
  return OK;
}

/** Every network square (laid roads, the plaza, the gates) reachable side by side from the current gates. */
export function reachableFromGates(town: Town, world: World): Set<string> {
  return flood(networkSquares(town, world), town.map.stages[world.wallStage]?.gates ?? []);
}

export function canRemoveRoad(town: Town, world: World, x: number, z: number): Check {
  if (permanentRoad(town, world, x, z)) return no("permanent", "The plaza and gates stay");
  if (!world.roads.some((r) => r.x === x && r.z === z)) return no("notRoad", "There's no road here");

  const network = networkSquares(town, world, { x, z });
  const gates = town.map.stages[world.wallStage]?.gates ?? [];
  // Flood fill from the gates over what would be left.
  const reached = flood(network, gates);
  const stranded = [...world.buildings]
    .sort((a, b) => a.id - b.id)
    .filter((b) => {
      const def = town.defs.get(b.type);
      return def && !footprint(def, b.x, b.z, b.rot).doorFront.some((s) => reached.has(squareKey(s)));
    });
  if (stranded.length > 0) {
    const name = town.defs.get(stranded[0]!.type)?.name ?? stranded[0]!.type;
    const more = stranded.length > 1 ? ` and ${stranded.length - 1} more` : "";
    return no("cutsOff", `The ${name}${more} would be cut off`);
  }
  // Gates reach each other only through the town, so every gate must be in the same filled area.
  if (!gatesConnected(network, gates)) return no("cutsOff", "A town gate would be cut off");
  for (const k of network) if (!reached.has(k)) return no("cutsOff", "Part of the road would be cut off");
  return OK;
}

/** Every network square reachable side by side from the given start squares. */
function flood(network: Set<string>, starts: Square[]): Set<string> {
  const reached = new Set<string>();
  const queue: Square[] = [];
  for (const s of starts) {
    if (network.has(squareKey(s)) && !reached.has(squareKey(s))) {
      reached.add(squareKey(s));
      queue.push({ x: s.x, z: s.z });
    }
  }
  while (queue.length > 0) {
    const s = queue.pop()!;
    for (const [dx, dz] of NEIGHBOURS) {
      const k = `${s.x + dx},${s.z + dz}`;
      if (network.has(k) && !reached.has(k)) {
        reached.add(k);
        queue.push({ x: s.x + dx, z: s.z + dz });
      }
    }
  }
  return reached;
}

/** True when every gate can reach every other gate over the network. */
function gatesConnected(network: Set<string>, gates: Square[]): boolean {
  const first = gates[0];
  if (!first) return true;
  const seen = flood(network, [first]);
  return gates.every((g) => seen.has(squareKey(g)));
}

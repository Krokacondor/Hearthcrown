// The town map: board size, wall stages, plaza, castle grounds and starting roads (PLAN.md 3).

export interface Square { x: number; z: number }
/** Inclusive on all sides. */
export interface Rect { x0: number; z0: number; x1: number; z1: number }
export type Rot = 0 | 1 | 2 | 3;
export type SquareKind = "outside" | "wall" | "gate" | "plaza" | "castleGrounds" | "reserved" | "open";
export interface Gate extends Square { id: "west" | "south" | "east" }
/** `walls` is the ring itself; the town is strictly inside it. */
export interface WallStage { walls: Rect; gates: Gate[] }
export interface StartPlacement { type: string; x: number; z: number; rot: Rot }

export interface TownMap {
  width: number;
  depth: number;
  /** M1 ships stage 1 only; later chapters add bigger rings. */
  stages: WallStage[];
  plaza: Rect;
  castleGrounds: Rect;
  /** A world position (a cut-out prop), not a square. */
  statue: { x: number; z: number };
  /** A reserved square holding the quest board prop. */
  questBoard: Square;
  /** Starting cobbled roads, expanded from segments. */
  roads: Square[];
  /** Scenery outside the gates; not part of the road network. */
  dirtRoads: Square[];
  start: StartPlacement[];
}

export const squareKey = (s: Square): string => `${s.x},${s.z}`;

const fail = (msg: string): never => {
  throw new Error(`map.json: ${msg}`);
};

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function readInt(o: Record<string, unknown>, key: string, where: string): number {
  const v = o[key];
  return isInt(v) ? v : fail(`${where}.${key} must be a whole number`);
}

function readRect(v: unknown, where: string): Rect {
  if (!isObj(v)) return fail(`${where} is missing`);
  const r = { x0: readInt(v, "x0", where), z0: readInt(v, "z0", where), x1: readInt(v, "x1", where), z1: readInt(v, "z1", where) };
  if (r.x1 < r.x0 || r.z1 < r.z0) fail(`${where} has x1/z1 smaller than x0/z0`);
  return r;
}

function readSquare(v: unknown, where: string): Square {
  if (!isObj(v)) return fail(`${where} is missing`);
  return { x: readInt(v, "x", where), z: readInt(v, "z", where) };
}

function readSegments(v: unknown, where: string): Square[] {
  if (!Array.isArray(v)) return fail(`${where} must be a list of segments`);
  const out: Square[] = [];
  v.forEach((seg, i) => {
    const w = `${where}[${i}]`;
    if (!isObj(seg) || !Array.isArray(seg.from) || !Array.isArray(seg.to)) return fail(`${w} needs from and to`);
    const [fx, fz] = seg.from as unknown[], [tx, tz] = seg.to as unknown[];
    if (!isInt(fx) || !isInt(fz) || !isInt(tx) || !isInt(tz)) return fail(`${w} needs whole-number squares`);
    if (fx !== tx && fz !== tz) return fail(`${w} is not a straight line`);
    const n = Math.max(Math.abs(tx - fx), Math.abs(tz - fz));
    const sx = Math.sign(tx - fx), sz = Math.sign(tz - fz);
    for (let k = 0; k <= n; k++) out.push({ x: fx + sx * k, z: fz + sz * k });
  });
  return out;
}

const inRect = (r: Rect, x: number, z: number): boolean => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const onRing = (r: Rect, x: number, z: number): boolean =>
  inRect(r, x, z) && (x === r.x0 || x === r.x1 || z === r.z0 || z === r.z1);
/** Strictly inside the ring. */
const insideRing = (r: Rect, x: number, z: number): boolean => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;
const rectInside = (inner: Rect, ring: Rect): boolean =>
  insideRing(ring, inner.x0, inner.z0) && insideRing(ring, inner.x1, inner.z1);

/** Validates map.json. Throws `map.json: ...` naming the bad field. */
export function loadTownMap(json: unknown): TownMap {
  if (!isObj(json)) return fail("must be an object");
  const width = readInt(json, "width", "map"), depth = readInt(json, "depth", "map");
  if (width < 1 || depth < 1) fail("width and depth must be positive");
  const onBoard = (x: number, z: number): boolean => x >= 0 && z >= 0 && x < width && z < depth;

  if (!Array.isArray(json.stages) || json.stages.length === 0) return fail("stages must list at least one wall stage");
  const stages: WallStage[] = json.stages.map((st: unknown, i: number) => {
    const where = `stages[${i}]`;
    if (!isObj(st)) return fail(`${where} is missing`);
    const walls = readRect(st.walls, `${where}.walls`);
    if (!onBoard(walls.x0, walls.z0) || !onBoard(walls.x1, walls.z1)) fail(`${where}.walls runs off the board`);
    if (!Array.isArray(st.gates) || st.gates.length !== 3) fail(`${where}.gates must list west, south and east`);
    const gates = (st.gates as unknown[]).map((g, k) => {
      const sq = readSquare(g, `${where}.gates[${k}]`);
      const id = (g as Record<string, unknown>).id;
      if (id !== "west" && id !== "south" && id !== "east") fail(`${where}.gates[${k}].id must be west, south or east`);
      if (!onRing(walls, sq.x, sq.z)) fail(`${where}.gates[${k}] is not on the wall ring`);
      return { id: id as Gate["id"], ...sq };
    });
    if (new Set(gates.map((g) => g.id)).size !== 3) fail(`${where}.gates must have one each of west, south and east`);
    return { walls, gates };
  });
  const first = stages[0]!.walls;

  const plaza = readRect(json.plaza, "plaza");
  if (!rectInside(plaza, first)) fail("plaza must be inside the stage 1 walls, not touching them");
  const castleGrounds = readRect(json.castleGrounds, "castleGrounds");
  if (!rectInside(castleGrounds, first)) fail("castleGrounds must be inside the stage 1 walls");

  if (!isObj(json.statue) || typeof json.statue.x !== "number" || typeof json.statue.z !== "number") {
    return fail("statue needs x and z");
  }
  const statue = { x: json.statue.x, z: json.statue.z };
  const questBoard = readSquare(json.questBoard, "questBoard");
  if (!insideRing(first, questBoard.x, questBoard.z)) fail("questBoard must be inside the stage 1 walls");

  const roads = readSegments(json.roads, "roads");
  const dirtRoads = readSegments(json.dirtRoads, "dirtRoads");
  for (const r of [...roads, ...dirtRoads]) if (!onBoard(r.x, r.z)) fail(`road square ${squareKey(r)} is off the board`);
  for (const r of roads) if (!insideRing(first, r.x, r.z)) fail(`road square ${squareKey(r)} must be inside the walls`);

  if (!Array.isArray(json.start)) return fail("start must be a list");
  const start = json.start.map((p: unknown, i: number) => {
    const where = `start[${i}]`;
    if (!isObj(p) || typeof p.type !== "string") return fail(`${where}.type must be a string`);
    const rot = readInt(p, "rot", where);
    if (rot < 0 || rot > 3) fail(`${where}.rot must be 0 to 3`);
    return { type: p.type, x: readInt(p, "x", where), z: readInt(p, "z", where), rot: rot as Rot };
  });

  return { width, depth, stages, plaza, castleGrounds, statue, questBoard, roads, dirtRoads, start };
}

export function inBoard(map: TownMap, x: number, z: number): boolean {
  return Number.isInteger(x) && Number.isInteger(z) && x >= 0 && z >= 0 && x < map.width && z < map.depth;
}

/** What a square is for the given wall stage. Off the board counts as outside. */
export function kindAt(map: TownMap, stage: number, x: number, z: number): SquareKind {
  const st = map.stages[stage];
  if (!st || !inBoard(map, x, z)) return "outside";
  if (st.gates.some((g) => g.x === x && g.z === z)) return "gate";
  if (onRing(st.walls, x, z)) return "wall";
  if (!insideRing(st.walls, x, z)) return "outside";
  if (inRect(map.plaza, x, z)) return "plaza";
  if (inRect(map.castleGrounds, x, z)) return "castleGrounds";
  if (map.questBoard.x === x && map.questBoard.z === z) return "reserved";
  return "open";
}

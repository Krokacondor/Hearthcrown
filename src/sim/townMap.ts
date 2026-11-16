// The town map: board size, wall stages, plaza, castle grounds and starting roads (PLAN.md 3).

export interface Square { x: number; z: number }
/** Inclusive on all sides. */
export interface Rect { x0: number; z0: number; x1: number; z1: number }
export type Rot = 0 | 1 | 2 | 3;
export type SquareKind = "outside" | "wall" | "gate" | "plaza" | "forecourt" | "castleGrounds" | "open";
/** A 2×2 road cell on the road grid (M2). Cell (0, 0) starts at the inside corner of the stage 1 walls. */
export interface Cell { cx: number; cz: number }
/** A gate in the wall ring. `x, z` is its first square; it runs `width` squares along the wall (east on the
 * north and south walls, south on the west and east walls). */
export interface Gate extends Square {
  id: "west" | "south" | "east";
  width: number;
  /** Every square of the opening, expanded from x, z and width. */
  squares: Square[];
}
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
  /** Paving in front of the castle door. Counts as road and is never removed, like the plaza. */
  forecourt: Rect;
  /** A world position (a cut-out prop), not a square. */
  statue: { x: number; z: number };
  /** A world position on the forecourt (a standing prop), not a square. */
  questBoard: { x: number; z: number };
  /** Where the princess stands when a game starts (a world position). */
  princessStart: { x: number; z: number };
  /** Starting cobbled roads, expanded from segments. */
  roads: Square[];
  /** Scenery outside the gates; not part of the road network. */
  dirtRoads: Square[];
  start: StartPlacement[];
}

export const squareKey = (s: Square): string => `${s.x},${s.z}`;
export const cellKey = (c: Cell): string => `${c.cx},${c.cz}`;

/** The first square of road cell (0, 0): just inside the stage 1 walls' north-west corner. */
export function roadGridOrigin(map: TownMap): Square {
  const w = map.stages[0]!.walls;
  return { x: w.x0 + 1, z: w.z0 + 1 };
}

export function cellOf(map: TownMap, x: number, z: number): Cell {
  const o = roadGridOrigin(map);
  return { cx: Math.floor((x - o.x) / 2), cz: Math.floor((z - o.z) / 2) };
}

/** The 4 squares of a cell: (x,z), (x+1,z), (x,z+1), (x+1,z+1). */
export function cellSquares(map: TownMap, c: Cell): Square[] {
  const o = roadGridOrigin(map);
  const x = o.x + 2 * c.cx, z = o.z + 2 * c.cz;
  return [{ x, z }, { x: x + 1, z }, { x, z: z + 1 }, { x: x + 1, z: z + 1 }];
}

/** The middle of a cell, as a world position. */
export function cellCenter(map: TownMap, c: Cell): { x: number; z: number } {
  const o = roadGridOrigin(map);
  return { x: o.x + 2 * c.cx + 1, z: o.z + 2 * c.cz + 1 };
}

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

function readPoint(v: unknown, where: string): { x: number; z: number } {
  if (!isObj(v) || typeof v.x !== "number" || typeof v.z !== "number" || !Number.isFinite(v.x) || !Number.isFinite(v.z)) {
    return fail(`${where} needs x and z`);
  }
  return { x: v.x, z: v.z };
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
  // The road grid is anchored inside the stage 1 walls; every stage's gates line up with it.
  const stage0 = json.stages[0];
  const firstWalls = readRect(isObj(stage0) ? stage0.walls : undefined, "stages[0].walls");
  const ox = firstWalls.x0 + 1, oz = firstWalls.z0 + 1;
  const sameCell = (sq: Square[]): boolean =>
    new Set(sq.map((s) => `${Math.floor((s.x - ox) / 2)},${Math.floor((s.z - oz) / 2)}`)).size === 1;
  const onGrid = (r: Rect): boolean =>
    (r.x0 - ox) % 2 === 0 && (r.z0 - oz) % 2 === 0 && (r.x1 - r.x0 + 1) % 2 === 0 && (r.z1 - r.z0 + 1) % 2 === 0;
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
      const rawWidth = (g as Record<string, unknown>).width;
      const width = rawWidth === undefined ? 1 : rawWidth;
      if (typeof width !== "number" || !Number.isInteger(width) || width < 1) fail(`${where}.gates[${k}].width must be a whole number from 1`);
      const alongX = sq.z === walls.z0 || sq.z === walls.z1;
      const squares = Array.from({ length: width as number }, (_, i) => (alongX ? { x: sq.x + i, z: sq.z } : { x: sq.x, z: sq.z + i }));
      const corner = (s: Square): boolean => (s.x === walls.x0 || s.x === walls.x1) && (s.z === walls.z0 || s.z === walls.z1);
      if (squares.some((s) => !onRing(walls, s.x, s.z) || corner(s))) fail(`${where}.gates[${k}] is not on a straight stretch of the wall ring`);
      if (width !== 2 || !sameCell(squares)) fail(`${where}.gates[${k}] must be 2 wide and line up with the road grid`);
      return { id: id as Gate["id"], ...sq, width: width as number, squares };
    });
    if (new Set(gates.map((g) => g.id)).size !== 3) fail(`${where}.gates must have one each of west, south and east`);
    return { walls, gates };
  });
  const first = stages[0]!.walls;

  const plaza = readRect(json.plaza, "plaza");
  if (!rectInside(plaza, first)) fail("plaza must be inside the stage 1 walls, not touching them");
  const castleGrounds = readRect(json.castleGrounds, "castleGrounds");
  if (!rectInside(castleGrounds, first)) fail("castleGrounds must be inside the stage 1 walls");
  if (!onGrid(plaza)) fail("plaza must line up with the road grid");
  if (!onGrid(castleGrounds)) fail("castleGrounds must line up with the road grid");
  const forecourt = readRect(json.forecourt, "forecourt");
  if (!rectInside(forecourt, first)) fail("forecourt must be inside the stage 1 walls");
  if (!onGrid(forecourt)) fail("forecourt must line up with the road grid");

  const statue = readPoint(json.statue, "statue");
  const questBoard = readPoint(json.questBoard, "questBoard");
  if (questBoard.x < forecourt.x0 || questBoard.x > forecourt.x1 + 1 || questBoard.z < forecourt.z0 || questBoard.z > forecourt.z1 + 1) {
    fail("questBoard must stand on the forecourt");
  }
  const princessStart = readPoint(json.princessStart, "princessStart");

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

  return { width, depth, stages, plaza, castleGrounds, forecourt, statue, questBoard, princessStart, roads, dirtRoads, start };
}

export function inBoard(map: TownMap, x: number, z: number): boolean {
  return Number.isInteger(x) && Number.isInteger(z) && x >= 0 && z >= 0 && x < map.width && z < map.depth;
}

/** What a square is for the given wall stage. Off the board counts as outside. */
export function kindAt(map: TownMap, stage: number, x: number, z: number): SquareKind {
  const st = map.stages[stage];
  if (!st || !inBoard(map, x, z)) return "outside";
  if (st.gates.some((g) => g.squares.some((s) => s.x === x && s.z === z))) return "gate";
  if (onRing(st.walls, x, z)) return "wall";
  if (!insideRing(st.walls, x, z)) return "outside";
  if (inRect(map.plaza, x, z)) return "plaza";
  if (inRect(map.forecourt, x, z)) return "forecourt";
  if (inRect(map.castleGrounds, x, z)) return "castleGrounds";
  return "open";
}

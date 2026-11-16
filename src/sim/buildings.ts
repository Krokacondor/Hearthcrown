// Building definitions (data/buildings.json) and their turned footprints.
import type { Rot, Square } from "./townMap";

export interface BuildingDef {
  id: string;
  name: string;
  /** At rot 0: w along x, d along z, with the door on the south (front) edge. */
  size: [w: number, d: number];
  /** Front-edge indices (0..w-1, west to east at rot 0) that the door covers. */
  door: number[];
  /** Art ID prefix; panels are `<art>.front`, `.side`, `.back`, `.gable`, `.roof`. */
  art: string;
  /** Model size in squares (render only). */
  height: number;
  roofRise: number;
  site: "open" | "castleGrounds";
  inBuildMenu: boolean;
}

const fail = (msg: string): never => {
  throw new Error(`buildings.json: ${msg}`);
};
const isPosInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;
const isPosNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;

/** Validates buildings.json. Throws `buildings.json: ...` naming the bad entry. */
export function loadBuildingDefs(json: unknown): ReadonlyMap<string, BuildingDef> {
  const list = (json as { buildings?: unknown } | null)?.buildings;
  if (!Array.isArray(list)) return fail("must have a buildings list");
  const defs = new Map<string, BuildingDef>();
  list.forEach((raw: unknown, i: number) => {
    const b = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
    const where = typeof b.id === "string" ? b.id : `buildings[${i}]`;
    if (typeof b.id !== "string" || b.id === "") fail(`${where}.id must be a name`);
    if (defs.has(b.id as string)) fail(`${where} is listed twice`);
    if (typeof b.name !== "string" || b.name === "") fail(`${where}.name is missing`);
    const size = b.size;
    if (!Array.isArray(size) || size.length !== 2 || !isPosInt(size[0]) || !isPosInt(size[1])) {
      fail(`${where}.size must be two whole numbers above 0`);
    }
    const [w, d] = size as [number, number];
    const door = b.door;
    if (!Array.isArray(door) || door.length === 0) fail(`${where}.door must list at least one front square`);
    for (const k of door as unknown[]) {
      if (typeof k !== "number" || !Number.isInteger(k) || k < 0 || k >= w) fail(`${where}.door ${String(k)} is not a front square`);
    }
    if (typeof b.art !== "string" || b.art === "") fail(`${where}.art is missing`);
    if (!isPosNum(b.height) || !isPosNum(b.roofRise)) fail(`${where}.height and roofRise must be above 0`);
    if (b.site !== "open" && b.site !== "castleGrounds") fail(`${where}.site must be open or castleGrounds`);
    if (typeof b.inBuildMenu !== "boolean") fail(`${where}.inBuildMenu must be true or false`);
    defs.set(b.id as string, {
      id: b.id as string, name: b.name as string, size: [w, d], door: [...new Set(door as number[])],
      art: b.art as string, height: b.height as number, roofRise: b.roofRise as number,
      site: b.site as BuildingDef["site"], inBuildMenu: b.inBuildMenu as boolean,
    });
  });
  return defs;
}

/** Turns a local square of a w×d box by `rot` quarter turns clockwise (seen from above). */
function turnLocal(lx: number, lz: number, w: number, d: number, rot: Rot): [number, number] {
  switch (rot) {
    case 0: return [lx, lz];
    case 1: return [d - 1 - lz, lx];
    case 2: return [w - 1 - lx, d - 1 - lz];
    case 3: return [lz, w - 1 - lx];
  }
}

/** The squares a building covers and the squares in front of its door. `x, z` is the turned footprint's minimum corner. */
export function footprint(def: BuildingDef, x: number, z: number, rot: Rot): { cells: Square[]; doorFront: Square[] } {
  const [w, d] = def.size;
  const at = (lx: number, lz: number): Square => {
    const [tx, tz] = turnLocal(lx, lz, w, d, rot);
    return { x: x + tx, z: z + tz };
  };
  const cells: Square[] = [];
  for (let lz = 0; lz < d; lz++) for (let lx = 0; lx < w; lx++) cells.push(at(lx, lz));
  return { cells, doorFront: def.door.map((i) => at(i, d)) };
}

import buildingsJson from "../data/buildings.json";
import mapJson from "../data/map.json";
import { canPlaceBuilding, canPlaceRoad, canRemoveRoad, type Check } from "./grid";
import { createRng, type Rng } from "./rng";
import { loadTown } from "./town";
import { inBoard, type Rot } from "./townMap";
import { createWorld, type Town, type World } from "./world";

/** Loaded once; bad data fails here at startup with a message naming the file. */
const TOWN: Town = loadTown(mapJson, buildingsJson);

/** A plain copy of the headline state. Safe to read and mutate. */
export interface Snapshot {
  seed: number;
  day: number;
  time: number;
  gold: number;
  reputation: number;
  buildings: number;
  /** Laid road squares (the plaza and gates are not counted). */
  roads: number;
  citizens: number;
  adventurers: number;
}

export type CommandResult = { ok: true } | { ok: false; error: string };

export interface Game {
  readonly world: Readonly<World>;
  readonly rng: Rng;
  /** The map and building list this game is played on. */
  readonly town: Town;
  snapshot(): Snapshot;
  /** Runs a named command. Never throws; bad input returns ok:false and changes nothing. */
  command(name: string, args?: Record<string, unknown>): CommandResult;
}

export function createGame(seed: number): Game {
  let world = createWorld(seed, TOWN);
  let rng = createRng(seed);

  /** Reads { x, z } as whole squares on the board, or null. */
  const squareArg = (args: Record<string, unknown>): { x: number; z: number } | null => {
    const { x, z } = args;
    return typeof x === "number" && typeof z === "number" && inBoard(TOWN.map, x, z) ? { x, z } : null;
  };
  /** Reads a menu building placement, or an error message. */
  const buildingArg = (args: Record<string, unknown>): { type: string; x: number; z: number; rot: Rot } | string => {
    const sq = squareArg(args);
    const { type, rot } = args;
    if (typeof type !== "string" || !sq || typeof rot !== "number" || !Number.isInteger(rot) || rot < 0 || rot > 3) {
      return "placeBuilding needs { type, x, z, rot } with whole squares on the board and rot 0 to 3";
    }
    if (!TOWN.defs.get(type)?.inBuildMenu) return `Unknown building: ${type}`;
    return { type, ...sq, rot: rot as Rot };
  };
  const result = (c: Check): CommandResult => (c.ok ? { ok: true } : { ok: false, error: c.message });
  const SQUARE_ERROR = "needs { x, z } as whole squares on the board";

  const commands: Record<string, (args: Record<string, unknown>) => CommandResult> = {
    placeBuilding(args) {
      const b = buildingArg(args);
      if (typeof b === "string") return { ok: false, error: b };
      const check = canPlaceBuilding(TOWN, world, b.type, b.x, b.z, b.rot);
      if (check.ok) world.buildings.push({ id: world.nextBuildingId++, ...b });
      return result(check);
    },
    placeRoad(args) {
      const sq = squareArg(args);
      if (!sq) return { ok: false, error: `placeRoad ${SQUARE_ERROR}` };
      const check = canPlaceRoad(TOWN, world, sq.x, sq.z);
      if (check.ok) world.roads.push(sq);
      return result(check);
    },
    removeRoad(args) {
      const sq = squareArg(args);
      if (!sq) return { ok: false, error: `removeRoad ${SQUARE_ERROR}` };
      const check = canRemoveRoad(TOWN, world, sq.x, sq.z);
      if (check.ok) world.roads = world.roads.filter((r) => r.x !== sq.x || r.z !== sq.z);
      return result(check);
    },
    /** Asks whether a placement or removal would be allowed, without changing anything. */
    checkPlacement(args) {
      if (args.kind === "building") {
        const b = buildingArg(args);
        return typeof b === "string" ? { ok: false, error: b } : result(canPlaceBuilding(TOWN, world, b.type, b.x, b.z, b.rot));
      }
      const sq = squareArg(args);
      if (args.kind === "road" || args.kind === "removeRoad") {
        if (!sq) return { ok: false, error: `checkPlacement ${SQUARE_ERROR}` };
        return result(args.kind === "road" ? canPlaceRoad(TOWN, world, sq.x, sq.z) : canRemoveRoad(TOWN, world, sq.x, sq.z));
      }
      return { ok: false, error: "checkPlacement needs kind: building, road or removeRoad" };
    },
    setSeed(args) {
      const seed = args.seed;
      if (typeof seed !== "number" || !Number.isFinite(seed)) {
        return { ok: false, error: "setSeed needs { seed: <finite number> }" };
      }
      world = createWorld(seed, TOWN);
      rng = createRng(seed);
      return { ok: true };
    },
  };

  return {
    get world() {
      return world;
    },
    get rng() {
      return rng;
    },
    town: TOWN,
    snapshot() {
      return {
        seed: world.seed,
        day: world.day,
        time: world.time,
        gold: world.gold,
        reputation: world.reputation,
        buildings: world.buildings.length,
        roads: world.roads.length,
        citizens: world.citizens.length,
        adventurers: world.adventurers.length,
      };
    },
    // Never throws: the debug hook calls this from untyped console and test code.
    command(name, args) {
      try {
        const run = typeof name === "string" && Object.hasOwn(commands, name) ? commands[name] : undefined;
        if (!run) return { ok: false, error: `Unknown command: ${String(name)}` };
        const safeArgs = typeof args === "object" && args !== null ? args : {};
        return run(safeArgs);
      } catch (e) {
        return { ok: false, error: `Command failed: ${e instanceof Error ? e.message : "bad input"}` };
      }
    },
  };
}

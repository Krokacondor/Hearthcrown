import buildingsJson from "../data/buildings.json";
import mapJson from "../data/map.json";
import { loadBuildingDefs } from "./buildings";
import { createRng, type Rng } from "./rng";
import { loadTownMap } from "./townMap";
import { createWorld, type Town, type World } from "./world";

/** Loaded once; bad data fails here at startup with a message naming the file. */
const TOWN: Town = { map: loadTownMap(mapJson), defs: loadBuildingDefs(buildingsJson) };

/** A plain copy of the headline state. Safe to read and mutate. */
export interface Snapshot {
  seed: number;
  day: number;
  time: number;
  gold: number;
  reputation: number;
  buildings: number;
  citizens: number;
  adventurers: number;
}

export type CommandResult = { ok: true } | { ok: false; error: string };

export interface Game {
  readonly world: Readonly<World>;
  readonly rng: Rng;
  snapshot(): Snapshot;
  /** Runs a named command. Never throws; bad input returns ok:false and changes nothing. */
  command(name: string, args?: Record<string, unknown>): CommandResult;
}

export function createGame(seed: number): Game {
  let world = createWorld(seed, TOWN);
  let rng = createRng(seed);

  const commands: Record<string, (args: Record<string, unknown>) => CommandResult> = {
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
    snapshot() {
      return {
        seed: world.seed,
        day: world.day,
        time: world.time,
        gold: world.gold,
        reputation: world.reputation,
        buildings: world.buildings.length,
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

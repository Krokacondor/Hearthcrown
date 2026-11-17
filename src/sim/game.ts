import balance from "../data/balance.json";
import buildingsJson from "../data/buildings.json";
import dialogueJson from "../data/dialogue.json";
import mapJson from "../data/map.json";
import peopleJson from "../data/people.json";
import { footprint } from "./buildings";
import { canPlaceBuilding, canPlaceRoad, canRemoveRoad, networkSquares, type Check } from "./grid";
import { findOpenRoute } from "./openRoute";
import { assignHomes, createPeople, stepPeople } from "./people";
import { isSolidSquare, stepPrincess } from "./princess";
import { createRng, type Rng } from "./rng";
import { advanceDialogue, closeDialogue, endChat, startTalk, talkTarget } from "./talk";
import { loadTown } from "./town";
import { cellOf, cellSquares, inBoard, squareKey, type Rot } from "./townMap";
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
  /** Laid 2×2 road cells (the plaza, forecourt and gates are not counted). */
  roads: number;
  /** Townsfolk, the advisor included. */
  citizens: number;
  /** Citizens with a home. */
  housed: number;
  adventurers: number;
  princess: { x: number; z: number; sprinting: boolean };
  dialogueOpen: boolean;
  /** Who she would talk to right now, or null. */
  talkTarget: number | null;
}

export type CommandResult = { ok: true } | { ok: false; error: string };

export interface Game {
  readonly world: Readonly<World>;
  readonly rng: Rng;
  /** The map and building list this game is played on. */
  readonly town: Town;
  snapshot(): Snapshot;
  /** Moves time on: the princess and the townsfolk, in fixed steps (1 / walk.ticksPerSecond). */
  advance(seconds: number): void;
  /** Runs a named command. Never throws; bad input returns ok:false and changes nothing. */
  command(name: string, args?: Record<string, unknown>): CommandResult;
}

/** A new world with its people, who are rolled from the game's RNG. */
function newWorld(seed: number, rng: Rng): World {
  const world = createWorld(seed, TOWN);
  world.people = createPeople(TOWN, world, rng, peopleJson);
  assignHomes(TOWN, world);
  return world;
}

const WALK = balance.walk;
const TICK = 1 / WALK.ticksPerSecond;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function createGame(seed: number): Game {
  let rng = createRng(seed);
  let world = newWorld(seed, rng);
  /** Seconds not yet stepped, carried to the next advance. */
  let carry = 0;

  const advance = (seconds: number): void => {
    const total = carry + seconds;
    const steps = Math.floor(total / TICK + 1e-9);
    carry = Math.max(0, total - steps * TICK);
    for (let i = 0; i < steps; i++) tick();
  };
  const tick = (): void => {
    if (!world.dialogue) stepPrincess(TOWN, world, TICK);
    stepPeople(TOWN, world, rng, TICK, dialogueJson);
    const p = world.princess;
    if (p.talkTo === null || world.dialogue) return;
    const who = world.people.find((q) => q.id === p.talkTo);
    if (!who || who.state !== "waiting") { p.talkTo = null; return; }
    if (Math.hypot(who.x - p.x, who.z - p.z) <= WALK.talkRange) {
      p.route = [];
      p.talkTo = null;
      startTalk(world, rng, dialogueJson, who.id);
    }
  };
  /** If a new building covers the princess, step her out onto its door road. */
  const clearPrincess = (b: World["buildings"][number]): void => {
    const def = TOWN.defs.get(b.type);
    if (!def) return;
    const p = world.princess, r = WALK.princessRadius;
    const { cells, doorFront } = footprint(def, b.x, b.z, b.rot);
    const covered = cells.some((c) => p.x + r > c.x && p.x - r < c.x + 1 && p.z + r > c.z && p.z - r < c.z + 1);
    if (!covered) return;
    const network = networkSquares(TOWN, world);
    const spots = doorFront.filter((s) => network.has(`${s.x},${s.z}`))
      .sort((a, c) => Math.hypot(a.x + 0.5 - p.x, a.z + 0.5 - p.z) - Math.hypot(c.x + 0.5 - p.x, c.z + 0.5 - p.z));
    const to = spots[0];
    if (!to) return;
    p.x = to.x + 0.5;
    p.z = to.z + 0.5;
    p.route = [];
  };

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
      if (check.ok) {
        const placed = { id: world.nextBuildingId++, ...b };
        world.buildings.push(placed);
        assignHomes(TOWN, world);
        clearPrincess(placed);
      }
      return result(check);
    },
    placeRoad(args) {
      const sq = squareArg(args);
      if (!sq) return { ok: false, error: `placeRoad ${SQUARE_ERROR}` };
      const check = canPlaceRoad(TOWN, world, sq.x, sq.z);
      if (check.ok) world.roads.push(...cellSquares(TOWN.map, cellOf(TOWN.map, sq.x, sq.z)));
      return result(check);
    },
    removeRoad(args) {
      const sq = squareArg(args);
      if (!sq) return { ok: false, error: `removeRoad ${SQUARE_ERROR}` };
      const check = canRemoveRoad(TOWN, world, sq.x, sq.z);
      if (check.ok) {
        const gone = new Set(cellSquares(TOWN.map, cellOf(TOWN.map, sq.x, sq.z)).map(squareKey));
        world.roads = world.roads.filter((r) => !gone.has(squareKey(r)));
      }
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
      rng = createRng(seed);
      world = newWorld(seed, rng);
      carry = 0;
      return { ok: true };
    },
    /** What the player is holding: a ground direction (normalized here) and sprint. Ignored while talking. */
    setWalkInput(args) {
      const { x, z } = args;
      const sprint = args.sprint ?? false;
      if (!isNum(x) || !isNum(z) || typeof sprint !== "boolean") {
        return { ok: false, error: "setWalkInput needs { x, z } as finite numbers and an optional sprint: true/false" };
      }
      const len = Math.hypot(x, z);
      world.walkInput = world.dialogue || len === 0
        ? { x: 0, z: 0, sprint: world.dialogue ? false : sprint }
        : { x: x / len + 0, z: z / len + 0, sprint };
      return { ok: true };
    },
    advance(args) {
      const { seconds } = args;
      if (!isNum(seconds) || seconds < 0 || seconds > 10) return { ok: false, error: "advance needs { seconds } from 0 to 10" };
      advance(seconds);
      return { ok: true };
    },
    teleportPrincess(args) {
      const { x, z } = args;
      if (!isNum(x) || !isNum(z)) return { ok: false, error: "teleportPrincess needs { x, z } as finite numbers" };
      if (isSolidSquare(TOWN, world, Math.floor(x), Math.floor(z))) return { ok: false, error: "That spot is blocked" };
      Object.assign(world.princess, { x, z, route: [], talkTo: null });
      return { ok: true };
    },
    talk() {
      const id = talkTarget(world, WALK.talkRange);
      if (id === null) return { ok: false, error: "Nobody to talk to" };
      world.walkInput = { x: 0, z: 0, sprint: false };
      startTalk(world, rng, dialogueJson, id);
      return { ok: true };
    },
    advanceDialogue() {
      if (!world.dialogue) return { ok: false, error: "No one is talking" };
      advanceDialogue(world);
      return { ok: true };
    },
    /** Back while talking: the dialogue closes at once. */
    closeDialogue() {
      if (!world.dialogue) return { ok: false, error: "No one is talking" };
      closeDialogue(world);
      return { ok: true };
    },
    /** Click or tap a spot: she walks there around anything in the way. */
    walkTo(args) {
      const sq = squareArg(args);
      if (!sq) return { ok: false, error: `walkTo ${SQUARE_ERROR}` };
      const p = world.princess;
      const route = findOpenRoute(TOWN, world, { x: Math.floor(p.x), z: Math.floor(p.z) }, sq);
      if (!route) return { ok: false, error: "Can't get there" };
      p.route = route.map((s) => ({ x: s.x + 0.5, z: s.z + 0.5 }));
      p.talkTo = null;
      return { ok: true };
    },
    /** Tap a person: she walks over and talks to them; they wait for her a little while. */
    walkToPerson(args) {
      const who = world.people.find((q) => q.id === args.id);
      if (!who) return { ok: false, error: "No one by that name" };
      if (world.dialogue) return { ok: false, error: "Already talking" };
      const p = world.princess;
      if (Math.hypot(who.x - p.x, who.z - p.z) <= WALK.talkRange) {
        p.route = [];
        startTalk(world, rng, dialogueJson, who.id);
        return { ok: true };
      }
      const route = findOpenRoute(TOWN, world, { x: Math.floor(p.x), z: Math.floor(p.z) }, { x: Math.floor(who.x), z: Math.floor(who.z) });
      if (!route) return { ok: false, error: "Can't get there" };
      endChat(world, who);
      who.state = "waiting";
      who.route = [];
      who.routeCells = [];
      who.timer = WALK.waitForPrincessSeconds;
      p.route = route.map((s) => ({ x: s.x + 0.5, z: s.z + 0.5 }));
      p.talkTo = who.id;
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
    advance(seconds) {
      if (isNum(seconds) && seconds > 0) advance(Math.min(seconds, 10));
    },
    snapshot() {
      return {
        seed: world.seed,
        day: world.day,
        time: world.time,
        gold: world.gold,
        reputation: world.reputation,
        buildings: world.buildings.length,
        roads: world.roads.length / 4,
        citizens: world.people.length,
        housed: world.people.filter((p) => p.role === "citizen" && p.home !== null).length,
        adventurers: world.adventurers.length,
        princess: { x: world.princess.x, z: world.princess.z, sprinting: world.princess.sprinting },
        dialogueOpen: world.dialogue !== null,
        talkTarget: talkTarget(world, WALK.talkRange),
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

// The townsfolk (M2): six citizens and the advisor. They move into homes, wander the roads on the
// right-hand side, and stop to chat now and then (chats in talk.ts). All randomness is seeded.
import balance from "../data/balance.json";
import { findRoute, laneWaypoints, walkableCells } from "./route";
import type { Rng } from "./rng";
import { cellCenter, cellKey, cellOf, type Cell, type TownMap } from "./townMap";
import type { Town, World } from "./world";

export type PersonRole = "citizen" | "advisor";
export type PersonState = "walking" | "idle" | "chatting" | "talking" | "waiting";

export interface ChatState {
  partner: number;
  lines: string[];
  index: number;
  /** Says lines 0, 2, ...; the partner says 1, 3, ... */
  firstSpeaker: number;
  /** Seconds left on the current line. */
  timer: number;
}

export interface Person {
  id: number;
  name: string;
  role: PersonRole;
  /** Placeholder look index (0..looks-1); -1 for the advisor, who has his own. */
  look: number;
  /** The building they live in, or null while homeless. */
  home: number | null;
  x: number;
  z: number;
  facing: { x: number; z: number };
  state: PersonState;
  /** Lane points still to walk through. */
  route: { x: number; z: number }[];
  /** The road cells of the current route (to notice when a road under it is removed). */
  routeCells: string[];
  /** Seconds left idling, or waiting for the princess. */
  timer: number;
  chat: ChatState | null;
  /** Seconds before they may start another chat. */
  chatCooldown: number;
  /** Index of the last line they said to the princess (-1 for none), so it doesn't repeat back to back. */
  lastLine: number;
}

export interface PeopleData { advisorName: string; citizenNames: string[]; citizenCount: number; looks: number }
/** dialogue.json: one-liners for the princess, and chats between two people (lines alternate speakers). */
export interface DialogueData { citizen: string[]; advisor: string[]; chats: string[][] }
export type WalkBalance = typeof balance.walk;

function shuffled<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const idleTime = (rng: Rng, w: WalkBalance): number => w.idleSeconds[0]! + rng.next() * (w.idleSeconds[1]! - w.idleSeconds[0]!);

/** Six citizens (ids 1..6) and the advisor (id 7), spread over the plaza's road cells, never on the statue. */
export function createPeople(town: Town, world: World, rng: Rng, data: PeopleData): Person[] {
  const { map } = town;
  const statueCell = cellKey(cellOf(map, Math.floor(map.statue.x), Math.floor(map.statue.z)));
  const spots: Cell[] = [];
  for (let z = map.plaza.z0; z <= map.plaza.z1; z += 2) {
    for (let x = map.plaza.x0; x <= map.plaza.x1; x += 2) {
      const c = cellOf(map, x, z);
      if (cellKey(c) !== statueCell) spots.push(c);
    }
  }
  const places = shuffled(rng, spots);
  const names = shuffled(rng, data.citizenNames);
  // Looks are dealt like names, so no two citizens dress the same (while there are enough looks).
  const looks = shuffled(rng, Array.from({ length: data.looks }, (_, i) => i));
  const w = balance.walk;
  const make = (id: number, name: string, role: PersonRole, look: number): Person => {
    const at = cellCenter(map, places[(id - 1) % places.length]!);
    return {
      id, name, role, look, home: null, x: at.x, z: at.z, facing: { x: 0, z: 1 }, state: "idle",
      route: [], routeCells: [], timer: idleTime(rng, w), chat: null, chatCooldown: 0, lastLine: -1,
    };
  };
  const people: Person[] = [];
  for (let i = 0; i < data.citizenCount; i++) people.push(make(i + 1, names[i]!, "citizen", looks[i % looks.length]!));
  people.push(make(data.citizenCount + 1, data.advisorName, "advisor", -1));
  return people;
}

/** The advisor lives at the castle. Homeless citizens, in id order, fill homes in building order up to their size. */
export function assignHomes(town: Town, world: World): void {
  const castle = world.buildings.find((b) => b.type === "castle");
  for (const p of world.people) if (p.role === "advisor") p.home = castle?.id ?? null;
  const count = new Map<number, number>();
  for (const p of world.people) if (p.role === "citizen" && p.home !== null) count.set(p.home, (count.get(p.home) ?? 0) + 1);
  const homes = [...world.buildings].sort((a, b) => a.id - b.id).filter((b) => town.defs.get(b.type)?.residents);
  for (const p of world.people) {
    if (p.role !== "citizen" || p.home !== null) continue;
    const home = homes.find((b) => (count.get(b.id) ?? 0) < town.defs.get(b.type)!.residents!.max);
    if (!home) break;
    p.home = home.id;
    count.set(home.id, (count.get(home.id) ?? 0) + 1);
  }
}

/** The walkable cell nearest a point (ties to the first in key order), for someone who has wandered off the roads. */
function nearestWalkable(map: TownMap, walkable: ReadonlySet<string>, x: number, z: number): Cell | null {
  let best: Cell | null = null, bestD = Infinity;
  for (const k of [...walkable].sort()) {
    const [cx, cz] = k.split(",").map(Number) as [number, number];
    const c = cellCenter(map, { cx, cz });
    const d = Math.hypot(c.x - x, c.z - z);
    if (d < bestD - 1e-9) { best = { cx, cz }; bestD = d; }
  }
  return best;
}

/** Sets a route to `dest`, starting from the cell they're on (or the nearest walkable one). False if none. */
function routeTo(map: TownMap, walkable: ReadonlySet<string>, p: Person, dest: Cell, w: WalkBalance): boolean {
  const here = cellOf(map, Math.floor(p.x), Math.floor(p.z));
  const start = walkable.has(cellKey(here)) ? here : nearestWalkable(map, walkable, p.x, p.z);
  if (!start) return false;
  const cells = findRoute(walkable, start, dest);
  if (!cells || cells.length < 2) return false;
  p.routeCells = cells.map(cellKey);
  p.route = laneWaypoints(map, cells, w.laneOffset);
  p.state = "walking";
  return true;
}

function goIdle(p: Person, rng: Rng, w: WalkBalance): void {
  p.state = "idle";
  p.route = [];
  p.routeCells = [];
  p.timer = idleTime(rng, w);
}

/** One tick for everyone: idlers pick somewhere to go, walkers follow their lane, lost walkers re-route. */
export function stepPeople(town: Town, world: World, rng: Rng, dt: number, lines: DialogueData, w: WalkBalance = balance.walk): void {
  const { map } = town;
  const walkable = walkableCells(town, world);
  const destinations = [...walkable].sort();
  const cellHere = (p: Person): string => cellKey(cellOf(map, Math.floor(p.x), Math.floor(p.z)));

  for (const p of world.people) {
    p.chatCooldown = Math.max(0, p.chatCooldown - dt);
    // Standing on a road that was just removed (idle, chatting or waiting): end any chat and head back.
    if (p.state !== "walking" && p.state !== "talking" && !walkable.has(cellHere(p))) {
      if (p.chat) {
        const partner = world.people.find((q) => q.id === p.chat!.partner);
        if (partner?.chat) { partner.chat = null; partner.chatCooldown = w.chatCooldownSeconds; if (partner.state === "chatting") goIdle(partner, rng, w); }
        p.chat = null;
        p.chatCooldown = w.chatCooldownSeconds;
      }
      const back = nearestWalkable(map, walkable, p.x, p.z);
      if (back) {
        p.state = "walking";
        p.routeCells = [cellKey(back)];
        p.route = [cellCenter(map, back)];
      }
    }
    if (p.state === "idle") {
      p.timer -= dt;
      if (p.timer > 0) continue;
      // Somewhere nobody else is standing or heading, so people don't end up stacked on one spot.
      const taken = new Set(world.people.filter((q) => q !== p)
        .map((q) => (q.state === "walking" && q.routeCells.length > 0 ? q.routeCells.at(-1)! : cellHere(q))));
      const open = destinations.filter((k) => !taken.has(k));
      const [cx, cz] = rng.pick(open.length > 0 ? open : destinations).split(",").map(Number) as [number, number];
      if (!routeTo(map, walkable, p, { cx, cz }, w)) goIdle(p, rng, w);
      continue;
    }
    if (p.state === "waiting") {
      p.timer -= dt;
      if (p.timer <= 0) goIdle(p, rng, w);
      continue;
    }
    if (p.state !== "walking") continue;

    // A road on the route was removed: head for the same place another way, or stop and think again.
    if (p.routeCells.some((k) => !walkable.has(k))) {
      const [cx, cz] = p.routeCells.at(-1)!.split(",").map(Number) as [number, number];
      if (!walkable.has(`${cx},${cz}`) || !routeTo(map, walkable, p, { cx, cz }, w)) {
        const back = nearestWalkable(map, walkable, p.x, p.z);
        p.routeCells = back ? [cellKey(back)] : [];
        p.route = back ? [cellCenter(map, back)] : [];
        p.state = back ? "walking" : "idle";
        if (!back) continue;
      }
    }

    let budget = w.personSpeed * dt;
    while (budget > 0 && p.route.length > 0) {
      const next = p.route[0]!;
      const d = Math.hypot(next.x - p.x, next.z - p.z);
      if (d <= budget) {
        p.x = next.x;
        p.z = next.z;
        budget -= d;
        p.route.shift();
      } else {
        p.facing = { x: (next.x - p.x) / d, z: (next.z - p.z) / d };
        p.x += p.facing.x * budget;
        p.z += p.facing.z * budget;
        budget = 0;
      }
    }
    if (p.route.length === 0) goIdle(p, rng, w);
  }

  stepChats(world, rng, dt, lines, w);
}

/** Runs chats in progress, and lets two free people who meet roll once to start one. */
function stepChats(world: World, rng: Rng, dt: number, lines: DialogueData, w: WalkBalance): void {
  const byId = new Map(world.people.map((p) => [p.id, p]));
  for (const p of world.people) {
    const c = p.chat;
    // The first speaker keeps the shared clock for the pair.
    if (p.state !== "chatting" || !c || c.firstSpeaker !== p.id) continue;
    const partner = byId.get(c.partner);
    c.timer -= dt;
    if (c.timer > 0) continue;
    c.index++;
    c.timer = w.chatLineSeconds;
    if (partner?.chat) { partner.chat.index = c.index; partner.chat.timer = c.timer; }
    if (c.index < c.lines.length) continue;
    for (const q of [p, partner]) {
      if (!q) continue;
      q.chat = null;
      q.chatCooldown = w.chatCooldownSeconds;
      goIdle(q, rng, w);
    }
  }

  const free = (p: Person): boolean => (p.state === "idle" || p.state === "walking") && p.chatCooldown <= 0;
  for (let i = 0; i < world.people.length; i++) {
    const a = world.people[i]!;
    if (!free(a)) continue;
    for (let j = i + 1; j < world.people.length; j++) {
      const b = world.people[j]!;
      if (!free(b) || Math.hypot(a.x - b.x, a.z - b.z) > w.chatStartRange) continue;
      a.chatCooldown = b.chatCooldown = w.chatCooldownSeconds;
      if (!rng.chance(w.chatChance) || lines.chats.length === 0) break;
      const said = rng.pick(lines.chats);
      const first = Math.min(a.id, b.id);
      const d = Math.hypot(b.x - a.x, b.z - a.z);
      a.facing = d > 1e-6 ? { x: (b.x - a.x) / d, z: (b.z - a.z) / d } : { x: 1, z: 0 };
      b.facing = { x: -a.facing.x + 0, z: -a.facing.z + 0 };
      for (const [q, other] of [[a, b], [b, a]] as const) {
        q.state = "chatting";
        q.route = [];
        q.routeCells = [];
        q.chat = { partner: other.id, lines: [...said], index: 0, firstSpeaker: first, timer: w.chatLineSeconds };
      }
      break;
    }
  }
}

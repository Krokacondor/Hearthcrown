// Talking (M2): the princess talks to anyone in reach for a one-liner, and people chat with each other.
// The full talk system with choices comes in M14.
import balance from "../data/balance.json";
import type { DialogueData, Person } from "./people";
import type { Rng } from "./rng";
import type { World } from "./world";

export type { DialogueData } from "./people";

/** The open conversation with the princess, shown in the dialogue box. */
export interface Dialogue { personId: number; lines: string[]; index: number }

/** The nearest person within `range` of the princess (ties to the lower id); null while a dialogue is open. */
export function talkTarget(world: World, range: number): number | null {
  if (world.dialogue) return null;
  let best: Person | null = null, bestD = Infinity;
  for (const p of world.people) {
    const d = Math.hypot(p.x - world.princess.x, p.z - world.princess.z);
    if (d <= range && d < bestD - 1e-9) { best = p; bestD = d; }
  }
  return best?.id ?? null;
}

/** Stops someone's chat, if any, and sends their partner on their way. */
export function endChat(world: World, p: Person): void {
  if (!p.chat) return;
  const partner = world.people.find((q) => q.id === p.chat!.partner);
  if (partner) {
    partner.chat = null;
    partner.state = "idle";
    partner.timer = balance.walk.idleSeconds[0]!;
    partner.chatCooldown = balance.walk.chatCooldownSeconds;
  }
  p.chat = null;
  p.chatCooldown = balance.walk.chatCooldownSeconds;
}

/** Opens a dialogue with a person: they stop, face her and say a line (never the same one twice in a row). */
export function startTalk(world: World, rng: Rng, data: DialogueData, personId: number): boolean {
  const p = world.people.find((q) => q.id === personId);
  if (!p) return false;
  endChat(world, p);
  const pool = p.role === "advisor" ? data.advisor : data.citizen;
  let i = 0;
  if (pool.length > 1) {
    i = p.lastLine >= 0 && p.lastLine < pool.length ? rng.int(0, pool.length - 2) : rng.int(0, pool.length - 1);
    if (p.lastLine >= 0 && p.lastLine < pool.length && i >= p.lastLine) i++;
  }
  p.lastLine = i;
  p.state = "talking";
  p.route = [];
  p.routeCells = [];
  const dx = world.princess.x - p.x, dz = world.princess.z - p.z, d = Math.hypot(dx, dz);
  if (d > 0) p.facing = { x: dx / d, z: dz / d };
  world.dialogue = { personId, lines: [pool[i] ?? "..."], index: 0 };
  return true;
}

/** Shows the next line; after the last one the dialogue closes and the person goes back to wandering. */
export function advanceDialogue(world: World): void {
  const d = world.dialogue;
  if (!d) return;
  d.index++;
  if (d.index < d.lines.length) return;
  world.dialogue = null;
  const p = world.people.find((q) => q.id === d.personId);
  if (p) {
    p.state = "idle";
    p.timer = balance.walk.idleSeconds[0]!;
  }
}

/** What this person is saying in their chat right now, or null if it's the other one's turn (or no chat). */
export function currentChatLine(p: Person): string | null {
  const c = p.chat;
  if (!c || c.index >= c.lines.length) return null;
  const second = p.id === c.firstSpeaker ? c.partner : p.id;
  const speaker = c.index % 2 === 0 ? c.firstSpeaker : second;
  return speaker === p.id ? c.lines[c.index]! : null;
}

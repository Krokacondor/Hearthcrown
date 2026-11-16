import { describe, expect, it } from "vitest";
import balance from "../../src/data/balance.json";
import dialogue from "../../src/data/dialogue.json";
import { createGame } from "../../src/sim/game";
import { stepPeople, type DialogueData } from "../../src/sim/people";
import { advanceDialogue, currentChatLine, startTalk, talkTarget } from "../../src/sim/talk";
import type { World } from "../../src/sim/world";

const DT = 1 / 60;
const W = balance.walk;

function setup() {
  const game = createGame(1);
  const world = game.world as World;
  // Park everyone far apart and idle for a long time, so only what a test sets up happens.
  world.people.forEach((p, i) => { p.x = 15 + i * 5; p.z = 30; p.timer = 999; });
  world.princess.x = 20.5;
  world.princess.z = 10.5;
  return { game, world };
}

describe("talkTarget", () => {
  it("is null when nobody is in range", () => {
    const { world } = setup();
    expect(talkTarget(world, W.talkRange)).toBeNull();
  });
  it("is the nearer of two people in range", () => {
    const { world } = setup();
    Object.assign(world.people[2]!, { x: 20.5, z: 11.5 });
    Object.assign(world.people[1]!, { x: 21.5, z: 11.2 });
    expect(talkTarget(world, W.talkRange)).toBe(3);
  });
  it("is null while a dialogue is open", () => {
    const { game, world } = setup();
    Object.assign(world.people[0]!, { x: 20.5, z: 11.5 });
    expect(startTalk(world, game.rng, dialogue, 1)).toBe(true);
    expect(talkTarget(world, W.talkRange)).toBeNull();
  });
});

describe("talking to someone", () => {
  it("opens a dialogue, stops them and turns them to her", () => {
    const { game, world } = setup();
    const p = world.people[0]!;
    Object.assign(p, { x: 20.5, z: 11.5, state: "walking", route: [{ x: 30, z: 30 }] });
    expect(startTalk(world, game.rng, dialogue, 1)).toBe(true);
    expect(world.dialogue?.personId).toBe(1);
    expect(dialogue.citizen).toContain(world.dialogue?.lines[0]);
    expect(p.state).toBe("talking");
    expect(p.route).toEqual([]);
    expect(p.facing.z).toBeLessThan(0);
  });
  it("uses the advisor's own lines", () => {
    const { game, world } = setup();
    startTalk(world, game.rng, dialogue, 7);
    expect(dialogue.advisor).toContain(world.dialogue?.lines[0]);
  });
  it("never says the same line twice in a row", () => {
    const { game, world } = setup();
    const two: DialogueData = { citizen: ["One.", "Two."], advisor: ["A."], chats: [["Hi.", "Hi."]] };
    const said: string[] = [];
    for (let i = 0; i < 10; i++) {
      startTalk(world, game.rng, two, 1);
      said.push(world.dialogue!.lines[0]!);
      advanceDialogue(world);
    }
    for (let i = 1; i < said.length; i++) expect(said[i]).not.toBe(said[i - 1]);
  });
  it("closes after the last line and frees the person", () => {
    const { game, world } = setup();
    startTalk(world, game.rng, dialogue, 1);
    advanceDialogue(world);
    expect(world.dialogue).toBeNull();
    expect(world.people[0]!.state).toBe("idle");
  });
  it("ends a chat for both people", () => {
    const { game, world } = setup();
    const [a, b] = world.people as [World["people"][0], World["people"][0]];
    const lines = ["Hi.", "Hello.", "Bye."];
    a.state = "chatting"; a.chat = { partner: 2, lines, index: 0, firstSpeaker: 1, timer: 3 };
    b.state = "chatting"; b.chat = { partner: 1, lines, index: 0, firstSpeaker: 1, timer: 3 };
    startTalk(world, game.rng, dialogue, 1);
    expect(a.chat).toBeNull();
    expect(b.chat).toBeNull();
    expect(b.state).toBe("idle");
  });
  it("refuses someone who doesn't exist", () => {
    const { game, world } = setup();
    expect(startTalk(world, game.rng, dialogue, 42)).toBe(false);
    expect(world.dialogue).toBeNull();
  });
});

describe("chats between people", () => {
  const always = { ...W, chatChance: 1 };
  const never = { ...W, chatChance: 0 };

  it("starts when two people meet, and runs line by line", () => {
    const { game, world } = setup();
    const [a, b] = world.people as [World["people"][0], World["people"][0]];
    Object.assign(a, { x: 20, z: 20 });
    Object.assign(b, { x: 21, z: 20 });
    stepPeople(game.town, world, game.rng, DT, dialogue, always);
    expect(a.state).toBe("chatting");
    expect(b.state).toBe("chatting");
    expect(a.chat?.firstSpeaker).toBe(1);
    expect(a.facing).toEqual({ x: 1, z: 0 });
    expect(b.facing).toEqual({ x: -1, z: 0 });
    const lines = a.chat!.lines;
    expect(dialogue.chats).toContainEqual(lines);
    expect(currentChatLine(a)).toBe(lines[0]);
    expect(currentChatLine(b)).toBeNull();
    for (let i = 0; i < W.chatLineSeconds * 60 + 1; i++) stepPeople(game.town, world, game.rng, DT, dialogue, always);
    expect(currentChatLine(a)).toBeNull();
    expect(currentChatLine(b)).toBe(lines[1]);
    for (let i = 0; i < W.chatLineSeconds * 60 * lines.length; i++) stepPeople(game.town, world, game.rng, DT, dialogue, never);
    expect(a.chat).toBeNull();
    expect(a.state === "idle" || a.state === "walking").toBe(true);
    expect(a.chatCooldown).toBeGreaterThan(0);
  });

  it("rolls only once per meeting, then waits out the cooldown", () => {
    const { game, world } = setup();
    const [a, b] = world.people as [World["people"][0], World["people"][0]];
    Object.assign(a, { x: 20, z: 20 });
    Object.assign(b, { x: 21, z: 20 });
    stepPeople(game.town, world, game.rng, DT, dialogue, never);
    expect(a.state).toBe("idle");
    expect(a.chatCooldown).toBeCloseTo(W.chatCooldownSeconds, 5);
    stepPeople(game.town, world, game.rng, DT, dialogue, always);
    expect(a.state).toBe("idle");
  });
});

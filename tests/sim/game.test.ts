import { describe, expect, it } from "vitest";
import { createGame } from "../../src/sim/game";
import { createRng } from "../../src/sim/rng";

describe("game", () => {
  it("a new game starts on day 1 at 06:00 with starting gold, reputation 0, the castle standing, seven townsfolk and no adventurers", () => {
    expect(createGame(7).snapshot()).toEqual({
      seed: 7,
      day: 1,
      time: 360,
      gold: 100,
      reputation: 0,
      buildings: 1,
      roads: 27,
      citizens: 7,
      housed: 0,
      adventurers: 0,
      princess: { x: 34, z: 8, sprinting: false },
      dialogueOpen: false,
      talkTarget: null,
    });
  });

  it("mutating a snapshot does not change the game", () => {
    const game = createGame(7);
    const snap = game.snapshot();
    snap.gold = 0;
    snap.day = 99;
    expect(game.snapshot().gold).toBe(100);
    expect(game.snapshot().day).toBe(1);
  });

  it("setSeed replaces the seed and restarts the RNG sequence", () => {
    const game = createGame(1);
    game.rng.next();
    expect(game.command("setSeed", { seed: 7 })).toEqual({ ok: true });
    expect(game.snapshot().seed).toBe(7);
    // Same as a brand-new game with that seed: same people, same next roll.
    const fresh = createGame(7);
    expect(JSON.stringify(game.world.people)).toBe(JSON.stringify(fresh.world.people));
    expect(game.rng.next()).toBe(fresh.rng.next());
  });

  it("setSeed with a missing, non-number or NaN seed returns ok:false and changes nothing", () => {
    const game = createGame(3);
    const before = game.snapshot();
    const rngState = game.rng.state;
    for (const args of [undefined, {}, { seed: "7" }, { seed: NaN }, { seed: Infinity }]) {
      const result = game.command("setSeed", args);
      expect(result.ok).toBe(false);
    }
    expect(game.snapshot()).toEqual(before);
    expect(game.rng.state).toBe(rngState);
  });

  it("an unknown command returns ok:false with an error naming it and changes nothing", () => {
    const game = createGame(3);
    const before = game.snapshot();
    const result = game.command("summonDragon", { size: "large" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("summonDragon");
    expect(game.snapshot()).toEqual(before);
  });

  it("command never throws on malformed args or names, and changes nothing", () => {
    const game = createGame(7);
    const before = game.snapshot();
    const cmd = game.command as (name: unknown, args?: unknown) => { ok: boolean };
    const throwingArgs = { get seed(): number { throw new Error("boom"); } };
    const cases: [unknown, unknown][] = [
      ["setSeed", null], ["setSeed", 5], ["setSeed", "seed"], ["setSeed", throwingArgs],
      [Symbol("x"), undefined], [{ toString: null }, undefined], [null, undefined], [42, {}],
    ];
    for (const [name, args] of cases) {
      let result: { ok: boolean } | undefined;
      expect(() => { result = cmd(name, args); }).not.toThrow();
      expect(result?.ok).toBe(false);
    }
    expect(game.snapshot()).toEqual(before);
  });

  it("starts with the castle on its grounds and wall stage 0", () => {
    const game = createGame(7);
    expect(game.world.buildings).toEqual([{ id: 1, type: "castle", x: 31, z: 3, rot: 0 }]);
    expect(game.world.wallStage).toBe(0);
    expect(game.town.map.width).toBe(66);
  });

  it("placeBuilding puts a building down and gives it a new id", () => {
    const game = createGame(7);
    expect(game.command("placeBuilding", { type: "cottage", x: 20, z: 18, rot: 0 })).toEqual({ ok: true });
    expect(game.snapshot().buildings).toBe(2);
    expect(game.command("placeBuilding", { type: "cottage", x: 21, z: 18, rot: 0 })).toEqual({ ok: true });
    expect(game.world.buildings.map((b) => b.id)).toEqual([1, 2, 3]);
  });

  it("a refused placement says why and changes nothing", () => {
    const game = createGame(7);
    const before = game.snapshot();
    expect(game.command("placeBuilding", { type: "cottage", x: 20, z: 10, rot: 0 }))
      .toEqual({ ok: false, error: "Needs a road at the door" });
    expect(game.command("placeBuilding", { type: "castle", x: 30, z: 3, rot: 0 }))
      .toEqual({ ok: false, error: "Unknown building: castle" });
    expect(game.snapshot()).toEqual(before);
  });

  it("placeRoad and removeRoad change the road count", () => {
    const game = createGame(7);
    expect(game.command("placeRoad", { x: 20, z: 18 })).toEqual({ ok: true });
    expect(game.snapshot().roads).toBe(28);
    for (const s of [[19, 17], [20, 17], [19, 18], [20, 18]]) expect(game.world.roads).toContainEqual({ x: s[0], z: s[1] });
    expect(game.command("removeRoad", { x: 19, z: 17 })).toEqual({ ok: true });
    expect(game.snapshot().roads).toBe(27);
    expect(game.world.roads.some((r) => r.x === 20 && r.z === 18)).toBe(false);
    expect(game.command("removeRoad", { x: 20, z: 19 }).ok).toBe(false);
    expect(game.snapshot().roads).toBe(27);
  });

  it("a painted stroke skips a blocked square and never leaves a floating piece", () => {
    const game = createGame(7);
    expect(game.command("placeRoad", { x: 35, z: 9 })).toEqual({ ok: true });
    expect(game.command("placeRoad", { x: 35, z: 8 })).toEqual({ ok: false, error: "Something is in the way" });
    expect(game.command("placeRoad", { x: 39, z: 13 })).toEqual({ ok: false, error: "Roads must join a road" });
    expect(game.snapshot().roads).toBe(28);
  });

  it("checkPlacement gives the same verdicts without changing anything", () => {
    const game = createGame(7);
    const before = game.snapshot();
    expect(game.command("checkPlacement", { kind: "building", type: "cottage", x: 20, z: 18, rot: 0 })).toEqual({ ok: true });
    expect(game.command("checkPlacement", { kind: "building", type: "cottage", x: 20, z: 10, rot: 0 }))
      .toEqual({ ok: false, error: "Needs a road at the door" });
    expect(game.command("checkPlacement", { kind: "road", x: 20, z: 18 })).toEqual({ ok: true });
    expect(game.command("checkPlacement", { kind: "removeRoad", x: 20, z: 19 }))
      .toEqual({ ok: false, error: "A town gate would be cut off" });
    expect(game.command("checkPlacement", { kind: "teleport", x: 1, z: 1 }).ok).toBe(false);
    expect(game.snapshot()).toEqual(before);
  });

  it("odd coordinates, turns and types are refused without throwing", () => {
    const game = createGame(7);
    const before = game.snapshot();
    const cmd = game.command as (name: string, args?: unknown) => { ok: boolean };
    const good = { type: "cottage", x: 20, z: 18, rot: 0 };
    const cases: unknown[] = [
      ...[10.5, -1, 66, NaN, "20"].map((x) => ({ ...good, x })),
      ...[4, -1, 1.5, "1"].map((rot) => ({ ...good, rot })),
      ...[42, "dragon", undefined].map((type) => ({ ...good, type })),
      undefined, {},
    ];
    for (const args of cases) {
      let r: { ok: boolean } | undefined;
      expect(() => { r = cmd("placeBuilding", args); }).not.toThrow();
      expect(r?.ok, JSON.stringify(args)).toBe(false);
    }
    for (const name of ["placeRoad", "removeRoad"]) {
      for (const args of [{ x: 20.5, z: 18 }, { x: -1, z: 18 }, { x: 66, z: 0 }, { x: NaN, z: 1 }, {}, undefined]) {
        expect(cmd(name, args).ok).toBe(false);
      }
    }
    expect(game.snapshot()).toEqual(before);
  });
});


describe("walking and talking commands", () => {
  const state = (g: ReturnType<typeof createGame>) => JSON.stringify(g.world);

  it("refuses bad input with a reason and changes nothing", () => {
    const g = createGame(4);
    const before = state(g);
    const bad: [string, Record<string, unknown> | undefined, RegExp][] = [
      ["setWalkInput", { x: "a", z: 0 }, /setWalkInput/],
      ["setWalkInput", { x: NaN, z: 0 }, /setWalkInput/],
      ["advance", { seconds: -1 }, /advance/],
      ["advance", { seconds: 11 }, /advance/],
      ["advance", {}, /advance/],
      ["teleportPrincess", { x: 12.5, z: 10.5 }, /That spot is blocked/],
      ["teleportPrincess", { x: "1", z: 2 }, /teleportPrincess/],
      ["advanceDialogue", undefined, /No one is talking/],
      ["walkTo", { x: -5, z: 1 }, /walkTo/],
      ["walkToPerson", { id: 99 }, /No one by that name/],
      ["talk", undefined, /Nobody to talk to/],
    ];
    for (const [name, args, msg] of bad) {
      const r = g.command(name, args);
      expect(r.ok, name).toBe(false);
      if (!r.ok) expect(r.error, name).toMatch(msg);
    }
    expect(state(g)).toBe(before);
  });

  it("keeps her inside the town through one huge advance", () => {
    const g = createGame(4);
    expect(g.command("teleportPrincess", { x: 12.5, z: 20 }).ok).toBe(true);
    g.command("setWalkInput", { x: -1, z: 0, sprint: true });
    g.command("advance", { seconds: 10 });
    expect(g.snapshot().princess.x).toBeGreaterThanOrEqual(12.25 - 1e-9);
  });

  it("moves her out of the way when a building is placed on her", () => {
    const g = createGame(4);
    g.command("teleportPrincess", { x: 25.5, z: 18.5 });
    expect(g.command("placeBuilding", { type: "cottage", x: 25, z: 18, rot: 0 })).toEqual({ ok: true });
    const { x, z } = g.snapshot().princess;
    expect(Math.floor(x) === 25 && Math.floor(z) === 18).toBe(false);
    expect(Math.hypot(x - 25.5, z - 19.5)).toBeLessThanOrEqual(1);
  });

  it("gives the same game for the same seed and the same commands", () => {
    const play = () => {
      const g = createGame(9);
      for (const x of [16, 18, 20]) g.command("placeBuilding", { type: "cottage", x, z: 18, rot: 0 });
      g.command("placeRoad", { x: 22, z: 17 });
      g.command("setWalkInput", { x: 0, z: 1, sprint: false });
      g.command("advance", { seconds: 5 });
      g.command("setWalkInput", { x: 0, z: 0 });
      g.command("walkTo", { x: 25, z: 25 });
      for (let i = 0; i < 55; i++) g.command("advance", { seconds: 1 });
      return JSON.stringify({ people: g.world.people, princess: g.world.princess });
    };
    expect(play()).toBe(play());
  });

  it("houses citizens as homes are placed", () => {
    const g = createGame(4);
    for (const x of [16, 18, 20]) g.command("placeBuilding", { type: "cottage", x, z: 18, rot: 0 });
    expect(g.snapshot().housed).toBe(6);
  });

  it("talks to the nearest person and closes the dialogue", () => {
    const g = createGame(4);
    const p = g.world.people[0]!;
    g.command("teleportPrincess", { x: p.x, z: p.z - 1 });
    expect(g.snapshot().talkTarget).toBe(p.id);
    expect(g.command("talk")).toEqual({ ok: true });
    expect(g.snapshot().dialogueOpen).toBe(true);
    g.command("setWalkInput", { x: 1, z: 0 });
    g.command("advance", { seconds: 1 });
    expect(g.snapshot().princess.x).toBeCloseTo(p.x, 5);
    expect(g.command("advanceDialogue")).toEqual({ ok: true });
    expect(g.snapshot().dialogueOpen).toBe(false);
  });

  it("walks to a person and talks when she gets there", () => {
    const g = createGame(4);
    expect(g.command("walkToPerson", { id: 3 })).toEqual({ ok: true });
    for (let i = 0; i < 20 && !g.snapshot().dialogueOpen; i++) g.command("advance", { seconds: 1 });
    expect(g.snapshot().dialogueOpen).toBe(true);
    expect(g.world.dialogue?.personId).toBe(3);
  });

  it("drops a click-to-walk route when a key is pressed", () => {
    const g = createGame(4);
    expect(g.command("walkTo", { x: 20, z: 12 })).toEqual({ ok: true });
    expect(g.world.princess.route.length).toBeGreaterThan(0);
    g.command("setWalkInput", { x: 0, z: 1 });
    g.command("advance", { seconds: 0.1 });
    expect(g.world.princess.route).toEqual([]);
  });

  it("reports the princess and the townsfolk in the snapshot", () => {
    const s = createGame(4).snapshot();
    expect(s.princess).toEqual({ x: 34, z: 8, sprinting: false });
    expect(s.housed).toBe(0);
    expect(s.dialogueOpen).toBe(false);
    expect(s.talkTarget).toBeNull();
  });
});

describe("closing a dialogue with Back", () => {
  it("ends it at once and frees the person", () => {
    const g = createGame(4);
    const p = g.world.people[0]!;
    g.command("teleportPrincess", { x: p.x, z: p.z - 1 });
    g.command("talk");
    expect(g.command("closeDialogue")).toEqual({ ok: true });
    expect(g.snapshot().dialogueOpen).toBe(false);
    expect(p.state).toBe("idle");
    expect(g.command("closeDialogue")).toEqual({ ok: false, error: "No one is talking" });
  });
});

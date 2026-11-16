import { describe, expect, it } from "vitest";
import { createGame } from "../../src/sim/game";
import { createRng } from "../../src/sim/rng";

describe("game", () => {
  it("a new game starts on day 1 at 06:00 with starting gold, reputation 0, the castle standing and no citizens or adventurers", () => {
    expect(createGame(7).snapshot()).toEqual({
      seed: 7,
      day: 1,
      time: 360,
      gold: 100,
      reputation: 0,
      buildings: 1,
      roads: 78,
      citizens: 0,
      adventurers: 0,
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
    expect(game.rng.next()).toBe(createRng(7).next());
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
    expect(game.world.buildings).toEqual([{ id: 1, type: "castle", x: 30, z: 3, rot: 0 }]);
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
    expect(game.snapshot().roads).toBe(79);
    expect(game.command("removeRoad", { x: 20, z: 18 })).toEqual({ ok: true });
    expect(game.snapshot().roads).toBe(78);
    expect(game.command("removeRoad", { x: 20, z: 19 }).ok).toBe(false);
    expect(game.snapshot().roads).toBe(78);
  });

  it("a painted stroke skips a blocked square and never leaves a floating piece", () => {
    const game = createGame(7);
    expect(game.command("placeRoad", { x: 34, z: 8 })).toEqual({ ok: true });
    expect(game.command("placeRoad", { x: 34, z: 7 })).toEqual({ ok: false, error: "Something is in the way" });
    expect(game.command("placeRoad", { x: 35, z: 7 })).toEqual({ ok: false, error: "Roads must join a road" });
    expect(game.snapshot().roads).toBe(79);
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


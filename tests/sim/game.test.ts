import { describe, expect, it } from "vitest";
import { createGame } from "../../src/sim/game";
import { createRng } from "../../src/sim/rng";

describe("game", () => {
  it("a new game starts on day 1 at 06:00 with starting gold, reputation 0 and no buildings, citizens or adventurers", () => {
    expect(createGame(7).snapshot()).toEqual({
      seed: 7,
      day: 1,
      time: 360,
      gold: 100,
      reputation: 0,
      buildings: 0,
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
});

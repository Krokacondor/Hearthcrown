import { describe, expect, it } from "vitest";
import { createDebugHook, installDebugHook, type DebugHook } from "../src/debug";
import { createGame } from "../src/sim/game";

describe("debug hook", () => {
  it("getState returns the game's snapshot", () => {
    const game = createGame(7);
    expect(createDebugHook(game).getState()).toEqual(game.snapshot());
  });

  it("cmd forwards to game.command and returns its result", () => {
    const game = createGame(7);
    const hook = createDebugHook(game);
    expect(hook.cmd("setSeed", { seed: 42 })).toEqual({ ok: true });
    expect(hook.getState().seed).toBe(42);
    expect(hook.cmd("nope").ok).toBe(false);
  });

  it("installDebugHook sets __hearthcrown on the target", () => {
    const target: { __hearthcrown?: DebugHook } = {};
    installDebugHook(target, createGame(7));
    expect(target.__hearthcrown?.getState().seed).toBe(7);
  });

  it("cmd can lay a road that getState then counts", () => {
    const hook = createDebugHook(createGame(7));
    expect(hook.cmd("placeRoad", { x: 20, z: 18 })).toEqual({ ok: true });
    expect(hook.getState().roads).toBe(28);
  });
});

describe("debug hook change callback", () => {
  it("calls onChange after a command that worked, and not after one that failed", () => {
    let changes = 0;
    const hook = createDebugHook(createGame(7), () => changes++);
    hook.cmd("placeRoad", { x: 20, z: 18 });
    expect(changes).toBe(1);
    hook.cmd("placeRoad", { x: 20, z: 10 });
    hook.cmd("checkPlacement", { kind: "road", x: 20, z: 17 });
    expect(changes).toBe(1);
  });
});

describe("debug hook and walking", () => {
  it("lists the townsfolk", () => {
    const list = createDebugHook(createGame(7)).people();
    expect(list).toHaveLength(7);
    expect(Object.keys(list[0]!).sort()).toEqual(["home", "id", "name", "role", "state", "x", "z"]);
  });
  it("doesn't redraw the town for walking or time passing", () => {
    let changes = 0;
    const hook = createDebugHook(createGame(7), () => changes++);
    hook.cmd("setWalkInput", { x: 1, z: 0 });
    hook.cmd("advance", { seconds: 1 });
    expect(changes).toBe(0);
    hook.cmd("placeBuilding", { type: "cottage", x: 20, z: 18, rot: 0 });
    expect(changes).toBe(1);
  });
});

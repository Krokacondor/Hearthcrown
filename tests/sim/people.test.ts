import { describe, expect, it } from "vitest";
import dialogue from "../../src/data/dialogue.json";
import { createGame } from "../../src/sim/game";
import { assignHomes, stepPeople } from "../../src/sim/people";
import { laneWaypoints, walkableCells } from "../../src/sim/route";
import { cellCenter, cellKey, cellOf } from "../../src/sim/townMap";
import type { World } from "../../src/sim/world";

const DT = 1 / 60;

function setup(seed = 1) {
  const game = createGame(seed);
  const world = game.world as World;
  const run = (seconds: number) => { for (let i = 0; i < seconds * 60; i++) stepPeople(game.town, world, game.rng, DT, dialogue); };
  return { game, world, run };
}

describe("people", () => {
  it("starts with six citizens and the advisor, all on the plaza", () => {
    const { world, game } = setup();
    expect(world.people.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(world.people.filter((p) => p.role === "citizen")).toHaveLength(6);
    expect(world.people.find((p) => p.id === 7)?.role).toBe("advisor");
    expect(new Set(world.people.map((p) => p.name)).size).toBe(7);
    const { plaza } = game.town.map;
    for (const p of world.people) {
      expect(p.x).toBeGreaterThanOrEqual(plaza.x0);
      expect(p.x).toBeLessThanOrEqual(plaza.x1 + 1);
      expect(p.z).toBeGreaterThanOrEqual(plaza.z0);
      expect(p.z).toBeLessThanOrEqual(plaza.z1 + 1);
    }
    // Nobody starts on the statue or on top of someone else.
    expect(new Set(world.people.map((p) => `${p.x},${p.z}`)).size).toBe(7);
    expect(world.people.some((p) => p.x === game.town.map.statue.x && p.z === game.town.map.statue.z)).toBe(false);
  });

  it("gives the advisor the castle and nobody else a home yet", () => {
    const { world } = setup();
    expect(world.people.find((p) => p.role === "advisor")?.home).toBe(1);
    expect(world.people.filter((p) => p.role === "citizen").every((p) => p.home === null)).toBe(true);
  });

  it("fills cottages two at a time", () => {
    const { game, world } = setup();
    for (const x of [16, 18, 20]) expect(game.command("placeBuilding", { type: "cottage", x, z: 18, rot: 0 }).ok).toBe(true);
    assignHomes(game.town, world);
    const homes = world.people.filter((p) => p.role === "citizen").map((p) => p.home);
    for (const id of [2, 3, 4]) expect(homes.filter((h) => h === id)).toHaveLength(2);
    expect(world.people.find((p) => p.id === 1)?.home).toBe(2);
    expect(world.people.find((p) => p.id === 2)?.home).toBe(2);
  });

  it("leaves extra homes empty and changes nobody when nobody is homeless", () => {
    const { game, world } = setup();
    for (const x of [16, 18, 20]) game.command("placeBuilding", { type: "cottage", x, z: 18, rot: 0 });
    assignHomes(game.town, world);
    const before = world.people.map((p) => p.home);
    game.command("placeBuilding", { type: "cottage", x: 22, z: 18, rot: 0 });
    assignHomes(game.town, world);
    expect(world.people.map((p) => p.home)).toEqual(before);
    expect(world.people.some((p) => p.home === 5)).toBe(false);
  });

  it("puts up to five in a Family Home", () => {
    const { game, world } = setup();
    game.command("placeBuilding", { type: "familyHome", x: 16, z: 18, rot: 0 });
    assignHomes(game.town, world);
    expect(world.people.filter((p) => p.home === 2)).toHaveLength(5);
  });

  it("wanders along the roads", () => {
    const { game, world, run } = setup();
    const W = walkableCells(game.town, world);
    const start = world.people.map((p) => `${p.x},${p.z}`);
    run(30);
    for (const p of world.people) {
      const c = cellOf(game.town.map, Math.floor(p.x), Math.floor(p.z));
      expect(W.has(cellKey(c)), `${p.name} at ${p.x},${p.z}`).toBe(true);
    }
    expect(world.people.map((p) => `${p.x},${p.z}`)).not.toEqual(start);
  });

  it("re-routes when a road on their route is removed", () => {
    const { game, world, run } = setup();
    // A two-cell dead end north of the west road: cells (3,7) and (3,6).
    expect(game.command("placeRoad", { x: 19, z: 17 }).ok).toBe(true);
    expect(game.command("placeRoad", { x: 19, z: 15 }).ok).toBe(true);
    const map = game.town.map;
    const p = world.people[0]!;
    const cells = [{ cx: 2, cz: 8 }, { cx: 3, cz: 8 }, { cx: 3, cz: 7 }, { cx: 3, cz: 6 }];
    const start = cellCenter(map, cells[0]!);
    p.x = start.x; p.z = start.z;
    p.state = "walking";
    p.routeCells = cells.map(cellKey);
    p.route = laneWaypoints(map, cells, 0.5).slice(1);
    expect(game.command("removeRoad", { x: 19, z: 15 }).ok).toBe(true);
    run(5);
    const W = walkableCells(game.town, world);
    expect(W.has(cellKey(cellOf(map, Math.floor(p.x), Math.floor(p.z)))), `at ${p.x},${p.z}`).toBe(true);
    for (const k of p.routeCells) expect(W.has(k)).toBe(true);
  });

  it("does the same walks for the same seed", () => {
    const a = setup(5), b = setup(5);
    a.run(20); b.run(20);
    expect(JSON.stringify(a.world.people)).toBe(JSON.stringify(b.world.people));
  });
});

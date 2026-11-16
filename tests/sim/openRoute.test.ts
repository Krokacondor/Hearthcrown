import { describe, expect, it } from "vitest";
import { createGame } from "../../src/sim/game";
import { findOpenRoute, nearestFreeSquare } from "../../src/sim/openRoute";
import { isSolidSquare } from "../../src/sim/princess";
import type { World } from "../../src/sim/world";

function setup() {
  const game = createGame(1);
  return { town: game.town, world: game.world as World };
}

describe("findOpenRoute", () => {
  it("walks a straight line over open grass", () => {
    const { town, world } = setup();
    expect(findOpenRoute(town, world, { x: 20, z: 10 }, { x: 23, z: 10 })).toEqual([{ x: 21, z: 10 }, { x: 22, z: 10 }, { x: 23, z: 10 }]);
  });
  it("is empty when already there", () => {
    const { town, world } = setup();
    expect(findOpenRoute(town, world, { x: 20, z: 10 }, { x: 20, z: 10 })).toEqual([]);
  });
  it("goes round a building and never through anything solid", () => {
    const { town, world } = setup();
    world.buildings.push({ id: 90, type: "manor", x: 21, z: 9, rot: 0 });
    const r = findOpenRoute(town, world, { x: 20, z: 10 }, { x: 24, z: 10 })!;
    expect(r.at(-1)).toEqual({ x: 24, z: 10 });
    for (const s of r) expect(isSolidSquare(town, world, s.x, s.z)).toBe(false);
  });
  it("never cuts the corner between two buildings that touch diagonally", () => {
    const { town, world } = setup();
    world.buildings.push({ id: 90, type: "cottage", x: 20, z: 22, rot: 0 }, { id: 91, type: "cottage", x: 21, z: 21, rot: 0 });
    const r = findOpenRoute(town, world, { x: 20, z: 21 }, { x: 21, z: 22 })!;
    expect(r.length).toBeGreaterThan(1);
    for (const s of r) expect(isSolidSquare(town, world, s.x, s.z)).toBe(false);
  });
  it("stops next to a building when the target is inside it", () => {
    const { town, world } = setup();
    world.buildings.push({ id: 90, type: "cottage", x: 22, z: 10, rot: 0 });
    const r = findOpenRoute(town, world, { x: 18, z: 10 }, { x: 22, z: 10 })!;
    const end = r.at(-1)!;
    expect(isSolidSquare(town, world, end.x, end.z)).toBe(false);
    expect(Math.max(Math.abs(end.x - 22), Math.abs(end.z - 10))).toBe(1);
  });
  it("ends inside the walls when the target is outside them", () => {
    const { town, world } = setup();
    const r = findOpenRoute(town, world, { x: 15, z: 10 }, { x: 5, z: 10 })!;
    expect(r.at(-1)).toEqual({ x: 13, z: 10 });
  });
});

describe("nearestFreeSquare", () => {
  it("is the square itself when free, else the closest free one", () => {
    const { town, world } = setup();
    expect(nearestFreeSquare(town, world, { x: 20, z: 10 })).toEqual({ x: 20, z: 10 });
    expect(nearestFreeSquare(town, world, { x: 12, z: 10 })).toEqual({ x: 13, z: 10 });
  });
});

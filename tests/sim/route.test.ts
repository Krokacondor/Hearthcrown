import { describe, expect, it } from "vitest";
import { createGame } from "../../src/sim/game";
import { findRoute, laneWaypoints, walkableCells } from "../../src/sim/route";
import type { Cell } from "../../src/sim/townMap";

const game = createGame(1);
const { town, world } = game;
const W = walkableCells(town, world);
const steps = (r: Cell[]): number[] => r.slice(1).map((c, i) => Math.abs(c.cx - r[i]!.cx) + Math.abs(c.cz - r[i]!.cz));

describe("walkableCells", () => {
  it("covers laid roads, the plaza, the forecourt and the gates", () => {
    expect(W.has("10,8")).toBe(true); // plaza
    expect(W.has("9,2")).toBe(true); // forecourt
    expect(W.has("-1,8")).toBe(true); // west gate
    expect(W.has("20,8")).toBe(true); // east gate
    expect(W.has("10,16")).toBe(true); // south gate
    expect(W.has("0,8")).toBe(true); // west road
    expect(W.has("0,0")).toBe(false); // grass
    expect(W.size).toBe(27 + 9 + 3 + 3);
  });
  it("follows the roads the player lays", () => {
    const g = createGame(1);
    g.command("placeRoad", { x: 20, z: 18 });
    expect(walkableCells(g.town, g.world).has("3,7")).toBe(true);
  });
});

describe("findRoute", () => {
  it("finds a straight route", () => {
    const r = findRoute(W, { cx: 0, cz: 8 }, { cx: 3, cz: 8 })!;
    expect(r).toEqual([{ cx: 0, cz: 8 }, { cx: 1, cz: 8 }, { cx: 2, cz: 8 }, { cx: 3, cz: 8 }]);
  });
  it("finds a route through the plaza and round a corner", () => {
    const r = findRoute(W, { cx: 0, cz: 8 }, { cx: 10, cz: 2 })!;
    expect(r[0]).toEqual({ cx: 0, cz: 8 });
    expect(r.at(-1)).toEqual({ cx: 10, cz: 2 });
    expect(steps(r).every((s) => s === 1)).toBe(true);
    expect(r).toHaveLength(17); // 10 across and 6 up is the shortest
    for (const c of r) expect(W.has(`${c.cx},${c.cz}`)).toBe(true);
  });
  it("goes around a missing cell", () => {
    // A 3×3 ring with the middle missing: from one corner to the opposite, never through 1,1.
    const ring = new Set(["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2", "2,2"]);
    const r = findRoute(ring, { cx: 0, cz: 0 }, { cx: 2, cz: 2 })!;
    expect(r).toHaveLength(5);
    expect(r.some((c) => c.cx === 1 && c.cz === 1)).toBe(false);
  });
  it("returns [from] for the same cell and null when there is no route", () => {
    expect(findRoute(W, { cx: 0, cz: 8 }, { cx: 0, cz: 8 })).toEqual([{ cx: 0, cz: 8 }]);
    expect(findRoute(W, { cx: 0, cz: 8 }, { cx: 0, cz: 0 })).toBeNull();
    expect(findRoute(W, { cx: 0, cz: 0 }, { cx: 0, cz: 8 })).toBeNull();
    expect(findRoute(new Set(["0,0", "5,5"]), { cx: 0, cz: 0 }, { cx: 5, cz: 5 })).toBeNull();
  });
  it("gives the same answer every time (ties broken east, west, south, north)", () => {
    const a = findRoute(W, { cx: 0, cz: 8 }, { cx: 10, cz: 14 });
    expect(findRoute(W, { cx: 0, cz: 8 }, { cx: 10, cz: 14 })).toEqual(a);
  });
});

describe("laneWaypoints", () => {
  const map = town.map;
  it("keeps to the right-hand lane", () => {
    expect(laneWaypoints(map, [{ cx: 0, cz: 8 }, { cx: 1, cz: 8 }], 0.5)).toEqual([{ x: 14, z: 20.5 }, { x: 16, z: 20.5 }]);
    expect(laneWaypoints(map, [{ cx: 1, cz: 8 }, { cx: 0, cz: 8 }], 0.5)).toEqual([{ x: 16, z: 19.5 }, { x: 14, z: 19.5 }]);
  });
  it("cuts the inside of a corner", () => {
    // east, then south: the corner cell shifts by (-0.5, +0.5)
    expect(laneWaypoints(map, [{ cx: 0, cz: 7 }, { cx: 1, cz: 7 }, { cx: 1, cz: 8 }], 0.5)[1]).toEqual({ x: 15.5, z: 18.5 });
  });
  it("puts a one-cell route at the cell's middle", () => {
    expect(laneWaypoints(map, [{ cx: 0, cz: 8 }], 0.5)).toEqual([{ x: 14, z: 20 }]);
  });
});

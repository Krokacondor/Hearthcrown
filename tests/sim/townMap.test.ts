import { describe, expect, it } from "vitest";
import mapJson from "../../src/data/map.json";
import { cellCenter, cellOf, cellSquares, inBoard, kindAt, loadTownMap, roadGridOrigin, squareKey } from "../../src/sim/townMap";

const clone = (): Record<string, unknown> => structuredClone(mapJson) as Record<string, unknown>;

describe("loadTownMap", () => {
  it("loads the real map on the road grid", () => {
    const map = loadTownMap(mapJson);
    expect(map.width).toBe(66);
    expect(map.depth).toBe(48);
    expect(map.stages).toHaveLength(1);
    const stage = map.stages[0]!;
    expect(stage.gates.map((g) => g.id).sort()).toEqual(["east", "south", "west"]);
    expect(stage.walls.x1 - stage.walls.x0 - 1).toBe(40);
    expect(stage.walls.z1 - stage.walls.z0 - 1).toBe(32);
    expect(map.roads).toHaveLength(108);
    expect(new Set(map.roads.map(squareKey)).size).toBe(108);
    expect(map.forecourt).toEqual({ x0: 31, z0: 7, x1: 36, z1: 8 });
    expect(map.questBoard).toEqual({ x: 35.5, z: 7.3 });
    expect(roadGridOrigin(map)).toEqual({ x: 13, z: 3 });
    expect(stage.gates.find((g) => g.id === "south")?.squares).toEqual([{ x: 33, z: 35 }, { x: 34, z: 35 }]);
    expect(stage.gates.find((g) => g.id === "west")?.squares).toEqual([{ x: 12, z: 19 }, { x: 12, z: 20 }]);
    expect(map.princessStart).toEqual({ x: 34, z: 8 });
    expect(map.start).toEqual([{ type: "castle", x: 31, z: 3, rot: 0 }]);
  });

  it("does road-grid math", () => {
    const map = loadTownMap(mapJson);
    expect(cellOf(map, 13, 3)).toEqual({ cx: 0, cz: 0 });
    expect(cellOf(map, 14, 4)).toEqual({ cx: 0, cz: 0 });
    expect(cellOf(map, 12, 19)).toEqual({ cx: -1, cz: 8 });
    expect(cellSquares(map, { cx: 10, cz: 8 })).toEqual([{ x: 33, z: 19 }, { x: 34, z: 19 }, { x: 33, z: 20 }, { x: 34, z: 20 }]);
    expect(cellCenter(map, { cx: 10, cz: 8 })).toEqual({ x: 34, z: 20 });
  });

  it("rejects bad data with a message naming map.json", () => {
    const bad: [string, (m: Record<string, unknown>) => void][] = [
      ["gate off the ring", (m) => { (m.stages as any)[0].gates[0].x = 20; }],
      ["plaza touching the ring", (m) => { (m.plaza as any).x0 = 12; }],
      ["castle grounds outside the walls", (m) => { (m.castleGrounds as any).z0 = 0; }],
      ["wall ring off the board", (m) => { (m.stages as any)[0].walls.x1 = 66; }],
      ["road segment not straight", (m) => { (m.roads as any)[0] = { from: [13, 19], to: [20, 20] }; }],
      ["empty stages", (m) => { m.stages = []; }],
      ["wide gate running past the corner", (m) => { (m.stages as any)[0].gates[1].x = 53; }],
      ["gate width 0", (m) => { (m.stages as any)[0].gates[1].width = 0; }],
      ["gate off the road grid", (m) => { (m.stages as any)[0].gates[1].x = 32; }],
      ["one-wide gate", (m) => { (m.stages as any)[0].gates[0].width = 1; }],
      ["plaza off the road grid", (m) => { (m.plaza as any).x0 = 30; }],
      ["forecourt off the road grid", (m) => { (m.forecourt as any).z1 = 9; }],
      ["quest board off the forecourt", (m) => { (m.questBoard as any).z = 12; }],
      ["missing princessStart", (m) => { delete m.princessStart; }],
      ["road outside the board", (m) => { (m.roads as any)[0] = { from: [-2, 19], to: [5, 19] }; }],
      ["not an object", () => {}],
    ];
    for (const [name, mutate] of bad) {
      const m = clone();
      mutate(m);
      const input = name === "not an object" ? "nope" : m;
      expect(() => loadTownMap(input), name).toThrow(/map\.json/);
    }
  });
});

describe("kindAt", () => {
  const map = loadTownMap(mapJson);
  it.each([
    [12, 2, "wall"], [53, 35, "wall"],
    [12, 19, "gate"], [12, 20, "gate"], [33, 35, "gate"], [34, 35, "gate"], [32, 35, "wall"],
    [34, 18, "plaza"],
    [31, 3, "castleGrounds"],
    [35, 7, "forecourt"], [31, 8, "forecourt"],
    [20, 10, "open"],
    [5, 5, "outside"], [65, 47, "outside"], [32, 40, "outside"],
  ])("(%i,%i) is %s", (x, z, kind) => {
    expect(kindAt(map, 0, x, z)).toBe(kind);
  });
});

describe("inBoard", () => {
  const map = loadTownMap(mapJson);
  it("is false off the board or for non-integers", () => {
    for (const [x, z] of [[-1, 0], [66, 0], [0, 48], [0.5, 1], [NaN, 1]] as const) {
      expect(inBoard(map, x, z)).toBe(false);
    }
    expect(inBoard(map, 0, 0)).toBe(true);
    expect(inBoard(map, 65, 47)).toBe(true);
  });
});

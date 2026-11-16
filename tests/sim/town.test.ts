import { describe, expect, it } from "vitest";
import buildingsJson from "../../src/data/buildings.json";
import mapJson from "../../src/data/map.json";
import { loadTown } from "../../src/sim/town";

const map = (): Record<string, any> => structuredClone(mapJson) as Record<string, any>;

describe("loadTown", () => {
  it("loads the real data", () => {
    const town = loadTown(mapJson, buildingsJson);
    expect(town.map.width).toBe(66);
    expect(town.defs.get("castle")?.name).toBe("Castle");
  });

  it("names a start placement whose type isn't in buildings.json", () => {
    const m = map();
    m.start[0].type = "castel";
    expect(() => loadTown(m, buildingsJson)).toThrow(/map\.json: start\[0\]\.type "castel" is not in buildings\.json/);
  });

  it("names a start placement that breaks the placement rules", () => {
    const m = map();
    m.start[0].x = 30; // half off the castle grounds
    expect(() => loadTown(m, buildingsJson)).toThrow(/map\.json: start\[0\] \(castle at 30,3\)/);
  });

  it("names a starting road that sits on the plaza, a gate or the castle grounds", () => {
    const m = map();
    m.roads.push({ from: [33, 17], to: [34, 17] }, { from: [33, 18], to: [34, 18] });
    expect(() => loadTown(m, buildingsJson)).toThrow(/map\.json: road square 33,17 is not on open ground/);
  });

  it("names a starting road that doesn't join the network", () => {
    const m = map();
    m.roads.push({ from: [19, 7], to: [20, 7] }, { from: [19, 8], to: [20, 8] });
    expect(() => loadTown(m, buildingsJson)).toThrow(/map\.json: road square 19,7 does not join the roads from the gates/);
  });

  it("names a starting road that covers only part of a road cell", () => {
    const m = map();
    m.roads.push({ from: [19, 17], to: [20, 17] });
    expect(() => loadTown(m, buildingsJson)).toThrow(/map\.json: road square 19,17 is not part of a whole road cell/);
  });
});

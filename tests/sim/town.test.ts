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
    m.start[0].x = 29; // half off the castle grounds
    expect(() => loadTown(m, buildingsJson)).toThrow(/map\.json: start\[0\] \(castle at 29,3\)/);
  });

  it("names a starting road that sits on the plaza, a gate or the castle grounds", () => {
    const m = map();
    m.roads.push({ from: [33, 17], to: [33, 17] });
    expect(() => loadTown(m, buildingsJson)).toThrow(/map\.json: road square 33,17 is not on open ground/);
  });

  it("names a starting road that doesn't join the network", () => {
    const m = map();
    m.roads.push({ from: [20, 8], to: [20, 9] });
    expect(() => loadTown(m, buildingsJson)).toThrow(/map\.json: road square 20,8 does not join the roads from the gates/);
  });
});

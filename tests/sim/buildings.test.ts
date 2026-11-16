import { describe, expect, it } from "vitest";
import buildingsJson from "../../src/data/buildings.json";
import { footprint, loadBuildingDefs, type BuildingDef } from "../../src/sim/buildings";

const defs = loadBuildingDefs(buildingsJson);
const def = (id: string): BuildingDef => {
  const d = defs.get(id);
  if (!d) throw new Error(`no ${id}`);
  return d;
};
const sq = (x: number, z: number) => ({ x, z });
const sorted = (list: { x: number; z: number }[]) => [...list].sort((a, b) => a.z - b.z || a.x - b.x);

describe("loadBuildingDefs", () => {
  it("loads the M1 set", () => {
    expect([...defs.keys()].sort()).toEqual(["castle", "cottage", "familyHome", "lodge", "manor"]);
    expect(def("cottage")).toMatchObject({ name: "Cottage", size: [1, 1], door: [0], site: "open", inBuildMenu: true });
    expect(def("familyHome")).toMatchObject({ name: "Family Home", size: [2, 1], door: [0, 1], site: "open", inBuildMenu: true });
    expect(def("manor")).toMatchObject({ name: "Manor", size: [2, 2], door: [0], site: "open", inBuildMenu: true });
    expect(def("lodge")).toMatchObject({ name: "Adventurers' Lodge", size: [3, 2], door: [1], site: "open", inBuildMenu: true });
    expect(def("castle")).toMatchObject({ name: "Castle", size: [6, 4], door: [2, 3], site: "castleGrounds", inBuildMenu: false });
  });

  it("gives homes a resident range", () => {
    expect(def("cottage").residents).toEqual({ min: 1, max: 2 });
    expect(def("familyHome").residents).toEqual({ min: 3, max: 5 });
    expect(def("manor").residents).toEqual({ min: 4, max: 6 });
    expect(def("lodge").residents).toBeUndefined();
    expect(def("castle").residents).toBeUndefined();
  });

  it("rejects a bad resident range", () => {
    for (const bad of [[0, 2], [3, 2], [1], "two", [1.5, 2]]) {
      const j = structuredClone(buildingsJson) as { buildings: Record<string, unknown>[] };
      j.buildings[0]!.residents = bad;
      expect(() => loadBuildingDefs(j), JSON.stringify(bad)).toThrow(/buildings\.json: cottage\.residents/);
    }
  });

  it("rejects bad data with a message naming buildings.json", () => {
    const base = () => structuredClone(buildingsJson) as { buildings: Record<string, unknown>[] };
    const cases: [string, (j: { buildings: Record<string, unknown>[] }) => void][] = [
      ["door past the width", (j) => { j.buildings[0]!.door = [1]; }],
      ["empty door", (j) => { j.buildings[0]!.door = []; }],
      ["size 0", (j) => { j.buildings[0]!.size = [0, 1]; }],
      ["fractional size", (j) => { j.buildings[0]!.size = [1.5, 1]; }],
      ["duplicate id", (j) => { j.buildings.push(structuredClone(j.buildings[0]!)); }],
      ["unknown site", (j) => { j.buildings[0]!.site = "moon"; }],
    ];
    for (const [name, mutate] of cases) {
      const j = base();
      mutate(j);
      expect(() => loadBuildingDefs(j), name).toThrow(/buildings\.json/);
    }
    expect(() => loadBuildingDefs(null)).toThrow(/buildings\.json/);
  });
});

describe("footprint", () => {
  it("turns a cottage's door to all four sides", () => {
    expect(footprint(def("cottage"), 10, 10, 0)).toEqual({ cells: [sq(10, 10)], doorFront: [sq(10, 11)] });
    expect(footprint(def("cottage"), 10, 10, 1).doorFront).toEqual([sq(9, 10)]);
    expect(footprint(def("cottage"), 10, 10, 2).doorFront).toEqual([sq(10, 9)]);
    expect(footprint(def("cottage"), 10, 10, 3).doorFront).toEqual([sq(11, 10)]);
  });

  it("turns a family home onto its side", () => {
    const f = footprint(def("familyHome"), 10, 10, 1);
    expect(sorted(f.cells)).toEqual([sq(10, 10), sq(10, 11)]);
    expect(sorted(f.doorFront)).toEqual([sq(9, 10), sq(9, 11)]);
  });

  it("places the lodge door on its middle front square", () => {
    const f0 = footprint(def("lodge"), 10, 10, 0);
    expect(sorted(f0.cells)).toEqual([sq(10, 10), sq(11, 10), sq(12, 10), sq(10, 11), sq(11, 11), sq(12, 11)]);
    expect(f0.doorFront).toEqual([sq(11, 12)]);
    const f3 = footprint(def("lodge"), 10, 10, 3);
    expect(sorted(f3.cells)).toEqual([sq(10, 10), sq(11, 10), sq(10, 11), sq(11, 11), sq(10, 12), sq(11, 12)]);
    expect(f3.doorFront).toEqual([sq(12, 11)]);
  });

  it("puts the castle door in front of its two middle squares", () => {
    expect(sorted(footprint(def("castle"), 30, 3, 0).doorFront)).toEqual([sq(32, 7), sq(33, 7)]);
  });
});

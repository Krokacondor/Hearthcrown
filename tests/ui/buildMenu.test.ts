import { describe, expect, it } from "vitest";
import buildingsJson from "../../src/data/buildings.json";
import { loadBuildingDefs } from "../../src/sim/buildings";
import { menuItems, moveSelection } from "../../src/ui/buildMenu";

describe("menuItems", () => {
  it("lists Road first, then the buildings in the menu, without the castle", () => {
    const items = menuItems(loadBuildingDefs(buildingsJson));
    expect(items.map((i) => i.name)).toEqual(["Road", "Cottage", "Family Home", "Manor", "Adventurers' Lodge"]);
    expect(items[0]).toEqual({ id: "road", name: "Road", size: null });
    expect(items[4]).toEqual({ id: "lodge", name: "Adventurers' Lodge", size: [3, 2] });
  });
});

describe("moveSelection", () => {
  it("wraps at both ends", () => {
    expect(moveSelection(0, -1, 5)).toBe(4);
    expect(moveSelection(4, 1, 5)).toBe(0);
    expect(moveSelection(2, 1, 5)).toBe(3);
  });
  it("stays at 0 for an empty list", () => expect(moveSelection(0, 1, 0)).toBe(0));
});

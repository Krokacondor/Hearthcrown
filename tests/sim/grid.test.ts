import { describe, expect, it } from "vitest";
import buildingsJson from "../../src/data/buildings.json";
import mapJson from "../../src/data/map.json";
import { loadBuildingDefs } from "../../src/sim/buildings";
import { canPlaceBuilding, canPlaceRoad, canRemoveRoad, type Check } from "../../src/sim/grid";
import { loadTownMap, type Rot } from "../../src/sim/townMap";
import { createWorld, type Town, type World } from "../../src/sim/world";

const town: Town = { map: loadTownMap(mapJson), defs: loadBuildingDefs(buildingsJson) };
const fresh = (): World => createWorld(7, town);

/** Test helpers that apply a placement only if the rule allows it (the game's commands do this in Task 5). */
function road(world: World, x: number, z: number): void {
  const c = canPlaceRoad(town, world, x, z);
  if (!c.ok) throw new Error(`road ${x},${z}: ${c.message}`);
  world.roads.push({ x, z });
}
function build(world: World, type: string, x: number, z: number, rot: Rot): void {
  const c = canPlaceBuilding(town, world, type, x, z, rot);
  if (!c.ok) throw new Error(`${type} ${x},${z}: ${c.message}`);
  world.buildings.push({ id: world.nextBuildingId++, type, x, z, rot });
}
const fails = (c: Check, reason: string, message?: string): void => {
  expect(c.ok).toBe(false);
  if (!c.ok) {
    expect(c.reason).toBe(reason);
    if (message) expect(c.message).toBe(message);
  }
};

describe("the starting town", () => {
  it("has the castle and the 78 citizen roads", () => {
    const w = fresh();
    expect(w.buildings).toEqual([{ id: 1, type: "castle", x: 30, z: 3, rot: 0 }]);
    expect(w.roads).toHaveLength(78);
    expect(w.wallStage).toBe(0);
  });
});

describe("canPlaceBuilding", () => {
  it("allows a cottage whose door faces a road", () => {
    expect(canPlaceBuilding(town, fresh(), "cottage", 20, 18, 0)).toEqual({ ok: true });
  });
  it("needs a road at the door", () => {
    fails(canPlaceBuilding(town, fresh(), "cottage", 20, 10, 0), "noRoad", "Needs a road at the door");
  });
  it("refuses the wall, the fields outside, and footprints that reach the wall", () => {
    fails(canPlaceBuilding(town, fresh(), "cottage", 12, 10, 0), "outside", "Outside the town walls");
    fails(canPlaceBuilding(town, fresh(), "cottage", 5, 19, 0), "outside");
    fails(canPlaceBuilding(town, fresh(), "lodge", 51, 16, 0), "outside");
  });
  it("refuses roads, the plaza, the quest board and other buildings", () => {
    fails(canPlaceBuilding(town, fresh(), "cottage", 20, 19, 0), "blocked", "Something is in the way");
    fails(canPlaceBuilding(town, fresh(), "cottage", 33, 17, 0), "blocked");
    fails(canPlaceBuilding(town, fresh(), "cottage", 34, 7, 0), "blocked");
    const w = fresh();
    build(w, "cottage", 20, 18, 0);
    fails(canPlaceBuilding(town, w, "familyHome", 19, 18, 0), "blocked");
  });
  it("keeps the castle on the castle grounds", () => {
    fails(canPlaceBuilding(town, fresh(), "castle", 20, 10, 0), "wrongSite", "The castle belongs on the castle grounds");
  });
  it("accepts a door on any of its squares facing a road", () => {
    expect(canPlaceBuilding(town, fresh(), "familyHome", 22, 20, 2)).toEqual({ ok: true });
    expect(canPlaceBuilding(town, fresh(), "manor", 22, 17, 0)).toEqual({ ok: true });
  });
  it("refuses a turned building whose door or cells poke past the wall", () => {
    // A lodge turned to face east at x 51..52: its door square in front is the wall at x 53.
    fails(canPlaceBuilding(town, fresh(), "lodge", 51, 20, 3), "noRoad");
    // Turned to face west with its cells at x 52..53: the wall.
    fails(canPlaceBuilding(town, fresh(), "lodge", 52, 20, 1), "outside");
  });
  it("refuses unknown building types", () => {
    fails(canPlaceBuilding(town, fresh(), "dragonLair", 20, 18, 0), "blocked");
  });
});

describe("canPlaceRoad", () => {
  it("allows a road next to the network", () => {
    expect(canPlaceRoad(town, fresh(), 20, 18)).toEqual({ ok: true });
    expect(canPlaceRoad(town, fresh(), 34, 8)).toEqual({ ok: true });
  });
  it("must join a road side by side", () => {
    fails(canPlaceRoad(town, fresh(), 20, 10), "notConnected", "Roads must join a road");
    fails(canPlaceRoad(town, fresh(), 29, 15), "notConnected");
  });
  it("can't go on a wall, a gate, the plaza or a building", () => {
    fails(canPlaceRoad(town, fresh(), 12, 10), "outside");
    fails(canPlaceRoad(town, fresh(), 12, 19), "blocked");
    fails(canPlaceRoad(town, fresh(), 33, 17), "blocked");
    fails(canPlaceRoad(town, fresh(), 31, 4), "blocked");
  });
});

describe("canRemoveRoad", () => {
  it("won't cut a gate off", () => {
    fails(canRemoveRoad(town, fresh(), 20, 19), "cutsOff", "A town gate would be cut off");
  });
  it("won't cut the castle off", () => {
    // The castle road is two squares wide, so one square can go but not both.
    const w = fresh();
    expect(canRemoveRoad(town, w, 32, 15)).toEqual({ ok: true });
    w.roads = w.roads.filter((r) => !(r.x === 32 && r.z === 15));
    fails(canRemoveRoad(town, w, 33, 15), "cutsOff", "The Castle would be cut off");
  });
  it("allows removal once a detour exists", () => {
    const w = fresh();
    for (const [x, z] of [[19, 18], [20, 18], [21, 18]] as const) road(w, x, z);
    expect(canRemoveRoad(town, w, 20, 19)).toEqual({ ok: true });
  });
  it("allows trimming a dead end but not leaving a floating piece", () => {
    const w = fresh();
    for (const [x, z] of [[20, 18], [20, 17], [20, 16]] as const) road(w, x, z);
    expect(canRemoveRoad(town, w, 20, 16)).toEqual({ ok: true });
    fails(canRemoveRoad(town, w, 20, 17), "cutsOff", "Part of the road would be cut off");
  });
  it("names a building that would lose its road", () => {
    const w = fresh();
    for (const [x, z] of [[19, 20], [19, 21], [20, 21], [21, 21], [21, 20]] as const) road(w, x, z);
    build(w, "cottage", 20, 20, 2);
    fails(canRemoveRoad(town, w, 20, 19), "cutsOff", "The Cottage would be cut off");
    build(w, "cottage", 20, 18, 0);
    fails(canRemoveRoad(town, w, 20, 19), "cutsOff", "The Cottage and 1 more would be cut off");
  });
  it("keeps the plaza and gates", () => {
    fails(canRemoveRoad(town, fresh(), 33, 18), "permanent", "The plaza and gates stay");
    fails(canRemoveRoad(town, fresh(), 12, 19), "permanent");
  });
  it("needs a road to remove", () => {
    fails(canRemoveRoad(town, fresh(), 20, 10), "notRoad", "There's no road here");
  });
});

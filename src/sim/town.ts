// Loads the map and the building list together and checks the data that spans both files, so a bad
// starting town fails at startup with a message naming the field instead of drawing a broken town.
import { loadBuildingDefs } from "./buildings";
import { canPlaceBuilding, reachableFromGates } from "./grid";
import { kindAt, loadTownMap, squareKey } from "./townMap";
import { createWorld, type Town } from "./world";

const fail = (msg: string): never => {
  throw new Error(`map.json: ${msg}`);
};

export function loadTown(mapJson: unknown, buildingsJson: unknown): Town {
  const map = loadTownMap(mapJson);
  const defs = loadBuildingDefs(buildingsJson);
  const town: Town = { map, defs };

  for (const r of map.roads) {
    if (kindAt(map, 0, r.x, r.z) !== "open") fail(`road square ${squareKey(r)} is not on open ground`);
  }
  // Check the start placements one at a time against the starting roads and each other.
  const world = createWorld(0, { map: { ...map, start: [] }, defs });
  const reached = reachableFromGates(town, world);
  for (const r of map.roads) {
    if (!reached.has(squareKey(r))) fail(`road square ${squareKey(r)} does not join the roads from the gates`);
  }
  map.start.forEach((p, i) => {
    if (!defs.has(p.type)) fail(`start[${i}].type "${p.type}" is not in buildings.json`);
    const check = canPlaceBuilding(town, world, p.type, p.x, p.z, p.rot);
    if (!check.ok) fail(`start[${i}] (${p.type} at ${p.x},${p.z}) can't be placed: ${check.message}`);
    world.buildings.push({ id: world.nextBuildingId++, type: p.type, x: p.x, z: p.z, rot: p.rot });
  });
  return town;
}

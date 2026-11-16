import balance from "../data/balance.json";
import type { BuildingDef } from "./buildings";
import type { Person } from "./people";
import { startPrincess, type Princess, type WalkInput } from "./princess";
import type { Rot, Square, TownMap } from "./townMap";

/** The fixed data a game is played on: the map and the building list. */
export interface Town {
  map: TownMap;
  defs: ReadonlyMap<string, BuildingDef>;
}

export interface PlacedBuilding {
  id: number;
  type: string;
  /** Minimum corner of the turned footprint. */
  x: number;
  z: number;
  rot: Rot;
}

export interface World {
  seed: number;
  /** Starts at 1. */
  day: number;
  /** Minutes since midnight. 360 = 06:00. */
  time: number;
  /** The princess's spending money. Never below zero. */
  gold: number;
  /** -100 (Feared) to +100 (Loved). */
  reputation: number;
  buildings: PlacedBuilding[];
  nextBuildingId: number;
  /** Road squares the princess (or the citizens) laid. The plaza and gates are road too but live in the map. */
  roads: Square[];
  /** Index into the map's wall stages. */
  wallStage: number;
  princess: Princess;
  /** What the player is holding right now (keys or stick), set by a command. */
  walkInput: WalkInput;
  /** The townsfolk: citizens and the advisor (M2). */
  people: Person[];
  /** Typed in M6. */
  adventurers: unknown[];
}

/** A new game: the citizens' roads plus the map's start placements (the castle). */
export function createWorld(seed: number, town: Town): World {
  const buildings = town.map.start.map((p, i) => ({ id: i + 1, type: p.type, x: p.x, z: p.z, rot: p.rot }));
  return {
    seed,
    day: balance.startingDay,
    time: balance.startingTime,
    gold: balance.startingGold,
    reputation: balance.startingReputation,
    buildings,
    nextBuildingId: buildings.length + 1,
    roads: town.map.roads.map((r) => ({ ...r })),
    wallStage: 0,
    princess: startPrincess(town),
    walkInput: { x: 0, z: 0, sprint: false },
    people: [],
    adventurers: [],
  };
}

import balance from "../data/balance.json";

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
  /** Typed in M1/M4. */
  buildings: unknown[];
  /** Typed in M3. */
  citizens: unknown[];
  /** Typed in M6. */
  adventurers: unknown[];
}

export function createWorld(seed: number): World {
  return {
    seed,
    day: balance.startingDay,
    time: balance.startingTime,
    gold: balance.startingGold,
    reputation: balance.startingReputation,
    buildings: [],
    citizens: [],
    adventurers: [],
  };
}

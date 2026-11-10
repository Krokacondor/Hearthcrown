/**
 * Seeded random number generator (mulberry32). Every random roll in the sim
 * goes through this, so the same seed and commands always give the same game.
 * The whole state is one uint32, so it can be saved and restored.
 */
export interface Rng {
  /** A float in [0, 1). */
  next(): number;
  /** An integer from min to max, inclusive of both. */
  int(min: number, max: number): number;
  /** True with probability p. */
  chance(p: number): boolean;
  /** A random member of a non-empty list. */
  pick<T>(items: readonly T[]): T;
  /** Current state as a uint32, for saving. */
  readonly state: number;
}

function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    throw new RangeError(`RNG seed must be a finite number, got ${seed}`);
  }
  return Math.trunc(seed) >>> 0;
}

function makeRng(initialState: number): Rng {
  let state = initialState >>> 0;

  const next = (): number => {
    let t = (state = (state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(min, max) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
        throw new RangeError(`int(${min}, ${max}) needs integers with min <= max`);
      }
      return min + Math.floor(next() * (max - min + 1));
    },
    chance(p) {
      return next() < p;
    },
    pick(items) {
      if (items.length === 0) throw new RangeError("pick() needs a non-empty list");
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    get state() {
      return state;
    },
  };
}

export function createRng(seed: number): Rng {
  return makeRng(normalizeSeed(seed));
}

export function rngFromState(state: number): Rng {
  return makeRng(normalizeSeed(state));
}

import { describe, expect, it } from "vitest";
import { createRng, rngFromState } from "../../src/sim/rng";

describe("seeded RNG", () => {
  it("matches the reference sequence for seed 7", () => {
    const r = createRng(7);
    expect(r.next()).toBeCloseTo(0.0117047532, 9);
    expect(r.next()).toBeCloseTo(0.0619582576, 9);
    expect(r.next()).toBeCloseTo(0.9769076328, 9);
  });

  it("works with seed 0", () => {
    expect(createRng(0).next()).toBeCloseTo(0.2664292087, 9);
  });

  it("same seed gives the same 1000 values; different seeds differ", () => {
    const a = createRng(123);
    const b = createRng(123);
    const c = createRng(124);
    const seqA = Array.from({ length: 1000 }, () => a.next());
    const seqB = Array.from({ length: 1000 }, () => b.next());
    const seqC = Array.from({ length: 1000 }, () => c.next());
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
  });

  it("next() stays in [0, 1) over 10,000 draws", () => {
    const r = createRng(99);
    for (let i = 0; i < 10_000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("int(1, 6) hits both 1 and 6 and nothing outside over 10,000 draws", () => {
    const r = createRng(5);
    const seen = new Set<number>();
    for (let i = 0; i < 10_000; i++) {
      const v = r.int(1, 6);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect(seen).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it("int(5, 5) always returns 5", () => {
    const r = createRng(1);
    for (let i = 0; i < 100; i++) expect(r.int(5, 5)).toBe(5);
  });

  it("int throws RangeError when min > max or bounds are not integers", () => {
    const r = createRng(1);
    expect(() => r.int(6, 1)).toThrow(RangeError);
    expect(() => r.int(1.5, 3)).toThrow(RangeError);
    expect(() => r.int(1, NaN)).toThrow(RangeError);
  });

  it("chance(0) is always false and chance(1) always true", () => {
    const r = createRng(3);
    for (let i = 0; i < 1000; i++) {
      expect(r.chance(0)).toBe(false);
      expect(r.chance(1)).toBe(true);
    }
  });

  it("pick throws on an empty array and only returns members", () => {
    const r = createRng(8);
    expect(() => r.pick([])).toThrow(RangeError);
    const items = ["a", "b", "c"] as const;
    for (let i = 0; i < 300; i++) expect(items).toContain(r.pick(items));
  });

  it("rngFromState(r.state) continues the exact same sequence", () => {
    const r = createRng(42);
    for (let i = 0; i < 17; i++) r.next();
    const copy = rngFromState(r.state);
    for (let i = 0; i < 100; i++) expect(copy.next()).toBe(r.next());
  });

  it("negative, huge and fractional seeds are deterministic and never NaN", () => {
    for (const s of [-1, 2 ** 40, 3.7]) {
      const a = createRng(s);
      const b = createRng(s);
      const v = a.next();
      expect(Number.isNaN(v)).toBe(false);
      expect(v).toBe(b.next());
    }
  });

  it("throws RangeError for NaN and Infinity seeds", () => {
    expect(() => createRng(NaN)).toThrow(RangeError);
    expect(() => createRng(Infinity)).toThrow(RangeError);
    expect(() => createRng(-Infinity)).toThrow(RangeError);
  });
});

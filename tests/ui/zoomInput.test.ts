import { describe, expect, it } from "vitest";
import { pinchSteps, wheelSteps } from "../../src/ui/zoomInput";

describe("wheelSteps", () => {
  it("one mouse-wheel notch (100px) is one step; down is farther, up is closer", () => {
    expect(wheelSteps(0, 100, 0)).toEqual({ steps: 1, carry: 0 });
    expect(wheelSteps(0, -100, 0)).toEqual({ steps: -1, carry: 0 });
  });

  it("small trackpad deltas build up instead of each taking a full step", () => {
    let carry = 0, total = 0;
    for (let i = 0; i < 10; i++) {
      const r = wheelSteps(carry, 4, 0);
      carry = r.carry; total += r.steps;
    }
    expect(total).toBe(0);
    expect(carry).toBe(40);
    for (let i = 0; i < 15; i++) {
      const r = wheelSteps(carry, 4, 0);
      carry = r.carry; total += r.steps;
    }
    expect(total).toBe(1);
  });

  it("converts line and page delta modes to pixels", () => {
    expect(wheelSteps(0, 3, 1).steps).toBe(0);   // 3 lines = 48px
    expect(wheelSteps(0, 7, 1).steps).toBe(1);   // 7 lines = 112px
    expect(wheelSteps(0, 1, 2).steps).toBe(4);   // 1 page = 400px
  });

  it("ignores NaN deltas", () => expect(wheelSteps(30, NaN, 0)).toEqual({ steps: 0, carry: 30 }));
});

describe("pinchSteps", () => {
  it("no change in finger distance is no step", () => expect(pinchSteps(100, 100)).toBe(0));

  it("spreading fingers zooms closer, one step per 15% change", () => {
    expect(pinchSteps(100, 116)).toBe(-1);
    expect(pinchSteps(100, 100 * 1.15 ** 3 + 0.5)).toBe(-3);
  });

  it("pinching fingers together zooms farther", () => expect(pinchSteps(100, 80)).toBe(1));

  it("returns 0 for a zero, negative or NaN start distance", () => {
    expect(pinchSteps(0, 50)).toBe(0);
    expect(pinchSteps(-5, 50)).toBe(0);
    expect(pinchSteps(NaN, 50)).toBe(0);
  });
});

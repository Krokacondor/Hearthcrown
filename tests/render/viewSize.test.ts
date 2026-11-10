import { describe, expect, it } from "vitest";
import { viewSize } from "../../src/render/viewSize";

describe("viewSize", () => {
  it("keeps CSS size and clamps the pixel ratio to 2", () =>
    expect(viewSize(844, 390, 3)).toEqual({ width: 844, height: 390, pixelRatio: 2 }));

  it("keeps a normal pixel ratio as is", () =>
    expect(viewSize(1280, 800, 1.5)).toEqual({ width: 1280, height: 800, pixelRatio: 1.5 }));

  it("treats dpr 0, negative or NaN as 1", () => {
    expect(viewSize(1280, 800, NaN).pixelRatio).toBe(1);
    expect(viewSize(1280, 800, 0).pixelRatio).toBe(1);
    expect(viewSize(1280, 800, -2).pixelRatio).toBe(1);
  });

  it("never returns less than 1 for either side", () =>
    expect(viewSize(0, -5, 2)).toMatchObject({ width: 1, height: 1 }));

  it("rounds fractional CSS sizes and survives NaN", () =>
    expect(viewSize(843.6, NaN, 1)).toMatchObject({ width: 844, height: 1 }));
});

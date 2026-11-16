import { describe, expect, it } from "vitest";
import { segmentHitsBox } from "../../src/render/occlusion";

const box = { min: [0, 0, 0] as [number, number, number], max: [2, 2, 2] as [number, number, number] };

describe("segmentHitsBox", () => {
  it("is true for a segment that passes through the box", () => {
    expect(segmentHitsBox([-5, 1, 1], [5, 1, 1], box)).toBe(true);
  });
  it("is false for a segment passing beside it", () => {
    expect(segmentHitsBox([-5, 3, 1], [5, 3, 1], box)).toBe(false);
  });
  it("is false for a segment that ends before the box", () => {
    expect(segmentHitsBox([-5, 1, 1], [-1, 1, 1], box)).toBe(false);
  });
  it("is true for a segment starting inside the box", () => {
    expect(segmentHitsBox([1, 1, 1], [9, 9, 9], box)).toBe(true);
  });
  it("is false for a zero-length segment outside the box", () => {
    expect(segmentHitsBox([5, 5, 5], [5, 5, 5], box)).toBe(false);
  });
  it("handles a camera looking down at a point behind a building", () => {
    expect(segmentHitsBox([1, 10, 12], [1, 0.3, -1], box)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { DROP_SECONDS, dropPose } from "../../src/render/drop";

describe("dropPose", () => {
  it("starts above the board, tilted", () => {
    const p = dropPose(0);
    expect(p.y).toBeGreaterThan(0.3);
    expect(Math.abs(p.tilt)).toBeGreaterThan(0);
  });
  it("lands flat at the end and stays there", () => {
    expect(dropPose(DROP_SECONDS)).toEqual({ y: 0, tilt: 0, done: true });
    expect(dropPose(DROP_SECONDS + 5)).toEqual({ y: 0, tilt: 0, done: true });
  });
  it("only ever moves down to the board, never below it", () => {
    for (let t = 0; t <= DROP_SECONDS; t += DROP_SECONDS / 20) expect(dropPose(t).y).toBeGreaterThanOrEqual(0);
  });
});

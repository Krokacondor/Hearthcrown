import { describe, expect, it } from "vitest";
import { arrowStep, buildKeyFor, clampToBoard, contextMenuIsBack, nearestFit, releaseTouch, strokeSquares, tap, turnRot, type Arrow } from "../../src/ui/buildInput";

describe("buildKeyFor", () => {
  it("maps arrows and WASD to moves", () => {
    expect(buildKeyFor("ArrowUp")).toEqual({ kind: "move", dir: "up" });
    expect(buildKeyFor("w")).toEqual({ kind: "move", dir: "up" });
    expect(buildKeyFor("W")).toEqual({ kind: "move", dir: "up" });
    expect(buildKeyFor("d")).toEqual({ kind: "move", dir: "right" });
    expect(buildKeyFor("ArrowLeft")).toEqual({ kind: "move", dir: "left" });
    expect(buildKeyFor("s")).toEqual({ kind: "move", dir: "down" });
  });
  it("maps R, Enter and Escape", () => {
    expect(buildKeyFor("r")).toEqual({ kind: "turn" });
    expect(buildKeyFor("R")).toEqual({ kind: "turn" });
    expect(buildKeyFor("Enter")).toEqual({ kind: "place" });
    expect(buildKeyFor("Escape")).toEqual({ kind: "back" });
  });
  it("lets camera and menu keys pass through", () => {
    for (const k of ["q", "e", "+", "-", "b", " ", ""]) expect(buildKeyFor(k)).toBeNull();
  });
});

describe("arrowStep", () => {
  it("moves away from the viewer at the default angle", () => {
    expect(arrowStep("up", 0)).toEqual({ dx: 0, dz: -1 });
    expect(arrowStep("right", 0)).toEqual({ dx: 1, dz: 0 });
    expect(arrowStep("down", 0)).toEqual({ dx: 0, dz: 1 });
    expect(arrowStep("left", 0)).toEqual({ dx: -1, dz: 0 });
  });
  it("turns with the camera", () => {
    expect(arrowStep("up", 2)).toEqual({ dx: -1, dz: 0 });
    expect(arrowStep("right", 2)).toEqual({ dx: 0, dz: -1 });
    expect(arrowStep("up", 4)).toEqual({ dx: 0, dz: 1 });
    expect(arrowStep("up", 6)).toEqual({ dx: 1, dz: 0 });
  });
  it("uses the step below at diagonal angles, so moves never go corner to corner", () => {
    const arrows: Arrow[] = ["up", "down", "left", "right"];
    for (const odd of [1, 3, 5, 7]) for (const a of arrows) expect(arrowStep(a, odd)).toEqual(arrowStep(a, odd - 1));
    for (let step = 0; step < 8; step++) for (const a of arrows) {
      const { dx, dz } = arrowStep(a, step);
      expect(Math.abs(dx) + Math.abs(dz)).toBe(1);
    }
  });
});

describe("clampToBoard and turnRot", () => {
  it("keeps the highlight on the board", () => {
    expect(clampToBoard({ x: -3, z: 60 }, 66, 48)).toEqual({ x: 0, z: 47 });
    expect(clampToBoard({ x: 10, z: 10 }, 66, 48)).toEqual({ x: 10, z: 10 });
  });
  it("turns clockwise and wraps", () => {
    expect(turnRot(0)).toBe(1);
    expect(turnRot(3)).toBe(0);
  });
});

describe("strokeSquares", () => {
  const adjacent = (a: { x: number; z: number }, b: { x: number; z: number }) =>
    Math.abs(a.x - b.x) + Math.abs(a.z - b.z) === 1;

  it("is empty when the pointer hasn't left its square", () => {
    expect(strokeSquares({ x: 0, z: 0 }, { x: 0, z: 0 })).toEqual([]);
  });
  it("fills the gap of a fast diagonal drag with side-by-side squares", () => {
    const path = strokeSquares({ x: 0, z: 0 }, { x: 3, z: 2 });
    expect(path).toHaveLength(5);
    expect(adjacent({ x: 0, z: 0 }, path[0]!)).toBe(true);
    for (let i = 1; i < path.length; i++) expect(adjacent(path[i - 1]!, path[i]!)).toBe(true);
    expect(path.at(-1)).toEqual({ x: 3, z: 2 });
  });
  it("walks a straight line", () => {
    expect(strokeSquares({ x: 5, z: 5 }, { x: 2, z: 5 })).toEqual([{ x: 4, z: 5 }, { x: 3, z: 5 }, { x: 2, z: 5 }]);
  });
});

describe("tap", () => {
  it("previews first, then places on a second tap of the same square", () => {
    const first = tap({ armed: null }, { x: 3, z: 3 });
    expect(first).toEqual({ state: { armed: { x: 3, z: 3 } }, place: false });
    expect(tap(first.state, { x: 3, z: 3 }).place).toBe(true);
    expect(tap(first.state, { x: 4, z: 3 })).toEqual({ state: { armed: { x: 4, z: 3 } }, place: false });
  });
});

describe("nearestFit", () => {
  it("returns the start when it fits", () => {
    expect(nearestFit({ x: 5, z: 5 }, () => true, 10, 10)).toEqual({ x: 5, z: 5 });
  });
  it("finds the closest square that fits, nearer rings first", () => {
    const fits = (s: { x: number; z: number }) => s.x === 7 && s.z === 5;
    expect(nearestFit({ x: 5, z: 5 }, fits, 20, 20)).toEqual({ x: 7, z: 5 });
    const twoFit = (s: { x: number; z: number }) => (s.x === 6 && s.z === 5) || (s.x === 9 && s.z === 5);
    expect(nearestFit({ x: 5, z: 5 }, twoFit, 20, 20)).toEqual({ x: 6, z: 5 });
  });
  it("stays on the board and gives up beyond the search radius", () => {
    expect(nearestFit({ x: 0, z: 0 }, (s) => s.x === 1 && s.z === 1, 4, 4)).toEqual({ x: 1, z: 1 });
    expect(nearestFit({ x: 0, z: 0 }, () => false, 4, 4)).toBeNull();
    expect(nearestFit({ x: 0, z: 0 }, (s) => s.x === 30, 66, 48, 12)).toBeNull();
  });
});

describe("releaseTouch", () => {
  it("treats a finger that never left its square as a tap", () => {
    const armed = { armed: { x: 3, z: 3 } };
    expect(releaseTouch(armed, { x: 3, z: 3 }, false)).toEqual({ state: armed, place: true });
    expect(releaseTouch({ armed: null }, { x: 3, z: 3 }, false)).toEqual({ state: armed, place: false });
  });
  it("never builds when a drag ends, even back on the armed square", () => {
    const armed = { armed: { x: 3, z: 3 } };
    expect(releaseTouch(armed, { x: 3, z: 3 }, true)).toEqual({ state: armed, place: false });
    expect(releaseTouch(armed, { x: 5, z: 3 }, true)).toEqual({ state: { armed: { x: 5, z: 3 } }, place: false });
  });
});

describe("contextMenuIsBack", () => {
  it("is Back for a mouse right-click", () => {
    expect(contextMenuIsBack("mouse", false)).toBe(true);
    expect(contextMenuIsBack(undefined, false)).toBe(true);
  });
  it("is not Back for a long press on a touch screen", () => {
    expect(contextMenuIsBack("touch", false)).toBe(false);
    expect(contextMenuIsBack("mouse", true)).toBe(false);
  });
});

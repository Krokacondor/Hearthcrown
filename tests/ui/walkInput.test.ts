import { describe, expect, it } from "vitest";
import { heldToScreen, padEdges, readPad, walkKeyFor, type PadState } from "../../src/ui/walkInput";

const pad = (axes: number[], pressed: number[] = []) => ({
  axes,
  buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: pressed.includes(i) })),
});
const idle: PadState = { dx: 0, dz: 0, sprint: false, talk: false, turn: 0, zoom: 0 };

describe("walkKeyFor", () => {
  it("maps arrows and WASD to moves, Shift to sprint, Space and Enter to talk", () => {
    expect(walkKeyFor("ArrowUp")).toEqual({ kind: "move", dir: "up" });
    expect(walkKeyFor("a")).toEqual({ kind: "move", dir: "left" });
    expect(walkKeyFor("Shift")).toEqual({ kind: "sprint" });
    expect(walkKeyFor(" ")).toEqual({ kind: "talk" });
    expect(walkKeyFor("Enter")).toEqual({ kind: "talk" });
  });
  it("lets camera and menu keys pass through", () => {
    for (const k of ["q", "e", "b", "+", "Escape"]) expect(walkKeyFor(k)).toBeNull();
  });
});

describe("heldToScreen", () => {
  it("adds held arrows; opposite keys cancel", () => {
    expect(heldToScreen(new Set(["up", "right"]))).toEqual({ dx: 1, dz: -1 });
    expect(heldToScreen(new Set(["up", "down"]))).toEqual({ dx: 0, dz: 0 });
    expect(heldToScreen(new Set())).toEqual({ dx: 0, dz: 0 });
  });
});

describe("readPad", () => {
  it("ignores a stick inside the deadzone", () => {
    expect(readPad(pad([0.2, 0.1, 0, 0]))).toMatchObject({ dx: 0, dz: 0 });
  });
  it("gives full speed past the deadzone, with no slow walk", () => {
    expect(readPad(pad([0.5, 0, 0, 0]))).toMatchObject({ dx: 1, dz: 0 });
    const d = readPad(pad([0.5, 0.5, 0, 0]));
    expect(Math.hypot(d.dx, d.dz)).toBeCloseTo(1, 6);
    expect(d.dx).toBeCloseTo(Math.SQRT1_2, 6);
  });
  it("reads sprint, talk, camera turn and zoom", () => {
    expect(readPad(pad([0, 0, 0, 0], [7])).sprint).toBe(true);
    expect(readPad(pad([0, 0, 0, 0], [2])).sprint).toBe(true);
    expect(readPad(pad([0, 0, 0, 0], [0])).talk).toBe(true);
    expect(readPad(pad([0, 0, 0, 0], [4])).turn).toBe(-1);
    expect(readPad(pad([0, 0, 0, 0], [5])).turn).toBe(1);
    expect(readPad(pad([0, 0, 0, -0.9])).zoom).toBe(-1);
    expect(readPad(pad([0, 0, 0, 0.9])).zoom).toBe(1);
  });
  it("copes with a pad that has no buttons or axes", () => {
    expect(readPad({ axes: [], buttons: [] })).toEqual(idle);
  });
});

describe("padEdges", () => {
  it("fires talk, turn and zoom once per press", () => {
    const down = { ...idle, talk: true, turn: 1 as const, zoom: -1 as const };
    expect(padEdges(idle, down)).toEqual({ talk: true, turn: 1, zoom: -1 });
    expect(padEdges(down, down)).toEqual({ talk: false, turn: 0, zoom: 0 });
    expect(padEdges(down, idle)).toEqual({ talk: false, turn: 0, zoom: 0 });
  });
});

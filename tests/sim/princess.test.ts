import { describe, expect, it } from "vitest";
import balance from "../../src/data/balance.json";
import { createGame } from "../../src/sim/game";
import { isSolidSquare, stepPrincess } from "../../src/sim/princess";
import type { World } from "../../src/sim/world";

const DT = 1 / 60;
const W = balance.walk;

function setup(x: number, z: number) {
  const game = createGame(1);
  const world = game.world as World;
  world.princess.x = x;
  world.princess.z = z;
  const hold = (ix: number, iz: number, sprint = false) => { world.walkInput = { x: ix, z: iz, sprint }; };
  const steps = (n: number) => { for (let i = 0; i < n; i++) stepPrincess(game.town, world, DT); };
  return { game, world, hold, steps };
}

describe("the princess", () => {
  it("starts outside the castle door", () => {
    const { world } = setup(0, 0);
    const fresh = createGame(1).world;
    expect(fresh.princess).toMatchObject({ x: 34, z: 8, sprinting: false, height: 0 });
    expect(world.walkInput).toEqual({ x: 0, z: 0, sprint: false });
  });

  it("walks at walk speed and stops the instant input stops", () => {
    const { world, hold, steps } = setup(20.5, 12.5);
    hold(1, 0);
    steps(60);
    expect(world.princess.x).toBeCloseTo(20.5 + W.princessWalkSpeed, 5);
    expect(world.princess.facing).toEqual({ x: 1, z: 0 });
    hold(0, 0);
    const x = world.princess.x;
    steps(1);
    expect(world.princess.x).toBe(x);
  });

  it("moves diagonally at the same speed", () => {
    const { world, hold, steps } = setup(20.5, 12.5);
    hold(Math.SQRT1_2, Math.SQRT1_2);
    steps(60);
    expect(Math.hypot(world.princess.x - 20.5, world.princess.z - 12.5)).toBeCloseTo(W.princessWalkSpeed, 5);
  });

  it("sprints faster and hovers, and lands when she stops", () => {
    const { world, hold, steps } = setup(20.5, 12.5);
    hold(1, 0, true);
    steps(60);
    expect(world.princess.x).toBeCloseTo(20.5 + W.princessSprintSpeed, 5);
    expect(world.princess.sprinting).toBe(true);
    expect(world.princess.height).toBe(W.hoverHeight);
    hold(0, 0, true);
    steps(1);
    expect(world.princess.sprinting).toBe(false);
    expect(world.princess.height).toBe(0);
  });

  it("slides along a building instead of stopping dead", () => {
    const { world, hold, steps } = setup(20.2, 23.6);
    world.buildings.push({ id: 99, type: "cottage", x: 20, z: 22, rot: 0 });
    hold(Math.SQRT1_2, -Math.SQRT1_2);
    for (let i = 0; i < 20; i++) {
      steps(1);
      if (world.princess.x < 21.25) expect(world.princess.z).toBeGreaterThanOrEqual(23.25 - 1e-9);
    }
    expect(world.princess.x).toBeGreaterThan(20.2 + 0.5);
  });

  it("never leaves through a gate", () => {
    const { world, hold, steps } = setup(12.5, 20);
    hold(-1, 0, true);
    steps(600);
    expect(world.princess.x).toBeGreaterThanOrEqual(12 + W.princessRadius - 1e-9);
  });

  it("is stopped by the walls", () => {
    const { world, hold, steps } = setup(20.5, 4);
    hold(0, -1, true);
    steps(300);
    expect(world.princess.z).toBeGreaterThanOrEqual(3 + W.princessRadius - 1e-9);
  });

  it("is stopped by the statue and the quest board", () => {
    const a = setup(32, 20);
    a.hold(1, 0);
    a.steps(120);
    expect(a.world.princess.x).toBeCloseTo(34 - 0.35 - W.princessRadius, 5);
    const b = setup(35.5, 8.4);
    b.hold(0, -1);
    b.steps(120);
    expect(b.world.princess.z).toBeCloseTo(7.3 + 0.2 + W.princessRadius, 5);
  });

  it("walks a route when there is no input, and drops it when input comes", () => {
    const { world, hold, steps } = setup(20.5, 12.5);
    world.princess.route = [{ x: 22.5, z: 12.5 }, { x: 22.5, z: 14.5 }];
    steps(120);
    expect(world.princess.x).toBeCloseTo(22.5, 1);
    expect(world.princess.z).toBeCloseTo(14.5, 1);
    expect(world.princess.route).toEqual([]);
    world.princess.route = [{ x: 30.5, z: 14.5 }];
    hold(0, -1);
    steps(1);
    expect(world.princess.route).toEqual([]);
  });
});

describe("isSolidSquare", () => {
  it("is true for walls, outside and buildings, false for grass, roads and the plaza", () => {
    const { game, world } = setup(0, 0);
    expect(isSolidSquare(game.town, world, 12, 10)).toBe(true);
    expect(isSolidSquare(game.town, world, 5, 5)).toBe(true);
    expect(isSolidSquare(game.town, world, 31, 3)).toBe(true); // the castle
    expect(isSolidSquare(game.town, world, 20, 10)).toBe(false);
    expect(isSolidSquare(game.town, world, 20, 19)).toBe(false);
    expect(isSolidSquare(game.town, world, 12, 19)).toBe(false); // a gate
    expect(isSolidSquare(game.town, world, 33, 18)).toBe(false);
  });
});

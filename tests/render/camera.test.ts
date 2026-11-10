import { describe, expect, it } from "vitest";
import balance from "../../src/data/balance.json";
import { cameraPose, screenToWorld, startCamera, turn, TURN_STEPS, zoomBy } from "../../src/render/camera";

const cam = balance.camera;

describe("turn", () => {
  it("has eight 45-degree steps", () => expect(TURN_STEPS).toBe(8));

  it("turning right from step 7 wraps to 0, and left from 0 wraps to 7", () => {
    expect(turn({ step: 7, zoom: 2 }, 1).step).toBe(0);
    expect(turn({ step: 0, zoom: 2 }, -1).step).toBe(7);
  });

  it("keeps the zoom when turning", () => expect(turn({ step: 3, zoom: 1.7 }, 1)).toEqual({ step: 4, zoom: 1.7 }));
});

describe("zoomBy", () => {
  it("starts at the balance start zoom, facing step 0", () =>
    expect(startCamera()).toEqual({ step: 0, zoom: cam.startZoom }));

  it("-1 moves closer and +1 moves farther by one zoom step", () => {
    expect(zoomBy({ step: 0, zoom: 2 }, -1).zoom).toBeCloseTo(2 - cam.zoomStep);
    expect(zoomBy({ step: 0, zoom: 2 }, 1).zoom).toBeCloseTo(2 + cam.zoomStep);
  });

  it("zoom stays inside the balance limits", () => {
    let s = startCamera();
    for (let i = 0; i < 100; i++) s = zoomBy(s, -1);
    expect(s.zoom).toBe(cam.minZoom);
    for (let i = 0; i < 100; i++) s = zoomBy(s, 1);
    expect(s.zoom).toBe(cam.maxZoom);
  });
});

describe("cameraPose", () => {
  it("at step 0 the camera sits south of the target (+z) and looks at it", () => {
    const p = cameraPose({ x: 3, z: -2 }, { step: 0, zoom: 1 });
    expect(p.position[0]).toBeCloseTo(3);
    expect(p.position[1]).toBeCloseTo(cam.height);
    expect(p.position[2]).toBeCloseTo(-2 + cam.distance);
    expect(p.lookAt).toEqual([3, cam.lookHeight, -2]);
  });

  it("at step 2 (90 degrees) the camera sits east of the target (+x)", () => {
    const p = cameraPose({ x: 0, z: 0 }, { step: 2, zoom: 1 });
    expect(p.position[0]).toBeCloseTo(cam.distance);
    expect(p.position[2]).toBeCloseTo(0);
  });

  it("zoom scales the distance and height", () => {
    const p = cameraPose({ x: 0, z: 0 }, { step: 0, zoom: 2 });
    expect(p.position[1]).toBeCloseTo(cam.height * 2);
    expect(p.position[2]).toBeCloseTo(cam.distance * 2);
  });
});

describe("screenToWorld", () => {
  it("screen up walks north (-z) at step 0 and west (-x) at step 2", () => {
    const a = screenToWorld(0, -1, 0);
    expect(a.x).toBeCloseTo(0);
    expect(a.z).toBeCloseTo(-1);
    const b = screenToWorld(0, -1, 2);
    expect(b.x).toBeCloseTo(-1);
    expect(b.z).toBeCloseTo(0);
  });

  it("screen right walks east (+x) at step 0", () => {
    const r = screenToWorld(1, 0, 0);
    expect(r.x).toBeCloseTo(1);
    expect(r.z).toBeCloseTo(0);
  });

  it("keeps diagonal input at length 1", () => {
    const d = screenToWorld(1, -1, 1);
    expect(Math.hypot(d.x, d.z)).toBeCloseTo(1);
  });

  it("returns zero for no input", () => expect(screenToWorld(0, 0, 5)).toEqual({ x: 0, z: 0 }));
});

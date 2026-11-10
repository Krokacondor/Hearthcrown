// Pure camera math (no Three.js), so it can be tested without WebGL.
import balance from "../data/balance.json";

const cam = balance.camera;

/** The camera turns in eight 45-degree steps (PLAN.md 2.2). */
export const TURN_STEPS = 8;

export interface CameraState {
  /** 0..7; 0 looks north from the south. */
  readonly step: number;
  /** Distance multiplier: smaller is closer. */
  readonly zoom: number;
}

export function startCamera(): CameraState {
  return { step: 0, zoom: cam.startZoom };
}

const yaw = (step: number): number => (step * 2 * Math.PI) / TURN_STEPS;

export function turn(state: CameraState, dir: -1 | 1): CameraState {
  return { step: (state.step + dir + TURN_STEPS) % TURN_STEPS, zoom: state.zoom };
}

/** dir -1 moves closer, +1 moves farther, clamped to the balance limits. */
export function zoomBy(state: CameraState, dir: -1 | 1): CameraState {
  const raw = Math.round((state.zoom + dir * cam.zoomStep) * 1000) / 1000;
  return { step: state.step, zoom: Math.min(cam.maxZoom, Math.max(cam.minZoom, raw)) };
}

/** Where the camera sits and what it looks at, for a target on the ground. */
export function cameraPose(
  target: { x: number; z: number },
  state: CameraState,
): { position: [number, number, number]; lookAt: [number, number, number] } {
  const a = yaw(state.step);
  return {
    position: [
      target.x + Math.sin(a) * cam.distance * state.zoom,
      cam.height * state.zoom,
      target.z + Math.cos(a) * cam.distance * state.zoom,
    ],
    lookAt: [target.x, cam.lookHeight, target.z],
  };
}

/** Turns screen input (right = +dx, down = +dz) into a ground direction of length 1 or 0. */
export function screenToWorld(dx: number, dz: number, step: number): { x: number; z: number } {
  const len = Math.hypot(dx, dz);
  if (len === 0) return { x: 0, z: 0 };
  const a = yaw(step), c = Math.cos(a), s = Math.sin(a);
  const nx = dx / len, nz = dz / len;
  return { x: nx * c + nz * s, z: -nx * s + nz * c };
}

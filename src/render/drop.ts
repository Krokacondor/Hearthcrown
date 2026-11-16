// The paper drop when a building is placed: it falls onto the board tilted and settles flat (pure, no Three.js).

export const DROP_SECONDS = 0.42;
const START_HEIGHT = 0.7;
const START_TILT = 0.12;

/** Height above the board and tilt (radians) `t` seconds into the drop. */
export function dropPose(t: number): { y: number; tilt: number; done: boolean } {
  if (!(t < DROP_SECONDS)) return { y: 0, tilt: 0, done: true };
  const p = Math.max(0, t) / DROP_SECONDS;
  const left = Math.pow(1 - p, 3); // ease-out: quick fall, soft landing
  return { y: START_HEIGHT * left, tilt: START_TILT * left, done: false };
}

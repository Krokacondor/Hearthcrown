// Turns wheel and pinch gestures into whole zoom steps (+1 = farther, -1 = closer).

const PX_PER_WHEEL_STEP = 100;   // one mouse-wheel notch
const PX_PER_LINE = 16;
const PX_PER_PAGE = 400;
const PINCH_RATIO_PER_STEP = 1.15; // fingers 15% farther apart = one step closer

/**
 * Adds one wheel event to the carried-over distance and returns the whole steps it completes.
 * Trackpads send many tiny events, so they build up instead of each taking a full step.
 */
export function wheelSteps(carry: number, deltaY: number, deltaMode: number): { steps: number; carry: number } {
  const px = deltaY * (deltaMode === 1 ? PX_PER_LINE : deltaMode === 2 ? PX_PER_PAGE : 1);
  if (!Number.isFinite(px)) return { steps: 0, carry };
  const total = carry + px;
  const steps = Math.trunc(total / PX_PER_WHEEL_STEP) + 0;
  return { steps, carry: total - steps * PX_PER_WHEEL_STEP + 0 };
}

/** Zoom steps for a pinch, from the finger distance at its start to the distance now. */
export function pinchSteps(startDistance: number, currentDistance: number): number {
  if (!(startDistance > 0) || !(currentDistance > 0)) return 0;
  const steps = Math.log(currentDistance / startDistance) / Math.log(PINCH_RATIO_PER_STEP);
  return -Math.trunc(steps) + 0;
}

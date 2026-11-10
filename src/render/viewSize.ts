/** Above this, phones render more pixels than anyone can see and run hot. */
const MAX_PIXEL_RATIO = 2;

const side = (n: number): number => (Number.isFinite(n) ? Math.max(1, Math.round(n)) : 1);

/** Renderer size in CSS pixels plus a pixel ratio clamped to 1..2. Never 0 or NaN. */
export function viewSize(
  cssWidth: number,
  cssHeight: number,
  dpr: number,
): { width: number; height: number; pixelRatio: number } {
  const pixelRatio = Number.isFinite(dpr) && dpr > 0 ? Math.min(MAX_PIXEL_RATIO, Math.max(1, dpr)) : 1;
  return { width: side(cssWidth), height: side(cssHeight), pixelRatio };
}

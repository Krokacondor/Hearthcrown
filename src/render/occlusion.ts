// Pure geometry (no Three.js) for fading whatever stands between the camera and what the player is looking at.

export type Vec3 = [number, number, number];

/** True when the segment from `a` to `b` touches the axis-aligned box (slab method). */
export function segmentHitsBox(a: Vec3, b: Vec3, box: { min: Vec3; max: Vec3 }): boolean {
  let t0 = 0, t1 = 1;
  for (let i = 0; i < 3; i++) {
    const start = a[i]!, d = b[i]! - start, lo = box.min[i]!, hi = box.max[i]!;
    if (d === 0) {
      if (start < lo || start > hi) return false;
      continue;
    }
    let near = (lo - start) / d, far = (hi - start) / d;
    if (near > far) [near, far] = [far, near];
    t0 = Math.max(t0, near);
    t1 = Math.min(t1, far);
    if (t0 > t1) return false;
  }
  return true;
}

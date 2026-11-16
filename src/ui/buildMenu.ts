// The Build menu's items (PLAN.md 5; docs/design/build-menu-brief.md).
import type { BuildingDef } from "../sim/buildings";

export interface MenuItem {
  /** "road" or a building id. */
  id: string;
  name: string;
  /** Footprint in squares (a road piece is 2×2). */
  size: [number, number];
}

/** Road first, then every building marked for the Build menu, in data order. */
export function menuItems(defs: ReadonlyMap<string, BuildingDef>): MenuItem[] {
  // A road piece is one 2×2 road cell.
  const items: MenuItem[] = [{ id: "road", name: "Road", size: [2, 2] }];
  for (const def of defs.values()) if (def.inBuildMenu) items.push({ id: def.id, name: def.name, size: [...def.size] });
  return items;
}

/** Moves a list selection by one, wrapping at both ends. */
export function moveSelection(index: number, delta: -1 | 1, count: number): number {
  return count <= 0 ? 0 : (((index + delta) % count) + count) % count;
}

export interface TrayStatus {
  text: string;
  tone: "none" | "problem" | "success";
  canPlace: boolean;
}

/**
 * What the tray says. Right after a build (`justBuilt` names it) it celebrates, instead of reporting the
 * new building as in the way, until the highlight moves.
 */
export function trayStatus(check: { ok: true } | { ok: false; error: string }, justBuilt: string | null): TrayStatus {
  if (justBuilt) return { text: justBuilt === "Road" ? "Road laid" : `${justBuilt} built`, tone: "success", canPlace: check.ok };
  return check.ok ? { text: "", tone: "none", canPlace: true } : { text: check.error, tone: "problem", canPlace: false };
}

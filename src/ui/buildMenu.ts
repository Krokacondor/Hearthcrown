// The Build menu's items (PLAN.md 5; docs/design/build-menu-brief.md).
import type { BuildingDef } from "../sim/buildings";

export interface MenuItem {
  /** "road" or a building id. */
  id: string;
  name: string;
  /** Footprint for buildings; null for Road. */
  size: [number, number] | null;
}

/** Road first, then every building marked for the Build menu, in data order. */
export function menuItems(defs: ReadonlyMap<string, BuildingDef>): MenuItem[] {
  const items: MenuItem[] = [{ id: "road", name: "Road", size: null }];
  for (const def of defs.values()) if (def.inBuildMenu) items.push({ id: def.id, name: def.name, size: [...def.size] });
  return items;
}

/** Moves a list selection by one, wrapping at both ends. */
export function moveSelection(index: number, delta: -1 | 1, count: number): number {
  return count <= 0 ? 0 : (((index + delta) % count) + count) % count;
}

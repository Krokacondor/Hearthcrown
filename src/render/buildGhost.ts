// The placement preview (docs/design/build-menu-brief.md): a marigold outline on the squares under the
// highlight, green or red ground beneath, a see-through papercraft ghost, and ink arrows into the door.
import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { footprint } from "../sim/buildings";
import type { Rot, Square } from "../sim/townMap";
import type { Town } from "../sim/world";
import type { ArtTextures } from "./art/textures";
import { createPaperBuilding, placeOnFootprint } from "./papercraft";
import { palette } from "./palette";

export type GhostItem = { kind: "road" } | { kind: "building"; type: string; rot: Rot };

const FILL_Y = 0.035;
const LINE_Y = 0.045;
const GHOST_OPACITY = 0.55;
const FILL_OPACITY = 0.5;

export interface BuildGhost {
  group: THREE.Group;
  show(item: GhostItem, at: Square, fits: boolean): void;
  hide(): void;
  setResolution(width: number, height: number): void;
}

export function createBuildGhost(town: Town, art: ArtTextures, ink: LineMaterial): BuildGhost {
  const group = new THREE.Group();
  group.visible = false;
  const marigold = new LineMaterial({ color: palette.marigold, linewidth: 4.5 });

  const fillOk = new THREE.MeshBasicMaterial({ color: palette.leaf, transparent: true, opacity: FILL_OPACITY, depthWrite: false });
  const fillBad = new THREE.MeshBasicMaterial({ color: palette.curtain, transparent: true, opacity: FILL_OPACITY, depthWrite: false });
  const fills = new THREE.Group();
  const tileGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const outline = new LineSegments2(new LineSegmentsGeometry(), marigold);
  const arrows = new THREE.Group();
  group.add(fills, outline, arrows);

  const arrowGeo = new THREE.ShapeGeometry(new THREE.Shape([
    new THREE.Vector2(0, 0.32), new THREE.Vector2(0.22, 0), new THREE.Vector2(0.08, 0), new THREE.Vector2(0.08, -0.3),
    new THREE.Vector2(-0.08, -0.3), new THREE.Vector2(-0.08, 0), new THREE.Vector2(-0.22, 0),
  ]));
  arrowGeo.rotateX(-Math.PI / 2); // lie flat; the tip points toward -z
  const arrowMat = new THREE.MeshBasicMaterial({ color: palette.ink });

  const ghosts = new Map<string, THREE.Group>();
  let shownGhost: THREE.Group | null = null;
  const ghostFor = (type: string): THREE.Group | null => {
    const have = ghosts.get(type);
    if (have) return have;
    const def = town.defs.get(type);
    if (!def) return null;
    const g = createPaperBuilding(def, art, ink);
    for (const m of g.userData.materials as THREE.Material[]) {
      m.transparent = true;
      m.opacity = GHOST_OPACITY;
      m.depthWrite = false;
    }
    g.traverse((o) => { o.castShadow = false; if (o instanceof LineSegments2) o.visible = false; });
    ghosts.set(type, g);
    return g;
  };

  return {
    group,
    show(item, at, fits) {
      let cells: Square[];
      let doorFront: Square[] = [];
      if (shownGhost) { group.remove(shownGhost); shownGhost = null; }
      if (item.kind === "road") {
        cells = [at];
      } else {
        const def = town.defs.get(item.type);
        if (!def) { group.visible = false; return; }
        ({ cells, doorFront } = footprint(def, at.x, at.z, item.rot));
        const g = ghostFor(item.type);
        if (g) {
          placeOnFootprint(g, def, at.x, at.z, item.rot);
          group.add(g);
          shownGhost = g;
        }
      }

      fills.clear();
      const fill = fits ? fillOk : fillBad;
      for (const c of cells) {
        const m = new THREE.Mesh(tileGeo, fill);
        m.position.set(c.x + 0.5, FILL_Y, c.z + 0.5);
        fills.add(m);
      }

      const keys = new Set(cells.map((c) => `${c.x},${c.z}`));
      const seg: number[] = [];
      for (const c of cells) {
        const { x, z } = c, y = LINE_Y;
        if (!keys.has(`${x},${z - 1}`)) seg.push(x, y, z, x + 1, y, z);
        if (!keys.has(`${x},${z + 1}`)) seg.push(x, y, z + 1, x + 1, y, z + 1);
        if (!keys.has(`${x - 1},${z}`)) seg.push(x, y, z, x, y, z + 1);
        if (!keys.has(`${x + 1},${z}`)) seg.push(x + 1, y, z, x + 1, y, z + 1);
      }
      outline.geometry.dispose();
      const geo = new LineSegmentsGeometry();
      geo.setPositions(seg);
      outline.geometry = geo;

      arrows.clear();
      for (const f of doorFront) {
        // Point from the road square into the door: toward the neighbouring footprint cell.
        const into = cells.find((c) => Math.abs(c.x - f.x) + Math.abs(c.z - f.z) === 1);
        if (!into) continue;
        const a = new THREE.Mesh(arrowGeo, arrowMat);
        a.position.set(f.x + 0.5, FILL_Y + 0.004, f.z + 0.5);
        a.rotation.y = Math.atan2(-(into.x - f.x), -(into.z - f.z));
        arrows.add(a);
      }
      group.visible = true;
    },
    hide() {
      group.visible = false;
    },
    setResolution(width, height) {
      marigold.resolution.set(width, height);
    },
  };
}

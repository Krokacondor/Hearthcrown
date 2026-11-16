import * as THREE from "three";
import type { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import type { Rect } from "../sim/townMap";
import type { ArtTextures } from "./art/textures";
import { palette } from "./palette";

const BASE_DEPTH = 1.2;
const BASE_MARGIN = 0.3;
const FLOOR_SIZE = 400;
/** The grass tile drawing covers this many squares. */
const GRASS_TILE_SQUARES = 4;

export interface Ground {
  readonly group: THREE.Group;
  /** The square grid over the town, shown only while building. */
  setGridVisible(on: boolean): void;
}

function canvas2d(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D | null] {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")];
}

/** Stage-floor boards the diorama stands on. One tile of the repeating texture. */
function paintFloor(): HTMLCanvasElement {
  const [canvas, ctx] = canvas2d(256, 256);
  if (!ctx) return canvas;
  ctx.fillStyle = palette.stageFloor; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = palette.stagePlank; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let y = 0; y <= 256; y += 64) { ctx.moveTo(0, y); ctx.lineTo(256, y); }
  for (const [x, y] of [[70, 0], [200, 64], [30, 128], [150, 192]] as const) { ctx.moveTo(x, y); ctx.lineTo(x, y + 64); }
  ctx.stroke();
  return canvas;
}

function inkLines(positions: number[], ink: LineMaterial): LineSegments2 {
  const g = new LineSegmentsGeometry();
  g.setPositions(positions);
  return new LineSegments2(g, ink);
}

/**
 * The diorama: grass (art `tile.grass`) on an ink-edged wooden board standing on a stage floor.
 * The board's corner is at the origin, so square (x, z) covers world [x, x+1] x [z, z+1].
 * The build grid covers `gridArea` (the inside of the current walls).
 */
export function createGround(width: number, depth: number, gridArea: Rect, maxAnisotropy: number,
  art: ArtTextures, ink: LineMaterial): Ground {
  const group = new THREE.Group();
  const cx = width / 2, cz = depth / 2;

  const grassMat = new THREE.MeshLambertMaterial({ color: palette.grass });
  void art.apply(grassMat, "tile.grass", [width / GRASS_TILE_SQUARES, depth / GRASS_TILE_SQUARES]);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(cx, 0, cz);
  grass.receiveShadow = true;
  const y = 0.005;
  const grassEdge = inkLines([0, y, 0, width, y, 0, width, y, 0, width, y, depth, width, y, depth, 0, y, depth, 0, y, depth, 0, y, 0], ink);

  const baseGeo = new THREE.BoxGeometry(width + 2 * BASE_MARGIN, BASE_DEPTH, depth + 2 * BASE_MARGIN);
  const base = new THREE.Mesh(baseGeo, new THREE.MeshLambertMaterial({ color: palette.base }));
  base.position.set(cx, -BASE_DEPTH / 2 - 0.01, cz);
  base.castShadow = true;
  base.receiveShadow = true;
  const baseEdge = inkLines(Array.from(new THREE.EdgesGeometry(baseGeo).getAttribute("position").array), ink);
  baseEdge.position.copy(base.position);

  const floorCanvas = paintFloor();
  const floorTex = new THREE.CanvasTexture(floorCanvas);
  floorTex.colorSpace = THREE.SRGBColorSpace;
  floorTex.anisotropy = maxAnisotropy;
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(FLOOR_SIZE / 4, FLOOR_SIZE / 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE), new THREE.MeshLambertMaterial({ map: floorTex }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, -BASE_DEPTH - 0.02, cz);
  floor.receiveShadow = true;

  // Build grid: thin lines on every square edge inside the walls.
  const gy = 0.03, pts: number[] = [];
  const { x0, z0, x1, z1 } = { x0: gridArea.x0 + 1, z0: gridArea.z0 + 1, x1: gridArea.x1, z1: gridArea.z1 };
  for (let x = x0; x <= x1; x++) pts.push(x, gy, z0, x, gy, z1);
  for (let z = z0; z <= z1; z++) pts.push(x0, gy, z, x1, gy, z);
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const grid = new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: palette.gridLine, transparent: true, opacity: 0.9 }));
  grid.visible = false;

  group.add(floor, base, baseEdge, grass, grassEdge, grid);
  return {
    group,
    setGridVisible(on) {
      grid.visible = on;
    },
  };
}

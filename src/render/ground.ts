import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { palette } from "./palette";

const TEX_PX_PER_TILE = 64;
const BASE_DEPTH = 1.2;
const BASE_MARGIN = 0.3;
const INK_WIDTH_PX = 3.5;
const FLOOR_SIZE = 240;

export interface Ground {
  readonly group: THREE.Group;
  /** Ink lines are sized in CSS pixels, so they need the view size. */
  setResolution(width: number, height: number): void;
}

function canvas2d(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D | null] {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")];
}

/** Grass, a faint tile grid and grass tufts at 64 px per tile. */
function paintGrass(widthTiles: number, depthTiles: number): HTMLCanvasElement {
  const px = TEX_PX_PER_TILE, w = widthTiles * px, h = depthTiles * px;
  const [canvas, ctx] = canvas2d(w, h);
  if (!ctx) return canvas;
  ctx.fillStyle = palette.grass; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = palette.gridLine; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= widthTiles; i++) { ctx.moveTo(i * px, 0); ctx.lineTo(i * px, h); }
  for (let j = 0; j <= depthTiles; j++) { ctx.moveTo(0, j * px); ctx.lineTo(w, j * px); }
  ctx.stroke();
  // Fixed-seed scatter so the tufts never shift between loads.
  let s = 7;
  const next = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296;
  ctx.strokeStyle = palette.tuft; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i < widthTiles * depthTiles * 0.2; i++) {
    const x = next() * w, y = next() * h;
    ctx.moveTo(x - 7, y + 6); ctx.lineTo(x, y - 6); ctx.lineTo(x + 7, y + 6);
  }
  ctx.stroke();
  return canvas;
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

function srgbTexture(source: HTMLCanvasElement, anisotropy: number): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(source);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}

/** The diorama: grass centred on the origin, on an ink-edged wooden board, standing on a stage floor. */
export function createGround(widthTiles: number, depthTiles: number, maxAnisotropy: number): Ground {
  const group = new THREE.Group();
  const ink = new LineMaterial({ color: palette.ink, linewidth: INK_WIDTH_PX });
  const inkLines = (positions: number[]): LineSegments2 => {
    const g = new LineSegmentsGeometry();
    g.setPositions(positions);
    return new LineSegments2(g, ink);
  };

  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(widthTiles, depthTiles),
    new THREE.MeshLambertMaterial({ map: srgbTexture(paintGrass(widthTiles, depthTiles), maxAnisotropy) }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  const hw = widthTiles / 2, hd = depthTiles / 2, y = 0.005;
  const grassEdge = inkLines([
    -hw, y, -hd, hw, y, -hd,  hw, y, -hd, hw, y, hd,
    hw, y, hd, -hw, y, hd,  -hw, y, hd, -hw, y, -hd,
  ]);

  const baseGeo = new THREE.BoxGeometry(widthTiles + 2 * BASE_MARGIN, BASE_DEPTH, depthTiles + 2 * BASE_MARGIN);
  const base = new THREE.Mesh(baseGeo, new THREE.MeshLambertMaterial({ color: palette.base }));
  base.position.y = -BASE_DEPTH / 2 - 0.01;
  base.castShadow = true;
  base.receiveShadow = true;
  const baseEdge = inkLines(Array.from(new THREE.EdgesGeometry(baseGeo).getAttribute("position").array));
  baseEdge.position.copy(base.position);

  const floorTex = srgbTexture(paintFloor(), maxAnisotropy);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(FLOOR_SIZE / 4, FLOOR_SIZE / 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE), new THREE.MeshLambertMaterial({ map: floorTex }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -BASE_DEPTH - 0.02;
  floor.receiveShadow = true;

  group.add(floor, base, baseEdge, grass, grassEdge);
  return {
    group,
    setResolution(width, height) {
      ink.resolution.set(width, height);
    },
  };
}

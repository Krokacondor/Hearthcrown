import * as THREE from "three";
import { palette } from "./palette";

const TEX_PX_PER_TILE = 64;
const BASE_DEPTH = 1.2;
const BASE_MARGIN = 0.3;

/** Paints grass, a faint tile grid and grass tufts at 64 px per tile. */
function paintGrass(widthTiles: number, depthTiles: number): HTMLCanvasElement {
  const px = TEX_PX_PER_TILE, w = widthTiles * px, h = depthTiles * px;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
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

/** The diorama: a grass plane centred on the origin, on a wooden base with ink edges. */
export function createGround(widthTiles: number, depthTiles: number, maxAnisotropy: number): THREE.Group {
  const group = new THREE.Group();

  const texture = new THREE.CanvasTexture(paintGrass(widthTiles, depthTiles));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(widthTiles, depthTiles), new THREE.MeshLambertMaterial({ map: texture }));
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  group.add(grass);

  const baseGeo = new THREE.BoxGeometry(widthTiles + 2 * BASE_MARGIN, BASE_DEPTH, depthTiles + 2 * BASE_MARGIN);
  const base = new THREE.Mesh(baseGeo, new THREE.MeshLambertMaterial({ color: palette.base }));
  base.position.y = -BASE_DEPTH / 2 - 0.01;
  base.receiveShadow = true;
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(baseGeo), new THREE.LineBasicMaterial({ color: palette.ink }));
  edges.position.copy(base.position);
  group.add(base, edges);

  return group;
}

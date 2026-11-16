// Papercraft buildings (PLAN.md 2.2): a box and a gable roof whose faces are flat drawn panels (2.1).
import * as THREE from "three";
import type { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import type { BuildingDef } from "../sim/buildings";
import { ROOF_OVERHANG } from "./art/builtins";
import type { ArtTextures } from "./art/textures";

/** Walls stand this far in from the footprint edge, so neighbours never touch. */
const INSET = 0.07;

const panelMaterial = (): THREE.MeshLambertMaterial =>
  new THREE.MeshLambertMaterial({ color: 0xe9dcc6, side: THREE.DoubleSide });

/**
 * A building in its own frame: footprint centred on the origin, door facing +z, standing on y = 0.
 * Every material is listed in `userData.materials` so callers can fade or tint it.
 */
export function createPaperBuilding(def: BuildingDef, art: ArtTextures, ink: LineMaterial): THREE.Group {
  const [w, d] = def.size;
  const W = w - 2 * INSET, D = d - 2 * INSET, H = def.height, R = def.roofRise;
  const group = new THREE.Group();
  const materials: THREE.Material[] = [];
  const mat = (face: string): THREE.MeshLambertMaterial => {
    const m = panelMaterial();
    void art.apply(m, `${def.art}.${face}`);
    materials.push(m);
    return m;
  };
  const mesh = (geo: THREE.BufferGeometry, m: THREE.Material): THREE.Mesh => {
    const x = new THREE.Mesh(geo, m);
    x.castShadow = x.receiveShadow = true;
    group.add(x);
    return x;
  };

  const front = mesh(new THREE.PlaneGeometry(W, H), mat("front"));
  front.position.set(0, H / 2, D / 2);
  const back = mesh(new THREE.PlaneGeometry(W, H), mat("back"));
  back.position.set(0, H / 2, -D / 2);
  back.rotation.y = Math.PI;
  const sideMat = mat("side");
  for (const sgn of [1, -1]) {
    const side = mesh(new THREE.PlaneGeometry(D, H), sideMat);
    side.position.set((sgn * W) / 2, H / 2, 0);
    side.rotation.y = (sgn * Math.PI) / 2;
  }

  // Gables front and back: a triangle whose UVs map the whole gable panel.
  const tri = new THREE.BufferGeometry();
  tri.setAttribute("position", new THREE.Float32BufferAttribute([-W / 2, 0, 0, W / 2, 0, 0, 0, R, 0], 3));
  tri.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  tri.computeVertexNormals();
  const gableMat = mat("gable");
  const g1 = mesh(tri, gableMat);
  g1.position.set(0, H, D / 2 + 0.002);
  const g2 = mesh(tri, gableMat);
  g2.position.set(0, H, -D / 2 - 0.002);
  g2.rotation.y = Math.PI;

  // Two roof slopes running front to back, overhanging the walls a little.
  const run = W / 2 + ROOF_OVERHANG, drop = (R * run) / (W / 2), L = Math.hypot(run, drop);
  const roofMat = mat("roof");
  for (const sgn of [1, -1]) {
    const slope = mesh(new THREE.PlaneGeometry(D + 2 * ROOF_OVERHANG, L), roofMat);
    const xA = new THREE.Vector3(0, 0, -sgn);
    const yA = new THREE.Vector3(-sgn * run, drop, 0).normalize();
    const zA = new THREE.Vector3().crossVectors(xA, yA);
    slope.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, yA, zA));
    slope.position.set((sgn * run) / 2, H + R - drop / 2, 0);
  }

  // Ink: the wall box edges and the roof outline.
  const x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2, ro = ROOF_OVERHANG;
  const eaveY = H + R - drop, ridge = H + R, zr0 = z0 - ro, zr1 = z1 + ro;
  const box = [
    x0, 0, z1, x1, 0, z1, x1, 0, z1, x1, H, z1, x1, H, z1, x0, H, z1, x0, H, z1, x0, 0, z1,
    x0, 0, z0, x1, 0, z0, x1, 0, z0, x1, H, z0, x0, H, z0, x0, 0, z0,
    x0, 0, z0, x0, 0, z1, x1, 0, z0, x1, 0, z1,
  ];
  const roof = [
    -run, eaveY, zr1, 0, ridge, zr1, 0, ridge, zr1, run, eaveY, zr1,
    -run, eaveY, zr0, 0, ridge, zr0, 0, ridge, zr0, run, eaveY, zr0,
    0, ridge, zr0, 0, ridge, zr1, -run, eaveY, zr0, -run, eaveY, zr1, run, eaveY, zr0, run, eaveY, zr1,
  ];
  const lines = new LineSegmentsGeometry();
  lines.setPositions([...box, ...roof]);
  group.add(new LineSegments2(lines, ink));

  group.userData.materials = materials;
  return group;
}

/** Where a placed building's group goes: the centre of its turned footprint, turned to face its door. */
export function placeOnFootprint(group: THREE.Object3D, def: BuildingDef, x: number, z: number, rot: number): void {
  const [w, d] = def.size;
  const [tw, td] = rot % 2 === 0 ? [w, d] : [d, w];
  group.position.set(x + tw / 2, 0, z + td / 2);
  // rot 1 turns the door from south (+z) to west (-x): a quarter turn clockwise seen from above.
  group.rotation.y = (-rot * Math.PI) / 2;
}

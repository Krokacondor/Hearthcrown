// The walled town (PLAN.md 2.2, 3): walls, gatehouses, plaza, roads, the statue and the quest board,
// plus the placed papercraft buildings, all drawn from the map and the world state.
import * as THREE from "three";
import type { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { squareKey, type Rect, type Square } from "../sim/townMap";
import type { PlacedBuilding, Town } from "../sim/world";
import { drawBuiltin } from "./art/builtins";
import type { ArtTextures } from "./art/textures";
import { dropPose } from "./drop";
import { createPaperBuilding, placeOnFootprint } from "./papercraft";
import { palette } from "./palette";

const WALL_H = 1.2;
const WALL_T = 0.8;
const TOWER = 1.4;
const TOWER_H = 1.9;
const GATE_TOWER_H = 2.3;
const ROAD_Y = 0.012;
const INK_Y = 0.02;

/** Something that can stand between the camera and the focus point, with the materials to fade. */
export interface Occluder {
  object: THREE.Object3D;
  box: THREE.Box3;
  materials: THREE.Material[];
  ink: THREE.Object3D[];
  opacity: number;
}

export interface TownView {
  group: THREE.Group;
  /** Everything that can fade: walls, gatehouses and buildings. */
  occluders(): Occluder[];
  /** `drop` gives newly added buildings the paper drop onto the board. */
  sync(roads: readonly Square[], buildings: readonly PlacedBuilding[], drop: boolean): void;
  /** Advances drops in progress. */
  update(dt: number): void;
  /** Turns the cut-out props to face the camera. */
  faceCamera(yaw: number): void;
}

function inkLines(positions: number[], ink: LineMaterial): LineSegments2 {
  const g = new LineSegmentsGeometry();
  g.setPositions(positions);
  return new LineSegments2(g, ink);
}

function boxEdges(geo: THREE.BoxGeometry): number[] {
  return Array.from(new THREE.EdgesGeometry(geo).getAttribute("position").array);
}

/** A flat ground plane covering [x0, x1+1] x [z0, z1+1]. */
function flatRect(r: Rect, y: number, material: THREE.Material): THREE.Mesh {
  const w = r.x1 - r.x0 + 1, d = r.z1 - r.z0 + 1;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  m.rotation.x = -Math.PI / 2;
  m.position.set(r.x0 + w / 2, y, r.z0 + d / 2);
  m.receiveShadow = true;
  return m;
}

/** Ink along every edge of a set of squares that doesn't touch another square in the set. */
function outlineOf(squares: Set<string>, y: number): number[] {
  const out: number[] = [];
  for (const key of squares) {
    const [x, z] = key.split(",").map(Number) as [number, number];
    if (!squares.has(`${x},${z - 1}`)) out.push(x, y, z, x + 1, y, z);
    if (!squares.has(`${x},${z + 1}`)) out.push(x, y, z + 1, x + 1, y, z + 1);
    if (!squares.has(`${x - 1},${z}`)) out.push(x, y, z, x, y, z + 1);
    if (!squares.has(`${x + 1},${z}`)) out.push(x + 1, y, z, x + 1, y, z + 1);
  }
  return out;
}

export function createTownView(town: Town, stage: number, art: ArtTextures, ink: LineMaterial): TownView {
  const { map } = town;
  const group = new THREE.Group();
  const occluders: Occluder[] = [];
  const st = map.stages[stage];
  if (!st) throw new Error(`No wall stage ${stage}`);

  const addOccluder = (object: THREE.Object3D, materials: THREE.Material[], inkObjs: THREE.Object3D[]): void => {
    object.updateMatrixWorld(true);
    occluders.push({ object, box: new THREE.Box3().setFromObject(object), materials, ink: inkObjs, opacity: 1 });
  };

  // ---- Walls: one stone box per straight run, broken at the gates, with towers at the corners and gates.
  const stoneSide = (): THREE.MeshLambertMaterial => new THREE.MeshLambertMaterial({ color: palette.stone });
  const addBlock = (cx: number, cz: number, sx: number, sy: number, sz: number, y0 = 0): void => {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const m = stoneSide();
    void art.apply(m, "wall.stone", [Math.max(sx, sz), sy]);
    const block = new THREE.Mesh(geo, m);
    block.position.set(cx, y0 + sy / 2, cz);
    block.castShadow = block.receiveShadow = true;
    const edges = inkLines(boxEdges(geo), ink);
    edges.position.copy(block.position);
    group.add(block, edges);
    addOccluder(block, [m], [edges]);
  };

  const w = st.walls;
  const gateKeys = new Set(st.gates.flatMap((g) => g.squares.map(squareKey)));
  // Each side as a list of squares, split into runs between gates.
  const sides: Square[][] = [
    Array.from({ length: w.x1 - w.x0 + 1 }, (_, i) => ({ x: w.x0 + i, z: w.z0 })),
    Array.from({ length: w.x1 - w.x0 + 1 }, (_, i) => ({ x: w.x0 + i, z: w.z1 })),
    Array.from({ length: w.z1 - w.z0 - 1 }, (_, i) => ({ x: w.x0, z: w.z0 + 1 + i })),
    Array.from({ length: w.z1 - w.z0 - 1 }, (_, i) => ({ x: w.x1, z: w.z0 + 1 + i })),
  ];
  for (const side of sides) {
    let run: Square[] = [];
    const flush = (): void => {
      if (run.length === 0) return;
      const xs = run.map((s) => s.x), zs = run.map((s) => s.z);
      const x0 = Math.min(...xs), x1 = Math.max(...xs) + 1, z0 = Math.min(...zs), z1 = Math.max(...zs) + 1;
      const alongX = x1 - x0 >= z1 - z0;
      addBlock((x0 + x1) / 2, (z0 + z1) / 2, alongX ? x1 - x0 : WALL_T, WALL_H, alongX ? WALL_T : z1 - z0);
      run = [];
    };
    for (const s of side) {
      if (gateKeys.has(squareKey(s))) flush();
      else run.push(s);
    }
    flush();
  }
  for (const [x, z] of [[w.x0, w.z0], [w.x1, w.z0], [w.x0, w.z1], [w.x1, w.z1]] as const) {
    addBlock(x + 0.5, z + 0.5, TOWER, TOWER_H, TOWER);
  }
  // Gatehouses: a tower each side of the gate and a lintel over the passage.
  for (const g of st.gates) {
    const alongX = g.z === w.z0 || g.z === w.z1;
    const [dx, dz] = alongX ? [1, 0] : [0, 1];
    // The opening's centre, so a wide gate gets its towers either side of the whole opening.
    const cx = g.x + 0.5 + (dx * (g.width - 1)) / 2, cz = g.z + 0.5 + (dz * (g.width - 1)) / 2;
    const reach = g.width / 2 + 0.55;
    for (const sgn of [-1, 1]) addBlock(cx + sgn * dx * reach, cz + sgn * dz * reach, TOWER * 0.85, GATE_TOWER_H, TOWER * 0.85);
    const span = g.width + 0.4;
    addBlock(cx, cz, alongX ? span : WALL_T + 0.2, 0.55, alongX ? WALL_T + 0.2 : span, GATE_TOWER_H - 0.85);
  }

  // ---- Plaza and dirt roads (fixed).
  const plazaMat = new THREE.MeshLambertMaterial({ color: "#ddd2bf" });
  const plazaW = map.plaza.x1 - map.plaza.x0 + 1, plazaD = map.plaza.z1 - map.plaza.z0 + 1;
  void art.apply(plazaMat, "tile.plaza", [plazaW, plazaD]);
  group.add(flatRect(map.plaza, ROAD_Y, plazaMat));

  // One tile shape and one material per road surface, shared by every rebuild.
  const tileGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const surfaceMats = new Map<string, THREE.MeshLambertMaterial>();
  const surfaceMat = (id: string, colour: string): THREE.MeshLambertMaterial => {
    let m = surfaceMats.get(id);
    if (!m) {
      m = new THREE.MeshLambertMaterial({ color: colour });
      void art.apply(m, id);
      surfaceMats.set(id, m);
    }
    return m;
  };
  const squaresMesh = (squares: readonly Square[], id: string, colour: string): THREE.InstancedMesh | null => {
    if (squares.length === 0) return null;
    const mesh = new THREE.InstancedMesh(tileGeo, surfaceMat(id, colour), squares.length);
    const m4 = new THREE.Matrix4();
    squares.forEach((s, i) => mesh.setMatrixAt(i, m4.makeTranslation(s.x + 0.5, ROAD_Y, s.z + 0.5)));
    mesh.receiveShadow = true;
    return mesh;
  };
  const dirt = squaresMesh(map.dirtRoads, "tile.road.dirt", palette.dirt);
  if (dirt) group.add(dirt, inkLines(outlineOf(new Set(map.dirtRoads.map(squareKey)), INK_Y), ink));

  // ---- Cut-out props: the statue in the plaza and the quest board in front of the castle.
  const cutouts: THREE.Mesh[] = [];
  const addCutout = (id: string, x: number, z: number, height: number): void => {
    const d = drawBuiltin(id);
    const width = (height * d.width) / d.height;
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, opacity: 0 });
    // Hidden (opacity 0) until its art arrives, so a blank card never shows.
    art.apply(mat, id).then(() => { mat.opacity = 1; }, () => {});
    const geo = new THREE.PlaneGeometry(width, height);
    geo.translate(0, height / 2, 0);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, 0, z);
    m.castShadow = true;
    group.add(m);
    cutouts.push(m);
  };
  addCutout("prop.statue", map.statue.x, map.statue.z, 1.6);
  addCutout("prop.questBoard", map.questBoard.x + 0.5, map.questBoard.z + 0.5, 0.9);

  // ---- Dynamic: roads and buildings.
  const dynamic = new THREE.Group();
  group.add(dynamic);
  const buildingMeshes = new Map<number, { object: THREE.Group; key: string }>();
  let roadObjs: THREE.Object3D[] = [];
  let lastRoads = "";
  const drops: { object: THREE.Group; t: number }[] = [];

  return {
    group,
    occluders: () => occluders,
    sync(roads, buildings, drop) {
      const roadKey = roads.map(squareKey).sort().join(";");
      if (roadKey !== lastRoads) {
        lastRoads = roadKey;
        for (const o of roadObjs) {
          dynamic.remove(o);
          // The tile shape and material are shared; only the instance buffer and ink lines are per rebuild.
          if (o instanceof THREE.InstancedMesh) o.dispose();
          else if (o instanceof LineSegments2) o.geometry.dispose();
        }
        const network = [...roads, ...st.gates.flatMap((g) => g.squares)];
        const cobble = squaresMesh(network, "tile.road.cobble", palette.cobble);
        // Ink only where the road meets grass: the plaza counts as road for the outline.
        const all = new Set(network.map(squareKey));
        for (let z = map.plaza.z0; z <= map.plaza.z1; z++) for (let x = map.plaza.x0; x <= map.plaza.x1; x++) all.add(`${x},${z}`);
        const edges = inkLines(outlineOf(all, INK_Y), ink);
        roadObjs = cobble ? [cobble, edges] : [edges];
        dynamic.add(...roadObjs);
      }

      const seen = new Set<number>();
      for (const b of buildings) {
        seen.add(b.id);
        const key = `${b.type}@${b.x},${b.z},${b.rot}`;
        const have = buildingMeshes.get(b.id);
        if (have?.key === key) continue;
        if (have) removeBuilding(b.id);
        const def = town.defs.get(b.type);
        if (!def) continue;
        const object = createPaperBuilding(def, art, ink);
        placeOnFootprint(object, def, b.x, b.z, b.rot);
        dynamic.add(object);
        buildingMeshes.set(b.id, { object, key });
        const lines = object.children.filter((c) => c instanceof LineSegments2);
        addOccluder(object, object.userData.materials as THREE.Material[], lines);
        if (drop) {
          const pose = dropPose(0);
          object.position.y = pose.y;
          object.rotation.x = pose.tilt;
          drops.push({ object, t: 0 });
        }
      }
      for (const id of [...buildingMeshes.keys()]) if (!seen.has(id)) removeBuilding(id);
    },
    update(dt) {
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]!;
        d.t += dt;
        const pose = dropPose(d.t);
        d.object.position.y = pose.y;
        d.object.rotation.x = pose.tilt;
        if (pose.done) drops.splice(i, 1);
      }
    },
    faceCamera(yaw) {
      for (const c of cutouts) c.rotation.y = yaw;
    },
  };

  function removeBuilding(id: number): void {
    const have = buildingMeshes.get(id);
    if (!have) return;
    dynamic.remove(have.object);
    // Textures are shared through the art cache, so only geometry and materials are freed here.
    have.object.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof LineSegments2) o.geometry.dispose();
    });
    for (const m of have.object.userData.materials as THREE.Material[]) m.dispose();
    buildingMeshes.delete(id);
    const i = occluders.findIndex((o) => o.object === have.object);
    if (i >= 0) occluders.splice(i, 1);
  }
}


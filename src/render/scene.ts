import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import balance from "../data/balance.json";
import type { Square } from "../sim/townMap";
import type { Town, World } from "../sim/world";
import type { ArtRegistry } from "./art/registry";
import { createArtTextures } from "./art/textures";
import { cameraPose, TURN_STEPS, type CameraState } from "./camera";
import { createBuildGhost, type GhostItem } from "./buildGhost";
import { createGround } from "./ground";
import { segmentHitsBox } from "./occlusion";
import { palette } from "./palette";
import { createPeopleView } from "./people";
import { createTownView } from "./town";

const INK_WIDTH_PX = 3.5;
/** Opacity of a building, wall or gatehouse that stands in front of what the player is looking at. */
const FADED = 0.3;
/** Height above the ground of the points the camera must see when deciding what blocks the view. */
const FOCUS_Y = 0.05;

/** A focus point inside a building's own box (the ghost overlapping it) doesn't make it fade. */
const insideBox = (p: [number, number, number], b: { min: number[]; max: number[] }): boolean =>
  p.every((v, i) => v >= b.min[i]! && v <= b.max[i]!);

export interface DioramaView {
  setSize(width: number, height: number, pixelRatio: number): void;
  setCamera(target: { x: number; z: number }, state: CameraState): void;
  /** Adds and removes roads and buildings to match the world. */
  syncTown(world: Readonly<World>): void;
  setGridVisible(on: boolean): void;
  /** Moves the paper people to match the world; `marked` gets the marigold marker (held still while talking). */
  syncPeople(world: Readonly<World>, marked: number | null, talking: boolean): void;
  /** The person under a screen point (0 is the princess), or null. */
  pickPerson(clientX: number, clientY: number): number | null;
  /** A world point on screen, in CSS pixels from the canvas's top-left; null when behind the camera. */
  screenOf(x: number, y: number, z: number): { x: number; y: number } | null;
  /** The point just above someone's head (0 is the princess). */
  headOf(id: number): { x: number; y: number; z: number } | null;
  /** Fades whatever stands between the camera and any part of these squares; null fades nothing. */
  setFocus(squares: readonly Square[] | null): void;
  /** The board square under a screen point, or null off the board. */
  pickSquare(clientX: number, clientY: number): Square | null;
  /** The placement preview at a square (green when it fits, red when not). */
  showGhost(item: GhostItem, at: Square, fits: boolean): void;
  hideGhost(): void;
  /** GPU objects alive right now (dev checks for leaks). */
  memory(): { geometries: number; textures: number };
  render(dt: number): void;
}

/** Builds the diorama scene inside `container`. Returns null when the browser can't do WebGL. */
export function createDiorama(container: HTMLElement, town: Town, registry: ArtRegistry): DioramaView | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch {
    return null;
  }
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.append(renderer.domElement);

  const { width, depth } = town.map;
  const stage = town.map.stages[0]!;
  const cx = width / 2, cz = depth / 2;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.sky);
  const art = createArtTextures(registry, renderer.capabilities.getMaxAnisotropy());
  const ink = new LineMaterial({ color: palette.ink, linewidth: INK_WIDTH_PX });

  const ground = createGround(width, depth, stage.walls, renderer.capabilities.getMaxAnisotropy(), art, ink);
  const townView = createTownView(town, 0, art, ink);
  const ghost = createBuildGhost(town, art, ink);
  const people = createPeopleView(art);
  scene.add(ground.group, townView.group, ghost.group, people.group);

  scene.add(new THREE.AmbientLight(0xffffff, 2.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.35);
  sun.position.set(cx - 10, 20, cz + 12);
  sun.target.position.set(cx, 0, cz);
  scene.add(sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0006;
  const reach = Math.max(width, depth) * 0.75;
  Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 120 });
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(balance.camera.fov, 1, 0.1, 500);
  /** Points to keep in view: each focus square's corners and centre, just above the ground. */
  let focus: [number, number, number][] = [];
  const raycaster = new THREE.Raycaster();
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let synced = false;
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const lookAt = new THREE.Vector3();

  return {
    setSize(w, h, pixelRatio) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(w, h, false);
      ink.resolution.set(w, h);
      ghost.setResolution(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    setCamera(target, state) {
      const pose = cameraPose(target, state);
      camera.position.set(...pose.position);
      camera.lookAt(...pose.lookAt);
      lookAt.set(...pose.lookAt);
      townView.faceCamera((state.step * 2 * Math.PI) / TURN_STEPS);
      people.faceCamera((state.step * 2 * Math.PI) / TURN_STEPS);
    },
    syncTown(world) {
      // The first sync draws the starting town as it stands; later builds drop onto the board.
      townView.sync(world.roads, world.buildings, synced && !reduceMotion.matches);
      synced = true;
    },
    setGridVisible(on) {
      ground.setGridVisible(on);
    },
    syncPeople(world, marked, talking) {
      people.sync(world, marked, talking);
    },
    pickPerson(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      return people.pick(raycaster);
    },
    screenOf(x, y, z) {
      const v = new THREE.Vector3(x, y, z).project(camera);
      if (v.z > 1) return null;
      const rect = renderer.domElement.getBoundingClientRect();
      return { x: ((v.x + 1) / 2) * rect.width, y: ((1 - v.y) / 2) * rect.height };
    },
    headOf(id) {
      const v = people.headOf(id);
      return v ? { x: v.x, y: v.y, z: v.z } : null;
    },
    setFocus(squares) {
      focus = (squares ?? []).flatMap((s) => [
        [s.x + 0.5, FOCUS_Y, s.z + 0.5] as [number, number, number],
        [s.x + 0.05, FOCUS_Y, s.z + 0.05], [s.x + 0.95, FOCUS_Y, s.z + 0.05],
        [s.x + 0.05, FOCUS_Y, s.z + 0.95], [s.x + 0.95, FOCUS_Y, s.z + 0.95],
      ]);
    },
    pickSquare(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.ray.intersectPlane(groundPlane, new THREE.Vector3());
      if (!hit) return null;
      const x = Math.floor(hit.x), z = Math.floor(hit.z);
      return x >= 0 && z >= 0 && x < width && z < depth ? { x, z } : null;
    },
    showGhost(item, at, fits) {
      ghost.show(item, at, fits);
    },
    hideGhost() {
      ghost.hide();
    },
    memory() {
      return { ...renderer.info.memory };
    },
    render(dt) {
      townView.update(dt);
      // World units per screen pixel at the camera's target distance, so the marker keeps its size on screen.
      const viewH = renderer.domElement.clientHeight || 1;
      const dist = camera.position.distanceTo(lookAt);
      people.update(dt, (2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / viewH, reduceMotion.matches);
      const k = 1 - Math.pow(0.001, dt);
      const cam = camera.position.toArray() as [number, number, number];
      for (const o of townView.occluders()) {
        const box = { min: o.box.min.toArray(), max: o.box.max.toArray() };
        const blocks = focus.some((p) => !insideBox(p, box) && segmentHitsBox(cam, p, box));
        const goal = blocks ? FADED : 1;
        if (o.opacity === goal) continue;
        o.opacity = Math.abs(goal - o.opacity) < 0.01 ? goal : o.opacity + (goal - o.opacity) * k;
        for (const m of o.materials) {
          m.transparent = o.opacity < 1;
          m.opacity = o.opacity;
          m.depthWrite = o.opacity >= 1;
        }
        for (const line of o.ink) line.visible = o.opacity > 0.6;
      }
      renderer.render(scene, camera);
    },
  };
}

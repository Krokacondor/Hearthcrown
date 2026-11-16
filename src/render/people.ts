// Placeholder paper people (M2): upright cut-outs that turn to face the camera, with a soft shadow on the
// ground. The princess hovers while she sprints (her shadow stays down). A marigold marker floats over
// whoever she would talk to. Art comes by ID from the registry, so M2b swaps in real characters.
import * as THREE from "three";
import balance from "../data/balance.json";
import type { World } from "../sim/world";
import { drawBuiltin } from "./art/builtins";
import type { ArtTextures } from "./art/textures";
import { palette } from "./palette";

/** The princess's id in this view; townsfolk use their own ids (1 and up). */
export const PRINCESS_ID = 0;

const HEIGHT = balance.walk.figureHeight;
const SHADOW_Y = 0.025;
/** How fast her hover height eases toward the sim's value, per second. */
const HOVER_RATE = 12;

export interface PeopleView {
  group: THREE.Group;
  sync(world: Readonly<World>, talkTarget: number | null): void;
  update(dt: number): void;
  faceCamera(yaw: number): void;
  /** The person under a ray (PRINCESS_ID for her), or null. */
  pick(ray: THREE.Raycaster): number | null;
  /** A point just above someone's head, in world space. */
  headOf(id: number): THREE.Vector3 | null;
}

interface Figure { id: number; art: string; card: THREE.Mesh; shadow: THREE.Mesh; lift: number; goalLift: number }

export function createPeopleView(art: ArtTextures): PeopleView {
  const group = new THREE.Group();
  const figures = new Map<number, Figure>();
  const shadowGeo = new THREE.CircleGeometry(0.17, 20).rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({ color: palette.ink, transparent: true, opacity: 0.2, depthWrite: false });
  const marker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.07),
    new THREE.MeshBasicMaterial({ color: palette.marigold }),
  );
  marker.scale.y = 1.4;
  marker.visible = false;
  group.add(marker);
  let markerFor: number | null = null;
  let clock = 0;
  let yaw = 0;

  const make = (id: number, artId: string): Figure => {
    const d = drawBuiltin(artId);
    const width = (HEIGHT * d.width) / d.height;
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, opacity: 0 });
    // Hidden until its art arrives, so a blank card never shows.
    art.apply(mat, artId).then(() => { mat.opacity = 1; }, () => {});
    const geo = new THREE.PlaneGeometry(width, HEIGHT);
    geo.translate(0, HEIGHT / 2, 0);
    const card = new THREE.Mesh(geo, mat);
    card.userData.personId = id;
    card.rotation.y = yaw;
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    group.add(card, shadow);
    return { id, art: artId, card, shadow, lift: 0, goalLift: 0 };
  };
  const remove = (f: Figure): void => {
    group.remove(f.card, f.shadow);
    f.card.geometry.dispose();
    (f.card.material as THREE.Material).dispose();
    figures.delete(f.id);
  };
  const place = (id: number, artId: string, x: number, z: number, lift: number): void => {
    let f = figures.get(id);
    if (f && f.art !== artId) { remove(f); f = undefined; }
    if (!f) { f = make(id, artId); figures.set(id, f); f.lift = lift; }
    f.goalLift = lift;
    f.card.position.set(x, f.lift, z);
    f.shadow.position.set(x, SHADOW_Y, z);
  };

  return {
    group,
    sync(world, talkTarget) {
      const seen = new Set<number>([PRINCESS_ID]);
      place(PRINCESS_ID, "figure.princess", world.princess.x, world.princess.z, world.princess.height);
      for (const p of world.people) {
        seen.add(p.id);
        place(p.id, p.role === "advisor" ? "figure.advisor" : `figure.citizen.${p.look}`, p.x, p.z, 0);
      }
      for (const f of [...figures.values()]) if (!seen.has(f.id)) remove(f);
      markerFor = talkTarget;
    },
    update(dt) {
      clock += dt;
      const k = 1 - Math.exp(-HOVER_RATE * dt);
      for (const f of figures.values()) {
        f.lift += (f.goalLift - f.lift) * k;
        if (Math.abs(f.goalLift - f.lift) < 0.002) f.lift = f.goalLift;
        f.card.position.y = f.lift;
      }
      const target = markerFor === null ? undefined : figures.get(markerFor);
      marker.visible = target !== undefined;
      if (target) {
        marker.position.set(target.card.position.x, target.lift + HEIGHT + 0.16 + Math.sin(clock * 4) * 0.025, target.card.position.z);
        marker.rotation.y = clock * 1.5;
      }
    },
    faceCamera(y) {
      yaw = y;
      for (const f of figures.values()) f.card.rotation.y = y;
    },
    pick(ray) {
      const hit = ray.intersectObjects([...figures.values()].map((f) => f.card), false)[0];
      const id = hit?.object.userData.personId;
      return typeof id === "number" ? id : null;
    },
    headOf(id) {
      const f = figures.get(id);
      return f ? new THREE.Vector3(f.card.position.x, f.lift + HEIGHT + 0.05, f.card.position.z) : null;
    },
  };
}

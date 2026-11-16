import * as THREE from "three";
import balance from "../data/balance.json";
import mapJson from "../data/map.json";
import { loadTownMap } from "../sim/townMap";
import { cameraPose, type CameraState } from "./camera";
import { createGround } from "./ground";
import { palette } from "./palette";

export interface DioramaView {
  setSize(width: number, height: number, pixelRatio: number): void;
  setCamera(target: { x: number; z: number }, state: CameraState): void;
  render(): void;
}

/** Builds the diorama scene inside `container`. Returns null when the browser can't do WebGL. */
export function createDiorama(container: HTMLElement): DioramaView | null {
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

  const { width: widthTiles, depth: depthTiles } = loadTownMap(mapJson);
  const cx = widthTiles / 2, cz = depthTiles / 2;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.sky);
  const ground = createGround(widthTiles, depthTiles, renderer.capabilities.getMaxAnisotropy());
  // Square (x, z) covers world [x, x+1] x [z, z+1], so the board's corner sits at the origin.
  ground.group.position.set(cx, 0, cz);
  scene.add(ground.group);

  scene.add(new THREE.AmbientLight(0xffffff, 2.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.35);
  sun.position.set(cx - 10, 20, cz + 12);
  sun.target.position.set(cx, 0, cz);
  scene.add(sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  const reach = Math.max(widthTiles, depthTiles) * 0.9;
  Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 90 });
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(balance.camera.fov, 1, 0.1, 400);

  return {
    setSize(width, height, pixelRatio) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      ground.setResolution(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    setCamera(target, state) {
      const pose = cameraPose(target, state);
      camera.position.set(...pose.position);
      camera.lookAt(...pose.lookAt);
    },
    render() {
      renderer.render(scene, camera);
    },
  };
}

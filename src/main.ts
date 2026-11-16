import "@fontsource/lilita-one/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/800.css";
import "./style.css";
import artJson from "./data/art.json";
import balance from "./data/balance.json";
import { BUILTIN_IDS } from "./render/art/builtins";
import { createArtRegistry, loadPacks } from "./render/art/registry";
import type { DebugHook } from "./debug";
import { startCamera, turn, zoomBy, type CameraState } from "./render/camera";
import { createDiorama } from "./render/scene";
import { viewSize } from "./render/viewSize";
import { createGame } from "./sim/game";
import { installBuildMode } from "./ui/buildMode";
import { cameraActionForKey, type CameraAction } from "./ui/keys";
import { renderTopBar } from "./ui/topbar";
import { pinchSteps, wheelSteps } from "./ui/zoomInput";

const byId = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} in index.html`);
  return el;
};

const game = createGame(7);
const map = byId("map");
renderTopBar(byId("topbar"), game.snapshot());

// Art packs (PLAN.md 2.1): any piece a pack doesn't cover, or a pack that fails to load, uses the built-in drawing.
const packs = await loadPacks(artJson.packs, async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}, (msg) => console.warn(msg));
const view = createDiorama(map, game.town, createArtRegistry(BUILTIN_IDS, packs));
if (!view) {
  byId("no-webgl").hidden = false;
  byId("turn").hidden = true;
  byId("build-open").hidden = true;
} else {
  view.syncTown(game.world);
  let cam: CameraState = startCamera();
  // Unwrapped turn count, so going from step 7 to 0 animates the short way round.
  let goalTurns = 0;
  let shownTurns = 0;
  let shownZoom = cam.zoom;
  // What the camera looks at: the plaza until M2 gives it a princess to follow; the highlight while building.
  const goalTarget = { ...balance.camera.startTarget };
  const shownTarget = { ...goalTarget };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  const apply = (action: CameraAction): void => {
    if (action.kind === "turn") {
      cam = turn(cam, action.dir);
      goalTurns += action.dir;
    } else {
      cam = zoomBy(cam, action.dir);
    }
  };

  map.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const action = cameraActionForKey(e.key);
    if (action) {
      e.preventDefault();
      apply(action);
    }
  });
  const zoomSteps = (steps: number): void => {
    for (let i = 0; i < Math.abs(steps); i++) apply({ kind: "zoom", dir: steps < 0 ? -1 : 1 });
  };

  let wheelCarry = 0;
  map.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = wheelSteps(wheelCarry, e.deltaY, e.deltaMode);
    wheelCarry = r.carry;
    zoomSteps(r.steps);
  }, { passive: false });

  // Two-finger pinch on phones (the browser's own pinch is off: touch-action none).
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch: { start: number; applied: number } | null = null;
  const fingerDistance = (): number => {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  map.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) pinch = { start: fingerDistance(), applied: 0 };
  });
  map.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!pinch || pointers.size !== 2) return;
    const target = pinchSteps(pinch.start, fingerDistance());
    zoomSteps(target - pinch.applied);
    pinch.applied = target;
  });
  const endPointer = (e: PointerEvent): void => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
  };
  map.addEventListener("pointerup", endPointer);
  map.addEventListener("pointercancel", endPointer);
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-turn]")) {
    button.addEventListener("click", () => apply({ kind: "turn", dir: button.dataset.turn === "left" ? -1 : 1 }));
  }

  const build = installBuildMode({
    game,
    view,
    map,
    cameraStep: () => cam.step,
    cameraTarget: () => ({ ...goalTarget }),
    followTo: (x, z) => { goalTarget.x = x; goalTarget.z = z; },
  });

  const resize = (): void => {
    const s = viewSize(map.clientWidth, map.clientHeight, window.devicePixelRatio);
    view.setSize(s.width, s.height, s.pixelRatio);
  };
  new ResizeObserver(resize).observe(map);
  resize();

  let last = performance.now();
  const frame = (now: number): void => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const k = reduceMotion.matches ? 1 : 1 - Math.pow(0.0005, dt);
    shownTurns += (goalTurns - shownTurns) * k;
    shownZoom += (cam.zoom - shownZoom) * k;
    shownTarget.x += (goalTarget.x - shownTarget.x) * k;
    shownTarget.z += (goalTarget.z - shownTarget.z) * k;
    view.setCamera(shownTarget, { step: shownTurns, zoom: shownZoom });
    view.setFocus(build.focusSquares());
    view.render(dt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

if (import.meta.env.DEV) {
  const { installDebugHook } = await import("./debug");
  installDebugHook(window as unknown as { __hearthcrown?: DebugHook }, game, () => view?.syncTown(game.world));
  (window as unknown as { __hearthcrownGpu?: () => unknown }).__hearthcrownGpu = () => view?.memory();
}

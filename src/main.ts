import "@fontsource/lilita-one/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/800.css";
import "./style.css";
import type { DebugHook } from "./debug";
import { startCamera, turn, zoomBy, type CameraState } from "./render/camera";
import { createDiorama } from "./render/scene";
import { viewSize } from "./render/viewSize";
import { createGame } from "./sim/game";
import { cameraActionForKey, type CameraAction } from "./ui/keys";
import { renderTopBar } from "./ui/topbar";

const byId = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} in index.html`);
  return el;
};

const game = createGame(7);
const map = byId("map");
renderTopBar(byId("topbar"), game.snapshot());

const view = createDiorama(map);
if (!view) {
  byId("no-webgl").hidden = false;
  byId("turn").hidden = true;
} else {
  let cam: CameraState = startCamera();
  // Unwrapped turn count, so going from step 7 to 0 animates the short way round.
  let goalTurns = 0;
  let shownTurns = 0;
  let shownZoom = cam.zoom;
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
  map.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaY !== 0) apply({ kind: "zoom", dir: e.deltaY < 0 ? -1 : 1 });
  }, { passive: false });
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-turn]")) {
    button.addEventListener("click", () => apply({ kind: "turn", dir: button.dataset.turn === "left" ? -1 : 1 }));
  }

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
    view.setCamera({ x: 0, z: 0 }, { step: shownTurns, zoom: shownZoom });
    view.render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

if (import.meta.env.DEV) {
  const { installDebugHook } = await import("./debug");
  installDebugHook(window as unknown as { __hearthcrown?: DebugHook }, game);
}

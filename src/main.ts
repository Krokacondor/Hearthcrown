import "@fontsource/lilita-one/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/800.css";
import "./style.css";
import artJson from "./data/art.json";
import balance from "./data/balance.json";
import { BUILTIN_IDS } from "./render/art/builtins";
import { createArtRegistry, loadPacks } from "./render/art/registry";
import { artUrl } from "./render/art/textures";
import type { DebugHook } from "./debug";
import { startCamera, turn, zoomBy, type CameraState } from "./render/camera";
import { createDiorama } from "./render/scene";
import { viewSize } from "./render/viewSize";
import { createGame } from "./sim/game";
import { currentChatLine } from "./sim/talk";
import { bubbleContent, installChatBubbles, type BubbleItem } from "./ui/chatBubbles";
import { dialogueEdge, installDialogueBox } from "./ui/dialogueBox";
import { installBuildMode } from "./ui/buildMode";
import { cameraActionForKey, type CameraAction } from "./ui/keys";
import { renderTopBar } from "./ui/topbar";
import { installWalkMode } from "./ui/walkMode";
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
const registry = createArtRegistry(BUILTIN_IDS, packs);
const view = createDiorama(map, game.town, registry);
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
  // What the camera looks at: the princess, or the build highlight while building.
  const goalTarget = { x: game.world.princess.x, z: game.world.princess.z };
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

  const walk = installWalkMode({
    game,
    view,
    map,
    cameraStep: () => cam.step,
    buildOpen: () => build.isOpen(),
    applyCamera: apply,
  });

  // ---- Talking: the dialogue box and the chat bubbles, drawn from sim state each frame.
  const dialogue = installDialogueBox(byId("dialogue"), byId("dialogue-live"), () => game.command("advanceDialogue"));
  const bubbles = installChatBubbles(byId("bubbles"));
  const onScreen = (id: number): { x: number; y: number } | null => {
    const h = view.headOf(id);
    return h ? view.screenOf(h.x, h.y, h.z) : null;
  };
  const drawTalk = (): void => {
    const w = game.world;
    const d = w.dialogue;
    const who = d ? w.people.find((p) => p.id === d.personId) : undefined;
    if (d && who) {
      const ys = [onScreen(0)?.y ?? 0, onScreen(who.id)?.y ?? 0];
      dialogue.show({
        name: who.name,
        portrait: artUrl(registry, who.role === "advisor" ? "portrait.advisor" : `portrait.citizen.${who.look}`),
        text: d.lines[d.index] ?? "",
        more: d.index < d.lines.length - 1,
        edge: dialogueEdge(Math.max(...ys), map.clientHeight),
      });
    } else {
      dialogue.hide();
    }
    const items: BubbleItem[] = [];
    if (!d) {
      for (const p of w.people) {
        const said = currentChatLine(p);
        const at = said === null ? null : onScreen(p.id);
        if (said === null || !at) continue;
        const dist = Math.hypot(p.x - w.princess.x, p.z - w.princess.z);
        items.push({ id: p.id, x: at.x, y: at.y, content: bubbleContent(said, dist, balance.walk.bubbleWordsRange) });
      }
    }
    bubbles.sync(items);
  };

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
    walk.poll();
    game.advance(dt);
    const w = game.world;
    view.syncPeople(w, game.snapshot().talkTarget);
    if (!build.isOpen()) {
      goalTarget.x = w.princess.x;
      goalTarget.z = w.princess.z;
    }
    view.setCamera(shownTarget, { step: shownTurns, zoom: shownZoom });
    // Anything standing between the camera and her (or the build highlight) fades.
    view.setFocus(build.focusSquares() ?? [{ x: Math.floor(w.princess.x), z: Math.floor(w.princess.z) }]);
    view.render(dt);
    drawTalk();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

if (import.meta.env.DEV) {
  const { installDebugHook } = await import("./debug");
  installDebugHook(window as unknown as { __hearthcrown?: DebugHook }, game, () => view?.syncTown(game.world));
  (window as unknown as { __hearthcrownGpu?: () => unknown }).__hearthcrownGpu = () => view?.memory();
}

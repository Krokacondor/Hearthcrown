// The Build menu and build mode (docs/design/build-menu-brief.md, spec goal 6). Reads sim state and calls
// sim commands only; the rules and their messages come from the sim's checkPlacement.
import type { DioramaView } from "../render/scene";
import { footprint } from "../sim/buildings";
import type { Game } from "../sim/game";
import { cellOf, cellSquares, type Rot, type Square } from "../sim/townMap";
import { actionFor } from "./bindings";
import { arrowStep, buildKeyFor, clampToBoard, contextMenuIsBack, nearestFit, releaseTouch, snapToCell, strokeCells, turnRot, type TapState } from "./buildInput";
import { menuItems, moveSelection, trayStatus, type MenuItem } from "./buildMenu";

export interface BuildModeDeps {
  game: Game;
  view: DioramaView;
  map: HTMLElement;
  /** The camera's current turn step (0..7), for camera-relative arrow moves. */
  cameraStep(): number;
  /** Where the camera is looking now. */
  cameraTarget(): { x: number; z: number };
  /** Glides the camera to look at a point. */
  followTo(x: number, z: number): void;
}

export interface BuildMode {
  /** The squares the camera should keep in view (fades whatever blocks them), or null when not placing. */
  focusSquares(): Square[] | null;
  /** True while the Build menu or build mode is showing (the princess stands still). */
  isOpen(): boolean;
}

type Mode = "closed" | "menu" | "placing";

const el = <T extends HTMLElement>(sel: string): T => {
  const found = document.querySelector<T>(sel);
  if (!found) throw new Error(`Missing ${sel} in index.html`);
  return found;
};
const same = (a: Square | null, b: Square | null): boolean => !!a && !!b && a.x === b.x && a.z === b.z;
const sizeText = (item: MenuItem): string => `${item.size[0]}×${item.size[1]}`;

export function installBuildMode(deps: BuildModeDeps): BuildMode {
  const { game, view, map } = deps;
  const openBtn = el<HTMLButtonElement>("#build-open");
  const flat = el<HTMLElement>("#build-flat");
  const list = el<HTMLUListElement>("#build-list");
  const tray = el<HTMLElement>("#build-tray");
  const trayName = el<HTMLElement>('[data-tray="name"]');
  const traySize = el<HTMLElement>('[data-tray="size"]');
  const trayReason = el<HTMLElement>('[data-tray="reason"]');
  const turnBtn = el<HTMLButtonElement>('[data-tray="turn"]');
  const placeBtn = el<HTMLButtonElement>('[data-tray="place"]');
  const { width, depth } = game.town.map;

  const items = menuItems(game.town.defs);
  let mode: Mode = "closed";
  let item: MenuItem = items[0]!;
  let rot: Rot = 0;
  let hl: Square = { x: 0, z: 0 };
  let taps: TapState = { armed: null };
  let enterHeld = false;
  /** Names what was just built at the highlight, until it moves; the tray celebrates instead of reporting it as in the way. */
  let justBuilt: string | null = null;

  // ---- The flat's rows.
  const rows = items.map((it) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "flat__row";
    b.innerHTML = `<span></span><span class="flat__size"></span>`;
    b.children[0]!.textContent = it.name;
    b.children[1]!.textContent = sizeText(it);
    b.setAttribute("aria-label", `${it.name}, ${sizeText(it).replace("×", " by ")}`);
    b.addEventListener("click", () => choose(it));
    li.append(b);
    list.append(li);
    return b;
  });

  // ---- Moving between levels: closed, menu, placing. Back goes up one level.
  function openMenu(): void {
    // Building waits until the conversation is over, so the tray never sits under the dialogue box.
    if (game.world.dialogue) return;
    mode = "menu";
    flat.hidden = false;
    tray.hidden = true;
    openBtn.setAttribute("aria-expanded", "true");
    view.hideGhost();
    view.setGridVisible(false);
    map.classList.remove("is-placing");
    (rows[items.indexOf(item)] ?? rows[0])?.focus({ preventScroll: true });
  }
  function closeAll(): void {
    mode = "closed";
    flat.hidden = true;
    tray.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    view.hideGhost();
    view.setGridVisible(false);
    map.classList.remove("is-placing");
    enterHeld = false;
    map.focus({ preventScroll: true });
  }
  function back(): void {
    if (mode === "placing") openMenu();
    else if (mode === "menu") closeAll();
  }
  function choose(it: MenuItem): void {
    item = it;
    mode = "placing";
    rot = 0;
    taps = { armed: null };
    flat.hidden = true;
    tray.hidden = false;
    trayName.textContent = it.name;
    traySize.textContent = sizeText(it);
    turnBtn.hidden = it.id === "road";
    justBuilt = null;
    const t = deps.cameraTarget();
    const from = clampToBoard({ x: Math.floor(t.x), z: Math.floor(t.z) }, width, depth);
    // Open on the nearest spot that fits, so placing never starts on a red verdict when a green one is close.
    // Roads sit on whole road cells, so only a cell's first square is a candidate.
    const fits = (s: Square): boolean => (it.id !== "road" || same(s, snapToCell(game.town.map, s))) && check(s).ok;
    hl = snap(nearestFit(from, fits, width, depth) ?? from);
    deps.followTo(...centerOf(hl));
    view.setGridVisible(true);
    map.classList.add("is-placing");
    refresh();
    map.focus({ preventScroll: true });
  }

  // ---- The preview and placing, all through sim commands.
  function check(s: Square): { ok: true } | { ok: false; error: string } {
    return item.id === "road"
      ? game.command("checkPlacement", { kind: "road", x: s.x, z: s.z })
      : game.command("checkPlacement", { kind: "building", type: item.id, x: s.x, z: s.z, rot });
  }
  function refresh(): void {
    if (mode !== "placing") return;
    const result = check(hl);
    view.showGhost(item.id === "road" ? { kind: "road" } : { kind: "building", type: item.id, rot }, hl, result.ok);
    const status = trayStatus(result, justBuilt);
    if (trayReason.textContent !== status.text) trayReason.textContent = status.text;
    trayReason.dataset.tone = status.tone;
    placeBtn.disabled = !status.canPlace;
  }
  function roadAt(s: Square): void {
    if (game.command("placeRoad", { x: s.x, z: s.z }).ok) {
      view.syncTown(game.world);
      justBuilt = "Road";
    }
  }
  function place(): void {
    if (mode !== "placing") return;
    if (item.id === "road") roadAt(hl);
    else if (game.command("placeBuilding", { type: item.id, x: hl.x, z: hl.z, rot }).ok) {
      view.syncTown(game.world);
      justBuilt = item.name;
    }
    refresh();
  }
  /** Road highlights snap to the first square of their road cell; buildings keep any square. */
  function snap(s: Square): Square {
    return item.id === "road" ? snapToCell(game.town.map, s) : s;
  }
  /** Where the camera looks for the highlight: a square's middle, or a road cell's middle. */
  function centerOf(s: Square): [number, number] {
    return item.id === "road" ? [s.x + 1, s.z + 1] : [s.x + 0.5, s.z + 0.5];
  }
  function moveTo(s: Square, follow: boolean): void {
    hl = snap(clampToBoard(s, width, depth));
    justBuilt = null;
    if (follow) deps.followTo(...centerOf(hl));
    if (enterHeld && item.id === "road") roadAt(hl);
    refresh();
  }

  // ---- Keyboard (keys from the bindings table).
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (mode === "closed") {
      if (actionFor("menu", e.key) === "build") { e.preventDefault(); openMenu(); }
      return;
    }
    if (mode === "menu") {
      const a = actionFor("menu", e.key);
      if (a === "up" || a === "down") {
        e.preventDefault();
        const i = rows.indexOf(document.activeElement as HTMLButtonElement);
        rows[moveSelection(i < 0 ? -1 : i, a === "up" ? -1 : 1, rows.length) ]?.focus();
      } else if (a === "back" || a === "build") {
        e.preventDefault();
        if (a === "back") back(); else closeAll();
      }
      return;
    }
    // Placing. Enter on a focused tray button presses that button instead.
    if (tray.contains(document.activeElement) && (e.key === "Enter" || e.key === " ")) return;
    const k = buildKeyFor(e.key);
    if (!k) return;
    e.preventDefault();
    if (k.kind === "move") {
      const { dx, dz } = arrowStep(k.dir, deps.cameraStep());
      // Roads move a whole road cell (2 squares) at a time.
      const n = item.id === "road" ? 2 : 1;
      moveTo({ x: hl.x + dx * n, z: hl.z + dz * n }, true);
    } else if (k.kind === "turn") {
      if (item.id !== "road") { rot = turnRot(rot); justBuilt = null; refresh(); }
    } else if (k.kind === "place") {
      if (e.repeat) return;
      if (item.id === "road") enterHeld = true;
      place();
    } else {
      back();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (buildKeyFor(e.key)?.kind === "place") enterHeld = false;
  });

  // ---- Buttons.
  openBtn.addEventListener("click", () => (mode === "closed" ? openMenu() : closeAll()));
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-back]")) b.addEventListener("click", back);
  turnBtn.addEventListener("click", () => { rot = turnRot(rot); justBuilt = null; refresh(); });
  placeBtn.addEventListener("click", place);
  // Right-click is Back everywhere (PLAN.md 5.1).
  // A long press on a touch screen also fires contextmenu; that must not leave build mode.
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (contextMenuIsBack((e as PointerEvent).pointerType, fingers > 0 || touch !== null)) back();
  });

  // ---- Mouse: the highlight follows the pointer; click places; hold and drag paints roads. The camera stays put.
  let mouseDown: Square | null = null;
  let painting = false;
  // ---- Touch: tap to preview, tap again (or Place) to build, drag to paint roads; a second finger cancels.
  let fingers = 0;
  let touch: { id: number; start: Square; last: Square; painting: boolean; cancelled: boolean; moved: boolean } | null = null;

  map.addEventListener("pointerdown", (e) => {
    if (mode !== "placing") return;
    const sq = view.pickSquare(e.clientX, e.clientY);
    if (e.pointerType === "touch") {
      fingers++;
      if (fingers === 1 && sq) touch = { id: e.pointerId, start: sq, last: sq, painting: false, cancelled: false, moved: false };
      else if (touch) touch.cancelled = true;
      return;
    }
    if (e.button !== 0 || !sq) return;
    mouseDown = sq;
    hl = snap(sq);
    justBuilt = null;
    if (item.id === "road") { painting = true; roadAt(sq); }
    refresh();
  });
  map.addEventListener("pointermove", (e) => {
    if (mode !== "placing") return;
    const sq = view.pickSquare(e.clientX, e.clientY);
    if (!sq) return;
    if (e.pointerType === "touch") {
      if (!touch || touch.id !== e.pointerId || touch.cancelled || fingers !== 1 || same(sq, touch.last)) return;
      if (item.id === "road") {
        if (!touch.painting) { touch.painting = true; roadAt(touch.start); }
        for (const s of strokeCells(game.town.map, touch.last, sq)) roadAt(s);
      }
      touch.last = sq;
      touch.moved = true;
      hl = snap(sq);
      if (!touch.painting) justBuilt = null;
      refresh();
      return;
    }
    if (same(snap(sq), hl)) return;
    if (painting && (e.buttons & 1)) {
      for (const s of strokeCells(game.town.map, hl, sq)) roadAt(s);
      hl = snap(sq);
      refresh();
    } else {
      moveTo(sq, false);
    }
  });
  const endPointer = (e: PointerEvent): void => {
    if (e.pointerType === "touch") {
      fingers = Math.max(0, fingers - 1);
      if (!touch || touch.id !== e.pointerId) return;
      const t = touch;
      touch = null;
      if (e.type === "pointercancel" || t.cancelled || t.painting || mode !== "placing") return;
      const r = releaseTouch(taps, t.last, t.moved);
      taps = r.state;
      if (r.place && same(hl, snap(t.last))) place();
      else moveTo(t.last, true); // after the finger lifts, the camera glides to the preview
      return;
    }
    if (mode === "placing" && e.button === 0 && item.id !== "road" && mouseDown) {
      const sq = view.pickSquare(e.clientX, e.clientY);
      if (same(sq, mouseDown)) place();
    }
    mouseDown = null;
    painting = false;
  };
  map.addEventListener("pointerup", endPointer);
  map.addEventListener("pointercancel", endPointer);

  return {
    isOpen: () => mode !== "closed",
    focusSquares() {
      if (mode !== "placing") return null;
      const def = item.id === "road" ? undefined : game.town.defs.get(item.id);
      return def ? footprint(def, hl.x, hl.z, rot).cells : cellSquares(game.town.map, cellOf(game.town.map, hl.x, hl.z));
    },
  };
}

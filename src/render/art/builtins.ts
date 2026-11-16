// Built-in code drawings for every art ID (PLAN.md 2.1). Each is an SVG string; packs can replace any of them.
import buildingsJson from "../../data/buildings.json";
import { loadBuildingDefs, type BuildingDef } from "../../sim/buildings";
import { palette } from "../palette";

/** Texture pixels per square of panel or tile. */
export const PX = 128;
/** How far roof panels overhang the walls, in squares (the model uses the same value). */
export const ROOF_OVERHANG = 0.18;

export interface Drawing { svg: string; width: number; height: number }

interface Look { wall: string; roof: string; shade: string; door: string; trim: string }
/** Colours per building art; anything not listed uses the cottage look. */
const LOOKS: Record<string, Look> = {
  "building.cottage.1": { wall: "#f4e3c3", roof: "#d76a4a", shade: "#b9533a", door: "#8a5a3c", trim: "#9ed3f0" },
  "building.familyHome.1": { wall: "#eadbc3", roof: "#5d8fd0", shade: "#4570a8", door: "#5a4a7a", trim: "#9ed3f0" },
  "building.manor.1": { wall: "#f1e7d6", roof: "#6aa457", shade: "#4f8540", door: "#7a4a3c", trim: "#9ed3f0" },
  "building.lodge.1": { wall: "#e6c9a0", roof: "#a0573a", shade: "#7e4128", door: "#5b3a26", trim: "#f2b233" },
  "building.castle.1": { wall: "#ece6dc", roof: palette.roofPink, shade: "#d977a0", door: "#8a5a3c", trim: "#fcd0e2" },
};
const FACES = ["front", "side", "back", "gable", "roof"] as const;

const defsByArt = new Map<string, BuildingDef>();
for (const def of loadBuildingDefs(buildingsJson).values()) defsByArt.set(def.art, def);

// A gentle displacement so ink lines wobble like a hand drawing.
const WOBBLE = `<filter id="w" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter>`;
const INK = palette.ink;

function svg(w: number, h: number, under: string, inked: string): Drawing {
  const width = Math.round(w), height = Math.round(h);
  return {
    width, height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><defs>${WOBBLE}</defs>${under}<g filter="url(#w)" stroke="${INK}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round">${inked}</g></svg>`,
  };
}
const fill = (w: number, h: number, c: string): string => `<rect width="${w}" height="${h}" fill="${c}"/>`;
const border = (w: number, h: number, c: string): string => `<rect x="5" y="5" width="${w - 10}" height="${h - 10}" fill="${c}"/>`;
const win = (x: number, y: number, w: number, h: number, c: string): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/><path d="M${x + w / 2},${y} V${y + h}" stroke-width="6"/>`;
const door = (cx: number, base: number, w: number, h: number, c: string): string =>
  `<path d="M${cx - w / 2},${base} V${base - h + w / 2} Q${cx},${base - h - w / 6} ${cx + w / 2},${base - h + w / 2} V${base} Z" fill="${c}"/>`;

function buildingPanel(def: BuildingDef, face: (typeof FACES)[number]): Drawing {
  const look = LOOKS[def.art] ?? LOOKS["building.cottage.1"]!;
  const [w, d] = def.size;
  const H = def.height * PX;
  const winW = 0.32 * PX, winH = 0.3 * PX;
  switch (face) {
    case "front": {
      const W = w * PX;
      // The door is centred on the squares it covers, so the art matches the placement rule.
      const doorCentre = ((def.door.reduce((a, b) => a + b, 0) / def.door.length) + 0.5) * PX;
      const doorW = Math.min(0.5, 0.3 + 0.1 * def.door.length) * PX;
      let s = border(W, H, look.wall) + door(doorCentre, H - 5, doorW, Math.min(H * 0.62, 0.7 * PX), look.door);
      for (let i = 0; i < w; i++) {
        if (!def.door.includes(i)) s += win((i + 0.5) * PX - winW / 2, H * 0.3, winW, winH, look.trim);
      }
      if (H > 1.3 * PX) for (let i = 0; i < w; i++) s += win((i + 0.5) * PX - winW / 2, H * 0.08, winW, winH, look.trim);
      return svg(W, H, fill(W, H, look.wall), s);
    }
    case "back": {
      const W = w * PX;
      let s = border(W, H, look.wall);
      for (let i = 0; i < w; i++) s += win((i + 0.5) * PX - winW / 2, H * 0.3, winW, winH, look.trim);
      return svg(W, H, fill(W, H, look.wall), s);
    }
    case "side": {
      const W = d * PX;
      let s = border(W, H, look.wall);
      for (let i = 0; i < d; i++) s += win((i + 0.5) * PX - winW / 2, H * 0.3, winW, winH, look.trim);
      return svg(W, H, fill(W, H, look.wall), s);
    }
    case "gable": {
      const W = w * PX, R = Math.max(def.roofRise * PX, 24);
      const tri = (inset: number): string => `<path d="M${inset},${R - inset / 2} L${W / 2},${inset} L${W - inset},${R - inset / 2} Z" fill="${look.wall}"/>`;
      const round = `<circle cx="${W / 2}" cy="${R * 0.6}" r="${Math.min(R * 0.22, 0.16 * PX)}" fill="${look.trim}"/>`;
      return svg(W, R, tri(0), tri(8) + round);
    }
    case "roof": {
      const run = w / 2 + ROOF_OVERHANG, drop = def.roofRise * run / (w / 2);
      const W = (d + 2 * ROOF_OVERHANG) * PX, L = Math.hypot(run, drop) * PX;
      let s = border(W, L, look.roof) + `<g fill="none" stroke="${look.shade}" stroke-width="6">`;
      const step = 0.26 * PX;
      for (let y = 0.22 * PX; y < L - 8; y += step) {
        let path = "";
        for (let x = 8; x < W - 8; x += step) path += `M${x},${y} q${step / 2},${step / 2} ${step},0 `;
        s += `<path d="${path}"/>`;
      }
      return svg(W, L, fill(W, L, look.roof), s + "</g>");
    }
  }
}

/** A pseudo-random sequence with a fixed seed, so drawings never change between loads. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296;
}

function tile(squares: number, base: string, marks: (size: number, rnd: () => number) => string, seed: number): Drawing {
  const size = squares * PX;
  return {
    width: size, height: size,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${fill(size, size, base)}${marks(size, seeded(seed))}</svg>`,
  };
}

const OTHER: Record<string, () => Drawing> = {
  // Grass repeats every 4 squares; tufts are short ink-green strokes.
  "tile.grass": () => tile(4, palette.grass, (size, rnd) => {
    let p = "";
    for (let i = 0; i < 26; i++) {
      const x = rnd() * size, y = rnd() * size;
      p += `M${x - 7},${y} l3,-9 M${x},${y} l0,-12 M${x + 7},${y} l-3,-9 `;
    }
    return `<path d="${p}" stroke="${palette.tuft}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  }, 7),
  "tile.road.cobble": () => tile(1, palette.cobble, (size, rnd) => {
    let s = "";
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const x = (c + (r % 2) * 0.5) * size / 4, y = r * size / 4;
      s += `<rect x="${x + 3}" y="${y + 3}" width="${size / 4 - 6}" height="${size / 4 - 6}" rx="7" fill="${rnd() > 0.5 ? "#c9b48c" : "#d8c6a2"}"/>`;
    }
    return s;
  }, 11),
  "tile.road.dirt": () => tile(1, palette.dirt, (size, rnd) => {
    let s = "";
    for (let i = 0; i < 6; i++) s += `<circle cx="${rnd() * size}" cy="${rnd() * size}" r="${2 + rnd() * 3}" fill="#d6b884"/>`;
    return s;
  }, 13),
  "tile.plaza": () => tile(1, "#ddd2bf", (size) =>
    `<path d="M0,${size / 2} H${size} M${size / 2},0 V${size}" stroke="#c4b69e" stroke-width="5"/>`, 17),
  "wall.stone": () => tile(1, palette.stone, (size) =>
    `<path d="M0,${size / 3} H${size} M0,${(2 * size) / 3} H${size} M${size / 2},0 V${size / 3} M${size / 4},${size / 3} V${(2 * size) / 3} M${(3 * size) / 4},${size / 3} V${(2 * size) / 3} M${size / 2},${(2 * size) / 3} V${size}" stroke="#bdb4a8" stroke-width="5"/>`, 19),
  // The princess as a stone statue on a plinth: a cut-out that faces the camera.
  "prop.statue": () => svg(160, 320, "",
    `<rect x="30" y="250" width="100" height="62" fill="#c9c1b6"/>` +
    `<path d="M80,96 C52,96 44,170 40,250 H120 C116,170 108,96 80,96 Z" fill="${palette.stone}"/>` +
    `<circle cx="80" cy="70" r="34" fill="${palette.stone}"/>` +
    `<path d="M56,40 L62,18 L72,32 L80,12 L88,32 L98,18 L104,40 Z" fill="#e8dfcf"/>` +
    `<path d="M64,140 Q80,156 96,140" fill="none" stroke-width="7"/>`),
  // A wooden board on two posts with paper notices pinned to it.
  "prop.questBoard": () => svg(200, 220, "",
    `<rect x="30" y="80" width="16" height="132" fill="#8a5a3c"/><rect x="154" y="80" width="16" height="132" fill="#8a5a3c"/>` +
    `<rect x="14" y="20" width="172" height="110" rx="6" fill="#b07a4c"/>` +
    `<rect x="32" y="36" width="44" height="54" fill="#fffdf8" stroke-width="6"/>` +
    `<rect x="88" y="44" width="40" height="46" fill="#fffdf8" stroke-width="6"/>` +
    `<rect x="138" y="34" width="34" height="42" fill="#fffdf8" stroke-width="6"/>`),
  missing: () => svg(PX, PX, fill(PX, PX, "#e84bd6"),
    `<path d="M0,0 L${PX},${PX} M${PX},0 L0,${PX}" stroke="#fffdf8" stroke-width="8"/>`),
};

export const BUILTIN_IDS: ReadonlySet<string> = new Set([
  ...Object.keys(OTHER),
  ...[...defsByArt.keys()].flatMap((art) => FACES.map((f) => `${art}.${f}`)),
]);

/** The built-in drawing for an art ID; unknown IDs get the "missing" drawing. */
export function drawBuiltin(id: string): Drawing {
  const other = Object.hasOwn(OTHER, id) ? OTHER[id] : undefined;
  if (other) return other();
  const dot = id.lastIndexOf(".");
  const def = defsByArt.get(id.slice(0, dot));
  const face = id.slice(dot + 1) as (typeof FACES)[number];
  if (def && FACES.includes(face)) return buildingPanel(def, face);
  return OTHER.missing!();
}

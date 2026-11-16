import { describe, expect, it, vi } from "vitest";
import buildingsJson from "../../src/data/buildings.json";
import { BUILTIN_IDS, drawBuiltin } from "../../src/render/art/builtins";
import { createArtRegistry, loadPacks, parseManifest, type PackManifest } from "../../src/render/art/registry";
import { loadBuildingDefs } from "../../src/sim/buildings";

const ids = new Set(["building.cottage.1.front", "building.cottage.1.side", "tile.grass"]);
const pack = (name: string, art: Record<string, string>): PackManifest => ({ pack: name, art });

describe("createArtRegistry", () => {
  it("uses a pack's image for the ids it covers", () => {
    const reg = createArtRegistry(ids, [pack("inked", { "building.cottage.1.front": "cottage-front.png" })]);
    expect(reg.resolve("building.cottage.1.front")).toEqual({
      kind: "image", id: "building.cottage.1.front", url: "/art/inked/cottage-front.png",
    });
  });

  it("falls back to the built-in drawing for ids the pack leaves out", () => {
    const reg = createArtRegistry(ids, [pack("inked", { "building.cottage.1.front": "cottage-front.png" })]);
    expect(reg.resolve("building.cottage.1.side")).toEqual({ kind: "code", id: "building.cottage.1.side" });
  });

  it("lets a later pack win over an earlier one", () => {
    const reg = createArtRegistry(ids, [pack("a", { "tile.grass": "g.png" }), pack("b", { "tile.grass": "g2.png" })]);
    expect(reg.resolve("tile.grass")).toMatchObject({ url: "/art/b/g2.png" });
  });

  it("resolves an unknown id to the missing-art drawing", () => {
    expect(createArtRegistry(ids, []).resolve("hair.female.long_wavy")).toEqual({ kind: "code", id: "missing" });
  });
});

describe("parseManifest", () => {
  it("accepts a pack name and a map of file names", () => {
    expect(parseManifest({ pack: "inked", art: { "tile.grass": "grass.png" } })).toEqual(pack("inked", { "tile.grass": "grass.png" }));
  });
  it("returns null for a bad shape", () => {
    for (const bad of [null, "inked", { pack: "inked" }, { pack: "inked", art: { "tile.grass": 3 } }, { art: {} },
      { pack: "../up", art: {} }, { pack: "inked", art: { "tile.grass": "../../secret.png" } }]) {
      expect(parseManifest(bad), JSON.stringify(bad)).toBeNull();
    }
  });
});

describe("loadPacks", () => {
  it("loads the packs that work and warns once about the one that fails", async () => {
    const fetchJson = vi.fn(async (url: string) => {
      if (url === "/art/broken/manifest.json") throw new Error("404");
      return { pack: "inked", art: { "tile.grass": "grass.png" } };
    });
    const warn = vi.fn();
    const packs = await loadPacks(["broken", "inked"], fetchJson, warn);
    expect(packs).toEqual([pack("inked", { "tile.grass": "grass.png" })]);
    expect(fetchJson).toHaveBeenCalledWith("/art/inked/manifest.json");
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("built-in art", () => {
  const defs = loadBuildingDefs(buildingsJson);

  it("covers all five panels of every building, plus tiles, walls, props and missing", () => {
    for (const def of defs.values()) {
      for (const face of ["front", "side", "back", "gable", "roof"]) expect(BUILTIN_IDS.has(`${def.art}.${face}`), `${def.art}.${face}`).toBe(true);
    }
    for (const id of ["tile.grass", "tile.road.cobble", "tile.road.dirt", "tile.plaza", "wall.stone", "prop.statue", "prop.questBoard", "missing"]) {
      expect(BUILTIN_IDS.has(id), id).toBe(true);
    }
  });

  it("draws panels at 128 px per square, sized to the building", () => {
    const cottage = defs.get("cottage")!;
    const front = drawBuiltin("building.cottage.1.front");
    expect(front.width).toBe(128 * cottage.size[0]);
    expect(front.height).toBe(Math.round(128 * cottage.height));
    expect(front.svg).toMatch(/^<svg /);
    expect(drawBuiltin("building.lodge.1.side").width).toBe(128 * 2);
  });

  it("draws the missing-art panel for unknown ids instead of throwing", () => {
    expect(drawBuiltin("nope").svg).toBe(drawBuiltin("missing").svg);
  });
});

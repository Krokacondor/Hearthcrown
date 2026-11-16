// Art by name only (PLAN.md 2.1): every piece of art has a stable ID. Packs can replace any ID with an
// image file; anything a pack leaves out falls back to the built-in code drawing.

export type ArtSource =
  | { kind: "code"; id: string }
  | { kind: "image"; id: string; url: string };

/** `public/art/<pack>/manifest.json`: maps art IDs to file names inside the pack folder. */
export interface PackManifest {
  pack: string;
  art: Record<string, string>;
}

/** A plain name: letters, digits, dot, dash, underscore. Keeps packs inside their own folder. */
const SAFE_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]*$/;

/** Returns null when the manifest isn't the expected shape. */
export function parseManifest(json: unknown): PackManifest | null {
  if (typeof json !== "object" || json === null) return null;
  const { pack, art } = json as Record<string, unknown>;
  if (typeof pack !== "string" || !SAFE_NAME.test(pack)) return null;
  if (typeof art !== "object" || art === null || Array.isArray(art)) return null;
  const out: Record<string, string> = {};
  for (const [id, file] of Object.entries(art)) {
    if (typeof file !== "string" || !SAFE_NAME.test(file) || file.includes("..")) return null;
    out[id] = file;
  }
  return { pack, art: out };
}

export interface ArtRegistry {
  resolve(id: string): ArtSource;
}

/** Later packs win; then the built-in drawing; unknown IDs get the "missing" drawing. */
export function createArtRegistry(builtinIds: ReadonlySet<string>, packs: PackManifest[]): ArtRegistry {
  return {
    resolve(id) {
      for (let i = packs.length - 1; i >= 0; i--) {
        const p = packs[i]!;
        const file = Object.hasOwn(p.art, id) ? p.art[id] : undefined;
        if (file) return { kind: "image", id, url: `/art/${p.pack}/${file}` };
      }
      return builtinIds.has(id) ? { kind: "code", id } : { kind: "code", id: "missing" };
    },
  };
}

/** Fetches each pack's manifest. A pack that fails to load is skipped with a warning, never an error. */
export async function loadPacks(
  names: string[],
  fetchJson: (url: string) => Promise<unknown>,
  warn: (msg: string) => void,
): Promise<PackManifest[]> {
  const loaded = await Promise.all(names.map(async (name) => {
    if (!SAFE_NAME.test(name)) {
      warn(`Art pack "${name}" has an unusable name; using built-in art.`);
      return null;
    }
    try {
      const manifest = parseManifest(await fetchJson(`/art/${name}/manifest.json`));
      if (!manifest) warn(`Art pack "${name}" has a bad manifest; using built-in art.`);
      return manifest;
    } catch {
      warn(`Art pack "${name}" could not be loaded; using built-in art.`);
      return null;
    }
  }));
  return loaded.filter((p): p is PackManifest => p !== null);
}

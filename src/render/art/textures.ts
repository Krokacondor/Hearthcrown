// Turns art IDs into Three.js textures through the registry: a pack image when there is one,
// otherwise the built-in SVG drawing. Loading is async; materials keep a flat colour until it lands.
import * as THREE from "three";
import { drawBuiltin } from "./builtins";
import type { ArtRegistry } from "./registry";

export interface ArtTextures {
  /** Gives `material` the texture for `id` once it loads (the promise settles then). `repeat` tiles it. */
  apply(material: THREE.MeshLambertMaterial | THREE.MeshBasicMaterial, id: string, repeat?: [number, number]): Promise<void>;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src.slice(0, 80)}`));
    img.src = src;
  });
}

const svgUrl = (svg: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export function createArtTextures(registry: ArtRegistry, maxAnisotropy: number): ArtTextures {
  const images = new Map<string, Promise<HTMLImageElement>>();

  const imageFor = (id: string): Promise<HTMLImageElement> => {
    let p = images.get(id);
    if (!p) {
      const src = registry.resolve(id);
      const builtin = (): Promise<HTMLImageElement> => loadImage(svgUrl(drawBuiltin(src.id).svg));
      p = src.kind === "image"
        ? loadImage(src.url).catch(() => {
          console.warn(`Art "${id}" from ${src.url} could not be loaded; using the built-in drawing.`);
          return loadImage(svgUrl(drawBuiltin(id).svg));
        })
        : builtin();
      images.set(id, p);
    }
    return p;
  };

  return {
    apply(material, id, repeat) {
      return imageFor(id).then((img) => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAnisotropy;
        if (repeat) {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(repeat[0], repeat[1]);
        }
        tex.needsUpdate = true;
        material.map = tex;
        material.color.set(0xffffff);
        material.needsUpdate = true;
      }).catch((e: unknown) => console.warn(`Art "${id}" failed to draw:`, e));
    },
  };
}

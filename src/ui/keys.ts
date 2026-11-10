export type CameraAction = { kind: "turn"; dir: -1 | 1 } | { kind: "zoom"; dir: -1 | 1 };

/** Q / E turn the camera; + / = zoom in (closer); - / _ zoom out. Case-insensitive. */
export function cameraActionForKey(key: string): CameraAction | null {
  switch (key.toLowerCase()) {
    case "q": return { kind: "turn", dir: -1 };
    case "e": return { kind: "turn", dir: 1 };
    case "+":
    case "=": return { kind: "zoom", dir: -1 };
    case "-":
    case "_": return { kind: "zoom", dir: 1 };
    default: return null;
  }
}

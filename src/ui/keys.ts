import { actionFor } from "./bindings";

export type CameraAction = { kind: "turn"; dir: -1 | 1 } | { kind: "zoom"; dir: -1 | 1 };

/** Camera keys from the bindings table (by default Q / E turn, + / = zoom in, - / _ zoom out). */
export function cameraActionForKey(key: string): CameraAction | null {
  switch (actionFor("camera", key)) {
    case "turnLeft": return { kind: "turn", dir: -1 };
    case "turnRight": return { kind: "turn", dir: 1 };
    case "zoomIn": return { kind: "zoom", dir: -1 };
    case "zoomOut": return { kind: "zoom", dir: 1 };
    default: return null;
  }
}

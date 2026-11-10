import { describe, expect, it } from "vitest";
import { cameraActionForKey } from "../../src/ui/keys";

describe("cameraActionForKey", () => {
  it("maps q / E to turn left / right", () => {
    expect(cameraActionForKey("q")).toEqual({ kind: "turn", dir: -1 });
    expect(cameraActionForKey("E")).toEqual({ kind: "turn", dir: 1 });
  });

  it("maps + and = to zoom in (closer) and - to zoom out", () => {
    expect(cameraActionForKey("+")).toEqual({ kind: "zoom", dir: -1 });
    expect(cameraActionForKey("=")).toEqual({ kind: "zoom", dir: -1 });
    expect(cameraActionForKey("-")).toEqual({ kind: "zoom", dir: 1 });
    expect(cameraActionForKey("_")).toEqual({ kind: "zoom", dir: 1 });
  });

  it("returns null for unrelated keys", () => {
    for (const k of ["Escape", "w", "ArrowUp", "Enter", " ", ""]) expect(cameraActionForKey(k)).toBeNull();
  });
});

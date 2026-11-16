import { describe, expect, it } from "vitest";
import bindings from "../../src/data/keybindings.json";

describe("keybindings.json", () => {
  it("gives every action at least one key", () => {
    for (const [context, actions] of Object.entries(bindings)) {
      for (const [action, keys] of Object.entries(actions as Record<string, string[]>)) {
        expect(keys.length, `${context}.${action}`).toBeGreaterThan(0);
      }
    }
  });
  it("never binds one key to two actions in the same context", () => {
    for (const [context, actions] of Object.entries(bindings)) {
      const seen = new Map<string, string>();
      for (const [action, keys] of Object.entries(actions as Record<string, string[]>)) {
        for (const key of keys) {
          const k = key.toLowerCase();
          expect(seen.get(k), `${context}: ${key} is bound to ${seen.get(k)} and ${action}`).toBeUndefined();
          seen.set(k, action);
        }
      }
    }
  });
  it("keeps build keys from clashing with camera keys", () => {
    const cam = Object.values(bindings.camera).flat().map((k) => k.toLowerCase());
    for (const k of Object.values(bindings.build).flat()) expect(cam).not.toContain(k.toLowerCase());
  });
});

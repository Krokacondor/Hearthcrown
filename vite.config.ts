import { defineConfig } from "vitest/config";

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the game at /Hearthcrown/; the dev server stays at the root.
  base: command === "build" ? "/Hearthcrown/" : "/",
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
}));

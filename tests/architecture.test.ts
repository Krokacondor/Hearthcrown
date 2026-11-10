import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SIM_DIR = join(import.meta.dirname, "..", "src", "sim");

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return tsFiles(path);
    return name.endsWith(".ts") ? [path] : [];
  });
}

const files = tsFiles(SIM_DIR).map((path) => ({
  name: relative(SIM_DIR, path),
  source: readFileSync(path, "utf8"),
}));

describe("src/sim stays pure", () => {
  it("has files to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("$name does not use Math.random", ({ source }) => {
    expect(source).not.toMatch(/Math\.random/);
  });

  it.each(files)("$name does not import render/ or ui/", ({ source }) => {
    // Catches `from "x"`, bare `import "x"`, and dynamic `import("x")`.
    const imports = [
      ...source.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*["']([^"']+)["']/g),
    ].map((m) => m[1]);
    for (const path of imports) {
      expect(path).not.toMatch(/(^|\/)(render|ui)(\/|$)/);
    }
  });

  it.each(files)("$name does not import three", ({ source }) => {
    const imports = [
      ...source.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*["']([^"']+)["']/g),
    ].map((m) => m[1]);
    for (const path of imports) {
      expect(path).not.toMatch(/^three(\/|$)/);
    }
  });

  it.each(files)("$name does not touch the DOM or browser storage", ({ source }) => {
    expect(source).not.toMatch(/\b(document|window)\.|\blocalStorage\b/);
  });
});

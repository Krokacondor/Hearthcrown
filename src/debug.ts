import type { CommandResult, Game, Snapshot } from "./sim/game";

/** Read-only view plus test commands, exposed as window.__hearthcrown in dev builds only. */
export interface DebugHook {
  getState(): Snapshot;
  cmd(name: string, args?: Record<string, unknown>): CommandResult;
  /** The townsfolk, for tests and the console. */
  people(): { id: number; name: string; role: string; x: number; z: number; state: string; home: number | null }[];
}

/** Commands that change the town itself (buildings and roads), so the picture must redraw. */
const TOWN_CHANGES = new Set(["placeBuilding", "placeRoad", "removeRoad", "setSeed"]);

/** `onChange` runs after a command that changed the game, so the picture can redraw. */
export function createDebugHook(game: Game, onChange?: () => void): DebugHook {
  return {
    getState: () => game.snapshot(),
    cmd: (name, args) => {
      const result = game.command(name, args);
      if (result.ok && TOWN_CHANGES.has(name)) onChange?.();
      return result;
    },
    people: () => game.world.people.map(({ id, name, role, x, z, state, home }) => ({ id, name, role, x, z, state, home })),
  };
}

export function installDebugHook(target: { __hearthcrown?: DebugHook }, game: Game, onChange?: () => void): void {
  target.__hearthcrown = createDebugHook(game, onChange);
}

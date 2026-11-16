import type { CommandResult, Game, Snapshot } from "./sim/game";

/** Read-only view plus test commands, exposed as window.__hearthcrown in dev builds only. */
export interface DebugHook {
  getState(): Snapshot;
  cmd(name: string, args?: Record<string, unknown>): CommandResult;
}

/** `onChange` runs after a command that changed the game, so the picture can redraw. */
export function createDebugHook(game: Game, onChange?: () => void): DebugHook {
  return {
    getState: () => game.snapshot(),
    cmd: (name, args) => {
      const result = game.command(name, args);
      if (result.ok && name !== "checkPlacement") onChange?.();
      return result;
    },
  };
}

export function installDebugHook(target: { __hearthcrown?: DebugHook }, game: Game, onChange?: () => void): void {
  target.__hearthcrown = createDebugHook(game, onChange);
}

import type { CommandResult, Game, Snapshot } from "./sim/game";

/** Read-only view plus test commands, exposed as window.__hearthcrown in dev builds only. */
export interface DebugHook {
  getState(): Snapshot;
  cmd(name: string, args?: Record<string, unknown>): CommandResult;
}

export function createDebugHook(game: Game): DebugHook {
  return {
    getState: () => game.snapshot(),
    cmd: (name, args) => game.command(name, args),
  };
}

export function installDebugHook(target: { __hearthcrown?: DebugHook }, game: Game): void {
  target.__hearthcrown = createDebugHook(game);
}

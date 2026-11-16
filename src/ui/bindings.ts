// Every key the game listens to comes from data/keybindings.json, so a Settings screen can show and change them (M18).
import bindings from "../data/keybindings.json";

export type Context = keyof typeof bindings;

/** The action a key triggers in a context, or null. Case-insensitive. */
export function actionFor<C extends Context>(context: C, key: string): keyof (typeof bindings)[C] | null {
  const k = key.toLowerCase();
  for (const [action, keys] of Object.entries(bindings[context]) as [string, string[]][]) {
    if (keys.some((b) => b.toLowerCase() === k)) return action as keyof (typeof bindings)[C];
  }
  return null;
}

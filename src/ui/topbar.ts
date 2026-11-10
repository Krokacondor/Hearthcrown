import type { Snapshot } from "../sim/game";

const DAY_MINUTES = 24 * 60;

/** Minutes since midnight as "h:mm", wrapping past midnight. */
export function formatClock(minutes: number): string {
  const m = ((Math.floor(minutes) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

/** Marker position on the Loved (left, +100) ↔ Feared (right, −100) meter, 0..100. */
export function lovedFearedPercent(reputation: number): number {
  const r = Number.isFinite(reputation) ? Math.max(-100, Math.min(100, reputation)) : 0;
  return (100 - r) / 2;
}

/** Writes the snapshot into the top bar's read-only fields. */
export function renderTopBar(root: HTMLElement, snap: Snapshot): void {
  const set = (name: string, text: string) => {
    const el = root.querySelector<HTMLElement>(`[data-stat="${name}"]`);
    if (el) el.textContent = text;
  };
  set("day", String(snap.day));
  set("time", formatClock(snap.time));
  set("gold", snap.gold.toLocaleString("en-US"));
  const meter = root.querySelector<HTMLElement>("[data-stat='reputation']");
  if (meter) {
    meter.style.setProperty("--pos", `${lovedFearedPercent(snap.reputation)}%`);
    meter.setAttribute("aria-valuenow", String(snap.reputation));
    meter.setAttribute("aria-valuetext", snap.reputation === 0 ? "Even" : snap.reputation > 0 ? `Loved ${snap.reputation}` : `Feared ${-snap.reputation}`);
  }
}

# Working rules for this project

You are building **Hearthcrown**, a top-down 2D browser kingdom-management game where the player is a princess rebuilding her capital. The full design is in `PLAN.md`. Read it before starting any work.

## One-time setup (the human runs these)
```bash
# Superpowers: planning, TDD, debugging and review workflow
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace

# Impeccable: UI design skill (run from the project root)
npx impeccable skills install

# Playwright MCP: lets Claude drive a real browser
claude mcp add playwright npx @playwright/mcp@latest
```
Restart Claude Code after installing. If any of these are missing when you start, say so before doing anything else.

## How to work (Superpowers)
- Build **one milestone at a time**, in the order in `PLAN.md` section 6. Don't start the next one until the current one runs in the browser, all tests pass, and the Playwright check below passes.
- At the start of a session, read `PROGRESS.md`. At the end of each milestone, add a short entry: what was built, what's left, known bugs.
- For each milestone:
  1. Use **brainstorming** to confirm scope and open questions with me. Design questions come to me; don't guess.
  2. Use **writing-plans** to break it into small tasks. Save the plan to `docs/plans/M<number>.md` and wait for my approval.
  3. Implement with **test-driven-development**: write the failing test for each rule first, then the code.
  4. Use **requesting-code-review** between tasks.
  5. Use **finishing-a-development-branch** to wrap up the milestone.
- When something breaks, use **systematic-debugging** instead of guessing at fixes.
- Keep commits small, one per logical step, with clear messages.

## UI and visual design (Impeccable)
- Once, in M0: run `/impeccable init` to create `PRODUCT.md` and `DESIGN.md` from `PLAN.md`. The look: a warm, readable storybook-kingdom feel with simple shapes. Every UI panel and the canvas palette follow `DESIGN.md`.
- Before building any new panel or dialog: `/impeccable shape`.
- After each milestone that adds UI: `/impeccable critique`, then `/impeccable audit` (accessibility, responsiveness), then `/impeccable polish`.
- Use `/impeccable clarify` on UI text, such as event and petition wording and button labels.
- Impeccable is for HTML/CSS UI and the overall look. Game rules still come from `PLAN.md`.

## Browser checks (Playwright MCP)
The canvas can't be read from the page's accessibility tree. To make the game testable:
- Expose a read-only debug hook in dev builds: `window.__hearthcrown` with `getState()` (day, time, gold, reputation, counts of buildings, citizens and adventurers) and `cmd(name, args)` for test commands (place building, advance time, set seed).
- Show key state in the HTML UI (top bar, panels) so snapshots can read it.

At the end of every milestone, with `npm run dev` running:
1. Open the game with Playwright.
2. Check the console for errors. There must be none.
3. Exercise the milestone's features through the UI (and the debug hook where needed). For example: place a building, advance a day, open the night report.
4. Take a screenshot and look at it to confirm the canvas draws what it should.
5. Record what you checked in `PROGRESS.md`.

## Code rules
- TypeScript, strict mode. Vite for dev and build. Vitest for tests.
- Rendering is plain Canvas 2D. Don't add a game engine or UI framework without asking.
- `src/sim/` is pure logic: no DOM, no `Math.random()`. Use the seeded RNG in `sim/rng.ts`.
- `render/` and `ui/` read sim state and call sim commands. They never change state directly.
- All tunable numbers and all content (styles, races, traits, events, petitions, story, buildings, dungeons) go in `src/data/*.json`, not in code.
- Events, traits, petitions, story and buildings apply their results through the shared effects runner in `sim/effects.ts`. Add a new effect type there instead of special-casing content.
- Terminology: classes are called **Styles**. Adventurers start as **Novice**. Adventurers never die. Once a party leaves town, the player cannot affect it until it returns.
- There is no game over and no debt. Gold never goes below zero. Every gold cost in content is either `require` (option disabled when unaffordable) or `takeWhatYouCan`.
- Names, art and text must be original. Don't reuse names or assets from existing games.

## Commands
- `npm run dev`: start the game locally
- `npm test`: run unit tests
- `npm run sim -- --days 100 --seed 7`: headless simulation (added in M19)

## When unsure
Ask about design questions. For small implementation details, pick the simplest option and note it in `PROGRESS.md`.

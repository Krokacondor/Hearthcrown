# Hearthcrown — Game Design & Build Plan

Working title: **Hearthcrown**. A top-down 2D browser game. You play a young **princess** who must rebuild the fallen capital from an empty field. You never fight. You build the city, issue daily decrees, walk the streets, and hear your people's pleas. Adventurers live in your city and clear dungeons on their own. Once they leave the gates, they are out of your hands until they return.

This plan is written for an AI coding assistant to implement milestone by milestone. Read `CLAUDE.md` for working rules.

All names, characters, story and art are original. Do not use names, terms or assets from any existing game.

---

## 1. Pillars

1. **You rule, they adventure.** No direct combat control and no influence once a party leaves town.
2. **Everyone starts as a Novice.** Adventurers grow into a **Style** (class) through events, items and rare discoveries. The princess guides but cannot simply dictate.
3. **Bonds make parties.** Adventurers who work well together become friends, pair up more, and may one day ask to become a permanent guild.
4. **Every day starts with a choice.** A morning event with consequences sets the tone.
5. **A living city.** Many buildings that do something, including a few for the princess herself.
6. **The princess walks her city.** She has time each day to walk around, talk to adventurers, build and upgrade. People also come to her in the Audience Hall.
7. **Data-driven.** Styles, races, traits, buildings, events, petitions, dungeons and story live in JSON.
8. **No game over.** Bad choices close doors and slow you down, but the city always keeps running. There is no debt, no collapse and no failure screen.

---

## 2. Tech stack

- **TypeScript + Vite**, rendered with the plain **HTML Canvas 2D API**. No game engine.
- **Vitest** for unit tests of simulation logic.
- **No backend.** Saves go to `localStorage` as JSON with a version number.
- Art: a **flat, hand-drawn chibi cartoon** style, drawn in code as vector shapes (SVG paths / Canvas `Path2D`). Thick dark outlines with a slight hand-drawn wobble, flat fills, minimal shading, big round heads, dot eyes, rosy cheeks. Characters are about 1.5 tiles tall on the map, and the same drawing scales up for portraits in dialogs and the Audience Hall. Reference: `docs/art/princess-reference.png` (option B). The style is our own; no characters, art or exact look from any existing game. See 4.21 for character looks.

### 2.1 Replaceable art
All art must be replaceable later, piece by piece, without code changes (for example by a human artist who doesn't want AI-made art in the game).
- **Art by name only.** Sim and UI code refer to art by stable IDs (`hair.female.long_wavy`, `building.cottage.1`, `tile.road`, `icon.gold`, `portrait.princess`). Nothing outside `render/art/` knows how a piece is drawn.
- **Art packs.** A manifest maps each ID to a source: `code` (a built-in vector drawing) or an image file (PNG or SVG) in `public/art/<pack>/`. Packs can be partial. Any ID a pack doesn't cover falls back to the built-in code drawing, so a half-finished pack never breaks the game.
- **Fixed frames and anchors.** Every character part shares one frame size and anchor (feet on the ground line, head position), and every building size has its own frame, so swapped layers always line up.
- **Recolorable layers.** Parts that take colors (skin, hair, outfits) come as a fill layer the game tints plus a line layer drawn on top.
- **Artist kit.** `docs/art/ART-GUIDE.md` (frame sizes, anchors, layer order, tinting, walk frames, file naming) and blank template images with guides, usable in any drawing program.
- **Art gallery.** A dev-only page showing every art ID and random character combinations, for checking new art in place.
- Built in M1 (registry, packs, buildings and tiles) and M2 (character parts, gallery, ART-GUIDE).

### Architecture

```
src/
  sim/              pure simulation, no DOM, deterministic given a seed
    world.ts        World state
    grid.ts         lots, cells, placement rules
    paths.ts        road graph + Dijkstra
    time.ts         clock, day phases
    rng.ts          seeded RNG
    stats.ts        the nine stats, derived values (damage, hit, dodge...)
    effects.ts      shared effect runner used by events, traits, petitions, story
    agents/         princess.ts, citizen.ts, adventurer.ts, routines.ts
    systems/        economy, shops, research, decrees, lodge (parties),
                    bonds, traits, styles, dungeons, combat, events,
                    petitions (audience), story, gambling, retirement,
                    unlocks, score
  data/             JSON: buildings, races, styles, skills, traits, items,
                    research, dungeons, events, petitions, story, balance, map
  render/           canvas: map, buildings, walkers, princess, overlays
  ui/               HTML/CSS panels and dialogs
  main.ts           fixed-tick sim loop + requestAnimationFrame render
tests/
```

Rules: `sim/` never imports `render/` or `ui/`. The UI only calls sim commands. Every random roll uses the seeded RNG.

**Effects system.** Events, traits, petitions, story beats and buildings all describe results the same way, as a list of effects in JSON, for example:

```json
[{ "type": "gold", "amount": -200 },
 { "type": "bond", "a": "$adv1", "b": "$adv2", "amount": 10 },
 { "type": "changeStyle", "target": "$adv1", "style": "duelist" },
 { "type": "addTrait", "target": "$adv1", "trait": "brave" }]
```

One `effects.ts` runner applies them, so new content never needs new code.

**Gold and Emberstone effects never go below zero.** Each gold or Emberstone cost in content is marked one of two ways:
- `"mode": "require"`: the choice is greyed out if the princess can't afford it (e.g. funding a citizen's new business).
- `"mode": "takeWhatYouCan"`: the princess loses the amount or everything she has, whichever is less (e.g. a theft event).

---

## 3. The city map

- A fixed, hand-made map in `data/map.json`:
  - **Cells** on a 16 px grid grouped into named **plots**.
  - **Lots**: every legal placement, with size (1×1, 2×1, 2×2, 3×2), covered cells, door side, and the road segment the door connects to.
  - **Road graph** with three **gates** (west, south, east) and the **castle**.
- The game starts with a cleared field: the castle, roads, one decree board, and rubble.
- Build a simple in-browser **map editor** early so the map can grow without hand-editing JSON.

---

## 4. Core systems

All numbers are starting values in `data/balance.json`.

### 4.1 Time & the daily loop
One in-game day ≈ 6 real minutes at 1× (pause, 1×, 2×, 4×).

**Game length:** the main story targets **200–300 in-game days** (about 20–30 hours at 1×). Difficulty, New Game+ and tuning can shift it; the dials live in `balance.json`.

1. **Morning event** (06:00): a short scene with a choice (4.10). Time is paused.
2. **Preparation**: adventurers rest, shop, meet at the Lodge, and sign up for decrees. The princess answers sign-ups.
3. **Day**: parties leave town. The princess walks the city, talks to people, builds and upgrades, holds audiences, and visits buildings like the Gambling Hall.
4. **Dusk** (18:00): parties return, get paid, injuries and loot are tallied.
5. **Night report**: summary of the day, bond changes, style changes, unlocks, story beats, retirements.

### 4.2 The princess
- A walkable character on the map (click to move along roads, or arrow keys).
- During the day she can: talk to anyone with an icon over their head, start construction or upgrades, enter buildings (Audience Hall, Gambling Hall, Library...), and use items on adventurers who are still in town.
- Walking takes in-game time, so a compact city leaves her more time.
- **Face to face.** People are only dealt with in person. Talking to an adventurer or citizen, booking a Royal Garden appointment (done at the garden), and using items on an adventurer all require walking to them. Panels such as Adventurers only show information; they never offer "talk" or "book" buttons. The Build menu and Decrees are the menus that act directly.
- **She is immortal.** Everyone else ages, retires and is succeeded by the next generation; she never ages. She is a guardian who wakes when the realm needs her (see 4.3).
- **Wardrobe.** She unlocks outfits over the game (story, masters, rare finds, research), each with a perk, e.g. Riding Habit (walks faster), Court Gown (friendlier petitioners), Traveling Cloak (talking fills the morale gauge faster). She changes at the castle. Outfits are art layers (2.1). Details in M16.

### 4.3 Story
- Told in **chapters** (`data/story.json`). Each chapter has a goal (e.g. "Clear the Mirewood", "Reach 40 citizens"), scenes and rewards.
- Scenes use a dialogue box with portraits and choices, through the effects system.
- Chapter goals unlock dungeons, buildings, races, styles and masters. The final chapter ends the game and shows the score.
- Recurring cast: the princess, her advisor (her right-hand aide), a rival noble, a mysterious traveler. All original.
- **The villain** is data: a set of story beats with swappable faces (name, look, dialogue). Same goals each time; each New Game+ deals a different face. The advisor may find the new one suspiciously familiar.

**Ending and post-game**
- The finale is the **adventurers** saving the realm; the princess never fights. Her purpose fulfilled, she **turns to stone** (a statue in the town she built). Ending scene → score screen (4.20) → credits.
- **Continuing the save:** about a day later evil stirs and she breaks out of the stone at once. Comedic beat; the advisor says something like *"Evil has risen once more! ...It's been a day, Your Highness."* Nothing else has changed: same town, adventurers, bonds. Play continues into post-game content (extra chapters, harder dungeons, new masters or Styles).
- **New Game+** is the long sleep: a long age has passed, the city is gone, and she rebuilds from the field. See 4.22.

### 4.4 Stats
| Stat | Effect |
|---|---|
| Vigor | Max HP |
| Strength | Physical attack damage |
| Intelligence | Arcane magic damage and arcane healing (fire, ice, lightning...) |
| Faith | Holy and necrotic damage and healing |
| Agility | Chance to dodge attacks, spells and skills |
| Dexterity | Chance to hit with attacks, spells and skills |
| Speed | Turn order |
| Toughness | Reduces physical damage taken |
| Spirit | Reduces magic damage taken |

Each style has growth rates per stat. Traits can modify growth.

### 4.5 Races
Races are never locked to a style. A race only nudges the **starting stat roll** slightly. It has no effect on growth rates. Anyone can become anything.

| Race | Starting-stat lean |
|---|---|
| Human | None. Even rolls. |
| Elf | Slightly higher Agility, Dexterity, Intelligence |
| Dwarf | Slightly higher Strength, Vigor, Toughness |
| Beastkin | Depends on the animal (e.g. wolf: Speed and Strength; bear: Vigor and Toughness; fox: Agility and Dexterity) |
| Angelfolk | Slightly higher Faith, Spirit, Speed |

Each race has its own home building. Races unlock through the story.

### 4.6 Styles
Every adventurer starts as a **Novice**: the weakest style, able to use tier-1 gear, skills and spells from every category.

**Every other style is equal in standing**, each with clear pros and cons. There are no advanced or upgraded styles.

| Style | Role | Pros | Cons |
|---|---|---|---|
| Novice | Generalist | Uses tier-1 of everything | Weakest at all of it |
| Knight | Tank | High Toughness growth, protects allies | Slow, low damage |
| Warrior | Bruiser | High Strength and Vigor | Weak to magic, no healing |
| Paladin | Tank / bruiser / healer | Does a bit of everything | Masters nothing, expensive gear |
| Priest | Healer, holy and necrotic damage | Strong Faith healing | Fragile |
| Mage | Arcane burst damage | Highest burst | Fragile, slow, misses without Dexterity |
| Beast Master | Tank or damage, depends on pet | Pet adds a body to the fight | Weak without the pet, pet needs care |
| Duelist | Critical-hit damage | Huge crits, dodges well | Low HP |
| Ranger | Ranged physical damage | Hits first, accurate | Weak up close |
| Bard | Buffs and debuffs | Makes the whole party better | Little damage of their own |

More styles can be added in data, including **rare styles** (4.6.3).

**How styles change.** The princess cannot simply assign styles. There are three ways:

1. **Style request event.** Now and then, an adventurer asks the princess whether they should take up a specific style. Yes changes it immediately. No keeps them as they are.
   - Requests are weighted toward styles that fit the adventurer: their stats, the skills and gear they've used, their traits, and past choices.
   - Every so often they make a ridiculous request (a frail mage-minded elf wanting to be a Knight). Saying yes is allowed.
2. **Style items.** The princess uses a style item on an adventurer who is in town.
   - Sources: rare dungeon drops, research at style buildings, and gifts from **masters** (4.7).
   - Most items are for one style. Very rare items let her choose any available style.
   - Using one ends the adventurer's day: they cancel their plans and go home.
3. **Rare dungeon events.** Extremely rare moments in a dungeon can grant a **rare style** that can't be obtained any other way.

### 4.7 Masters
- Special NPC teachers who arrive through the story or events (one per style, plus a few for town buildings).
- A master can be stationed at a matching building to unlock its upgrades and new research, such as better gear and skills or style items.
- Masters sometimes gift a style item, or ask the princess for something in return.

### 4.8 Traits
- Every adventurer has 2–3 **traits**: one visible at recruitment, the others discovered over time (talking, events, the Library).
- Traits can be gained or lost through events, bonds and style changes.
- Traits affect, through the effects system:
  - **Shopping**: which shops they prioritize.
  - **Breaks**: how often they rest (*Tireless*, *Lazy*).
  - **Gear and magic**: weapon and spell types they prefer (*Axe Lover*, *Pyromaniac*).
  - **Unique abilities**: some traits unlock a special skill (*Lion Heart* grants a rally shout).
  - **Growth**: stat growth (*Late Bloomer*, *Prodigy*) and relationship growth (*Charming*, *Loner*, *Hothead*).
  - **Style requests**: which styles they tend to ask for.
- About 30 traits in v1, a few rare.

### 4.9 Adventurers
- Homes produce **apprentices**. The princess **recruits** them. The adventurer cap grows with Lodge upgrades (start 4, max 16).
- Each has: race, style, level, the nine stats, motivation (0–100), gold, gear, traits, bonds, and age.
- **Adventurers cannot die.** If a whole party is defeated, they return to town injured and need time to recover.
- **Storybook aging** (working assumption, tuned in M19): aging runs much faster than the calendar so generations fit in a 200–300 day game. Starting points: adventurers think about retiring after ~120–180 days of service; a newborn reaches apprentice age in ~60–80 days.
- **Retirement**: after long service, an adventurer starts thinking about retiring. Events and items can delay it. When they retire, they leave a parting gift and their home can produce a new apprentice.
- **Settling down**: a special retirement event where a **married couple** retires together and has a child. The family lives in town; the child grows up as a citizen (look rolled from both parents, 4.21) and can become an apprentice.
- **Daily routine (state machine):**
  1. If motivation ≤ 30 → rest at home today.
  2. If a rest building (Fountain, Bathhouse, Garden) is within **50 units** of home → rest there (+10 to +19 motivation).
  3. **Shopping**: up to 3 shops, chosen by priority (style weights + trait modifiers). Each morning every shop's priority grows by its weight; visiting resets it.
  4. Go to the **Adventurers' Lodge**, form or join a party (4.11), sign up for decrees.
  5. Walk to the right gate and leave. Out of the princess's reach until dusk.
  6. Return, get paid, go home. Overnight +20 motivation.
- **Buying**: the best affordable item at or below 120% of their level, filtered by style and traits.

### 4.10 Morning events
- Each day opens with one event from a weighted, conditional deck (`data/events.json`).
- Conditions can check the date, chapter, gold, buildings, specific adventurers, traits, bonds, or past choices.
- Choices apply effects to gold, morale, citizens, adventurers, bonds, traits, styles, or start a story beat.
- Style request events (4.6) are part of this deck.
- About 60 events in v1, including chains over several days.

### 4.11 Parties, bonds and guilds
- **One building forms parties: the Adventurers' Lodge**, unlocked in chapter 1.
- **Bonds**: every pair of adventurers has a score (−100 to 100).
  - Gains: runs together, successful clears, covering each other in a fight, shared events, matching traits.
  - Losses: failed runs, injuries blamed on someone, clashing traits, rivalry events.
  - Tiers: Strangers → Acquainted → Friends → Close → Sworn. Higher tiers give bonuses when fighting together.
- **Princess bonds**: each adventurer also has a bond score with the princess. Royal Garden appointments raise it; Feared commands (4.19) lower it.
- **Relationships**: adventurers can be **dating** and later **married**, shown plainly in profiles, the bond web and the night report. Dates at the Royal Garden move a couple along. Couples get a bonus in the same party. Married couples may later settle down (4.9). Thresholds and how marriage happens (e.g. a petition for the princess's blessing) are decided in M11.
- **Party forming**: each morning at the Lodge, adventurers group up by bond strength + role balance (tank, healer, damage) + decree interest.
- **Permanent guilds**: a group that runs together often with high bonds may decide on its own to become a guild. They bring a **petition** to the princess, who approves or declines. Guilds get a name, a banner color and perks. Declining can hurt bonds or motivation.

### 4.12 Decrees (quests)
- The princess posts decrees on a board: **Clear** a dungeon, **Explore** it, **Gather** materials, **Escort**, or **Train**.
- Adventurers sign up and show a mood bubble: yellow (motivation 91–100), green (51–90), blue (≤ 50).
- Options: **Approve**, **Gain XP** (go adventuring without the decree), or **Rest**. Unanswered sign-ups decide on their own at 14:00 (> 50 accept, ≤ 50 go home).
- Once a party leaves town, nothing can be changed until they return.

### 4.13 Dungeons & combat
- A world map of ~20 dungeons, each with a level, gate, rooms, boss, loot, materials and neighbors.
- A dungeon is reachable once a **neighbor is cleared**. It becomes visible when a neighbor is explored past a set percent.
- **Resolution**: room by room, simulated as quick turn-based fights using the nine stats (Speed for turn order, Dexterity vs Agility to hit, Strength / Intelligence / Faith for damage, Toughness / Spirit to reduce it). Results: HP loss, XP, gold, materials, exploration %, bond changes, and rare dungeon events.
- Retreat when HP < 30% or motivation ≤ 20 (thresholds shift with traits). A full party defeat sends everyone home injured. Boss beaten = cleared.
- Clears give rewards that advance the game: unlocks, materials, style items, story progress, cap increases.
- Each run writes a short log for the night report with memorable moments ("Mira shielded Tobin from the troll's club").

### 4.14 Buildings
Each building has a size, cost, unlock, max count and upgrade levels in `data/buildings.json`. Daily caps: 10 builds, 5 demolitions.

- **Buildings and upgrades cost Emberstone** (4.18). A few special buildings also cost gold on top (e.g. the Gambling Hall).
- **Demolish** unlocks early in a first playthrough (chapter 1). New Game+ has it from day one.

**Homes**: Cottage (1×1, 1 citizen), Family Home (2×1, 3 citizens), Manor (2×2, 6 citizens), and one race home per race (1×1).

**For adventurers**

| Building | What it does |
|---|---|
| Adventurers' Lodge | Forms parties, hosts guild petitions, raises the adventurer cap with upgrades |
| Blacksmith, Armorer, Apothecary | Sell gear and potions; research lines |
| Style buildings: Barracks, Chapel, Mage Tower, Kennel, Fencing Hall, Archery Range, Theater | Teach style skills, research style items, host that style's master |
| Infirmary | Injured adventurers recover in half the time |
| Bathhouse | Rest spot with a bigger motivation boost |
| Workshop | Crafts gear from dungeon materials |
| Library | Reveals hidden traits, speeds up research |

**For the town**

| Building | What it does |
|---|---|
| Bakery | Nearby households are happier |
| Market | Traveling merchants with rare stock |
| Fountain, Garden | Rest spots and citizen gathering points |
| Bank | Interest on stored gold |
| Watchtower | Reveals nearby dungeons |
| Festival Square | Festivals for morale |

**For the princess**

| Building | What it does |
|---|---|
| Audience Hall | Petitioners come to the princess (4.15) |
| Gambling Hall | Mini-games for the princess (High-Low, dice, wheel) with a daily bet limit. Also pays taxes every night, more when citizens are happy. Adventurers with the *Gambler* trait visit too. |
| Royal Garden | Where bonds grow. **Appointments:** the princess pays a small gold fee (`require`) to book one specific adventurer for the next day; that adventurer **stays in town** that day and their bond with her grows. **Meetups:** 2–4 adventurers who get along arrange a day there on their own (they skip adventuring), growing bonds with each other. **Dates:** two adventurers with a strong bond go on dates there (4.11). Traits shape visits (*Charming* bonds faster, *Loner* prefers one-on-one, clashing traits can bicker). Upgrades may add guest capacity or spots with small bonuses. |
| Makeover building (optional, name TBD) | Late unlock. For a **large** gold fee (`require`) the princess magically changes **anyone's** look, citizen or adventurer, slot by slot (4.21). It's magic: the person simply accepts their new look, with no mood, bond or reputation effect. Purely aesthetic, for creative freedom. **Locked:** skin tone, race and race features, and a beastkin's animal type. Parts come from the person's own pool (male or female, 4.21). **Stretch goal:** the princess may change her own hair color, and maybe her hair style; nothing else about her. |

### 4.15 Audience Hall (petitions)
Inspired by quick yes-or-no court games.
- Inside the hall, petitioners come up one at a time: citizens, adventurers, merchants, masters, nobles, strange visitors.
- Each petition is a short request with **Yes** or **No**. Some offer a third option: a **promise** with a deadline ("I'll build you a bakery within 7 days").
- Effects go through the effects system: gold, morale, population, a citizen's happiness, an adventurer's bond or motivation, new traits, story flags.
- **Promises** are tracked with a deadline. Keep them for a reward. Break them for a penalty, and the petitioner remembers.
- Recurring characters return with follow-ups based on earlier answers.
- Petitions that cost gold use `"require"`: if the treasury can't cover it, Yes is greyed out.
- Many petitions shift the princess's **reputation** (4.19).
- About 80 petitions in v1 (`data/petitions.json`).

### 4.16 Talking around town
- People with something to say show an icon over their head: gossip, a request, a trait hint, a bond hint, a style hint, a story beat.
- The princess walks up and talks: 2–4 lines and maybe a choice. Talking fills the town **morale gauge**. A full gauge pays gold and resets.
- Shorter and less frequent than in classic games of this type, but still a daily part of play.

### 4.17 Research
- Shops and style buildings have research lines. Funding raises the max item level sold, the skill tier taught, or unlocks style items.
- Shops sell every level from 1 up to the research level.
- Total research levels count toward the end score.

### 4.18 Treasury and population
- **Treasury** is just the princess's spending money. Upkeep of the city is assumed to be covered. Gold never drops below zero and there is no debt (see the effects rules in section 2). Being broke only means she can't fund research, pay for appointments, or say yes to costly petitions.
- **Emberstone** is the building material: glowing stones that rebuild the kingdom from its embers. Buildings and upgrades cost Emberstone. It comes from dungeon clears and decrees (other sources may be added through effects). Like gold, it never drops below zero.
- **Gold** pays for research, shop funding, petitions, Royal Garden appointments, makeovers, and the gold part of a few special buildings.
- **Population** is not a meter. When a home is built, named citizens move in (with names, a household, and sometimes an apprentice). Population is simply the count of residents.

### 4.19 Reputation: Loved ↔ Feared
A single slider from **−100 (Feared)** to **+100 (Loved)**, starting at 0. Morning events, petitions, promises and some conversations move it.

- **Kind choices** (helping citizens, keeping promises, granting rest, approving guilds) move it toward **Loved**.
- **Harsh choices** (refusing pleas, punishing, demanding, breaking promises) move it toward **Feared**.

Each side opens different options. The farther toward an end, the stronger the effect. Starting values, tunable in `balance.json`:

| | Loved (positive) | Feared (negative) |
|---|---|---|
| Citizens | Happier, pay a bit more tax, more apprentices appear | Quieter, fewer requests |
| Petitions | Friendlier asks, gifts, discounts from merchants | Fewer petitions, more bribes and tribute |
| Adventurers | Faster bond growth, better reaction to "No" on style requests | **Command options** unlock (below) |
| Events | Unlocks generous event choices | Unlocks ruthless event choices |

**Command options when Feared** (the princess can be more aggressive with adventurers):
- **Assign** an adventurer to a specific decree, instead of waiting for sign-ups.
- **Deny rest**: send a low-motivation adventurer out anyway.
- **Order** a party to change its target before it leaves town.
- **Overrule** a guild's decision to form or break up.

Each command works but costs the adventurer motivation and bond with the princess, and pushes reputation further toward Feared.

Reputation has no failure state at either end. It's a playstyle, not a meter to keep balanced.

### 4.20 Score
At the end of the story:
- **Speed**: dungeons cleared × 350 ÷ days (days count as at least 50).
- **Town**: (population + morale fills) × ⅔, each part capped at 150.
- **Guild**: (adventurers × 7 + average level × 2.3 + research ÷ 20) ÷ 2, plus a bonus per permanent guild.
- Total = (3 × lowest + the other two) ÷ 5. Ranks D through SSS (≥ 200).

### 4.21 Character looks
Every citizen and adventurer gets a look rolled **once, at creation**, with the seeded RNG, and saved with them. They look the same for the rest of the game.

- **Layered parts.** A look is a set of part IDs plus colors, one per slot, drawn in order. Parts live in `data/appearance.json` (drawing + metadata), so new parts never need new code.
- **Slots (starting set):** skin tone, eyes (shape + color), eyebrows, mouth, hair style, hair color, facial hair, race features, extras (freckles, glasses, scar, blush), outfit.
- **Sex.** Each character is created male or female. Each has **its own pool of parts** (hair styles, eyes and lashes, body and outfit cut). Shared slots like skin tone and colors use the same lists.
- **Female characters never get facial hair**, in every race, dwarves included.
- **Race weights the rolls:** dwarves (male) very likely bearded; elves always pointed ears; beastkin ears and tail matching their animal; angelfolk small wings.
- **Styles change outfits and gear, never faces or hair.** A changed adventurer is still recognizable.
- **Households look related:** citizens in one household share a skin tone and lean toward the same hair color.
- **The princess** is hand-designed, not rolled.

### 4.22 New Game+
After the ending, the player can start New Game+: a long age has passed, the city is gone, and the princess rebuilds from the field. A new villain face (4.3). Carries over:
1. **More starting Emberstone.**
2. **Some princess buildings** available from the start (which ones decided in M20).
3. **Demolish** available from day one.
4. **Two reincarnated adventurers** (the player picks which two at the end of the previous run): a cutscene with déjà vu comments ("Have we... met?") despite never having met her, plus **two free houses**. They keep their **previous Style** (not Novice), start at a lower level than before, and get bonus stats leaning toward what they were best at. They keep their look and name.
5. **One Style building of the player's choice** open from the start.

---

## 5. UI

- **Map view** (canvas) with pan and zoom. The princess walks on it. Select a lot to build. Inspect a person (hover, tap, or keyboard) to see name, race, style, mood and known traits.
- **Top bar**: day, chapter, clock, speed, gold, Emberstone, population, morale gauge, reputation.
- **Panels**: Build, Decrees, Adventurers (stats, traits, bond web; view only, see 4.2 "Face to face"), Guilds, Research, World Map, Inventory (style items and gifts), Story log, Promises.
- **Dialogs**: morning event, story scenes, audience petitions, conversations, style requests, guild petitions, retirement.
- **Night report**: party results, bond changes, style changes, discoveries, unlocks.
- **Overlays**: rest-spot radius, walking routes, bond lines.

### 5.1 Platforms and controls
Hearthcrown targets **desktop browsers** and **phones held in landscape**. Every layout in `DESIGN.md` must work at both sizes from M0 on. Panels slide in from the side so the map stays visible.

There are three control schemes for one game. Every action must work in all three:

| Action | Keyboard (PC, primary) | Mouse (PC, optional) | Touch (phone, landscape) |
|---|---|---|---|
| Move the princess | Arrow keys or WASD | Click a spot to walk there | Tap a spot to walk there |
| Talk / enter / interact | One interact key when next to someone or something | Click them | Tap them |
| Inspect a person | Interact key or a cycle-targets key | Hover or click | Tap |
| Open panels | Number keys or a menu key | Click top-bar or side buttons | Tap on-screen buttons |
| Choose in dialogs and menus | Arrows + Enter | Click | Tap |
| Build | Arrows move a highlight from lot to lot, Enter places | Click a lot | Tap a lot |
| Pan / zoom the map | Keys (to be set in M2) | Drag / scroll wheel | Drag / pinch |
| **Back** (leave a menu, go up one level) | **Esc** | Right-click or the on-screen **Back** button | On-screen **Back** button or the phone's back gesture |

Rules:
- **The keyboard alone must play the whole game.** The mouse is optional and works like a touch screen (click = tap), so mouse and touch share most of their logic.
- Nothing is hover-only. Anything shown on hover also shows on tap and through the keyboard.
- **Back** goes up one level at a time. With nothing open it does nothing, so it never quits the game or loses progress.
- Every focusable UI element shows a clear keyboard focus state.
- Every milestone's browser check also exercises its new features with the keyboard alone.

### 5.2 Becoming an app (later)
- After the game is playable: make it an installable web app (home-screen icon, full screen, works offline). This fits in M18.
- Store apps (Android and iPhone) can wrap the same build later with Capacitor. Not in v1 scope.

---

## 6. Milestones

Build in this order. Each milestone ends with the game running in the browser, tests passing, and a note in `PROGRESS.md`.

| # | Milestone | Done when |
|---|---|---|
| M0 | Scaffold | Vite + TS + Vitest run. Canvas draws a grid. Seeded RNG tested. `DESIGN.md` created with Impeccable. `window.__hearthcrown` debug hook exists. Playwright opens the page with no console errors. |
| M1 | Map & placement | Map JSON loads. Lots and roads draw. Placement follows the rules (tested). Art registry and packs with fallback (2.1) draw tiles and buildings. |
| M2 | Paths, walkers, princess | Dijkstra tested. People walk on roads. The princess can be moved around. Simple map editor. Character part frames, art gallery page, `ART-GUIDE.md` and templates (2.1). |
| M3 | Day loop | Clock, phases, speeds, night report. Citizens go out and come home. |
| M4 | Economy & buildings | Gold and Emberstone, costs, tax, build and demolish caps, demolish unlock, upgrades, data-driven building list. |
| M5 | Effects system | `effects.ts` runner with tests. Used by everything after this. |
| M6 | Stats, races, adventurers | Nine stats, race stat leans, apprentices, recruiting, Novice, motivation, daily routine, rest rule, shop priority, buying. Rolled character looks (4.21) for citizens and adventurers. |
| M7 | Dungeons & combat | World map with neighbor unlocks, stat-based room fights, retreat and defeat, logs, rewards. |
| M8 | Lodge & decrees | Lodge, party forming by role balance, decree board, sign-up bubbles, approve / Gain XP / Rest, 14:00 rule. |
| M9 | Styles | All v1 styles with pros, cons and growth. Style request events, style items (end the adventurer's day), rare dungeon styles. |
| M10 | Traits | Trait data, discovery, effects on shopping, breaks, gear, abilities, growth, bonds and style requests. |
| M11 | Bonds & guilds | Bond scores and tiers, princess bonds, dating and marriage, bond-based parties, guild petitions. |
| M12 | Morning events | Conditional event deck, choices, multi-day chains. |
| M13 | Audience Hall & reputation | Petitions, yes/no, promises with deadlines, follow-ups, Loved/Feared slider, Loved perks, Feared command options. |
| M14 | Talking & morale | Talk icons, conversations, morale gauge. |
| M15 | Story & masters | Chapters, scenes, unlocks, masters stationed at buildings. |
| M16 | Princess buildings & town | Gambling Hall mini-games and taxes, Royal Garden (appointments, meetups, dates), princess wardrobe, makeover building, remaining buildings. |
| M17 | Research, aging, ending | Research lines, storybook aging, retirement and delays, settling down and children, ending (statue), score screen, continuing after the ending. |
| M18 | Save/load & polish | Versioned saves, overlays, tooltips, settings. Installable web app (5.2). |
| M19 | Balance pass | Headless sim runs 300 days with a scripted player and prints gold, Emberstone, levels, bonds, styles, clears, retirements and births. Tune JSON so the story lands in 200–300 days. |
| M20 | New Game+ & post-game | New Game+ carryovers (4.22), villain faces, reincarnation cutscene, post-game content hooks. |

---

## 7. Testing approach

- Unit tests for every rule in section 4 (e.g. "gold never goes below zero", "a `require` cost is unavailable when broke", "motivation 30 stays home", "rest spot at 49 units counts, 51 doesn't", "a style item sends the adventurer home", "a broken promise applies its penalty after the deadline", "a defeated party returns injured, never dead").
- A **headless simulation**: `npm run sim -- --days 100 --seed 7`.
- **Determinism test**: same seed and commands give the same end state.
- **Content checks**: a test that loads every JSON file and validates references (every trait, event, petition and style points to things that exist).

---

## 8. Later ideas

- More styles (Necromancer, Monk, Alchemist) and races.
- Multiple shop copies with different product lines.
- Seasons, festivals, and monster raids on the city.
- Rival kingdom events.
- Hard mode with stronger dungeons and a score bonus.
- Human-made art packs replacing the built-in drawings (2.1).
- Mixing male and female parts in character looks and the makeover building (v1 keeps the pools separate).

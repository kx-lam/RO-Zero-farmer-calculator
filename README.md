# RO Zero Farm Planner

A farming planner and EXP tracker for **Ragnarok Zero: Global**. Enter your character, and it works out your damage, kill speed, EXP/hr and zeny/hr against every monster. Then it ranks the open maps for you and tracks your real EXP while you farm.

It's a single page that runs entirely in your browser. There's no server, no login and no build step, and your data stays in your browser's local storage.

**Live page:** https://kx-lam.github.io/RO-Zero-farmer-calculator/

## Quick start

1. **Character tab:** pick your job and attack. Then copy ATK, MATK, HIT, FLEE, ASPD, DEF, Max HP/SP and your six stats from the in-game status window.
2. **Session tab:** pick the monster you're farming and press **Farming … now**.
3. Log your EXP % every few minutes, for example `15:05 17.9% 63%` (time, base %, job %). Leave the time off (`17.9% 63%`) to log it at the current time. You can also paste many lines at once.
4. **Monsters & maps tab:** use the EXP Hunter, Zeny Hunter and Map planner to find a better spot.

## Features by tab

### Account

- Keep separate characters, sessions and settings for each of your accounts, and switch between them.
- **Backup:** copy or restore the current account's data, or every account at once, as text. Restoring an all-accounts backup replaces every account.
- **Copy share link** puts the current account in a link. The data sits in the part after `#`, which never reaches the server. Opening the link loads the account into the backup box, and nothing changes until you click Restore.

### Character

- **Every 2nd job:** pick a job and an attack. The presets use max-level Ragnarok Zero skill data, including cast time, delay, base-level scaling and stat bonuses.
- **Build mode:** works out ATK, MATK, HIT, FLEE, ASPD, DEF, HP and SP from base stats, job level, gear, refine and cards, matching the in-game status window.
- **Damage model:** status ATK/MATK, weapon size penalty, the element table, monster DEF/MDEF, hit and dodge chance, crits, mastery ATK, gear % bonuses, cast and delay reduction, ASPD potions and elemental converters.
- **Assassin dual wield:** put a dagger, one-handed sword or one-handed axe in the left hand. In Status window mode, use the Left hand fields; the "Wearing a shield" tick box (any job) and the Left hand swap each other out and move your typed ASPD by the shield or left-weapon penalty. In Build mode, use the "Shield / left hand" row. Basic attacks hit with both hands: the right hand × Righthand Mastery (50 + 10 per level %), the left hand × Lefthand Mastery (30 + 10 per level %), each with its own weapon ATK, size penalty and element. The left hand counts status ATK once, Double Attack repeats only the right hand, and skills use the right hand only. The left weapon costs a quarter of its delay in ASPD: −10 for a dagger and −12 for a one-handed sword or axe (rAthena renewal rules, whose Assassin ASPD table matches Zero's). Without a skill tree, both masteries count as Lv 5.
- **Consumables & buffs:** read your status window with these off; they add on top. If your typed numbers already include your buffs and items, untick the box under the status window stats and nothing is added (the ASPD potion still costs zeny). The section holds the ASPD potion, the elemental converter (one element at a time: pick Fire, Water, Earth or Wind, or let it pick the best per monster and map; it shows each one's element-table rate against the monster you picked) and Blessing of Yggdrasil (a World Tree Dew or Zelstar from the KP shop each hour: all stats +7, ATK +30, MATK +30, HIT +5, FLEE +5). Type food and other consumables as + and +% per main stat (STR … LUK; +% is a share of the total stat, rounded down), anything else as effect lines ("ATK +20, ASPD +10%"), and tick buffs from others (Blessing, Increase AGI, Impressive Riff…). Other consumables carry no zeny cost.
- **Auto-cast spells:** any job, Mages included, can add a spell from a card, weapon or scroll that procs on basic attacks with your MATK. Sage Spell Fist counts the basic attack's own physical hit as well as the procs.
- **Cards any job can slot:** Vitata (SP cost +25%, and the Heal Lv1 you cast costs SP and time you aren't attacking; in build mode a Vitata Card in your gear already counts its SP cost), Hunter Fly (HP back from physical attacks, so less HP lost per minute), Side Winder (basic attacks hit twice some of the time, right hand only; with Double Attack learned the card adds nothing) Creamy (Teleport Lv1, so Zeny Hunter teleports cost no Fly Wing; its 10 SP a cast isn't counted), and Phen / Bloody Butterfly (casts can't be interrupted, variable cast +25% / +30%; build mode reads them from your gear).
- **Interrupted casts:** a hit that lands while you cast interrupts it and you start again, so with λ hits landing per second (from "swings reach you" and your dodge) a T-second cast takes (e^(λT) − 1)/λ on average. No SP is spent on an interrupted cast. Phen and Bloody Butterfly turn this off. Basic attacks and Spell Fist have no cast.
- **SP back from cards:** Dracula (attacks have a chance to restore SP every second for 7 s), Dark Priest (a Sage gets 1 SP per physical hit that lands) and the +5 SP per kill weapon cards (Beetle King, Caterpillar, Driller, Nereid, Phendark, Tri-Joint, Zombie Master: when a melee physical attack kills that race, spread over the fight; not with Spell Fist). Card SP keeps coming when you're overweight, unlike natural regen. "SP Recovery +x%" (Eggyra, Sohee, Merman) raises natural SP regen: build mode reads it from your gear, and in Status window mode you add an "SP recovery" line under Equipment stats. HP Recovery +x% cards aren't modelled; count them in "HP back per minute".
- **Energy Coat (Mage, Wizard, Sage):** cuts damage taken by 6–30% for 1–3% of Max SP per hit, the fuller your SP the more of both. Your SP level is the fullest that regen can hold after your attack's own SP; when it can't, SP items hold it at the level you set, and without items your SP runs low (−6%).
- **Sage options:** Spell Fist with the best bolt per monster, Hindsight (switched on or off automatically against your zeny limit), Double Bolt and SP items. The cards and Energy Coat above count for Spell Fist too: Side Winder's 2nd hit also procs Spell Fist.
- **Overcharge and Discount:** a Merchant, Blacksmith or Alchemist with Overcharge learned gets more from NPCs. That raises the loot value per kill and the NPC price that a market price replaces. Discount cuts what you pay NPCs for SP items and the ASPD potion; untick "from NPCs" if you buy them from players. Both go 7, 9, 11 … 23, 24% for Lv 1–10.
- **Weight:** enter what you carry when you leave town (gear, potions, scrolls), your Max Weight, where you sell (any % up to 90, such as 65% to stay clear of 70%) and how long a town trip takes.
  - At 70% weight HP and SP stop regenerating, and at 90% you can't attack or use skills, so each trip ends at your sell point. Only the room above your starting weight fills with loot.
  - Kills per trip come from each drop's weight × chance. The trip time is spread over those kills in every EXP/min and zeny/hr figure.
  - Selling past 70% means fighting the stretch above 70% with no regen. It falls back to 70% when your attack needs SP and you have no SP items.

### Session (EXP tracker)

- Log Base and Job EXP % as you farm. Entries go on today's date unless you pick another. If a session runs past midnight or over several days, the date shows next to each time.
- See EXP/hr, time to the next level and a progress chart. Kill pace is split into fighting and walking time.
- Rename a session with ✎ next to the session picker (Enter or ✓ saves, Esc cancels), and compare sessions side by side.
- **Goal:** the EXP needed and the farming time to a target base and job level, charted together, with a date for each level-up if you farm non-stop.

### Monsters & maps

- **Monster table:** every non-MVP monster with HP, EXP, EXP/HP, your damage, kill time, EXP/min, dodge, HP lost and zeny per kill.
- **Map planner:** with an elemental converter (or Spell Fist bolts), a table shows each element's rate against every monster on the map and the map's EXP/min with it, and warns about the monsters the one in use is weak against (for example Fire against Jakk, Fire 2, on Geffen Dungeon B2F). An Element % column shows the rate per monster. For physical attacks the rate applies to weapon ATK; status ATK always hits as Neutral.
- **EXP Hunter:** open maps ranked by EXP/min, weighted by spawn counts.
  - Maps show their in-game code and name (`in_sphinx5` · Sphinx B5F). You can also type the database code (`sp_d05`).
  - Monsters with no EXP data yet (Myst, Isis, Anubis…) show EXP `?` and are left out of EXP/min.
  - Skip monsters you don't want to fight, and mark regions that aren't open yet as closed.
- **Zeny Hunter:** open maps, or single monsters, ranked by net zeny/hr. That's the loot value per kill with your drop rate bonus and the level penalty, less skill costs (Mammonite), SP items and the ASPD potion.
  - Drops fall 50% from monsters 40 or more levels below you. There's no published penalty for −20 to −39, so that range counts as none.
  - Converters are picked by zeny rather than EXP. Monsters with no EXP data still count, since they drop loot.
  - Monsters mode lists every drop with your chance and what it adds per kill.
  - **Auto loot:** tick the item groups you loot, like the game's Looting tab (weapons, armor, consumables, cards, miscellaneous, costumes). Unticked groups count as 0 zeny everywhere. The random option grade on equipment isn't modelled.
  - **Monster picks:** like the game's Monster tab, click a monster on a map to stop or start hunting it. **Hunt only the best-paying monsters** picks for you, keeping at least "Min monsters on map" spawns.
  - Skipping monsters costs time. You either walk further (walking × √(all / hunted)) or teleport past them ((all / hunted − 1) teleports per kill, at your Fly Wing price, or free with a Creamy Card, and seconds per teleport). Each map uses whichever nets more. The data doesn't say which maps block teleport, so click "teleport ok" on a map to mark it "no teleport".
- **Map planner:** per-map averages, kills/hr, EXP/hr and zeny/hr.

### Monster info

One monster's stats, how you do against it, and every map it spawns on. Its drops list shows the auto-loot group, chance, your chance, NPC and player price, and zeny per kill. Drops with no published rate yet (the Boulder Dwarves in Nordfeld Cave) show chance `?` and add nothing to zeny or weight figures.

### Item info

Every item monsters drop, searchable and filterable by auto-loot group, with NPC and player prices. Click an item to see every monster that drops it, the drop chance and the best open map.

### Market

- Type what players pay for an item, and that drop counts at the player price in every zeny figure.
- The NPC price is subtracted, since the loot value already includes it. It's filled in for every drop, and you can type your own to override it.
- Click a drop in the Zeny Hunter, Monster info or Item info to price it.
- **Sell timer:** the game's auto return only takes you to town at a weight %; it doesn't sell or store anything. Press Start when you leave town and the timer counts down to when the current session's monsters should have filled you to your sell point, then rings: a beep, an optional browser notification and "Sell now" in the tab title. It can ring a few minutes early. Time the session spends paused is added on, and Start or **Back from town** ends a pause left open while you sold. If the trip length can't be worked out (no monster picked, no Max Weight) or doesn't match what you see, type the minutes one trip takes. It also shows how many town runs you make an hour. In a background tab the browser can make it up to a minute late.

### EXP & formulas

- Base and job EXP tables for Base Lv 1–70 and Novice, 1st and 2nd job levels. Your level is highlighted, with kills per level for your monster.
- **Party EXP (Even Share):** the bonus is +10% per extra member (2 members 110%, 3: 120% … 12: 210%), split evenly.
- **EXP bonuses** add together. Gear EXP counts for both base and job; an item's "EXP +X%" goes in EXP bonus % (base only) and "Job EXP +X%" in Job EXP bonus % (job only).
- Every formula the calculator uses, with your own numbers next to it.
- The element and weapon size tables.

### Tables everywhere

Every big table works the same way:

- Click a column header to sort.
- Type in the filter row under the header. Filters accept `<350`, `100-200`, `fire`, `-` for blank and `or`. In the EXP Hunter, `poring` under Main monsters finds every map with Porings; in the Zeny Hunter, `elunium` under Earns from finds every monster that drops it.
- Show or hide columns with the column picker.
- In the hunters, filters apply before the Show limit, and # stays the map's rank among all open maps.

## Accuracy

The numbers are estimates. Skill values and formulas follow the sources below and may differ from the live server after a patch, so check them against your own EXP logs.

## Development

The page is plain HTML, CSS and JavaScript with no dependencies. Open `index.html` directly or serve the folder.

### Project layout

| Path | What's in it |
| --- | --- |
| `index.html` | Page markup. Loads `data/*.js`, then `build.js`, then `js/*.js`. |
| `style.css` | Styles. |
| `build.js` | Build simulator: turns base stats, job level, gear, refine and cards into the status window's ATK/MATK/HIT/FLEE/ASPD/DEF/HP/SP. |
| `js/` | Calculator and tracker code (see below). |
| `data/` | Game data tables, one per file (see below). |
| `tools/` | Python scripts that export and cross-check the data. |
| `tests/` | Node tests. |

### `js/`

Plain scripts that `index.html` loads in this order. They share one global scope, so later files use what earlier ones define.

| File | Purpose |
| --- | --- |
| `game.js` | Merges the monster tables; holds the element and size tables, the jobs and the attack presets. |
| `state.js` | Storage and accounts, saved state and its migrations, small helpers. |
| `model.js` | Damage, SP, defence and Sage models, maps and the tracker maths. |
| `render.js` | Draws the Character, Session and Monsters & maps tabs. |
| `events.js` | Input handlers, stats, the log form, accounts, sessions, backups, the share link and the column picker. |
| `skills.js` | Skill trees, passives and buffs. |
| `build-ui.js` | Build mode, consumables and the equipment stats rows. |
| `ref.js` | The EXP & formulas tab. |
| `start.js` | Tabs, collapsible cards and the first render. |

### `data/`

Each table lives in its own file, so a re-export after a patch only touches that file. Each file's first line describes its fields. See [Data sources](#data-sources) for where each comes from.

| File | Contents |
| --- | --- |
| `mobs.js` | Monsters (EXP is `null` where there's no data yet) |
| `spawn.js` | Spawn maps and counts, normal and PvP channels. Written by `tools/export_spawns.py`. |
| `maps.js` | In-game map code and name for each spawn map. Names written by `tools/export_mapnames.py`. |
| `loot.js` | Drops (chance `null` where no rate is published yet) |
| `items.js` | Item names |
| `prices.js` | NPC sell price for every drop. Written by `tools/export_prices.py`. |
| `weights.js` | Item weight for every drop; items with no weight count as weightless. Written by `tools/export_prices.py`. |
| `itemtypes.js` | Auto-loot group for every drop, from item categories. Written by `tools/export_prices.py`. |
| `mstat.js` | Monster DEF/MDEF/ATK |
| `elem.js` | Monster element, HIT/FLEE |
| `sizes.js` | Monster size and race |
| `exp.js` | EXP tables |
| `equipment.js`, `cards.js`, `refine.js`, `jobs.js`, `skills.js` | Gear, refine, job and skill data for the build simulator. Written by `tools/export_prontera.py`. |

### Tools

All scripts use only the Python standard library.

| Command | What it does |
| --- | --- |
| `python tools/export_spawns.py [--client PATH]` | Rewrites `data/spawn.js` from `navi_mob.lub` in your installed client's `data.grf` (read-only). Default client path: `C:\Gravity\RagnarokZero`. |
| `python tools/export_mapnames.py [--client PATH]` | Sets the map names in `data/maps.js` to the names your installed client shows in game (read-only). |
| `python tools/export_prices.py [--refresh]` | Writes `data/prices.js`, `data/weights.js` and `data/itemtypes.js`, and checks the prices add up to each monster's loot value. |
| `python tools/export_prontera.py [--refresh]` | Writes the gear, refine, job and skill data. |
| `python tools/check_maps.py` | Compares `data/spawn.js` with the cross-check source and lists missing monsters and spawn counts that differ. Monsters marked as upcoming are expected to show up as missing. |
| `python tools/check_drops.py` | Compares drops, drop rates and item names with the cross-check source. Loot value per kill isn't compared, because the two sources price items differently. |

Notes on `export_prontera.py`:

- It caches pages in `tools/cache/`. After a patch, run it with `--refresh` to pick up new items and skill, job and refine changes. Delete the cache to also pick up changed stats on existing items.
- Items that fail to download are left out and listed at the end, so rerun it to retry them.
- It applies corrections found by checking against the official client (listed at the top of the script): Guild gear options are GvG/Siege-only, a few cards' CRIT only counts against one race, and some skill cooldowns and damage-taken lines that were missing.

### Tests

```sh
node tests/build.test.mjs    # build simulator
node tests/ingame.test.mjs   # real characters against their in-game status window
node tests/model.test.mjs    # damage and tracker maths, loaded with a stand-in page
```

`model.test.mjs` covers damage per hit, hit chance, cast time, party share, EXP and job EXP rates, walking time and the monster table filters. GitHub Actions runs every test, and checks that `tools/export_prontera.py` compiles, on each pull request and push to `main` (`.github/workflows/tests.yml`).

## Data sources

- Monsters, drops, NPC prices and skills: [rozerodb.com](https://rozerodb.com)
- Gear, cards, refine and job data: [roz.prontera.info](https://roz.prontera.info)
- Spawn counts: the official Ragnarok Zero Global client (navigation table)
- Map names: the official client (`System/mapInfo_enUS.lub`)
- Spawn, drop and item name cross-check, in-game map codes: [ragnarokzero.net](https://ragnarokzero.net/database/maps)
- Monster race and HP cross-check: [einh-guild.de](https://einh-guild.de), [midgardhub.com](https://midgardhub.com/database/monsters)
- Formulas: [roz.prontera.info/mechanics](https://roz.prontera.info/mechanics), [iRO Wiki](https://irowiki.org/wiki/Stats)
- Zero skill data, element table and ASPD table: [Landgris ROCalculator](https://landgris.github.io/ROCalculator/?zero)
- Size table and EXP tables: [official game guide](https://roz.mygnjoy.com/en/intro/guide/12)
- Drop rate level penalty: [official game guide](https://roz.mygnjoy.com/en/intro/guide/11)

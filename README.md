# RO Zero Farm Planner

A single-page farming planner and EXP tracker for **Ragnarok Zero: Global**. Everything runs in your browser: there's no server and no login, and your data stays in your browser's local storage.

**Live page:** https://kx-lam.github.io/RO-Zero-farmer-calculator/

## What it does

- **EXP tracker:** log your Base and Job EXP % as you farm (or paste many lines at once). You get EXP/hr, time to the next level, a progress chart, and kill pace split into fighting and walking time.
- **Every 2nd job:** pick a job and an attack. Presets use max-level Ragnarok Zero skill data (rozerodb, Landgris ROCalculator Zero data) and include cast time, delay, base-level scaling and stat bonuses.
- **Damage model:** status ATK/MATK, weapon size penalty, element table, monster DEF/MDEF, hit and dodge chance, crits, mastery ATK, gear % bonuses, cast and delay reduction, ASPD potions and elemental converters.
- **Overcharge and Discount:** a Merchant, Blacksmith or Alchemist with Overcharge learned (Skills card) gets that much more from NPCs: the loot value per kill, and the NPC price a market price replaces. Discount cuts what you pay NPCs for SP items, the ASPD potion and consumables; untick "from NPCs" when you buy them from players. Both go 7, 9, 11 … 23, 24% for Lv 1–10, read from Zero's skill data.
- **Weight:** type your weight now and Max Weight, where you go sell (70% or 90%) and how long a town trip takes. At 70% HP and SP stop regenerating and at 90% you can't attack or use skills, so each trip ends at your sell point. Kills per trip come from each drop's weight × chance, and the trip time is spread over those kills in every EXP/min and zeny/hr figure. Selling at 90% fights the 70–90% stretch with no regen, and falls back to 70% when your attack needs SP and you have no SP items.
- **Sage options:** Spell Fist with the best bolt per monster, Hindsight (with an auto on/off check against your zeny limit), Double Bolt, Vitata (you cast its Heal Lv1, which costs SP and time you aren't attacking), Energy Coat, Hunter Fly, Side Winder, and SP items.
- **Monster table:** every non-MVP monster with HP, EXP, EXP/HP, your damage, kill time, EXP/min, dodge, HP lost and zeny per kill. It has column filters (`<350`, `100-200`, `fire`, `-` for blank, `or`) and you can show or hide columns.
- **EXP Hunter:** open maps ranked by EXP/min, weighted by spawn counts. Maps show their in-game code and name (`in_sphinx5` · Sphinx B5F); you can also type the rozerodb code (`sp_d05`). Monsters rozerodb has no EXP for yet (Myst, Isis, Anubis…) are listed with EXP `?` and left out of EXP/min. You can skip monsters you don't want to fight, and you can mark regions that aren't open yet as closed.
- **Zeny Hunter:** open maps, or monsters farmed on their own, ranked by net zeny/hr: loot value per kill with your drop rate bonus and the level penalty (drops fall 50% from monsters 40 or more levels below you, per the official guide; −20 to −39 isn't in the guide and counts as no penalty), less skill costs (Mammonite), SP items and switched-on consumables. It picks converters by zeny rather than EXP, and still counts monsters with no EXP data, since they drop loot. Monsters mode lists every drop with your chance and what it adds per kill.
  - **Auto loot:** tick the item groups you loot, like the game's Looting tab (weapons, armor, consumables, cards, miscellaneous, costumes). Unticked groups count as 0 zeny everywhere. The game's random option grade for equipment isn't modelled.
  - **Monster picks:** like the game's Monster tab, click a monster on a map to stop or start hunting it. **Hunt only the best-paying monsters** picks for you, keeping at least "Min monsters on map" spawns. Passing monsters by costs time: you walk further (walking × √(all / hunted)) or teleport past them ((all / hunted − 1) teleports per kill, at your Fly Wing price and seconds per teleport). Each map uses whichever nets more. rozerodb doesn't say which maps block teleport, so click "teleport ok" on a map to mark it "no teleport".
- **Market:** type what players pay for an item, and that drop counts at the player price in every zeny figure. What an NPC pays is taken off, since rozerodb's loot value already counts it: it's filled in from rozerodb for every drop, and you can type your own to override it. Click a drop in the Zeny Hunter, Monster info or Item info to price it.
- **Monster info:** one monster's stats, how you do against it, its drops (auto-loot group, chance, your chance, NPC and player price, zeny per kill) and every map it spawns on.
- **Item info:** every item monsters drop, searchable and filterable by auto-loot group, with NPC and player prices. Click one to see every monster that drops it, its chance and the best open map.
- **Map planner:** per-map averages, kills/hr, EXP/hr and zeny/hr.
- **Goal:** EXP needed and farming time to a target base level and job level, charted together, with a date for each level-up if you farm non-stop. The tables cover Base Lv 1–70 and Novice, 1st and 2nd job levels.
- **EXP & formulas:** the base and job EXP tables (with your level highlighted and kills per level for your monster), every formula the calculator uses with your own numbers next to it, and the element and weapon size tables.
- **Party:** Even Share (100% + 20% per extra member, split evenly), EXP bonus % and drop rate bonus %.
- **Accounts:** keep separate characters, sessions and settings for each of your accounts, and switch between them on the Account tab.
- **Backup:** copy or restore the current account's data, or all accounts at once, as text. Restoring an all-accounts backup replaces every account. **Copy share link** puts the current account in a link (in the part after `#`, which never reaches the server); opening it loads the account into the backup box, and nothing changes until you click Restore.

## How to use

1. Pick your **job** and **attack**, then copy ATK, MATK, HIT, FLEE, ASPD, DEF, Max HP/SP and your six stats from the in-game status window.
2. Pick the monster you're farming and press **Farming … now**.
3. Log your EXP % every few minutes, for example `15:05 17.9% 63%` (time, base %, job %).
4. Use **EXP Hunter** and the **Map planner** to find a better spot.

## Files

- `index.html`: page markup. Open it directly or serve the folder; there's no build step.
- `style.css`: styles.
- `js/*.js`: the calculator and tracker code, one file per section. They're plain scripts that `index.html` loads in this order and that share one global scope, so later files use what earlier ones define:
  - `game.js`: merges the monster tables and holds the element and size tables and the jobs and attack presets.
  - `state.js`: storage and accounts, saved state and its migrations, and small helpers.
  - `model.js`: the damage, SP, defence and Sage models, maps, and the tracker maths.
  - `render.js`: draws the Character, Session and Monsters & maps tabs.
  - `events.js`: input handlers, stats, the log form, accounts, sessions, backups and the share link, plus the column picker.
  - `skills.js`: skill trees, passives and buffs.
  - `build-ui.js`: build mode, consumables and the equipment stats rows.
  - `ref.js`: the EXP & formulas tab.
  - `start.js`: tabs, collapsible cards and the first render.
- `build.js`: the build simulator. It turns base stats, job level, gear, refine and cards into the same ATK/MATK/HIT/FLEE/ASPD/DEF/HP/SP the status window shows.
- `data/*.js`: tables exported from the sources below, one per file, so a re-export after a patch only touches that file. `mobs.js` (monsters; EXP `null` where rozerodb has none yet), `spawn.js` (spawn maps and counts from the official client's navigation table, normal and PvP channels; regenerate with `python tools/export_spawns.py`, which reads `navi_mob.lub` from your installed client's `data.grf` without changing it; maps the client doesn't list yet keep rozerodb's estimates), `maps.js` (in-game map code and name for each spawn map; names as the game shows them, from your installed client via `python tools/export_mapnames.py`), `loot.js` (drops), `items.js` (item names), `weights.js` (item weight for every drop, from rozerodb, written with the prices by `python tools/export_prices.py`; items with no weight count as weightless), `prices.js` (NPC sell price for every drop, from rozerodb; regenerate with `python tools/export_prices.py`, which also checks the prices add up to each monster's loot value), `itemtypes.js` (auto-loot group for every drop, from rozerodb item categories; written by the same script), `mstat.js` (DEF/MDEF/ATK), `elem.js` (element, HIT/FLEE), `sizes.js` (size and race) and `exp.js` (EXP tables). Each file's first line describes its fields. Gear and skill data (`equipment.js`, `cards.js`, `refine.js`, `jobs.js`, `skills.js`) is regenerated with `python tools/export_prontera.py`; it caches pages in `tools/cache/`. It also applies corrections found by checking against the official client (top of the script): Guild gear options are GvG/Siege-only, a few cards' CRIT only counts against one race, and some missing skill cooldowns and damage-taken lines. After a patch, run it with `--refresh` to pick up new items and skill, job and refine changes; delete the cache to also pick up changed stats on existing items. Items that fail to download are left out and listed at the end, so rerun it to retry them.
- `tools/check_maps.py`: compares `data/spawn.js` with ragnarokzero.net and lists missing monsters and spawn counts that differ. Monsters rozerodb marks as upcoming are expected to show up as missing.
- `tools/check_drops.py`: compares the drops and drop rates in `data/loot.js`, and the item names in `data/items.js`, with ragnarokzero.net. Loot value per kill isn't compared, because the two sites price items differently.
- `tests/`: `node tests/build.test.mjs` tests the build simulator; `node tests/ingame.test.mjs` checks real characters against their in-game status window; `node tests/model.test.mjs` loads the `js/` files with a stand-in page and checks the damage and tracker maths (damage per hit, hit chance, cast time, party share, EXP and job EXP rates, walking time and the monster table filters). GitHub Actions runs all of them on every pull request and push to `main` (`.github/workflows/tests.yml`).

## Data sources

- Monsters, drops, NPC prices and skills: [rozerodb.com](https://rozerodb.com)
- Spawn counts: the official Ragnarok Zero Global client (navigation table), via `tools/export_spawns.py`; rozerodb's estimates for maps not out yet
- Map names: the official client (`System/mapInfo_enUS.lub`), via `tools/export_mapnames.py`; ragnarokzero.net's names for maps not in the client yet
- Spawn, drop and item name cross-check, in-game map codes: [ragnarokzero.net](https://ragnarokzero.net/database/maps)
- Monster race and HP cross-check: [einh-guild.de](https://einh-guild.de), [midgardhub.com](https://midgardhub.com/database/monsters)
- Formulas: [roz.prontera.info/mechanics](https://roz.prontera.info/mechanics), [iRO Wiki](https://irowiki.org/wiki/Stats)
- Zero skill data, element table and ASPD table: [Landgris ROCalculator](https://landgris.github.io/ROCalculator/?zero)
- Size table and EXP tables: [official game guide](https://roz.mygnjoy.com/en/intro/guide/12)
- Drop rate level penalty: [official game guide](https://roz.mygnjoy.com/en/intro/guide/11)

The numbers are estimates. Skill values and formulas follow the sources above and may differ from the live server after patches, so check against your own logs.

# RO Zero Farm Planner

A single-page farming planner and EXP tracker for **Ragnarok Zero: Global**. Everything runs in your browser: there's no server and no login, and your data stays in your browser's local storage.

**Live page:** https://kx-lam.github.io/RO-Zero-farmer-calculator/

## What it does

- **EXP tracker:** log your Base and Job EXP % as you farm (or paste many lines at once). You get EXP/hr, time to the next level, a progress chart, and kill pace split into fighting and walking time.
- **Every 2nd job:** pick a job and an attack. Presets use max-level Ragnarok Zero skill data (rozerodb, Landgris ROCalculator Zero data) and include cast time, delay, base-level scaling and stat bonuses.
- **Damage model:** status ATK/MATK, weapon size penalty, element table, monster DEF/MDEF, hit and dodge chance, crits, mastery ATK, gear % bonuses, cast and delay reduction, ASPD potions and elemental converters.
- **Sage options:** Spell Fist with the best bolt per monster, Hindsight (with an auto on/off check against your zeny limit), Double Bolt, Vitata (you cast its Heal Lv1, which costs SP and time you aren't attacking), Energy Coat, Hunter Fly, Side Winder, and SP items.
- **Monster table:** every non-MVP monster with HP, EXP, EXP/HP, your damage, kill time, EXP/min, dodge, HP lost and zeny per kill. It has column filters (`<350`, `100-200`, `fire`, `-` for blank, `or`) and you can show or hide columns.
- **Best maps:** open maps ranked by EXP/min, weighted by spawn counts. Maps show their in-game code and name (`in_sphinx5` · Sphinx F5); you can also type the rozerodb code (`sp_d05`). Monsters rozerodb has no EXP for yet (Myst, Isis, Anubis…) are listed with EXP `?` and left out of EXP/min. You can skip monsters you don't want to fight, and you can mark regions that aren't open yet as closed.
- **Zeny Hunter:** open maps, or monsters farmed on their own, ranked by net zeny/hr: loot value per kill with your drop rate bonus, less skill costs (Mammonite), SP items and switched-on consumables. It shows which monsters on a map earn the most, picks converters by zeny rather than EXP, and still counts monsters with no EXP data, since they drop loot.
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
4. Use **Best maps** and the **Map planner** to find a better spot.

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
- `data/*.js`: tables exported from the sources below, one per file, so a re-export after a patch only touches that file. `mobs.js` (monsters; EXP `null` where rozerodb has none yet), `spawn.js` (spawn maps), `maps.js` (in-game map code and name for each spawn map), `loot.js` (drops), `items.js` (item names), `mstat.js` (DEF/MDEF/ATK), `elem.js` (element, HIT/FLEE), `sizes.js` (size and race) and `exp.js` (EXP tables). Each file's first line describes its fields. Gear and skill data (`equipment.js`, `cards.js`, `refine.js`, `jobs.js`, `skills.js`) is regenerated with `python tools/export_prontera.py`; it caches pages in `tools/cache/`. After a patch, run it with `--refresh` to pick up new items and skill, job and refine changes; delete the cache to also pick up changed stats on existing items. Items that fail to download are left out and listed at the end, so rerun it to retry them.
- `tools/check_maps.py`: compares `data/spawn.js` with [ragnarokzero.net](https://ragnarokzero.net/database/maps) and lists missing monsters and spawn counts that differ. Monsters rozerodb marks as upcoming are expected to show up as missing.
- `tests/`: `node tests/build.test.mjs` tests the build simulator; `node tests/ingame.test.mjs` checks real characters against their in-game status window; `node tests/model.test.mjs` loads the `js/` files with a stand-in page and checks the damage and tracker maths (damage per hit, hit chance, cast time, party share, EXP and job EXP rates, walking time, Zeny Hunter and the monster table filters). GitHub Actions runs all of them on every pull request and push to `main` (`.github/workflows/tests.yml`).

## Data sources

- Monsters, spawns, drops and skills: [rozerodb.com](https://rozerodb.com)
- Formulas: [roz.prontera.info/mechanics](https://roz.prontera.info/mechanics), [iRO Wiki](https://irowiki.org/wiki/Stats)
- Zero skill data, element table and ASPD table: [Landgris ROCalculator](https://landgris.github.io/ROCalculator/?zero)
- Size table and EXP tables: [official game guide](https://roz.mygnjoy.com/en/intro/guide/12)

The numbers are estimates. Skill values and formulas follow the sources above and may differ from the live server after patches, so check against your own logs.

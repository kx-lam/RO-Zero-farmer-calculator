# RO Zero Farm Planner

A single-page farming planner and EXP tracker for **Ragnarok Zero: Global**. Everything runs in your browser: there's no server and no login, and your data stays in your browser's local storage.

**Live page:** https://kx-lam.github.io/RO-Zero-farmer-calculator/ (once GitHub Pages is enabled)

## What it does

- **EXP tracker:** log your Base and Job EXP % as you farm (or paste many lines at once). You get EXP/hr, time to the next level, a progress chart, and kill pace split into fighting and walking time.
- **Every 2nd job:** pick a job and an attack. Presets use max-level Ragnarok Zero skill data (rozerodb, Landgris ROCalculator Zero data) and include cast time, delay, base-level scaling and stat bonuses.
- **Damage model:** status ATK/MATK, weapon size penalty, element table, monster DEF/MDEF, hit and dodge chance, crits, mastery ATK, gear % bonuses, cast and delay reduction, ASPD potions and elemental converters.
- **Sage options:** Spell Fist with the best bolt per monster, Hindsight (with an auto on/off check against your zeny limit), Double Bolt, Vitata, Energy Coat, Hunter Fly, Side Winder, and SP items.
- **Monster table:** every non-MVP monster with HP, EXP, EXP/HP, your damage, kill time, EXP/min, dodge, HP lost and zeny per kill. It has column filters (`<350`, `100-200`, `fire`, `-` for blank, `or`) and you can show or hide columns.
- **Best maps:** open maps ranked by EXP/min, weighted by spawn counts. You can skip monsters you don't want to fight, and you can mark regions that aren't open yet as closed.
- **Map planner:** per-map averages, kills/hr, EXP/hr and zeny/hr.
- **Goal:** EXP needed and farming time to a target level, with hours per day if you set a date. The tables cover Base Lv 1–70 and Novice, 1st and 2nd job levels.
- **Party:** Even Share (100% + 20% per extra member, split evenly), EXP bonus % and drop rate bonus %.
- **Backup:** copy or restore all your data as text.

## How to use

1. Pick your **job** and **attack**, then copy ATK, MATK, HIT, FLEE, ASPD, DEF, Max HP/SP and your six stats from the in-game status window.
2. Pick the monster you're farming and press **Farming … now**.
3. Log your EXP % every few minutes, for example `15:05 17.9% 63%` (time, base %, job %).
4. Use **Best maps** and the **Map planner** to find a better spot.

## Data sources

- Monsters, spawns, drops and skills: [rozerodb.com](https://rozerodb.com)
- Formulas: [roz.prontera.info/mechanics](https://roz.prontera.info/mechanics), [iRO Wiki](https://irowiki.org/wiki/Stats)
- Zero skill data, element table and ASPD table: [Landgris ROCalculator](https://landgris.github.io/ROCalculator/?zero)
- Size table and EXP tables: [official game guide](https://roz.mygnjoy.com/en/intro/guide/12)

The numbers are estimates. Skill values and formulas follow the sources above and may differ from the live server after patches, so check against your own logs.

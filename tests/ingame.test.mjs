// Real characters checked against the in-game status window, using the exported data. Run: node tests/ingame.test.mjs
import { createRequire } from "module";
import { readFileSync } from "fs";
import assert from "assert/strict";
const require = createRequire(import.meta.url);
for (const f of ["equipment", "cards", "refine", "jobs"])
  (0, eval)(readFileSync(new URL(`../data/${f}.js`, import.meta.url), "utf8").replace(/^const (\w+)=/gm, "globalThis.$1="));
const BUILD = require("../build.js");
const id = slug => (EQUIP.find(x => x.slug === slug) || CARDS.find(x => x.slug === slug)).id;
const sum = t => String(t).split("+").reduce((a, b) => a + +b, 0);

// Lv 26 Merchant, Job Lv 26-29 (job bonus STR/VIT/DEX +2, INT +1), screenshot 2026-10-04:
// +7 Hurricane Hammer (Hammer + Andre Card, options ATK +25, FLEE +20), Criatura Academy Hat, Jacket.
// Status window: ATK 52+186, MATK 13+21, HIT 223, FLEE 147+1, DEF 14+17, MDEF 13+0, CRIT 1, ASPD 143.
// Not compared: Max HP / SP (the exported HP/SP tables don't match the game; see the Sage notes below).
{
  const r = BUILD.compute({ baseLv: 26, jobLv: 27, base: { str: 39, agi: 1, vit: 1, int: 1, dex: 20, luk: 1 },
    gear: { weapon: { id: id("hammer-620035"), refine: 7, cards: [id("andre-card-4043")], opts: "ATK +25, FLEE +20" },
            headTop: { id: id("criatura-academy-hat-18730") }, armor: { id: id("jacket-450347") } } },
    "Merchant", () => 156 - 15);   // Merchant two-handed axe: 156 base, −15
  const F = r.fields;
  assert.equal(F.atkTxt, "52+186");
  assert.equal(sum(F.hitTxt), 223);
  assert.equal(sum(F.fleeTxt), 147);
  assert.equal(F.defTxt, "14+17");
  assert.equal(Math.floor(F.aspd), 143);
  assert.equal(Math.floor(F.crit), 1);
  assert.equal(F.matkTxt, "13+21");               // refine MATK on the weapon
  console.log("ok Lv 26 Merchant matches the status window");
}

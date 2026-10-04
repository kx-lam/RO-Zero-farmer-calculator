// Engine tests for build.js with a small made-up dataset. Run: node tests/build.test.mjs
import { createRequire } from "module";
import assert from "assert/strict";
const require = createRequire(import.meta.url);

Object.assign(globalThis, {
  EQUIP: [
    { id: 1, slug: "blade", name: "Blade", slot: ["weapon"], type: "sword_1h", wlv: 2, refine: "weapon", atk: 100, slots: 2,
      g: [{ b: [["str", null, null, 2]] }, { b: [["atk", null, null, 5, 1]] }, { r: 7, b: [["damage_percent", "race", "demi_human", 10]] }] },
    { id: 2, slug: "coat", name: "Coat", slot: ["armor"], refine: "armor", def: 10, g: [] },
    { id: 3, slug: "boots", name: "Boots", slot: ["footgear"], refine: "armor", def: 2, g: [] },
    { id: 4, slug: "hat", name: "Hat", slot: ["head_upper", "head_middle"], refine: "armor", def: 1, g: [{ b: [["aspd_percent", null, null, 10]] }] },
  ],
  CARDS: [
    { id: 10, slug: "hydra", name: "Hydra Card", slot: ["weapon"], g: [{ b: [["damage_percent", "race", "demi_human", 20]] }] },
    { id: 11, slug: "proc", name: "Proc Card", slot: ["weapon"], g: [{ proc: "Chance to autocast Bash" }] },
  ],
  SETS: [{ slug: "s", name: "Coat Set", pieces: ["coat", "boots"], g: [{ rs: 10, b: [["hp", null, null, 500]] }, { b: [["vit", null, null, 3]] }] }],
  REFINE: { weapon_lv2: Array.from({ length: 20 }, (_, i) => [3 * (i + 1), 3 * (i + 1), 0]),
            armor: Array.from({ length: 20 }, (_, i) => [0, 0, (i + 1) ** 2]) },
  JOBDATA: { Knight: { bonus: { str: [1, 6], vit: [5] }, hp: [40, 48, 58], sp: [10, 12, 14] } },
});
const BUILD = require("../build.js");
const aspdBase = () => 150;
const base = { str: 50, agi: 30, vit: 20, int: 1, dex: 30, luk: 10 };
let n = 0;
const t = (name, fn) => { fn(); n++; console.log("ok", name); };

t("job bonus counts job levels at or below the current one", () => {
  assert.deepEqual(BUILD.jobBonus("Knight", 5), { str: 1, agi: 0, vit: 1, int: 0, dex: 0, luk: 0 });
  assert.equal(BUILD.jobBonus("Knight", 10).str, 2);
});

t("weapon stats, per-refine bonus, refine threshold and cards", () => {
  const r = BUILD.compute({ baseLv: 3, jobLv: 10, base, gear: { weapon: { id: 1, refine: 7, cards: [10, 11] } } }, "Knight", aspdBase);
  const S = r.status;
  assert.equal(r.total.str, 50 + 2 + 2);                                  // base + job + item STR
  assert.equal(r.fields.atkTxt, `${S.atk}+${100 + 21 + 35}`);              // weapon 100 + refine 3×7 + ATK 5 per refine
  assert.equal(r.fields.wAtk, 121);                                        // weapon ATK incl. refine
  assert.equal(r.acc.phys.race["Demi-Human"], 30);                         // +10 at +7, +20 card, same category adds
  assert.equal(r.acc.magic.race["Demi-Human"], undefined);                 // damage_percent is physical only
  assert.equal(r.fields.weapon, "One-handed sword");
  assert.ok(r.unmodelled.some(x => x.includes("autocast")));               // procs are listed, not counted
});

t("refine threshold not reached", () => {
  const r = BUILD.compute({ baseLv: 3, jobLv: 1, base, gear: { weapon: { id: 1, refine: 6, cards: [] } } }, "Knight", aspdBase);
  assert.equal(r.acc.phys.race["Demi-Human"], undefined);
});

t("armor refine DEF, sets with combined refine, HP from the job curve", () => {
  const off = BUILD.compute({ baseLv: 3, jobLv: 1, base, gear: { armor: { id: 2, refine: 4 }, shoes: { id: 3, refine: 5 } } }, "Knight", aspdBase);
  const S = off.status;
  assert.equal(off.fields.defTxt, `${S.softDef}+${10 + 2 + 16 + 25}`);
  assert.equal(off.total.vit, 20 + 0 + 3);                                  // set VIT, no job VIT before job Lv 5
  assert.equal(off.fields.maxHp, Math.floor(Math.floor(58 * (1 + 23 / 100)) + 0));   // combined refine 9 < 10: no set HP
  const on = BUILD.compute({ baseLv: 3, jobLv: 1, base, gear: { armor: { id: 2, refine: 5 }, shoes: { id: 3, refine: 5 } } }, "Knight", aspdBase);
  assert.equal(on.fields.maxHp, Math.floor(58 * 1.23) + 500);
});

t("ASPD % pivots on 195 and caps at 190; multi-slot headgear counts once", () => {
  const r = BUILD.compute({ baseLv: 3, jobLv: 1, base, gear: { headTop: { id: 4 }, headMid: { id: 4 } } }, "Knight", aspdBase);
  const a0 = 150 + r.status.aspdTerm;
  assert.equal(r.fields.aspd, Math.round((a0 + (195 - a0) * 0.10) * 10) / 10);
  const fast = BUILD.compute({ baseLv: 3, jobLv: 1, base, gear: {} }, "Knight", () => 189);
  assert.equal(fast.fields.aspd <= 190, true);
});

t("status formulas match the verified Zero formulas", () => {
  const s = { str: 60, agi: 50, vit: 40, int: 30, dex: 45, luk: 12 }, S = BUILD.status(70, s, false);
  assert.equal(S.atk, Math.floor(70 / 4 + 60 + 45 / 5 + 12 / 3));
  assert.equal(S.matk, 30 + 15 + 9 + 4 + 17);
  assert.equal(S.hit, 175 + 70 + 45 + 4);
  assert.equal(S.flee, 100 + 70 + 50 + 2);
  assert.equal(S.softDef, 35 + 20 + 10);
});

console.log(`${n} tests passed`);

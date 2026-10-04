// Damage and tracker maths in js/*.js, run against the real data files with a stand-in page. Run: node tests/model.test.mjs
import { readFileSync, readdirSync } from "fs";
import vm from "vm";
import assert from "assert/strict";

// a stand-in for every page element: any property is another stand-in, calling one returns one, it reads as "" and iterates as empty
const stub = () => {
  const own = {};
  const p = new Proxy(function () {}, {
    get: (_, k) => k in own ? own[k] : k === Symbol.toPrimitive ? () => "" : k === Symbol.iterator ? [][Symbol.iterator] : k === "then" ? undefined : (own[k] = stub()),
    set: (_, k, v) => (own[k] = v, true),
    apply: () => stub(),
  });
  return p;
};
const store = {};
const ctx = vm.createContext({
  document: stub(), console, setTimeout: () => 0, clearTimeout() {}, navigator: stub(), location: stub(), scrollTo() {}, addEventListener() {},
  localStorage: { getItem: k => k in store ? store[k] : null, setItem: (k, v) => { store[k] = String(v) }, removeItem: k => { delete store[k] } },
});
const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
for (const [, src] of html.matchAll(/<script src="([^"]+)"><\/script>/g)) vm.runInContext(readFileSync(new URL(src, root), "utf8"), ctx, { filename: src });
const run = code => vm.runInContext(code, ctx);

let n = 0;
const t = (name, fn) => { run("state.sessions=[{id:'s1',name:'t',mobIds:[],entries:[]}];state.current='s1';state.chars={};state.bonus=0;state.dropBonus=0"); fn(); n++; console.log("ok", name); };
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ""} ${a} != ${b}`);
// a made-up monster, so the expected numbers don't depend on the exported tables
const MOB = "({id:-1,name:'Dummy',lv:50,hp:10000,exp:2000,el:'Water',elv:1,size:'L',race:'Brute',def:20,mdef:10,vit:30,int:20,hit100:200,flee95:250,atkMin:100,atkMax:200,drops:[]})";
// pick a job and character fields, then redo what renderAll does before the maths reads them
const setup = (job, fields) => run(`state.job=${JSON.stringify(job)};state.chars={};Object.assign(C(),${JSON.stringify(fields)});
  if(C().a&&${JSON.stringify(!!fields.a)})C().a={...C().a};SKFX=skillEffects(C());applyBuild();applyConsumables();`);

t("element table and weapon size modifiers", () => {
  assert.equal(run(`elemMult({el:'Water',elv:1},'Wind')`), 150);
  assert.equal(run(`elemMult({el:'Ghost',elv:4},'Neutral')`), 0);
  assert.equal(run(`elemMult({},'Fire')`), 100);                      // no element: Neutral 1
  assert.equal(run(`sizeMod({size:'L'},'Dagger')`), 50);
  assert.equal(run(`sizeMod({size:'S'},'Spear')`), 75);              // old saves' weapon names still work
});

t("physical damage per hit: weapon share takes size and element, status ATK stays Neutral", () => {
  setup("Knight", { atkTxt: "100+300", wAtk: 0, weapon: "Two-handed spear", wElem: "Wind", st: {}, a: { name: "x", type: "auto", pct: 100, hits: 1, el: "W", cast: 0, delay: 0, sp: 0, targets: 1 } });
  // no STR typed, so no +0.5%/STR on weapon ATK. Pool = 300 × size 100% × Wind vs Water 150% + 2 × 100 status ATK × 100%
  const pool = 300 * 1.5 + 200, df = 20, soft = Math.floor((50 + 30) / 2);
  assert.equal(run(`dmgPerHit(${MOB})`), Math.floor(pool * (4000 + df) / (4000 + 10 * df) - soft));
  run(`C().ignDef=50`);                                              // ignore DEF halves hard DEF only
  assert.equal(run(`dmgPerHit(${MOB})`), Math.floor(pool * (4000 + 10) / (4000 + 100) - soft));
});

t("magic damage per hit: MATK × skill %, MDEF factor, soft MDEF, element", () => {
  setup("Wizard", { matkTxt: "200+100", st: {}, intTxt: "", a: { name: "x", type: "magic", pct: 100, hits: 3, el: "Wind", cast: 0, delay: 0, sp: 10, targets: 1 } });
  const md = 10, soft = Math.floor((50 + 20) / 4);
  assert.equal(run(`dmgPerHit(${MOB})`), Math.floor((300 * (1000 + md) / (1000 + 10 * md) - soft) * 1.5));
  run(`C().a.el='Water'`);                                           // Water vs Water 1: 25%
  assert.equal(run(`dmgPerHit(${MOB})`), Math.floor((300 * (1000 + md) / (1000 + 10 * md) - soft) * 0.25));
});

t("hit chance and uses per kill spread over misses", () => {
  setup("Knight", { atkTxt: "100+300", hitTxt: "250", wAtk: 0, weapon: "Two-handed spear", wElem: "Neutral", st: {}, a: { name: "x", type: "phys", pct: 100, hits: 2, el: "W", cast: 0, delay: 0, sp: 0, targets: 1 } });
  assert.equal(run(`hitChance(${MOB})`), 100);                         // 100 + 250 − 200, capped at 100
  run(`C().hitTxt="120"`);
  assert.equal(run(`hitChance(${MOB})`), 20);
  run(`C().hitTxt="1"`);
  assert.equal(run(`hitChance(${MOB})`), 5);                          // floor 5%
  run(`C().hitTxt="150"`);
  const d = run(`dmgPerHit(${MOB})`);
  near(run(`usesPerKill(${MOB})`), Math.ceil(10000 / (d * 2)) / 0.5);
  assert.equal(run(`C().a.type="magic";hitChance(${MOB})`), 100);      // magic always lands
});

t("cast time: variable part shrinks with DEX and INT, fixed part doesn't", () => {
  setup("Wizard", { st: { dex: "60" }, intTxt: "70", a: { name: "x", type: "magic", pct: 100, hits: 1, el: "Fire", vct: 4, fct: 1, cast: 5, delay: 0, sp: 0, targets: 1 } });
  near(run(`vctFactor()`), 1 - Math.sqrt((2 * 60 + 70) / 530));
  near(run(`castSec()`), 4 * (1 - Math.sqrt(190 / 530)) + 1);
  run(`C().st.dex="230";C().intTxt="70"`);                            // 2×230 + 70 = 530: no variable cast left
  near(run(`castSec()`), 1);
});

t("party Even Share and EXP bonus", () => {
  run(`state.bonus=50;cur().partyN=3;cur().partyBonus=20`);
  near(run(`expMul()`), 1.5 * (1 + 0.2 * 2) / 3);
  run(`cur().partyN=1`);
  near(run(`expMul()`), 1.5);
});

t("tracker: EXP rate across a level-up, with paused time left out", () => {
  const h = 36e5, t0 = 1e12;
  run(`cur().entries=[{t:${t0},lv:10,pct:50},{t:${t0 + h},lv:11,pct:25}];cur().pauses=[]`);
  const exp = run("EXP_TABLE[10]") * 0.5 + run("EXP_TABLE[11]") * 0.25;
  let s = run("stats(cur())");
  near(s.avgRaw, exp);
  near(s.nextH, run("EXP_TABLE[11]") * 0.75 / exp);
  run(`cur().pauses=[{from:${t0 + h / 4},to:${t0 + h / 2}}]`);        // 15 min away: same EXP over 45 min
  s = run("stats(cur())");
  near(s.avgRaw, exp / 0.75);
  assert.equal(s.spanMin, 45);
});

t("tracker: job EXP % wraps at a job level-up", () => {
  const t0 = 1e12;
  run(`cur().entries=[{t:${t0},lv:10,pct:1,jpct:80},{t:${t0 + 18e5},lv:10,pct:2,jpct:95},{t:${t0 + 36e5},lv:10,pct:3,jpct:10}];cur().pauses=[]`);
  const j = run("jobRate(cur())");
  near(j.rate, 15 + 15);                                              // 80 → 95 → (100) → 10 in one hour
  assert.equal(j.last, 10);
});

t("job EXP: the last job level is the max and needs no EXP", () => {
  run(`state.job="Novice";state.chars={};state.goalJobLv=null`);
  const t = run("JOB_EXP.novice");
  assert.equal(run("jobMax()"), 10);                                  // Novice Job Lv 10 is the max (official guide)
  assert.equal(run("C().jobLv=9;jobNeed()"), t[8]);
  assert.equal(run("C().jobLv=10;jobNeed()"), null);
  assert.equal(run("jobMax('first')"), 50);
  assert.equal(run("jobMax('second')"), 70);
  // job goal from Job Lv 1 at 0% to the max: every entry but the max level's own
  const t0 = 1e12;
  run(`C().jobLv=1;cur().entries=[{t:${t0},lv:10,pct:0,jpct:0},{t:${t0 + 36e5},lv:10,pct:1,jpct:10}];cur().pauses=[]`);
  const g = run("renderJobGoal(cur())"), rate = 10 / 100 * t[0];   // 10% of Job Lv 1 per hour
  assert.equal(g.hi, 10);
  near(g.pts[g.pts.length - 1].h * rate, t.slice(0, 9).reduce((x, y) => x + y, 0) - 0.1 * t[0]); // already 10% into Job Lv 1
  assert.equal(run("C().jobLv=10;renderJobGoal(cur())"), undefined); // at the max: a note, no goal
});

t("walking time: the current session first, then another of the same job, then 2s", () => {
  setup("Knight", { atkTxt: "100+300", hitTxt: "400", wAtk: 0, weapon: "Two-handed spear", wElem: "Neutral", st: {}, a: { name: "x", type: "auto", pct: 100, hits: 1, el: "W", cast: 0, delay: 0, sp: 0, targets: 1 } });
  const t0 = 1e12, sess = (id, pct) => `{id:'${id}',name:'${id}',job:'Knight',mobIds:[1002],entries:[{t:${t0},lv:30,pct:10},{t:${t0 + 36e5},lv:30,pct:${pct}}]}`;
  run(`state.walkOverride=0;state.sessions=[${sess("a", 20)},${sess("b", 15)},{id:'c',name:'c',mobIds:[],entries:[]}];state.current='b'`);
  const walk = id => run(`sessionPace(state.sessions.find(s=>s.id==='${id}')).walk`);
  assert.ok(walk("a") > 1 && walk("b") > walk("a"));                 // slower EXP, so more walking per kill
  near(run("walkSec()"), walk("b"));
  run("state.current='c'");
  near(run("walkSec()"), walk("a"));                                 // the current session has no pace yet
  run("state.sessions.forEach(s=>s.job='Mage')");
  assert.equal(run("walkSec()"), 2);                                  // no session of this job
  run("state.walkOverride=7");
  assert.equal(run("walkSec()"), 7);                                  // typed in Goal wins
  run("state.walkOverride=0");
});

t("zeny per kill: the loot value scaled by the drop rate bonus", () => {
  assert.equal(run(`zenyKill({loot:200})`), 200);
  assert.equal(run(`state.dropBonus=50;zenyKill({loot:200})`), 300);
  assert.equal(run(`zenyKill({})`), 0);
});

t("monster table filters", () => {
  const m = (e, v, txt) => run(`matchF(${JSON.stringify(e)},${JSON.stringify(v)},${JSON.stringify(txt ?? null)})`);
  assert.ok(m("<350", 300) && !m("<350", 350));
  assert.ok(m("100-200", 150) && !m("100-200", 201));
  assert.ok(m("fire", null, "Fire 2") && !m("fire", null, "Water 1"));
  assert.ok(m("-", null) && !m("-", 5));
  assert.ok(m("<10 or >100", 150) && !m("<10 or >100", 50));
});

console.log(`${n} tests passed`);

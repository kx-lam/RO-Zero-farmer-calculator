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
const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
// a fresh copy of the page's scripts; save (optional) is what localStorage holds for the account when they load
const load = save => {
  const store = save ? { "rozero-farm-planner-v1": JSON.stringify(save) } : {};
  const ctx = vm.createContext({
    document: stub(), console, setTimeout: () => 0, clearTimeout() {}, navigator: stub(), location: stub(), scrollTo() {}, addEventListener() {},
    localStorage: { getItem: k => k in store ? store[k] : null, setItem: (k, v) => { store[k] = String(v) }, removeItem: k => { delete store[k] } },
  });
  for (const [, src] of html.matchAll(/<script src="([^"]+)"><\/script>/g)) vm.runInContext(readFileSync(new URL(src, root), "utf8"), ctx, { filename: src });
  return code => vm.runInContext(code, ctx);
};
const run = load();

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

t("a restored save is cleaned up before anything uses it", () => {
  // what a broken or hand-made backup or share link could hold
  const bad = "x\"'><img src=x onerror=1>";
  const app = load({ job: "Sage", tab: bad, refTier: bad, current: "s1",
    sessions: [{ id: "s1", name: "S", mobIds: [1002], entries: [{ t: 1e12, lv: 40, pct: 10 }, { t: 1e12 + 36e5, lv: 40, pct: 30 }],
      pauses: [{ from: bad, to: 1e12 + 1e6 }, { from: 1e12 + 1e5, to: bad }, { from: 1e12 + 2e5, to: 1e12 + 3e5 }, { from: 1e12 + 4e5 }] }],
    chars: { Sage: { skills: { "spell-fist": bad, "fire-bolt": "7", hindsight: 3.6, "cold-bolt": -2 }, build: { check: { atk: bad, hit: "250", sp: "" } } }, Knight: "junk" } });
  assert.deepEqual(app("JSON.stringify(cur().pauses)"), JSON.stringify([{ from: 1e12 + 2e5, to: 1e12 + 3e5 }, { from: 1e12 + 4e5 }]));
  assert.deepEqual(app("JSON.stringify(state.chars.Sage.skills)"), JSON.stringify({ "fire-bolt": 7, hindsight: 4 }));
  assert.deepEqual(app("JSON.stringify(state.chars.Sage.build.check)"), JSON.stringify({ hit: 250 }));
  assert.equal(app("'Knight' in state.chars"), false);
  assert.equal(app("state.tab"), "char");                              // not one of the tabs: back to Character
  assert.ok(app("stats(cur())").avgRaw > 0);                            // the tracker maths still runs
});

t("Vitata: you cast Heal Lv1, so healing takes time away from attacking", () => {
  setup("Sage", { matkTxt: "300+200", aspd: 170, defTxt: "10+10", maxSp: 800, maxHp: 4000, hitScale: 1, mobInterval: 1.5, st: {}, intTxt: "",
    sage: { vitata: false, healSp: 13, healHp: 357, spBonus: 25, ecOn: false, hsOn: false, hsAuto: false } });
  const off = run(`fightSec(${MOB})`);
  assert.equal(run(`healShare(${MOB})`), 0);                         // no Vitata: no healing
  run("G().vitata=true");
  const d = run(`sgDefense(${MOB})`), heals = d.hp / 357, f = heals * Math.max(0.3, 1 / run("atkPerSec()"));
  near(run(`healsPerSec(${MOB})`), heals);
  near(run(`healShare(${MOB})`), f);
  assert.ok(f > 0 && f < 1);
  near(run(`fightSec(${MOB})`), off / (1 - f));                       // the fight takes longer by the time spent healing
  near(d.healSP, heals * 13 * 1.25);                                  // Heal's SP carries Vitata's +25%
  run("G().healHp=1");                                                // a heal too small to keep up
  assert.equal(run(`fightSec(${MOB})`), Infinity);
});

t("skill buffs: element and crit damage bonuses don't become damage on every hit", () => {
  const AUTO = { name: "x", type: "auto", pct: 100, hits: 1, el: "W", cast: 0, delay: 0, sp: 0, targets: 1 };
  // hit with the buff off and on; the skill is learned at max and the buff ticked, as on the Skills card
  const hit = (job, slug, fields) => [false, true].map(on => run(`(()=>{state.job=${JSON.stringify(job)};state.chars={};const c=C();Object.assign(c,${JSON.stringify(fields)});
    c.skills={${JSON.stringify(slug)}:skOf(state.job)[${JSON.stringify(slug)}].max};c.buffs={${JSON.stringify(slug)}:${on}};
    SKFX=skillEffects(c);applyBuild();applyConsumables();return {d:dmgPerHit(${MOB}),k:bonusMul(${MOB},c.a.type==="magic"),crit:SKFX.buffStat.filter(b=>b[0]==="crit_damage_percent").reduce((x,b)=>x+b[3],0)}})()`));
  const phys = el => ({ atkTxt: "100+300", wAtk: 0, wElem: el, st: {}, a: AUTO });
  // Lady Luck: "CRIT +10, Critical Damage +20%" only adds crit damage
  let [off, on] = hit("Dancer", "lady-luck", phys("Neutral"));
  assert.equal(on.d, off.d);
  assert.equal(on.crit, 20);
  // Volcano: "Fire Damage +20%" counts for a Fire weapon, not a Water one (its ATK +30 counts for both)
  const vol = hit("Sage", "volcano", phys("Water")), volFire = hit("Sage", "volcano", phys("Fire"));
  near(vol[1].k, vol[0].k, "Water weapon bonus");                       // its ATK +30 still raises the hit
  near(volFire[1].k / volFire[0].k, 1.2, "Fire weapon bonus");
  // Endow Blaze: "Fire Magical Damage +5%" leaves physical hits alone and adds 5% to Fire spells
  [off, on] = hit("Sage", "endow-blaze", phys("Fire"));
  assert.equal(on.d, off.d);
  const bolt = { name: "x", type: "magic", pct: 100, hits: 1, el: "Fire", cast: 0, delay: 0, sp: 0, targets: 1 };
  [off, on] = hit("Sage", "endow-blaze", { matkTxt: "300+200", st: {}, intTxt: "", a: bolt });
  near(on.k / off.k, 1.05, "Fire spell bonus");
  assert.ok(on.d > off.d);
});

t("monster table filters", () => {
  const m = (e, v, txt) => run(`matchF(${JSON.stringify(e)},${JSON.stringify(v)},${JSON.stringify(txt ?? null)})`);
  assert.ok(m("<350", 300) && !m("<350", 350));
  assert.ok(m("100-200", 150) && !m("100-200", 201));
  assert.ok(m("fire", null, "Fire 2") && !m("fire", null, "Water 1"));
  assert.ok(m("-", null) && !m("-", 5));
  assert.ok(m("<10 or >100", 150) && !m("<10 or >100", 50));
});

t("map names: in-game codes, rozerodb codes and unique names all find the same map", () => {
  assert.equal(run(`mapCode("sp_d05")`), "in_sphinx5");
  assert.equal(run(`mapName("sp_d05")`), "Sphinx F5");
  for (const s of ["in_sphinx5", "SP_D05", "sp_dun05", " Sphinx F5 "]) assert.equal(run(`mapKey(${JSON.stringify(s)})`), "sp_d05");
  assert.equal(run(`mapKey("mjo_dun03")`), "mjo_d03");
  assert.equal(run(`mapKey("Prontera Field")`), "prontera field");      // a name many maps share stays as typed
  assert.equal(run(`mapCode("nowhere")`), "nowhere");
  run(`state.regions={};state.closed=["in_sphinx5"]`);                  // a map closed by its in-game code
  assert.ok(run(`isClosed("sp_d05")`) && !run(`isClosed("sp_d04")`));
  run(`state.closed=[]`);
});

t("monsters with no EXP in rozerodb are listed but left out of EXP averages", () => {
  const myst = run(`MOBS.find(m=>m.name==="Myst")`);
  assert.ok(myst.expUnknown && myst.exp === 0);
  assert.equal(run(`fmtExp(MOBS.find(m=>m.name==="Myst"))`), "?");
  assert.ok(run(`MAPMOBS.mjo_d03.some(x=>x.m.name==="Myst"&&x.n===39)`));
  setup("Knight", { atkTxt: "100+300", wAtk: 0, weapon: "Two-handed spear", st: {}, a: { name: "x", type: "auto", pct: 100, hits: 1, el: "W", cast: 0, delay: 0, sp: 0, targets: 1 } });
  const r = run(`mapStats0("mjo_d03",2)`);
  assert.equal([...r.unkNames].sort().join(), "Cramp,Giearth,Myst");
  // only the monsters with known EXP make up EXP / kill
  const known = run(`MAPMOBS.mjo_d03.filter(x=>!x.m.boss&&!x.m.expUnknown).map(x=>x.m.name)`);
  assert.ok(known.length && !known.includes("Myst"));
  assert.ok(r.epk > 0 && isFinite(r.epm));
});

console.log(`${n} tests passed`);

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
  const app = load({ job: "Sage", tab: bad, refTier: bad, current: "s1", prices: { "904": 3000, [bad]: 5000, "938": bad }, npcPrices: { "904": 10, [bad]: 1 },
    sessions: [{ id: "s1", name: "S", mobIds: [1002], entries: [{ t: 1e12, lv: 40, pct: 10 }, { t: 1e12 + 36e5, lv: 40, pct: 30 }],
      pauses: [{ from: bad, to: 1e12 + 1e6 }, { from: 1e12 + 1e5, to: bad }, { from: 1e12 + 2e5, to: 1e12 + 3e5 }, { from: 1e12 + 4e5 }] }],
    chars: { Sage: { skills: { "spell-fist": bad, "fire-bolt": "7", hindsight: 3.6, "cold-bolt": -2 }, build: { check: { atk: bad, hit: "250", sp: "" } } }, Knight: "junk" } });
  assert.deepEqual(app("JSON.stringify(cur().pauses)"), JSON.stringify([{ from: 1e12 + 2e5, to: 1e12 + 3e5 }, { from: 1e12 + 4e5 }]));
  assert.deepEqual(app("JSON.stringify(state.chars.Sage.skills)"), JSON.stringify({ "fire-bolt": 7, hindsight: 4 }));
  assert.deepEqual(app("JSON.stringify(state.chars.Sage.build.check)"), JSON.stringify({ hit: 250 }));
  assert.equal(app("'Knight' in state.chars"), false);
  assert.deepEqual(app("JSON.stringify(state.prices)"), JSON.stringify({ "904": 3000 }));   // item ids only, numbers only
  assert.deepEqual(app("JSON.stringify(state.npcPrices)"), JSON.stringify({ "904": 10 }));
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
  assert.equal(run(`mapName("sp_d05")`), "Sphinx B5F");
  for (const s of ["in_sphinx5", "SP_D05", "sp_dun05", " Sphinx B5F "]) assert.equal(run(`mapKey(${JSON.stringify(s)})`), "sp_d05");
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

t("Zeny Hunter: net zeny per hour is loot less skill and item costs, and counts monsters with no EXP", () => {
  setup("Knight", { atkTxt: "100+300", wAtk: 0, weapon: "Two-handed spear", st: {}, autoSp: false, potOn: false, cons: [], a: { name: "x", type: "auto", pct: 100, hits: 1, el: "W", cast: 0, delay: 0, sp: 0, targets: 1 } });
  const mob = MOB.replace("drops:[]", "drops:[],loot:500");
  const r = run(`huntMob0(${mob},2)`), sec = run(`fightSec(${mob})`) + 2;
  near(r.zk, 500); near(r.loot, 500 * 3600 / sec); near(r.net, r.loot); assert.equal(r.cost, 0);
  run(`state.dropBonus=50`);                                            // drop rate bonus scales loot
  near(run(`huntMob0(${mob},2)`).loot, 750 * 3600 / sec);
  run(`state.dropBonus=0;C().a.zeny=100`);                              // Mammonite-style zeny per use comes off each kill
  near(run(`huntMob0(${mob},2)`).zk, 500 - 100 * run(`usesPerKill(${mob})`));
  run(`C().a.zeny=0;C().potOn=true;C().potMin=30;C().potPrice=1000`);   // an ASPD potion every 30 min: 2,000 z/hr
  const p = run(`huntMob0(${mob},2)`);
  near(p.cost, 2000); near(p.net, p.loot - 2000);
  run(`C().potOn=false`);
  // Myst has no EXP in rozerodb but still drops loot, so it counts towards zeny on its map
  const map = run(`huntMap0("mjo_d03",2)`);
  assert.ok(map.earn.some(x => x.m.name === "Myst") && map.epm > 0 && map.net > 0);
  // monsters you skip are left out
  const id = run(`MOBS.find(m=>m.name==="Myst").id`);
  run(`state.skipMobs=[${id}]`);
  assert.ok(!run(`huntMap0("mjo_d03",2)`).earn.some(x => x.m.name === "Myst"));
  run(`state.skipMobs=[]`);
});

t("market prices: a drop sold to players counts at its player price instead of its NPC price", () => {
  const mob = "({id:-2,name:'Seller',loot:50,drops:[[909,10],[4001,0.5]]})";
  near(run(`zenyKill(${mob})`), 50);                                     // no prices typed: rozerodb loot value only
  run(`state.prices={909:200}`);                                          // players pay 200, NPC price from rozerodb (data/prices.js)
  near(run(`zenyKill(${mob})`), 50 + (200 - run(`NPCSELL[909]`)) * 0.10);
  run(`state.npcPrices={909:10}`);                                        // NPC pays 10: that part is already in the loot value
  near(run(`zenyKill(${mob})`), 50 + (200 - 10) * 0.10);
  run(`state.dropBonus=100`);                                             // drop bonus doubles the chance (capped at 100%)
  near(run(`zenyKill(${mob})`), 100 + 190 * 0.20);
  run(`state.prices={909:5};state.npcPrices={909:10};state.dropBonus=0`); // cheaper than the NPC: you'd sell to the NPC
  near(run(`zenyKill(${mob})`), 50);
  assert.ok(run(`hasLoot({drops:[[909,10]]})`) === false);
  run(`state.prices={909:200};state.npcPrices={}`);
  assert.ok(run(`hasLoot({drops:[[909,10]]})`));                         // a priced drop gives a monster with no loot value a zeny figure
  run(`state.prices={}`);
});

t("weight: trips end at the sell point, no regen past 70%, nothing past 90%", () => {
  const atk = { name: "x", type: "auto", pct: 100, hits: 1, el: "W", cast: 0, delay: 0, sp: 0, targets: 1 };
  setup("Knight", { atkTxt: "100+300", wAtk: 0, weapon: "Two-handed spear", st: {}, a: atk, maxW: 0 });
  assert.equal(run(`ITEMW[909]`), 1);                                      // Jellopy weighs 1
  const mob = MOB.replace("drops:[]", "drops:[[909,100]]");
  const tot = run(`fightSec(${mob})`) + 2;
  near(run(`tripTot(${mob},${tot},2)`), tot);                               // no Max Weight typed: off
  run(`Object.assign(C(),{maxW:1000,curW:100,sellAt:70,townMin:2})`);
  near(run(`weightKill(${mob})`), 1);
  near(run(`tripTot(${mob},${tot},2)`), tot + 120 / 600);                   // 600 weight of room at 70%: a 2-minute trip spread over 600 kills
  near(run(`mobRow0(${mob},2)`).tot, tot + 120 / 600);
  assert.equal(Math.round(run(`tripInfo(${mob},2)`).kills), 600);
  run(`C().sellAt=90`);                                                     // basic attacks need no SP, so you carry on to 90%
  near(run(`tripTot(${mob},${tot},2)`), tot + 120 / 800);
  assert.equal(run(`withRegenOff(()=>regenPerSec())`), 0);
  run(`C().a={...C().a,type:"magic",matkTxt:"300",sp:30,el:"Wind"};C().matkTxt="300";C().autoSp=false`);
  const t2 = run(`fightSec(${mob})`) + 2;                                   // a spell costs SP: with no regen and no SP items you can't fight past 70%
  near(run(`tripTot(${mob},${t2},2)`), t2 + 120 / 600);
  assert.ok(run(`tripInfo(${mob},2)`).fell);
  run(`C().sellAt=70;C().curW=800`);                                        // already past the sell point
  assert.equal(run(`tripTot(${mob},${t2},2)`), Infinity);
  run(`C().sellAt=70;C().curW=100;C().baseLv=99`);                         // far above the monster: the drop penalty means less loot to carry
  assert.ok(run(`dropPenalty(${mob})`) > 0);
  near(run(`weightKill(${mob})`), 1 - run(`dropPenalty(${mob})`) / 100);
  run(`C().maxW=0;C().curW=0`);
});

t("NPC prices: rozerodb's NPC price is the default, a typed one overrides it", () => {
  assert.ok(run(`NPCSELL[909]`) > 0);                                     // Jellopy has an NPC price in data/prices.js
  assert.equal(run(`npcSell(909)`), run(`NPCSELL[909]`));
  run(`state.npcPrices={909:1}`); assert.equal(run(`npcSell(909)`), 1);    // typed value wins
  run(`state.npcPrices={909:0}`); assert.equal(run(`npcSell(909)`), 0);    // even 0
  run(`state.npcPrices={}`);
  assert.equal(run(`npcSell(-99)`), 0);                                   // unknown item: 0
  // every drop in loot.js is listed; null where rozerodb has no price, which counts as 0
  assert.deepEqual(run(`Object.values(LOOT).flatMap(v=>v[3].map(d=>String(d[0]))).filter(id=>!(id in NPCSELL)).length`), 0);
  assert.equal(run(`NPCSELL[7001]`), null); assert.equal(run(`npcSell(7001)`), 0);
  // players pay 200, an NPC 10, at 10%: the loot value plus what the player price beats the NPC price by
  run(`NPCSELL[-5]=10;state.prices={"-5":200}`);
  near(run(`zenyKill({loot:50,drops:[[-5,10]]})`), 50 + (200 - 10) * 0.10);
  run(`delete NPCSELL[-5];state.prices={}`);
});

t("drop level penalty: monster Lv − base Lv, none down to −19, 50% from −40", () => {
  run(`C().baseLv=60`);
  for (const lv of [99, 60, 41]) assert.equal(run(`dropPenalty({lv:${lv}})`), 0);  // gap +39, 0, −19: free band
  assert.equal(run(`penNote({lv:41})`), "");
  for (const lv of [20, 1]) assert.equal(run(`dropPenalty({lv:${lv}})`), 50);    // gap −40, −59
  assert.equal(run(`penNote({lv:20})`), "drops −50% (Lv gap −40)");
  assert.equal(run(`dropPenalty({lv:30})`), 0);                                   // −30: not in the guide, counted as none
  assert.match(run(`penNote({lv:30})`), /unknown/);
  assert.equal(run(`dropPenalty({})`), 0);                                        // no monster level: no penalty
});

t("drop level penalty scales zeny per kill and the Zeny Hunter", () => {
  run(`C().baseLv=60`);
  const mob = "({id:-3,name:'Low',lv:20,loot:100,drops:[[909,10]]})";
  near(run(`zenyKill(${mob})`), 50);                                     // loot value halved
  run(`state.prices={909:200};state.npcPrices={909:10}`);
  near(run(`zenyKill(${mob})`), 50 + 190 * 0.05);                         // the market part too: 10% chance becomes 5%
  run(`state.dropBonus=100`);                                             // bonus and penalty both apply: 10% × 2 × 0.5
  near(run(`zenyKill(${mob})`), 100 + 190 * 0.10);
  run(`state.dropBonus=0;state.prices={};state.npcPrices={}`);
  // a monster far below the character earns less in the rankings
  setup("Knight", { atkTxt: "100+300", wAtk: 0, weapon: "Two-handed spear", st: {}, autoSp: false, potOn: false, cons: [], a: { name: "x", type: "auto", pct: 100, hits: 1, el: "W", cast: 0, delay: 0, sp: 0, targets: 1 } });
  const low = MOB.replace("drops:[]", "drops:[],loot:500").replace("lv:50", "lv:20");
  run(`C().baseLv=50`); const near0 = run(`huntMob0(${low},2)`);
  run(`C().baseLv=60`); const far = run(`huntMob0(${low},2)`);
  near(near0.zk, 500); near(far.zk, 250); assert.ok(far.net < near0.net);
  const real = run(`MOBS.find(m=>m.id===1002)`).lv;                       // Poring: ranks lower once you outlevel it by 40
  run(`C().baseLv=${real}`); const a = run(`huntMob0(MOBS.find(m=>m.id===1002),2)`);
  run(`C().baseLv=${real + 40}`); const b = run(`huntMob0(MOBS.find(m=>m.id===1002),2)`);
  near(b.zk, a.zk / 2);
});

t("auto loot: drops of a group you don't loot earn nothing", () => {
  run(`C().baseLv=1;state.dropBonus=0;state.prices={};state.npcPrices={};state.autoLoot={}`);
  assert.equal(run(`ITEMTYPE[909]`), "e"); assert.equal(run(`ITEMTYPE[4001]`), "c"); assert.equal(run(`ITEMTYPE[1202]`), "w");
  const mob = "({id:-4,name:'Looter',lv:1,loot:50,drops:[[909,10],[4001,0.5]]})";
  near(run(`zenyKill(${mob})`), 50);                                       // everything looted: rozerodb's loot value as is
  run(`state.autoLoot={c:false}`);                                          // cards left behind: only the Jellopy counts
  near(run(`zenyKill(${mob})`), run(`NPCSELL[909]`) * 0.10);
  run(`state.prices={4001:100000}`);                                        // a market price doesn't matter for an item you don't pick up
  near(run(`zenyKill(${mob})`), run(`NPCSELL[909]`) * 0.10);
  assert.equal(run(`dropZ(${mob},4001,0.5)`), 0);
  run(`state.autoLoot={}`);                                                 // each drop's share adds up to zeny per kill
  const sum = run(`(m=>m.drops.reduce((a,[id,ch])=>a+dropZ(m,id,ch),0))(MOBS.find(m=>m.id===1002))`);
  assert.ok(Math.abs(run(`zenyKill(MOBS.find(m=>m.id===1002))`) - sum) <= 1);   // loot.js rounds its loot value to the zeny
  run(`state.prices={};state.autoLoot={}`);
});

t("Zeny Hunter monster picks: passing monsters by drops them from the map and lengthens the walk", () => {
  setup("Knight", { atkTxt: "100+300", wAtk: 0, weapon: "Two-handed spear", st: {}, autoSp: false, potOn: false, cons: [], a: { name: "x", type: "auto", pct: 100, hits: 1, el: "W", cast: 0, delay: 0, sp: 0, targets: 1 } });
  run(`state.huntOff={};state.huntAuto=false`);
  const all = run(`huntMap0("mjo_d03",2)`);
  assert.equal(all.earn.length, all.mobs.length); near(all.walk, 2);
  const off = all.mobs[all.mobs.length - 1], rest = all.n - off.n;
  run(`state.huntOff={mjo_d03:[${off.m.id}]}`);
  const r = run(`huntMap0("mjo_d03",2)`);
  assert.ok(r.manual && !r.earn.some(x => x.m.id === off.m.id) && r.mobs.find(x => x.m.id === off.m.id).on === false);
  assert.equal(r.n, rest);
  const walked = 2 * Math.sqrt(all.n / rest), jumps = all.n / rest - 1;        // walking past it, or teleporting: whichever nets more
  if (r.tele) { near(r.tele, jumps); near(r.walk, 2 + jumps * 1) } else near(r.walk, walked);
  run(`state.noTele=["mjo_d03"]`);                                            // a map that blocks teleport only walks
  const nt = run(`huntMap0("mjo_d03",2)`); near(nt.walk, walked); assert.equal(nt.tele, 0);
  run(`state.noTele=[];state.flyPrice=0;state.teleSec=0`);                   // free, instant teleports: no time lost, no cost
  const ft = run(`huntMap0("mjo_d03",2)`); near(ft.tele, jumps); near(ft.walk, 2); near(ft.cost, nt.cost);
  run(`delete state.flyPrice;delete state.teleSec`);
  run(`state.huntOff={};state.huntAuto=true`);                              // best-paying: never worse than hunting everything
  const a = run(`huntMap0("mjo_d03",2)`);
  assert.ok(a.net >= all.net - 1e-6 && !a.manual);
  const m40 = run(`huntMap0("mjo_d03",2,40)`);                               // but it keeps at least that many spawns
  assert.ok(m40.n >= Math.min(40, all.n) && m40.net <= a.net + 1e-6);
  run(`state.huntOff={mjo_d03:[]};`);                                       // a map you set by hand ignores best-paying
  near(run(`huntMap0("mjo_d03",2)`).net, all.net);
  run(`state.huntOff={};state.huntAuto=false`);
});

t("Overcharge raises NPC sales, Discount cuts NPC purchases (Merchant line)", () => {
  const atk = { name: "x", type: "auto", pct: 100, hits: 1, el: "W", cast: 0, delay: 0, sp: 0, targets: 1 };
  setup("Blacksmith", { atkTxt: "100+300", st: {}, a: atk, skills: {}, itemPrice: 1000, potOn: true, potMin: 30, potPrice: 1000, cons: [] });
  const mob = "({id:-3,name:'Seller',lv:50,loot:100,drops:[[909,10]]})";
  run(`C().baseLv=50;state.dropBonus=0;state.prices={};state.npcPrices={}`);
  near(run(`zenyKill(${mob})`), 100);                                     // no skills learned
  near(run(`potCostHr()`), 2000);
  run(`C().skills={overcharge:10,discount:10}`);
  assert.equal(run(`skRate("overcharge")`), 24);                          // Lv 10: 24% in Zero's skill data
  assert.equal(run(`(C().skills.overcharge=1,skRate("overcharge"))`), 7);  // Lv 1: 7%
  run(`C().skills.overcharge=10`);
  near(run(`zenyKill(${mob})`), 124);                                     // NPC loot value +24%
  run(`state.prices={909:200};state.npcPrices={909:10}`);                 // a market price replaces the NPC price you'd get with Overcharge
  near(run(`zenyKill(${mob})`), 124 + (200 - Math.floor(10 * 1.24)) * 0.10);
  near(run(`potCostHr()`), 2000 * 0.76);                                  // Discount −24% on what you buy from NPCs
  near(run(`spItemPrice()`), 760);
  run(`C().npcBuy=false`);                                                // bought from players: no Discount
  near(run(`potCostHr()`), 2000);
  run(`state.prices={};state.npcPrices={};C().skills={};C().potOn=false`);
});

t("spawn counts come from the client's navigation table (normal channels)", () => {
  const sp = (id, mp) => run(`JSON.stringify((SPAWN[${id}]||[]).find(x=>x[0]==="${mp}"))`);
  assert.equal(sp(1002, "prt_f08"), JSON.stringify(["prt_f08", 20, 30]));  // Poring: 20 on prt_fild08, 30 on the PvP channel
  assert.equal(sp(1169, "mjo_d03"), JSON.stringify(["mjo_d03", 78, 78]));  // Skel Worker on mjo_dun03
  assert.equal(sp(1013, "maz_d03"), JSON.stringify(["maz_d03", 20, 20]));  // Wolf on prt_maze03: missing before
  assert.equal(run(`Object.values(SPAWN).flat().filter(x=>!(x[1]>0)).length`), 0);
  assert.equal(run(`MAPMOBS.prt_f08.find(x=>x.m.id===1002).n`), 20);      // the app uses the normal-channel count
});

console.log(`${n} tests passed`);

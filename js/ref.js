// ---- EXP & formulas tab: EXP tables, the formulas the calculator uses (with your numbers), element and size tables ----
const yours=f=>{try{const v=f();return v==null||v===""||(typeof v==="number"&&!isFinite(v))?"–":v}catch(e){return "–"}};
function refFormulas(){const c=C(),m=calcMob(),ok=STATS.every(k=>statVal(c,k)!=null),d=ok?derived(c):null,lv=num(c.baseLv),ab=aspdBase(state.job,c.weapon);
  const sv=k=>statVal(c,k),ranged=RANGED.includes(c.weapon),mn=m?` (${esc(m.name)})`:"",need=f=>m?f(m):null;
  const grp=t=>`<tr class="grp"><td colspan="3">${t}</td></tr>`;
  const R=(name,f,y)=>`<tr><td class="name">${name}</td><td class="f">${f}</td><td>${yours(y)}</td></tr>`;
  return grp("Status window")+
   R("Status ATK",ranged?"⌊BaseLv/4 + DEX + STR/5 + LUK/3⌋ (bow, instrument, whip)":"⌊BaseLv/4 + STR + DEX/5 + LUK/3⌋ (melee; ranged swaps STR and DEX)",()=>d&&d.atk)+
   R("Status MATK","⌊BaseLv/4⌋ + INT + ⌊INT/2⌋ + ⌊DEX/5⌋ + ⌊LUK/3⌋",()=>d&&d.matk)+
   R("HIT","175 + BaseLv + DEX + ⌊LUK/3⌋",()=>d&&d.hit)+
   R("FLEE","100 + BaseLv + AGI + ⌊LUK/5⌋",()=>d&&d.flee)+
   R("Soft DEF","⌊BaseLv/2⌋ + ⌊VIT/2⌋ + ⌊AGI/5⌋",()=>d&&d.def)+
   R("Soft MDEF","⌊INT + BaseLv/4 + (DEX + VIT)/5⌋",()=>ok&&sv("int")!=null?Math.floor(sv("int")+lv/4+(sv("dex")+sv("vit"))/5):null)+
   R("CRIT","1 + LUK × 0.3 + BaseLv/100 (doubled with a katar)",()=>d&&d.crit.toFixed(1))+
   R("ASPD",`job + weapon base + √(AGI²/2 + DEX²/${ranged?7:5}) / 4, then ASPD % moves it toward 195: ASPD + (195 − ASPD) × %, cap 190`,()=>d&&ab!=null?`${ab} + ${d.aspdTerm.toFixed(1)} = ${(ab+d.aspdTerm).toFixed(1)}`:null)+
   R("Max HP","⌊(⌊job HP(BaseLv) × (1 + VIT/100)⌋ + gear HP) × (1 + HP %)⌋",()=>num(cf("maxHp"))>0?fmtN(num(cf("maxHp"))):null)+
   R("Max SP","⌊(⌊job SP(BaseLv) × (1 + INT/100)⌋ + gear SP) × (1 + SP %)⌋",()=>num(cf("maxSp"))>0?fmtN(num(cf("maxSp"))):null)+
   grp("Speed")+
   R("Attacks per second","50 / (200 − ASPD)",()=>`${atkPerSec().toFixed(2)} at ASPD ${aspdEff()}`)+
   R("Variable cast time","cast × (1 − √((2 × DEX + INT) / 530)) × (1 − cast %); none once 2 × DEX + INT ≥ 530",()=>sv("dex")!=null?`× ${vctFactor().toFixed(3)}`:null)+
   R("Fixed cast time","(fixed cast − flat reduction) × (1 − fixed cast %)",()=>null)+
   R("Time per skill use","cast time + max(after-cast delay × (1 − delay %), 1 / attacks per second)",()=>`${useSec().toFixed(2)} s (${esc(c.a.name||"attack")})`)+
   grp("Damage")+
   R("Weapon ATK",`weapon ATK (incl. refine) × (1 + ${ranged?"DEX":"STR"}/200)`,()=>{const P=atkParts();return P.weapon?fmtN(P.weapon):null})+
   R("Physical damage","⌊((weapon ATK × size % × element % + (2 × status ATK + other gear ATK) × Neutral %) × skill % + mastery ATK × Neutral %) × damage bonuses × (1 + ranged/melee %) × (1 + skill damage %, skills only) × (4000 + DEF) / (4000 + 10 × DEF) − monster soft DEF⌋, at least 1",()=>m&&c.a.type!=="magic"&&c.a.type!=="spellfist"?`${fmtN(dmgPerHit(m))} per hit${mn}`:null)+
   R("Magic damage","⌊(MATK × skill % × damage bonuses × (1 + skill damage %) × (1000 + MDEF) / (1000 + 10 × MDEF) − monster soft MDEF) × element %⌋, at least 1",()=>m&&(c.a.type==="magic"||c.a.type==="spellfist")?`${fmtN(dmgPerHit(m))} per hit${mn}`:null)+
   R("Damage bonuses","each category multiplies: (1 + race %) × (1 + size %) × (1 + element %) × (1 + boss/normal %) × (1 + all %) × (1 + damage bonus %) × (1 + name bonus %, when the name matches) × (1 + vs normal monsters %, not bosses) × (1 + my attack element %) × (1 + skill passives and buffs %); for magic, also × (1 + gear magic % of your spell's element); bonuses in the same category add",()=>m?`× ${bonusMul(m,c.a.type==="magic"||c.a.type==="spellfist").toFixed(2)}${mn}`:null)+
   R("Ignore DEF / MDEF","DEF × (1 − ignore %) before the DEF factor",()=>num(c.ignDef)||num(c.ignMdef)?`${num(c.ignDef)}% / ${num(c.ignMdef)}%`:null)+
   R("Monster soft DEF","⌊(monster Lv + VIT) / 2⌋",()=>need(x=>`${mobSoftDef(x)}${mn}`))+
   R("Monster soft MDEF","⌊(monster Lv + INT) / 4⌋",()=>need(x=>`${mobSoftMdef(x)}${mn}`))+
   R("Hit chance","100 + HIT − monster's 100%-hit value, 5–100%; magic always hits",()=>need(x=>`${Math.round(hitChance(x))}%${mn}`))+
   R("Critical hit","chance = CRIT (basic attacks only), always hits, damage × 1.4 × (1 + crit damage %)",()=>c.a.type==="auto"?`${(critChance()*100).toFixed(1)}%`:null)+
   grp("Defence and SP")+
   R("Dodge","95 + FLEE − monster's 95%-flee value, 0–95%",()=>need(x=>dodge(x)==null?null:`${Math.round(dodge(x))}%${mn}`))+
   R("Damage taken","(monster ATK × (4000 + hard DEF) / (4000 + 10 × hard DEF) − soft DEF) × (1 + damage taken % from its race) × (1 + from its element) × (1 + from boss/normal), at least 1",()=>need(x=>mobHitDmg(x)==null?null:`${fmtN(mobHitDmg(x))} per hit${mn}`))+
   R("SP regen","1 + ⌊Max SP/100⌋ + ⌊INT/6⌋ every 8 s; none at 70% weight or more",()=>`${fmtN(spRegen8())} / 8 s`)+
   R("Overcharge / Discount","NPC sell price × (1 + Overcharge %), rounded down; NPC buy price × (1 − Discount %). Lv 1–10: 7, 9, 11, 13, 15, 17, 19, 21, 23, 24%",()=>{const o=skRate("overcharge"),d=skRate("discount");return o||d?`+${o}% / −${d}%`:null})+
   R("Weight","at 70% of Max Weight HP and SP stop regenerating; at 90% you can't attack or use skills. Kills per trip = (Max Weight × sell point − weight now) / weight per kill; seconds per kill + town trip / kills per trip",()=>{if(!wOn())return "type your Max Weight";const t=m&&tripInfo(m,walkSec());return t&&t.wk>0?(isFinite(t.kills)?`${fmtN(Math.floor(t.kills))} kills a trip${mn}`:"sell first"):`${fmtN(num(c.curW))} / ${fmtN(num(c.maxW))}`})+
   grp("EXP")+
   R("Your EXP per kill","monster EXP × (1 + gear EXP % + gear EXP % vs its race) × (1 + EXP bonus %) × (1 + party bonus % × (members − 1)) / members",()=>need(x=>`${fmtN(x.exp*expRace(x)*expMul())}${mn}`))+
   R("Even Share party","100% + 20% per member beyond the first, split evenly",()=>`× ${expMul().toFixed(2)} of a solo kill`)+
   R("EXP / hour","EXP per kill × 3600 / (fight seconds + walking seconds)",()=>null)+
   grp("Loot")+
   R("Drop level penalty","level gap = monster Lv − your base Lv: −19 or more, no penalty; −40 or less, drops −50%; −20 to −39 isn't in the official guide, so no penalty is counted",()=>need(x=>dropGap(x)==null?null:`gap ${String(dropGap(x)).replace("-","−")}: ${penNote(x)||"no penalty"}${mn}`))+
   R("Zeny per kill","loot value × (1 + drop bonus %) × (1 − level penalty %) + Σ (player price − NPC price) × min(100%, chance × (1 + drop bonus %) × (1 − level penalty %)) over drops you price; with an auto-loot group unticked, the loot value is Σ NPC price × chance over the drops you loot, and drops you don't loot add nothing",()=>need(x=>`${fmtN(zenyKill(x))} z${mn}`))+
   R("Zeny Hunter walking","walking per kill × √(spawns of monsters you can hurt on the map / spawns of the ones you hunt): the nearest target is about 1 / √density away",()=>`${walkSec().toFixed(1)}s with every monster hunted`)+
   R("Zeny Hunter teleporting","extra teleports per kill = spawns you can hurt / spawns you hunt − 1; each adds the Fly Wing price and seconds per teleport. Maps marked \"no teleport\" only walk",()=>`${fmtN(flyPrice())} z and ${teleSec()}s per teleport`);
}
function renderRef(){const c=C(),m=calcMob(),blv=num(c.baseLv),jl=num(c.jobLv),per=m?m.exp*expRace(m)*expMul():0;
  const kills=e=>per>0?fmtN(Math.ceil(e/per)):"–",kh=m?`<th>Kills of ${esc(m.name)}</th>`:"";
  $("refExpNote").textContent=m?(m.expUnknown?`rozerodb has no EXP for ${m.name} yet`:`${fmtN(per)} base EXP per ${m.name}`):"Pick a monster to see kills per level";
  let tot=0;const base=Object.keys(EXP_TABLE).map(Number).sort((a,b)=>a-b).map(l=>{const e=EXP_TABLE[l],row=`<tr${l===blv?' class="sel"':""}><td>${l}</td><td>${fmtN(e)}</td><td>${fmtN(tot)}</td>${m?`<td>${kills(e)}</td>`:""}</tr>`;tot+=e;return row}).join("");
  $("refBaseTable").tHead.innerHTML=`<tr><th>Lv</th><th>EXP to next</th><th>Total</th>${kh}</tr>`;$("refBaseTable").tBodies[0].innerHTML=base;
  const tier=Object.hasOwn(JOB_EXP,state.refTier)?state.refTier:jobTier(),t=JOB_EXP[tier],mine=tier===jobTier();tot=0;
  ROOTQ("[data-reftier]").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.reftier===tier)));
  // job EXP per kill isn't in the monster data, so the job table has no kills column
  $("refJobTable").tHead.innerHTML=`<tr><th>Job Lv</th><th>Job EXP to next</th><th>Total</th></tr>`;
  $("refJobTable").tBodies[0].innerHTML=t.map((e,i)=>{const row=`<tr${mine&&i+1===jl?' class="sel"':""}><td>${i+1}</td><td>${i+1<t.length?fmtN(e):"max"}</td><td>${fmtN(tot)}</td></tr>`;tot+=e;return row}).join("");
  $("refFormulas").tBodies[0].innerHTML=refFormulas();
  const elv=Math.min(4,Math.max(1,num(state.refElv,1)));$("refElv").value=String(elv);const defs=Object.keys(ET),my=atkEl();
  $("refElemTable").tHead.innerHTML=`<tr><th>Attack ↓ / monster →</th>${defs.map(d=>`<th>${d} ${elv}</th>`).join("")}</tr>`;
  $("refElemTable").tBodies[0].innerHTML=AE.map((a,i)=>`<tr${a===my?' class="sel"':""}><td class="name"><span class="el ${a}">${a}</span></td>${defs.map(d=>{const v=ET[d][elv-1][i];return `<td class="${v>100?"good":v<100?"bad":"muted"}">${v}</td>`}).join("")}</tr>`).join("");
  $("refSizeTable").tBodies[0].innerHTML=Object.entries(WEAPONS).map(([w,v])=>`<tr${w===c.weapon?' class="sel"':""}><td class="name">${esc(w)}</td>${v.map(x=>`<td class="${x>100?"good":x<100?"bad":"muted"}">${x}</td>`).join("")}</tr>`).join("");
}
// scroll each EXP table so your level is in view (only works while the tab is showing)
const refScroll=()=>["refBaseTable","refJobTable"].forEach(id=>{const t=$(id),r=t.querySelector("tbody tr.sel"),w=t.parentElement;if(r&&w.clientHeight)w.scrollTop=Math.max(0,r.offsetTop-w.clientHeight/3)});
ROOTQ("[data-reftier]").forEach(b=>b.addEventListener("click",()=>{state.refTier=b.dataset.reftier;save();renderRef();refScroll()}));
$("refElv").addEventListener("change",e=>{state.refElv=+e.target.value;save();renderRef()});

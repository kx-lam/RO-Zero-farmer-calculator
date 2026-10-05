// ---- attack model ----
let EL_OVR=null;
const atkEl=()=>{const a=C().a;if(a.type==="spellfist")return EL_OVR||sfBolts()[0]||"Fire";return a.el==="W"?(EL_OVR||C().wElem):a.el};
// elemental converters (Fire/Water/Earth/Wind) change the weapon element for basic attacks and weapon-element skills
const convOn=()=>!!C().converters&&C().a.el==="W";
const elOptions=()=>C().a.type==="spellfist"?(sfBolts().length?sfBolts():[null]):convOn()?[...new Set([C().wElem,"Fire","Water","Earth","Wind"])]:[null];
const withEl=(el,fn)=>{const k=EL_OVR;EL_OVR=el;try{return fn()}finally{EL_OVR=k}};
const elTag=el=>el&&(convOn()||C().a.type==="spellfist")?` <span class="el ${el}">${el}</span>`:"";
// ASPD potion adds a flat bonus to your status window ASPD (Zero cap 190); its cost counts against zeny/hr
// damage maths read cf(k): the typed (or built) stat plus consumables, see applyConsumables
let EFF=null;const cf=k=>EFF&&EFF[k]!==undefined?EFF[k]:C()[k];
// the potion and buffs reach ASPD through their bonus lines (build-ui.js aspdBuffLines), so cf("aspd") already has them
const aspdEff=()=>Math.min(190,Math.max(100,num(cf("aspd"),170)));
// Merchant line: Overcharge raises what NPCs pay you, Discount cuts what NPCs charge you; Lv 1–10 give 7, 9, … 23, 24% in Zero,
// read from the learned level's description in data/skills.js ("Markup rate: 24%", "Discount rate: 24%")
const skRate=slug=>{const lv=skLv(C(),slug);if(!lv)return 0;for(const t of SKILLS[state.job]||[])for(const s of t.skills)if(s.slug===slug){const r=String((s.lv[lv-1]||[])[7]||"").match(/(\d+)%/);return r?+r[1]:0}return 0};
const ocMul=()=>1+skRate("overcharge")/100;
// Discount only helps with what you buy from an NPC: untick "from NPCs" when you buy SP items and potions from players
const discMul=()=>C().npcBuy===false?1:1-skRate("discount")/100;
const spItemPrice=()=>num(C().itemPrice)*discMul();
const potOnlyHr=()=>C().potOn&&num(C().potMin)>0?60/num(C().potMin)*num(C().potPrice)*discMul():0;
// zeny per hour spent on the ASPD potion plus the consumables that are switched on
const potCostHr=()=>potOnlyHr()+(C().cons||[]).filter(r=>r.on&&num(r.min)>0).reduce((a,r)=>a+60/num(r.min)*num(r.price)*discMul(),0);
const atkPerSec=()=>{const a=aspdEff();return 1000/((200-a)*20)};
// seconds per use: basic attacks follow ASPD; skills take cast + delay but can't beat your attack speed
// variable cast time factor: 1 − sqrt((2·DEX + INT) / 530), 0 at 530 (uses your DEX if typed)
const vctFactor=()=>{const c=C();const dex=statVal(c,"dex");if(dex==null)return 1;return Math.max(0,1-Math.sqrt((2*dex+statVal(c,"int"))/530))};
const castSec=()=>{const c=C(),a=c.a;
  if(a.fct!=null||a.vct!=null)return Math.max(0,num(a.vct)*vctFactor()*(1-num(c.vctPct)/100))+Math.max(0,(num(a.fct)-num(c.fctSec))*(1-num(c.fctPct)/100));
  const base=num(a.cast),f=Math.min(100,Math.max(0,num(c.fixedShare)))/100;
  return Math.max(0,base*(1-f)*vctFactor()*(1-num(c.vctPct)/100))+Math.max(0,(base*f-num(c.fctSec))*(1-num(c.fctPct)/100))};
const delaySec=()=>Math.max(0,num(C().a.delay)*(1-num(C().acdPct)/100));
const useSec=()=>{const a=C().a;if(a.type==="auto"||a.type==="spellfist")return 1/atkPerSec();return Math.max(castSec()+Math.max(delaySec(),1/atkPerSec()),0.1)};
// cart skills (Cart Revolution): +a.cart % per 8,000 cart weight, capped at a full 8,000 cart
const pctEff=()=>{const c=C(),a=c.a;let p=num(a.pct);(a.sadd||[]).forEach(([k,f])=>{const v=statVal(c,k);if(v!=null)p+=v*f});if(num(a.cart))p+=num(a.cart)*Math.min(8000,Math.max(0,num(c.cartW)))/8000;return a.blv?p*num(c.baseLv,99)/100:p};
const targets=()=>Math.max(1,num(C().a.targets,1));
// magic: true for magic damage (spells, Spell Fist, Shadow Spell auto-casts). Each race / size / element / name bonus is
// physical-only, magic-only or both (race / size / element default to both, as before the setting existed)
// In build mode gear adds per-race / size / element / boss-normal maps (build.js); the manual boxes add into the same category
// monster groups ("against Boulder Dwarves +30%"): each group counts once against monsters whose name contains it
const groupMul=(B,m)=>Object.entries(B.group||{}).reduce((k,[g,v])=>String(m.name||"").toLowerCase().includes(g.toLowerCase())?k*(1+v/100):k,1);
const bonusMul=(m,magic=false)=>{const c=C();let k=1+num(c.dmgBonus)/100;
  const on=t=>t==="both"||(t==="magic")===magic;
  const nm=String(c.nameSel||"").trim().toLowerCase();if(nm&&on(c.nameType||"phys")&&String(m.name).toLowerCase().includes(nm))k*=1+num(c.namePct)/100;
  const B=c.bx?(magic?c.bx.magic:c.bx.phys):null,el=m.el||"Neutral";
  if(B)k*=(1+(B.race[m.race]||0)/100)*(1+(B.size[m.size]||0)/100)*(1+(B.ele[el]||0)/100)*(1+(B.all||0)/100)*(1+(B.kind[m.boss?"boss":"normal"]||0)/100)*groupMul(B,m);
  if(!m.boss)k*=1+num(c.normalPct)/100;
  k*=1+num(c.myElPct)/100;if(magic&&c.bx)k*=1+((c.bx.myEle||{})[atkEl()]||0)/100;
  // learned passives and buffs: physical damage % (Advanced Katar Mastery, Power Thrust), element % for spells (Endow, Volcano...)
  // and, for an element's plain "Damage" bonus (Volcano, Deluge, Whirlwind), for physical attacks of that element too
  if(SKFX){if(!magic)k*=(1+SKFX.pct/100)*(1+(SKFX.physEle[atkEl()]||0)/100);else k*=1+(SKFX.myEle[atkEl()]||0)/100}return k};
// build mode: gear EXP bonus % (plus vs a monster's race), and damage taken from its race / element / boss-normal kind
const expGear=m=>{const c=C();return c.bx?(c.bx.exp.all||0)+((c.bx.exp.race||{})[m.race]||0):0};
// your EXP per kill: your Even Share cut (rounded down), then every EXP bonus added together, not multiplied (10% + 10% is ×1.20,
// matching the in-game kills noted at partyN). Gear EXP counts for base and job EXP; an item's "EXP +X%" is base EXP only and
// only "Job EXP +X%" raises job EXP (checked in game: a Captain with 10% gear gave +10% to both, an "EXP +10%" item +10% base only)
const partyCut=(v,s=cur())=>Math.floor(v*(100+partyBonus(s))/100/partyN(s));
const killExp=(m,s=cur())=>Math.floor(partyCut(m.exp,s)*(1+(expGear(m)+num(state.bonus))/100));
const killJobExp=(m,s=cur())=>Math.floor(partyCut(m.job,s)*(1+(expGear(m)+num(state.jobBonus))/100));
const takenMul=m=>{const c=C();if(!c.bx)return 1;const t=c.bx.taken;return (1+(t.race[m.race]||0)/100)*(1+(t.ele[m.el||"Neutral"]||0)/100)*(1+(t.kind[m.boss?"boss":"normal"]||0)/100)};
// ignore DEF / MDEF %: lowers the monster's hard defence before the (4000+DEF)/(4000+10·DEF) or (1000+MDEF)/(1000+10·MDEF) factor
const effDef=m=>(m.def||0)*(1-Math.min(100,Math.max(0,num(C().ignDef)))/100);
const effMdef=m=>(m.mdef||0)*(1-Math.min(100,Math.max(0,num(C().ignMdef)))/100);
// Formulas from roz.prontera.info/mechanics (Ragnarok Zero, renewal core)
// ATK is "status + gear". The weapon share takes size and element; status ATK counts twice and, with other gear, stays Neutral.
const atkParts=()=>{const p=String(cf("atkTxt")||"0").split("+").map(x=>parseFloat(x)||0);const st=p[0]||0,gear=p.slice(1).reduce((x,y)=>x+y,0);
  const w=num(C().wAtk)>0?Math.min(num(C().wAtk),gear):gear;
  // weapon ATK +0.5% per STR (melee) or DEX (bow, instrument, whip); checked against Landgris ROCalculator
  const c=C(),main=statVal(c,RANGED.includes(c.weapon)?"dex":"str");const wb=main!=null?1+main/200:1;
  return {st,gear,weapon:w*wb,neutral:Math.max(0,gear-w)+2*st}};
const mobSoftDef=m=>Math.max(0,Math.floor(((m.lv||0)+(m.vit||0))/2));
const mobSoftMdef=m=>Math.max(0,Math.floor(((m.lv||0)+(m.int||0))/4));
// "Your hit %": skill % after element, size and your bonuses, as a share of your full ATK (before monster DEF/MDEF)
const hitPctOf=m=>{const a=C().a;if(a.type==="spellfist")return sfPct()*elemMult(m,atkEl())/100*bonusMul(m,true);if(a.type==="magic")return pctEff()*elemMult(m,atkEl())/100*bonusMul(m,true);
  const P=atkParts(),tot=P.weapon+P.neutral;if(tot<=0)return 0;
  const k=(P.weapon*sizeMod(m,C().weapon)/100*elemMult(m,atkEl())/100+P.neutral*elemMult(m,"Neutral")/100)/tot;return pctEff()*k*bonusMul(m)};
// hit chance = 100 + your HIT − the monster's "100% hit" value, 5–100%; magic always lands
const hitChance=m=>{if(C().a.type==="magic"||C().a.type==="spellfist")return 100;if(m.hit100==null)return 95;return Math.max(5,Math.min(100,100+sumStat(cf("hitTxt"))-m.hit100))};
function dmgPerHit(m){
  const a=C().a;if(a.type==="spellfist")return magicDmg(m,sfPct(),atkEl());
  if(a.type==="magic"){const el=elemMult(m,atkEl())/100;if(el<=0)return 0;const md=effMdef(m);return Math.max(1,Math.floor((sumStat(cf("matkTxt"))*pctEff()/100*bonusMul(m,true)*(1+num(C().skillPct)/100)*(1000+md)/(1000+10*md)-mobSoftMdef(m))*el))}
  const P=atkParts();const pool=P.weapon*sizeMod(m,C().weapon)/100*elemMult(m,atkEl())/100+P.neutral*elemMult(m,"Neutral")/100;if(pool<=0)return 0;
  const c=C(),skill=a.type!=="auto";const rng=(1+num(c.rangePct)/100)*(skill?1+num(c.skillPct)/100:1);
  // mastery ATK (flat, from passive skills) is added after the skill ratio, before cards and DEF
  const df=effDef(m);return Math.max(1,Math.floor((pool*pctEff()/100+masteryFor(m)*elemMult(m,"Neutral")/100)*bonusMul(m)*rng*(4000+df)/(4000+10*df)-mobSoftDef(m)))}
// crits (basic attacks only): chance = CRIT (doubled with a katar) − monster LUK × 0.2, always hit, × 1.4 × (1 + crit damage %)
// m: the monster, for gear CRIT that only counts against its race (Cruiser Card: CRIT +7 vs Brute)
const critRace=m=>{const c=C();return m&&c.bx&&c.bx.critRace?num(c.bx.critRace[m.race]):0};
const critChance=m=>{const c=C();if(c.a.type!=="auto")return 0;return Math.min(100,Math.max(0,(num(cf("crit"))+critRace(m))*(c.weapon==="Katar"?2:1)-(m&&m.luk||0)*0.2))/100};
// uses needed per kill: whole hits that land, spread over misses
// average damage of one use: hits that land (crits always do, × 1.4 × (1 + crit damage %)) plus auto-casts, which only proc on swings that connect
const procPerUse=m=>ssDmg(m)*SS_CHANCE+acDmg(m)*acChance();
const useAvg=(m,per,proc)=>{const cr=critChance(m),hc=hitChance(m)/100;return per*(cr*1.4*(1+num(C().critDmg)/100)+(1-cr)*hc)+proc*(cr+(1-cr)*hc)};
const dpsOf=m=>{if(isSF())return null;const d=dmgPerHit(m),a=C().a,h=a.sizeHits?a.sizeHits[{S:0,M:1,L:2}[m.size]??1]:num(a.hits,1);return useAvg(m,d*Math.max(0.01,h),procPerUse(m))*targets()/useSec()};
function usesPerKill(m){if(isSF()){const d=sfPerAttack(m);return d>0?Math.ceil(m.hp/d):Infinity}const d=dmgPerHit(m),a=C().a,proc=procPerUse(m);if(d<=0&&proc<=0)return Infinity;const h=a.sizeHits?a.sizeHits[{S:0,M:1,L:2}[m.size]??1]:num(a.hits,1);const per=d*Math.max(0.01,h);
  // Shadow Spell and card auto-casts are averaged into each attack
  if(critChance(m)>0||proc>0)return Math.max(1,m.hp/useAvg(m,per,proc));
  return Math.ceil(m.hp/per)/(hitChance(m)/100)}
// SP: a use costs SP; natural regen is 1 + MaxSP/100 + INT/6 per 8s, + (INT − 120)/2 + 4 from INT 120 (roz.prontera.info), unless typed
const spRegen8=()=>{if(num(C().spRegen)>0)return num(C().spRegen);const i=statVal(C(),"int");return 1+Math.floor(num(cf("maxSp"))/100)+Math.floor(i/6)+(i>=120?Math.floor((i-120)/2)+4:0)};
// gear "SP consumption +x%" (build mode) scales the SP each use costs
const spCostMul=()=>{const c=C();return Math.max(0,1+(c.bx?num(c.bx.spCost):0)/100+(SKFX?SKFX.spCost:0)/100)};
const spNeedPerSec=()=>isSF()?sgUpkeep()+sgDefSP()+hsFullSP()*hsSustain():num(C().a.sp)*spCostMul()/useSec();
const regenPerSec=()=>REGEN_OFF?0:spRegen8()/8;
// items per second when auto SP items are on (covers the gap); otherwise you rest, which stretches fight time
const itemsPerSec=()=>isSF()?sgItemsPerSec():C().autoSp&&num(C().itemSp)>0?Math.max(0,spNeedPerSec()-regenPerSec())/num(C().itemSp):0;
const restFactor=()=>{if(isSF())return 1;if(C().autoSp&&num(C().itemSp)>0)return 1;const need=spNeedPerSec(),r=regenPerSec();return need>r&&r>0?need/r:need>0&&r<=0?Infinity:1};
const rawFight=m=>{const u=usesPerKill(m);return isFinite(u)?u*useSec()/targets():Infinity};
const fightSec=m=>{const f=healShare(m);return f>=1?Infinity:rawFight(m)*restFactor()/(1-f)};
// damage taken: monster ATK through your DEF, its hit chance on you, a swing every interval times "swings reach you"
const defParts=()=>{const p=String(cf("defTxt")||"0").split("+").map(x=>parseFloat(x)||0);return {soft:p[0]||0,hard:p.slice(1).reduce((a,b)=>a+b,0)}};
// dodge = 95 + your FLEE − the monster's "95% flee" value, 0–95%
const dodge=m=>m.flee95==null?null:Math.max(0,Math.min(95,95+sumStat(cf("fleeTxt"))-m.flee95));
const mobHitDmg=m=>{if(m.atkMin==null)return null;const {soft,hard}=defParts();return Math.max(1,((m.atkMin+m.atkMax)/2*(4000+hard)/(4000+10*hard)-soft)*takenMul(m))};
const hpLossPerMin=m=>{if(isSF()){const d=sgDefense(m);return d?Math.max(0,d.hp*60-num(C().hpRegen)):null}const raw=mobHitDmg(m);if(raw==null)return null;const dg=dodge(m);const hits=Math.max(0,num(C().hitScale,1))*(dg==null?1:(100-dg)/100)/Math.max(.3,num(C().mobInterval,1.5));return Math.max(0,raw*hits*60-num(C().hpRegen))};
// ---- Sage: full Spell Fist model (bolt choice, Hindsight, Double Bolt, Vitata, Energy Coat, Hunter Fly, Side Winder, SP items) ----
const SAGE_D={sfLv:10,boltLv:10,bolts:{Fire:true,Water:true,Wind:true},hsOn:false,hsAuto:true,hsLv:10,hsWorth:50000,dbOn:false,dbLv:5,vitata:true,spBonus:25,healSp:13,healHp:357,ecOn:true,hfOn:false,hfPct:5,hfHp:100,daSF:false,daPct:7,autoSpPct:50};
const G=()=>{const c=C();if(!c.sage)c.sage={};for(const k in SAGE_D)if(c.sage[k]==null)c.sage[k]=JSON.parse(JSON.stringify(SAGE_D[k]));return c.sage};
const isSF=()=>C().a.type==="spellfist";
let HS_OVR=null; // Hindsight forced on/off while comparing
const withHs=(v,fn)=>{const k=HS_OVR;HS_OVR=v;try{return fn()}finally{HS_OVR=k}};
const hsOnNow=()=>HS_OVR!=null?HS_OVR:!!G().hsOn;
const sfBolts=()=>["Fire","Water","Wind"].filter(b=>G().bolts[b]&&(state.job!=="Sage"||!hasTree(C())||skLv(C(),SG_BOLT[b])>0));
// Spell Fist: Lv × 5% proc chance on each basic attack; damage (1000 + 100 × bolt Lv)% MATK of the bolt's element (Landgris Zero data, checked in game)
const sfChance=()=>Math.min(10,Math.max(0,num(G().sfLv)))*5/100;
const sfPct=()=>1000+100*Math.min(10,Math.max(1,num(G().boltLv,10)));
const magicDmg=(m,pct,el,addMatk=0)=>{const e=elemMult(m,el)/100;if(e<=0||pct<=0)return 0;const md=effMdef(m);return Math.max(1,Math.floor(((sumStat(cf("matkTxt"))+addMatk)*pct/100*bonusMul(m,true)*(1+num(C().skillPct)/100)*(1000+md)/(1000+10*md)-mobSoftMdef(m))*e))};
// Hindsight: Lv × 2% chance per attack to auto-cast a bolt at half its level (100% MATK per hit); costs 2/3 of the bolt's SP
const hsLvN=()=>Math.min(10,Math.max(0,num(G().hsLv)));
const hsChance=()=>hsOnNow()?hsLvN()*2/100:0;
const hsBoltLv=()=>Math.floor(hsLvN()/2);
const sgSpMult=()=>1+(G().vitata?num(G().spBonus):0)/100; // Vitata Card: +25% SP cost
const hsProcSP=()=>(10+2*hsBoltLv())*2/3*sgSpMult();
// Double Bolt (needs Hindsight): (30 + 10 × Lv)% chance the auto-cast bolt fires again; recast every 90 s for 35 + 5 × Lv SP
const dbLvN=()=>Math.min(5,Math.max(1,num(G().dbLv,5)));
const dbChance=()=>hsOnNow()&&G().dbOn?(30+10*dbLvN())/100:0;
// Spell Fist upkeep: 76 SP plus a bolt every 300 s
const sgUpkeep=()=>(76+30)*sgSpMult()/300+(hsOnNow()&&G().dbOn?(35+5*dbLvN())*sgSpMult()/90:0);
// Side Winder Card: chance to hit twice; the 2nd hit can proc Spell Fist if ticked
const daFactor=()=>G().daSF?1+num(G().daPct)/100:1;
// Hunter Fly Card: each attack has a 5% chance to restore 100 HP/s for 5 s (refreshes, doesn't stack)
const hfHpPerSec=()=>{if(!G().hfOn)return 0;const p=num(G().hfPct)/100,n=atkPerSec()*5;return (1-Math.pow(1-p,n))*num(G().hfHp)};
// Energy Coat: damage cut and SP per hit taken (% of Max SP) depend on how full your SP is
const EC_BANDS=[[30,3,"100–81%"],[24,2.5,"80–61%"],[18,2,"60–41%"],[12,1.5,"40–21%"],[6,1,"20–1%"]];
const hsFullSP=()=>atkPerSec()*hsChance()*hsProcSP();
const sgItemsOn=()=>hsOnNow()&&num(C().itemSp)>0; // SP items go with Hindsight
function sgDefense(m){
  const raw=mobHitDmg(m);if(raw==null)return null;const dg=dodge(m);
  const hits=Math.max(0,num(C().hitScale,1))*(dg==null?1:(100-dg)/100)/Math.max(.3,num(C().mobInterval,1.5));
  const g=G(),max=num(cf("maxSp")),ec=!!g.ecOn,regen=regenPerSec(),up=sgUpkeep(),hs=hsFullSP();
  const band=i=>{const red=ec?EC_BANDS[i][0]:0,ecSP=ec?hits*EC_BANDS[i][1]/100*max:0,taken=raw*(1-red/100)*hits,hp=Math.max(0,taken-hfHpPerSec()),healSP=g.vitata&&num(g.healHp)>0?hp/num(g.healHp)*num(g.healSp)*sgSpMult():0;return {i,red,ecSP,healSP,hp,taken,label:ec?EC_BANDS[i][2]:""}};
  const cost=b=>up+b.ecSP+b.healSP;
  let b=null;for(let i=0;i<5;i++){const x=band(i);if(cost(x)+hs<=regen){b=x;break}}
  if(!b){const p=num(g.autoSpPct,50);b=sgItemsOn()?band(p>80?0:p>60?1:p>40?2:p>20?3:4):band(4)}
  return {...b,extra:b.ecSP+b.healSP};
}
// Vitata Card gives Heal Lv1, which you cast yourself rather than an automatic heal: each cast (no cast time, 0.3 s after-cast delay,
// or an attack's worth of time if that's longer) is time you aren't attacking. healShare is that share of your time; at 100% you can't keep up
const HEAL_DELAY=0.3;
const healSec=()=>Math.max(HEAL_DELAY,1/atkPerSec());
const healsPerSec=m=>{const g=G();if(!isSF()||!g.vitata||!(num(g.healHp)>0))return 0;const d=sgDefense(m);return d?d.hp/num(g.healHp):0};
const healShare=m=>healsPerSec(m)*healSec();
let SG_MOB=null; // monster the SP balance is worked out against
const sgDefSP=()=>{const m=SG_MOB||calcMob();const d=m?sgDefense(m):null;return d?d.extra:0};
const sgItemsPerSec=()=>sgItemsOn()?Math.max(0,sgUpkeep()+sgDefSP()+hsFullSP()-regenPerSec())/num(C().itemSp):0;
// without SP items, Hindsight only fires as often as spare regen pays for
const hsSustain=()=>{const f=hsFullSP();if(f<=0||sgItemsOn())return 1;return Math.max(0,Math.min(1,(regenPerSec()-sgUpkeep()-sgDefSP())/f))};
// the basic attack under Spell Fist still deals its own physical hit: weapon element, size, DEF, HIT and crits, plus card auto-casts
const withAtk=(a,fn)=>{const c=C(),k=c.a;c.a=a;try{return fn()}finally{c.a=k}};
const sfPhys=m=>withAtk(BASIC,()=>withEl(null,()=>useAvg(m,dmgPerHit(m),procPerUse(m))));
const sfMagic=m=>{const el=atkEl();return sfChance()*magicDmg(m,sfPct(),el)*daFactor()+hsChance()*hsSustain()*hsBoltLv()*magicDmg(m,100,el)*(1+dbChance())};
const sfPerAttack=m=>sfMagic(m)+sfPhys(m)*daFactor();
// Hindsight auto: on for the session's map only when the extra EXP costs less than your limit per 1% (after the extra loot)
function applyHsAuto(){
  const g=G();if(!isSF()||!g.hsAuto){g._note="";return}
  const mp=currentMap()||(calcMob()&&(openMaps(calcMob())[0]||[])[0]);if(!mp||!MAPMOBS[mp]){g._note="Auto needs a monster with an open map";return}
  const L=lvExp(num(C().baseLv))||lvExp(62);const w=walkSec();
  const top=MAPMOBS[mp].filter(x=>!x.m.boss&&!isSkipped(x.m)&&!x.m.expUnknown&&x.m.atkMin!=null).sort((a,b)=>b.n-a.n)[0];const mm=top?top.m:null;
  const run=v=>withHs(v,()=>{const k=SG_MOB;SG_MOB=mm;try{return {r:mapStats(mp,w),items:sgItemsPerSec()}}finally{SG_MOB=k}});
  const on=run(true),off=run(false);if(!on.r||!off.r){g._note="Auto: no result for "+mp;return}
  const costHr=(on.items-off.items)*3600*spItemPrice(),gain=(on.r.epm-off.r.epm)*60/L*100,net=costHr-(on.r.zph-off.r.zph),per=gain>0?net/gain:Infinity;
  const want=gain>0&&(net<=0||per<=num(g.hsWorth));g.hsOn=want;
  g._note=`Hindsight auto: ${want?"on":"off"} on ${mapCode(mp)} · ${gain<=0?"no EXP gain":net<=0?"extra loot pays for the SP items":`~${fmtN(per)} z per 1% EXP vs your ${fmtN(num(g.hsWorth))} z limit`} (+${gain.toFixed(2)}%/hr)`;
}
// drop rate bonus % scales every drop chance
// zeny a skill costs per kill (Mammonite): zeny per use × uses per kill, shared across monsters hit
const skillZeny=m=>{const z=num(C().a.zeny);if(!z)return 0;const u=usesPerKill(m);return isFinite(u)?z*u/targets():0};
// zeny per kill: the exported loot value (rozerodb, NPC prices) scaled by your drop rate bonus. A drop you sell to players
// counts at the market price you typed instead: the loot value already holds its NPC price, so the market price adds only what
// it beats the NPC price by. Its chance is scaled by the drop bonus and the level penalty, capped at 100%
const dropMul=()=>1+num(state.dropBonus)/100;
// NPC sell price: the one you typed, else rozerodb's (data/prices.js), else 0
const npcSell=id=>{const v=state.npcPrices[id];return v!=null&&v!==""?num(v):num(NPCSELL[id])};
// drop rate cut by level gap = monster Lv − your base Lv (official guide, roz.mygnjoy.com/en/intro/guide/11): "~ -19" no penalty,
// "-40 ~" 50% reduction. The guide gives nothing for −20 to −39 (pct null), so that band counts as no cut and is flagged as unknown
const DROP_PEN=[{min:-19,pct:0},{min:-39,pct:null},{min:-Infinity,pct:50}];
const dropGap=m=>m.lv>0&&num(C().baseLv)>0?m.lv-num(C().baseLv):null;
const dropBand=m=>{const g=dropGap(m);return g==null?DROP_PEN[0]:DROP_PEN.find(b=>g>=b.min)};
const dropPenalty=m=>dropBand(m).pct||0;
const penMul=m=>1-dropPenalty(m)/100;
// "drops −50% (Lv gap −45)" for the UI, or "" with no penalty
const penNote=m=>{const b=dropBand(m),g=String(dropGap(m)).replace("-","−");return b.pct?`drops −${b.pct}% (Lv gap ${g})`:b.pct===null?`drop penalty unknown (Lv gap ${g}), counted as none`:""};
// what an NPC actually pays you, with Overcharge (the game rounds down per item)
const npcPays=id=>Math.floor(npcSell(id)*ocMul());
const marketGain=id=>{const p=state.prices[id];return p>0?Math.max(0,p-npcPays(id)):0};
// auto-loot (in-game Looting tab): the item groups you pick up (data/itemtypes.js); a drop left on the ground earns nothing.
// The game can limit weapons and armor to ones with N+ random options; how often a drop rolls that many isn't known, so here they're all or nothing
const LOOT_GROUPS=[["w","Weapons"],["a","Armor"],["u","Consumable"],["c","Cards"],["e","Miscellaneous"],["o","Costume"]];
const looted0=g=>(state.autoLoot||{})[g]!==false;
const looted=id=>looted0(ITEMTYPE[id]||"e");
// the exported loot value holds every drop at rozerodb's NPC price; when you leave some behind, the ones you loot are added up instead
const lootVal=m=>m.loot==null?0:(m.drops||[]).every(([id])=>looted(id))?m.loot:(m.drops||[]).reduce((a,[id,ch])=>looted(id)?a+num(NPCSELL[id])*ch/100:a,0);
// the guide doesn't give an order: chance × drop bonus × level penalty, then the 100% cap
const marketVal=m=>(m.drops||[]).reduce((a,[id,ch])=>{const g=looted(id)?marketGain(id):0;return g>0?a+g*Math.min(100,ch*dropMul()*penMul(m))/100:a},0);
const hasLoot=m=>m.loot!=null||marketVal(m)>0;
const zenyKill=m=>lootVal(m)*ocMul()*dropMul()*penMul(m)+marketVal(m);
// one drop's share of zeny per kill (0 if you don't loot it); over all drops they add up to zenyKill, give or take rozerodb's rounding
const dropZ=(m,id,ch)=>looted(id)?num(NPCSELL[id])*ocMul()*ch/100*dropMul()*penMul(m)+marketGain(id)*Math.min(100,ch*dropMul()*penMul(m))/100:0;

// ---- maps ----
const REGIONS=[
 {id:"ct",name:"Clock Tower",when:"Oct 2026",pre:["c_tower","tow_d","alde_dun"]},
 {id:"gh",name:"Glast Heim",when:"Dec 2026",pre:["gl_","glast_"]},
 {id:"lu",name:"Lutie",when:"Jan 2027",pre:["xma_"]},
 {id:"go",name:"Gonryun",when:"Mar 2027",pre:["gon_"]},
 {id:"lo",name:"Louyang",when:"Apr 2027",pre:["lou_"]},
 {id:"ay",name:"Ayothaya",when:"Apr 2027",pre:["ayo_"]},
 {id:"am",name:"Amatsu",when:"May 2027",pre:["ama_"]},
 {id:"ju",name:"Juno",when:"Jun 2027",pre:["yun_"]},
 {id:"tu",name:"Turtle Island",when:"TBA",pre:["tur_"]},
 {id:"nf",name:"Niflheim",when:"not on roadmap",pre:["nif_","niflheim"]},
 {id:"um",name:"Umbala",when:"not on roadmap",pre:["um_"]}];
const regionOf=map=>REGIONS.find(r=>r.pre.some(p=>map.toLowerCase().startsWith(p)));
// map names: SPAWN and saves use rozerodb codes (sp_d05); data/maps.js has the in-game code and name (in_sphinx5 · Sphinx B5F) and other codes
const mapCode=mp=>(MAPNAMES[mp]||[])[0]||mp;
const mapName=mp=>(MAPNAMES[mp]||[])[1]||"";
const mapLabel=mp=>mapName(mp)?`${mapCode(mp)} (${mapName(mp)})`:mapCode(mp);
// any code, or a name only one map has, back to the rozerodb code
const MAPALIAS={};{const byName={};Object.entries(MAPNAMES).forEach(([k,[g,n,...rest]])=>{[k,g,...rest].forEach(a=>MAPALIAS[a.toLowerCase()]=k);const l=n.toLowerCase();byName[l]=l in byName?null:k});
  Object.entries(byName).forEach(([n,k])=>{if(k&&!(n in MAPALIAS))MAPALIAS[n]=k})}
const mapKey=s=>{const t=String(s??"").trim().toLowerCase();return MAPALIAS[t]||t};
const isClosed=map=>{const r=regionOf(map);return (r&&state.regions[r.id]!==false)||state.closed.some(c=>mapKey(c)===mapKey(map))};
const openMaps=m=>(SPAWN[m.id]||[]).filter(x=>!isClosed(x[0])).sort((a,b)=>b[1]-a[1]);
// monsters you skip (e.g. ones that stun you): left out of map averages, you walk past them
const isSkipped=m=>!!(state.skipMobs&&state.skipMobs.includes(m.id));
// rozerodb has no EXP for some monsters yet (Myst, Isis, Anubis...): shown as "?" and left out of EXP averages
const fmtExp=m=>m.expUnknown?"?":fmtN(m.exp);
const MAPMOBS={};
Object.entries(SPAWN).forEach(([id,arr])=>{const m=MOBS.find(x=>x.id===+id);if(!m)return;arr.forEach(([mp,n])=>{(MAPMOBS[mp]=MAPMOBS[mp]||[]).push({m,n})})});

// ---- tracker math ----
function cumulative(e,base){let total=0;for(let l=base;l<e.lv;l++)total+=lvExp(l)||100;return total+(e.pct/100)*(lvExp(e.lv)||100)}
// pausing: s.pauses=[{from,to}] (to missing while paused); paused time is left out of every rate, EXP gained is still counted
const openPause=s=>(s.pauses||[]).find(p=>p.to==null);
const pausedMs=(s,a,b)=>(s.pauses||[]).reduce((x,p)=>x+Math.max(0,Math.min(b,p.to??Date.now())-Math.max(a,p.from)),0);
const activeH=(s,a,b)=>(b-a-pausedMs(s,a,b))/36e5;
// logging an entry after a pause started means you're back
const autoResume=(s,t)=>{const p=openPause(s);if(p&&t>=p.from)p.to=Math.max(p.from,t)};
function stats(s){
  const es=[...s.entries].sort((a,b)=>a.t-b.t);if(es.length<2)return null;
  const base=es[0].lv,last=es[es.length-1],prev=es[es.length-2];const raw=e=>cumulative(e,base);const hrs=(a,b)=>activeH(s,a.t,b.t);
  if(hrs(es[0],last)<=0)return null;
  const avgRaw=(raw(last)-raw(es[0]))/hrs(es[0],last);const recRaw=hrs(prev,last)>0?(raw(last)-raw(prev))/hrs(prev,last):0;const L=lvExp(last.lv)||100;
  return {es,last,prev,avgRaw,recRaw,avgPct:avgRaw/L*100,recPct:recRaw/L*100,L,recentMin:Math.round(hrs(prev,last)*60),spanMin:Math.round(hrs(es[0],last)*60),
    fullH:avgRaw>0?L/avgRaw:Infinity,nextH:avgRaw>0?L*(1-last.pct/100)/avgRaw:Infinity};
}
// pace and walking only make sense for sessions of the job you have selected (fight time uses its attack)
// a session's monsters are weighted by their spawn counts on the session's map: the open map where most of them spawn (ties: more spawns)
const sessMobs=s=>s.mobIds.map(id=>MOBS.find(m=>m.id===id)).filter(Boolean);
const sessMap=s=>{const k={},tot={};sessMobs(s).forEach(m=>openMaps(m).forEach(([mp,n])=>{k[mp]=(k[mp]||0)+1;tot[mp]=(tot[mp]||0)+n}));
  let best=null;for(const mp in k)if(best==null||k[mp]>k[best]||(k[mp]===k[best]&&tot[mp]>tot[best]))best=mp;return best};
const spawnOn=(m,mp)=>((SPAWN[m.id]||[]).find(x=>x[0]===mp)||[])[1]||1;
// keep(m) drops monsters from the mix (and re-weights the rest); if it would drop all of them the full list is kept
function sessMix(s,keep){const mp=sessMap(s);let list=sessMobs(s).map(m=>({m,w:spawnOn(m,mp)}));const kn=list.filter(x=>!x.m.expUnknown);if(kn.length)list=kn;if(keep){const k=list.filter(x=>keep(x.m));if(k.length)list=k}
  const W=list.reduce((a,x)=>a+x.w,0);if(!W)return null;
  const avg=f=>list.reduce((a,x)=>a+x.w*f(x.m),0)/W;return {list,W,mp,avg}}
function sessionPace(s){
  // with this job's attack, monsters you can't hurt aren't being killed, so they're left out of the mix
  const same=(s.job||state.job)===state.job;const st=stats(s);const mix=sessMix(s,same?m=>isFinite(bestFight(m)):null);if(!st||!mix||st.avgRaw<=0||!(mix.avg(m=>m.exp)>0))return null;
  const kph=st.avgRaw/mix.avg(m=>killExp(m,s));const obs=3600/kph;const fight=same?mix.avg(bestFight):NaN;
  return {kph,obs,fight,walk:isFinite(fight)&&obs>=fight?obs-fight:null,zk:mix.avg(zenyKill),mix,st};
}
// the current session's walking time; without one, the first other session of this job that has one (the others are only worked out then)
const walkSec=()=>{if(num(state.walkOverride)>0)return num(state.walkOverride);
  const c=cur(),p=sessionPace(c);if(p&&p.walk!=null)return Math.max(1,p.walk);
  for(const s of state.sessions){if(s===c||(s.job||state.job)!==state.job)continue;const q=sessionPace(s);if(q&&q.walk!=null)return Math.max(1,q.walk)}
  return 2};
// job EXP needed for your current job level (Novice / 1st / 2nd job table)
const FIRST_JOBS=["Swordsman","Mage","Archer","Acolyte","Merchant","Thief"];
const jobTier=()=>state.job==="Novice"?"novice":FIRST_JOBS.includes(state.job)?"first":"second";
// each table has one entry per job level and the last level is the max (Novice Job Lv 10, per the official guide), so the max level needs nothing
const jobMax=(tier=jobTier())=>JOB_EXP[tier].length;
const jobNeed=()=>{const l=num(C().jobLv);const t=JOB_EXP[jobTier()];return l>=1&&l<t.length?t[l-1]:null};
function jobRate(s){
  const es=[...s.entries].filter(e=>e.jpct!=null).sort((a,b)=>a.t-b.t);if(es.length<2)return null;
  let gain=0;for(let i=1;i<es.length;i++){let d=es[i].jpct-es[i-1].jpct;if(d<0)d+=100;gain+=d}
  const h=activeH(s,es[0].t,es[es.length-1].t);return h>0?{rate:gain/h,last:es[es.length-1].jpct,h}:null;
}
// ---- weight: at 70% of Max Weight HP and SP stop regenerating, at 90% you can't attack or use skills (official guide) ----
// a trip ends at your sell point (up to 70% keeps regen, past it carries more but fights with no regen); then you go to town and back
const W_NOREGEN=0.7,W_STOP=0.9;
let REGEN_OFF=false;
const withRegenOff=fn=>{const k=REGEN_OFF;REGEN_OFF=true;try{return fn()}finally{REGEN_OFF=k}};
// weight picked up per kill: each drop's weight (data/weights.js) × its chance, with your drop bonus and the level-gap penalty
const weightKill=m=>(m.drops||[]).reduce((a,[id,ch])=>a+(ITEMW[id]||0)*Math.min(100,ch*dropMul()*penMul(m))/100,0);
// Max Weight (roz.prontera.info stat planner): 2000 + job bonus + 30 per STR point you put in (job, gear and buff STR don't count)
// + 200 per level of Enlarge Weight Limit (Merchant) and of Increase Capacity (taught by the KP shop's Gym Membership, kept forever)
const JOB_WEIGHT={Novice:0,Swordsman:800,Mage:200,Archer:600,Acolyte:400,Merchant:800,Thief:400,Knight:800,Crusader:800,Wizard:400,Sage:400,
  Hunter:700,Bard:600,Dancer:600,Priest:600,Monk:600,Blacksmith:1000,Alchemist:400,Assassin:400,Rogue:400};
const baseStr=c=>c.mode==="build"?num(buildOf(c).base.str):parseFloat(String((c.st||{}).str??"").split("+")[0]);
function maxWCalc(c=C()){const s=baseStr(c),jb=JOB_WEIGHT[state.job],lv=skLv(c,"enlarge-weight-limit")+Math.min(10,Math.max(0,num(c.gymLv)));
  return s>0&&jb!=null?{jb,total:2000+jb+30*s+200*lv}:null}
// the Max Weight in use: what you typed, else the one worked out above (0 = weight off)
const maxWt=(c=C())=>num(c.maxW)>0?num(c.maxW):(maxWCalc(c)||{total:0}).total;
const wOn=()=>maxWt()>0;
const wRoom=lim=>Math.max(0,maxWt()*lim-num(C().curW));
const townSec=()=>Math.max(0,num(C().townMin,3))*60;
// selling past 70% only pays when you can keep fighting with no regen (no SP needed, or SP items on)
// the sell point is any % up to 90 (65% stops a loop before regen stops); blank or 0 means 70%
const sellPct=()=>{const v=num(C().sellAt);return v>0?Math.min(W_STOP*100,v):70};
const sellLim=()=>sellPct()/100;
function tripParts(m,tot,w){const lim=sellLim(),rA=wRoom(Math.min(lim,W_NOREGEN));let rB=0,totB=tot;
  if(lim>W_NOREGEN){totB=withRegenOff(()=>fightSec(m))+w;if(isFinite(totB))rB=Math.max(0,wRoom(lim)-rA)}return {rA,rB,totB}}
// past 70% with no way to keep fighting (no regen, you need SP and have no SP items): the trip stops at 70%
const sellFell=(rA,rB)=>sellLim()>W_NOREGEN&&rB<=0&&wRoom(sellLim())>rA;
// seconds per kill with selling trips: kills up to 70% (or your sell point) at your normal pace, then 70% to the sell point at the no-regen pace, plus the town trip spread
// over the trip's kills. It's linear in weight per kill, so the spawn-weighted map averages still add up
function tripTot(m,tot,w){if(!wOn()||!isFinite(tot))return tot;const wk=weightKill(m);if(!(wk>0))return tot;
  const {rA,rB,totB}=tripParts(m,tot,w);if(rA+rB<=0)return Infinity;return (rA*tot+(rB?rB*totB:0))/(rA+rB)+townSec()*wk/(rA+rB)}
// one trip on this monster alone: kills, minutes farming, and whether a sell point past 70% fell back to 70%
function tripInfo(m,w){const k=SG_MOB;SG_MOB=m;try{if(!wOn())return null;const wk=weightKill(m),tot=fightSec(m)+w;if(!(wk>0)||!isFinite(tot))return {wk,kills:Infinity};
  const {rA,rB,totB}=tripParts(m,tot,w);return {wk,kills:(rA+rB)/wk,min:(rA*tot+(rB?rB*totB:0))/wk/60,fell:sellFell(rA,rB)}}finally{SG_MOB=k}}
function mobRow0(m,w){const kSG=SG_MOB;SG_MOB=m;try{return mobRow00(m,w)}finally{SG_MOB=kSG}}
function mobRow00(m,w){
  const sec=fightSec(m),tot=tripTot(m,sec+w,w),epk=killExp(m),jpk=killJobExp(m);
  return {sec,tot,epm:isFinite(tot)&&tot>0?epk/tot*60:0,epk,jpm:isFinite(tot)&&tot>0?jpk/tot*60:0,jpk,hitc:hitChance(m),mult:hitPctOf(m),uses:usesPerKill(m),dodge:dodge(m),hpm:hpLossPerMin(m),zk:zenyKill(m)-skillZeny(m)};
}
// map averages, weighted by spawn counts; monsters you can't hurt are skipped (you walk past them)
function mapStats0(mp,w){
  const list=(MAPMOBS[mp]||[]).filter(x=>!x.m.boss&&!isSkipped(x.m));let N=0,n=0,exp=0,time=0,fight=0,z=0,hp=0,hpN=0;const skip=[],unk=[];
  list.forEach(({m,n:c})=>{N+=c;if(m.expUnknown){unk.push(m.name);return}const r=mobRow0(m,w);if(!isFinite(r.sec)){skip.push(m.name);return}
    n+=c;exp+=c*r.epk;time+=c*r.tot;fight+=c*r.sec;z+=c*r.zk;if(r.hpm!=null){hp+=c*r.hpm*r.tot;hpN+=c*r.tot}});
  if(!n)return null;
  return {mp,N,epm:exp/time*60,secT:time/n,sec:fight/n,walk:w,sell:time/n-fight/n-w,epk:exp/n,zph:z/time*3600,hpm:hpN?hp/hpN:null,skip:skip.length,skipNames:skip,unk:unk.length,unkNames:unk};
}
// best converter per monster (by EXP/min) and one converter per map
function mobRow(m,w){let best=null;elOptions().forEach(el=>{const r=withEl(el,()=>mobRow0(m,w));r.el2=el;if(!best||r.epm>best.epm)best=r});return best}
function mapStats(mp,w){let best=null;elOptions().forEach(el=>{const r=withEl(el,()=>mapStats0(mp,w));if(r){r.el2=el;if(!best||r.epm>best.epm)best=r}});return best}
const bestFight=m=>{const r=mobRow(m,0);return withEl(r.el2,()=>fightSec(m))};
const currentMap=()=>sessMap(cur());
// EXP/min for just the session's monsters (spawn-weighted, fight + walk), best converter like mapStats; the baseline for "Projected"
function sessEpm(s,w){const mix=sessMix(s);if(!mix)return null;let best=null;
  elOptions().forEach(el=>{const v=withEl(el,()=>{let e=0,t=0;mix.list.forEach(({m,w:c})=>{const r=mobRow0(m,w);if(!isFinite(r.sec))return;e+=c*r.epk;t+=c*r.tot});return t>0?e/t*60:0});if(best==null||v>best)best=v});
  return best||null}
// ---- sell timer: how long the session's monsters take to fill you from the weight you have now to your sell point ----
// spawn-weighted like the session pace: weight and seconds per kill are averaged over the mix, so minutes = room / weight per kill ×
// seconds per kill (past 70% at the no-regen pace; if one monster can't keep fighting there, the trip stops at 70%)
function sessTrip(s,w=walkSec()){if(!wOn())return null;const mix=sessMix(s,m=>isFinite(bestFight(m)));if(!mix)return null;
  let wk=0,tA=0,tB=0,rA=0,rB=Infinity;
  mix.list.forEach(({m,w:c})=>{const el=mobRow(m,w).el2,k=SG_MOB;SG_MOB=m;try{withEl(el,()=>{const tot=fightSec(m)+w,p=tripParts(m,tot,w);
    rA=p.rA;rB=Math.min(rB,p.rB);wk+=c*weightKill(m);tA+=c*tot;tB+=c*p.totB})}finally{SG_MOB=k}});
  wk/=mix.W;tA/=mix.W;tB/=mix.W;if(!isFinite(tA))return null;
  const fell=sellFell(rA,rB),at=fell?70:sellPct();
  if(!(wk>0))return {wk,kills:Infinity,min:Infinity,at,fell};
  return {wk,kills:(rA+rB)/wk,min:(rA*tA+(rB?rB*tB:0))/wk/60,at,fell}}
// a running timer is s.trip={from,due} (ms); time the session spends paused is added on, since you aren't picking anything up then
const tripDue=s=>s.trip?s.trip.due+pausedMs(s,s.trip.from,Date.now()):null;
const tripEarly=()=>Math.max(0,num(state.tripEarly))*6e4;


// ---- Zeny Hunter: maps and monsters ranked by net zeny per hour ----
// loot per hour (with your drop bonus, less skill costs such as Mammonite) minus SP items and the consumables that are switched on.
// Unlike the EXP rankings, monsters with no EXP in rozerodb still count here: they drop loot all the same
const huntCostHr=m=>{const k=SG_MOB;SG_MOB=m||null;try{return itemsPerSec()*3600*spItemPrice()+potCostHr()}finally{SG_MOB=k}};
// the monsters you hunt on a map (in-game Monster tab): state.huntOff[map] lists the ones you pass by, set by hand in the Zeny Hunter.
// "Best-paying only" (state.huntAuto) picks for the maps you haven't set: monsters ranked by zeny per second (fight + walk), keeping as many
// as give the most net zeny/hr while still hunting at least minN spawns (the Zeny Hunter's "Min monsters on map"): a rare spawn is
// rarely waiting for you, and nothing here knows respawn times. Passing monsters by thins out your targets: the next one is about
// 1/√density away, so walking per kill grows by √(monsters you can hurt / ones you hunt)
// Or teleport past them (Fly Wing or the Teleport skill), on maps you haven't marked "no teleport" (rozerodb has no map flags):
// each landing finds a hunted monster about hunted/all of the time, so a kill takes all/hunted − 1 extra jumps, each costing a
// Fly Wing (state.flyPrice, less Discount; 0 for the Teleport skill) and state.teleSec seconds. Each pick uses whichever of the two nets more.
// Kill time includes selling trips (tripTot), like every other ranking
const huntOffOf=mp=>(state.huntOff||{})[mp];
const killTot=(m,sec,walk)=>{const k=SG_MOB;SG_MOB=m;try{return tripTot(m,sec+walk,walk)}finally{SG_MOB=k}};
const noTele=mp=>(state.noTele||[]).includes(mp);
const flyPrice=()=>state.flyPrice==null?250:num(state.flyPrice);
const flyCost=()=>flyPrice()*discMul();
const teleSec=()=>state.teleSec==null?1:num(state.teleSec);
function huntMap0(mp,w,minN=0){
  const list=(MAPMOBS[mp]||[]).filter(x=>!x.m.boss&&!isSkipped(x.m));const N=list.reduce((a,x)=>a+x.n,0);
  const rows=list.map(({m,n})=>({m,n,r:mobRow0(m,0)})),ok=rows.filter(x=>isFinite(x.r.sec)),skip=rows.filter(x=>!isFinite(x.r.sec)).map(x=>x.m.name);
  const all=ok.reduce((a,x)=>a+x.n,0);if(!all)return null;
  const at0=(h,n,walk,tele)=>{let time=0,z=0,exp=0,expT=0,hp=0,hpN=0;
    h.forEach(({m,n:c,r})=>{const tot=killTot(m,r.sec,walk);time+=c*tot;z+=c*r.zk;if(!m.expUnknown){exp+=c*r.epk;expT+=c*tot}if(r.hpm!=null){hp+=c*r.hpm*tot;hpN+=c*tot}});
    const top=h.reduce((a,x)=>!a||x.n>a.n?x:a,null),kph=n/time*3600,loot=z/time*3600,cost=huntCostHr(top.m)+tele*kph*flyCost();
    return {mp,N,n,walk,tele,kph,secT:time/n,loot,cost,net:loot-cost,zk:z/n,epm:expT?exp/expT*60:null,hpm:hpN?hp/hpN:null,skip:skip.length,skipNames:skip,
      earn:h.map(({m,n,r})=>({m,n,zk:r.zk})).sort((a,b)=>b.n*b.zk-a.n*a.zk)}};
  const at=h=>{const n=h.reduce((a,x)=>a+x.n,0);if(!n)return null;const walked=at0(h,n,w*Math.sqrt(all/n),0);
    if(n>=all||noTele(mp))return walked;const jumps=all/n-1,tp=at0(h,n,w+jumps*teleSec(),jumps);return tp.net>walked.net?tp:walked};
  const off=huntOffOf(mp);let best;
  if(off){best=at(ok.filter(x=>!off.includes(x.m.id)));if(best)best.manual=true}
  else if(state.huntAuto){const rank=ok.slice().sort((a,b)=>b.r.zk/(b.r.sec+w)-a.r.zk/(a.r.sec+w));
    for(let k=1;k<=rank.length;k++){const r=at(rank.slice(0,k));if(r&&(r.n>=Math.min(minN,all)||k===rank.length)&&(!best||r.net>best.net))best=r}}
  else best=at(ok);
  if(!best)return null;
  // every monster you can hurt here, hunted or not, for the picker
  const on=new Set(best.earn.map(x=>x.m.id));best.mobs=ok.map(({m,n,r})=>({m,n,zk:r.zk,on:on.has(m.id)})).sort((a,b)=>b.on-a.on||b.n*b.zk-a.n*a.zk);
  return best;
}
// one monster farmed on its own: its zeny per kill over fight + walk time
function huntMob0(m,w){const r=mobRow0(m,w);if(!isFinite(r.sec)||!(r.tot>0))return null;const loot=r.zk/r.tot*3600,cost=huntCostHr(m);
  return {m,kph:3600/r.tot,secT:r.tot,loot,cost,net:loot-cost,zk:r.zk,epm:m.expUnknown?null:r.epm,hpm:r.hpm}}
// best converter (or Spell Fist bolt) by net zeny rather than EXP
const bestBy=(fn,k)=>{let best=null;elOptions().forEach(el=>{const r=withEl(el,fn);if(r){r.el2=el;if(!best||r[k]>best[k])best=r}});return best};
const huntMap=(mp,w,minN)=>bestBy(()=>huntMap0(mp,w,minN),"net");
const huntMob=(m,w)=>bestBy(()=>huntMob0(m,w),"net");

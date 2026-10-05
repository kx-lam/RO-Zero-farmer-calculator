// ---- build simulator: in "build" mode the stat fields are computed from base stats + gear (build.js) and shown read-only ----
// "Check against the game": [key, label, computed total]
// compared with what the build computes (BUILD_LAST), not with c, since typed Max HP / SP replace the computed ones
const CHECKS=[["atk","ATK",F=>sumStat(F.atkTxt)],["matk","MATK",F=>sumStat(F.matkTxt)],["hit","HIT",F=>sumStat(F.hitTxt)],["flee","FLEE",F=>sumStat(F.fleeTxt)],
  ["aspd","ASPD",F=>F.aspd],["def","DEF",F=>sumStat(F.defTxt)],["hp","Max HP",F=>F.maxHp],["sp","Max SP",F=>F.maxSp]];
const BUILT_IDS=["atkTxt","matkTxt","hitTxt","fleeTxt","aspd","defTxt","maxHp","maxSp","intTxt","wAtk","crit","critDmg","rangePct","skillPct","vctPct","fctPct","acdPct","ignDef","ignMdef","st_str","st_agi","st_vit","st_dex","st_luk","weapon","wElem"];
let BUILD_LAST=null;
const buildOf=c=>{if(!c.build)c.build={base:{str:1,agi:1,vit:1,int:1,dex:1,luk:1},gear:{}};return c.build};
function applyBuild(){const c=C();if(c.mode!=="build"){BUILD_LAST=null;c.bx=eqToBx(c);return}
  const r=BUILD.compute({...buildOf(c),baseLv:c.baseLv,jobLv:c.jobLv,extra:[...consLines().lines,...(SKFX?[...SKFX.stat,...SKFX.buffStat]:[]),...aspdBuffLines(c)]},state.job,aspdBase);BUILD_LAST=r;const F=r.fields,A=r.acc;
  // skill-specific gear lines count when the attack's name contains the skill
  const nm=String(c.a.name||"").toLowerCase(),match=o=>Object.entries(o).reduce((t,[k,v])=>t+(nm.includes(k.toLowerCase())?v:0),0);
  Object.assign(c,{atkTxt:F.atkTxt,matkTxt:F.matkTxt,hitTxt:F.hitTxt,fleeTxt:F.fleeTxt,defTxt:F.defTxt,intTxt:F.intTxt,wAtk:F.wAtk,crit:F.crit,critDmg:F.critDmg,
    rangePct:F.rangePct,skillPct:A.skill+match(A.skillOf),vctPct:F.vctPct+match(A.vctOf),fctPct:F.fctPct+match(A.fctOf),acdPct:F.acdPct,ignDef:F.ignDef,ignMdef:F.ignMdef,
    weapon:F.weapon,wElem:F.wElem,st:{...(c.st||{}),...F.st},bx:{phys:A.phys,magic:A.magic,myEle:A.myEle,taken:A.taken,exp:A.exp,critRace:A.critRace,spCost:A.spCost}});
  if(F.aspd!=null)c.aspd=F.aspd;if(F.maxHp!=null)c.maxHp=F.maxHp;if(F.maxSp!=null)c.maxSp=F.maxSp;
  // the exported base HP/SP tables don't match Zero yet, so in-game Max HP / SP typed under "Check against the game" win
  const ck=buildOf(c).check||{};if(num(ck.hp)>0)c.maxHp=num(ck.hp);if(num(ck.sp)>0)c.maxSp=num(ck.sp)}
// ---- consumables & buffs: rows {on, name, eff, price, min}; effects are typed like random options ("STR +10, ATK +20, ASPD +10%") ----
const consOf=c=>{if(!Array.isArray(c.cons))c.cons=[];return c.cons};
const consLines=()=>{const lines=[],bad=[];consOf(C()).filter(r=>r.on).forEach(r=>{const o=BUILD.parseOptions(r.eff);lines.push(...o.lines);bad.push(...o.bad.map(x=>`${r.name||"Consumable"}: ${x}`))});return {lines,bad}};
// ---- ASPD potions and buffs from others, from the RO樂園攻速計算機 sheet (2026-09-07, "增益"). "aspd_mod" is the sheet's potion/skill
// value: it adds value × AGI/200 to ASPD1 (see build.js) ----
const ASPD_POT={conc:{name:"Concentration Potion",mod:4},awak:{name:"Awakening Potion",mod:6,no:["Novice","Acolyte","Priest","Bard","Dancer"]},
  bers:{name:"Berserk Potion",mod:9,only:["Mage","Merchant","Swordsman","Wizard","Blacksmith","Alchemist","Knight","Crusader","Rogue"]}};
const potOk=(k,job=state.job)=>{const p=ASPD_POT[k];return !!p&&!(p.no||[]).includes(job)&&(!p.only||p.only.includes(job))};
// the potion in use: the one picked, else the strongest this job can drink (older saves had a flat "+ASPD" box instead)
const potKey=c=>potOk(c.potType)?c.potType:["bers","awak","conc"].find(k=>potOk(k));
const AXE_MACE=["One-handed axe","Two-handed axe","One-handed mace","Two-handed mace"];
// lv: [min, max, default, label]; fx(level) -> bonus lines; eff: what it does, when the lines don't say it plainly
const PBUFF=[
  {k:"blessing",name:"Blessing",lv:[1,10,10],fx:l=>[["str",l],["int",l],["dex",l],["hit",2*l]]},
  {k:"clementia",name:"Clementia (Priest)",lv:[1,70,50,"Priest Job Lv"],fx:j=>{const v=10+Math.floor(j/10);return [["str",v],["int",v],["dex",v]]},
    eff:"Blessing Lv 10 + Priest Job Lv/10 to STR, INT, DEX"},
  {k:"incAgi",name:"Increase AGI",lv:[1,10,10],fx:l=>[["agi",2+l],["aspd_percent",l]]},
  {k:"canto",name:"Canto Candidus (Priest)",fx:()=>[["agi",19],["aspd_percent",17]]},
  {k:"riff",name:"Impressive Riff (Bard)",lv:[1,10,10],fx:l=>[["aspd_percent",l===10?20:1+2*(l-1)]]},
  {k:"adren",name:"Adrenaline Rush (from a Blacksmith)",w:AXE_MACE,fx:()=>[["aspd_mod",6],["aspd_percent",10]],eff:"potion/skill value 6, ASPD +10%; axes and maces"},
  {k:"agiFood",name:"AGI food",lv:[1,10,10],fx:l=>[["agi",l]]},
  {k:"dexFood",name:"DEX food",lv:[1,10,10],fx:l=>[["dex",l]]},
  {k:"bandage",name:"Yggdrasil's Blessing (Battle Bandage)",fx:()=>[["agi",7],["dex",7]]}];
const pbuffOf=c=>{if(!c.pbuffs||typeof c.pbuffs!=="object")c.pbuffs={};return c.pbuffs};
const pbLv=(b,o)=>b.lv?Math.min(b.lv[1],Math.max(b.lv[0],num(o.lv,b.lv[2]))):0;
const pbEff=b=>b.eff||b.fx(b.lv?b.lv[2]:0).map(([t,v])=>t==="aspd_percent"?`ASPD +${v}%`:t==="aspd_mod"?`potion/skill value ${v}`:`${t.toUpperCase()} +${v}`).join(", ");
// a buff counts when ticked and it fits your weapon. It doesn't stack with the same buff switched on in your Skills card, and
// Clementia replaces Blessing, Canto Candidus replaces Increase AGI
const PB_SELF={blessing:"blessing",incAgi:"increase-agility",adren:"adrenaline-rush"},PB_OVER={blessing:"clementia",incAgi:"canto"};
const pbTicked=(k,c)=>!!(pbuffOf(c)[k]||{}).on;
const pbOn=(b,c)=>{if(!pbTicked(b.k,c)||(b.w&&!b.w.includes(c.weapon)))return false;const own=PB_SELF[b.k];
  if(own&&(c.buffs||{})[own]&&skLv(c,own))return false;return !(PB_OVER[b.k]&&pbTicked(PB_OVER[b.k],c))};
function aspdBuffLines(c=C()){const out=[];if(c.potOn){const k=potKey(c);if(k)out.push(["aspd_mod",null,null,ASPD_POT[k].mod])}
  PBUFF.forEach(b=>{if(pbOn(b,c))b.fx(pbLv(b,pbuffOf(c)[b.k])).forEach(([t,v])=>out.push([t,null,null,v]))});return out}
// status-window mode: the typed numbers are read with consumables off, so their effect is added here into EFF (see cf)
function applyConsumables(){EFF=null;const c=C();if(c.mode==="build")return;const lines=[...consLines().lines,...(SKFX?SKFX.buffStat:[]),...aspdBuffLines(c)];if(!lines.length)return;
  const A={};lines.forEach(([t,,,v])=>A[t]=(A[t]||0)+v);const g=k=>A[k]||0,f=Math.floor;
  // stat buffs move status ATK / MATK / HIT / FLEE / DEF / CRIT / ASPD through the same formulas (only for stats you typed)
  const tmp={...c,st:{...(c.st||{})},intTxt:c.intTxt};STATS.forEach(k=>{if(g(k)&&statVal(c,k)!=null)tmp.st[k]=`${c.st[k]}+${g(k)}`});if(g("int"))tmp.intTxt=`${c.intTxt||0}+${g("int")}`;
  const b0=derived(c),b1=derived(tmp),d=k=>(b1[k]||0)-(b0[k]||0);
  const parts=t=>{const p=String(t||"0").split("+").map(x=>parseFloat(x)||0);return [p[0]||0,p.slice(1).reduce((a,x)=>a+x,0)]};
  const [as,ag]=parts(c.atkTxt),[ms,mg]=parts(c.matkTxt),[ds,dh]=parts(c.defTxt);
  const atkSt=as+d("atk"),atkGear=f((ag+g("atk"))*(1+g("atk_percent")/100));
  const matkSt=ms+d("matk"),matkTot=f((matkSt+mg+g("matk"))*(1+g("matk_percent")/100));
  // ASPD as in build.js: stat term and potion/skill value × AGI/200 go into ASPD1, then ASPD % and flat ASPD, rounded down
  let aspd=num(c.aspd,170)+d("aspdTerm")+g("aspd_mod")*(statVal(tmp,"agi")||0)/200;aspd=Math.min(190,Math.floor(aspd+(195-aspd)*g("aspd_percent")/100+g("aspd")));
  const vit0=statVal(c,"vit"),vit1=statVal(tmp,"vit"),int0=statVal(c,"int"),int1=statVal(tmp,"int");
  const hp=num(c.maxHp)>0?f((num(c.maxHp)*(vit0!=null?(100+vit1)/(100+vit0):1)+g("hp"))*(1+g("hp_percent")/100)):c.maxHp;
  const sp=num(c.maxSp)>0?f((num(c.maxSp)*(100+int1)/(100+int0)+g("sp"))*(1+g("sp_percent")/100)):c.maxSp;
  EFF={atkTxt:`${atkSt}+${atkGear}`,matkTxt:`${matkSt}+${matkTot-matkSt}`,hitTxt:String(sumStat(c.hitTxt)+d("hit")+g("hit")),fleeTxt:String(sumStat(c.fleeTxt)+d("flee")+g("flee")),
    defTxt:`${ds+d("def")}+${dh+g("def")}`,crit:num(c.crit)+d("crit")+g("crit"),aspd,maxHp:hp,maxSp:sp,st:tmp.st,intTxt:tmp.intTxt}}
function renderCons(){const c=C();$("consList").innerHTML=consOf(c).map((r,i)=>`<div class="eqrow" data-i="${i}">
    <input type="checkbox" data-f="on" ${r.on?"checked":""} aria-label="Use it" style="width:auto">
    <input data-f="name" value="${esc(r.name||"")}" placeholder="name" style="width:150px">
    <input data-f="eff" value="${esc(r.eff||"")}" placeholder="e.g. STR +10, ATK +20, ASPD +10%" style="flex:1;min-width:200px">
    <input data-f="price" type="number" value="${esc(r.price??"")}" placeholder="price" style="width:90px"> z, lasts
    <input data-f="min" type="number" value="${esc(r.min??"")}" placeholder="min" style="width:64px"> min
    <button type="button" class="small danger" data-del aria-label="Remove">✕</button></div>`).join("")||'<div class="note">None yet.</div>';consNote()}
// redrawn on every render (job and weapon change what's allowed), except while you're typing in it
function renderAspdBuffs(){const c=C(),k=potKey(c),act=document.activeElement;
  if(act!==$("potType"))$("potType").innerHTML=Object.entries(ASPD_POT).filter(([key])=>potOk(key)).map(([key,p])=>`<option value="${key}"${key===k?" selected":""}>${p.name} (${p.mod})</option>`).join("");
  if(!$("pbuffList").contains(act))$("pbuffList").innerHTML=PBUFF.map(b=>{const o=pbuffOf(c)[b.k]||{},off=b.w&&!b.w.includes(c.weapon),own=PB_SELF[b.k]&&(c.buffs||{})[PB_SELF[b.k]]&&skLv(c,PB_SELF[b.k]);
    return `<div class="eqrow" data-pb="${b.k}"><label class="bar" style="flex-direction:row;gap:6px;min-width:250px"><input type="checkbox" data-f="on" ${o.on?"checked":""} style="width:auto">${esc(b.name)}</label>
    ${b.lv?`<label class="bar" style="flex-direction:row;gap:4px">${b.lv[3]||"Lv"} <input data-f="lv" type="number" min="${b.lv[0]}" max="${b.lv[1]}" value="${pbLv(b,o)}" style="width:60px"></label>`:""}
    <span class="note">${esc(pbEff(b))}${off?' · <span class="warnc">not with this weapon</span>':own?" · on in your Skills card, counted there":""}</span></div>`}).join("")}
$("pbuffList").addEventListener("input",e=>{const f=e.target.dataset.f,row=e.target.closest("[data-pb]");if(!f||!row)return;const o=pbuffOf(C())[row.dataset.pb]||(pbuffOf(C())[row.dataset.pb]={});
  o[f]=f==="on"?e.target.checked:num(e.target.value);save();renderAll()});
$("potType").addEventListener("change",e=>{C().potType=e.target.value;save();renderAll()});
const consNote=()=>{const {bad}=consLines(),cost=potCostHr()-potOnlyHr();$("consNote").innerHTML=(cost>0?`~${fmtN(cost)} z/hr while farming. `:"")+(bad.length?`<span class="bad">Not understood: ${bad.map(esc).join(", ")}</span>`:"")};
$("consAdd").addEventListener("click",()=>{consOf(C()).push({on:true,name:"",eff:"",price:"",min:""});save();renderCons();renderAll()});
$("consList").addEventListener("click",e=>{if(!e.target.closest("[data-del]"))return;consOf(C()).splice(+e.target.closest(".eqrow").dataset.i,1);save();renderCons();renderAll()});
$("consList").addEventListener("input",e=>{const f=e.target.dataset.f;if(!f)return;const r=consOf(C())[+e.target.closest(".eqrow").dataset.i];
  r[f]=f==="on"?e.target.checked:f==="price"||f==="min"?(e.target.value===""?"":num(e.target.value)):e.target.value;save();renderAll();consNote()});
// ---- equipment stats (status-window mode): the % lines from the game's Equipment Stats window, as rows {by, t, ch, v} ----
const EQ_KINDS=[["race","Damage to race",true],["size","Damage to size",true],["ele","Damage to element",true],["kind","Damage to boss / normal",true],
  ["myEle","Magic damage of an element (your spells)"],["takenRace","Damage taken from race"],["takenEle","Damage taken from element"],["takenKind","Damage taken from boss / normal"],
  ["exp","EXP gained from monsters"],["expRace","EXP gained from race"],["spCost","Skill SP consumption"]];
const EQ_TARGETS={race:()=>RACES,size:()=>[["S","Small"],["M","Medium"],["L","Large"]],ele:()=>AE,kind:()=>[["boss","Boss"],["normal","Normal"]],
  myEle:()=>AE,takenRace:()=>RACES,takenEle:()=>AE,takenKind:()=>[["boss","Boss"],["normal","Normal"]],expRace:()=>RACES};
// older saves had one race / size / element box each; turn them into rows once
const eqOf=c=>{if(!Array.isArray(c.eq))c.eq=[];
  [["raceSel","racePct","raceType","race"],["sizeSel","sizePct","sizeType","size"],["elSel","elPct","elType","ele"]].forEach(([s,p,t,by])=>{
    if(c[s]&&num(c[p]))c.eq.push({by,t:c[s],ch:c[t]||"both",v:num(c[p])});delete c[s];delete c[p];delete c[t]});return c.eq};
function eqToBx(c){const o={phys:{all:0,race:{},size:{},ele:{},kind:{}},magic:{all:0,race:{},size:{},ele:{},kind:{}},myEle:{},taken:{race:{},ele:{},kind:{}},exp:{all:0,race:{}},spCost:0};
  const add=(m,k,v)=>{m[k]=(m[k]||0)+v};
  eqOf(c).forEach(r=>{const v=num(r.v);if(!v)return;
    if(["race","size","ele","kind"].includes(r.by)){if(r.ch!=="magic")add(o.phys[r.by],r.t,v);if(r.ch!=="phys")add(o.magic[r.by],r.t,v)}
    else if(r.by==="myEle")add(o.myEle,r.t,v);else if(r.by.startsWith("taken"))add(o.taken[{takenRace:"race",takenEle:"ele",takenKind:"kind"}[r.by]],r.t,v);
    else if(r.by==="exp")o.exp.all+=v;else if(r.by==="expRace")add(o.exp.race,r.t,v);else if(r.by==="spCost")o.spCost+=v});return o}
function renderEq(){const c=C();$("eqPanel").hidden=c.mode==="build";
  $("eqList").innerHTML=eqOf(c).map((r,i)=>{const k=EQ_KINDS.find(x=>x[0]===r.by)||EQ_KINDS[0],T=EQ_TARGETS[r.by];
    const opt=(v,l)=>`<option value="${esc(v)}" ${String(v)===String(r.t)?"selected":""}>${esc(l)}</option>`;
    return `<div class="eqrow" data-i="${i}"><select data-f="by">${EQ_KINDS.map(([v,l])=>`<option value="${v}" ${v===r.by?"selected":""}>${l}</option>`).join("")}</select>
      ${T?`<select data-f="t">${T().map(x=>Array.isArray(x)?opt(x[0],x[1]):opt(x,x)).join("")}</select>`:""}
      ${k[2]?`<select data-f="ch">${[["both","Phys + Magic"],["phys","Physical"],["magic","Magic"]].map(([v,l])=>`<option value="${v}" ${v===(r.ch||"both")?"selected":""}>${l}</option>`).join("")}</select>`:""}
      <input data-f="v" type="number" step="1" value="${esc(r.v??"")}" placeholder="%" aria-label="Percent"> %
      <button type="button" class="small danger" data-del aria-label="Remove line">✕</button></div>`}).join("")||'<div class="note">No lines yet.</div>'}
$("eqAdd").addEventListener("click",()=>{eqOf(C()).push({by:"race",t:RACES[0],ch:"both",v:""});save();renderEq();renderAll()});
$("eqList").addEventListener("click",e=>{if(e.target.closest("[data-del]")==null)return;const i=+e.target.closest(".eqrow").dataset.i;eqOf(C()).splice(i,1);save();renderEq();renderAll()});
$("eqList").addEventListener("change",e=>{const f=e.target.dataset.f;if(!f||f==="v")return;const r=eqOf(C())[+e.target.closest(".eqrow").dataset.i];r[f]=e.target.value;
  if(f==="by"){const T=EQ_TARGETS[r.by];const first=T&&T()[0];r.t=first==null?"":Array.isArray(first)?first[0]:first}save();renderEq();renderAll()});
$("eqList").addEventListener("input",e=>{if(e.target.dataset.f!=="v")return;eqOf(C())[+e.target.closest(".eqrow").dataset.i].v=e.target.value===""?"":num(e.target.value);save();renderAll()});
// item picker labels: the name, plus the id when two items share a name
const jobSlug=()=>state.job.toLowerCase();
// gear lists the job family ("swordsman" covers Knight and Crusader), so a 2nd job also matches its 1st job
const FIRST_OF=BUILD.FIRST_OF;
const canWear=it=>!it.jobs||!it.jobs.length||it.jobs.includes(jobSlug())||(FIRST_OF[state.job]&&it.jobs.includes(FIRST_OF[state.job].toLowerCase()));
const labelOf=(it,list)=>list.filter(x=>x.name===it.name).length>1?`${it.name} #${it.id}`:it.name;
const pickList=(list)=>{const m=new Map();list.forEach(it=>m.set(labelOf(it,list),it.id));return m};
let GEAR_LISTS={};
function gearChoices(slot){const s=BUILD.SLOTS.find(x=>x.k===slot);return (typeof EQUIP!=="undefined"?EQUIP:[]).filter(it=>(it.slot||[]).some(x=>s.takes.includes(x))&&canWear(it))}
function cardChoices(slot){const cs=BUILD.CARD_FOR[slot];return (typeof CARDS!=="undefined"?CARDS:[]).filter(c=>(c.slot||[]).some(x=>x===cs||x.startsWith(cs)))}
function renderGearTable(){const c=C(),b=buildOf(c);GEAR_LISTS={};let lists="";
  const rows=BUILD.SLOTS.map(s=>{const items=gearChoices(s.k),cards=cardChoices(s.k);GEAR_LISTS["g_"+s.k]=pickList(items);GEAR_LISTS["c_"+s.k]=pickList(cards);
    lists+=`<datalist id="gl_${s.k}">${[...GEAR_LISTS["g_"+s.k].keys()].map(n=>`<option value="${esc(n)}">`).join("")}</datalist><datalist id="cl_${s.k}">${[...GEAR_LISTS["c_"+s.k].keys()].map(n=>`<option value="${esc(n)}">`).join("")}</datalist>`;
    const g=b.gear[s.k]||{},it=g.id&&BUILD.item(g.id),label=n=>{const x=BUILD.item(n);return x?labelOf(x,cards):""};
    const cardBoxes=it&&it.slots?Array.from({length:it.slots},(_,i)=>`<input data-card="${i}" list="cl_${s.k}" placeholder="card" value="${esc(g.cards&&g.cards[i]?label(g.cards[i]):"")}">`).join(""):"";
    const refinable=it&&it.refine;
    return `<tr data-slot="${s.k}"><td>${s.label}</td><td><input class="item" list="gl_${s.k}" placeholder="${items.length?"none":"no items for this job"}" value="${esc(it?labelOf(it,items):"")}"></td>
      <td>${refinable?`<input class="ref" type="number" min="0" max="20" value="${num(g.refine)}">`:""}</td><td><div class="cards">${cardBoxes}</div></td>
      <td>${it?`<input class="opts" placeholder="e.g. ATK +25, FLEE +20" value="${esc(g.opts||"")}">`:""}</td></tr>`}).join("");
  $("gearTable").tBodies[0].innerHTML=rows;$("gearLists").innerHTML=lists}
function renderBuild(){const c=C(),on=c.mode==="build";
  if(on&&renderBuild.job!==state.job){renderBuild.job=state.job;renderGearTable()}if(!on)renderBuild.job=null;
  ROOTQ("[data-cmode]").forEach(x=>x.setAttribute("aria-checked",String(x.dataset.cmode===(on?"build":"status"))));
  $("buildPanel").hidden=!on;$("statNote").hidden=on;BUILT_IDS.forEach(id=>{const el=$(id);el.disabled=on;if(on&&document.activeElement!==el)el.value=id.startsWith("st_")?(c.st||{})[id.slice(3)]??"":c[id]??""});
  $("modeNote").textContent=on?"Stats below are worked out from your base stats, job level and gear.":"Type the numbers from your in-game status window.";
  if(!on)return;const b=buildOf(c);ROOTQ("[data-bs]").forEach(x=>{if(document.activeElement!==x)x.value=b.base[x.dataset.bs]??""});
  const r=BUILD_LAST;if(!r)return;const jb=r.jobBonus;
  $("jobBonusNote").textContent=`Job Lv ${r.fields.jobLv} bonus: `+BUILD.STAT6.map(k=>`${k.toUpperCase()} +${jb[k]}`).join(" · ")+(BUILD.curve(state.job,"hp",num(c.baseLv))==null?" · no HP/SP table for this job, type Max HP/SP after switching back":"");
  // check against the game: type the in-game totals, see the difference per stat
  const ck=b.check||{},rows=CHECKS.map(([k,label,get])=>{const mine=get(r.fields),g=ck[k];const d=g!=null&&g!==""&&mine!=null?num(g)-mine:null;
    return `<label>${label}<span class="bar"><input data-ck="${k}" type="number" value="${esc(g??"")}" placeholder="${mine??"–"}" style="flex:1;min-width:0">${d==null?"":`<span class="${Math.abs(d)<0.5?"good":"bad"}">${d===0?"✓":(d>0?"+":"")+fmtP(+d.toFixed(1))}</span>`}</span></label>`}).join("");
  if(!$("checkGrid").contains(document.activeElement))$("checkGrid").innerHTML=rows;
  $("buildNote").innerHTML=r.unmodelled.length?`<b>Not counted</b> (procs, conditional or unsupported lines):<br>${r.unmodelled.map(esc).join("<br>")}`:""}
// switching to build keeps a copy of the typed status-window values, and switching back restores them
const SNAP_KEYS=["atkTxt","matkTxt","hitTxt","fleeTxt","aspd","defTxt","maxHp","maxSp","intTxt","wAtk","crit","critDmg","rangePct","skillPct","vctPct","fctPct","acdPct","ignDef","ignMdef","weapon","wElem","st"];
ROOTQ("[data-cmode]").forEach(x=>x.addEventListener("click",()=>{const c=C(),to=x.dataset.cmode,from=c.mode==="build"?"build":"status";if(to===from)return;
  if(to==="build")c.statusSnap=JSON.parse(JSON.stringify(Object.fromEntries(SNAP_KEYS.map(k=>[k,c[k]??null]))));
  else if(c.statusSnap){SNAP_KEYS.forEach(k=>{const v=c.statusSnap[k];if(v==null)delete c[k];else c[k]=v});delete c.statusSnap}
  c.mode=to;save();if(to==="build")renderGearTable();renderAll();syncChar()}));
ROOTQ("[data-bs]").forEach(x=>x.addEventListener("input",()=>{buildOf(C()).base[x.dataset.bs]=num(x.value)||1;save();renderAll()}));
$("gearTable").addEventListener("change",e=>{const tr=e.target.closest("tr[data-slot]");if(!tr)return;const k=tr.dataset.slot,b=buildOf(C()),g=b.gear[k]||(b.gear[k]={});
  if(e.target.classList.contains("item")){const v=e.target.value.trim();const id=GEAR_LISTS["g_"+k].get(v);
    if(!v){delete b.gear[k]}else if(id!=null){if(g.id!==id){g.id=id;g.cards=[];g.refine=0}}else{e.target.value=g.id?e.target.defaultValue:"";return}
    save();renderGearTable();renderAll();return}
  if(e.target.dataset.card!=null){const v=e.target.value.trim(),id=GEAR_LISTS["c_"+k].get(v);g.cards=g.cards||[];
    if(!v)g.cards[+e.target.dataset.card]=null;else if(id!=null)g.cards[+e.target.dataset.card]=id;else{e.target.value="";return}save();renderAll()}});
$("checkGrid").addEventListener("input",e=>{const k=e.target.dataset.ck;if(!k)return;const b=buildOf(C());b.check=b.check||{};
  if(e.target.value==="")delete b.check[k];else b.check[k]=num(e.target.value);save();renderAll();
  // refresh just the difference marks while typing, so the box keeps focus
  CHECKS.forEach(([kk,,get])=>{const inp=$("checkGrid").querySelector(`[data-ck="${kk}"]`),mark=inp.nextElementSibling,g=b.check[kk],mine=BUILD_LAST?get(BUILD_LAST.fields):null;
    const d=g!=null&&mine!=null?g-mine:null;if(mark)mark.remove();if(d!=null)inp.insertAdjacentHTML("afterend",`<span class="${Math.abs(d)<0.5?"good":"bad"}">${d===0?"✓":(d>0?"+":"")+fmtP(+d.toFixed(1))}</span>`)})});
$("gearTable").addEventListener("input",e=>{if(e.target.classList.contains("opts")){const g=buildOf(C()).gear[e.target.closest("tr").dataset.slot];if(g){g.opts=e.target.value;save();renderAll()}return}
  if(!e.target.classList.contains("ref"))return;const k=e.target.closest("tr").dataset.slot;const g=buildOf(C()).gear[k];if(!g)return;
  g.refine=Math.max(0,Math.min(20,num(e.target.value)));save();renderAll()});

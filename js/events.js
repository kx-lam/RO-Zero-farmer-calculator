// ---- events ----
$("job").innerHTML=Object.keys(JOBS).map(j=>`<option>${j}</option>`).join("");
$("weapon").innerHTML=Object.keys(WEAPONS).map(w=>`<option>${w}</option>`).join("");
$("wElem").innerHTML=AE.map(e=>`<option>${e}</option>`).join("");
$("aElem").innerHTML='<option value="W">Weapon / arrow</option>'+AE.map(e=>`<option>${e}</option>`).join("");
$("job").addEventListener("change",e=>{state.job=e.target.value;C();save();syncChar();renderAll()});
$("preset").addEventListener("change",e=>{const c=C();const i=+e.target.value;c.preset=i;if(i>=0){c.a=levelPreset(JOBS[state.job].p[i],c).a}save();syncChar();renderAll()});
// ---- stats: status ATK/MATK/HIT/FLEE from the renewal formulas (irowiki.org/wiki/Stats) ----
const STATS=["str","agi","vit","dex","luk"];
const RANGED=["Bow","Musical instrument","Whip"];
const statVal=(c,k)=>EFF&&c===C()&&EFF.st?(k==="int"?sumStat(EFF.intTxt):EFF.st[k]!=null&&EFF.st[k]!==""?sumStat(EFF.st[k]):null):k==="int"?sumStat(c.intTxt):(c.st&&c.st[k]!=null&&c.st[k]!==""?sumStat(c.st[k]):null);
function derived(c){const g=k=>statVal(c,k)??0;const lv=num(c.baseLv),str=g("str"),agi=g("agi"),int=g("int"),dex=g("dex"),luk=g("luk"),vit=g("vit");const r=RANGED.includes(c.weapon);
  return {atk:Math.floor(lv/4+(r?dex+str/5:str+dex/5)+luk/3),matk:Math.floor(lv/4)+Math.floor(int*1.5)+Math.floor(dex/5)+Math.floor(luk/3),
    hit:175+lv+dex+Math.floor(luk/3),flee:100+lv+agi+Math.floor(luk/5),def:Math.floor(lv/2)+Math.floor(vit/2)+Math.floor(agi/5),
    crit:1+luk*0.3+lv/100,aspdTerm:Math.sqrt(agi*agi/2+dex*dex/(r?7:5))/4,vit,int}}
// ASPD base + weapon penalty for 1st and 2nd jobs on Zero (Landgris ROCalculator "paradise" table); missing = unknown
const ASPD_T={Swordsman:{"Bare hands":156,"One-handed mace":-10,"Two-handed mace":-10,"Dagger":-7,"One-handed sword":-7,"Two-handed sword":-14,"One-handed axe":-15,"Two-handed axe":-20,"One-handed spear":-17,"Two-handed spear":-25},
 Mage:{"Bare hands":146,"One-handed staff":-5,"Two-handed staff":-5,"Dagger":0},Archer:{"Bare hands":156,"Dagger":-15,"Bow":-10},
 Acolyte:{"Bare hands":156,"One-handed mace":-5,"Two-handed mace":-5,"One-handed staff":-20,"Two-handed staff":-20},
 Merchant:{"Bare hands":156,"One-handed mace":-10,"Two-handed mace":-10,"Dagger":-12,"One-handed sword":-12,"One-handed axe":-8,"Two-handed axe":-15},
 Thief:{"Bare hands":156,"Dagger":-8,"Bow":-13,"One-handed sword":-10,"One-handed axe":-20},
 Knight:{"Bare hands":156,"One-handed mace":-5,"Two-handed mace":-5,"Dagger":-9,"One-handed sword":-5,"Two-handed sword":-3,"One-handed axe":-10,"Two-handed axe":-15,"One-handed spear":-15,"Two-handed spear":-20},
 Crusader:{"Bare hands":156,"One-handed mace":-5,"Two-handed mace":-5,"Dagger":-8,"One-handed sword":-3,"Two-handed sword":-15,"One-handed axe":-10,"Two-handed axe":-15,"One-handed spear":-13,"Two-handed spear":-10},
 Wizard:{"Bare hands":146,"One-handed staff":-3,"Two-handed staff":-3,"Dagger":-4},Sage:{"Bare hands":151,"One-handed staff":-10,"Two-handed staff":-10,"Dagger":-8,"Book":2},
 Hunter:{"Bare hands":156,"Dagger":-13,"Bow":-7},Bard:{"Bare hands":156,"Dagger":-13,"Bow":-8,"Musical instrument":-5},Dancer:{"Bare hands":156,"Dagger":-13,"Bow":-8,"Whip":-5},
 Priest:{"Bare hands":156,"One-handed mace":-3,"Two-handed mace":-3,"One-handed staff":-20,"Two-handed staff":-20,"Book":-4,"Knuckle":-20},Monk:{"Bare hands":156,"One-handed mace":-3,"Two-handed mace":-3,"One-handed staff":-20,"Two-handed staff":-18,"Knuckle":0},
 Blacksmith:{"Bare hands":156,"One-handed mace":-8,"Two-handed mace":-8,"Dagger":-10,"One-handed sword":-10,"One-handed axe":-6,"Two-handed axe":-10},Alchemist:{"Bare hands":156,"One-handed mace":-5,"Two-handed mace":-5,"Dagger":-10,"One-handed sword":-5,"One-handed axe":-5,"Two-handed axe":-12},
 Assassin:{"Bare hands":156,"Dagger":-2,"One-handed sword":-10,"One-handed axe":-11,"Katar":-2},Rogue:{"Bare hands":156,"Dagger":-5,"Bow":-10,"One-handed sword":-10}};
const aspdBase=(job,w)=>{const t=ASPD_T[job];if(!t||t[w]==null)return null;return t["Bare hands"]+(w==="Bare hands"?0:t[w])};
const bumpFirst=(txt,d)=>{if(!d)return txt;const p=String(txt??"0").split("+");p[0]=String(Math.round((parseFloat(p[0])||0)+d));return p.join("+")};
// a stat change moves the status part of ATK/MATK/HIT/FLEE/DEF by the same amount the formula moves, so gear bonuses you typed stay
function shiftByStats(c,before){const a=derived(c);const ok=k=>STATS.every(x=>statVal(c,x)!=null);if(!ok())return;
  c.atkTxt=bumpFirst(c.atkTxt,a.atk-before.atk);c.matkTxt=bumpFirst(c.matkTxt,a.matk-before.matk);c.hitTxt=bumpFirst(c.hitTxt,a.hit-before.hit);c.fleeTxt=bumpFirst(c.fleeTxt,a.flee-before.flee);c.defTxt=bumpFirst(c.defTxt,a.def-before.def);
  const r1=x=>Math.round(x*10)/10;if(num(c.crit)||a.crit!==before.crit)c.crit=r1(Math.max(0,num(c.crit)+a.crit-before.crit));c.aspd=r1(Math.min(190,num(c.aspd,150)+a.aspdTerm-before.aspdTerm));
  if(a.vit!==before.vit&&num(c.maxHp)>0)c.maxHp=Math.round(num(c.maxHp)*(100+a.vit)/(100+before.vit));if(a.int!==before.int&&num(c.maxSp)>0)c.maxSp=Math.round(num(c.maxSp)*(100+a.int)/(100+before.int))}
const renderStatNote=()=>{const c=C();const miss=STATS.filter(k=>statVal(c,k)==null);
  if(miss.length){$("statNote").textContent=`Type all six stats (base+bonus, e.g. 60+8) so changing a stat updates the rest. Missing: ${miss.map(x=>x.toUpperCase()).join(", ")}.`;return}
  const d=derived(c);const ab=aspdBase(state.job,c.weapon);$("statNote").textContent=`From your stats: status ATK ${d.atk} · status MATK ${d.matk} · HIT ${d.hit} · FLEE ${d.flee} · soft DEF ${d.def} · CRIT ${d.crit.toFixed(1)}${ab!=null?` · ASPD ${(ab+d.aspdTerm).toFixed(1)} before potions/skills`:""} (${RANGED.includes(c.weapon)?"ranged: DEX":"melee: STR"} is your main ATK stat). Changing a stat moves your typed values by the difference.`};
STATS.forEach(k=>$("st_"+k).addEventListener("change",e=>{const c=C();if(!c.st)c.st={};const wasSet=STATS.every(x=>statVal(c,x)!=null);const before=derived(c);c.st[k]=e.target.value;if(wasSet)shiftByStats(c,before);save();syncChar();renderAll()}));
// character number/text fields
const numK=["jobLv","fctSec","normalPct","myElPct","ignDef","ignMdef","mastery","rangePct","skillPct","crit","critDmg","fixedShare","vctPct","fctPct","acdPct","wAtk","baseLv","aspd","maxHp","maxSp","spRegen","dmgBonus","namePct","itemSp","itemPrice","mobInterval","hitScale","hpRegen","curW","maxW","townMin"];
["baseLv","jobLv","atkTxt","matkTxt","hitTxt","fleeTxt","aspd","defTxt","maxHp","maxSp","intTxt","wAtk","fctSec","normalPct","myElPct","ignDef","ignMdef","mastery","rangePct","skillPct","crit","critDmg","fixedShare","vctPct","fctPct","acdPct","spRegen","dmgBonus","nameSel","namePct","itemSp","itemPrice","mobInterval","hitScale","hpRegen","curW","maxW","townMin"].forEach(k=>
  $(k).addEventListener("input",e=>{const v=e.target.value;const c0=C();const before=(k==="baseLv"||k==="intTxt")?derived(c0):null;C()[k]=numK.includes(k)?(v===""?(k==="hitScale"?0.3:0):num(v)):v;if(k==="mobInterval"&&!(C()[k]>0))C()[k]=1.5;if(before){shiftByStats(c0,before);["atkTxt","matkTxt","hitTxt","fleeTxt","defTxt"].forEach(x=>{if(document.activeElement!==$(x))$(x).value=c0[x]})}save();renderAll()}));
$("npcBuy").addEventListener("change",e=>{C().npcBuy=e.target.checked;save();renderAll()});
$("sellAt").addEventListener("change",e=>{C().sellAt=+e.target.value;save();renderAll()});
["weapon","wElem","nameType"].forEach(k=>$(k).addEventListener("change",e=>{const c=C();
  if(k==="weapon"){const a0=aspdBase(state.job,c.weapon),a1=aspdBase(state.job,e.target.value);if(a0!=null&&a1!=null){c.aspd=Math.min(190,Math.round((num(c.aspd,150)+a1-a0)*10)/10);$("aspd").value=c.aspd}}
  c[k]=e.target.value;save();renderAll();if(k==="weapon")renderSkills()}));
$("autoSp").addEventListener("change",e=>{C().autoSp=e.target.checked;save();renderAll()});
const potInfo=()=>{const c=C();$("potInfo").textContent=c.potOn?`ASPD ${aspdEff()} · ~${fmtN(potOnlyHr())} z/hr`:""};
$("potOn").addEventListener("change",e=>{C().potOn=e.target.checked;save();potInfo();renderAll()});
["potAspd","potPrice","potMin"].forEach(id=>$(id).addEventListener("input",e=>{C()[id]=num(e.target.value);save();potInfo();renderAll()}));
ROOTQ("#sagePanel").forEach(p=>p.addEventListener("input",e=>{const i=e.target;const g=G();
  if(i.dataset.sgbolt){g.bolts[i.dataset.sgbolt]=i.checked}else if(i.dataset.sg){const k=i.dataset.sg;g[k]=i.type==="checkbox"?i.checked:num(i.value)}else return;
  if(i.dataset.sg==="hsOn")g.hsAuto=false;save();syncChar();renderAll()}));
$("converters").addEventListener("change",e=>{C().converters=e.target.checked;save();renderAll()});
// attack detail fields: editing makes the attack "Custom"
$("cartW").addEventListener("input",e=>{C().cartW=Math.min(8000,Math.max(0,num(e.target.value)));save();renderAll()});
const aMap={aType:"type",aPct:"pct",aHits:"hits",aElem:"el",aCast:"cast",aDelay:"delay",aSp:"sp",aTargets:"targets",aZeny:"zeny"};
Object.entries(aMap).forEach(([id,k])=>{const h=e=>{const c=C();const v=e.target.value;if(k==="cast"){delete c.a.fct;delete c.a.vct}c.a[k]=(k==="type"||k==="el")?v:Math.max(k==="hits"||k==="targets"?(k==="targets"?1:0.01):0,num(v));
  if(c.preset>=0){c.a.name=(JOBS[state.job].p[c.preset]||{}).name+" (edited)";c.preset=-1;$("preset").value="-1"}save();renderAll()};
  $(id).addEventListener(id==="aType"||id==="aElem"?"change":"input",h)});
$("partyN").addEventListener("input",e=>{cur().partyN=num(e.target.value,1)||1;save();renderAll()});
$("partyBonus").addEventListener("input",e=>{cur().partyBonus=e.target.value===""?null:num(e.target.value);save();renderAll()});
$("dropBonus").value=state.dropBonus||0;$("dropBonus").addEventListener("input",e=>{state.dropBonus=num(e.target.value);save();renderAll()});
$("bonus").addEventListener("input",e=>{state.bonus=num(e.target.value);save();renderAll()});
// log
function nowTime(){return new Date().toTimeString().slice(0,5)}
function resetForm(){const es=[...cur().entries].sort((a,b)=>a.t-b.t),last=es[es.length-1];$("fLevel").value=last?last.lv:num(C().baseLv,60);$("fPct").value="";$("fJob").value="";$("fTime").value=nowTime()}
function entryTime(h,m){const d=new Date();d.setHours(h,m,0,0);if(d.getTime()-Date.now()>3600e3)d.setDate(d.getDate()-1);return d.getTime()}
function guessLevel(s,t,lv,p){const prev=[...s.entries].filter(e=>e.t<t).sort((a,b)=>b.t-a.t)[0];return prev&&prev.lv===lv&&prev.pct-p>=50?lv+1:lv}
$("addForm").addEventListener("submit",e=>{e.preventDefault();const s=cur();const [h,m]=($("fTime").value||nowTime()).split(":").map(Number);const t=entryTime(h,m);
  s.entries=s.entries.filter(x=>x.t!==t);const lvIn=num($("fLevel").value,60),pIn=num($("fPct").value),lvG=guessLevel(s,t,lvIn,pIn);
  $("pasteMsg").textContent=lvG!==lvIn?`EXP % went down a lot, so this entry is saved as Lv ${lvG}.`:"";
  const ent={t,lv:lvG,pct:pIn};if($("fJob").value!==""){ent.jpct=num($("fJob").value);const pv=[...s.entries].filter(e=>e.t<t&&e.jpct!=null).sort((a,b)=>b.t-a.t)[0];if(pv&&pv.jpct-ent.jpct>=50&&num(C().jobLv))C().jobLv=Math.min(jobMax(),num(C().jobLv)+1)}s.entries.push(ent);autoResume(s,t);if(!s.job)s.job=state.job;
  if(C().baseLv!==lvG&&s.entries.every(x=>x.t<=t)){const c0=C(),b0=derived(c0);c0.baseLv=lvG;shiftByStats(c0,b0)}save();renderAll();syncChar();resetForm();$("fPct").focus()});
$("pasteAdd").addEventListener("click",()=>{const s=cur();let lv=num($("fLevel").value,60),n=0,ups=0;
  const parsed=$("pasteBox").value.split(/\n/).map(line=>{const m=line.match(/(\d{1,2}):?(\d{2})[^\d\n]+?(\d+(?:\.\d+)?)\s*%?(?:[^\d\n]+?(\d+(?:\.\d+)?)\s*%?)?/);if(!m||+m[1]>23||+m[2]>59)return null;return {t:entryTime(+m[1],+m[2]),pct:+m[3],jpct:m[4]!=null?+m[4]:null}}).filter(Boolean).sort((a,b)=>a.t-b.t);
  parsed.forEach(x=>{const g=guessLevel(s,x.t,lv,x.pct);if(g!==lv){ups++;lv=g}const ent={t:x.t,lv,pct:x.pct};if(x.jpct!=null)ent.jpct=x.jpct;s.entries=s.entries.filter(e=>e.t!==x.t);s.entries.push(ent);n++});
  $("pasteMsg").textContent=n?`Added ${n} entr${n===1?"y":"ies"}${ups?` with ${ups} level-up${ups>1?"s":""} (now Lv ${lv})`:` at Lv ${lv}`}.`:"No lines matched. Use the format 15:05 17.9% (job % optional)";
  if(n){autoResume(s,parsed[parsed.length-1].t);if(!s.job)s.job=state.job;$("pasteBox").value="";save();renderAll()}});
$("pauseBtn").addEventListener("click",()=>{const s=cur(),p=openPause(s);if(!s.pauses)s.pauses=[];
  if(p){p.to=Date.now();save();renderAll();showTab("track");$("fPct").focus()}else{s.pauses.push({from:Date.now()});save();renderAll()}});
$("logTable").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;const s=cur();s.entries=s.entries.filter(x=>x.t!==+b.dataset.del);save();renderAll()});
const openSession=id=>{state.current=id;state.calcMobId=null;save();renderAll();resetForm()};
// accounts: switching saves this one and reloads the page with the other one's data
function renderAccts(){$("acctSel").innerHTML=accts.list.map(a=>`<option value="${esc(a.id)}" ${a.id===accts.active?"selected":""}>${esc(a.name)}</option>`).join("");$("delAcct").disabled=accts.list.length<2}
const switchAcct=id=>{save();accts.active=id;saveAccts();location.reload()};
$("acctSel").addEventListener("change",e=>switchAcct(e.target.value));
$("newAcct").addEventListener("click",()=>{const id="a"+Date.now();let n=accts.list.length+1;while(accts.list.some(a=>a.name==="Account "+n))n++;accts.list.push({id,name:"Account "+n});switchAcct(id)});
const endAcctRename=keep=>{const i=$("acctName");if(i.hidden)return;if(keep){const v=i.value.trim(),a=accts.list.find(x=>x.id===accts.active);if(v&&a){a.name=v;saveAccts()}}i.hidden=true;$("acctSel").hidden=false;$("renameAcct").textContent="Rename";renderAccts()};
$("renameAcct").addEventListener("click",()=>{const i=$("acctName");if(!i.hidden){endAcctRename(true);return}i.value=accts.list.find(x=>x.id===accts.active).name;i.hidden=false;$("acctSel").hidden=true;$("renameAcct").textContent="Save";i.focus();i.select()});
$("acctName").addEventListener("keydown",e=>{if(e.key==="Enter")endAcctRename(true);else if(e.key==="Escape")endAcctRename(false)});
$("acctName").addEventListener("blur",()=>setTimeout(()=>endAcctRename(true),150));
let acctDelArmed=false;
$("delAcct").addEventListener("click",()=>{if(accts.list.length<2)return;if(!acctDelArmed){acctDelArmed=true;$("delAcct").textContent="Confirm delete";setTimeout(()=>{acctDelArmed=false;$("delAcct").textContent="Delete"},3000);return}
  try{localStorage.removeItem(acctKey(accts.active))}catch(e){}accts.list=accts.list.filter(a=>a.id!==accts.active);accts.active=accts.list[0].id;saveAccts();location.reload()});
// account and session ⋯ menus: click toggles, an outside click or Esc closes, picking an item closes (Delete stays open for its confirm click)
const menus=[...document.querySelectorAll(".menu")];
const closeMenu=(m,refocus)=>{const b=m.querySelector(".menuBtn");if(b.getAttribute("aria-expanded")!=="true")return;b.setAttribute("aria-expanded","false");m.querySelector(".menuList").hidden=true;if(refocus)b.focus()};
menus.forEach(m=>{const b=m.querySelector(".menuBtn"),list=m.querySelector(".menuList"),items=()=>[...list.querySelectorAll("button:not(:disabled)")];
  b.addEventListener("click",()=>{const open=b.getAttribute("aria-expanded")==="true";menus.forEach(x=>closeMenu(x));if(!open){b.setAttribute("aria-expanded","true");list.hidden=false}});
  b.addEventListener("keydown",e=>{if(e.key==="ArrowDown"){e.preventDefault();if(list.hidden)b.click();items()[0]?.focus()}});
  list.addEventListener("click",e=>{const it=e.target.closest("button");if(it&&!it.hasAttribute("data-keep"))closeMenu(m)});
  list.addEventListener("keydown",e=>{const its=items(),i=its.indexOf(document.activeElement);
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();its[(i+(e.key==="ArrowDown"?1:its.length-1))%its.length]?.focus()}
    else if(e.key==="Tab")closeMenu(m)})});
document.addEventListener("click",e=>menus.forEach(m=>{if(!m.contains(e.target))closeMenu(m)}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")menus.forEach(m=>closeMenu(m,m.contains(document.activeElement)))});
renderAccts();
$("sessionSel").addEventListener("change",e=>openSession(e.target.value));
// rename: swap the session picker for a text box; Enter or leaving the box saves, Esc cancels
// renameId pins the session being renamed, so a save that lands after a session switch still renames the right one
let renameId=null;
const endRename=keep=>{const i=$("sessName");if(i.hidden)return;if(keep){const v=i.value.trim(),s=state.sessions.find(x=>x.id===renameId);if(v&&s){s.name=v;save()}}renameId=null;i.hidden=true;$("sessionSel").hidden=false;$("renameSession").textContent="Rename";renderAll()};
$("renameSession").addEventListener("click",()=>{const i=$("sessName");if(!i.hidden){endRename(true);return}renameId=cur().id;i.value=cur().name;i.hidden=false;$("sessionSel").hidden=true;$("renameSession").textContent="Save";i.focus();i.select()});
$("sessName").addEventListener("keydown",e=>{if(e.key==="Enter")endRename(true);else if(e.key==="Escape")endRename(false)});
$("sessName").addEventListener("blur",()=>setTimeout(()=>endRename(true),150));
$("newSession").addEventListener("click",()=>{const id="s"+Date.now();state.sessions.push({id,name:"New session",mobIds:[],entries:[]});openSession(id);showTab("maps");$("mobInput").focus()});
let delArmed=false;
$("delSession").addEventListener("click",()=>{if(!delArmed){delArmed=true;$("delSession").textContent="Confirm delete";setTimeout(()=>{delArmed=false;$("delSession").textContent="Delete"},3000);return}
  delArmed=false;$("delSession").textContent="Delete";state.sessions=state.sessions.filter(s=>s.id!==state.current);
  if(!state.sessions.length)state.sessions.push({id:"s"+Date.now(),name:"New session",mobIds:[],entries:[]});openSession(state.sessions[0].id)});
$("cmpTable").querySelector("tbody").addEventListener("click",e=>{const tr=e.target.closest("tr[data-sid]");if(!tr)return;openSession(tr.dataset.sid);window.scrollTo({top:0,behavior:"smooth"})});
// monsters
// add or remove a monster from the current session; the first one names a fresh session and sets its job
const toggleSessMob=id=>{const s=cur();const i=s.mobIds.indexOf(id);if(i>=0){s.mobIds.splice(i,1);return}
  if(!s.mobIds.length)s.job=state.job;s.mobIds.push(id);const m=MOBS.find(x=>x.id===id);if(s.mobIds.length===1&&m&&s.name==="New session")s.name=m.name};
const pickMob=m=>{if(!m)return;state.calcMobId=m.id;const s=cur();if(!s.mobIds.length)toggleSessMob(m.id);save();renderAll()};
$("mobList").innerHTML=MOBS.map(m=>`<option value="${esc(m.name)}">Lv ${m.lv} · ${fmtExp(m)} EXP</option>`).join("");
$("mobInput").addEventListener("change",e=>{pickMob(MOBS.find(x=>x.name.toLowerCase()===e.target.value.trim().toLowerCase()))});
$("mobTable").querySelector("tbody").addEventListener("click",e=>{if(e.target.closest("a"))return;const tr=e.target.closest("tr[data-id]");if(tr)pickMob(MOBS.find(m=>m.id===+tr.dataset.id))});
$("mobTable").querySelector("thead").addEventListener("click",e=>{if(e.target.closest(".filters"))return;const th=e.target.closest("th");if(!th||!th.dataset.k)return;
  if(state.sort===th.dataset.k)state.dir*=-1;else{state.sort=th.dataset.k;state.dir=["name","el","size","race","sec","uses","hpm"].includes(th.dataset.k)?1:-1}save();renderMobs()});
document.querySelectorAll("#mobTable .filters [data-f]").forEach(inp=>{inp.value=state.filters[inp.dataset.f]||"";inp.addEventListener("input",()=>{state.filters[inp.dataset.f]=inp.value;save();renderMobs()})});
$("clearF").addEventListener("click",()=>{state.filters={};document.querySelectorAll("#mobTable .filters [data-f]").forEach(i=>i.value="");save();renderMobs()});
$("minLv").value=state.minLv;$("maxLv").value=state.maxLv;
["minLv","maxLv"].forEach(id=>$(id).addEventListener("input",e=>{state[id]=e.target.value===""?(id==="maxLv"?99:1):num(e.target.value);save();renderMobs()}));
$("hideClosed").checked=state.hideClosed;$("hideClosed").addEventListener("change",e=>{state.hideClosed=e.target.checked;save();renderMobs()});
// EXP Hunter + closed regions
$("bestMin").addEventListener("input",renderBest);$("bestN").addEventListener("change",renderBest);
$("bestTable").querySelector("thead").addEventListener("click",e=>{const th=e.target.closest("th[data-bk]");if(!th)return;const k=th.dataset.bk;
  if((state.bestSort||"epm")===k)state.bestDir=-(state.bestDir||-1);else state.bestDir=(k==="mp"||k==="secT"||k==="hpm"||k==="skip")?1:-1;state.bestSort=k;save();renderBest()});
$("bestTable").querySelector("tbody").addEventListener("click",e=>{const tr=e.target.closest("tr[data-map]");if(!tr)return;state.map=tr.dataset.map;save();renderMap();$("mapCard").scrollIntoView({behavior:"smooth",block:"start"})});
$("regions").addEventListener("click",e=>{const b=e.target.closest("[data-region]");if(!b)return;const id=b.dataset.region;state.regions[id]=state.regions[id]===false;syncClosed();save();renderAll()});
$("closedMaps").addEventListener("change",e=>{state.closed=[...new Set(e.target.value.split(/[\s,]+/).map(x=>x.trim().toLowerCase()).filter(Boolean))];syncClosed();save();renderAll()});
// Zeny Hunter
ROOTQ("[data-hunt]").forEach(b=>b.addEventListener("click",()=>{state.huntMode=b.dataset.hunt;save();renderHunt()}));
$("huntMin").addEventListener("input",renderHunt);$("huntN").addEventListener("change",renderHunt);
$("huntAuto").addEventListener("change",e=>{state.huntAuto=e.target.checked;save();renderHunt()});
$("flyPrice").value=state.flyPrice??250;$("teleSec").value=state.teleSec??1;
["flyPrice","teleSec"].forEach(id=>$(id).addEventListener("input",e=>{if(e.target.value==="")delete state[id];else state[id]=Math.max(0,num(e.target.value));save();renderHunt()}));
// auto loot: one tick box per group; it changes zeny everywhere
$("autoLoot").insertAdjacentHTML("beforeend",LOOT_GROUPS.map(([g,n])=>`<label class="bar" style="flex-direction:row;gap:4px"><input type="checkbox" data-loot="${g}" style="width:auto"> ${n}</label>`).join(""));
$("autoLoot").addEventListener("change",e=>{const i=e.target.closest("[data-loot]");if(!i)return;state.autoLoot[i.dataset.loot]=i.checked;save();renderAll()});
// pick the monsters to hunt on a map: the first click copies the current picks (all, or the best-paying ones) and toggles that monster;
// you always hunt at least one. "reset" goes back to all / best-paying
const huntPick=(mp,id)=>{const r=huntMap(mp,walkSec(),num($("huntMin").value));if(!r)return;const off=new Set(r.mobs.filter(x=>!x.on).map(x=>x.m.id));
  off.has(id)?off.delete(id):off.add(id);if(r.mobs.every(x=>off.has(x.m.id)))return;state.huntOff[mp]=[...off];save();renderAll()};
$("huntTable").querySelector("thead").addEventListener("click",e=>{const th=e.target.closest("th[data-hk]");if(!th)return;const k=th.dataset.hk;
  if((state.huntSort||"net")===k)state.huntDir=-(state.huntDir||-1);else state.huntDir=(k==="name"||k==="cost"||k==="hpm")?1:-1;state.huntSort=k;save();renderHunt()});
// market prices: add by name ("Name #id" from the list, or a unique name), edit, remove, or click a drop in the table
const DROP_IDS=[...new Set(MOBS.flatMap(m=>(m.drops||[]).map(d=>String(d[0]))))].filter(id=>ITEMN[id]);
$("priceList").innerHTML=DROP_IDS.map(id=>`<option value="${esc(ITEMN[id])} #${id}"></option>`).join("");
const findItem=s=>{s=String(s).trim();const h=s.match(/#(\d+)$/);if(h&&ITEMN[h[1]])return h[1];const l=s.toLowerCase();const hit=DROP_IDS.filter(id=>ITEMN[id].toLowerCase()===l);return hit.length?hit[0]:null};
const addPrice=(id,focus)=>{if(!(id in state.prices))state.prices[id]=0;save();renderPrices();if(focus){showTab("market");const i=document.querySelector(`[data-price="${id}"]`);if(i){i.focus();i.scrollIntoView({behavior:"smooth",block:"center"})}}};
// the NPC box shows rozerodb's NPC price for the picked item; typing one overrides it
$("priceItem").addEventListener("input",()=>{const id=findItem($("priceItem").value);$("priceNpc").placeholder=id&&NPCSELL[id]!=null?fmtN(NPCSELL[id])+" (rozerodb)":"0"});
$("priceAdd").addEventListener("click",()=>{const id=findItem($("priceItem").value),p=$("priceVal").value;if(!id){$("priceMsg").textContent="Pick an item from the list.";return}
  $("priceMsg").textContent="";state.prices[id]=Math.max(0,num(p));const np=$("priceNpc").value;if(np!=="")state.npcPrices[id]=Math.max(0,num(np));$("priceItem").value="";$("priceVal").value="";$("priceNpc").value="";$("priceNpc").placeholder="0";save();renderAll()});
$("priceTable").addEventListener("input",e=>{const i=e.target.closest("[data-price],[data-npc]");if(!i)return;
  if(i.dataset.price)state.prices[i.dataset.price]=Math.max(0,num(i.value));else if(i.value==="")delete state.npcPrices[i.dataset.npc];else state.npcPrices[i.dataset.npc]=Math.max(0,num(i.value));save();renderAll()});
$("priceTable").addEventListener("click",e=>{const b=e.target.closest("[data-unprice]");if(!b)return;delete state.prices[b.dataset.unprice];delete state.npcPrices[b.dataset.unprice];save();renderAll()});
$("huntTable").querySelector("tbody").addEventListener("click",e=>{const a=e.target.closest("[data-pitem]");if(a){e.preventDefault();e.stopPropagation();addPrice(a.dataset.pitem,true);return}
  const h=e.target.closest("[data-hpick]");if(h){e.preventDefault();e.stopPropagation();huntPick(h.dataset.hpick,+h.dataset.hmob);return}
  const x=e.target.closest("[data-hreset]");if(x){e.preventDefault();e.stopPropagation();delete state.huntOff[x.dataset.hreset];save();renderAll();return}
  const t=e.target.closest("[data-notele]");if(t){e.preventDefault();e.stopPropagation();const mp=t.dataset.notele;state.noTele=noTele(mp)?state.noTele.filter(x=>x!==mp):[...state.noTele,mp];save();renderHunt()}},true);
$("huntTable").querySelector("tbody").addEventListener("click",e=>{const tr=e.target.closest("tr[data-map],tr[data-id]");if(!tr)return;
  if(tr.dataset.map){state.map=tr.dataset.map;save();renderMap();$("mapCard").scrollIntoView({behavior:"smooth",block:"start"})}
  else{state.calcMobId=+tr.dataset.id;save();renderAll();$("mobTiles").scrollIntoView({behavior:"smooth",block:"center"})}});
// Monster info: pick a monster; click a drop to price it, a map to open it in the map planner
$("mobInfoInput").addEventListener("change",e=>{const m=MOBS.find(x=>x.name.toLowerCase()===e.target.value.trim().toLowerCase());if(!m)return;state.infoMobId=m.id;save();renderMobInfo()});
$("mobInfoDrops").addEventListener("click",e=>{const a=e.target.closest("[data-pitem]");if(a){e.preventDefault();addPrice(a.dataset.pitem,true)}});
$("mobInfoMaps").addEventListener("click",e=>{const tr=e.target.closest("tr[data-map]");if(!tr)return;state.map=tr.dataset.map;save();showTab("maps");renderMap();$("mapCard").scrollIntoView({behavior:"smooth",block:"start"})});
// Item info: search and filter; click an item for its droppers, a dropper for its Monster info
$("itemGroup").insertAdjacentHTML("beforeend",LOOT_GROUPS.map(([g,n])=>`<option value="${g}">${n}</option>`).join(""));
$("itemSearch").addEventListener("input",renderItems);$("itemGroup").addEventListener("change",renderItems);$("itemSort").addEventListener("change",renderItems);
$("itemCard").addEventListener("click",e=>{const a=e.target.closest("[data-pitem]");if(a){e.preventDefault();addPrice(a.dataset.pitem,true);return}
  const it=e.target.closest("tr[data-item]");if(it){state.infoItem=it.dataset.item;save();renderItems();$("itemTiles").scrollIntoView({behavior:"smooth",block:"nearest"});return}
  const mo=e.target.closest("#itemDroppers tr[data-id]");if(mo){state.infoMobId=+mo.dataset.id;save();showTab("mobinfo");scrollTo({top:0})}});
// map planner
$("mapList").innerHTML=Object.keys(MAPMOBS).sort((a,b)=>mapCode(a).localeCompare(mapCode(b))).map(m=>`<option value="${mapCode(m)}">${esc(mapName(m))} · ${MAPMOBS[m].length} monsters</option>`).join("");
$("mapInput").addEventListener("change",e=>{state.map=mapKey(e.target.value);save();renderMap()});
$("mapFromMob").addEventListener("click",()=>{state.map="";save();renderMap()});
$("mapTable").querySelector("tbody").addEventListener("click",e=>{const sm=e.target.closest("[data-sessmob]");if(sm){toggleSessMob(+sm.dataset.sessmob);save();renderAll();return}const sk=e.target.closest("[data-skip]");if(sk){const id=+sk.dataset.skip;if(!state.skipMobs)state.skipMobs=[];state.skipMobs=state.skipMobs.includes(id)?state.skipMobs.filter(x=>x!==id):[...state.skipMobs,id];save();renderAll();return}const tr=e.target.closest("tr[data-id]");if(tr)pickMob(MOBS.find(m=>m.id===+tr.dataset.id))});
// goal
$("goalLv").value=state.goalLv||"";$("walkOverride").value=state.walkOverride||"";
$("goalLv").addEventListener("input",e=>{state.goalLv=num(e.target.value)||null;save();renderTracker()});
$("goalJobLv").value=state.goalJobLv||"";
$("goalJobLv").addEventListener("input",e=>{state.goalJobLv=num(e.target.value)||null;save();renderTracker()});
$("walkOverride").addEventListener("input",e=>{state.walkOverride=num(e.target.value);save();renderAll()});
// backup
const bkText=()=>JSON.stringify(state);
// combined backup: every account's save plus the account list
const bkAllText=()=>{save();return JSON.stringify({allAccounts:1,active:accts.active,accounts:accts.list.map(a=>{let data=null;try{data=JSON.parse(localStorage.getItem(acctKey(a.id)))}catch(e){}return {id:a.id,name:a.name,data}})})};
const bkCopyText=(t,what)=>{const fb=()=>{$("bkText").value=t;$("bkText").select();$("bkMsg").textContent="Couldn't copy automatically, so the backup is selected in the box below."};
  try{navigator.clipboard.writeText(t).then(()=>{$("bkMsg").textContent=`${what} copied. Paste it somewhere safe.`},fb)}catch(err){fb()}};
$("bkCopy").addEventListener("click",()=>bkCopyText(bkText(),"Backup"));
$("bkCopyAll").addEventListener("click",()=>bkCopyText(bkAllText(),`Backup of all ${accts.list.length} accounts`));
$("bkShow").addEventListener("click",()=>{$("bkText").value=bkText();$("bkText").select();$("bkMsg").textContent="Backup text is in the box."});
$("bkShowAll").addEventListener("click",()=>{$("bkText").value=bkAllText();$("bkText").select();$("bkMsg").textContent="Backup text for all accounts is in the box."});
// share link: the current account, deflated and base64url-encoded into the URL hash (#s=…), which never reaches the server
const b64u={enc:b=>{let s="";for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode(...b.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")},
  dec:t=>Uint8Array.from(atob(t.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0))};
const packShare=async t=>b64u.enc(new Uint8Array(await new Response(new Blob([t]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer()));
const unpackShare=async t=>new Response(new Blob([b64u.dec(t)]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
$("bkLink").addEventListener("click",async()=>{let url;try{save();url=location.origin+location.pathname+"#s="+await packShare(bkText())}catch(err){$("bkMsg").textContent="This browser can't make share links. Use Copy backup instead.";return}
  bkCopyText(url,`Share link (${url.length.toLocaleString()} characters)`)});
// opening a share link loads it into the backup box; nothing is replaced until Restore is clicked twice
async function loadShareLink(){const m=location.hash.match(/^#s=([\w-]+)/);if(!m)return;
  try{history.replaceState(null,"",location.pathname+location.search)}catch(err){}
  showTab("acct");
  try{const t=await unpackShare(m[1]),data=JSON.parse(t);if(!data||!Array.isArray(data.sessions))throw 0;
    $("bkText").value=t;$("bkMsg").textContent="A shared account is in the box below. Click Restore from text (twice) to replace this account with it."}
  catch(err){$("bkMsg").textContent="That share link is broken or cut off, so nothing was loaded."}}
let bkArmed=false;
// a single-account backup replaces the current account; an all-accounts backup replaces every account
$("bkRestore").addEventListener("click",()=>{let data;try{data=JSON.parse($("bkText").value)}catch(err){$("bkMsg").textContent="That isn't a valid backup. Paste the whole text from Copy backup.";return}
  const all=data&&data.allAccounts&&Array.isArray(data.accounts);
  if(all){if(!data.accounts.length||data.accounts.some(a=>!a||typeof a.id!=="string"||!a.id)){$("bkMsg").textContent="That backup has no accounts in it.";return}}
  else if(!data||!Array.isArray(data.sessions)){$("bkMsg").textContent="That backup has no sessions in it.";return}
  if(!bkArmed){bkArmed=true;$("bkRestore").textContent=all?`Click again to replace all accounts (${data.accounts.length} in backup)`:"Click again to replace this account";setTimeout(()=>{bkArmed=false;$("bkRestore").textContent="Restore from text"},4000);return}
  bkArmed=false;
  // write every account first, then drop the old ones the backup doesn't have, so a failed write leaves the old accounts in place
  if(all){const keep=new Set(data.accounts.map(a=>acctKey(a.id)));try{data.accounts.forEach(a=>{if(a.data)localStorage.setItem(acctKey(a.id),JSON.stringify(a.data))})}catch(err){$("bkMsg").textContent="Couldn't write the backup to this browser's storage. Your accounts weren't changed.";return}
    try{accts.list.forEach(a=>{if(!keep.has(acctKey(a.id)))localStorage.removeItem(acctKey(a.id))});data.accounts.forEach(a=>{if(!a.data)localStorage.removeItem(acctKey(a.id))})}catch(err){}
    accts.list=data.accounts.map((a,i)=>({id:a.id,name:String(a.name||"Account "+(i+1))}));accts.active=accts.list.some(a=>a.id===data.active)?data.active:accts.list[0].id;saveAccts()}
  else{state=data;save()}
  $("bkMsg").textContent="Restored. Reloading…";try{location.reload()}catch(err){$("bkMsg").textContent="Restored. Reload the page to see it."}});
// ---- show / hide table columns (saved per table) ----
(function setupColPicks(){
  const IDS=["cmpTable","mobTable","bestTable","huntTable","mapTable"];
  if(!state.hideCols)state.hideCols={};
  const st=document.createElement("style");document.body.appendChild(st);
  // hidden columns are saved by header name, so adding or moving a column doesn't hide the wrong one; the position is looked up here
  const names=id=>{const t=document.getElementById(id);return t&&t.tHead?[...t.tHead.rows[0].cells].map(c=>(c.textContent||"").trim()):[]};
  const apply=()=>{st.textContent=IDS.flatMap(id=>{const ns=names(id);return (state.hideCols[id]||[]).map(k=>ns.indexOf(k)).filter(i=>i>=0).map(i=>`#${id} tr>:nth-child(${i+1}){display:none}`)}).join("\n")};
  IDS.forEach(id=>{const t=document.getElementById(id);if(!t||!t.tHead)return;
    const ths=[...t.tHead.rows[0].cells];
    // older saves kept column numbers: turn them into the names of the columns they pointed at
    state.hideCols[id]=(state.hideCols[id]||[]).map(k=>typeof k==="number"?ths[k-1]&&(ths[k-1].textContent||"").trim():k).filter(Boolean);const box=document.createElement("details");box.className="note";box.style.cssText="margin:2px 0";
    box.innerHTML=`<summary style="cursor:pointer">Show / hide columns</summary><div class="bar" style="flex-wrap:wrap;gap:4px 14px;margin-top:6px">${ths.map((th,i)=>{const name=(th.textContent||"").trim();if(!name)return "";
      return `<label class="bar" style="flex-direction:row;gap:4px"><input type="checkbox" data-col="${esc(name)}" style="width:auto" ${(state.hideCols[id]||[]).includes(name)?"":"checked"}> ${esc(name)}</label>`}).join("")}
      <button type="button" class="small" data-allcols>Show all</button></div>`;
    const anchor=t.closest(".scroll")||t;anchor.parentNode.insertBefore(box,anchor);
    box.addEventListener("change",e=>{const c=e.target.closest("[data-col]");if(!c)return;const n=c.dataset.col;const set=new Set(state.hideCols[id]||[]);
      c.checked?set.delete(n):set.add(n);state.hideCols[id]=[...set];save();apply()});
    box.addEventListener("click",e=>{if(!e.target.closest("[data-allcols]"))return;state.hideCols[id]=[];box.querySelectorAll("[data-col]").forEach(x=>x.checked=true);save();apply()});
  });
  apply();
})();

// ---- render: character ----
const syncChar=()=>{
  const c=C();$("job").value=state.job;renderEq();renderCons();
  $("preset").innerHTML=JOBS[state.job].p.map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join("")+'<option value="-1">Custom</option>';
  $("preset").value=String(c.preset??0);renderSkills();
  ["baseLv","jobLv","atkTxt","matkTxt","hitTxt","fleeTxt","aspd","defTxt","maxHp","maxSp","intTxt","wAtk","fctSec","normalPct","myElPct","ignDef","ignMdef","mastery","rangePct","skillPct","crit","critDmg","fixedShare","vctPct","fctPct","acdPct","dmgBonus","nameSel","namePct","itemSp","itemPrice","mobInterval","hitScale","hpRegen"].forEach(k=>$(k).value=c[k]??"");["curW","maxW"].forEach(k=>$(k).value=num(c[k])>0?c[k]:"");$("townMin").value=c.townMin??3;$("sellAt").value=String(num(c.sellAt)===90?90:70);$("wAtk").value=num(c.wAtk)>0?c.wAtk:"";
  $("spRegen").value=num(c.spRegen)>0?c.spRegen:"";
  $("weapon").value=c.weapon;$("wElem").value=c.wElem;$("nameType").value=c.nameType||"phys";$("autoSp").checked=!!c.autoSp;$("converters").checked=!!c.converters;$("potOn").checked=!!c.potOn;$("potAspd").value=c.potAspd??3;$("potPrice").value=c.potPrice??2200;$("potMin").value=c.potMin??30;potInfo();$("convNote").textContent=c.converters&&c.a.el!=="W"?"(this attack has its own element, so converters don't change it)":"";
  const a=c.a;$("aType").value=a.type;$("aPct").value=a.pct;$("aHits").value=a.hits;$("aElem").value=a.el;$("aCast").value=a.cast;$("aDelay").value=a.delay;$("aSp").value=a.sp;$("aTargets").value=a.targets;$("aZeny").value=a.zeny||"";$("cartW").value=c.cartW||"";$("cartWrap").hidden=!num(a.cart);
  $("bonus").value=state.bonus;
  $("sagePanel").hidden=state.job!=="Sage";if(state.job==="Sage"){const g=G();ROOTQ("[data-sg]").forEach(i=>{const k=i.dataset.sg;if(i.type==="checkbox")i.checked=!!g[k];else i.value=g[k]??""});ROOTQ("[data-sgbolt]").forEach(i=>i.checked=!!g.bolts[i.dataset.sgbolt]);$("sg_hsOn").disabled=!!g.hsAuto}STATS.forEach(k=>$("st_"+k).value=(c.st&&c.st[k])||"");renderStatNote();
};
function renderChar(){
  if(typeof renderStatNote==="function")renderStatNote();
  const c=C(),a=c.a,p=JOBS[state.job].p[c.preset];
  $("jobNote").textContent=`Settings are saved per job · ${Object.keys(state.chars).length} job${Object.keys(state.chars).length===1?"":"s"} set up`;
  $("atkSummary").textContent=a.type==="spellfist"?`· Spell Fist Lv ${G().sfLv}: ${Math.round(sfChance()*100)}% per attack, ${sfPct()}% MATK with ${sfBolts().map(b=>({Fire:"Fire",Water:"Cold",Wind:"Lightning"})[b]).join(" / ")||"no"} bolts`:`· ${a.type==="magic"?"Magic":a.type==="auto"?"Basic attacks":"Physical"} ${a.pct}% × ${a.hits} ${atkEl()}${a.targets>1?` · ${a.targets} targets`:""}${p&&p.note?` · ${p.note}`:""}`;
  const us=useSec(),need=spNeedPerSec()*60,reg=regenPerSec()*60,ips=itemsPerSec(),rf=restFactor();
  {const oc=skRate("overcharge"),dc=skRate("discount");$("npcBuy").checked=c.npcBuy!==false;
    $("mercNote").textContent=oc||dc?[oc?`Overcharge: NPCs pay you +${oc}%`:"",dc?`Discount: NPCs charge you −${dc}%${c.npcBuy===false?" (off: bought from players)":""}`:""].filter(Boolean).join(" · "):""}
  $("itemInfo").textContent=c.autoSp?(ips>0?`≈ ${(ips*60).toFixed(1)} items/min · ${fmtN(ips*3600*spItemPrice())} z/hr`:"not needed: regen covers it"):"";
  const atk=a.type==="magic"||a.type==="spellfist"?`MATK ${fmtN(sumStat(c.matkTxt))}`:`ATK ${fmtN(sumStat(c.atkTxt))}`;
  if(state.job==="Sage"){const g=G(),m=calcMob(),d=m?((k)=>{SG_MOB=m;try{return sgDefense(m)}finally{SG_MOB=k}})(SG_MOB):null;
    $("sageInfo").innerHTML=`${g._note?esc(g._note)+" · ":""}Upkeep ${fmtN(sgUpkeep()*60)} SP/min · Hindsight ${fmtN(hsFullSP()*60)} SP/min${hsChance()>0?` (${Math.round(hsChance()*100)}% chance, Lv ${hsBoltLv()} bolt${dbChance()>0?`, +${Math.round(dbChance()*100)}% Double Bolt`:""})`:" (off)"}`+
      (d?` · vs ${esc(m.name)}: Energy Coat ${g.ecOn?`−${d.red}% at SP ${d.label}`:"off"}, defence ${fmtN(d.extra*60)} SP/min, HP lost ${fmtN(d.hp*60)}/min${hfHpPerSec()>0?` (Hunter Fly heals ~${fmtN(hfHpPerSec()*60)}/min)`:""}${healsPerSec(m)>0?`, Heal ${(healsPerSec(m)*60).toFixed(1)} casts/min${healShare(m)>=1?` <span class="bad">(can't keep up: more than all of your time)</span>`:` (${Math.round(healShare(m)*100)}% of your time not attacking)`}`:""}`:" · pick a monster to see Energy Coat and damage taken")+
      ` · SP items ${sgItemsOn()?`${(sgItemsPerSec()*60).toFixed(1)}/min ≈ ${fmtN(sgItemsPerSec()*3600*spItemPrice())} z/hr`:"off (Hindsight off)"}`}
  $("charTiles").innerHTML=`<div class="tile"><div class="k">Per use</div><div class="v mono">${us.toFixed(2)}s</div><div class="s">${a.type==="auto"||a.type==="spellfist"?`ASPD ${aspdEff()}${c.potOn?" (potion)":""} · ${atkPerSec().toFixed(2)} hits/s${critChance()>0?` · ${Math.round(critChance()*100)}% crits`:""}`:`cast ${castSec().toFixed(2)}s${castSec()<num(a.cast)?` (base ${num(a.cast)}s)`:""} + delay ${delaySec().toFixed(2)}s${delaySec()<1/atkPerSec()?" · motion (ASPD) longer than delay":""}${critChance()>0?` · ${Math.round(critChance()*100)}% crits`:""}`} · ${atk}</div></div>
   <div class="tile ${need>reg&&!c.autoSp?"":"now"}"><div class="k">SP use vs regen</div><div class="v mono">${fmtN(need)} / ${fmtN(reg)}</div><div class="s">per minute · regen ${spRegen8()} per 8s${a.type==="spellfist"?(ips>0?` · ${(ips*60).toFixed(1)} SP items/min`:hsChance()>0&&hsSustain()<1?` · <span class="bad">Hindsight fires ${Math.round(hsSustain()*100)}% as often</span>`:""):need>reg?(c.autoSp?` · items cover ${fmtN(need-reg)}/min`:` · <span class="bad">you rest ${Math.round((1-1/rf)*100)}% of the time</span>`):""}</div></div>
   <div class="tile"><div class="k">Walking per kill</div><div class="v mono">${walkSec().toFixed(1)}s</div><div class="s">${num(state.walkOverride)>0?"typed in Goal":`learned from your ${state.job} logs (2s until then)`}</div></div>`;
}

// ---- render: tracker ----
function renderSessions(){$("sessionSel").innerHTML=state.sessions.map(s=>`<option value="${esc(s.id)}" ${s.id===state.current?"selected":""}>${esc(s.name)}</option>`).join("")}
function renderTracker(){
  const s=cur(),st=stats(s);
  if(document.activeElement!==$("partyN"))$("partyN").value=partyN(s);if(document.activeElement!==$("partyBonus"))$("partyBonus").value=partyBonus(s);
  $("partyNote").textContent=partyN(s)>1?`Each kill gives you ${Math.round(expMul(s)/(1+num(state.bonus)/100)*100)}% of its EXP (party of ${partyN(s)}). Even Share only works within 15 base levels.`:"";
  $("title").textContent=`${s.name} · ${state.job}`;
  const pz=openPause(s);$("pauseBtn").textContent=pz?"Resume":"Pause";$("pauseBtn").classList.toggle("primary",!!pz);$("pauseNote").hidden=!pz;
  if(pz)$("pauseNote").textContent=`Paused since ${fmtT(pz.from)}. Time away isn't counted. Press Resume, or just log an entry, when you're back.`;
  const ms=sessMobs(s),mob=ms.length===1?ms[0]:null;
  $("subtitle").innerHTML=ms.length>1?`Farming ${ms.map(m=>esc(m.name)).join(", ")}${sessMap(s)?` on ${esc(mapLabel(sessMap(s)))}`:""} · weighted by spawn counts`:mob?`Farming ${esc(mob.name)} · Lv ${mob.lv} · ${mob.el?`<span class="el ${mob.el}">${mob.el} ${mob.elv}</span> · `:""}${mob.size||""} ${mob.race||""} · ${fmtExp(mob)} base EXP · <a href="${dbUrl(mob)}" target="_blank" rel="noopener">rozerodb ↗</a>`:"Pick a monster in the Monsters &amp; maps tab and press \"Farming this now\"";
  const lastE=[...s.entries].sort((a,b)=>a.t-b.t).pop();
  if(lastE){$("tCurLv").textContent=`Lv ${lastE.lv}`;$("tCurLvS").textContent=lvExp(lastE.lv)?`${fmtN(lvExp(lastE.lv))} EXP to level`:"Lv outside EXP table";
    $("tCurPct").textContent=pct(lastE.pct);$("tCurPctS").textContent=`logged ${fmtT(lastE.t)}`}
  else{$("tCurLv").textContent="–";$("tCurPct").textContent="–";$("tCurLvS").textContent="Log an entry below";$("tCurPctS").textContent=""}
  if(!st){["tAvg","tRecent","tLevel","tNext"].forEach(id=>$(id).textContent="–");["tAvgS","tRecentS","tLevelS","tNextS"].forEach(id=>$(id).textContent="Log at least two entries");$("tNextK").textContent="To next level";$("tRecentK").textContent="Last interval"}
  else{
    $("tAvg").textContent=pct(st.avgPct);$("tAvgS").textContent=`${fmtN(st.avgRaw/60)} EXP/min over ${st.spanMin} min`;
    $("tRecentK").textContent=`Last ${st.recentMin} min`;$("tRecent").textContent=pct(st.recPct);const diff=st.recPct-st.avgPct;
    $("tRecentS").innerHTML=`${fmtN(st.recRaw/60)} EXP/min · <span class="pill ${diff>=0?"up":"down"}">${diff>=0?"+":""}${diff.toFixed(2)}% vs avg</span>`;
    $("tLevel").textContent=fmtDur(st.fullH);$("tLevelS").textContent=lvExp(st.last.lv)?`${fmtN(st.L)} EXP at Lv ${st.last.lv}`:"Lv outside EXP table, using %";
    $("tNextK").textContent=`To Lv ${st.last.lv+1}`;$("tNext").textContent=fmtDur(st.nextH);$("tNextS").textContent=`${(100-st.last.pct).toFixed(2)}% left`}
  const p=sessionPace(s);
  if(p){$("tPace").textContent=`${fmtN(p.kph)}/hr`;$("tPaceS").textContent=`${p.obs.toFixed(1)}s per kill`+(isFinite(p.fight)?(p.obs<p.fight?` · faster than the model's ${p.fight.toFixed(1)}s fight, so check your ATK/MATK`:` · ~${p.fight.toFixed(1)}s fighting + ~${p.walk.toFixed(1)}s walking`):"")}
  else{$("tPace").textContent="–";$("tPaceS").textContent="Needs a monster and 2+ entries"}
  if(p){const zk=p.zk,gross=p.kph*zk,cost=itemsPerSec()*3600*spItemPrice()+potCostHr()+p.kph*p.mix.avg(skillZeny);$("tZeny").textContent=fmtN(gross-cost);$("tZenyS").textContent=`${fmtN(gross)} z loot`+(cost>0?` − ${fmtN(cost)} z items, potions & skill costs`:"")+` · ${fmtN(zk)} z/kill`}
  else{$("tZeny").textContent="–";$("tZenyS").textContent="Needs a monster and 2+ entries"}
  const j=jobRate(s);
  if(j&&num(C().jobLv)>=jobMax()){$("tJob").textContent="Max";$("tJobS").textContent=`Job Lv ${jobMax()} is the max for ${state.job}`}
  else if(j){const need=jobNeed();$("tJob").textContent=pct(j.rate);$("tJobS").textContent=`${fmtDur((100-j.last)/j.rate)} to Job Lv ${num(C().jobLv)?num(C().jobLv)+1:"next"}`+(need?` · ≈ ${fmtN(j.rate/100*need)} job EXP/hr`:" · set your job level for job EXP/hr")}else{$("tJob").textContent="–";$("tJobS").textContent="Add Job EXP % to 2+ entries"}
  renderChart(s);renderLog(s);renderCompare();renderGoalChart(renderGoal(s,st),renderJobGoal(s));
}
function renderChart(s){
  const svg=$("chart"),es=[...s.entries].sort((a,b)=>a.t-b.t);const W=800,H=340,pl=52,pr=18,pt=16,pb=34;
  if(!es.length){svg.innerHTML=`<text x="${W/2}" y="${H/2}" text-anchor="middle">No entries yet</text>`;return}
  const base=es[0].lv;const y=es.map(e=>(e.lv-base)*100+e.pct);let lo=Math.min(...y),hi=Math.max(...y);
  const span=Math.max(hi-lo,2),step=niceStep(span/4);lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;if(hi===lo)hi=lo+step;
  const n=es.length,t0=es[0].t,t1=es[n-1].t,act=t=>activeH(s,t0,t),actSpan=act(t1);const XT=t=>n===1||actSpan<=0?(pl+W-pr)/2:pl+act(t)/actSpan*(W-pl-pr),X=i=>XT(es[i].t);const Y=v=>pt+(hi-v)/(hi-lo)*(H-pt-pb);
  const multi=es[n-1].lv!==base;let g="";
  for(let v=lo;v<=hi+1e-9;v+=step){const lvl=base+Math.floor(v/100),q=((v%100)+100)%100;g+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)" stroke-dasharray="4 4"/><text x="${pl-8}" y="${Y(v)+4}" text-anchor="end">${multi?`${lvl}·${fmtP(q)}`:`${fmtP(v)}%`}</text>`}
  // over more than one day, a label shows the date where the day changes
  const md=multiDay(es),gap=md?84:48;let lastX=-1e9;const labs=[];es.forEach((e,i)=>{const x=X(i);if(x-lastX>=gap){labs.push(i);lastX=x}});
  if(labs[labs.length-1]!==n-1){if(n>1&&X(n-1)-X(labs[labs.length-1])<gap)labs.pop();labs.push(n-1)}
  labs.forEach((i,k)=>{const d=md&&(k===0||dayKey(es[i].t)!==dayKey(es[labs[k-1]].t));g+=`<text x="${X(i)}" y="${H-10}" text-anchor="${d&&n>1&&i===n-1?"end":"middle"}">${d?fmtD(es[i].t)+" ":""}${fmtT(es[i].t)}</text>`});
  // paused time is squeezed out of the x-axis; a dashed line marks where each pause was
  (s.pauses||[]).filter(p=>p.from>t0&&p.from<t1).forEach(p=>{const x=XT(p.from),m=Math.round(((p.to??Date.now())-p.from)/6e4);g+=`<line x1="${x}" x2="${x}" y1="${pt}" y2="${H-pb}" stroke="var(--warn)" stroke-dasharray="3 4"/><text x="${x+4}" y="${pt+10}" style="fill:var(--warn)">paused ${m} min</text>`});
  const pts=y.map((v,i)=>`${X(i)},${Y(v)}`).join(" ");
  g+=`<polygon points="${X(0)},${H-pb} ${pts} ${X(n-1)},${H-pb}" fill="var(--accent-soft)" stroke="none"/><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.25" stroke-linejoin="round"/>`;
  y.forEach((v,i)=>{g+=`<circle cx="${X(i)}" cy="${Y(v)}" r="${i===n-1?5.5:4}" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"><title>${md?fmtD(es[i].t)+" ":""}${fmtT(es[i].t)} · Lv ${esc(es[i].lv)} ${esc(es[i].pct)}%</title></circle>`});
  svg.innerHTML=g;
}
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x)));const f=x/p;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p}
function fmtP(v){return Number.isInteger(v)?String(v):v.toFixed(1)}
function renderLog(s){
  const es=[...s.entries].sort((a,b)=>a.t-b.t);const base=es.length?es[0].lv:0,md=multiDay(es);
  $("logTable").querySelector("tbody").innerHTML=es.map((e,i)=>{let rate="";if(i>0){const q=es[i-1],h=activeH(s,q.t,e.t);rate=h>0?pct((cumulative(e,base)-cumulative(q,base))/h/(lvExp(e.lv)||100)*100):"–"}
    return `<tr data-t="${esc(e.t)}" style="cursor:default"><td>${md?fmtD(e.t)+" ":""}${fmtT(e.t)}</td><td>${esc(e.lv)}</td><td>${e.pct.toFixed(2)}%</td><td>${e.jpct!=null?e.jpct.toFixed(2)+"%":"–"}</td><td>${rate}</td><td><button class="small danger" data-del="${esc(e.t)}" aria-label="Delete entry">✕</button></td></tr>`}).reverse().join("")
    ||`<tr><td colspan="6" class="name muted">No entries yet. Add your current level and EXP %.</td></tr>`;
  $("setupNote").textContent=s.job&&s.job!==state.job?`This session was logged as ${s.job}. Switch Job to ${s.job} to see its pace and walking time.`:"";
}
function renderCompare(){
  const rows=state.sessions.map(s=>{const st=stats(s);if(!st)return null;const ms=sessMobs(s),mix=sessMix(s);const kph=mix&&st.avgRaw>0&&mix.avg(m=>m.exp)>0?st.avgRaw/(mix.avg(m=>m.exp*expRace(m))*expMul(s)):null;
    return `<tr data-sid="${esc(s.id)}" class="${s.id===state.current?"sel":""}"><td class="name">${esc(s.name)}</td><td class="name">${esc(s.job||"–")}</td><td class="name">${ms.length?ms.map(m=>esc(m.name)).join(", "):"–"}</td><td>${fmtD(st.es[0].t)} ${fmtT(st.es[0].t)}</td><td>${st.spanMin} min</td><td><b>${pct(st.avgPct)}</b></td><td>${fmtN(st.avgRaw/60)}</td><td>${kph?fmtN(kph):"–"}</td><td>${kph?(3600/kph).toFixed(1)+"s":"–"}</td></tr>`}).filter(Boolean);
  $("cmpTable").querySelector("tbody").innerHTML=rows.join("")||'<tr><td colspan="9" class="name muted">Sessions with 2+ entries show up here.</td></tr>';
}
function renderGoal(s,st){
  const tiles=$("goalTiles");
  if(!st||st.avgRaw<=0){tiles.innerHTML='<div class="note">Log 2+ entries with EXP going up to see goal estimates.</div>';$("goalNote").textContent="";return}
  const curLv=st.last.lv,goal=num(state.goalLv)||(curLv<70?70:curLv+1);
  if(goal<=curLv){tiles.innerHTML=`<div class="note">You're already Lv ${curLv}. Pick a higher level.</div>`;$("goalNote").textContent="";return}
  let need=lvExp(curLv)?lvExp(curLv)*(1-st.last.pct/100):null;for(let l=curLv+1;l<goal&&need!=null;l++)need=lvExp(l)?need+lvExp(l):null;
  if(need==null){tiles.innerHTML='<div class="note">The EXP table covers Lv 1 to 70, so pick a goal up to Lv 71.</div>';$("goalNote").textContent="";return}
  const hrs=need/st.avgRaw;
  $("goalNote").textContent=`at your ${pct(st.avgPct)}/hr average`;
  tiles.innerHTML=`<div class="tile"><div class="k">EXP still needed</div><div class="v mono">${fmtN(need)}</div><div class="s">from Lv ${curLv} ${st.last.pct.toFixed(2)}% to Lv ${goal}</div></div>
   <div class="tile"><div class="k">Farming time</div><div class="v mono">${fmtDur(hrs)}</div><div class="s">at ${fmtN(st.avgRaw)} EXP/hr</div></div>
   <div class="tile now"><div class="k">Reach Lv ${goal}</div><div class="v mono">${new Date(Date.now()+hrs*36e5).toLocaleString("en-GB",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div><div class="s">farming non-stop from now</div></div>`;
  // one straight run per level at the average rate, flatter as levels need more EXP
  const p=st.last.pct,pts=[{h:0,v:curLv+p/100,now:`Lv ${curLv} ${p.toFixed(2)}%`}];let h=lvExp(curLv)*(1-p/100)/st.avgRaw,each=h;
  for(let l=curLv+1;l<=goal;l++){pts.push({h,v:l,lv:l,each});if(l<goal){each=lvExp(l)/st.avgRaw;h+=each}}
  return {pts,lo:curLv,hi:goal,name:"Lv",color:"var(--accent)"};
}
// job level goal: job EXP still needed at the job EXP/hr you farm at your current job level
function renderJobGoal(s){
  const tiles=$("goalJobTiles"),wrap=$("goalJobWrap");wrap.hidden=true;
  const t=JOB_EXP[jobTier()],cap=t.length,jl=num(C().jobLv),j=jobRate(s),need0=jobNeed();
  const msg=m=>{tiles.innerHTML=`<div class="note">${m}</div>`};
  if(!jl)return msg("Set your job level on the Character tab to see job level estimates.");
  if(jl===cap)return msg(`Job Lv ${cap} is the max for ${state.job}.`);
  if(!j||j.rate<=0)return msg("Log Job EXP % on 2+ entries to see job level estimates.");
  if(!need0)return msg(`Job Lv ${jl} is outside the ${state.job} job EXP table (up to Job Lv ${cap}).`);
  const goal=num(state.goalJobLv)||(jl<cap?cap:jl+1);
  if(goal<=jl)return msg(`You're already Job Lv ${jl}. Pick a higher job level.`);
  if(goal>cap)return msg(`${state.job} job levels go up to ${cap}, so pick a goal up to Job Lv ${cap}.`);
  const rate=j.rate/100*need0,at=x=>new Date(Date.now()+x*36e5).toLocaleString("en-GB",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}),dur=x=>fmtDur(x).split("\n")[0];
  let need=need0*(1-j.last/100),rows=[];rows.push({lv:jl+1,each:need/rate,h:need/rate});
  for(let l=jl+1;l<goal;l++){need+=t[l-1];const each=t[l-1]/rate;rows.push({lv:l+1,each,h:rows[rows.length-1].h+each})}
  const hrs=need/rate;
  tiles.innerHTML=`<div class="tile"><div class="k">Job EXP still needed</div><div class="v mono">${fmtN(need)}</div><div class="s">from Job Lv ${jl} ${j.last.toFixed(2)}% to Job Lv ${goal}</div></div>
   <div class="tile"><div class="k">Farming time</div><div class="v mono">${fmtDur(hrs)}</div><div class="s">at ${fmtN(rate)} job EXP/hr</div></div>
   <div class="tile now"><div class="k">Reach Job Lv ${goal}</div><div class="v mono">${at(hrs)}</div><div class="s">farming non-stop from now</div></div>`;
  const tb=$("goalJobTable");wrap.hidden=false;
  tb.tHead.innerHTML=`<tr><th>Job level</th><th>Time for this level</th><th>Total farming</th><th>Reached, farming non-stop</th></tr>`;
  tb.tBodies[0].innerHTML=rows.map(q=>`<tr><td class="name">Job Lv ${q.lv}</td><td>${dur(q.each)}</td><td>${dur(q.h)}</td><td>${at(q.h)}</td></tr>`).join("");
  return {pts:[{h:0,v:jl+j.last/100,now:`Job Lv ${jl} ${j.last.toFixed(2)}%`},...rows.map(q=>({h:q.h,v:q.lv,lv:q.lv,each:q.each}))],lo:jl,hi:goal,name:"Job Lv",color:"var(--good)"};
}
// projected base level (left axis) and job level (right axis) over farming hours at the average rates.
// Each level-up gets the date you would reach it farming non-stop from now.
let GOAL_PTS=[];
function renderGoalChart(base,job){
  const sers=[base,job].filter(Boolean);$("goalViz").hidden=!sers.length;$("goalWrap").hidden=!base;GOAL_PTS=[];if(!sers.length)return;
  const svg=$("goalChart");const W=800,H=260,pl=base?52:18,pr=job?62:18,pt=24,pb=34;
  const now=Date.now();
  const dur=x=>fmtDur(x).split("\n")[0];
  const at=x=>new Date(now+x*36e5).toLocaleString("en-GB",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
  const hi=Math.max(...sers.map(S=>S.pts[S.pts.length-1].h))||1;const X=x=>pl+x/hi*(W-pl-pr),YS=S=>v=>pt+(S.hi-v)/(S.hi-S.lo)*(H-pt-pb);
  let g="";
  // level gridlines and labels: base on the left, job on the right
  sers.forEach(S=>{const Y=YS(S),ls=Math.max(1,Math.ceil((S.hi-S.lo)/6)),left=S===base;
    for(let l=S.lo;l<=S.hi;l+=ls)g+=(S===sers[0]?`<line x1="${pl}" x2="${W-pr}" y1="${Y(l)}" y2="${Y(l)}" stroke="var(--grid)" stroke-dasharray="4 4"/>`:"")+`<text x="${left?pl-8:W-pr+8}" y="${Y(l)+4}" text-anchor="${left?"end":"start"}" style="fill:${S.color}">${left?"Lv":"Job"} ${l}</text>`});
  const xs=niceStep(hi/5);for(let i=0;i*xs<=hi+1e-9;i++){const x=i*xs;if(X(x)>W-pr-30&&x<hi)continue;g+=`<text x="${X(x)}" y="${H-10}" text-anchor="middle">${fmtP(+x.toFixed(2))}h</text>`}
  g+=`<line id="goalHair" y1="${pt}" y2="${H-pb}" stroke="var(--muted)" stroke-width="1" visibility="hidden"/>`;
  sers.forEach((S,si)=>{const Y=YS(S),pts=S.pts,end=pts[pts.length-1];
    pts.forEach((q,i)=>{q.x=X(q.h);q.y=Y(q.v);q.eta=at(q.h);
      q.tip=i?`<b>${S.name} ${q.lv}</b><br>${dur(q.each)} for this level · ${dur(q.h)} total<br>${q.eta} farming non-stop`:`<b>Now</b><br>${q.now}`});
    const line=pts.map(q=>`${q.x},${q.y}`).join(" ");
    if(S===base)g+=`<polygon points="${X(0)},${H-pb} ${line} ${end.x},${H-pb}" fill="var(--accent-soft)" stroke="none"/>`;
    g+=`<polyline points="${line}" fill="none" stroke="${S.color}" stroke-width="2" stroke-linejoin="round"/>`;
    if(pts.length<=30)pts.forEach((q,i)=>{g+=`<circle cx="${q.x}" cy="${q.y}" r="${i&&i<pts.length-1?4:5.5}" fill="${S.color}" stroke="var(--surface)" stroke-width="2"/>`});
    // end label: right of the point when there's room, else above it (first line) or below it (second) so they don't collide
    const lab=`${S.name} ${S.hi} · ${dur(end.h)}`;
    g+=end.x<W-pr-200?`<text x="${end.x+10}" y="${end.y+4}" style="fill:var(--fg)">${lab}</text>`:`<text x="${end.x-8}" y="${si?end.y+20:end.y-10}" text-anchor="end" style="fill:var(--fg)">${lab}</text>`;
    GOAL_PTS.push(...pts)});
  svg.innerHTML=g;
  if(base){const t=$("goalTable");
    t.tHead.innerHTML=`<tr><th>Level</th><th>Time for this level</th><th>Total farming</th><th>Reached, farming non-stop</th></tr>`;
    t.tBodies[0].innerHTML=base.pts.slice(1).map(q=>`<tr><td class="name">Lv ${q.lv}</td><td>${dur(q.each)}</td><td>${dur(q.h)}</td><td>${q.eta}</td></tr>`).join("")}
}
// hover the goal chart: snap to the nearest level-up on either line and show its tooltip
(function goalHover(){
  const svg=$("goalChart"),tip=$("goalTip");
  const hide=()=>{tip.hidden=true;const hr=$("goalHair");if(hr)hr.setAttribute("visibility","hidden")};
  svg.addEventListener("pointermove",e=>{if(!GOAL_PTS.length)return;const r=svg.getBoundingClientRect(),k=r.width/800,px=(e.clientX-r.left)/k,py=(e.clientY-r.top)/k;
    const d=q=>Math.hypot(q.x-px,(q.y-py)/2),q=GOAL_PTS.reduce((a,b)=>d(b)<d(a)?b:a);
    const hr=$("goalHair");hr.setAttribute("x1",q.x);hr.setAttribute("x2",q.x);hr.setAttribute("visibility","visible");
    tip.innerHTML=q.tip;tip.hidden=false;const w=tip.offsetWidth/2;tip.style.left=Math.min(Math.max(q.x*k,w),r.width-w)+"px";tip.style.top=q.y*k+"px"});
  svg.addEventListener("pointerleave",hide);
})();

// ---- render: monsters ----
const calcMob=()=>MOBS.find(m=>m.id===(state.calcMobId||cur().mobIds[0]));
const colText=(m,k)=>k==="name"?m.name:k==="el"?(m.el||"")+" "+(m.elv||""):k==="size"?({S:"small S",M:"medium M",L:"large L"}[m.size]||""):k==="race"?(m.race||""):k==="topN"?m.om.map(x=>[x[0],...(MAPNAMES[x[0]]||[])].join(" ")).join(" "):null;
const colNum=(m,k)=>{if(["name","el","size","race"].includes(k))return null;if(m.expUnknown&&["exp","ratio","epm"].includes(k))return null;if(k==="dodge")return m.dodge;if(k==="hpm")return m.hpm;if(k==="zk")return hasLoot(m)?m.zk:null;const v=m[k];return typeof v==="number"&&!isFinite(v)?null:v};
function matchF(expr,n,text){
  expr=String(expr).trim().toLowerCase();if(!expr)return true;
  const parts=expr.split(/\s+or\s+|\||,/).map(x=>x.trim()).filter(Boolean);if(parts.length>1)return parts.some(p=>matchF(p,n,text));
  const blank=n==null||(typeof n==="number"&&!isFinite(n));
  if(/^(-|–|blank|empty|none)$/.test(expr))return blank&&!text;
  let m;
  if(m=expr.match(/^(<=|>=|<|>|=)\s*(-?\d+(?:\.\d+)?)%?$/)){const v=+m[2];if(blank)return false;return m[1]==="<"?n<v:m[1]==="<="?n<=v:m[1]===">"?n>v:m[1]===">="?n>=v:n==v}
  if(m=expr.match(/^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/)){if(blank)return false;return n>=+m[1]&&n<=+m[2]}
  if(/^-?\d+(?:\.\d+)?$/.test(expr)&&!blank&&!text)return n==+expr;
  return String(text??n??"").toLowerCase().includes(expr);
}
const isMagicAtk=()=>C().a.type==="magic"||C().a.type==="spellfist";
function renderMobs(){
  const w=walkSec();const lvMin=num(state.minLv),lvMax=num(state.maxLv)||999;
  let rows=MOBS.filter(m=>!m.boss&&m.lv>=lvMin&&m.lv<=lvMax&&!(state.hideClosed&&SPAWN[m.id]&&!openMaps(m).length)).map(m=>{const om=openMaps(m);return {...m,om,topN:om.length?om[0][1]:0,ratio:m.hp>0?m.exp/m.hp:0,...mobRow(m,w)}});
  const F=state.filters;rows=rows.filter(m=>Object.entries(F).every(([k,v])=>!v||matchF(v,colNum(m,k),colText(m,k))));
  const k=state.sort,d=state.dir;const sv=m=>{const v=k==="name"||k==="el"||k==="size"||k==="race"?colText(m,k):colNum(m,k);return v==null||v===""?null:v};
  rows.sort((a,b)=>{const x=sv(a),y=sv(b);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return (x>y?1:x<y?-1:0)*d});
  document.querySelectorAll("#mobTable th").forEach(th=>th.classList.toggle("on",th.dataset.k===k));
  const sel=(calcMob()||{}).id;
  $("mobNote").textContent=`${rows.length} monsters · ${state.job} · ${isMagicAtk()?"MATK":"ATK"} ${fmtN(sumStat(isMagicAtk()?C().matkTxt:C().atkTxt))} · ${convOn()?"best converter per monster":atkEl()}`;
  $("mobTable").querySelector("tbody").innerHTML=rows.slice(0,400).map(m=>`<tr data-id="${m.id}" class="${m.id===sel?"sel":""}"><td class="name">${esc(m.name)}${isSkipped(m)?' <span class="pill down">skipped</span>':""}</td><td>${m.lv}</td><td>${m.el?`<span class="el ${m.el}">${m.el} ${m.elv}</span>`:"–"}</td><td>${m.size||"–"}</td><td class="name">${m.race||"–"}</td><td>${fmtN(m.hp)}</td><td>${fmtExp(m)}</td><td>${m.expUnknown?"?":m.ratio.toFixed(2)}</td>
    <td class="${m.mult>100?"good":m.mult<=0?"bad":""}">${m.mult<=0?"can't hurt":Math.round(m.mult)+"%"}${elTag(m.el2)}</td><td class="${m.hitc>=95?"good":m.hitc>=70?"warnc":"bad"}">${Math.round(m.hitc)}%</td><td>${isFinite(m.uses)?m.uses.toFixed(1):"–"}</td>
    <td class="${m.sec<=3?"good":m.sec<=8?"warnc":"bad"}">${isFinite(m.sec)?m.sec.toFixed(1)+"s":"–"}</td><td><b>${m.epm?fmtN(m.epm):"–"}</b></td>
    <td class="${m.dodge==null?"":m.dodge>=70?"good":m.dodge>=40?"warnc":"bad"}">${m.dodge==null?"–":m.dodge+"%"}</td><td>${m.hpm==null?"–":fmtN(m.hpm)}</td><td>${hasLoot(m)?fmtN(m.zk):"–"}</td>
    <td class="name">${m.om.length?`<span class="map" title="${esc(m.om.map(x=>mapLabel(x[0])+" ≈"+x[1]).join(", "))}"><b>${mapCode(m.om[0][0])}</b><span>≈${m.om[0][1]}</span></span>`:'<span class="note">none open</span>'}</td><td><a href="${dbUrl(m)}" target="_blank" rel="noopener" title="rozerodb">↗</a></td></tr>`).join("")
    ||'<tr><td colspan="18" class="name muted">No monsters match these filters.</td></tr>';
  renderMobTiles();
}
// selling trips spread over each kill (weight); hidden when it rounds to nothing
const sellTxt=(s,pre,post="")=>s>=0.05&&isFinite(s)?`${pre}${s.toFixed(1)}s${post}`:s===Infinity?`${pre}<span class="bad">over your sell point</span>`:"";
function weightTile(m){const t=tripInfo(m,walkSec());if(!t)return "";const c=C(),at=num(c.sellAt)===90?90:70;
  const pctNow=num(c.maxW)?Math.round(num(c.curW)/num(c.maxW)*100):0;
  const v=!(t.wk>0)?"–":isFinite(t.kills)?`${fmtN(Math.floor(t.kills))} kills`:'<span class="bad">sell first</span>';
  return `<div class="tile"><div class="k">Weight · sell at ${t.fell?70:at}%</div><div class="v mono">${v}</div><div class="s">${t.wk>0?`${t.wk.toFixed(1)} weight per kill`:"its drops weigh nothing"}${isFinite(t.kills)&&t.wk>0?` · ${fmtDur(t.min/60)} a trip + ${fmtN(num(c.townMin,3))} min to town`:""} · now ${pctNow}%${t.fell?' · <span class="bad">no regen past 70% and you need SP, so you sell at 70%</span>':""}</div></div>`}
function renderMobTiles(){
  const m=calcMob();if(!m){$("mobTiles").innerHTML='<div class="note">Click a monster to see it here.</div>';return}
  const r=mobRow(m,walkSec());const s=cur();const L=lvExp(num(C().baseLv))||null;const om=openMaps(m);
  $("mobTiles").innerHTML=`<div class="tile now"><div class="k">${esc(m.name)} · Lv ${m.lv}</div><div class="v mono">${r.epm?fmtN(r.epm):"–"}</div><div class="s">${m.expUnknown?"EXP unknown (rozerodb has none yet) · ":""}EXP/min${r.el2&&convOn()?` with ${r.el2} converter`:""} · ${isFinite(r.sec)?r.sec.toFixed(1)+"s fight + "+walkSec().toFixed(1)+"s walk"+sellTxt(r.tot-r.sec-walkSec()," + "," selling"):"can't hurt it"}${L&&r.epm?` · ~${pct(r.epm*60/L*100)}/hr at Lv ${C().baseLv}`:""}</div></div>
   <div class="tile"><div class="k">Per kill</div><div class="v mono">${isFinite(r.uses)?r.uses.toFixed(1):"–"} uses</div><div class="s">${fmtN(withEl(r.el2,()=>dmgPerHit(m)))} per hit · ${Math.round(r.hitc)}% land · ${fmtN(num(C().a.sp)*spCostMul()*r.uses/targets())} SP</div></div>
   <div class="tile"><div class="k">Defence</div><div class="v mono">${r.hpm==null?"–":fmtN(r.hpm)}</div><div class="s">HP lost/min · you dodge ${r.dodge??"–"}% · DEF ${m.def??"–"} · MDEF ${m.mdef??"–"}</div></div>
${weightTile(m)}
   <div class="tile"><div class="k">Maps</div><div class="v mono">${om.length?mapCode(om[0][0]):"–"}</div><div class="s">${om.length?om.slice(0,4).map(x=>`${esc(mapLabel(x[0]))} ≈${x[1]}`).join(" · "):"none open"} · <a href="${dbUrl(m)}" target="_blank" rel="noopener">rozerodb ↗</a></div></div>
   <div class="bar" style="grid-column:1/-1">${s.mobIds.includes(m.id)?'<span class="pill up">In this session</span> <button type="button" class="small" id="dropMobBtn">Remove from session</button>':`<button type="button" class="primary" id="useMobBtn">${s.mobIds.length?`Also killing ${esc(m.name)}`:`Farming ${esc(m.name)} now`}</button>`}</div>`;
  const b=$("useMobBtn");if(b)b.addEventListener("click",()=>{toggleSessMob(m.id);state.calcMobId=null;save();renderAll()});
  const d=$("dropMobBtn");if(d)d.addEventListener("click",()=>{toggleSessMob(m.id);save();renderAll()});
}
const UNK_PILL=' <span class="pill down" title="rozerodb has no EXP for it yet, so it\'s left out of EXP / min">EXP ?</span>';
function renderBest(){
  const min=num($("bestMin").value),lim=num($("bestN").value,10);const w=walkSec();const s=cur(),st=stats(s);const curMap=currentMap();
  const curEpm=curMap?sessEpm(s,w):null;
  const rows=Object.keys(MAPMOBS).filter(mp=>!isClosed(mp)).map(mp=>mapStats(mp,w)).filter(r=>r&&r.N>=min);
  rows.sort((a,b)=>b.epm-a.epm);rows.forEach((r,i)=>r.rank=i+1);rows.splice(lim);
  const bk=state.bestSort||"epm",bd=state.bestDir||-1;const val=r=>bk==="mp"?mapCode(r.mp):r[bk];
  rows.sort((a,b)=>{const x=val(a),y=val(b);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return (x>y?1:x<y?-1:0)*bd});
  document.querySelectorAll("#bestTable th").forEach(th=>th.classList.toggle("on",th.dataset.bk===bk&&th.textContent!=="Projected"));
  $("bestBasis").textContent=`${state.job} · ${C().a.name||"attack"} · ${convOn()?"best converter per map":atkEl()} · walking ~${w.toFixed(1)}s/kill`+(curEpm&&st?` · compared with your session on ${mapCode(curMap)} at ${pct(st.avgPct)}/hr`:"");
  const sameJob=(s.job||state.job)===state.job;
  $("bestTable").querySelector("tbody").innerHTML=rows.map(r=>{
    const main=MAPMOBS[r.mp].filter(x=>!x.m.boss&&!isSkipped(x.m)).sort((a,b)=>b.n-a.n).slice(0,3).map(x=>`<div>${esc(x.m.name)} <span class="note">×${x.n}</span>${x.m.expUnknown?UNK_PILL:""}</div>`).join("");
    const proj=st&&sameJob&&curEpm?st.avgPct*r.epm/curEpm:null;
    return `<tr data-map="${r.mp}" class="${r.mp===curMap?"sel":""}"><td>${r.rank}</td><td class="name"><b class="mono">${mapCode(r.mp)}</b> <span class="note">${esc(mapName(r.mp))}</span>${r.mp===curMap?' <span class="pill">current</span>':""}${elTag(r.el2)}</td><td class="name mainmobs">${main}</td><td><b>${fmtN(r.epm)}</b></td><td>${r.sec.toFixed(1)}s + ${r.walk.toFixed(1)}s${sellTxt(r.sell," + ")}</td><td>${fmtN(r.epk)}</td><td>${fmtN(r.zph)}</td><td>${r.hpm==null?"–":fmtN(r.hpm)}</td><td>${r.skip?`<span class="pill down" title="${esc(r.skipNames.join(", "))}">${r.skip}</span>`:"–"}</td><td>≈${r.N}</td><td>${proj==null?"–":"~"+proj.toFixed(1)+"%/hr"}</td></tr>`}).join("")
    ||'<tr><td colspan="11" class="name muted">No open maps match.</td></tr>';
}
// ---- render: Zeny Hunter ----
const itemName=id=>ITEMN[id]||"#"+id;
// each drop with its chance, NPC price and any market price; the level penalty leads when it applies
const npcTag=id=>npcSell(id)>0?`NPC ${fmtN(npcSell(id))} z`:"";
const dropNames=m=>(penNote(m)?penNote(m)+" · ":"")+(m.drops||[]).map(([id,ch])=>`${itemName(id)} ${ch}%${[npcTag(id),state.prices[id]>0?`players ${fmtN(state.prices[id])} z`:"",looted(id)?"":"not looted"].filter(Boolean).map(x=>` (${x})`).join("")}`).join(", ");
// a monster's whole drop list: chance after your drop bonus and the level penalty, and what each adds per kill; drops you don't loot sink to the bottom
const dropZTxt=z=>z>=10?fmtN(z):z>0&&z<0.01?"<0.01":z.toFixed(z>=1?1:2);
const dropList=m=>(m.drops||[]).map(([id,ch])=>({id,ch,z:dropZ(m,id,ch),on:looted(id)})).sort((a,b)=>b.on-a.on||b.z-a.z)
  .map(d=>`<div class="drop${d.on?"":" off"}"><a href="#" data-pitem="${esc(d.id)}" title="${d.ch}% base${npcSell(d.id)>0?` · NPC pays ${fmtN(npcSell(d.id))} z`:""} · click to set a market price">${esc(itemName(d.id))}</a> <span class="note">${+Math.min(100,d.ch*dropMul()*penMul(m)).toFixed(2)}% · ${d.on?dropZTxt(d.z)+" z/kill":"not looted"}</span>${state.prices[d.id]>0?` <b>${fmtN(state.prices[d.id])} z</b>`:""}</div>`).join("");
// a map's monsters, hunted ones first; click one to stop or start hunting it
const huntPicker=(r,w)=>`<div class="note">hunting ${r.earn.length} of ${r.mobs.length}${r.tele?` · teleport ~${r.tele.toFixed(1)}×/kill`:r.walk>w*1.01?` · walk ${r.walk.toFixed(1)}s/kill`:""}${r.manual?` · set by you · <a href="#" data-hreset="${esc(r.mp)}">reset</a>`:state.huntAuto?" · best-paying":""} · <a href="#" data-notele="${esc(r.mp)}" title="rozerodb doesn't say which maps block teleport: click to mark this one">${noTele(r.mp)?"no teleport":"teleport ok"}</a></div>`
  +r.mobs.map(x=>`<div><a href="#" class="hpick${x.on?"":" off"}" data-hpick="${esc(r.mp)}" data-hmob="${x.m.id}" title="${esc(dropNames(x.m))} · click to ${x.on?"pass it by":"hunt it"}">${x.on?"✓":"✕"} ${esc(x.m.name)}</a> <span class="note">×${x.n} · ${fmtN(x.zk)} z${dropPenalty(x.m)?` · drops −${dropPenalty(x.m)}%`:""}</span></div>`).join("");
// market prices: one row per priced item with its best drop chance
const DROPPERS={};MOBS.forEach(m=>(m.drops||[]).forEach(([id,ch])=>{const d=DROPPERS[id];if(!m.boss&&(!d||ch>d.ch))DROPPERS[id]={m,ch}}));
function renderPrices(){
  if($("priceTable").contains(document.activeElement))return;// don't rebuild the box you're typing in
  const ids=Object.keys(state.prices).sort((a,b)=>itemName(a).localeCompare(itemName(b)));
  $("priceTable").querySelector("tbody").innerHTML=ids.map(id=>{const d=DROPPERS[id];return `<tr><td class="name">${esc(itemName(id))} <span class="note">#${esc(id)}</span></td><td><input type="number" min="0" step="100" data-price="${esc(id)}" value="${state.prices[id]||""}" placeholder="zeny" style="width:120px"></td><td><input type="number" min="0" step="1" data-npc="${esc(id)}" value="${state.npcPrices[id]??""}" placeholder="${NPCSELL[id]!=null?fmtN(NPCSELL[id])+" (rozerodb)":"0"}" title="${NPCSELL[id]!=null?`rozerodb NPC price ${fmtN(NPCSELL[id])} z; type to override`:"no NPC price known; counts as 0"}" style="width:130px"></td><td class="name">${d?`${esc(d.m.name)} <span class="note">${d.ch}%</span>`:"–"}</td><td><button type="button" class="small" data-unprice="${esc(id)}">Remove</button></td></tr>`}).join("")
    ||'<tr><td colspan="5" class="name muted">No market prices yet. Add an item above, or click a drop in the Monsters list.</td></tr>';
}
// ---- render: Monster info and Item info ----
const GROUP_NAME=Object.fromEntries(LOOT_GROUPS);
const groupOf=id=>ITEMTYPE[id]||"e";
const yourCh=(m,ch)=>+Math.min(100,ch*dropMul()*penMul(m)).toFixed(2);
const infoMob=()=>MOBS.find(m=>m.id===state.infoMobId)||calcMob()||MOBS.find(m=>m.id===1002);
function renderMobInfo(){
  const m=infoMob();if(!m)return;
  if(document.activeElement!==$("mobInfoInput"))$("mobInfoInput").value=m.name;
  $("mobInfoDb").href=dbUrl(m);
  const r=mobRow(m,walkSec());
  $("mobInfoTiles").innerHTML=`<div class="tile now"><div class="k">${esc(m.name)} · Lv ${m.lv}</div><div class="v mono">${fmtN(m.hp)} HP</div><div class="s">${m.el?`${m.el} ${m.elv}`:"element –"} · ${m.size||"size –"} · ${m.race||"race –"}${m.boss?" · boss":""}${m.agg?" · aggressive":""}</div></div>
   <div class="tile"><div class="k">EXP</div><div class="v mono">${fmtExp(m)}</div><div class="s">${m.expUnknown?"rozerodb has no EXP for it yet":`job ${fmtN(m.job)} · ${(m.exp/m.hp).toFixed(2)} base EXP per HP`}</div></div>
   <div class="tile"><div class="k">Stats</div><div class="v mono">DEF ${m.def??"–"} · MDEF ${m.mdef??"–"}</div><div class="s">ATK ${m.atkMin??"–"}–${m.atkMax??"–"} · VIT ${m.vit??"–"} · INT ${m.int??"–"}${m.hit100?` · 100% hit at ${m.hit100} HIT`:""}${m.flee95?` · 95% flee at ${m.flee95} FLEE`:""}</div></div>
   <div class="tile"><div class="k">You vs it (${esc(state.job)})</div><div class="v mono">${isFinite(r.sec)?r.sec.toFixed(1)+"s / kill":"can't hurt"}</div><div class="s">your hit ${Math.round(r.mult)}%${elTag(r.el2)} · ${Math.round(r.hitc)}% land · you dodge ${r.dodge??"–"}%${r.hpm==null?"":` · HP lost ~${fmtN(r.hpm)}/min`}</div></div>
   <div class="tile"><div class="k">EXP / min</div><div class="v mono">${m.expUnknown?"?":r.epm?fmtN(r.epm):"–"}</div><div class="s">fight + ${walkSec().toFixed(1)}s walking per kill</div></div>
   <div class="tile"><div class="k">Zeny / kill</div><div class="v mono">${hasLoot(m)?fmtN(r.zk):"–"}</div><div class="s">${penNote(m)||"no drop level penalty"}${num(state.dropBonus)?` · drop rate +${num(state.dropBonus)}%`:""}</div></div>`;
  $("mobInfoDrops").tBodies[0].innerHTML=(m.drops||[]).map(([id,ch])=>({id,ch,z:dropZ(m,id,ch)})).sort((a,b)=>b.z-a.z||b.ch-a.ch).map(d=>`<tr class="${looted(d.id)?"":"muted"}"><td class="name"><a href="#" data-pitem="${esc(d.id)}" title="click to set a market price">${esc(itemName(d.id))}</a> <span class="note">#${esc(d.id)}</span></td><td class="name">${GROUP_NAME[groupOf(d.id)]}${looted(d.id)?"":" (not looted)"}</td><td>${d.ch}%</td><td>${yourCh(m,d.ch)}%</td><td>${NPCSELL[d.id]==null?"–":fmtN(npcPays(d.id))}</td><td>${state.prices[d.id]>0?fmtN(state.prices[d.id]):"–"}</td><td>${looted(d.id)?dropZTxt(d.z):"0"}</td></tr>`).join("")
    ||'<tr><td colspan="7" class="name muted">rozerodb lists no drops for it.</td></tr>';
  $("mobInfoMaps").tBodies[0].innerHTML=(SPAWN[m.id]||[]).slice().sort((a,b)=>b[1]-a[1]).map(([mp,n])=>`<tr data-map="${esc(mp)}"><td class="name"><b class="mono">${mapCode(mp)}</b> <span class="note">${esc(mapName(mp))}</span>${isClosed(mp)?' <span class="pill down">closed</span>':""}</td><td>≈${n}</td><td class="name">${(MAPMOBS[mp]||[]).filter(x=>x.m.id!==m.id).sort((a,b)=>b.n-a.n).slice(0,5).map(x=>`${esc(x.m.name)} <span class="note">×${x.n}</span>`).join(", ")||"–"}</td></tr>`).join("")
    ||'<tr><td colspan="3" class="name muted">No spawns known.</td></tr>';
}
// every monster that drops each item, best chance first
const ITEM_DROPS={};MOBS.forEach(m=>(m.drops||[]).forEach(([id,ch])=>(ITEM_DROPS[id]=ITEM_DROPS[id]||[]).push({m,ch})));
Object.values(ITEM_DROPS).forEach(l=>l.sort((a,b)=>b.ch-a.ch));
function renderItems(){
  const q=$("itemSearch").value.trim().toLowerCase(),g=$("itemGroup").value,k=$("itemSort").value;
  const hit=Object.keys(ITEM_DROPS).filter(id=>(!g||groupOf(id)===g)&&(!q||itemName(id).toLowerCase().includes(q)||("#"+id).includes(q)));
  const key={npc:id=>-npcSell(id),players:id=>-(state.prices[id]||0),best:id=>-ITEM_DROPS[id][0].ch,name:()=>0}[k]||(id=>-npcSell(id));
  hit.sort((a,b)=>key(a)-key(b)||itemName(a).localeCompare(itemName(b)));
  const sel=state.infoItem&&ITEM_DROPS[state.infoItem]?String(state.infoItem):null;
  $("itemTable").tBodies[0].innerHTML=hit.slice(0,300).map(id=>{const b=ITEM_DROPS[id][0];return `<tr data-item="${esc(id)}" class="${id===sel?"sel":""}"><td class="name">${esc(itemName(id))} <span class="note">#${esc(id)}</span></td><td class="name">${GROUP_NAME[groupOf(id)]}${looted(id)?"":' <span class="note">not looted</span>'}</td><td>${NPCSELL[id]==null?"–":fmtN(npcPays(id))}</td><td>${state.prices[id]>0?fmtN(state.prices[id]):`<a href="#" data-pitem="${esc(id)}">set</a>`}</td><td class="name">${esc(b.m.name)} <span class="note">${b.ch}%</span></td><td>${ITEM_DROPS[id].length}</td></tr>`}).join("")
    +(hit.length>300?`<tr><td colspan="6" class="name muted">${hit.length-300} more: narrow the search</td></tr>`:"")
    ||'<tr><td colspan="6" class="name muted">No items match.</td></tr>';
  if(!sel){$("itemTiles").innerHTML='<div class="note">Click an item to see every monster that drops it.</div>';$("itemDroppers").innerHTML="";return}
  const ds=ITEM_DROPS[sel],open=ds.filter(d=>!d.m.boss&&openMaps(d.m).length);
  $("itemTiles").innerHTML=`<div class="tile now"><div class="k">${esc(itemName(sel))} · #${esc(sel)}</div><div class="v mono">${NPCSELL[sel]==null&&state.npcPrices[sel]==null?"–":fmtN(npcPays(sel))+" z"}</div><div class="s">NPC pays${skRate("overcharge")?` with Overcharge +${skRate("overcharge")}%`:""}${state.npcPrices[sel]!=null?" (your price)":NPCSELL[sel]==null?" (rozerodb has none)":" (rozerodb)"} · ${GROUP_NAME[groupOf(sel)]}${looted(sel)?"":" · not auto looted"}</div></div>
   <div class="tile"><div class="k">Players pay</div><div class="v mono">${state.prices[sel]>0?fmtN(state.prices[sel])+" z":"–"}</div><div class="s"><a href="#" data-pitem="${esc(sel)}">${state.prices[sel]>0?"change":"set"} on the Market tab</a></div></div>
   <div class="tile"><div class="k">Best open source</div><div class="v mono">${open.length?esc(open[0].m.name):"–"}</div><div class="s">${open.length?`${open[0].ch}% · Lv ${open[0].m.lv} · ${esc(mapLabel(openMaps(open[0].m)[0][0]))}`:"no monster on an open map drops it"}</div></div>`;
  $("itemDroppers").innerHTML=`<table><thead><tr><th>Dropped by</th><th>Lv</th><th>Chance</th><th>Your chance</th><th>Zeny / kill from it</th><th>Best open map</th></tr></thead><tbody>${ds.map(({m,ch})=>{const om=openMaps(m);return `<tr data-id="${m.id}"><td class="name">${esc(m.name)}${m.boss?' <span class="pill">boss</span>':""}</td><td>${m.lv}</td><td>${ch}%</td><td>${yourCh(m,ch)}%</td><td>${dropZTxt(dropZ(m,sel,ch))}</td><td class="name">${om.length?`<span class="mono">${mapCode(om[0][0])}</span> <span class="note">≈${om[0][1]}</span>`:'<span class="note">none open</span>'}</td></tr>`}).join("")}</tbody></table>`;
}
function renderHunt(){
  const mode=state.huntMode==="mobs"?"mobs":"maps",lim=num($("huntN").value,10),min=num($("huntMin").value),w=walkSec();
  ROOTQ("[data-hunt]").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.hunt===mode)));$("huntAutoWrap").hidden=mode!=="maps";$("huntAuto").checked=state.huntAuto;
  ROOTQ("[data-loot]").forEach(i=>i.checked=looted0(i.dataset.loot));$("huntMinWrap").firstChild.textContent=mode==="maps"?"Min monsters on map":"Min spawns on its map";
  const rows=mode==="maps"?Object.keys(MAPMOBS).filter(mp=>!isClosed(mp)).map(mp=>huntMap(mp,w,min)).filter(r=>r&&r.N>=min)
    :MOBS.filter(m=>!m.boss&&!isSkipped(m)&&hasLoot(m)&&openMaps(m).length&&openMaps(m)[0][1]>=min).map(m=>huntMob(m,w)).filter(Boolean);
  rows.sort((a,b)=>b.net-a.net);rows.forEach((r,i)=>r.rank=i+1);rows.splice(lim);
  const hk=state.huntSort||"net",hd=state.huntDir||-1;const val=r=>hk==="name"?(r.mp?mapCode(r.mp):r.m.name):r[hk];
  rows.sort((a,b)=>{const x=val(a),y=val(b);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return (x>y?1:x<y?-1:0)*hd});
  document.querySelectorAll("#huntTable th").forEach(th=>th.classList.toggle("on",th.dataset.hk===hk));
  $("huntBasis").textContent=`${state.job} · ${C().a.name||"attack"} · ${convOn()?"best converter by zeny":atkEl()} · walking ~${w.toFixed(1)}s/kill`+(num(state.dropBonus)?` · drop rate +${num(state.dropBonus)}%`:"")+(num(C().baseLv)>39?` · drops −50% from monsters Lv ${num(C().baseLv)-40} and below`:"");
  const top=[...rows].sort((a,b)=>b.net-a.net)[0];
  $("huntTiles").innerHTML=top?`<div class="tile now"><div class="k">Best ${mode==="maps"?"map":"monster"} for zeny</div><div class="v mono">${mode==="maps"?mapCode(top.mp):esc(top.m.name)}</div><div class="s">${fmtN(top.net)} z/hr net${top.el2&&convOn()?` · bring ${top.el2} converters`:""}${mode==="maps"?` · ${esc(mapName(top.mp))}`:` · on ${esc(mapLabel(openMaps(top.m)[0][0]))}`}</div></div>
   <div class="tile"><div class="k">Per hour</div><div class="v mono">${fmtN(top.kph)} kills</div><div class="s">${fmtN(top.loot)} z loot · ${fmtN(top.zk)} z/kill${(()=>{const p=(top.m?[top.m]:top.earn.map(x=>x.m)).filter(m=>penNote(m));return p.length?` · ${esc(p.length===1?`${p[0].name}: ${penNote(p[0])}`:`level penalty on ${p.map(m=>m.name).join(", ")}`)}`:""})()}</div></div>
   <div class="tile"><div class="k">Costs / hr</div><div class="v mono">${fmtN(top.cost)}</div><div class="s">SP items, ASPD potion, consumables${top.tele?` &amp; ~${fmtN(top.tele*top.kph)} Fly Wings`:""}${num(C().a.zeny)?" (skill zeny is taken off each kill)":""}</div></div>`:"";
  const sel=currentMap(),selMob=(calcMob()||{}).id;
  $("huntTable").querySelector("tbody").innerHTML=rows.map(r=>{
    const name=r.mp?`<b class="mono">${mapCode(r.mp)}</b> <span class="note">${esc(mapName(r.mp))}</span>${r.mp===sel?' <span class="pill">current</span>':""}`:`<b title="${esc(dropNames(r.m))}">${esc(r.m.name)}</b> <span class="note">Lv ${r.m.lv}</span>`;
    const from=r.mp?huntPicker(r,w)+(r.skip?`<div class="note" title="${esc(r.skipNames.join(", "))}">can't hurt ${r.skip}</div>`:"")
      :(()=>{const om=openMaps(r.m);return `<div><span class="mono">${mapCode(om[0][0])}</span> <span class="note">≈${om[0][1]}${penNote(r.m)?` · ${esc(penNote(r.m))}`:""}</span></div>${dropList(r.m)}`})();
    return `<tr ${r.mp?`data-map="${r.mp}"`:`data-id="${r.m.id}"`} class="${(r.mp&&r.mp===sel)||(r.m&&r.m.id===selMob)?"sel":""}"><td>${r.rank}</td><td class="name">${name}${elTag(r.el2)}</td><td class="name mainmobs">${from}</td><td class="${r.net>0?"good":"bad"}"><b>${fmtN(r.net)}</b></td><td>${fmtN(r.loot)}</td><td>${r.cost>0?fmtN(r.cost):"–"}</td><td>${fmtN(r.kph)}</td><td>${fmtN(r.zk)}</td><td>${r.epm==null?"?":fmtN(r.epm)}</td><td>${r.hpm==null?"–":fmtN(r.hpm)}</td></tr>`}).join("")
    ||`<tr><td colspan="10" class="name muted">${mode==="maps"?"No open maps match.":"No open monsters you can hurt."}</td></tr>`;
}
const syncClosed=()=>{$("closedMaps").value=state.closed.join(", ");
  $("regions").innerHTML=REGIONS.map(r=>{const c=state.regions[r.id]!==false;return `<button type="button" class="map ${c?"off":""}" data-region="${r.id}" title="${c?"Closed. Click to mark open":"Open. Click to mark closed"}"><b>${c?"✕":"✓"} ${r.name}</b><span>${r.when}</span></button>`}).join("")};
function renderMap(){
  let mp=mapKey(state.map);const mob=calcMob();
  if(!mp&&mob){const om=openMaps(mob);if(om.length)mp=om[0][0]}
  $("mapInput").value=mp?mapCode(mp):"";$("mapName").textContent=mapName(mp);
  if(!MAPMOBS[mp]){$("mapTiles").innerHTML='<div class="note">Pick a map to see how this job does there.</div>';$("mapTable").querySelector("tbody").innerHTML="";return}
  const w=walkSec(),r=mapStats(mp,w);const L=lvExp(num(C().baseLv));const st=stats(cur());const L2=st?st.L:L;
  $("mapTiles").innerHTML=r?`<div class="tile now"><div class="k">Average EXP / min</div><div class="v mono">${fmtN(r.epm)}</div><div class="s">weighted by spawn counts${r.el2&&convOn()?` · bring ${r.el2} converters`:""}${r.skip?` · skips ${r.skip} you can't hurt`:""}${r.unk?` · leaves out ${esc(r.unkNames.join(", "))} (EXP unknown)`:""}</div></div>
   <div class="tile"><div class="k">Kills / hr</div><div class="v mono">${fmtN(3600/r.secT)}</div><div class="s">${r.sec.toFixed(1)}s fight + ${r.walk.toFixed(1)}s walk${sellTxt(r.sell," + "," selling")}</div></div>
   <div class="tile"><div class="k">EXP / hr</div><div class="v mono">${L2?pct(r.epm*60/L2*100):fmtN(r.epm*60)}</div><div class="s">${L2?`1 level in ${fmtDur(L2/(r.epm*60))}`:"set Base level 1–70 for %"}</div></div>
   <div class="tile"><div class="k">Zeny / hr</div><div class="v mono">${fmtN(r.zph)}</div><div class="s">${r.hpm==null?"":`HP lost ~${fmtN(r.hpm)}/min`}</div></div>${isClosed(mp)?'<div class="note bad">This map is marked as not open yet.</div>':""}`
   :MAPMOBS[mp].every(x=>x.m.boss||x.m.expUnknown||isSkipped(x.m))?'<div class="note bad">rozerodb has no EXP yet for the monsters here.</div>':'<div class="note bad">Your attack can\'t hurt anything here.</div>';
  const tot=MAPMOBS[mp].filter(x=>!x.m.boss&&!isSkipped(x.m)).reduce((a,x)=>a+x.n,0)||1;
  $("mapTable").querySelector("tbody").innerHTML=MAPMOBS[mp].slice().sort((a,b)=>b.n-a.n).map(({m,n})=>{const x=r&&r.el2?withEl(r.el2,()=>mobRow0(m,w)):mobRow(m,w);
    return `<tr data-id="${m.id}" class="${cur().mobIds.includes(m.id)?"sel":""}" style="${isSkipped(m)?"opacity:.55":""}"><td class="name">${esc(m.name)} <button type="button" class="small" data-sessmob="${m.id}">${cur().mobIds.includes(m.id)?"− Session":"+ Session"}</button>${m.boss?' <span class="pill">boss</span>':` <button type="button" class="small" data-skip="${m.id}">${isSkipped(m)?"Unskip":"Skip"}</button>`}</td><td>≈${n}</td><td>${m.boss?"–":isSkipped(m)?"skipped":Math.round(n/tot*100)+"%"}</td><td>${m.lv}</td><td>${m.el?`<span class="el ${m.el}">${m.el} ${m.elv}</span>`:"–"}</td><td>${m.size||"–"}</td><td class="${x.mult>100?"good":x.mult<=0?"bad":""}">${x.mult<=0?"can't hurt":Math.round(x.mult)+"%"}</td><td>${isFinite(x.sec)?x.sec.toFixed(1)+"s":"–"}</td><td>${fmtExp(m)}</td></tr>`}).join("");
}
function renderAll(){SKFX=skillEffects(C());const sgTree=sageFromTree(C());ROOTQ('[data-sg="sfLv"],[data-sg="boltLv"],[data-sg="hsLv"],[data-sg="dbLv"]').forEach(i=>{i.disabled=sgTree;i.title=sgTree?"Set by the Skills card":""});ROOTQ("[data-sgbolt]").forEach(i=>i.disabled=sgTree&&!skLv(C(),SG_BOLT[i.dataset.sgbolt]));applyBuild();applyConsumables();renderBuild();applyHsAuto();renderSessions();renderChar();renderTracker();renderMobs();renderBest();if(state.tab==="maps")renderHunt();if(state.tab==="market")renderPrices();if(state.tab==="mobinfo")renderMobInfo();if(state.tab==="items")renderItems();renderMap();renderRef()}


// ---- storage ----
const $=id=>document.getElementById(id);
const ROOTQ=sel=>[...document.querySelectorAll(sel)];
const KEY="rozero-farm-planner-v1";
// accounts: each one keeps its own full save; the first uses the original key so older saves carry over
const ACCT_KEY="rozero-farm-planner-accounts";
const accts=(()=>{let a=null;try{a=JSON.parse(localStorage.getItem(ACCT_KEY))}catch(e){}
  if(!a||!Array.isArray(a.list)||!a.list.length)a={list:[{id:"a0",name:"Account 1"}],active:"a0"};
  if(!a.list.some(x=>x.id===a.active))a.active=a.list[0].id;return a})();
const saveAccts=()=>{try{localStorage.setItem(ACCT_KEY,JSON.stringify(accts))}catch(e){}};
const acctKey=id=>id==="a0"?KEY:KEY+":"+id;
const store={get(){try{return JSON.parse(localStorage.getItem(acctKey(accts.active)))}catch(e){return null}},set(v){try{localStorage.setItem(acctKey(accts.active),JSON.stringify(v))}catch(e){}}};
let state=store.get()||{};
if(!Array.isArray(state.sessions)||!state.sessions.length)state.sessions=[{id:"s"+Date.now(),name:"New session",mobIds:[],entries:[]}];
// sessions hold a list of monsters (one map, plus the aggressive ones you end up killing); older saves had a single mobId
state.sessions.forEach(s=>{if(!Array.isArray(s.mobIds))s.mobIds=s.mobId!=null?[s.mobId]:[];delete s.mobId});
// saves can come from a pasted backup: keep ids and names as text and log entries as numbers, dropping entries that aren't
state.sessions.forEach(s=>{s.id=String(s.id);s.name=String(s.name??"Session");s.mobIds=s.mobIds.map(Number).filter(Number.isFinite);if(s.job!=null)s.job=String(s.job);
  s.entries=(Array.isArray(s.entries)?s.entries:[]).map(e=>{const o={t:+(e&&e.t),lv:+(e&&e.lv),pct:+(e&&e.pct)};if(e&&e.jpct!=null&&e.jpct!==""&&isFinite(+e.jpct))o.jpct=+e.jpct;return o})
    .filter(e=>Number.isFinite(e.t)&&Number.isFinite(e.lv)&&Number.isFinite(e.pct));
  if(s.trip!=null)s.trip=s.trip&&Number.isFinite(+s.trip.from)&&Number.isFinite(+s.trip.due)?{from:+s.trip.from,due:+s.trip.due,...(s.trip.rang===true?{rang:true}:{})}:undefined;
  if(s.pauses!=null)s.pauses=(Array.isArray(s.pauses)?s.pauses:[]).filter(p=>p&&Number.isFinite(+p.from)&&(p.to==null||Number.isFinite(+p.to))).map(p=>p.to==null?{from:+p.from}:{from:+p.from,to:+p.to})});
// new accounts start as Novice; change it on the Character tab
if(!JOBS[state.job])state.job="Novice";
if(!state.chars||typeof state.chars!=="object")state.chars={};
// per character: learned skill levels and the build-mode "Check against the game" values are numbers; anything else is dropped
const numMap=o=>Object.fromEntries(Object.entries(o&&typeof o==="object"?o:{}).map(([k,v])=>[k,v===""||v==null?NaN:+v]).filter(([,v])=>Number.isFinite(v)));
for(const j in state.chars){const c=state.chars[j];if(!c||typeof c!=="object"){delete state.chars[j];continue}
  if(c.skills!=null)c.skills=Object.fromEntries(Object.entries(numMap(c.skills)).map(([k,v])=>[k,Math.max(0,Math.round(v))]).filter(([,v])=>v>0));
  if(c.build&&typeof c.build==="object"&&c.build.check!=null)c.build.check=numMap(c.build.check)}
// market prices you typed for items, and optionally what an NPC pays for them (item id → zeny); numbers only, so a pasted backup can't put anything else in
state.prices=Object.fromEntries(Object.entries(numMap(state.prices)).filter(([k,v])=>/^\d+$/.test(k)&&v>=0)); // keys are item ids
state.npcPrices=Object.fromEntries(Object.entries(numMap(state.npcPrices)).filter(([k,v])=>v>=0&&k in state.prices));
// auto-loot groups you switched off (true/false by group), and per map the monsters the Zeny Hunter passes by (monster ids)
state.autoLoot=Object.fromEntries(Object.entries(state.autoLoot&&typeof state.autoLoot==="object"?state.autoLoot:{}).filter(([k,v])=>/^[waueco]$/.test(k)&&typeof v==="boolean"));
state.huntOff=Object.fromEntries(Object.entries(state.huntOff&&typeof state.huntOff==="object"?state.huntOff:{}).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[String(k),v.map(Number).filter(Number.isFinite)]));
state.huntAuto=state.huntAuto===true;
// sort ([column, 1 or -1]) and column filters (text) of the Monster info, Item info, Market and Hunter tables, by table id
const objOr=o=>o&&typeof o==="object"&&!Array.isArray(o)?o:{};
state.tsort=Object.fromEntries(Object.entries(objOr(state.tsort)).filter(([,v])=>Array.isArray(v)&&typeof v[0]==="string"&&(v[1]===1||v[1]===-1)));
// the Hunter tables kept their sort in bestSort/huntSort before they moved to tsort
[["bestTable","bestSort","bestDir"],["huntTable","huntSort","huntDir"]].forEach(([id,k,d])=>{if(typeof state[k]==="string"&&!state.tsort[id])state.tsort[id]=[state[k],state[d]===1?1:-1];delete state[k];delete state[d]});
state.tfilt=Object.fromEntries(Object.entries(objOr(state.tfilt)).map(([k,v])=>[k,Object.fromEntries(Object.entries(objOr(v)).filter(([,x])=>typeof x==="string"))]));
state.noTele=(Array.isArray(state.noTele)?state.noTele:[]).map(String);
["flyPrice","teleSec","tripEarly","tripMin"].forEach(k=>{if(state[k]!=null&&!(Number.isFinite(+state[k])&&+state[k]>=0))delete state[k]});
if(!state.current||!state.sessions.some(s=>s.id===state.current))state.current=state.sessions[0].id;
const D={bonus:0,jobBonus:0,minLv:1,maxLv:99,hideClosed:true,filters:{},sort:"epm",dir:-1,regions:{um:false},closed:[]};
for(const k in D)if(state[k]==null)state[k]=JSON.parse(JSON.stringify(D[k]));
const save=()=>store.set(state);
const C=()=>{if(!state.chars[state.job])state.chars[state.job]=charDefault(state.job);const c=state.chars[state.job];
  {const p=c.preset>=0&&JOBS[state.job]&&JOBS[state.job].p[c.preset];if(p&&c.a){if(p.zeny!=null&&c.a.zeny==null)c.a.zeny=p.zeny;if(p.cart!=null&&c.a.cart==null)c.a.cart=p.cart}}const d=charDefault(state.job);for(const k in d)if(c[k]==null)c[k]=d[k];if(!c.a)c.a={...d.a};return c};
const cur=()=>state.sessions.find(s=>s.id===state.current)||state.sessions[0];

// skills v2: presets now come from rozerodb; reset each saved job to its first preset
(function weaponsV2(){if(state.weaponsV2)return;state.weaponsV2=true;for(const j in state.chars){const c=state.chars[j];if(c&&WREN[c.weapon])c.weapon=WREN[c.weapon]}save()})();
(function sfV2(){if(state.sfV2)return;state.sfV2=true;const c=state.chars&&state.chars.Sage;if(c&&c.preset>=0&&c.preset<3){c.a={...JOBS.Sage.p[c.preset]}}save()})();
(function sfV3(){if(state.sfV3)return;state.sfV3=true;const c=state.chars&&state.chars.Sage;if(c){c.preset=0;c.a={...JOBS.Sage.p[0]}}save()})();
(function skillsV3(){if(state.skillsV3)return;state.skillsV3=true;for(const j in state.chars){if(!JOBS[j])continue;const c=state.chars[j];if(c.preset==null||c.preset>=0){c.preset=Math.min(c.preset||0,JOBS[j].p.length-1);c.a={...JOBS[j].p[c.preset]}}}save()})();
(function skillsV2(){if(state.skillsV2)return;state.skillsV2=true;for(const j in state.chars){if(!JOBS[j]){delete state.chars[j];continue}const c=state.chars[j];if(c.preset==null||c.preset>=0){c.preset=0;c.a={...JOBS[j].p[0]}}}save()})();
// ---- helpers ----
const sumStat=v=>String(v??"").split("+").reduce((a,x)=>a+(parseFloat(x)||0),0);
const fmtN=n=>isFinite(n)?Math.round(n).toLocaleString("en-GB"):"–";
const fmtT=t=>new Date(t).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
const fmtD=t=>new Date(t).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
const dayKey=t=>new Date(t).toDateString();
// entries sorted by time that run over more than one calendar day show their date as well as the time
const multiDay=es=>es.length>1&&dayKey(es[0].t)!==dayKey(es[es.length-1].t);
const pct=(n,d=2)=>isFinite(n)?n.toFixed(d)+"%":"–";
function fmtDur(h){if(!isFinite(h)||h<0)return "–";const m=Math.round(h*60),hh=Math.floor(m/60),mm=m%60;if(hh>=24){const d=Math.floor(hh/24);return `~${d}d ${hh%24}h ${mm}m\n~${hh}h ${mm}m`}return hh?`~${hh}h ${mm}m`:`~${mm}m`}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
const num=(v,d=0)=>{const x=+v;return isFinite(x)?x:d};
const dbUrl=m=>`https://rozerodb.com/monsters/${m.id}`;
const lvExp=lv=>EXP_TABLE[lv]||null;
// Even Share: a kill gives the party 100% + 10% per member beyond the first, split evenly (110% for 2, 120% for 3 ... 210% for 12),
// for base and job EXP alike. Checked in game with +20% EXP: Boulder Dwarf Captain (32,822) → 15,753 each for 3 members, 12,800 for 4;
// Squad Leader (33,361) → 22,017 for 2. The game shares EXP by damage dealt, so a kill can come out 1 EXP off
const partyN=(s=cur())=>Math.min(12,Math.max(1,Math.round(num(s&&s.partyN,1))));
const partyBonus=(s=cur())=>10*(partyN(s)-1);
const partyPct=(s=cur())=>Math.floor((100+partyBonus(s))/partyN(s));  // each member's whole % of a kill, for display


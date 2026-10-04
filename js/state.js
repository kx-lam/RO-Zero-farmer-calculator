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
  if(s.pauses!=null)s.pauses=(Array.isArray(s.pauses)?s.pauses:[]).filter(p=>p&&Number.isFinite(+p.from)&&(p.to==null||Number.isFinite(+p.to))).map(p=>p.to==null?{from:+p.from}:{from:+p.from,to:+p.to})});
// new accounts start as Novice; change it on the Character tab
if(!JOBS[state.job])state.job="Novice";
if(!state.chars||typeof state.chars!=="object")state.chars={};
// per character: learned skill levels and the build-mode "Check against the game" values are numbers; anything else is dropped
const numMap=o=>Object.fromEntries(Object.entries(o&&typeof o==="object"?o:{}).map(([k,v])=>[k,v===""||v==null?NaN:+v]).filter(([,v])=>Number.isFinite(v)));
for(const j in state.chars){const c=state.chars[j];if(!c||typeof c!=="object"){delete state.chars[j];continue}
  if(c.skills!=null)c.skills=Object.fromEntries(Object.entries(numMap(c.skills)).map(([k,v])=>[k,Math.max(0,Math.round(v))]).filter(([,v])=>v>0));
  if(c.build&&typeof c.build==="object"&&c.build.check!=null)c.build.check=numMap(c.build.check)}
if(!state.current||!state.sessions.some(s=>s.id===state.current))state.current=state.sessions[0].id;
const D={bonus:0,minLv:1,maxLv:99,hideClosed:true,filters:{},sort:"epm",dir:-1,regions:{um:false},closed:[]};
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
const pct=(n,d=2)=>isFinite(n)?n.toFixed(d)+"%":"–";
function fmtDur(h){if(!isFinite(h)||h<0)return "–";const m=Math.round(h*60),hh=Math.floor(m/60),mm=m%60;if(hh>=24){const d=Math.floor(hh/24);return `~${d}d ${hh%24}h ${mm}m\n~${hh}h ${mm}m`}return hh?`~${hh}h ${mm}m`:`~${mm}m`}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
const num=(v,d=0)=>{const x=+v;return isFinite(x)?x:d};
const dbUrl=m=>`https://rozerodb.com/monsters/${m.id}`;
const lvExp=lv=>EXP_TABLE[lv]||null;
// your share of each kill: EXP bonus, then Even Share (irowiki.org/wiki/Party): 100% + 20% per member beyond the first, split evenly
const partyN=(s=cur())=>Math.min(12,Math.max(1,Math.round(num(s&&s.partyN,1))));
const partyBonus=(s=cur())=>s&&s.partyBonus!=null&&s.partyBonus!==""?num(s.partyBonus):20;
const expMul=(s=cur())=>(1+num(state.bonus)/100)*(1+partyBonus(s)/100*(partyN(s)-1))/partyN(s);


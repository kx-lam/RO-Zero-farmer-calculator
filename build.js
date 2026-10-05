// ---- build simulator: base stats + job + gear -> the character fields the damage model reads ----
// Data: data/equipment.js (EQUIP, SETS), data/cards.js (CARDS), data/refine.js (REFINE), data/jobs.js (JOBDATA).
// Formulas follow the roz.prontera.info stat planner (Zero): status values, ×VIT/×INT HP/SP, %ATK on the gear side only,
// ASPD % pivoting on 195 with a 190 cap. Pure functions: everything comes in as arguments, nothing touches the page.
const BUILD=(()=>{
  // 2nd job -> 1st job
  const FIRST_OF={Knight:"Swordsman",Crusader:"Swordsman",Wizard:"Mage",Sage:"Mage",Hunter:"Archer",Bard:"Archer",Dancer:"Archer",Priest:"Acolyte",Monk:"Acolyte",Blacksmith:"Merchant",Alchemist:"Merchant",Assassin:"Thief",Rogue:"Thief"};
  const STAT6=["str","agi","vit","int","dex","luk"];
  // the gear grid; "takes" lists the item slots (prontera equip_slot) that may go in it
  const SLOTS=[
    {k:"weapon",label:"Weapon",takes:["weapon"]},{k:"shield",label:"Shield",takes:["shield"]},
    {k:"headTop",label:"Upper headgear",takes:["head_upper"]},{k:"headMid",label:"Middle headgear",takes:["head_middle"]},
    {k:"headLow",label:"Lower headgear",takes:["head_lower"]},{k:"armor",label:"Armor",takes:["armor"]},
    {k:"garment",label:"Garment",takes:["garment"]},{k:"shoes",label:"Shoes",takes:["footgear"]},
    {k:"acc1",label:"Accessory",takes:["accessory_1","accessory_2","accessory"]},{k:"acc2",label:"Accessory",takes:["accessory_1","accessory_2","accessory"]},
    {k:"ammo",label:"Arrows / ammo",takes:["ammo"]}];
  // card slot names per gear slot (cards' own "slot" field)
  const CARD_FOR={weapon:"weapon",shield:"shield",headTop:"head",headMid:"head",headLow:"head",armor:"armor",garment:"garment",shoes:"footgear",acc1:"accessory",acc2:"accessory"};
  const WTYPE={dagger:"Dagger",sword_1h:"One-handed sword",sword_2h:"Two-handed sword",spear_1h:"One-handed spear",spear_2h:"Two-handed spear",
    axe_1h:"One-handed axe",axe_2h:"Two-handed axe",mace:"One-handed mace",mace_2h:"Two-handed mace",staff_1h:"One-handed staff",staff_2h:"Two-handed staff",
    bow:"Bow",katar:"Katar",knuckle:"Knuckle",instrument:"Musical instrument",whip:"Whip",book:"Book"};
  const RANGED_W=["Bow","Musical instrument","Whip"];
  const RACE={formless:"Formless",undead:"Undead",brute:"Brute",plant:"Plant",insect:"Insect",fish:"Fish",demon:"Demon",demi_human:"Demi-Human",angel:"Angel",dragon:"Dragon"};
  const SIZE={small:"S",medium:"M",large:"L"};
  const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;

  const byId={};const index=()=>{if(byId.ready)return;byId.ready=true;
    (typeof EQUIP!=="undefined"?EQUIP:[]).forEach(x=>byId[x.id]=x);(typeof CARDS!=="undefined"?CARDS:[]).forEach(x=>byId[x.id]=x)};
  const item=id=>{index();return byId[id]||null};

  // job level bonus: +1 to a stat at each listed job level
  function jobBonus(job,jobLv){const d=(typeof JOBDATA!=="undefined"?JOBDATA:{})[job],o={};STAT6.forEach(k=>o[k]=0);if(!d)return o;
    for(const k in d.bonus)o[k]=d.bonus[k].filter(l=>l<=jobLv).length;return o}
  const curve=(job,kind,lv)=>{const d=(typeof JOBDATA!=="undefined"?JOBDATA:{})[job];const a=d&&d[kind];return a&&a.length?a[Math.min(a.length,Math.max(1,lv))-1]:null};
  // refine totals at +r: [ATK, MATK, DEF]; weapons use "weapon_lvN", armor "armor"
  function refineAt(it,r){if(!it||!r||typeof REFINE==="undefined")return [0,0,0];
    const key=REFINE[it.refine]?it.refine:(it.slot||[]).includes("weapon")?`weapon_lv${it.wlv||1}`:"armor";
    const t=REFINE[key]||REFINE.armor;return t&&t[r-1]?t[r-1]:[0,0,0]}

  // status values from total stats (verified in-game per the planner)
  function status(lv,s,ranged){const f=Math.floor;
    return {atk:f(lv/4+(ranged?s.dex+s.str/5:s.str+s.dex/5)+s.luk/3),matk:s.int+f(s.int/2)+f(s.dex/5)+f(s.luk/3)+f(lv/4),
      hit:175+lv+s.dex+f(s.luk/3),flee:100+lv+s.agi+f(s.luk/5),softDef:f(lv/2)+f(s.vit/2)+f(s.agi/5), // each part rounds down: Lv 63 VIT 5 AGI 100 shows 53 in game, not 54
      softMdef:Math.max(0,f(s.int+lv/4+(s.dex+s.vit)/5)),crit:1+s.luk*0.3+lv/100,aspdTerm:Math.sqrt(s.agi*s.agi/2+s.dex*s.dex/(ranged?7:5))/4}}

  // ---- bonus accumulation ----
  const blank=()=>({st:{str:0,agi:0,vit:0,int:0,dex:0,luk:0},atk:0,matk:0,atkPct:0,matkPct:0,hit:0,flee:0,crit:0,critDmg:0,aspd:0,aspdPct:0,
    hp:0,hpPct:0,sp:0,spPct:0,def:0,mdef:0,ranged:0,melee:0,skill:0,skillOf:{},vct:0,fct:0,acd:0,vctOf:{},fctOf:{},ignDef:0,ignMdef:0,
    phys:{all:0,race:{},size:{},ele:{},kind:{}},magic:{all:0,race:{},size:{},ele:{},kind:{}},myEle:{},taken:{race:{},ele:{},kind:{}},exp:{all:0,race:{}},critRace:{},spCost:0,wEle:null,unmodelled:[]});
  // lines that only matter for PvP survival, healing or status resistance: not part of the farming maths, so not reported either
  const QUIET=["resistance_percent","heal_amount_percent","item_heal_percent","sp_recovery_percent","hp_recovery_percent","perfect_dodge","perfect_hit","magic_damage_taken_percent","sp_per_hit","hp_per_hit"];
  const addTo=(o,k,v)=>{o[k]=(o[k]||0)+v};
  const tgt=(kind,t)=>kind==="race"?RACE[t]||cap(t):kind==="size"?SIZE[t]||t:kind==="element"?cap(t):t;
  const bucket=kind=>kind==="race"?"race":kind==="size"?"size":kind==="element"?"ele":kind==="monster_kind"?"kind":null;
  // one bonus line: [type, target kind, target, value, per N refines, skill, scaling skill]
  function apply(A,b,src){const [type,kind,target,value]=b;const v=+value||0;
    if(QUIET.includes(type))return true;
    // "Fire Magical Damage +x%" boosts your own spells of that element; physical lines with an element target the monster's element
    if(type==="magic_damage_percent"&&kind==="element"){addTo(A.myEle,tgt(kind,target),v);return true}
    if(type==="exp_percent"&&!kind){A.exp.all+=v;return true}
    if(type==="damage_percent"&&!kind){A.phys.all+=v;return true}
    if(type==="magic_damage_percent"&&!kind){A.magic.all+=v;return true}
    if(type==="sp_cost_percent"&&!kind){A.spCost+=v;return true}
    if(STAT6.includes(type)){A.st[type]+=v;return true}
    if(type==="all_stats"){STAT6.forEach(k=>A.st[k]+=v);return true}
    // "When attacking Brute monsters, CRIT +7": counted only against that race
    if(type==="crit"&&kind==="race"){addTo(A.critRace,tgt(kind,target),v);return true}
    const flat={atk:"atk",matk:"matk",atk_percent:"atkPct",matk_percent:"matkPct",hit:"hit",flee:"flee",crit:"crit",crit_damage_percent:"critDmg",
      aspd:"aspd",aspd_percent:"aspdPct",hp:"hp",hp_percent:"hpPct",sp:"sp",sp_percent:"spPct",def:"def",mdef:"mdef",
      ranged_damage_percent:"ranged",melee_damage_percent:"melee"}[type];
    if(flat&&!kind){A[flat]+=v;return true}
    if(type==="attack_delay_percent"&&!kind){A.aspdPct-=v;return true} // −10% delay counts as +10% ASPD
    if(type==="after_cast_delay_percent"&&!kind){A.acd-=v;return true}
    if((type==="cast_time_variable_percent"||type==="cast_time_fixed_percent")&&!kind){const f=type==="cast_time_variable_percent";
      if(b[5])addTo(f?A.vctOf:A.fctOf,b[5],-v);else A[f?"vct":"fct"]-=v;return true}
    if(type==="skill_damage_percent"&&!kind){if(b[5])addTo(A.skillOf,b[5],v);else A.skill+=v;return true}
    if((type==="damage_percent"||type==="magic_damage_percent"||type==="physical_damage_percent")&&bucket(kind)){
      const ch=bucket(kind),t=tgt(kind,target);if(type!=="magic_damage_percent")addTo(A.phys[ch],t,v);if(type!=="physical_damage_percent"&&type!=="damage_percent")addTo(A.magic[ch],t,v);return true}
    if((type==="ignore_def_percent"||type==="ignore_mdef_percent")&&(!kind||kind==="monster_kind")){if(type==="ignore_def_percent")A.ignDef+=v;else A.ignMdef+=v;return true}
    if(type==="damage_taken_percent"&&bucket(kind)&&bucket(kind)!=="size"){addTo(A.taken[bucket(kind)],tgt(kind,target),v);return true}
    if(type==="exp_percent"&&kind==="race"){addTo(A.exp.race,tgt(kind,target),v);return true}
        if(type==="weapon_element"&&target){A.wEle=cap(target);return true}
    A.unmodelled.push(`${src}: ${type}${target?" "+target:""} ${v>0?"+":""}${v}`);return false}

  // random options typed by the player, e.g. "ATK +25, FLEE +20, MATK +3%" -> bonus lines
  const OPT={str:"str",agi:"agi",vit:"vit",int:"int",dex:"dex",luk:"luk",atk:"atk",matk:"matk",hit:"hit",flee:"flee",crit:"crit",critical:"crit",
    def:"def",mdef:"mdef",aspd:"aspd",maxhp:"hp",mhp:"hp",hp:"hp",maxsp:"sp",msp:"sp",sp:"sp"};
  const PCT={atk:"atk_percent",matk:"matk_percent",aspd:"aspd_percent",hp:"hp_percent",sp:"sp_percent"};
  function parseOptions(txt){const out=[],bad=[];String(txt||"").split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean).forEach(p=>{
    const m=p.match(/^([a-z ]+?)\s*([+-]\s*\d+(?:\.\d+)?)\s*(%?)$/i);const k=m&&OPT[m[1].toLowerCase().replace(/\s+/g,"")];
    if(!k){bad.push(p);return}const v=parseFloat(m[2].replace(/\s/g,""));
    if(m[3]){if(PCT[k])out.push([PCT[k],null,null,v]);else bad.push(p)}else out.push([k,null,null,v])});return {lines:out,bad}}
  // does a bonus group apply? r: item refine, rs: combined refine of a set, lv: base level, cls: job slugs
  // ("Acolyte Class" in game covers Priest and Monk, so a 2nd job also matches its 1st job)
  const groupOn=(g,ctx)=>(g.r==null||ctx.refine>=g.r)&&(g.rs==null||ctx.refineSum>=g.rs)&&(g.lv==null||ctx.baseLv>=g.lv)&&(!g.cls||!g.cls.length||g.cls.includes(ctx.jobSlug)||g.cls.includes(ctx.firstSlug));
  function applyGroups(A,gs,ctx,src){(gs||[]).forEach(g=>{if(!groupOn(g,ctx))return;
    if(g.proc||g.text){A.unmodelled.push(`${src}: ${g.proc||g.text}`);}
    (g.b||[]).forEach(b=>{const per=b[4];const k=per?Math.floor(ctx.refine/per):1;if(k<=0)return;const bb=b.slice();bb[3]=(+b[3]||0)*k;apply(A,bb,src)})})}

  // ---- the whole build ----
  // b = {baseLv, jobLv, base:{str..luk}, gear:{slot:{id, refine, cards:[ids]}}, hpBase?, spBase?}; job = "Knight"
  function compute(b,job,aspdBase){
    const A=blank(),lv=Math.max(1,+b.baseLv||1),jobLv=Math.max(1,+b.jobLv||1),ctxBase={baseLv:lv,jobSlug:String(job).toLowerCase(),firstSlug:String(FIRST_OF[job]||job).toLowerCase(),refineSum:0};
    const gear=b.gear||{},worn=[];let wpn=null,shield=false,weaponAtk=0,gearAtk=0,gearMatk=0,refAtk=0,refMatk=0,refDef=0,gearDef=0,gearMdef=0;
    SLOTS.forEach(s=>{const g=gear[s.k];const it=g&&item(g.id);if(!it)return;const r=Math.max(0,+g.refine||0);
      if(worn.some(w=>w.it===it&&s.k!=="acc2"&&s.k!=="acc1"))return; // a multi-slot headgear counts once
      worn.push({it,r,slot:s.k,cards:(g.cards||[]).map(item).filter(Boolean)});
      const [ra,rm,rd]=refineAt(it,r);
      if(s.k==="weapon"){wpn=it;weaponAtk=it.atk||0;refAtk+=ra;refMatk+=rm}else{gearAtk+=it.atk||0;refAtk+=ra;refMatk+=rm}
      if(s.k==="shield")shield=true;gearMatk+=it.matk||0;gearDef+=it.def||0;gearMdef+=it.mdef||0;refDef+=rd});
    worn.forEach(w=>{const ctx={...ctxBase,refine:w.r};applyGroups(A,w.it.g,ctx,w.it.name);w.cards.forEach(c=>applyGroups(A,c.g,ctx,c.name));
      const o=parseOptions((gear[w.slot]||{}).opts);o.lines.forEach(b=>apply(A,b,w.it.name+" option"));o.bad.forEach(x=>A.unmodelled.push(`${w.it.name} option not understood: ${x}`))});
    // consumables and buffs picked on the Character tab: plain bonus lines on top of the gear
    (b.extra||[]).forEach(x=>apply(A,x,"consumable"));
    // sets: every piece worn; "combined refine" sums the pieces' refines
    (typeof SETS!=="undefined"?SETS:[]).forEach(st=>{const ps=st.pieces.map(p=>worn.find(w=>w.it.slug===p));if(ps.some(p=>!p))return;
      applyGroups(A,st.g,{...ctxBase,refine:0,refineSum:ps.reduce((a,p)=>a+p.r,0)},st.name)});
    const jb=jobBonus(job,jobLv),base={},tot={};STAT6.forEach(k=>{base[k]=Math.max(1,+((b.base||{})[k])||1);tot[k]=base[k]+jb[k]+A.st[k]});
    const weapon=wpn?WTYPE[wpn.type]||"Bare hands":"Bare hands",ranged=RANGED_W.includes(weapon),S=status(lv,tot,ranged),f=Math.floor;
    const gearSide=f((weaponAtk+gearAtk+refAtk+A.atk)*(1+A.atkPct/100));
    const matkTot=f((S.matk+gearMatk+refMatk+A.matk)*(1+A.matkPct/100));
    const hpBase=+b.hpBase>0?+b.hpBase:curve(job,"hp",lv),spBase=+b.spBase>0?+b.spBase:curve(job,"sp",lv);
    const maxHp=hpBase!=null?f((f(hpBase*(1+tot.vit/100))+A.hp)*(1+A.hpPct/100)):null,maxSp=spBase!=null?f((f(spBase*(1+tot.int/100))+A.sp)*(1+A.spPct/100)):null;
    const ab=aspdBase?aspdBase(job,weapon):null;let aspd=null;
    if(ab!=null){const a0=ab+S.aspdTerm;aspd=Math.min(190,Math.round((a0+(195-a0)*A.aspdPct/100+A.aspd)*10)/10)}
    const ammo=worn.find(w=>w.slot==="ammo"),arrowEl=weapon==="Bow"&&ammo&&ammo.it.el?cap(ammo.it.el):null; // bows shoot the arrow's element
    const fields={baseLv:lv,jobLv,weapon,wElem:arrowEl||A.wEle||(wpn&&wpn.el?cap(wpn.el):null)||"Neutral",
      st:{str:`${base.str}+${tot.str-base.str}`,agi:`${base.agi}+${tot.agi-base.agi}`,vit:`${base.vit}+${tot.vit-base.vit}`,dex:`${base.dex}+${tot.dex-base.dex}`,luk:`${base.luk}+${tot.luk-base.luk}`},
      intTxt:`${base.int}+${tot.int-base.int}`,atkTxt:`${S.atk}+${gearSide}`,wAtk:f((weaponAtk+(wpn?refineAt(wpn,(gear.weapon||{}).refine)[0]:0))*(1+A.atkPct/100)),
      matkTxt:`${S.matk}+${matkTot-S.matk}`,hitTxt:`${S.hit}+${A.hit}`,fleeTxt:`${S.flee}+${A.flee}`,defTxt:`${S.softDef}+${gearDef+refDef+A.def}`,
      maxHp,maxSp,aspd,crit:Math.round((S.crit+A.crit)*10)/10,critDmg:A.critDmg,rangePct:ranged?A.ranged:A.melee,
      vctPct:A.vct,fctPct:A.fct,acdPct:A.acd,ignDef:A.ignDef,ignMdef:A.ignMdef};
    return {fields,acc:A,shield,jobBonus:jb,total:tot,status:S,worn:worn.map(w=>({name:w.it.name,slot:w.slot,refine:w.r,cards:w.cards.map(c=>c.name)})),unmodelled:A.unmodelled}}

  return {SLOTS,CARD_FOR,WTYPE,STAT6,FIRST_OF,item,jobBonus,refineAt,status,compute,curve,parseOptions}})();
if(typeof module!=="undefined")module.exports=BUILD;

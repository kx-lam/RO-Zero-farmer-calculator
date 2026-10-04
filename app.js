// ---- merge the per-monster tables from data/*.js into MOBS ----
MOBS.forEach(m=>{const e=ELEM[m.id];if(e){m.el=e[0];m.elv=e[1];m.hit100=e[2];m.flee95=e[3]}
  const st=MSTAT[m.id];if(st){m.def=st[0];m.mdef=st[1];m.atkMin=st[2];m.atkMax=st[3];m.vit=st[4];m.int=st[5];m.agg=!!st[6]}
  const lt=LOOT[m.id];if(lt){m.loot=lt[0];m.priced=lt[1];m.dropsN=lt[2];m.drops=lt[3]}else m.drops=[];
  const sz=SIZES[m.id];if(sz){m.size=sz[0];m.race=RACES[sz[1]]}});

// ---- element table: defender element -> element level 1-4 -> attacker element (rozerodb.com/guides/elements-sizes) ----
const AE=["Neutral","Water","Earth","Fire","Wind","Poison","Holy","Shadow","Ghost","Undead"];
const ET0={
Neutral:["100,100,100,100,100,100,100,100,90,100","100,100,100,100,100,100,100,100,70,100","100,100,100,100,100,100,100,100,50,100","100,100,100,100,100,100,100,100,0,100"],
Water:["100,25,100,90,150,150,100,100,100,100","100,0,100,80,175,150,100,100,100,100","100,0,100,70,200,125,100,100,100,100","100,0,100,60,200,125,100,100,100,100"],
Earth:["100,100,25,150,90,150,100,100,100,100","100,100,0,175,80,150,100,100,100,100","100,100,0,200,70,125,100,100,100,100","100,100,0,200,60,125,100,100,100,100"],
Fire:["100,150,90,25,100,150,100,100,100,90","100,175,80,0,100,150,100,100,100,80","100,200,70,0,100,125,100,100,100,70","100,200,60,0,100,125,100,100,100,60"],
Wind:["100,90,150,100,25,150,100,100,100,100","100,80,175,100,0,150,100,100,100,100","100,70,200,100,0,125,100,100,100,100","100,60,200,100,0,125,100,100,100,100"],
Poison:["100,150,150,150,150,0,75,75,75,75","100,150,150,150,150,0,75,75,75,50","100,125,125,125,125,0,50,50,50,25","100,125,125,125,125,0,50,50,50,0"],
Holy:["100,100,100,100,100,75,0,125,90,125","100,100,100,100,100,75,0,150,80,150","100,100,100,100,100,50,0,175,70,175","100,100,100,100,100,50,0,200,60,200"],
Shadow:["100,100,100,100,100,75,125,0,90,0","100,100,100,100,100,75,150,0,80,0","100,100,100,100,100,50,175,0,70,0","100,100,100,100,100,50,200,0,60,0"],
Ghost:["90,100,100,100,100,75,100,100,125,100","70,100,100,100,100,75,100,100,150,125","50,100,100,100,100,50,100,100,175,150","0,100,100,100,100,50,100,100,200,175"],
Undead:["100,100,100,125,100,75,125,0,100,0","100,100,100,150,100,50,150,0,125,0","100,100,100,175,100,25,175,0,150,0","100,100,100,200,100,0,200,0,175,0"]};
const ET={};Object.entries(ET0).forEach(([d,rows])=>ET[d]=rows.map(r=>r.split(",").map(Number)));
const elemMult=(m,atkEl)=>{const r=ET[m.el||"Neutral"];if(!r)return 100;const row=r[Math.min(4,Math.max(1,m.elv||1))-1];const i=AE.indexOf(atkEl);return i<0?100:row[i]};

// ---- weapons: size modifier S/M/L ----
// weapon size modifiers from the official guide: roz.mygnjoy.com/en/intro/guide/12 (applies to basic attacks and physical skills, not magic)
const WEAPONS={"Bare hands":[100,100,100],"Dagger":[100,75,50],"One-handed sword":[75,100,75],"Two-handed sword":[75,75,100],"One-handed spear":[75,75,100],"Two-handed spear":[75,75,100],"One-handed axe":[50,75,100],"Two-handed axe":[50,75,100],"One-handed mace":[75,100,100],"Two-handed mace":[75,100,100],"One-handed staff":[100,100,100],"Two-handed staff":[100,100,100],"Bow":[100,100,75],"Katar":[75,100,75],"Knuckle":[100,100,75],"Musical instrument":[75,100,75],"Whip":[75,100,75],"Book":[100,100,50]};
const WREN={"Bare hand":"Bare hands","Spear":"Two-handed spear","Axe":"Two-handed axe","Mace":"One-handed mace","Staff / Rod":"One-handed staff","Instrument":"Musical instrument"};
const sizeMod=(m,w)=>{const t=WEAPONS[w]||WEAPONS[WREN[w]]||WEAPONS["Bare hands"];return t[{S:0,M:1,L:2}[m.size]??1]};

// ---- jobs and attack presets: max-level values from rozerodb.com/tools/skill-tree (Ragnarok Zero) ----
// type: phys / magic / auto · pct per hit · hits per use · el ("W" = weapon/arrow element) · cast = rozerodb base cast (lower it for your DEX/gear) · delay = cooldown · sp · targets
const A=(name,type,pct,hits,el,cast,delay,sp,targets,note,extra)=>({name,type,pct,hits,el,cast,delay,sp,targets,note:note||"",...(extra||{})});
const BASIC=A("Basic attack","auto",100,1,"W",0,0,0,1);
// Zero skill data from Landgris ROCalculator (skills_zero.json + Zero Global overrides): fixed / variable cast, cooldown, global delay,
// base-level scaling (blv) and stat add-ons (sadd: [stat, % per point]); ratios cross-checked with rozerodb
const Z=(fct,vct,cd,gcd,more)=>({fct,vct,cd,gcd,...(more||{})});
const A2=(name,type,pct,hits,el,sp,targets,note,z)=>A(name,type,pct,hits,el,Math.round(((z.fct||0)+(z.vct||0))*100)/100,Math.max(z.cd||0,z.gcd||0),sp,targets,note,z);
const SWORD=[A2("Bash Lv10","phys",400,1,"W",15,1,"",Z(0,0,0,0)),A2("Magnum Break Lv10","phys",300,1,"Fire",30,3,"5x5 around you",Z(0,0,2,0))];
const BOLT3=[A2("Fire Bolt Lv10","magic",100,10,"Fire",30,1,"",Z(1.2,3.2,0,1.4,{sadd:[["int",0.5]]})),A2("Cold Bolt Lv10","magic",100,10,"Water",30,1,"",Z(1.2,3.2,0,1.4,{sadd:[["int",0.5]]})),A2("Lightning Bolt Lv10","magic",100,10,"Wind",30,1,"",Z(1.2,3.2,0,1.4,{sadd:[["int",0.5]]}))];
const MAGE=[...BOLT3,A2("Earth Spike Lv5","magic",200,5,"Earth",30,1,"",Z(0.28,1.12,0.7,0.3,{sadd:[["int",1]]})),A2("Soul Strike Lv10","magic",100,5,"Ghost",38,1,"+50% vs Undead element not included",Z(0.1,0.4,0,0)),
 A2("Fire Ball Lv10","magic",340,1,"Fire",25,3,"340% centre, 255% around it",Z(0.1,0.4,0.35,0.3)),A2("Frost Driver Lv10","magic",200,1,"Water",16,1,"",Z(0.16,0.64,0,0)),
 A2("Napalm Beat Lv10","magic",170,1,"Ghost",18,1,"Damage is split when it hits several monsters",Z(0.1,0.4,0,0)),A2("Thunder Storm Lv10","magic",100,10,"Wind",74,3,"5x5 area",Z(0.8,3.2,1,0.3,{sadd:[["int",1]]}))];
const ARCH=[A2("Double Strafe Lv10","phys",190,2,"W",12,1,"",Z(0,0,0,0.1)),A2("Arrow Shower Lv10","phys",250,1,"W",15,3,"3x3 area",Z(0,0,0,0))];
const ACO=[A2("Holy Light","magic",125,1,"Holy",15,1,"",Z(0.2,0.8,0,0))];
const MERC=[A2("Mammonite Lv10","phys",600,1,"W",5,1,"Costs 1,000 z per use (taken off zeny/hr)",Z(0,0,0,0,{zeny:1000})),A2("Cart Revolution","phys",150,1,"W",12,3,"Quest skill; +100% per 8,000 cart weight (set Cart weight)",Z(0,0,0,0,{cart:100}))];
const THIEF=[A("Basic attack (Double Attack Lv10)","auto",100,1.5,"W",0,0,0,1,"Dagger: about half your hits strike twice"),A2("Envenom Lv10","phys",100,1,"Poison",12,1,"Plus a flat +150 damage, not included",Z(0,0,0,0)),A2("Sand Attack","phys",130,1,"Earth",9,1,"",Z(0,0,0,0))];
const JOBS={
 "Novice":{w:"Dagger",p:[BASIC]},
 "Swordsman":{w:"One-handed sword",p:[...SWORD,BASIC]},"Mage":{w:"One-handed staff",p:[...MAGE.filter(p=>!p.name.startsWith("Earth Spike")),BASIC]},"Archer":{w:"Bow",p:[...ARCH,BASIC]},
 "Acolyte":{w:"One-handed mace",p:[...ACO,BASIC]},"Merchant":{w:"One-handed axe",p:[...MERC,BASIC]},"Thief":{w:"Dagger",p:[...THIEF]},
 "Knight":{w:"Two-handed spear",p:[A2("Bowling Bash Lv10","phys",500,3,"W",38,2,"Hits 3–5 times (more with a two-handed sword); +STR% per hit",Z(0.4,1.6,4,0.3,{sadd:[["str",1]]})),
   A2("Brandish Spear Lv10","phys",1400,1,"W",24,3,"Spear, mounted only. +5×STR%",Z(0,0,2,0.3,{sadd:[["str",5]]})),A2("Pierce Lv10","phys",200,3,"W",10,1,"Spear only. Hits 2/3/4 times on small/medium/large; +2×STR%",Z(0,0,0,0,{sizeHits:[2,3,4],sadd:[["str",2]]})),
   A2("Spear Stab Lv10","phys",300,1,"W",9,2,"Spear only. Hits everything in a line",Z(0,0,0,0)),A2("Spear Boomerang Lv5","phys",350,1,"W",10,1,"Spear only. Range 11",Z(0,0,0,0)),
   A2("Clashing Spiral Lv5","phys",400,5,"W",30,1,"5 hits, scales with base level and weapon weight",Z(0.12,0.44,0.5,0.3,{blv:true})),A2("Traumatic Blow Lv5","phys",300,1,"W",23,1,"",Z(0,0,0,0)),A2("Vital Strike Lv10","phys",150,1,"W",20,1,"Spear only",Z(0,0,0,0)),...SWORD,BASIC]},
 "Crusader":{w:"One-handed sword",p:[A2("Holy Cross Lv10","phys",450,1,"Holy",20,1,"+2×VIT%",Z(0,0,0,0,{sadd:[["vit",2]]})),A2("Holy Cross Lv10 (spear)","phys",900,1,"Holy",20,1,"Spear: (450 + 5×VIT)% × 2",Z(0,0,0,0,{sadd:[["vit",10]]})),
   A2("Grand Cross Lv10","phys",500,3,"Holy",100,3,"Uses ATK and MATK, costs 20% of your HP. Modelled on ATK",Z(0.3,1.2,1,0)),A2("Shield Boomerang Lv5","phys",400,1,"Neutral",12,1,"+ shield weight + 4×shield refine",Z(0,0,0,0)),
   A2("Smite Lv5","phys",200,1,"W",10,1,"Shield only",Z(0,0,0,0)),A2("Rapid Smiting Lv5","phys",2600,1,"W",40,1,"Shield only, + shield weight and refine",Z(0.2,0.8,0,0)),A2("Cannon Spear Lv5","phys",600,1,"W",28,3,"Spear only. (120 + STR)% × 5 × base level / 100",Z(0.1,0.4,0,1,{blv:true,sadd:[["str",5]]})),
   A2("Gloria Domini Lv5","magic",1450,1,"Holy",50,1,"",Z(0.28,1.12,0,0)),...SWORD,BASIC]},
 "Wizard":{w:"One-handed staff",p:[A2("Jupitel Thunder Lv10","magic",100,12,"Wind",47,1,"",Z(0.56,2.24,0,0)),A2("Heaven's Drive Lv5","magic",200,5,"Earth",44,3,"5x5 area, +INT%",Z(0.4,0.6,0.5,0.3,{sadd:[["int",1]]})),
   A2("Napalm Vulcan Lv5","magic",350,5,"Ghost",70,2,"3x3 area, scales with base level",Z(0.1,0.4,0.3,0.5,{blv:true})),A2("Storm Gust Lv10","magic",570,3,"Water",78,5,"(570 + INT)% per hit, up to 10 hits but monsters freeze after ~3",Z(1.2,4.8,2.5,0.3,{sadd:[["int",1]]})),
   A2("Lord of Vermilion Lv10","magic",1400,1,"Wind",96,5,"13x13 area, +INT%",Z(0.84,3.36,1.5,0.3,{sadd:[["int",1]]})),A2("Meteor Storm Lv10","magic",625,1,"Fire",64,4,"(125 + INT)% × 5 per meteor, 7 meteors over 13x13",Z(1.2,4.8,2.5,0.3,{sadd:[["int",5]]})),
   A2("Gravitational Field Lv5","magic",500,10,"Neutral",100,4,"5x5 area, scales with base level",Z(1,4,4.5,0.3,{blv:true})),A2("Sightrasher Lv10","magic",300,1,"Fire",53,3,"Needs Sight",Z(0.08,0.32,0,0)),...MAGE,BASIC]},
 "Sage":{w:"Book",p:[A("Spell Fist (full Sage model)","spellfist",0,1,"Fire",0,0,0,1,"Spell Fist procs with the best of your ticked bolts, plus the Sage options below"),A2("Heaven's Drive Lv5","magic",200,5,"Earth",44,3,"5x5 area, +INT%",Z(0.4,0.6,0.5,0.3,{sadd:[["int",1]]})),...MAGE,BASIC]},
 "Hunter":{w:"Bow",p:[A2("Focused Arrow Strike Lv5","phys",1800,1,"W",24,2,"5x5 around the target, scales with base level",Z(0.5,0.5,0.15,0.5,{blv:true})),...ARCH,BASIC]},
 "Bard":{w:"Musical instrument",p:[A2("Arrow Vulcan Lv10","phys",3000,1,"W",30,1,"Instrument only, scales with base level",Z(0.38,1.52,1.5,0.3,{blv:true})),A2("Melody Strike Lv5","phys",300,2,"W",15,1,"Instrument only. +INT% per hit",Z(0.1,0.4,0,0.3,{sadd:[["int",1]]})),...ARCH,BASIC]},
 "Dancer":{w:"Whip",p:[A2("Arrow Vulcan Lv10","phys",3000,1,"W",30,1,"Whip only, scales with base level",Z(0.38,1.52,1.5,0.3,{blv:true})),A2("Slinging Arrow Lv5","phys",300,2,"W",15,1,"Whip only. +INT% per hit",Z(0.1,0.4,0,0.3,{sadd:[["int",1]]})),...ARCH,BASIC]},
 "Priest":{w:"One-handed mace",p:[A2("Magnus Exorcismus Lv10","magic",100,10,"Holy",58,4,"Costs a Blue Gemstone. 130% vs Demon, Undead and Shadow",Z(0.5,2,3,0.3)),...ACO,BASIC]},
 "Monk":{w:"Knuckle",p:[A2("Throw Spirit Sphere Lv5","phys",1600,1,"W",28,1,"Uses 1 spirit sphere",Z(0.2,0.8,1,0)),A2("Occult Impaction Lv5","phys",500,1,"W",20,1,"Uses 1 spirit sphere. More vs high DEF",Z(0.2,0.8,0,0)),
   A2("Excruciating Palm","phys",800,1,"W",40,1,"Costs 200 HP",Z(0,0,0,0)),A2("Combo: Quadruple Blow + Raging Thrust","phys",2100,1,"W",16,1,"After a Triple Attack proc; Thrust uses a sphere",Z(0,0,0,0)),...ACO,BASIC]},
 "Blacksmith":{w:"Two-handed axe",p:[A2("Power Swing Lv10","phys",1300,1,"W",19,1,"+STR% +DEX%",Z(0,0,0,0.2,{sadd:[["str",1],["dex",1]]})),A2("Axe Tornado Lv5","phys",4300,1,"W",45,3,"Axe only. 7x7 around you. (4300 + 10×VIT)% × base level / 100",Z(0,0,2,0.3,{blv:true,sadd:[["vit",10]]})),
   A2("Axe Boomerang Lv5","phys",500,1,"W",14,1,"Plus axe weight, scales with base level",Z(0,0,0.6,0,{blv:true})),...MERC,BASIC]},
 "Alchemist":{w:"Two-handed axe",p:[A2("Acid Terror Lv5","phys",1000,1,"W",15,1,"Costs an Acid Bottle",Z(0.2,0.8,0,0)),A2("Acid Bomb Lv10","phys",4000,1,"W",50,1,"Costs an Acid Bottle and a Molotov Cocktail. Scales with base level",Z(0.2,0.8,0.5,0.3,{blv:true,sadd:[["int",2]]})),...MERC,BASIC]},
 "Assassin":{w:"Katar",p:[A2("Sonic Blow Lv10","phys",1100,1,"W",28,1,"Katar only. +50% below half HP. 1100% on Zero Global",Z(0,0,1,0)),A2("Meteor Assault Lv10","phys",1400,1,"W",40,3,"5x5 around you. (1400 + 5×AGI)% × base level / 100",Z(0,0,0.7,0.3,{blv:true,sadd:[["agi",5]]})),
   A2("Soul Destroyer Lv10","phys",1500,1,"W",60,1,"(1500 + STR + INT)% × base level / 100",Z(0.1,0.4,0.5,0.3,{blv:true,sadd:[["str",1],["int",1]]})),A2("Venom Splasher Lv10","phys",1400,1,"W",30,2,"Explodes after 2s, 5x5",Z(0.2,0.8,1,0)),
   A2("Grimtooth Lv5","phys",200,1,"W",8,2,"Katar, from Hiding. (200 + AGI)%",Z(0,0,1,0,{sadd:[["agi",1]]})),
   A2("Venom Knife","phys",500,1,"W",35,1,"Costs a Venom Knife",Z(0,0,0,0)),A("Basic attack (katar)","auto",100,1.2,"W",0,0,0,1,"Katar extra hit averaged in"),...THIEF]},
 "Rogue":{w:"Dagger",p:[A2("Back Stab Lv10","phys",700,2,"W",12,1,"Hits twice with a dagger, half damage with a bow",Z(0,0,0.7,0.3)),A2("Triangle Shot Lv10","phys",2300,1,"W",20,1,"Bow, costs 3 arrows. (2300 + 3×AGI)% × base level / 100",Z(0.2,0.8,0,0.2,{blv:true,sadd:[["agi",3]]})),
   A2("Sightless Mind Lv5","phys",850,1,"W",15,3,"From Hiding, 7x7. +3×AGI% +DEX/2%",Z(0,0,0.7,0.3,{sadd:[["agi",3],["dex",0.5]]})),A2("Double Strafe Lv10","phys",190,2,"W",12,1,"Bow",Z(0,0,0,0.1)),...THIEF]}
};
// Rogue Plagiarism: one copied skill at Lv10, appended so saved preset indexes stay put. Only skills with no weapon a Rogue can't hold
// (no katar/spear/instrument/whip/axe/shield); magic copies use your MATK
(function plagiarism(){const all=Object.values(JOBS).flatMap(j=>j.p);const fix={"Bowling Bash Lv10":"Hits 3–5 times; +STR% per hit"};
  ["Bowling Bash Lv10","Bash Lv10","Magnum Break Lv10","Holy Cross Lv10","Mammonite Lv10","Arrow Shower Lv10","Holy Light",
   "Fire Bolt Lv10","Cold Bolt Lv10","Lightning Bolt Lv10","Earth Spike Lv5","Soul Strike Lv10","Fire Ball Lv10","Frost Driver Lv10","Napalm Beat Lv10","Thunder Storm Lv10",
   "Jupitel Thunder Lv10","Heaven's Drive Lv5","Storm Gust Lv10","Lord of Vermilion Lv10","Meteor Storm Lv10"].forEach(n=>{const s=all.find(x=>x.name===n);
    if(s)JOBS.Rogue.p.push({...s,name:"Copied: "+s.name,note:"Plagiarism copy"+((fix[n]??s.note)?". "+(fix[n]??s.note):"")})});
  // Auto Shadow Spell Lv10 (needs Plagiarism 10): basic attacks have a 30% chance to auto-cast the copied magic skill at up to Lv7, MATK +50.
  // Lv7 ratios from Landgris skills_zero.json; single-target skills only. Auto-casts are modelled as free (no SP)
  const ss=(n,el,pct,hits,sadd,note)=>JOBS.Rogue.p.push(A("Shadow Spell: "+n,"auto",100,1.5,"W",0,0,0,1,
    `Basic attacks (Double Attack averaged in), 30% per attack to auto-cast ${n}: ${pct}%${sadd?" + "+sadd.map(([k,f])=>(f===1?"":f===0.5?"½":f+"×")+k.toUpperCase()).join(" + ")+"%":""} × ${hits} ${el}, MATK +50${note?". "+note:""}`,{ss:{el,pct,hits,sadd:sadd||[]}}));
  const INT2=[["int",0.5]];
  ss("Fire Bolt Lv7","Fire",100,7,INT2);ss("Cold Bolt Lv7","Water",100,7,INT2);ss("Lightning Bolt Lv7","Wind",100,7,INT2);
  ss("Jupitel Thunder Lv7","Wind",100,9);ss("Fire Ball Lv7","Fire",280,1,null,"Splash on nearby monsters not counted");ss("Frost Driver Lv7","Water",170,1);
  ss("Soul Strike Lv7","Ghost",100,4,null,"+35% vs Undead element not included");ss("Napalm Beat Lv7","Ghost",140,1);ss("Earth Spike Lv5","Earth",200,5,[["int",1]],"Max level is 5")})();
// Shadow Spell auto-cast damage per proc (0 when the attack has none)
const SS_CHANCE=0.3,SS_MATK=50;
const ssDmg=m=>{const s=C().a.ss;if(!s)return 0;let p=num(s.pct);s.sadd.forEach(([k,f])=>{const v=statVal(C(),k);if(v!=null)p+=v*f});return magicDmg(m,p,s.el,SS_MATK)*s.hits};
const MAGIC_JOBS=["Mage","Wizard","Sage"];
const charDefault=job=>{const J=JOBS[job]||JOBS.Novice;const mag=J.p[0].type==="magic";
  const c={baseLv:60,atkTxt:mag?"60+50":"120+200",matkTxt:mag?"100+200":"40+30",hitTxt:"300",fleeTxt:"250",aspd:170,defTxt:"40+60",maxHp:6000,maxSp:600,intTxt:mag?"60+10":"10",spRegen:0,weapon:J.w,wElem:"Neutral",
    preset:0,a:{...J.p[0]},dmgBonus:0,eq:[],
    nameType:MAGIC_JOBS.includes(job)?"magic":"phys", // name bonus defaults to the job's damage type
    autoSp:false,itemSp:37,itemPrice:200,potOn:false,potAspd:3,potPrice:2200,potMin:30,mobInterval:1.5,hitScale:0.3,hpRegen:0};
  if(job==="Sage")Object.assign(c,{matkTxt:"100+200",intTxt:"40+10",maxSp:800,maxHp:4000,sage:{hsAuto:true,hsWorth:50000,hsLv:10}});
  return c};

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
if(!Array.isArray(state.sessions)||!state.sessions.length)state.sessions=[{id:"s"+Date.now(),name:"New session",job:"",mobIds:[],entries:[]}];
// sessions hold a list of monsters (one map, plus the aggressive ones you end up killing); older saves had a single mobId
state.sessions.forEach(s=>{if(!Array.isArray(s.mobIds))s.mobIds=s.mobId!=null?[s.mobId]:[];delete s.mobId});
// no job until the player picks one on the start screen
if(!JOBS[state.job])state.job="";
if(!state.chars)state.chars={};
if(!state.current||!state.sessions.some(s=>s.id===state.current))state.current=state.sessions[0].id;
const D={bonus:0,minLv:1,maxLv:99,hideClosed:true,filters:{},sort:"epm",dir:-1,regions:{um:false},closed:[],prices:{}};
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
const aspdEff=()=>Math.min(190,Math.max(100,num(cf("aspd"),170)+(C().potOn?num(C().potAspd):0)));
const potOnlyHr=()=>C().potOn&&num(C().potMin)>0?60/num(C().potMin)*num(C().potPrice):0;
// zeny per hour spent on the ASPD potion plus the consumables that are switched on
const potCostHr=()=>potOnlyHr()+(C().cons||[]).filter(r=>r.on&&num(r.min)>0).reduce((a,r)=>a+60/num(r.min)*num(r.price),0);
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
const bonusMul=(m,magic=false)=>{const c=C();let k=1+num(c.dmgBonus)/100;
  const on=t=>t==="both"||(t==="magic")===magic;
  const nm=String(c.nameSel||"").trim().toLowerCase();if(nm&&on(c.nameType||"phys")&&String(m.name).toLowerCase().includes(nm))k*=1+num(c.namePct)/100;
  const B=c.bx?(magic?c.bx.magic:c.bx.phys):null,el=m.el||"Neutral";
  if(B)k*=(1+(B.race[m.race]||0)/100)*(1+(B.size[m.size]||0)/100)*(1+(B.ele[el]||0)/100)*(1+(B.all||0)/100)*(1+(B.kind[m.boss?"boss":"normal"]||0)/100);
  if(!m.boss)k*=1+num(c.normalPct)/100;
  k*=1+num(c.myElPct)/100;if(magic&&c.bx)k*=1+((c.bx.myEle||{})[atkEl()]||0)/100;
  // learned passives and buffs: physical damage % (Advanced Katar Mastery, Power Thrust), own spell element % (Endow, Volcano...)
  if(SKFX){if(!magic)k*=1+SKFX.pct/100;else k*=1+(SKFX.myEle[atkEl()]||0)/100}return k};
// build mode: gear EXP bonus vs a monster's race, and damage taken from its race / element / boss-normal kind
const expRace=m=>{const c=C();return c.bx?1+((c.bx.exp.all||0)+((c.bx.exp.race||{})[m.race]||0))/100:1};
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
// crits (basic attacks only): chance = CRIT (doubled with a katar), always hit, × 1.4 × (1 + crit damage %). Monster crit shield (its LUK) isn't in the data.
const critChance=()=>{const c=C();if(c.a.type!=="auto")return 0;return Math.min(100,Math.max(0,num(cf("crit"))*(c.weapon==="Katar"?2:1)))/100};
// uses needed per kill: whole hits that land, spread over misses
function usesPerKill(m){if(isSF()){const d=sfPerAttack(m);return d>0?Math.ceil(m.hp/d):Infinity}const d=dmgPerHit(m),a=C().a,ss=ssDmg(m)*SS_CHANCE;if(d<=0&&ss<=0)return Infinity;const h=a.sizeHits?a.sizeHits[{S:0,M:1,L:2}[m.size]??1]:num(a.hits,1);const per=d*Math.max(0.01,h);const cr=critChance();
  // Shadow Spell: the auto-cast is averaged into each attack and only procs on swings that connect (crits always do)
  if(cr>0||ss>0){const land=cr+(1-cr)*hitChance(m)/100;const exp=per*(cr*1.4*(1+num(C().critDmg)/100)+(1-cr)*hitChance(m)/100)+ss*land;return Math.max(1,m.hp/exp)}
  return Math.ceil(m.hp/per)/(hitChance(m)/100)}
// SP: a use costs SP; natural regen is 1 + MaxSP/100 + INT/6 per 8s unless typed
const spRegen8=()=>num(C().spRegen)>0?num(C().spRegen):1+Math.floor(num(cf("maxSp"))/100)+Math.floor(statVal(C(),"int")/6);
// gear "SP consumption +x%" (build mode) scales the SP each use costs
const spCostMul=()=>{const c=C();return Math.max(0,1+(c.bx?num(c.bx.spCost):0)/100+(SKFX?SKFX.spCost:0)/100)};
const spNeedPerSec=()=>isSF()?sgUpkeep()+sgDefSP()+hsFullSP()*hsSustain():num(C().a.sp)*spCostMul()/useSec();
const regenPerSec=()=>spRegen8()/8;
// items per second when auto SP items are on (covers the gap); otherwise you rest, which stretches fight time
const itemsPerSec=()=>isSF()?sgItemsPerSec():C().autoSp&&num(C().itemSp)>0?Math.max(0,spNeedPerSec()-regenPerSec())/num(C().itemSp):0;
const restFactor=()=>{if(isSF())return 1;if(C().autoSp&&num(C().itemSp)>0)return 1;const need=spNeedPerSec(),r=regenPerSec();return need>r&&r>0?need/r:need>0&&r<=0?Infinity:1};
const rawFight=m=>{const u=usesPerKill(m);return isFinite(u)?u*useSec()/targets():Infinity};
const fightSec=m=>rawFight(m)*restFactor();
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
  const band=i=>{const red=ec?EC_BANDS[i][0]:0,ecSP=ec?hits*EC_BANDS[i][1]/100*max:0,taken=raw*(1-red/100)*hits,hp=Math.max(0,taken-hfHpPerSec()),healSP=g.vitata&&num(g.healHp)>0?hp/num(g.healHp)*num(g.healSp):0;return {i,red,ecSP,healSP,hp,taken,label:ec?EC_BANDS[i][2]:""}};
  const cost=b=>up+b.ecSP+b.healSP;
  let b=null;for(let i=0;i<5;i++){const x=band(i);if(cost(x)+hs<=regen){b=x;break}}
  if(!b){const p=num(g.autoSpPct,50);b=sgItemsOn()?band(p>80?0:p>60?1:p>40?2:p>20?3:4):band(4)}
  return {...b,extra:b.ecSP+b.healSP};
}
let SG_MOB=null; // monster the SP balance is worked out against
const sgDefSP=()=>{const m=SG_MOB||calcMob();const d=m?sgDefense(m):null;return d?d.extra:0};
const sgItemsPerSec=()=>sgItemsOn()?Math.max(0,sgUpkeep()+sgDefSP()+hsFullSP()-regenPerSec())/num(C().itemSp):0;
// without SP items, Hindsight only fires as often as spare regen pays for
const hsSustain=()=>{const f=hsFullSP();if(f<=0||sgItemsOn())return 1;return Math.max(0,Math.min(1,(regenPerSec()-sgUpkeep()-sgDefSP())/f))};
const sfPerAttack=m=>{const el=atkEl();return sfChance()*magicDmg(m,sfPct(),el)*daFactor()+hsChance()*hsSustain()*hsBoltLv()*magicDmg(m,100,el)*(1+dbChance())};
// Hindsight auto: on for the session's map only when the extra EXP costs less than your limit per 1% (after the extra loot)
function applyHsAuto(){
  const g=G();if(!isSF()||!g.hsAuto){g._note="";return}
  const mp=currentMap()||(calcMob()&&(openMaps(calcMob())[0]||[])[0]);if(!mp||!MAPMOBS[mp]){g._note="Auto needs a monster with an open map";return}
  const L=lvExp(num(C().baseLv))||lvExp(62);const w=walkSec();
  const top=MAPMOBS[mp].filter(x=>!x.m.boss&&!isSkipped(x.m)&&x.m.atkMin!=null).sort((a,b)=>b.n-a.n)[0];const mm=top?top.m:null;
  const run=v=>withHs(v,()=>{const k=SG_MOB;SG_MOB=mm;try{return {r:mapStats(mp,w),items:sgItemsPerSec()}}finally{SG_MOB=k}});
  const on=run(true),off=run(false);if(!on.r||!off.r){g._note="Auto: no result for "+mp;return}
  const costHr=(on.items-off.items)*3600*num(C().itemPrice),gain=(on.r.epm-off.r.epm)*60/L*100,net=costHr-(on.r.zph-off.r.zph),per=gain>0?net/gain:Infinity;
  const want=gain>0&&(net<=0||per<=num(g.hsWorth));g.hsOn=want;
  g._note=`Hindsight auto: ${want?"on":"off"} on ${mp} · ${gain<=0?"no EXP gain":net<=0?"extra loot pays for the SP items":`~${fmtN(per)} z per 1% EXP vs your ${fmtN(num(g.hsWorth))} z limit`} (+${gain.toFixed(2)}%/hr)`;
}
// drop rate bonus % scales every drop chance
// zeny a skill costs per kill (Mammonite): zeny per use × uses per kill, shared across monsters hit
const skillZeny=m=>{const z=num(C().a.zeny);if(!z)return 0;const u=usesPerKill(m);return isFinite(u)?z*u/targets():0};
const zenyKill=m=>{let z=m.loot||0;(m.drops||[]).forEach(([id,r])=>{const p=state.prices[id];if(p>0)z+=r/100*p});return z*(1+num(state.dropBonus)/100)};

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
const isClosed=map=>{const r=regionOf(map);return (r&&state.regions[r.id]!==false)||state.closed.includes(map.toLowerCase())};
const openMaps=m=>(SPAWN[m.id]||[]).filter(x=>!isClosed(x[0])).sort((a,b)=>b[1]-a[1]);
// monsters you skip (e.g. ones that stun you): left out of map averages, you walk past them
const isSkipped=m=>!!(state.skipMobs&&state.skipMobs.includes(m.id));
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
function sessMix(s,keep){const mp=sessMap(s);let list=sessMobs(s).map(m=>({m,w:spawnOn(m,mp)}));if(keep){const k=list.filter(x=>keep(x.m));if(k.length)list=k}
  const W=list.reduce((a,x)=>a+x.w,0);if(!W)return null;
  const avg=f=>list.reduce((a,x)=>a+x.w*f(x.m),0)/W;return {list,W,mp,avg}}
function sessionPace(s){
  // with this job's attack, monsters you can't hurt aren't being killed, so they're left out of the mix
  const same=(s.job||state.job)===state.job;const st=stats(s);const mix=sessMix(s,same?m=>isFinite(bestFight(m)):null);if(!st||!mix||st.avgRaw<=0)return null;
  const kph=st.avgRaw/(mix.avg(m=>m.exp*expRace(m))*expMul(s));const obs=3600/kph;const fight=same?mix.avg(bestFight):NaN;
  return {kph,obs,fight,walk:isFinite(fight)&&obs>=fight?obs-fight:null,zk:mix.avg(zenyKill),mix,st};
}
const walkSec=()=>{if(num(state.walkOverride)>0)return num(state.walkOverride);
  const ps=state.sessions.filter(s=>(s.job||state.job)===state.job).map(sessionPace).filter(p=>p&&p.walk!=null);
  const p=sessionPace(cur());if(p&&p.walk!=null)return Math.max(1,p.walk);
  return ps.length?Math.max(1,ps[0].walk):2};
// job EXP needed for your current job level (Novice / 1st / 2nd job table)
const FIRST_JOBS=["Swordsman","Mage","Archer","Acolyte","Merchant","Thief"];
const jobTier=()=>state.job==="Novice"?"novice":FIRST_JOBS.includes(state.job)?"first":"second";
const jobNeed=()=>{const l=num(C().jobLv);const t=JOB_EXP[jobTier()];return l>=1&&l<=t.length?t[l-1]:null};
function jobRate(s){
  const es=[...s.entries].filter(e=>e.jpct!=null).sort((a,b)=>a.t-b.t);if(es.length<2)return null;
  let gain=0;for(let i=1;i<es.length;i++){let d=es[i].jpct-es[i-1].jpct;if(d<0)d+=100;gain+=d}
  const h=activeH(s,es[0].t,es[es.length-1].t);return h>0?{rate:gain/h,last:es[es.length-1].jpct,h}:null;
}
function mobRow0(m,w){const kSG=SG_MOB;SG_MOB=m;try{return mobRow00(m,w)}finally{SG_MOB=kSG}}
function mobRow00(m,w){
  const sec=fightSec(m),tot=sec+w,epk=m.exp*expRace(m)*expMul();
  return {sec,tot,epm:isFinite(tot)&&tot>0?epk/tot*60:0,epk,hitc:hitChance(m),mult:hitPctOf(m),uses:usesPerKill(m),dodge:dodge(m),hpm:hpLossPerMin(m),zk:zenyKill(m)-skillZeny(m)};
}
// map averages, weighted by spawn counts; monsters you can't hurt are skipped (you walk past them)
function mapStats0(mp,w){
  const list=(MAPMOBS[mp]||[]).filter(x=>!x.m.boss&&!isSkipped(x.m));let N=0,n=0,exp=0,time=0,z=0,hp=0,hpN=0;const skip=[];
  list.forEach(({m,n:c})=>{N+=c;const r=mobRow0(m,w);if(!isFinite(r.sec)){skip.push(m.name);return}
    n+=c;exp+=c*r.epk;time+=c*r.tot;z+=c*r.zk;if(r.hpm!=null){hp+=c*r.hpm*r.tot;hpN+=c*r.tot}});
  if(!n)return null;
  return {mp,N,epm:exp/time*60,secT:time/n,sec:time/n-w,walk:w,epk:exp/n,zph:z/time*3600,hpm:hpN?hp/hpN:null,skip:skip.length,skipNames:skip};
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

// ---- render: character ----
const syncChar=()=>{
  const c=C();$("job").value=state.job;renderEq();renderCons();
  $("preset").innerHTML=JOBS[state.job].p.map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join("")+'<option value="-1">Custom</option>';
  $("preset").value=String(c.preset??0);renderSkills();
  ["baseLv","jobLv","atkTxt","matkTxt","hitTxt","fleeTxt","aspd","defTxt","maxHp","maxSp","intTxt","wAtk","fctSec","normalPct","myElPct","ignDef","ignMdef","mastery","rangePct","skillPct","crit","critDmg","fixedShare","vctPct","fctPct","acdPct","dmgBonus","nameSel","namePct","itemSp","itemPrice","mobInterval","hitScale","hpRegen"].forEach(k=>$(k).value=c[k]??"");$("wAtk").value=num(c.wAtk)>0?c.wAtk:"";
  $("spRegen").value=num(c.spRegen)>0?c.spRegen:"";
  $("weapon").value=c.weapon;$("wElem").value=c.wElem;$("nameType").value=c.nameType||"phys";$("autoSp").checked=!!c.autoSp;$("converters").checked=!!c.converters;$("potOn").checked=!!c.potOn;$("potAspd").value=c.potAspd??3;$("potPrice").value=c.potPrice??2200;$("potMin").value=c.potMin??30;$("potInfo").textContent=c.potOn?`ASPD ${aspdEff()} · ~${fmtN(potCostHr())} z/hr`:"";$("convNote").textContent=c.converters&&c.a.el!=="W"?"(this attack has its own element, so converters don't change it)":"";
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
  $("itemInfo").textContent=c.autoSp?(ips>0?`≈ ${(ips*60).toFixed(1)} items/min · ${fmtN(ips*3600*num(c.itemPrice))} z/hr`:"not needed: regen covers it"):"";
  const atk=a.type==="magic"||a.type==="spellfist"?`MATK ${fmtN(sumStat(c.matkTxt))}`:`ATK ${fmtN(sumStat(c.atkTxt))}`;
  if(state.job==="Sage"){const g=G(),m=calcMob(),d=m?((k)=>{SG_MOB=m;try{return sgDefense(m)}finally{SG_MOB=k}})(SG_MOB):null;
    $("sageInfo").innerHTML=`${g._note?esc(g._note)+" · ":""}Upkeep ${fmtN(sgUpkeep()*60)} SP/min · Hindsight ${fmtN(hsFullSP()*60)} SP/min${hsChance()>0?` (${Math.round(hsChance()*100)}% chance, Lv ${hsBoltLv()} bolt${dbChance()>0?`, +${Math.round(dbChance()*100)}% Double Bolt`:""})`:" (off)"}`+
      (d?` · vs ${esc(m.name)}: Energy Coat ${g.ecOn?`−${d.red}% at SP ${d.label}`:"off"}, defence ${fmtN(d.extra*60)} SP/min, HP lost ${fmtN(d.hp*60)}/min${hfHpPerSec()>0?` (Hunter Fly heals ~${fmtN(hfHpPerSec()*60)}/min)`:""}`:" · pick a monster to see Energy Coat and damage taken")+
      ` · SP items ${sgItemsOn()?`${(sgItemsPerSec()*60).toFixed(1)}/min ≈ ${fmtN(sgItemsPerSec()*3600*num(c.itemPrice))} z/hr`:"off (Hindsight off)"}`}
  $("charTiles").innerHTML=`<div class="tile"><div class="k">Per use</div><div class="v mono">${us.toFixed(2)}s</div><div class="s">${a.type==="auto"||a.type==="spellfist"?`ASPD ${aspdEff()}${c.potOn?" (potion)":""} · ${atkPerSec().toFixed(2)} hits/s${critChance()>0?` · ${Math.round(critChance()*100)}% crits`:""}`:`cast ${castSec().toFixed(2)}s${castSec()<num(a.cast)?` (base ${num(a.cast)}s)`:""} + delay ${delaySec().toFixed(2)}s${delaySec()<1/atkPerSec()?" · motion (ASPD) longer than delay":""}${critChance()>0?` · ${Math.round(critChance()*100)}% crits`:""}`} · ${atk}</div></div>
   <div class="tile ${need>reg&&!c.autoSp?"":"now"}"><div class="k">SP use vs regen</div><div class="v mono">${fmtN(need)} / ${fmtN(reg)}</div><div class="s">per minute · regen ${spRegen8()} per 8s${a.type==="spellfist"?(ips>0?` · ${(ips*60).toFixed(1)} SP items/min`:hsChance()>0&&hsSustain()<1?` · <span class="bad">Hindsight fires ${Math.round(hsSustain()*100)}% as often</span>`:""):need>reg?(c.autoSp?` · items cover ${fmtN(need-reg)}/min`:` · <span class="bad">you rest ${Math.round((1-1/rf)*100)}% of the time</span>`):""}</div></div>
   <div class="tile"><div class="k">Walking per kill</div><div class="v mono">${walkSec().toFixed(1)}s</div><div class="s">${num(state.walkOverride)>0?"typed in Goal":`learned from your ${state.job} logs (2s until then)`}</div></div>`;
}

// ---- render: tracker ----
function renderSessions(){$("sessionSel").innerHTML=state.sessions.map(s=>`<option value="${s.id}" ${s.id===state.current?"selected":""}>${esc(s.name)}${s.job?` · ${esc(s.job)}`:""}</option>`).join("")}
function renderTracker(){
  const s=cur(),st=stats(s);
  if(document.activeElement!==$("partyN"))$("partyN").value=partyN(s);if(document.activeElement!==$("partyBonus"))$("partyBonus").value=partyBonus(s);
  $("partyNote").textContent=partyN(s)>1?`Each kill gives you ${Math.round(expMul(s)/(1+num(state.bonus)/100)*100)}% of its EXP (party of ${partyN(s)}). Even Share only works within 15 base levels.`:"";
  $("title").textContent=`${s.name} · ${s.job||state.job}`;
  const pz=openPause(s);$("pauseBtn").textContent=pz?"Resume":"Pause";$("pauseBtn").classList.toggle("primary",!!pz);$("pauseNote").hidden=!pz;
  if(pz)$("pauseNote").textContent=`Paused since ${fmtT(pz.from)}. Time away isn't counted. Press Resume, or just log an entry, when you're back.`;
  const ms=sessMobs(s),mob=ms.length===1?ms[0]:null;
  $("subtitle").innerHTML=ms.length>1?`Farming ${ms.map(m=>esc(m.name)).join(", ")}${sessMap(s)?` on ${sessMap(s)}`:""} · weighted by spawn counts`:mob?`Farming ${esc(mob.name)} · Lv ${mob.lv} · ${mob.el?`<span class="el ${mob.el}">${mob.el} ${mob.elv}</span> · `:""}${mob.size||""} ${mob.race||""} · ${fmtN(mob.exp)} base EXP · <a href="${dbUrl(mob)}" target="_blank" rel="noopener">rozerodb ↗</a>`:"Pick a monster in the Monsters &amp; maps tab and press \"Farming this now\"";
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
  if(p){const zk=p.zk,gross=p.kph*zk,cost=itemsPerSec()*3600*num(C().itemPrice)+potCostHr()+p.kph*p.mix.avg(skillZeny);$("tZeny").textContent=fmtN(gross-cost);$("tZenyS").textContent=`${fmtN(gross)} z loot`+(cost>0?` − ${fmtN(cost)} z items, potions & skill costs`:"")+` · ${fmtN(zk)} z/kill`}
  else{$("tZeny").textContent="–";$("tZenyS").textContent="Needs a monster and 2+ entries"}
  const j=jobRate(s);
  if(j){const need=jobNeed();$("tJob").textContent=pct(j.rate);$("tJobS").textContent=`${fmtDur((100-j.last)/j.rate)} to Job Lv ${num(C().jobLv)?num(C().jobLv)+1:"next"}`+(need?` · ≈ ${fmtN(j.rate/100*need)} job EXP/hr`:" · set your job level for job EXP/hr")}else{$("tJob").textContent="–";$("tJobS").textContent="Add Job EXP % to 2+ entries"}
  renderChart(s);renderLog(s);renderCompare();renderGoal(s,st);
}
function renderChart(s){
  const svg=$("chart"),es=[...s.entries].sort((a,b)=>a.t-b.t);const W=800,H=340,pl=52,pr=18,pt=16,pb=34;
  if(!es.length){svg.innerHTML=`<text x="${W/2}" y="${H/2}" text-anchor="middle">No entries yet</text>`;return}
  const base=es[0].lv;const y=es.map(e=>(e.lv-base)*100+e.pct);let lo=Math.min(...y),hi=Math.max(...y);
  const span=Math.max(hi-lo,2),step=niceStep(span/4);lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;if(hi===lo)hi=lo+step;
  const n=es.length,t0=es[0].t,t1=es[n-1].t,act=t=>activeH(s,t0,t),actSpan=act(t1);const XT=t=>n===1||actSpan<=0?(pl+W-pr)/2:pl+act(t)/actSpan*(W-pl-pr),X=i=>XT(es[i].t);const Y=v=>pt+(hi-v)/(hi-lo)*(H-pt-pb);
  const multi=es[n-1].lv!==base;let g="";
  for(let v=lo;v<=hi+1e-9;v+=step){const lvl=base+Math.floor(v/100),q=((v%100)+100)%100;g+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)" stroke-dasharray="4 4"/><text x="${pl-8}" y="${Y(v)+4}" text-anchor="end">${multi?`${lvl}·${fmtP(q)}`:`${fmtP(v)}%`}</text>`}
  let lastX=-1e9;const labs=[];es.forEach((e,i)=>{const x=X(i);if(x-lastX>=48){labs.push(i);lastX=x}});
  if(labs[labs.length-1]!==n-1){if(n>1&&X(n-1)-X(labs[labs.length-1])<48)labs.pop();labs.push(n-1)}
  labs.forEach(i=>{g+=`<text x="${X(i)}" y="${H-10}" text-anchor="middle">${fmtT(es[i].t)}</text>`});
  // paused time is squeezed out of the x-axis; a dashed line marks where each pause was
  (s.pauses||[]).filter(p=>p.from>t0&&p.from<t1).forEach(p=>{const x=XT(p.from),m=Math.round(((p.to??Date.now())-p.from)/6e4);g+=`<line x1="${x}" x2="${x}" y1="${pt}" y2="${H-pb}" stroke="var(--warn)" stroke-dasharray="3 4"/><text x="${x+4}" y="${pt+10}" style="fill:var(--warn)">paused ${m} min</text>`});
  const pts=y.map((v,i)=>`${X(i)},${Y(v)}`).join(" ");
  g+=`<polygon points="${X(0)},${H-pb} ${pts} ${X(n-1)},${H-pb}" fill="var(--accent-soft)" stroke="none"/><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.25" stroke-linejoin="round"/>`;
  y.forEach((v,i)=>{g+=`<circle cx="${X(i)}" cy="${Y(v)}" r="${i===n-1?5.5:4}" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"><title>${fmtT(es[i].t)} · Lv ${es[i].lv} ${es[i].pct}%</title></circle>`});
  svg.innerHTML=g;
}
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x)));const f=x/p;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p}
function fmtP(v){return Number.isInteger(v)?String(v):v.toFixed(1)}
function renderLog(s){
  const es=[...s.entries].sort((a,b)=>a.t-b.t);const base=es.length?es[0].lv:0;
  $("logTable").querySelector("tbody").innerHTML=es.map((e,i)=>{let rate="";if(i>0){const q=es[i-1],h=activeH(s,q.t,e.t);rate=h>0?pct((cumulative(e,base)-cumulative(q,base))/h/(lvExp(e.lv)||100)*100):"–"}
    return `<tr data-t="${e.t}" style="cursor:default"><td>${fmtT(e.t)}</td><td>${e.lv}</td><td>${e.pct.toFixed(2)}%</td><td>${e.jpct!=null?e.jpct.toFixed(2)+"%":"–"}</td><td>${rate}</td><td><button class="small danger" data-del="${e.t}" aria-label="Delete entry">✕</button></td></tr>`}).reverse().join("")
    ||`<tr><td colspan="6" class="name muted">No entries yet. Add your current level and EXP %.</td></tr>`;
  $("setupNote").textContent=s.job&&s.job!==state.job?`This session was logged as ${s.job}. Switch Job to ${s.job} to see its pace and walking time.`:"";
}
function renderCompare(){
  const rows=state.sessions.map(s=>{const st=stats(s);if(!st)return null;const ms=sessMobs(s),mix=sessMix(s);const kph=mix&&st.avgRaw>0?st.avgRaw/(mix.avg(m=>m.exp*expRace(m))*expMul(s)):null;
    return `<tr data-sid="${s.id}" class="${s.id===state.current?"sel":""}"><td class="name">${esc(s.name)}</td><td class="name">${esc(s.job||"–")}</td><td class="name">${ms.length?ms.map(m=>esc(m.name)).join(", "):"–"}</td><td>${new Date(st.es[0].t).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} ${fmtT(st.es[0].t)}</td><td>${st.spanMin} min</td><td><b>${pct(st.avgPct)}</b></td><td>${fmtN(st.avgRaw/60)}</td><td>${kph?fmtN(kph):"–"}</td><td>${kph?(3600/kph).toFixed(1)+"s":"–"}</td></tr>`}).filter(Boolean);
  $("cmpTable").querySelector("tbody").innerHTML=rows.join("")||'<tr><td colspan="9" class="name muted">Sessions with 2+ entries show up here.</td></tr>';
}
function renderGoal(s,st){
  const tiles=$("goalTiles");$("goalViz").hidden=true;
  if(!st||st.avgRaw<=0){tiles.innerHTML='<div class="note">Log 2+ entries with EXP going up to see goal estimates.</div>';$("goalNote").textContent="";return}
  const curLv=st.last.lv,goal=num(state.goalLv)||(curLv<70?70:curLv+1);
  if(goal<=curLv){tiles.innerHTML=`<div class="note">You're already Lv ${curLv}. Pick a higher level.</div>`;$("goalNote").textContent="";return}
  let need=lvExp(curLv)?lvExp(curLv)*(1-st.last.pct/100):null;for(let l=curLv+1;l<goal&&need!=null;l++)need=lvExp(l)?need+lvExp(l):null;
  if(need==null){tiles.innerHTML='<div class="note">The EXP table covers Lv 60 to 70, so pick a goal up to Lv 71.</div>';$("goalNote").textContent="";return}
  const hrs=need/st.avgRaw;
  $("goalNote").textContent=`at your ${pct(st.avgPct)}/hr average`;
  tiles.innerHTML=`<div class="tile"><div class="k">EXP still needed</div><div class="v mono">${fmtN(need)}</div><div class="s">from Lv ${curLv} ${st.last.pct.toFixed(2)}% to Lv ${goal}</div></div>
   <div class="tile"><div class="k">Farming time</div><div class="v mono">${fmtDur(hrs)}</div><div class="s">at ${fmtN(st.avgRaw)} EXP/hr</div></div>
   <div class="tile now"><div class="k">Reach Lv ${goal}</div><div class="v mono">${new Date(Date.now()+hrs*36e5).toLocaleString("en-GB",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div><div class="s">farming non-stop from now</div></div>`;
  renderGoalChart(curLv,st.last.pct,goal,st.avgRaw);
}
// projected level over farming hours at the average rate: one straight run per level, flatter as levels need more EXP.
// Each level-up gets the date you would reach it farming non-stop from now.
let GOAL_PTS=[];
function renderGoalChart(lv,p,goal,rate){
  $("goalViz").hidden=false;const svg=$("goalChart");const W=800,H=260,pl=52,pr=18,pt=24,pb=34;
  const now=Date.now();
  const dur=x=>fmtDur(x).split("\n")[0];
  const at=x=>new Date(now+x*36e5).toLocaleString("en-GB",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
  const pts=[{h:0,v:lv+p/100,lv}];let h=lvExp(lv)*(1-p/100)/rate,each=h;
  for(let l=lv+1;l<=goal;l++){pts.push({h,v:l,lv:l,each});if(l<goal){each=lvExp(l)/rate;h+=each}}
  const hi=pts[pts.length-1].h||1,ylo=lv;const X=x=>pl+x/hi*(W-pl-pr),Y=v=>pt+(goal-v)/(goal-ylo)*(H-pt-pb);
  pts.forEach((q,i)=>{q.x=X(q.h);q.y=Y(q.v);q.eta=at(q.h);
    q.tip=i?`<b>Lv ${q.lv}</b><br>${dur(q.each)} for this level · ${dur(q.h)} total<br>${q.eta} farming non-stop`:`<b>Now</b><br>Lv ${lv} ${p.toFixed(2)}%`});
  let g="";const ls=Math.max(1,Math.ceil((goal-ylo)/6));
  for(let l=ylo;l<=goal;l+=ls)g+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(l)}" y2="${Y(l)}" stroke="var(--grid)" stroke-dasharray="4 4"/><text x="${pl-8}" y="${Y(l)+4}" text-anchor="end">Lv ${l}</text>`;
  const xs=niceStep(hi/5);for(let i=0;i*xs<=hi+1e-9;i++){const x=i*xs;if(X(x)>W-pr-30&&x<hi)continue;g+=`<text x="${X(x)}" y="${H-10}" text-anchor="middle">${fmtP(+x.toFixed(2))}h</text>`}
  const line=pts.map(q=>`${q.x},${q.y}`).join(" ");
  g+=`<polygon points="${X(0)},${H-pb} ${line} ${X(hi)},${H-pb}" fill="var(--accent-soft)" stroke="none"/><line id="goalHair" y1="${pt}" y2="${H-pb}" stroke="var(--muted)" stroke-width="1" visibility="hidden"/><polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>`;
  if(pts.length<=30)pts.forEach((q,i)=>{g+=`<circle data-gi="${i}" cx="${q.x}" cy="${q.y}" r="${i&&i<pts.length-1?4:5.5}" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`});
  g+=`<text x="${X(hi)-8}" y="${Y(goal)-10}" text-anchor="end" style="fill:var(--fg)">Lv ${goal} · ${dur(hi)}</text>`;
  svg.innerHTML=g;GOAL_PTS=pts;
  const t=$("goalTable");
  t.tHead.innerHTML=`<tr><th>Level</th><th>Time for this level</th><th>Total farming</th><th>Reached, farming non-stop</th></tr>`;
  t.tBodies[0].innerHTML=pts.slice(1).map(q=>`<tr><td class="name">Lv ${q.lv}</td><td>${dur(q.each)}</td><td>${dur(q.h)}</td><td>${q.eta}</td></tr>`).join("");
}
// hover the goal chart: snap to the nearest level-up and show its tooltip
(function goalHover(){
  const svg=$("goalChart"),tip=$("goalTip");
  const hide=()=>{tip.hidden=true;const hr=$("goalHair");if(hr)hr.setAttribute("visibility","hidden")};
  svg.addEventListener("pointermove",e=>{if(!GOAL_PTS.length)return;const r=svg.getBoundingClientRect(),k=r.width/800,px=(e.clientX-r.left)/k;
    const q=GOAL_PTS.reduce((a,b)=>Math.abs(b.x-px)<Math.abs(a.x-px)?b:a);
    const hr=$("goalHair");hr.setAttribute("x1",q.x);hr.setAttribute("x2",q.x);hr.setAttribute("visibility","visible");
    tip.innerHTML=q.tip;tip.hidden=false;const w=tip.offsetWidth/2;tip.style.left=Math.min(Math.max(q.x*k,w),r.width-w)+"px";tip.style.top=q.y*k+"px"});
  svg.addEventListener("pointerleave",hide);
})();

// ---- render: monsters ----
const calcMob=()=>MOBS.find(m=>m.id===(state.calcMobId||cur().mobIds[0]));
const colText=(m,k)=>k==="name"?m.name:k==="el"?(m.el||"")+" "+(m.elv||""):k==="size"?({S:"small S",M:"medium M",L:"large L"}[m.size]||""):k==="race"?(m.race||""):k==="topN"?m.om.map(x=>x[0]).join(" "):null;
const colNum=(m,k)=>{if(["name","el","size","race"].includes(k))return null;if(k==="dodge")return m.dodge;if(k==="hpm")return m.hpm;if(k==="zk")return m.loot==null?null:m.zk;const v=m[k];return typeof v==="number"&&!isFinite(v)?null:v};
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
function renderMobs(){
  const w=walkSec();const lvMin=num(state.minLv),lvMax=num(state.maxLv)||999;
  let rows=MOBS.filter(m=>!m.boss&&m.lv>=lvMin&&m.lv<=lvMax&&!(state.hideClosed&&SPAWN[m.id]&&!openMaps(m).length)).map(m=>{const om=openMaps(m);return {...m,om,topN:om.length?om[0][1]:0,ratio:m.hp>0?m.exp/m.hp:0,...mobRow(m,w)}});
  const F=state.filters;rows=rows.filter(m=>Object.entries(F).every(([k,v])=>!v||matchF(v,colNum(m,k),colText(m,k))));
  const k=state.sort,d=state.dir;const sv=m=>{const v=k==="name"||k==="el"||k==="size"||k==="race"?colText(m,k):colNum(m,k);return v==null||v===""?null:v};
  rows.sort((a,b)=>{const x=sv(a),y=sv(b);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return (x>y?1:x<y?-1:0)*d});
  document.querySelectorAll("#mobTable th").forEach(th=>th.classList.toggle("on",th.dataset.k===k));
  const sel=(calcMob()||{}).id;
  $("mobNote").textContent=`${rows.length} monsters · ${state.job} · ${C().a.type==="magic"?"MATK":"ATK"} ${fmtN(sumStat(C().a.type==="magic"?C().matkTxt:C().atkTxt))} · ${convOn()?"best converter per monster":atkEl()}`;
  $("mobTable").querySelector("tbody").innerHTML=rows.slice(0,400).map(m=>`<tr data-id="${m.id}" class="${m.id===sel?"sel":""}"><td class="name">${esc(m.name)}${isSkipped(m)?' <span class="pill down">skipped</span>':""}</td><td>${m.lv}</td><td>${m.el?`<span class="el ${m.el}">${m.el} ${m.elv}</span>`:"–"}</td><td>${m.size||"–"}</td><td class="name">${m.race||"–"}</td><td>${fmtN(m.hp)}</td><td>${fmtN(m.exp)}</td><td>${m.ratio.toFixed(2)}</td>
    <td class="${m.mult>100?"good":m.mult<=0?"bad":""}">${m.mult<=0?"can't hurt":Math.round(m.mult)+"%"}${elTag(m.el2)}</td><td class="${m.hitc>=95?"good":m.hitc>=70?"warnc":"bad"}">${Math.round(m.hitc)}%</td><td>${isFinite(m.uses)?m.uses.toFixed(1):"–"}</td>
    <td class="${m.sec<=3?"good":m.sec<=8?"warnc":"bad"}">${isFinite(m.sec)?m.sec.toFixed(1)+"s":"–"}</td><td><b>${m.epm?fmtN(m.epm):"–"}</b></td>
    <td class="${m.dodge==null?"":m.dodge>=70?"good":m.dodge>=40?"warnc":"bad"}">${m.dodge==null?"–":m.dodge+"%"}</td><td>${m.hpm==null?"–":fmtN(m.hpm)}</td><td>${m.loot==null?"–":fmtN(m.zk)}</td>
    <td class="name">${m.om.length?`<span class="map" title="${m.om.map(x=>x[0]+" ≈"+x[1]).join(", ")}"><b>${m.om[0][0]}</b><span>≈${m.om[0][1]}</span></span>`:'<span class="note">none open</span>'}</td><td><a href="${dbUrl(m)}" target="_blank" rel="noopener" title="rozerodb">↗</a></td></tr>`).join("")
    ||'<tr><td colspan="18" class="name muted">No monsters match these filters.</td></tr>';
  renderMobTiles();
}
function renderMobTiles(){
  const m=calcMob();if(!m){$("mobTiles").innerHTML='<div class="note">Click a monster to see it here.</div>';return}
  const r=mobRow(m,walkSec());const s=cur();const L=lvExp(num(C().baseLv))||null;const om=openMaps(m);
  $("mobTiles").innerHTML=`<div class="tile now"><div class="k">${esc(m.name)} · Lv ${m.lv}</div><div class="v mono">${r.epm?fmtN(r.epm):"–"}</div><div class="s">EXP/min${r.el2&&convOn()?` with ${r.el2} converter`:""} · ${isFinite(r.sec)?r.sec.toFixed(1)+"s fight + "+walkSec().toFixed(1)+"s walk":"can't hurt it"}${L&&r.epm?` · ~${pct(r.epm*60/L*100)}/hr at Lv ${C().baseLv}`:""}</div></div>
   <div class="tile"><div class="k">Per kill</div><div class="v mono">${isFinite(r.uses)?r.uses.toFixed(1):"–"} uses</div><div class="s">${fmtN(withEl(r.el2,()=>dmgPerHit(m)))} per hit · ${Math.round(r.hitc)}% land · ${fmtN(num(C().a.sp)*r.uses/targets())} SP</div></div>
   <div class="tile"><div class="k">Defence</div><div class="v mono">${r.hpm==null?"–":fmtN(r.hpm)}</div><div class="s">HP lost/min · you dodge ${r.dodge??"–"}% · DEF ${m.def??"–"} · MDEF ${m.mdef??"–"}</div></div>
   <div class="tile"><div class="k">Maps</div><div class="v mono">${om.length?om[0][0]:"–"}</div><div class="s">${om.length?om.slice(0,4).map(x=>`${x[0]} ≈${x[1]}`).join(" · "):"none open"} · <a href="${dbUrl(m)}" target="_blank" rel="noopener">rozerodb ↗</a></div></div>
   <div class="bar" style="grid-column:1/-1">${s.mobIds.includes(m.id)?'<span class="pill up">In this session</span> <button type="button" class="small" id="dropMobBtn">Remove from session</button>':`<button type="button" class="primary" id="useMobBtn">${s.mobIds.length?`Also killing ${esc(m.name)}`:`Farming ${esc(m.name)} now`}</button>`}</div>`;
  const b=$("useMobBtn");if(b)b.addEventListener("click",()=>{toggleSessMob(m.id);state.calcMobId=null;save();renderAll()});
  const d=$("dropMobBtn");if(d)d.addEventListener("click",()=>{toggleSessMob(m.id);save();renderAll()});
}
function renderBest(){
  const min=num($("bestMin").value),lim=num($("bestN").value,10);const w=walkSec();const s=cur(),st=stats(s);const curMap=currentMap();
  const curEpm=curMap?sessEpm(s,w):null;
  const rows=Object.keys(MAPMOBS).filter(mp=>!isClosed(mp)).map(mp=>mapStats(mp,w)).filter(r=>r&&r.N>=min);
  rows.sort((a,b)=>b.epm-a.epm);rows.forEach((r,i)=>r.rank=i+1);rows.splice(lim);
  const bk=state.bestSort||"epm",bd=state.bestDir||-1;const val=r=>r[bk];
  rows.sort((a,b)=>{const x=val(a),y=val(b);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return (x>y?1:x<y?-1:0)*bd});
  document.querySelectorAll("#bestTable th").forEach(th=>th.classList.toggle("on",th.dataset.bk===bk&&th.textContent!=="Projected"));
  $("bestBasis").textContent=`${state.job} · ${C().a.name||"attack"} · ${convOn()?"best converter per map":atkEl()} · walking ~${w.toFixed(1)}s/kill`+(curEpm&&st?` · compared with your session on ${curMap} at ${pct(st.avgPct)}/hr`:"");
  const sameJob=(s.job||state.job)===state.job;
  $("bestTable").querySelector("tbody").innerHTML=rows.map(r=>{
    const main=MAPMOBS[r.mp].filter(x=>!x.m.boss&&!isSkipped(x.m)).sort((a,b)=>b.n-a.n).slice(0,3).map(x=>`<div>${esc(x.m.name)} <span class="note">×${x.n}</span></div>`).join("");
    const proj=st&&sameJob&&curEpm?st.avgPct*r.epm/curEpm:null;
    return `<tr data-map="${r.mp}" class="${r.mp===curMap?"sel":""}"><td>${r.rank}</td><td class="name"><b class="mono">${r.mp}</b>${r.mp===curMap?' <span class="pill">current</span>':""}${elTag(r.el2)}</td><td class="name mainmobs">${main}</td><td><b>${fmtN(r.epm)}</b></td><td>${r.sec.toFixed(1)}s + ${r.walk.toFixed(1)}s</td><td>${fmtN(r.epk)}</td><td>${fmtN(r.zph)}</td><td>${r.hpm==null?"–":fmtN(r.hpm)}</td><td>${r.skip?`<span class="pill down" title="${esc(r.skipNames.join(", "))}">${r.skip}</span>`:"–"}</td><td>≈${r.N}</td><td>${proj==null?"–":"~"+proj.toFixed(1)+"%/hr"}</td></tr>`}).join("")
    ||'<tr><td colspan="11" class="name muted">No open maps match.</td></tr>';
}
const syncClosed=()=>{$("closedMaps").value=state.closed.join(", ");
  $("regions").innerHTML=REGIONS.map(r=>{const c=state.regions[r.id]!==false;return `<button type="button" class="map ${c?"off":""}" data-region="${r.id}" title="${c?"Closed. Click to mark open":"Open. Click to mark closed"}"><b>${c?"✕":"✓"} ${r.name}</b><span>${r.when}</span></button>`}).join("")};
function renderMap(){
  let mp=(state.map||"").trim().toLowerCase();const mob=calcMob();
  if(!mp&&mob){const om=openMaps(mob);if(om.length)mp=om[0][0]}
  $("mapInput").value=mp;
  if(!MAPMOBS[mp]){$("mapTiles").innerHTML='<div class="note">Pick a map to see how this job does there.</div>';$("mapTable").querySelector("tbody").innerHTML="";return}
  const w=walkSec(),r=mapStats(mp,w);const L=lvExp(num(C().baseLv));const st=stats(cur());const L2=st?st.L:L;
  $("mapTiles").innerHTML=r?`<div class="tile now"><div class="k">Average EXP / min</div><div class="v mono">${fmtN(r.epm)}</div><div class="s">weighted by spawn counts${r.el2&&convOn()?` · bring ${r.el2} converters`:""}${r.skip?` · skips ${r.skip} you can't hurt`:""}</div></div>
   <div class="tile"><div class="k">Kills / hr</div><div class="v mono">${fmtN(3600/r.secT)}</div><div class="s">${r.sec.toFixed(1)}s fight + ${r.walk.toFixed(1)}s walk</div></div>
   <div class="tile"><div class="k">EXP / hr</div><div class="v mono">${L2?pct(r.epm*60/L2*100):fmtN(r.epm*60)}</div><div class="s">${L2?`1 level in ${fmtDur(L2/(r.epm*60))}`:"set Base level 60–70 for %"}</div></div>
   <div class="tile"><div class="k">Zeny / hr</div><div class="v mono">${fmtN(r.zph)}</div><div class="s">${r.hpm==null?"":`HP lost ~${fmtN(r.hpm)}/min`}</div></div>${isClosed(mp)?'<div class="note bad">This map is marked as not open yet.</div>':""}`
   :'<div class="note bad">Your attack can\'t hurt anything here.</div>';
  const tot=MAPMOBS[mp].filter(x=>!x.m.boss&&!isSkipped(x.m)).reduce((a,x)=>a+x.n,0)||1;
  $("mapTable").querySelector("tbody").innerHTML=MAPMOBS[mp].slice().sort((a,b)=>b.n-a.n).map(({m,n})=>{const x=r&&r.el2?withEl(r.el2,()=>mobRow0(m,w)):mobRow(m,w);
    return `<tr data-id="${m.id}" class="${cur().mobIds.includes(m.id)?"sel":""}" style="${isSkipped(m)?"opacity:.55":""}"><td class="name">${esc(m.name)} <button type="button" class="small" data-sessmob="${m.id}">${cur().mobIds.includes(m.id)?"− Session":"+ Session"}</button>${m.boss?' <span class="pill">boss</span>':` <button type="button" class="small" data-skip="${m.id}">${isSkipped(m)?"Unskip":"Skip"}</button>`}</td><td>≈${n}</td><td>${m.boss?"–":isSkipped(m)?"skipped":Math.round(n/tot*100)+"%"}</td><td>${m.lv}</td><td>${m.el?`<span class="el ${m.el}">${m.el} ${m.elv}</span>`:"–"}</td><td>${m.size||"–"}</td><td class="${x.mult>100?"good":x.mult<=0?"bad":""}">${x.mult<=0?"can't hurt":Math.round(x.mult)+"%"}</td><td>${isFinite(x.sec)?x.sec.toFixed(1)+"s":"–"}</td><td>${fmtN(m.exp)}</td></tr>`}).join("");
}
function renderAll(){SKFX=skillEffects(C());const sgTree=sageFromTree(C());ROOTQ('[data-sg="sfLv"],[data-sg="boltLv"],[data-sg="hsLv"],[data-sg="dbLv"]').forEach(i=>{i.disabled=sgTree;i.title=sgTree?"Set by the Skills card":""});ROOTQ("[data-sgbolt]").forEach(i=>i.disabled=sgTree&&!skLv(C(),SG_BOLT[i.dataset.sgbolt]));applyBuild();applyConsumables();renderBuild();applyHsAuto();renderSessions();renderChar();renderTracker();renderMobs();renderBest();renderMap()}

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
const numK=["jobLv","fctSec","normalPct","myElPct","ignDef","ignMdef","mastery","rangePct","skillPct","crit","critDmg","fixedShare","vctPct","fctPct","acdPct","wAtk","baseLv","aspd","maxHp","maxSp","spRegen","dmgBonus","namePct","itemSp","itemPrice","mobInterval","hitScale","hpRegen"];
["baseLv","jobLv","atkTxt","matkTxt","hitTxt","fleeTxt","aspd","defTxt","maxHp","maxSp","intTxt","wAtk","fctSec","normalPct","myElPct","ignDef","ignMdef","mastery","rangePct","skillPct","crit","critDmg","fixedShare","vctPct","fctPct","acdPct","spRegen","dmgBonus","nameSel","namePct","itemSp","itemPrice","mobInterval","hitScale","hpRegen"].forEach(k=>
  $(k).addEventListener("input",e=>{const v=e.target.value;const c0=C();const before=(k==="baseLv"||k==="intTxt")?derived(c0):null;C()[k]=numK.includes(k)?(v===""?(k==="hitScale"?0.3:0):num(v)):v;if(k==="mobInterval"&&!(C()[k]>0))C()[k]=1.5;if(before){shiftByStats(c0,before);["atkTxt","matkTxt","hitTxt","fleeTxt","defTxt"].forEach(x=>{if(document.activeElement!==$(x))$(x).value=c0[x]})}save();renderAll()}));
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
  const ent={t,lv:lvG,pct:pIn};if($("fJob").value!==""){ent.jpct=num($("fJob").value);const pv=[...s.entries].filter(e=>e.t<t&&e.jpct!=null).sort((a,b)=>b.t-a.t)[0];if(pv&&pv.jpct-ent.jpct>=50&&num(C().jobLv))C().jobLv=num(C().jobLv)+1}s.entries.push(ent);autoResume(s,t);if(!s.job)s.job=state.job;
  if(C().baseLv!==lvG){const c0=C(),b0=derived(c0);c0.baseLv=lvG;shiftByStats(c0,b0)}save();renderAll();syncChar();resetForm();$("fPct").focus()});
$("pasteAdd").addEventListener("click",()=>{const s=cur();let lv=num($("fLevel").value,60),n=0,ups=0;
  const parsed=$("pasteBox").value.split(/\n/).map(line=>{const m=line.match(/(\d{1,2}):?(\d{2})[^\d\n]+?(\d+(?:\.\d+)?)\s*%?(?:[^\d\n]+?(\d+(?:\.\d+)?)\s*%?)?/);if(!m||+m[1]>23||+m[2]>59)return null;return {t:entryTime(+m[1],+m[2]),pct:+m[3],jpct:m[4]!=null?+m[4]:null}}).filter(Boolean).sort((a,b)=>a.t-b.t);
  parsed.forEach(x=>{const g=guessLevel(s,x.t,lv,x.pct);if(g!==lv){ups++;lv=g}const ent={t:x.t,lv,pct:x.pct};if(x.jpct!=null)ent.jpct=x.jpct;s.entries=s.entries.filter(e=>e.t!==x.t);s.entries.push(ent);n++});
  $("pasteMsg").textContent=n?`Added ${n} entr${n===1?"y":"ies"}${ups?` with ${ups} level-up${ups>1?"s":""} (now Lv ${lv})`:` at Lv ${lv}`}.`:"No lines matched. Use the format 15:05 17.9% (job % optional)";
  if(n){autoResume(s,parsed[parsed.length-1].t);if(!s.job)s.job=state.job;$("pasteBox").value="";save();renderAll()}});
$("pauseBtn").addEventListener("click",()=>{const s=cur(),p=openPause(s);if(!s.pauses)s.pauses=[];
  if(p){p.to=Date.now();save();renderAll();showTab("track");$("fPct").focus()}else{s.pauses.push({from:Date.now()});save();renderAll()}});
$("logTable").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;const s=cur();s.entries=s.entries.filter(x=>x.t!==+b.dataset.del);save();renderAll()});
const openSession=id=>{state.current=id;state.calcMobId=null;const s=cur();if(s.job&&JOBS[s.job]&&s.job!==state.job){state.job=s.job;syncChar()}save();renderAll();resetForm()};
// accounts: switching saves this one and reloads the page with the other one's data
function renderAccts(){$("acctSel").innerHTML=accts.list.map(a=>`<option value="${a.id}" ${a.id===accts.active?"selected":""}>${esc(a.name)}</option>`).join("");$("delAcct").disabled=accts.list.length<2}
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
renderAccts();
$("sessionSel").addEventListener("change",e=>openSession(e.target.value));
// rename: swap the session picker for a text box; Enter or leaving the box saves, Esc cancels
// renameId pins the session being renamed, so a save that lands after a session switch still renames the right one
let renameId=null;
const endRename=keep=>{const i=$("sessName");if(i.hidden)return;if(keep){const v=i.value.trim(),s=state.sessions.find(x=>x.id===renameId);if(v&&s){s.name=v;save()}}renameId=null;i.hidden=true;$("sessionSel").hidden=false;$("renameSession").textContent="Rename";renderAll()};
$("renameSession").addEventListener("click",()=>{const i=$("sessName");if(!i.hidden){endRename(true);return}renameId=cur().id;i.value=cur().name;i.hidden=false;$("sessionSel").hidden=true;$("renameSession").textContent="Save";i.focus();i.select()});
$("sessName").addEventListener("keydown",e=>{if(e.key==="Enter")endRename(true);else if(e.key==="Escape")endRename(false)});
$("sessName").addEventListener("blur",()=>setTimeout(()=>endRename(true),150));
$("newSession").addEventListener("click",()=>{const id="s"+Date.now();state.sessions.push({id,name:"New session",job:state.job,mobIds:[],entries:[]});openSession(id);showTab("maps");$("mobInput").focus()});
let delArmed=false;
$("delSession").addEventListener("click",()=>{if(!delArmed){delArmed=true;$("delSession").textContent="Confirm delete";setTimeout(()=>{delArmed=false;$("delSession").textContent="Delete"},3000);return}
  delArmed=false;$("delSession").textContent="Delete";state.sessions=state.sessions.filter(s=>s.id!==state.current);
  if(!state.sessions.length)state.sessions.push({id:"s"+Date.now(),name:"New session",job:state.job,mobIds:[],entries:[]});openSession(state.sessions[0].id)});
$("cmpTable").querySelector("tbody").addEventListener("click",e=>{const tr=e.target.closest("tr[data-sid]");if(!tr)return;openSession(tr.dataset.sid);window.scrollTo({top:0,behavior:"smooth"})});
// monsters
// add or remove a monster from the current session; the first one names a fresh session and sets its job
const toggleSessMob=id=>{const s=cur();const i=s.mobIds.indexOf(id);if(i>=0){s.mobIds.splice(i,1);return}
  if(!s.mobIds.length)s.job=state.job;s.mobIds.push(id);const m=MOBS.find(x=>x.id===id);if(s.mobIds.length===1&&m&&s.name==="New session")s.name=m.name};
const pickMob=m=>{if(!m)return;state.calcMobId=m.id;const s=cur();if(!s.mobIds.length)toggleSessMob(m.id);save();renderAll()};
$("mobList").innerHTML=MOBS.map(m=>`<option value="${esc(m.name)}">Lv ${m.lv} · ${fmtN(m.exp)} EXP</option>`).join("");
$("mobInput").addEventListener("change",e=>{pickMob(MOBS.find(x=>x.name.toLowerCase()===e.target.value.trim().toLowerCase()))});
$("mobTable").querySelector("tbody").addEventListener("click",e=>{if(e.target.closest("a"))return;const tr=e.target.closest("tr[data-id]");if(tr)pickMob(MOBS.find(m=>m.id===+tr.dataset.id))});
$("mobTable").querySelector("thead").addEventListener("click",e=>{if(e.target.closest(".filters"))return;const th=e.target.closest("th");if(!th||!th.dataset.k)return;
  if(state.sort===th.dataset.k)state.dir*=-1;else{state.sort=th.dataset.k;state.dir=["name","el","size","race","sec","uses","hpm"].includes(th.dataset.k)?1:-1}save();renderMobs()});
document.querySelectorAll("[data-f]").forEach(inp=>{inp.value=state.filters[inp.dataset.f]||"";inp.addEventListener("input",()=>{state.filters[inp.dataset.f]=inp.value;save();renderMobs()})});
$("clearF").addEventListener("click",()=>{state.filters={};document.querySelectorAll("[data-f]").forEach(i=>i.value="");save();renderMobs()});
$("minLv").value=state.minLv;$("maxLv").value=state.maxLv;
["minLv","maxLv"].forEach(id=>$(id).addEventListener("input",e=>{state[id]=e.target.value===""?(id==="maxLv"?99:1):num(e.target.value);save();renderMobs()}));
$("hideClosed").checked=state.hideClosed;$("hideClosed").addEventListener("change",e=>{state.hideClosed=e.target.checked;save();renderMobs()});
// best maps + closed regions
$("bestMin").addEventListener("input",renderBest);$("bestN").addEventListener("change",renderBest);
$("bestTable").querySelector("thead").addEventListener("click",e=>{const th=e.target.closest("th[data-bk]");if(!th)return;const k=th.dataset.bk;
  if((state.bestSort||"epm")===k)state.bestDir=-(state.bestDir||-1);else state.bestDir=(k==="mp"||k==="secT"||k==="hpm"||k==="skip")?1:-1;state.bestSort=k;save();renderBest()});
$("bestTable").querySelector("tbody").addEventListener("click",e=>{const tr=e.target.closest("tr[data-map]");if(!tr)return;state.map=tr.dataset.map;save();renderMap();$("mapCard").scrollIntoView({behavior:"smooth",block:"start"})});
$("regions").addEventListener("click",e=>{const b=e.target.closest("[data-region]");if(!b)return;const id=b.dataset.region;state.regions[id]=state.regions[id]===false;syncClosed();save();renderAll()});
$("closedMaps").addEventListener("change",e=>{state.closed=[...new Set(e.target.value.split(/[\s,]+/).map(x=>x.trim().toLowerCase()).filter(Boolean))];syncClosed();save();renderAll()});
// map planner
$("mapList").innerHTML=Object.keys(MAPMOBS).sort().map(m=>`<option value="${m}">${MAPMOBS[m].length} monsters</option>`).join("");
$("mapInput").addEventListener("change",e=>{state.map=e.target.value.trim().toLowerCase();save();renderMap()});
$("mapFromMob").addEventListener("click",()=>{state.map="";save();renderMap()});
$("mapTable").querySelector("tbody").addEventListener("click",e=>{const sm=e.target.closest("[data-sessmob]");if(sm){toggleSessMob(+sm.dataset.sessmob);save();renderAll();return}const sk=e.target.closest("[data-skip]");if(sk){const id=+sk.dataset.skip;if(!state.skipMobs)state.skipMobs=[];state.skipMobs=state.skipMobs.includes(id)?state.skipMobs.filter(x=>x!==id):[...state.skipMobs,id];save();renderAll();return}const tr=e.target.closest("tr[data-id]");if(tr)pickMob(MOBS.find(m=>m.id===+tr.dataset.id))});
// goal
$("goalLv").value=state.goalLv||"";$("walkOverride").value=state.walkOverride||"";
$("goalLv").addEventListener("input",e=>{state.goalLv=num(e.target.value)||null;save();renderTracker()});
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
let bkArmed=false;
// a single-account backup replaces the current account; an all-accounts backup replaces every account
$("bkRestore").addEventListener("click",()=>{let data;try{data=JSON.parse($("bkText").value)}catch(err){$("bkMsg").textContent="That isn't a valid backup. Paste the whole text from Copy backup.";return}
  const all=data&&data.allAccounts&&Array.isArray(data.accounts);
  if(all){if(!data.accounts.length||data.accounts.some(a=>!a||typeof a.id!=="string"||!a.id)){$("bkMsg").textContent="That backup has no accounts in it.";return}}
  else if(!data||!Array.isArray(data.sessions)){$("bkMsg").textContent="That backup has no sessions in it.";return}
  if(!bkArmed){bkArmed=true;$("bkRestore").textContent=all?`Click again to replace all accounts (${data.accounts.length} in backup)`:"Click again to replace this account";setTimeout(()=>{bkArmed=false;$("bkRestore").textContent="Restore from text"},4000);return}
  bkArmed=false;
  if(all){try{accts.list.forEach(a=>localStorage.removeItem(acctKey(a.id)));data.accounts.forEach(a=>{if(a.data)localStorage.setItem(acctKey(a.id),JSON.stringify(a.data))})}catch(err){$("bkMsg").textContent="Couldn't write the backup to this browser's storage.";return}
    accts.list=data.accounts.map((a,i)=>({id:a.id,name:String(a.name||"Account "+(i+1))}));accts.active=accts.list.some(a=>a.id===data.active)?data.active:accts.list[0].id;saveAccts()}
  else{state=data;save()}
  $("bkMsg").textContent="Restored. Reloading…";try{location.reload()}catch(err){$("bkMsg").textContent="Restored. Reload the page to see it."}});
// ---- show / hide table columns (saved per table) ----
(function setupColPicks(){
  const IDS=["cmpTable","mobTable","bestTable","mapTable"];
  if(!state.hideCols)state.hideCols={};
  const st=document.createElement("style");document.body.appendChild(st);
  const apply=()=>{st.textContent=IDS.flatMap(id=>(state.hideCols[id]||[]).map(n=>`#${id} tr>:nth-child(${n}){display:none}`)).join("\n")};
  IDS.forEach(id=>{const t=document.getElementById(id);if(!t||!t.tHead)return;
    const ths=[...t.tHead.rows[0].cells];const box=document.createElement("details");box.className="note";box.style.cssText="margin:2px 0";
    box.innerHTML=`<summary style="cursor:pointer">Show / hide columns</summary><div class="bar" style="flex-wrap:wrap;gap:4px 14px;margin-top:6px">${ths.map((th,i)=>{const name=(th.textContent||"").trim();if(!name)return "";
      return `<label class="bar" style="flex-direction:row;gap:4px"><input type="checkbox" data-col="${i+1}" style="width:auto" ${(state.hideCols[id]||[]).includes(i+1)?"":"checked"}> ${name}</label>`}).join("")}
      <button type="button" class="small" data-allcols>Show all</button></div>`;
    const anchor=t.closest(".scroll")||t;anchor.parentNode.insertBefore(box,anchor);
    box.addEventListener("change",e=>{const c=e.target.closest("[data-col]");if(!c)return;const n=+c.dataset.col;const set=new Set(state.hideCols[id]||[]);
      c.checked?set.delete(n):set.add(n);state.hideCols[id]=[...set];save();apply()});
    box.addEventListener("click",e=>{if(!e.target.closest("[data-allcols]"))return;state.hideCols[id]=[];box.querySelectorAll("[data-col]").forEach(x=>x.checked=true);save();apply()});
  });
  apply();
})();
// ---- skill tree: learned levels per character in c.skills = {slug: level}, from data/skills.js (roz.prontera.info planner) ----
const treesOf=job=>(typeof SKILLS!=="undefined"&&SKILLS[job])||[];
const SK_CACHE={};
// every skill a job can learn, by slug (Novice and 1st-job trees included); tier = which tree it sits in
const skOf=job=>SK_CACHE[job]||(SK_CACHE[job]=(()=>{const m={};treesOf(job).forEach((t,ti)=>t.skills.forEach(s=>{if(!m[s.slug])m[s.slug]={...s,tier:ti}}));return m})());
const learned=c=>{if(!c.skills||typeof c.skills!=="object")c.skills={};return c.skills};
const hasTree=c=>Object.values(c.skills||{}).some(v=>v>0);
const skLv=(c,slug)=>(c.skills||{})[slug]||0;
// raising a skill raises what it needs; lowering is refused while a learned skill still needs the old level
function raiseSkill(c,slug,lv){const s=skOf(state.job)[slug];if(!s)return;lv=Math.max(0,Math.min(s.max,lv));const L=learned(c);if((L[slug]||0)>=lv)return;L[slug]=lv;(s.pre||[]).forEach(([p,n])=>raiseSkill(c,p,n))}
function lowerSkill(c,slug,lv){const S=skOf(state.job),L=learned(c);
  const why=Object.keys(L).filter(k=>L[k]>0&&S[k]).flatMap(k=>(S[k].pre||[]).filter(([p,n])=>p===slug&&n>lv).map(([,n])=>`${S[k].name} needs ${S[slug].name} Lv ${n}`));
  if(why.length)return why;if(lv<=0)delete L[slug];else L[slug]=lv;return null}
// level rows: [SP, damage %, hits, variable cast ms, fixed cast ms, after-cast delay ms, cooldown ms, description]
const skRow=(s,lv)=>{const r=(s.lv||[])[lv-1]||[];const m=String(r[7]||"").match(/(\d+)\s*hits?\b|Hits:\s*(\d+)/i);const hits=r[2]!=null?r[2]:m?+(m[1]||m[2]):null;
  return [r[0],r[1],hits,r[3],r[4],r[5],r[6],r[7]||""]};
// attack presets are max-level; with a skill tree they scale to the learned level using the data's level rows
const SK_ALIAS={"frost driver":"frost-diver"};
const normSk=x=>String(x).toLowerCase().replace(/\(.*?\)/g,"").replace(/\blv\s*\d+\b/g,"").replace(/[^a-z ]/g," ").replace(/\s+/g," ").trim();
function presetSkill(p){if(!p||p.type==="spellfist"||/^(copied:|basic attack|combo)/i.test(p.name))return null;const S=skOf(state.job),n=normSk(p.name);
  const slug=SK_ALIAS[n]||Object.keys(S).find(k=>normSk(S[k].name)===n)||Object.keys(S).find(k=>n.startsWith(normSk(S[k].name)));return slug?S[slug]:null}
function levelPreset(p,c){const s=presetSkill(p),a={...p};if(!s||!hasTree(c))return {a};const lv=skLv(c,s.slug);if(lv>=s.max)return {a,lv,s};if(lv<=0)return {a,lv:0,s};
  const hi=skRow(s,s.max),lo=skRow(s,lv),k=i=>hi[i]&&lo[i]!=null?lo[i]/hi[i]:null;
  if(k(1)!=null)a.pct=Math.round(p.pct*k(1));if(k(2)!=null)a.hits=Math.round(p.hits*k(2)*100)/100;if(lo[0]!=null)a.sp=lo[0];
  const cHi=(hi[3]||0)+(hi[4]||0),cLo=(lo[3]||0)+(lo[4]||0);if(cHi>0){const f=cLo/cHi;a.cast=Math.round(num(p.cast)*f*100)/100;if(p.vct!=null)a.vct=p.vct*f;if(p.fct!=null)a.fct=p.fct*f}
  const dHi=Math.max(hi[5]||0,hi[6]||0),dLo=Math.max(lo[5]||0,lo[6]||0);if(dHi>0)a.delay=Math.round(num(p.delay)*dLo/dHi*100)/100;
  a.name=/Lv\s*\d+/.test(p.name)?p.name.replace(/Lv\s*\d+/,"Lv"+lv):`${p.name} Lv${lv}`;return {a,lv,s}}
const refreshPreset=c=>{if(c.preset>=0){const p=JOBS[state.job].p[c.preset];if(p)c.a=levelPreset(p,c).a}};
// passives: values come from the skill's own description at the learned level; this table only says what they need
const SK_PASSIVE={"sword-mastery":{w:["Dagger","One-handed sword"]},"two-handed-sword-mastery":{w:["Two-handed sword"]},"spear-mastery":{w:["One-handed spear","Two-handed spear"]},
  "mace-mastery":{w:["One-handed mace","Two-handed mace"]},"axe-mastery":{w:["One-handed axe","Two-handed axe"]},"axe-mastery-2":{w:["One-handed axe","Two-handed axe"]},
  "katar-mastery":{w:["Katar"]},"advanced-katar-mastery":{w:["Katar"]},"iron-fists":{w:["Knuckle","Bare hands"]},"study":{w:["Book"]},"music-lessons":{w:["Musical instrument"]},
  "dance-lessons":{w:["Whip"]},"weaponry-research":{},"demon-bane":{races:["Undead","Demon"]},"beastbane":{races:["Brute","Insect"]},"owls-eye":{},"vultures-eye":{},
  "improve-dodge":{},"flee":{},"faith":{},"soul-drain":{},"meditation":{},"spiritual-thrift":{},"plagiarism":{},"hilt-binding":{}};
// self-buffs you can switch on; added on top of the status window like consumables
const SK_BUFF={"two-hand-quicken":{w:["Two-handed sword"]},"spear-quicken":{w:["Two-handed spear"]},"adrenaline-rush":{w:["One-handed axe","Two-handed axe","One-handed mace","Two-handed mace"]},
  "power-thrust":{},"improve-concentration":{},"increase-agility":{},"blessing":{},"falcon-eyes":{},"fury":{},"impositio-manus":{},"endow-quake":{},"endow-tsunami":{},
  "endow-tornado":{},"endow-blaze":{},"volcano":{},"deluge":{},"whirlwind":{},"battle-theme":{},"lady-luck":{},"focus-ballet":{},"perfect-tablature":{}};
const SECOND=job=>!["Novice",...FIRST_JOBS].includes(job);
// description -> effects: {mastery, pct (physical damage %), spCost, myEle {el: %}, stat: bonus lines (shown in the status window)}
function skillFx(desc,c){const d=String(desc||""),o={mastery:0,pct:0,spCost:0,myEle:{},stat:[]},stat=(k,v)=>o.stat.push([k,null,null,v]);let m;
  if((m=d.match(/Damage(?: Increase)?:?\s*\+(\d+(?:\.\d+)?)%/i))||(m=d.match(/^Self:\s*\+(\d+)%/i)))o.pct+=+m[1];
  else if((m=d.match(/(?:Damage|ATK):?\s*\+(\d+)(?![\d.%])/i))&&!/ATK\/MATK/i.test(d)&&!/Bonus vs/i.test(d))o.mastery+=+m[1];
  if((m=d.match(/ATK\/MATK\s*\+(\d+)/i))){stat("atk",+m[1]);stat("matk",+m[1])}
  d.replace(/((?:STR|AGI|VIT|INT|DEX|LUK)(?:,\s*(?:STR|AGI|VIT|INT|DEX|LUK))*)\s*\+(\d+)(%?)/g,(_,ks,v,pc)=>{ks.split(/,\s*/).forEach(k=>{k=k.toLowerCase();
    const add=pc?Math.floor((statVal(c,k)||0)*v/100):+v;if(add)stat(k,add)})});
  if((m=d.match(/\bHIT(?: Rate)?\s*\+(\d+)/i)))stat("hit",+m[1]);
  if((m=d.match(/\bCRIT\s*\+(\d+(?:\.\d+)?)/i)))stat("crit",+m[1]);
  const fl=[...d.matchAll(/FLEE\s*\+(\d+)/gi)].map(x=>+x[1]);if(fl.length)stat("flee",SECOND(state.job)?fl[fl.length-1]:fl[0]);
  if((m=d.match(/\bMHP\s*\+(\d+)(?![\d%])/i)))stat("hp",+m[1]);if((m=d.match(/\bMHP\s*\+(\d+)%/i)))stat("hp_percent",+m[1]);
  if((m=d.match(/(?:Max SP|MSP)\s*\+(\d+)%/i)))stat("sp_percent",+m[1]);
  if((m=d.match(/ASPD:?\s*\+(\d+(?:\.\d+)?)%/i)))stat("aspd_percent",+m[1]);if((m=d.match(/After Attack Delay\s*-(\d+)%/i)))stat("aspd_percent",+m[1]);
  if((m=d.match(/Critical Damage\s*\+(\d+)%/i)))stat("crit_damage_percent",+m[1]);
  if((m=d.match(/SP Consumption\s*-(\d+)%/i)))o.spCost-=+m[1];
  d.replace(/(Fire|Water|Wind|Earth)(?: Magical)? Damage\s*\+(\d+)%/g,(_,el,v)=>{o.myEle[el]=(o.myEle[el]||0)+ +v});
  return o}
// all effects from learned passives and switched-on buffs, for the current weapon
function skillEffects(c){const out={mastery:[],pct:0,spCost:0,myEle:{},stat:[],buffStat:[]};if(!hasTree(c))return out;const S=skOf(state.job),w=c.weapon;
  const take=(slug,cond,isBuff)=>{const s=S[slug],lv=skLv(c,slug);if(!s||lv<=0)return;if(cond.w&&!cond.w.includes(w))return;const fx=skillFx(skRow(s,lv)[7],c);
    if(fx.mastery)out.mastery.push({v:fx.mastery,races:cond.races||null});out.pct+=fx.pct;out.spCost+=fx.spCost;for(const k in fx.myEle)out.myEle[k]=(out.myEle[k]||0)+fx.myEle[k];
    (isBuff?out.buffStat:out.stat).push(...fx.stat);(s.g||[]).forEach(g=>(g.b||[]).forEach(b=>(isBuff?out.buffStat:out.stat).push(b)))};
  for(const k in SK_PASSIVE)take(k,SK_PASSIVE[k],false);for(const k in SK_BUFF)if((c.buffs||{})[k])take(k,SK_BUFF[k],true);return out}
// Sage options follow the skill tree when one is set: Spell Fist, Hindsight, Double Bolt and bolt levels are the learned ones
const SG_BOLT={Fire:"fire-bolt",Water:"cold-bolt",Wind:"lightning-bolt"};
function sageFromTree(c){if(state.job!=="Sage"||!hasTree(c))return false;const g=G();
  g.sfLv=skLv(c,"spell-fist");g.hsLv=skLv(c,"hindsight");if(!g.hsLv)g.hsOn=false;const db=skLv(c,"double-bolt");if(db)g.dbLv=db;else g.dbOn=false;
  // your ticked bolts stay as chosen; unlearned ones are skipped in sfBolts(), and the bolt level is the lowest learned one in use
  const lv=Object.keys(SG_BOLT).filter(el=>g.bolts[el]&&skLv(c,SG_BOLT[el])).map(el=>skLv(c,SG_BOLT[el]));g.boltLv=lv.length?Math.min(...lv):1;return true}
let SKFX=null; // skillEffects(C()) for this render
const masteryFor=m=>num(C().mastery)+(SKFX?SKFX.mastery.filter(x=>!x.races||x.races.includes(m.race)).reduce((a,x)=>a+x.v,0):0);
// quest skills cost no points; the data marks most ("free"), these it misses
const SK_QUEST=["create-elemental-converter"];
function renderSkills(){const c=C(),L=learned(c),S=skOf(state.job),trees=treesOf(state.job);
  $("skillTrees").innerHTML=trees.length?trees.map((t,ti)=>{const used=t.skills.reduce((a,s)=>a+(s.free||SK_QUEST.includes(s.slug)?0:L[s.slug]||0),0);
    // the 2nd-job tree's points follow your job level past the data's Job Lv 60 (one point per level after the first)
    const pts=t.points!=null&&ti===trees.length-1&&SECOND(state.job)?Math.max(t.points,num(c.jobLv)-1):t.points;const rows=Math.ceil((Math.max(0,...t.skills.map(s=>s.slot))+1)/7);
    const cells=Array.from({length:rows*7},(_,i)=>{const s=t.skills.find(x=>x.slot===i);if(!s)return '<div class="sk empty"></div>';const lv=L[s.slug]||0,d=skRow(s,Math.max(1,lv))[7];
      return `<div class="sk${lv?" on":""}${s.passive?" pas":""}" data-sk="${s.slug}" title="${esc(s.name)} Lv${Math.max(1,lv)}${d?": "+esc(d):""}"><button type="button" class="nm" data-act="max">${esc(s.name)}</button>
        <div class="lv"><button type="button" data-act="dn" aria-label="Lower">−</button><span class="mono">${lv}/${s.max}</span><button type="button" data-act="up" aria-label="Raise">+</button></div></div>`}).join("");
    return `<div class="tree"><div class="bar"><b>${esc(t.job)}</b><span class="note${pts!=null&&used>pts?" bad":""}">${used}${pts!=null?" / "+pts:""} points</span></div><div class="skgrid">${cells}</div></div>`}).join(""):'<div class="note">No skill tree data for this job.</div>';
  const buffs=Object.keys(SK_BUFF).filter(k=>S[k]&&skLv(c,k)>0);
  $("buffList").innerHTML=buffs.length?`<span class="note">Self-buffs while farming (read your status window with them off):</span> `+buffs.map(k=>`<label class="bar" style="flex-direction:row;gap:4px"><input type="checkbox" data-buff="${k}" ${(c.buffs||{})[k]?"checked":""} style="width:auto"> ${esc(S[k].name)} <span class="muted">${esc(skRow(S[k],skLv(c,k))[7].replace(/Duration:[^,]*,?\s*/i,""))}</span>${SK_BUFF[k].w&&!SK_BUFF[k].w.includes(c.weapon)?` <span class="warnc">(needs ${esc(SK_BUFF[k].w.join(" / "))})</span>`:""}</label>`).join(""):"";
  ROOTQ("#preset option").forEach(o=>{const p=JOBS[state.job].p[+o.value];if(!p)return;const r=levelPreset(p,c);o.textContent=r.s&&hasTree(c)?(r.lv?r.a.name:`${p.name} (not learned)`):p.name})}
$("skillTrees").addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const slug=b.closest("[data-sk]").dataset.sk,c=C(),s=skOf(state.job)[slug],lv=skLv(c,slug);let why=null;
  if(b.dataset.act==="up")raiseSkill(c,slug,lv+1);else if(b.dataset.act==="dn")why=lowerSkill(c,slug,lv-1);else if(lv<s.max)raiseSkill(c,slug,s.max);else why=lowerSkill(c,slug,0);
  $("skillNote").textContent=why?why.join(" · "):"";refreshPreset(c);save();renderSkills();syncChar();renderAll()});
$("skMax").addEventListener("click",()=>{const c=C();treesOf(state.job).forEach(t=>t.skills.forEach(s=>raiseSkill(c,s.slug,s.max)));refreshPreset(c);save();renderSkills();syncChar();renderAll()});
$("skReset").addEventListener("click",()=>{const c=C();c.skills={};c.buffs={};refreshPreset(c);$("skillNote").textContent="";save();renderSkills();syncChar();renderAll()});
$("buffList").addEventListener("change",e=>{const k=e.target.dataset.buff;if(!k)return;const c=C();c.buffs=c.buffs||{};c.buffs[k]=e.target.checked;save();renderAll()});
// ---- build simulator: in "build" mode the stat fields are computed from base stats + gear (build.js) and shown read-only ----
// "Check against the game": [key, label, computed total]
// compared with what the build computes (BUILD_LAST), not with c, since typed Max HP / SP replace the computed ones
const CHECKS=[["atk","ATK",F=>sumStat(F.atkTxt)],["matk","MATK",F=>sumStat(F.matkTxt)],["hit","HIT",F=>sumStat(F.hitTxt)],["flee","FLEE",F=>sumStat(F.fleeTxt)],
  ["aspd","ASPD",F=>F.aspd],["def","DEF",F=>sumStat(F.defTxt)],["hp","Max HP",F=>F.maxHp],["sp","Max SP",F=>F.maxSp]];
const BUILT_IDS=["atkTxt","matkTxt","hitTxt","fleeTxt","aspd","defTxt","maxHp","maxSp","intTxt","wAtk","crit","critDmg","rangePct","skillPct","vctPct","fctPct","acdPct","ignDef","ignMdef","st_str","st_agi","st_vit","st_dex","st_luk","weapon","wElem"];
let BUILD_LAST=null;
const buildOf=c=>{if(!c.build)c.build={base:{str:1,agi:1,vit:1,int:1,dex:1,luk:1},gear:{}};return c.build};
function applyBuild(){const c=C();if(c.mode!=="build"){BUILD_LAST=null;c.bx=eqToBx(c);return}
  const r=BUILD.compute({...buildOf(c),baseLv:c.baseLv,jobLv:c.jobLv,extra:[...consLines().lines,...(SKFX?[...SKFX.stat,...SKFX.buffStat]:[])]},state.job,aspdBase);BUILD_LAST=r;const F=r.fields,A=r.acc;
  // skill-specific gear lines count when the attack's name contains the skill
  const nm=String(c.a.name||"").toLowerCase(),match=o=>Object.entries(o).reduce((t,[k,v])=>t+(nm.includes(k.toLowerCase())?v:0),0);
  Object.assign(c,{atkTxt:F.atkTxt,matkTxt:F.matkTxt,hitTxt:F.hitTxt,fleeTxt:F.fleeTxt,defTxt:F.defTxt,intTxt:F.intTxt,wAtk:F.wAtk,crit:F.crit,critDmg:F.critDmg,
    rangePct:F.rangePct,skillPct:A.skill+match(A.skillOf),vctPct:F.vctPct+match(A.vctOf),fctPct:F.fctPct+match(A.fctOf),acdPct:F.acdPct,ignDef:F.ignDef,ignMdef:F.ignMdef,
    weapon:F.weapon,wElem:F.wElem,st:{...(c.st||{}),...F.st},bx:{phys:A.phys,magic:A.magic,myEle:A.myEle,taken:A.taken,exp:A.exp,spCost:A.spCost}});
  if(F.aspd!=null)c.aspd=F.aspd;if(F.maxHp!=null)c.maxHp=F.maxHp;if(F.maxSp!=null)c.maxSp=F.maxSp;
  // the exported base HP/SP tables don't match Zero yet, so in-game Max HP / SP typed under "Check against the game" win
  const ck=buildOf(c).check||{};if(num(ck.hp)>0)c.maxHp=num(ck.hp);if(num(ck.sp)>0)c.maxSp=num(ck.sp)}
// ---- consumables & buffs: rows {on, name, eff, price, min}; effects are typed like random options ("STR +10, ATK +20, ASPD +10%") ----
const consOf=c=>{if(!Array.isArray(c.cons))c.cons=[];return c.cons};
const consLines=()=>{const lines=[],bad=[];consOf(C()).filter(r=>r.on).forEach(r=>{const o=BUILD.parseOptions(r.eff);lines.push(...o.lines);bad.push(...o.bad.map(x=>`${r.name||"Consumable"}: ${x}`))});return {lines,bad}};
// status-window mode: the typed numbers are read with consumables off, so their effect is added here into EFF (see cf)
function applyConsumables(){EFF=null;const c=C();if(c.mode==="build")return;const lines=[...consLines().lines,...(SKFX?SKFX.buffStat:[])];if(!lines.length)return;
  const A={};lines.forEach(([t,,,v])=>A[t]=(A[t]||0)+v);const g=k=>A[k]||0,f=Math.floor;
  // stat buffs move status ATK / MATK / HIT / FLEE / DEF / CRIT / ASPD through the same formulas (only for stats you typed)
  const tmp={...c,st:{...(c.st||{})},intTxt:c.intTxt};STATS.forEach(k=>{if(g(k)&&statVal(c,k)!=null)tmp.st[k]=`${c.st[k]}+${g(k)}`});if(g("int"))tmp.intTxt=`${c.intTxt||0}+${g("int")}`;
  const b0=derived(c),b1=derived(tmp),d=k=>(b1[k]||0)-(b0[k]||0);
  const parts=t=>{const p=String(t||"0").split("+").map(x=>parseFloat(x)||0);return [p[0]||0,p.slice(1).reduce((a,x)=>a+x,0)]};
  const [as,ag]=parts(c.atkTxt),[ms,mg]=parts(c.matkTxt),[ds,dh]=parts(c.defTxt);
  const atkSt=as+d("atk"),atkGear=f((ag+g("atk"))*(1+g("atk_percent")/100));
  const matkSt=ms+d("matk"),matkTot=f((matkSt+mg+g("matk"))*(1+g("matk_percent")/100));
  let aspd=num(c.aspd,170)+d("aspdTerm")+g("aspd");aspd=Math.min(190,Math.round((aspd+(195-aspd)*g("aspd_percent")/100)*10)/10);
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
const FIRST_OF={Knight:"Swordsman",Crusader:"Swordsman",Wizard:"Mage",Sage:"Mage",Hunter:"Archer",Bard:"Archer",Dancer:"Archer",Priest:"Acolyte",Monk:"Acolyte",Blacksmith:"Merchant",Alchemist:"Merchant",Assassin:"Thief",Rogue:"Thief"};
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
    return `<label>${label}<span class="bar"><input data-ck="${k}" type="number" value="${g??""}" placeholder="${mine??"–"}" style="flex:1;min-width:0">${d==null?"":`<span class="${Math.abs(d)<0.5?"good":"bad"}">${d===0?"✓":(d>0?"+":"")+fmtP(+d.toFixed(1))}</span>`}</span></label>`}).join("");
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
// ---- tabs: show one group of sections at a time; the last one opened is remembered in state.tab (Character first for new players) ----
function showTab(t){
  if(!document.querySelector(`[data-tabbtn="${t}"]`))t="char";
  document.querySelectorAll("[data-tab]").forEach(el=>el.hidden=el.dataset.tab!==t);
  document.querySelectorAll("[data-tabbtn]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tabbtn===t)));
  if(state.tab!==t){state.tab=t;save()}
}
document.querySelectorAll("[data-tabbtn]").forEach(b=>b.addEventListener("click",()=>{showTab(b.dataset.tabbtn);scrollTo({top:0})}));
showTab(state.tab||"char");
// ---- collapsible cards: click a heading (or Enter/Space on it) to fold the card; saved by heading text ----
(function setupCollapse(){
  if(!state.collapsed)state.collapsed={};
  document.querySelectorAll(".card:not(#pickJob)").forEach(card=>{const h=card.querySelector(":scope>h2, :scope>.bar>h2");if(!h)return;
    const head=h.parentElement===card?h:h.parentElement;head.classList.add("cardHead");const key=h.textContent.trim();
    h.tabIndex=0;h.setAttribute("role","button");
    const set=v=>{card.classList.toggle("collapsed",v);h.setAttribute("aria-expanded",String(!v))};set(!!state.collapsed[key]);
    const flip=()=>{const v=!card.classList.contains("collapsed");state.collapsed[key]=v;if(!v)delete state.collapsed[key];save();set(v)};
    h.addEventListener("click",flip);h.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();flip()}})});
})();
// ---- start: first visit shows only a job picker; everything else needs a job ----
const startApp=()=>{document.body.classList.remove("nojob");syncClosed();syncChar();renderAll();resetForm()};
if(state.job)startApp();
else{document.body.classList.add("nojob");$("pickJob").hidden=false;
  $("pickJobSel").innerHTML='<option value="" selected disabled>Choose a job…</option>'+$("job").innerHTML;
  $("pickBackup").addEventListener("click",()=>{document.body.classList.add("nojobbk");showTab("data");$("bkText").focus()});
  $("pickJobSel").addEventListener("change",e=>{state.job=e.target.value;const s=cur();if(!s.job)s.job=state.job;C();save();$("pickJob").hidden=true;document.body.classList.remove("nojobbk");showTab("char");startApp()})}


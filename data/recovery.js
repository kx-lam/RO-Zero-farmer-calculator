// HP and SP recovery items by item id: kind "hp"/"sp", what one restores (min–max, measured in Ragnarok Zero Global on a Merchant; classic RO values don't match),
// weight, NPC price and the price with the Merchant Discount skill (disc). Player-only items have npc null and a player price you can change (player, null = unknown).
// wOk false: the weight isn't checked in game yet. Each value can be changed per character in the Recovery items card (chars.<Job>.recovery.overrides)
const RECOVERY={
"501":{name:"Red Potion",kind:"hp",min:45,max:45,w:7,npc:10,disc:8},
"502":{name:"Orange Potion",kind:"hp",min:105,max:105,w:10,npc:50,disc:41},
"503":{name:"Yellow Potion",kind:"hp",min:175,max:175,w:13,npc:180,disc:149},
"504":{name:"White Potion",kind:"hp",min:325,max:325,w:15,npc:1200,disc:996},
"548":{name:"Cheese",kind:"sp",min:25,max:39,w:5,npc:28,disc:23},
"510":{name:"Blue Herb",kind:"sp",min:51,max:73,w:7,wOk:false,npc:60,disc:49},
"578":{name:"Strawberry",kind:"sp",min:89,max:113,w:2,npc:null,player:200},
"505":{name:"Blue Potion",kind:"sp",min:60,max:60,w:15,wOk:false,npc:null,player:null}};

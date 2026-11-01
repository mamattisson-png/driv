"use strict";
// Distinkta rörelser, inte tempo-, paus- eller greppvarianter.
// Figurerna återanvänder närliggande grundposer och är schematiska.
const EXTRA_DISTINCT_IDS = (() => {
  const entries = [
    ["bear_crawl","Björnkravling","bear crawl","plankan","bw","core","mage","abdominals/bodyweight","10–20 steg",["Ställ dig på händer och fötter med knäna strax ovanför golvet.","Flytta motsatt hand och fot framåt med höften så stilla som möjligt.","Fortsätt med korta kontrollerade steg och undvik att svanka."]],
    ["crab_walk","Krabbgång","crab walk","glute_bridge","bw","core","mage","abdominals/bodyweight","10–20 steg",["Sitt med händerna bakom kroppen och fötterna i golvet.","Lyft höften och gå bakåt eller framåt med händer och fötter.","Håll axlarna stabila och ta små steg."]],
    ["wall_sit","Jägarvila mot vägg","wall sit","knaboj","bw","legs","ben","quads/bodyweight","20–45 s",["Luta ryggen mot en vägg med fötterna framför dig.","Glid ned till en bekväm sittposition och håll knäna i linje med fötterna.","Håll stilla med jämnt tryck genom fötterna och res dig kontrollerat."]],
    ["step_down","Kontrollerad nedstigning från låda","step down","utfall","bw","legs","ben","quads/bodyweight","8–12/ben",["Stå på en låg stabil låda med ena foten nära kanten.","Böj stödbenet och sänk andra hälen mot golvet utan att tappa knäkontrollen.","Pressa upp genom stödbenet och byt sida."]],
    ["inchworm","Maskgång","inchworm","armhavningar","bw","core","mage","abdominals/bodyweight","6–10",["Stå med mjuka knän och fäll överkroppen framåt tills händerna når golvet.","Gå med händerna fram till en stabil hög planka.","Gå med fötterna mot händerna och res dig lugnt."]],
    ["reverse_tabletop","Omvänd bordposition","reverse tabletop","glute_bridge","bw","core","mage","glutes/bodyweight","20–40 s",["Sitt med händerna bakom höften och fötterna i golvet.","Pressa genom händer och fötter tills höften lyfts till bordshöjd.","Håll skuldrorna stabila och sänk kontrollerat."]],
    ["frog_pump","Frog pumps","frog pumps","glute_bridge","bw","legs","ben","glutes/bodyweight","15–25",["Ligg på rygg med fotsulorna mot varandra och knäna utåt.","Spänn sätet och lyft höften utan att översträcka ländryggen.","Sänk höften lugnt och upprepa."]],
    ["lateral_bound","Sidoskridskohopp","skater bounds","utfall","bw","legs","ben","quads/bodyweight","8–12/sida",["Stå på ett ben med lätt böjt knä.","Hoppa i sidled till motsatt ben och landa mjukt med knät i linje med foten.","Stabilisera landningen innan nästa hopp."]]
    ["heel_walk","Hälgång","heel walk","tahavningar","bw","legs","ben","calves/bodyweight","15–25 steg",["Stå upprätt och lyft framfötterna så att vikten ligger på hälarna.","Gå framåt med korta steg utan att luta överkroppen bakåt.","Behåll tårna lyfta under stegen och vila när kontrollen avtar."]],
    ["squat_side_walk","Sidogång i knäböj","squat side walk","knaboj","bw","legs","ben","quads/bodyweight","8–12 steg/sida",["Sänk dig till en grund knäböj med fötterna ungefär axelbrett.","Ta ett kontrollerat steg åt sidan och följ efter med andra foten.","Behåll knäna i linje med tårna och växla riktning."]],
    ["frog_jump","Grodhopp","frog jumps","hoppknaboj","bw","legs","ben","quads/bodyweight","6–10",["Stå med fötterna något bredare än höfterna och böj knäna.","Hoppa framåt genom att sträcka höft och knän.","Landa mjukt med böjda knän och stabil bål innan nästa hopp."]],
    ["plank_lateral_walk","Plankgång i sidled","lateral plank walk","plankan","bw","core","mage","abdominals/bodyweight","6–10 steg/sida",["Ställ dig i hög planka med händerna under axlarna.","Flytta en hand och motsatt fot ett kort steg åt sidan.","Följ efter med andra handen och foten utan att svanka eller vrida höften."]],
    ["cross_step","Korssteg i sidled","grapevine cross steps","utfall","bw","legs","ben","quads/bodyweight","10–20 steg",["Stå upprätt med mjuka knän och armarna fria för balans.","Ta ett sidosteg och korsa sedan andra foten bakom stödbenet.","Fortsätt rytmiskt och byt riktning med kontrollerade steg."]],
    ["standing_cross_crunch","Stående knä till motsatt armbåge","standing cross body knee to elbow","crunches","bw","core","mage","obliques/bodyweight","10–16/sida",["Stå upprätt med händerna lätt vid tinningarna.","Lyft ena knät mot motsatt armbåge genom att vrida bålen lätt.","Återgå kontrollerat och växla sida utan att rycka i nacken."]]
  ];
  const ids = [];
  for (const [code,name,english,baseId,gear,cat,area,source,reps,cues] of entries) {
    const id = "dst_" + code, base = EX[baseId];
    if (!base || EX[id]) throw Error("Okänd grundövning eller dubbelt id: " + id);
    if (Object.values(EX).some(e => e.name.toLocaleLowerCase("sv") === name.toLocaleLowerCase("sv"))) throw Error("Dubbelt övningsnamn: " + name);
    EX[id] = { ...base, name, aliases:[english], cat, gear, bw:true, hold:null,
      cable:null, plate:null, pad:false, sets:3, reps, cues,
      prim:[...(base.prim || [])], sec:[...(base.sec || [])] };
    MW[id] = "exercises/" + source;
    AREA_IDS[area] = ((AREA_IDS[area] || "") + " " + id).trim();
    ids.push(id);
  }
  return Object.freeze(ids);
})();

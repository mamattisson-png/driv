"use strict";
// Handvalda styrkeövningar. Laddas efter ovningar.js; inga befintliga poster ändras.
// Figurer återanvänder endast samma rörelsefamilj. Grepp, pauser och ensidighet
// beskrivs i instruktionen, eftersom streckfiguren inte visar fingrar eller tempo.
const EXTRA_STRENGTH_IDS = (() => {
  const ids = [];
  // Egen etikett hindrar adduktionsövningar från att felaktigt fylla framsida lår.
  MUSCLE_GROUPS.insida_lar = "Insida lår";
  // Listadresserna nedan kontrollerades på MuscleWiki 2026-10-28.
  // De är avsiktligt listor över liknande övningar, inte påhittade variantsidor.
  const sources = {
    groinMachine: "exercises/groin/machine", groinBW: "exercises/groin/bodyweight",
    chestKB: "exercises/chest/kettlebells", forearmsBar: "exercises/forearms/barbell", forearmsCable: "exercises/forearms/cables",
    shoulderKB: "exercises/shoulders/kettlebells", backBar: "exercises/lats/barbell",
    bicepsBar: "exercises/biceps/barbell", tricepsBar: "exercises/triceps/barbell",
    calvesDB: "exercises/calves/dumbbells", calvesMachine: "exercises/calves/machine",
    glutesBar: "exercises/glutes/barbell", glutesDB: "exercises/glutes/dumbbells",
    quadsMachine: "exercises/quads/machine", hamMachine: "exercises/hamstrings/machine", hamBar: "exercises/hamstrings/barbell",
    chestDB: "exercises/chest/dumbbells", chestBar: "exercises/chest/barbell",
    chestBW: "exercises/chest/bodyweight", chestCable: "exercises/chest/cables",
    backDB: "exercises/lats/dumbbells", backCable: "exercises/lats/cables", backBW: "exercises/lats/bodyweight",
    shoulderDB: "exercises/shoulders/dumbbells", shoulderCable: "exercises/shoulders/cables",
    bicepsDB: "exercises/biceps/dumbbells", bicepsCable: "exercises/biceps/cables",
    tricepsDB: "exercises/triceps/dumbbells", tricepsCable: "exercises/triceps/cables",
    quadsBar: "exercises/quads/barbell", quadsDB: "exercises/quads/dumbbells", quadsBW: "exercises/quads/bodyweight",
    hamDB: "exercises/hamstrings/dumbbells", hamBW: "exercises/hamstrings/bodyweight",
    glutesBW: "exercises/glutes/bodyweight", glutesCable: "exercises/glutes/cables",
    glutesKB: "exercises/glutes/kettlebells", calvesBW: "exercises/calves/bodyweight",
    forearms: "exercises/forearms/dumbbells", abs: "exercises/abdominals/bodyweight",
    obliques: "exercises/obliques/bodyweight", lowerback: "exercises/lowerback/bodyweight",
  };
  // Radformat: stabilt id | namn | variantspecifik start/instruktion | reps (valfritt).
  // Varje familj anger rörelsens två återstående instruktioner och ren utrustning.
  function family(baseId, gear, source, movement, rows, changes = {}, area = areaOf(baseId)) {
    const base = EX[baseId];
    if (!base) throw new Error("Okänd figur: " + baseId);
    for (const row of rows.trim().split("\n").filter(Boolean)) {
      const [code, name, setup, reps] = row.trim().split("|");
      const id = "stx_" + code;
      if (EX[id]) throw new Error("Dubbelt övnings-id: " + id);
      const e = { ...base, hold: null, cable: null, plate: null, pad: false,
        gear, bw: gear === "bw", name, sets: 3, reps: reps || "8–12",
        cues: [...setup.split("~"), ...movement],
        prim: [...base.prim], sec: [...base.sec], ...changes };
      if (gear === "bar") e.hold = "bar";
      if (gear === "db" || gear === "kb") e.hold = "db";
      EX[id] = e;
      MW[id] = sources[source] || MW[source];
      AREA_IDS[area] = ((AREA_IDS[area] || "") + " " + id).trim();
      ids.push(id);
    }
  }

  // Bröst: pressar, flyes och armhävningar (39).
  const press = ["Sänk vikten mot bröstet med underarmarna ungefär lodräta.", "Pressa upp med skulderbladen mot underlaget och sänk kontrollerat."];
  family("bankpress", "bar", "chestBar", press, `
bench_pause|Bänkpress med stopp|Ligg stadigt på bänken; pausa stången en sekund mot bröstet utan att slappna av.|6–8
bench_spoto|Spoto press|Ligg på bänken och vänd rörelsen efter ett kort stopp strax ovanför bröstet.|6–10
bench_larsen|Larsenpress|Ligg på bänken med benen utsträckta ovanför golvet och utan benhjälp.|6–10
bench_wide|Bänkpress med brett grepp|Greppa måttligt bredare än axlarna och håll handlederna över armbågarna.
bench_reverse|Bänkpress med omvänt grepp|Använd handflatorna mot ansiktet, lätt vikt och passare vid urlyftet.
bench_pin|Pin press från brösthöjd|Ställ säkerhetsarmarna strax ovanför bröstet; starta varje press från stilla stång.|5–8
bench_tempo|Bänkpress med långsam sänkning|Räkna tre sekunder på vägen ned och behåll samma bröstposition.|6–8
`);
  family("lutande_bankpress", "bar", "chestBar", press, `
incline_close|Lutande bänkpress med smalt grepp|Ställ bänken runt 30 grader och greppa stången ungefär axelbrett.
incline_pause|Lutande bänkpress med stopp|Ligg på en låg lutning och pausa en sekund vid övre bröstet.|6–10
`);
  family("hantelpress", "db", "chestDB", press, `
db_neutral_bench|Hantelpress med neutralt grepp|Ligg på bänken med handflatorna riktade mot varandra genom hela pressen.
db_alternate_bench|Växelvis hantelpress|Håll en hantel ovanför bröstet medan den andra sänks och pressas; växla arm.|8–12/arm
db_single_bench|Enarms hantelpress på bänk|Ligg mitt på bänken med en hantel och spänn magen så att kroppen inte vrids.|8–12/arm
db_squeeze|Squeeze press med hantlar|Pressa hantlarnas insidor lätt mot varandra under hela rörelsen.
db_pause_bench|Hantelpress med stopp|Ligg stadigt på bänken och pausa hantlarna kort vid bröstets sidor.
`);
  family("lutande_hantelpress", "db", "chestDB", press, `
incline_neutral|Lutande hantelpress med neutralt grepp|Ställ bänken runt 30 grader och låt handflatorna möta varandra.
incline_single|Enarms lutande hantelpress|Håll en hantel vid axeln på en lutande bänk och motverka rotation i bålen.|8–12/arm
incline_alternate|Växelvis lutande hantelpress|På en lutande bänk hålls en arm sträckt medan den andra pressar.|8–12/arm
`);
  family("golvpress", "db", "chestDB", ["Sänk tills överarmarna möter golvet mjukt och stanna kort.", "Pressa upp utan att studsa armbågarna mot underlaget."], `
db_floor|Golvpress med hantlar|Ligg på golvet med böjda knän och en hantel i varje hand.
db_single_floor|Enarms golvpress med hantel|Ligg på rygg med en hantel och håll båda skuldrorna mot golvet.|8–12/arm
`, {scene: []});
  family("golvpress", "kb", "chestKB", ["Sänk tills överarmen vilar mjukt mot golvet.", "Pressa vikten över axeln med rak handled och stilla bål."], `
kb_floor|Enarms golvpress med kettlebell|Ligg på rygg med klotet mot underarmens utsida och böjda knän.|8–12/arm
`, {scene: []});
  const pushup = ["Sänk bröstet med spänd mage och armbågarna snett bakåt.", "Pressa underlaget ifrån dig och behåll en rak linje genom kroppen."];
  family("armhavningar", "bw", "chestBW", pushup, `
pushup_wide|Breda armhävningar|Placera händerna något bredare än vid vanliga armhävningar utan att tappa axelkontrollen.
pushup_stagger|Armhävningar med förskjutna händer|Placera ena handen lite framför den andra; byt placering efter varje set.|8–12/sida
pushup_release|Armhävningar med handsläpp|Låt bröstet nå golvet och lyft händerna kort innan du pressar upp.
pushup_pause|Armhävningar med stopp|Stanna en sekund strax ovanför golvet innan du pressar tillbaka.
pushup_slow|Armhävningar med långsam sänkning|Sänk kroppen under tre sekunder och pressa tillbaka med kontroll.|6–10
pushup_close|Smala armhävningar|Placera händerna under axlarna och låt armbågarna gå nära sidorna.
pushup_spiderman|Spindelarmhävningar|För ett knä mot samma sidas armbåge under sänkningen och växla sida.|6–10/sida
pushup_singleleg|Armhävningar på ett ben|Lyft ena foten några centimeter och håll bäckenet parallellt med golvet.|8–12/ben
pushup_archer|Archer armhävningar|Stå brett med händerna; flytta bröstet mot ena handen medan andra armen hålls nästan rak.|5–8/sida
pushup_hindu|Hinduiska armhävningar|Börja med höften högt och svep bröstet nära golvet fram till en bekväm uppåtvänd position.~Återgå genom att föra höften bakåt och uppåt utan att tvinga ländryggen.|6–10
`);
  const fly = ["För armarna ut åt sidorna med en liten, oförändrad böjning i armbågarna.", "För ihop armarna framför bröstet utan att axlarna dras fram."];
  family("hantelflyes", "db", "chestDB", fly, `
db_pause_fly|Hantelflyes med stopp|Ligg på en plan bänk och stanna en sekund med armarna ut åt sidorna inom bekvämt rörelseomfång.
db_floor_fly|Hantelflyes på golv|Ligg på golvet; låt överarmarna möta underlaget mjukt som rörelsestopp.
`);
  family("kabelflyes", "cable", "chestCable", fly, `
cable_low_fly|Kabelflyes nedifrån och upp|Ställ trissorna lågt och för handtagen snett uppåt framför övre bröstet.
cable_high_fly|Kabelflyes uppifrån och ned|Ställ trissorna högt och för handtagen snett nedåt framför nedre bröstet.
cable_single_fly|Enarms kabelflyes|Ställ trissan i brösthöjd och arbeta med en arm utan att vrida kroppen.|10–15/arm
cable_supine_fly|Liggande kabelflyes på bänk|Placera en plan bänk mellan låga trissor och ligg med fötterna i golvet.
`, {cable:[8,45]});
  family("kabelpress", "cable", "chestCable", ["Pressa handtaget framför bröstet med rak handled.", "För tillbaka armbågen kontrollerat utan att vrida kroppen."], `
cable_single_press|Enarms bröstpress i kabel|Stå i ett stabilt steg med trissan bakom dig i brösthöjd.|10–15/arm
cable_halfkneel_press|Halvknästående bröstpress i kabel|Sätt ena knät på en matta mellan trissorna och håll handtagen vid bröstet utan att svanka.
cable_incline_press|Lutande bröstpress i kabel på bänk|Placera en lutande bänk mellan låga trissor och stöd ryggen mot dynan.
`, {cable:[8,35]});

  // Rygg: roddar, vertikala drag, höftfällning och skulderkontroll (39).
  const row = ["Dra armbågen bakåt utan att rycka med höften eller höja axeln.", "Sträck armen kontrollerat och håll ryggen i samma position."];
  family("skivstangsrodd", "bar", "backBar", row, `
bar_row_under|Skivstångsrodd med underhandsgrepp|Fäll i höften och greppa stången med handflatorna framåt; dra mot nedre magen.
bar_row_wide|Skivstångsrodd med brett grepp|Greppa bredare än axlarna och dra stången mot övre magen med armbågarna utåt.
bar_row_pause|Skivstångsrodd med stopp|Fäll fram med spänd bål och håll stången en sekund mot magen.
bar_row_deadstop|Skivstångsrodd från klossar|Ställ stången på lika höga stabila klossar och starta varje drag från stilla läge.
`);
  family("hantelrodd", "db", "backDB", row, `
db_row_elbowout|Hantelrodd med armbågen utåt|Stöd ena handen på bänken och dra hanteln mot revbenen med armbågen utåt.|10–15/arm
db_row_tripod|Hantelrodd med båda fötterna i golvet|Stöd fria handen på en bänk och håll båda fötterna stadigt i golvet.|8–12/arm
db_row_deadstop|Hantelrodd med golvstopp|Stöd fria handen på en bänk och sätt ned hanteln helt mellan repetitionerna.|8–12/arm
db_row_supinated|Hantelrodd med underhandsgrepp|Fäll fram och låt handflatan peka framåt; håll armbågen nära sidan.|8–12/arm
`);
  family("broststodd_rodd", "db", "backDB", row, `
chest_row_wide|Bröststödd rodd med breda armbågar|Ligg med bröstet mot lutande bänk och för armbågarna utåt mot övre ryggen.
chest_row_under|Bröststödd rodd med underhandsgrepp|Ligg mot lutande bänk med handflatorna framåt och dra mot höfterna.
chest_row_single|Enarms bröststödd hantelrodd|Stöd bröstet på bänken och ro med en arm utan att lyfta andra axeln.|8–12/arm
chest_row_alternate|Växelvis bröststödd hantelrodd|Ligg mot bänken och gör ett helt drag i taget med växlande arm.|8–12/arm
`);
  family("kabelrodd", "cable", "backCable", row, `
cable_row_wide|Sittande kabelrodd med brett grepp|Fäst en bred stång och dra mot övre magen med armbågarna snett utåt.
cable_row_under|Sittande kabelrodd med underhandsgrepp|Greppa en rak stång med handflatorna uppåt och dra mot naveln.
cable_row_rope|Sittande kabelrodd med rep|Använd ett rep och sära lätt på ändarna när händerna når revbenen.
cable_row_pause|Sittande kabelrodd med stopp|Sitt högt i bröstet och håll dragets slutläge en sekund.
`, {cable:[105,55]});
  family("enarms_kabelrodd", "cable", "backCable", row, `
cable_row_kneeling|Knästående enarmsrodd i kabel|Stå på båda knäna på en matta framför trissan i brösthöjd och håll bäckenet rakt.|10–15/arm
cable_row_halfkneel|Halvknästående enarmsrodd i kabel|Sätt ett knä på en matta och dra från en trissa i nedre brösthöjd.|10–15/arm
cable_row_high|Enarms hög kabelrodd|Ställ trissan något över axelhöjd och dra armbågen snett ned mot sidan.|10–15/arm
`, {cable:[105,40]});
  family("maskinrodd", "machine", "maskinrodd", row, `
machine_row_single|Enarmsrodd i maskin|Ställ in bröststödet och använd en arm i taget med stilla bröstkorg.|8–12/arm
machine_row_wide|Maskinrodd med brett grepp|Välj de breda handtagen och rikta armbågarna snett utåt.
machine_row_neutral|Maskinrodd med neutralt grepp|Välj parallella handtag och håll armbågarna nära kroppen.
`);
  const pulldown = ["Dra armbågarna ned mot revbenen med bröstkorgen stilla.", "Låt armarna sträckas kontrollerat utan att rycka upp axlarna."];
  family("latsdrag", "cable", "backCable", pulldown, `
lat_single|Enarms latsdrag|Sitt med låret under dynan och dra ett handtag mot samma sidas axel.|10–15/arm
lat_halfkneel|Halvknästående latsdrag|Sätt ett knä på golvet framför en hög trissa och dra handtaget ned mot sidan.|10–15/arm
lat_rope|Latsdrag med rep|Fäst ett rep i hög trissa och dra ändarna mot var sin sida av bröstet.
lat_pause|Latsdrag med stopp|Håll slutläget en sekund med armbågarna vid sidan innan du släpper upp.
`, {cable:[70,-12]});
  family("pullups", "bw", "backBW", ["Dra kroppen upp genom att föra armbågarna mot sidorna.", "Sänk hela vägen under kontroll och håll kroppen fri från sving."], `
pullup_neutral|Pull-ups med neutralt grepp|Använd parallella handtag med handflatorna riktade mot varandra.|5–10
pullup_close|Pull-ups med smalt överhandsgrepp|Greppa stången ungefär axelbrett med handflatorna bort från dig.|5–10
pullup_wide|Pull-ups med brett grepp|Greppa måttligt bredare än axlarna och dra bröstet upp mot stången.|5–10
pullup_eccentric|Excentriska pull-ups|Kliv från en stabil pall till toppläget och sänk under fyra sekunder; kliv upp igen.|4–6
chin_eccentric|Excentriska chins|Kliv till toppläget med handflatorna mot dig och sänk under fyra sekunder.|4–6
pullup_pause|Pull-ups med stopp i toppläget|Greppa med överhand och håll översta läget en sekund utan att sträcka halsen.|5–8
`);
  family("australiensisk_rodd", "bw", "backBW", ["Dra bröstet mot den fasta stången med kroppen rak.", "Sänk långsamt tills armarna är raka och behåll sätets spänning."], `
inverted_feetup|Australiensisk rodd med fötterna högt|Placera hälarna på en stadig låg bänk under en fast monterad stång.
inverted_bentknee|Australiensisk rodd med böjda knän|Böj knäna och placera fötterna nära kroppen för lättare belastning.
inverted_wide|Australiensisk rodd med brett grepp|Greppa stången bredare än axlarna och för armbågarna ut åt sidorna.
`);
  family("rumansk_marklyft", "bar", "rumansk_marklyft", ["För höften bakåt med lätt böjda knän och stången nära benen.", "Res dig med säte och baksida lår; stanna när kroppen är upprätt."], `
rdl_pause|Rumänsk marklyft med stopp|Pausa en sekund strax nedanför knäna utan att släppa buktrycket.
rdl_snatchgrip|Rumänsk marklyft med brett grepp|Greppa stången bredare än vid vanlig marklyft och välj en lättare vikt.
`, {}, "rygg");
  family("raka_armar_kabel", "cable", "backCable", ["För nästan raka armar ned mot låren med stilla armbågar.", "Släpp tillbaka långsamt utan att översträcka ländryggen."], `
cable_pullover_single|Enarms raka drag i kabel|Stå framför en hög trissa och håll ett handtag med ena handen.|12–15/arm
`, {cable:[95,-8]});
  family("skulder_armhavningar", "bw", "backBW", ["Sänk skuldrorna från öronen med armbågarna raka.", "Släpp kontrollerat tillbaka till utgångsläget utan att svinga."], `
scap_pullup|Skulderblads-pull-ups|Häng i en stång med raka armar och gör en liten höjning av bröstkorgen genom skuldrorna.|8–12
`, {cat:"pull",A:EX.pullups.A,B:{...EX.pullups.A,h:[61,50]},scene:EX.pullups.scene,prim:["rygg"],sec:["underarmar"],muscles:"Skulderbladens muskler, lats"}, "rygg");

  // Axlar: fria vikter, kabel och kroppsvikt (33).
  const overhead = ["Pressa vikten uppåt tills armen är sträckt utan att skjuta revbenen framåt.", "Sänk kontrollerat till axelhöjd med stilla huvud och spänd mage."];
  family("staende_hantelpress", "db", "shoulderDB", overhead, `
db_press_single|Enarms stående hantelpress|Stå höftbrett och håll en hantel vid ena axeln utan att luta åt sidan.|8–12/arm
db_press_alternate|Växelvis stående hantelpress|Håll en hantel vid varje axel och pressa en arm i taget.|8–12/arm
db_press_neutral|Stående hantelpress med neutralt grepp|Stå stadigt med handflatorna mot varandra genom hela pressen.
`);
  family("sittande_axelpress", "db", "shoulderDB", overhead, `
seated_press_neutral|Sittande hantelpress med neutralt grepp|Sitt mot ryggstödet med handflatorna vända mot varandra.
seated_press_single|Enarms sittande hantelpress|Sitt med ryggen mot stödet och håll en hantel vid axeln.|8–12/arm
seated_press_alternate|Växelvis sittande hantelpress|Sitt stadigt med båda hantlarna vid axlarna och pressa en arm i taget.|8–12/arm
`);
  family("staende_hantelpress", "kb", "shoulderKB", overhead, `
kb_press_single|Enarms strikt kettlebellpress|Vila klotet i rack mot underarmens utsida och håll handleden rak.|8–12/arm
kb_press_double|Dubbel kettlebellpress|Håll en kettlebell i rack vid varje axel och pressa utan benhjälp.
`);
  family("militarpress", "bar", "militarpress", overhead, `
bar_press_seated|Sittande axelpress med skivstång|Sitt upprätt på en stabil bänk i rack och ställ in säkerhetsarmarna.
bar_press_pause|Militärpress med stopp|Stå stadigt och pausa stången en sekund vid axlarna mellan pressarna.|6–10
`);
  family("staende_hantelpress", "cable", "shoulderCable", overhead, `
cable_overhead|Stående axelpress i kabel|Stå mellan låga trissor och håll handtagen vid axlarna.
cable_overhead_single|Enarms axelpress i kabel|Håll ett handtag från låg trissa vid ena axeln och stå med spänd bål.|10–15/arm
`, {hold:null,cable:[18,90]});
  const lateral = ["Lyft armen ut åt sidan till ungefär axelhöjd med mjuk armbåge.", "Sänk långsamt med axeln sänkt och utan att gunga med överkroppen."];
  family("sidolyft", "db", "shoulderDB", lateral, `
lateral_single|Enarms sidolyft med hantel|Håll en lätt hantel och använd den fria handen som lätt stöd.|12–15/arm
lateral_seated|Sittande sidolyft med hantlar|Sitt på en bänk med fötterna stadigt i golvet och vikterna vid sidorna.
lateral_lean|Lutande sidolyft med stöd|Håll i ett stadigt stöd och luta kroppen lite bort från stödet; arbeta med fria armen.|12–15/arm
lateral_bentarm|Sidolyft med böjda armbågar|Böj armbågarna ungefär 90 grader och behåll vinkeln under hela lyftet.
`);
  family("kabel_sidolyft", "cable", "shoulderCable", lateral, `
lateral_cable_behind|Sidolyft i kabel bakom kroppen|Stå med den låga kabeln bakom bäckenet och lyft den bortre armen.|12–15/arm
lateral_cable_lean|Lutande sidolyft i kabel|Håll i maskinen och luta lite bort från låg trissa med arbetande arm fri.|12–15/arm
lateral_cable_double|Sidolyft i dubbla kablar|Stå mellan låga trissor och korsa handtagen framför höfterna.
`, {cable:[18,90]});
  family("framlyft", "db", "shoulderDB", ["Lyft vikten framför kroppen till axelhöjd utan att gunga.", "Sänk långsamt och håll revbenen nere genom hela rörelsen."], `
front_alternate|Växelvisa framlyft med hantlar|Stå med en hantel i varje hand och lyft en arm i taget.|12–15/arm
front_neutral|Framlyft med neutralt grepp|Håll hantlarna med tummarna framåt och behåll greppet genom lyftet.
`);
  family("framlyft", "cable", "shoulderCable", ["Lyft handtaget framåt till axelhöjd med lätt böjd armbåge.", "Sänk kontrollerat utan att luta kroppen bakåt."], `
front_cable|Framlyft i kabel|Stå vänd bort från en låg trissa och lyft ett handtag framför kroppen.|12–15/arm
`, {cable:[16,90]});
  const rear = ["För överarmarna ut åt sidorna med en lätt böjning i armbågarna.", "Sänk långsamt och låt axlarna stanna borta från öronen."];
  family("omvanda_flyes", "db", "shoulderDB", rear, `
rear_seated|Sittande framåtlutade omvända flyes|Sitt på bänkkanten och fäll bröstet fram mot låren med neutral rygg.
rear_supported|Bröststödda omvända flyes|Stöd bröstet mot en lutande bänk och låt hantlarna hänga ned.
rear_single|Enarms omvända flyes med hantel|Fäll fram och stöd fria handen på en bänk utan att rotera bröstkorgen.|12–15/arm
`);
  family("omvanda_flyes", "cable", "shoulderCable", rear, `
rear_cable_bent|Framåtlutade omvända flyes i kabel|Fäll i höften mellan låga trissor och håll motsatt handtag i varje hand.
rear_cable_single|Enarms omvända flyes i kabel|Fäll fram med en låg trissa på motsatt sida och stöd den fria handen.|12–15/arm
`, {cable:[12,90]});
  family("face_pulls", "cable", "shoulderCable", ["Dra repet mot ansiktet och för händerna till sidorna av huvudet.", "Släpp tillbaka långsamt med bålen stilla och axlarna sänkta."], `
facepull_seated|Sittande face pulls|Sitt på en stabil bänk framför en trissa i ansiktshöjd med rep.
facepull_kneeling|Knästående face pulls|Stå på båda knäna på en matta och ställ trissan i ansiktshöjd.
`, {cable:[105,20]});
  family("shrugs", "db", "shoulderDB", ["Lyft axlarna rakt upp utan att rulla dem framåt eller bakåt.", "Sänk lugnt och låt huvudet vara i neutral position."], `
shrug_seated|Sittande shrugs med hantlar|Sitt upprätt på bänkkanten med hantlarna längs sidorna.
shrug_single|Enarms shrugs med hantel|Stå med en hantel längs sidan och håll bålen rak.|12–15/arm
`, {}, "axlar");
  family("shrugs", "bar", "shrugs", ["Lyft axlarna upp mot öronen med raka armar.", "Sänk långsamt utan att böja armbågarna eller rulla axlarna."], `
shrug_bar|Shrugs med skivstång|Håll stången framför låren med överhandsgrepp och raka handleder.|12–15
`, {}, "axlar");
  family("pike_pushups", "bw", "chestBW", ["Böj armarna och sänk huvudet mot golvet mellan händerna.", "Pressa tillbaka med höften högt utan att slå huvudet i underlaget."], `
pike_knee|Pike-armhävningar med böjda knän|Stå med höften högt och böj knäna så att ryggen kan hållas lång.|6–12
`, {}, "axlar");

  // Armar och underarmar (40).
  const curl = ["Böj armbågen och för vikten mot axeln med stilla överarm.", "Sänk långsamt tills armen är nästan rak utan att gunga med kroppen."];
  family("hantelcurl", "db", "bicepsDB", curl, `
curl_seated|Sittande hantelcurl|Sitt upprätt på bänkkanten med handflatorna framåt.
curl_alternate|Växelvis hantelcurl|Stå med hantlarna vid sidorna och gör en hel repetition med en arm i taget.|10–12/arm
curl_zottman|Zottmancurl|Lyft med handflatorna uppåt; vrid dem nedåt i toppläget innan du sänker.
curl_crosshammer|Cross-body hammercurl|Håll tummen uppåt och lyft hanteln snett mot motsatt bröstsida.|10–12/arm
curl_reverse_db|Omvänd hantelcurl|Håll handflatorna nedåt och använd en lätt vikt genom hela curlen.
`);
  family("hammercurl", "db", "bicepsDB", curl, `
hammer_seated|Sittande hammercurl|Sitt med fötterna i golvet och handflatorna mot varandra.
hammer_incline|Lutande hammercurl|Ligg mot en lutande bänk med armarna hängande och tummarna framåt.
hammer_alternate|Växelvis hammercurl|Lyft en hantel i taget med tummen uppåt och den andra armen stilla.|10–12/arm
`);
  family("lutande_curl", "db", "bicepsDB", curl, `
incline_curl_alternate|Växelvis lutande hantelcurl|Luta ryggen mot bänken och gör en curl i taget med armarna bakom bålen.|10–12/arm
incline_curl_single|Enarms lutande hantelcurl|Luta ryggen mot stödet och arbeta med en arm i taget utan att föra överarmen fram.|10–12/arm
`);
  family("scottcurl", "db", "bicepsDB", curl, `
preacher_db|Scottcurl med hantel|Sitt med en överarm helt mot scottbänkens dyna och handflatan uppåt.|10–12/arm
preacher_hammer|Hammercurl mot scottbänk|Sitt med överarmen mot dynan och håll hanteln med tummen uppåt.|10–12/arm
`);
  family("spidercurl", "db", "bicepsDB", curl, `
spider_db|Spidercurl med hantlar|Ligg med bröstet mot lutande bänk och armarna hängande lodrätt.
spider_hammer|Spider-hammercurl|Ligg med bröstet mot bänken och håll tummarna framåt när armarna hänger ned.
`);
  family("bicepscurl", "bar", "bicepsBar", curl, `
bar_curl_wide|Bicepscurl med brett stånggrepp|Greppa stången lite bredare än axlarna och håll handlederna raka.
bar_curl_close|Bicepscurl med smalt stånggrepp|Greppa stången lite innanför axelbredd utan att böja handlederna åt sidan.
bar_curl_wall|Bicepscurl med ryggen mot vägg|Stå med säte och övre rygg mot en vägg för att begränsa kroppssving.
`);
  family("kabelcurl", "cable", "bicepsCable", curl, `
cable_curl_rope|Hammercurl med rep i kabel|Fäst rep i låg trissa och håll händerna med tummarna uppåt.
cable_curl_single|Enarms bicepscurl i kabel|Stå framför låg trissa med ett handtag och handflatan framåt.|10–15/arm
cable_curl_reverse|Omvänd bicepscurl i kabel|Greppa en rak stång i låg trissa med handflatorna nedåt.
cable_curl_ez|Bicepscurl med EZ-handtag i kabel|Fäst ett vinklat stånghandtag i låg trissa och håll överarmarna intill sidan.
`, {cable:[95,94]});
  family("scottcurl", "cable", "bicepsCable", curl, `
preacher_cable|Scottcurl i kabel|Placera scottbänken framför låg trissa och vila överarmarna mot dynan.
`, {cable:[100,90]});
  const pushdown = ["Sträck armbågen tills armen är rak utan att flytta överarmen.", "Låt handtaget komma tillbaka kontrollerat med axeln stilla."];
  family("triceps_pushdown", "cable", "tricepsCable", pushdown, `
pushdown_bar|Triceps pushdown med rak stång|Greppa en rak stång med överhandsgrepp från hög trissa.
pushdown_vbar|Triceps pushdown med V-handtag|Använd ett vinklat V-handtag och håll handlederna i neutral vinkel.
pushdown_reverse|Triceps pushdown med underhandsgrepp|Greppa stången med handflatorna uppåt och välj en lätt vikt.
pushdown_single|Enarms triceps pushdown|Håll ett handtag från hög trissa och lås överarmen vid sidan.|10–15/arm
pushdown_cross|Triceps pushdown tvärs över kroppen|Stå lite på sidan om hög trissa och sträck armen diagonalt mot motsatt höft.|10–15/arm
`, {cable:[84,-8]});
  family("fransk_press", "db", "tricepsDB", ["Böj armbågen så att vikten går bakom huvudet utan att överarmen faller utåt.", "Sträck armen igen med magen spänd och axeln stilla."], `
overhead_single|Enarms tricepssträckning med hantel|Håll en hantel ovanför axeln och låt armbågen peka mot taket.|10–15/arm
overhead_seated|Sittande tricepssträckning med hantel|Sitt upprätt och håll en hantel med båda händerna ovanför huvudet.
`);
  family("fransk_press", "cable", "tricepsCable", ["Böj armbågarna med överarmarna kvar intill huvudet.", "Sträck armarna framåt och uppåt utan att svanka."], `
overhead_cable|Tricepssträckning över huvudet i kabel|Vänd ryggen mot låg trissa och håll repet ovanför huvudet med ett stabilt steg.
overhead_cable_single|Enarms tricepssträckning över huvudet i kabel|Vänd ryggen mot låg trissa och håll ett handtag ovanför ena axeln.|10–15/arm
`, {cable:[8,88]});
  family("skullcrushers", "bar", "tricepsBar", ["Böj armbågarna och sänk vikten bakom pannan med överarmarna stilla.", "Sträck armarna igen utan att flytta axlarna från bänken."], `
skull_ez|Skullcrushers med EZ-stång|Ligg på bänken och greppa EZ-stångens vinklade partier med raka handleder.
skull_incline|Lutande skullcrushers med stång|Ligg på en svagt lutande bänk med överarmarna riktade uppåt.
`);
  family("hantel_skullcrushers", "db", "tricepsDB", ["Böj armbågen och sänk vikten intill huvudet med överarmen stilla.", "Sträck armen med kontroll och håll handleden rak."], `
skull_single|Enarms skullcrusher med hantel|Ligg på bänken och håll en hantel ovanför axeln med neutralt grepp.|10–15/arm
skull_floor|Skullcrushers med hantlar på golv|Ligg på golvet med böjda knän och håll hantlarna ovanför axlarna.
`, {scene:[]});
  family("kickbacks", "cable", "tricepsCable", pushdown, `
kickback_cable|Tricepskickback i kabel|Fäll fram framför låg trissa och håll överarmen längs bålen med armbågen bakom höften.|12–15/arm
`, {cable:[104,84]});
  family("handledscurl", "bar", "forearmsBar", ["Böj handlederna uppåt med underarmarna kvar på stödet.", "Sänk kontrollerat och undvik att lyfta armbågarna."], `
wrist_bar|Handledscurl med skivstång|Sitt med underarmarna mot låren och stången i händerna med handflatorna uppåt.|15–20
`);
  family("omvand_handledscurl", "bar", "forearmsBar", ["Lyft handryggarna med underarmarna kvar mot stödet.", "Sänk långsamt och använd en mycket lätt stång."], `
wrist_reverse_bar|Omvänd handledscurl med skivstång|Vila underarmarna på låren med handflatorna nedåt och händerna utanför knäna.|15–20
`);
  family("handledscurl", "cable", "forearmsCable", ["Böj handlederna utan att lyfta underarmarna från låren.", "Släpp tillbaka långsamt och behåll greppet om handtaget."], `
wrist_cable|Handledscurl i kabel|Sitt framför låg trissa med underarmarna på låren och handflatorna uppåt.|15–20
`, {cable:[105,85]});
  family("handledscurl", "db", "forearms", ["Rotera underarmen långsamt utan att flytta armbågen från låret.", "Vänd tillbaka inom ett bekvämt rörelseomfång med mycket lätt vikt."], `
forearm_rotate|Underarmsrotation med hantel|Sitt med armbågen böjd på låret och håll en lätt hantel med tummen uppåt; vrid handflatan uppåt och tillbaka.|12–15/arm
`);

  // Ben och säte: bilateral och ensidig träning hemma och på gym (67).
  const squat = ["Böj knän och höfter med hela foten i underlaget och knäna i tårnas riktning.", "Pressa upp kontrollerat utan att låta knäna falla inåt."];
  family("knaboj", "bar", "quadsBar", squat, `
squat_highbar|Knäböj med hög stångplacering|Placera stången på övre delen av kappmuskeln och håll bröstet högt.
squat_lowbar|Knäböj med låg stångplacering|Placera stången stadigt över bakre axlarna och luta bålen framåt med neutral rygg.
squat_box|Boxknäböj med skivstång|Ställ en stabil box bakom dig; nudda eller sitt kort med bibehållen bålspänning.
squat_pause|Knäböj med stopp|Stanna två sekunder i ett bekvämt bottenläge utan att slappna av i bålen.|5–8
squat_heels|Knäböj med hälarna upphöjda|Placera hälarna på ett stabilt kilstöd och använd en lättare stångvikt.
`);
  family("frontboj", "bar", "quadsBar", squat, `
front_pause|Frontböj med stopp|Vila stången på axlarnas framsida och pausa en sekund i bottenläget.|5–8
front_heels|Frontböj med hälarna upphöjda|Stå på ett stadigt hälstöd och håll armbågarna högt genom hela rörelsen.
`);
  family("knaboj", "bw", "quadsBW", squat, `
squat_body|Knäböj med kroppsvikt|Stå ungefär axelbrett med armarna framför kroppen och blicken framåt.|12–20
squat_chair|Knäböj till stol|Stå framför en stadig stol och sätt dig mjukt innan du reser dig utan handhjälp.|10–15
squat_narrow|Smala kroppsviktsknäböj|Stå med fötterna nära varandra och gå bara så djupt att hälarna ligger kvar.|12–20
`, {A:{...EX.knaboj.A,a:[80,36]},B:{...EX.knaboj.B,a:[76,50]}});
  family("goblet", "kb", "glutesKB", squat, `
kb_goblet|Gobletknäböj med kettlebell|Håll kettlebellen i hornen framför bröstet med armbågarna riktade nedåt.
kb_double_squat|Frontböj med två kettlebells|Vila två kettlebells i rack vid axlarna och håll armbågarna nära bålen.
`);
  family("goblet", "db", "quadsDB", squat, `
goblet_heels|Gobletknäböj med upphöjda hälar|Håll hanteln vid bröstet och placera hälarna på ett stabilt kilstöd.
goblet_box|Gobletknäböj till box|Håll hanteln mot bröstet och nudda en stadig box lätt i bottenläget.
`);
  const hinge = ["För höften bakåt med lätt böjda knän och lång, neutral rygg.", "Pressa fötterna mot golvet och sträck höften utan att luta bakåt."];
  family("hantel_rumansk", "db", "hamDB", hinge, `
rdl_kickstand|Rumänsk marklyft med stödfot|Placera ena foten lite bakom som balansstöd och lägg vikten på främre benet.|8–12/ben
`);
  family("enbens_rumansk", "kb", "glutesKB", hinge, `
rdl_kb_single|Enbens rumänsk marklyft med kettlebell|Håll klotet i motsatt hand till stödbenet och håll höfterna parallella.|8–12/ben
`);
  family("hantel_rumansk", "kb", "glutesKB", hinge, `
rdl_kb_double|Rumänsk marklyft med två kettlebells|Stå höftbrett och håll en kettlebell i varje hand framför låren.
`);
  family("marklyft", "db", "hamDB", ["Böj knän och höfter och håll vikterna nära benen med neutral rygg.", "Res dig genom att pressa fötterna i golvet och sätt ned vikterna kontrollerat."], `
deadlift_db|Marklyft med hantlar|Placera hantlarna vid utsidan av fötterna och börja från en höjd som låter ryggen vara neutral.
`, {}, "ben");
  family("marklyft", "kb", "glutesKB", ["Greppa vikten med rak rygg och spänd mage.", "Sträck knän och höfter tillsammans och sänk tillbaka under kontroll."], `
deadlift_kb|Marklyft med kettlebell|Stå höftbrett över klotet med det mellan fötterna; bygg upp det på ett stöd vid behov.
`, {}, "ben");
  family("rumansk_marklyft", "bar", "hamBar", hinge, `
goodmorning|Good morning med skivstång|Placera en lätt stång på övre ryggen och håll knäna mjuka under höftfällningen.
`, {A:{...EX.knaboj.A},B:{h:[46,58],t:118,a:[34,30],f:[56,95]} }, "ben");
  family("hantel_rumansk", "db", "hamDB", hinge, `
goodmorning_goblet|Good morning med hantel vid bröstet|Håll en lätt hantel tätt mot bröstet med armbågarna nedåt.
`, {A:{...EX.goblet.A},B:{...EX.hantel_rumansk.B,a:[70,48],eb:1}});
  const split = ["Sänk bakre knät mot golvet med främre knät i fotens riktning.", "Pressa genom främre foten och håll bäckenet riktat framåt."];
  family("split_squat", "db", "quadsDB", split, `
split_db|Split squat med hantlar|Stå i ett långt steg med en hantel i varje hand och båda fötterna kvar i golvet.|8–12/ben
split_frontfoot|Split squat med främre foten upphöjd|Placera främre foten på en låg stadig plattform och håll hantlar vid sidorna.|8–12/ben
split_suitcase|Split squat med en hantel vid sidan|Håll en hantel vid motsatt sida från främre benet och stå med fötterna som på två räls.|8–12/ben
`);
  family("split_squat", "bar", "quadsBar", split, `
split_bar|Split squat med skivstång|Vila stången på övre ryggen och håll båda fötterna kvar i en lång fotställning.|8–12/ben
`);
  family("bulgarisk", "kb", "glutesKB", split, `
bulgarian_kb|Bulgarisk utfallsböj med kettlebell|Vila bakre foten på en låg bänk och håll kettlebellen vid bröstet.|8–12/ben
`);
  family("bakatutfall", "bar", "quadsBar", split, `
reverse_bar|Bakåtutfall med skivstång|Vila stången på övre ryggen och ta ett kontrollerat steg bakåt per repetition.|8–12/ben
`);
  family("bakatutfall", "bw", "quadsBW", split, `
reverse_bw|Bakåtutfall med kroppsvikt|Ta ett långt steg bakåt med händerna vid höfterna och återgå till stående.|10–15/ben
`);
  family("utfall", "bw", "quadsBW", split, `
forward_bw|Framåtutfall med kroppsvikt|Ta ett kontrollerat steg framåt med händerna vid höfterna och pressa tillbaka.|10–15/ben
`);
  family("gaende_utfall", "bar", "quadsBar", split, `
walking_bar|Gående utfall med skivstång|Vila stången på övre ryggen och använd en fri rak sträcka.|8–12/ben
`);
  family("sidoutfall", "db", "quadsDB", ["För höften bakåt över det böjda benet medan andra benet hålls långt.", "Pressa tillbaka till mitten och byt sida med fortsatt kontroll."], `
lateral_db|Sidoutfall med hantlar|Håll hantlarna framför höfterna och ta ett brett steg åt sidan.|8–12/sida
lateral_goblet|Sidoutfall med gobletgrepp|Håll en hantel vid bröstet och ta ett långt steg åt sidan.|8–12/sida
`);
  family("utfall", "kb", "glutesKB", split, `
lunge_kb_rack|Framåtutfall med kettlebell i rack|Håll klotet i rack vid ena axeln och ta ett lugnt steg framåt utan att luta bålen.|8–12/ben
`);
  const step = ["Placera hela foten på plattformen och pressa dig upp med det främre benet.", "Kliv ned kontrollerat utan att skjuta ifrån kraftigt med bakre foten."];
  family("stegupp", "bw", "quadsBW", step, `
step_body|Stegupp med kroppsvikt|Använd en låg stabil trappa eller träningsbox och håll händerna vid höfterna.|10–15/ben
`);
  family("stegupp", "bar", "quadsBar", step, `
step_bar|Stegupp med skivstång|Håll en lätt stång över övre ryggen och välj en låg stabil träningsbox.|8–12/ben
`);
  family("stegupp", "db", "quadsDB", step, `
step_lateral|Stegupp i sidled med hantlar|Stå med sidan mot en låg stabil box och håll hantlarna längs sidorna.|8–12/ben
step_single_db|Stegupp med en hantel|Håll en hantel i motsatt hand till benet på boxen och håll bäckenet plant.|8–12/ben
`);
  const bridge = ["Pressa genom fötterna tills höften är sträckt och revbenen hålls nere.", "Sänk höften långsamt utan att överdriva svanken i toppläget."];
  family("glute_bridge", "db", "glutesDB", bridge, `
bridge_db|Glute bridge med hantel|Ligg på rygg med en vadderad hantel över höfterna och båda fötterna i golvet.
`);
  family("glute_bridge", "bar", "glutesBar", bridge, `
bridge_bar|Glute bridge med skivstång|Ligg på golvet med en vadderad stång över höfterna och knäna böjda.
`);
  family("glute_bridge", "bw", "glutesBW", bridge, `
bridge_heels|Glute bridge med hälarna på bänk|Placera hälarna på en stadig låg bänk och låt ryggen vila på golvet.
bridge_longlever|Glute bridge med lång hävarm|Placera hälarna längre från sätet än vanligt och håll tårna lätt lyfta.
bridge_march|Glute bridge med växelvisa fotlyft|Håll höften högt och lyft en fot i taget några centimeter utan att bäckenet tippar.|10–15/ben
bridge_frog|Frog pumps|Ligg på rygg med fotsulorna mot varandra och knäna utåt; gör korta höftlyft.|15–25
`);
  family("hip_thrust", "bw", "glutesBW", bridge, `
hipthrust_body|Hip thrust med kroppsvikt|Stöd skulderbladen mot en stadig bänk och placera händerna på höfterna.
hipthrust_single|Hip thrust på ett ben|Stöd övre ryggen mot bänken och håll ena foten lyft utan att vrida bäckenet.|8–12/ben
`);
  family("hip_thrust", "db", "glutesDB", bridge, `
hipthrust_db|Hip thrust med hantel|Stöd skulderbladen mot bänken och håll en vadderad hantel över höfterna.
`);
  family("hip_thrust", "kb", "glutesKB", bridge, `
hipthrust_kb|Hip thrust med kettlebell|Stöd ryggen mot bänken och håll klotet stadigt på ett mjukt skydd över höfterna.
`);
  const legcurl = ["Böj knät kontrollerat utan att lyfta bäckenet från stödet.", "Sträck tillbaka långsamt och håll knäleden i linje med maskinens led."];
  family("bencurl", "machine", "hamMachine", legcurl, `
curl_prone_single|Liggande bencurl ett ben i taget|Ställ dynan ovanför hälen och arbeta med ett ben medan det andra vilar.|10–15/ben
curl_prone_pause|Liggande bencurl med stopp|Ställ in dynan ovanför hälarna och stanna en sekund i det böjda läget.|10–15
`, {pad:true});
  family("sittande_bencurl", "machine", "hamMachine", legcurl, `
curl_seated_single|Sittande bencurl ett ben i taget|Lås lårdynan över båda låren och arbeta med ett ben i taget.|10–15/ben
curl_seated_eccentric|Sittande bencurl med långsam återgång|Ställ in lårstödet och låt viktmagasinet sjunka under tre sekunder.|8–12
`, {pad:true});
  family("nordic", "bw", "hamBW", ["Sänk kroppen framåt från knäna med rak linje genom höft och bål.", "Fånga mjukt med händerna och hjälp dig tillbaka utan att vika i höften."], `
nordic_eccentric|Excentrisk Nordic curl|Fixera anklarna säkert under ett stabilt vadderat stöd; bromsa vägen ned och hjälp upp med händerna.|4–6
`);
  family("benpress", "machine", "quadsMachine", ["Sänk plattan tills knäna är böjda utan att ländryggen lossnar från stödet.", "Pressa upp kontrollerat med hela foten och undvik att låsa knäna hårt."], `
legpress_high|Benpress med hög fotplacering|Placera fötterna lite högre på plattan och håll bäckenet mot ryggstödet.
legpress_wide|Benpress med bred fotställning|Placera fötterna bredare än höfterna med tårna lätt utåt.
legpress_narrow|Benpress med smal fotställning|Placera fötterna ungefär höftbrett och välj ett rörelsedjup där hälarna ligger kvar.
`, {plate:[6,8]});
  const calf = ["Pressa upp genom trampdynan med knät stilla och fotleden i rak linje.", "Sänk hälen långsamt och undvik att studsa i bottenläget."];
  family("tahavningar", "db", "calvesDB", calf, `
calf_db|Stående tåhävningar med hantlar|Håll en hantel i varje hand och stå med framfötterna på ett stabilt lågt stöd.|12–20
calf_single_db|Enbens tåhävning med hantel|Håll en hantel vid sidan och använd fria handen för lätt balansstöd.|12–20/ben
`);
  family("tahavningar", "bw", "calvesBW", calf, `
calf_step|Tåhävningar på trappsteg|Stå med framfötterna på ett stadigt trappsteg och håll lätt i räcket.|15–25
calf_bentknee|Tåhävningar med böjda knän|Böj knäna lätt och behåll samma knävinkel genom hela lyftet.|15–25
calf_eccentric|Excentrisk tåhävning på ett ben|Gå upp med båda fötterna och sänk långsamt på ett ben; byt sida efter setet.|10–15/ben
`);
  family("sittande_vadpress_hantel", "db", "calvesDB", calf, `
calf_seated_single|Sittande tåhävning på ett ben med hantel|Sitt med en hantel över ena låret nära knät och framfoten på ett lågt stöd.|12–20/ben
`);
  family("vadpress", "machine", "calvesMachine", calf, `
calf_machine_single|Stående vadpress ett ben i taget|Ställ in axeldynorna och håll andra foten fri från plattan.|12–20/ben
`);
  family("sittande_vadpress", "machine", "calvesMachine", calf, `
calf_seated_pause|Sittande vadpress med stopp|Placera dynan över låren och håll högsta tåläget en sekund.|12–20
`);
  family("sidliggande_benlyft", "bw", "glutesBW", ["Lyft det övre benet utan att vrida bäckenet bakåt.", "Sänk långsamt och behåll spänningen på utsidan av höften."], `
clamshell|Musslan|Ligg på sidan med böjda knän och fötterna ihop; öppna övre knät medan hälarna möts.|15–20/sida
hip_adduct_side|Sidliggande höftadduktion|Ligg på sidan, sätt övre foten framför undre knät och lyft det undre raka benet.|12–20/sida
`);
  family("kabel_kickback", "bw", "glutesBW", ["För det böjda benets häl uppåt och bakåt utan att svanka.", "För tillbaka knät med stilla bäcken och byt sida efter setet."], `
donkey_kick|Åsnesparkar på alla fyra|Stå på alla fyra med händerna under axlarna och det arbetande knät böjt 90 grader.|12–20/ben
`, {scene:[], A:{h:[43,70],s:[73,67],a:[75,95],f:[22,95],f2:[24,93],kb:-1},B:{h:[43,70],s:[73,67],a:[75,95],f:[22,95],f2:[13,60],kb:-1,kb2:1}});
  family("hoftabduktion_maskin", "machine", "groinMachine", ["Pressa låren inåt mot maskinens dynor med ryggen mot stödet.", "Släpp ut benen långsamt inom ett bekvämt rörelseomfång."], `
hip_adduct_machine|Höftadduktion i maskin|Ställ in ett bekvämt öppet startläge med dynorna mot lårens insidor.|12–20
`, {A:EX.hoftabduktion_maskin.B,B:EX.hoftabduktion_maskin.A,prim:["framsida_lar"],sec:["sate"],muscles:"Insida lår"});

  // Bål: flexion, sidostabilitet och rörelser med stilla bäcken (22).
  family("dead_bug", "bw", "abs", ["För armen eller benet långsamt bort från kroppen med ländryggen stilla.", "Återgå med kontroll och byt sida utan att tappa bukspänningen."], `
deadbug_heeltap|Dead bug med hälisättning|Ligg på rygg med höfter och knän i 90 grader; sänk en häl i taget mot golvet.|10–15/sida
deadbug_arms|Dead bug med enbart armrörelse|Håll benen stilla i 90 grader och för en arm i taget över huvudet.|10–15/arm
deadbug_legs|Dead bug med enbart bensträckning|Håll armarna riktade mot taket och sträck ett ben i taget längs golvet.|8–12/ben
`);
  family("bird_dog", "bw", "abs", ["Sträck den arbetande kroppsdelen utan att vrida eller svanka ryggen.", "Återgå långsamt till alla fyra och växla sida."], `
birddog_arms|Fyrfota armsträckning|Stå på alla fyra med knäna under höfterna och sträck en arm rakt fram.|10–15/arm
birddog_legs|Fyrfota bensträckning|Stå på alla fyra och sträck ett ben bakåt med tårna mot golvet.|10–15/ben
`);
  family("plankan", "bw", "abs", ["Spänn magen och sätet så att kroppen håller en rak linje.", "Andas lugnt och avsluta setet när du inte kan behålla positionen."], `
plank_singleleg|Underarmsplanka med ett ben lyft|Placera armbågarna under axlarna och lyft ena foten några centimeter.|20–30 s/ben
plank_longlever|Planka med lång hävarm|Placera armbågarna en liten bit framför axlarna och håll höften stilla.|15–30 s
plank_rkc|RKC-planka|Pressa underarmar och tår mot golvet och dra dem isometriskt mot varandra utan att de flyttas.|10–20 s
`, {B:null});
  family("hand_planka", "bw", "abs", ["Behåll bäckenet parallellt med golvet med spänd mage.", "Arbeta långsamt och flytta tillbaka vikten innan du byter sida."], `
plank_updown|Planka upp och ned på armbågar|Gå från underarmar till raka armar en hand i taget och tillbaka; växla ledande arm.|8–12
plank_singlearm|Hög planka med en hand lyft|Stå med fötterna brett och lyft ena handen från golvet utan att vrida bålen.|15–25 s/arm
`, {B:null});
  family("sidoplanka", "bw", "obliques", ["Lyft höften och håll bröstkorg och bäcken staplade ovanför varandra.", "Andas lugnt och avsluta när höften börjar sjunka; byt sida."], `
sideplank_star|Stjärnplanka på underarm|Stöd på ena underarmen och fotens utsida; lyft övre benet och håll det fritt.|15–25 s/sida
sideplank_copenhagen|Kort Copenhagenplanka|Stöd övre knät på en stadig bänk och håll höften lyft från golvet med undre benet fritt.|15–25 s/sida
`, {B:null});
  family("sidoplanka_upp", "bw", "obliques", ["För översta armen under kroppen genom att vrida bröstkorgen kontrollerat.", "Öppna tillbaka mot sidan utan att låta höften falla ned."], `
sideplank_reach|Sidoplanka med rotation|Stå i sidoplanka på underarmen och låt övre handen starta riktad mot taket.|8–12/sida
`, {A:EX.sidoplanka.A,B:null});
  family("crunches", "bw", "abs", ["Rulla upp skulderbladen från golvet genom att korta av avståndet mellan revben och bäcken.", "Sänk långsamt med nacken i neutral position och utan att dra i huvudet."], `
crunch_overhead|Crunch med armarna över huvudet|Ligg på rygg med böjda knän och långa armar vid öronen.|12–20
crunch_tabletop|Crunch med benen i bordsläge|Ligg på rygg med höfter och knän böjda 90 grader och benen stilla.|12–20
crunch_reach|Crunch med händerna mot knäna|Ligg med fötterna i golvet och sträck händerna fram längs låren mot knäna.|12–20
`);
  family("russian_twist", "bw", "obliques", ["Böj bålen åt sidan och för handen mot samma sidas häl med bäckenet stilla.", "Återgå till mitten och växla sida utan att kasta huvudet framåt."], `
heel_touch|Liggande hälklapp|Ligg på rygg med böjda knän, fötterna i golvet och skulderbladen lite lyfta.|12–20/sida
`, {A:{...EX.crunches.B,a:[75,82]},B:null});
  family("benlyft_liggande", "bw", "abs", ["Sänk benen bara så långt att ländryggens position kan behållas.", "Lyft tillbaka under kontroll utan att kasta benen eller översträcka ryggen."], `
leg_scissors|Saxsparkar|Ligg på rygg med benen lite lyfta och korsa dem växelvis över och under varandra.|12–20/sida
leg_alternate|Växelvisa raka benlyft|Ligg på rygg med båda benen uppåt och sänk ett rakt ben i taget.|10–15/ben
`);
  family("hangande_knalyft", "bw", "abs", ["Dra knäna upp mot bröstet och tippa bäckenet lätt bakåt.", "Sänk långsamt utan att bygga upp sving i kroppen."], `
hanging_knee_twist|Hängande knälyft åt sidan|Häng med stadigt grepp och rikta böjda knän växelvis mot höger och vänster sida.|8–12/sida
`);
  family("pallof", "cable", "pallof", ["Pressa handtaget rakt fram från bröstet utan att vrida bålen.", "För tillbaka händerna långsamt med höfter och axlar riktade framåt."], `
pallof_kneeling|Knästående Pallof press|Stå på båda knäna med trissan vid brösthöjd vid sidan av kroppen.|10–15/sida
`, {cable:[12,42]});
  family("omvand_planka", "bw", "abs", ["Pressa händer och fötter mot golvet så att höften hålls uppe.", "Håll nacken lång och andas lugnt utan att låta höften sjunka."], `
reverse_tabletop|Omvänt bord|Sitt med händerna bakom höfterna och böjda knän; lyft höften tills bålen är ungefär vågrät.|20–30 s
`, {A:{h:[53,75],s:[80,62],a:[94,92],f:[45,95],kb:-1,eb:-1},B:null});

  // Riktade poser när variantens kroppsställning avviker från grundövningen.
  // Rotation kring underarm/ryggrad och rörelser i sidled som inte kan visas
  // tydligt i sidovy får en korrekt statisk startposition, inte en annan rörelse.
  function pose(code, changes) { Object.assign(EX["stx_" + code], changes); }
  const floorA = {h:[44,90],t:90,a:[70,81],f:[36,95],kb:1,eb:-1};
  const floorB = {...floorA,a:[75,60]};
  for (const code of ["db_floor","db_single_floor","kb_floor"])
    pose(code,{A:floorA,B:floorB,scene:[]});
  pose("db_floor_fly",{A:{...floorA,a:[80,82]},B:floorB,scene:[]});
  pose("skull_floor",{A:{...floorA,a:[85,78]},B:floorB,scene:[]});
  pose("cable_supine_fly",{A:EX.hantelflyes.A,B:EX.hantelflyes.B,scene:EX.hantelflyes.scene,cable:[8,85]});
  pose("cable_incline_press",{A:EX.lutande_hantelpress.A,B:EX.lutande_hantelpress.B,scene:EX.lutande_hantelpress.scene,cable:[20,90]});
  for (const code of ["cable_single_press"])
    pose(code,{A:{...STAND,a:[66,30],eb:1},B:{...STAND,a:[87,28],eb:1},scene:[]});
  pose("pushup_hindu",{A:EX.pike_pushups.A,B:null});
  pose("pushup_archer",{B:null});
  pose("pushup_spiderman",{B:null});
  pose("pushup_singleleg",{A:{...EX.armhavningar.A,f2:[15,80]},B:{...EX.armhavningar.B,f2:[15,80]}});
  const kneel = {h:[48,74],t:180,f:[28,95],kb:-1};
  pose("cable_halfkneel_press",{A:{...kneel,a:[56,49],f2:[74,95],kb2:-1,eb:1},B:{...kneel,a:[77,43],f2:[74,95],kb2:-1,eb:1},scene:[]});
  pose("cable_row_kneeling",{A:{...kneel,a:[77,45]},B:{...kneel,a:[57,61]},scene:[]});
  pose("cable_row_halfkneel",{A:{...kneel,a:[77,45],f2:[74,95],kb2:-1},B:{...kneel,a:[57,61],f2:[74,95],kb2:-1}});
  pose("lat_halfkneel",{A:{...kneel,a:[65,17],f2:[74,95],kb2:-1},B:{...kneel,a:[55,49],f2:[74,95],kb2:-1},scene:[],cable:[80,-12]});
  const chairScene = [["rect",40,63,24,4],["line",52,67,52,95]];
  pose("bar_press_seated",{view:"side",A:{...SEATED,a:[56,22],eb:-1},B:{...SEATED,a:[53,-2],eb:-1},scene:chairScene});
  for (const code of ["lateral_seated","shrug_seated"])
    pose(code,{A:{...EX["stx_"+code].A,h:[60,62],f:[77,95]},B:{...EX["stx_"+code].B,h:[60,62],f:[77,95]},scene:chairScene});
  pose("rear_seated",{A:{h:[46,65],s:[71,57],a:[72,86],f:[76,95]},B:{h:[46,65],s:[71,57],a:[88,55],f:[76,95]},scene:chairScene});
  pose("rear_supported",{A:{...EX.broststodd_rodd.A},B:{...EX.broststodd_rodd.A,a:[38,48],eb:-1},scene:EX.broststodd_rodd.scene});
  pose("facepull_seated",{A:{...SEATED,a:[80,24],eb:1},B:{...SEATED,a:[54,16],eb:1},scene:chairScene,cable:[105,22]});
  pose("facepull_kneeling",{A:{...kneel,a:[78,41],eb:1},B:{...kneel,a:[54,35],eb:1},scene:[],cable:[105,40]});
  for (const code of ["curl_seated","hammer_seated"])
    pose(code,{A:{...SEATED,a:[59,60],eb:1},B:{...SEATED,a:[64,31],eb:1},scene:chairScene});
  const reclineA = {h:[57,64],t:205,a:[45,66],f:[79,95],eb:1};
  const reclineB = {...reclineA,a:[50,37]};
  for (const code of ["hammer_incline","incline_curl_alternate","incline_curl_single"])
    pose(code,{A:reclineA,B:reclineB,scene:EX.lutande_hantelpress.scene});
  pose("overhead_seated",{A:{...SEATED,a:[40,21],eb:1},B:{...SEATED,a:[52,6],eb:1},scene:chairScene});
  pose("skull_incline",{A:{...EX.lutande_hantelpress.A,a:[27,23],eb:-1},B:{...EX.lutande_hantelpress.A,a:[52,7],eb:-1},scene:EX.lutande_hantelpress.scene});
  pose("forearm_rotate",{B:null});
  pose("bridge_heels",{A:{...EX.glute_bridge.A,f:[80,65]},B:{...EX.glute_bridge.B,f:[80,65]},scene:[["rect",72,66,25,29]]});
  pose("bridge_longlever",{A:{...EX.glute_bridge.A,f:[88,95]},B:{...EX.glute_bridge.B,f:[88,95]}});
  pose("bridge_march",{A:{...EX.glute_bridge.B,f2:[72,95]},B:{...EX.glute_bridge.B,f2:[66,68],kb2:1}});
  pose("bridge_frog",{B:null});
  pose("hipthrust_single",{A:{...EX.hip_thrust.A,f2:[90,70],kb2:1},B:{...EX.hip_thrust.B,f2:[90,48],kb2:1}});
  pose("calf_single_db",{A:EX.enbens_tahavning.A,B:EX.enbens_tahavning.B,scene:[]});
  pose("calf_bentknee",{A:{h:[52,63],t:180,a:[83,35],f:[62,95],kb:-1},B:{h:[52,59],t:180,a:[83,31],f:[64,91],kb:-1},scene:[]});
  pose("clamshell",{A:{...EX.sidliggande_benlyft.A,f:[32,95],f2:[32,95]},B:null});
  pose("hip_adduct_side",{A:{...EX.sidliggande_benlyft.A,f:[12,94],f2:[55,95],kb2:-1},B:{...EX.sidliggande_benlyft.A,f:[19,76],f2:[55,95],kb2:-1},
    cues:["Ligg på sidan, sätt övre foten framför undre knät och låt undre benet vara rakt.","Lyft det undre benet långsamt med höfterna kvar ovanpå varandra.","Sänk kontrollerat och byt sida efter setet."],muscles:"Insida lår",prim:["framsida_lar"],sec:[]});
  MW.stx_hip_adduct_side = sources.groinBW;
  pose("deadbug_arms",{B:{...EX.dead_bug.B,f:EX.dead_bug.A.f}});
  pose("deadbug_legs",{B:{...EX.dead_bug.B,a:EX.dead_bug.A.a}});
  pose("deadbug_heeltap",{B:{...EX.dead_bug.A,f:[82,93]}});
  pose("birddog_arms",{B:{...EX.bird_dog.B,f2:EX.bird_dog.A.f2,kb2:-1}});
  pose("birddog_legs",{B:{...EX.bird_dog.B,a2:EX.bird_dog.A.a2}});
  pose("plank_singleleg",{A:{...EX.plankan.A,f2:[15,80]}});
  pose("plank_longlever",{A:{...EX.plankan.A,a:[88,95]}});
  pose("plank_singlearm",{A:{...EX.hand_planka.A,a2:[49,79]}});
  pose("sideplank_star",{A:{...EX.sidoplanka.A,f2:[17,60]}});
  pose("sideplank_copenhagen",{A:{h:[44,65],s:[73,60],a:[81,88],f:[13,80],f2:[18,93],kb:1,kb2:-1,eb:-1},scene:[["rect",5,76,20,4],["line",9,80,9,95],["line",23,80,23,95]]});
  pose("crunch_overhead",{A:{...EX.crunches.A,a:[2,85]},B:{...EX.crunches.B,a:[3,61]}});
  pose("crunch_tabletop",{A:{...EX.crunches.A,f:[72,68],kb:1},B:{...EX.crunches.B,f:[72,68],kb:1}});
  pose("crunch_reach",{A:{...EX.crunches.A,a:[56,83]},B:{...EX.crunches.B,a:[65,72]}});
  pose("leg_scissors",{A:{...EX.benlyft_liggande.A,f:[90,82],f2:[89,87]},B:null});
  pose("leg_alternate",{A:{...EX.benlyft_liggande.B,f2:EX.benlyft_liggande.B.f},B:{...EX.benlyft_liggande.A,f2:EX.benlyft_liggande.B.f}});
  pose("hanging_knee_twist",{B:null});
  pose("pallof_kneeling",{A:{...kneel,a:[57,48],eb:1},B:{...kneel,a:[77,44],eb:1},scene:[]});
  // Handleder och underarmsrotation kan inte artikuleras separat i figuren.
  for (const code of ["wrist_bar","wrist_reverse_bar","wrist_cable","forearm_rotate"])
    pose(code,{A:{h:[46,65],s:[69,48],a:[73,77],f:[76,95],kb:-1,eb:1},B:null,scene:chairScene});
  for (const code of ["hip_adduct_side","hip_adduct_machine"])
    pose(code,{prim:["insida_lar"],sec:[],muscles:"Insida lår"});
  pose("sideplank_copenhagen",{prim:["insida_lar","mage"],sec:["sate"],muscles:"Insida lår, bål",
    A:{h:[44,67.0557],s:[73,61.4],a:[81,92],f:[13,92],f2:[18,93],kb:1,kb2:-1,eb:-1}});
  return Object.freeze(ids);
})();

"use strict";
// Datautökning för den befintliga övningsväljaren. Ingen guide eller ny UI-logik.
// Listlänkar visar liknande övningar; dessa MuscleWiki-listor kontrollerades 2026-10-28.
// stretchTargets är enbart beskrivande metadata, utan koppling till någon guide.
// Streckfiguren visar stöd/startläge; finger-, nack- och rotationsrörelser
// kan inte återges anatomiskt av den befintliga tvådimensionella figuren.
const EXTRA_STRETCH_IDS = [];
(() => {
  const wall = [["line", 102, 4, 102, 95]];
  const chair = [["rect", 30, 63, 36, 4], ["line", 34, 67, 34, 95], ["line", 62, 67, 62, 95]];
  const bench = [["rect", 82, 65, 32, 4], ["line", 86, 69, 86, 95], ["line", 110, 69, 110, 95]];
  const standing = { h: [58, 54], t: 180, a: [59, 84], f: [58, 95] };
  const seated = { h: [45, 62], t: 180, a: [67, 61], f: [73, 95], kb: -1 };
  const floorSit = { h: [38, 90], t: 180, a: [53, 89], f: [79, 94], kb: -1 };
  const supine = { h: [52, 90], t: 270, a: [25, 94], f: [92, 94], kb: -1 };
  const prone = { h: [46, 90], t: 90, a: [88, 94], f: [6, 94], kb: 1 };
  const four = { h: [42, 73], t: 90, a: [72, 95], f: [22, 95], kb: -1 };
  const kneel = { h: [54, 73], t: 180, a: [72, 68], f: [79, 95], f2: [28, 94], kb: -1, kb2: 1 };
  const mod = (p, q) => Object.assign({}, p, q);
  function add(id, name, muscles, reps, cues, targets, list, A, B, extras = {}) {
    id = "strx_" + id;
    if (EX[id]) throw new Error("Övnings-id finns redan: " + id);
    EX[id] = Object.assign({ name, cat: "stretch", bw: true, muscles, sets: 2, reps, cues,
      stretchTargets: targets.split(" "), A }, B ? { B } : {}, extras);
    MW[id] = list.startsWith("exercise/") ? list : "exercises/" + list + "/stretches";
    EXTRA_STRETCH_IDS.push(id);
  }

  // Nacke: små aktiva rörelser utan drag med händerna.
  add("neck_sidebend", "Aktiv sidolutning av nacken", "Övre kappmuskeln, nackens sidomuskler", "6/sida",
    ["Sitt högt på en stol med händerna vilande på låren.", "Luta örat en liten bit mot axeln utan att lyfta axeln.", "Återgå till mitten och växla sida utan att dra med handen."],
    "neck", "traps", mod(seated, { a: [64, 66] }), mod(seated, { a: [64, 66] }), { scene: chair });
  add("neck_turn", "Lugn nackrotation", "Nackens rotatorer, övre kappmuskeln", "6/sida",
    ["Stå upprätt med bröstet riktat framåt.", "Vrid huvudet lugnt åt sidan inom ett bekvämt rörelseutslag.", "Återgå till mitten innan du vrider åt andra hållet."],
    "neck", "traps", mod(standing, { a: [60, 81] }), mod(standing, { a: [60, 81] }));
  add("neck_nod", "Små nickningar i ryggliggande", "Djupa nackmuskler, nackens baksida", "8",
    ["Ligg på rygg med huvudet vilande på en tunn vikt handduk.", "Gör en liten nickning som om du säger ja utan att lyfta huvudet.", "Släpp tillbaka till neutralt läge och upprepa långsamt."],
    "neck", "traps", mod(supine, { a: [30, 94], f: [79, 95], kb: -1 }), mod(supine, { a: [30, 94], f: [79, 95], kb: -1 }));
  add("neck_diagonal", "Diagonal nackstretch utan handdrag", "Skulderbladshöjaren, nackens baksida", "20 s/sida",
    ["Sitt på en stol och låt ena handen vila under sätets kant.", "Vrid huvudet lite åt motsatt sida och sänk blicken mot armhålan.", "Håll en mild sträckning utan att trycka på huvudet; byt sida."],
    "neck", "traps", mod(seated, { a: [39, 65], a2: [64, 64] }), undefined, { scene: chair });

  // Axlar: aktiva rörelser och understödda positioner.
  add("wall_slide", "Väggglidning med underarmar", "Axelmuskler, sågmuskeln, breda ryggmuskeln", "8",
    ["Stå vänd mot väggen med underarmarna mot den och fötterna en bit ut.", "Glid upp med armarna medan revbenen hålls över bäckenet.", "Sänk långsamt och behåll ett lätt tryck mot väggen."],
    "shoulders lats", "shoulders", mod(standing, { h: [75, 54], a: [101, 29], f: [72, 95], eb: -1 }), mod(standing, { h: [75, 54], a: [101, 0], f: [72, 95], eb: -1 }), { scene: wall });
  add("floor_angels", "Snöänglar på golvet", "Bröstmuskler, axelmuskler, breda ryggmuskeln", "8",
    ["Ligg på rygg med böjda knän och armarna längs sidorna.", "För armarna i en bred båge mot huvudet utan att öka svanken.", "Vänd där rörelsen känns bekväm och för tillbaka armarna."],
    "shoulders chest", "shoulders", mod(supine, { a: [51, 94], f: [78, 95], kb: -1 }), mod(supine, { a: [0, 84], f: [78, 95], kb: -1 }));
  add("pendulum", "Avslappnad axelpendling", "Axelmuskler, bröstmuskler", "10/arm",
    ["Stöd ena handen på en stabil bänk och fäll fram från höften.", "Låt den fria armen hänga och pendla i små bågar fram och tillbaka.", "Håll axeln avslappnad och byt arm efter serien."],
    "shoulders", "shoulders", { h: [48, 54], t: 118, a: [63, 90], a2: [96, 65], f: [54, 95], f2: [33, 95] }, { h: [48, 54], t: 118, a: [85, 86], a2: [96, 65], f: [54, 95], f2: [33, 95] }, { scene: bench });
  add("arm_circles", "Kontrollerade armcirklar", "Axelmuskler, bröstmuskler", "8/riktning",
    ["Stå stadigt med raka armar ut åt sidorna.", "Rita långsamma cirklar med händerna och öka storleken försiktigt.", "Byt rotationsriktning och håll bålen stilla."],
    "shoulders", "shoulders", { h: [60, 54], a: [98, 17] }, { h: [60, 54], a: [97, 36] }, { view: "front" });
  add("shoulder_rolls", "Lugna skuldercirklar", "Kappmuskeln, skulderbladsmuskler", "8/riktning",
    ["Stå upprätt med armarna avslappnade vid sidorna.", "För axlarna uppåt, bakåt och nedåt i en lugn cirkel.", "Vänd cirkeln utan att skjuta fram huvudet."],
    "shoulders neck", "shoulders", mod(standing, { s: [58, 20], a: [60, 50] }), mod(standing, { s: [54, 27], a: [55, 57] }));
  add("wall_external_rotation", "Utåtrotation av axeln mot dörrkarm", "Axelns inåtrotatorer, bröstmuskler", "20 s/sida",
    ["Håll armbågen böjd intill midjan och lägg handflatan mot en dörrkarm.", "Vrid kroppen lite bort från handen medan armbågen stannar vid sidan.", "Stanna vid en mild sträckning och byt arm."],
    "shoulders chest", "shoulders", mod(standing, { h: [75, 54], a: [101, 49], f: [73, 95], eb: 1 }), undefined, { scene: wall });
  add("table_flexion", "Axelfällning med händer på bord", "Breda ryggmuskeln, axelmuskler", "30 s",
    ["Lägg händerna på ett stadigt bord och gå bakåt med fötterna.", "Fäll från höften så att bröstet sjunker mellan överarmarna.", "Håll armarna långa och magen lätt spänd utan att svanka."],
    "shoulders lats", "shoulders", { h: [39, 59], t: 102, a: [95, 65], f: [42, 95], kb: -1 }, undefined, { scene: bench });
  add("supine_flexion", "Axellyft över huvudet i ryggliggande", "Breda ryggmuskeln, bröstmuskler, axelmuskler", "8",
    ["Ligg på rygg med böjda knän och händerna ihop ovanför bröstet.", "För raka armar bakåt mot golvet så långt bålen kan vara stilla.", "Lyft tillbaka armarna och låt revbenen stanna nedåt."],
    "shoulders lats chest", "shoulders", mod(supine, { a: [23, 59], f: [78, 95] }), mod(supine, { a: [0, 86], f: [78, 95] }));
  add("goalpost_rotation", "Axelrotation i liggande målstolpe", "Axelns rotatorer, bröstmuskler", "8",
    ["Ligg på rygg med armarna utåt och armbågarna böjda i rät vinkel.", "Rotera långsamt underarmarna mot golvet ovanför respektive nedanför axlarna.", "Behåll överarmarnas stöd och använd ett litet bekvämt rörelseutslag."],
    "shoulders chest", "shoulders", mod(supine, { a: [24, 65], f: [78, 95], eb: -1 }), mod(supine, { a: [37, 91], f: [78, 95], eb: 1 }));

  // Bröst: olika stöd och armvinklar.
  add("chest_towel", "Bröstöppning över rullad handduk", "Stora och lilla bröstmuskeln, framsida axlar", "30 s",
    ["Lägg en rullad handduk längs övre ryggen och ge huvudet stöd vid behov.", "Ligg med böjda knän och låt armarna vila utåt med handflatorna upp.", "Andas lugnt och håll svanken avslappnad."],
    "chest shoulders", "chest", mod(supine, { s: [22, 85], a: [35, 94], a2: [15, 94], f: [78, 95] }), undefined, { scene: [["rect", 15, 89, 44, 4]] });
  add("chest_corner", "Bröststretch med båda armarna i hörn", "Stora bröstmuskeln, framsida axlar", "30 s",
    ["Stå vänd mot ett hörn och lägg en underarm mot vardera väggen.", "Ta ett litet steg framåt och låt bröstet komma mellan armarna.", "Håll axlarna sänkta och undvik att skjuta fram hakan."],
    "chest shoulders", "chest", { h: [60, 54], a: [87, 8], eb: -1 }, undefined, { view: "front", scene: [["line", 88, 0, 88, 95], ["line", 32, 0, 32, 95]] });
  add("chest_low_arm", "Bröststretch med låg arm mot vägg", "Övre bröstmuskeln, framsida axlar", "25 s/sida",
    ["Stå med sidan mot väggen och placera handflatan bakom dig under axelhöjd.", "Vrid bröstet långsamt bort från väggen med mjuk armbåge.", "Håll en mild sträckning och byt sida utan att axeln åker fram."],
    "chest shoulders", "chest", mod(standing, { a: [28, 44], a2: [62, 83] }), undefined, { scene: [["line", 27, 4, 27, 95]] });
  add("chest_chair", "Sittande bröstöppning med stolstöd", "Bröstmuskler, framsida axlar, biceps", "25 s",
    ["Sitt på framkanten av en stadig stol och håll i sitsens bakkant.", "Sträck armarna mjukt och lyft bröstbenet utan att luta huvudet bakåt.", "Behåll fötterna i golvet och andas lugnt."],
    "chest biceps shoulders", "chest", mod(seated, { a: [29, 65], a2: [35, 65] }), undefined, { scene: chair });
  add("chest_side_lying", "Sidliggande bröstöppning med hand bakom huvudet", "Bröstmuskler, bröstryggens muskler", "6/sida",
    ["Ligg på sidan med knäna böjda och den övre handen bakom huvudet.", "För övre armbågen bakåt medan knäna ligger kvar tillsammans.", "Återgå långsamt och gör rörelsen åt båda sidor."],
    "chest shoulders thoracic_back", "chest", mod(supine, { a: [13, 84], a2: [46, 90], f: [67, 91], kb: 1 }), mod(supine, { a: [15, 68], a2: [46, 90], f: [67, 91], kb: 1 }));

  // Rygg, sida och lats.
  add("open_book", "Öppen bok med raka armar", "Bröstryggens muskler, bröstmuskler", "6/sida",
    ["Ligg på sidan med böjda knän och raka armar framför bröstet.", "För den övre armen i en båge bakåt medan knäna ligger kvar.", "Följ handen med blicken och återgå utan att pressa rotationen."],
    "thoracic_back chest", "lowerback", mod(supine, { a: [25, 61], a2: [25, 62], f: [64, 91], kb: 1 }), mod(supine, { a: [2, 91], a2: [25, 62], f: [64, 91], kb: 1 }));
  add("quadruped_rotation", "Bröstryggsrotation på alla fyra", "Bröstryggens rotatorer, baksida axlar", "8/sida",
    ["Stå på alla fyra och lägg ena handen lätt bakom huvudet.", "Vrid bröstkorgen så att armbågen förs lugnt mot taket.", "För armbågen tillbaka under bröstet och behåll höften stilla."],
    "thoracic_back shoulders", "lowerback", mod(four, { a2: [75, 72], eb2: -1 }), mod(four, { a2: [77, 46], eb2: -1 }));
  add("chair_extension", "Bröstryggssträckning över stolrygg", "Bröstryggens sträckare, bröstmuskler", "8",
    ["Sitt på en stadig stol med ryggstödet mot övre ryggen och händerna bakom huvudet.", "Luta övre ryggen en liten bit över stödet med bäckenet kvar på sitsen.", "Återgå till upprätt utan att kasta huvudet bakåt."],
    "thoracic_back chest", "lowerback", mod(seated, { a: [45, 15], eb: -1 }), mod(seated, { t: 198, a: [34, 17], eb: -1 }), { scene: [...chair, ["line", 28, 65, 28, 29]] });
  add("standing_sidebend", "Stående sidostretch med arm över huvudet", "Breda ryggmuskeln, sneda magmuskler", "25 s/sida",
    ["Stå med fötterna höftbrett och lyft ena armen över huvudet.", "Luta dig försiktigt åt motsatt sida och håll båda fötterna tunga.", "Låt bröstet vara vänt framåt och byt sida efter hålltiden."],
    "lats obliques", "lats", mod(standing, { t: 195, a: [36, 0], a2: [61, 82] }));
  add("child_side_reach", "Barnets position med händer åt sidan", "Breda ryggmuskeln, sidan av bålen", "30 s/sida",
    ["Sätt dig mot hälarna och sträck armarna framåt längs golvet.", "Gå med båda händerna åt ena sidan medan sätet stannar centrerat.", "Andas in i den utsträckta sidan och byt håll."],
    "lats obliques", "lats", { h: [35, 86], t: 84, a: [92, 94], a2: [84, 90], f: [30, 95], kb: -1, eb: -1 } );
  add("wall_lat", "Enarms latsstretch mot vägg", "Breda ryggmuskeln, stora runda muskeln", "30 s/sida",
    ["Lägg ena handen högt mot väggen och ta ett steg bakåt.", "Skjut höften bakåt och sänk bröstet medan armen hålls lång.", "Håll bålen stabil och byt arm efter hålltiden."],
    "lats shoulders", "lats", { h: [44, 59], t: 114, a: [101, 31], a2: [60, 76], f: [44, 95], f2: [30, 95] }, undefined, { scene: wall });
  add("puppy", "Valpens position", "Breda ryggmuskeln, bröstmuskler, axlar", "30 s",
    ["Börja på alla fyra och behåll höften ovanför knäna.", "Gå fram med händerna och sänk bröstet mot golvet.", "Stanna i ett bekvämt läge utan att pressa ned ländryggen."],
    "lats chest shoulders", "lats", { h: [39, 66], s: [66, 81], a: [94, 94], f: [20, 94], kb: -1, eb: -1 } );
  add("upper_back_hug", "Sittande stretch mellan skulderbladen", "Rombmuskler, mellersta kappmuskeln", "25 s",
    ["Sitt stadigt och knäpp händerna framför bröstet.", "Sträck händerna framåt och låt skulderbladen glida isär.", "Håll nacken lång och andas lugnt utan att falla ihop över benen."],
    "upper_back shoulders", "shoulders", mod(seated, { t: 165, a: [82, 35], a2: [81, 36] }), undefined, { scene: chair });

  // Armar och underarmar.
  add("triceps_bench", "Tricepsstretch med armbågar på bänk", "Triceps långa huvud, breda ryggmuskeln", "30 s",
    ["Stå på knä framför en bänk och placera armbågarna på dynan.", "Böj armarna så att händerna når mot övre ryggen och skjut höften bakåt.", "Låt bröstet sjunka lite utan att svanka."],
    "triceps lats", "triceps", { h: [42, 73], t: 105, a: [76, 43], f: [22, 94], kb: -1, eb: -1 }, undefined, { scene: bench });
  add("triceps_towel", "Tricepsstretch med handduk bakom ryggen", "Triceps, axelns rotatorer", "25 s/sida",
    ["Håll en handduk bakom ryggen med ena handen ovanifrån och den andra nedifrån.", "Låt den nedre handen ge ett lätt drag så att övre armbågen pekar uppåt.", "Håll huvudet neutralt och byt arm utan att tvinga händerna närmare."],
    "triceps shoulders", "triceps", mod(standing, { a: [54, 27], a2: [48, 46], eb: 1, eb2: 1 }), undefined, { scene: [["line", 54, 27, 48, 46]] });
  add("triceps_supine", "Liggande tricepsstretch över huvudet", "Triceps långa huvud", "25 s/arm",
    ["Ligg på rygg med böjda knän och rikta ena överarmen mot taket.", "Böj armbågen och för handen mot golvet bakom huvudet med lätt stöd av andra handen.", "Håll revbenen nere och byt arm efter hålltiden."],
    "triceps", "triceps", mod(supine, { a: [8, 69], a2: [25, 59], f: [78, 95], eb: -1 }));
  add("biceps_wall", "Bicepsstretch med rak arm mot vägg", "Biceps, framsida axlar", "25 s/arm",
    ["Stå med sidan mot en vägg och lägg handflatan bakom dig i axelhöjd.", "Håll armbågen nästan rak och vrid kroppen lite bort från handen.", "Stanna vid mild sträckning längs överarmen och byt sida."],
    "biceps shoulders", "biceps", mod(standing, { a: [27, 25], a2: [62, 83] }), undefined, { scene: [["line", 26, 4, 26, 95]] });
  add("biceps_floor", "Sittande bicepsstretch med händer i golvet", "Biceps, framsida axlar, bröstmuskler", "25 s",
    ["Sitt med böjda knän och händerna i golvet bakom dig, fingrarna bort från kroppen.", "För sätet en liten bit framåt medan armarna förblir långa.", "Behåll bröstet öppet och avlasta händerna när du lämnar positionen."],
    "biceps shoulders chest", "biceps", { h: [49, 89], t: 192, a: [26, 95], f: [79, 95], kb: -1 } );
  add("wrist_flexor", "Handledsböjarstretch med rak arm", "Handledens böjmuskler, fingrarnas böjmuskler", "25 s/arm",
    ["Sträck ena armen framåt med handflatan uppåt och mjuk armbåge.", "Böj handleden bakåt med andra handen så att fingrarna pekar nedåt.", "Använd lätt tryck och byt arm efter hålltiden."],
    "forearms", "forearms", mod(standing, { a: [89, 26], a2: [88, 29], eb2: -1 }));
  add("wrist_extensor", "Handledssträckarstretch med rak arm", "Handledens sträckmuskler", "25 s/arm",
    ["Sträck ena armen framåt med handryggen uppåt.", "Böj handleden nedåt och ge handen ett lätt stöd med andra handen.", "Låt axeln vara sänkt och byt arm utan att dra hårt i fingrarna."],
    "forearms", "forearms", mod(standing, { a: [88, 34], a2: [87, 37], eb2: -1 }));
  add("prayer", "Handflator ihop framför bröstet", "Handledens och fingrarnas böjmuskler", "25 s",
    ["Pressa handflatorna lätt mot varandra framför bröstet med fingrarna uppåt.", "Sänk händerna långsamt medan handflatorna behåller kontakt.", "Stanna när det sträcker milt i underarmarna och andas lugnt."],
    "forearms", "forearms", mod(standing, { a: [71, 39], a2: [71, 40], eb: 1, eb2: -1 }));
  add("reverse_prayer_front", "Handryggar ihop framför bröstet", "Handledens sträckmuskler", "20 s",
    ["Håll handryggarna lätt mot varandra framför bröstet med fingrarna nedåt.", "Lyft händerna en liten bit medan kontakten behålls.", "Håll axlarna avslappnade och stanna vid mild sträckning."],
    "forearms", "forearms", mod(standing, { a: [72, 34], a2: [72, 35], eb: 1, eb2: -1 }));
  add("wrist_rock", "Handledsgungning på alla fyra", "Handledens böjmuskler, underarmar", "10",
    ["Stå på alla fyra med handflatorna i golvet och fingrarna framåt.", "För kroppen långsamt framåt så att handleden böjs mer.", "Gunga tillbaka och behåll hela handen i golvet med lätt belastning."],
    "forearms", "forearms", mod(four, { h: [38, 73], a: [72, 95] }), mod(four, { h: [48, 73], a: [72, 95] }));

  // Höfter och höftböjare.
  add("ninety_fold", "Framåtfällning över främre benet i 90/90", "Sätesmuskler, höftens utåtrotatorer", "30 s/sida",
    ["Sitt med ett böjt ben framför dig och det andra böjt ut åt sidan, båda knäna nära rät vinkel.", "Fäll överkroppen framåt över främre låret med händerna som stöd.", "Behåll sätets kontakt så långt det går och byt benställning."],
    "glutes hip_rotators", "glutes", { h: [49, 89], t: 142, a: [82, 94], a2: [65, 94], f: [72, 93], f2: [22, 94], kb: -1, kb2: 1 } );
  add("ninety_switch", "Sittande 90/90-växlingar", "Höftens inåtrotatorer och utåtrotatorer, säte", "8",
    ["Sitt med böjda knän och fötterna brett; stötta med händerna bakom dig.", "Låt båda knäna gå åt ena sidan tills benen närmar sig 90/90-läge.", "För knäna lugnt över till andra sidan utan att rycka i ytterläget."],
    "hip_rotators glutes", "glutes", { h: [48, 89], t: 194, a: [26, 94], f: [75, 94], f2: [31, 94], kb: -1, kb2: 1 }, { h: [48, 89], t: 194, a: [26, 94], f: [65, 94], f2: [20, 94], kb: 1, kb2: -1 } );
  add("seated_internal_rotation", "Sittande inåtrotation av höften", "Höftens utåtrotatorer, sätesmuskler", "8/ben",
    ["Sitt högt på en stol med knäna i rät vinkel och en hand som stöd vid låret.", "Behåll knät på samma plats och för foten långsamt utåt.", "Återgå till mitten utan att luta överkroppen och byt ben."],
    "hip_rotators glutes", "glutes", mod(seated, { a: [64, 65], f2: [60, 95] }), mod(seated, { a: [64, 65], f2: [86, 92] }), { scene: chair });
  add("gate_open", "Öppna och stäng höftgrinden", "Höftböjare, höftrotatorer, adduktorer", "8/ben",
    ["Stå bredvid en vägg med ena handen som stöd och lyft närmaste fria knät.", "För knät ut åt sidan och tillbaka framför kroppen i en lugn båge.", "Sätt ned foten mellan varven och byt ben efter serien."],
    "hip_flexors hip_rotators adductors", "glutes", mod(standing, { a: [101, 35], f2: [78, 70], kb2: -1 }), mod(standing, { a: [101, 35], f2: [40, 74], kb2: 1 }), { scene: wall });
  add("leg_swing_front", "Benpendling framåt och bakåt med stöd", "Höftböjare, baksida lår, säte", "10/ben",
    ["Håll i ett stadigt stöd och stå upprätt på ett ben.", "Pendla det andra benet lugnt framåt och bakåt utan att svanka.", "Öka rörelsen gradvis utan fart och byt stödben efter serien."],
    "hip_flexors hamstrings glutes", "hamstrings", mod(standing, { a: [101, 31], f2: [88, 78] }), mod(standing, { a: [101, 31], f2: [25, 82] }), { scene: wall });
  add("leg_swing_side", "Benpendling i sidled med väggstöd", "Höftens adduktorer, sätesmuskler", "10/ben",
    ["Stå vänd mot en vägg med båda händerna som stöd.", "För ett ben lugnt ut åt sidan och sedan in framför stödbenet.", "Håll bäckenet riktat mot väggen och byt ben efter serien."],
    "adductors glutes", "glutes", { h: [60, 54], a: [81, 25], leg: [[81, 69], [93, 85], [98, 85]] }, { h: [60, 54], a: [81, 25], leg: [[59, 73], [43, 90], [48, 90]] }, { view: "front" });
  add("quadruped_hip_circle", "Höftcirklar på alla fyra", "Höftens rotatorer, säte, höftböjare", "6/ben",
    ["Stå på alla fyra och håll ena knät böjt medan du lyfter det från golvet.", "Rita en liten långsam cirkel med knät utan att rotera bålen.", "Gör cirkeln åt båda håll och byt ben."],
    "hip_rotators glutes hip_flexors", "glutes", mod(four, { f2: [43, 78], kb2: 1 }), mod(four, { f2: [13, 76], kb2: 1 }));
  add("standing_hip_flexor", "Stående höftböjarstretch i delad stans", "Höftböjare, raka lårmuskeln", "30 s/sida",
    ["Ta ett långt steg bakåt och håll i en vägg för balans.", "Spänn bakre sidans säte och tippa bäckenet lätt bakåt.", "Böj främre knät lite tills det sträcker framtill på bakre höften; byt ben."],
    "hip_flexors quads", "quads", { h: [62, 60], t: 180, a: [101, 32], f: [81, 95], f2: [31, 95], kb: -1, kb2: 1 }, undefined, { scene: wall });
  add("bed_hip_flexor", "Höftböjarstretch över sängkant", "Höftböjare, raka lårmuskeln", "30 s/sida",
    ["Ligg på rygg nära kanten av en stadig säng med ena låret utanför.", "Håll motsatt knä mot bröstet och låt det fria benet sjunka lugnt nedåt.", "Behåll bäckenet stilla och byt ben utan att glida av kanten."],
    "hip_flexors quads", "quads", { h: [51, 65], t: 270, a: [43, 47], f: [81, 94], f2: [40, 47], kb: 1, kb2: 1 }, undefined, { scene: [["rect", 4, 68, 52, 5], ["line", 14, 73, 14, 95], ["line", 51, 73, 51, 95]] });
  add("halfkneel_reach", "Höftböjarstretch med räckning åt sidan", "Höftböjare, breda ryggmuskeln, sidan av bålen", "25 s/sida",
    ["Stå i halvt knästående och spänn sätet på sidan med knät i golvet.", "Lyft samma sidas arm och luta överkroppen lite bort från den bakre höften.", "Håll bäckenet lätt bakåttippat och byt sida utan att svanka."],
    "hip_flexors lats obliques", "quads", mod(kneel, { t: 191, a: [36, 15], a2: [72, 67] }));
  add("lizard", "Ödlans position med händer på klossar", "Höftböjare, adduktorer, sätesmuskler", "30 s/sida",
    ["Stå i ett långt utfall med bakre knät i golvet och främre foten utanför händerna.", "Lägg händerna på två stabila klossar och låt höften sjunka mjukt.", "Behåll främre knät i fotens riktning och byt sida efter hålltiden."],
    "hip_flexors adductors glutes", "quads", { h: [49, 74], t: 125, a: [78, 83], a2: [70, 83], f: [84, 95], f2: [12, 94], kb: -1, kb2: 1 }, undefined, { scene: [["rect", 73, 84, 11, 11], ["rect", 65, 84, 9, 11]] });
  add("prone_wipers", "Höftrotation i magliggande", "Höftens inåtrotatorer och utåtrotatorer", "8/sida",
    ["Ligg på magen med pannan på händerna och ena knät böjt i rät vinkel.", "För foten i en liten båge inåt och utåt medan låret ligger kvar.", "Håll bäckenet stilla och byt ben efter serien."],
    "hip_rotators", "glutes", mod(prone, { a: [82, 89], f: [45, 53], kb: 1 }), mod(prone, { a: [82, 89], f: [23, 58], kb: 1 }));
  add("supine_wipers", "Vindrutetorkare med böjda ben", "Höftens rotatorer, säte, sneda magmuskler", "8/sida",
    ["Ligg på rygg med böjda knän och fötterna lite bredare än höfterna.", "Låt knäna gå en kort bit åt ena sidan medan båda axlarna vilar kvar.", "För tillbaka till mitten och växla lugnt utan att pressa knäna mot golvet."],
    "hip_rotators glutes obliques", "glutes", mod(supine, { a: [32, 94], f: [74, 95], f2: [86, 94], kb: -1, kb2: -1 }), mod(supine, { a: [32, 94], f: [68, 94], f2: [80, 95], kb: 1, kb2: 1 }));

  // Säte: olika stöd och höftvinklar.
  add("figure_four_chair", "Sittande figur fyra på stol", "Stora sätesmuskeln, höftens utåtrotatorer", "30 s/sida",
    ["Sitt på en stadig stol och lägg ena fotleden ovanpå motsatt lår.", "Fäll lite framåt från höften med lång rygg och avslappnat knä.", "Stanna vid mild sträckning i sätet och byt sida."],
    "glutes hip_rotators", "glutes", mod(seated, { t: 162, a: [69, 65], f2: [66, 64], kb2: 1 }), undefined, { scene: chair });
  add("figure_four_stand", "Stående figur fyra med stöd", "Sätesmuskler, höftens utåtrotatorer", "25 s/sida",
    ["Håll i ett stadigt stöd och lägg ena fotleden ovanför motsatt knä.", "Böj stödbenet och för höften bakåt som när du sätter dig.", "Behåll ryggen lång och byt sida med hjälp av stödet."],
    "glutes hip_rotators", "glutes", { h: [57, 68], t: 156, a: [101, 37], f: [70, 95], f2: [66, 70], kb: -1, kb2: 1 }, undefined, { scene: wall });
  add("cross_knee", "Liggande knä mot motsatt axel", "Stora sätesmuskeln, höftens utåtrotatorer", "25 s/sida",
    ["Ligg på rygg med ena benet långt och det andra knät böjt.", "För det böjda knät försiktigt mot motsatt axel med händerna runt låret.", "Behåll bäckenet tungt mot golvet och byt ben."],
    "glutes hip_rotators", "glutes", mod(supine, { a: [40, 65], a2: [36, 66], f2: [40, 73], kb2: 1 }));
  add("stacked_shins", "Sittande stretch med staplade smalben", "Sätesmuskler, höftens utåtrotatorer", "25 s/sida",
    ["Sitt och placera ena smalbenet framför dig med det andra ovanpå, fotled över knä.", "Stötta det övre knät med en kudde vid behov och sitt högt.", "Fäll lite framåt utan att trycka på knäna; byt vilket ben som ligger överst."],
    "glutes hip_rotators", "glutes", { h: [43, 90], t: 165, a: [66, 92], f: [65, 94], f2: [66, 87], kb: -1, kb2: 1 } );
  add("bench_pigeon", "Sätesstretch med böjt ben på bänk", "Stora sätesmuskeln, höftens utåtrotatorer", "30 s/sida",
    ["Lägg ena underbenet böjt på en låg stadig bänk och behåll andra foten i golvet.", "Stöd händerna på bänken och fäll fram från höften över det böjda benet.", "Låt knät vara avslappnat och byt ben efter hålltiden."],
    "glutes hip_rotators", "glutes", { h: [62, 56], t: 144, a: [96, 65], a2: [85, 65], f: [55, 95], f2: [85, 65], kb: -1, kb2: -1 }, undefined, { scene: bench });

  // Insida lår och ljumskar.
  add("side_lunge_hold", "Sidoutfallsstretch med stöd", "Adduktorer, insida lår", "30 s/sida",
    ["Stå brett och håll händerna mot ett stabilt stöd framför dig.", "Böj ena knät och skjut höften åt samma håll medan andra benet hålls långt.", "Behåll båda fötterna i golvet och byt sida efter hålltiden."],
    "adductors", "quads", { h: [60, 71], a: [82, 43], leg: [[83, 79], [73, 95], [78, 95]], leg2: [[37, 83], [20, 95], [25, 95]] }, undefined, { view: "front", scene: [["rect", 37, 43, 50, 3], ["line", 39, 46, 39, 95], ["line", 85, 46, 85, 95]] });
  add("adductor_rock", "Adduktorgungning med ett ben åt sidan", "Höftens adduktorer", "10/sida",
    ["Stå på alla fyra och sträck ena benet åt sidan med foten i golvet.", "För sätet långsamt bakåt medan händerna stannar kvar.", "Gunga fram igen med lång rygg och byt ben efter serien."],
    "adductors", "exercise/adductor-stretch-dynamic-unilateral-4-point-position", mod(four, { f2: [78, 95], kb2: -1 }), mod(four, { h: [33, 78], t: 104, f2: [78, 95], kb2: -1 }));
  add("wide_seat_fold", "Framåtfällning i bred sittställning", "Adduktorer, baksida lår", "30 s",
    ["Sitt med benen brett isär och knäskålarna riktade uppåt.", "Gå framåt med händerna och fäll från höften med lång rygg.", "Stanna där du kan andas lugnt utan att trycka ned knäna."],
    "adductors hamstrings", "hamstrings", { h: [50, 89], t: 135, a: [81, 94], f: [88, 95], f2: [12, 95], kb: -1, kb2: 1 } );
  add("wall_straddle", "Bred benstretch mot vägg", "Adduktorer, baksida lår", "30 s",
    ["Ligg på rygg med sätet en bit från väggen och benen vilande upp längs den.", "Låt benen glida isär till ett bekvämt V utan att pressa med händerna.", "För ihop benen lugnt innan du rullar över på sidan."],
    "adductors hamstrings", "hamstrings", mod(supine, { a: [34, 94], f: [69, 53], f2: [36, 53], kb: 1, kb2: -1 }), undefined, { scene: [["line", 57, 35, 57, 95]] });
  add("supine_butterfly", "Liggande fjäril med stöd", "Adduktorer, höftens inåtrotatorer", "30 s",
    ["Ligg på rygg med fotsulorna ihop och knäna ut åt sidorna.", "Lägg kuddar under låren så att du kan slappna av.", "Låt benen vila utan att trycka på knäna och andas lugnt."],
    "adductors hip_rotators", "glutes", mod(supine, { a: [32, 94], f: [75, 94], f2: [75, 92], kb: 1, kb2: -1 }), undefined, { scene: [["rect", 58, 88, 13, 5]] });
  add("frog_rock", "Dynamisk grodgungning", "Höftens adduktorer", "10",
    ["Stå på knä med knäna brett isär och underarmarna i golvet.", "Gunga höften långsamt bakåt tills det sträcker milt i ljumskarna.", "Gunga fram igen utan att studsa eller öka avståndet mellan knäna."],
    "adductors", "quads", { h: [45, 71], s: [73, 81], a: [87, 95], f: [22, 94], kb: -1, eb: -1 }, { h: [34, 77], s: [62, 87], a: [84, 95], f: [22, 94], kb: -1, eb: -1 } );
  add("standing_straddle_hinge", "Bred stående höftfällning med stöd", "Adduktorer, baksida lår", "30 s",
    ["Stå med fötterna brett och händerna mot ett stadigt bord.", "För höften bakåt och fäll fram med lång rygg och mjuka knän.", "Behåll vikten över hela fötterna och låt insidan av låren sträckas milt."],
    "adductors hamstrings", "hamstrings", { h: [43, 58], t: 108, a: [96, 65], f: [63, 95], f2: [16, 95], kb: -1, kb2: 1 }, undefined, { scene: bench });

  // Framsida lår.
  add("quad_side", "Sidliggande framsida lårstretch", "Främre lårmusklerna, raka lårmuskeln", "30 s/sida",
    ["Ligg på sidan med det undre benet böjt och huvudet på den undre armen.", "Ta tag i övre fotleden och för hälen mot sätet med knät bakom höften.", "Spänn sätet lätt och håll bäckenet stilla; byt sida."],
    "quads hip_flexors", "quads", mod(supine, { a: [51, 87], a2: [4, 89], f: [79, 95], f2: [51, 87], kb: 1, kb2: -1 }));
  add("quad_prone", "Magliggande framsida lårstretch", "Främre lårmusklerna, raka lårmuskeln", "30 s/ben",
    ["Ligg på magen och böj ena knät med låret kvar i golvet.", "Ta tag i fotleden och för hälen försiktigt mot sätet.", "Behåll bäckenet tungt och byt ben utan att svanka."],
    "quads", "quads", mod(prone, { a: [59, 66], a2: [85, 93], f2: [59, 66], kb2: 1, eb: 1 }));
  add("couch", "Couchstretch med bakre fot på bänk", "Raka lårmuskeln, höftböjare", "30 s/sida",
    ["Stå i halvt knästående med det bakre knät på en mjuk matta nära en låg bänk.", "Lägg bakre fotryggen på bänken och spänn samma sidas säte.", "Res bröstet utan att svanka och byt ben efter en mild hållen stretch."],
    "quads hip_flexors", "quads", mod(kneel, { f2: [27, 63], kb2: 1 }), undefined, { scene: [["rect", 8, 63, 27, 4], ["line", 13, 67, 13, 95]] });
  add("quad_halfkneel_grasp", "Halvt knästående lårstretch med fotgrepp", "Raka lårmuskeln, höftböjare", "25 s/sida",
    ["Stå i halvt knästående och håll främre handen mot ett stöd.", "Böj bakre knät och håll fotleden med andra handen utan att vrida bålen.", "För hälen lite närmare sätet och behåll höften över knät; byt ben."],
    "quads hip_flexors", "quads", mod(kneel, { a: [101, 42], a2: [33, 65], f2: [33, 65], kb2: 1, eb2: 1 }), undefined, { scene: wall });

  // Baksida lår: olika belastning, stöd och aktiv knästräckning.
  add("hamstring_heel_chair", "Baksida lår med häl på stol", "Hamstrings, stora sätesmuskeln", "30 s/ben",
    ["Stå framför en stadig låg stol och lägg ena hälen på sitsen.", "Behåll en liten böjning i knät och fäll fram från höften med lång rygg.", "Håll bäckenet rakt fram och byt ben efter hålltiden."],
    "hamstrings glutes", "hamstrings", { h: [47, 54], t: 151, a: [75, 62], f: [46, 95], f2: [85, 65], kb: -1, kb2: -1 }, undefined, { scene: bench });
  add("hamstring_chair_seated", "Sittande enbensstretch på stol", "Hamstrings", "30 s/ben",
    ["Sitt på framkanten av en stadig stol och sträck ena benet med hälen i golvet.", "Fäll fram från höften med händerna på det böjda låret.", "Behåll lång rygg och byt ben utan att sträcka knät hårt."],
    "hamstrings", "hamstrings", mod(seated, { t: 151, a: [70, 69], f2: [86, 94], kb2: -1 }), undefined, { scene: chair });
  add("hamstring_hurdler", "Enbens framåtfällning med invikt fot", "Hamstrings, höftens utåtrotatorer", "30 s/sida",
    ["Sitt med ett ben långt fram och den andra fotsulan mot insidan av låret.", "Rikta bröstet mot det långa benet och fäll från höften.", "Stöd händerna där de når och byt ben utan att dra i foten."],
    "hamstrings hip_rotators", "hamstrings", mod(floorSit, { t: 133, a: [74, 92], f2: [51, 93], kb2: 1 }));
  add("hamstring_stagger", "Baksida lår i kort gångställning", "Hamstrings, stora sätesmuskeln", "25 s/ben",
    ["Stå med ena foten ett kort steg framför den andra och främre hälen tung.", "Böj bakre knät och för höften bakåt medan främre benet hålls långt.", "Fäll från höften med lång rygg och byt ben efter hålltiden."],
    "hamstrings glutes", "hamstrings", { h: [48, 61], t: 133, a: [76, 75], f: [78, 95], f2: [45, 95], kb: -1, kb2: -1 } );
  add("hamstring_scoops", "Gående skopsteg för baksida lår", "Hamstrings, vadmuskler", "8/ben",
    ["Ta ett kort steg med hälen framför kroppen och tårna lätt uppåt.", "Böj stödbenet och för höften bakåt medan händerna sveper mot framfoten.", "Res dig, ta ett nytt steg och växla ben utan att studsa."],
    "hamstrings calves", "hamstrings", { h: [49, 60], t: 123, a: [80, 88], f: [79, 95], f2: [45, 95], kb: -1 }, mod(standing, { a: [77, 57], f: [65, 95], f2: [43, 95] }));
  add("supine_knee_extension", "Aktiv knästräckning i ryggliggande", "Hamstrings", "10/ben",
    ["Ligg på rygg och håll om ena lårets baksida med höften böjd.", "Sträck knät långsamt så långt det går medan låret hålls stilla.", "Böj knät igen och byt ben efter serien; fotleden får vara avslappnad."],
    "hamstrings", "hamstrings", mod(supine, { a: [48, 66], f: [89, 95], f2: [72, 66], kb2: 1 }), mod(supine, { a: [48, 66], f: [89, 95], f2: [51, 50], kb2: 1 }));
  add("wall_hamstring", "Baksida lår med ett ben mot dörrkarm", "Hamstrings", "30 s/ben",
    ["Ligg på rygg i en dörröppning med ena hälen mot karmen och andra benet genom öppningen.", "Justera avståndet till karmen tills det sträcker milt i det upplyfta benet.", "Låt bäckenet vila i golvet och byt ben utan att skjuta dig närmare med kraft."],
    "hamstrings", "hamstrings", mod(supine, { a: [34, 94], f2: [54, 50], kb2: 1 }), undefined, { scene: [["line", 55, 34, 55, 83]] });

  // Vader, fotleder och fotens undersida.
  add("soleus_wall", "Vadstretch med böjt bakre knä", "Djupa vadmuskeln (soleus)", "30 s/ben",
    ["Stå med händerna mot väggen och ena foten ett kort steg bakåt.", "Böj båda knäna och för kroppen framåt med bakre hälen i golvet.", "Behåll foten riktad framåt och byt ben efter hålltiden."],
    "calves ankles", "calves", { h: [69, 65], t: 166, a: [101, 37], f: [86, 95], f2: [48, 95], kb: -1, kb2: -1 }, undefined, { scene: wall });
  add("calf_step_hold", "Hållen vadstretch på trappkant", "Ytliga vadmuskeln (gastrocnemius)", "30 s/ben",
    ["Stå med ena framfoten på en låg trappkant och håll i räcket.", "Låt hälen sjunka lugnt under kanten medan knät hålls nästan rakt.", "Avlasta med det andra benet när du kliver av och byt sida."],
    "calves ankles", "calves", mod(standing, { h: [62, 48], a: [101, 24], f: [64, 89], f2: [45, 86] }), undefined, { scene: [...wall, ["rect", 66, 91, 20, 4]] });
  add("calf_toe_wall", "Vadstretch med framfoten mot vägg", "Ytliga vadmuskeln, fotens böjmuskler", "30 s/ben",
    ["Sätt ena framfoten mot väggen med hälen kvar i golvet.", "Håll knät nästan rakt och luta kroppen lite mot väggen.", "Stanna vid en mild sträckning och byt fot efter hålltiden."],
    "calves ankles", "calves", { h: [77, 55], t: 169, a: [101, 26], f: [97, 94], f2: [60, 95], kb: -1 }, undefined, { scene: wall });
  add("calf_towel_seat", "Sittande vadstretch med handduk", "Ytliga vadmuskeln, fotens böjmuskler", "30 s/ben",
    ["Sitt med ena benet långt och lägg en handduk runt framfoten.", "Håll ryggen upprätt och för foten försiktigt mot dig med handduken.", "Behåll knät mjukt och byt ben utan att rycka i handduken."],
    "calves ankles", "calves", mod(floorSit, { a: [61, 70], a2: [62, 72], f2: [49, 94], kb2: 1 }), undefined, { scene: [["line", 61, 70, 79, 94], ["line", 62, 72, 79, 94]] });
  add("knee_wall", "Knä mot vägg för fotledsrörlighet", "Djupa vadmuskeln, fotledens böjmuskler", "10/ben",
    ["Stå nära väggen med ena foten rakt fram och hela hälen i golvet.", "För knät över andra tån mot väggen utan att hälen lyfter.", "För tillbaka knät och justera fotens avstånd så att rörelsen är kontrollerad."],
    "calves ankles", "calves", { h: [74, 62], t: 180, a: [101, 35], f: [95, 95], f2: [52, 95], kb: -1 }, { h: [81, 66], t: 173, a: [101, 35], f: [95, 95], f2: [52, 95], kb: -1 }, { scene: wall });
  add("ankle_circles", "Sittande fotledscirklar", "Underbenets fram-, bak- och sidomuskler", "8/riktning",
    ["Sitt på en stol och lyft ena foten lätt från golvet.", "Rita långsamma cirklar med foten medan knät hålls stilla.", "Byt riktning och sedan fot utan att låta hela benet rotera."],
    "ankles calves", "calves", mod(seated, { a: [63, 65], f2: [86, 80] }), mod(seated, { a: [63, 65], f2: [83, 87] }), { scene: chair });
  add("shin_kneel", "Fotryggsstretch i knäsittande", "Främre skenbensmuskeln, fotledens sträckmuskler", "20 s",
    ["Stå på knä med fotryggarna i golvet på en mjuk matta.", "Sänk sätet delvis mot hälarna och stöd händerna vid sidorna.", "Låt vikten vara lätt och lyft sätet när du lämnar positionen."],
    "ankles shins", "calves", { h: [44, 81], t: 180, a: [65, 94], f: [29, 95], kb: -1 } );
  add("toe_tuck", "Tåstretch i understött knäsittande", "Tårnas böjmuskler, fotens små muskler", "20 s",
    ["Stå på knä och vik in tårna så att tådynorna vilar mot mattan.", "För sätet lite bakåt medan händerna tar en del av kroppsvikten.", "Håll trycket lätt över tårna och avlasta innan du rätar ut fötterna."],
    "feet ankles", "calves", { h: [43, 77], t: 172, a: [67, 94], f: [33, 94], kb: -1 } );
  add("ankle_point_flex", "Sittande växling mellan spetsad och böjd fot", "Främre skenbensmuskeln, vadmuskler", "12/ben",
    ["Sitt på en stol och sträck ena benet så att foten är fri från golvet.", "Växla långsamt mellan att peka med tårna och att dra framfoten mot smalbenet.", "Håll knät stilla och byt ben efter serien."],
    "ankles calves shins", "calves", mod(seated, { a: [61, 65], f2: [85, 66] }), mod(seated, { a: [61, 65], f2: [87, 68] }), { scene: chair });
  add("dog_pedal", "Växelvis vadstretch i nedåtgående hund", "Vadmuskler, hamstrings, breda ryggmuskeln", "10/ben",
    ["Ställ dig med händer och fötter i golvet och höften högt.", "Böj ena knät medan motsatt häl får sjunka mot golvet.", "Växla långsamt utan att trampa eller pressa ned hälen."],
    "calves hamstrings lats", "calves", { h: [51, 56], s: [72, 77], a: [91, 95], f: [30, 95], f2: [43, 92], kb: -1, kb2: 1 }, { h: [51, 56], s: [72, 77], a: [91, 95], f: [43, 92], f2: [30, 95], kb: 1, kb2: -1 } );
  add("soleus_chair", "Sittande fotledsstretch med häl i golvet", "Djupa vadmuskeln (soleus)", "30 s/ben",
    ["Sitt på en stadig stol med ena foten nära under knät.", "För knät framåt över foten medan hälen och stortåbasen ligger kvar i golvet.", "Stanna vid mild sträckning i nedre vaden och byt ben."],
    "calves ankles", "calves", mod(seated, { t: 162, a: [72, 71], f: [67, 95], f2: [82, 95], kb: -1 }), undefined, { scene: chair });
  // Rotationen sker i en led/ett plan som figuren inte artikulerar separat.
  // Visa startpositionen i stället för att låta knäna röra sig som en annan övning.
  for (const code of ["ankle_circles","ankle_point_flex","seated_internal_rotation","prone_wipers","ninety_switch","supine_wipers"])
    delete EX["strx_"+code].B;
  EX.strx_prone_wipers.A = mod(prone,{a:[82,89],f:[25,70],kb:-1});
})();

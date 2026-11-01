"use strict";
// Självständigt skrivna teknikvarianter. Befintliga poster och illustrationer ändras inte.
// MuscleWiki-länkarna nedan leder till relevanta kategorier, inte verifierade variantsidor.
const EXTRA_VARIANT_IDS = [];
(() => {
  const rows = [
  [
    "bench_double_pause",
    "bankpress",
    "Bänkpress med dubbelt stopp",
    "double pause bench press",
    "bar",
    "exercises/chest/barbell",
    "6–8",
    [
      "Ligg stadigt på bänken med fötterna i golvet och greppa stången symmetriskt.",
      "Sänk kontrollerat, pausa kort halvvägs och pausa igen precis ovanför bröstet.",
      "Pressa stången uppåt utan att tappa skulderbladens stabila position."
    ]
  ],
  [
    "row_two_second_hold",
    "hantelrodd",
    "Hantelrodd med två sekunders stopp",
    "two second hold dumbbell row",
    "db",
    "exercises/lats/dumbbells",
    "8–12/arm",
    [
      "Stöd ena handen mot en stadig bänk och håll ryggen neutral.",
      "Dra hanteln mot höften och håll toppläget i två sekunder utan att vrida bålen.",
      "Sänk långsamt tills armen är utsträckt och upprepa på andra sidan."
    ]
  ],
  [
    "lateral_raise_top_hold",
    "sidolyft",
    "Sidolyft med paus i toppläget",
    "paused dumbbell lateral raise",
    "db",
    "exercises/shoulders/dumbbells",
    "10–15",
    [
      "Stå upprätt med lätta hantlar och lätt böjda armbågar.",
      "Lyft armarna utåt till ungefär axelhöjd och pausa en sekund.",
      "Sänk långsamt utan att gunga överkroppen."
    ]
  ],
  [
    "hammer_curl_eccentric",
    "hammercurl",
    "Hammercurl med långsam sänkning",
    "eccentric hammer curl",
    "db",
    "exercises/biceps/dumbbells",
    "8–12",
    [
      "Stå med hantlarna vid sidorna och handflatorna vända mot varandra.",
      "Böj armbågarna utan att föra dem framåt eller svinga kroppen.",
      "Sänk vikterna under cirka tre sekunder med handlederna neutrala."
    ]
  ],
  [
    "hip_thrust_top_hold",
    "hip_thrust",
    "Hip thrust med två sekunders stopp",
    "hip thrust top hold",
    "bar",
    "exercises/glutes/barbell",
    "8–12",
    [
      "Placera skulderbladen mot en stadig bänk och stå med fötterna stadigt i golvet.",
      "Pressa höften uppåt tills bålen och låren bildar en rak linje.",
      "Håll toppläget i två sekunder med spänd sätesmuskulatur och sänk kontrollerat."
    ]
  ],
  [
    "single_calf_pause",
    "enbens_tahavning",
    "Enbens tåhävning med paus",
    "single leg calf raise pause",
    "bw",
    "exercises/calves/bodyweight",
    "10–15/ben",
    [
      "Stå på ett ben med lätt stöd för balansen och håll knät nästan rakt.",
      "Pressa upp hälen så högt du kan utan att rulla foten utåt.",
      "Pausa en sekund på tå och sänk hälen långsamt innan du byter ben."
    ]
  ],
  [
    "dead_bug_hold",
    "dead_bug",
    "Dead bug med paus",
    "paused dead bug",
    "bw",
    "exercises/abdominals/bodyweight",
    "8–10/sida",
    [
      "Ligg på rygg med armarna uppåt och höfter och knän böjda i rät vinkel.",
      "Sträck motsatt arm och ben långsamt medan ländryggen hålls stabil mot underlaget.",
      "Pausa kort i utsträckt läge och återgå kontrollerat innan du växlar sida."
    ]
  ],
  [
    "lat_pulldown_pause",
    "latsdrag",
    "Latsdrag med paus vid bröstet",
    "paused lat pulldown",
    "machine",
    "exercises/lats/machine",
    "8–12",
    [
      "Sitt stabilt med låren under stödet och greppa stången bekvämt.",
      "Dra ned stången mot övre bröstet med armbågarna riktade nedåt.",
      "Pausa en sekund utan att luta dig kraftigt bakåt och släpp långsamt upp."
    ]
  ],
  [
    "squat_bottom_pause",
    "knaboj",
    "Knäböj med tre sekunders bottenpaus",
    "three second pause squat",
    "bar",
    "exercises/quads/barbell",
    "5–8",
    [
      "Placera stången stabilt på övre ryggen och ställ fötterna ungefär axelbrett.",
      "Böj höft och knän kontrollerat till ett djup du kan hålla med stabil rygg.",
      "Stanna tre sekunder utan att slappna av och res dig genom att pressa golvet bort från dig."
    ]
  ],
  [
    "glute_bridge_isometric",
    "glute_bridge",
    "Glute bridge med isometriskt stopp",
    "isometric glute bridge",
    "bw",
    "exercises/glutes/bodyweight",
    "10–15",
    [
      "Ligg på rygg med böjda knän och fötterna i golvet nära sätet.",
      "Pressa upp höften med hjälp av sätesmusklerna utan att översträcka ländryggen.",
      "Håll höften högt i tre sekunder och sänk kontrollerat."
    ]
  ]
];
  rows.push(...[["triceps_rope_pause","triceps_pushdown","Triceps pushdown med paus","paused triceps pushdown","cable","exercises/triceps/cables","10–15",["Stå stabilt med armbågarna intill kroppen.","Pressa handtaget nedåt och pausa en sekund.","Släpp långsamt upp utan att röra överarmarna."]],["biceps_curl_slow","bicepscurl","Bicepscurl med långsam sänkning","slow eccentric biceps curl","db","exercises/biceps/dumbbells","8–12",["Stå med hantlarna vid sidorna och armbågarna intill bålen.","Böj armarna utan att gunga överkroppen.","Sänk hantlarna kontrollerat under tre sekunder."]],["reverse_lunge_pause","utfall","Bakåtutfall med bottenpaus","paused reverse lunge","bw","exercises/quads/bodyweight","8–12/ben",["Stå höftbrett och ta ett steg bakåt.","Sänk bakre knät och pausa kort med främre foten i golvet.","Tryck genom främre foten och återgå till stående."]],["romanian_deadlift_tempo","rumansk_marklyft","Rumänska marklyft med långsam sänkning","tempo romanian deadlift","bar","exercises/hamstrings/barbell","8–10",["Stå med stången nära låren och lätt böjda knän.","För höften bakåt under tre sekunder med stången nära benen.","Res dig genom att sträcka höften utan att översträcka ryggen."]],["side_plank_reach","sidoplanka","Sidoplanka med armsträckning","side plank arm reach","bw","exercises/obliques/bodyweight","8–12/sida",["Ställ dig i sidoplanka med armbågen under axeln.","Sträck den fria armen mot taket med höften stabil.","För armen lugnt framåt och tillbaka utan att vrida bålen."]],["calf_raise_slow","tahavningar","Tåhävningar med långsam sänkning","eccentric calf raise","bw","exercises/calves/bodyweight","12–15",["Stå med parallella fötter och håll i ett stöd vid behov.","Res dig upp på tå med jämn belastning över framfoten.","Sänk hälarna kontrollerat under tre sekunder."]],["overhead_press_pause","militarpress","Militärpress med stopp vid pannan","paused overhead press","bar","exercises/shoulders/barbell","6–8",["Stå med stången framför axlarna och spänn bålen.","Pressa stången till pannhöjd och pausa kort.","Fortsätt till raka armar och sänk kontrollerat."]],["seated_press_neutral","sittande_axelpress","Sittande axelpress med neutralt grepp","neutral grip seated shoulder press","db","exercises/shoulders/dumbbells","8–12",["Sitt med ryggstöd och handflatorna mot varandra.","Pressa hantlarna uppåt utan att svanka.","Sänk kontrollerat till axelhöjd."]],["pushup_eccentric","armhavningar","Armhävningar med långsam sänkning","eccentric push up","bw","exercises/chest/bodyweight","6–12",["Placera händerna strax utanför axlarna och håll kroppen rak.","Sänk bröstet mot golvet under tre sekunder.","Pressa upp utan att låta höften sjunka."]],["chinup_top_hold","chins","Chins med paus över stången","chin up top hold","bw","exercises/biceps/bodyweight","5–8",["Häng med handflatorna mot dig och spänn bålen.","Dra dig upp tills hakan är över stången.","Håll en sekund och sänk långsamt utan att gunga."]],["pullup_eccentric","pullups","Pullups med långsam sänkning","eccentric pull up","bw","exercises/lats/bodyweight","5–8",["Häng med överhandsgrepp och aktiva axlar.","Dra dig upp tills hakan når stångens höjd.","Sänk kroppen kontrollerat under tre sekunder."]],["leg_press_pause","benpress","Benpress med paus i botten","paused leg press","machine","exercises/quads/machine","10–12",["Sitt med hela ryggen mot ryggstödet och fötterna på plattan.","Böj knäna till ett djup där bäckenet ligger kvar mot stödet.","Pausa kort och pressa tillbaka utan att låsa knäna hårt."]]]);
  rows.push(...[["incline_pushup_pause","armhavningar_bank","Lutande armhävning med bottenpaus","incline push up pause","bw","exercises/chest/bodyweight","8–15",["Placera händerna på en stabil bänk eller upphöjning.","Sänk bröstet långsamt och pausa kort nära bänken.","Pressa tillbaka med rak kropp och spänd bål."]],["dumbbell_fly_pause","hantelflyes","Hantelflyes med paus i botten","paused dumbbell chest fly","db","exercises/chest/dumbbells","10–12",["Ligg på en plan bänk med lätta hantlar över bröstet.","Öppna armarna kontrollerat med lätt böjda armbågar och pausa kort.","För ihop hantlarna ovanför bröstet utan att pressa ihop dem."]],["face_pull_pause","face_pulls","Face pulls med två sekunders stopp","face pull top hold","cable","exercises/shoulders/cables","12–15",["Ställ kabeln i ansiktshöjd och håll ett rep med båda händerna.","Dra repet mot ansiktet med armbågarna utåt och pausa två sekunder.","Återgå långsamt utan att skjuta fram huvudet."]],["lateral_raise_partial","sidolyft","Sidolyft med halva repetitioner","partial lateral raise","db","exercises/shoulders/dumbbells","12–20",["Stå stadigt med lätta hantlar vid sidorna.","Lyft armarna kontrollerat till ungefär halva axelhöjden.","Sänk långsamt och håll kroppen stilla under hela setet."]],["bent_over_reverse_fly_pause","omvanda_flyes","Omvända flyes med topplägespaus","paused reverse dumbbell fly","db","exercises/shoulders/dumbbells","10–15",["Fäll höften bakåt med neutral rygg och lätta hantlar under axlarna.","För armarna ut åt sidorna och pausa kort i toppläget.","Sänk kontrollerat utan att rycka med överkroppen."]],["seated_cable_row_pause","kabelrodd","Sittande kabelrodd med stopp","seated cable row pause","cable","exercises/lats/cables","8–12",["Sitt stabilt med lätt böjda knän och rak rygg.","Dra handtaget mot nedre revbenen och pausa en sekund.","Sträck långsamt fram armarna utan att runda ryggen."]],["split_squat_pause","bulgarisk_hantlar","Bulgariska utfall med bottenpaus","bulgarian split squat pause","db","exercises/quads/dumbbells","8–10/ben",["Placera bakre foten på en låg stabil bänk och håll hantlarna vid sidorna.","Sänk kroppen rakt ned och pausa kort med främre foten stadigt i golvet.","Res dig kontrollerat och byt ben efter setet."]],["hamstring_curl_pause","bencurl","Liggande lårcurl med topplägespaus","lying leg curl pause","machine","exercises/hamstrings/machine","10–15",["Ligg stabilt i maskinen med knäna i linje med ledaxeln.","Böj knäna och pausa en sekund när hälarna närmar sig sätet.","Sänk långsamt utan att lyfta höften från dynan."]],["leg_extension_slow","benspark","Benspark med långsam sänkning","slow eccentric leg extension","machine","exercises/quads/machine","10–15",["Ställ in maskinen så att knäna följer ledaxeln och dynan vilar över underbenen.","Sträck knäna kontrollerat utan att kasta upp vikten.","Sänk under tre sekunder till bekvämt böjt läge."]],["plank_shoulder_tap","plankan","Planka med axelklapp","plank shoulder taps","bw","exercises/abdominals/bodyweight","10–16/sida",["Stå i hög planka med händerna under axlarna och fötterna något isär.","Lyft ena handen och nudda motsatt axel utan att vrida höften.","Sätt ned handen lugnt och växla sida."]]]);
  rows.push(...[["floor_press_pause","golvpress","Golvpress med armbågspaus","paused dumbbell floor press","db","exercises/chest/dumbbells","8–12",["Ligg på golvet med böjda knän och hantlarna ovanför bröstet.","Sänk överarmarna tills de nuddar golvet och pausa en sekund.","Pressa upp utan att studsa armbågarna mot underlaget."]],["single_cable_row_pause","enarms_kabelrodd","Enarms kabelrodd med topplägespaus","single arm cable row pause","cable","exercises/lats/cables","10–12/arm",["Stå eller sitt stabilt framför kabeln med armen utsträckt.","Dra handtaget mot höften och pausa en sekund utan att vrida bålen.","Släpp fram armen kontrollerat och byt sida."]],["arnold_press_tempo","arnoldpress","Arnoldpress med långsam sänkning","tempo arnold press","db","exercises/shoulders/dumbbells","8–12",["Sitt stadigt med hantlarna framför axlarna och handflatorna mot ansiktet.","Pressa upp och rotera handflatorna framåt under rörelsen.","Sänk långsamt tillbaka till startläget utan att svanka."]],["front_raise_hold","framlyft","Framlyft med paus i axelhöjd","front raise hold","db","exercises/shoulders/dumbbells","10–15",["Stå med lätta hantlar framför låren och spänn bålen.","Lyft armarna framför kroppen till axelhöjd och pausa en sekund.","Sänk kontrollerat utan att gunga med ryggen."]],["shrug_hold","shrugs","Shrugs med två sekunders toppstopp","dumbbell shrug hold","db","exercises/traps/dumbbells","10–15",["Stå upprätt med hantlarna vid sidorna och avslappnade armar.","Lyft axlarna rakt upp utan att rulla dem och pausa två sekunder.","Sänk långsamt tills axlarna är neutrala."]],["upright_row_light","upprakt_rodd","Upprätt rodd med begränsat lyft","upright row partial","db","exercises/shoulders/dumbbells","10–12",["Stå med lätta hantlar framför låren och neutrala handleder.","Dra armbågarna utåt och upp till en bekväm höjd under axlarna.","Sänk långsamt och avbryt om axeln känns obekväm."]],["sumo_deadlift_pause","sumomarklyft","Sumomarklyft med paus under knät","paused sumo deadlift","bar","exercises/glutes/barbell","5–8",["Stå brett med tårna lätt utåt och greppa stången mellan knäna.","Lyft stången nära kroppen och pausa kort strax under knähöjd.","Sträck höft och knän för att stå upp och sänk kontrollerat."]],["nordic_assisted","nordic","Nordic hamstring med lätt assistans","assisted nordic hamstring curl","bw","exercises/hamstrings/bodyweight","4–8",["Stå på knä med underbenen säkert förankrade och kroppen rak.","Fäll långsamt framåt från knäna och ta emot dig med händerna vid behov.","Hjälp till med armarna för att återgå till startläget."]],["ab_rollout_pause","magrulle","Magrulle med kort stopp","paused ab rollout","bw","exercises/abdominals/bodyweight","6–10",["Stå på knä med händerna på magrullen och spänn bålen.","Rulla fram till ett läge där ryggen hålls neutral och pausa kort.","Rulla tillbaka utan att låta ländryggen svanka."]],["bird_dog_pause","bird_dog","Bird dog med tre sekunders paus","bird dog hold","bw","exercises/abdominals/bodyweight","8–10/sida",["Stå på alla fyra med händerna under axlarna och knäna under höften.","Sträck motsatt arm och ben utan att vrida bäckenet och håll i tre sekunder.","Återgå långsamt och växla sida."]],["hollow_hold_short","hollow_hold","Hollow hold med böjda knän","tucked hollow body hold","bw","exercises/abdominals/bodyweight","20–30 s",["Ligg på rygg med armarna framför kroppen och böjda höfter och knän.","Lyft skulderbladen lätt och håll ländryggen stabil mot underlaget.","Behåll positionen med lugn andning och sänk när kontrollen avtar."]],["concentration_curl_pause","koncentrationscurl","Koncentrationscurl med topplägespaus","paused concentration curl","db","exercises/biceps/dumbbells","10–12/arm",["Sitt med armbågen stödd mot insidan av låret och håll en hantel.","Böj armen utan att lyfta armbågen från låret och pausa en sekund.","Sänk långsamt till nästan rak arm och byt sida."]]]);
  rows.push(...[["machine_chest_press_pause","brostpress_maskin","Bröstpress i maskin med paus","machine chest press pause","machine","exercises/chest/machine","8–12",["Justera sitsen så att handtagen är i brösthöjd.","Pressa fram handtagen och pausa en sekund med nästan raka armar.","Sänk långsamt utan att lyfta axlarna."]],["cable_fly_slow","kabelflyes","Kabelflyes med långsam återgång","slow eccentric cable fly","cable","exercises/chest/cables","10–15",["Ställ kablarna i lämplig höjd och ta ett stabilt steg framåt.","För händerna samman framför bröstet med lätt böjda armbågar.","Öppna armarna långsamt under tre sekunder."]],["lat_pulldown_eccentric","latsdrag","Latsdrag med långsam återgång","eccentric lat pulldown","machine","exercises/lats/machine","8–12",["Sitt stadigt med låren under stödet och greppa stången.","Dra stången mot övre bröstet utan att kasta bak överkroppen.","Släpp upp stången kontrollerat under tre sekunder."]],["dumbbell_row_eccentric","hantelrodd","Hantelrodd med långsam sänkning","eccentric dumbbell row","db","exercises/lats/dumbbells","8–12/arm",["Stöd ena handen mot en stabil bänk och håll ryggen neutral.","Dra hanteln mot höften utan att vrida överkroppen.","Sänk långsamt under tre sekunder och byt arm."]],["hammer_curl_top_hold","hammercurl","Hammercurl med topplägespaus","hammer curl top hold","db","exercises/biceps/dumbbells","8–12",["Stå med hantlarna vid sidorna och handflatorna vända mot varandra.","Böj armarna utan att flytta överarmarna och pausa en sekund.","Sänk kontrollerat utan att gunga."]],["triceps_pushdown_eccentric","triceps_pushdown","Triceps pushdown med långsam återgång","eccentric triceps pushdown","cable","exercises/triceps/cables","10–15",["Stå stadigt med armbågarna nära kroppen.","Sträck armarna nedåt utan att skjuta fram axlarna.","Låt vikten återgå långsamt under tre sekunder."]],["hip_thrust_eccentric","hip_thrust","Hip thrust med långsam sänkning","eccentric hip thrust","bar","exercises/glutes/barbell","8–12",["Placera övre ryggen mot en stabil bänk och fötterna stadigt i golvet.","Pressa höften upp tills bålen och låren bildar en rak linje.","Sänk höften kontrollerat under tre sekunder."]],["glute_bridge_march","glute_bridge","Glute bridge med växelvis benlyft","glute bridge march","bw","exercises/glutes/bodyweight","8–12/ben",["Ligg på rygg med knäna böjda och fötterna i golvet.","Lyft höften och för ett knä uppåt utan att vrida bäckenet.","Sätt ned foten och växla ben med höften fortsatt stabil."]],["squat_eccentric","knaboj","Knäböj med långsam sänkning","eccentric barbell squat","bar","exercises/quads/barbell","6–10",["Stå med stången stabilt på ryggen och fötterna ungefär axelbrett.","Böj höft och knän under tre sekunder till ett kontrollerat djup.","Res dig med jämnt tryck genom fötterna."]],["leg_curl_eccentric","bencurl","Lårcurl med långsam sänkning","eccentric leg curl","machine","exercises/hamstrings/machine","10–15",["Ställ in maskinen så att knäleden följer dess rotationsaxel.","Böj knäna kontrollerat utan att lyfta höften från stödet.","Sänk vikten under tre sekunder."]],["calf_press_pause","vadpress","Vadpress med paus på tå","calf press top hold","machine","exercises/calves/machine","10–15",["Placera framfötterna stadigt på plattan med hälarna fria.","Pressa upp på tå och pausa två sekunder utan att rulla fötterna.","Sänk långsamt till en bekväm stretch."]],["side_plank_top_leg","sidoplanka","Sidoplanka med övre benlyft","side plank top leg raise","bw","exercises/obliques/bodyweight","8–12/sida",["Ställ dig i sidoplanka med stöd på underarmen och höften lyft.","Lyft övre benet en kort bit utan att vrida bäckenet.","Sänk benet kontrollerat och byt sida efter setet."]],["dead_bug_heel_tap","dead_bug","Dead bug med hälisättning","dead bug heel taps","bw","exercises/abdominals/bodyweight","10–16/sida",["Ligg på rygg med höfter och knän böjda i rät vinkel.","Sänk ena hälen mot golvet utan att svanka i ländryggen.","För tillbaka benet och växla sida."]],["superman_pause","superman","Superman med topplägespaus","superman top hold","bw","exercises/lowerback/bodyweight","8–12",["Ligg på mage med armarna framåt och blicken ned i golvet.","Lyft armar och ben en liten bit och pausa två sekunder.","Sänk långsamt utan att kasta upp huvudet."]]]);
  for (const [code, baseId, name, english, gear, source, reps, cues] of rows) {
    const id = "vtx_" + code, base = EX[baseId];
    if (!base || EX[id]) throw new Error("Ogiltig eller dubblerad övningsvariant: " + id);
    EX[id] = { ...base, name, aliases: [english], gear, bw: gear === "bw",
      sets: 3, reps, cues, prim: [...(base.prim || [])], sec: [...(base.sec || [])],
      hold: gear === "bar" ? "bar" : gear === "db" ? "db" : null,
      cable: null, plate: null, pad: false };
    // Behåll rörelsefamiljens streckfigur, men ärv inte fel utrustningsrekvisita.
    // Paustid, grepp och tempo förklaras i texten, inte genom påhittade poser.
    MW[id] = source;
    const area = areaOf(baseId);
    AREA_IDS[area] = ((AREA_IDS[area] || "") + " " + id).trim();
    EXTRA_VARIANT_IDS.push(id);
  }
})();

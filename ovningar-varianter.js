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

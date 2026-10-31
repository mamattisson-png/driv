"use strict";
// ---------- Stretchguiden ----------
// Områden på kroppen, fler övningar och en kroppskarta man trycker på. Varje övning kan läggas till
// i Dailys eller i ett pass. Laddas efter stretch-extra.js; vyn ritas av app.js (VIEWS.stretchguide).

// Tio områden, var och ett med de mål (stretchTargets) som räknas dit
const STRETCH_AREAS = {
  neck: ["Nacke", "neck"],
  shoulders: ["Axlar", "shoulders"],
  chest: ["Bröst", "chest"],
  upper_back: ["Övre rygg", "lats thoracic_back upper_back"],
  lower_back: ["Ländrygg & bål", "lower_back obliques"],
  arms: ["Armar", "biceps triceps forearms"],
  hips: ["Höfter & säte", "glutes hip_rotators hip_flexors adductors"],
  quads: ["Framsida lår", "quads hip_flexors"],
  hamstrings: ["Baksida lår", "hamstrings"],
  calves: ["Vader & fötter", "calves ankles shins feet"],
};
const stretchTargetsOf = id => EX[id].stretchTargets || [];
const stretchInArea = (id, a) => stretchTargetsOf(id).some(t => STRETCH_AREAS[a][1].split(" ").includes(t));

(() => {
  // De ursprungliga stretchövningarna saknade mål; nu hittas de i rätt område
  const base = {
    framatfallning: "hamstrings lower_back calves", hoftbojare_stretch: "hip_flexors quads", framsida_lar_stretch: "quads hip_flexors",
    vadstretch: "calves ankles", duvan: "glutes hip_rotators", barnets_position: "lower_back lats", katt_ko: "lower_back thoracic_back",
    brost_dorr: "chest shoulders", triceps_stretch: "triceps shoulders", sittande_framatfallning: "hamstrings lower_back", fjarilen: "adductors",
    kobran: "lower_back hip_flexors", dodhang: "lats shoulders forearms", nedatgaende_hund: "hamstrings calves lats shoulders",
    varldens_basta: "hip_flexors hamstrings thoracic_back", djup_knaboj: "adductors ankles glutes", halv_split: "hamstrings",
    kna_mot_brost: "lower_back glutes", liggande_hamstring: "hamstrings", figur_fyra: "glutes hip_rotators",
    sittande_vridning: "thoracic_back obliques lower_back", trad_nalen: "thoracic_back shoulders", arm_over_brost: "shoulders upper_back",
    latsstretch_bank: "lats triceps", grodan: "adductors", hander_bakom_ryggen: "chest shoulders biceps",
  };
  for (const [id, t] of Object.entries(base)) if (EX[id] && !EX[id].stretchTargets) EX[id].stretchTargets = t.split(" ");

  // Fler övningar. Figuren lånas från en övning med samma ställning.
  const more = [
    ["supine_twist", "kna_mot_brost", "Liggande vridning med böjda knän", "Ländryggen, sneda magmuskler, säte", "30 s/sida", "lower_back obliques glutes", "lowerback",
      ["Ligg på rygg med böjda knän och armarna ut åt sidorna.", "Låt knäna sjunka åt ena sidan medan skuldrorna ligger kvar i golvet.", "Andas lugnt, för tillbaka knäna och byt sida."]],
    ["sphinx", "kobran", "Sfinxen", "Ländryggen, magmuskler, höftböjare", "30 s", "lower_back hip_flexors", "lowerback",
      ["Ligg på mage med armbågarna under axlarna.", "Lyft bröstet lätt och låt höften ligga kvar mot golvet.", "Håll axlarna låga och nacken lång."]],
    ["single_knee", "kna_mot_brost", "Ett knä mot bröstet", "Ländryggen, sätesmuskler", "30 s/ben", "lower_back glutes", "lowerback",
      ["Ligg på rygg med båda benen raka.", "Dra ena knät mot bröstet med händerna runt smalbenet.", "Låt andra benet vila och byt efter tiden."]],
    ["pelvic_tilt", "kna_mot_brost", "Bäckentippning i ryggliggande", "Ländryggen, djupa magmuskler", "10", "lower_back", "lowerback",
      ["Ligg på rygg med böjda knän och fötterna i golvet.", "Platta till svanken mot golvet genom att tippa bäckenet bakåt.", "Släpp tillbaka till neutralt läge och upprepa lugnt."]],
    ["happy_baby", "kna_mot_brost", "Glada bebisen", "Höftens rotatorer, insida lår, ländrygg", "30 s", "hip_rotators adductors lower_back", "glutes",
      ["Ligg på rygg och dra knäna mot armhålorna.", "Fatta tag om fötternas utsidor med fotsulorna mot taket.", "Låt svanskotan sjunka mot golvet och vagga lätt."]],
    ["chin_tuck", "strx_neck_turn", "Hakindrag", "Djupa nackmuskler, nackens baksida", "10", "neck", "traps",
      ["Stå eller sitt upprätt med blicken framåt.", "Dra hakan rakt bakåt som för att göra en dubbelhaka.", "Håll två sekunder och släpp utan att böja nacken framåt."]],
    ["couch", "hoftbojare_stretch", "Soffstretch mot vägg", "Höftböjare, framsida lår", "30 s/ben", "hip_flexors quads", "quads",
      ["Placera bakre knät nära en vägg med fotryggen mot väggen.", "Ställ främre foten i golvet och res överkroppen.", "Spänn sätet på bakre sidan och byt ben."]],
    ["side_lunge", "djup_knaboj", "Sidoutfall med paus", "Insida lår, baksida lår", "6/sida", "adductors hamstrings", "glutes",
      ["Stå brett med tårna lätt utåt.", "Böj ena knät och skjut höften bakåt medan andra benet är rakt.", "Pausa, res dig och växla sida."]],
    ["lying_butterfly", "fjarilen", "Liggande fjäril", "Insida lår, höftens rotatorer", "40 s", "adductors hip_rotators", "glutes",
      ["Ligg på rygg och sätt fotsulorna mot varandra.", "Låt knäna falla ut mot sidorna utan att trycka.", "Lägg gärna kuddar under knäna för stöd."]],
    ["heel_on_step", "framatfallning", "Baksida lår med hälen på pall", "Baksida lår, vader", "30 s/ben", "hamstrings calves", "hamstrings",
      ["Placera ena hälen på en låg pall med rakt ben.", "Fäll fram från höften med rak rygg.", "Stanna vid en mild sträckning och byt ben."]],
    ["doorway_hamstring", "liggande_hamstring", "Baksida lår i dörröppning", "Baksida lår", "45 s/ben", "hamstrings", "hamstrings",
      ["Ligg på rygg i en dörröppning med ena benet uppför karmen.", "Låt andra benet ligga rakt på golvet.", "Flytta dig närmare karmen för mer sträckning, sedan byt ben."]],
    ["side_quad", "framsida_lar_stretch", "Sidoliggande framsida lår", "Framsida lår, höftböjare", "30 s/ben", "quads hip_flexors", "quads",
      ["Ligg på sidan med huvudet vilande på armen.", "Fatta tag om översta fotleden och för hälen mot sätet.", "Skjut höften lätt framåt och byt sida."]],
    ["step_calf", "vadstretch", "Vadstretch på trappsteg", "Vadmuskler, hälsena", "30 s/ben", "calves ankles", "calves",
      ["Stå med framfoten på ett trappsteg och håll i räcket.", "Låt ena hälen sjunka under stegets kant.", "Håll lugnt och byt ben."]],
    ["toe_wall", "vadstretch", "Tåstretch mot vägg", "Fotsula, tårnas böjmuskler, vader", "30 s/fot", "feet calves", "calves",
      ["Stå vänd mot en vägg och sätt tårna mot väggen med hälen i golvet.", "Luta dig försiktigt framåt tills fotsulan känns.", "Byt fot efter tiden."]],
    ["forearm_wall", "strx_wrist_flexor", "Underarmsstretch mot vägg", "Underarmar, handledens böjmuskler", "25 s/arm", "forearms", "forearms",
      ["Placera handflatan mot väggen med fingrarna nedåt.", "Håll armen rak och vrid kroppen lätt bort från väggen.", "Stanna vid en mild sträckning och byt arm."]],
    ["door_hang", "dodhang", "Lätt häng i dörrkarm", "Breda ryggmuskeln, axlar", "20 s", "lats shoulders", "lats",
      ["Fatta tag om en stadig dörrkarm eller stång med raka armar.", "Böj knäna och låt en del av vikten hänga.", "Andas lugnt och res dig efter tiden."]],
  ];
  for (const [code, from, name, muscles, reps, targets, list, cues] of more) {
    const id = "strg_" + code, src = EX[from];
    if (!src || EX[id]) continue;
    EX[id] = { name, cat: "stretch", bw: true, muscles, sets: 2, reps, cues, stretchTargets: targets.split(" "), A: src.A };
    for (const k of ["B", "scene", "view"]) if (src[k]) EX[id][k] = src[k];
    if (typeof MW !== "undefined") MW[id] = `exercises/${list}/stretches`;
    if (typeof AREA_IDS !== "undefined" && AREA_IDS.stretch && !AREA_IDS.stretch.includes(id)) AREA_IDS.stretch += " " + id;
  }
})();

// Kroppskartan: anatomiska muskler fram och bak. Polygonerna kommer från react-body-highlighter
// (MIT-licens, Copyright (c) 2020 GV79, https://github.com/giavinh79/react-body-highlighter), grupperade per område.
// Huvud och knän ("") är bara bakgrund; övriga muskler går att trycka på.
const BODY_POLYS = {"front":{"chest":["51.8 41.6 51 55.1 58 58 67.8 55.5 70.6 47.3 62 41.6","29.8 46.5 31.4 55.5 40.8 58 48.2 55.1 47.8 42 37.6 42"],"lower_back":["68.6 63.3 67.3 57.1 58.8 59.6 60 64.1 60.4 83.3 65.7 78.8 66.5 69.8","33.9 78.4 33.1 71.8 31 63.3 32.2 57.1 40.8 59.2 39.2 63.3 39.2 83.7","56.3 59.2 58 64.1 58.4 78 58.4 92.7 56.3 98.4 55.1 104.1 51.4 107.8 51 84.5 50.6 67.3 51 57.1","43.7 58.8 48.6 57.1 49 67.3 48.6 84.5 48.2 107.3 44.5 103.7 40.8 91.4 40.8 78.4 41.2 64.5"],"arms":["16.7 68.2 18 71.4 22.9 66.1 29 53.9 27.8 49.4 20.4 55.9","71.4 49.4 70.2 54.7 76.3 66.1 81.6 71.8 82.9 69 78.8 55.5","69.4 55.5 69.4 61.6 75.9 72.7 77.6 70.2 75.5 67.3","22.4 69.4 29.8 55.5 29.8 60.8 22.9 73.1","6.1 88.6 10.2 75.1 14.7 70.2 16.3 74.3 19.2 73.5 4.5 97.6 0 100","84.5 69.8 83.3 73.5 80 73.1 95.1 98.4 100 100.4 93.5 89.4 89.8 76.3","77.6 72.2 77.6 77.6 80.4 84.1 85.3 89.8 92.2 101.2 94.7 99.6","6.9 101.2 13.5 90.6 18.8 84.1 21.6 77.1 21.2 71.8 4.9 98.8"],"neck":["55.5 23.7 50.6 33.5 50.6 39.2 61.6 40 70.6 44.9 69.4 36.7 63.3 35.1 58.4 30.6","29 44.9 30.2 37.1 36.3 35.1 41.2 30.2 44.5 24.5 49 33.9 48.6 39.2 38 39.6"],"shoulders":["78.4 53.1 79.6 47.8 79.2 41.2 75.9 38 71 36.3 72.2 42.9 71.4 47.3","28.2 47.3 21.2 53.1 20 47.8 20.4 40.8 24.5 37.1 28.6 37.1 26.9 43.3"],"":["42.4 2.9 40 11.8 42 19.6 46.1 23.3 49.8 25.3 54.7 22.4 57.6 19.2 59.2 10.2 57.1 2.4 49.8 0","33.9 140 34.7 143.3 35.5 147.3 36.3 151 35.1 156.7 29.8 156.7 27.3 152.7 27.3 147.3 30.2 144.1","65.7 140 72.2 147.8 72.2 152.2 69.8 157.1 64.9 156.7 62.9 151"],"hips":["52.7 110.2 54.3 124.9 60 110.2 62 100 64.9 94.3 60 92.7 56.7 104.5","47.8 110.6 44.9 125.3 42 115.9 40.4 113.1 39.6 107.3 38 102.4 34.7 93.9 39.6 92.2 41.6 99.2 43.7 105.3"],"quads":["34.7 98.8 37.1 108.2 37.1 127.8 34.3 137.1 31 132.7 29.4 120 28.2 111.4 29.4 100.8 32.2 94.7","63.3 105.7 64.5 100 66.9 94.7 70.2 101.2 71 111.8 68.2 133.1 65.3 137.6 62.4 128.6 62 111.4","38.8 129.4 38.4 112.2 41.2 118.4 44.5 129.4 42.9 135.1 40 146.1 36.3 146.5 35.5 140","59.6 145.7 55.5 129 60.8 113.9 61.2 130.2 64.1 139.6 62.9 146.5","32.7 138.4 26.5 145.7 25.7 136.7 25.7 127.3 26.9 114.3 29.4 133.5","71.8 113.1 73.9 124.1 73.9 140.4 72.7 145.7 66.5 138.4 70.2 133.5"],"calves":["71.4 160.4 73.5 153.5 76.7 161.2 79.6 167.8 78.4 187.8 79.6 195.5 74.7 195.5","24.9 194.7 27.8 164.9 28.2 160.4 26.1 154.3 24.9 157.6 22.4 161.6 20.8 167.8 22 188.2 20.8 195.5","72.7 195.1 69.8 159.2 65.3 158.4 64.1 162.4 64.1 165.3 65.7 177.1","35.5 158.4 35.9 162.4 35.9 166.9 35.1 172.2 35.1 176.7 32.2 182 30.6 187.3 26.9 194.7 27.3 187.8 28.2 180.4 28.6 175.5 29 169.8 29.8 164.1 30.2 158.8"]},"back":{"":["50.6 0 46 0.9 40.9 5.5 40.4 12.8 45.1 20 55.7 20 59.1 13.6 59.6 4.7 55.7 1.3","34.5 153.2 31.1 159.1 33.6 166.4 37.4 162.6","66.4 153.6 63 163 66.8 166.4 69.4 159.1"],"upper_back":["44.7 21.7 47.7 21.7 47.2 38.3 47.7 64.7 38.3 53.2 35.3 40.9 31.1 36.6 39.1 33.2 43.8 27.2","52.3 21.7 55.7 21.7 56.6 27.2 60.9 32.8 68.9 36.6 64.7 40.4 61.7 53.2 52.3 64.7 53.2 38.3","31.1 38.7 28.1 48.9 28.5 55.3 34 75.3 47.2 71.1 47.2 66.4 36.6 54 33.6 41.3","68.9 38.7 71.9 49.4 71.5 56.2 66 75.3 52.8 71.1 52.8 66.4 63.4 54.5 66.4 41.7"],"shoulders":["29.4 37 23 39.1 17.4 44.3 18.3 53.6 24.3 49.4 27.2 46.4","71.1 37 78.3 39.6 82.6 44.7 81.7 53.6 74.9 48.9 72.3 45.1"],"arms":["26.8 49.8 17.9 55.7 14.5 72.3 16.6 81.7 21.7 63.8 26.8 55.7","73.6 50.2 82.1 55.7 86 73.2 83.4 82.1 77.9 63 73.2 55.7","26.8 58.3 26.8 68.5 23 75.3 19.1 77.4 22.6 65.5","72.8 58.3 77 64.7 80.4 77.4 76.6 75.3 72.8 68.9","86.4 75.7 91.1 83.4 93.2 94 100 106.4 96.2 104.3 88.1 89.4 84.3 83.8","13.6 75.7 8.9 83.8 6.8 93.6 0 106.4 3.8 104.3 12.3 88.5 15.7 83","81.3 79.6 77.4 77.9 79.1 84.7 91.1 103.8 93.2 108.9 94.5 104.7","18.7 79.6 22.1 77.9 20.9 84.3 9.4 103 6.8 108.5 5.1 104.7"],"lower_back":["47.7 72.8 34.5 77 35.3 83.4 49.4 102.1 46.8 83","52.3 72.8 65.5 77 64.7 83.4 50.6 102.1 53.2 83.8"],"hips":["44.7 99.6 30.2 108.5 29.8 118.7 31.5 126 47.2 121.3 49.4 114.9","55.3 99.1 51.1 114.5 52.3 120.9 68.1 126 69.8 119.1 69.4 108.5","48.1 123 44.7 123 41.3 125.5 45.1 144.3 48.5 135.7 48.9 129.4","51.9 122.6 55.7 123.4 59.1 126 54.9 144.3 51.9 136.2 51.1 129.4"],"hamstrings":["28.9 122.1 31.1 129.4 36.6 126 35.3 135.3 34.5 150.2 29.4 158.3 28.9 146.8 27.7 141.3 27.2 131.5","71.5 121.7 69.4 128.9 63.8 126 65.5 136.6 66.4 150.2 71.1 158.3 71.5 147.7 72.8 142.1 73.6 131.9","38.7 125.5 44.3 146 40.4 166.8 36.2 152.8 37 135.3","61.7 125.5 63.4 136.2 64.3 153.2 60 166.8 56.2 146.4"],"calves":["29.4 160.4 28.5 167.2 24.7 179.6 23.8 192.8 25.5 197 28.5 193.2 29.8 180 31.9 171.1 31.9 166.8","37.4 165.1 35.3 167.7 33.2 171.9 31.1 180.4 30.2 191.9 34 200 38.7 190.6 39.1 168.9","63 165.1 61.3 168.5 61.7 190.6 66.4 199.6 70.6 191.9 68.9 179.6 66.8 170.2","70.6 160.4 72.3 168.5 75.7 179.1 76.6 192.8 74.5 196.6 72.3 193.6 70.6 179.6 68.1 168.1","28.5 195.7 30.2 195.7 33.6 201.7 30.6 220 28.5 213.6 26.8 198.3","69.8 195.7 71.9 195.7 73.6 198.3 71.9 213.2 70.2 219.6 67.2 202.1"]}};
// Kroppskartan som en bild: fram till vänster och bak till höger, med etiketter och streck ut till musklerna.
// keyOf(side, area) ger nyckeln som ett tryck väljer (eller null), labels är [sida, område, text].
// Alla muskler har en dov orange toning; det valda lyser starkt med ett svagt sken.
function bodyMap({ sel, attr, keyOf, labels, name }) {
  const poly = pts => `<polygon points="${pts}"/>`;
  const centroid = pts => { const n = pts.split(" ").map(Number), xs = n.filter((_, k) => k % 2 === 0), ys = n.filter((_, k) => k % 2); return [xs.reduce((a, b) => a + b) / xs.length, ys.reduce((a, b) => a + b) / ys.length]; };
  const OFF = { front: 46, back: 154 };
  const body = side => `<g transform="translate(${OFF[side]} 4)">${Object.entries(BODY_POLYS[side]).map(([a, list]) => {
    const key = a && keyOf(side, a);
    return !key ? `<g class="bm-base">${list.map(poly).join("")}</g>`
      : `<g class="bm-reg ${key === sel ? "on" : ""}" ${attr}="${key}" role="button" tabindex="0" aria-label="${esc(name(key))}">${list.map(poly).join("")}</g>`;
  }).join("")}</g>`;
  // Etiketter: vänster spalt för framsidan, höger för baksidan, utan att krocka
  const place = side => {
    const rows = labels.filter(l => l[0] === side).map(([, a, text]) => {
      const pts = BODY_POLYS[side][a].map(centroid).sort((p, q) => side === "front" ? p[0] - q[0] : q[0] - p[0])[0];
      return { a, text, ax: pts[0] + OFF[side], ay: pts[1] + 4, key: keyOf(side, a) };
    }).sort((p, q) => p.ay - q.ay);
    let last = -99;
    for (const r of rows) { r.y = Math.max(r.ay, last + 19); last = r.y; }
    return rows.map(r => {
      const w = r.text.length * 5.4 + 12, x = side === "front" ? 1 : 299 - w, ex = side === "front" ? x + w : x;
      return `<g class="bm-label ${r.key === sel ? "on" : ""}" ${attr}="${r.key}" role="button" tabindex="0"><path class="bm-line" d="M${ex} ${r.y} L${(ex + r.ax) / 2} ${r.y} L${r.ax} ${r.ay}"/><circle class="bm-dot" cx="${r.ax}" cy="${r.ay}" r="1.6"/>
        <rect x="${x}" y="${r.y - 7.5}" width="${w}" height="15" rx="7.5"/><text x="${x + w / 2}" y="${r.y + 3.2}" text-anchor="middle">${esc(r.text)}</text></g>`;
    }).join("");
  };
  return `<svg class="bodymap" viewBox="0 0 300 208" role="group" aria-label="Kroppen fram och bak">
    <defs><linearGradient id="bm-dim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a4a22"/><stop offset="1" stop-color="#4a2a17"/></linearGradient>
      <linearGradient id="bm-on" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a52"/><stop offset="1" stop-color="#ff5f0f"/></linearGradient>
      <radialGradient id="bm-bg" cx=".5" cy=".45" r=".55"><stop offset="0" stop-color="#ff6b1a" stop-opacity=".16"/><stop offset="1" stop-color="#ff6b1a" stop-opacity="0"/></radialGradient>
      <filter id="bm-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <ellipse cx="150" cy="104" rx="140" ry="104" fill="url(#bm-bg)"/>
    ${body("front")}${body("back")}${place("front")}${place("back")}</svg>`;
}
const STRETCH_LABELS = [["front", "neck", "Nacke"], ["front", "shoulders", "Axlar"], ["front", "chest", "Bröst"], ["front", "arms", "Armar"], ["front", "lower_back", "Bål"], ["front", "quads", "Framsida lår"],
  ["back", "upper_back", "Övre rygg"], ["back", "lower_back", "Ländrygg"], ["back", "hips", "Säte"], ["back", "hamstrings", "Baksida lår"], ["back", "calves", "Vader"]];
function stretchMap(sel) {
  return bodyMap({ sel, attr: "data-sarea", keyOf: (side, a) => a, labels: STRETCH_LABELS, name: a => STRETCH_AREAS[a][0] });
}

// Läget i guiden: valt område (eller "all"), sökning, hur många som visas och övningen som läggs till
let sgArea = "hips", sgQuery = "", sgLimit = 20, sgAdd = null;
function stretchGuideView() {
  const all = Object.keys(EX).filter(id => EX[id].cat === "stretch");
  const q = norm(sgQuery.trim());
  const list = (sgArea === "all" ? all : all.filter(id => stretchInArea(id, sgArea)))
    .filter(id => !q || norm(EX[id].name + " " + EX[id].muscles).includes(q));
  const title = sgArea === "all" ? "Alla stretchövningar" : STRETCH_AREAS[sgArea][0];
  const inDaily = id => S.daily.some(e => e.id === id);
  const rows = list.slice(0, sgLimit).map(id => `<div class="h3-row sg-row"><button class="sg-open" data-info="${id}" aria-label="Visa ${esc(EX[id].name)}">
      <span class="thumb exl">${figure(id)}</span><span class="grow"><b>${esc(EX[id].name)}</b><small>${EX[id].sets} × ${esc(EX[id].reps)} · ${esc(EX[id].muscles)}</small></span></button>
      <button class="sg-add ${inDaily(id) ? "have" : ""}" data-sgadd="${id}" aria-label="Lägg till ${esc(EX[id].name)}">${icon(inDaily(id) ? "check" : "plus", 18)}</button></div>`).join("");
  return `<div class="sguide"><button class="backbtn" data-tab="idag">${icon("left", 18)}Hem</button>
    <h1>Stretchguide</h1><div class="muted sg-sub">Tryck där det känns stelt, eller välj ett område.</div>
    <section class="sg-map">${stretchMap(sgArea)}</section>
    <div class="exlib-chips sg-chips">${[["all", "Alla"], ...Object.entries(STRETCH_AREAS).map(([k, v]) => [k, v[0]])].map(([k, n]) =>
      `<button class="${sgArea === k ? "on" : ""}" data-sarea="${k}" aria-pressed="${sgArea === k}">${n}</button>`).join("")}</div>
    <div class="row between sg-head"><h2>${title}</h2><span class="muted small">${list.length} övningar</span></div>
    <div class="psearch">${icon("search", 18)}<input id="sgq" type="search" placeholder="Sök stretchövning" value="${esc(sgQuery)}" autocomplete="off" aria-label="Sök stretchövning"></div>
    ${rows ? `<section class="h3-list">${rows}</section>` : `<div class="muted sg-none">Inga övningar matchar.</div>`}
    ${list.length > sgLimit ? `<button class="wide sg-more" data-sgmore>Visa fler (${list.length - sgLimit})</button>` : ""}
    ${sgAdd && EX[sgAdd] ? stretchAddSheet(sgAdd) : ""}</div>`;
}
// Bladet för att lägga till en övning: i Dailys eller i ett av passen
function stretchAddSheet(id) {
  const has = list => list.some(e => e.id === id);
  const opt = (target, name, sub, ic, there) => `<button class="h3-row sg-opt ${there ? "have" : ""}" data-sgto="${target}" ${there ? "disabled" : ""}>
      <span class="h3-ic">${icon(ic, 18)}</span><span class="grow"><b>${esc(name)}</b><small>${there ? "Finns redan" : sub}</small></span>${icon(there ? "check" : "plus", 18)}</button>`;
  return `<div class="overlay" data-sgclose><div class="sheet" role="dialog" aria-label="Lägg till ${esc(EX[id].name)}">
    <div class="row between"><span class="col"><span class="klabel">Lägg till</span><h2>${esc(EX[id].name)}</h2></span>
      <button class="small ghost iconbtn" data-sgclose aria-label="Stäng">${icon("close", 18)}</button></div>
    <div class="muted small">${EX[id].sets} × ${esc(EX[id].reps)}</div>
    <section class="h3-list sg-opts">${opt("daily", "Dailys", "Varje dag", "check", has(S.daily))}
      ${S.plan.days.map(d => opt(d.id, d.name, `I passet · ${d.ex.length} övningar`, "trana", has(d.ex))).join("")}</section></div></div>`;
}
document.addEventListener("input", ev => {
  if (ev.target.id !== "sgq") return;
  sgQuery = ev.target.value; sgLimit = 20;
  const pos = ev.target.selectionStart;
  render();
  const f = $("sgq"); if (f) { f.focus(); f.setSelectionRange(pos, pos); }
});
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-sarea],[data-sgadd],[data-sgto],[data-sgclose],[data-sgmore]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;
  ev.stopImmediatePropagation();
  const ds = t.dataset;
  if (ds.sarea) { sgArea = ds.sarea; sgLimit = 20; }
  else if (ds.sgadd) sgAdd = ds.sgadd;
  else if (ds.sgclose !== undefined) sgAdd = null;
  else if (ds.sgmore !== undefined) sgLimit += 20;
  else if (ds.sgto) {
    const id = sgAdd, list = exList(ds.sgto);
    if (!list.some(e => e.id === id)) list.push(exEntry(id));
    save();
    const where = ds.sgto === "daily" ? "Dailys" : dayById(ds.sgto).name;
    sgAdd = null;
    render();
    toast(`${EX[id].name} tillagd i ${where}`);
    return;
  }
  save();
  render();
});
document.addEventListener("keydown", ev => {
  const g = ev.target.closest && ev.target.closest(".sreg");
  if (g && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
});

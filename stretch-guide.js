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

// Kroppskartan: en mjuk siluett (högra halvan speglas) och områden som klipps efter den, fram och bak.
// Varje område går att trycka på.
const BODY_HALF = [[66,33],[78,41],[88,45],[95,53],[99,70],[100,94],[103,116],[105,133],[107,146],[102,153],[97,146],[96,133],
  [93,116],[90,98],[87,74],[83,78],[79,100],[81,121],[83,148],[79,188],[80,212],[74,240],[79,250],[65,253],[64,240],[63,212],[63,190],[62,160],[60,148]];
const BODY_PATH = (() => {
  const pts = [...BODY_HALF, ...BODY_HALF.slice(0, -1).reverse().map(([x, y]) => [120 - x, y])];
  // Catmull-Rom till kubiska kurvor ger en jämn kontur
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let k = 0; k < pts.length; k++) {
    const p0 = pts[(k - 1 + pts.length) % pts.length], p1 = pts[k], p2 = pts[(k + 1) % pts.length], p3 = pts[(k + 2) % pts.length];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d + "Z";
})();
const sym = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/><rect x="${120 - x - w}" y="${y}" width="${w}" height="${h}"/>`;
const BODY_SHAPES = {
  front: [
    ["neck", '<rect x="48" y="26" width="24" height="18"/>'],
    ["chest", '<rect x="36" y="44" width="48" height="38"/>'],
    ["lower_back", '<rect x="36" y="82" width="48" height="38"/>'],
    ["shoulders", '<ellipse cx="88" cy="55" rx="12" ry="12"/><ellipse cx="32" cy="55" rx="12" ry="12"/>'],
    ["arms", sym(86, 67, 30, 92)],
    ["hips", '<rect x="34" y="120" width="52" height="27"/>'],
    ["quads", '<rect x="34" y="147" width="52" height="47"/>'],
    ["calves", '<rect x="34" y="194" width="52" height="62"/>'],
  ],
  back: [
    ["neck", '<rect x="48" y="26" width="24" height="18"/>'],
    ["upper_back", '<rect x="36" y="44" width="48" height="52"/>'],
    ["lower_back", '<rect x="36" y="96" width="48" height="24"/>'],
    ["shoulders", '<ellipse cx="88" cy="55" rx="12" ry="12"/><ellipse cx="32" cy="55" rx="12" ry="12"/>'],
    ["arms", sym(86, 67, 30, 92)],
    ["hips", '<rect x="34" y="120" width="52" height="30"/>'],
    ["hamstrings", '<rect x="34" y="150" width="52" height="44"/>'],
    ["calves", '<rect x="34" y="194" width="52" height="62"/>'],
  ],
};
function stretchBody(side, sel) {
  const label = side === "front" ? "Framsida" : "Baksida", clip = "sbclip-" + side;
  return `<figure class="sbody"><svg viewBox="0 0 120 258" role="group" aria-label="${label}">
    <defs><clipPath id="${clip}"><path d="${BODY_PATH}"/></clipPath></defs>
    <ellipse class="sbody-base" cx="60" cy="17" rx="11" ry="13"/>
    <path class="sbody-base" d="${BODY_PATH}"/>
    <g clip-path="url(#${clip})">${BODY_SHAPES[side].map(([a, s]) => `<g class="sreg ${a === sel ? "on" : ""}" data-sarea="${a}" role="button" tabindex="0" aria-label="${STRETCH_AREAS[a][0]}">${s}</g>`).join("")}</g>
    <path class="sbody-line" d="${BODY_PATH}"/>
  </svg><figcaption>${side === "front" ? "Fram" : "Bak"}</figcaption></figure>`;
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
    <section class="sg-map">${stretchBody("front", sgArea)}${stretchBody("back", sgArea)}</section>
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

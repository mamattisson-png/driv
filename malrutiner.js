"use strict";
// ---------- Rutiner efter mål ----------
// Färdiga dailys-rutiner som utgår från vad man vill: starkare mage, stel ländrygg, stela höfter osv.
// Man väljer ett mål i Upplägg (steg 2 Rutiner), ser övningarna och lägger till rutinen med ett tryck.
// Rutinen blir en vanlig rutin som går att ändra. Övningarna är vanliga övningar ur biblioteket.
// Laddas före app.js.

// spec: "övning@setxreps" som exEntry
const GOAL_ROUTINES = [
  { id: "mage", name: "Starkare mage", icon: "trana", why: "Stärker de djupa magmusklerna som håller bålen stadig och avlastar ryggen.",
    ex: ["plankan@3x30 s", "dead_bug@3x10/sida", "omvand_crunch@3x12", "sidoplanka@3x20 s/sida", "bird_dog@2x8/sida"] },
  { id: "landrygg", name: "Stel ländrygg", icon: "utseende", care: true, why: "Mjukar upp länd och höfter och stärker det som avlastar ryggen. Gör lugnt, utan smärta.",
    ex: ["katt_ko@2x10", "kna_mot_brost@2x30 s/sida", "strx_supine_wipers@2x8/sida", "barnets_position@2x45 s", "hoftbojare_stretch@2x30 s/sida", "bird_dog@2x8/sida"] },
  { id: "hofter", name: "Stela höfter", icon: "utseende", why: "Rörlighet i höften åt alla håll. Bra för den som sitter mycket.",
    ex: ["strx_ninety_switch@2x8", "strx_quadruped_hip_circle@2x6/ben", "hoftbojare_stretch@2x30 s/sida", "figur_fyra@2x30 s/sida", "grodan@2x45 s"] },
  { id: "nacke", name: "Nacke och axlar", icon: "utseende", care: true, why: "För kontorsdagar: lösare nacke och axlar, och öppnare bröst.",
    ex: ["strx_shoulder_rolls@2x8/riktning", "strx_neck_sidebend@2x6/sida", "strx_neck_nod@2x8", "strx_wall_slide@2x8", "brost_dorr@2x30 s/sida", "trad_nalen@2x30 s/sida"] },
  { id: "hallning", name: "Bättre hållning", icon: "profil", why: "Stärker ryggens baksida och öppnar bröstet, så att det blir lättare att stå rakt.",
    ex: ["strx_floor_angels@2x8", "superman@3x10", "strx_open_book@2x6/sida", "strx_chest_towel@2x30 s", "bird_dog@2x8/sida"] },
  { id: "rumpa", name: "Starkare rumpa", icon: "trana", why: "Sätet stöttar höfter, knän och rygg. Utan vikter, på golvet.",
    ex: ["glute_bridge@3x15", "stx_clamshell@2x15/sida", "sidliggande_benlyft@2x12/sida", "enbens_bridge@2x10/ben", "figur_fyra@1x30 s/sida"] },
  { id: "baksida", name: "Stela baksida lår", icon: "utseende", why: "Mjukare baksida lår gör det lättare att böja sig och lyfta rätt.",
    ex: ["strx_supine_knee_extension@2x10/ben", "liggande_hamstring@2x30 s/ben", "strx_hamstring_heel_chair@2x30 s/ben", "nedatgaende_hund@2x30 s", "sittande_framatfallning@2x30 s"] },
  { id: "morgon", name: "Morgonrörlighet", icon: "sol", why: "Fem minuter som väcker hela kroppen innan dagen börjar.",
    ex: ["katt_ko@1x10", "varldens_basta@1x5/sida", "nedatgaende_hund@1x30 s", "strx_quadruped_rotation@1x8/sida", "djup_knaboj@1x45 s"] },
  { id: "forelop", name: "Före löpning", icon: "aktivitet", why: "Rörlig uppvärmning för höfter och ben, så att första kilometern känns lättare.",
    ex: ["strx_leg_swing_front@1x10/ben", "strx_leg_swing_side@1x10/ben", "strx_hamstring_scoops@1x8/ben", "varldens_basta@1x5/sida", "strx_quadruped_hip_circle@1x6/ben"] },
  { id: "efterlop", name: "Efter löpning", icon: "aktivitet", why: "Lugn stretch för vader, lår och höfter när du har sprungit.",
    ex: ["vadstretch@2x30 s/sida", "framsida_lar_stretch@2x30 s/sida", "liggande_hamstring@2x30 s/ben", "hoftbojare_stretch@2x30 s/sida", "figur_fyra@2x30 s/sida"] },
];
const goalEx = g => g.ex.map(spec => EX[spec.split("@")[0]] ? exEntry(spec) : null).filter(Boolean);
// Ungefärlig tid: sekunder per set (hållningar räknas som skrivet, reps som 3 s styck) plus 15 s mellan set
function goalMinutes(g) {
  let s = 0;
  for (const e of goalEx(g)) {
    const r = String(e.reps), sec = (r.match(/(\d+)\s*s/) || [])[1], reps = +(r.match(/\d+/) || [10])[0], per = /sida|ben|arm|riktning/.test(r) ? 2 : 1;
    s += (+e.sets || 1) * ((sec ? +sec : reps * 3) * per + 15);
  }
  return Math.max(3, Math.round(s / 60));
}

let goalPick = null;   // null, "list" eller ett måls id
function goalView() {
  const back = `<button class="backbtn" data-goalpick-back>${icon("left", 18)}${goalPick === "list" ? "Upplägg" : "Mål"}</button>`;
  if (goalPick === "list") return `<div class="dlx up">${back}<h1>Vad vill du bli bättre på?</h1>
    <div class="muted up-sub">Välj ett mål så får du en färdig rutin. Den går att ändra efteråt.</div>
    <div class="gr-grid">${GOAL_ROUTINES.map(g => `<button class="gr-tile" data-goalroutine="${g.id}"><span class="gr-figs">${goalEx(g).slice(0, 2).map(e => `<span>${figure(e.id)}</span>`).join("")}</span>
      <b>${esc(g.name)}</b><small>${goalEx(g).length} övningar · ~${goalMinutes(g)} min</small></button>`).join("")}</div></div>`;
  const g = GOAL_ROUTINES.find(x => x.id === goalPick);
  if (!g) { goalPick = null; return uppView(); }
  const list = goalEx(g), have = dailyRoutines().some(r => r.goal === g.id);
  return `<div class="dlx up">${back}<span class="klabel">Rutin efter mål</span><h1>${esc(g.name)}</h1>
    <p class="muted gr-why">${esc(g.why)}</p>
    <div class="gr-meta"><span>${list.length} övningar</span><span>~${goalMinutes(g)} min</span></div>
    <section class="up-list">${list.map(e => `<div class="up-li gr-row">${thumb(e.id, "dl-f")}<span class="grow col"><b>${esc(EX[e.id].name)}</b><small class="muted">${e.sets} × ${esc(String(e.reps).replace(/-/g, "–"))}</small></span></div>`).join("")}</section>
    ${g.care ? `<p class="muted small gr-care">Gör rörelserna lugnt och utan smärta. Har du ont som inte går över, prata med vårdpersonal.</p>` : ""}
    <button class="primary wide bigbtn gr-add" data-goaladd="${g.id}">${have ? "Lägg till en gång till" : "Lägg till som rutin"}</button>
    <p class="muted small gr-note">Rutinen hamnar under Rutiner i Upplägg. Där väljer du vilka dagar den gäller.</p></div>`;
}
function addGoalRoutine(id) {
  const g = GOAL_ROUTINES.find(x => x.id === id);
  if (!g) return;
  const L = S.dailyRoutines || (S.dailyRoutines = []), r = { id: "r" + Date.now().toString(36), name: g.name.slice(0, 40), ex: goalEx(g), goal: g.id };
  L.push(r);
  if (L.length === 1) S.dailyAnchor = { date: TODAY, id: r.id };   // första rutinen blir dagens
  goalPick = null; rutOpen = r.id; save(); render(); window.scrollTo(0, 0);
  toast(`${g.name} är tillagd`);
}
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-goallist],[data-goalroutine],[data-goaladd],[data-goalpick-back],[data-tab]");
  if (!t) return;
  if (t.dataset.tab !== undefined) { goalPick = null; return; }   // byter flik: målvalet stängs
  ev.stopImmediatePropagation();
  const ds = t.dataset;
  if (ds.goallist !== undefined) goalPick = "list";
  else if (ds.goalroutine) goalPick = ds.goalroutine;
  else if (ds.goaladd) { addGoalRoutine(ds.goaladd); return; }
  else if (ds.goalpickBack !== undefined) goalPick = goalPick === "list" ? null : "list";
  render(); window.scrollTo(0, 0);
}, true);

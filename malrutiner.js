"use strict";
// ---------- Rutiner efter mål ----------
// Färdiga dailys-rutiner som utgår från vad man vill: starkare mage, stel ländrygg, stela höfter osv.
// Man väljer ett mål i Upplägg (steg 2 Rutiner), ser övningarna och lägger till rutinen med ett tryck.
// Rutinen blir en vanlig rutin som går att ändra. Övningarna är vanliga övningar ur biblioteket.
// Laddas före app.js.

// spec: "övning@setxreps" som exEntry. Varje rutin följer råd från fysioterapeuter i vården (NHS, 1177)
// eller forskning (McGill), och src visar källan i appen. Mål utan sådana råd finns inte med.
const GOAL_ROUTINES = [
  { id: "mage", name: "Starkare mage", icon: "trana", why: "Ryggforskaren Stuart McGills tre bålövningar: de stärker magen och bålen utan att belasta ländryggen.",
    ex: ["crunches@3x6", "sidoplanka@3x10 s/sida", "bird_dog@3x6/sida"],
    tip: "Curl-up enligt McGill: ena benet rakt, händerna under svanken, lyft bara huvud och skuldror en liten bit och håll några sekunder.",
    src: [["Harvard Health: Three moves for better spine health", "https://www.health.harvard.edu/pain/three-moves-for-better-spine-health"]] },
  { id: "landrygg", name: "Stel ländrygg", icon: "utseende", care: true, why: "Lugna rörelser som fysioterapeuter i den brittiska vården ger vid stel och öm ländrygg.",
    ex: ["strg_pelvic_tilt@2x10", "strg_supine_twist@2x8/sida", "kna_mot_brost@2x20 s/sida", "glute_bridge@2x10", "katt_ko@2x10"],
    src: [["NHS: Back mobility exercises (Cambridge University Hospitals)", "https://www.cuh.nhs.uk/patient-information/back-mobility-exercises/"],
      ["NHS: Low back pain, exercises (Guy's and St Thomas')", "https://guysandstthomas.nhs.uk/health-information/low-back-pain/physiotherapy-and-exercises"],
      ["1177: Ont i ryggen", "https://www.1177.se/sjukdomar--besvar/skelett-leder-och-muskler/rygg-och-nacke/ont-i-ryggen/"]] },
  { id: "nacke", name: "Nacke och axlar", icon: "utseende", care: true, why: "Små, lugna nackrörelser som vården rekommenderar vid stel nacke, gärna ett par gånger om dagen.",
    ex: ["strg_chin_tuck@2x10", "strx_neck_turn@2x6/sida", "strx_neck_sidebend@2x6/sida", "strx_shoulder_rolls@2x8/riktning"],
    src: [["NHS: Neck pain (Berkshire Healthcare)", "https://www.berkshirehealthcare.nhs.uk/advice/neck-pain"]] },
  { id: "hallning", name: "Bättre hållning", icon: "profil", why: "Övningar för hållningen från den brittiska vården: hakindrag, rörlig bröstrygg och öppnare bröst.",
    ex: ["strg_chin_tuck@2x10", "strx_open_book@2x6/sida", "brost_dorr@2x20 s/sida", "trad_nalen@2x20 s/sida"],
    src: [["NHS: Exercises to improve your posture (University Hospital Southampton)", "https://www.uhs.nhs.uk/Media/UHS-website-2019/Patientinformation/Respiratory/Exercises-to-improve-your-posture-562-PIL.pdf"]] },
  { id: "rumpa", name: "Starkare rumpa", icon: "trana", why: "De tre övningar för sätet som vården ger för starkare höfter. Utan vikter, på golvet.",
    ex: ["glute_bridge@3x10", "stx_clamshell@3x10/sida", "sidliggande_benlyft@3x10/sida"],
    src: [["NHS: Strengthening exercises for hip pain (Leicester)", "https://www.uhleicester.nhs.uk/wp-content/uploads/2025/06/1103_052024-Strengthening-exercises-and-advice-for-hip-pain.pdf"]] },
  { id: "hofter", name: "Stela höfter", icon: "utseende", why: "Lugn stretch för höftens fram- och baksida. Bra för den som sitter mycket.",
    ex: ["hoftbojare_stretch@2x20 s/sida", "figur_fyra@2x20 s/sida", "kna_mot_brost@2x20 s/sida"],
    src: [["NHS: How to stretch after exercising", "https://www.nhs.uk/live-well/exercise/how-to-stretch-after-exercising/"]] },
  { id: "baksida", name: "Stela baksida lår", icon: "utseende", why: "Lugn stretch för baksida lår med rak rygg, så att sträckningen hamnar i låret och inte i ländryggen.",
    ex: ["liggande_hamstring@2x20 s/ben", "strx_hamstring_heel_chair@2x20 s/ben", "strx_supine_knee_extension@2x8/ben"],
    src: [["NHS: How to stretch after exercising", "https://www.nhs.uk/live-well/exercise/how-to-stretch-after-exercising/"]] },
  { id: "forelop", name: "Före löpning", icon: "aktivitet", why: "Rörlig uppvärmning. Vården råder att värma upp minst sex minuter och att vänta med stilla stretch tills efteråt.",
    ex: ["strx_leg_swing_front@1x10/ben", "strx_leg_swing_side@1x10/ben", "strx_hamstring_scoops@1x8/ben", "varldens_basta@1x5/sida", "strx_quadruped_hip_circle@1x6/ben"],
    tip: "Börja med några minuter rask promenad eller lugn jogg.",
    src: [["NHS: How to warm up before exercising", "https://www.nhs.uk/live-well/exercise/how-to-warm-up-before-exercising/"]] },
  { id: "efterlop", name: "Efter löpning", icon: "aktivitet", why: "Stretch för vader, lår och säte när du har sprungit. Håll varje stretch i 15–20 sekunder.",
    ex: ["vadstretch@2x20 s/sida", "framsida_lar_stretch@2x20 s/sida", "liggande_hamstring@2x20 s/ben", "figur_fyra@2x20 s/sida"],
    src: [["NHS: How to stretch after exercising", "https://www.nhs.uk/live-well/exercise/how-to-stretch-after-exercising/"]] },
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
    ${g.tip ? `<p class="muted small gr-tip">${esc(g.tip)}</p>` : ""}
    <p class="muted small gr-care">${g.care ? "Gör rörelserna lugnt och utan smärta. Blir det inte bättre inom två till tre veckor, eller har du domningar, feber eller svårt att kissa, kontakta vården (1177)." : "Gör rörelserna lugnt och sluta om det gör ont."}</p>
    <div class="gr-src"><span class="klabel">Bygger på</span>${g.src.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join("")}</div>
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

"use strict";
// ---------- Stretch under vilan ----------
// Medan vilotimern räknar ned i fokusläget visas ett frivilligt stretchförslag för musklerna i övningen man kör.
// Ett tryck öppnar stretchen med appens egen gubbe och instruktioner; vilan fortsätter och set och loggar påverkas inte.
// När vilan är slut försvinner förslaget. Går att stänga av under Mer (S.restStretch = false).
// Laddas efter stretch-guide.js och fokus.js, före app.js.

// Övningarnas muskler (prim/sec) och vilka stretchmål (stretch-guide.js) som töjer dem
const STRETCH_FOR_MUSCLE = {
  brost: "chest", axlar: "shoulders", triceps: "triceps", biceps: "biceps", underarmar: "forearms",
  rygg: "lats thoracic_back upper_back", mage: "lower_back obliques", framsida_lar: "quads hip_flexors",
  baksida_lar: "hamstrings", sate: "glutes hip_rotators", vader: "calves ankles", insida_lar: "adductors",
};
let restStretchOpen = false, restStretchSkip = 0;   // bladet öppet, och hur många förslag man bläddrat förbi

// Stretchar som passar övningen, bäst först: huvudmusklerna väger tyngst
function stretchesFor(exId) {
  const e = EX[exId];
  if (!e || e.cat === "stretch" || e.cat === "cardio") return [];
  const want = m => (STRETCH_FOR_MUSCLE[m] || "").split(" ").filter(Boolean);
  const prim = (e.prim || []).flatMap(want), sec = (e.sec || []).flatMap(want);
  return Object.keys(EX).filter(id => EX[id].cat === "stretch").map(id => {
    const t = stretchTargetsOf(id);
    // Stretchens huvudmål (det första) på övningens huvudmuskel väger mest
    return { id, score: (prim.includes(t[0]) ? 3 : 0) + t.filter(x => prim.includes(x)).length * 2 + t.filter(x => sec.includes(x)).length };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || EX[a.id].name.localeCompare(EX[b.id].name, "sv")).map(x => x.id);
}
const restActive = () => typeof rest !== "undefined" && rest.el && rest.end > Date.now();
function restStretchPick(exId) {
  const list = stretchesFor(exId);
  return list.length ? list[restStretchSkip % list.length] : null;
}
const stretchDur = id => String(EX[id].reps || "").replace(/\s*\/\s*sida/, " per sida").replace(/(\d)\s*s\b/, "$1 s");

// Raden i fokusläget under vilan
function restStretchRow(exId) {
  if (S.restStretch === false || !restActive()) return "";
  const id = restStretchPick(exId);
  if (!id) return "";
  const area = EX[exId].prim && EX[exId].prim.length ? (typeof MUSCLE_GROUPS !== "undefined" && MUSCLE_GROUPS[EX[exId].prim[0]] || "musklerna").toLowerCase() : "musklerna";
  return `<button class="vstretch" data-vstretch="${exId}"><span class="vsfig">${figure(id)}</span>
    <span class="grow"><span class="klabel">Under vilan</span><b>${esc(EX[id].name)}</b><small>${esc(stretchDur(id))} · töjer ${esc(area)} du just tränat</small></span>
    <span class="vsgo">Visa${icon("right", 14)}</span></button>`;
}
// Bladet med stretchen: gubben, instruktionerna och vilan som fortsätter
function restStretchSheet() {
  if (!restStretchOpen || !focus) return "";
  const d = dayById(focus.dayId), ex = d && d.ex[focus.idx], id = ex && restStretchPick(ex.id);
  if (!id) return "";
  const left = Math.max(0, Math.ceil((rest.end - Date.now()) / 1000));
  return `<div class="overlay" data-vsclose><div class="sheet vssheet" role="dialog" aria-label="Stretch under vilan">
    <div class="row between"><div><span class="klabel vsk">Under vilan</span><h2 class="sheeth">${esc(EX[id].name)}</h2></div>
      <span class="vstime">${icon("timer", 16)}<span class="frest-time">${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}</span></span></div>
    <div class="vsanim">${figure(id)}</div>
    <div class="muted small">${esc(stretchDur(id))}</div>
    <ol class="vscues">${(EX[id].cues || []).map(c => `<li>${esc(c)}</li>`).join("")}</ol>
    <div class="row vsbtns">${stretchesFor(ex.id).length > 1 ? `<button class="grow" data-vsnext>Annan stretch</button>` : ""}<button class="primary grow" data-vsclose>Klar</button></div>
    <div class="muted small vsnote">Vilan fortsätter. När den är slut stängs rutan och nästa set väntar.</div></div></div>`;
}
// När vilan tar slut försvinner förslaget och bladet stängs
setInterval(() => {
  if (restActive()) return;
  const row = document.querySelector(".vstretch"), sheet = document.querySelector(".vssheet");
  if (row) row.remove();
  if (sheet) { restStretchOpen = false; sheet.closest(".overlay").remove(); }
}, 500);

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-vstretch],[data-vsclose],[data-vsnext],[data-vsoff]");
  if (!t) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // tryck inne i bladet
  ev.stopImmediatePropagation();
  if (t.dataset.vstretch) restStretchOpen = true;
  else if (t.dataset.vsnext !== undefined) restStretchSkip++;
  else if (t.dataset.vsoff !== undefined) { S.restStretch = S.restStretch === false; save(); if (typeof focusMore !== "undefined") focusMore = false; }
  else restStretchOpen = false;
  render();
}, true);

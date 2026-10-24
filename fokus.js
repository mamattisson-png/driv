"use strict";
// ---------- Fokusläge under passet ----------
// En övning i taget med stora knappar. Vikt och reps ändras med − och +, och siffran går också
// att trycka på för att skriva. Skärmen hålls tänd så länge fokusläget är öppet.
// Laddas före app.js; funktionerna härifrån anropas först när appen ritas.

let focus = null;   // { dayId, idx } medan fokusläget är öppet
let focusDailies = false;   // dailys visas i ett fönster ovanpå passet

function startFocus(dayId) {
  const d = dayById(dayId);
  if (!d || !d.ex.length) return false;
  const w = workoutOn(logDate(), d.id);
  focus = { dayId, idx: Math.max(0, d.ex.findIndex(x => !exDone(w, x))) };
  chosenDay = dayId;
  keepAwake(true);
  return true;
}
function endFocus() {
  focus = null;
  focusDailies = false;
  keepAwake(false);
}

// Efter ett avbockat set: är övningen klar går fokus vidare till nästa medan vilan räknar ned
function focusAfterSet(d) {
  if (!focus || focus.dayId !== d.id) return;
  const w = workoutOn(logDate(), d.id);
  const advance = exDone(w, d.ex[focus.idx]) && focus.idx < d.ex.length - 1;
  if (advance) focus.idx++;
  focus.scroll = advance ? "top" : "active";
}
// Anropas efter varje ritning: nästa set (eller nästa övning) hamnar i bild
function afterFocusRender() {
  if (!focus || !focus.scroll) return;
  const where = focus.scroll;
  focus.scroll = null;
  if (where === "top") window.scrollTo(0, 0);
  else { const a = document.querySelector(".fset.active"); if (a && a.scrollIntoView) a.scrollIntoView({ block: "nearest" }); }
}

// Stegstorlek: hantlar 2 kg, annars 2,5 kg; reps 1; sekunder 5
const stepFor = (exId, f) => f === "kg" ? (EX[exId].hold === "db" ? 2 : 2.5) : isTimed(exId) ? 5 : 1;

function stepSet(d, exId, i, f, dir) {
  const ex = d.ex.find(x => x.id === exId);
  const s = setAt(d, exId, i), hint = liveHint(d, ex, i);
  // Ett tomt fält visar förslaget (dagens mål eller förra gången); stegen utgår från det
  const cur = s[f] === undefined || s[f] === "" ? +hint[f] || 0 : +s[f];
  const next = cur + dir * stepFor(exId, f);
  s[f] = clampSet(exId, f, f === "kg" ? Math.round(next * 4) / 4 : Math.round(next));
}

function stepper(exId, i, f, val, hint, label, unit) {
  const btn = (dir, txt) => `<button class="step" data-step="${f}" data-ex="${exId}" data-i="${i}" data-dir="${dir}" aria-label="${txt} ${label}, set ${i + 1}">${dir > 0 ? "+" : "−"}</button>`;
  return `<div class="stepper">${btn(-1, "Minska")}
    <input type="number" inputmode="${f === "kg" ? "decimal" : "numeric"}" step="${f === "kg" ? 0.25 : 1}" min="0" max="${setMax(exId, f)}" value="${val ?? ""}"
      placeholder="${hint ?? ""}" data-set="${exId}" data-i="${i}" data-f="${f}" aria-label="${label}, set ${i + 1}">
    ${btn(1, "Öka")}<div class="unit">${unit}</div></div>`;
}

function focusView() {
  const d = dayById(focus.dayId);
  if (!d || !d.ex.length) { endFocus(); return VIEWS.pass(); }
  focus.idx = Math.min(focus.idx, d.ex.length - 1);
  const ex = d.ex[focus.idx], w = workoutOn(logDate(), d.id);
  const sets = (w && w.sets[ex.id]) || [], prev = lastSets(ex.id), target = todayTarget(ex);
  const bw = !!EX[ex.id].bw, repLabel = isTimed(ex.id) ? "sek" : "reps";
  let active = -1;
  for (let i = 0; i < ex.sets; i++) if (!(sets[i] && sets[i].ok)) { active = i; break; }
  let rows = "";
  for (let i = 0; i < ex.sets; i++) {
    const s = sets[i] || {}, h = liveHint(d, ex, i), p = prev ? hintSet(prev, i) : null;
    const kg = stepper(ex.id, i, "kg", s.kg, h.kg || "", bw ? "Extra vikt" : "Vikt", GEAR[gearOf(ex.id)][2]);
    const reps = stepper(ex.id, i, "reps", s.reps, h.reps, isTimed(ex.id) ? "Sekunder" : "Reps", repLabel);
    const last = p && hasData(p) ? fmtSet({ kg: +p.kg || 0, reps: +p.reps || 0 }, ex.id) : "";
    rows += `<div class="fset ${s.ok ? "done" : ""} ${i === active ? "active" : ""}">
      <div class="fset-head"><b>Set ${i + 1}</b>${last ? `<span class="muted small">förra: ${last}</span>` : ""}</div>
      <div class="fset-fields">${bw ? reps + kg : kg + reps}</div>
      <button class="done-btn big ${s.ok ? "on" : ""}" data-ok="${ex.id}" data-i="${i}" aria-label="Set ${i + 1} klart">✓</button></div>`;
  }
  const next = d.ex[focus.idx + 1], allDone = active < 0;
  const finish = w && w.done
    ? `<button class="primary grow" data-focusexit>✓ Passet är sparat</button>`
    : `<button class="primary grow" data-finish="${d.id}" data-focusend>✓ Spara passet</button>`;
  return `<div class="focus">
    <div class="row between"><button class="small ghost" data-focusexit>‹ Alla övningar</button>${dailyChip()}</div>
    <div class="fdots">${d.ex.map((x, k) => `<button data-focusgo="${k}" class="${k === focus.idx ? "on" : ""} ${exDone(w, x) ? "done" : ""}" aria-label="${esc(EX[x.id].name)}"></button>`).join("")}</div>
    <div class="card kmeal fcard"><div class="khead">${tag(d.type)}<span class="grow">${passBand(d)}</span><span>Övning ${focus.idx + 1} av ${d.ex.length}</span></div>
      <div class="kbody">
      <div class="row"><button class="thumb" data-info="${ex.id}" aria-label="Visa ${esc(EX[ex.id].name)}">${figure(ex.id, "", true)}</button>
        <div class="grow"><h2 style="margin:2px 0">${esc(EX[ex.id].name)}</h2>
          <div class="muted">${ex.sets} × ${esc(ex.reps)} · ${GEAR[gearOf(ex.id)][0]}</div>
          ${target ? `<div class="goal">Förslag idag: <b>${fmtTarget(target, ex.id)}</b></div>`
            : `<div class="muted">Första gången: välj en vikt du klarar ${esc(ex.reps)}.</div>`}</div></div>
      ${rows}
      <div class="row" style="margin-top:10px"><button class="small" data-setcount="-1" data-ex="${ex.id}" ${ex.sets > 1 ? "" : "disabled"}>− Set</button>
        <button class="small" data-setcount="1" data-ex="${ex.id}">+ Set</button></div>
    </div></div>
    <div class="row fnav"><button data-focusgo="${focus.idx - 1}" ${focus.idx ? "" : "disabled"} aria-label="Föregående övning">‹</button>
      ${next ? `<button class="${allDone ? "primary" : ""} grow" data-focusgo="${focus.idx + 1}">Nästa: ${esc(EX[next.id].name)} ›</button>` : finish}</div>
  </div>${focusDailies ? `<div class="overlay" data-fdclose><div class="sheet">
    <div class="row between"><span class="muted small">Fläta in i passet</span><button class="small ghost" data-fdclose aria-label="Stäng">✕</button></div>
    ${dailiesCard(true)}<button class="wide" data-fdclose style="margin-top:14px">Tillbaka till passet</button></div></div>` : ""}`;
}

// Dailys under passet: en liten knapp med hur många som är klara, inget mer
function dailyChip() {
  if (!S.daily.length) return "";
  const date = logDate(), done = S.daily.filter(e => dailyDone(date, e.id)).length, all = done === S.daily.length;
  return `<button class="small chip ${all ? "ok" : ""}" data-fdopen aria-label="Dailys, ${done} av ${S.daily.length} klara">${all ? "✓" : "☐"} Dailys ${done}/${S.daily.length}</button>`;
}

// Passet i Träna: ett kort med mörk rubrik (som måltiderna i Kost) och en rad per övning med mål
// och hur många set som är klara. Tryck på en rad för att öppna fokusläget på just den övningen.
function passOverview(d, w) {
  const done = d.ex.filter(x => exDone(w, x)).length, next = w && !w.done ? d.ex.findIndex(x => !exDone(w, x)) : -1;
  const logged = w && Object.values(w.sets).some(a => a.some(hasData));
  return `<section class="card kmeal exlist">
    <div class="khead">${tag(d.type)}<span class="grow">${passBand(d)}</span><span>${done} / ${d.ex.length}</span></div>
    ${d.ex.map((ex, i) => {
      const sets = (w && w.sets[ex.id]) || [], n = sets.filter(x => x && x.ok).length, all = exDone(w, ex), target = todayTarget(ex);
      return `<button class="krow ${all ? "done" : ""}" data-focusex="${i}"><span class="thumb xs" aria-hidden="true">${figure(ex.id)}</span>
        <span class="grow"><b>${esc(EX[ex.id].name)}</b><span class="muted small">${ex.sets} × ${esc(ex.reps)}${target ? ` · förslag ${fmtTarget(target, ex.id)}` : ""}</span></span>
        ${logged && i === next ? `<span class="nextpill">Nästa</span>` : ""}<span class="setcount ${all ? "ok" : ""}">${all ? "✓" : `${n}/${ex.sets}`}</span></button>`;
    }).join("")}
  </section>`;
}

// Ett pass i efterhand: alla övningar och set på en gång, med förra (eller nästa) gångens vikter
// som förslag i fälten. "Fyll i som förslaget" loggar hela passet med ett tryck.
function pastLog(d, w) {
  const done = d.ex.filter(x => exDone(w, x)).length;
  return `<section class="card kmeal exlist pastlog">
    <div class="khead">${tag(d.type)}<span class="grow">${passBand(d)}</span><span>${done} / ${d.ex.length} klara</span></div>
    <div class="kbody"><button class="wide" data-fillall="${d.id}">↻ Fyll i hela passet som förslaget</button>
      <div class="muted small" style="margin-top:6px">Förslagen kommer från passet före eller efter. Ändra det som inte stämmer.</div></div>
    ${d.ex.map(ex => {
      const sets = (w && w.sets[ex.id]) || [], bw = !!EX[ex.id].bw;
      let rows = "";
      for (let i = 0; i < ex.sets; i++) {
        const st = sets[i] || {}, h = liveHint(d, ex, i);
        const inp = (f, v, ph, label) => `<input type="number" inputmode="${f === "kg" ? "decimal" : "numeric"}" step="${f === "kg" ? 0.25 : 1}" min="0" max="${setMax(ex.id, f)}"
          value="${v ?? ""}" placeholder="${ph ?? ""}" data-set="${ex.id}" data-i="${i}" data-f="${f}" aria-label="${label}, set ${i + 1}">`;
        rows += `<div class="pset ${st.ok ? "done" : ""}"><span class="muted small">Set ${i + 1}</span>
          ${inp("kg", st.kg, h.kg || "", bw ? "Extra vikt" : "Vikt")}<span class="muted small">${bw ? "+kg" : "kg"} ×</span>
          ${inp("reps", st.reps, h.reps, isTimed(ex.id) ? "Sekunder" : "Reps")}<span class="muted small">${isTimed(ex.id) ? "s" : "reps"}</span>
          <button class="done-btn ${st.ok ? "on" : ""}" data-ok="${ex.id}" data-i="${i}" aria-label="Set ${i + 1} klart">✓</button></div>`;
      }
      return `<div class="pex"><div class="row pexhead"><span class="thumb xs" aria-hidden="true">${figure(ex.id)}</span>
        <b class="grow">${esc(EX[ex.id].name)}</b><span class="muted small">${ex.sets} × ${esc(ex.reps)}</span></div>${rows}</div>`;
    }).join("")}
  </section>`;
}

// ---------- Skärmen tänd ----------
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && !wakeLock && navigator.wakeLock && document.visibilityState === "visible") {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      const l = wakeLock;
      wakeLock = null;
      await l.release();
    }
  } catch (e) { /* stöds inte eller nekades: appen fungerar ändå */ }
}
// Låset släpps automatiskt när appen göms; ta det igen när man kommer tillbaka
document.addEventListener("visibilitychange", () => {
  if (focus && document.visibilityState === "visible") keepAwake(true);
});

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-step],[data-focusgo],[data-focusexit],[data-focusend],[data-focusstart],[data-focusex],[data-fdopen],[data-fdclose]");
  if (!t) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset;
  if (ds.fdopen !== undefined || ds.fdclose !== undefined) { focusDailies = ds.fdopen !== undefined; dailyEditing = false; render(); return; }
  if (ds.focusend !== undefined) { endFocus(); return; }   // själva sparandet sköts av data-finish
  if (ds.focusstart) { tab = "pass"; editing = false; startFocus(ds.focusstart); }
  else if (ds.focusex !== undefined) { if (startFocus(currentPassDay().id)) focus.idx = +ds.focusex; }
  else if (ds.focusexit !== undefined) endFocus();
  else if (ds.focusgo !== undefined) focus.idx = Math.max(0, +ds.focusgo);
  else if (ds.step) stepSet(currentPassDay(), ds.ex, +ds.i, ds.step, +ds.dir);
  save();
  render();
  if (ds.focusgo !== undefined || ds.focusstart || ds.focusex !== undefined) window.scrollTo(0, 0);
});

"use strict";
// ---------- Fokusläge under passet ----------
// En övning i taget med stora knappar. Vikt och reps ändras med − och +, och siffran går också
// att trycka på för att skriva. Skärmen hålls tänd så länge fokusläget är öppet.
// Laddas före app.js; funktionerna härifrån anropas först när appen ritas.

let focus = null;   // { dayId, idx } medan fokusläget är öppet
let focusDailies = false;   // dailys visas i ett fönster ovanpå passet
let focusOrder = false;     // fönstret där övningarnas ordning ändras

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
  focusDailies = false; focusOrder = false;
  keepAwake(false);
}

// Efter ett avbockat set: är övningen klar går fokus vidare till nästa medan vilan räknar ned
// I ett superset växlar fokus till nästa övning i varvet, och efter varvet tillbaka till gruppens början
function focusAfterSet(d, idx = focus && focus.idx, i = 0) {
  if (!focus || focus.dayId !== d.id) return;
  const w = workoutOn(logDate(), d.id), g = ssGroup(d, focus.idx), from = focus.idx;
  if (g) {
    const next = ssNext(d, idx, i);
    if (next != null) focus.idx = next;
    else {
      const open = d.ex.findIndex((x, k) => k >= g[0] && k <= g[1] && !exDone(w, x));
      focus.idx = open >= 0 ? open : Math.min(g[1] + 1, d.ex.length - 1);
    }
  } else if (exDone(w, d.ex[focus.idx]) && focus.idx < d.ex.length - 1) focus.idx++;
  focus.scroll = focus.idx !== from ? "top" : "active";
  focus.sel = null;
}
// Anropas efter varje ritning: nästa set (eller nästa övning) hamnar i bild
function afterFocusRender() {
  fitBigNums();
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

// Stora − och + runt talet; talet går också att trycka på och skriva
function bigStepper(exId, i, f, val, hint, label, unit) {
  const btn = (dir, txt) => `<button class="bstep" data-step="${f}" data-ex="${exId}" data-i="${i}" data-dir="${dir}" aria-label="${txt} ${label.toLowerCase()}, set ${i + 1}">${icon(dir > 0 ? "plus" : "minus", 28)}</button>`;
  return `<section class="bigstep" aria-label="${label}"><span class="klabel">${label}</span>
    <div class="bigrow">${btn(-1, "Minska")}
      <label class="bignum"><input type="number" inputmode="${f === "kg" ? "decimal" : "numeric"}" step="${f === "kg" ? 0.25 : 1}" min="0" max="${setMax(exId, f)}"
        value="${val ?? ""}" placeholder="${hint ?? ""}" data-set="${exId}" data-i="${i}" data-f="${f}" aria-label="${label}, set ${i + 1}">${unit ? `<span>${unit}</span>` : ""}</label>
      ${btn(1, "Öka")}</div></section>`;
}

function fitBigNums() {
  for (const el of document.querySelectorAll(".bignum input")) el.style.width = `${Math.max(1, String(el.value || el.placeholder).length) + 0.4}ch`;
}
document.addEventListener("input", ev => { if (ev.target.closest && ev.target.closest(".bignum")) fitBigNums(); });

const restText = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

function focusView() {
  const d = dayById(focus.dayId);
  if (!d || !d.ex.length) { endFocus(); return VIEWS.pass(); }
  focus.idx = Math.min(focus.idx, d.ex.length - 1);
  const ex = d.ex[focus.idx], w = workoutOn(logDate(), d.id);
  const sets = (w && w.sets[ex.id]) || [], prev = lastSets(ex.id), target = todayTarget(ex);
  const bw = !!EX[ex.id].bw, timed = isTimed(ex.id);
  let active = -1;
  for (let i = 0; i < ex.sets; i++) if (!(sets[i] && sets[i].ok)) { active = i; break; }
  // Det valda setet ändras med de stora knapparna: nästa ej klara, eller det man tryckt på i listan
  const sel = focus.sel != null && focus.sel < ex.sets ? focus.sel : active;
  const s = sel >= 0 ? sets[sel] || {} : {}, h = sel >= 0 ? liveHint(d, ex, sel) : {};
  const fields = sel < 0 ? "" : (() => {
    // Första gången finns inget förslag: 0 kg och nedre delen av repsintervallet som utgångsläge
    const kg = bigStepper(ex.id, sel, "kg", s.kg, h.kg || 0, bw ? "Extra vikt" : "Vikt", "kg");
    const reps = bigStepper(ex.id, sel, "reps", s.reps, h.reps || repRange(ex.reps).lo || "", timed ? "Sekunder" : "Reps", timed ? "s" : "");
    // Stretch hålls en viss tid; ingen vikt
    return EX[ex.id].cat === "stretch" ? reps : bw ? reps + kg : kg + reps;
  })();
  const setRows = Array.from({ length: ex.sets }, (_, i) => {
    const st = sets[i] || {}, p = prev ? hintSet(prev, i) : null;
    const last = p && hasData(p) ? fmtSet({ kg: +p.kg || 0, reps: +p.reps || 0 }, ex.id) : "";
    const val = st.ok && hasData(st) ? fmtSet({ kg: +st.kg || 0, reps: +st.reps || 0 }, ex.id) : last ? `förra: ${last}` : "";
    return `<li class="fset ${st.ok ? "done" : ""} ${i === sel ? "active" : ""}">
      <button class="fcheck ${st.ok ? "on" : ""}" data-ok="${ex.id}" data-i="${i}" aria-pressed="${!!st.ok}" aria-label="Set ${i + 1} klart">${icon("check", 14)}</button>
      <button class="fsel" data-fsel="${i}" aria-label="Välj set ${i + 1}"><span>Set ${i + 1}</span><span class="${st.ok ? "" : "muted"}">${val}</span></button></li>`;
  }).join("");
  const g = ssGroup(d, focus.idx), next = d.ex[focus.idx + 1];
  const ss = g ? `<div class="sstabs" role="tablist" aria-label="Superset">${d.ex.slice(g[0], g[1] + 1).map((x, k) =>
      `<button role="tab" aria-selected="${g[0] + k === focus.idx}" class="${g[0] + k === focus.idx ? "on" : ""}" data-focusgo="${g[0] + k}"><b>${String.fromCharCode(65 + ssIndex(d, g[0]))}${k + 1}</b> ${esc(EX[x.id].name)}</button>`).join("")}</div>
      <button class="sslink2" data-ss="${d.id}" data-idx="${focus.idx === g[1] ? focus.idx - 1 : focus.idx}">Sluta köra som superset</button>`
    : focus.ssPick ? (() => {
        // Välj vilken övning som körs ihop med den här; den flyttas till direkt efter
        const free = d.ex.map((x, k) => ({ x, k })).filter(({ k }) => k !== focus.idx && !ssGroup(d, k));
        return `<div class="sspick"><div class="row between"><span class="muted small">Kör ihop med</span><button class="small ghost" data-sspick aria-label="Avbryt">${icon("close", 18)}</button></div>
          <div class="chips">${free.map(({ x, k }) => `<button data-sspair="${k}">${esc(EX[x.id].name)}</button>`).join("") || `<span class="muted small">Alla andra övningar ingår redan i ett superset.</span>`}</div></div>`;
      })()
    : d.ex.length > 1 ? `<button class="ssmake" data-sspick>${icon("plus", 14)}Gör superset</button>` : "";
  // Byt ut övningen, till exempel när maskinen är upptagen
  const swapBtn = `<button class="ssmake" data-fswap="${focus.idx}">${icon("swap", 14)}Byt övning</button>`;
  const actions = focus.ssPick ? ss : ss.startsWith('<button class="ssmake"') || !ss ? `<div class="factions">${ss}${swapBtn}</div>` : `${ss}<div class="factions">${swapBtn}</div>`;
  const prevTop = prev && topSet(prev);
  const tip = target ? `${prevTop ? `Förra gången ${fmtSet({ kg: +prevTop.kg || 0, reps: +prevTop.reps || 0 }, ex.id)}. ` : ""}Prova <b>${fmtTarget(target, ex.id)}</b>.`
    : `Första gången: välj en vikt du klarar ${esc(ex.reps)} ${timed ? "sekunder" : "gånger"}.`;
  const allDone = active < 0;
  const resting = rest.el && rest.end > Date.now();
  const restBox = restSettings().on ? `<div class="frest ${resting ? "on" : ""}" aria-label="Vilotimer">${icon("timer", 18)}<span class="frest-time">${restText(resting ? Math.ceil((rest.end - Date.now()) / 1000) : restFor(ex.id))}</span></div>` : "";
  const main = allDone
    ? next ? `<button class="primary grow" data-focusgo="${focus.idx + 1}">Nästa: ${esc(EX[next.id].name)}</button>`
      : w && w.done ? `<button class="primary grow" data-focusexit>Passet är sparat</button>`
      : `<button class="primary grow" data-finish="${d.id}" data-focusend>Spara passet</button>`
    : sets[sel] && sets[sel].ok ? `<button class="primary grow" data-fsel="${active}">Till set ${active + 1}</button>`
    : `<button class="primary grow" data-ok="${ex.id}" data-i="${sel}">Klart set ${sel + 1}</button>`;
  const dDone = S.daily.filter(e => dailyDone(logDate(), e.id)).length;
  return `<div class="focus">
    <header class="fhead"><button class="roundbtn" data-focusexit aria-label="Tillbaka till passet">${icon("left", 20)}</button>
      <span class="muted small grow">Övning ${focus.idx + 1} av ${d.ex.length} · ${esc(TYPES[d.type] ? TYPES[d.type].label : d.name)}</span>
      ${d.ex.length > 1 ? `<button class="small ghost" data-forder>Ändra ordning</button>` : ""}</header>
    ${stepRow(d, w)}
    <div class="ftitle"><div class="grow"><h2>${esc(EX[ex.id].name)}</h2>
      <div class="muted">${allDone ? "Alla set klara" : `Set ${sel + 1} av ${ex.sets} · mål ${esc(ex.reps)}${timed ? "" : " reps"}`}</div></div>
      <button class="thumb dt" data-info="${ex.id}" aria-label="Visa hur ${esc(EX[ex.id].name)} görs">${figure(ex.id)}</button></div>
    ${actions}
    <div class="ftip">${icon("trend", 18)}<span>${tip}</span></div>
    ${fields}
    <ol class="fsets" aria-label="Set">${setRows}</ol>
    <div class="row fsetcount"><button class="small ghost" data-setcount="-1" data-ex="${ex.id}" ${ex.sets > 1 ? "" : "disabled"}>− Set</button>
      <button class="small ghost" data-setcount="1" data-ex="${ex.id}">+ Set</button>
      ${!next && !allDone && !(w && w.done) ? `<button class="small ghost fsave" data-finish="${d.id}" data-focusend>Spara passet</button>` : ""}</div>
    ${S.daily.length ? `<button class="ghost fdaily" data-fdopen aria-label="Dailys, ${dDone} av ${S.daily.length} klara">Dailys · ${dDone} av ${S.daily.length} klara${icon("up", 14)}</button>` : ""}
    <div class="fbar">${restBox ? `<div class="frestctl" role="group" aria-label="Vila"><button class="small" data-restadd="-15">−15</button>
      <button class="small" data-restadd="15">+15</button><button class="small" data-restskip>Klar</button></div>` : ""}
      <div class="fbar-row">${restBox}${main}</div></div>
  </div>${focusDailies ? `<div class="overlay" data-fdclose><div class="sheet">
    <div class="row between"><span class="muted small">Fläta in i passet</span><button class="small ghost iconbtn" data-fdclose aria-label="Stäng">${icon("close", 18)}</button></div>
    ${dailiesCard(true)}<button class="wide" data-fdclose style="margin-top:14px">Tillbaka till passet</button></div></div>` : ""}${focusOrder ? orderSheet(d, w) : ""}`;
}
// Övningarna som små knappar som radbryts. Med många övningar visas sju runt den aktuella och resten bakom "+N".
function stepRow(d, w) {
  const n = d.ex.length, MAX = 8, all = n <= MAX || focus.allSteps;
  const from = all ? 0 : Math.max(0, Math.min(focus.idx - 3, n - (MAX - 1))), to = all ? n : from + MAX - 1;
  const chip = k => { const x = d.ex[k], done = exDone(w, x);
    return `<button data-focusgo="${k}" class="${k === focus.idx ? "on" : ""} ${done ? "done" : ""}" ${k === focus.idx ? 'aria-current="step"' : ""}>
      <span class="fn">${done ? icon("check", 11) : k + 1}</span><span class="nm">${esc(EX[x.id].name)}</span></button>`; };
  const chips = Array.from({ length: to - from }, (_, i) => chip(from + i)).join("");
  const more = n <= MAX ? "" : focus.allSteps ? `<button class="fmore" data-fstepsall>Visa färre</button>`
    : `<button class="fmore" data-fstepsall aria-label="Visa alla ${n} övningar">+${n - (to - from)}</button>`;
  return `<div class="fsteps" role="group" aria-label="Övningar i passet">${chips}${more}</div>`;
}
// Passets ordning: pilar flyttar en övning ett steg upp eller ned
function orderSheet(d, w) {
  return `<div class="overlay" data-forderclose><div class="sheet"><div class="row between"><h2>Ordning</h2>
      <button class="small ghost iconbtn" data-forderclose aria-label="Stäng">${icon("close", 18)}</button></div>
    <ol class="forder">${d.ex.map((x, k) => `<li class="${k === focus.idx ? "on" : ""}"><span class="fn">${exDone(w, x) ? icon("check", 12) : k + 1}</span>
      <span class="grow">${esc(EX[x.id].name)}</span>
      <button class="small ghost iconbtn" data-fmove="${k}" data-dir="-1" aria-label="Flytta ${esc(EX[x.id].name)} upp" ${k ? "" : "disabled"}>${icon("up", 18)}</button>
      <button class="small ghost iconbtn" data-fmove="${k}" data-dir="1" aria-label="Flytta ${esc(EX[x.id].name)} ned" ${k < d.ex.length - 1 ? "" : "disabled"}>${icon("down", 18)}</button></li>`).join("")}</ol>
    ${d.ex.some(x => x.ss) ? `<div class="muted small" style="margin-top:8px">Flyttar du en övning i ett superset bryts supersetet.</div>` : ""}
    <button class="primary wide" data-forderclose style="margin-top:14px">Klar</button></div></div>`;
}
// Bokstaven för ett superset: A för passets första, B för nästa …
function ssIndex(d, start) {
  let n = 0;
  for (let i = 0; i < start; i++) { const g = ssGroup(d, i); if (g && g[0] === i) n++; }
  return n;
}

// Passet i Träna: en numrerad rad per övning med mål, förra gången och hur många set som är klara.
// Tryck på en rad för att öppna fokusläget på just den övningen.
function passOverview(d, w) {
  const next = w && !w.done ? d.ex.findIndex(x => !exDone(w, x)) : 0;
  return `<ol class="exlist">
    ${d.ex.map((ex, i) => {
      const sets = (w && w.sets[ex.id]) || [], n = sets.filter(x => x && x.ok).length, all = exDone(w, ex);
      const prev = lastSets(ex.id), top = prev && topSet(prev);
      const g = ssGroup(d, i), pos = g ? (i === g[0] ? "first" : i === g[1] ? "last" : "mid") : "";
      return `<li><button class="exrow2 ${all ? "done" : ""} ${g ? `ss ss-${pos}` : ""}" data-focusex="${i}">
        <span class="exnum ${i === next && !all ? "next" : ""}">${all ? icon("check", 16) : i + 1}</span>
        <span class="grow"><b>${esc(EX[ex.id].name)}</b><span class="muted small">${g ? `<span class="sstag">${String.fromCharCode(65 + ssIndex(d, g[0]))}${i - g[0] + 1}</span> · ` : ""}${ex.sets} × ${esc(ex.reps)}${top ? ` · förra: ${fmtSet({ kg: +top.kg || 0, reps: +top.reps || 0 }, ex.id)}` : ""}</span></span>
        <span class="setcount ${all ? "ok" : ""}">${n}/${ex.sets}</span></button></li>`;
    }).join("")}
  </ol>`;
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
  const t = ev.target.closest("[data-step],[data-focusgo],[data-focusexit],[data-focusend],[data-focusstart],[data-focusex],[data-fdopen],[data-fdclose],[data-fsel],[data-sspick],[data-sspair],[data-forder],[data-forderclose],[data-fmove],[data-fstepsall],[data-fswap]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset;
  if (ds.fdopen !== undefined || ds.fdclose !== undefined) { focusDailies = ds.fdopen !== undefined; dailyEditing = false; render(); return; }
  if (ds.fswap !== undefined) { modal = { pick: focus.dayId, replace: +ds.fswap, today: true }; render(); filterPicker(); return; }
  if (ds.fstepsall !== undefined) { focus.allSteps = !focus.allSteps; render(); return; }
  if (ds.forder !== undefined || ds.forderclose !== undefined) { focusOrder = ds.forder !== undefined; render(); return; }
  if (ds.fmove !== undefined) {
    // Byter plats med grannen; ett superset som berörs bryts. Fokus stannar på samma övning.
    const d = dayById(focus.dayId), a = Math.min(+ds.fmove, +ds.fmove + +ds.dir), b = a + 1;
    if (a < 0 || b >= d.ex.length) return;
    const cur = d.ex[focus.idx];
    for (const i of [a - 1, a, b]) if (d.ex[i]) d.ex[i].ss = false;
    [d.ex[a], d.ex[b]] = [d.ex[b], d.ex[a]];
    focus.idx = d.ex.indexOf(cur);
    save(); render(); return;
  }
  if (ds.focusend !== undefined) { endFocus(); return; }   // själva sparandet sköts av data-finish
  if (ds.focusstart) { tab = "pass"; editing = false; startFocus(ds.focusstart); }
  else if (ds.focusex !== undefined) { if (startFocus(currentPassDay().id)) focus.idx = +ds.focusex; }
  else if (ds.focusexit !== undefined) endFocus();
  else if (ds.focusgo !== undefined) { focus.idx = Math.max(0, +ds.focusgo); focus.sel = null; focus.ssPick = false; }
  else if (ds.fsel !== undefined) focus.sel = +ds.fsel;
  else if (ds.sspick !== undefined) focus.ssPick = !focus.ssPick;
  else if (ds.sspair !== undefined) {
    // Den valda övningen flyttas till direkt efter den här och kopplas ihop med den
    const d = dayById(focus.dayId), k = +ds.sspair, [x] = d.ex.splice(k, 1);
    if (k < focus.idx) focus.idx--;
    d.ex.splice(focus.idx + 1, 0, x);
    d.ex[focus.idx].ss = true;
    focus.ssPick = false;
  }
  else if (ds.step) stepSet(currentPassDay(), ds.ex, +ds.i, ds.step, +ds.dir);
  save();
  render();
  if (ds.focusgo !== undefined || ds.focusstart || ds.focusex !== undefined) window.scrollTo(0, 0);
});

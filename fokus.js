"use strict";
// ---------- Fokusläge under passet ----------
// En övning i taget med stora knappar. Vikt och reps ändras med − och +, och siffran går också
// att trycka på för att skriva. Skärmen hålls tänd så länge fokusläget är öppet.
// Laddas före app.js; funktionerna härifrån anropas först när appen ritas.

let focus = null;   // { dayId, idx, start, suspended? }; passet finns kvar även när man byter flik
let focusDailies = false;   // dailys visas i ett fönster ovanpå passet
let focusOrder = false;     // fönstret där övningarnas ordning ändras

function startFocus(dayId) {
  const d = dayById(dayId);
  if (!d || !d.ex.length) return false;
  const w = workoutOn(logDate(), d.id);
  focus = { dayId, idx: Math.max(0, d.ex.findIndex(x => !exDone(w, x))), start: (w && w.start) || Date.now() };
  chosenDay = dayId;
  keepAwake(true);
  return true;
}
function endFocus() {
  focus = null;
  focusDailies = false; focusOrder = false; focusEnd = false;
  keepAwake(false);
}

// Efter ett avbockat set: är övningen klar går fokus vidare till nästa medan vilan räknar ned
// I ett superset växlar fokus till nästa övning i varvet, och efter varvet tillbaka till gruppens början
function focusAfterSet(d, idx = focus && focus.idx, i = 0) {
  if (editDate || !focus || focus.suspended || focus.dayId !== d.id) return;
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
  if (!focus || !focus.scroll || tab !== "pass" || editDate || focus.suspended) return;
  const where = focus.scroll;
  focus.scroll = null;
  if (where === "top") window.scrollTo(0, 0);
  else { const a = document.querySelector(".fset.active"); if (a && a.scrollIntoView) a.scrollIntoView({ block: "nearest" }); }
}

// Stegstorlek: hantlar 2 kg, annars 2,5 kg; reps 1; sekunder 5
const stepFor = (exId, f) => f === "kg" ? (EX[exId].hold === "db" ? 2 : 2.5) : isTimed(exId) ? 5 : 1;

// ---------- Uppvärmning ----------
// Lättare set före arbetsseten (ex.warm st). De loggas i w.warm och räknas inte i statistiken eller i om passet är klart.
const warmCount = ex => Math.max(0, Math.min(5, +ex.warm || 0));
const warmSets = (w, exId) => (w && w.warm && w.warm[exId]) || [];
function warmAt(d, exId, i) {
  const w = workoutFor(d), all = w.warm || (w.warm = {}), a = all[exId] || (all[exId] = []);
  return (a[i] = a[i] || {});
}
// Förslag: en stegring upp mot arbetsvikten (40–80 %), avrundat till viktsteget. Sista uppvärmningen har färre reps.
function warmHint(d, ex, i) {
  const n = warmCount(ex), work = +liveHint(d, ex, 0).kg || 0, step = stepFor(ex.id, "kg");
  const frac = n <= 1 ? 0.6 : 0.4 + 0.4 * i / (n - 1);
  const kg = work ? Math.max(0, Math.round(work * frac / step) * step) : "";
  return { kg, reps: n > 1 && i === n - 1 ? 5 : 8 };
}

function stepSet(d, exId, i, f, dir, warm = false) {
  const ex = d.ex.find(x => x.id === exId);
  const s = warm ? warmAt(d, exId, i) : setAt(d, exId, i), hint = warm ? warmHint(d, ex, i) : liveHint(d, ex, i);
  // Ett tomt fält visar förslaget (dagens mål eller förra gången); stegen utgår från det
  const cur = s[f] === undefined || s[f] === "" ? +hint[f] || 0 : +s[f];
  const next = cur + dir * stepFor(exId, f);
  s[f] = clampSet(exId, f, f === "kg" ? Math.round(next * 4) / 4 : Math.round(next));
}

// Stora − och + runt talet; talet går också att trycka på och skriva
function bigStepper(exId, i, f, val, hint, label, unit, warm = false) {
  const w = warm ? ' data-w="1"' : "";
  const btn = (dir, txt) => `<button class="bstep" data-step="${f}" data-ex="${exId}" data-i="${i}"${w} data-dir="${dir}" aria-label="${txt} ${label.toLowerCase()}, ${warm ? "uppvärmning" : "set"} ${i + 1}">${icon(dir > 0 ? "plus" : "minus", 26)}</button>`;
  return `<section class="bigstep" aria-label="${label}">
    <div class="bigrow">${btn(-1, "Minska")}
      <label class="bignum"><input type="number" inputmode="${f === "kg" ? "decimal" : "numeric"}" step="${f === "kg" ? 0.25 : 1}" min="0" max="${setMax(exId, f)}"
        value="${val ?? ""}" placeholder="${hint ?? ""}" data-set="${exId}" data-i="${i}"${w} data-f="${f}" aria-label="${label}, ${warm ? "uppvärmning" : "set"} ${i + 1}"><span class="klabel">${unit || label}</span></label>
      ${btn(1, "Öka")}</div></section>`;
}

function fitBigNums() {
  for (const el of document.querySelectorAll(".bignum input")) el.style.width = `${Math.max(1, String(el.value || el.placeholder).length) + 0.4}ch`;
}
document.addEventListener("input", ev => { if (ev.target.closest && ev.target.closest(".bignum")) fitBigNums(); });

const restText = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
// Passets klocka: tiden sedan passet startade
function clockText(ms) {
  const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}` : `${m}:${String(s % 60).padStart(2, "0")}`;
}
setInterval(() => {
  for (const el of document.querySelectorAll(".ftimer[data-start]")) el.textContent = clockText(Date.now() - +el.dataset.start);
}, 1000);

let focusEnd = false;   // fönstret Avsluta passet

function focusView() {
  const d = dayById(focus.dayId);
  if (!d || !d.ex.length) { endFocus(); return VIEWS.pass(); }
  focus.idx = Math.min(focus.idx, d.ex.length - 1);
  const ex = d.ex[focus.idx], w = workoutOn(logDate(), d.id);
  const sets = (w && w.sets[ex.id]) || [], warm = warmSets(w, ex.id), nW = warmCount(ex);
  const prev = lastSets(ex.id), target = todayTarget(ex);
  const bw = !!EX[ex.id].bw, timed = isTimed(ex.id), stretch = EX[ex.id].cat === "stretch";
  // Alla set i ordning: uppvärmningen först, sedan arbetsseten
  const all = [...Array.from({ length: nW }, (_, i) => ({ w: true, i })), ...Array.from({ length: ex.sets }, (_, i) => ({ w: false, i }))];
  const stOf = s => (s.w ? warm[s.i] : sets[s.i]) || {};
  const active = all.findIndex(s => !stOf(s).ok);
  const sel = focus.sel != null && all[focus.sel] ? focus.sel : active;
  const g = ssGroup(d, focus.idx);
  const fmt = v => fmtSet2({ kg: +v.kg || 0, reps: +v.reps || 0 }, ex.id);
  const badge = s => s.w ? `U${s.i + 1}` : `${s.i + 1}`;
  const okAttrs = s => `data-ok="${ex.id}" data-i="${s.i}"${s.w ? ' data-w="1"' : ""}`;
  const rows = all.map((s, k) => {
    const v = stOf(s), h = s.w ? warmHint(d, ex, s.i) : liveHint(d, ex, s.i), p = !s.w && prev ? hintSet(prev, s.i) : null;
    const cls = `fset ${v.ok ? "done" : ""} ${s.w ? "warm" : ""} ${k === sel ? "active" : ""}`;
    if (k === sel) {
      const kg = bigStepper(ex.id, s.i, "kg", v.kg, h.kg || 0, bw ? "Extra vikt" : "Vikt", "kg", s.w);
      const reps = bigStepper(ex.id, s.i, "reps", v.reps, h.reps || repRange(ex.reps).lo || "", timed ? "Sekunder" : "Reps", timed ? "sek" : "reps", s.w);
      const fields = stretch ? reps : bw ? reps + kg : kg + reps;
      const note = s.w ? (hasData(h) ? `Förslag: ${fmt(h)}` : "Lättare set före") : p && hasData(p) ? `Förra gången: ${fmt(p)}` : "";
      const inRound = !s.w && g && ssNext(d, focus.idx, s.i) != null;
      const doneTxt = v.ok ? "" : s.w ? "Klar med uppvärmning" : g ? (inRound ? "Klar · nästa i varvet" : "Klar · vila efter varvet") : "Klar med set";
      const btn = v.ok
        ? (active >= 0 ? `<button class="wide fdone ghostbtn" data-fsel="${active}">Till ${all[active].w ? "uppvärmning" : "set"} ${badge(all[active])}</button>` : "")
        : `<button class="primary wide fdone" ${okAttrs(s)}>${doneTxt}</button>`;
      return `<li class="${cls}"><div class="fsethead"><button class="fcheck ${v.ok ? "on" : ""}" ${okAttrs(s)} aria-pressed="${!!v.ok}" aria-label="${s.w ? "Uppvärmning" : "Set"} ${s.i + 1} klart">${v.ok ? icon("check", 14) : `<span class="fb">${badge(s)}</span>`}</button>
        <b class="grow">${s.w ? `Uppvärmning ${s.i + 1}` : `Set ${s.i + 1}`}</b>${note ? `<span class="muted small">${note}</span>` : ""}</div>
        ${fields}${btn}</li>`;
    }
    const val = v.ok && hasData(v) ? fmt(v) : hasData(h) ? fmt(h) : "";
    return `<li class="${cls}"><button class="fcheck ${v.ok ? "on" : ""}" ${okAttrs(s)} aria-pressed="${!!v.ok}" aria-label="${s.w ? "Uppvärmning" : "Set"} ${s.i + 1} klart">${v.ok ? icon("check", 14) : `<span class="fb">${badge(s)}</span>`}</button>
      <button class="fsel" data-fsel="${k}" aria-label="Välj ${s.w ? "uppvärmning" : "set"} ${s.i + 1}"><span>${val}</span>${v.ok ? `<span class="fstate">${s.w ? "Uppvärmd" : "Klart"}</span>` : ""}</button></li>`;
  }).join("");
  // Superset: varvet man är på och övningarna i gruppen
  const round = g ? Math.min(...d.ex.slice(g[0], g[1] + 1).map(x => ((w && w.sets[x.id]) || []).filter(z => z && z.ok).length)) + 1 : 0;
  const rounds = g ? Math.max(...d.ex.slice(g[0], g[1] + 1).map(x => x.sets)) : 0;
  const ss = g ? `<section class="ssband" aria-label="Superset"><div class="row between"><span class="klabel sscap">${icon("swap", 14)}Superset · varv ${Math.min(round, rounds)} av ${rounds}</span>
      <button class="link small" data-ss="${d.id}" data-idx="${focus.idx === g[1] ? focus.idx - 1 : focus.idx}">Dela upp</button></div>
      <div class="sstabs" role="tablist" aria-label="Superset">${d.ex.slice(g[0], g[1] + 1).map((x, k) =>
      `<button role="tab" aria-selected="${g[0] + k === focus.idx}" class="${g[0] + k === focus.idx ? "on" : ""}" data-focusgo="${g[0] + k}"><b>${String.fromCharCode(65 + ssIndex(d, g[0]))}${k + 1}</b> ${esc(EX[x.id].name)}</button>`).join("")}</div></section>` : "";
  const ssPick = !g && focus.ssPick ? (() => {
    // Välj vilken övning som körs ihop med den här; den flyttas till direkt efter
    const free = d.ex.map((x, k) => ({ x, k })).filter(({ k }) => k !== focus.idx && !ssGroup(d, k));
    return `<div class="sspick"><div class="row between"><span class="muted small">Kör ihop med</span><button class="small ghost iconbtn" data-sspick aria-label="Avbryt">${icon("close", 18)}</button></div>
      <div class="chips">${free.map(({ x, k }) => `<button data-sspair="${k}">${esc(EX[x.id].name)}</button>`).join("") || `<span class="muted small">Alla andra övningar ingår redan i ett superset.</span>`}</div></div>`;
  })() : "";
  const prevTop = prev && topSet(prev);
  const tip = target ? `${prevTop ? `Förra gången ${fmt(prevTop)}. ` : ""}Prova <b>${fmtTarget(target, ex.id)}</b>.`
    : `Första gången: välj en vikt du klarar ${esc(String(ex.reps).replace(/-/g, "–"))} ${timed ? "sekunder" : "gånger"}.`;
  const allDone = active < 0;
  const resting = rest.el && rest.end > Date.now();
  const restBox = restSettings().on ? `<div class="frest ${resting ? "on" : ""}" aria-label="Vilotimer">${icon("timer", 18)}<span class="frest-time">${restText(resting ? Math.ceil((rest.end - Date.now()) / 1000) : restFor(ex.id))}</span></div>` : "";
  const nextIdx = g ? g[1] + 1 : focus.idx + 1, next = d.ex[nextIdx];
  const main = !allDone
    ? next ? `<button class="fnext grow" data-focusgo="${nextIdx}"><span class="klabel">Nästa</span><b>${esc(EX[next.id].name)} · ${repsText(next)}</b></button>`
      : `<button class="fnext grow" data-fend><span class="klabel">Sista övningen</span><b>Avsluta passet</b></button>`
    : next ? `<button class="primary grow" data-focusgo="${nextIdx}">Nästa: ${esc(EX[next.id].name)}</button>`
    : w && w.done ? `<button class="primary grow" data-finish="${d.id}" data-focusend>Avsluta pass</button>`
    : `<button class="primary grow" data-finish="${d.id}" data-focusend>Spara och avsluta</button>`;
  const dDone = S.daily.filter(e => dailyDone(logDate(), e.id)).length;
  const start = focus.start || Date.now();
  const tools = `<div class="ftools">
    <button class="chipbtn" data-setcount="-1" data-ex="${ex.id}" ${ex.sets > 1 ? "" : "disabled"} aria-label="Ett set färre">− Set</button>
    <button class="chipbtn" data-setcount="1" data-ex="${ex.id}" aria-label="Ett set till">+ Set</button>
    ${!g && d.ex.length > 1 ? `<button class="chipbtn ${focus.ssPick ? "on" : ""}" data-sspick>${icon("plus", 14)}Superset</button>` : ""}
    ${d.ex.length > 1 ? `<button class="chipbtn" data-forder>Ordning</button>` : ""}
    ${S.daily.length ? `<button class="chipbtn" data-fdopen aria-label="Dailys, ${dDone} av ${S.daily.length} klara">Dailys ${dDone} av ${S.daily.length}</button>` : ""}</div>`;
  return `<div class="focus">
    <header class="fhead"><button class="fhbtn" data-fend>Avsluta</button>
      <span class="fclock"><span class="klabel">${esc(d.name)}</span><b class="ftimer" data-start="${start}">${clockText(Date.now() - start)}</b></span>
      <button class="fhbtn" data-fswap="${focus.idx}">Byt övning</button></header>
    ${stepRow(d, w)}
    ${ss}
    <div class="ftitle"><button class="thumb dt finfo" data-info="${ex.id}" aria-label="Visa hur ${esc(EX[ex.id].name)} görs">${figure(ex.id)}<span class="ibadge" aria-hidden="true">i</span></button>
      <div class="grow"><span class="muted small">Övning ${focus.idx + 1} av ${d.ex.length} · ${repsText(ex)}${nW ? ` · +${nW} uppv.` : ""}</span>
      <h2>${esc(EX[ex.id].name)}</h2></div></div>
    <div class="ftip">${icon("trend", 16)}<span>${tip}</span></div>
    <ol class="fsets" aria-label="Set">${rows}</ol>
    ${allDone ? `<div class="fall">${icon("check", 16)}Alla set klara</div>` : ""}
    ${tools}${ssPick}
    <div class="fbar">${restBox ? `<div class="frestctl" role="group" aria-label="Vila"><button class="small" data-restadd="-15">−15</button>
      <button class="small" data-restadd="15">+15</button><button class="small" data-restskip>Klar</button></div>` : ""}
      <div class="fbar-row">${main}${restBox}</div></div>
  </div>${focusDailies ? `<div class="overlay" data-fdclose><div class="sheet">
    <div class="row between"><span class="muted small">Fläta in i passet</span><button class="small ghost iconbtn" data-fdclose aria-label="Stäng">${icon("close", 18)}</button></div>
    ${dailiesCard(true)}<button class="wide" data-fdclose style="margin-top:14px">Tillbaka till passet</button></div></div>` : ""}${focusOrder ? orderSheet(d, w) : ""}${focusEnd ? endSheet(d, w) : ""}`;
}
// Avsluta: spara passet, pausa det till senare eller fortsätta träna
function endSheet(d, w) {
  const logged = w && Object.values(w.sets).some(a => a.some(x => x && x.ok));
  const done = d.ex.filter(x => exDone(w, x)).length;
  const sets = w ? Object.values(w.sets).reduce((n, a) => n + a.filter(x => x && x.ok).length, 0) : 0;
  return `<div class="overlay" data-fendclose><div class="sheet endsheet" role="dialog" aria-label="Avsluta passet">
    <h2>Avsluta passet?</h2>
    <div class="muted">${logged ? `${done} av ${d.ex.length} övningar klara · ${sets} set` : "Inget set är loggat än."}</div>
    <div class="col endbtns">${logged ? `<button class="primary wide bigbtn" data-finish="${d.id}" data-focusend>${w && w.done ? "Avsluta pass" : "Spara och avsluta"}</button>` : ""}
      <button class="wide" data-focusexit>${logged ? "Pausa och fortsätt senare" : "Avbryt passet"}</button>
      <button class="ghost wide" data-fendclose>Fortsätt träna</button></div></div></div>`;
}
// Övningarna som rutor överst: klara med bock, den aktuella markerad, superset sammanlänkade.
// Upp till sex på en rad; fler delas på två rader. Med fler än åtta visas sju runt den aktuella och resten bakom "+N".
function stepRow(d, w) {
  const n = d.ex.length, MAX = 8, all = n <= MAX || focus.allSteps;
  const from = all ? 0 : Math.max(0, Math.min(focus.idx - 3, n - (MAX - 1))), to = all ? n : from + MAX - 1;
  const tile = k => { const x = d.ex[k], done = exDone(w, x), g = ssGroup(d, k);
    const ss = g ? ` ss ${k === g[0] ? "ss-first" : ""} ${k === g[1] ? "ss-last" : ""}` : "";
    return `<button data-focusgo="${k}" class="xs ${k === focus.idx ? "on" : ""} ${done ? "done" : ""}${ss}" ${k === focus.idx ? 'aria-current="step"' : ""}
      aria-label="${esc(EX[x.id].name)}${done ? ", klar" : ""}"><span class="fn">${done ? icon("check", 11) : k + 1}</span><span class="nm">${esc(EX[x.id].name)}</span></button>`; };
  const tiles = Array.from({ length: to - from }, (_, i) => tile(from + i)).join("");
  const more = n <= MAX ? "" : focus.allSteps ? `<button class="xs fmore" data-fstepsall>Färre</button>`
    : `<button class="xs fmore" data-fstepsall aria-label="Visa alla ${n} övningar">+${n - (to - from)}</button>`;
  const count = to - from + (more ? 1 : 0), cols = count <= 6 ? count : Math.ceil(count / 2);
  return `<div class="fsteps" role="group" aria-label="Övningar i passet" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${tiles}${more}</div>`;
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

// Passet: en numrerad rad per övning med set och reps, och förra gången till höger.
// Tryck på en rad för att öppna fokusläget på just den övningen.
function passOverview(d, w) {
  const next = w && !w.done ? d.ex.findIndex(x => !exDone(w, x)) : 0;
  return `<ol class="exlist">
    ${d.ex.map((ex, i) => {
      const sets = (w && w.sets[ex.id]) || [], n = sets.filter(x => x && x.ok).length, all = exDone(w, ex);
      const prev = lastSets(ex.id), top = prev && topSet(prev);
      const g = ssGroup(d, i), pos = g ? (i === g[0] ? "first" : i === g[1] ? "last" : "mid") : "";
      const right = n && !all ? `<span class="setcount">${n}/${ex.sets}</span>`
        : all ? `<span class="setcount ok">${icon("check", 16)}</span>`
        : top ? `<span class="exprev"><span class="muted small">Förra gången</span><b>${fmtSet2({ kg: +top.kg || 0, reps: +top.reps || 0 }, ex.id)}</b></span>` : "";
      return `<li>${g && i === g[0] ? `<div class="klabel sscap">${icon("swap", 13)}Superset</div>` : ""}<button class="exrow2 ${all ? "done" : ""} ${g ? `ss ss-${pos}` : ""}" data-focusex="${i}">
        <span class="exnum ${i === next && !all ? "next" : ""}">${all ? icon("check", 16) : i + 1}</span>
        <span class="grow"><b>${esc(EX[ex.id].name)}</b><span class="muted small">${g ? `<span class="sstag">${String.fromCharCode(65 + ssIndex(d, g[0]))}${i - g[0] + 1}</span> · ` : ""}${repsText(ex)}${warmCount(ex) ? ` <span class="warmtag">+${warmCount(ex)} uppv.</span>` : ""}</span></span>
        ${right}</button></li>`;
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
  const t = ev.target.closest("[data-step],[data-focusgo],[data-focusexit],[data-focusend],[data-focusstart],[data-focusex],[data-fdopen],[data-fdclose],[data-fsel],[data-sspick],[data-sspair],[data-forder],[data-forderclose],[data-fmove],[data-fstepsall],[data-fswap],[data-fend],[data-fendclose]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset;
  if (ds.fdopen !== undefined || ds.fdclose !== undefined) { focusDailies = ds.fdopen !== undefined; dailyEditing = false; render(); return; }
  if (ds.fswap !== undefined) { modal = { pick: focus.dayId, replace: +ds.fswap, today: true }; render(); filterPicker(); return; }
  if (ds.fend !== undefined || ds.fendclose !== undefined) { focusEnd = ds.fend !== undefined; render(); return; }
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
  else if (ds.fsel !== undefined) { focus.sel = +ds.fsel; focus.scroll = "active"; }
  else if (ds.sspick !== undefined) focus.ssPick = !focus.ssPick;
  else if (ds.sspair !== undefined) {
    // Den valda övningen flyttas till direkt efter den här och kopplas ihop med den
    const d = dayById(focus.dayId), k = +ds.sspair, [x] = d.ex.splice(k, 1);
    if (k < focus.idx) focus.idx--;
    d.ex.splice(focus.idx + 1, 0, x);
    d.ex[focus.idx].ss = true;
    focus.ssPick = false;
  }
  else if (ds.step) stepSet(currentPassDay(), ds.ex, +ds.i, ds.step, +ds.dir, ds.w !== undefined);
  save();
  render();
  if (ds.focusgo !== undefined || ds.focusstart || ds.focusex !== undefined) window.scrollTo(0, 0);
});

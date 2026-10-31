"use strict";
// ---------- Träna ----------
// Allt om passen på ett ställe: dagens pass, alla pass i upplägget som rutor, annan träning och dailys.
// Ett tryck på ett pass öppnar Passet (övningarna). Där startas passet och där ändras övningarna.
// Laddas före app.js; funktionerna anropas först när appen ritas.

let passOpen = false;   // Passet visas i stället för översikten
let editSnap = null;    // passets övningar när Ändra öppnades, för Avbryt
let exSheet = null;     // index för övningen vars blad är öppet när man ändrar
let ordna = false;      // pilar för att flytta övningarna
let trSheet = null;     // "dailys" när dailys är öppet ovanpå Träna

// Set och reps utskrivet: "4 set · 6–8 reps", "3 set · 10 per ben", "3 set · 45 s"
function repsText(ex) {
  const r = String(ex.reps || "").trim().replace(/(\d)\s*-\s*(\d)/g, "$1–$2");
  if (!r) return `${ex.sets} set`;
  if (isTimed(ex.id)) return `${ex.sets} set · ${r.replace(/\s*sek(under)?\b/, " s").replace(/\s*\/\s*/, " per ")}`;
  if (/[a-zåäö]/i.test(r)) return `${ex.sets} set · ${r.replace(/\s*\/\s*/, " per ")}`;
  return `${ex.sets} set · ${r} reps`;
}
// Ett set som "52,5 kg · 8 reps", "12 reps" eller "10 reps +10 kg"
function fmtSet2(b, id) {
  if (!b) return "–";
  const r = `${b.reps} ${repUnit(id)}`;
  if (!b.kg) return r;
  return EX[id].bw ? `${r} +${fmtNum(b.kg)} kg` : `${fmtNum(b.kg)} kg · ${r}`;
}

// Dagens pass: det man redan loggat idag, annars det som står på tur. En vilodag med fasta dagar visar nästa pass.
function todaysPass() {
  const active = focus && dayById(focus.dayId);
  if (active) return { d: active, w: workoutOn(TODAY, active.id), rest: false, active: true };
  const todays = workoutsOn(TODAY);
  if (todays.length) { const d = dayById(todays[todays.length - 1].dayId); if (d) return { d, w: workoutOn(TODAY, d.id), rest: false }; }
  if (isFixed() && !scheduledDay(TODAY)) { const nx = nextScheduled(TODAY); return { d: nx.day, w: null, rest: true, next: nx.date }; }
  const d = suggestedDay();
  return { d, w: workoutOn(TODAY, d.id), rest: false };
}
// Senaste faktiska träningsdagen denna vecka, även när den avviker från schemat.
const completedPassDate = d => weekDates(weekStart(TODAY)).reverse().find(x => x <= TODAY && (workoutOn(x, d.id) || {}).done);
function passLabel(t) {
  if (t.w && t.w.done) return "Genomfört idag";
  if (t.active || (t.w && Object.values(t.w.sets).some(a => a.some(x => x && x.ok)))) return "Pågående pass";
  return isFixed() && !t.rest ? "Dagens pass" : "Nästa pass";
}
const passMuscles = d => d.type === "custom" || !TYPES[d.type] ? "Dina egna övningar" : TYPES[d.type].muscles.replace(/, ([^,]*)$/, " & $1");

function ring(pct, size = 64, cls = "") {
  const r = 20, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct));
  return `<svg class="hring ${cls}" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><circle class="hring-bg" cx="24" cy="24" r="${r}"/>
    ${p ? `<circle class="hring-fg" cx="24" cy="24" r="${r}" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 24 24)"/>` : ""}</svg>`;
}

function traningView() {
  const t = todaysPass(), d = t.d, w = t.w, done = w && w.done, started = !done && (t.active || (w && Object.values(w.sets).some(a => a.some(x => x && x.ok))));
  const passes = weekSummary(weekStart(TODAY)).passes, n = S.plan.days.length;
  const dayCard = `<section class="card daypass" aria-label="${passLabel(t)}">
      <div class="row between"><span class="klabel accent">${t.rest ? `Vilodag · nästa ${WD_LONG[weekdayOf(t.next)]}` : passLabel(t)}</span>
        <button class="linkbtn2" data-seepass="${d.id}">Se övningar${icon("right", 14)}</button></div>
      <div><h2 class="passname">${esc(d.name)}</h2><div class="muted">${esc(passMuscles(d))} · ${d.ex.length} ${d.ex.length === 1 ? "övning" : "övningar"}</div></div>
      ${done ? `<div class="row between"><span class="passok">${icon("check", 16)}Genomfört idag</span><button class="small" data-seepass="${d.id}">Öppna passet</button></div>`
        : d.ex.length ? `<button class="primary wide bigbtn" data-focusstart="${d.id}">${icon("play", 18)}${started ? "Fortsätt" : t.rest ? "Kör ändå:" : "Starta"} ${esc(d.name)}</button>`
        : `<button class="wide" data-seepass="${d.id}">Lägg till övningar</button>`}</section>`;
  const status = (p, i) => {
    const completed = completedPassDate(p);
    if (completed) return `<span class="pst ok">${completed === TODAY ? "Genomfört idag" : `Genomfört · ${WD_LONG[weekdayOf(completed)]}`}</span>`;
    if (p === d && started) return `<span class="pst accent">Pågående</span>`;
    if (isFixed() && S.plan.weekdays[i] === weekdayOf(TODAY)) return `<span class="pst accent">Idag</span>`;
    if (!isFixed() && p === d) return `<span class="pst accent">På tur</span>`;
    return `<span class="pst">${isFixed() ? cap(WD_LONG[S.plan.weekdays[i]]) : `Pass ${i + 1}`}</span>`;
  };
  // Veckans pass som kort: grön bock när det är gjort, orange ram på det som står på tur
  const cols = n <= 3 ? n : n === 4 ? 2 : 3;
  const tiles = `<div class="wkcards" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${S.plan.days.map((p, i) => {
    const ok = !!completedPassDate(p), next = p === d && !t.rest && !ok;
    const c = completedPassDate(p), st = ok ? `<span class="pst ok">${c === TODAY ? "Klar idag" : `Klar · ${WD[weekdayOf(c)].toLowerCase()}`}</span>` : status(p, i);
    return `<button class="wkcard ${ok ? "ok" : next ? "next" : ""}" data-pick="${p.id}" aria-label="${esc(p.name)}"><span class="wkst"><span class="wkdot">${ok ? icon("check", 10) : ""}</span>${st}</span><b>${esc(p.name)}</b></button>`;
  }).join("")}</div>`;
  const acts = actsOn(TODAY);
  const row = (ic, title, sub, attrs, end = "right") => `<button class="h3-row" ${attrs}><span class="h3-ic">${icon(ic, 18)}</span><span class="grow"><b>${title}</b><small>${sub}</small></span>${icon(end, 18)}</button>`;
  return `<div class="muted small toplabel">Vecka ${weekNo(TODAY)} · ${passes} av ${S.plan.count} pass</div><h1>Träna</h1>
    ${dayCard}
    <div class="row between trprog"><span class="klabel">Veckans pass</span>
      <button class="linkbtn2" data-tab="upplagg">${esc(PROGRAMS[S.plan.program || "ppl"].name)}${icon("right", 14)}</button></div>
    ${tiles}
    <div class="klabel h3-sec">Mer</div>
    <section class="h3-list">
      ${row("search", "Övningsbibliotek", `${Object.keys(EX).length} övningar · sök och läs instruktioner`, "data-exlib")}
      ${row("upplagg", "Träningsupplägg", `${esc(PROGRAMS[S.plan.program || "ppl"].name)} · ${S.plan.count} pass i veckan`, 'data-tab="upplagg"')}
      ${row("aktivitet", "Annan träning", acts.length ? esc(acts.map(a => `${a.name} ${+a.min} min`).join(", ")) : "Padel, löpning, cykling …", `data-actnew="" data-actdate="${TODAY}"`, "plus")}
    </section>
    ${acts.length ? `<div class="homeacts">${acts.map((a, i) => `<button class="dchip on" data-actedit="${i}" data-actdate="${TODAY}">${icon("check", 16)}${esc(a.name)} · ${+a.min} min</button>`).join("")}</div>` : ""}
    ${trSheet === "dailys" ? dailysSheet() : ""}`;
}

// Övningsbiblioteket: alla övningar att bläddra bland, med samma kroppsdelar och passtyper som när man väljer övning
let exLib = null;   // { q, f } när biblioteket är öppet; f är "alla", en passtyp (push/pull/legs) eller en kroppsdel
function exLibView() {
  const f = exLib.f;
  const chips = [["alla", "Alla"], ...Object.entries(PASS_FILTER).map(([k, n]) => [k, n.split(":")[0]]), null, ...Object.entries(AREAS).map(([k, n]) => [k, n])];
  const groups = Object.keys(AREAS).map(a => {
    const ids = Object.keys(EX).filter(id => areaOf(id) === a);
    return ids.length ? `<section class="exlib-group" data-group="${a}"><div class="klabel h3-sec">${AREAS[a]}</div><div class="h3-list">${ids.map(id => `<button class="h3-row exlib-row" data-info="${id}" data-area="${a}" data-cat="${EX[id].cat}"
      data-q="${esc(norm(EX[id].name + " " + EX[id].muscles + " " + AREAS[a] + " " + (PASS_WORDS[EX[id].cat] || "")))}"><span class="thumb exl">${figure(id)}</span><span class="grow"><b>${esc(EX[id].name)}</b><small>${esc(EX[id].muscles)}</small></span>${icon("right", 18)}</button>`).join("")}</div></section>` : "";
  }).join("");
  return `<div class="exlib"><button class="backbtn" data-exlibclose>${icon("left", 18)}Träna</button><h1>Övningar</h1>
    <div class="psearch">${icon("search", 18)}<input id="exlibq" type="search" placeholder="Sök övning eller muskel" value="${esc(exLib.q)}" autocomplete="off" aria-label="Sök övning"></div>
    <div class="exlib-chips" role="radiogroup" aria-label="Visa">${chips.map(c => c ? `<button role="radio" class="${f === c[0] ? "on" : ""}" aria-checked="${f === c[0]}" data-exlibf="${c[0]}">${c[1]}</button>` : `<span class="exlib-sep" aria-hidden="true"></span>`).join("")}</div>
    <div class="muted small exlib-count" id="exlibn"></div>
    ${groups}<div class="muted exlib-none" hidden>Inga övningar matchar.</div></div>`;
}
// Sökning och filter utan att sidan ritas om, så att tangentbordet stannar
function filterExLib() {
  if (!exLib) return;
  const q = norm(exLib.q.trim()), f = exLib.f;
  let n = 0;
  for (const el of document.querySelectorAll(".exlib-row")) {
    const hit = (!q || el.dataset.q.includes(q)) && (f === "alla" || (PASS_FILTER[f] ? el.dataset.cat === f : el.dataset.area === f));
    el.hidden = !hit; if (hit) n++;
  }
  for (const g of document.querySelectorAll(".exlib-group")) g.hidden = !g.querySelector(".exlib-row:not([hidden])");
  const c = $("exlibn"); if (c) c.textContent = `${n} ${n === 1 ? "övning" : "övningar"}`;
  const none = document.querySelector(".exlib-none"); if (none) none.hidden = n > 0;
}
document.addEventListener("input", ev => { if (ev.target.id === "exlibq" && exLib) { exLib.q = ev.target.value; filterExLib(); } });
document.addEventListener("click", ev => {
  const b = ev.target.closest && ev.target.closest("[data-exlib],[data-exlibclose],[data-exlibf]");
  if (!b) return;
  if (b.dataset.exlib !== undefined) { exLib = { q: "", f: "alla" }; tab = "pass"; passOpen = false; window.scrollTo(0, 0); }
  else if (b.dataset.exlibclose !== undefined) exLib = null;
  else { exLib.f = b.dataset.exlibf; }
  render(); filterExLib();
});

function dailysSheet() {
  const n = S.daily.length, done = S.daily.filter(e => dailyDone(logDate(), e.id)).length;
  return `<div class="overlay" data-trsheet=""><div class="sheet dsheet" role="dialog" aria-label="Dailys">
    <div class="row between"><div><span class="klabel">Varje dag</span><h2 class="sheeth">Dailys</h2></div>${n ? `<span class="muted">${done} av ${n} idag</span>` : ""}</div>
    ${dailiesCard(true)}
    ${dailyEditing ? "" : `<div class="row sheetbtns">${n ? `<button class="grow" data-dedit>Ändra dailys</button>` : ""}<button class="grow primary" data-trsheet="">Klar</button></div>`}</div></div>`;
}

// Kort med musklerna i passet: gubben fram och bak och en förklaring av det som saknas
function muscleSummary(d) {
  if (!TYPES[d.type] || !targetsOf(d.type).length) return "";
  const status = muscleStatus(d.type, d.ex), allOk = status.every(s => s.state === "ok");
  const word = { ok: "", part: ", bara delvis", miss: " saknas" };
  return `<section class="card mcard msum" aria-label="Muskler i passet"><div class="mtop">
      <div class="mfigs">${muscleFigure(FIG_FRONT, status, "Framsida")}${muscleFigure(FIG_BACK, status, "Baksida")}</div>
      <div class="mlist"><div class="klabel">Muskler</div>
        ${status.map(s => `<div class="mrow"><span class="mdot ${s.state}" aria-hidden="true"><svg viewBox="0 0 24 24">${STATE_ICON[s.state]}</svg></span><span class="grow"><b class="${s.state === "ok" ? "" : "mdet " + s.state}">${s.label}${word[s.state]}</b></span></div>`).join("")}
        <div class="mrec small ${allOk ? "ok" : ""}">${muscleAdvice(d.type, status)}</div></div></div></section>`;
}

function passetView(d) {
  const w = workoutOn(logDate(), d.id), i = S.plan.days.indexOf(d);
  const done = d.ex.filter(x => exDone(w, x)).length, logged = w && Object.values(w.sets).some(a => a.some(hasData));
  const sets = d.ex.reduce((a, x) => a + (+x.sets || 0), 0);
  const when = isFixed() ? cap(WD_LONG[S.plan.weekdays[i]]) : `Pass ${i + 1} av ${S.plan.days.length}`;
  const bottom = !d.ex.length ? ""
    : w && w.done ? `<div class="card done-card"><b>${icon("check", 16)}Bra jobbat, passet är sparat!</b>
        <div class="muted small">Det räknas in i veckans pass och jämförelsen med förra veckan.</div>
        <button class="small" style="margin-top:8px" data-finish="${d.id}">Öppna passet igen</button></div>`
    : logged ? `<button class="primary wide bigbtn" data-focusstart="${d.id}">${icon("play", 18)}Fortsätt ${esc(d.name)}</button>
        <button class="wide" data-finish="${d.id}">Spara passet · ${done} av ${d.ex.length} klara</button>
        <div class="muted small finish-note">Passet räknas även om du inte hunnit alla övningar.</div>`
    : `<button class="primary wide bigbtn stickcta" data-focusstart="${d.id}">${icon("play", 18)}Starta ${esc(d.name)}</button>`;
  return `<div class="row between pvtop"><button class="backbtn" data-passback>${icon("left", 18)}Träna</button>
      <button class="pillbtn" data-edit>${icon("edit", 16)}Ändra</button></div>
    <div class="klabel accent">${when}</div>
    <h1 class="passname big">${esc(d.name)}</h1>
    <div class="muted pvsub">${esc(passMuscles(d))} · ${d.ex.length} ${d.ex.length === 1 ? "övning" : "övningar"}${sets ? ` · ${sets} set · ~${Math.max(5, Math.round(sets * 2.5 / 5) * 5)} min` : ""}</div>
    ${muscleSummary(d)}
    ${d.ex.length ? `<div class="klabel sechead">Övningar</div>${passOverview(d, w)}`
      : `<div class="card empty"><b>Passet har inga övningar än.</b><button class="primary wide" style="margin-top:12px" data-edit>Lägg till övningar</button></div>`}
    ${bottom}${w && !w.end ? `<button class="ghost wide dangertext" data-passcancel="${d.id}">Avbryt passet utan att spara</button>` : ''}`;
}

// Ändra övningar: kroppen med musklerna överst, sedan övningarna. Ett tryck öppnar övningens blad.
function startEdit(d) {
  editSnap = d ? { id: d.id, ex: JSON.stringify(d.ex), name: d.name, named: d.named } : null;
  exSheet = null; ordna = false;
}
function editView(d) {
  const list = d.ex;
  const rows = list.map((e, i) => {
    const g = ssGroup(d, i), first = g && i === g[0], last = g && i === g[1];
    const sub = `${repsText(e)}${warmCount(e) ? ` · <span class="warmtag">+${warmCount(e)} uppvärmning</span>` : ""}`;
    const body = `<span class="grow"><b>${esc(EX[e.id].name)}</b><span class="muted small">${sub}</span></span>`;
    const row = ordna
      ? `<div class="erow ${g ? "ss" : ""}">${body}<button class="iconbtn small ghost" data-mv="-1" data-t="${d.id}" data-idx="${i}" ${i ? "" : "disabled"} aria-label="Flytta ${esc(EX[e.id].name)} upp">${icon("up", 18)}</button>
          <button class="iconbtn small ghost" data-mv="1" data-t="${d.id}" data-idx="${i}" ${i < list.length - 1 ? "" : "disabled"} aria-label="Flytta ${esc(EX[e.id].name)} ned">${icon("down", 18)}</button></div>`
      : `<button class="erow ${g ? "ss" : ""}" data-exsheet="${i}">${body}<span class="chev">${icon("right", 18)}</span></button>`;
    return `${first ? `<div class="ssgroup"><div class="klabel sscap">${icon("swap", 13)}Superset</div>` : ""}${row}${last ? "</div>" : ""}`;
  }).join("");
  return `<div class="row between pvtop"><button class="backbtn" data-editcancel>Avbryt</button><span class="klabel accent">${esc(d.name)}</span><span class="pvspace"></span></div>
    <h1>Ändra övningar</h1>
    ${d.type === "custom" ? `<label class="field namefield">Namn på passet<input value="${esc(d.name)}" data-passname="${d.id}" placeholder="T.ex. Bröst & triceps"></label>` : ""}
    ${muscleCard(d.id, d.type, d.ex)}
    <div class="row between sechead"><span class="klabel">${list.length} ${list.length === 1 ? "övning" : "övningar"}${ordna ? "" : " · tryck för att ändra"}</span>
      ${list.length > 1 ? `<button class="linkbtn2" data-ordna>${ordna ? "Klar" : "Ordna"}</button>` : ""}</div>
    ${list.length ? `<div class="card elist">${rows}</div>` : ""}
    <button class="addbtn" data-openpick="${d.id}">${icon("plus", 18)}Lägg till övning</button>
    <button class="primary wide bigbtn stickcta" data-edit>Spara</button>`;
}

function exSheetView(d) {
  const i = exSheet, e = d.ex[i], g = e.ss;
  const step = (f, label, val, min, max, sub = "", warm = false) => `<div class="exset"><span class="grow col"><span>${label}</span>${sub ? `<span class="muted small">${sub}</span>` : ""}</span>
    <button class="stp" data-exstep="${f}" data-dir="-1" ${+val <= min ? "disabled" : ""} aria-label="${label}: färre">${icon("minus", 20)}</button>
    <span class="exval ${warm ? "warm" : ""}">${val}</span>
    <button class="stp" data-exstep="${f}" data-dir="1" ${+val >= max ? "disabled" : ""} aria-label="${label}: fler">${icon("plus", 20)}</button></div>`;
  const next = d.ex[i + 1];
  return `<div class="overlay" data-exsheetclose><div class="sheet exsheet" role="dialog" aria-label="${esc(EX[e.id].name)}">
    <div class="row exhead">${thumb(e.id, "dt")}<div class="grow"><b class="exname">${esc(EX[e.id].name)}</b>${muscleLine(e.id)}</div></div>
    ${step("sets", "Set", e.sets, 1, 10)}
    <div class="exset"><span class="grow">${isTimed(e.id) ? "Sekunder per set" : "Reps per set"}</span>
      <button class="stp" data-exstep="reps" data-dir="-1" aria-label="Färre reps">${icon("minus", 20)}</button>
      <input class="exval exreps" type="text" inputmode="numeric" value="${esc(String(e.reps).replace(/(\d)\s*-\s*(\d)/g, "$1–$2"))}" data-ed="${i}" data-t="${d.id}" data-f="reps" aria-label="Reps per set">
      <button class="stp" data-exstep="reps" data-dir="1" aria-label="Fler reps">${icon("plus", 20)}</button></div>
    ${step("warm", "Uppvärmning", warmCount(e), 0, 5, "Lättare set före", true)}
    ${next ? `<div class="exset"><span class="grow col"><span>Superset med nästa</span><span class="muted small">${esc(EX[next.id].name)}, växelvis utan vila</span></span>
      <button class="swbtn ${g ? "on" : ""}" role="switch" aria-checked="${!!g}" data-ss="${d.id}" data-idx="${i}" aria-label="Superset med ${esc(EX[next.id].name)}"></button></div>` : ""}
    <div class="col exbtns">
      <button class="wide" data-swap="${d.id}" data-idx="${i}">${icon("swap", 18)}Byt övning</button>
      <button class="ghost wide dangertext" data-xdel="${d.id}" data-idx="${i}">Ta bort ur passet</button>
      <button class="wide lightbtn" data-exsheetclose>Klar</button></div></div></div>`;
}
// Reps stegas med alla tal i texten: "6–8" blir "7–9", "45 s" blir "50 s"
function stepReps(r, dir, id) {
  const s = /\d/.test(String(r || "")) ? String(r) : "10";
  return s.replace(/\d+/g, n => String(Math.max(1, +n + dir * (isTimed(id) ? 5 : 1))));
}

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-seepass],[data-passback],[data-editcancel],[data-exsheet],[data-exsheetclose],[data-exstep],[data-ordna],[data-trsheet]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset;
  if (ds.seepass !== undefined) { tab = "pass"; chosenDay = ds.seepass || currentPassDay().id; passOpen = true; editing = false; window.scrollTo(0, 0); }
  else if (ds.passback !== undefined) { passOpen = false; chosenDay = null; window.scrollTo(0, 0); }
  else if (ds.editcancel !== undefined) {
    const d = editSnap && dayById(editSnap.id);
    if (d) { d.ex = JSON.parse(editSnap.ex); d.name = editSnap.name; if (editSnap.named) d.named = true; else delete d.named; }
    editing = false; editSnap = null; exSheet = null; ordna = false;
  }
  else if (ds.exsheet !== undefined) exSheet = +ds.exsheet;
  else if (ds.exsheetclose !== undefined) exSheet = null;
  else if (ds.exstep) {
    const d = currentPassDay(), e = d && d.ex[exSheet];
    if (!e) return;
    const dir = +ds.dir;
    if (ds.exstep === "sets") e.sets = Math.max(1, Math.min(10, e.sets + dir));
    else if (ds.exstep === "warm") { const n = Math.max(0, Math.min(5, warmCount(e) + dir)); if (n) e.warm = n; else delete e.warm; }
    else if (ds.exstep === "reps") e.reps = stepReps(e.reps, dir, e.id);
  }
  else if (ds.ordna !== undefined) ordna = !ordna;
  else if (ds.trsheet !== undefined) { trSheet = ds.trsheet || null; dailyEditing = false; }
  save();
  render();
});

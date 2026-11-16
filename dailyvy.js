"use strict";
// ---------- Dailys: Dag och Vecka ----------
// Dag: dagens rutin som rubrik, övningarna som rader med figur och en stor bock, kosttillskotten som knappar.
// Vecka: en tabell med veckans dagar som kolumner och övningarna (per rutin) och kosttillskotten som rader.
// Upplägget ändras i Vecka: rutinen för en veckodag (tryck på dagen) och övningarna i en rutin (tryck på rutinen).
// I Dag byter man bara rutin för dagen. Laddas efter rutiner.js och före app.js.

let dlView = "dag";   // "dag" eller "vecka"
let dlEdit = null;    // "daily" eller "rut:<id>": sidan där övningarna ändras
let plPage = false;   // sidan Planera veckan
let plDraft = null;   // veckan som planeras: rutinens id per veckodag, "" är vila
let plSel = "";       // rutinen man "målar" med

const RUT_COLORS = ["#ff8a47", "#5aa7f0", "#4cc583", "#b49cff", "#f0c04c", "#ec6a8e"];
// Varje rutin behåller sin färg även när ordningen ändras: den får första lediga färgen och sparar den
function rutColor(r) {
  if (!r.color) {
    const used = dailyRoutines().map(x => x.color).filter(Boolean);
    r.color = RUT_COLORS.find(c => !used.includes(c)) || RUT_COLORS[dailyRoutines().indexOf(r) % RUT_COLORS.length];
  }
  return r.color;
}
// Bokstaven i veckotabellen: "Mage A" → A, "Rörlighet" → R
function rutLetter(r) {
  const w = r.name.trim().split(/\s+/), last = w[w.length - 1];
  return (w.length > 1 && last.length === 1 ? last : w[0].charAt(0)).toUpperCase();
}

// Veckoschema: S.dailyWeek har en rutin per veckodag (måndag först), "" är en dag utan rutin
const weekNow = () => rutMode() === "week" ? (S.dailyWeek || []).slice(0, 7).concat(Array(7).fill("")).slice(0, 7)
  : weekDates(weekStart(TODAY)).map(d => { const r = routinePlanned(d); return r ? r.id : ""; });
function saveWeek(arr) {
  const old = weekNow();
  S.dailyMode = "week"; S.dailyWeek = arr.slice(0, 7);
  // Dagar som planeras om släpper ett eget byte för dagen, så att det nya syns direkt
  weekDates(weekStart(TODAY)).forEach((d, i) => { if (d >= TODAY && old[i] !== arr[i] && S.log[d] && S.log[d].dailyRoutine) delete S.log[d].dailyRoutine; });
}
function openPlanner() {
  plDraft = weekNow(); plPage = true; dlEdit = null; rutPage = false; rutSheet = false;
  const L = dailyRoutines(); plSel = L.some(r => r.id === plSel) ? plSel : L.length ? L[0].id : "";
  window.scrollTo(0, 0);
}
// Snabbval: turordning (alla rutiner i ordning), samma alla dagar, varannan dag (de två första)
function planFill(kind) {
  const L = dailyRoutines().map(r => r.id);
  if (!L.length) return;
  plDraft = Array.from({ length: 7 }, (_, i) => kind === "same" ? (plSel || L[0]) : kind === "alt" ? L[i % Math.min(2, L.length)] : L[i % L.length]);
}

function plannerView() {
  const L = dailyRoutines(), dates = weekDates(weekStart(TODAY));
  const card = (id, name, col, figs, sub) => `<button class="pl-rt ${plSel === id ? "on" : ""}" data-plsel="${esc(id)}" aria-pressed="${plSel === id}" style="--rc:${col}">
    <span class="pl-tg ${id ? "" : "v"}">${id ? esc(rutLetter(routineById(id))) : "–"}</span><b>${esc(name)}</b>${figs ? `<span class="pl-fg">${figs}</span>` : `<small>${sub}</small>`}</button>`;
  const cards = L.map(r => card(r.id, r.name, rutColor(r), r.ex.slice(0, 3).map(e => `<span>${EX[e.id] ? figure(e.id) : ""}</span>`).join("") || "", "Inga övningar än")).join("")
    + card("", "Vila", "var(--card-2)", "", "Ingen rutin");
  const days = plDraft.map((id, i) => { const r = routineById(id);
    return `<button class="pl-dy ${dates[i] === TODAY ? "t" : ""}" data-plday="${i}" aria-label="${cap(WD_LONG[i])}: ${r ? esc(r.name) : "vila"}"><small>${WD[i].slice(0, 3)}</small>
      <span class="pl-s ${r ? "" : "v"}" style="${r ? `--rc:${rutColor(r)}` : ""}">${r ? esc(rutLetter(r)) : "Vila"}</span></button>`; }).join("");
  const mini = arr => `<span class="pl-mn">${arr.map(k => `<i style="background:${k == null || !L[k] ? "var(--card-2)" : rutColor(L[k])}"></i>`).join("")}</span>`;
  const n = Math.max(1, L.length), sel = routineById(plSel);
  return `<div class="dlx pl"><button class="backbtn" data-plclose>${icon("left", 18)}Dailys</button><h1>Planera veckan</h1>
    <div class="muted pl-sub">Välj en rutin och tryck på dagarna där den ska köras. Gäller varje vecka.</div>
    <div class="klabel pl-lbl">Rutiner</div>
    <div class="pl-rts">${cards}<button class="pl-rt pl-new" data-plnew>+ Ny rutin</button></div>
    ${L.length ? `<div class="klabel pl-lbl">Veckan</div>
    <div class="pl-days">${days}</div>
    <div class="muted small pl-hint"><i style="background:${sel ? rutColor(sel) : "var(--card-2)"}"></i>${sel ? esc(sel.name) : "Vila"} vald · tryck på en dag för att lägga den där</div>
    <div class="klabel pl-lbl">Snabbval</div>
    <div class="pl-fills"><button class="pl-fill" data-plfill="turn">${mini(Array.from({ length: 7 }, (_, i) => i % n))}Turordning</button>
      <button class="pl-fill" data-plfill="same">${mini(Array(7).fill(Math.max(0, L.indexOf(sel))))}Samma alla dagar</button>
      <button class="pl-fill" data-plfill="alt">${mini(Array.from({ length: 7 }, (_, i) => i % Math.min(2, n)))}Varannan dag</button></div>
    <button class="primary wide bigbtn pl-save" data-plsave>Spara veckan</button>`
    : `<div class="muted pl-hint">Skapa en rutin först, till exempel "Mage A" med några övningar.</div>`}</div>`;
}

const dlToggle = () => `<div class="dl-tg" role="tablist" aria-label="Visa">${[["dag", "Dag"], ["vecka", "Vecka"]].map(([k, l]) =>
  `<button role="tab" data-dlview="${k}" class="${dlView === k ? "on" : ""}" aria-selected="${dlView === k}">${l}</button>`).join("")}</div>`;

function dlDayView() {
  const date = logDate(), ex = dailyList(date), rut = routineOn(date), a = S.supplements || [];
  const n = ex.filter(e => dailyDone(date, e.id)).length, next = ex.find(e => !dailyDone(date, e.id));
  const col = rut ? rutColor(rut) : "var(--accent-strong)", wd = weekdayOf(date);
  const when = `${date === TODAY ? "Idag · " : ""}${cap(WD_LONG[wd])} ${+date.slice(-2)}`;
  const row = e => {
    const ok = dailyDone(date, e.id), x = EX[e.id];
    return `<div class="dl-row ${ok ? "ok" : ""}">${thumb(e.id, "dl-f")}<span class="grow"><b>${esc(x.name)}</b><small>${e.sets} × ${esc(e.reps || "")}</small></span>
      ${!ok && e === next && !isRun(e.id) ? `<button class="dl-play" data-dclockstart="${e.id}" aria-label="Starta ${esc(x.name)}">${icon("play", 18)}</button>` : ""}
      <button class="dl-ck ${ok ? "on" : ""}" data-dcheck="${e.id}" aria-pressed="${ok}" aria-label="${esc(x.name)} klar">${icon("check", 20)}</button></div>`;
  };
  const pills = a.map(x => {
    const ok = !!(S.log[date] && S.log[date].dailies["supp:" + x.id]);
    return `<button class="dl-pill ${ok ? "on" : ""}" data-suppcheck="${esc(x.id)}" aria-pressed="${ok}"><span class="dl-pc">${ok ? icon("check", 14) : ""}</span>${esc(x.name)}${x.dose ? ` <small>${esc(x.dose)}</small>` : ""}</button>`;
  }).join("");
  return `<div class="dl-h"><div class="grow"><span class="dl-k"><i style="background:${col}"></i>${when}</span><b>${rut ? esc(rut.name) : "Dagens dailys"}</b></div>
      ${dailyRoutines().length ? `<button class="linkbtn2 dl-byt" data-rutsheet="1">Byt rutin</button>` : `<button class="linkbtn2" data-rutpage>Rutiner</button>`}</div>
    ${ex.length ? `<div class="dl-p dlx-prog" style="--pc:${col}"><span>${ex.map(e => `<i class="${dailyDone(date, e.id) ? "on" : ""}"></i>`).join("")}</span><small>${n} av ${ex.length} klara</small></div>
    <div class="dl-rows">${ex.map(row).join("")}</div>`
      : `<div class="dl-empty"><b>${rut === null && rutMode() === "week" ? "Ingen rutin idag" : "Inga övningar än"}</b><button class="linkbtn2" data-dlview="vecka">Ställ in under Vecka${icon("right", 14)}</button></div>`}
    <div class="klabel dl-sec">Kosttillskott</div>
    <div class="dl-pills">${pills}<button class="dl-pill add" data-suppadd>+ Lägg till</button></div>`;
}

function dlWeekView() {
  const dates = weekDates(weekStart(TODAY)), a = S.supplements || [], every = (S.daily || []).filter(e => EX[e.id]);
  const rs = dates.map(d => routineOn(d)), used = dailyRoutines().filter(r => rs.includes(r));
  const cell = (d, inner) => `<span class="wk-c ${d === TODAY ? "t" : ""}">${inner}</span>`;
  const mark = (d, ok, col) => ok ? `<i class="wk-d ok" style="--pc:${col}"></i>` : d < TODAY ? `<i class="wk-d x"></i>` : `<i class="wk-d p" style="--pc:${col}"></i>`;
  const head = `<div class="wk-r wk-hd"><span></span>${dates.map((d, i) => { const r = rs[i];
    return `<button class="wk-c wk-day ${d === TODAY ? "t" : ""}" data-plopen aria-label="${cap(WD_LONG[i])}: ${r ? esc(r.name) : "ingen rutin"}. Planera veckan">
      <small>${WD[i].slice(0, 3)}</small><b>${+d.slice(-2)}</b><span class="wk-tag ${r ? "" : "v"}" style="${r ? `background:${rutColor(r)}` : ""}">${r ? esc(rutLetter(r)) : "–"}</span></button>`; }).join("")}</div>`;
  const group = (target, name, col, list, on) => `<div class="wk-r"><button class="wk-g" data-dledit="${target}"><i style="background:${col}"></i>${esc(name)}${icon("right", 14)}</button></div>
    ${list.filter(e => EX[e.id]).map(e => `<div class="wk-r"><span class="wk-n"><span class="wk-f" aria-hidden="true">${figure(e.id)}</span><span>${esc(EX[e.id].name)}</span></span>${dates.map((d, i) =>
      cell(d, on(i) ? mark(d, dailyDone(d, e.id), col) : "")).join("")}</div>`).join("")}`;
  const groups = used.map(r => group("rut:" + r.id, r.name, rutColor(r), r.ex, i => rs[i] === r)).join("")
    + (every.length ? group("daily", "Varje dag", "var(--text)", every, () => true) : "");
  const supp = a.map((x, k) => `<div class="wk-r"><button class="wk-n wk-sn" data-suppedit="${k}">${esc(x.name)}</button>${dates.map(d =>
    cell(d, mark(d, !!(S.log[d] && S.log[d].dailies && S.log[d].dailies["supp:" + x.id]), "var(--ok)"))).join("")}</div>`).join("");
  return `<div class="muted small dl-wsub">Vecka ${weekNo(TODAY)}</div>
    <section class="wk-tbl">${head}${groups || `<div class="wk-none muted small">Inga dailys än. Skapa en rutin eller lägg till övningar som görs varje dag.</div>`}</section>
    <button class="primary wide wk-plan" data-plopen>${icon("kalender", 18)}Planera veckan</button>
    <div class="row wk-btns"><button class="grow" data-dledit="daily">Varje dag</button><button class="grow" data-rutpage>Rutiner</button></div>
    <section class="wk-tbl wk-supp"><div class="row between wk-sh"><span class="klabel">Kosttillskott</span><button class="linkbtn2" data-suppadd>+ Lägg till</button></div>${supp}</section>
    <div class="wk-key"><span><i class="wk-d ok" style="--pc:var(--ok)"></i>Gjort</span><span><i class="wk-d p" style="--pc:var(--text)"></i>Planerat</span><span><i class="wk-d x"></i>Missat</span></div>`;
}

// Sidan där övningarna i en rutin eller i Varje dag ändras
function dlEditView() {
  const t = dlEdit, r = t.startsWith("rut:") ? routineById(t.slice(4)) : null;
  if (t !== "daily" && !r) { dlEdit = null; return ""; }
  const list = r ? r.ex : (S.daily || (S.daily = []));
  return `<div class="dlx dl-edit"><button class="backbtn" data-dledit="">${icon("left", 18)}Vecka</button>
    <h1>${r ? esc(r.name) : "Varje dag"}</h1>
    <p class="muted">${r ? "Övningarna i rutinen. Vilka dagar den körs väljer du i veckan." : "Övningar som visas varje dag, oavsett rutin."}</p>
    ${exRows(t, list, true)}
    ${r ? `<button class="link dl-editmore" data-rutpage>Byt namn, kopiera eller ta bort rutinen</button>` : ""}</div>`;
}

function dailysPage() {
  if (plPage) return plannerView();
  if (dlEdit) { const v = dlEditView(); if (v) return v; }
  return `<div class="dlx"><h1>Dailys</h1>${dlToggle()}${dlView === "vecka" ? dlWeekView() : dlDayView()}
    ${supplementForm()}${rutinSheet()}</div>`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-dlview],[data-dledit],[data-plopen],[data-plclose],[data-plsel],[data-plday],[data-plfill],[data-plsave],[data-plnew]");
  if (!t) return;
  const ds = t.dataset;
  ev.stopImmediatePropagation();
  if (ds.dlview) { dlView = ds.dlview; dlEdit = null; }
  else if (ds.dledit !== undefined) { dlEdit = ds.dledit || null; dailyEditing = false; rutPage = false; window.scrollTo(0, 0); }
  else if (ds.plopen !== undefined) openPlanner();
  else if (ds.plclose !== undefined) { plPage = false; plDraft = null; window.scrollTo(0, 0); }
  else if (ds.plsel !== undefined) plSel = ds.plsel;
  else if (ds.plday !== undefined) plDraft[+ds.plday] = plSel;
  else if (ds.plfill) planFill(ds.plfill);
  else if (ds.plsave !== undefined) { saveWeek(plDraft); plPage = false; plDraft = null; dlView = "vecka"; save(); toast("Veckan är sparad"); window.scrollTo(0, 0); }
  else if (ds.plnew !== undefined) { rutPage = true; rutRename = "new"; render(); const f = document.querySelector(".rutname input"); if (f) f.focus(); return; }
  render();
}, true);

"use strict";
// ---------- Dailys: Dag och Vecka ----------
// Dag: dagens rutin som rubrik, övningarna som rader med figur och en stor bock, kosttillskotten som knappar.
// Vecka: en tabell med veckans dagar som kolumner och övningarna (per rutin) och kosttillskotten som rader.
// Upplägget ändras i Vecka: rutinen för en veckodag (tryck på dagen) och övningarna i en rutin (tryck på rutinen).
// I Dag byter man bara rutin för dagen. Laddas efter rutiner.js och före app.js.

let dlView = "dag";   // "dag" eller "vecka"
let dlEdit = null;    // "daily" eller "rut:<id>": sidan där övningarna ändras
let wkPick = null;    // veckodagen (0–6) vars rutin väljs i bladet

const RUT_COLORS = ["#ff8a47", "#5aa7f0", "#4cc583", "#b49cff", "#f0c04c", "#ec6a8e"];
const rutColor = r => RUT_COLORS[Math.max(0, dailyRoutines().indexOf(r)) % RUT_COLORS.length];
// Bokstaven i veckotabellen: "Mage A" → A, "Rörlighet" → R
function rutLetter(r) {
  const w = r.name.trim().split(/\s+/), last = w[w.length - 1];
  return (w.length > 1 && last.length === 1 ? last : w[0].charAt(0)).toUpperCase();
}

// Veckoschema: S.dailyWeek har en rutin per veckodag (måndag först), "" är en dag utan rutin
function setWeekRoutine(wd, id) {
  if (rutMode() !== "week") {
    S.dailyWeek = weekDates(weekStart(TODAY)).map(d => { const r = routinePlanned(d); return r ? r.id : ""; });
    S.dailyMode = "week";
  }
  S.dailyWeek[wd] = id;
  // Dagens eget byte släpps när man planerar om dagen, så att det nya syns direkt
  const d = weekDates(weekStart(TODAY))[wd];
  if (d >= TODAY && S.log[d] && S.log[d].dailyRoutine) delete S.log[d].dailyRoutine;
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
    return `<button class="wk-c wk-day ${d === TODAY ? "t" : ""}" data-wkpick="${i}" aria-label="${cap(WD_LONG[i])}: ${r ? esc(r.name) : "ingen rutin"}. Byt rutin">
      <small>${WD[i].slice(0, 3)}</small><b>${+d.slice(-2)}</b><span class="wk-tag ${r ? "" : "v"}" style="${r ? `background:${rutColor(r)}` : ""}">${r ? esc(rutLetter(r)) : "–"}</span></button>`; }).join("")}</div>`;
  const group = (target, name, col, list, on) => `<div class="wk-r"><button class="wk-g" data-dledit="${target}"><i style="background:${col}"></i>${esc(name)}<span>Ändra</span></button></div>
    ${list.filter(e => EX[e.id]).map(e => `<div class="wk-r"><span class="wk-n"><span class="wk-f" aria-hidden="true">${figure(e.id)}</span><span>${esc(EX[e.id].name)}</span></span>${dates.map((d, i) =>
      cell(d, on(i) ? mark(d, dailyDone(d, e.id), col) : "")).join("")}</div>`).join("")}`;
  const groups = used.map(r => group("rut:" + r.id, r.name, rutColor(r), r.ex, i => rs[i] === r)).join("")
    + (every.length ? group("daily", "Varje dag", "var(--text)", every, () => true) : "");
  const supp = a.map((x, k) => `<div class="wk-r"><button class="wk-n wk-sn" data-suppedit="${k}">${esc(x.name)}</button>${dates.map(d =>
    cell(d, mark(d, !!(S.log[d] && S.log[d].dailies && S.log[d].dailies["supp:" + x.id]), "var(--ok)"))).join("")}</div>`).join("");
  return `<div class="muted small dl-wsub">Vecka ${weekNo(TODAY)} · tryck på en dag för att välja rutin</div>
    <section class="wk-tbl">${head}${groups || `<div class="wk-none muted small">Inga dailys än. Skapa en rutin eller lägg till övningar som görs varje dag.</div>`}</section>
    <div class="row wk-btns"><button class="small" data-dledit="daily">${every.length ? "Ändra Varje dag" : "+ Varje dag"}</button><button class="small" data-rutpage>Rutiner</button></div>
    <section class="wk-tbl wk-supp"><div class="row between wk-sh"><span class="klabel">Kosttillskott</span><button class="linkbtn2" data-suppadd>+ Lägg till</button></div>${supp}</section>
    <div class="wk-key"><span><i class="wk-d ok" style="--pc:var(--ok)"></i>Gjort</span><span><i class="wk-d p" style="--pc:var(--text)"></i>Planerat</span><span><i class="wk-d x"></i>Missat</span></div>`;
}

// Bladet där man väljer rutin för en veckodag
function wkSheet() {
  if (wkPick === null) return "";
  const cur = (rutMode() === "week" ? (S.dailyWeek || [])[wkPick] : (routinePlanned(weekDates(weekStart(TODAY))[wkPick]) || {}).id) || "";
  const opt = (id, name, sub, col) => `<button class="rutopt ${cur === id ? "on" : ""}" data-wkset="${esc(id)}" aria-pressed="${cur === id}">
    <span class="wk-tag" style="background:${col}">${id ? esc(rutLetter(routineById(id))) : "–"}</span><span class="grow"><b>${esc(name)}</b><small>${esc(sub)}</small></span></button>`;
  return `<div class="overlay" data-wkpick=""><div class="sheet rutsheet" role="dialog" aria-label="Rutin på ${WD_LONG[wkPick]}ar">
    <div class="row between"><h2 class="sheeth">${cap(WD_LONG[wkPick])}ar</h2><button class="small ghost iconbtn" data-wkpick="" aria-label="Stäng">${icon("close", 18)}</button></div>
    <div class="muted small">Gäller varje vecka. Varje dag och kosttillskotten är med oavsett rutin.</div>
    <section class="rutopts">${dailyRoutines().map(r => opt(r.id, r.name, exNames(r), rutColor(r))).join("")}${opt("", "Ingen rutin", "Bara Varje dag och kosttillskott", "var(--card-2)")}</section>
    <button class="rutmanage" data-rutpage>Hantera rutiner</button></div></div>`;
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
  if (dlEdit) { const v = dlEditView(); if (v) return v; }
  return `<div class="dlx"><h1>Dailys</h1>${dlToggle()}${dlView === "vecka" ? dlWeekView() : dlDayView()}
    ${supplementForm()}${rutinSheet()}${wkSheet()}</div>`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-dlview],[data-dledit],[data-wkpick],[data-wkset]");
  if (!t) return;
  const ds = t.dataset;
  if (ds.wkpick === "" && t.classList.contains("overlay") && ev.target !== t) return;   // tryck inne i bladet
  ev.stopImmediatePropagation();
  if (ds.dlview) { dlView = ds.dlview; dlEdit = null; }
  else if (ds.dledit !== undefined) { dlEdit = ds.dledit || null; dailyEditing = false; rutPage = false; window.scrollTo(0, 0); }
  else if (ds.wkpick !== undefined) wkPick = ds.wkpick === "" ? null : +ds.wkpick;
  else if (ds.wkset !== undefined) {
    const wd = wkPick; setWeekRoutine(wd, ds.wkset); wkPick = null; save();
    const r = routineById(ds.wkset);
    toast(`${cap(WD_LONG[wd])}ar: ${r ? r.name : "ingen rutin"}`);
  }
  render();
}, true);

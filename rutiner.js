"use strict";
// ---------- Dailys-rutiner ----------
// Utöver "Varje dag" (S.daily) kan man ha sparade rutiner (S.dailyRoutines) som växlar mellan dagarna:
// välj själv, varannan dag (de två första) eller rotation (alla i ordning). Dagens val sparas på dagen
// (L.dailyRoutine) och växlingen räknas vidare från det senaste valet (S.dailyAnchor). Bockarna ligger
// som förut per övning och dag i L.dailies, så historik och synk fungerar som innan.
// Utan rutiner fungerar Dailys precis som tidigare. Laddas före app.js; app.js ritar vyerna.

const dailyRoutines = () => S.dailyRoutines || [];
const isDailyT = t => t === "daily" || String(t).startsWith("rut:");
const routineById = id => dailyRoutines().find(r => r.id === id);
const RUT_MODES = { manual: "Välj själv", alternate: "Varannan dag", rotate: "Rotation" };
const rutMode = () => RUT_MODES[S.dailyMode] ? S.dailyMode : "manual";
const rutDays = (a, b) => Math.round((Date.parse(b + "T12:00:00") - Date.parse(a + "T12:00:00")) / 864e5);

// Rutinerna som ingår i växlingen
function routineCycle() { const r = dailyRoutines(); return rutMode() === "alternate" ? r.slice(0, 2) : r; }
// Rutinen enligt växlingen (utan dagens eget val)
function routinePlanned(date) {
  const all = dailyRoutines(), a = S.dailyAnchor;
  if (!all.length) return null;
  const last = a && routineById(a.id);
  if (rutMode() === "manual") return last || all[0];
  const cyc = routineCycle(), n = cyc.length, k = last ? cyc.indexOf(last) : -1;
  const i = k >= 0 ? k + rutDays(a.date, date) : rutDays("2026-01-05", date);
  return cyc[((i % n) + n) % n];
}
// Dagens rutin: det man valt för dagen, annars enligt växlingen
function routineOn(date) {
  const L = S.log[date], own = L && L.dailyRoutine && routineById(L.dailyRoutine);
  return own || routinePlanned(date);
}
// Alla dailyövningar en dag: Varje dag och dagens rutin (samma övning bara en gång)
function dailyList(date = logDate()) {
  const r = routineOn(date), seen = new Set(), out = [];
  for (const e of [...(S.daily || []), ...(r ? r.ex : [])]) if (EX[e.id] && !seen.has(e.id)) { seen.add(e.id); out.push(e); }
  return out;
}
const hasDailies = () => (S.daily || []).length > 0 || dailyRoutines().some(r => r.ex.length);
function chooseRoutine(id, date = logDate()) {
  day(date).dailyRoutine = id;
  S.dailyAnchor = { date, id };
}
// Text under dagens rutin: hur den väljs och vad som kommer i morgon
function routineHint(date) {
  const m = rutMode();
  if (m === "manual") return "Du väljer själv · samma rutin tills du byter";
  const tom = date === TODAY ? "i morgon" : "dagen efter";
  return `${RUT_MODES[m]} · ${tom} <b>${esc(routinePlanned(shift(date, 1)).name)}</b>`;
}

let rutSheet = false;    // bladet Rutin för idag
let rutPage = false;     // sidan Rutiner
let rutOpen = null;      // rutinen vars övningar visas på sidan Rutiner
let rutMenu = null;      // rutinen vars ⋯-meny är öppen
let rutRename = null;    // rutinen som byter namn ("new" = ny rutin)
let rutDelArm = null;    // rutinen som ska tas bort (tryck igen)

const exNames = r => r.ex.length ? r.ex.slice(0, 3).map(e => EX[e.id] ? EX[e.id].name : e.id).join(", ") + (r.ex.length > 3 ? " …" : "") : "Inga övningar än";

function rutinSheet() {
  if (!rutSheet) return "";
  const cur = routineOn(logDate());
  return `<div class="overlay" data-rutsheet=""><div class="sheet rutsheet" role="dialog" aria-label="Rutin för idag">
    <div class="row between"><h2 class="sheeth">Rutin för idag</h2><button class="small ghost iconbtn" data-rutsheet="" aria-label="Stäng">${icon("close", 18)}</button></div>
    <div class="muted small">Det du redan bockat av ligger kvar.</div>
    <section class="rutopts">${dailyRoutines().map(r => `<button class="rutopt ${cur === r ? "on" : ""}" data-rutpick="${esc(r.id)}" aria-pressed="${cur === r}">
      <span class="rutrad" aria-hidden="true"></span><span class="grow"><b>${esc(r.name)}</b><small>${esc(exNames(r))}</small></span></button>`).join("")}</section>
    <button class="rutmanage" data-rutpage>Hantera rutiner</button></div></div>`;
}

// Rubriken på Dailys när det finns rutiner
function routineHead(date) {
  const r = routineOn(date);
  if (!r) return "";
  return `<button class="dlx-rut" data-rutsheet="1" aria-label="Dagens rutin ${esc(r.name)}, byt">
      <span class="klabel">Dagens rutin</span><b class="grow">${esc(r.name)}</b><span class="dlx-rutbyt">Byt${icon("right", 14)}</span></button>
    <div class="muted small dlx-rutnext">${dailyRoutines().length > 1 ? routineHint(date) : "Lägg till fler rutiner för att växla mellan dagarna"}</div>`;
}

function rutinerView() {
  const L = dailyRoutines(), m = rutMode();
  const explain = { manual: "Samma rutin tills du byter den själv på Dailys.", alternate: "Växlar mellan de två första rutinerna. Med Rotation går du igenom alla i ordning.", rotate: "Går igenom alla rutiner i ordning, en per dag." }[m];
  const nameForm = (id, val) => `<form class="rutname" data-rutform="${esc(id)}"><input name="n" maxlength="40" required value="${esc(val)}" placeholder="T.ex. Mage A" aria-label="Rutinens namn"><button class="small primary" type="submit">Spara</button><button class="small ghost" type="button" data-rutcancel>Avbryt</button></form>`;
  const rows = L.map((r, i) => {
    const inCycle = m !== "alternate" || i < 2, open = rutOpen === r.id;
    const sub = `${r.ex.length} ${r.ex.length === 1 ? "övning" : "övningar"}${m === "manual" || inCycle ? "" : " · ingår inte i växlingen"}`;
    return `<div class="rutrow ${open ? "open" : ""}" data-rutidx="${i}">
      <div class="h3-row"><span class="rutnum ${m !== "manual" && inCycle ? "on" : ""}" data-rutdrag="${i}" aria-label="Dra för att flytta ${esc(r.name)}">${i + 1}</span>
        ${rutRename === r.id ? nameForm(r.id, r.name) : `<button class="grow rutopen" data-rutopen="${esc(r.id)}" aria-expanded="${open}"><b>${esc(r.name)}</b><small>${sub}</small></button>
        <button class="rutdots" data-rutmenu="${esc(r.id)}" aria-label="Fler val för ${esc(r.name)}">⋯</button>`}</div>
      ${rutMenu === r.id ? `<div class="rutmenu"><button class="small" data-rutren="${esc(r.id)}">Byt namn</button><button class="small" data-rutcopy="${esc(r.id)}">Kopiera</button>
        <button class="small ${rutDelArm === r.id ? "dangerbtn" : ""}" data-rutdel="${esc(r.id)}">${rutDelArm === r.id ? "Tryck igen för att ta bort" : "Ta bort"}</button></div>` : ""}
      ${open ? `<div class="rutex">${exRows("rut:" + r.id, r.ex, true)}</div>` : ""}</div>`;
  }).join("");
  return `<div class="dlx rutpage"><button class="backbtn" data-rutback>${icon("left", 18)}Dailys</button><h1>Rutiner</h1>
    <p class="muted">Sparade rutiner som växlar mellan dagarna. "Varje dag" och kosttillskott visas alltid, oavsett rutin.</p>
    ${L.length ? `<span class="klabel">Hur rutinen väljs</span>
    <div class="seg rutseg" role="radiogroup" aria-label="Hur rutinen väljs">${Object.entries(RUT_MODES).map(([k, v]) => `<button role="radio" class="${m === k ? "on" : ""}" aria-checked="${m === k}" data-rutmode="${k}">${v}</button>`).join("")}</div>
    <div class="muted small rutexplain">${explain}</div>
    <span class="klabel">${L.length > 1 ? "Ordning · dra för att flytta" : "Rutiner"}</span>
    <section class="h3-list rutlist">${rows}</section>` : ""}
    ${rutRename === "new" ? `<section class="card">${nameForm("new", "")}</section>` : `<button class="rutnew" data-rutnew>+ Ny rutin</button>`}</div>`;
}

// Bocken sparar vilken rutin dagen hade, så att historiken visar rätt även om växlingen ändras
document.addEventListener("click", ev => {
  const c = ev.target.closest && ev.target.closest("[data-dcheck],[data-suppcheck],[data-runcheck]");
  if (c && dailyRoutines().length) { const L = day(), r = routineOn(logDate()); if (r && !L.dailyRoutine) L.dailyRoutine = r.id; }
  if (ev.target.closest && ev.target.closest("[data-tab]")) { rutPage = false; rutSheet = false; rutOpen = null; rutMenu = null; rutRename = null; }
}, true);

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-rutsheet],[data-rutpick],[data-rutpage],[data-rutback],[data-rutmode],[data-rutopen],[data-rutmenu],[data-rutren],[data-rutcopy],[data-rutdel],[data-rutnew],[data-rutcancel],[data-rutedit]");
  if (!t) return;
  const ds = t.dataset;
  // Bakgrunden stänger bladet, men inte tryck inne i bladet
  if (ds.rutsheet === "" && t.classList.contains("overlay") && ev.target !== t) return;
  ev.stopImmediatePropagation();
  if (ds.rutdel === undefined) rutDelArm = null;
  if (ds.rutsheet !== undefined) rutSheet = ds.rutsheet === "1";
  else if (ds.rutpick) { chooseRoutine(ds.rutpick); rutSheet = false; save(); toast(`Dagens rutin: ${routineById(ds.rutpick).name}`); }
  else if (ds.rutpage !== undefined) { rutSheet = false; rutPage = true; dailyEditing = false; window.scrollTo(0, 0); }
  else if (ds.rutback !== undefined) { rutPage = false; rutOpen = rutMenu = rutRename = null; window.scrollTo(0, 0); }
  else if (ds.rutmode) {
    // Byter man sätt räknas växlingen från dagens rutin
    const cur = routineOn(TODAY); S.dailyMode = ds.rutmode;
    if (cur) S.dailyAnchor = { date: TODAY, id: cur.id };
    save();
  }
  else if (ds.rutopen) { rutOpen = rutOpen === ds.rutopen ? null : ds.rutopen; rutMenu = null; }
  else if (ds.rutmenu) { rutMenu = rutMenu === ds.rutmenu ? null : ds.rutmenu; rutRename = null; }
  else if (ds.rutren) { rutRename = ds.rutren; rutMenu = null; render(); const f = document.querySelector(".rutname input"); if (f) { f.focus(); f.select(); } return; }
  else if (ds.rutcopy) {
    const L = dailyRoutines(), i = L.findIndex(r => r.id === ds.rutcopy), r = L[i];
    const copy = { id: "r" + Date.now().toString(36), name: `${r.name} (kopia)`.slice(0, 40), ex: r.ex.map(e => ({ ...e })) };
    L.splice(i + 1, 0, copy); rutMenu = null; rutRename = copy.id; save(); render();
    const f = document.querySelector(".rutname input"); if (f) { f.focus(); f.select(); } return;
  }
  else if (ds.rutdel) {
    if (rutDelArm !== ds.rutdel) rutDelArm = ds.rutdel;
    else {
      const L = dailyRoutines(), r = routineById(ds.rutdel);
      L.splice(L.indexOf(r), 1); rutDelArm = rutMenu = null; if (rutOpen === r.id) rutOpen = null;
      if (S.dailyAnchor && S.dailyAnchor.id === r.id) S.dailyAnchor = L.length ? { date: TODAY, id: (routineOn(TODAY) || L[0]).id } : null;
      save(); toast(`${r.name} är borttagen`);
    }
  }
  else if (ds.rutnew !== undefined) { rutRename = "new"; rutMenu = null; render(); const f = document.querySelector(".rutname input"); if (f) f.focus(); return; }
  else if (ds.rutcancel !== undefined) rutRename = null;
  else if (ds.rutedit) dailyEditing = dailyEditing === ds.rutedit ? false : ds.rutedit;
  render();
}, true);

document.addEventListener("submit", ev => {
  const f = ev.target.closest && ev.target.closest("[data-rutform]");
  if (!f) return;
  ev.preventDefault(); ev.stopImmediatePropagation();
  const name = String(new FormData(f).get("n") || "").trim().slice(0, 40), id = f.dataset.rutform;
  if (!name) return;
  if (id === "new") {
    const L = S.dailyRoutines || (S.dailyRoutines = []), r = { id: "r" + Date.now().toString(36), name, ex: [] };
    L.push(r); rutOpen = r.id;
    // Första rutinen blir dagens
    if (L.length === 1) S.dailyAnchor = { date: TODAY, id: r.id };
  } else { const r = routineById(id); if (r) r.name = name; }
  rutRename = null; save(); render();
}, true);

// Dra i numret för att ändra ordning; de andra raderna glider undan
(() => {
  let drag = null;
  document.addEventListener("pointerdown", ev => {
    const h = ev.target.closest && ev.target.closest("[data-rutdrag]");
    if (!h || dailyRoutines().length < 2) return;
    const rows = [...document.querySelectorAll(".rutlist .rutrow")];
    const from = +h.dataset.rutdrag, el = rows[from];
    drag = { from, to: from, y0: ev.clientY, rows, el, tops: rows.map(r => r.getBoundingClientRect()), id: ev.pointerId };
    el.classList.add("dragging");
    h.setPointerCapture && h.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });
  document.addEventListener("pointermove", ev => {
    if (!drag || ev.pointerId !== drag.id) return;
    const dy = ev.clientY - drag.y0, { from, rows, tops } = drag, h = tops[from].height;
    drag.el.style.transform = `translateY(${dy}px)`;
    const mid = tops[from].top + h / 2 + dy;
    let to = from;
    tops.forEach((r, i) => { if (i < from && mid < r.top + r.height / 2) to = Math.min(to, i); if (i > from && mid > r.top + r.height / 2) to = Math.max(to, i); });
    drag.to = to;
    rows.forEach((r, i) => { if (i === from) return; r.style.transform = i >= to && i < from ? `translateY(${h}px)` : i <= to && i > from ? `translateY(${-h}px)` : ""; });
  });
  const end = ev => {
    if (!drag || ev.pointerId !== drag.id) return;
    const { from, to, rows } = drag; drag = null;
    rows.forEach(r => { r.style.transform = ""; r.classList.remove("dragging"); });
    if (to === from) return;
    const L = dailyRoutines(), cur = routineOn(TODAY);
    L.splice(to, 0, L.splice(from, 1)[0]);
    // Dagens rutin ligger kvar; växlingen fortsätter därifrån i den nya ordningen
    if (cur) S.dailyAnchor = { date: TODAY, id: cur.id };
    save(); render();
  };
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
})();

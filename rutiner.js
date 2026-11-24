"use strict";
// ---------- Dailys-rutiner ----------
// Utöver "Varje dag" (S.daily) kan man ha sparade rutiner (S.dailyRoutines) som växlar mellan dagarna:
// välj själv, varannan dag (de två första) eller rotation (alla i ordning). Dagens val sparas på dagen
// (L.dailyRoutine) och växlingen räknas vidare från det senaste valet (S.dailyAnchor). Bockarna ligger
// som förut per övning och dag i L.dailies, så historik och synk fungerar som innan.
// Utan rutiner fungerar Dailys precis som tidigare. Laddas före app.js; app.js ritar vyerna.

const dailyRoutines = () => S.dailyRoutines || [];
const isDailyT = t => t === "daily" || String(t).startsWith("rut:") || String(t).startsWith("dag:");
// En ny grupp är ett utkast (rutDraft) tills man trycker Spara; den finns bara på sin egen sida
let rutDraft = null;
const routineById = id => dailyRoutines().find(r => r.id === id) || (rutDraft && rutDraft.id === id ? rutDraft : undefined);
const RUT_MODES = { manual: "Välj själv", alternate: "Varannan dag", rotate: "Rotation", week: "Veckoschema" };
const rutMode = () => RUT_MODES[S.dailyMode] ? S.dailyMode : "manual";
const rutDays = (a, b) => Math.round((Date.parse(b + "T12:00:00") - Date.parse(a + "T12:00:00")) / 864e5);

// Rutinerna som ingår i växlingen
function routineCycle() { const r = dailyRoutines(); return rutMode() === "alternate" ? r.slice(0, 2) : r; }
// Rutinen enligt växlingen (utan dagens eget val)
function routinePlanned(date) {
  const all = dailyRoutines(), a = S.dailyAnchor;
  if (!all.length) return null;
  // Veckoschema: varje veckodag har sin rutin (S.dailyWeek, måndag först); utan rutin den dagen blir det ingen
  if (rutMode() === "week") return routineById((S.dailyWeek || [])[weekdayOf(date)]) || null;
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
// Dagens egna ändringar ligger på dagen: L.dailyAdd (tillagda bara den dagen) och L.dailyDrop (borttagna bara den dagen)
function dailyList(date = logDate()) {
  const r = routineOn(date), seen = new Set(), out = [], L = S.log[date] || {}, drop = L.dailyDrop || [];
  for (const e of [...(S.daily || []), ...(r ? r.ex : []), ...(L.dailyAdd || [])]) if (EX[e.id] && !seen.has(e.id) && !drop.includes(e.id)) { seen.add(e.id); out.push(e); }
  return out;
}
// "dag:<datum>" är dagens lista i Dag; framåt betyder dagens rutin (eller Varje dag när dagen saknar rutin)
const dayTarget = date => { const r = routineOn(date); return r ? "rut:" + r.id : "daily"; };
const hasDailies = () => (S.daily || []).length > 0 || dailyRoutines().some(r => r.ex.length);
function chooseRoutine(id, date = logDate()) {
  day(date).dailyRoutine = id;
  S.dailyAnchor = { date, id };
}
// Text under dagens rutin: hur den väljs och vad som kommer i morgon
function routineHint(date) {
  const m = rutMode();
  if (m === "manual") return "Du väljer själv · samma rutin tills du byter";
  const tom = date === TODAY ? "i morgon" : "dagen efter", nx = routinePlanned(shift(date, 1));
  return `${RUT_MODES[m]} · ${tom} <b>${nx ? esc(nx.name) : "ingen rutin"}</b>`;
}

let rutSheet = false;    // bladet Rutin för idag
let rutPage = false;     // sidan Rutiner
let rutOpen = null;      // rutinen vars övningar visas på sidan Rutiner
let rutMenu = null;      // rutinen vars ⋯-meny är öppen
let rutRename = null;    // rutinen som byter namn ("new" = ny rutin)
let rutDelArm = null;    // rutinen som ska tas bort (tryck igen)

// När man lämnar en grupp: en tom ny grupp tas bort, en grupp utan namn får ett. Ger namnet, eller null om den togs bort.
// Ett utkast som lämnas utan Spara försvinner, och dagarna det hade blir lediga igen
function discardDraft() {
  if (!rutDraft) return;
  const id = rutDraft.id; rutDraft = null;
  if (S.dailyWeek) S.dailyWeek = S.dailyWeek.map(x => x === id ? "" : x);
  save();
}
function leaveGroup(r) {
  if (r === rutDraft) { discardDraft(); return null; }
  const L = dailyRoutines();
  if (!r.name.trim() && !r.ex.length && !(rutMode() === "week" && weekNow().includes(r.id))) {
    L.splice(L.indexOf(r), 1);
    if (S.dailyAnchor && S.dailyAnchor.id === r.id) S.dailyAnchor = L.length ? { date: TODAY, id: L[0].id } : null;
    save(); return null;
  }
  if (!r.name.trim()) { r.name = `Extra ${L.indexOf(r) + 1}`; save(); }
  return r.name;
}
// Namnet sparas medan man skriver
document.addEventListener("input", ev => {
  const f = ev.target.closest && ev.target.closest("[data-rutname]");
  if (!f) return;
  const r = routineById(f.dataset.rutname);
  if (r) { r.name = f.value.slice(0, 40); save(); }
});

const exNames = r => r.ex.length ? r.ex.slice(0, 3).map(e => EX[e.id] ? EX[e.id].name : e.id).join(", ") + (r.ex.length > 3 ? " …" : "") : "Inga övningar än";

function rutinSheet() {
  if (!rutSheet) return "";
  const cur = routineOn(logDate());
  return `<div class="overlay" data-rutsheet=""><div class="sheet rutsheet" role="dialog" aria-label="Extra idag">
    <div class="row between"><h2 class="sheeth">Extra idag</h2><button class="small ghost iconbtn" data-rutsheet="" aria-label="Stäng">${icon("close", 18)}</button></div>
    <div class="muted small">Det du redan bockat av ligger kvar.</div>
    <section class="rutopts">${dailyRoutines().map(r => `<button class="rutopt ${cur === r ? "on" : ""}" data-rutpick="${esc(r.id)}" aria-pressed="${cur === r}">
      <span class="rutrad" aria-hidden="true"></span><span class="grow"><b>${esc(r.name)}</b><small>${esc(exNames(r))}</small></span></button>`).join("")}</section>
    <button class="rutmanage" data-rutpage>Ändra mina dailys</button></div></div>`;
}


// Sidan Rutiner är nu Upplägg (dailyvy.js)
const rutinerView = () => uppView();

// Bocken sparar vilken rutin dagen hade, så att historiken visar rätt även om växlingen ändras
document.addEventListener("click", ev => {
  const c = ev.target.closest && ev.target.closest("[data-dcheck],[data-suppcheck],[data-runcheck]");
  if (c && dailyRoutines().length) { const L = day(), r = routineOn(logDate()); if (r && !L.dailyRoutine) L.dailyRoutine = r.id; }
  if (ev.target.closest && ev.target.closest("[data-tab]")) { const g = rutOpen && routineById(rutOpen); if (g) leaveGroup(g); rutPage = false; rutSheet = false; rutOpen = null; rutMenu = null; rutRename = null; uxOpen = null; }
}, true);

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-rutsheet],[data-rutpick],[data-rutpage],[data-rutback],[data-rutmode],[data-rutopen],[data-rutmenu],[data-rutren],[data-rutcopy],[data-rutdel],[data-rutnew],[data-rutsave],[data-rutcancel],[data-rutedit],[data-rutmv]");
  if (!t) return;
  const ds = t.dataset;
  // Bakgrunden stänger bladet, men inte tryck inne i bladet
  if (ds.rutsheet === "" && t.classList.contains("overlay") && ev.target !== t) return;
  ev.stopImmediatePropagation();
  if (ds.rutdel === undefined) rutDelArm = null;
  if (ds.rutsheet !== undefined) rutSheet = ds.rutsheet === "1";
  else if (ds.rutpick) { chooseRoutine(ds.rutpick); rutSheet = false; save(); toast(`Extra idag: ${routineById(ds.rutpick).name}`); }
  else if (ds.rutpage !== undefined) { rutSheet = false; rutPage = true; rutOpen = null; uxOpen = null; dailyEditing = false; uppMigrate(); save(); window.scrollTo(0, 0); }
  else if (ds.rutsave !== undefined) {
    // Spara: ett utkast blir en riktig grupp. Tillbaka till listan, där gruppen syns.
    const r = routineById(rutOpen);
    if (r) {
      if (r === rutDraft) {
        const L = S.dailyRoutines || (S.dailyRoutines = []);
        if (!r.name.trim()) r.name = `Extra ${L.length + 1}`;
        L.push(r); rutDraft = null;
        if (rutMode() === "rotate" && (!S.dailyAnchor || !routineById(S.dailyAnchor.id))) S.dailyAnchor = { date: TODAY, id: r.id };
      } else leaveGroup(r);
    }
    rutOpen = null; rutMenu = rutRename = null; uxOpen = null; save(); render();
    const el = r && document.querySelector(`[data-rutopen="${r.id}"]`);
    if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("up-flash"); }
    if (r) toast(`${r.name} är sparad`);
    return;
  }
  else if (ds.rutback !== undefined) {
    // Från en grupp tillbaka till Mina dailys (ett utkast försvinner), därifrån till Dailys
    if (rutOpen) { const r = routineById(rutOpen); if (r) leaveGroup(r); rutOpen = null; }
    else rutPage = false;
    rutMenu = rutRename = null; uxOpen = null; supplementEditing = null; window.scrollTo(0, 0);
  }
  else if (ds.rutmode) {
    // Byter man sätt räknas växlingen från dagens rutin
    const cur = routineOn(TODAY); S.dailyMode = ds.rutmode;
    if (cur) S.dailyAnchor = { date: TODAY, id: cur.id };
    save();
  }
  else if (ds.rutopen) { rutOpen = ds.rutopen; rutMenu = null; uxOpen = null; supplementEditing = null; window.scrollTo(0, 0); }
  else if (ds.rutmenu) { rutMenu = rutMenu === ds.rutmenu ? null : ds.rutmenu; rutRename = null; }
  else if (ds.rutren) { rutRename = ds.rutren; rutMenu = null; render(); const f = document.querySelector(".rutname input"); if (f) { f.focus(); f.select(); } return; }
  else if (ds.rutcopy) {
    const L = dailyRoutines(), i = L.findIndex(r => r.id === ds.rutcopy), r = L[i];
    const copy = { id: "r" + Date.now().toString(36), name: `${r.name} (kopia)`.slice(0, 40), ex: r.ex.map(e => ({ ...e })) };
    L.splice(i + 1, 0, copy); rutMenu = null; rutOpen = copy.id; save(); render(); window.scrollTo(0, 0);
    const f = document.querySelector(".up-name"); if (f) { f.focus(); f.select(); } return;
  }
  else if (ds.rutdel) {
    if (rutDelArm !== ds.rutdel) rutDelArm = ds.rutdel;
    else {
      const L = dailyRoutines(), r = routineById(ds.rutdel);
      if (r === rutDraft) { discardDraft(); rutDelArm = rutMenu = null; rutOpen = null; render(); return; }
      L.splice(L.indexOf(r), 1); rutDelArm = rutMenu = null; if (rutOpen === r.id) rutOpen = null;
      // Dagar med rutinen blir vila
      if (S.dailyWeek) S.dailyWeek = S.dailyWeek.map(x => x === r.id ? "" : x);
      if (S.dailyAnchor && S.dailyAnchor.id === r.id) S.dailyAnchor = L.length ? { date: TODAY, id: (routineOn(TODAY) || L[0]).id } : null;
      save(); toast(`${r.name} är borttagen`);
    }
  }
  else if (ds.rutnew !== undefined) {
    // Ny grupp öppnas direkt; namnet skrivs överst på dess sida. Den första frågar först hur de ska läggas upp.
    const r = { id: "r" + Date.now().toString(36), name: "", ex: [] };
    discardDraft(); rutDraft = r; rutOpen = r.id; rutMenu = null; uxOpen = null;
    if (!dailyRoutines().length) {
      S.dailyWeek = Array(7).fill("");
      if (ds.rutnew === "rotate") { S.dailyMode = "rotate"; S.dailyAnchor = { date: TODAY, id: r.id }; } else S.dailyMode = "week";
    }
    save(); render(); window.scrollTo(0, 0);
    const f = document.querySelector(".up-name"); if (f) f.focus();
    return;
  }
  else if (ds.rutcancel !== undefined) rutRename = null;
  else if (ds.rutmv) { const L = dailyRoutines(), i = L.findIndex(r => r.id === ds.rutmvid), j = i + +ds.rutmv; if (i >= 0 && j >= 0 && j < L.length) { L.splice(j, 0, L.splice(i, 1)[0]); save(); } }
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
    // Första extra gruppen: fasta veckodagar, inga dagar valda än (väljs på gruppens sida)
    if (L.length === 1) { S.dailyMode = "week"; S.dailyWeek = Array(7).fill(""); }
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

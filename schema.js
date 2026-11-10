"use strict";
// ---------- Aktiviteter i träningsschemat ----------
// Ett pass i schemat kan vara ett gympass (övningar med set och reps) eller en aktivitet (yoga, löpning …)
// med bara tid, sträcka och intensitet: { type: "act", name, ex: [], act: { min, km, int } }.
// En genomförd aktivitet sparas som ett vanligt pass i loggen med act: { name, min, km, int }, så att
// veckans pass, turordningen och historiken fungerar som för gympass. Pass man lägger till själv i
// schemat har extra: true och ligger kvar när programmet eller antalet pass ändras.
// Laddas före app.js; anropas först när appen ritas.

const ACT_CYCLE = ["Promenad", "Yoga", "Löpning", "Cykling", "Simning", "Promenad", "Yoga"];
const isActDay = d => !!d && d.type === "act";
function newActDay(a, extra, i = 0) {
  const act = { min: +a.min || 30, int: a.int || 2 };
  if (+a.km > 0) act.km = Math.round(+a.km * 10) / 10;
  return { id: `a${i}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, type: "act", name: a.name, ex: [], act, ...(extra ? { extra: true } : {}) };
}
const actGoal = d => [d.act.min ? `${d.act.min} min` : "", d.act.km ? `${fmtNum(d.act.km)} km` : "", INTENSITY[(d.act.int || 2) - 1].toLowerCase()].filter(Boolean).join(" · ");
const actDayKcal = d => actKcal({ name: d.name, min: d.act.min, int: d.act.int });
// Genomförda aktiviteter från schemat en dag
const schedActs = date => workoutsOn(date).filter(w => w.done && w.act).map(w => w.act);

// ---------- Timer ----------
// S.actRun = { dayId, date, start } medan en aktivitet pågår
const actRunning = d => S.actRun && S.actRun.dayId === d.id && S.actRun.date === TODAY ? S.actRun : null;
const mmss = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
setInterval(() => { if (S.actRun) document.querySelectorAll("[data-actclock]").forEach(el => { el.textContent = mmss(Date.now() - S.actRun.start); }); }, 1000);

// Knapparna för en aktivitet: Starta timer och Klar, Avsluta medan den pågår, Ändra när den är gjord
function actButtons(d, cls = "") {
  const w = workoutOn(TODAY, d.id), run = actRunning(d);
  if (w && w.done && w.act) return `<button class="${cls} grow" data-actdaydone="${d.id}" data-actdate="${TODAY}">${icon("edit", 16)}Ändra · ${esc(actLine(w.act))}</button>`;
  if (run) return `<button class="primary ${cls} grow" data-actstop="${d.id}">Avsluta · <span data-actclock>${mmss(Date.now() - run.start)}</span></button>`;
  return `<button class="primary ${cls} grow" data-actstart="${d.id}">${icon("play", 16)}Starta timer</button>
    <button class="${cls}" data-actdaydone="${d.id}" data-actdate="${TODAY}">${icon("check", 16)}Klar</button>`;
}
// Kortet på Träna när en aktivitet är vald: Mål innan, Resultat (mot målet) när den är gjord.
// Rutorna med resultatet går att trycka på för att ändra, precis som knappen Ändra.
function actPassCard(d, statusHtml, ok, next) {
  const w = workoutOn(TODAY, d.id), a = w && w.done && w.act;
  const attrs = `data-actdaydone="${d.id}" data-actdate="${TODAY}"`;
  const tile = (lbl, val, sub = "") => a ? `<button class="acttile" ${attrs} aria-label="Ändra ${lbl.toLowerCase()}"><span class="muted small">${lbl}</span><b>${val}</b>${sub ? `<i>${sub}</i>` : ""}</button>`
    : `<div class="acttile"><span class="muted small">${lbl}</span><b>${val}</b></div>`;
  const diff = a ? +a.min - +d.act.min : 0;
  const tiles = a
    ? tile("Tid", `${+a.min} min`, `mål ${d.act.min}${diff ? ` · ${diff > 0 ? "+" : "−"}${Math.abs(diff)}` : " · nått"}`)
      + tile("Sträcka", a.km ? `${fmtNum(a.km)} km` : "–", d.act.km ? `mål ${fmtNum(d.act.km)}` : "")
      + tile("Ungefär", `${actKcal(a)} kcal`)
    : tile("Tid", `${d.act.min} min`) + tile("Sträcka", d.act.km ? `${fmtNum(d.act.km)} km` : "–") + tile("Ungefär", `${actDayKcal(d)} kcal`);
  // Nästa pass i veckan som inte är gjort, så att man kommer vidare
  const L = S.plan.days, i = L.indexOf(d), nx = a && [...L.slice(i + 1), ...L.slice(0, i)].find(p => !completedPassDate(p));
  return `<section class="tpass actpass ${ok ? "ok" : next ? "next" : ""}" aria-label="${esc(d.name)}">
    <span class="row between tp-top">${statusHtml}<span class="tag act">Aktivitet</span></span>
    <span class="tp-namebtn"><span class="tp-name">${esc(d.name)}</span><span class="muted small tp-mus">${cap(INTENSITY[((a || d.act).int || 2) - 1].toLowerCase())}</span></span>
    <span class="klabel actsec">${a ? "Resultat" : "Mål"}</span>
    <div class="actgoal">${tiles}</div>
    <div class="tp-acts">${a ? `<button class="grow" ${attrs}>${icon("edit", 16)}Ändra</button>${nx ? `<button class="grow" data-trsel="${nx.id}">Nästa: ${esc(nx.name)}${icon("right", 14)}</button>` : ""}` : actButtons(d)}</div>
    ${a ? "" : `<div class="muted small actother">Gjorde du något annat? <button class="linkbtn2" data-actnew="" data-actdate="${TODAY}">Logga annan träning</button></div>`}</section>`;
}
// Ett genomfört aktivitetspass i historiken
function actPassSummary(w, date) {
  const d = dayById(w.dayId);
  return `<section class="hpass" aria-label="${esc(w.act.name)}">
    <div class="row between hpass-top"><span class="row" style="gap:8px">${tag("act")}<b>${esc(w.act.name)}</b></span><span class="muted small">${esc(actLine(w.act))}</span></div>
    <div class="muted small">${d ? "Från schemat" : "Aktivitet"} · ungefär ${actKcal(w.act)} kcal</div>
    ${d ? `<button class="small hedit" data-actdaydone="${d.id}" data-actdate="${date}">${icon("edit", 14)}Ändra</button>` : ""}</section>`;
}

// Bladet för att markera en aktivitet som klar (eller ändra den), i samma fönster som Annan träning
function openActDay(date, dayId) {
  const d = dayById(dayId), w = workoutOn(date, dayId), a = w && w.done && w.act;
  const run = date === TODAY && actRunning(d);
  const min = run ? Math.max(1, Math.round((Date.now() - run.start) / 60000)) : a ? a.min : d.act.min;
  actSheet = { date, idx: null, dayId, name: a ? a.name : d.name, min, int: a ? a.int || 2 : d.act.int || 2, km: a ? a.km || "" : d.act.km || "", custom: false, done: !!a };
}
// Lägg till eller ändra ett pass i schemat (upplägget)
function openPlanSheet(i) {
  const d = i != null ? draft.days[i] : null, fixed = draft.mode === "fixed";
  const sorted = draft.weekdays.slice().sort((a, b) => a - b);
  const free = WD.map((_, k) => k).filter(k => !sorted.includes(k));
  actSheet = d ? { plan: true, i, gym: !isActDay(d), name: d.name, min: d.act ? d.act.min : 30, int: d.act ? d.act.int || 2 : 2, km: d.act && d.act.km || "",
      custom: isActDay(d) && !actInfo(d.name), wd: fixed ? sorted[i] : null }
    : { plan: true, i: null, gym: false, name: "Yoga", min: 30, int: 1, km: "", custom: false, wd: fixed ? free[0] ?? null : null };
}
// Delar av bladet som bara finns för schemat eller för en aktivitet i schemat
function planSheetTop(s) {
  if (!s.plan || s.i != null) return "";
  return `<div class="seg two plankind" role="radiogroup" aria-label="Typ av pass"><button data-plankind="gym" class="${s.gym ? "on" : ""}" role="radio" aria-checked="${s.gym}">Gympass</button>
    <button data-plankind="act" class="${s.gym ? "" : "on"}" role="radio" aria-checked="${!s.gym}">Aktivitet</button></div>`;
}
function planSheetDays(s) {
  if (!s.plan || draft.mode !== "fixed") return "";
  const sorted = draft.weekdays.slice().sort((a, b) => a - b), own = s.i != null ? sorted[s.i] : null;
  return `<div class="klabel" style="margin-top:14px">Dag</div><div class="seg wd planwd">${WD.map((n, k) => {
    const taken = sorted.includes(k) && k !== own;
    return `<button data-planwd="${k}" class="${s.wd === k ? "on" : ""}" ${taken ? "disabled" : ""} aria-pressed="${s.wd === k}" aria-label="${cap(WD_LONG[k])}">${n[0]}</button>`;
  }).join("")}</div>`;
}
function planSave(s) {
  const fixed = draft.mode === "fixed", days = draft.days;
  let sorted = draft.weekdays.slice().sort((a, b) => a - b);
  let d;
  if (s.i != null) {
    d = days[s.i];
    if (s.gym) { d.name = s.name.trim().slice(0, 30) || d.name; d.named = true; }
    else { d.name = s.name.trim().slice(0, 30); d.act = newActDay(s).act; }
    if (!fixed || s.wd == null || s.wd === sorted[s.i]) return;
    days.splice(s.i, 1); sorted.splice(s.i, 1);   // ny dag: flyttas till sin plats nedan
  } else {
    d = s.gym ? { id: `d${days.length + 1}-custom-${Date.now().toString(36)}`, type: "custom", name: s.name.trim().slice(0, 30) || "Pass", named: true, ex: [], extra: true }
      : newActDay({ ...s, name: s.name.trim().slice(0, 30) }, true, days.length);
  }
  if (fixed && s.wd != null) {
    const k = sorted.filter(x => x < s.wd).length;
    days.splice(k, 0, d); sorted.splice(k, 0, s.wd);
    draft.weekdays = sorted;
  } else {
    days.push(d);
    if (draft.weekdays.length !== days.length) draft.weekdays = DEFAULT_WEEKDAYS[days.length].slice();
  }
}
function planRemove(i) {
  const d = draft.days[i];
  if (draft.days.length < 2) return;
  const sorted = draft.weekdays.slice().sort((a, b) => a - b);
  draft.days.splice(i, 1);
  if (!d.extra) draft.count = Math.max(0, draft.count - 1);
  if (sorted.length > draft.days.length) { sorted.splice(i, 1); draft.weekdays = sorted; }
}

// Veckans pass i upplägget: gympass och aktiviteter i samma lista. Dra i numret för att flytta.
let planMenu = null, planDelArm = null;
function planList() {
  const fixed = draft.mode === "fixed", sorted = draft.weekdays.slice().sort((a, b) => a - b), ok = !fixed || sorted.length === draft.days.length;
  return `<div class="row between planhead"><span class="klabel">Veckans pass · ${draft.days.length}</span>${draft.days.length > 1 ? `<span class="muted small">Dra för att flytta</span>` : ""}</div>
    <section class="h3-list planlist">${draft.days.map((d, i) => {
      const act = isActDay(d), sub = act ? `Aktivitet · ${actGoal(d)}` : `Gympass · ${d.ex.length} ${d.ex.length === 1 ? "övning" : "övningar"}`;
      return `<div class="planrow"><div class="h3-row"><span class="plannum" data-plandrag="${i}" aria-label="Dra för att flytta ${esc(d.name)}">${fixed && ok ? WD[sorted[i]].slice(0, 2) : i + 1}</span>
        <span class="h3-ic ${act ? "actic" : "gymic"}">${icon(act ? "aktivitet" : "trana", 18)}</span>
        <span class="grow"><b>${esc(d.name)}</b><small>${esc(sub)}</small></span>
        <button class="rutdots" data-planmenu="${i}" aria-label="Fler val för ${esc(d.name)}">⋯</button></div>
        ${planMenu === i ? `<div class="rutmenu"><button class="small" data-planedit="${i}">${act ? "Ändra" : "Byt namn"}</button>
          ${draft.days.length > 1 ? `<button class="small ${planDelArm === i ? "dangerbtn" : ""}" data-plandel="${i}">${planDelArm === i ? "Tryck igen för att ta bort" : "Ta bort"}</button>` : ""}</div>` : ""}</div>`;
    }).join("")}</section>
    <button class="wide planadd" data-planadd ${draft.days.length >= 7 ? "disabled" : ""}>${icon("plus", 16)}Lägg till pass</button>`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-actstart],[data-actstop],[data-actdaydone],[data-plankind],[data-planwd],[data-planmenu],[data-planedit],[data-plandel],[data-planadd],[data-seepass],[data-pick],[data-focusstart]");
  if (!t || t.disabled) return;
  const ds = t.dataset;
  // Pass som är aktiviteter har inga övningar: Se passet och Starta leder till aktivitetens kort på Träna
  const id = ds.seepass || ds.pick || ds.focusstart;
  if (id) {
    const d = dayById(id);
    if (!isActDay(d)) return;
    ev.stopImmediatePropagation();
    if (ds.focusstart) S.actRun = { dayId: d.id, date: TODAY, start: Date.now() };
    tab = "pass"; trSel = d.id; passOpen = false; chosenDay = null; passDone = null;
    save(); render(); window.scrollTo(0, 0); return;
  }
  ev.stopImmediatePropagation();
  if (ds.planmenu === undefined && ds.plandel === undefined) planDelArm = null;
  if (ds.actstart) { S.actRun = { dayId: ds.actstart, date: TODAY, start: Date.now() }; save(); }
  else if (ds.actstop) openActDay(TODAY, ds.actstop);
  else if (ds.actdaydone) openActDay(ds.actdate || TODAY, ds.actdaydone);
  else if (ds.plankind) { const s = actSheet; s.gym = ds.plankind === "gym"; s.name = s.gym ? "" : "Yoga"; s.custom = false; }
  else if (ds.planwd) actSheet.wd = +ds.planwd;
  else if (ds.planmenu) planMenu = planMenu === +ds.planmenu ? null : +ds.planmenu;
  else if (ds.planedit) { planMenu = null; openPlanSheet(+ds.planedit); }
  else if (ds.plandel) {
    if (planDelArm !== +ds.plandel) planDelArm = +ds.plandel;
    else { planRemove(+ds.plandel); planDelArm = planMenu = null; }
  }
  else if (ds.planadd !== undefined) { planMenu = null; openPlanSheet(null); }
  render();
}, true);

// Spara och Ta bort i bladet när det gäller schemat eller en aktivitet i schemat (annars sköter aktivitet.js det)
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-actsave],[data-actdel]");
  const s = actSheet;
  if (!t || t.disabled || !s || !(s.plan || s.dayId)) return;
  ev.stopImmediatePropagation();
  const nameEl = document.getElementById("actname"), kmEl = document.getElementById("actkm");
  if (nameEl) s.name = nameEl.value;
  if (kmEl) s.km = kmEl.value;
  if (s.plan) { if (t.dataset.actsave !== undefined) planSave(s); actSheet = null; render(); return; }
  const L = day(s.date), d = dayById(s.dayId);
  if (t.dataset.actdel !== undefined) {
    L.workouts = L.workouts.filter(w => w.dayId !== s.dayId);
    shareAct({ name: s.name, min: s.min }, s.date, false);
    toast(`${s.name} borttagen från ${s.date === TODAY ? "idag" : dateLabel(s.date)}`);
  } else {
    const a = { name: s.name.trim().slice(0, 30) || d.name, min: s.min, int: s.int };
    if (+s.km > 0) a.km = Math.round(+s.km * 10) / 10;
    let w = L.workouts.filter(x => x.dayId === s.dayId).pop();
    if (!w) L.workouts.push(w = { dayId: s.dayId, sets: {} });
    w.done = true; w.act = a; w.end = w.end || Date.now();
    if (S.actRun && S.actRun.dayId === s.dayId) { w.start = S.actRun.start; S.actRun = null; }
    shareAct(a, s.date, true);
    toast(`${a.name} klar`);
  }
  actSheet = null; save(); render();
}, true);

// Dra i numret för att ändra ordning på passen i schemat
(() => {
  let drag = null;
  document.addEventListener("pointerdown", ev => {
    const h = ev.target.closest && ev.target.closest("[data-plandrag]");
    if (!h || !draft || draft.days.length < 2) return;
    const rows = [...document.querySelectorAll(".planlist .planrow")], from = +h.dataset.plandrag;
    drag = { from, to: from, y0: ev.clientY, rows, el: rows[from], tops: rows.map(r => r.getBoundingClientRect()), id: ev.pointerId };
    drag.el.classList.add("dragging");
    h.setPointerCapture && h.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });
  document.addEventListener("pointermove", ev => {
    if (!drag || ev.pointerId !== drag.id) return;
    const dy = ev.clientY - drag.y0, { from, rows, tops } = drag, h = tops[from].height, mid = tops[from].top + h / 2 + dy;
    drag.el.style.transform = `translateY(${dy}px)`;
    let to = from;
    tops.forEach((r, i) => { if (i < from && mid < r.top + r.height / 2) to = Math.min(to, i); if (i > from && mid > r.top + r.height / 2) to = Math.max(to, i); });
    drag.to = to;
    rows.forEach((r, i) => { if (i !== from) r.style.transform = i >= to && i < from ? `translateY(${h}px)` : i <= to && i > from ? `translateY(${-h}px)` : ""; });
  });
  const end = ev => {
    if (!drag || ev.pointerId !== drag.id) return;
    const { from, to, rows } = drag; drag = null;
    rows.forEach(r => { r.style.transform = ""; r.classList.remove("dragging"); });
    if (to === from || !draft) return;
    // Veckodagarna står still; passen byter plats
    draft.days.splice(to, 0, draft.days.splice(from, 1)[0]);
    render();
  };
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
})();

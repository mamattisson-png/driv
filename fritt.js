"use strict";
// ---------- Inget schema ----------
// Med S.plan.free loggar man fritt: gympass (fritt pass eller en passmall) och motion, och allt räknas mot
// veckans mål (S.plan.count). Passen i schemat ligger kvar men används inte, så att man kan gå tillbaka.
// Det fria gympasset är en egen dag (S.freeDay, id "fritt") med samma form som schemats pass, så att fokusläget,
// loggen, historiken och "Spara som passmall" fungerar som vanligt. Laddas före app.js.

const freeDay = () => S.freeDay || (S.freeDay = { id: "fritt", type: "custom", name: "Fritt pass", named: true, ex: [] });

// Starta ett fritt gympass: pågår ett redan fortsätter det, annars börjar man med att välja första övningen
function startFreeGym() {
  const d = freeDay(), w = workoutOn(logDate(), d.id);
  tab = "pass"; passOpen = false; editing = false;
  if (w && !w.done && d.ex.length) { startFocus(d.id); return; }
  d.ex = [];
  openLibrary({ kind: "workout", target: d.id, startFree: true });
}

// Motion med tomt schema: målet överst, veckan som sju dagar där varje loggat pass landar på sin dag,
// en knapp för att logga och de loggade passen som kort. Ingen gymdel.
function motionFreeView() {
  const ws = weekStart(TODAY), passes = weekSummary(ws).passes, goal = S.plan.count, left = Math.max(0, goal - passes);
  const all = weekDates(ws).map(date => ({ date, acts: actsOn(date).map((a, i) => ({ a, i })) }));
  const days = all.map(({ date, acts }, k) => {
    const mins = acts.reduce((t, x) => t + (+x.a.min || 0), 0), cls = acts.length ? "has" : date === TODAY ? "today" : date > TODAY ? "later" : "";
    return `<div class="mfday ${cls}"><small>${WD[k][0]}</small><span class="mfdot">${acts.length ? icon("check", 16) : ""}</span><em>${acts.length ? `${mins}′` : ""}</em></div>`;
  }).join("");
  const cards = all.slice().reverse().filter(x => x.date <= TODAY).flatMap(({ date, acts }) => acts.slice().reverse().map(({ a, i }) =>
    `<button class="mfcard" data-actedit="${i}" data-actdate="${date}"><span class="h3-ic actic">${icon("aktivitet", 18)}</span>
      <span class="grow"><b>${esc(a.name)}</b><small>${date === TODAY ? "Idag" : cap(WD_LONG[weekdayOf(date)])}</small></span>
      <span class="mfstat"><b>${+a.min || 0}</b><small>min</small></span><span class="mfstat"><b>${actKcal(a)}</b><small>kcal</small></span></button>`));
  return `<div class="muted small toplabel">Vecka ${weekNo(TODAY)}</div><h1>Träna</h1>
    <section class="card mfhero">
      <div class="row between"><span class="klabel">Veckans mål</span><button class="linkbtn2" data-tab="upplagg">Ändra${icon("right", 14)}</button></div>
      <div class="mfgoal"><b>${passes}</b><span>av ${goal} pass</span></div>
      <div class="mfweek">${days}</div>
      <button class="primary wide mflog" data-actnew="" data-actdate="${TODAY}">${icon("plus", 18)}Logga motion</button>
    </section>
    <div class="row between mfhead"><span class="klabel">Loggat</span><span class="muted small">${left ? `${left} kvar till målet` : "Målet är nått"}</span></div>
    ${cards.length ? `<div class="mfcards">${cards.join("")}</div>`
      : `<div class="mfempty"><span class="h3-ic actic">${icon("aktivitet", 20)}</span><b>Ditt första pass landar här</b><small>Promenad, löpning, padel, yoga …</small></div>`}
    ${histDay ? daySheet() : ""}`;
}

function freeTrainView() {
  if (S.plan.motionOnly) return motionFreeView();
  const ws = weekStart(TODAY), passes = weekSummary(ws).passes, goal = S.plan.count;
  const d = freeDay(), w = workoutOn(TODAY, d.id), going = w && !w.done && d.ex.length;
  const bar = `<div class="freebar" aria-label="${passes} av ${goal} pass">${Array.from({ length: Math.max(goal, Math.min(passes, 7)) }, (_, i) => `<span class="${i < passes ? "on" : ""}"></span>`).join("")}</div>`;
  const row = (ic, cls, title, sub, attrs, end) => `<button class="h3-row" ${attrs}><span class="h3-ic ${cls}">${icon(ic, 18)}</span><span class="grow"><b>${title}</b><small>${sub}</small></span>${end}</button>`;
  // Veckans loggade träning, senast först: gympass och motion
  const items = [];
  for (const date of weekDates(ws).filter(x => x <= TODAY).reverse()) {
    const when = date === TODAY ? "Idag" : cap(WD_LONG[weekdayOf(date)]);
    for (const x of workoutsOn(date).slice().reverse()) {
      const p = dayById(x.dayId), n = Object.values(x.sets).filter(a => a.some(hasData)).length;
      if (!x.done && !n && !(x.dayId === d.id && going && date === TODAY)) continue;
      if (x.act) { items.push(row("aktivitet", "actic", esc(x.act.name), esc(`${when} · ${actLine(x.act)}`), `data-freeday="${date}"`, icon("right", 18))); continue; }
      const live = !x.done && date === TODAY;
      // Fria pass heter efter övningarna ("Bänkpress, Hantelpress"), andra pass efter sitt namn
      const exs = Object.keys(x.sets).filter(id => EX[id] && x.sets[id].some(hasData)).map(id => EX[id].name);
      const title = x.dayId === "fritt" && exs.length ? exs.slice(0, 2).join(", ") + (exs.length > 2 ? " …" : "") : p ? p.name : "Pass";
      const sets = Object.values(x.sets).reduce((a, arr) => a + arr.filter(hasData).length, 0);
      items.push(row("trana", "gymic", esc(title), esc(`${when} · ${live ? "pågår · " : "gym · "}${sets} set`),
        live ? `data-focusstart="${x.dayId}"` : `data-freeday="${date}"`, live ? `<span class="accenttext small">Fortsätt</span>` : icon("right", 18)));
    }
    actsOn(date).forEach((a, i) => items.push(row("aktivitet", "actic", esc(a.name), esc(`${when} · ${actLine(a)} · ${actKcal(a)} kcal`), `data-actedit="${i}" data-actdate="${date}"`, icon("edit", 18))));
  }
  const L = tpls();
  return `<div class="muted small toplabel">Vecka ${weekNo(TODAY)} · ${passGoal(passes)}</div><h1>Träna</h1>
    ${bar}
    <div class="row between freehead"><span class="muted small">Inget schema · du loggar fritt</span><button class="linkbtn2" data-tab="upplagg">Välj schema${icon("right", 14)}</button></div>
    <div class="klabel h3-sec">Logga träning</div>
    <div class="row freebtns"><button class="primary grow" data-freegym>${icon("trana", 18)}${going ? "Fortsätt gympass" : "Gympass"}</button>
      <button class="grow" data-actnew="" data-actdate="${TODAY}">${icon("aktivitet", 18)}Motion</button></div>
    <div class="muted small freenote">Gympass: välj övningar medan du kör. Motion: sök bland löpning, padel, EMS …</div>
    ${L.length ? `<div class="klabel h3-sec">Passmallar</div><section class="h3-list">${L.map(p => row("trana", "gymic", esc(p.name), `${p.ex.length} ${p.ex.length === 1 ? "övning" : "övningar"}`, `data-focusstart="${p.id}"`, `<span class="accenttext small">Starta</span>`)).join("")}</section>` : ""}
    <div class="klabel h3-sec">Den här veckan</div>
    ${items.length ? `<section class="h3-list">${items.join("")}</section>` : `<div class="muted small freeempty">Inget loggat än den här veckan.</div>`}
    <div class="klabel h3-sec">Mer</div>
    <section class="h3-list">${row("search", "", "Övningar", `${Object.keys(EX).length} övningar · sök och läs instruktioner`, "data-exlib", icon("right", 18))}</section>
    ${histDay ? daySheet() : ""}`;
}

// Det fria passet har ett eget, rakt flöde: pågår det leder varje "se passet" och "fortsätt" direkt in i passet,
// aldrig till schemats passida (som är byggd för pass med planerade övningar)
const freeLive = () => { const w = workoutOn(TODAY, "fritt"); return !!(focus && focus.dayId === "fritt") || !!(w && !w.done && freeDay().ex.length); };
function resumeFree() {
  histDay = null; editDate = null; passOpen = false; chosenDay = null; editing = false; tab = "pass";
  if (focus && focus.dayId === "fritt") focus.suspended = false; else startFocus("fritt");
}
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-freegym],[data-freeday],[data-seepass='fritt'],[data-pick='fritt'],[data-hpass='fritt'],[data-focusstart='fritt']");
  if (!t) return;
  const ds = t.dataset;
  // Ändra ett avslutat fritt pass i Historiken sköts som vanligt
  if (ds.hpass !== undefined && !(histDay === TODAY && freeLive())) return;
  ev.stopImmediatePropagation();
  if (ds.freegym !== undefined) startFreeGym();
  else if (ds.freeday) histDay = ds.freeday;   // dagen öppnas ovanpå Träna
  else if (freeLive()) resumeFree();
  else { tab = "pass"; passOpen = false; chosenDay = null; histDay = null; }   // inget pågår: till Träna
  save(); render(); window.scrollTo(0, 0);
}, true);

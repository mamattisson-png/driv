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

function freeTrainView() {
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
      items.push(row("trana", "gymic", esc(p ? p.name : "Pass"), esc(`${when} · ${live ? "pågår · " : ""}${n} ${n === 1 ? "övning" : "övningar"}`),
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
    <section class="h3-list">${row("search", "", "Övningar", `${Object.keys(EX).length} övningar · sök och läs instruktioner`, "data-exlib", icon("right", 18))}</section>`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-freegym],[data-freeday],[data-seepass='fritt']");
  if (!t) return;
  ev.stopImmediatePropagation();
  if (t.dataset.freegym !== undefined) startFreeGym();
  else if (t.dataset.freeday) { histDay = t.dataset.freeday; tab = "historik"; }
  else { tab = "pass"; passOpen = false; chosenDay = null; }   // Se passet på Hem: till Träna
  save(); render(); window.scrollTo(0, 0);
}, true);

"use strict";
// ---------- Vilotimer ----------
// Laddas före app.js; funktionerna anropas först när appen används.
// Startar när ett set bockas av. Isoleringsövningar och mage vilar kortare än basövningar.
const ISOLATION = new Set(["sidolyft", "triceps_pushdown", "fransk_press", "bicepscurl", "hammercurl", "face_pulls",
  "benspark", "bencurl", "vadpress", "glute_bridge"]);
const restSettings = () => Object.assign({ on: true, compound: 90, iso: 60 }, S.rest);
const restFor = id => ISOLATION.has(id) || EX[id].cat === "core" || EX[id].cat === "stretch" ? restSettings().iso : restSettings().compound;
const rest = { el: null, end: 0, total: 0, timer: 0, name: "" };

function startRest(exId) {
  if (!restSettings().on) return;
  unlockAudio();
  rest.total = restFor(exId);
  rest.end = Date.now() + rest.total * 1000;
  rest.name = EX[exId].name;
  if (!rest.el) {
    rest.el = document.createElement("div");
    rest.el.className = "rest";
    rest.el.setAttribute("role", "timer");
    rest.el.innerHTML = `<div class="rest-bar"><div></div></div>
      <div class="rest-row"><div><b class="rest-time"></b> <span class="rest-label muted small"></span></div>
        <div class="row"><button class="small" data-restadd="-15">−15</button><button class="small" data-restadd="15">+15</button>
          <button class="small" data-restskip>Klar</button></div></div>`;
    document.body.appendChild(rest.el);
    // Dialoger lägger sig ovanför timern; höjden mäts eftersom den beror på textstorleken
    const measure = () => rest.el && document.body.style.setProperty("--rest-h", rest.el.offsetHeight + "px");
    if (window.ResizeObserver) new ResizeObserver(measure).observe(rest.el);
    measure();
  }
  document.body.classList.add("resting");
  rest.el.classList.remove("ding");
  clearInterval(rest.timer);
  rest.timer = setInterval(tickRest, 250);
  tickRest();
}

function tickRest() {
  const left = Math.max(0, Math.ceil((rest.end - Date.now()) / 1000));
  const txt = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  rest.el.querySelector(".rest-time").textContent = txt;
  // Fokusläget visar tiden bredvid Klart set
  for (const el of document.querySelectorAll(".frest-time")) { el.textContent = txt; el.parentNode.classList.add("on"); }
  rest.el.querySelector(".rest-label").textContent = left ? `vila efter ${rest.name}` : "dags för nästa set!";
  rest.el.querySelector(".rest-bar div").style.width = `${rest.total ? (1 - left / rest.total) * 100 : 100}%`;
  if (left) return;
  clearInterval(rest.timer);
  rest.el.classList.add("ding");
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  beep();
  setTimeout(stopRest, 6000);
}

function stopRest() {
  clearInterval(rest.timer);
  if (rest.el) rest.el.remove();
  rest.el = null;
  document.body.classList.remove("resting");
}

// Kort ljudsignal; tillåts eftersom timern startas av ett tryck
let audioCtx = null;
// iOS tillåter bara ljud som startats av ett tryck; därför väcks ljudet när vilan startar
function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) { /* inget ljud */ }
}
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    for (const [at, freq] of [[0, 880], [0.25, 1175]]) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime + at;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g).connect(audioCtx.destination);
      o.start(t); o.stop(t + 0.22);
    }
  } catch (e) { /* ljud stöds inte här */ }
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-restadd], [data-restskip]");
  if (!t) return;
  ev.stopImmediatePropagation();
  if (t.dataset.restskip !== undefined) return stopRest();
  rest.end = Math.max(Date.now(), rest.end + +t.dataset.restadd * 1000);
  rest.total = Math.max(rest.total, Math.ceil((rest.end - Date.now()) / 1000));
  if (!rest.timer || rest.el.classList.contains("ding")) { rest.el.classList.remove("ding"); clearInterval(rest.timer); rest.timer = setInterval(tickRest, 250); }
  tickRest();
}, true);

// ---------- Starta en daily ----------
// Set för set: övningar på tid räknas ned (efter några sekunder att komma i position),
// övningar med reps bockas av med Klart set. Vila mellan seten, och sista setet bockar av dailyn.
let dtimer = null;
const DT_PREP = 5;
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function startDaily(id) {
  const e = S.daily.find(x => x.id === id);
  if (!e) return;
  unlockAudio();
  dtimer = { id, sets: Math.max(1, +e.sets || 1), secs: isTimed(id) ? repRange(e.reps).hi || 30 : 0, reps: e.reps, set: 1, phase: "ready", end: 0, total: 0, t: 0 };
  render();
}
function dtPhase(phase, secs = 0) {
  clearInterval(dtimer.t);
  Object.assign(dtimer, { phase, total: secs, end: Date.now() + secs * 1000, t: secs ? setInterval(dtTick, 250) : 0 });
  keepAwake(!!secs || !!focus);
  render();
  if (secs) dtTick();
}
function dtTick() {
  if (!dtimer) return;
  const left = Math.max(0, Math.ceil((dtimer.end - Date.now()) / 1000));
  const el = document.querySelector(".dt-time"), fg = document.querySelector(".dtring .hring-fg");
  if (el) el.textContent = mmss(left);
  if (fg) fg.setAttribute("stroke-dasharray", `${(125.66 * (dtimer.total ? 1 - left / dtimer.total : 1)).toFixed(1)} 125.66`);
  if (left) return;
  if (navigator.vibrate) navigator.vibrate(dtimer.phase === "prep" ? 150 : [200, 100, 200]);
  beep();
  if (dtimer.phase === "prep") dtPhase("work", dtimer.secs);
  else if (dtimer.phase === "work") dtSetDone();
  else { dtimer.set++; dtPhase("ready"); }
}
function dtSetDone() {
  if (dtimer.set < dtimer.sets) return dtPhase("rest", restSettings().iso);
  day().dailies[dtimer.id] = true;
  save();
  dtPhase("done");
}
function dtClose() {
  clearInterval(dtimer.t);
  dtimer = null;
  keepAwake(!!focus);
  render();
}

function dtimerView() {
  const d = dtimer, timed = !!d.secs, running = ["prep", "work", "rest"].includes(d.phase);
  const label = { ready: timed ? "Redo" : "reps", prep: "Gör dig redo", work: "Håll i", rest: "Vila", done: "Klart!" }[d.phase];
  const dots = Array.from({ length: d.sets }, (_, i) => `<span class="dtdot ${i + 1 < d.set || d.phase === "done" || (i + 1 === d.set && d.phase === "rest") ? "ok" : i + 1 === d.set ? "on" : ""}"></span>`).join("");
  const center = d.phase === "done" ? `<span class="dtcheck">${icon("check", 44)}</span>`
    : running ? `<b class="dt-time">${mmss(Math.max(0, Math.ceil((d.end - Date.now()) / 1000)))}</b>`
    : `<b class="dt-time">${timed ? mmss(d.secs) : esc(String(d.reps).replace(/\s*reps?/, ""))}</b>`;
  const btns = {
    ready: timed ? `<button class="primary wide bigbtn" data-dtgo>${icon("play", 18)}Starta set ${d.set}</button>`
      : `<button class="primary wide bigbtn" data-dtset>${icon("check", 18)}Klart set ${d.set}</button>`,
    prep: `<button class="wide" data-dtstop>Avbryt</button>`,
    work: `<div class="row sheetbtns"><button class="grow" data-dtstop>Avbryt</button><button class="grow primary" data-dtset>Klart</button></div>`,
    rest: `<div class="row sheetbtns"><button class="grow" data-dtadd="15">+15 s</button><button class="grow primary" data-dtskip>Hoppa över vilan</button></div>`,
    done: `<button class="primary wide bigbtn" data-dtclose>Klar</button>`,
  }[d.phase];
  return `<div class="overlay dtover"><div class="sheet dtsheet ${d.phase}" role="dialog" aria-label="${esc(EX[d.id].name)}">
    <div class="row between"><div><span class="klabel">${d.phase === "done" ? "Daily avbockad" : `Set ${d.set} av ${d.sets}`}</span><h2 class="sheeth">${esc(EX[d.id].name)}</h2></div>
      <button class="small ghost iconbtn" data-dtclose aria-label="Stäng">${icon("close", 18)}</button></div>
    <div class="dtmid">${figure(d.id, "dtfig", d.phase === "work" || !timed)}
      <div class="dtring">${ring(running ? 1e-9 : d.phase === "done" ? 1 : 0, 168, d.phase === "done" ? "ok" : "dt-" + d.phase)}<div class="dtcenter">${center}<span class="dtlabel">${label}</span></div></div></div>
    <div class="dtdots" aria-label="Set ${d.set} av ${d.sets}">${dots}</div>
    ${btns}</div></div>`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-dstart],[data-dtgo],[data-dtset],[data-dtstop],[data-dtskip],[data-dtadd],[data-dtclose]");
  if (!t) return;
  ev.stopImmediatePropagation();
  const ds = t.dataset;
  if (ds.dstart) return startDaily(ds.dstart);
  if (!dtimer) return;
  unlockAudio();
  if (ds.dtclose !== undefined) dtClose();
  else if (ds.dtgo !== undefined) dtPhase("prep", DT_PREP);
  else if (ds.dtset !== undefined) dtSetDone();
  else if (ds.dtstop !== undefined) dtPhase("ready");
  else if (ds.dtskip !== undefined) { dtimer.set++; dtPhase("ready"); }
  else if (ds.dtadd) { dtimer.end += +ds.dtadd * 1000; dtimer.total += +ds.dtadd; dtTick(); }
}, true);

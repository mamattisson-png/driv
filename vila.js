"use strict";
// ---------- Vilotimer ----------
// Laddas före app.js; funktionerna anropas först när appen används.
// Startar när ett set bockas av. Isoleringsövningar och mage vilar kortare än basövningar.
const ISOLATION = new Set(["sidolyft", "triceps_pushdown", "fransk_press", "bicepscurl", "hammercurl", "face_pulls",
  "benspark", "bencurl", "vadpress", "glute_bridge"]);
const restSettings = () => Object.assign({ on: true, compound: 90, iso: 60 }, S.rest);
const restFor = id => ISOLATION.has(id) || EX[id].cat === "core" || EX[id].cat === "stretch" ? restSettings().iso : restSettings().compound;
const rest = { el: null, end: 0, total: 0, timer: 0, cleanup: 0, name: "" };

function startRest(exId) {
  if (!restSettings().on) return;
  clearTimeout(rest.cleanup); rest.cleanup = 0;
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
  if (!rest.el) return;
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
  rest.cleanup = setTimeout(stopRest, 6000);
}

function stopRest() {
  clearInterval(rest.timer);
  clearTimeout(rest.cleanup);
  rest.timer = 0; rest.cleanup = 0; rest.end = 0; rest.total = 0; rest.name = '';
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
  clearTimeout(rest.cleanup); rest.cleanup = 0;
  rest.end = Math.max(Date.now(), rest.end + +t.dataset.restadd * 1000);
  rest.total = Math.max(rest.total, Math.ceil((rest.end - Date.now()) / 1000));
  if (!rest.timer || rest.el.classList.contains("ding")) { rest.el.classList.remove("ding"); clearInterval(rest.timer); rest.timer = setInterval(tickRest, 250); }
  tickRest();
}, true);

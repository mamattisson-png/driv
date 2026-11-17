"use strict";
// ---------- Dina värden ----------
// En hel sida för kön, ålder, längd, vikt och aktivitetsnivå. Ålder, längd och vikt ställs in med en linjal
// som man drar i sidled; BMI och förbrukningen räknas om direkt. Inget måste fyllas i: utan egna värden
// används standardvärdena (S.profileSet är då false). Värdena styr kalorimålet och hur mycket motion förbränner.
// Laddas före app.js.

const DEFAULT_PROFILE = { sex: "m", age: 30, height: 180, weight: 80, activity: 1.55 };
let vardenBack = "profil";
// Linjalerna: min, max, steg, punkter per enhet, ett streck per, en siffra per
// Vägningen (wlog) har en egen linjal som inte sparar förrän man trycker Spara vägning
let wDraft = null;
let wDate = null;   // dagen som vägs på sidan Vikt (null = idag); tidigare dagar går att väga in eller rätta
const wDay = () => wDate && wDate <= TODAY ? wDate : TODAY;
const wlogStart = () => weights()[wDay()] ?? (latestWeight() || {}).kg ?? S.profile.weight;
document.addEventListener("change", ev => {
  const t = ev.target.closest && ev.target.closest("[data-wdatein]");
  if (!t || !t.value) return;
  wDate = t.value > TODAY ? TODAY : t.value; wDraft = null; render();
});
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-wpick]");
  if (!t) return;
  ev.stopImmediatePropagation();
  wDate = t.dataset.wpick; wDraft = null; render();
  const r = document.querySelector(".vk-dayrow"); if (r) r.scrollIntoView({ block: "center" });
}, true);
const rulGet = f => f === "wlog" ? (wDraft ?? wlogStart()) : S.profile[f];
function rulSet(f, v) { if (f === "wlog") wDraft = v; else setProfileValue(f, v); }
const RULERS = {
  age: { min: 15, max: 90, step: 1, px: 14, tick: 1, label: 5, unit: "år" },
  height: { min: 120, max: 220, step: 1, px: 10, tick: 1, label: 10, unit: "cm" },
  weight: { min: 30, max: 200, step: 0.1, px: 22, tick: 1, label: 5, unit: "kg" },
  wlog: { min: 30, max: 200, step: 0.1, px: 22, tick: 1, label: 5, unit: "kg" },
};
const BMI_CLASSES = [[18.5, "Undervikt", "u"], [25, "Normalvikt", "n"], [30, "Övervikt", "o"], [Infinity, "Fetma", "f"]];
const bmiOf = p => p.weight / Math.pow(p.height / 100, 2);
const bmiClass = b => BMI_CLASSES.find(c => b < c[0]);
const rulFmt = (f, v) => f === "weight" || f === "wlog" ? fmtNum(Math.round(v * 10) / 10) : String(Math.round(v));
// Linjalens läge räknas ut från värdet: 15–35 på BMI-skalan
const bmiPos = b => Math.max(0, Math.min(100, (b - 15) / 20 * 100));

function ruler(f) {
  const r = RULERS[f], v = rulGet(f), n = Math.round((r.max - r.min) / r.label);
  const labels = Array.from({ length: n + 1 }, (_, i) => `<span style="left:${i * r.label * r.px}px">${r.min + i * r.label}</span>`).join("");
  return `<div class="rulbox"><div class="rulval"><b id="rv-${f}">${rulFmt(f, v)}</b><span>${r.unit}</span></div>
    <div class="rul" data-rul="${f}" tabindex="0" role="slider" aria-label="${{ age: "Ålder", height: "Längd", weight: "Vikt", wlog: "Vikt" }[f]}" aria-valuemin="${r.min}" aria-valuemax="${r.max}" aria-valuenow="${v}">
      <i class="rulpad"></i><div class="rultrack" style="width:${(r.max - r.min) * r.px + 2}px;--t:${r.tick * r.px}px;--l:${r.label * r.px}px">${labels}</div><i class="rulpad"></i></div>
    <span class="rulneedle" aria-hidden="true"></span></div>`;
}

function bmiCard(p = S.profile) {
  const b = bmiOf(p), c = bmiClass(b);
  return `<section class="card bmicard" aria-label="BMI">
    <div class="row between"><span class="klabel">BMI</span><span class="bmitag ${c[2]}" id="bmi-tag">${c[1]}</span></div>
    <b class="bminum" id="bmi-num">${fmtNum(Math.round(b * 10) / 10)}</b>
    <div class="bmiscale"><i class="u"></i><i class="n"></i><i class="o"></i><i class="f"></i><span class="bmimark" id="bmi-mark" style="left:${bmiPos(b)}%"></span></div>
    <div class="bmilbl">${[18.5, 25, 30].map(x => `<span style="left:${bmiPos(x)}%">${fmtNum(x)}</span>`).join("")}</div>
    <div class="muted small">BMI tar inte hänsyn till muskler. Tränar du mycket styrka kan det bli högt utan att det betyder något.</div></section>`;
}

function vardenSummary() {
  const p = S.profile, walk = Math.round(3.5 * bmr(p) / 1440 * 30), run = Math.round(9.5 * bmr(p) / 1440 * 30);
  return `<section class="card vsum" id="vsum">
    <div class="vsrow"><span>I vila</span><b>${tnum(Math.round(bmr(p)))} <small>kcal/dag</small></b></div>
    <div class="vsrow"><span>Med din vardag</span><b>${tnum(tdee(p))} <small>kcal/dag</small></b></div>
    <div class="vsrow"><span>Promenad 30 min</span><b>${walk} <small>kcal</small></b></div>
    <div class="vsrow"><span>Löpning 30 min</span><b>${run} <small>kcal</small></b></div></section>`;
}

function vardenView() {
  const p = S.profile, back = { pass: "Träna", kost: "Kost", idag: "Hem", historik: "Historik" }[vardenBack] || "Inställningar";
  const set = S.profileSet !== false;
  return `<div class="varden"><button class="backbtn backlink" data-tab="${vardenBack}">${icon("left", 18)}${back}</button>
    <h1>Dina värden</h1>
    <div class="muted lead">Ger rätt kalorimål och visar vad din träning förbränner. Inget måste fyllas i.</div>
    ${set ? "" : `<div class="vnote">${icon("info", 16)}<span>Standardvärden används tills du ändrar något.</span></div>`}
    <div class="klabel sechead">Kön</div>
    <div class="seg two vsex">${[["m", "Man"], ["f", "Kvinna"]].map(([k, l]) => `<button data-vsex="${k}" class="${p.sex === k ? "on" : ""}" aria-pressed="${p.sex === k}">${l}</button>`).join("")}</div>
    <div class="klabel sechead">Ålder</div>${ruler("age")}
    <div class="klabel sechead">Längd</div>${ruler("height")}
    <button class="vlink" data-tab="vagning"><span class="grow"><b>Vikt och BMI</b><small>Vägs och följs på sidan Vikt</small></span>${icon("right", 18)}</button>
    <div class="klabel sechead">Hur aktiv är din vardag?</div>
    <div class="vact" role="radiogroup" aria-label="Aktivitet">${ACTIVITY.map(([v, l]) => {
      const [name, sub] = l.split(" ("), on = +p.activity === v;
      return `<button class="vactrow ${on ? "on" : ""}" data-vact="${v}" role="radio" aria-checked="${on}"><span class="grow"><b>${name}</b>${sub ? `<small>${sub.replace(")", "")}</small>` : ""}</span><span class="okrad" aria-hidden="true"></span></button>`;
    }).join("")}</div>
    <div class="klabel sechead">Det här räknas fram</div>
    ${vardenSummary()}
    ${set ? `<button class="link vreset" data-vreset>Återställ standardvärden</button>` : ""}</div>`;
}

// Värdet ändras: sparas, och vikten följer med till dagens vägning om man redan vägt sig idag
function setProfileValue(f, v) {
  S.profile[f] = v; S.profileSet = true;
  if (f === "weight" && weights()[TODAY] != null) weights()[TODAY] = v;
  save();
}

// Linjalerna: läget sätts efter varje omritning; när man slutat dra fastnar den på närmaste steg och sparas
// rulLive är värdet medan man drar: ritas sidan om mitt i (av något annat) fortsätter linjalen där man var
const rulTimer = {}, rulLive = {};
function initRulers() {
  for (const el of document.querySelectorAll(".rul[data-rul]")) {
    const f = el.dataset.rul, r = RULERS[f], v0 = rulLive[f] ?? rulGet(f);
    el.scrollLeft = (Math.min(r.max, Math.max(r.min, v0)) - r.min) * r.px;
    if (v0 !== rulGet(f)) { const out = document.getElementById(`rv-${f}`); if (out) out.textContent = rulFmt(f, v0); liveBmi(f, v0); }
    if (el.dataset.on) continue;
    el.dataset.on = "1";
    el.addEventListener("scroll", () => {
      const v = rulValue(el);
      rulLive[f] = v;
      const out = document.getElementById(`rv-${f}`);
      if (out) out.textContent = rulFmt(f, v);
      liveBmi(f, v);
      clearTimeout(rulTimer[f]);
      rulTimer[f] = setTimeout(() => settleRuler(el), 160);
    }, { passive: true });
    el.addEventListener("keydown", ev => {
      const d = { ArrowLeft: -1, ArrowRight: 1 }[ev.key];
      if (!d) return;
      ev.preventDefault();
      const v = Math.min(r.max, Math.max(r.min, Math.round((rulGet(f) + d * r.step) * 10) / 10));
      rulSet(f, v); render();
    });
  }
}
function rulValue(el) {
  const r = RULERS[el.dataset.rul], v = r.min + Math.round(el.scrollLeft / r.px / r.step) * r.step;
  return Math.min(r.max, Math.max(r.min, Math.round(v * 10) / 10));
}
function settleRuler(el) {
  const f = el.dataset.rul, r = RULERS[f];
  if (!el.isConnected) el = document.querySelector(`.rul[data-rul="${f}"]`);
  delete rulLive[f];
  if (!el) return;
  const v = rulValue(el);
  if (v !== rulGet(f)) { rulSet(f, v); render(); return; }
  const x = (v - r.min) * r.px;
  if (Math.abs(el.scrollLeft - x) > 0.5) el.scrollLeft = x;
}
// BMI följer med medan man drar
function liveBmi(f, v) {
  if (f !== "weight" && f !== "height" && f !== "wlog") return;
  const b = bmiOf(Object.assign({}, S.profile, { [f === "wlog" ? "weight" : f]: v })), c = bmiClass(b);
  const num = document.getElementById("bmi-num"), tag = document.getElementById("bmi-tag"), mark = document.getElementById("bmi-mark");
  if (num) num.textContent = fmtNum(Math.round(b * 10) / 10);
  if (tag) { tag.textContent = c[1]; tag.className = `bmitag ${c[2]}`; }
  if (mark) mark.style.left = `${bmiPos(b)}%`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-vsex],[data-vact],[data-vreset],[data-tab='varden']");
  if (!t) return;
  const ds = t.dataset;
  if (ds.tab === "varden") { if (tab !== "varden") vardenBack = tab; return; }   // själva bytet sköts av appen
  ev.stopImmediatePropagation();
  if (ds.vsex) setProfileValue("sex", ds.vsex);
  else if (ds.vact) setProfileValue("activity", +ds.vact);
  else if (ds.vreset !== undefined) { Object.assign(S.profile, DEFAULT_PROFILE); S.profileSet = false; save(); }
  render();
}, true);

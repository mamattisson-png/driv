"use strict";
// ---------- Historik ----------
// En månadskalender med prickar för pass och dailys. Tryck på en dag för att se och ändra den:
// dailys och vikt direkt i fönstret, pass och mat genom att öppna Träna eller Kost för den dagen.
// Under kalendern ligger veckojämförelsen. Laddas före app.js; anropas först när appen ritas.

let histMonth = null;     // "YYYY-MM" som visas, null = den här månaden
let histDay = null;       // öppen dag i kalendern

const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const WD_LONG = ["måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"];
// "idag", "igår" eller "tisdag 20 oktober"
function dateLabel(d) {
  if (d === TODAY) return "idag";
  if (d === shift(TODAY, -1)) return "igår";
  return `${WD_LONG[weekdayOf(d)]} ${+d.slice(8)} ${MONTHS[+d.slice(5, 7) - 1]}`;
}
const hasLog = d => { const L = S.log[d]; return !!L && (L.food.length > 0 || L.workouts.length > 0 || Object.keys(L.dailies).length > 0); };

function calendar() {
  const month = histMonth || TODAY.slice(0, 7), [y, mo] = month.split("-").map(Number);
  const first = `${month}-01`, count = new Date(y, mo, 0).getDate(), lead = weekdayOf(first);
  let cells = "";
  for (let i = 0; i < lead; i++) cells += `<span></span>`;
  for (let n = 1; n <= count; n++) {
    const d = `${month}-${String(n).padStart(2, "0")}`;
    const passes = workoutsOn(d).filter(w => w.done || Object.keys(w.sets).length).map(w => dayById(w.dayId)).filter(Boolean);
    const dots = passes.map(p => `<i class="cdot" style="background:var(--${TYPES[p.type].color || p.type})"></i>`).join("");
    const dl = allDailiesDone(d) ? `<i class="ccheck">✓</i>` : "";
    cells += `<button class="cday ${d === TODAY ? "today" : ""} ${hasLog(d) ? "has" : ""}" data-histday="${d}" ${d > TODAY ? "disabled" : ""}
      aria-label="${dateLabel(d)}${passes.length ? `, ${passes.length} pass` : ""}"><span>${n}</span><span class="cmarks">${dots}${dl}</span></button>`;
  }
  const atNow = month >= TODAY.slice(0, 7);
  return `<div class="card"><div class="row between"><button class="small" data-hmonth="-1" aria-label="Förra månaden">‹</button>
      <h2 style="margin:0">${MONTHS[mo - 1].replace(/^./, c => c.toUpperCase())} ${y}</h2>
      <button class="small" data-hmonth="1" ${atNow ? "disabled" : ""} aria-label="Nästa månad">›</button></div>
    <div class="cal">${WD.map(w => `<b>${w.slice(0, 2)}</b>`).join("")}${cells}</div>
    <div class="legend muted small"><span><i class="cdot" style="background:var(--push)"></i>Pass</span>${S.daily.length ? `<span><i class="ccheck">✓</i>Alla dailys</span>` : ""}<span>Tryck på en dag för att ändra den</span></div></div>`;
}

function daySheet() {
  const d = histDay, e = eaten(d), m = macros(), food = (S.log[d] && S.log[d].food) || [];
  const passes = workoutsOn(d).map(w => {
    const p = dayById(w.dayId), n = Object.values(w.sets).filter(sets => sets.some(hasData)).length;
    return `<div class="hrow"><div class="grow">${p ? `${tag(p.type)} <b>${esc(p.name)}</b>` : "<b>Pass</b>"}
        <div class="muted small">${n} övningar loggade${w.done ? " · sparat" : ""}</div></div>
      ${p ? `<button class="small" data-hpass="${p.id}">Ändra</button>` : ""}</div>`;
  }).join("");
  const meals = MEALS.map(([n], i) => [n, food.filter(f => f.meal === i).reduce((a, f) => a + (+f.kcal || 0), 0)]).filter(([, k]) => k);
  return `<div class="overlay" data-hclose><div class="sheet">
    <div class="row between"><h2>${dateLabel(d).replace(/^./, c => c.toUpperCase())}</h2><button class="small ghost" data-hclose aria-label="Stäng">✕</button></div>
    <h3 class="sheet-sub">Träning</h3>
    ${passes || `<div class="muted">Inget pass loggat.</div>`}
    <button class="small" style="margin-top:8px" data-hpass="">+ Logga ett pass${d === TODAY ? "" : " i efterhand"}</button>
    <h3 class="sheet-sub">Mat</h3>
    <div>${e.kcal ? `<b>${e.kcal}</b> / ${m.kcal} kcal · ${e.protein} g protein` : `<span class="muted">Ingen mat loggad.</span>`}</div>
    ${meals.length ? `<div class="muted small">${meals.map(([n, k]) => `${n} ${k}`).join(" · ")}</div>` : ""}
    <button class="small" style="margin-top:8px" data-hfood>${food.length ? "Ändra mat" : "+ Logga mat"}</button>
    <div style="margin-top:18px">${dailiesCard()}</div>
    ${S.hideWeight ? "" : `<h3 class="sheet-sub">Vikt</h3><div class="row"><input id="wkg" type="number" inputmode="decimal" step="0.1"
      placeholder="kg" aria-label="Vikt i kg" value="${weights()[d] ?? ""}"><button data-wsave>${weights()[d] ? "Ändra" : "Spara"}</button></div>`}
    <button class="wide" data-hclose style="margin-top:14px">Stäng</button>
  </div></div>`;
}

// Veckan jämförd med veckan innan (det som tidigare var fliken Vecka)
function weekSection() {
  const ws = shift(weekStart(TODAY), weekOffset * 7), prevWs = shift(ws, -7);
  const cur = weekSummary(ws), prev = weekSummary(prevWs);
  const ids = [];
  for (const d of S.plan.days) for (const e of d.ex) if (!ids.includes(e.id)) ids.push(e.id);
  const rows = ids.map(id => {
    const c = exWeek(id, ws), p = exWeek(id, prevWs);
    if (!c && !p) return "";
    const vol = c && p && p.vol ? Math.round((c.vol - p.vol) / p.vol * 100) : null;
    return `<div class="exrow">${thumb(id, "xs")}<div class="grow"><button class="linkbtn" data-chart="${id}">${esc(EX[id].name)}</button>
        <div class="muted small">${fmtSet(c, id)}${p ? ` · förra ${fmtSet(p, id)}` : ""}</div></div>
      <div class="exdelta">${exDelta(c, p, id)}${vol !== null && vol !== 0 ? deltaBadge(vol, "% vol") : ""}</div></div>`;
  }).join("");
  const m = macros();
  const stat = (label, c, p, unit = "") => `<div><div class="stat">${fmtNum(c)}${unit}</div><div class="muted">${label}</div>${c || p ? deltaBadge(Math.round((c - p) * 10) / 10, unit.trim() || "st") : ""}</div>`;
  return `<div class="card"><div class="row between"><button class="small" data-week="-1" aria-label="Förra veckan">‹</button>
      <h2 style="margin:0">Vecka ${weekNo(ws)} <span class="muted">${+ws.slice(8)}/${+ws.slice(5, 7)} – ${+shift(ws, 6).slice(8)}/${+shift(ws, 6).slice(5, 7)}</span></h2>
      <button class="small" data-week="1" ${weekOffset >= 0 ? "disabled" : ""} aria-label="Nästa vecka">›</button></div>
      <div class="muted" style="margin:8px 0">Jämfört med vecka ${weekNo(prevWs)}</div>
      <div class="grid2">
        ${stat(`pass av ${S.plan.count}`, cur.passes, prev.passes)}
        ${stat("dagar alla dailys klara", cur.dailies, prev.dailies)}
        ${stat("löpning", cur.km, prev.km, " km")}
        <div><div class="stat">${cur.kcal || "–"}</div><div class="muted">kcal/dag i snitt (mål ${m.kcal})</div></div>
      </div>
      <button class="wide" style="margin-top:12px" data-letter="${ws}">📬 Sammanfattning av veckan</button></div>
    ${!S.hideWeight && Object.keys(weights()).length ? `<div class="card"><h2>Vikt</h2>${(() => {
      const a = weekAvgWeight(ws), b = weekAvgWeight(prevWs);
      return a != null ? `<div>Snitt vecka ${weekNo(ws)}: <b>${fmtNum(a)} kg</b> ${b != null ? weightBadge(a - b) : ""}</div>` : "";
    })()}${weightChart()}</div>` : ""}
    <div class="card"><h2>Övningar</h2>${rows ? `<div class="muted small" style="margin-bottom:4px">Bästa set den här veckan. Tryck på en övning för grafen.</div>${rows}`
      : `<div class="muted">Inga loggade set de här två veckorna.</div>`}</div>`;
}

function historikView() {
  // Medan en dag är öppen gäller bockar och vikt den dagen
  editDate = histDay && histDay !== TODAY ? histDay : null;
  return `<h1>Historik</h1>${calendar()}${weekSection()}${histDay ? daySheet() : ""}`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-histday],[data-hclose],[data-hmonth],[data-hpass],[data-hfood]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset;
  if (ds.histday) histDay = ds.histday;
  else if (ds.hclose !== undefined) { histDay = null; editDate = null; }
  else if (ds.hmonth) {
    const [y, mo] = (histMonth || TODAY.slice(0, 7)).split("-").map(Number), dt = new Date(y, mo - 1 + +ds.hmonth, 1);
    histMonth = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  }
  else if (ds.hpass !== undefined) {
    editDate = histDay === TODAY ? null : histDay;
    histDay = null; tab = "pass"; chosenDay = ds.hpass || null; editing = false;
    if (focus) endFocus();
  }
  else if (ds.hfood !== undefined) { editDate = histDay === TODAY ? null : histDay; histDay = null; tab = "kost"; }
  save();
  render();
  if (ds.hpass !== undefined || ds.hfood !== undefined) window.scrollTo(0, 0);
});

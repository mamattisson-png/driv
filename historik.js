"use strict";
// ---------- Historik ----------
// En månadskalender med prickar för pass och dailys. Tryck på en dag för att se och ändra den:
// dailys och vikt direkt i fönstret, pass och mat genom att öppna Träna eller Kost för den dagen.
// Under kalendern ligger veckojämförelsen. Laddas före app.js; anropas först när appen ritas.

let histMonth = null;     // "YYYY-MM" som visas, null = den här månaden
let histDay = null;       // öppen dag i kalendern
let histView = "kalender";   // "kalender" eller "utveckling"

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

// ---------- Utveckling ----------
// Allt sedan start: personbästa per övning med ökningen från första gången, pass per vecka och vikt.
const shortDate = d => `${+d.slice(8)} ${MONTHS[+d.slice(5, 7) - 1].slice(0, 3)}`;
function progressData() {
  const dates = Object.keys(S.log).sort(), ex = {};
  let passes = 0, first = null;
  for (const d of dates) {
    const ws = workoutsOn(d);
    if (ws.some(w => w.done)) { passes += ws.filter(w => w.done).length; first = first || d; }
    for (const id of new Set(exIdsOn(d))) {
      if (!EX[id]) continue;
      const top = topSet(setsOn(d, id));
      if (!top) continue;
      const e = ex[id] || (ex[id] = { id, first: top, firstDate: d, best: top, bestDate: d, last: d, times: 0 });
      e.times++; e.last = d;
      if (betterSet(top, e.best)) { e.best = top; e.bestDate = d; }
    }
  }
  return { passes, first, ex: Object.values(ex).sort((a, b) => b.last.localeCompare(a.last)) };
}
// Ökningen från första gången: kg om övningen körs med vikt, annars reps eller sekunder
function gain(e) {
  const a = e.first, b = e.best;
  if (+b.kg || +a.kg) { const d = (+b.kg || 0) - (+a.kg || 0); return d ? deltaBadge(d, "kg") : ""; }
  const d = (+b.reps || 0) - (+a.reps || 0);
  return d ? deltaBadge(d, repUnit(e.id)) : "";
}
function weekBars() {
  const weeks = [];
  for (let k = 11; k >= 0; k--) { const ws = shift(weekStart(TODAY), -7 * k); weeks.push({ ws, n: weekSummary(ws).passes }); }
  const max = Math.max(S.plan.count, ...weeks.map(w => w.n)), W = 320, H = 120, bw = W / 12;
  return `<svg class="chart wbars" viewBox="0 0 ${W} ${H + 18}" role="img" aria-label="Pass per vecka de senaste tolv veckorna">
    <line class="grid" x1="0" x2="${W}" y1="${(H - S.plan.count / max * (H - 8)).toFixed(1)}" y2="${(H - S.plan.count / max * (H - 8)).toFixed(1)}"/>
    ${weeks.map((w, i) => { const h = w.n / max * (H - 8);
      return `<rect class="wbar ${w.n >= S.plan.count ? "full" : ""}" x="${(i * bw + 4).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${(bw - 8).toFixed(1)}" height="${h.toFixed(1)}" rx="3"/>
        ${i % 2 ? `<text class="axis" x="${(i * bw + bw / 2).toFixed(1)}" y="${H + 14}" text-anchor="middle">v.${weekNo(w.ws)}</text>` : ""}`; }).join("")}
  </svg><div class="muted small">Linjen är ditt mål, ${S.plan.count} pass i veckan.</div>`;
}
function progressView() {
  const p = progressData(), recent = [0, 1, 2, 3].reduce((a, k) => a + weekSummary(shift(weekStart(TODAY), -7 * k)).passes, 0);
  if (!p.ex.length && !p.passes) return `<div class="card"><h2>Här växer din utveckling fram</h2>
    <div class="muted">När du sparat några pass visas dina personbästa, hur mycket du ökat och hur ofta du tränar.</div></div>`;
  const w = Object.keys(weights()).sort(), wFirst = w.length ? weights()[w[0]] : null, wLast = w.length ? weights()[w[w.length - 1]] : null;
  const rows = p.ex.map(e => `<button class="krow" data-chart="${e.id}"><span class="thumb xs" aria-hidden="true">${figure(e.id)}</span>
      <span class="grow"><b>${esc(EX[e.id].name)}</b><span class="muted small">${e.times > 1 ? `Första gången ${fmtSet(e.first, e.id)} · ${shortDate(e.firstDate)}` : `Loggad en gång · ${shortDate(e.firstDate)}`}</span></span>
      <span class="pbcol"><b>${fmtSet(e.best, e.id)}</b>${e.times > 1 ? gain(e) : ""}</span></button>`).join("");
  return `<div class="card"><div class="kstats">
      <div class="kstat"><div class="klabel">Pass totalt</div><div class="kbig">${p.passes}</div><div class="muted small">${p.first ? `sedan ${shortDate(p.first)}` : "inga sparade än"}</div></div>
      <div class="kstat"><div class="klabel">Senaste 4 veckor</div><div class="kbig">${recent}</div><div class="muted small">${fmtNum(recent / 4)} pass i veckan</div></div></div></div>
    <section class="card kmeal"><div class="khead"><span class="grow">Pass per vecka</span><span>12 veckor</span></div><div class="kbody">${weekBars()}</div></section>
    ${rows ? `<section class="card kmeal exlist"><div class="khead"><span class="grow">Personbästa</span><span>${p.ex.length} övningar</span></div>${rows}
      <div class="muted small kfoot">Tryck på en övning för att se grafen vecka för vecka.</div></section>` : ""}
    ${!S.hideWeight && w.length ? `<section class="card kmeal"><div class="khead"><span class="grow">Kroppsvikt</span><span>${fmtNum(wLast)} kg</span></div>
      <div class="kbody">${w.length > 1 ? `<div style="margin-bottom:8px">${weightBadge(wLast - wFirst)} <span class="muted small">sedan ${shortDate(w[0])}</span></div>` : ""}${weightChart()}</div></section>` : ""}`;
}

function historikView() {
  // Medan en dag är öppen gäller bockar och vikt den dagen
  editDate = histDay && histDay !== TODAY ? histDay : null;
  const seg = `<div class="seg two" role="tablist">${[["kalender", "Kalender"], ["utveckling", "Utveckling"]].map(([k, n]) =>
    `<button data-hview="${k}" class="${histView === k ? "on" : ""}" role="tab" aria-selected="${histView === k}">${n}</button>`).join("")}</div>`;
  return `<h1>Historik</h1>${seg}${histView === "utveckling" ? progressView() : `${calendar()}${weekSection()}`}${histDay ? daySheet() : ""}`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-histday],[data-hclose],[data-hmonth],[data-hpass],[data-hfood],[data-hview]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset;
  if (ds.hview) histView = ds.hview;
  else if (ds.histday) histDay = ds.histday;
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

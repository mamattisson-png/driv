"use strict";
// ---------- Historik ----------
// En månadskalender med prickar för pass och dailys. Tryck på en dag för att se och ändra den:
// dailys och vikt direkt i fönstret, pass och mat genom att öppna Träna eller Kost för den dagen.
// Under kalendern ligger veckojämförelsen. Laddas före app.js; anropas först när appen ritas.

let histMonth = null;     // "YYYY-MM" som visas, null = den här månaden
let histDay = null;       // öppen dag i kalendern
let histView = "kalender";
let histSub = null;       // "dailys" eller "vikt" när en del av dagen ändras i fönstret
let weekExOpen = false;      // alla övningar i veckokortet visas

const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const WD_LONG = ["måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"];
// "idag", "igår" eller "tisdag 20 oktober"
function dateLabel(d) {
  if (d === TODAY) return "idag";
  if (d === shift(TODAY, -1)) return "igår";
  return `${WD_LONG[weekdayOf(d)]} ${+d.slice(8)} ${MONTHS[+d.slice(5, 7) - 1]}`;
}
const hasLog = d => { const L = S.log[d]; return !!L && (L.food.length > 0 || L.workouts.length > 0 || Object.keys(L.dailies).length > 0 || actsOn(d).length > 0); };

function calendar() {
  const month = histMonth || TODAY.slice(0, 7), [y, mo] = month.split("-").map(Number);
  const first = `${month}-01`, count = new Date(y, mo, 0).getDate(), lead = weekdayOf(first);
  let cells = "";
  for (let i = 0; i < lead; i++) cells += `<span></span>`;
  for (let n = 1; n <= count; n++) {
    const d = `${month}-${String(n).padStart(2, "0")}`;
    const passes = workoutsOn(d).filter(w => w.done || Object.keys(w.sets).length).length, acts = actsOn(d).length;
    const all = allDailiesDone(d);
    // Passdag (pass eller annan träning) fylls i accent, alla dailys är en liten prick, idag har ram
    cells += `<button class="cday ${passes || acts ? "pass" : ""} ${d === TODAY ? "today" : ""} ${hasLog(d) ? "has" : ""}" data-histday="${d}" ${d > TODAY ? "disabled" : ""}
      aria-label="${dateLabel(d)}${passes ? `, ${passes} pass` : ""}${acts ? `, ${acts} ${acts === 1 ? "aktivitet" : "aktiviteter"}` : ""}${all ? ", alla dailys" : ""}"><span>${n}</span><i class="cdaily ${all ? "on" : ""}"></i></button>`;
  }
  const atNow = month >= TODAY.slice(0, 7);
  return `<section class="card calcard" aria-label="Kalender"><div class="row between"><button class="roundbtn ghost" data-hmonth="-1" aria-label="Förra månaden">${icon("left", 20)}</button>
      <h2 style="margin:0">${MONTHS[mo - 1].replace(/^./, c => c.toUpperCase())} ${y}</h2>
      <button class="roundbtn ghost" data-hmonth="1" ${atNow ? "disabled" : ""} aria-label="Nästa månad">${icon("right", 20)}</button></div>
    <div class="cal">${WD.map(w => `<b aria-hidden="true">${w[0]}</b>`).join("")}${cells}</div>
    <div class="legend muted small"><span><i class="lg-pass"></i>Pass</span>${hasDailies() ? `<span><i class="lg-daily"></i>Alla dailys</span>` : ""}<span><i class="lg-today"></i>Idag</span></div></section>`;
}

// Ett set som "65 × 8", "10 reps +10 kg" eller "45 s"
function setTxt(st, id) {
  const kg = +st.kg || 0, r = +st.reps || 0, u = isTimed(id) ? " s" : "";
  if (!kg) return `${r}${u || (EX[id] && EX[id].bw ? " reps" : "")}`;
  return EX[id] && EX[id].bw ? `${r} +${fmtNum(kg)} kg` : `${fmtNum(kg)} × ${r}${u}`;
}
// Skillnaden mot förra gången: kg om övningen körs med vikt, annars reps/sekunder
function setGain(cur, prev, id) {
  if (!cur || !prev) return "";
  const kg = (+cur.kg || 0) - (+prev.kg || 0), r = (+cur.reps || 0) - (+prev.reps || 0);
  const [v, u] = (+cur.kg || +prev.kg) && kg ? [kg, "kg"] : [r, repUnit(id) === "s" ? "s" : "reps"];
  if (!v) return `<span class="hgain same">±0</span>`;
  return `<span class="hgain ${v > 0 ? "up" : "down"}">${v > 0 ? "+" : "−"}${fmtNum(Math.abs(v))} ${u}</span>`;
}
// Förra gången samma pass kördes, före den här dagen
function prevSamePass(dayId, date) {
  const dates = Object.keys(S.log).filter(x => x < date).sort().reverse();
  for (const x of dates) { const w = workoutOn(x, dayId); if (w && Object.values(w.sets).some(a => a.some(hasData))) return { date: x, w }; }
  return null;
}
// Ett pass som en lättläst sammanfattning: tid, set, total vikt och varje övnings set med PB och skillnad mot förra gången
function passSummary(w, d) {
  if (w.act) return actPassSummary(w, d);
  const p = dayById(w.dayId), prev = prevSamePass(w.dayId, d);
  const order = [...(p ? p.ex.map(e => e.id) : []), ...Object.keys(w.sets)].filter((id, i, a) => a.indexOf(id) === i && EX[id]);
  const rows = order.map(id => ({ id, sets: (w.sets[id] || []).filter(hasData) })).filter(r => r.sets.length);
  const all = rows.flatMap(r => r.sets.map(st => ({ st, id: r.id })));
  const vol = all.reduce((a, { st, id }) => a + (EX[id].bw ? 0 : (+st.kg || 0) * (+st.reps || 0)), 0);
  const min = w.start && w.end ? Math.max(1, Math.round((w.end - w.start) / 60000)) : null;
  const meta = [min ? `${min} min` : "", `${all.length} set`, vol ? (vol >= 1000 ? `${fmtNum(Math.round(vol / 100) / 10)} t` : `${Math.round(vol)} kg`) : ""].filter(Boolean).join(" · ");
  const exRows = rows.map(({ id, sets }) => {
    const t = topSet(sets), b = bestBefore(id, d), pb = t && b && betterSet(t, b);
    const pt = prev && topSet((prev.w.sets[id] || []).filter(hasData));
    return `<button class="hex" data-chart="${id}"><span class="grow"><b>${esc(EX[id].name)}${pb ? `<span class="pbtag">PB</span>` : ""}</b>
      <span class="hsets">${sets.map(st => setTxt(st, id)).join(" · ")}</span></span>${setGain(t, pt, id)}</button>`;
  }).join("");
  return `<section class="hpass" aria-label="${esc(p ? p.name : "Pass")}">
    <div class="row between hpass-top"><span class="row" style="gap:8px">${p ? tag(p.type) : ""}<b>${esc(p ? p.name : "Pass")}</b></span><span class="muted small">${meta}</span></div>
    ${exRows || `<div class="muted small">Inga set loggade${w.done ? "" : " än"}.</div>`}
    ${prev && rows.length ? `<div class="muted small hprev">Jämfört med förra ${esc(p ? p.name : "passet")} ${shortDate(prev.date)}</div>` : ""}
    ${p ? `<button class="small hedit" data-hpass="${p.id}">${icon("edit", 14)}Ändra passet</button>` : ""}</section>`;
}
function daySheet() {
  const d = histDay, e = eaten(d), title = dateLabel(d).replace(/^./, c => c.toUpperCase());
  const head = back => `<div class="row between hsheet-top">${back ? `<button class="backbtn" data-hsub="">${icon("left", 18)}${title}</button>` : `<h2>${title}</h2>`}
    <button class="small ghost iconbtn" data-hclose aria-label="Stäng">${icon("close", 18)}</button></div>`;
  // Underlägen: dailys och vikt ändras i samma fönster
  if (histSub === "dailys") return `<div class="overlay" data-hclose><div class="sheet hsheet">${head(true)}${dailiesCard()}</div></div>`;
  if (histSub === "vikt") return `<div class="overlay" data-hclose><div class="sheet hsheet">${head(true)}<h3 class="sheet-sub">Vikt</h3>
    <div class="row"><input id="wkg" type="number" inputmode="decimal" step="0.1" placeholder="kg" aria-label="Vikt i kg" value="${weights()[d] ?? ""}"><button class="primary" data-wsave data-wdate="${d}">Spara</button></div></div></div>`;
  const ws = workoutsOn(d);   // även påbörjade pass utan set, så att de går att fortsätta i efterhand
  const dl = dailyList(d), n = dl.length, done = dl.filter(x => dailyDone(d, x.id)).length;
  const line = (ic, name, val, attrs) => `<button class="hline" ${attrs}><span class="hl-ic">${ic}</span><span class="grow">${name}</span><span class="muted">${val}</span>${icon("right", 16)}</button>`;
  const ring = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="var(--line)" stroke-width="3"/>
    <circle cx="12" cy="12" r="9" fill="none" stroke="var(--ok)" stroke-width="3" stroke-dasharray="${(n ? done / n : 0) * 56.5} 56.5" transform="rotate(-90 12 12)" stroke-linecap="round"/></svg>`;
  return `<div class="overlay" data-hclose><div class="sheet hsheet">${head(false)}
    ${ws.map(w => passSummary(w, d)).join("")}
    ${actsOn(d).map((a, i) => `<button class="hline" data-actedit="${i}" data-actdate="${d}"><span class="hl-ic">${icon("aktivitet", 18)}</span><span class="grow">${esc(a.name)}</span><span class="muted">${actLine(a)}</span>${icon("right", 16)}</button>`).join("")}
    ${!ws.length && !actsOn(d).length ? `<div class="muted hnone">Ingen träning loggad.</div>` : ""}
    <div class="hlines">
      ${n ? line(ring, "Dailys", `${done} av ${n}`, 'data-hsub="dailys"') : ""}
      ${line(icon("kost", 18), "Mat", e.kcal ? `${tnum(e.kcal)} kcal · ${e.protein} g protein` : "Inget loggat", "data-hfood")}
      ${S.hideWeight ? "" : line(icon("vikt", 18), "Vikt", weights()[d] ? `${fmtNum(weights()[d])} kg` : "Ingen vägning", 'data-hsub="vikt"')}
    </div>
    <div class="hadd"><button class="linkbtn2" data-hpass="">${icon("plus", 16)}Logga pass${d === TODAY ? "" : " i efterhand"}</button>
      <button class="linkbtn2" data-actnew="" data-actdate="${d}">${icon("plus", 16)}Aktivitet</button></div>
  </div></div>`;
}

// Veckan jämförd med veckan innan: fyra rutor, bästa set och en graf
function weekSection() {
  const ws = shift(weekStart(TODAY), weekOffset * 7), prevWs = shift(ws, -7);
  const cur = weekSummary(ws), prev = weekSummary(prevWs);
  const ids = [];
  for (const d of S.plan.days) for (const e of d.ex) if (!ids.includes(e.id)) ids.push(e.id);
  for (const d of weekDates(ws)) for (const id of exIdsOn(d)) if (EX[id] && !ids.includes(id)) ids.push(id);
  const rows = ids.map(id => ({ id, c: exWeek(id, ws), p: exWeek(id, prevWs) })).filter(r => r.c).map(({ id, c, p }) =>
    `<button class="exrow" data-chart="${id}"><span class="grow">${esc(EX[id].name)}</span><span class="muted">${fmtSet(c, id)}</span>
      <span class="exdelta">${p ? exDelta(c, p, id) || `<span class="delta same">±0</span>` : `<span class="delta same">ny</span>`}</span></button>`);
  // Skillnaden mot förra veckan: plus är bra för pass och dailys, för kalorier och vikt bara en uppgift
  const diff = (c, p, good, unit = "") => {
    const d = Math.round((c - p) * 10) / 10;
    if (!d) return `<span class="muted small">Samma som förra</span>`;
    const cls = good == null ? "muted" : (d > 0) === good ? "oktext" : "badtext";
    return `<span class="small ${cls}">${d > 0 ? "+" : "−"}${fmtNum(Math.abs(d))}${unit} mot förra</span>`;
  };
  const tile = (label, v, unit, sub) => `<div class="wtile"><span class="klabel">${label}</span><span class="wnum">${v} <span class="muted small">${unit}</span></span>${sub}</div>`;
  const wNow = weekAvgWeight(ws), wPrev = weekAvgWeight(prevWs);
  const tiles = [
    tile("Pass", cur.passes, `av ${S.plan.count}`, diff(cur.passes, prev.passes, true)),
    hasDailies() ? tile("Dailys", cur.dailies, "av 7 dagar", diff(cur.dailies, prev.dailies, true)) : "",
    tile("Kalorier", cur.kcal ? tnum(cur.kcal) : "–", "snitt", cur.kcal && prev.kcal ? diff(cur.kcal, prev.kcal, null) : `<span class="muted small">mål ${tnum(macros().kcal)}</span>`),
    S.hideWeight ? "" : tile("Vikt", wNow != null ? fmtNum(wNow) : "–", "kg", wNow != null && wPrev != null ? diff(wNow, wPrev, null, " kg") : `<span class="muted small">${wNow != null ? "Första vägningen" : "Ingen vägning"}</span>`),
    cur.km || prev.km ? tile("Löpning", fmtNum(cur.km), "km", diff(cur.km, prev.km, true, " km")) : "",
  ].filter(Boolean);
  const shown = weekExOpen ? rows : rows.slice(0, 4);
  return `<section class="weekcmp" aria-label="Veckan jämfört med veckan innan">
    <div class="row between"><div class="col"><h2>Vecka ${weekNo(ws)} · ${+ws.slice(8)}–${+shift(ws, 6).slice(8)} ${MONTHS[+shift(ws, 6).slice(5, 7) - 1].slice(0, 3)}</h2>
      <span class="muted small">Jämfört med veckan innan</span></div>
      <div class="row" style="gap:0"><button class="roundbtn ghost" data-week="-1" aria-label="Förra veckan">${icon("left", 20)}</button>
        <button class="roundbtn ghost" data-week="1" ${weekOffset >= 0 ? "disabled" : ""} aria-label="Nästa vecka">${icon("right", 20)}</button></div></div>
    <div class="wtiles">${tiles.join("")}</div>
    ${rows.length ? `<div class="card bestsets"><div class="row between klabel"><span>Bästa set</span><span>mot förra</span></div>${shown.join("")}
      ${rows.length > 4 ? `<button class="ghost wide" data-weekex aria-expanded="${weekExOpen}">${weekExOpen ? "Visa färre" : `Visa alla ${rows.length} övningar`}${icon(weekExOpen ? "up" : "down", 16)}</button>` : ""}</div>` : ""}
    <button class="ghost wide" data-letter="${ws}">${icon("mail", 18)}Sammanfattning av veckan</button>
  </section>`;
}
// ---------- Utveckling ----------
// Allt sedan start: personbästa per övning med ökningen från första gången, pass per vecka och vikt.
const shortDate = d => `${+d.slice(8)} ${MONTHS[+d.slice(5, 7) - 1].slice(0, 3)}`;
const PERIODS = [["4v", "4 veckor", 28], ["3m", "3 mån", 91], ["1y", "1 år", 365], ["all", "Allt", 0]];
let histPer = "3m", strAll = false;
const perFrom = () => { const p = PERIODS.find(x => x[0] === histPer) || PERIODS[1]; return p[2] ? shift(TODAY, -p[2] + 1) : "0000"; };
// Utvecklingen under perioden: per övning första och bästa toppset, och bästa set vecka för vecka (till kurvan)
function progressData(from = "0000") {
  const dates = Object.keys(S.log).filter(d => d >= from && d <= TODAY).sort(), ex = {};
  let passes = 0, first = null, pbs = 0;
  for (const d of dates) {
    const ws = workoutsOn(d);
    if (ws.some(w => w.done)) { passes += ws.filter(w => w.done).length; first = first || d; }
    for (const id of new Set(exIdsOn(d))) {
      if (!EX[id]) continue;
      const top = topSet(setsOn(d, id));
      if (!top) continue;
      const e = ex[id] || (ex[id] = { id, first: top, firstDate: d, best: top, bestDate: d, last: d, times: 0, weeks: {} });
      e.times++; e.last = d;
      if (betterSet(top, e.best)) { e.best = top; e.bestDate = d; }
      const wk = weekStart(d); if (betterSet(top, e.weeks[wk])) e.weeks[wk] = top;
      const b = bestBefore(id, d); if (b && betterSet(top, b)) pbs++;
    }
  }
  for (const e of Object.values(ex)) {
    const kg = +e.best.kg || +e.first.kg;
    e.unit = kg ? "kg" : repUnit(e.id);
    e.gain = kg ? (+e.best.kg || 0) - (+e.first.kg || 0) : (+e.best.reps || 0) - (+e.first.reps || 0);
  }
  return { passes, first, pbs, ex: Object.values(ex).sort((a, b) => b.last.localeCompare(a.last)) };
}
function gain(e) { return e.times > 1 && e.gain ? deltaBadge(e.gain, e.unit) : ""; }
// Liten kurva över bästa set vecka för vecka
function spark(e) {
  const pts = Object.keys(e.weeks).sort().map(k => e.unit === "kg" ? +e.weeks[k].kg || 0 : +e.weeks[k].reps || 0);
  if (pts.length < 2) return `<span class="spark"></span>`;
  const lo = Math.min(...pts), hi = Math.max(...pts), W = 64, H = 26;
  const xy = pts.map((v, i) => `${(i / (pts.length - 1) * W).toFixed(1)},${(H - 3 - (hi > lo ? (v - lo) / (hi - lo) : .5) * (H - 6)).toFixed(1)}`).join(" ");
  return `<svg class="spark ${e.gain > 0 ? "up" : e.gain < 0 ? "down" : ""}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${xy}"/></svg>`;
}
// Veckor i rad (bakåt från förra veckan, eller den här om målet redan nåtts) med minst målets antal pass
function weekStreak() {
  let ws = weekStart(TODAY), n = 0;
  if (weekSummary(ws).passes < S.plan.count) ws = shift(ws, -7);
  while (n < 200 && weekSummary(ws).passes >= S.plan.count) { n++; ws = shift(ws, -7); }
  return n;
}
const passesIn = (from, to) => Object.keys(S.log).filter(d => d >= from && d <= to).reduce((a, d) => a + workoutsOn(d).filter(w => w.done).length, 0);
// Framsteg: bara sådant som verkligen hänt, högst tre
function wins(p) {
  const out = [];
  const best = p.ex.filter(e => e.times > 1 && e.gain > 0).sort((a, b) => (b.unit === "kg") - (a.unit === "kg") || b.gain - a.gain)[0];
  if (best) out.push(["up", `${EX[best.id].name} +${fmtNum(best.gain)} ${best.unit}`, `${fmtSet(best.first, best.id)} → ${fmtSet(best.best, best.id)} sedan ${shortDate(best.firstDate)}`]);
  // Månaden: den här när den kommit en bit (eller redan slagit förra), annars förra. Jämförs med månaden innan.
  const mon = k => { const [y, mo] = TODAY.slice(0, 7).split("-").map(Number), dt = new Date(y, mo - 1 - k, 1);
    const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`; return { i: dt.getMonth(), n: passesIn(m + "-01", m + "-31") }; };
  const c0 = mon(0), c1 = mon(1), useCur = c0.n && (+TODAY.slice(8) >= 15 || c0.n > c1.n);
  const [m, before] = useCur ? [c0, c1] : [c1, mon(2)];
  if (m.n) out.push(["check", `${m.n} pass i ${MONTHS[m.i]}`, before.n && m.n > before.n ? `Fler än ${MONTHS[before.i]} (${before.n})` : `Ditt mål är ${S.plan.count} i veckan`]);
  const st = weekStreak();
  if (st >= 2) out.push(["num", `${st} veckor i rad`, `med minst ${S.plan.count} pass, ditt mål`, st]);
  return out;
}
function weekBars(count = 12) {
  const weeks = [];
  for (let k = count - 1; k >= 0; k--) { const ws = shift(weekStart(TODAY), -7 * k); weeks.push({ ws, n: weekSummary(ws).passes }); }
  const max = Math.max(S.plan.count, ...weeks.map(w => w.n)), W = 320, H = 120, bw = W / count, every = Math.ceil(count / 6);
  return `<svg class="chart wbars" viewBox="0 0 ${W} ${H + 18}" role="img" aria-label="Pass per vecka de senaste tolv veckorna">
    <line class="grid" x1="0" x2="${W}" y1="${(H - S.plan.count / max * (H - 8)).toFixed(1)}" y2="${(H - S.plan.count / max * (H - 8)).toFixed(1)}"/>
    ${weeks.map((w, i) => { const h = w.n / max * (H - 8);
      return `<rect class="wbar ${w.n >= S.plan.count ? "full" : ""}" x="${(i * bw + bw * .12).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${(bw * .76).toFixed(1)}" height="${h.toFixed(1)}" rx="3"/>
        ${(count - 1 - i) % every === 0 ? `<text class="axis" x="${(i * bw + bw / 2).toFixed(1)}" y="${H + 14}" text-anchor="middle">v.${weekNo(w.ws)}</text>` : ""}`; }).join("")}
  </svg>`;
}
function actSummary() {
  const from = shift(weekStart(TODAY), -77), by = {};
  for (const [d, L] of Object.entries(S.log)) if (d >= from) for (const a of L.acts || []) {
    const e = by[a.name] || (by[a.name] = { n: 0, min: 0 });
    e.n++; e.min += +a.min || 0;
  }
  const rows = Object.entries(by).sort((a, b) => b[1].n - a[1].n);
  if (!rows.length) return "";
  return `<section class="card kmeal"><div class="khead"><span class="grow">Aktiviteter</span><span>12 veckor</span></div>
    ${rows.map(([n, e]) => `<div class="krow"><span class="hricon">${actIcon(n)}</span><span class="grow"><b>${esc(n)}</b>
      <span class="muted small">${e.n} ${e.n === 1 ? "gång" : "gånger"} · ${fmtNum(e.min / 60)} timmar</span></span></div>`).join("")}</section>`;
}
// Vikten visas i Utveckling även innan man sparat pass, och leder till sidan Vikt
const weightSection = (w, wFirst, wLast) => !S.hideWeight && w.length ? `<section class="card kmeal"><button class="khead wlink" data-tab="vagning"><span class="grow">Vikt</span><span class="wl-kg">${fmtNum(wLast)} kg${icon("right", 16)}</span></button>
      <div class="kbody">${w.length > 1 ? `<div style="margin-bottom:8px">${weightBadge(wLast - wFirst)} <span class="muted small">sedan ${shortDate(w[0])}</span></div>` : ""}${weightChart()}</div></section>` : "";
function progressView() {
  const from = perFrom(), p = progressData(from), all = progressData();
  const w = Object.keys(weights()).sort(), wFirst = w.length ? weights()[w[0]] : null, wLast = w.length ? weights()[w[w.length - 1]] : null;
  if (!all.ex.length && !all.passes) return `<div class="card"><h2>Här växer din utveckling fram</h2>
    <div class="muted">När du sparat några pass visas dina framsteg, personbästa och hur ofta du tränar.</div></div>${weightSection(w, wFirst, wLast)}`;
  const chips = `<div class="hper" role="radiogroup" aria-label="Period">${PERIODS.map(([k, n]) => `<button role="radio" data-hper="${k}" class="${histPer === k ? "on" : ""}" aria-checked="${histPer === k}">${n}</button>`).join("")}</div>`;
  const wl = wins(p);
  const winsHtml = wl.length ? `<div class="klabel hsec">Framsteg</div><div class="hwins">${wl.map(([ic, t, sub, num]) =>
    `<div class="hwin"><span class="hwin-ic">${ic === "num" ? num : icon(ic === "up" ? "trend" : "check", 16)}</span><span class="col"><b>${esc(t)}</b><span class="muted small">${esc(sub)}</span></span></div>`).join("")}</div>` : "";
  // Veckor i perioden (för snittet och stapeldiagrammet), från första passet om det är senare
  const start = from > (all.first || TODAY) ? from : (all.first || TODAY);
  const weeks = Math.max(1, Math.round((parse(TODAY) - parse(weekStart(start))) / 6048e5) + 1);
  const tile = (l, v, sub) => `<div class="hstat"><span class="klabel">${l}</span><b>${v}</b><span class="muted small">${sub}</span></div>`;
  const stats = `<div class="hstats">${tile("Pass", p.passes, histPer === "all" ? "totalt" : "perioden")}${tile("Snitt", fmtNum(p.passes / weeks), "pass/vecka")}${tile("Nya PB", p.pbs, histPer === "all" ? "totalt" : "perioden")}</div>`;
  const bars = Math.min(26, Math.max(4, weeks));
  // Styrka: de som ökat mest under perioden först, övriga under Visa alla
  const str = p.ex.slice().sort((a, b) => (b.times > 1) - (a.times > 1) || (b.unit === "kg") - (a.unit === "kg") || b.gain - a.gain || b.last.localeCompare(a.last));
  const shown = strAll ? str : str.slice(0, 5);
  const rows = shown.map(e => `<button class="hstr" data-chart="${e.id}"><span class="grow"><b>${esc(EX[e.id].name)}</b><span class="muted small">${fmtSet(e.best, e.id)}${e.times > 1 ? "" : " · loggad en gång"}</span></span>
      ${spark(e)}<span class="hstr-g">${gain(e) || `<span class="delta same">±0</span>`}</span></button>`).join("");
  return `${chips}${winsHtml}${stats}
    <section class="hblock"><div class="row between hsec2"><h2>Pass per vecka</h2><span class="muted small">mål ${S.plan.count}</span></div>${weekBars(bars)}</section>
    ${rows ? `<section class="hblock"><div class="row between hsec2"><h2>Styrka</h2><span class="muted small">ökning under perioden</span></div>${rows}
      ${str.length > 5 ? `<button class="ghost wide" data-hstrall aria-expanded="${strAll}">${strAll ? "Visa färre" : `Visa alla ${str.length} övningar`}${icon(strAll ? "up" : "down", 16)}</button>` : ""}</section>`
      : `<div class="muted hnone">Inga övningar loggade under perioden.</div>`}
    ${actSummary()}
    ${weightSection(w, wFirst, wLast)}`;
}

function historikView() {
  // Medan en dag är öppen gäller bockar och vikt den dagen
  editDate = histDay && histDay !== TODAY ? histDay : null;
  const seg = `<div class="daypick hseg" role="tablist" style="grid-template-columns:1fr 1fr">${[["kalender", "Kalender"], ["utveckling", "Utveckling"]].map(([k, n]) =>
    `<button data-hview="${k}" class="${histView === k ? "on" : ""}" role="tab" aria-selected="${histView === k}"><b>${n}</b></button>`).join("")}</div>`;
  return `<h1>Historik</h1>${seg}${histView === "utveckling" ? progressView() : `${calendar()}${weekSection()}`}${histDay ? daySheet() : ""}`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-histday],[data-hclose],[data-hmonth],[data-hpass],[data-hfood],[data-hview],[data-weekex],[data-hsub],[data-hper],[data-hstrall],[data-wsave]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset;
  // Vikten sparas av app.js; fönstret går tillbaka till dagen när värdet är giltigt
  if (ds.wsave !== undefined) { const v = +String(($("wkg") || {}).value || "").replace(",", "."); if (histSub === "vikt" && v > 0) histSub = null; return; }
  if (ds.weekex !== undefined) weekExOpen = !weekExOpen;
  else if (ds.hsub !== undefined) histSub = ds.hsub || null;
  else if (ds.hper) histPer = ds.hper;
  else if (ds.hstrall !== undefined) strAll = !strAll;
  else if (ds.hview) histView = ds.hview;
  else if (ds.histday) { histDay = ds.histday; histSub = null; }
  else if (ds.hclose !== undefined) { histDay = null; histSub = null; editDate = null; }
  else if (ds.hmonth) {
    const [y, mo] = (histMonth || TODAY.slice(0, 7)).split("-").map(Number), dt = new Date(y, mo - 1 + +ds.hmonth, 1);
    histMonth = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  }
  else if (ds.hpass !== undefined) {
    editDate = histDay === TODAY ? null : histDay;
    histDay = null; tab = "pass"; chosenDay = ds.hpass || null; editing = false;
    // Historiken får visas utan att det pågående passet avslutas.
    if (focus) focus.suspended = true;
    passOpen = true;
  }
  else if (ds.hfood !== undefined) { editDate = histDay === TODAY ? null : histDay; histDay = null; kostDay = false; closeMealEditor(); tab = "kost"; }
  save();
  render();
  if (ds.hpass !== undefined || ds.hfood !== undefined) window.scrollTo(0, 0);
});

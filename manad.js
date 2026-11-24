"use strict";
// ---------- Månaden i siffror ----------
// Första veckan i en ny månad visar Hem ett kort med förra månaden: pass, nya rekord, total vikt och
// mest körda passet. Kortet öppnar en sida med allt och en bild att dela (ritas i telefonen, inget laddas upp).
// Laddas före app.js.

const MON_SV = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
// "YYYY-MM" för månaden k månader bakåt från idag
function monthKey(k = 0) {
  const [y, m] = TODAY.slice(0, 7).split("-").map(Number), d = new Date(y, m - 1 - k, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
const monthName = key => MON_SV[+key.slice(5, 7) - 1];
const monthDays = key => { const [y, m] = key.split("-").map(Number); return Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => `${key}-${String(i + 1).padStart(2, "0")}`); };

function monthStats(key) {
  const days = monthDays(key);
  let passes = 0, trained = 0, vol = 0, pbs = 0, dailyDays = 0;
  const byPass = {}, pbList = [];
  for (const d of days) {
    const ws = workoutsOn(d).filter(w => w.done);
    if (ws.length) trained++;
    passes += ws.length;
    for (const w of ws) {
      const name = (dayById(w.dayId) || {}).name || (w.act && w.act.name) || "Pass";
      byPass[name] = (byPass[name] || 0) + 1;
    }
    for (const id of new Set(exIdsOn(d))) {
      if (!EX[id]) continue;
      for (const s of setsOn(d, id)) if (s && s.ok && +s.kg && +s.reps) vol += +s.kg * +s.reps;
      const top = topSet(setsOn(d, id)), b = bestBefore(id, d);
      if (top && b && betterSet(top, b)) { pbs++; pbList.push({ id, top, d }); }
    }
    if (typeof allDailiesDone === "function" && allDailiesDone(d)) dailyDays++;
  }
  const top = Object.entries(byPass).sort((a, b) => b[1] - a[1])[0];
  const prevKey = (() => { const [y, m] = key.split("-").map(Number), d = new Date(y, m - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; })();
  const prev = monthDays(prevKey).reduce((a, d) => a + workoutsOn(d).filter(w => w.done).length, 0);
  // Veckor (måndag) som började i månaden och nådde målet
  // Helt pausade veckor räknas inte; delvis pausade har ett mindre mål
  const goalOf = d => typeof weekGoal === "function" ? weekGoal(d) : S.plan.count;
  const goalWeeks = days.filter(d => weekdayOf(d) === 0 && d < weekStart(TODAY) && goalOf(d) > 0).filter(d => weekSummary(d).passes >= goalOf(d)).length;
  const weeksIn = days.filter(d => weekdayOf(d) === 0 && d < weekStart(TODAY) && goalOf(d) > 0).length;
  // Bästa rekordet: störst ökning i kg, annars senaste
  pbList.sort((a, b) => (+b.top.kg || 0) - (+a.top.kg || 0));
  return { key, passes, trained, vol, pbs, best: pbList[0] || null, top: top ? { name: top[0], n: top[1] } : null, prev, goalWeeks, weeksIn, dailyDays };
}

// Kortet på Hem: dag 1–7 i månaden, tills man stängt det, och bara om förra månaden hade något
function monthCard() {
  const key = monthKey(1);
  if (+TODAY.slice(8) > 7 || S.monthSeen === key) return "";
  const m = monthStats(key);
  if (!m.passes) return "";
  return `<section class="mcard"><button class="mcard-open" data-tab="manad" aria-label="${cap(monthName(key))} i siffror">
      <span class="klabel">${cap(monthName(key))} i siffror</span>
      <span class="mcard-big"><b>${m.passes}</b><span>pass</span></span>
      <span class="mcard-row">${m.pbs ? `<span>${icon("trend", 14)}${m.pbs} nya rekord</span>` : ""}${m.vol ? `<span>${fmtTon(m.vol)} lyft</span>` : ""}${m.prev && m.passes > m.prev ? `<span>+${m.passes - m.prev} mot ${monthName(monthKey(2))}</span>` : ""}</span>
      <span class="mcard-go">Se hela månaden ${icon("right", 14)}</span></button>
    <button class="iconbtn ghost mcard-x" data-monthseen="${key}" aria-label="Dölj">${icon("close", 16)}</button></section>`;
}
const fmtTon = kg => kg >= 1000 ? `${fmtNum(Math.round(kg / 100) / 10)} ton` : `${Math.round(kg)} kg`;

// Sidan: hela månaden och en bild att dela
let monthView = null;   // vilken månad sidan visar
function monthPage() {
  const key = monthView || monthKey(1), m = monthStats(key), name = cap(monthName(key));
  const tile = (v, l) => `<div class="mtile"><b>${v}</b><span>${l}</span></div>`;
  const best = m.best ? `${EX[m.best.id].name} ${fmtSet(m.best.top, m.best.id)}` : "";
  return `<div class="mpage"><button class="backbtn" data-tab="idag">${icon("left", 18)}Hem</button>
    <span class="klabel">Månaden i siffror</span><h1>${name}</h1>
    <section class="mhero"><b>${m.passes}</b><span>pass${m.prev ? ` · ${m.passes >= m.prev ? `+${m.passes - m.prev}` : m.passes - m.prev} mot ${monthName(monthKey(2))}` : ""}</span></section>
    <div class="mtiles">${tile(m.trained, m.trained === 1 ? "dag med träning" : "dagar med träning")}${tile(m.pbs, m.pbs === 1 ? "nytt rekord" : "nya rekord")}
      ${tile(m.vol ? fmtTon(m.vol) : "–", "total vikt")}${tile(m.weeksIn ? `${m.goalWeeks} av ${m.weeksIn}` : "–", "veckor med målet")}</div>
    ${m.top ? `<div class="mline">${icon("trana", 18)}<span class="grow">Mest körda passet</span><b>${esc(m.top.name)} · ${m.top.n}</b></div>` : ""}
    ${best ? `<div class="mline">${icon("trend", 18)}<span class="grow">Tyngsta rekordet</span><b>${esc(best)}</b></div>` : ""}
    ${m.dailyDays ? `<div class="mline">${icon("check", 18)}<span class="grow">Alla dailys klara</span><b>${m.dailyDays} ${m.dailyDays === 1 ? "dag" : "dagar"}</b></div>` : ""}
    <button class="primary wide bigbtn mshare" data-monthshare="${key}">${icon("share", 18)}Dela bilden</button>
    <p class="muted small mnote">Bilden visar bara antal pass, rekord och total vikt, aldrig kroppsvikt eller mat.</p></div>`;
}

// Bilden: 1080 × 1350, ritas i telefonen
async function monthImage(key) {
  const m = monthStats(key), c = document.createElement("canvas"); c.width = 1080; c.height = 1350;
  const x = c.getContext("2d"), font = (w, s) => `${w} ${s}px Lexend, system-ui, sans-serif`, head = s => `800 ${s}px Unbounded, Lexend, sans-serif`;
  try { await document.fonts.ready; } catch (e) { /* standardtypsnitt */ }
  const g = x.createLinearGradient(0, 0, 0, 1350); g.addColorStop(0, "#2a160b"); g.addColorStop(0.45, "#0d0e10"); g.addColorStop(1, "#0d0e10");
  x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = "#ff6b1a"; x.font = font(700, 36); x.fillText("DRIV", 80, 120);
  x.fillStyle = "#9aa0aa"; x.font = font(500, 34); x.fillText("Månaden i siffror", 80, 220);
  x.fillStyle = "#f4f2ee"; x.font = head(96); x.fillText(cap(monthName(key)), 80, 330);
  x.font = head(300); x.fillStyle = "#ff6b1a"; x.fillText(String(m.passes), 70, 650);
  x.font = font(600, 54); x.fillStyle = "#f4f2ee"; x.fillText("pass", 80, 730);
  const tiles = [[m.trained, "dagar med träning"], [m.pbs, "nya rekord"], [m.vol ? fmtTon(m.vol) : "–", "total vikt"], [m.top ? m.top.name : "–", "mest kört"]];
  tiles.forEach(([v, l], i) => {
    const col = i % 2, row = Math.floor(i / 2), X = 80 + col * 470, Y = 820 + row * 220;
    x.fillStyle = "#1a1c21"; x.beginPath(); x.roundRect ? x.roundRect(X, Y, 440, 190, 36) : x.rect(X, Y, 440, 190); x.fill();
    x.fillStyle = "#f4f2ee"; x.font = head(String(v).length > 7 ? 48 : 64); x.fillText(String(v), X + 36, Y + 100);
    x.fillStyle = "#9aa0aa"; x.font = font(500, 30); x.fillText(l, X + 36, Y + 152);
  });
  x.fillStyle = "#9aa0aa"; x.font = font(500, 28); x.fillText("driv.driveify.se", 80, 1300);
  return new Promise(r => c.toBlob(r, "image/png"));
}
async function shareMonth(key) {
  const blob = await monthImage(key), file = new File([blob], `driv-${key}.png`, { type: "image/png" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: `Min ${monthName(key)} i Driv` }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  // Utan dela-funktion: bilden laddas ner
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-monthseen],[data-monthshare],[data-tab='manad']");
  if (!t) return;
  if (t.dataset.tab === "manad") { monthView = monthKey(1); return; }   // själva bytet sköts av appen
  ev.stopImmediatePropagation();
  if (t.dataset.monthseen) { S.monthSeen = t.dataset.monthseen; save(); render(); }
  else if (t.dataset.monthshare) shareMonth(t.dataset.monthshare);
}, true);

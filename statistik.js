"use strict";
// ---------- Anonym statistik och felrapporter ----------
// Skickar några få fasta händelser ("pass_klart" osv.) och felmeddelanden till Supabase, utan
// användar-id, e-post eller annat som pekar ut någon. Aktiva per vecka räknas med en signal per enhet
// och vecka (bara veckan sparas i telefonen, inget id). Går att stänga av under Inställningar.
// Sidan Statistik visas bara för den som står som admin i Supabase (supabase/statistik.sql).
// Laddas efter konto.js och före app.js.

const statsOn = () => sbEnabled && !window.DRIV_TEST && !(typeof S !== "undefined" && S.noStats);
function statPlatform() {
  const ua = navigator.userAgent || "", os = /android/i.test(ua) ? "android" : /iphone|ipad|ipod/i.test(ua) ? "ios" : "dator";
  const app = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
  return `${os}-${app ? "app" : "webb"}`;
}
function statRpc(name, body) {
  return fetch(`${sbConf.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/${name}`, {
    method: "POST", keepalive: true,
    headers: { apikey: sbConf.supabaseAnonKey, Authorization: `Bearer ${sbConf.supabaseAnonKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}
// Samma händelse räknas högst en gång per halvminut (dubbeltryck och omritningar)
const statLast = {};
function track(event) {
  if (!statsOn()) return;
  const now = Date.now();
  if (statLast[event] && now - statLast[event] < 30000) return;
  statLast[event] = now;
  statRpc("driv_track", { p_event: event, p_platform: statPlatform() });
}
// En gång per vecka och enhet: räknar aktiva
function trackWeek() {
  if (!statsOn()) return;
  let wk = null;
  try { wk = localStorage.getItem("driv-aktiv"); } catch (e) { /* inget minne */ }
  const now = weekStart(TODAY);
  if (wk === now) return;
  try { localStorage.setItem("driv-aktiv", now); } catch (e) { return; }   // utan minne räknas inte veckan, hellre än dubbelt
  track("aktiv_vecka");
}

// Felrapporter: högst fem per besök och varje meddelande en gång
const errSeen = new Set();
function reportError(message, source) {
  if (!statsOn() || errSeen.size >= 5) return;
  const msg = String(message || "").slice(0, 300);
  if (!msg || msg === "Script error." || errSeen.has(msg)) return;   // fel från andra webbplatser och tillägg säger inget
  errSeen.add(msg);
  statRpc("driv_report_error", { p_message: msg, p_source: String(source || "").slice(0, 200),
    p_page: typeof tab !== "undefined" ? String(tab) : "", p_platform: statPlatform() });
}
window.addEventListener("error", ev => {
  const f = (ev.filename || "").split("/").pop().split("?")[0];
  if (f && !/\.js$/.test(f)) return;
  reportError(ev.message || (ev.error && ev.error.message), f ? `${f}:${ev.lineno || 0}` : "");
});
window.addEventListener("unhandledrejection", ev => {
  const r = ev.reason;
  if (r && (r.name === "AbortError" || /Failed to fetch|NetworkError|Load failed/i.test(r.message || ""))) return;   // nätet, inte koden
  reportError(r && r.message ? `Promise: ${r.message}` : `Promise: ${String(r)}`, r && r.stack ? String(r.stack).split("\n")[1] || "" : "");
});

// ---------- Sidan Statistik (bara för admin) ----------
const stats = { admin: false, data: null, error: "" };
async function checkStatsAdmin() {
  if (!sbEnabled || typeof account === "undefined" || account.step !== "in") { stats.admin = false; return; }
  try { const sb = await supabaseClient(); const { data } = await sb.rpc("driv_is_admin"); stats.admin = data === true; }
  catch (e) { stats.admin = false; }
}
async function loadStats() {
  stats.error = ""; stats.data = null; render();
  try {
    const sb = await supabaseClient(), { data, error } = await sb.rpc("driv_stats");
    if (error) throw error;
    stats.data = data;
  } catch (e) { stats.error = (e && e.message) || "Kunde inte hämta statistiken."; }
  render();
}
const EVENT_NAMES = { pass_klart: "Pass klara", aktivitet_loggad: "Aktiviteter", dailys_klara: "Alla dailys klara", mat_loggad: "Mat loggad",
  skanner: "Skannade varor", recept_sparat: "Recept sparade", utmaning_skapad: "Utmaningar" };
const PLATFORM_NAMES = { "android-app": "Android, installerad", "android-webb": "Android, webbläsare", "ios-app": "iPhone, installerad",
  "ios-webb": "iPhone, webbläsare", "dator-app": "Dator, installerad", "dator-webb": "Dator, webbläsare" };
function statsView() {
  const back = `<button class="backbtn" data-tab="profil">${icon("left", 18)}Inställningar</button><h1>Statistik</h1>`;
  if (!stats.admin) return `${back}<p class="muted">Statistiken visas bara för administratörer.</p>`;
  if (stats.error) return `${back}<p class="muted">${esc(stats.error)}</p><button data-statsload>Försök igen</button>`;
  const d = stats.data;
  if (!d) return `${back}<p class="muted" role="status">Hämtar …</p>`;
  const weeks = d.weeks || [], last = weeks[weeks.length - 1], prev = weeks[weeks.length - 2];
  const chart = weeks.length && typeof barChart === "function"
    ? barChart({ vals: weeks.map((w, i) => ({ v: +w.active, label: i === 0 || i === weeks.length - 1 ? `v.${weekNo(w.week)}` : "", tip: `Vecka ${weekNo(w.week)}: ${w.active} aktiva`, top: i === weeks.length - 1 ? String(w.active) : "" })), aria: "Aktiva per vecka", fmt: v => String(Math.round(v)) })
    : `<p class="muted small">Inga aktiva veckor än.</p>`;
  const row = (l, a, b) => `<div class="strow"><span class="grow">${l}</span><b>${a}</b><span class="muted small">${b}</span></div>`;
  return `${back}<p class="muted small">Anonymt: inga namn, e-postadresser eller id. Aktiva räknas en gång per enhet och vecka.</p>
    <section class="card stcard"><span class="klabel">Aktiva den här veckan</span>
      <div class="stbig"><b>${last ? last.active : 0}</b>${prev ? `<span class="muted small">förra veckan ${prev.active}</span>` : ""}</div>${chart}</section>
    <div class="klabel sechead">Händelser</div>
    <section class="card stcard">${(d.events || []).length ? `<div class="strow sthead"><span class="grow"></span><span class="muted small">7 dagar</span><span class="muted small">30 dagar</span></div>`
      + d.events.map(e => row(EVENT_NAMES[e.event] || esc(e.event), e.d7, e.d30)).join("") : `<p class="muted small">Inget än.</p>`}</section>
    ${(d.platforms || []).length ? `<div class="klabel sechead">Telefoner, senaste 4 veckorna</div><section class="card stcard">${d.platforms.map(p => `<div class="strow"><span class="grow">${PLATFORM_NAMES[p.platform] || esc(p.platform || "Okänt")}</span><b>${p.n}</b></div>`).join("")}</section>` : ""}
    <div class="klabel sechead">Fel · ${d.errors7} senaste veckan</div>
    <section class="card stcard">${(d.errors || []).length ? d.errors.map(x => `<div class="sterr"><b>${esc(x.message)}</b>
      <span class="muted small">${esc(x.source || "okänd plats")} · ${esc(x.page || "–")} · ${x.n} ${+x.n === 1 ? "gång" : "gånger"} · ${esc(x.platforms || "")} · senast ${shortDate(String(x.last).slice(0, 10))}</span></div>`).join("")
      : `<p class="muted small">Inga fel de senaste 30 dagarna.</p>`}</section>
    <button class="ghost wide" data-statsload>Uppdatera</button>`;
}
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-statsload],[data-tab='statistik'],[data-nostats]");
  if (!t) return;
  if (t.dataset.tab === "statistik") { loadStats(); return; }   // själva bytet sköts av appen
  ev.stopImmediatePropagation();
  if (t.dataset.statsload !== undefined) loadStats();
  else if (t.dataset.nostats !== undefined) { S.noStats = !t.checked; save(); render(); }
}, true);

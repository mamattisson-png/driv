"use strict";
// ---------- Aktiviteter ----------
// Annan träning som loggas med tid: padel, vandring, kanot … Sparas per dag i log[datum].acts som
// { name, min, int (1 lugnt, 2 medel, 3 hårt), km }. En aktivitet på minst 45 minuter räknas mot
// veckans pass (går att stänga av), och förbrända kcal kan läggas till dagens kalorimål (av från början).
// Laddas före app.js; anropas först när appen ritas.

// Träningsformerna (ACTIVITIES) och sökningen finns i motion.js
const INTENSITY = ["Lugnt", "Medel", "Hårt"];
const actInfo = name => ACTIVITIES.find(a => a.name.toLowerCase() === String(name).trim().toLowerCase());
const actIcon = () => icon("aktivitet", 20);
const actsOn = date => (S.log[date] && S.log[date].acts) || [];
const actCounts = a => S.plan.free ? +a.min > 0 : S.actCount !== false && +a.min >= 45;
// Ungefär förbrända kcal: MET × kroppsvikt × timmar (okänd aktivitet räknas som medelhård, MET 5)
function actKcal(a) {
  const info = actInfo(a.name), met = info ? info.met[(a.int || 2) - 1] : [3.5, 5, 7][(a.int || 2) - 1];
  return Math.round(met * (S.profile.weight || 75) * (+a.min || 0) / 60);
}
// Dagens kalorimål, med aktiviteternas kcal om man valt det
const burnedOn = date => S.actKcal ? [...actsOn(date), ...schedActs(date)].reduce((s, a) => s + actKcal(a), 0) : 0;
const actLine = a => [`${+a.min} min`, a.km ? `${fmtNum(+a.km)} km` : "", INTENSITY[(a.int || 2) - 1].toLowerCase()].filter(Boolean).join(" · ");

// De aktiviteter man loggat oftast, sedan de vanligaste i listan
function favActs(n) {
  const count = {};
  for (const L of Object.values(S.log)) for (const a of L.acts || []) count[a.name] = (count[a.name] || 0) + 1;
  const mine = Object.keys(count).sort((x, y) => count[y] - count[x]);
  return [...new Set([...mine, ...POPULAR_ACTS, ...ACTIVITIES.map(a => a.name)])].slice(0, n);
}

let actSheet = null;   // { date, idx, name, min, int, km, custom } (plus plan/dayId för schemat, se schema.js)
let actQ = "";   // sökningen i fönstret
// Steg 1: välj vad. Sökträffar som rader, annars det man loggat senast och de vanligaste som knappar.
// Finns det inte i listan läggs det man skrivit till som en egen träningsform.
function actChips(s) {
  const q = actQ.trim();
  if (q) {
    const hits = actSearch(q).slice(0, 8), own = !hits.some(n => n.toLowerCase() === q.toLowerCase());
    return `<section class="h3-list actlist">${hits.map(n => `<button class="h3-row" data-actpick="${esc(n)}"><span class="h3-ic actic">${icon("aktivitet", 16)}</span><span class="grow"><b>${esc(n)}</b><small>ca ${actKcal({ name: n, min: 30, int: 2 })} kcal på 30 min</small></span>${icon("right", 16)}</button>`).join("")}
      ${own ? `<button class="h3-row" data-actpick="${esc(q.slice(0, 30))}" data-actown><span class="h3-ic">${icon("plus", 16)}</span><span class="grow"><b>Lägg till ”${esc(q.slice(0, 30))}”</b><small>${hits.length ? "Något annat" : "Ingen träff"} · räknas som medelhård</small></span></button>` : ""}</section>`;
  }
  const count = {};
  for (const L of Object.values(S.log)) for (const a of L.acts || []) count[a.name] = (count[a.name] || 0) + 1;
  const recent = Object.keys(count).sort((x, y) => count[y] - count[x]).slice(0, 4);
  const common = POPULAR_ACTS.filter(n => !recent.includes(n)).slice(0, recent.length ? 9 : 12);
  const chip = n => `<button data-actpick="${esc(n)}">${esc(n)}</button>`;
  return `${recent.length ? `<div class="klabel actk">Dina vanligaste</div><div class="chips actchips">${recent.map(chip).join("")}</div>` : ""}
    <div class="klabel actk">Populärt</div><div class="chips actchips">${common.map(chip).join("")}</div>
    <div class="muted small acthint">Hittar du inte det du gjort? Skriv det i sökrutan, så kan du lägga till det.</div>`;
}
function openAct(date, idx, name) {
  actQ = "";
  const a = idx != null ? actsOn(date)[idx] : null;
  const info = name && actInfo(name);
  actSheet = a ? { date, idx, name: a.name, min: a.min, int: a.int || 2, km: a.km || "", custom: !actInfo(a.name) }
    : { date, idx: null, name: info ? info.name : "", min: 30, int: 2, km: "", custom: false };
}
const ACT_MINS = [15, 30, 45, 60, 90];
function actSheetView() {
  const s = actSheet, info = actInfo(s.name), showKm = s.custom || (info && info.km);
  const kcal = s.name ? actKcal(s) : 0, gym = s.plan && s.gym;
  // Steg 1 (välja) när inget är valt eller man tryckt Byt; annars steg 2 (tid, intensitet, sträcka)
  const choosing = !gym && !s.dayId && (!s.name || s.choosing);
  const title = s.plan ? (s.i != null ? `Ändra ${esc(s.name)}` : "Lägg till pass") : s.dayId ? `${esc(s.name)}${s.done ? "" : " klar"}`
    : s.idx != null ? "Ändra träning" : "Logga motion";
  const counts = s.plan || s.dayId || actCounts({ min: s.min });
  const summary = `<div class="actsum"><b>ca ${kcal} kcal</b><span>${s.plan ? "räknas som pass när det är klart" : counts ? "räknas som pass i veckan" : `räknas som pass från 45 min`}${S.actKcal && !s.plan ? " · läggs till kalorimålet" : ""}</span></div>`;
  const foot = `<div class="sheet-foot row">${s.idx != null || (s.dayId && s.done) ? `<button class="ghost" data-actdel>Ta bort</button>` : ""}
      <button class="primary grow" data-actsave ${(s.name || "").trim() && !(s.plan && draft.mode === "fixed" && s.wd == null) ? "" : "disabled"}>${s.plan ? (s.i != null ? "Spara" : `Lägg till${s.name ? " " + esc(s.name) : ""}`) : s.dayId && !s.done ? "Klar" : "Spara"}</button></div>`;
  const head = `<div class="row between"><h2>${title}</h2><button class="small ghost" data-actclose aria-label="Stäng">${icon("close", 18)}</button></div>
    ${s.date && s.date !== TODAY ? `<div class="muted small" style="margin-top:-6px">${dateLabel(s.date).replace(/^./, c => c.toUpperCase())}</div>` : ""}
    ${s.plan ? planSheetTop(s) : ""}`;
  if (gym) return `<div class="overlay" data-actclose><div class="sheet actsheet">${head}
    <label class="field" style="margin-top:10px">Namn på passet<input id="actname" value="${esc(s.name)}" placeholder="t.ex. Bröst och armar" maxlength="30" autocomplete="off"></label>
    <div class="muted small" style="margin-top:8px">Övningarna lägger du till i passet under Träna.</div>${planSheetDays(s)}${foot}</div></div>`;
  if (choosing) return `<div class="overlay" data-actclose><div class="sheet actsheet">${head}
    <input id="actq" class="actq" type="search" placeholder="Sök: löpning, padel, EMS …" autocomplete="off" aria-label="Sök träningsform" value="${esc(actQ)}">
    <div id="actchips">${actChips(s)}</div>
    ${s.name ? `<button class="ghost wide actback" data-actchoose="0">Behåll ${esc(s.name)}</button>` : ""}</div></div>`;
  return `<div class="overlay" data-actclose><div class="sheet actsheet">${head}
    <div class="actchosen"><span class="h3-ic actic">${icon("aktivitet", 18)}</span><b class="grow">${esc(s.name)}</b>${s.dayId ? "" : `<button class="linkbtn2" data-actchoose="1">Byt</button>`}</div>
    <div class="klabel actk">${s.plan ? "Mål, tid" : "Tid"}</div>
    <div class="row qtyrow"><button class="step" data-actmin="-5" ${s.min <= 5 ? "disabled" : ""} aria-label="5 minuter kortare">−</button><b class="qcount grow">${s.min} min</b>
      <button class="step" data-actmin="5" aria-label="5 minuter längre">+</button></div>
    <div class="chips actmins">${ACT_MINS.map(m => `<button data-actset="${m}" class="${s.min === m ? "on" : ""}">${m}</button>`).join("")}</div>
    <div class="klabel actk">Intensitet</div>
    <div class="seg three" role="radiogroup" aria-label="Hur tungt">${INTENSITY.map((n, i) =>
      `<button data-actint="${i + 1}" class="${s.int === i + 1 ? "on" : ""}" role="radio" aria-checked="${s.int === i + 1}">${n}</button>`).join("")}</div>
    ${showKm ? `<label class="field actkmf">${s.plan ? "Mål, sträcka (km, frivilligt)" : "Sträcka (km, frivilligt)"}<input id="actkm" type="number" inputmode="decimal" step="0.1" min="0" value="${s.km}" placeholder="–"></label>` : ""}
    ${s.plan ? planSheetDays(s) : ""}
    ${summary}${foot}</div></div>`;
}

// Dagens aktiviteter som rader, och knappar för att logga en ny
function actsCard(date, title = "Annan träning") {
  const list = actsOn(date);
  return `<section class="card actcard"><div class="row between"><h2>${title}</h2>${list.length ? `<span class="muted small">${list.length} idag</span>` : ""}</div>
    ${list.map((a, i) => `<button class="krow" data-actedit="${i}" data-actdate="${date}"><span class="hricon" aria-hidden="true">${actIcon(a.name)}</span>
      <span class="grow"><b>${esc(a.name)}</b><span class="muted small">${actLine(a)}${actCounts(a) ? " · räknas som pass" : ""}</span></span><span class="chev" aria-hidden="true">›</span></button>`).join("")}
    <div class="chips actchips" style="margin-top:${list.length ? 10 : 2}px">${favActs(4).map(n => `<button data-actnew="${esc(n)}" data-actdate="${date}">${esc(n)}</button>`).join("")}
      <button data-actnew="" data-actdate="${date}">＋ Mer</button></div></section>`;
}

// Vänner ser aktiviteten precis som ett pass: "Padel · 90 min"
function shareAct(a, date, done) {
  if (typeof social === "undefined" || !social.profile || !social.profile.sharing) return;
  socialRpc("driv_log_activity", { p_day: date, p_pass: `${a.name} · ${+a.min} min`.slice(0, 40), p_exercises: 0, p_done: done })
    .then(() => socialRpc("driv_feed")).then(f => { social.feed = f; render(); }).catch(() => {});
}

document.addEventListener("change", ev => {
  const ds = ev.target.dataset || {};
  if (ds.actcount !== undefined) S.actCount = ev.target.checked;
  else if (ds.actkcal !== undefined) S.actKcal = ev.target.checked;
  else return;
  save(); render();
});
document.addEventListener("input", ev => {
  if (!actSheet) return;
  if (ev.target.id === "actq") { actQ = ev.target.value; const c = document.getElementById("actchips"); if (c) c.innerHTML = actChips(actSheet); return; }
  if (ev.target.id === "actname") { actSheet.name = ev.target.value; const b = document.querySelector("[data-actsave]"); if (b) b.disabled = !ev.target.value.trim(); }
  if (ev.target.id === "actkm") actSheet.km = ev.target.value;
});
document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-actnew],[data-actedit],[data-actclose],[data-actpick],[data-actmin],[data-actset],[data-actchoose],[data-actint],[data-actsave],[data-actdel]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset, s = actSheet;
  if (ds.actnew !== undefined) openAct(ds.actdate || logDate(), null, ds.actnew);
  else if (ds.actedit !== undefined) openAct(ds.actdate || logDate(), +ds.actedit);
  else if (ds.actclose !== undefined) actSheet = null;
  else if (ds.actpick !== undefined) {
    // Ett eget namn från sökningen blir en egen aktivitet (medelhård om den inte finns i listan)
    const info = actInfo(ds.actpick);
    s.custom = !info; s.name = info ? info.name : ds.actpick.trim().slice(0, 30);
    actQ = ""; s.choosing = false;
  }
  else if (ds.actchoose !== undefined) { s.choosing = ds.actchoose === "1"; actQ = ""; }
  else if (ds.actset) s.min = +ds.actset;
  else if (ds.actmin) s.min = Math.max(5, s.min + +ds.actmin);
  else if (ds.actint) s.int = +ds.actint;
  else if (ds.actsave !== undefined) {
    const a = { name: s.name.trim().slice(0, 30), min: s.min, int: s.int };
    if (+s.km > 0) a.km = Math.round(+s.km * 10) / 10;
    const L = day(s.date), list = L.acts || (L.acts = []);
    if (s.idx != null) list[s.idx] = a; else list.push(a);
    shareAct(a, s.date, true);
    toast(`${a.name} sparad`);
    actSheet = null;
  }
  else if (ds.actdel !== undefined) {
    const L = day(s.date), [a] = L.acts.splice(s.idx, 1);
    if (!L.acts.length) delete L.acts;
    if (a) shareAct(a, s.date, false);
    actSheet = null;
  }
  ev.stopImmediatePropagation();
  save();
  render();
  // Steg 1: direkt till sökrutan
  if (actSheet && !actSheet.plan && !actSheet.dayId && (!actSheet.name || actSheet.choosing) && (ds.actnew !== undefined || ds.actchoose === "1")) { const q = document.getElementById("actq"); if (q) q.focus(); }
}, true);

"use strict";
// ---------- Aktiviteter ----------
// Annan träning som loggas med tid: padel, vandring, kanot … Sparas per dag i log[datum].acts som
// { name, min, int (1 lugnt, 2 medel, 3 hårt), km }. En aktivitet på minst 45 minuter räknas mot
// veckans pass (går att stänga av), och förbrända kcal kan läggas till dagens kalorimål (av från början).
// Laddas före app.js; anropas först när appen ritas.

// MET-värden för lugnt, medel och hårt (Compendium of Physical Activities, avrundade)
const ACTIVITIES = [
  { name: "Löpning", met: [7, 9.5, 11.5], km: true },
  { name: "Padel", met: [5, 6, 8] },
  { name: "Tennis", met: [5, 7, 8] },
  { name: "Vandring", met: [4, 6, 7.5], km: true },
  { name: "Kanot", met: [3, 5, 7], km: true },
  { name: "Frisbeegolf", met: [3, 3.5, 4], km: true },
  { name: "Cykling", met: [4, 7, 10], km: true },
  { name: "Promenad", met: [3, 3.5, 4.5], km: true },
  { name: "Simning", met: [5, 7, 9.5], km: true },
  { name: "Fotboll", met: [6, 7, 10] },
  { name: "Innebandy", met: [6, 8, 10] },
  { name: "Golf", met: [3.5, 4.3, 5], km: true },
  { name: "Skidor", met: [5, 7, 9], km: true },
  { name: "Klättring", met: [5, 7, 8] },
  { name: "Yoga", met: [2.5, 3, 4] },
  { name: "Dans", met: [4, 5.5, 7] },
  { name: "Kampsport", met: [6, 8, 10] },
];
const INTENSITY = ["Lugnt", "Medel", "Hårt"];
const actInfo = name => ACTIVITIES.find(a => a.name.toLowerCase() === String(name).trim().toLowerCase());
const actIcon = () => icon("aktivitet", 20);
const actsOn = date => (S.log[date] && S.log[date].acts) || [];
const actCounts = a => S.actCount !== false && +a.min >= 45;
// Ungefär förbrända kcal: MET × kroppsvikt × timmar (okänd aktivitet räknas som medelhård, MET 5)
function actKcal(a) {
  const info = actInfo(a.name), met = info ? info.met[(a.int || 2) - 1] : [3.5, 5, 7][(a.int || 2) - 1];
  return Math.round(met * (S.profile.weight || 75) * (+a.min || 0) / 60);
}
// Dagens kalorimål, med aktiviteternas kcal om man valt det
const burnedOn = date => S.actKcal ? actsOn(date).reduce((s, a) => s + actKcal(a), 0) : 0;
const actLine = a => [`${+a.min} min`, a.km ? `${fmtNum(+a.km)} km` : "", INTENSITY[(a.int || 2) - 1].toLowerCase()].filter(Boolean).join(" · ");

// De aktiviteter man loggat oftast, sedan de vanligaste i listan
function favActs(n) {
  const count = {};
  for (const L of Object.values(S.log)) for (const a of L.acts || []) count[a.name] = (count[a.name] || 0) + 1;
  const mine = Object.keys(count).sort((x, y) => count[y] - count[x]);
  return [...new Set([...mine, ...ACTIVITIES.map(a => a.name)])].slice(0, n);
}

let actSheet = null;   // { date, idx, name, min, int, km, custom }
function openAct(date, idx, name) {
  const a = idx != null ? actsOn(date)[idx] : null;
  actSheet = a ? { date, idx, name: a.name, min: a.min, int: a.int || 2, km: a.km || "", custom: !actInfo(a.name) }
    : { date, idx: null, name: name || "", min: 60, int: 2, km: "", custom: name === "" };
}
function actSheetView() {
  const s = actSheet, info = actInfo(s.name), showKm = s.custom || (info && info.km);
  const kcal = s.name ? actKcal(s) : 0;
  return `<div class="overlay" data-actclose><div class="sheet">
    <div class="row between"><h2>${s.idx != null ? "Ändra aktivitet" : "Logga aktivitet"}</h2><button class="small ghost" data-actclose aria-label="Stäng">${icon("close", 18)}</button></div>
    ${s.date !== TODAY ? `<div class="muted small" style="margin-top:-6px">${dateLabel(s.date).replace(/^./, c => c.toUpperCase())}</div>` : ""}
    <div class="chips actchips">${favActs(12).map(n => `<button data-actpick="${esc(n)}" class="${!s.custom && s.name === n ? "on" : ""}">${esc(n)}</button>`).join("")}
      <button data-actpick="" class="${s.custom ? "on" : ""}">＋ Annan</button></div>
    ${s.custom ? `<label class="field" style="margin-top:10px">Vad gjorde du?<input id="actname" value="${esc(s.name)}" placeholder="t.ex. Bouldering" maxlength="30" autocomplete="off"></label>` : ""}
    <div class="row qtyrow" style="margin-top:14px"><span class="grow">Tid</span>
      <button class="step" data-actmin="-15" ${s.min <= 15 ? "disabled" : ""} aria-label="Kortare">−</button><b class="qcount">${s.min} min</b>
      <button class="step" data-actmin="15" aria-label="Längre">+</button></div>
    <div class="seg three" style="margin-top:12px" role="radiogroup" aria-label="Hur tungt">${INTENSITY.map((n, i) =>
      `<button data-actint="${i + 1}" class="${s.int === i + 1 ? "on" : ""}" role="radio" aria-checked="${s.int === i + 1}">${n}</button>`).join("")}</div>
    ${showKm ? `<label class="field" style="margin-top:12px">Sträcka i km (frivilligt)<input id="actkm" type="number" inputmode="decimal" step="0.1" min="0" value="${s.km}"></label>` : ""}
    ${s.name ? `<div class="muted small" style="margin-top:10px">Ungefär ${kcal} kcal förbrända${S.actKcal ? ", som läggs till dagens kalorimål" : ""}.${s.min >= 45 && S.actCount !== false ? " Räknas som ett pass den här veckan." : ""}</div>` : ""}
    <div class="sheet-foot row between">${s.idx != null ? `<button class="ghost" data-actdel>Ta bort</button>` : "<span></span>"}
      <button class="primary" data-actsave ${(s.name || "").trim() ? "" : "disabled"}>Spara</button></div>
  </div></div>`;
}

// Dagens aktiviteter som rader, och knappar för att logga en ny
function actsCard(date, title = "Annan träning") {
  const list = actsOn(date);
  return `<section class="card actcard"><div class="row between"><h2>${title}</h2>${list.length ? `<span class="muted small">${list.length} idag</span>` : ""}</div>
    ${list.map((a, i) => `<button class="krow" data-actedit="${i}" data-actdate="${date}"><span class="hricon" aria-hidden="true">${actIcon(a.name)}</span>
      <span class="grow"><b>${esc(a.name)}</b><span class="muted small">${actLine(a)}${actCounts(a) ? " · räknas som pass" : ""}</span></span><span class="chev" aria-hidden="true">›</span></button>`).join("")}
    <div class="chips actchips" style="margin-top:${list.length ? 10 : 2}px">${favActs(4).map(n => `<button data-actnew="${esc(n)}" data-actdate="${date}">${esc(n)}</button>`).join("")}
      <button data-actnew="" data-actdate="${date}">＋ Annan</button></div></section>`;
}

// På Hem: dagens aktiviteter som små knappar och en länk för att logga en till
function homeActs() {
  return `<div class="homeacts">${actsOn(TODAY).map((a, i) => `<button class="dchip on" data-actedit="${i}" data-actdate="${TODAY}">${icon("check", 16)}${esc(a.name)} · ${+a.min} min</button>`).join("")}
    <button class="ghost small" data-actnew="" data-actdate="${TODAY}">+ Logga annan aktivitet</button></div>`;
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
  if (ev.target.id === "actname") { actSheet.name = ev.target.value; const b = document.querySelector("[data-actsave]"); if (b) b.disabled = !ev.target.value.trim(); }
  if (ev.target.id === "actkm") actSheet.km = ev.target.value;
});
document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-actnew],[data-actedit],[data-actclose],[data-actpick],[data-actmin],[data-actint],[data-actsave],[data-actdel]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset, s = actSheet;
  if (ds.actnew !== undefined) openAct(ds.actdate || logDate(), null, ds.actnew);
  else if (ds.actedit !== undefined) openAct(ds.actdate || logDate(), +ds.actedit);
  else if (ds.actclose !== undefined) actSheet = null;
  else if (ds.actpick !== undefined) { s.custom = ds.actpick === ""; s.name = ds.actpick; }
  else if (ds.actmin) s.min = Math.max(15, s.min + +ds.actmin);
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
}, true);

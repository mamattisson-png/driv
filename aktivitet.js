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
let actQ = "";         // sökningen
let actOpenGroup = null;   // gruppen som är utfälld under Alla träningsformer

// Det man loggat senast (olika namn), med tid, intensitet och sträcka, så att det går att logga igen med ett tryck
function recentActs(n) {
  const out = [], seen = new Set();
  for (const date of Object.keys(S.log).sort().reverse()) {
    for (const a of [...(S.log[date].acts || [])].reverse()) if (!seen.has(a.name)) { seen.add(a.name); out.push({ ...a, date }); if (out.length >= n) return out; }
  }
  return out;
}
const actRow = (n, sub, attrs, end = icon("right", 16)) => `<button class="h3-row" ${attrs}><span class="h3-ic actic">${icon("aktivitet", 16)}</span><span class="grow"><b>${esc(n)}</b>${sub ? `<small>${sub}</small>` : ""}</span>${end}</button>`;

// Steg 1: välj vad. Sökträffar, eller Senast, Populärt och alla träningsformer i grupper.
function actChips(s) {
  const q = actQ.trim();
  if (q) {
    const hits = actSearch(q).slice(0, 10), own = !hits.some(n => n.toLowerCase() === q.toLowerCase());
    return `<section class="h3-list actlist">${hits.map(n => actRow(n, `ca ${actKcal({ name: n, min: 30, int: 2 })} kcal på 30 min`, `data-actpick="${esc(n)}"`)).join("")}
      ${own ? `<button class="h3-row" data-actpick="${esc(q.slice(0, 30))}" data-actown><span class="h3-ic">${icon("plus", 16)}</span><span class="grow"><b>Lägg till ”${esc(q.slice(0, 30))}”</b><small>${hits.length ? "Något annat" : "Ingen träff"} · räknas som medelhård</small></span></button>` : ""}</section>`;
  }
  const recent = s.plan ? [] : recentActs(3);
  const chip = n => `<button data-actpick="${esc(n)}">${esc(n)}</button>`;
  return `${recent.length ? `<div class="klabel actk">Senast</div><section class="h3-list actlist">${recent.map(a => actRow(a.name, esc(`${actLine(a)} · ${a.date === TODAY ? "idag" : dateLabel(a.date)}`), `data-actagain="${esc(a.name)}" data-min="${+a.min}" data-int="${a.int || 2}" data-km="${a.km || ""}"`, `<span class="accenttext small">Igen</span>`)).join("")}</section>` : ""}
    <div class="klabel actk">Populärt</div><div class="chips actchips">${POPULAR_ACTS.slice(0, 12).map(chip).join("")}</div>
    <div class="klabel actk">Alla träningsformer</div>
    <section class="h3-list actgroups">${ACT_GROUPS.map(g => {
      const list = ACTIVITIES.filter(a => a.group === g), open = actOpenGroup === g;
      return `<button class="h3-row" data-actgroup="${esc(g)}" aria-expanded="${open}"><span class="grow"><b>${esc(g)}</b><small>${esc(list.slice(0, 4).map(a => a.name).join(", "))} …</small></span>${icon(open ? "up" : "down", 16)}</button>
        ${open ? `<div class="chips actchips actgroupchips">${list.map(a => chip(a.name)).join("")}</div>` : ""}`;
    }).join("")}</section>
    <div class="muted small acthint">Hittar du inte det du gjort? Skriv det i sökrutan, så kan du lägga till det.</div>`;
}
function openAct(date, idx, name) {
  actQ = ""; actOpenGroup = null;
  const a = idx != null ? actsOn(date)[idx] : null;
  const info = name && actInfo(name);
  actSheet = a ? { date, origDate: date, idx, name: a.name, min: a.min, int: a.int || 2, km: a.km || "", custom: !actInfo(a.name) }
    : { date, idx: null, name: info ? info.name : "", min: 30, int: 2, km: "", custom: false };
  window.scrollTo(0, 0);
}
const ACT_MINS = [15, 30, 45, 60, 90];
const INT_HELP = ["Du kan prata obehindrat", "Lite andfådd, kan prata korta meningar", "Svårt att prata, nära max"];
// Logga motion som en egen sida (ersätter fönstret). Används också för pass i schemat (s.plan) och för
// att markera en aktivitet i schemat som klar (s.dayId).
function actPage() {
  const s = actSheet, info = actInfo(s.name), showKm = s.custom || (info && info.km);
  const kcal = s.name ? actKcal(s) : 0, gym = s.plan && s.gym;
  const choosing = !gym && !s.dayId && (!s.name || s.choosing);
  const title = s.plan ? (s.i != null ? `Ändra ${esc(s.name)}` : "Lägg till pass") : s.dayId ? `${esc(s.name)}${s.done ? "" : " klar"}`
    : s.idx != null ? "Ändra träning" : "Logga motion";
  const backLbl = choosing && s.name ? "Tillbaka" : s.plan ? "Träningsschema" : { idag: "Hem", pass: "Träna", historik: "Historik", kost: "Kost" }[tab] || "Tillbaka";
  const back = `<button class="backbtn" ${choosing && s.name ? 'data-actchoose="0"' : "data-actclose"}>${icon("left", 18)}${backLbl}</button>`;
  const head = `<div class="actpage">${back}<h1>${title}</h1>${s.plan ? planSheetTop(s) : ""}`;
  const ok = (s.name || "").trim() && !(s.plan && draft.mode === "fixed" && s.wd == null);
  const saveLbl = s.plan ? (s.i != null ? "Spara" : `Lägg till${s.name ? " " + esc(s.name) : ""}`) : s.dayId && !s.done ? "Klar" : "Spara";
  const foot = `<div class="actfoot">${s.idx != null || (s.dayId && s.done) ? `<button class="ghost" data-actdel>Ta bort</button>` : ""}
    <button class="primary grow" data-actsave ${ok ? "" : "disabled"}>${saveLbl}</button></div></div>`;
  if (gym) return `${head}<label class="field" style="margin-top:14px">Namn på passet<input id="actname" value="${esc(s.name)}" placeholder="t.ex. Bröst och armar" maxlength="30" autocomplete="off"></label>
    <div class="muted small" style="margin-top:8px">Övningarna lägger du till i passet under Träna.</div>${planSheetDays(s)}${foot}`;
  if (choosing) return `${head}<input id="actq" class="actq" type="search" placeholder="Sök: löpning, padel, EMS …" autocomplete="off" aria-label="Sök träningsform" value="${esc(actQ)}">
    <div id="actchips">${actChips(s)}</div></div>`;
  // Steg 2: dag, tid, intensitet och sträcka
  const yest = shift(TODAY, -1), other = s.date !== TODAY && s.date !== yest;
  const counts = s.plan || s.dayId || actCounts({ min: s.min });
  return `${head}
    <div class="actchosen"><span class="h3-ic actic">${icon("aktivitet", 18)}</span><span class="grow"><b>${esc(s.name)}</b><small>${info ? esc(info.group) : "Egen träningsform"}</small></span>${s.dayId ? "" : `<button class="linkbtn2" data-actchoose="1">Byt</button>`}</div>
    ${s.plan || s.dayId ? "" : `<div class="klabel actk">Dag</div>
    <div class="chips actdays"><button data-actday="${TODAY}" class="${s.date === TODAY ? "on" : ""}">Idag</button><button data-actday="${yest}" class="${s.date === yest ? "on" : ""}">Igår</button>
      <label class="actdatepick ${other ? "on" : ""}">${other ? esc(dateLabel(s.date)) : "Annan dag"}<input type="date" id="actdate" max="${TODAY}" value="${s.date}"></label></div>`}
    <div class="klabel actk">${s.plan ? "Mål, tid" : "Tid"}</div>
    <div class="row qtyrow"><button class="step" data-actmin="-5" ${s.min <= 5 ? "disabled" : ""} aria-label="5 minuter kortare">−</button><b class="qcount grow">${s.min} min</b>
      <button class="step" data-actmin="5" aria-label="5 minuter längre">+</button></div>
    <div class="chips actmins">${ACT_MINS.map(m => `<button data-actset="${m}" class="${s.min === m ? "on" : ""}">${m}</button>`).join("")}</div>
    <div class="klabel actk">Intensitet</div>
    <div class="seg three" role="radiogroup" aria-label="Hur tungt">${INTENSITY.map((n, i) =>
      `<button data-actint="${i + 1}" class="${s.int === i + 1 ? "on" : ""}" role="radio" aria-checked="${s.int === i + 1}">${n}</button>`).join("")}</div>
    <div class="muted small actinthelp">${INT_HELP[(s.int || 2) - 1]}</div>
    ${showKm ? `<label class="field actkmf">${s.plan ? "Mål, sträcka (km, frivilligt)" : "Sträcka (km, frivilligt)"}<input id="actkm" type="number" inputmode="decimal" step="0.1" min="0" value="${s.km}" placeholder="–"></label>` : ""}
    ${s.plan ? planSheetDays(s) : ""}
    <div class="actsum"><b>ca ${kcal} kcal</b><span>${s.plan ? "räknas som pass när det är klart" : counts ? "räknas som pass i veckan" : "räknas som pass från 45 min"}${S.actKcal && !s.plan ? " · läggs till kalorimålet" : ""}</span></div>
    ${foot}`;
}
// Fönstret finns kvar som namn för äldre anrop
const actSheetView = actPage;

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
  if (ev.target.id === "actdate" && ev.target.value && ev.target.value <= TODAY) { actSheet.date = ev.target.value; render(); }
});
document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-actnew],[data-actedit],[data-actclose],[data-actpick],[data-actagain],[data-actgroup],[data-actday],[data-actmin],[data-actset],[data-actchoose],[data-actint],[data-actsave],[data-actdel]");
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
    actQ = ""; s.choosing = false; window.scrollTo(0, 0);
  }
  else if (ds.actchoose !== undefined) { s.choosing = ds.actchoose === "1"; actQ = ""; window.scrollTo(0, 0); }
  else if (ds.actagain) { Object.assign(s, { name: ds.actagain, custom: !actInfo(ds.actagain), min: +ds.min || 30, int: +ds.int || 2, km: ds.km || "", choosing: false }); actQ = ""; window.scrollTo(0, 0); }
  else if (ds.actgroup) { actOpenGroup = actOpenGroup === ds.actgroup ? null : ds.actgroup; ev.stopImmediatePropagation(); render(); return; }
  else if (ds.actday) s.date = ds.actday;
  else if (ds.actset) s.min = +ds.actset;
  else if (ds.actmin) s.min = Math.max(5, s.min + +ds.actmin);
  else if (ds.actint) s.int = +ds.actint;
  else if (ds.actsave !== undefined) {
    const a = { name: s.name.trim().slice(0, 30), min: s.min, int: s.int };
    if (+s.km > 0) a.km = Math.round(+s.km * 10) / 10;
    const L = day(s.date), list = L.acts || (L.acts = []);
    // Ändrad dag: flyttas från den gamla dagen
    if (s.idx != null && s.origDate && s.origDate !== s.date) { const O = day(s.origDate); O.acts.splice(s.idx, 1); if (!O.acts.length) delete O.acts; s.idx = null; }
    if (s.idx != null) list[s.idx] = a; else list.push(a);
    shareAct(a, s.date, true);
    toast(`${a.name} sparad${s.date === TODAY ? "" : ` · ${dateLabel(s.date)}`}`);
    actSheet = null; window.scrollTo(0, 0);
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

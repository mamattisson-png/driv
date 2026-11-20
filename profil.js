"use strict";
// ---------- Profiler ----------
// En profilsida för en själv och för varje vän: profilbild, pass den här månaden, veckor i rad, pass totalt,
// vanligaste passet och de senaste passen. Profilbilden är ett foto av en själv som beskärs till en fyrkant
// och förminskas i telefonen innan det sparas i kontot (supabase/profiler.sql). Bara en själv och vännerna ser den.
// Vänner ser aldrig vikter, mat eller kroppsvikt. Utan profiler.sql i Supabase visas bokstaven som förut.
// Laddas efter social.js, före app.js.

let profView = null;         // null, "me" eller en väns id
let profStats = {};          // id → statistik från Supabase, eller "fel"
let profBusy = false, profMsg = "";

// Profilbilden för ett namn eller ett id: ens egen, eller en väns
function photoOf(key) {
  if (typeof social === "undefined") return null;
  const p = social.profile;
  if (p && p.photo && (key === "me" || key === p.name)) return p.photo;
  const f = social.friends.find(x => String(x.id) === String(key) || x.name === key);
  return (f && f.photo) || null;
}
// Bokstaven på en färg, eller fotot när det finns
function avatarHtml(name, cls = "", photo = photoOf(name)) {
  if (photo) return `<span class="av ${cls} avphoto" aria-hidden="true"><img src="${esc(photo)}" alt=""></span>`;
  return `<span class="av ${cls}" style="--h:${nameHue(name)}" aria-hidden="true">${esc(String(name).slice(0, 1).toUpperCase())}</span>`;
}

// Beskär mitten till en fyrkant och förminskar till 256 punkter, JPEG under 60 kB
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const s = Math.min(img.naturalWidth, img.naturalHeight), c = document.createElement("canvas");
      c.width = c.height = 256;
      c.getContext("2d").drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, 256, 256);
      URL.revokeObjectURL(url);
      let q = 0.85, out = c.toDataURL("image/jpeg", q);
      while (out.length > 58000 && q > 0.4) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
      out.length <= 60000 ? resolve(out) : reject(new Error("för stor"));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("ingen bild")); };
    img.src = url;
  });
}

// Egen statistik räknas på allt i telefonen (mer än det som delas); en väns hämtas från Supabase
function myStats() {
  const month = TODAY.slice(0, 7), names = {};
  let monthN = 0, total = 0;
  const recent = [];
  for (const date of Object.keys(S.log).sort().reverse()) {
    const items = [...workoutsOn(date).filter(w => w.done).map(w => w.act ? w.act.name : (dayById(w.dayId) || {}).name || "Pass"), ...actsOn(date).filter(actCounts).map(a => a.name)];
    for (const n of items) { total++; if (date.startsWith(month)) monthN++; names[n] = (names[n] || 0) + 1; if (recent.length < 5) recent.push({ day: date, pass: n }); }
  }
  const top = Object.keys(names).sort((a, b) => names[b] - names[a])[0] || "";
  return { month: monthN, total, weeks: typeof weekStreak === "function" ? weekStreak() : 0, top, recent, goalWeeks: true };
}
async function loadFriendStats(id) {
  try { profStats[id] = await socialRpc("driv_profile_stats", { p_user: id }) || "fel"; }
  catch (e) { profStats[id] = "fel"; }
  render();
}

// Pass per vecka de senaste 12 veckorna: för en själv ur den egna loggen, för en vän från Supabase
function profWeeks(me, st) {
  const ws = weekStart(TODAY);
  const weeks = me ? Array.from({ length: 12 }, (_, i) => { const w = shift(ws, -7 * (11 - i)); return { week: w, n: weekSummary(w).passes }; })
    : st && Array.isArray(st.weeks12) ? st.weeks12 : null;
  if (!weeks || !weeks.some(w => +w.n) || typeof barChart !== "function") return "";
  const chart = barChart({ vals: weeks.map((w, i) => ({ v: +w.n, label: i === 0 || i === weeks.length - 1 ? `v.${weekNo(w.week)}` : "",
    tip: `Vecka ${weekNo(w.week)}: ${w.n} pass`, cls: i === weeks.length - 1 ? "pb" : "" })), aria: "Pass per vecka, 12 veckor", fmt: v => String(Math.round(v)) });
  return `<div class="klabel pfk">Pass per vecka</div><section class="card pfweeks">${chart}</section>`;
}
function profileView() {
  const me = profView === "me", f = me ? null : social.friends.find(x => String(x.id) === String(profView));
  if (!me && !f) { profView = null; return friendsView(); }
  const name = me ? (social.profile ? social.profile.name : profName()) : f.name;
  let st = me ? myStats() : profStats[f.id];
  if (!me && st === undefined) { profStats[f.id] = null; loadFriendStats(f.id); }
  // Utan profiler.sql: det som går att räkna ut ur flödet (två veckor) och veckans pass
  const fallback = !me && (!st || st === "fel");
  if (fallback) {
    const mine = social.feed.filter(a => a.uid ? String(a.uid) === String(f.id) : a.name === f.name);
    st = { month: null, total: null, weeks: null, top: "", recent: mine.slice(0, 5) };
  }
  const tile = (lbl, val) => `<div class="pftile"><span class="muted small">${lbl}</span><b>${val ?? "–"}</b></div>`;
  const monthName = cap(new Date().toLocaleDateString("sv-SE", { month: "long" }));
  const week = me ? weekSummary(weekStart(TODAY)).passes : friendWeek(f);
  const since = me ? social.profile && social.profile.since : st && st.since;
  const sinceTxt = since ? `Tränar med Driv sedan ${new Date(since).toLocaleDateString("sv-SE", { month: "long", year: since.slice(0, 4) === TODAY.slice(0, 4) ? undefined : "numeric" })}` : "";
  const recent = (st.recent || []).map(a => `<div class="pfrow"><b class="grow">${esc(a.pass)}</b><span class="muted small">${feedWhen(a.day)}</span>
      ${!me && a.id != null ? (a.kudoed ? `<span class="peppat">Peppat</span>` : `<button class="peppa small" data-kudos="${a.id}" data-pfkudos="${f.id}" aria-label="Peppa ${esc(name)}">Peppa</button>`) : ""}</div>`).join("");
  const photo = me ? photoOf("me") : f.photo;
  return `<div class="pfpage"><button class="backbtn" data-profile="">${icon("left", 18)}Vänner</button>
    <div class="pfhead">${me ? `<button class="pfavbtn" data-pfphoto aria-label="Byt profilbild">${avatarHtml(name, "pfav", photo)}<span class="pfedit">${icon("edit", 14)}</span></button>` : avatarHtml(name, "pfav", photo)}
      <h1>${esc(name)}</h1>${sinceTxt ? `<div class="muted small">${sinceTxt}</div>` : ""}
      <span class="pfpill">${week ? `Tränat ${week} ${week === 1 ? "gång" : "gånger"} den här veckan` : "Inget pass än den här veckan"}</span></div>
    ${me ? `<input type="file" id="pfphotoinput" accept="image/*" hidden>
      <div class="row pfphotobtns"><button class="small" data-pfphoto>${icon("plus", 14)}${photo ? "Byt bild" : "Lägg till bild av dig"}</button>${photo ? `<button class="small ghost" data-pfphotodel>Ta bort bild</button>` : ""}</div>
      ${profMsg ? `<div class="muted small pfmsg" role="status">${esc(profMsg)}</div>` : ""}` : ""}
    <div class="pfgrid">${tile(`Pass i ${monthName.toLowerCase()}`, st.month)}${tile(me ? "Veckor i rad med målet" : "Veckor i rad med pass", st.weeks)}
      ${tile("Pass totalt", st.total)}${tile("Vanligaste passet", st.top ? esc(st.top) : "–")}</div>
    ${fallback ? `<div class="muted small pfnote">Mer statistik visas när profilerna är på i kontot.</div>` : ""}
    ${profWeeks(me, st)}
    <div class="klabel pfk">Senaste passen</div>
    ${recent ? `<section class="card pflist">${recent}</section>` : `<div class="muted small">Inga pass än.</div>`}
    ${me ? `<div class="muted small pfnote">Vänner ser bilden, statistiken och vilka pass du gjort, aldrig vikter, mat eller kroppsvikt. Styrs av "Visa mina pass för vänner".</div>`
      : `<button class="wide pfrm" data-fsheet="${esc(String(f.id))}">Mer om ${esc(name)}</button>`}</div>${friendsSheetView()}`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-profile],[data-pfphoto],[data-pfphotodel]");
  if (!t) return;
  ev.stopImmediatePropagation();
  const ds = t.dataset;
  if (ds.profile !== undefined) {
    profView = ds.profile || null; profMsg = ""; friendsSheet = null;
    if (profView && tab !== "vanner") { if (typeof vannerBack !== "undefined") vannerBack = tab; tab = "vanner"; }
    if (profView && profView !== "me") delete profStats[profView];   // färsk statistik varje gång
    window.scrollTo(0, 0);
  }
  else if (ds.pfphoto !== undefined) { const i = document.getElementById("pfphotoinput"); if (i) i.click(); return; }
  else if (ds.pfphotodel !== undefined) savePhoto(null);
  render();
}, true);
// Peppa från en väns profil: statistiken hämtas om så att Peppat syns
document.addEventListener("click", ev => {
  const b = ev.target.closest && ev.target.closest("[data-pfkudos]");
  if (b) setTimeout(() => loadFriendStats(b.dataset.pfkudos), 400);
});
document.addEventListener("change", async ev => {
  if (ev.target.id !== "pfphotoinput" || !ev.target.files || !ev.target.files[0]) return;
  try { savePhoto(await shrinkPhoto(ev.target.files[0])); }
  catch (e) { profMsg = "Bilden gick inte att läsa. Prova en annan."; render(); }
});
async function savePhoto(photo) {
  if (profBusy) return;
  profBusy = true; profMsg = photo ? "Sparar bilden …" : ""; render();
  try {
    await socialRpc("driv_photo_save", { p_photo: photo });
    social.profile.photo = photo; profMsg = photo ? "Bilden är sparad. Dina vänner ser den." : "Bilden är borttagen.";
  } catch (e) { profMsg = "Bilden kunde inte sparas. Profilbilder behöver slås på i kontot först."; }
  profBusy = false; render();
}
// Byter man flik stängs profilen
document.addEventListener("click", ev => { if (ev.target.closest && ev.target.closest("[data-tab]")) profView = null; }, true);

// Ens egen bild: fotot om det finns, annars första bokstaven (cls "avatar" i Inställningar)
function myAvatar(name, cls = "avatar") {
  const photo = photoOf("me");
  return photo ? `<span class="${cls} avphoto" aria-hidden="true"><img src="${esc(photo)}" alt=""></span>`
    : `<span class="${cls}" aria-hidden="true">${esc(String(name).slice(0, 1).toUpperCase())}</span>`;
}
// ---------- Din profil ----------
// En sida för en själv: bild, namn, statistik, senaste passen och kontot. Namn och bild ändras i bladet
// Redigera profil (den enda skrivrutan), export och import i bladet Din data. Utan konto: logga in med en knapp.
let pfSheet = null;     // "edit" eller "data"
let meBack = "profil";  // fliken man kom ifrån
function myProfilePage() {
  if (account.step !== "in" && welcomeLogin && sbEnabled) return loginView();   // Logga in eller skapa konto
  const name = profName(), st = myStats(), p = social.profile;
  const since = p && p.since ? new Date(p.since).toLocaleDateString("sv-SE", { month: "long", year: p.since.slice(0, 4) === TODAY.slice(0, 4) ? undefined : "numeric" }) : "";
  const back = { idag: "Hem", pass: "Träna", dailys: "Dailys", kost: "Kost", historik: "Historik", profil: "Inställningar", vanner: "Vänner" }[meBack] || "Tillbaka";
  const prog = typeof progressData === "function" ? progressData() : { pbs: 0, ex: [] };
  // Den här veckan: tränade dagar fyllda, idag med orange kant
  const ws = weekStart(TODAY), wsum = weekSummary(ws).passes;
  const trained = d => workoutsOn(d).some(w => w.done) || actsOn(d).some(actCounts);
  const week = weekDates(ws).map(d => `<span class="mewd ${d === TODAY ? "today" : ""}"><small>${WD[weekdayOf(d)][0]}</small><i class="${trained(d) ? "on" : ""}"></i></span>`).join("");
  // Pass per vecka, tolv veckor; den här veckan i orange
  const weeks = Array.from({ length: 12 }, (_, i) => weekSummary(shift(ws, (i - 11) * 7)).passes), max = Math.max(1, S.plan.count, ...weeks);
  const bars = weeks.map((n, i) => `<rect x="${i * 25 + 4}" y="${(60 - Math.max(n ? 4 : 2, n / max * 60)).toFixed(1)}" width="17" height="${Math.max(n ? 4 : 2, n / max * 60).toFixed(1)}" rx="2" class="${i === 11 ? "now" : ""}"/>`).join("");
  // Rekord: de övningar med störst framsteg
  const recs = prog.ex.filter(e => e.unit === "kg" && +e.best.kg > 0).sort((a, b) => b.gain - a.gain || b.best.kg - a.best.kg).slice(0, 3);
  return `<div class="mepage2"><div class="mebar"><button class="backbtn" data-tab="${meBack}">${icon("left", 18)}${back}</button></div>
    <div class="me2">${p ? `<button class="me2pic" data-pfphoto aria-label="Byt bild">${myAvatar(name, "av me2av")}</button>` : myAvatar(name, "av me2av")}<span class="grow"><b>${esc(name)}</b>
      <small>${p ? (since ? `Medlem sedan ${since}` : "Medlem") : sbEnabled ? "Utan konto · sparas i telefonen" : "Sparas i telefonen"}</small></span></div>
    <section class="mesec menums"><div><b>${st.total}</b><span>Pass</span></div><div><b>${st.weeks}</b><span>Veckor i rad</span></div><div><b>${prog.pbs}</b><span>Rekord</span></div></section>
    <section class="mesec"><div class="meh"><b>Den här veckan</b><span>${wsum} av ${S.plan.count} pass</span></div><div class="meweek">${week}</div></section>
    <section class="mesec"><div class="meh"><b>Pass per vecka</b><span>12 veckor</span></div>
      <svg class="mebars" viewBox="0 0 300 60" preserveAspectRatio="none" aria-label="Pass per vecka de senaste tolv veckorna">${bars}</svg></section>
    ${recs.length ? `<section class="mesec"><div class="meh"><b>Rekord</b><button class="linkbtn2 small" data-tab="historik" data-mehist>Alla</button></div>
      <div class="merecs">${recs.map(e => `<div><span>${esc(EX[e.id] ? EX[e.id].name : e.id)}</span><span><b>${fmtNum(+e.best.kg)} kg</b>${e.gain > 0 ? `<em>+${fmtNum(e.gain)}</em>` : ""}</span></div>`).join("")}</div></section>` : ""}
    ${meSettings(name)}</div>`;
}
let pfNameEdit = false;   // namnraden är en skrivruta
// Profil, data och konto längst ned på samma sida
function meSettings(name) {
  const p = social.profile, inAcct = account.step === "in", photo = photoOf("me");
  const row = (title, end, attrs, cls = "") => `<button class="merow ${cls}" ${attrs}><span class="grow">${title}</span>${end ? `<span class="muted">${end}</span>` : ""}${cls.includes("red") || cls.includes("plain") ? "" : icon("right", 16)}</button>`;
  const nameRow = pfNameEdit
    ? `<div class="merow meedit"><input id="pname" maxlength="40" autocomplete="given-name" value="${esc(name === "Du" ? "" : name)}" placeholder="Ditt namn" aria-label="Namn">
        <button class="small ghost" data-pfname="0">Avbryt</button><button class="small primary" data-pnamesave ${social.busy ? "disabled" : ""}>Spara</button></div>`
    : row("Namn", esc(name), 'data-pfname="1"');
  return `${profMsg ? `<div class="muted small pfmsg" role="status">${esc(profMsg)}</div>` : ""}
    <div class="melbl">Profil</div><div class="megrp">
      ${p ? row(photo ? "Byt bild" : "Lägg till bild", "", "data-pfphoto") : ""}
      ${p && photo ? row("Ta bort bild", "", "data-pfphotodel", "plain") : ""}
      ${nameRow}
      ${p ? row("Delning med vänner", p.sharing ? "På" : "Av", 'data-tab="vanner" data-fsheet-open="dela"') : ""}</div>
    ${p ? `<input type="file" id="pfphotoinput" accept="image/*" hidden>` : ""}
    <div class="melbl">Data</div><div class="megrp">
      ${row("Exportera", "", "data-export")}${row("Importera", "", "data-import")}
      ${row(confirmReset ? "Tryck igen för att radera allt" : "Nollställ allt", "", "data-reset", "red")}</div>
    ${importMsg ? `<div class="muted small pfmsg">${esc(importMsg)}</div>` : ""}
    <input type="file" id="importfile" accept="application/json" class="hidden">
    ${sbEnabled ? `<div class="melbl">Konto</div><div class="megrp">${inAcct ? `${row(esc(account.email), "Inloggad", "disabled", "plain")}${row("Logga ut", "", "data-signout", "plain")}${row(account.confirmDelete ? "Tryck igen för att radera kontot" : "Radera konto", "", "data-delacct", "red")}`
      : row("Logga in eller skapa konto", "", "data-melogin")}</div>
      ${account.confirmDelete ? `<div class="muted small pfmsg">Kontot, molnkopian, vänner och delade pass raderas. En lokal säkerhetskopia ligger kvar på den här enheten.</div>` : ""}` : ""}
    ${typeof installHelp === "function" ? installHelp() : ""}`;
}
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-pfsheet],[data-pfname],[data-melogin],[data-tab='minprofil'],[data-fsheet-open]");
  if (!t) return;
  const ds = t.dataset;
  if (ds.tab === "minprofil") { if (tab !== "minprofil") meBack = tab; pfSheet = null; pfNameEdit = false; profMsg = ""; return; }   // själva bytet sköts av app.js
  if (ds.fsheetOpen) { setTimeout(() => { friendsSheet = ds.fsheetOpen; render(); }, 0); return; }   // Vänner öppnas med rätt blad
  if (t.classList.contains("overlay") && ev.target !== t) return;
  ev.stopImmediatePropagation();
  if (ds.melogin !== undefined) { welcomeLogin = "login"; account.msg = ""; pfSheet = null; }
  else if (ds.pfname !== undefined) { pfNameEdit = ds.pfname === "1"; render(); if (pfNameEdit) { const f = document.getElementById("pname"); if (f) { f.focus(); f.select(); } } return; }
  else { pfSheet = ds.pfsheet || null; profMsg = ""; confirmReset = false; }
  render();
}, true);
// Alla rekord: Historik, Utveckling
document.addEventListener("click", ev => { if (ev.target.closest && ev.target.closest("[data-mehist]")) histView = "utveckling"; }, true);
// Sparat namn: tillbaka till bladet
document.addEventListener("click", ev => { if (ev.target.closest && ev.target.closest("[data-pnamesave]") && tab === "minprofil") setTimeout(() => { pfNameEdit = false; render(); }, 300); });

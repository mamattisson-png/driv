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
  const name = profName(), st = myStats(), inAcct = account.step === "in" && social.profile, p = social.profile;
  const since = p && p.since ? new Date(p.since).toLocaleDateString("sv-SE", { month: "long", year: p.since.slice(0, 4) === TODAY.slice(0, 4) ? undefined : "numeric" }) : "";
  const back = { idag: "Hem", pass: "Träna", dailys: "Dailys", kost: "Kost", historik: "Historik", profil: "Inställningar", vanner: "Vänner" }[meBack] || "Tillbaka";
  const row = (ic, title, end, attrs, cls = "") => `<button class="h3-row pfrow2 ${cls}" ${attrs}><span class="h3-ic">${icon(ic, 18)}</span><span class="grow"><b>${title}</b></span>${end}</button>`;
  const recent = st.recent.slice(0, 3).map(a => `<div class="pfrow"><b class="grow">${esc(a.pass)}</b><span class="muted small">${feedWhen(a.day)}</span></div>`).join("");
  return `<div class="mepage"><button class="backbtn" data-tab="${meBack}">${icon("left", 18)}${back}</button>
    <div class="mehead"><button class="mepic" data-pfsheet="edit" aria-label="Redigera profil">${myAvatar(name, "av mepicav")}<span class="mecam">${icon("camera", 16)}</span></button>
      <h1>${esc(name)}</h1>
      <div class="muted small">${inAcct ? [since ? `Tränar med Driv sedan ${since}` : "", p.code ? `Vänkod ${esc(p.code)}` : ""].filter(Boolean).join(" · ") : sbEnabled ? "Utan konto · allt sparas i den här telefonen" : "Sparas i den här telefonen"}</div></div>
    <div class="mestats"><div><b>${st.total}</b><span>Pass totalt</span></div><div><b>${st.weeks}${st.weeks > 1 ? "🔥" : ""}</b><span>Veckor i rad</span></div>
      ${inAcct ? `<div><b>${social.friends.length}</b><span>Vänner</span></div>` : `<div><b>${st.month}</b><span>Den här månaden</span></div>`}</div>
    <div class="mebtns"><button data-pfsheet="edit">${icon("edit", 16)}Redigera profil</button>
      ${inAcct ? `<button class="primary" data-tab="vanner" data-fsheet-open="bjud">${icon("plus", 16)}Bjud in vän</button>`
        : sbEnabled ? `<button class="primary" data-melogin>Logga in eller skapa konto</button>` : ""}</div>
    ${recent ? `<div class="klabel mek">Senaste passen</div><section class="card pflist">${recent}</section>` : ""}
    <div class="klabel mek">${inAcct || account.step === "in" ? "Konto" : "Data"}</div>
    <section class="h3-list">
      ${account.step === "in" ? row("mail", esc(account.email), `<span class="muted small">Inloggad</span>`, "disabled") : ""}
      ${row("data", "Din data", `<span class="muted small">Exportera, importera</span>${icon("right", 16)}`, 'data-pfsheet="data"')}
      ${inAcct ? row("vanner", "Delning med vänner", `<span class="muted small">${p.sharing ? "På" : "Av"}</span>${icon("right", 16)}`, 'data-tab="vanner" data-fsheet-open="dela"') : ""}
    </section>
    ${account.step === "in" ? `<section class="h3-list mequiet">${row("logout", "Logga ut", "", "data-signout")}
      ${row("close", account.confirmDelete ? "Tryck igen för att radera kontot" : "Radera konto", "", "data-delacct", "dangertext")}</section>
      ${account.confirmDelete ? `<div class="muted small menote">Kontot, molnkopian, vänner och delade pass raderas. En lokal säkerhetskopia ligger kvar på den här enheten.</div>` : ""}` : ""}
    ${pfSheetView(name)}</div>`;
}
function pfSheetView(name) {
  if (!pfSheet) return "";
  const close = `<button class="small ghost iconbtn" data-pfsheet="" aria-label="Stäng">${icon("close", 18)}</button>`;
  const wrap = (label, inner) => `<div class="overlay" data-pfsheet=""><div class="sheet mesheet" role="dialog" aria-label="${label}"><div class="row between"><h2 class="sheeth">${label}</h2>${close}</div>${inner}</div></div>`;
  if (pfSheet === "data") {
    const txt = { cloud: "Sparas på ditt konto och följer med till alla dina enheter.", error: "Kunde inte spara till kontot just nu. Allt finns kvar i telefonen.", local: "Sparas i den här telefonen. Exportera för en säkerhetskopia." }[cloud.status];
    return wrap("Din data", `<div class="muted small">${txt}</div>
      <section class="h3-list mesheetlist"><button class="h3-row" data-export><span class="h3-ic">${icon("data", 18)}</span><span class="grow"><b>Exportera</b><small>Spara en fil med allt du loggat</small></span></button>
        <button class="h3-row" data-import><span class="h3-ic">${icon("plus", 18)}</span><span class="grow"><b>Importera</b><small>Läs in en tidigare exporterad fil</small></span></button>
        <button class="h3-row" data-reset><span class="h3-ic">${icon("close", 18)}</span><span class="grow"><b class="dangertext">${confirmReset ? "Tryck igen för att radera allt" : "Nollställ allt"}</b><small>Börja om från början i den här telefonen</small></span></button></section>
      ${importMsg ? `<div class="muted small">${esc(importMsg)}</div>` : ""}
      <input type="file" id="importfile" accept="application/json" class="hidden">${typeof installHelp === "function" ? installHelp() : ""}`);
  }
  const photo = photoOf("me"), canPhoto = !!social.profile;
  return wrap("Redigera profil", `<div class="mesheetpic">${myAvatar(name, "av mepicav")}</div>
    ${canPhoto ? `<input type="file" id="pfphotoinput" accept="image/*" hidden>
      <section class="h3-list mesheetlist"><button class="h3-row" data-pfphoto><span class="h3-ic">${icon("camera", 18)}</span><span class="grow"><b>${photo ? "Byt bild" : "Lägg till en bild av dig"}</b><small>Ta en bild eller välj från bilderna</small></span></button>
        ${photo ? `<button class="h3-row" data-pfphotodel><span class="h3-ic">${icon("close", 18)}</span><span class="grow"><b class="dangertext">Ta bort bild</b></span></button>` : ""}</section>
      ${profMsg ? `<div class="muted small pfmsg" role="status">${esc(profMsg)}</div>` : ""}`
      : `<div class="muted small pfmsg">${sbEnabled ? "Med ett konto kan du lägga till en bild av dig." : ""}</div>`}
    <label class="klabel mek" for="pname">Namn</label>
    <input id="pname" class="mename" maxlength="40" autocomplete="given-name" value="${esc(name === "Du" ? "" : name)}" placeholder="Ditt namn">
    <button class="primary wide mesave" data-pnamesave ${social.busy ? "disabled" : ""}>Spara</button>`);
}
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-pfsheet],[data-melogin],[data-tab='minprofil'],[data-fsheet-open]");
  if (!t) return;
  const ds = t.dataset;
  if (ds.tab === "minprofil") { if (tab !== "minprofil") meBack = tab; pfSheet = null; profMsg = ""; return; }   // själva bytet sköts av app.js
  if (ds.fsheetOpen) { setTimeout(() => { friendsSheet = ds.fsheetOpen; render(); }, 0); return; }   // Vänner öppnas med rätt blad
  if (t.classList.contains("overlay") && ev.target !== t) return;
  ev.stopImmediatePropagation();
  if (ds.melogin !== undefined) { welcomeLogin = "login"; account.msg = ""; }
  else { pfSheet = ds.pfsheet || null; profMsg = ""; confirmReset = false; }
  render();
}, true);
// Sparat namn: bladet stängs
document.addEventListener("click", ev => { if (ev.target.closest && ev.target.closest("[data-pnamesave]") && tab === "minprofil") setTimeout(() => { pfSheet = null; render(); }, 300); });

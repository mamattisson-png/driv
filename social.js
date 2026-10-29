"use strict";
// ---------- Vänner ----------
// Man lägger till varandra med en personlig kod (eller en länk med koden). När ett pass sparas
// syns det för vännerna: vilket pass och hur många övningar, aldrig vikter, mat eller kroppsvikt.
// Vänner kan peppa varandras pass. Allt går via funktioner i Supabase (supabase/vanner.sql).
// Laddas före app.js; anropas först när appen ritas.

const social = {
  profile: null, friends: [], feed: [], loaded: false, busy: false, msg: "",
  // ?v=KOD i adressen: en vän har delat sin kod
  pendingCode: (new URLSearchParams(location.search).get("v") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6),
};
const SHARE_BASE = "https://driv.driveify.se/";

async function socialRpc(name, args) {
  const sb = await supabaseClient();
  const { data, error } = await sb.rpc(name, args);
  if (error) throw error;
  return data;
}
async function loadSocial() {
  if (!sbEnabled || account.step !== "in") return;
  const epoch = account.epoch || 0, uid = account.localUid;
  const active = () => account.step === "in" && epoch === (account.epoch || 0) && uid === account.localUid;
  try {
    const profile = await socialRpc("driv_profile_get");
    if (!active()) return;
    const [friends, feed] = profile ? await Promise.all([socialRpc("driv_friends"), socialRpc("driv_feed")]) : [[], []];
    if (!active()) return;
    Object.assign(social, { profile, friends, feed, loaded: true, error: false });
  } catch (e) { if (!active()) return; social.loaded = true; social.error = true; }
  render();
}

// Anropas när ett pass sparas eller öppnas igen
function shareWorkout(d, date, done) {
  if (!social.profile || !social.profile.sharing) return;
  const w = workoutOn(date, d.id), n = w ? Object.values(w.sets).filter(sets => sets.some(hasData)).length : 0;
  socialRpc("driv_log_activity", { p_day: date, p_pass: d.name, p_exercises: n, p_done: done })
    .then(() => socialRpc("driv_feed")).then(f => { social.feed = f; render(); }).catch(() => {});
}

const feedWhen = day => day === TODAY ? "idag" : day === shift(TODAY, -1) ? "igår" : `${WD[weekdayOf(day)].toLowerCase()} ${+day.slice(8)}/${+day.slice(5, 7)}`;
function feedRow(a) {
  const what = `${esc(a.pass)}${a.exercises ? ` · ${a.exercises} övningar` : ""}`;
  return `<div class="feed-row"><div class="grow"><b>${a.mine ? "Du" : esc(a.name)}</b> körde ${what}<div class="muted small">${feedWhen(a.day)}</div></div>
    ${a.mine ? (a.kudos ? `<span class="kudos-count">${icon("pepp", 16)} ${a.kudos}</span>` : "")
      : `<button class="kudos ${a.kudoed ? "on" : ""}" data-kudos="${a.id}" aria-pressed="${a.kudoed}" aria-label="Peppa ${esc(a.name)}">${icon("pepp", 18)}${a.kudos ? ` ${a.kudos}` : ""}</button>`}</div>`;
}

// Profilbild: första bokstaven på en färg som räknas fram ur namnet, så att den är stabil
function nameHue(name) { let h = 0; for (const c of String(name)) h = (h * 31 + c.codePointAt(0)) % 360; return h; }
const avatar = (name, cls = "") => `<span class="av ${cls}" style="--h:${nameHue(name)}" aria-hidden="true">${esc(String(name).slice(0, 1).toUpperCase())}</span>`;
function avatars(names, max = 3) {
  if (!names.length) return "";
  return `<span class="avs" aria-hidden="true">${names.slice(0, max).map(n => avatar(n, "sm")).join("")}${names.length > max ? `<span class="av sm more">+${names.length - max}</span>` : ""}</span>`;
}
// "för 2 tim sedan" för pass idag, annars dagen
function feedAgo(a) {
  if (a.day === TODAY && a.created) {
    const min = Math.round((Date.now() - new Date(a.created).getTime()) / 60000);
    if (min >= 0 && min < 60) return min < 2 ? "nyss" : `för ${min} min sedan`;
    if (min >= 60 && min < 24 * 60) return `för ${Math.round(min / 60)} tim sedan`;
  }
  return feedWhen(a.day);
}
// En väns pass med Peppa, eller "Peppat" när man redan peppat
function feedEvent(a) {
  return `<div class="fevent">${avatar(a.name)}<div class="grow"><span><b>${esc(a.name)}</b> körde ${esc(a.pass)}</span><span class="muted small">${feedAgo(a)}</span></div>
    ${a.kudoed ? `<span class="peppat">Peppat</span>` : `<button class="peppa" data-kudos="${a.id}" aria-pressed="false" aria-label="Peppa ${esc(a.name)}">Peppa</button>`}</div>`;
}
// Peppningar på ens eget pass. Vem som peppat delas inte, bara hur många.
function myKudosEvent(a) {
  return `<div class="fevent">${avatar(social.profile ? social.profile.name : "Du")}<div class="grow"><span><b>${a.kudos} ${a.kudos === 1 ? "vän" : "vänner"}</b> peppade ditt ${esc(a.pass)}-pass</span>
    <span class="muted small">${feedWhen(a.day)}</span></div><span class="peppat">${icon("pepp", 16)}</span></div>`;
}

// På Hem: en vänkod från en länk
function friendsNudge() {
  if (!sbEnabled || !social.pendingCode || (social.profile && social.profile.code === social.pendingCode)) return "";
  return `<div class="card nudge"><h2>Vänförfrågan</h2>
    <div class="muted">Någon har delat sin vänkod <b>${esc(social.pendingCode)}</b> med dig. Som vänner ser ni varandras pass och kan peppa varandra.</div>
    <div class="row wrap" style="margin-top:10px"><button class="primary small" data-gofriends>Lägg till vän</button><button class="ghost small" data-dropcode>Inte nu</button></div></div>`;
}
// På Hem: vännernas senaste pass med Peppa. Utan vänner en rad som leder till inbjudan.
function friendsHome() {
  if (sbEnabled && !account.ready && localOwner()) return `<section class="friendsrow" aria-label="Vänner" aria-busy="true"><div class="row between fsec-h"><h2>Vänner</h2></div>
    <div class="card friendsbox"><div class="fevent muted small" role="status">Hämtar vänner …</div></div></section>`;
  if (!sbEnabled || account.step !== "in" || !social.loaded || social.error) return "";
  if (!social.friends.length) return `<button class="card homerow friendsinvite" data-gofriends><span class="hricon">${icon("vanner", 22)}</span>
    <span class="grow"><b>Vänner</b><span class="muted small">Bjud in en kompis och peppa varandra</span></span><span class="chev">${icon("right", 18)}</span></button>`;
  const others = social.feed.filter(a => !a.mine);
  const mine = social.feed.find(a => a.mine && a.kudos > 0);
  const events = others.slice(0, 3).map(feedEvent);
  if (events.length < 3 && mine) events.push(myKudosEvent(mine));
  return `<section class="friendsrow" aria-label="Vänner"><div class="row between fsec-h"><h2>Vänner</h2>
      <button class="linkbtn2 fbhead" data-tab="vanner">Visa alla${icon("right", 14)}</button></div>
    <div class="card friendsbox">${events.join("") || `<div class="fevent muted small">Inga pass från vänner de senaste dagarna.</div>`}</div></section>`;
}

// Vänsidan, byggd för många vänner: dagens pass (de fyra senaste, resten bakom en knapp),
// äldre dagar hopfällda, veckans topp med ens egen plats, och tre rader till resten.
let friendsDayOpen = null, friendsTodayAll = false, friendsTopAll = false;
let friendsPage = null;   // "lista" när hela vänlistan visas
let friendsSheet = null;  // "bjud", "dela" eller en väns id
let friendsSort = "namn", friendsQ = "";
const FRIENDS_TODAY = 4;
// Pass den här veckan (måndag–söndag) och senaste passet. Nyare databas skickar dem med vännerna,
// annars räknas de ur flödet.
function friendWeek(f) {
  if (f.week != null) return +f.week;
  const ws = weekStart(TODAY);
  return social.feed.filter(a => !a.mine && a.name === f.name && a.day >= ws).length;
}
function friendLast(f) {
  if (f.last) return f.last;
  const a = social.feed.find(x => !x.mine && x.name === f.name);
  return a ? a.day : null;
}
const myWeek = () => social.feed.filter(a => a.mine && a.day >= weekStart(TODAY)).length;
function friendsHead(back, title, extra = "") {
  return `<header class="phead"><button class="roundbtn" ${back} aria-label="Tillbaka">${icon("left", 20)}</button><h1 class="grow">${title}</h1>${extra}</header>`;
}
function friendsView() {
  if (friendsPage === "lista" && social.profile) return friendsListPage();
  const head = friendsHead(`data-tab="${vannerBack}"`, "Vänner");
  if (!sbEnabled || account.step !== "in" || !social.profile || social.error) return head + friendsCard();
  const others = social.feed.filter(a => !a.mine), today = others.filter(a => a.day === TODAY);
  const days = [];
  for (let i = 1; i <= 7; i++) { const d = shift(TODAY, -i), list = others.filter(a => a.day === d); if (list.length) days.push([d, list]); }
  const dayName = d => d === shift(TODAY, -1) ? "Igår" : `${WD_LONG[weekdayOf(d)].replace(/^./, c => c.toUpperCase())} ${+d.slice(8)}/${+d.slice(5, 7)}`;
  const names = list => { const n = [...new Set(list.map(a => a.name))]; return n.length <= 2 ? n.join(" och ") : `${n.slice(0, 2).join(", ")} och ${n.length - 2} till`; };
  const left = today.filter(a => !a.kudoed).length, shown = friendsTodayAll ? today : today.slice(0, FRIENDS_TODAY);
  const more = today.length > FRIENDS_TODAY ? `<button class="fmore" data-ftoday>${friendsTodayAll ? "Visa färre" : `Visa alla ${today.length} pass`}${icon(friendsTodayAll ? "up" : "down", 16)}</button>` : "";
  const todaySec = !social.friends.length ? inviteMarkup(true)
    : today.length ? `<section class="fsec" aria-label="Idag"><div class="row between fsec-h"><h2 class="klabel">Idag · ${today.length} pass</h2>
        ${left ? `<button class="linkbtn2 small" data-kudosall>Peppa alla${left > 1 ? ` ${left}` : ""}</button>` : ""}</div>
        <div class="card flist">${shown.map(feedEvent).join("")}${more}</div></section>`
    : `<section class="card fempty" aria-label="Idag"><span class="hricon">${icon("trana", 22)}</span><span class="col"><b>Ingen har tränat idag än</b>
        <span class="muted small">Kör ditt pass så syns du först här.</span></span></section>`;
  return `${head}${todaySec}
    ${days.map(([d, list]) => `<section class="fsec" aria-label="${dayName(d)}"><h2 class="klabel fsec-h">${dayName(d)} · ${list.length} pass</h2>
      ${friendsDayOpen === d ? `<div class="card flist">${list.map(feedEvent).join("")}</div>`
        : `<button class="card fday" data-fday="${d}" aria-expanded="false">${avatars([...new Set(list.map(a => a.name))], 2)}<span class="grow">${esc(names(list))}</span>${icon("down", 16)}</button>`}</section>`).join("")}
    ${weekTop()}
    ${friendsLinks()}
    ${friendsSheetView()}`;
}
// Veckans topp: de tre första och ens egen plats. Hela listan fälls ut på plats.
function weekTop() {
  if (!social.friends.length) return "";
  const p = social.profile, rows = social.friends.map(f => ({ name: f.name, n: friendWeek(f) }));
  if (p.sharing) rows.push({ name: p.name, n: myWeek(), me: true });
  if (!rows.some(r => r.n)) return "";
  rows.sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, "sv"));
  rows.forEach((r, i) => { r.place = i && rows[i - 1].n === r.n ? rows[i - 1].place : i + 1; });
  const mi = rows.findIndex(r => r.me);
  const row = r => `<div class="trow ${r.me ? "me" : ""}"><span class="tplace">${r.place}</span>${avatar(r.name, "sm")}<span class="grow tname">${r.me ? "Du" : esc(r.name)}</span>
    <span class="tdots" aria-hidden="true">${Array.from({ length: 7 }, (_, k) => `<i class="${k < r.n ? "on" : ""}"></i>`).join("")}</span><b class="tnum">${r.n}</b></div>`;
  const list = friendsTopAll ? rows.map(row).join("")
    : rows.slice(0, 3).map(row).join("") + (mi > 3 ? `<div class="tgap" aria-hidden="true">···</div>` : "") + (mi >= 3 ? row(rows[mi]) : "");
  return `<section class="card ftop" aria-label="Veckans topp"><div class="row between"><h2 class="klabel">Veckans topp · pass</h2><span class="muted small">av ${rows.length}</span></div>
    <div class="tlist">${list}</div>
    ${rows.length > 3 ? `<button class="fmore" data-ftop>${friendsTopAll ? "Visa färre" : "Hela listan"}${icon(friendsTopAll ? "up" : "right", 16)}</button>` : ""}</section>`;
}
function friendsLinks() {
  const p = social.profile, n = social.friends.length;
  const r = (attr, ic, t, sub, extra = "") => `<button class="kmrow frow" ${attr}><span class="kmic">${icon(ic, 18)}</span><span class="grow col"><b>${t}</b><span class="muted small">${sub}</span></span>${extra}<span class="chev">${icon("right", 18)}</span></button>`;
  return `<section class="card kdaycard flinks">
    ${n ? r("data-flist", "vanner", "Dina vänner", `${n} ${n === 1 ? "vän" : "vänner"}`, avatars(social.friends.map(f => f.name), 3)) : ""}
    ${r(`data-fsheet="bjud"`, "share", "Bjud in eller lägg till", `Din kod ${esc(p.code)}`)}
    ${r(`data-fsheet="dela"`, "profil", "Delning och namn", `${p.sharing ? "Dina pass syns" : "Dina pass delas inte"} · ${esc(p.name)}`)}</section>`;
}
function friendsSheetView() {
  if (!friendsSheet) return "";
  const p = social.profile, wrap = (label, inner) => `<div class="overlay" data-fsheet=""><div class="sheet fsheet" role="dialog" aria-label="${label}">${inner}</div></div>`;
  const msg = social.msg ? `<div class="ferr" role="alert">${icon("info", 16)}<span>${esc(social.msg)}</span></div>` : "";
  const close = `<button class="small ghost iconbtn" data-fsheet="" aria-label="Stäng">${icon("close", 18)}</button>`;
  if (friendsSheet === "bjud") return wrap("Bjud in eller lägg till", `<div class="row between"><span class="col"><span class="klabel">Din vänkod</span><b class="vcode">${esc(p.code)}</b></span>${close}</div>
    <div class="muted small">Skicka länken till en kompis. När hen öppnar den blir ni vänner.</div>
    <button class="primary wide bigbtn" data-sharecode>${icon("share", 18)}Bjud in</button>
    <h3 class="klabel fsub">Har du en kompis kod?</h3>
    <div class="row"><input id="vcode" class="${social.msg ? "bad" : ""}" maxlength="6" placeholder="Sex tecken" autocapitalize="characters" value="${esc(social.pendingCode)}" aria-label="Väns kod">
      <button class="primary nowrap" data-addfriend ${social.busy ? "disabled" : ""}>Lägg till</button></div>${msg}`);
  if (friendsSheet === "dela") return wrap("Delning och namn", `<div class="row between"><h2 class="sheeth">Delning och namn</h2>${close}</div>
    <label class="switchrow"><span class="grow col"><span>Visa mina pass för vänner</span><span class="muted small">Bara att du tränat och vilket pass – aldrig vikter, mat eller kroppsvikt.</span></span>
      <input type="checkbox" class="switch" data-sharing ${p.sharing ? "checked" : ""}></label>
    <button class="kmrow frow" data-renameprof><span class="grow col"><span>Ditt namn</span><span class="muted small">Det vännerna ser</span></span><span class="muted">${esc(p.name)}</span><span class="chev">${icon("right", 18)}</span></button>`);
  const f = social.friends.find(x => String(x.id) === String(friendsSheet));
  if (!f) return "";
  const last = friendLast(f);
  return wrap(f.name, `<div class="row between"><span class="row">${avatar(f.name)}<span class="col"><b class="sheeth">${esc(f.name)}</b>
      <span class="muted small">${friendWeek(f)} pass den här veckan${last ? ` · senast ${feedWhen(last)}` : ""}</span></span></span>${close}</div>
    <button class="wide dangerbtn" data-unfriend="${f.id}">Ta bort ${esc(f.name)} som vän</button>
    <div class="muted small">Ni slutar se varandras pass. Ni kan bli vänner igen med koden.</div>`);
}
// Hela vänlistan: sök, sortering och bokstavsrubriker, som receptsidan
function friendsListPage() {
  const list = social.friends.map(f => ({ f, last: friendLast(f) || "", n: friendWeek(f) }));
  if (friendsSort === "senast") list.sort((a, b) => b.last.localeCompare(a.last) || a.f.name.localeCompare(b.f.name, "sv"));
  else if (friendsSort === "aktiva") list.sort((a, b) => b.n - a.n || a.f.name.localeCompare(b.f.name, "sv"));
  else list.sort((a, b) => a.f.name.localeCompare(b.f.name, "sv"));
  let letter = "";
  const letters = [];
  const rows = list.map(({ f, last, n }) => {
    const first = f.name.charAt(0).toUpperCase();
    const headr = friendsSort === "namn" && first !== letter ? (letters.push(first), `<div class="klabel rletter" id="fl-${esc(first)}" data-rgroup="${esc(first)}">${esc(letter = first)}</div>`) : "";
    return `${headr}<div class="frrow rrow" data-rq="${esc(norm(f.name))}" data-rl="${esc(first)}">${avatar(f.name)}<span class="grow col"><b>${esc(f.name)}</b>
      <span class="muted small">${friendsSort === "aktiva" ? `${n} pass den här veckan` : last ? `Senast tränat ${feedWhen(last)}` : "Inga delade pass senaste veckorna"}</span></span>
      <button class="iconbtn fmenu" data-fsheet="${esc(String(f.id))}" aria-label="Mer om ${esc(f.name)}">···</button></div>`;
  }).join("");
  const sort = (k, t) => `<button class="flink ${friendsSort === k ? "on" : ""}" data-fsort="${k}" aria-pressed="${friendsSort === k}">${t}</button>`;
  return `${friendsHead("data-flist", "Dina vänner", `<span class="muted">${list.length}</span>`)}
    ${list.length > 6 ? `<div class="finput rsearch">${icon("search", 18)}<input id="fsearch" type="search" placeholder="Sök bland ${list.length} vänner" value="${esc(friendsQ)}" autocomplete="off" aria-label="Sök vänner"></div>` : ""}
    <div class="fopts">${sort("namn", "A–Ö")}${sort("senast", "Senast tränat")}${sort("aktiva", "Mest aktiva")}</div>
    ${friendsSort === "namn" && list.length > 20 ? `<div class="fletters" role="navigation" aria-label="Hoppa till bokstav">${letters.map(l => `<button data-fjump="${esc(l)}">${esc(l)}</button>`).join("")}</div>` : ""}
    <section class="card rlist flistpage">${rows}<div class="muted rnone" hidden>Ingen vän heter så.</div></section>
    ${friendsSheetView()}`;
}
function filterFriends() {
  const q = norm(friendsQ.trim());
  let shown = 0;
  for (const el of document.querySelectorAll(".flistpage .rrow")) { el.hidden = !!q && !el.dataset.rq.includes(q); if (!el.hidden) shown++; }
  for (const h of document.querySelectorAll(".flistpage .rletter")) h.hidden = ![...document.querySelectorAll(`.flistpage .rrow[data-rl="${CSS.escape(h.dataset.rgroup)}"]`)].some(x => !x.hidden);
  const none = document.querySelector(".flistpage .rnone");
  if (none) none.hidden = shown > 0;
}
document.addEventListener("input", ev => { if (ev.target.id === "fsearch") { friendsQ = ev.target.value; filterFriends(); } });

// Inbjudan efter ett pass, för den som inte har några vänner. "Inte nu" gömmer den i två veckor.
function inviteCard() {
  if (!sbEnabled || (social.friends && social.friends.length) || (S.inviteUntil && S.inviteUntil > TODAY)) return "";
  return inviteMarkup();
}
function inviteMarkup(onPage) {
  const send = account.step === "in" && social.profile ? "data-sharecode" : "data-gofriends";
  return `<section class="card invitecard" aria-label="Bjud in en vän"><span class="avs" aria-hidden="true">${avatar(social.profile ? social.profile.name : profName())}<span class="av addav">${icon("plus", 16)}</span></span>
    <h2>Vill en kompis se när du tränar?</h2>
    <div class="muted">Ni ser när den andra kört ett pass och kan peppa varandra. Vikter, mat och kroppsvikt delas aldrig.</div>
    <button class="primary wide bigbtn" ${send}>${icon("share", 18)}Skicka inbjudan</button>
    ${onPage ? `<button class="ghost wide" data-fsheet="bjud">Jag har en kompis kod</button>` : `<button class="ghost wide" data-invitelater>Inte nu</button>`}</section>`;
}

// Under Profil
function friendsCard() {
  if (!sbEnabled) return "";
  const head = `<div class="card" id="vanner"><h2>Vänner</h2>`;
  if (account.step !== "in") return `${head}<div class="muted">Lägg till vänner, se varandras pass och peppa varandra. Kräver ett konto.</div>
    <button class="small" style="margin-top:10px" data-gokonto>Skapa konto eller logga in</button></div>`;
  if (!social.loaded) return `${head}<div class="muted">Hämtar…</div></div>`;
  if (social.error) return `${head}<div class="muted">Vänner går inte att nå just nu. Försök igen om en stund.</div></div>`;
  const msg = social.msg ? `<div class="muted small" style="margin-top:8px">${esc(social.msg)}</div>` : "";
  const privacy = `<div class="muted small" style="margin-top:10px">Vänner ser bara att du kört ett pass och vilket – aldrig vikter, mat eller kroppsvikt.</div>`;
  if (!social.profile) return `${head}<div class="muted">Välj namnet dina vänner ser.</div>
    <div class="row" style="margin-top:8px"><input id="sname" maxlength="40" placeholder="Ditt namn" autocomplete="given-name">
      <button class="primary small" data-profsave ${social.busy ? "disabled" : ""}>Spara</button></div>${msg}${privacy}</div>`;
  const p = social.profile;
  return `${head}
    <div class="row between"><div><div class="muted small">Din vänkod</div><b class="vcode">${esc(p.code)}</b></div>
      <button class="small" data-sharecode>Dela</button></div>
    <div class="row" style="margin-top:12px"><input id="vcode" maxlength="6" placeholder="Väns kod" autocapitalize="characters" value="${esc(social.pendingCode)}">
      <button class="primary small" data-addfriend ${social.busy ? "disabled" : ""}>Lägg till</button></div>${msg}
    ${social.friends.length ? `<div style="margin-top:10px">${social.friends.map(f => `<div class="hrow"><span class="grow">${esc(f.name)}</span>
      <button class="small ghost" data-unfriend="${f.id}" aria-label="Ta bort ${esc(f.name)} som vän">${icon("close", 18)}</button></div>`).join("")}</div>`
      : `<div class="muted small" style="margin-top:8px">Inga vänner än. Dela din kod, eller skriv in en väns.</div>`}
    <label class="row" style="margin-top:12px"><input type="checkbox" data-sharing ${p.sharing ? "checked" : ""}><span>Visa mina pass för vänner</span></label>
    <div class="row" style="margin-top:8px"><span class="muted small grow">Ditt namn: ${esc(p.name)}</span><button class="small ghost" data-renameprof>Byt namn</button></div>
    ${privacy}</div>`;
}

async function socialAction(fn, okMsg) {
  social.busy = true; social.msg = ""; render();
  try { await fn(); social.msg = okMsg || ""; }
  catch (e) { social.msg = (e && e.message) || "Det gick inte just nu. Försök igen."; }
  social.busy = false;
  await loadSocial();
}

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-kudos],[data-kudosall],[data-fday],[data-ftoday],[data-ftop],[data-flist],[data-fsheet],[data-fsort],[data-fjump],[data-invitelater],[data-gofriends],[data-dropcode],[data-profsave],[data-addfriend],[data-unfriend],[data-sharecode],[data-renameprof]");
  if (!t || t.disabled) return;
  const ds = t.dataset;
  if (ds.kudos) {
    // Visas direkt, sparas i bakgrunden
    const a = social.feed.find(x => String(x.id) === ds.kudos);
    if (a) { a.kudoed = !a.kudoed; a.kudos += a.kudoed ? 1 : -1; render(); }
    socialRpc("driv_kudos", { p_activity: +ds.kudos }).catch(() => loadSocial());
  }
  else if (ds.kudosall !== undefined) {
    const list = social.feed.filter(a => !a.mine && a.day === TODAY && !a.kudoed);
    list.forEach(a => { a.kudoed = true; a.kudos++; });
    render();
    Promise.all(list.map(a => socialRpc("driv_kudos", { p_activity: a.id }))).catch(() => loadSocial());
  }
  else if (ds.fday) { friendsDayOpen = friendsDayOpen === ds.fday ? null : ds.fday; render(); }
  else if (ds.ftoday !== undefined) { friendsTodayAll = !friendsTodayAll; render(); }
  else if (ds.ftop !== undefined) { friendsTopAll = !friendsTopAll; render(); }
  else if (ds.flist !== undefined) { friendsPage = friendsPage ? null : "lista"; friendsQ = ""; friendsSheet = null; render(); window.scrollTo(0, 0); }
  else if (ds.fsheet !== undefined) {
    if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i bladet
    friendsSheet = ds.fsheet || null; social.msg = ""; render();
  }
  else if (ds.fsort) { friendsSort = ds.fsort; render(); filterFriends(); }
  else if (ds.fjump) { const h = document.getElementById(`fl-${ds.fjump}`); if (h) h.scrollIntoView({ block: "start", behavior: "smooth" }); }
  else if (ds.invitelater !== undefined) { S.inviteUntil = shift(TODAY, 14); save(); render(); }
  else if (ds.gofriends !== undefined) {
    // Till vänsidan; utan konto eller profil börjar den med att skapa en
    // En delad kod öppnar bladet där den redan står ifylld
    passDone = null; if (tab !== "vanner") vannerBack = tab; tab = "vanner"; friendsPage = null;
    friendsSheet = social.pendingCode && social.profile ? "bjud" : null;
    render(); window.scrollTo(0, 0);
  }
  else if (ds.dropcode !== undefined) { social.pendingCode = ""; history.replaceState(null, "", location.pathname); render(); }
  else if (ds.profsave !== undefined) {
    const name = ($("sname").value || "").trim();
    if (!name) { social.msg = "Skriv ett namn."; render(); return; }
    socialAction(() => socialRpc("driv_profile_save", { p_name: name, p_sharing: true }));
  }
  else if (ds.renameprof !== undefined) {
    const name = (prompt("Namnet dina vänner ser", social.profile.name) || "").trim();
    if (name) socialAction(() => socialRpc("driv_profile_save", { p_name: name, p_sharing: social.profile.sharing }));
  }
  else if (ds.addfriend !== undefined) {
    const code = ($("vcode").value || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) { social.msg = "En vänkod har sex tecken."; render(); return; }
    socialAction(async () => {
      const name = await socialRpc("driv_add_friend", { p_code: code });
      social.pendingCode = "";
      history.replaceState(null, "", location.pathname);
      friendsSheet = null;
      toast(`${name} är nu din vän`);
    });
  }
  else if (ds.unfriend) { friendsSheet = null; socialAction(() => socialRpc("driv_remove_friend", { p_friend: ds.unfriend })); }
  else if (ds.sharecode !== undefined) {
    const url = `${SHARE_BASE}?v=${social.profile.code}`, text = `Lägg till mig som vän i Driv: ${url}`;
    // Länken skickas bara som url; texten saknar den, annars klistrar Android in länken två gånger
    if (navigator.share) navigator.share({ title: "Driv", text: "Lägg till mig som vän i Driv:", url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast("Länken är kopierad"), () => toast(url));
    else toast(url);
  }
});
document.addEventListener("change", ev => {
  // Pass klart: dela eller ta bort just det här passet ur vännernas flöde
  if (ev.target.dataset && ev.target.dataset.pdshare !== undefined && passDone) {
    const d = dayById(passDone.dayId);
    passDone.shared = ev.target.checked;
    if (d) shareWorkout(d, passDone.date, ev.target.checked);
    return;
  }
  if (ev.target.dataset && ev.target.dataset.sharing !== undefined && social.profile)
    socialAction(() => socialRpc("driv_profile_save", { p_name: social.profile.name, p_sharing: ev.target.checked }));
});

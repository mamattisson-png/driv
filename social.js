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
  try {
    social.profile = await socialRpc("driv_profile_get");
    if (social.profile) [social.friends, social.feed] = await Promise.all([socialRpc("driv_friends"), socialRpc("driv_feed")]);
    social.loaded = true; social.error = false;
  } catch (e) { social.loaded = true; social.error = true; }
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
    ${a.mine ? (a.kudos ? `<span class="kudos-count">👏 ${a.kudos}</span>` : "")
      : `<button class="kudos ${a.kudoed ? "on" : ""}" data-kudos="${a.id}" aria-pressed="${a.kudoed}" aria-label="Peppa ${esc(a.name)}">👏${a.kudos ? ` ${a.kudos}` : ""}</button>`}</div>`;
}

// På Hem: en vänkod från en länk, och vännernas senaste pass
function friendsHome() {
  if (!sbEnabled) return "";
  if (social.pendingCode && !(social.profile && social.profile.code === social.pendingCode)) {
    return `<div class="card nudge"><h2>👋 Vänförfrågan</h2>
      <div class="muted">Någon har delat sin vänkod <b>${esc(social.pendingCode)}</b> med dig. Som vänner ser ni varandras pass och kan peppa varandra.</div>
      <div class="row wrap" style="margin-top:10px"><button class="primary small" data-gofriends>Lägg till vän</button><button class="ghost small" data-dropcode>Inte nu</button></div></div>`;
  }
  if (S.friendsUntil && S.friendsUntil > TODAY && !(social.friends && social.friends.length)) return "";
  // Utan konto: en kort uppmaning längst ned
  if (account.step !== "in") return `<div class="card homerow friendsrow"><span class="hricon" aria-hidden="true">👋</span>
    <span class="grow"><b>Träna med vänner</b><span class="muted small">Se varandras pass och peppa varandra</span></span>
    <button class="small" data-gokonto>Kom igång</button><button class="small ghost" data-friendslater aria-label="Inte nu">✕</button></div>`;
  if (!social.loaded || social.error) return "";
  const invite = social.profile ? `<button data-sharecode>📤 Bjud in en vän</button>` : `<button data-gofriends>📤 Bjud in en vän</button>`;
  if (!social.friends.length) return `<div class="card homerow friendsrow"><span class="hricon" aria-hidden="true">👋</span>
    <span class="grow"><b>Träna med vänner</b><span class="muted small">Se varandras pass och peppa varandra</span></span>
    ${invite.replace("📤 Bjud in en vän", "Bjud in")}<button class="small ghost" data-friendslater aria-label="Inte nu">✕</button></div>`;
  // Senaste passet från en vän; resten finns under Vänner
  const f = social.feed.find(a => !a.mine);
  return `<div class="card homerow friendsrow"><span class="hricon" aria-hidden="true">👋</span>
    ${f ? `<span class="grow"><b>${esc(f.name)} körde ${esc(f.pass)}</b><span class="muted small">${feedWhen(f.day)} · <button class="link small" data-gofriends>alla vänner</button></span></span>
      <button class="kudos ${f.kudoed ? "on" : ""}" data-kudos="${f.id}" aria-pressed="${f.kudoed}" aria-label="Peppa ${esc(f.name)}">👏${f.kudos ? ` ${f.kudos}` : ""}</button>`
      : `<span class="grow"><b>Vänner</b><span class="muted small">Inga pass från vänner de senaste dagarna</span></span><button class="small ghost" data-gofriends>Visa</button>`}</div>`;
}

// Kort rad efter ett sparat pass: vännerna ser det, eller en inbjudan
function friendsAfterPass() {
  if (!sbEnabled) return "";
  if (account.step === "in" && social.profile && social.profile.sharing && social.friends.length)
    return `<div class="muted small" style="margin-top:6px">👋 ${social.friends.length === 1 ? esc(social.friends[0].name) + " ser" : "Dina vänner ser"} passet och kan peppa dig.</div>`;
  return `<button class="link small" style="margin-top:6px" data-${account.step === "in" ? (social.profile ? "sharecode" : "gofriends") : "gokonto"}>👋 Bjud in en vän att träna med</button>`;
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
  const privacy = `<div class="muted small" style="margin-top:10px">🔒 Vänner ser bara att du kört ett pass och vilket – aldrig vikter, mat eller kroppsvikt.</div>`;
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
      <button class="small ghost" data-unfriend="${f.id}" aria-label="Ta bort ${esc(f.name)} som vän">✕</button></div>`).join("")}</div>`
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
  const t = ev.target.closest("[data-kudos],[data-gofriends],[data-friendslater],[data-dropcode],[data-profsave],[data-addfriend],[data-unfriend],[data-sharecode],[data-renameprof]");
  if (!t || t.disabled) return;
  const ds = t.dataset;
  if (ds.kudos) {
    // Visas direkt, sparas i bakgrunden
    const a = social.feed.find(x => String(x.id) === ds.kudos);
    if (a) { a.kudoed = !a.kudoed; a.kudos += a.kudoed ? 1 : -1; render(); }
    socialRpc("driv_kudos", { p_activity: +ds.kudos }).catch(() => loadSocial());
  }
  else if (ds.gofriends !== undefined) {
    openProfRow("vanner");
  }
  else if (ds.friendslater !== undefined) { S.friendsUntil = shift(TODAY, 21); save(); render(); }
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
      toast(`${name} är nu din vän 👋`);
    });
  }
  else if (ds.unfriend) socialAction(() => socialRpc("driv_remove_friend", { p_friend: ds.unfriend }));
  else if (ds.sharecode !== undefined) {
    const url = `${SHARE_BASE}?v=${social.profile.code}`, text = `Lägg till mig som vän i Driv: ${url}`;
    if (navigator.share) navigator.share({ title: "Driv", text, url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast("Länken är kopierad"), () => toast(url));
    else toast(url);
  }
});
document.addEventListener("change", ev => {
  if (ev.target.dataset && ev.target.dataset.sharing !== undefined && social.profile)
    socialAction(() => socialRpc("driv_profile_save", { p_name: social.profile.name, p_sharing: ev.target.checked }));
});

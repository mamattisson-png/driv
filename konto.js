"use strict";
// ---------- Konto via Supabase (publika versionen) ----------
// Även Tyck till och export. Laddas före app.js; funktionerna anropas först när appen körs.
// Inloggning med kod eller länk via e-post. Varje användare ser bara sina egna rader (RLS).
const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
const sbConf = window.DRIV_CONFIG || {};
// I testläget används aldrig kontot: ingen inloggning, synk, vänner eller notiser
const sbEnabled = !window.claude && !window.DRIV_TEST && !!(sbConf.supabaseUrl && sbConf.supabaseAnonKey);
const account = { sb: null, email: "", step: "email", msg: "", busy: false };

async function supabaseClient() {
  if (!account.sb) {
    if (!window.supabase) await loadScript(SUPABASE_JS);
    account.sb = window.supabase.createClient(sbConf.supabaseUrl, sbConf.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return account.sb;
}

// Får Supabase att se ut som appens övriga lagring: get(), doc(id).set() och doc(id).delete()
function supabaseCollection(sb, uid) {
  const table = () => sb.from("driv_docs");
  const fail = error => { if (error) throw error; };
  const versions = {};
  const decode = row => {
    const { _rev, ...body } = row.data;
    versions[row.id] = _rev || null;
    return { id: row.id, data: () => body };
  };
  const matchVersion = (query, id, version) => {
    query = query.eq("user_id", uid).eq("id", id);
    return version ? query.eq("data->>_rev", version) : query.is("data->>_rev", null);
  };
  const read = async id => {
    const { data, error } = await table().select("id, data").eq("user_id", uid).in("id", [id]);
    fail(error);
    if (!data.length) { delete versions[id]; return undefined; }
    return decode(data[0]).data();
  };
  return {
    async get() {
      const { data, error } = await table().select("id, data").eq("user_id", uid);
      fail(error);
      return { empty: !data.length, docs: data.map(decode) };
    },
    async getMany(ids) {
      const { data, error } = await table().select("id, data").eq("user_id", uid).in("id", ids);
      fail(error);
      return data.map(decode);
    },
    doc: id => ({
      async set(body, expected) {
        // Jämförelsen görs av PostgreSQL i samma UPDATE som skrivningen. Två enheter
        // kan därför inte båda ersätta samma gamla version. Ingen ny SQL behövs.
        let next = body;
        for (let attempt = 0; attempt < 8; attempt++) {
          const revision = crypto.randomUUID();
          const payload = { ...next, _rev: revision };
          if (expected === undefined) {
            const { error } = await table().insert({ user_id: uid, id, data: payload });
            if (!error) { versions[id] = revision; return next; }
            if (error.code !== "23505") fail(error);
          } else {
            // Bara den korta revisionsnyckeln går i URL:en, aldrig en hel månads logg.
            const version = versions[id];
            const { data, error } = await matchVersion(table().update({ data: payload, updated_at: new Date().toISOString() }), id, version).select("id");
            fail(error);
            if (data.length) { versions[id] = revision; return next; }
          }
          expected = await read(id);
          if (expected !== undefined) next = mergeDoc(id, next, expected);
        }
        throw new Error("Dokumentet ändrades under synk. Försök igen.");
      },
      async delete(expected) {
        // En gammal lokal import får aldrig ta bort en annan enhets nyare månad.
        if (expected === undefined) return;
        if (!(id in versions)) return;
        const { error } = await matchVersion(table().delete(), id, versions[id]);
        fail(error);
      },
    }),
  };
}

// Behåll en lokal reserv per konto; en annan användare får aldrig ärva loggen.
// Den gamla driv-synced-markören känns igen vid uppgradering.
function localOwner() {
  if ("localUid" in account) return account.localUid;
  return localStorage.getItem("driv-owner") || localStorage.getItem("driv-synced");
}
function switchLocalAccount(uid) {
  const owner = localOwner();
  let next = S;
  if (owner && owner !== uid) {
    localStorage.setItem(`${KEY}:account:${owner}`, JSON.stringify(S));
    const saved = uid && localStorage.getItem(`${KEY}:account:${uid}`);
    next = saved ? normalize(Object.assign(freshState(), JSON.parse(saved))) : freshState();
  } else if (!owner && uid) {
    const saved = localStorage.getItem(`${KEY}:account:${uid}`);
    if (saved) next = mergeState(S, normalize(Object.assign(freshState(), JSON.parse(saved))));
  }
  // Ägare och aktiv logg skrivs atomiskt i samma localStorage-post. Om detta
  // misslyckas avbryts anslutningen innan en annan användares konto kan synkas.
  localStorage.setItem(KEY, JSON.stringify({ ...next, _localOwner: uid }));
  const changedState = next !== S;
  S = next; account.localUid = uid;
  if (changedState) {
    endFocus(); stopRest(); editing = false; passOpen = false; profOpen = null; onb = 0; editDate = null; draft = null; modal = null;
    foodSheet = null; foodItem = null; mealPage = null; actSheet = null;
    chosenDay = null; passDone = null;
    tab = S.setupDone ? "idag" : "upplagg";
    Object.assign(social, { profile: null, friends: [], feed: [], loaded: false, msg: "" });
  }
  stamp(true);
  if (owner !== uid) localStorage.removeItem("driv-synced");
}

async function connectSupabase() {
  if (!sbEnabled) return;
  if (account.connecting) return account.connecting;
  const epoch = account.epoch || 0;
  const task = (async () => {
    try {
      const sb = await supabaseClient();
      const { data, error } = await sb.auth.getSession();
      if (error) throw error;
      const user = data.session && data.session.user;
      if (!user || epoch !== (account.epoch || 0)) return;
      const synced = localStorage.getItem("driv-synced");
      switchLocalAccount(user.id);
      account.email = user.email || "";
      account.step = "in";
      await attachCollection(supabaseCollection(sb, user.id), true, synced !== user.id);
      if (epoch !== (account.epoch || 0)) return;
      localStorage.setItem("driv-synced", user.id);
      loadSocial();
    } catch (e) {
      if (epoch === (account.epoch || 0)) cloud.status = "error";
    }
    render();
  })();
  account.connecting = task;
  try { await task; } finally { if (account.connecting === task) account.connecting = null; }
}

async function sendLoginCode() {
  const email = ($("acctemail").value || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) { account.msg = "Skriv en giltig e-postadress."; return render(); }
  account.busy = true; account.msg = ""; render();
  try {
    const sb = await supabaseClient();
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href.split("#")[0] } });
    if (error) throw error;
    account.email = email; account.step = "code";
    account.msg = "Vi har skickat ett mejl. Skriv koden här, eller tryck på länken i mejlet.";
  } catch (e) {
    account.msg = "Kunde inte skicka mejlet just nu. Försök igen om en stund.";
  }
  account.busy = false; render();
}

async function verifyLoginCode() {
  const token = ($("acctcode").value || "").replace(/\s/g, "");
  if (!token) return;
  account.busy = true; account.msg = ""; render();
  try {
    const sb = await supabaseClient();
    const { error } = await sb.auth.verifyOtp({ email: account.email, token, type: "email" });
    if (error) throw error;
    account.msg = "";
    await connectSupabase();
  } catch (e) {
    account.msg = "Koden stämmer inte eller har gått ut. Be om en ny kod.";
  }
  account.busy = false; render();
}

async function signOut() {
  account.epoch = (account.epoch || 0) + 1;
  account.connecting = null;
  clearTimeout(cloud.timer);
  cloud.col = null; cloud.sent = {}; cloud.again = false; cloud.status = "local";
  // Om lagringen är full lämnas loggen på skärmen; ingen annans konto ansluts då.
  try { switchLocalAccount(null); } catch (e) { /* behåll den befintliga lokala datan */ }
  try { await (await supabaseClient()).auth.signOut(); } catch (e) { /* redan utloggad */ }
  Object.assign(social, { profile: null, friends: [], feed: [], loaded: false, msg: "" });
  account.step = "email"; account.email = "";
  account.msg = "Utloggad. Logga in igen för att öppna dina sparade loggar.";
  render();
}

// ---------- Tyck till ----------
// Synpunkter sparas i tabellen driv_feedback; bara projektägaren kan läsa dem i Supabase
const feedback = { msg: "", busy: false, sent: false };
function feedbackCard() {
  if (!sbEnabled) return "";
  if (feedback.sent) return `<div class="card"><h2>Tyck till</h2><div>Tack! Din synpunkt är skickad.</div>
    <button class="small" style="margin-top:10px" data-fbagain>Skicka en till</button></div>`;
  return `<div class="card"><h2>Tyck till</h2>
    <div class="muted" style="margin-bottom:8px">Vad är krångligt, vad saknas, vad gillar du? Allt hjälper Driv att bli bättre.</div>
    <textarea id="fbtext" rows="4" maxlength="2000" placeholder="Skriv här…"></textarea>
    <input id="fbemail" type="email" autocomplete="email" style="margin-top:8px" placeholder="E-post om du vill ha svar (valfritt)" value="${esc(account.email || "")}">
    <button class="primary" style="margin-top:8px" data-fbsend ${feedback.busy ? "disabled" : ""}>Skicka</button>
    ${feedback.msg ? `<div class="muted small" style="margin-top:8px">${esc(feedback.msg)}</div>` : ""}</div>`;
}
async function sendFeedback() {
  const message = ($("fbtext").value || "").trim(), email = ($("fbemail").value || "").trim();
  if (!message) { feedback.msg = "Skriv något först."; return render(); }
  feedback.busy = true; feedback.msg = ""; render();
  try {
    const sb = await supabaseClient();
    const { error } = await sb.from("driv_feedback").insert({ message: message.slice(0, 2000), email: email.slice(0, 200) || null, page: tab });
    if (error) throw error;
    feedback.sent = true;
  } catch (e) {
    feedback.msg = "Kunde inte skicka just nu. Försök igen om en stund.";
    // Behåll texten så att inget skrivet försvinner
    setTimeout(() => { const t = $("fbtext"); if (t) t.value = message; }, 0);
  }
  feedback.busy = false; render();
}

// ---------- Datan ska inte försvinna ----------
// Be webbläsaren att inte rensa Drivs lagring när det blir ont om plats
if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {});

// Android och dator: webbläsarens egen installationsruta sparas och visas när man trycker Installera
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (typeof render === "function" && S.setupDone) render(); });
window.addEventListener("appinstalled", () => { installEvt = null; render(); });
const loggedDays = () => Object.values(S.log).filter(L => L.food.length || L.workouts.length || Object.keys(L.dailies).length).length;
const canInstall = () => !standalone() && (installEvt || isIOS());
const IOS_STEPS = "Tryck på Dela-knappen (fyrkanten med pilen) i Safari och välj <b>Lägg till på hemskärmen</b>.";

// Utan konto finns allt bara i webbläsaren. Efter några dagars loggning föreslås ett konto.
function accountNudge() {
  if (!sbEnabled || account.step === "in" || (S.nudgeUntil && S.nudgeUntil > TODAY)) return "";
  if (loggedDays() < 3) return "";
  return `<div class="card nudge"><h2>Spara dina loggar</h2>
    <div class="muted">Just nu finns allt bara på den här enheten. Med ett konto sparas det i molnet – bara e-post, klart på en minut.
      ${isIOS() && !standalone() ? "<b>På iPhone kan Safari rensa sparad data om Driv inte öppnas på en vecka.</b>" : ""}</div>
    <div class="row wrap" style="margin-top:10px"><button class="primary small" data-gokonto>Skapa konto</button>
      <button class="small" data-gokonto>Logga in</button><button class="ghost small" data-nudgelater>Inte nu</button></div></div>`;
}

// Lägg Driv på hemskärmen: då öppnas den som en app, notiser fungerar på iPhone och datan rensas inte.
// Visas när man börjat logga och kontokortet inte redan syns.
function installNudge() {
  if (!canInstall() || (S.installUntil && S.installUntil > TODAY) || loggedDays() < 1 || accountNudge()) return "";
  return `<div class="card nudge"><h2>Lägg Driv på hemskärmen</h2>
    <div class="muted">Då öppnas Driv som en vanlig app${isIOS() ? ", notiser fungerar och iPhone rensar inte dina loggar" : ""}.
      ${installEvt ? "" : IOS_STEPS}</div>
    <div class="row wrap" style="margin-top:10px">${installEvt ? `<button class="primary small" data-install>Installera</button>` : ""}
      <button class="ghost small" data-installlater>${installEvt ? "Inte nu" : "Okej"}</button></div></div>`;
}
// Raden under Konto och data i Profil
function installHelp() {
  if (!canInstall()) return "";
  return `<div class="muted small" style="margin-top:10px">${installEvt ? `Installera Driv som app så öppnas den snabbare. <button class="link small" data-install>Installera</button>`
    : `Lägg Driv på hemskärmen så öppnas den som en app och iPhone rensar inte datan: ${IOS_STEPS}`}</div>`;
}

// Visas på startsidan så att den som redan har konto slipper göra om upplägget
let welcomeLogin = null;   // "create" eller "login" när rutan på startsidan är öppen
function accountCard() {
  if (!sbEnabled) return "";
  return `<div class="card" id="konto"><h2>${account.step === "in" ? "Konto" : "Skapa konto eller logga in"}</h2>${accountBody()}</div>`;
}
// mode: "create" eller "login" ger en kortare text på startsidan
function accountBody(mode) {
  const a = account;
  let body;
  if (a.step === "in") {
    body = `<div>Inloggad som <b>${esc(a.email)}</b>.</div>
      <div class="muted small" style="margin-top:4px">Allt du loggar sparas på ditt konto och följer med till alla enheter där du loggar in.</div>
      <div class="row wrap" style="margin-top:10px"><button class="small" data-signout>Logga ut</button>
        <button class="small ${a.confirmDelete ? "primary" : "ghost"}" data-delacct>${a.confirmDelete ? "Tryck igen för att radera kontot" : "Radera konto"}</button></div>
      ${a.confirmDelete ? `<div class="muted small" style="margin-top:6px">Kontot, molnkopian, vänner och delade pass raderas. En lokal säkerhetskopia ligger kvar på den här enheten.</div>` : ""}`;
  } else if (a.step === "code") {
    body = `<div class="muted">Vi har skickat en kod till <b>${esc(a.email)}</b>. Skriv in den här, eller tryck på länken i mejlet.</div>
      <div class="row" style="margin-top:8px"><input id="acctcode" inputmode="numeric" autocomplete="one-time-code" placeholder="Kod från mejlet">
        <button class="primary small" data-verifycode ${a.busy ? "disabled" : ""}>Fortsätt</button></div>
      <button class="small ghost" style="margin-top:6px" data-changeemail>Byt e-postadress</button>`;
  } else {
    body = `<div class="muted">${mode === "login" ? "Skriv e-posten du använde, så skickar vi en kod."
        : mode === "create" ? "Skriv din e-post, så skickar vi en kod. Inget lösenord."
        : "Spara dina loggar i molnet, på alla dina enheter. Bara e-post och en kod – inget lösenord."}</div>
      <div class="row" style="margin-top:8px"><input id="acctemail" type="email" autocomplete="email" placeholder="din@epost.se" value="${esc(a.email)}">
        <button class="primary small" data-sendcode ${a.busy ? "disabled" : ""}>Skicka kod</button></div>
      <div class="muted small" style="margin-top:6px">Din e-post används bara för att logga in – aldrig för reklam eller utskick.</div>`;
  }
  return `${body}${a.msg ? `<div class="muted small" style="margin-top:8px">${esc(a.msg)}</div>` : ""}`;
}

// Sparar en fil: via Claudes nedladdning i Claude-versionen, annars som vanlig nedladdning
async function saveFile(filename, data, type) {
  const dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null;
  if (dl) {
    try { await dl.save({ filename, data }); } catch (e) { /* nedladdningen avböjdes */ }
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = filename;
  a.click();
}
const exportData = () => saveFile(`driv-${TODAY}.json`, JSON.stringify(S, null, 2), "application/json");

// Det man skriver i e-postfältet ligger kvar om vyn ritas om under tiden (t.ex. när notisläget hämtats)
document.addEventListener("input", ev => {
  if (ev.target.id === "acctemail" && account.step !== "in") account.email = ev.target.value;
});

"use strict";
// ---------- Första besöket och upplägget ----------
// Första gången: en välkomstsida, sedan tre korta steg (program, pass och dagar, mål) och sist Hem.
// Den som redan har ett konto loggar in med e-post och en kod. Efter starten ändras upplägget från Träna.
// Laddas före app.js; funktionerna anropas först när appen ritas.

let onb = 0;            // 0 välkomst, 1 program, 2 pass och dagar, 3 mål
let welcomeAgain = false;   // efter Nollställ allt börjar man på välkomstsidan, även inloggad
let daysOpen = false;   // veckodagarna är utfällda i Upplägg

function ensureDraft() {
  return draft = draft || {
    program: S.plan.program || "ppl",
    count: S.plan.free ? S.plan.count : S.plan.days.filter(d => !d.extra).length,
    mode: S.plan.mode || "flex",
    free: !!S.plan.free,
    weekdays: S.plan.weekdays.slice(),
    days: JSON.parse(JSON.stringify(S.plan.days)),
  };
}
const draftOk = () => draft.free || draft.mode !== "fixed" || draft.weekdays.length === draft.days.length;
const brandBig = () => `<div class="welcome-brand"><img src="icons/icon-192-v2.png" alt="">
  <h1 class="ordbild"><span class="wordmark">DRIV</span><span class="slogan">Ditt mål. <em>Ditt driv.</em></span></h1></div>`;
const stepTop = (n, back, label) => `<div class="row between steptop"><button class="backbtn" ${back}>${icon("left", 18)}${label}</button><span class="muted small">Steg ${n} av 3</span></div>
  <div class="stepbar" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</div>`;

function welcomeView() {
  const pt = (ic, t, s) => `<div class="wpoint"><span class="wic">${icon(ic, 20)}</span><span><b>${t}</b><span class="muted small">${s}</span></span></div>`;
  return `<div class="welcome">
    <div class="welcome-glow" aria-hidden="true"></div>
    ${brandBig()}
    <div class="wpoints">${pt("trana", "Träna efter ett schema", "Passen, vikterna och vad som är nästa")}
      ${pt("kost", "Håll koll på maten", "Ett kalorimål som passar dig")}
      ${pt("check", "Bygg dina vanor", "Dailys: små saker att bocka av varje dag")}
      ${pt("vanner", "Peppa varandra", "Se när vännerna har tränat")}</div>
    <p class="wwhy">Varför Driv? <em>Det är enkelt.</em></p>
    <div class="welcome-cta">${sbEnabled && account.step !== "in"
      ? `<button class="primary wide bigbtn" data-welcomelogin="create">Skapa konto</button>
      <button class="wide bigbtn" data-welcomelogin="login">Logga in</button>
      <button class="link wnoacct" data-onb="1">Fortsätt utan konto</button>`
      : `<button class="primary wide bigbtn" data-onb="1">Kom igång</button>`}
      <span class="muted small">Tar ungefär en minut. Allt går att ändra sen.</span></div></div>`;
}

// Googles "G" på inloggningsknappen (enligt Googles riktlinjer för inloggningsknappar)
const GOOGLE_G = `<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
// Microsofts fyra rutor och Facebooks "f", enligt deras riktlinjer för inloggningsknappar
const MS_LOGO = `<svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>`;
const FB_LOGO = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" style="fill:#fff;stroke:none"/><path style="fill:#0866FF;stroke:none" d="M16.2 7.6h-1.9c-.7 0-1 .5-1 1.1v1.7h2.8l-.4 2.9h-2.4V24h-3.1V13.3H7.8v-2.9h2.4V8.4c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.1 2.4.2v2.7z"/></svg>`;
// Inloggning: e-post, sedan koden från mejlet. Kontot har allt man loggat.
function loginView() {
  const a = account;
  const msg = a.msg ? `<div class="muted small loginmsg">${esc(a.msg)}</div>` : "";
  if (a.step === "code") {
    return `<div class="login"><button class="backbtn" data-changeemail>${icon("left", 18)}Byt e-post</button>
      <span class="loginic">${icon("mail", 26)}</span>
      <h1>Kolla din mejl</h1>
      <div class="muted lead">Skriv in koden här, eller tryck på länken i mejlet.</div>
      ${codeDestination()}
      <input id="acctcode" class="codefield" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="Kod från mejlet" aria-label="Kod från mejlet">
      <div class="row between muted small"><span>Ingen kod? Kolla skräpposten.</span><button class="linkbtn2" data-sendcode ${a.busy ? "disabled" : ""}>Skicka igen</button></div>
      ${msg}
      <div class="login-cta"><button class="primary wide bigbtn" data-verifycode ${a.busy ? "disabled" : ""}>Logga in</button>
        <span class="muted small">Har kontot inget schema än får du välja ett först.</span></div></div>`;
  }
  const create = welcomeLogin === "create";
  const prov = (id, cls, logo, name) => `<button class="lprov ${cls}" data-oauth="${id}" ${a.busy ? "disabled" : ""}><span class="lplogo">${logo}</span><span class="lpname">Fortsätt med ${name}</span></button>`;
  return `<div class="login loginv2"><div class="welcome-glow" aria-hidden="true"></div>
    <button class="backbtn" data-welcomelogin="">${icon("left", 18)}Tillbaka</button>
    <div class="lhero"><img class="lhlogo" src="icons/icon-192-v2.png" alt="">
      <h1>${create ? "Skapa ditt konto" : "Välkommen tillbaka"}</h1>
      <p class="muted">${create ? "Ett konto sparar allt du loggar och låter dig träna med vänner." : "Logga in för att fortsätta där du var."}</p></div>
    <div class="lproviders">${prov("google", "g", GOOGLE_G, "Google")}${prov("azure", "ms", MS_LOGO, "Microsoft")}${prov("facebook", "fb", FB_LOGO, "Facebook")}</div>
    <div class="ordivider"><span>eller med e-post</span></div>
    <label class="lemail">${icon("mail", 20)}<input id="acctemail" type="email" autocomplete="email" inputmode="email" placeholder="din@epost.se" value="${esc(a.email)}" aria-label="E-post"></label>
    <button class="primary wide bigbtn lsend" data-sendcode ${a.busy ? "disabled" : ""}>Skicka kod</button>
    ${msg}
    <div class="ltrust">${icon("data", 16)}<span>Inget lösenord. Allt du loggat följer med till alla dina enheter, och e-posten används bara för att logga in. <a href="integritet.html" target="_blank" rel="noopener">Om dina uppgifter</a></span></div>
    <div class="lswitch muted">${create ? `Har du redan ett konto? <button class="link" data-welcomelogin="login">Logga in</button>`
      : `Inget konto än? <button class="link" data-welcomelogin="create">Skapa konto</button>`}</div></div>`;
}

// Inloggad men utan sparat upplägg: ett besked överst i stegen
function accountNote() {
  if (account.step !== "in") return sbEnabled ? `<div class="card note-card warn-card"><b>Du kör utan konto.</b> <span class="muted">Allt sparas bara i den här telefonen och kan gå förlorat om du byter telefon eller rensar webbläsaren. Skapa konto när du vill under Inställningar.</span></div>` : "";
  return `<div class="card note-card"><b>Inloggad som ${esc(account.email)}.</b> <span class="muted">${cloud.status === "cloud" ? "Kontot har inget sparat upplägg än. Välj ett här, så sparas det på kontot."
    : cloud.status === "error" ? "Kunde inte hämta från kontot. Ladda om sidan." : "Hämtar från kontot…"}</span></div>`;
}

// I starten väljs Motion som ett eget val (onbKinds), inte bland gymprogrammen
const progTiles = (sel, gymOnly) => `<div class="progtiles">${Object.entries(PROGRAMS).filter(([id]) => id !== "eget" && !(gymOnly && id === "aktiviteter")).map(([id, pr]) =>
  `<button class="progtile ${sel === id ? "on" : ""}" data-prog="${id}" aria-pressed="${sel === id}"><b>${pr.name}</b><span>${pr.best} pass</span></button>`).join("")}</div>
  <button class="progtile own ${sel === "eget" ? "on" : ""}" data-prog="eget" aria-pressed="${sel === "eget"}"><span class="plusic">${icon("plus", 18)}</span>
    <span class="grow col"><b>Eget schema</b><span class="muted small">Döp passen och välj övningar själv</span></span></button>`;

function daysPicker() {
  const n = draft.days.length, fixed = draft.mode === "fixed", ok = draftOk();
  const sorted = draft.weekdays.slice().sort((a, b) => a - b);
  const plan = fixed && ok ? sorted.map((wd, i) => `${WD_LONG[wd]} ${esc(draft.days[i].name)}`).join(", ") : "";
  return `<div class="seg two">
      <button data-mode="flex" class="${fixed ? "" : "on"}" aria-pressed="${!fixed}"><b>Olika dagar</b><span>Nästa pass i tur, när du har tid</span></button>
      <button data-mode="fixed" class="${fixed ? "on" : ""}" aria-pressed="${fixed}"><b>Fasta dagar</b><span>Varje pass har en veckodag</span></button></div>
    ${fixed ? `<div class="card wdcard"><div class="seg wd">${WD.map((name, i) => `<button data-wd="${i}" class="${draft.weekdays.includes(i) ? "on" : ""}" aria-pressed="${draft.weekdays.includes(i)}" aria-label="${cap(WD_LONG[i])}">${name[0]}</button>`).join("")}</div>
      <div class="muted small">${ok ? `<span class="oktext">${icon("check", 14)}</span> ${cap(plan)}` : `Välj ${n} dagar (${draft.weekdays.length} valda)`}</div></div>`
      : `<div class="muted small daysnote">Appen föreslår nästa pass i ordningen när du tränar, vilken dag det än är.</div>`}`;
}

// Gym, Motion eller Båda: Motion är programmet Bara motion, Båda är ett gymprogram med motionspass tillagda
const draftKind = () => draft.free ? "free" : draft.program === "aktiviteter" ? "motion" : draft.days.some(d => d.extra && d.type === "act") ? "both" : "gym";
function onbKinds() {
  const k = draftKind();
  const opt = (id, ic, cls, title, sub) => `<button class="onbkind ${k === id ? "on" : ""}" data-onbkind="${id}" role="radio" aria-checked="${k === id}">
    <span class="okic ${cls}">${icon(ic, 22)}</span><span class="grow"><b>${title}</b><small>${sub}</small></span><span class="okrad" aria-hidden="true"></span></button>`;
  return `<div class="onbkinds" role="radiogroup" aria-label="Hur vill du träna?">${opt("gym", "trana", "g", "Gym", "Färdiga program med övningar, set och vikter")}
    ${opt("motion", "aktivitet", "m", "Motion", "Promenad, löpning, yoga, cykling … med tid och mål")}
    ${opt("both", "plus", "b", "Båda", "Ett gymprogram och motion samma vecka")}
    ${opt("free", "edit", "b", "Inget schema", "Logga det du gör, när du gör det")}</div>`;
}
function setDraftKind(kind) {
  // Inget schema: passen i schemat ligger kvar (om man vill tillbaka) men används inte; bara veckomålet gäller
  if (kind === "free") { draft.free = true; draft.count = Math.min(7, Math.max(1, draft.count || 3)); return; }
  if (draft.free) { draft.free = false; draft.count = draft.days.filter(d => !d.extra).length || 3; if (!draft.days.length) draft.days = planDays(draft.program, draft.count, []); if (kind === draftKind()) return; }
  const keep = draft.days.filter(d => d.extra && d.type !== "act");
  if (kind === "motion") {
    draft.program = "aktiviteter"; draft.count = 3;
    draft.days = planDays("aktiviteter", 3, keep);
  } else {
    if (draft.program === "aktiviteter") { draft.program = "ppl"; draft.count = 3; }
    draft.days = planDays(draft.program, draft.count, keep);
    if (kind === "both") draft.days.push(newActDay({ name: "Promenad", min: 30, int: 1 }, true, 7), newActDay({ name: "Yoga", min: 30, int: 1 }, true, 8));
  }
  if (draft.weekdays.length !== draft.days.length) draft.weekdays = DEFAULT_WEEKDAYS[Math.min(7, draft.days.length)].slice();
}
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-onbkind]");
  if (!t || !draft) return;
  ev.stopImmediatePropagation();
  setDraftKind(t.dataset.onbkind); render();
}, true);

function onbView() {
  ensureDraft();
  const pr = PROGRAMS[draft.program], n = draft.count;
  if (onb === 1) return `${stepTop(1, 'data-onb="0"', "Tillbaka")}${accountNote()}
    <h1>Hur vill du träna?</h1><div class="muted lead">Du kan blanda och ändra när du vill.</div>
    ${onbKinds()}
    ${draftKind() === "motion" || draft.free ? "" : `<div class="klabel sechead">Välj gymprogram</div><div class="muted small" style="margin:-4px 4px 8px">Övningarna är redan ifyllda.</div>${progTiles(draft.program, true)}`}
    <div class="stepcta"><button class="primary wide bigbtn" data-onb="2">Nästa</button></div>`;
  if (onb === 2 && draft.free) return `${stepTop(2, 'data-onb="1"', "Program")}
    <h1>Hur ofta?</h1><div class="muted lead">Hur många gånger i veckan vill du träna? Allt du loggar räknas: gympass, löpning, padel …</div>
    <div class="klabel sechead">Träna i veckan</div>
    <div class="seg count">${[1, 2, 3, 4, 5, 6, 7].map(c => `<button data-count="${c}" class="${n === c ? "on" : ""}" aria-pressed="${n === c}">${c}</button>`).join("")}</div>
    <div class="muted small daysnote">Du kan välja ett schema när som helst under Träningsschema.</div>
    <div class="stepcta"><button class="primary wide bigbtn" data-onb="3">Nästa</button></div>`;
  if (onb === 2) return `${stepTop(2, 'data-onb="1"', "Program")}
    <h1>Hur ofta?</h1><div class="muted lead">${draftKind() === "motion" ? "Hur många gånger i veckan vill du röra på dig? Vad och hur länge ändrar du sen under Träningsschema."
      : draft.program === "eget" ? "Hur många pass vill du ha i veckan?" : `${pr.name} är gjort för ${pr.best} pass i veckan.${draftKind() === "both" ? " Motionspassen kommer utöver dem." : ""}`}</div>
    <div class="klabel sechead">${draftKind() === "motion" ? "Motionspass i veckan" : draftKind() === "both" ? "Gympass i veckan" : "Pass i veckan"}</div>
    <div class="seg count">${counts(draft.program).map(c => `<button data-count="${c}" class="${n === c ? "on" : ""}" aria-pressed="${n === c}">${c}</button>`).join("")}</div>
    <div class="muted small daysnote">Passen blir: <b class="strong">${draft.days.map(d => esc(d.name)).join(", ")}</b>${pr.fit.includes(n) ? "" : `. ${pr.name} är gjort för ${pr.best} pass, så passen har anpassats`}${n === 7 ? ". Sju pass i veckan kräver bra återhämtning" : ""}</div>
    <div class="klabel sechead">När tränar du?</div>
    ${daysPicker()}
    <div class="stepcta"><button class="primary wide bigbtn" data-onb="3" ${draftOk() ? "" : "disabled"}>Nästa</button></div>`;
  const p = S.profile, m = macros();
  return `${stepTop(3, 'data-onb="2"', "Pass och dagar")}
    <h1>Ditt mål</h1><div class="muted lead">Fyll i dig själv, så räknar vi fram ett kalorimål som passar dig.</div>
    <div class="seg three goalstep">${Object.entries(GOALS).map(([k, v]) => `<button data-goalpick="${k}" class="${p.goal === k ? "on" : ""}" aria-pressed="${p.goal === k}"><b>${v[0].split(" (")[0]}</b><span>${v[1] > 0 ? `+${v[1]} kcal` : v[1] < 0 ? `−${-v[1]} kcal` : "Som nu"}</span></button>`).join("")}</div>
    <div class="goalfields">${profileFields(p, true)}</div>
    <div class="card goalres"><span class="klabel accent">Per dag</span><b class="goalnum">${tnum(kcalGoal())} <small>kcal</small></b><span class="muted">och ${m.protein} g protein</span></div>
    <div class="stepcta"><span class="muted small">Allt går att ändra sen.</span><button class="primary wide bigbtn" data-savesetup ${draftOk() ? "" : "disabled"}>Klart, till Hem</button></div>`;
}

// Upplägg efter starten: programmet, antal pass och dagarna, som rutor
function upplaggView() {
  ensureDraft();
  const pr = PROGRAMS[draft.program], n = draft.count, c = counts(draft.program), fixed = draft.mode === "fixed";
  const back = { idag: "Hem", pass: "Träna" }[setupFrom] || "Inställningar";
  return `<button class="backbtn backlink" data-cancelsetup>${icon("left", 18)}${back}</button>
    <h1>Träningsschema</h1>
    ${onbKinds()}
    ${draft.free ? `<section class="card utile freegoal"><span class="klabel">Träna i veckan</span><b class="unum">${n}</b>
        <span class="row"><button class="grow" data-count="${n - 1}" ${n > 1 ? "" : "disabled"} aria-label="Färre">${icon("minus", 18)}</button>
          <button class="grow" data-count="${n + 1}" ${n < 7 ? "" : "disabled"} aria-label="Fler">${icon("plus", 18)}</button></span></section>
      <div class="muted small finish-note">Inget schema: du loggar gympass och motion fritt, och allt räknas mot veckans mål.</div>
      <button class="primary wide bigbtn" data-savesetup>Spara</button>` : `
    <section class="card progcard" aria-label="Ditt program">
      <div class="row between"><span class="klabel accent">Ditt program</span><button class="linkbtn2" data-progtoggle aria-expanded="${progOpen}">${progOpen ? "Stäng" : "Byt program"}${icon(progOpen ? "up" : "right", 14)}</button></div>
      <div class="progname">${esc(pr.name)}</div>
      <div class="muted small">${esc(pr.info)}</div>
      </section>
    ${progOpen ? `<div class="progpick">${progTiles(draft.program)}</div>` : ""}
    <div class="utiles">
      <div class="card utile"><span class="klabel">Pass i veckan</span><b class="unum">${draft.days.length}</b>
        <span class="row"><button class="grow" data-count="${n - 1}" ${n > c[0] ? "" : "disabled"} aria-label="Färre pass">${icon("minus", 18)}</button>
          <button class="grow" data-count="${n + 1}" ${n < c[c.length - 1] && draft.days.length < 7 ? "" : "disabled"} aria-label="Fler pass">${icon("plus", 18)}</button></span></div>
      <button class="card utile" data-daysopen aria-expanded="${daysOpen}"><span class="row between"><span class="klabel">Dagar</span><span class="accenttext small">${daysOpen ? "Stäng" : "Ändra"}</span></span>
        <b class="uday">${fixed ? "Fasta dagar" : "Olika dagar"}</b>
        <span class="udots" aria-label="${fixed ? draft.weekdays.slice().sort((a, b) => a - b).map(i => WD_LONG[i]).join(", ") : "Nästa pass i tur"}">${WD.map((w, i) => `<i class="${fixed && draft.weekdays.includes(i) ? "on" : ""}">${w[0]}</i>`).join("")}</span></button></div>
    ${daysOpen || (fixed && !draftOk()) ? `<div class="dayspick">${daysPicker()}</div>` : ""}
    ${planList()}
    <div class="muted small finish-note">Övningarna i gympassen ändrar du under Träna. Aktiviteter har bara tid och mål.</div>
    <button class="primary wide bigbtn" data-savesetup ${draftOk() ? "" : "disabled"}>Spara schema</button>`}`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-onb],[data-daysopen]");
  if (!t || t.disabled) return;
  if (t.dataset.daysopen !== undefined) daysOpen = !daysOpen;
  else {
    onb = +t.dataset.onb; progOpen = false;
    // Tillbaka från steg 1 visar välkomstsidan även för den som är inloggad (annars hoppar appen direkt till steg 1)
    if (!onb) welcomeAgain = true;
  }
  render();
  window.scrollTo(0, 0);
});

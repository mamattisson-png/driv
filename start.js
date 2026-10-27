"use strict";
// ---------- Första besöket och upplägget ----------
// Första gången: en välkomstsida, sedan tre korta steg (program, pass och dagar, mål) och sist Hem.
// Den som redan har ett konto loggar in med e-post och en kod. Efter starten ändras upplägget från Träna.
// Laddas före app.js; funktionerna anropas först när appen ritas.

let onb = 0;            // 0 välkomst, 1 program, 2 pass och dagar, 3 mål
let daysOpen = false;   // veckodagarna är utfällda i Upplägg

function ensureDraft() {
  return draft = draft || {
    program: S.plan.program || "ppl",
    count: S.plan.count,
    mode: S.plan.mode || "flex",
    weekdays: S.plan.weekdays.slice(),
    days: JSON.parse(JSON.stringify(S.plan.days)),
  };
}
const draftOk = () => draft.mode !== "fixed" || draft.weekdays.length === draft.count;
const brandBig = () => `<div class="welcome-brand"><img src="icons/icon-192-v2.png" alt="">
  <h1 class="ordbild"><span class="wordmark">DRIV</span><span class="slogan">Ditt mål. <em>Ditt driv.</em></span></h1></div>`;
const stepTop = (n, back, label) => `<div class="row between steptop"><button class="backbtn" ${back}>${icon("left", 18)}${label}</button><span class="muted small">Steg ${n} av 3</span></div>
  <div class="stepbar" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</div>`;

function welcomeView() {
  const pt = (ic, t, s) => `<div class="wpoint"><span class="wic">${icon(ic, 20)}</span><span><b>${t}</b><span class="muted small">${s}</span></span></div>`;
  return `<div class="welcome">
    <div class="welcome-glow" aria-hidden="true"></div>
    ${brandBig()}
    <div class="wpoints">${pt("trana", "Träna efter ett upplägg", "Passen, vikterna och vad som är nästa")}
      ${pt("kost", "Håll koll på maten", "Ett kalorimål som passar dig")}
      ${pt("vanner", "Peppa varandra", "Se när vännerna har tränat")}</div>
    <div class="welcome-cta"><button class="primary wide bigbtn" data-onb="1">Kom igång</button>
      ${sbEnabled ? `<button class="wide bigbtn" data-welcomelogin="login">Jag har redan ett konto</button>` : ""}
      <span class="muted small">Tar ungefär en minut. Allt går att ändra sen.</span></div></div>`;
}

// Inloggning: e-post, sedan koden från mejlet. Kontot har allt man loggat.
function loginView() {
  const a = account;
  const msg = a.msg ? `<div class="muted small loginmsg">${esc(a.msg)}</div>` : "";
  if (a.step === "code") {
    return `<div class="login"><button class="backbtn" data-changeemail>${icon("left", 18)}Byt e-post</button>
      <span class="loginic">${icon("mail", 26)}</span>
      <h1>Kolla din mejl</h1>
      <div class="muted lead">Vi har skickat en kod till <b class="strong">${esc(a.email)}</b>. Skriv in den här, eller tryck på länken i mejlet.</div>
      <input id="acctcode" class="codefield" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="Kod från mejlet" aria-label="Kod från mejlet">
      <div class="row between muted small"><span>Ingen kod? Kolla skräpposten.</span><button class="linkbtn2" data-sendcode ${a.busy ? "disabled" : ""}>Skicka igen</button></div>
      ${msg}
      <div class="login-cta"><button class="primary wide bigbtn" data-verifycode ${a.busy ? "disabled" : ""}>Logga in</button>
        <span class="muted small">Har kontot inget upplägg än får du välja ett först.</span></div></div>`;
  }
  return `<div class="login"><button class="backbtn" data-welcomelogin="">${icon("left", 18)}Tillbaka</button>
    <img class="loginlogo" src="icons/icon-192-v2.png" alt="">
    <h1>Välkommen tillbaka</h1>
    <div class="muted lead">Skriv e-posten du använde, så skickar vi en kod. Inget lösenord behövs.</div>
    <label class="field">E-post<input id="acctemail" type="email" autocomplete="email" placeholder="din@epost.se" value="${esc(a.email)}"></label>
    <div class="muted small" style="margin:8px 4px 0">Din e-post används bara för att logga in, aldrig för reklam.</div>
    <div class="note">${icon("data", 20)}<span class="muted">Allt du loggat finns på kontot: upplägg, pass, mat och vänner. Det följer med till alla enheter du loggar in på.</span></div>
    ${msg}
    <div class="login-cta"><button class="primary wide bigbtn" data-sendcode ${a.busy ? "disabled" : ""}>Skicka kod</button>
      <span class="muted small">Inget konto än? <button class="link" data-welcomelogin="" data-onb="1">Kom igång</button></span></div></div>`;
}

// Inloggad men utan sparat upplägg: ett besked överst i stegen
function accountNote() {
  if (account.step !== "in") return "";
  return `<div class="card note-card"><b>Inloggad som ${esc(account.email)}.</b> <span class="muted">${cloud.status === "cloud" ? "Kontot har inget sparat upplägg än. Välj ett här, så sparas det på kontot."
    : cloud.status === "error" ? "Kunde inte hämta från kontot. Ladda om sidan." : "Hämtar från kontot…"}</span></div>`;
}

const progTiles = sel => `<div class="progtiles">${Object.entries(PROGRAMS).filter(([id]) => id !== "eget").map(([id, pr]) =>
  `<button class="progtile ${sel === id ? "on" : ""}" data-prog="${id}" aria-pressed="${sel === id}"><b>${pr.name}</b><span>${pr.best} pass</span></button>`).join("")}</div>
  <button class="progtile own ${sel === "eget" ? "on" : ""}" data-prog="eget" aria-pressed="${sel === "eget"}"><span class="plusic">${icon("plus", 18)}</span>
    <span class="grow col"><b>Eget upplägg</b><span class="muted small">Döp passen och välj övningar själv</span></span></button>`;

function daysPicker() {
  const n = draft.count, fixed = draft.mode === "fixed", ok = draftOk();
  const sorted = draft.weekdays.slice().sort((a, b) => a - b);
  const plan = fixed && ok ? sorted.map((wd, i) => `${WD_LONG[wd]} ${esc(draft.days[i].name)}`).join(", ") : "";
  return `<div class="seg two">
      <button data-mode="flex" class="${fixed ? "" : "on"}" aria-pressed="${!fixed}"><b>Olika dagar</b><span>Nästa pass i tur, när du har tid</span></button>
      <button data-mode="fixed" class="${fixed ? "on" : ""}" aria-pressed="${fixed}"><b>Fasta dagar</b><span>Varje pass har en veckodag</span></button></div>
    ${fixed ? `<div class="card wdcard"><div class="seg wd">${WD.map((name, i) => `<button data-wd="${i}" class="${draft.weekdays.includes(i) ? "on" : ""}" aria-pressed="${draft.weekdays.includes(i)}" aria-label="${cap(WD_LONG[i])}">${name[0]}</button>`).join("")}</div>
      <div class="muted small">${ok ? `<span class="oktext">${icon("check", 14)}</span> ${cap(plan)}` : `Välj ${n} dagar (${draft.weekdays.length} valda)`}</div></div>`
      : `<div class="muted small daysnote">Appen föreslår nästa pass i ordningen när du tränar, vilken dag det än är.</div>`}`;
}

function onbView() {
  ensureDraft();
  const pr = PROGRAMS[draft.program], n = draft.count;
  if (onb === 1) return `${stepTop(1, 'data-onb="0"', "Tillbaka")}${accountNote()}
    <h1>Hur vill du träna?</h1><div class="muted lead">Välj ett färdigt program. Övningarna är redan ifyllda.</div>
    ${progTiles(draft.program)}
    <div class="stepcta"><button class="primary wide bigbtn" data-onb="2">Nästa</button></div>`;
  if (onb === 2) return `${stepTop(2, 'data-onb="1"', "Program")}
    <h1>Hur ofta?</h1><div class="muted lead">${draft.program === "eget" ? "Hur många pass vill du ha i veckan?" : `${pr.name} är gjort för ${pr.best} pass i veckan.`}</div>
    <div class="klabel sechead">Pass i veckan</div>
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
    <h1>Upplägg</h1>
    <section class="card progcard" aria-label="Ditt program">
      <div class="row between"><span class="klabel accent">Ditt program</span><button class="linkbtn2" data-progtoggle aria-expanded="${progOpen}">${progOpen ? "Stäng" : "Byt program"}${icon(progOpen ? "up" : "right", 14)}</button></div>
      <div class="progname">${esc(pr.name)}</div>
      <div class="muted small">${esc(pr.info)}</div>
      <div class="chips passchips">${draft.days.map(d => `<span class="chip">${esc(d.name)}</span>`).join("")}</div></section>
    ${progOpen ? `<div class="progpick">${progTiles(draft.program)}</div>` : ""}
    <div class="utiles">
      <div class="card utile"><span class="klabel">Pass i veckan</span><b class="unum">${n}</b>
        <span class="row"><button class="grow" data-count="${n - 1}" ${n > c[0] ? "" : "disabled"} aria-label="Färre pass">${icon("minus", 18)}</button>
          <button class="grow" data-count="${n + 1}" ${n < c[c.length - 1] ? "" : "disabled"} aria-label="Fler pass">${icon("plus", 18)}</button></span></div>
      <button class="card utile" data-daysopen aria-expanded="${daysOpen}"><span class="row between"><span class="klabel">Dagar</span><span class="accenttext small">${daysOpen ? "Stäng" : "Ändra"}</span></span>
        <b class="uday">${fixed ? "Fasta dagar" : "Olika dagar"}</b>
        <span class="udots" aria-label="${fixed ? draft.weekdays.slice().sort((a, b) => a - b).map(i => WD_LONG[i]).join(", ") : "Nästa pass i tur"}">${WD.map((w, i) => `<i class="${fixed && draft.weekdays.includes(i) ? "on" : ""}">${w[0]}</i>`).join("")}</span></button></div>
    ${daysOpen || (fixed && !draftOk()) ? `<div class="dayspick">${daysPicker()}</div>` : ""}
    <div class="muted small finish-note">Övningarna ändrar du i varje pass under Träna.</div>
    <button class="primary wide bigbtn" data-savesetup ${draftOk() ? "" : "disabled"}>Spara upplägg</button>`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-onb],[data-daysopen]");
  if (!t || t.disabled) return;
  if (t.dataset.daysopen !== undefined) daysOpen = !daysOpen;
  else { onb = +t.dataset.onb; progOpen = false; }
  render();
  window.scrollTo(0, 0);
});

"use strict";
// ---------- Dailys: Dag, Vecka och Upplägg ----------
// Dag och Vecka visar och bockar av; inget ändras där. Allt ändras på ett ställe, Upplägg, i tre steg:
// 1 Varje dag (övningar och kosttillskott som alltid är med), 2 Rutiner, 3 Veckan (fasta dagar eller turordning).
// Upplägg är sidan rutPage; rutOpen är den rutin ("daily", "supp" eller rutinens id) som är öppen.
// Laddas efter rutiner.js och före app.js.

let dlView = "dag";   // "dag" eller "vecka"
let dlShowList = false;
let dlEditing = false;   // Dag: läget där övningar läggs till och tas bort
let dlAhead = false;     // i det läget: ändringen gäller även framåt (annars bara idag)   // när dagen är klar visas en sammanfattning; listan bara när man vill ändra
let dlWeek = null;    // måndagen i veckan som visas under Vecka (null = den här veckan)
let plSel = null;     // rutinen man lägger ut på veckans dagar ("" är vila)
let uxOpen = null;    // övningen som är utfälld på en rutins sida (index)
let upInfo = null;    // steget vars förklaring (i) är utfälld

const RUT_COLORS = ["#ff8a47", "#5aa7f0", "#4cc583", "#b49cff", "#f0c04c", "#ec6a8e"];
// Varje rutin behåller sin färg även när ordningen ändras: den får första lediga färgen och sparar den
function rutColor(r) {
  if (!r.color) {
    const used = dailyRoutines().map(x => x.color).filter(Boolean);
    r.color = RUT_COLORS.find(c => !used.includes(c)) || RUT_COLORS[dailyRoutines().indexOf(r) % RUT_COLORS.length];
  }
  return r.color;
}
// Bokstaven i veckan: "Mage A" → A, "Rörlighet" → R
function rutLetter(r) {
  const w = r.name.trim().split(/\s+/), last = w[w.length - 1];
  return (w.length > 1 && last.length === 1 ? last : w[0].charAt(0)).toUpperCase();
}

// Veckoschema: S.dailyWeek har en rutin per veckodag (måndag först), "" är vila (bara Varje dag)
const weekNow = () => rutMode() === "week" ? (S.dailyWeek || []).slice(0, 7).concat(Array(7).fill("")).slice(0, 7)
  : weekDates(weekStart(TODAY)).map(d => { const r = routinePlanned(d); return r ? r.id : ""; });
function saveWeek(arr) {
  const old = weekNow();
  S.dailyMode = "week"; S.dailyWeek = arr.slice(0, 7);
  // Dagar som planeras om släpper ett eget byte för dagen, så att det nya syns direkt
  weekDates(weekStart(TODAY)).forEach((d, i) => { if (d >= TODAY && old[i] !== arr[i] && S.log[d] && S.log[d].dailyRoutine) delete S.log[d].dailyRoutine; });
}
// Äldre sätt (välj själv, varannan dag) blir ett veckoschema med samma rutiner som de skulle ha gett
function uppMigrate() {
  if (dailyRoutines().length && rutMode() !== "week" && rutMode() !== "rotate") saveWeek(weekNow());
}
const daysOf = r => rutMode() === "week" ? weekNow().map((id, i) => id === r.id ? WD_LONG[i] : "").filter(Boolean) : [];
const listNames = (arr, f) => arr.length ? arr.map(f).join(", ") : "";

// ---------- Dag ----------
const dlToggle = () => `<div class="dl-top"><div class="dl-tg" role="tablist" aria-label="Visa">${[["dag", "Dag"], ["vecka", "Vecka"]].map(([k, l]) =>
  `<button role="tab" data-dlview="${k}" class="${dlView === k ? "on" : ""}" aria-selected="${dlView === k}">${l}</button>`).join("")}</div>
  <button class="dl-upp" data-rutpage aria-label="Upplägg">${icon("upplagg", 20)}</button></div>`;

function dlDayView() {
  const date = logDate(), ex = dailyList(date), rut = routineOn(date), a = S.supplements || [];
  const n = ex.filter(e => dailyDone(date, e.id)).length, next = ex.find(e => !dailyDone(date, e.id));
  const col = rut ? rutColor(rut) : "var(--accent-strong)", wd = weekdayOf(date);
  const when = `${date === TODAY ? "Idag · " : ""}${cap(WD_LONG[wd])} ${+date.slice(-2)}`;
  const row = e => {
    const ok = dailyDone(date, e.id), x = EX[e.id];
    if (dlEditing) return `<div class="dl-row dl-erow">${thumb(e.id, "dl-f")}
      <span class="grow dl-name"><b>${esc(x.name)}</b><small>${e.sets} × ${esc(e.reps || "")}</small></span>
      <button class="dl-minus" data-dldrop="${e.id}" aria-label="Ta bort ${esc(x.name)}">${icon("close", 18)}</button></div>`;
    return `<div class="dl-row ${ok ? "ok" : ""}">${thumb(e.id, "dl-f")}<span class="grow dl-name"><b>${esc(x.name)}</b><small>${e.sets} × ${esc(e.reps || "")}</small></span>
      ${!ok && e === next && !isRun(e.id) ? `<button class="dl-play" data-dclockstart="${e.id}" aria-label="Starta ${esc(x.name)}">${icon("play", 18)}</button>` : ""}
      <button class="dl-ck ${ok ? "on" : ""}" data-dcheck="${e.id}" aria-pressed="${ok}" aria-label="${esc(x.name)} klar">${icon("check", 20)}</button></div>`;
  };
  const pills = a.map(x => {
    const ok = !!(S.log[date] && S.log[date].dailies["supp:" + x.id]);
    return `<button class="dl-pill ${ok ? "on" : ""}" data-suppcheck="${esc(x.id)}" aria-pressed="${ok}"><span class="dl-pc">${ok ? icon("check", 14) : ""}</span>${esc(x.name)}${x.dose ? ` <small>${esc(x.dose)}</small>` : ""}</button>`;
  }).join("");
  // Allt gjort (övningar och kosttillskott): en sammanfattning i stället för listan med bockar.
  // Listan går att fälla ut för att ångra eller ändra.
  const aDone = a.filter(x => S.log[date] && S.log[date].dailies["supp:" + x.id]).length;
  const allOk = ex.length + a.length > 0 && n === ex.length && aDone === a.length;
  const head = `<div class="dl-h"><div class="grow"><span class="dl-k"><i style="background:${col}"></i>${when}</span><b>${rut ? esc(rut.name) : "Dagens dailys"}</b></div>
      ${dlEditing ? `<button class="dl-done2" data-dledit2>Klar</button>` : `${dailyRoutines().length && !allOk ? `<button class="linkbtn2 dl-byt" data-rutsheet="1">Byt rutin</button>` : ""}
`}</div>
    ${dlEditing ? `<div class="dl-when" role="radiogroup" aria-label="Gäller"><button role="radio" data-dlahead="false" class="${dlAhead ? "" : "on"}" aria-checked="${!dlAhead}">Bara idag</button><button role="radio" data-dlahead="true" class="${dlAhead ? "on" : ""}" aria-checked="${dlAhead}">Även framåt</button></div>` : ""}`;
  const list = `${ex.length ? `<div class="dl-rows">${ex.map(row).join("")}</div>${!dlEditing ? `<button class="dl-editbtn" data-dledit2>${icon("edit", 16)}Ändra övningar</button>` : ""}${dlEditing ? `<button class="dl-row dl-erow dl-addrow" data-openpick="dag:${date}" data-dlahead="${dlAhead}"><span class="dl-pf">${icon("plus", 20)}</span><span class="grow dl-name"><b>Lägg till övning</b><small>${dlAhead ? "Även framåt" : "Bara idag"}</small></span></button>` : ""}`
      : `<div class="dl-empty"><b>${hasDailies() ? "Ingen rutin idag" : "Inga dailys än"}</b><button class="linkbtn2" data-rutpage>Ställ in under Upplägg${icon("right", 14)}</button></div>`}
    ${a.length ? `<div class="klabel dl-sec">Kosttillskott</div><div class="dl-pills">${pills}</div>` : ""}`;
  if (allOk && !dlEditing) {
    const st = streakOf(allDailiesDone), ws = weekStart(date);
    const greet = date !== TODAY ? "Dagen var klar" : st >= 7 ? "Grymt, en hel vecka i rad!" : st >= 3 ? "Bra jobbat, du är i farten!" : "Bra jobbat idag!";
    const week = weekDates(ws).map((d, i) => { const ok = allDailiesDone(d) && (S.supplements || []).every(x => S.log[d] && S.log[d].dailies["supp:" + x.id]);
      return `<span class="ds-d ${ok ? "ok" : ""} ${d === date ? "t" : ""} ${d > TODAY ? "f" : ""}"><i>${ok ? icon("check", 12) : ""}</i>${WD[i][0]}</span>`; }).join("");
    return `<div class="dl-sum" role="status">
      <div class="ds-burst" aria-hidden="true">${icon("check", 40)}</div>
      <h2 class="ds-h">${greet}</h2>
      <p class="ds-sub">${rut ? `${esc(rut.name)} · ` : ""}${when.replace("Idag · ", "")}</p>
      <div class="ds-stats">
        ${ex.length ? `<div><b>${ex.length}</b><span>${ex.length === 1 ? "övning" : "övningar"}</span></div>` : ""}
        ${a.length ? `<div><b>${a.length}</b><span>kosttillskott</span></div>` : ""}
        <div><b>${st}</b><span>${st === 1 ? "dag i rad" : "dagar i rad"}</span></div></div>
      <div class="ds-figs">${ex.slice(0, 6).map(e => `<span>${figure(e.id)}</span>`).join("")}</div>
      <div class="ds-week">${week}</div>
      <button class="ds-more" data-dllist aria-expanded="${dlShowList}">${dlShowList ? "Dölj" : "Visa eller ändra"} dagens dailys${icon(dlShowList ? "up" : "down", 16)}</button></div>
      ${dlShowList ? `<div class="dl-allok">${list}</div>` : ""}`;
  }
  return `<div>${head}
    ${ex.length && !dlEditing ? `<div class="dl-p dlx-prog" style="--pc:${col}"><span>${ex.map(e => `<i class="${dailyDone(date, e.id) ? "on" : ""}"></i>`).join("")}</span><small>${n} av ${ex.length} klara</small></div>` : ""}
    ${list}</div>`;
}

// ---------- Vecka ----------
function dlWeekView() {
  const cur = weekStart(TODAY), ws = dlWeek && dlWeek < cur ? dlWeek : cur, dates = weekDates(ws), a = S.supplements || [], every = (S.daily || []).filter(e => EX[e.id]);
  const rs = dates.map(d => routineOn(d)), used = dailyRoutines().filter(r => rs.includes(r));
  const cell = (d, inner) => `<span class="wk-c ${d === TODAY ? "t" : ""}">${inner}</span>`;
  const dot = (d, ok, col) => ok ? `<i class="wk-d ok" style="--pc:${col}"></i>` : d < TODAY ? `<i class="wk-d x"></i>` : `<i class="wk-d p" style="--pc:${col}"></i>`;
  // Dagar som varit (och idag) går att bocka av i efterhand; kommande dagar visas bara
  const mark = (d, ok, col, key, name) => d > TODAY ? dot(d, ok, col)
    : `<button class="wk-hit" data-wkck="${d}" data-wkid="${esc(key)}" aria-pressed="${ok}" aria-label="${esc(name)} ${dateLabel(d)}: ${ok ? "gjort" : "inte gjort"}">${dot(d, ok, col)}</button>`;
  const head = `<div class="wk-r wk-hd"><span></span>${dates.map((d, i) => { const r = rs[i];
    return `<span class="wk-c wk-day ${d === TODAY ? "t" : ""}" aria-label="${cap(WD_LONG[i])}: ${r ? esc(r.name) : "ingen rutin"}">
      <small>${WD[i].slice(0, 3)}</small><b>${+d.slice(-2)}</b><span class="wk-tag ${r ? "" : "v"}" style="${r ? `background:${rutColor(r)}` : ""}">${r ? esc(rutLetter(r)) : "–"}</span></span>`; }).join("")}</div>`;
  const group = (name, col, list, on) => `<div class="wk-r"><span class="wk-g"><i style="background:${col}"></i>${esc(name)}</span></div>
    ${list.filter(e => EX[e.id]).map(e => `<div class="wk-r"><span class="wk-n"><span class="wk-f" aria-hidden="true">${figure(e.id)}</span><span>${esc(EX[e.id].name)}</span></span>${dates.map((d, i) =>
      cell(d, on(i) ? mark(d, dailyDone(d, e.id), col, e.id, EX[e.id].name) : "")).join("")}</div>`).join("")}`;
  const groups = (every.length ? group("Varje dag", "var(--text)", every, () => true) : "")
    + used.map(r => group(r.name, rutColor(r), r.ex, i => rs[i] === r)).join("");
  const supp = a.map(x => `<div class="wk-r"><span class="wk-n wk-sn">${esc(x.name)}</span>${dates.map(d =>
    cell(d, mark(d, !!(S.log[d] && S.log[d].dailies && S.log[d].dailies["supp:" + x.id]), "var(--ok)", "supp:" + x.id, x.name))).join("")}</div>`).join("");
  return `<div class="row between dl-wnav"><button class="iconbtn small ghost" data-dlweek="-7" aria-label="Veckan före">${icon("left", 18)}</button>
      <span class="dl-wsub"><b>Vecka ${weekNo(ws)}</b>${ws === cur ? " · den här veckan" : ` · ${shortDate(ws)}–${shortDate(dates[6])}`}</span>
      <button class="iconbtn small ghost" data-dlweek="7" ${ws === cur ? "disabled" : ""} aria-label="Veckan efter">${icon("right", 18)}</button></div>
    <section class="wk-tbl">${head}${groups || `<div class="wk-none muted small">Inga dailys än. Ställ in dem under Upplägg.</div>`}</section>
    ${a.length ? `<section class="wk-tbl wk-supp"><div class="wk-sh"><span class="klabel">Kosttillskott</span></div>${supp}</section>` : ""}
    <div class="muted small wk-hint">Missat något? Tryck på pricken för att bocka av i efterhand.</div>
    <div class="wk-key"><span><i class="wk-d ok" style="--pc:var(--ok)"></i>Gjort</span><span><i class="wk-d p" style="--pc:var(--text)"></i>Planerat</span><span><i class="wk-d x"></i>Missat</span></div>`;
}

// ---------- Upplägg ----------
const UP_INFO = {
  1: "Övningar och kosttillskott som du gör varje dag, oavsett vilken rutin dagen har. De behöver inte planeras.",
  2: "En rutin är en grupp övningar som hör ihop, till exempel Mage A eller Rörlighet. Har du flera rutiner kan olika dagar få olika övningar. Vilken dag som får vilken rutin väljer du i steg 3.",
  3: "Fasta dagar: varje veckodag har sin rutin, likadant varje vecka. Turordning: rutinerna kommer en per dag i ordning och fortsätter in i nästa vecka. Vila betyder ingen rutin den dagen, men Varje dag är fortfarande med.",
};
const upStep = (n, title, sub, dim) => `<div class="up-st ${dim ? "dim" : ""}"><span class="up-n">${n}</span>${title}
  <button class="up-i ${upInfo === n ? "on" : ""}" data-upinfo="${n}" aria-expanded="${upInfo === n}" aria-label="Mer om ${title}">i</button>${sub ? `<small>${sub}</small>` : ""}</div>
  ${upInfo === n ? `<div class="up-info">${UP_INFO[n]}</div>` : ""}`;
const figs = list => `<span class="up-fg">${list.filter(e => EX[e.id]).slice(0, 3).map(e => `<span>${figure(e.id)}</span>`).join("")}</span>`;

function uppView() {
  if (rutOpen) return uppDetail();
  const L = dailyRoutines(), every = (S.daily || []).filter(e => EX[e.id]), a = S.supplements || [], m = rutMode();
  const nameForm = `<form class="rutname" data-rutform="new"><input name="n" maxlength="40" required placeholder="T.ex. Mage A" aria-label="Rutinens namn"><button class="small primary" type="submit">Spara</button><button class="small ghost" type="button" data-rutcancel>Avbryt</button></form>`;
  const rows = L.map((r, i) => `<div class="up-li rutrow" data-rutidx="${i}">${m === "rotate" && L.length > 1 ? `<span class="rutgrip" data-rutdrag="${i}" aria-label="Dra för att flytta ${esc(r.name)}">${icon("list", 18)}</span>` : ""}
      <button class="up-lib" data-rutopen="${esc(r.id)}"><i style="background:${rutColor(r)}"></i><b>${esc(r.name)}</b><small>${r.ex.length} ${r.ex.length === 1 ? "övning" : "övningar"}</small>${icon("right", 18)}</button></div>`).join("");
  if (plSel === null || (plSel && !L.some(r => r.id === plSel))) plSel = L.length ? L[0].id : "";
  const dates = weekDates(weekStart(TODAY)), wk = weekNow();
  const tile = (id, i, btn) => { const r = routineById(id);
    return `<${btn ? `button data-plday="${i}"` : "span"} class="up-dy ${dates[i] === TODAY ? "t" : ""}" aria-label="${cap(WD_LONG[i])}: ${r ? esc(r.name) : "vila"}"><small>${WD[i].slice(0, 3)}</small>
      <span class="up-s ${r ? "" : "v"}" style="${r ? `--rc:${rutColor(r)}` : ""}">${r ? esc(rutLetter(r)) : "Vila"}</span></${btn ? "button" : "span"}>`; };
  const week = m === "rotate"
    ? `<div class="muted small up-note">En rutin per dag i ordningen i steg 2. Fortsätter in i nästa vecka. Dra i ≡ för att ändra ordningen.</div>
       <div class="up-days">${dates.map((d, i) => tile((routinePlanned(d) || {}).id || "", i, false)).join("")}</div>`
    : `<div class="up-pick">${L.map(r => `<button class="${plSel === r.id ? "on" : ""}" data-plsel="${esc(r.id)}" aria-pressed="${plSel === r.id}"><i style="background:${rutColor(r)}"></i>${esc(rutLetter(r))}</button>`).join("")}
         <button class="${plSel === "" ? "on" : ""}" data-plsel="" aria-pressed="${plSel === ""}">Vila</button></div>
       <div class="up-days">${wk.map((id, i) => tile(id, i, true)).join("")}</div>
       <div class="up-fill"><span class="muted small">Fyll i:</span><button class="linkbtn2" data-plfill="turn">Turordning</button><button class="linkbtn2" data-plfill="same">Samma alla dagar</button></div>`;
  return `<div class="dlx up"><button class="backbtn" data-rutback>${icon("left", 18)}Dailys</button><h1>Upplägg</h1>
    ${upStep(1, "Varje dag", "alltid med, planeras inte")}
    <section class="up-ev">
      <button class="up-evr" data-rutopen="daily"><span class="up-k">Övningar</span><span class="grow">${every.length ? `<b>${esc(listNames(every, e => EX[e.id].name))}</b>` : `<b class="up-add">+ Lägg till</b>`}</span>${every.length ? figs(every) : ""}${icon("right", 18)}</button>
      <button class="up-evr" data-rutopen="supp"><span class="up-k">Kosttillskott</span><span class="grow">${a.length ? `<b>${esc(listNames(a, x => x.dose ? `${x.name} ${x.dose}` : x.name))}</b>` : `<b class="up-add">+ Lägg till</b>`}</span>${icon("right", 18)}</button></section>
    ${upStep(2, "Rutiner", L.length ? "olika övningar olika dagar" : "valfritt")}
    <section class="up-list rutlist">${rows}${rutRename === "new" ? `<div class="up-li">${nameForm}</div>` : `<button class="up-li up-new" data-rutnew>+ Ny rutin</button>`}</section>
    ${upStep(3, "Veckan", L.length ? "vilken rutin när" : "", !L.length)}
    ${L.length ? `<div class="seg two up-mode" role="radiogroup" aria-label="Hur rutinerna läggs ut">
        <button role="radio" data-uppmode="week" class="${m !== "rotate" ? "on" : ""}" aria-checked="${m !== "rotate"}">Fasta dagar</button>
        <button role="radio" data-uppmode="rotate" class="${m === "rotate" ? "on" : ""}" aria-checked="${m === "rotate"}">Turordning</button></div>
      <section class="up-wk">${week}</section>`
      : `<div class="up-empty">Skapa en rutin först, till exempel Mage A. Sen lägger du ut den på veckans dagar.</div>`}</div>`;
}

// En rutin, Varje dag eller Kosttillskott
function uppDetail() {
  const id = rutOpen;
  if (id === "supp") {
    const a = S.supplements || [];
    return `<div class="dlx up"><button class="backbtn" data-rutback>${icon("left", 18)}Upplägg</button><h1>Kosttillskott</h1>
      <div class="muted up-sub">Tas varje dag. Bockas av under Dag.</div>
      <section class="up-list">${a.map((x, i) => `<button class="up-li up-lib" data-suppedit="${i}"><b>${esc(x.name)}</b><small>${esc(x.dose || "")}</small>${icon("right", 18)}</button>`).join("")}
        ${supplementEditing === null ? `<button class="up-li up-new" data-suppadd>+ Lägg till kosttillskott</button>` : ""}</section>
      ${supplementForm()}</div>`;
  }
  const r = id === "daily" ? null : routineById(id);
  if (id !== "daily" && !r) { rutOpen = null; return uppView(); }
  const target = r ? "rut:" + r.id : "daily", list = r ? r.ex : (S.daily || (S.daily = []));
  const days = r ? daysOf(r) : [], m = rutMode();
  const sub = !r ? "Görs alla dagar, oavsett rutin." : m === "rotate" ? "Ingår i turordningen." : days.length ? `Körs ${days.join(", ").replace(/, ([^,]*)$/, " och $1")}.` : "Ligger inte i veckan än.";
  const nameForm = `<form class="rutname" data-rutform="${esc(r ? r.id : "")}"><input name="n" maxlength="40" required value="${esc(r ? r.name : "")}" aria-label="Rutinens namn"><button class="small primary" type="submit">Spara</button><button class="small ghost" type="button" data-rutcancel>Avbryt</button></form>`;
  const delText = r && rutDelArm === r.id ? (days.length ? `Ligger på ${days.join(", ")}, som blir vila. Tryck igen för att ta bort` : "Tryck igen för att ta bort") : "Ta bort";
  const rows = list.map((e, i) => {
    if (!EX[e.id]) return "";
    const open = uxOpen === i;
    return `<div class="ux ${open ? "open" : ""}" data-uxidx="${i}"><div class="ux-r">${list.length > 1 ? `<span class="ux-grip" data-uxdrag="${i}" data-t="${target}" aria-label="Dra för att flytta ${esc(EX[e.id].name)}">${icon("list", 18)}</span>` : ""}
        <button class="ux-main" data-uxopen="${i}" aria-expanded="${open}"><span class="ux-f">${figure(e.id)}</span><span class="grow"><b>${esc(EX[e.id].name)}</b><small>${e.sets} × ${esc(e.reps || "")}</small></span></button></div>
      ${open ? `<div class="ux-ed"><div class="ux-st"><span>Set</span><span class="ux-stp"><button data-uxsets="-1" data-t="${target}" data-idx="${i}" aria-label="Färre set">${icon("minus", 16)}</button><b>${e.sets}</b><button data-uxsets="1" data-t="${target}" data-idx="${i}" aria-label="Fler set">${icon("plus", 16)}</button></span></div>
        <div class="ux-st"><span>Reps eller tid</span><input type="text" inputmode="numeric" value="${esc(e.reps || "")}" data-ed="${i}" data-t="${target}" data-f="reps" aria-label="Reps"></div>
        <div class="ux-acts"><button data-swap="${target}" data-idx="${i}">Byt övning</button><button class="ux-del" data-xdel="${target}" data-idx="${i}">Ta bort</button></div></div>` : ""}</div>`;
  }).join("");
  return `<div class="dlx up"><button class="backbtn" data-rutback>${icon("left", 18)}Upplägg</button>
    <div class="up-dh">${r ? `<span class="up-tag" style="background:${rutColor(r)}">${esc(rutLetter(r))}</span>` : `<span class="up-tag every">${icon("check", 16)}</span>`}
      ${r && rutRename === r.id ? nameForm : `<h1>${r ? esc(r.name) : "Varje dag"}</h1>`}
      ${r ? `<button class="up-more" data-rutmenu="${esc(r.id)}" aria-label="Fler val för ${esc(r.name)}">⋯</button>` : ""}</div>
    ${r && rutMenu === r.id ? `<div class="rutmenu"><button class="small" data-rutren="${esc(r.id)}">Byt namn</button><button class="small" data-rutcopy="${esc(r.id)}">Kopiera</button>
      <button class="small ${rutDelArm === r.id ? "dangerbtn" : ""}" data-rutdel="${esc(r.id)}">${delText}</button></div>` : ""}
    <div class="muted up-sub">${sub}</div>
    <section class="uxlist">${rows || `<div class="muted small up-none">Inga övningar än.</div>`}</section>
    <button class="up-li up-new up-addex" data-openpick="${target}">+ Lägg till övning</button></div>`;
}

function dailysPage() {
  return `<div class="dlx"><h1>Dailys</h1>${dlToggle()}${dlView === "vecka" ? dlWeekView() : dlDayView()}
    ${rutinSheet()}</div>`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-dledit2],[data-dlahead]:not([data-openpick]),[data-dldrop],[data-dllist],[data-dlweek],[data-wkck],[data-upinfo],[data-dlview],[data-plsel],[data-plday],[data-plfill],[data-uppmode],[data-uxopen],[data-uxsets]");
  if (!t) return;
  const ds = t.dataset;
  ev.stopImmediatePropagation();
  if (ds.dledit2 !== undefined) { dlEditing = !dlEditing; dlAhead = false; }
  else if (ds.dlahead !== undefined) dlAhead = ds.dlahead === "true";
  else if (ds.dldrop) {
    // Ta bort bara idag (dagen minns det), eller även framåt (ur rutinen och Varje dag); en tillagd-bara-idag tas bort ur dagen
    const date = logDate(), L = day(date), id = ds.dldrop, name = EX[id].name;
    if (L.dailyAdd && L.dailyAdd.some(e => e.id === id)) L.dailyAdd = L.dailyAdd.filter(e => e.id !== id);
    if (!dlAhead) { if (dailyList(date).some(e => e.id === id)) (L.dailyDrop = L.dailyDrop || []).push(id); }
    else { const r = routineOn(date); for (const list of [S.daily || [], r ? r.ex : []]) { const i = list.findIndex(e => e.id === id); if (i >= 0) list.splice(i, 1); } }
    save(); toast(`${name} borttagen ${dlAhead ? "även framåt" : "bara idag"}`);
  }
  else if (ds.dllist !== undefined) dlShowList = !dlShowList;
  else if (ds.dlweek) { const cur = weekStart(TODAY), n = shift(dlWeek || cur, +ds.dlweek); dlWeek = n >= cur ? null : n; }
  else if (ds.wkck) {
    // Bocka av eller ångra en dag i efterhand; dagen minns vilken rutin den hade
    const L = day(ds.wkck), id = ds.wkid, r = routineOn(ds.wkck);
    if (r && !L.dailyRoutine && dailyRoutines().length) L.dailyRoutine = r.id;
    L.dailies[id] = id.startsWith("supp:") ? !L.dailies[id] : !dailyDone(ds.wkck, id);
    save();
  }
  else if (ds.upinfo) upInfo = upInfo === +ds.upinfo ? null : +ds.upinfo;
  else if (ds.dlview) { dlView = ds.dlview; dlWeek = null; rutPage = false; rutOpen = null; }
  else if (ds.plsel !== undefined) plSel = ds.plsel;
  else if (ds.plday !== undefined) { const w = weekNow(); w[+ds.plday] = plSel; saveWeek(w); save(); }
  else if (ds.plfill) {
    const L = dailyRoutines().map(r => r.id);
    if (L.length) { saveWeek(Array.from({ length: 7 }, (_, i) => ds.plfill === "same" ? (plSel || L[0]) : L[i % L.length])); save(); }
  }
  else if (ds.uppmode === "week") { if (rutMode() !== "week") { saveWeek(weekNow()); save(); } }
  else if (ds.uppmode === "rotate") {
    const cur = routineOn(TODAY) || dailyRoutines()[0];
    S.dailyMode = "rotate"; if (cur) S.dailyAnchor = { date: TODAY, id: cur.id }; save();
  }
  else if (ds.uxopen !== undefined) uxOpen = uxOpen === +ds.uxopen ? null : +ds.uxopen;
  else if (ds.uxsets) { const e = exList(ds.t)[+ds.idx]; e.sets = Math.max(1, Math.min(10, (+e.sets || 1) + +ds.uxsets)); save(); }
  render();
}, true);

// Dra i ≡ för att ändra ordningen på övningarna; de andra raderna glider undan
(() => {
  let drag = null;
  document.addEventListener("pointerdown", ev => {
    const h = ev.target.closest && ev.target.closest("[data-uxdrag]");
    if (!h) return;
    const rows = [...document.querySelectorAll(".uxlist .ux")], from = +h.dataset.uxdrag, el = rows[from];
    if (!el) return;
    drag = { from, to: from, y0: ev.clientY, rows, el, t: h.dataset.t, tops: rows.map(r => r.getBoundingClientRect()), id: ev.pointerId };
    el.classList.add("dragging");
    h.setPointerCapture && h.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });
  document.addEventListener("pointermove", ev => {
    if (!drag || ev.pointerId !== drag.id) return;
    const dy = ev.clientY - drag.y0, { from, rows, tops } = drag, h = tops[from].height + 8;
    drag.el.style.transform = `translateY(${dy}px)`;
    const mid = tops[from].top + tops[from].height / 2 + dy;
    let to = from;
    tops.forEach((r, i) => { if (i < from && mid < r.top + r.height / 2) to = Math.min(to, i); if (i > from && mid > r.top + r.height / 2) to = Math.max(to, i); });
    drag.to = to;
    rows.forEach((r, i) => { if (i === from) return; r.style.transform = i >= to && i < from ? `translateY(${h}px)` : i <= to && i > from ? `translateY(${-h}px)` : ""; });
  });
  const end = ev => {
    if (!drag || ev.pointerId !== drag.id) return;
    const { from, to, rows, t } = drag; drag = null;
    rows.forEach(r => { r.style.transform = ""; r.classList.remove("dragging"); });
    if (to === from) return;
    const L = exList(t); L.splice(to, 0, L.splice(from, 1)[0]); uxOpen = null;
    save(); render();
  };
  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);
})();

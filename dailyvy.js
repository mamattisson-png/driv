"use strict";
let dsPopped = null;   // dagen vars stora bock redan har hoppat in
// ---------- Dailys ----------
// En sida för att bocka av: veckan överst (en ring per dag) och den valda dagens övningar under.
// Grunden är Varje dag; extra för vissa dagar (rutiner i koden) är ett tillägg man väljer själv.
// Allt ändras på ett ställe, Mina dailys (rutPage), där rutOpen är den extra grupp som är öppen.
// Laddas efter rutiner.js och före app.js.

let dlSel = null;     // dagen som visas (null = idag)
let dlShowList = false;
let uxOpen = null;    // övningen som är utfälld (index) i Varje dag eller i en extra grupp

const RUT_COLORS = ["#ff8a47", "#5aa7f0", "#4cc583", "#b49cff", "#f0c04c", "#ec6a8e"];
// Varje rutin behåller sin färg även när ordningen ändras: den får första lediga färgen och sparar den
function rutColor(r) {
  if (!r.color) {
    const used = dailyRoutines().map(x => x.color).filter(Boolean);
    r.color = RUT_COLORS.find(c => !used.includes(c)) || RUT_COLORS[dailyRoutines().indexOf(r) % RUT_COLORS.length];
  }
  return r.color;
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
// "Måndag och torsdag"
const andList = arr => arr.length > 1 ? `${arr.slice(0, -1).join(", ")} och ${arr[arr.length - 1]}` : arr[0] || "";
const daysOf = r => rutMode() === "week" ? weekNow().map((id, i) => id === r.id ? WD_LONG[i] : "").filter(Boolean) : [];

// ---------- Dag ----------
// Ringen runt bocken: en bit per set, de klara gröna. Samma tunna linje som en vanlig bock.
function setRing(got, tot) {
  const r = 18, c = 2 * Math.PI * r, gap = tot > 1 ? 4 : 0, seg = c / tot - gap;
  const arcs = Array.from({ length: tot }, (_, i) => `<circle cx="20" cy="20" r="${r}" fill="none" stroke-width="2.5" stroke-linecap="round" class="${i < got ? "ok" : ""}"
    stroke-dasharray="${seg.toFixed(2)} ${(c - seg).toFixed(2)}" stroke-dashoffset="${(-(i * c / tot) - gap / 2).toFixed(2)}"/>`).join("");
  return `<svg class="dl-ring" viewBox="0 0 40 40" aria-hidden="true">${arcs}</svg>`;
}
function dlDayView() {
  const date = logDate(), ex = dailyList(date), rut = routineOn(date), a = S.supplements || [];
  const n = ex.filter(e => dailyDone(date, e.id)).length, next = ex.find(e => !dailyDone(date, e.id));
  const col = rut ? rutColor(rut) : "var(--accent-strong)", wd = weekdayOf(date);
  const when = `${date === TODAY ? "Idag · " : ""}${cap(WD_LONG[wd])} ${+date.slice(-2)}`;
  const row = e => {
    const ok = dailyDone(date, e.id), x = EX[e.id];
    // Flera set: ringen runt bocken fylls ett set i taget
    const tot = Math.max(1, +e.sets || 1), got = ok ? tot : Math.min(tot - 1, dailySetsDone(date, e.id)), part = !ok && got > 0;
    const ck = tot > 1 && !isRun(e.id) && !ok
      ? `<button class="dl-ck sets ${part ? "part" : ""}" data-dcheck="${e.id}" aria-label="${esc(x.name)}: set ${got + 1} av ${tot} klart">${setRing(got, tot)}${part ? `<b>${got}/${tot}</b>` : ""}</button>`
      : `<button class="dl-ck ${ok ? "on" : ""}" data-dcheck="${e.id}" aria-pressed="${ok}" aria-label="${esc(x.name)} klar">${icon("check", 20)}</button>`;
    return `<div class="dl-row ${ok ? "ok" : ""}">${thumb(e.id, "dl-f")}<span class="grow dl-name"><b>${esc(x.name)}</b><small>${e.sets} × ${esc(e.reps || "")}${part ? ` · ${got} av ${tot} set klara` : ""}</small></span>
      ${!ok && !isRun(e.id) ? `<button class="dl-play ${e === next ? "" : "alt"}" data-dclockstart="${e.id}" aria-label="${part ? "Fortsätt" : "Starta"} ${esc(x.name)}">${icon("play", 18)}</button>` : ""}
      ${ck}</div>`;
  };
  const pills = a.map(x => {
    const ok = !!(S.log[date] && S.log[date].dailies["supp:" + x.id]);
    return `<button class="dl-pill ${ok ? "on" : ""}" data-suppcheck="${esc(x.id)}" aria-pressed="${ok}"><span class="dl-pc">${ok ? icon("check", 14) : ""}</span>${esc(x.name)}${x.dose ? ` <small>${esc(x.dose)}</small>` : ""}</button>`;
  }).join("");
  // Allt gjort (övningar och kosttillskott): en sammanfattning i stället för listan med bockar.
  // Listan går att fälla ut för att ångra eller ändra.
  const aDone = a.filter(x => S.log[date] && S.log[date].dailies["supp:" + x.id]).length;
  const allOk = ex.length + a.length > 0 && n === ex.length && aDone === a.length;
  const head = `<div class="dl-h"><div class="grow"><span class="dl-k">${when} · ${n + aDone} av ${ex.length + a.length} klara</span></div></div>`;
  const list = `${ex.length ? dlGroups(date, ex, rut, row, "dl-rows") : `<div class="dl-empty"><b>Inga dailys än</b><span class="muted small">Lägg till det du vill göra varje dag, till exempel plankan eller en promenad.</span>
      <button class="primary" data-rutpage>Lägg till dina dailys</button></div>`}
    ${a.length ? `<div class="klabel dl-sec">Kosttillskott</div><div class="dl-pills">${pills}</div>` : ""}`;
  if (allOk) {
    const st = streakOf(allDailiesDone), ws = weekStart(date);
    const greet = date !== TODAY ? "Dagen var klar" : st >= 7 ? "Grymt, en hel vecka i rad!" : st >= 3 ? "Bra jobbat, du är i farten!" : "Bra jobbat idag!";
    const week = weekDates(ws).map((d, i) => { const ok = allDailiesDone(d) && (S.supplements || []).every(x => S.log[d] && S.log[d].dailies["supp:" + x.id]);
      return `<span class="ds-d ${ok ? "ok" : ""} ${d === date ? "t" : ""} ${d > TODAY ? "f" : ""}"><i>${ok ? icon("check", 12) : ""}</i>${WD[i][0]}</span>`; }).join("");
    // Bocken hoppar in en gång per dag; en omritning (synk, sparning) ska inte få den att blinka
    const popNow = dsPopped !== date; setTimeout(() => { if (popNow) dsPopped = date; }, 0);
    return `<div class="dl-sum" role="status">
      <div class="ds-burst ${dsPopped === date ? "" : "pop"}" aria-hidden="true">${icon("check", 40)}</div>
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
  return `<div>${ex.length + a.length ? head : ""}${list}</div>`;
}

// Varje dag först, sedan dagens extra under en egen rubrik (bara när dagen har något extra)
function dlGroups(date, ex, rut, row, cls) {
  const every = new Set((S.daily || []).map(e => e.id));
  const extra = rut ? ex.filter(e => !every.has(e.id) && rut.ex.some(x => x.id === e.id)) : [];
  const base = ex.filter(e => !extra.includes(e));
  const byt = dailyRoutines().length > 1 && date === logDate() ? `<button class="linkbtn2 dl-byt" data-rutsheet="1">Byt</button>` : "";
  return `${base.length ? `<div class="${cls}">${base.map(row).join("")}</div>` : ""}
    ${extra.length ? `<div class="dl-xh"><i style="background:${rutColor(rut)}"></i><span class="grow">Extra${date === TODAY ? " idag" : ""}: ${esc(rut.name)}</span>${byt}</div><div class="${cls}">${extra.map(row).join("")}</div>` : ""}`;
}
function wkDayStat(d) {
  const ex = dailyList(d), a = S.supplements || [], L = S.log[d];
  const tot = ex.length + a.length, got = ex.filter(e => dailyDone(d, e.id)).length + a.filter(x => L && L.dailies && L.dailies["supp:" + x.id]).length;
  return { tot, got, all: tot > 0 && got === tot };
}
// Veckan överst: en ring per dag, tryck för att visa dagen
function dlStrip() {
  const sel = dlSel || TODAY, ws = weekStart(sel), cur = weekStart(TODAY);
  const days = weekDates(ws).map((d, i) => { const st = wkDayStat(d), fut = d > TODAY;
    const ring = !st.tot || fut ? `<span class="dl-sr e"></span>` : st.all ? `<span class="dl-sr ok">${icon("check", 12)}</span>` : `<span class="dl-sr">${setRing(st.got, st.tot)}</span>`;
    return `<button class="dl-sd ${d === sel ? "on" : ""} ${d === TODAY ? "t" : ""}" data-dlsel="${d}" aria-pressed="${d === sel}" aria-label="${cap(dateLabel(d))}${st.tot && !fut ? `: ${st.got} av ${st.tot} klara` : ""}">
      <small>${WD[i].slice(0, 3)}</small><b>${+d.slice(-2)}</b>${ring}</button>`; }).join("");
  return `<div class="dl-strip"><button class="iconbtn small ghost dl-sw" data-dlweek="-7" aria-label="Veckan före">${icon("left", 16)}</button>
    <div class="dl-sdays">${days}</div>
    <button class="iconbtn small ghost dl-sw" data-dlweek="7" ${ws >= cur ? "disabled" : ""} aria-label="Veckan efter">${icon("right", 16)}</button></div>`;
}
// En annan dag än idag: samma lista, men en bock per övning (bocka av i efterhand). Kommande dagar visas bara.
function dlOtherDay(d) {
  const ex = dailyList(d), a = S.supplements || [], rut = routineOn(d), st = wkDayStat(d), fut = d > TODAY;
  const suppOk = x => !!(S.log[d] && S.log[d].dailies && S.log[d].dailies["supp:" + x.id]);
  const ck = (ok, key, name) => fut ? "" : `<button class="dl-ck ${ok ? "on" : ""}" data-wkck="${d}" data-wkid="${esc(key)}" aria-pressed="${ok}" aria-label="${esc(name)} ${dateLabel(d)}: ${ok ? "gjort" : "inte gjort"}">${icon("check", 20)}</button>`;
  const row = e => `<div class="dl-row ${dailyDone(d, e.id) ? "ok" : ""}">${thumb(e.id, "dl-f")}<span class="grow dl-name"><b>${esc(EX[e.id].name)}</b><small>${e.sets} × ${esc(e.reps || "")}</small></span>${ck(dailyDone(d, e.id), e.id, EX[e.id].name)}</div>`;
  const pills = a.map(x => fut ? `<span class="dl-pill"><span class="dl-pc"></span>${esc(x.name)}</span>`
    : `<button class="dl-pill ${suppOk(x) ? "on" : ""}" data-wkck="${d}" data-wkid="supp:${esc(x.id)}" aria-pressed="${suppOk(x)}"><span class="dl-pc">${suppOk(x) ? icon("check", 14) : ""}</span>${esc(x.name)}</button>`).join("");
  return `<div class="dl-h"><div class="grow"><span class="dl-k">${cap(dateLabel(d))} · ${fut ? "planerat" : `${st.got} av ${st.tot} klara`}</span></div>
      ${!fut && st.tot && !st.all ? `<button class="small ghost dl-all" data-wkall="${d}">${icon("check", 14)}Allt gjort</button>` : ""}</div>
    ${ex.length ? dlGroups(d, ex, rut, row, "dl-rows") : `<p class="muted small">Inga dailys den dagen.</p>`}
    ${a.length ? `<div class="klabel dl-sec">Kosttillskott</div><div class="dl-pills">${pills}</div>` : ""}`;
}

// ---------- Mina dailys ----------
// Övningarna i Varje dag eller en extra grupp: tryck för set och reps, dra i ≡ för ordningen
function uxRows(target, list) {
  return list.map((e, i) => {
    if (!EX[e.id]) return "";
    const open = uxOpen === i;
    return `<div class="ux ${open ? "open" : ""}" data-uxidx="${i}"><div class="ux-r">${list.length > 1 ? `<span class="ux-grip" data-uxdrag="${i}" data-t="${target}" aria-label="Dra för att flytta ${esc(EX[e.id].name)}">${icon("list", 18)}</span>` : ""}
        <button class="ux-main" data-uxopen="${i}" aria-expanded="${open}"><span class="ux-f">${figure(e.id)}</span><span class="grow"><b>${esc(EX[e.id].name)}</b><small>${e.sets} × ${esc(e.reps || "")}</small></span></button>
        <button class="ux-x" data-xdel="${target}" data-idx="${i}" aria-label="Ta bort ${esc(EX[e.id].name)}">${icon("close", 16)}</button></div>
      ${open ? `<div class="ux-ed"><div class="ux-st"><span>Set</span><span class="ux-stp"><button data-uxsets="-1" data-t="${target}" data-idx="${i}" aria-label="Färre set">${icon("minus", 16)}</button><b>${e.sets}</b><button data-uxsets="1" data-t="${target}" data-idx="${i}" aria-label="Fler set">${icon("plus", 16)}</button></span></div>
        <div class="ux-st"><span>Reps eller tid</span><input type="text" inputmode="numeric" value="${esc(e.reps || "")}" data-ed="${i}" data-t="${target}" data-f="reps" aria-label="Reps"></div>
        <div class="ux-acts"><button data-swap="${target}" data-idx="${i}">Byt övning</button></div></div>` : ""}</div>`;
  }).join("");
}
// Dagarna för en extra grupp i ord: "Måndag och torsdag"
function extraDays(r) {
  if (rutMode() === "rotate") return "I tur och ordning";
  const d = daysOf(r);
  return d.length === 7 ? "Alla dagar" : d.length ? cap(andList(d)) : "Inga dagar valda";
}
function uppView() {
  if (typeof goalPick !== "undefined" && goalPick) return goalView();
  if (rutOpen) return uppDetail();
  const L = dailyRoutines(), every = S.daily || (S.daily = []), a = S.supplements || [];
  const nameForm = `<form class="rutname" data-rutform="new"><input name="n" maxlength="40" required placeholder="Namn, till exempel Mage" aria-label="Namn"><button class="small primary" type="submit">Spara</button><button class="small ghost" type="button" data-rutcancel>Avbryt</button></form>`;
  const addExtra = rutRename === "new" ? `<div class="up-nf">${nameForm}</div>` : `<button class="up-new2" data-rutnew>${icon("plus", 16)}Lägg till extra för vissa dagar</button>`;
  const extras = L.map(r => `<button class="up-xc" data-rutopen="${esc(r.id)}"><span class="up-xt"><i style="background:${rutColor(r)}"></i><b class="grow">${esc(extraDays(r))}</b>${icon("right", 16)}</span>
      <small>${esc(r.name)}: ${esc(r.ex.length ? r.ex.filter(e => EX[e.id]).map(e => EX[e.id].name).join(", ") : "inga övningar än")}</small></button>`).join("");
  return `<div class="dlx up"><button class="backbtn" data-rutback>${icon("left", 18)}Dailys</button><h1>Mina dailys</h1>
    <div class="klabel up-kl">Varje dag</div>
    <section class="up-card"><div class="uxlist">${uxRows("daily", every)}</div>
      <button class="up-addx" data-openpick="daily">${icon("plus", 16)}Lägg till övning</button></section>
    <div class="klabel up-kl">Kosttillskott</div>
    <section class="up-card">${a.map((x, i) => supplementEditing === i ? "" : `<div class="up-sr"><button class="grow up-srb" data-suppedit="${i}"><b>${esc(x.name)}</b>${x.dose ? ` <small>${esc(x.dose)}</small>` : ""}</button>
        <button class="ux-x" data-suppdel="${i}" aria-label="Ta bort ${esc(x.name)}">${icon("close", 16)}</button></div>`).join("")}
      ${supplementEditing === null ? `<button class="up-addx" data-suppadd>${icon("plus", 16)}Lägg till</button>` : supplementForm()}</section>
    ${L.length ? `<div class="klabel up-kl">Extra vissa dagar</div>${extras}${addExtra}
      ${rutMode() === "rotate" ? `<p class="muted small up-note">De extra grupperna turas om, en om dagen. <button class="linkbtn2" data-uppmode="week">Välj fasta veckodagar i stället</button></p>` : ""}
      <button class="up-goal2" data-goallist>${icon("idea", 18)}<span class="grow"><b>Färdiga förslag efter mål</b><small>Mage, ländrygg, höfter, hållning …</small></span>${icon("right", 18)}</button>`
    : `<section class="up-opt"><b>Schema <span class="up-tag2">valfritt</span></b>
        <p class="muted small">Vill du göra extra övningar vissa dagar, till exempel mage på måndagar? Lägg till dem här. Varje dag är alltid med.</p>
        ${addExtra}<button class="linkbtn2 up-golink" data-goallist>Eller välj ett färdigt förslag efter mål</button></section>`}</div>`;
}

// En extra grupp: vilka dagar, och övningarna
function uppDetail() {
  const r = routineById(rutOpen);
  if (!r) { rutOpen = null; return uppView(); }
  const target = "rut:" + r.id, days = daysOf(r), rot = rutMode() === "rotate", wk = weekNow();
  const nameForm = `<form class="rutname" data-rutform="${esc(r.id)}"><input name="n" maxlength="40" required value="${esc(r.name)}" aria-label="Namn"><button class="small primary" type="submit">Spara</button><button class="small ghost" type="button" data-rutcancel>Avbryt</button></form>`;
  const delText = rutDelArm === r.id ? "Tryck igen för att ta bort" : "Ta bort";
  const chips = weekDates(weekStart(TODAY)).map((d, i) => { const on = wk[i] === r.id;
    return `<button class="up-dc ${on ? "on" : ""}" style="--rc:${rutColor(r)}" data-plset="${i}" data-plid="${esc(r.id)}" aria-pressed="${on}" aria-label="${cap(WD_LONG[i])}">${WD[i].slice(0, 2)}</button>`; }).join("");
  return `<div class="dlx up"><button class="backbtn" data-rutback>${icon("left", 18)}Mina dailys</button>
    <div class="up-dh">${rutRename === r.id ? nameForm : `<h1>${esc(r.name)}</h1>`}
      <button class="up-more" data-rutmenu="${esc(r.id)}" aria-label="Fler val för ${esc(r.name)}">⋯</button></div>
    ${rutMenu === r.id ? `<div class="rutmenu"><button class="small" data-rutren="${esc(r.id)}">Byt namn</button><button class="small" data-rutcopy="${esc(r.id)}">Kopiera</button>
      <button class="small ${rutDelArm === r.id ? "dangerbtn" : ""}" data-rutdel="${esc(r.id)}">${delText}</button></div>` : ""}
    <div class="klabel up-kl">Vilka dagar?</div>
    ${rot ? `<p class="muted small up-note">Grupperna turas om, en om dagen. <button class="linkbtn2" data-uppmode="week">Välj fasta veckodagar i stället</button></p>`
      : `<div class="up-rd" role="group" aria-label="Dagar">${chips}</div>
    <p class="muted small up-note">${days.length ? `Görs ${days.length === 7 ? "alla dagar" : `på ${andList(days.map(x => x + "ar"))}`}, utöver Varje dag.` : "Tryck på dagarna då du vill göra de här övningarna."}</p>`}
    <div class="klabel up-kl">Övningar</div>
    <section class="up-card"><div class="uxlist">${uxRows(target, r.ex) || `<div class="muted small up-none">Inga övningar än.</div>`}</div>
      <button class="up-addx" data-openpick="${target}">${icon("plus", 16)}Lägg till övning</button></section></div>`;
}

function dailysPage() {
  const sel = dlSel && dlSel !== TODAY ? dlSel : null, any = hasDailies() || (S.supplements || []).length;
  return `<div class="dlx"><h1>Dailys</h1>${any ? dlStrip() : ""}${sel ? dlOtherDay(sel) : dlDayView()}
    ${any ? `<button class="ghost wide dl-mine" data-rutpage>${icon("edit", 16)}Ändra mina dailys</button>` : ""}
    ${rutinSheet()}</div>`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-dllist],[data-dlweek],[data-dlsel],[data-wkck],[data-wkall],[data-plset],[data-uppmode],[data-uxopen],[data-uxsets]");
  if (!t) return;
  const ds = t.dataset;
  ev.stopImmediatePropagation();
  if (ds.dllist !== undefined) dlShowList = !dlShowList;
  else if (ds.dlsel) dlSel = ds.dlsel === TODAY ? null : ds.dlsel;
  else if (ds.dlweek) { const n = shift(dlSel || TODAY, +ds.dlweek); dlSel = n >= TODAY ? null : n; }
  else if (ds.wkck) {
    // Bocka av eller ångra en dag i efterhand; dagen minns vilken extra grupp den hade
    const L = day(ds.wkck), id = ds.wkid, r = routineOn(ds.wkck);
    if (r && !L.dailyRoutine && dailyRoutines().length) L.dailyRoutine = r.id;
    L.dailies[id] = id.startsWith("supp:") ? !L.dailies[id] : !dailyDone(ds.wkck, id);
    save();
  }
  else if (ds.wkall) {
    const d = ds.wkall, L = day(d), r = routineOn(d);
    if (r && !L.dailyRoutine && dailyRoutines().length) L.dailyRoutine = r.id;
    for (const e of dailyList(d)) if (!dailyDone(d, e.id)) L.dailies[e.id] = true;
    for (const x of S.supplements || []) L.dailies["supp:" + x.id] = true;
    save(); toast(`${cap(dateLabel(d))}: allt gjort`);
  }
  else if (ds.plset !== undefined) { const w = weekNow(), i = +ds.plset; w[i] = w[i] === ds.plid ? "" : ds.plid; saveWeek(w); save(); }
  else if (ds.uppmode === "week") { if (rutMode() !== "week") { saveWeek(weekNow()); save(); } }
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

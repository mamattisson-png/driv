"use strict";
// ---------- Kost: snabb loggning ----------
// Sidan visar dagens mål och en ruta per måltid. "+ Lägg till" öppnar ett fönster för just den
// måltiden med sökning och snabbval (favoriter, egna måltider och det man ätit senast). Trycker
// man flera gånger på samma snabbval ökar antalet. Tryck på något loggat för att ändra antal,
// göra det till favorit eller ta bort det. Laddas före app.js; anropas först när appen ritas.

let foodSheet = null;     // { meal } när fönstret för att lägga till är öppet
let foodItem = null;      // index i dagens mat när en loggad sak är öppen
let quickMore = false;    // visa fler snabbval
let manualKcal = false;   // visa fälten för egna kcal
let quickCache = [];

// Måltid efter klockan: före 10 frukost, före 14 lunch, före 17 mellanmål, annars middag
function mealByClock() {
  const h = new Date().getHours();
  return h < 10 ? 0 : h < 14 ? 1 : h < 17 ? 2 : 3;
}
const currentMeal = () => foodSheet ? foodSheet.meal : mealByClock();

// All mat loggas här, så att den hamnar i rätt måltid. Med amt styr mängden kcal och protein;
// med qty är kcal och protein per styck.
function logFood(item, meal = currentMeal()) {
  const f = { name: item.name, kcal: Math.round(+item.kcal || 0), protein: Math.round(+item.protein || 0), meal };
  if (item.amt) { f.amt = { ...item.amt, u: { ...item.amt.u } }; applyAmt(f); }
  else if (item.qty && item.qty !== 1) setQty(f, item.qty);
  day().food.push(f);
}

// ---------- Mängd ----------
// amt = { n, unit, k, p, u }: mängd i en enhet, kcal och protein per 100 g och gram per enhet.
// Det är mängden man ändrar; kcal och protein räknas fram.
const UNIT_NAMES = { g: "g", dl: "dl", st: "st", msk: "msk", tsk: "tsk", skiva: "skivor", portion: "portion", bit: "bitar",
  burk: "burk", glas: "glas", kopp: "kopp", skopa: "skopor", nave: "nävar", pase: "påse", klyfta: "klyftor" };
const unitGrams = (a, unit) => unit === "g" ? 1 : a.u[unit] || UNIT_DEFAULT[unit] || 100;
const amtGrams = a => a.n * unitGrams(a, a.unit);
const amtText = a => `${fmtNum(a.n)} ${UNIT_NAMES[a.unit] || a.unit}`;
function applyAmt(f) {
  const g = amtGrams(f.amt);
  f.kcal = Math.round(f.amt.k * g / 100);
  f.protein = Math.round(f.amt.p * g / 100);
}
// Från en tolkad rad ("2 dl mjölk", "bolognese") till mängd och enhet
function amtFromItem(i) {
  const food = i.food, u = {};
  for (const k of UNIT_KEYS) if (food[k]) u[k] = food[k];
  let n, unit = i.unit;
  if (!unit && i.qty == null) {
    unit = food.portion ? "portion" : food.st ? "st" : food.msk ? "msk" : "g";
    n = unit === "g" ? 100 : unit === "msk" ? 2 : 1;
  } else if (!unit) { unit = food.st ? "st" : food.portion ? "portion" : "g"; n = unit === "g" ? Math.round(i.grams) : i.qty; }
  else if (["g", "hg", "kg"].includes(unit)) { unit = "g"; n = Math.round(i.grams); }
  else if (["ml", "cl", "l"].includes(unit)) { unit = "dl"; n = i.qty * { ml: 0.01, cl: 0.1, l: 10 }[i.unit]; }
  else n = i.qty ?? 1;
  return { n, unit, k: food.kcal, p: food.p, u };
}
// Enheter att välja mellan: gram och de som livsmedlet har vikter för
const unitChoices = a => ["g", ...Object.keys(a.u), ...(a.unit !== "g" && !a.u[a.unit] ? [a.unit] : [])];
function setUnit(a, unit) {
  const g = amtGrams(a);
  a.unit = unit;
  a.n = unit === "g" ? Math.round(g) : Math.max(0.5, Math.round(g / unitGrams(a, unit) * 2) / 2);
}
function amtInputs(a, attr) {
  return `<input class="amt-n" type="number" inputmode="decimal" min="0" step="any" value="${a.n}" ${attr}="n" aria-label="Mängd">
    <select class="amt-u" ${attr}="u" aria-label="Enhet">${unitChoices(a).map(k => `<option value="${k}" ${k === a.unit ? "selected" : ""}>${UNIT_NAMES[k] || k}</option>`).join("")}</select>`;
}

// Det man skrivit i sökrutan, tolkat till rader med mängd som går att ändra innan man lägger till
let foodDraft = [];
function draftRows(items) {
  foodDraft = items.map(i => i.known ? { name: i.name, corrected: i.corrected, amt: amtFromItem(i) } : { text: i.text });
  return foodDraft.map((d, j) => d.amt ? draftRow(d, j) : `<div class="drow"><span>${esc(d.text)}</span> <span class="unk">känns inte igen</span></div>`).join("");
}
function draftRow(d, j) {
  const g = amtGrams(d.amt);
  return `<div class="drow" data-drow="${j}"><div class="grow"><b>${esc(d.name)}</b>
      <div class="muted small dk">≈ ${Math.round(d.amt.k * g / 100)} kcal · ${Math.round(d.amt.p * g / 100)} g protein${d.amt.unit !== "g" ? ` (${Math.round(g)} g)` : ""}</div></div>
    ${amtInputs(d.amt, `data-d${j}`)}</div>`;
}
// Ändrad mängd i ett utkast: bara den raden ritas om, så att tangentbordet stannar kvar
function updateDraft(el) {
  const row = el.closest("[data-drow]"), j = +row.dataset.drow, d = foodDraft[j];
  if (el.classList.contains("amt-u")) { setUnit(d.amt, el.value); row.querySelector(".amt-n").value = d.amt.n; }
  else d.amt.n = Math.max(0, +String(el.value).replace(",", ".") || 0);
  const g = amtGrams(d.amt);
  row.querySelector(".dk").textContent = `≈ ${Math.round(d.amt.k * g / 100)} kcal · ${Math.round(d.amt.p * g / 100)} g protein${d.amt.unit !== "g" ? ` (${Math.round(g)} g)` : ""}`;
}
document.addEventListener("input", ev => { if (ev.target.closest && ev.target.closest("[data-drow]")) updateDraft(ev.target); });
document.addEventListener("change", ev => {
  if (ev.target.closest && ev.target.closest("[data-drow]")) updateDraft(ev.target);
  // Mängd på något som redan loggats
  const t = ev.target;
  if (t.dataset && t.dataset.iamt && foodItem != null) {
    const f = day().food[foodItem];
    if (t.dataset.iamt === "u") setUnit(f.amt, t.value);
    else f.amt.n = Math.max(0, +String(t.value).replace(",", ".") || 0);
    applyAmt(f);
    save();
    render();
  }
});

// Antal: kcal och protein sparas som totalsummor, per styck ligger i per
const perUnit = f => f.amt ? { name: f.name, kcal: f.kcal, protein: f.protein, amt: { ...f.amt } }
  : { name: f.name, kcal: f.per ? f.per.kcal : f.kcal, protein: f.per ? f.per.protein : f.protein };
function setQty(f, q) {
  const u = perUnit(f);
  f.kcal = Math.round(u.kcal * q);
  f.protein = Math.round(u.protein * q);
  if (q === 1) { delete f.qty; delete f.per; }
  else { f.qty = q; f.per = { kcal: u.kcal, protein: u.protein }; }
}
const qtyText = f => f.amt ? ` · ${amtText(f.amt)}` : f.qty ? ` × ${fmtNum(f.qty)}` : "";

const foodKey = f => f.name.trim().toLowerCase();
const favs = () => S.favs || (S.favs = []);
const isFav = f => favs().some(x => foodKey(x) === foodKey(f));
function toggleFav(f) {
  const i = favs().findIndex(x => foodKey(x) === foodKey(f));
  if (i >= 0) favs().splice(i, 1);
  else { const u = perUnit(f); favs().push({ name: u.name, kcal: u.kcal, protein: u.protein }); }
}

// Snabbval: favoriter, egna måltider och sedan det man ätit senast
function quickList() {
  const out = [], seen = new Set();
  favs().forEach((f, idx) => { seen.add(foodKey(f)); out.push({ ...f, kind: "fav", idx }); });
  S.meals.forEach((m, idx) => out.push({ ...m, kind: "meal", idx }));
  // Ungefärliga måltider ("Lunch (ca 600 kcal)") är inget man vill välja igen
  for (const f of recentFoods()) {
    if (seen.has(foodKey(f)) || /\(ca \d+ kcal\)$/.test(f.name)) continue;
    seen.add(foodKey(f));
    out.push({ ...perUnit(f), kind: "recent" });
  }
  return (quickCache = out);
}
// Ett snabbval som redan finns i måltiden får ett till i stället för en ny rad
function addQuick(f, meal) {
  if (f.kind === "meal" && f.items) { f.items.forEach(x => logFood(x, meal)); return; }
  const have = day().food.find(x => x.meal === meal && foodKey(x) === foodKey(f));
  if (have && have.amt && f.amt && have.amt.unit === f.amt.unit) { have.amt.n += f.amt.n; applyAmt(have); }
  else if (have && !have.amt) setQty(have, (have.qty || 1) + 1);
  else logFood(perUnit(f), meal);
}
// Hur mycket av ett snabbval som redan finns i måltiden, som text
const inMeal = (f, meal) => day().food.find(x => x.meal === meal && foodKey(x) === foodKey(f));
const countIn = (f, meal) => { const h = inMeal(f, meal); return h ? (h.amt ? amtText(h.amt) : fmtNum(h.qty || 1)) : ""; };

// Senaste dagen före idag (inom två veckor) då måltiden loggades
function lastSlot(meal) {
  for (let i = 1; i <= 14; i++) {
    const d = shift(logDate(), -i), items = ((S.log[d] && S.log[d].food) || []).filter(f => f.meal === meal);
    if (items.length) return { date: d, items };
  }
  return null;
}
const whenText = date => date === shift(logDate(), -1) ? "igår" : `i ${WD[weekdayOf(date)].toLowerCase()}s`;
const sumKcal = items => items.reduce((a, f) => a + (+f.kcal || 0), 0);
const mealTarget = (meal, m) => Math.round(m.kcal * MEALS[meal][1] / 10) * 10;

function mealCard(meal, m, L) {
  const items = L.food.map((f, i) => ({ f, i })).filter(x => (x.f.meal ?? -1) === meal);
  if (meal < 0 && !items.length) return "";
  const name = meal < 0 ? "Övrigt" : MEALS[meal][0], sum = sumKcal(items.map(x => x.f));
  const last = meal >= 0 && !items.length ? lastSlot(meal) : null;
  return `<div class="card mcard">
    <div class="row between"><h2>${name}</h2><span class="muted">${meal < 0 ? `${sum} kcal` : `${sum} / ${mealTarget(meal, m)} kcal`}</span></div>
    ${items.map(({ f, i }) => `<button class="mitem" data-fooditem="${i}"><span class="grow">${esc(f.name)}<span class="muted">${qtyText(f)}</span></span>
      <span class="muted nowrap">${f.kcal} kcal</span></button>`).join("")}
    ${last ? `<button class="again" data-repeat="${meal}">↻ Samma som ${whenText(last.date)}<span class="muted"> · ${esc(last.items.map(f => f.name).join(", "))}</span></button>` : ""}
    ${meal >= 0 ? `<button class="addbtn" data-addto="${meal}">+ Lägg till</button>` : ""}
  </div>`;
}

function addSheet(m) {
  const meal = foodSheet.meal, q = quickList(), shown = quickMore ? q : q.slice(0, 8);
  const items = day().food.filter(f => f.meal === meal);
  const quick = shown.map((f, i) => {
    const n = f.kind === "meal" ? "" : countIn(f, meal);
    return `<div class="qrow ${n ? "has" : ""}"><button class="grow qadd" data-quick="${i}" aria-label="Lägg till ${esc(f.name)}">
        <span class="plus">+</span><span class="grow">${f.kind === "fav" ? "★ " : ""}${esc(f.name)}${f.amt ? `<span class="muted"> · ${amtText(f.amt)}</span>` : ""}</span>
        <span class="muted nowrap">${f.kcal} kcal</span></button>
      ${n ? `<button class="small qminus" data-qminus="${i}" aria-label="Mindre ${esc(f.name)}">−</button><b class="qcount">${n}</b>
        <button class="small qminus" data-quick="${i}" aria-label="Mer ${esc(f.name)}">+</button>` : ""}</div>`;
  }).join("");
  return `<div class="overlay" data-fsclose><div class="sheet">
    <div class="row between"><h2>Lägg till i ${MEALS[meal][0].toLowerCase()}</h2><button class="small ghost" data-fsclose aria-label="Stäng">✕</button></div>
    <div class="fwrap"><input id="fname" placeholder="Sök eller skriv, t.ex. 2 ägg och 1 banan" autocomplete="off"
      role="combobox" aria-autocomplete="list" aria-controls="fsugg">
      <div id="fsugg" class="sugg" role="listbox" hidden></div></div>
    <div id="fpreview" class="muted fpreview"></div>
    <div class="manual" ${manualKcal ? "" : "hidden"}><div class="row">
      <label class="field grow">kcal<input id="fkcal" type="number" inputmode="numeric"></label>
      <label class="field grow">Protein (g)<input id="fprot" type="number" inputmode="numeric"></label></div></div>
    <div class="row" style="margin-top:8px"><button class="primary grow" data-addfood>Lägg till</button>
      ${CAN_SCAN ? `<button data-scan aria-label="Skanna streckkod">📷</button>` : ""}</div>
    <button class="link small" data-manualkcal style="margin-top:8px">${manualKcal ? "Dölj egna kcal" : "Ange kcal själv"}</button>
    ${q.length ? `<h3 class="sheet-sub">Snabbval</h3>${quick}
      ${q.length > 8 ? `<button class="small ghost" data-quickmore>${quickMore ? "Visa färre" : `Visa fler (${q.length - 8})`}</button>` : ""}` : ""}
    ${!items.length ? `<h3 class="sheet-sub">Bara ungefär</h3><div class="row qkcal">
      <input id="qm-${meal}" type="number" inputmode="numeric" placeholder="ca ${mealTarget(meal, m)} kcal" aria-label="Ungefär hur många kcal">
      <button data-qmeal="${meal}">Lägg till</button></div>` : ""}
    ${items.length > 1 ? `<button class="small ghost" data-savegroup="${meal}" style="margin-top:12px">Spara ${MEALS[meal][0].toLowerCase()}en som en måltid</button>` : ""}
    <div class="muted small" style="margin-top:14px">Näringsvärden: Livsmedelsverkets livsmedelsdatabas (CC BY 4.0) och egna uppskattningar.</div>
    <div class="sheet-foot"><button class="wide" data-fsclose>Klar${items.length ? ` · ${sumKcal(items)} kcal` : ""}</button></div>
  </div></div>`;
}

function itemSheet() {
  const f = day().food[foodItem];
  if (!f) { foodItem = null; return ""; }
  const q = f.qty || 1, u = perUnit(f);
  return `<div class="overlay" data-itemclose><div class="sheet">
    <div class="row between"><h2>${esc(f.name)}</h2><button class="small ghost" data-itemclose aria-label="Stäng">✕</button></div>
    ${f.amt ? `<div class="row qtyrow"><span class="grow">Mängd</span>${amtInputs(f.amt, "data-iamt")}</div>`
      : `<div class="row qtyrow"><span class="grow">Antal</span>
      <button class="step" data-qty="-1" ${q <= 0.5 ? "disabled" : ""} aria-label="Färre">−</button><b class="qcount">${fmtNum(q)}</b>
      <button class="step" data-qty="1" aria-label="Fler">+</button></div>`}
    <div class="muted" style="margin-top:8px">${f.kcal} kcal · ${f.protein} g protein${!f.amt && q !== 1 ? ` <span class="small">(${u.kcal} kcal per st)</span>` : ""}</div>
    <div class="row" style="margin-top:12px"><button class="grow" data-itemfav>${isFav(f) ? "★ Favorit" : "☆ Gör till favorit"}</button>
      <button class="ghost" data-delfood="${foodItem}" data-itemclose>Ta bort</button></div>
    <button class="primary wide" data-itemclose style="margin-top:12px">Klar</button>
  </div></div>`;
}

function kostView() {
  const m = macros(), e = eaten(), L = day();
  return `<h1>Kost</h1>
    <div class="card"><div class="row between"><h2>Dagens mål</h2><span class="muted">${e.kcal} / ${m.kcal} kcal</span></div>
      ${bar(e.kcal, m.kcal)}
      <div class="row between" style="margin-top:8px"><span class="muted">Protein</span><span class="muted">${e.protein} / ${m.protein} g</span></div>
      ${bar(e.protein, m.protein)}</div>
    ${MEALS.map((_, i) => mealCard(i, m, L)).join("")}
    ${mealCard(-1, m, L)}
    ${foodSheet ? addSheet(m) : foodItem != null ? itemSheet() : ""}`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-addfood],[data-addto],[data-fsclose],[data-quick],[data-qminus],[data-repeat],[data-savegroup],[data-quickmore],[data-manualkcal],[data-fooditem],[data-itemclose],[data-qty],[data-itemfav]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset;
  if (ds.addfood !== undefined) {
    // Allt igenkänt: varje rad loggas för sig med sin mängd. Annars gäller egna kcal (app.js).
    const text = ($("fname").value || "").trim(), r = text ? parseFood(text) : null;
    if (!foodSheet || !r || !r.items.length || r.unknown.length || $("fkcal").dataset.manual || (S.learned || {})[norm(text)]) return;
    if (!(foodDraft.length === r.items.length && foodDraft.every(d => d.amt))) draftRows(r.items);
    ev.stopImmediatePropagation();
    foodDraft.forEach(d => logFood({ name: d.name, amt: d.amt }, foodSheet.meal));
    foodDraft = [];
  }
  else if (ds.addto) { foodSheet = { meal: +ds.addto }; quickMore = false; manualKcal = false; }
  else if (ds.fsclose !== undefined) foodSheet = null;
  else if (ds.itemclose !== undefined) {
    foodItem = null;
    if (ds.delfood !== undefined) return;   // själva borttagningen sköts av data-delfood
  }
  else if (ds.fooditem) foodItem = +ds.fooditem;
  else if (ds.quickmore !== undefined) quickMore = !quickMore;
  else if (ds.manualkcal !== undefined) { manualKcal = !manualKcal; const el = document.querySelector(".manual"); if (el) el.hidden = !manualKcal; t.textContent = manualKcal ? "Dölj egna kcal" : "Ange kcal själv"; return; }
  else if (ds.quick) addQuick(quickCache[+ds.quick], foodSheet.meal);
  else if (ds.qminus) {
    const f = quickCache[+ds.qminus], food = day().food;
    const i = food.findIndex(x => x.meal === foodSheet.meal && foodKey(x) === foodKey(f));
    const h = food[i];
    if (h && h.amt && f.amt && h.amt.unit === f.amt.unit && h.amt.n > f.amt.n) { h.amt.n -= f.amt.n; applyAmt(h); }
    else if (h && !h.amt && (h.qty || 1) > 1) setQty(h, h.qty - 1);
    else if (h) food.splice(i, 1);
  }
  else if (ds.qty) {
    // Hela steg, men en halv portion går att välja under 1
    const f = day().food[foodItem], q = f.qty || 1;
    setQty(f, +ds.qty > 0 ? (q < 1 ? 1 : q + 1) : (q <= 1 ? 0.5 : q - 1));
  }
  else if (ds.itemfav !== undefined) toggleFav(day().food[foodItem]);
  else if (ds.repeat) {
    const meal = +ds.repeat, last = lastSlot(meal);
    if (last) last.items.forEach(f => logFood({ ...perUnit(f), qty: f.qty }, meal));
  }
  else if (ds.savegroup) {
    const meal = +ds.savegroup, items = day().food.filter(f => f.meal === meal);
    const names = items.map(f => f.name + qtyText(f)).join(", ");
    S.meals.push({
      name: `${MEALS[meal][0]}: ${names.length > 40 ? names.slice(0, 38) + "…" : names}`,
      kcal: sumKcal(items), protein: items.reduce((a, f) => a + (+f.protein || 0), 0),
      items: items.map(f => ({ ...perUnit(f), qty: f.qty })),
    });
    toast("Sparad bland snabbvalen");
  }
  save();
  render();
});

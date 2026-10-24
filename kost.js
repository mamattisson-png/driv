"use strict";
// ---------- Kost: snabb loggning ----------
// Sidan visar dagens mål och en kompakt ruta med måltiderna. "+ Lägg till" öppnar ett fönster för
// just den måltiden: sökning, det som redan ligger i måltiden (med − mängd +) och förslag (favoriter,
// egna måltider och det man ätit senast). Uppskattningar ("ca 600 kcal") är en egen sorts post som
// aldrig blir favorit eller förslag. Laddas före app.js; anropas först när appen ritas.

let foodSheet = null;     // { meal } när fönstret för att lägga till är öppet
let foodItem = null;      // index i dagens mat när en loggad sak är öppen
let quickMore = false;    // visa fler förslag
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
  if (item.est) f.est = true;
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
// Ett steg upp eller ned: 50 g för gram, annars en hel (en halv under 1). 0 betyder slut.
function stepAmount(a, dir) {
  const step = a.unit === "g" ? 50 : a.n < 1 || (a.n === 1 && dir < 0) ? 0.5 : 1, n = a.n + dir * step;
  return n <= 0 ? 0 : a.unit === "g" ? Math.max(10, n) : n;
}
function amtInputs(a, attr) {
  return `<div class="amtstep"><button class="small qminus" data-astep="-1" ${a.n <= (a.unit === "g" ? 10 : 0.5) ? "disabled" : ""} aria-label="Mindre">−</button>
    <input class="amt-n" type="number" inputmode="decimal" min="0" step="any" value="${a.n}" ${attr}="n" aria-label="Mängd">
    <button class="small qminus" data-astep="1" aria-label="Mer">+</button></div>
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
document.addEventListener("input", ev => {
  if (ev.target.closest && ev.target.closest("[data-drow]")) updateDraft(ev.target);
  if (ev.target.id === "rname" && recipeEdit) recipeEdit.name = ev.target.value;
});
// Receptfönstret
function addIngredients() {
  const el = $("ring"), text = (el.value || "").trim();
  if (!text) return;
  const r = parseFood(text), ok = r.items.filter(i => i.known);
  ok.forEach(i => recipeEdit.items.push({ name: i.name, text: i.text, kcal: i.kcal, protein: i.protein }));
  recipeEdit.msg = r.unknown.length ? `Känns inte igen: ${r.unknown.join(", ")}. Skriv mängd och livsmedel, t.ex. "200 g nötfärs".` : "";
  render();
  const again = $("ring");
  if (again) { again.value = r.unknown.join(", "); again.focus(); }
}
document.addEventListener("keydown", ev => { if (ev.target.id === "ring" && ev.key === "Enter") { ev.preventDefault(); addIngredients(); } });
document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-rlist],[data-rclose],[data-rnew],[data-redit],[data-ruse],[data-rcancel],[data-rport],[data-ringadd],[data-rdel],[data-rsave],[data-rremove]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset;
  if (ds.ringadd !== undefined) { addIngredients(); return; }
  if (ds.rlist !== undefined) recipeList = true;
  else if (ds.rclose !== undefined) recipeList = false;
  else if (ds.rnew !== undefined) recipeEdit = { idx: null, name: "", portions: 4, items: [], msg: "" };
  else if (ds.redit) { const r = recipes()[+ds.redit]; recipeEdit = { idx: +ds.redit, name: r.name, portions: r.portions, items: r.items.map(i => ({ ...i })), msg: "" }; }
  else if (ds.ruse) {
    const p = perPortion(recipes()[+ds.ruse]);
    addQuick(p, foodSheet ? foodSheet.meal : mealByClock());
    recipeList = false;
    toast(`${p.name}: en portion tillagd`);
  }
  else if (ds.rcancel !== undefined) recipeEdit = null;
  else if (ds.rport) recipeEdit.portions = Math.max(1, recipeEdit.portions + +ds.rport);
  else if (ds.rdel) recipeEdit.items.splice(+ds.rdel, 1);
  else if (ds.rsave !== undefined) {
    const r = recipeEdit, name = (r.name || "").trim() || "Mitt recept";
    const rec = { name, portions: r.portions, items: r.items };
    if (r.idx == null) recipes().push(rec); else recipes()[r.idx] = rec;
    recipeEdit = null; recipeList = true;
    toast(`Receptet ${name} är sparat`);
  }
  else if (ds.rremove !== undefined) { recipes().splice(recipeEdit.idx, 1); recipeEdit = null; recipeList = true; }
  save();
  render();
});
document.addEventListener("click", ev => {
  const b = ev.target.closest && ev.target.closest("[data-astep]");
  if (!b || b.disabled) return;
  const row = b.closest("[data-drow]");
  if (row) {
    const a = foodDraft[+row.dataset.drow].amt, n = stepAmount(a, +b.dataset.astep);
    if (!n) return;
    const input = row.querySelector(".amt-n");
    input.value = n;
    updateDraft(input);
    row.querySelector('[data-astep="-1"]').disabled = n <= (a.unit === "g" ? 10 : 0.5);
  } else if (foodItem != null) {
    const f = day().food[foodItem], n = stepAmount(f.amt, +b.dataset.astep);
    if (!n) return;
    f.amt.n = n;
    applyAmt(f);
    rememberAmount(f);
    save();
    render();
  }
});
document.addEventListener("change", ev => {
  if (ev.target.closest && ev.target.closest("[data-drow]")) updateDraft(ev.target);
  // Mängd på något som redan loggats
  const t = ev.target;
  if (t.dataset && t.dataset.iamt && foodItem != null) {
    const f = day().food[foodItem];
    if (t.dataset.iamt === "u") setUnit(f.amt, t.value);
    else f.amt.n = Math.max(0, +String(t.value).replace(",", ".") || 0);
    applyAmt(f);
    rememberAmount(f);
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
const isEst = f => !!f.est || isEstName(f.name);
const isFav = f => favs().some(x => foodKey(x) === foodKey(f));
// En favorit är ett livsmedel med sin senaste mängd
function toggleFav(f) {
  if (isEst(f)) return;
  const i = favs().findIndex(x => foodKey(x) === foodKey(f));
  if (i >= 0) favs().splice(i, 1);
  else favs().push(perUnit(f));
}
// Ändras mängden på en favorit blir den nya mängden favoritens
function rememberAmount(f) {
  const i = favs().findIndex(x => foodKey(x) === foodKey(f));
  if (i >= 0) favs()[i] = perUnit(f);
}

// ---------- Recept ----------
// Ett recept är ingredienser och antal portioner; man loggar en portion i taget.
const recipes = () => S.recipes || (S.recipes = []);
let recipeEdit = null;    // receptet som skrivs eller ändras: { idx, name, portions, items, msg }
let recipeList = false;   // listan med egna recept är öppen
const recipeTotal = r => ({ kcal: sumKcal(r.items), protein: r.items.reduce((a, i) => a + (+i.protein || 0), 0) });
function perPortion(r) {
  const t = recipeTotal(r), n = Math.max(1, r.portions || 1);
  return { name: r.name, kcal: Math.round(t.kcal / n), protein: Math.round(t.protein / n * 10) / 10 };
}
function recipesSheet() {
  const list = recipes();
  return `<div class="overlay" data-rclose><div class="sheet">
    <div class="row between"><h2>Dina recept</h2><button class="small ghost" data-rclose aria-label="Stäng">✕</button></div>
    <div class="muted small" style="margin-bottom:8px">Bygg en rätt av ingredienser en gång, logga sedan en portion med ett tryck.</div>
    ${list.length ? list.map((r, i) => { const p = perPortion(r);
      return `<div class="krow"><span class="grow"><b>${esc(r.name)}</b><span class="muted small">${r.portions} portioner · ${p.kcal} kcal och ${fmtNum(p.protein)} g protein per portion</span></span>
        <button class="small ghost" data-redit="${i}">Ändra</button><button class="small" data-ruse="${i}">Lägg till</button></div>`; }).join("")
      : `<div class="muted">Inga recept än.</div>`}
    <button class="primary wide bigbtn" style="margin-top:14px" data-rnew>+ Nytt recept</button>
  </div></div>`;
}
function recipeSheet() {
  const r = recipeEdit, t = recipeTotal(r), p = perPortion(r);
  return `<div class="overlay" data-rcancel><div class="sheet">
    <div class="row between"><h2>${r.idx == null ? "Nytt recept" : "Ändra recept"}</h2><button class="small ghost" data-rcancel aria-label="Stäng">✕</button></div>
    <label class="field">Namn<input id="rname" value="${esc(r.name)}" placeholder="t.ex. Lasagne" autocomplete="off"></label>
    <div class="row qtyrow" style="margin-top:10px"><span class="grow">Portioner</span>
      <button class="step" data-rport="-1" ${r.portions <= 1 ? "disabled" : ""} aria-label="Färre portioner">−</button><b class="qcount">${r.portions}</b>
      <button class="step" data-rport="1" aria-label="Fler portioner">+</button></div>
    <h3 class="sheet-sub">Ingredienser</h3>
    <div class="row"><input id="ring" class="grow" placeholder="t.ex. 500 g nötfärs, 2 dl grädde" autocomplete="off"><button data-ringadd>Lägg till</button></div>
    ${r.msg ? `<div class="muted small warntext" style="margin-top:6px">${esc(r.msg)}</div>` : ""}
    ${r.items.map((i, k) => `<div class="krow"><span class="grow"><b>${esc(cap(i.text))}</b><span class="muted small">räknat som ${esc(i.name.toLowerCase())} · ${fmtNum(+i.protein || 0)} g protein</span></span>
      <span class="kkcal">${tnum(i.kcal)} kcal</span><button class="small ghost" data-rdel="${k}" aria-label="Ta bort ${esc(i.name)}">✕</button></div>`).join("")}
    ${r.items.length ? `<div class="rtotal"><div class="row between"><span>Hela receptet</span><b>${tnum(t.kcal)} kcal</b></div>
      <div class="row between"><span>En portion (av ${r.portions})</span><b>${tnum(p.kcal)} kcal · ${fmtNum(p.protein)} g protein</b></div></div>` : ""}
    <div class="sheet-foot row between">${r.idx != null ? `<button class="ghost" data-rremove>Ta bort</button>` : `<span></span>`}
      <button class="primary" data-rsave ${r.items.length ? "" : "disabled"}>Spara recept</button></div>
  </div></div>`;
}

// Förslag: det du brukar äta till just den här måltiden först. Varje kandidat (favorit, sparad
// måltid, recept, nyligen ätet) får poäng efter hur ofta den loggats de senaste fyra veckorna,
// dubbelt så mycket i samma måltid. Högst 20 förslag; resten nås genom att söka.
const QUICK_MAX = 20;
function quickList(meal) {
  const date = logDate(), from = shift(date, -28), freq = {};
  for (const d of Object.keys(S.log).sort()) {
    if (d < from || d > date) continue;
    for (const f of S.log[d].food) {
      const e = freq[foodKey(f)] || (freq[foodKey(f)] = { here: 0, any: 0 });
      e.any++; e.f = f;
      if (f.meal === meal) e.here++;
    }
  }
  const skip = new Set(day().food.filter(f => f.meal === meal).map(foodKey)), out = [];
  const add = (f, bonus) => {
    const k = foodKey(f);
    if (skip.has(k) || isEst(f)) return;
    skip.add(k);
    const e = freq[k] || { here: 0, any: 0 };
    out.push({ ...f, score: e.here * 2 + e.any + bonus });
  };
  favs().forEach((f, idx) => add({ ...f, kind: "fav", idx }, 1.5));
  // En sparad måltid hör till måltiden den sparades från
  S.meals.forEach((m, idx) => {
    const slot = m.slot ?? MEALS.findIndex(([n]) => m.name.startsWith(n + ":"));
    if (slot < 0 || slot === meal) add({ ...m, kind: "meal", idx }, 2);
  });
  recipes().forEach((r, idx) => add({ ...perPortion(r), kind: "recipe", idx }, 0.5));
  // Allt som ätits de senaste fyra veckorna, och det senaste från tiden innan
  for (const e of Object.values(freq)) add({ ...perUnit(e.f), kind: "recent" }, 0);
  for (const f of recentFoods()) add({ ...perUnit(f), kind: "recent" }, 0);
  return (quickCache = out.sort((x, y) => y.score - x.score).slice(0, QUICK_MAX));
}
// Ett snabbval som redan finns i måltiden får ett till i stället för en ny rad
function addQuick(f, meal) {
  if (f.kind === "meal" && f.items) { f.items.forEach(x => logFood(x, meal)); return; }
  const have = day().food.find(x => x.meal === meal && foodKey(x) === foodKey(f));
  if (have && have.amt && f.amt && have.amt.unit === f.amt.unit) { have.amt.n += f.amt.n; applyAmt(have); }
  else if (have && !have.amt) setQty(have, (have.qty || 1) + 1);
  else logFood(perUnit(f), meal);
}
// − och + på något i måltiden: en styck eller portion i taget (en halv under 1), 50 g för gram.
// Returnerar false när det ska tas bort.
function stepItem(f, dir) {
  if (isEst(f)) return dir > 0;
  if (f.amt) {
    const n = stepAmount(f.amt, dir);
    if (!n) return false;
    f.amt.n = n;
    applyAmt(f);
  } else {
    const q = f.qty || 1, n = dir > 0 ? (q < 1 ? 1 : q + 1) : q <= 0.5 ? 0 : q <= 1 ? 0.5 : q - 1;
    if (n <= 0) return false;
    setQty(f, n);
  }
  rememberAmount(f);
  return true;
}
const itemName = f => isEst(f) ? "≈ Uppskattning" : esc(f.name);
const amountText = f => f.amt ? amtText(f.amt) : f.qty ? `× ${fmtNum(f.qty)}` : "";

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
// Används bara som förslag i fältet för en ungefärlig måltid
const mealTarget = (meal, m) => Math.round(m.kcal * MEALS[meal][1] / 10) * 10;

// En måltid i översikten: rubrik med summa och en rad per sak (namn och mängd till vänster, kcal
// till höger). Tomma måltider visas inte; allt läggs till med en enda knapp.
const MEAL_SVG = [
  '<path d="M3 18h18M6 14a6 6 0 0 1 12 0M12 4v3M4.9 8.9l1.4 1.4M19.1 8.9l-1.4 1.4"/>',
  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  '<path d="M12 7c-2-2-7-1.5-7 4 0 4 3 9 5 9 1 0 1.3-.6 2-.6s1 .6 2 .6c2 0 5-5 5-9 0-5.5-5-6-7-4zM12 7c0-2 1-3.5 3-4"/>',
  '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
];
const mealIcon = meal => meal < 0 ? "" : `<svg class="kicon" viewBox="0 0 24 24" aria-hidden="true">${MEAL_SVG[meal]}</svg>`;
const foodTitle = f => { const a = amountText(f); return isEst(f) ? itemName(f) : `${esc(f.name)}${a ? (a.startsWith("×") ? ` ${a}` : ` · ${a}`) : ""}`; };
function mealCard(meal, L) {
  const items = L.food.map((f, i) => ({ f, i })).filter(x => (x.f.meal ?? -1) === meal);
  if (!items.length) return "";
  const name = meal < 0 ? "Övrigt" : MEALS[meal][0], sum = sumKcal(items.map(x => x.f));
  return `<section class="card kmeal">
    <div class="khead">${mealIcon(meal)}<span class="grow">${name}</span><span>${tnum(sum)} kcal</span></div>
    ${items.map(({ f, i }) => `<button class="krow ${isEst(f) ? "est" : ""}" data-fooditem="${i}">
      <span class="grow"><b>${foodTitle(f)}</b><span class="muted small">${isEst(f) ? "ungefärligt" : `${fmtNum(+f.protein || 0)} g protein`}</span></span><span class="kkcal">${tnum(f.kcal)} kcal</span></button>`).join("")}
  </section>`;
}

// Sparade måltider för en viss måltid (äldre sparningar känns igen på namnet, t.ex. "Frukost: …")
const savedFor = meal => S.meals.map((m, idx) => ({ m, idx }))
  .filter(({ m }) => m.items && (m.slot === meal || (m.slot == null && m.name.startsWith(MEALS[meal][0] + ":"))));
// Igår med mat, om dagen man loggar är tom
function yesterdayFood() {
  if (day().food.length) return null;
  const d = shift(logDate(), -1), food = (S.log[d] && S.log[d].food) || [];
  return food.length ? food : null;
}

// Dagens intag: kalorier och protein med var sin stapel
const tnum = n => Math.round(n).toLocaleString("sv-SE");
// En siffra med mål och stapel; används i Kost och på Hem
const kstat = (label, v, goal, unit, cls) => `<div class="kstat"><div class="klabel">${label}</div>
    <div class="kbig">${tnum(v)}${unit === "g" ? " g" : ""}</div><div class="muted small">av ${tnum(goal)} ${unit}</div>
    <div class="bar ${cls}"><div style="width:${goal ? Math.min(100, Math.round(v / goal * 100)) : 0}%"></div></div></div>`;
const kstats = (e, m) => `<div class="kstats">${kstat("Kalorier", e.kcal, m.kcal, "kcal", e.kcal > m.kcal * 1.05 ? "over" : "")}${kstat("Protein", e.protein, m.protein, "g", e.protein >= m.protein ? "ok" : "prot")}</div>`;
function dayRing(e, m) {
  return `<div class="card dayring"><h2>${editDate ? dateLabel(editDate).replace(/^./, c => c.toUpperCase()) : "Dagens intag"}</h2>
    ${kstats(e, m)}
    <div class="muted small kleft">${e.kcal <= m.kcal ? `${tnum(m.kcal - e.kcal)} kcal kvar` : `${tnum(e.kcal - m.kcal)} kcal över målet`}</div>
    ${S.profileSet === false ? `<button class="link small" data-tab="profil" data-popen="kalori">Målet bygger på standardvärden – ställ in ditt</button>` : ""}</div>`;
}

function addSheet(m) {
  const meal = foodSheet.meal, mealName = MEALS[meal][0].toLowerCase(), q = quickList(meal), shown = quickMore ? q : q.slice(0, 8);
  const food = day().food, items = food.map((f, i) => ({ f, i })).filter(x => x.f.meal === meal);
  const double = items.length > 1;
  const last = items.length ? null : lastSlot(meal), saved = items.length ? [] : savedFor(meal).slice(0, 3);   // en uppskattning bredvid riktig mat kan räknas dubbelt
  const now = items.map(({ f, i }) => `<div class="nrow krow ${isEst(f) ? "est" : ""}"><span class="grow"><b>${itemName(f)}</b><span class="muted small">${f.kcal} kcal${isEst(f) && double ? ` · <span class="warntext">kan räknas dubbelt</span>` : ""}</span></span>
    ${isEst(f) ? `<button class="small qminus" data-mdel="${i}" aria-label="Ta bort uppskattningen">✕</button>`
      : `<button class="small qminus" data-mstep="-1" data-mi="${i}" aria-label="Mindre ${esc(f.name)}">−</button><b class="qcount">${amountText(f) || "1"}</b>
         <button class="small qminus" data-mstep="1" data-mi="${i}" aria-label="Mer ${esc(f.name)}">+</button>`}</div>`).join("");
  const quick = shown.map((f, i) => `<button class="qadd" data-quick="${i}" aria-label="Lägg till ${esc(f.name)}">
      <span class="qplus" aria-hidden="true">${f.kind === "fav" ? "★" : f.kind === "meal" ? "🍽" : f.kind === "recipe" ? "🍲" : "+"}</span><b>${esc(f.name)}</b><span class="muted">${f.kcal} kcal${f.kind === "recipe" ? "/portion" : ""}</span></button>`).join("");
  return `<div class="overlay" data-fsclose><div class="sheet">
    <div class="row between"><h2>Lägg till mat</h2><button class="small ghost" data-fsclose aria-label="Stäng">✕</button></div>
    <div class="chips mealpick" role="tablist">${MEALS.map(([n], i) => `<button data-sheetmeal="${i}" class="${i === meal ? "on" : ""}" role="tab" aria-selected="${i === meal}">${n}</button>`).join("")}</div>
    <div class="row"><div class="fwrap grow"><input id="fname" placeholder="Sök eller skriv, t.ex. 2 ägg och 1 banan" autocomplete="off"
      role="combobox" aria-autocomplete="list" aria-controls="fsugg">
      <div id="fsugg" class="sugg" role="listbox" hidden></div></div>
      ${CAN_SCAN ? `<button data-scan aria-label="Skanna streckkod">📷</button>` : ""}</div>
    <div id="fpreview" class="muted fpreview"></div>
    <div class="manual" ${manualKcal ? "" : "hidden"}><div class="row">
      <label class="field grow">kcal<input id="fkcal" type="number" inputmode="numeric"></label>
      <label class="field grow">Protein (g)<input id="fprot" type="number" inputmode="numeric"></label></div></div>
    <div class="addrow" ${manualKcal ? "" : "hidden"}><button class="primary wide" data-addfood>Lägg till</button>
      <button class="link small" data-manualkcal style="margin-top:6px">${manualKcal ? "Dölj egna kcal" : "Ange kcal själv"}</button></div>
    ${!items.length && (last || saved.length) ? `<div class="kshort">
      ${saved.map(({ m: sm, idx }) => `<button class="klink" data-usemeal="${idx}" data-meal="${meal}">🍽 ${esc(sm.name)}<span class="muted"> · ${sm.kcal} kcal</span></button>`).join("")}
      ${last ? `<button class="klink" data-repeat="${meal}">↻ Samma som ${whenText(last.date)}<span class="muted"> · ${esc(last.items.map(f => isEst(f) ? "uppskattning" : f.name).join(", "))}</span></button>` : ""}</div>` : ""}
    ${items.length ? `<div class="row between sheet-sub"><span>I ${mealName}en nu</span>
      ${items.filter(x => !isEst(x.f)).length > 1 ? `<button class="link small" data-savegroup="${meal}">Spara som måltid</button>` : ""}</div>${now}` : ""}
    <div class="row between sheet-sub"><span>${q.length ? "Förslag" : ""}</span><button class="link small" data-rlist>🍲 Dina recept${recipes().length ? ` (${recipes().length})` : ""}</button></div>
    ${q.length ? `<div class="qgrid">${quick}</div>
      ${q.length > 8 ? `<button class="small ghost" data-quickmore>${quickMore ? "Visa färre" : `Visa fler (${q.length - 8})`}</button>` : ""}` : ""}
    ${!items.length ? `<h3 class="sheet-sub">Bara ungefär</h3><div class="row qkcal">
      <input id="qm-${meal}" type="number" inputmode="numeric" placeholder="ca ${mealTarget(meal, m)} kcal" aria-label="Ungefär hur många kcal">
      <button data-qmeal="${meal}">Lägg till</button></div>` : ""}
    <div class="sheet-foot row between"><b class="total">Totalt ${sumKcal(items.map(x => x.f))} kcal</b>
      <button class="primary" data-fsclose>Klar</button></div>
  </div></div>`;
}

function itemSheet() {
  const f = day().food[foodItem];
  if (!f) { foodItem = null; return ""; }
  const q = f.qty || 1, u = perUnit(f);
  return `<div class="overlay" data-itemclose><div class="sheet">
    <div class="row between"><h2>${itemName(f)}</h2><button class="small ghost" data-itemclose aria-label="Stäng">✕</button></div>
    ${f.amt ? `<div class="row qtyrow"><span class="grow">Mängd</span>${amtInputs(f.amt, "data-iamt")}</div>`
      : `<div class="row qtyrow"><span class="grow">Antal</span>
      <button class="step" data-qty="-1" ${q <= 0.5 ? "disabled" : ""} aria-label="Färre">−</button><b class="qcount">${fmtNum(q)}</b>
      <button class="step" data-qty="1" aria-label="Fler">+</button></div>`}
    <div class="muted" style="margin-top:8px">${f.kcal} kcal · ${f.protein} g protein${!f.amt && q !== 1 ? ` <span class="small">(${u.kcal} kcal per st)</span>` : ""}</div>
    <div class="row" style="margin-top:12px">${isEst(f) ? `<span class="grow muted small">En uppskattning blir aldrig favorit eller förslag.</span>`
      : `<button class="grow" data-itemfav>${isFav(f) ? "★ Favorit" : "☆ Gör till favorit"}</button>`}
      <button class="ghost" data-delfood="${foodItem}" data-itemclose>Ta bort</button></div>
    <button class="primary wide" data-itemclose style="margin-top:12px">Klar</button>
  </div></div>`;
}

function kostView() {
  const m = macros(), e = eaten(), L = day();
  return `<h1>Kost</h1>
    ${dayRing(e, m)}
    <h2 class="ksection">Måltider</h2>
    ${L.food.length ? "" : `<div class="card kempty"><div class="muted">Inget loggat ${editDate ? "den här dagen" : "idag"} än.</div>
      ${yesterdayFood() ? `<button class="klink kday" data-repeatday>↻ Samma mat som igår<span class="muted"> · hela dagen, ${tnum(sumKcal(yesterdayFood()))} kcal</span></button>` : ""}</div>`}
    ${MEALS.map((_, i) => mealCard(i, L)).join("")}${mealCard(-1, L)}
    <button class="primary wide kaddbtn" data-addto="${mealByClock()}">+ Lägg till mat</button>
    <div class="muted small credit">Näringsvärden: Livsmedelsverkets livsmedelsdatabas (CC BY 4.0) och egna uppskattningar.</div>
    ${recipeEdit ? recipeSheet() : recipeList ? recipesSheet() : foodSheet ? addSheet(m) : foodItem != null ? itemSheet() : ""}`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-addfood],[data-addto],[data-fsclose],[data-quick],[data-mstep],[data-mdel],[data-repeat],[data-savegroup],[data-sheetmeal],[data-usemeal],[data-repeatday],[data-quickmore],[data-manualkcal],[data-fooditem],[data-itemclose],[data-qty],[data-itemfav]");
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
  else if (ds.mstep) { const food = day().food, i = +ds.mi; if (food[i] && !stepItem(food[i], +ds.mstep)) food.splice(i, 1); }
  else if (ds.mdel) day().food.splice(+ds.mdel, 1);
  else if (ds.qty) {
    // Hela steg, men en halv portion går att välja under 1
    const f = day().food[foodItem], q = f.qty || 1;
    setQty(f, +ds.qty > 0 ? (q < 1 ? 1 : q + 1) : (q <= 1 ? 0.5 : q - 1));
  }
  else if (ds.itemfav !== undefined) toggleFav(day().food[foodItem]);
  else if (ds.repeat) {
    const meal = +ds.repeat, last = lastSlot(meal);
    if (last) last.items.forEach(f => logFood({ ...perUnit(f), qty: f.qty, est: isEst(f) }, meal));
  }
  else if (ds.sheetmeal) { foodSheet.meal = +ds.sheetmeal; quickMore = false; }
  else if (ds.usemeal) addQuick({ ...S.meals[+ds.usemeal], kind: "meal" }, +ds.meal);
  else if (ds.repeatday !== undefined) {
    const food = yesterdayFood() || [];
    food.forEach(f => logFood({ ...perUnit(f), qty: f.qty, est: isEst(f) }, f.meal));
    toast(`Lade till ${food.length} saker från igår`);
  }
  else if (ds.savegroup) {
    const meal = +ds.savegroup, items = day().food.filter(f => f.meal === meal && !isEst(f));
    const names = items.map(f => f.name + qtyText(f)).join(", ");
    S.meals.push({
      name: names.length > 40 ? names.slice(0, 38) + "…" : names, slot: meal,
      kcal: sumKcal(items), protein: items.reduce((a, f) => a + (+f.protein || 0), 0),
      items: items.map(f => ({ ...perUnit(f), qty: f.qty })),
    });
    toast("Sparad bland snabbvalen");
  }
  save();
  render();
});

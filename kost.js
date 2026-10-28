"use strict";
// ---------- Kost: snabb loggning ----------
// Sidan visar dagens mål och en kompakt ruta med måltiderna. "+ Lägg till" öppnar ett fönster för
// just den måltiden: sökning, det som redan ligger i måltiden (med − mängd +) och förslag (favoriter,
// egna måltider och det man ätit senast). Uppskattningar ("ca 600 kcal") är en egen sorts post som
// aldrig blir favorit eller förslag. Laddas före app.js; anropas först när appen ritas.

let foodSheet = null;     // { meal } när fönstret för att lägga till är öppet
let foodItem = null;      // index i dagens mat när en loggad sak är öppen
let quickMore = false;    // visa fler förslag
let foodPanel = "senaste"; // under fältet: "senaste" (förslag) eller "kcal" (bara kcal)
let quickCache = [];

// Måltid efter klockan: före 10 frukost, före 14 lunch, före 17 mellanmål, annars middag
function mealByClock() {
  const h = new Date().getHours();
  return h < 10 ? 0 : h < 14 ? 1 : h < 17 ? 2 : 3;
}
const currentMeal = () => foodSheet ? foodSheet.meal : mealByClock();

// Gram med en decimal (fett och fibrer)
const g1 = v => Math.round(v * 10) / 10;
// All mat loggas här, så att den hamnar i rätt måltid. Med amt styr mängden kcal, protein, fett och fibrer;
// med qty är de per styck. Fett och fibrer saknas när livsmedlet inte har dem (egna kcal, äldre loggar).
// Det som nyss lagts till lyser till en gång där det syns, i stället för ett besked
let fresh = new WeakSet(), freshT = 0;
function markFresh(f) {
  fresh.add(f);
  clearTimeout(freshT);
  freshT = setTimeout(() => { fresh = new WeakSet(); }, 2500);
}
function logFood(item, meal = currentMeal()) {
  const f = { name: item.name, kcal: Math.round(+item.kcal || 0), protein: Math.round(+item.protein || 0), meal };
  if (item.fat != null) f.fat = g1(+item.fat);
  if (item.fiber != null) f.fiber = g1(+item.fiber);
  if (item.est) f.est = true;
  if (item.amt) { f.amt = { ...item.amt, u: { ...item.amt.u } }; applyAmt(f); }
  else if (item.qty && item.qty !== 1) setQty(f, item.qty);
  day().food.push(f);
  markFresh(f);
}

// ---------- Mängd ----------
// amt = { n, unit, k, p, fa, fi, u }: mängd i en enhet, kcal, protein, fett och fibrer per 100 g och gram per enhet.
// Det är mängden man ändrar; kcal och protein räknas fram.
const UNIT_NAMES = { g: "g", dl: "dl", st: "st", msk: "msk", tsk: "tsk", krm: "krm", skiva: "skivor", portion: "portion", bit: "bitar",
  burk: "burk", glas: "glas", kopp: "kopp", skopa: "skopor", nave: "nävar", pase: "påse", klyfta: "klyftor" };
const unitGrams = (a, unit) => unit === "g" ? 1 : a.u[unit] || UNIT_DEFAULT[unit] || 100;
const amtGrams = a => a.n * unitGrams(a, a.unit);
const amtText = a => `${fmtNum(a.n)} ${UNIT_NAMES[a.unit] || a.unit}`;
// Gram med en decimal
const r1 = v => Math.round(v * 10) / 10;
function applyAmt(f) {
  const g = amtGrams(f.amt);
  f.kcal = Math.round(f.amt.k * g / 100);
  f.protein = Math.round(f.amt.p * g / 100);
  if (f.amt.fa != null) f.fat = g1(f.amt.fa * g / 100);
  if (f.amt.fi != null) f.fiber = g1(f.amt.fi * g / 100);
}
// Från en tolkad rad ("2 dl mjölk", "bolognese") till mängd och enhet
function amtFromItem(i) {
  const food = i.food, u = {};
  for (const k of UNIT_KEYS) if (food[k]) u[k] = food[k];
  let n, unit = i.unit;
  if (!unit && i.qty == null) {
    unit = food.def || (food.portion ? "portion" : food.st ? "st" : food.msk ? "msk" : "g");
    n = unit === "g" ? 100 : unit === "msk" ? 2 : 1;
  } else if (!unit) { unit = food.st ? "st" : food.portion ? "portion" : "g"; n = unit === "g" ? Math.round(i.grams) : i.qty; }
  else if (["g", "hg", "kg"].includes(unit)) { unit = "g"; n = Math.round(i.grams); }
  else if (["ml", "cl", "l"].includes(unit)) { unit = "dl"; n = i.qty * { ml: 0.01, cl: 0.1, l: 10 }[i.unit]; }
  else n = i.qty ?? 1;
  const a = { n, unit, k: food.kcal, p: food.p, u };
  if (food.fat != null) { a.fa = food.fat; a.fi = food.fib || 0; }
  return a;
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

// Det man skrivit i sökrutan, tolkat till rader med mängd som går att ändra innan man lägger till.
// Ord som inte går att tolka blir en fråga med högst fyra förslag.
let foodDraft = [];
function draftRows(items) {
  foodDraft = items.map(i => i.known ? { name: i.name, corrected: i.corrected, amt: amtFromItem(i), text: i.text, typed: i.typed, alts: variantFoods(i.typed, i.food) }
    : (() => { const { prefix, rest } = splitAmount(i.text); return { text: i.text, prefix, rest, sugg: suggestFoods(rest, 4) }; })());
  return foodDraft.map((d, j) => d.amt ? draftRow(d, j) : askRow(d, j)).join("");
}
// Ungefär vad ett förslag ger: per styck eller portion om det finns, annars per 100 g
const suggKcal = f => Math.round(f.kcal * (f.st || f.portion || 100) / 100);
function askRow(d, j) {
  return `<div class="fask"><div class="fask-q"><span class="fdot" aria-hidden="true"></span><span>${d.sugg.length ? "Vilken menade du med" : "Känner inte igen"} <b>${esc(d.rest || d.text)}</b>${d.sugg.length ? "?" : ""}</span></div>
    ${d.sugg.length ? `<div class="fask-opts">${d.sugg.map((x, k) => `<button data-fpick="${j}:${k}">${esc(x.label)} · ${suggKcal(x.food)} kcal</button>`).join("")}</div>`
      : `<div class="muted small">Skriv mängd och livsmedel, t.ex. "150 g kyckling", eller välj Bara kcal.</div>`}</div>`;
}
const draftKcal = d => { const g = amtGrams(d.amt); return `${Math.round(d.amt.k * g / 100)} kcal · ${Math.round(d.amt.p * g / 100)} g protein`; };
// Mängden är en ihopsatt stegare; ett tryck på mängden visar fält för antal och enhet
function draftRow(d, j) {
  return `<div class="drow" data-drow="${j}"><div class="grow"><b>${esc(d.name)}</b><div class="muted small dk">${draftKcal(d)}</div></div>
    <div class="fstep"><button data-astep="-1" ${d.amt.n <= (d.amt.unit === "g" ? 10 : 0.5) ? "disabled" : ""} aria-label="Mindre ${esc(d.name)}">−</button>
      <button class="famt" data-amtopen aria-label="Ändra mängd och enhet för ${esc(d.name)}">${amtText(d.amt)}</button>
      <button data-astep="1" aria-label="Mer ${esc(d.name)}">+</button></div>
    <div class="famtedit" hidden><input class="amt-n" type="number" inputmode="decimal" min="0" step="any" value="${d.amt.n}" data-d${j}="n" aria-label="Mängd">
      <select class="amt-u" data-d${j}="u" aria-label="Enhet">${unitChoices(d.amt).map(k => `<option value="${k}" ${k === d.amt.unit ? "selected" : ""}>${UNIT_NAMES[k] || k}</option>`).join("")}</select></div></div>
    ${d.alts && d.alts.length ? `<div class="fvars"><span class="muted small">Annan sort?</span>${d.alts.map((x, k) => `<button data-fvar="${j}:${k}">${esc(x.label)}</button>`).join("")}</div>` : ""}`;
}
// En annan sort ersätter namnet i fältet och behåller mängden: "2 msk grädde" → "2 msk matlagningsgrädde"
function pickVariant(j, k) {
  const d = foodDraft[j], x = d && d.alts && d.alts[k], input = $("fname");
  if (!x || !input) return;
  const at = d.text.toLowerCase().lastIndexOf(d.typed);
  const seg = at < 0 ? x.name : d.text.slice(0, at) + x.name + d.text.slice(at + d.typed.length);
  input.value = input.value.replace(d.text, seg);
  foodPreview();
  input.focus();
}
// Ändrad mängd i ett utkast: bara den raden ritas om, så att tangentbordet stannar kvar
function updateDraft(el) {
  const row = el.closest("[data-drow]"), j = +row.dataset.drow, d = foodDraft[j];
  if (el.classList.contains("amt-u")) { setUnit(d.amt, el.value); row.querySelector(".amt-n").value = d.amt.n; }
  else d.amt.n = Math.max(0, +String(el.value).replace(",", ".") || 0);
  row.querySelector(".dk").textContent = draftKcal(d);
  row.querySelector(".famt").textContent = amtText(d.amt);
  row.querySelector('[data-astep="-1"]').disabled = d.amt.n <= (d.amt.unit === "g" ? 10 : 0.5);
  updateFoodBtn();
}
document.addEventListener("input", ev => {
  if (ev.target.closest && ev.target.closest("[data-drow]")) updateDraft(ev.target);
  if (ev.target.id === "rname" && recipeEdit) recipeEdit.name = ev.target.value;
});
// Receptfönstret
// Mängd per portion (gram) när en ingrediens skrivs utan mängd. Första träffen på namnets början gäller.
const PORTION_GUESS = [
  [/^(notfars|blandfars|flaskfars|kycklingfars|lammfars|viltfars|fars|kyckling|flaskfile|flaskkarre|kassler|hogrev|biff|entrecote|oxfile|kott|lax|torsk|sej|fisk|rakor|tofu|halloumi|quorn)/, 125],
  [/^(bacon|chorizo|salami|skinka)/, 35], [/^(korv|falukorv|prinskorv)/, 100], [/^agg/, 60],
  [/^(gul lok|lok|rodlok|schalottenlok|purjolok)/, 30], [/^vitlok/, 4],
  [/^(paprika|tomat|morot|morotter|zucchini|squash|aubergine|svamp|champinjon|selleri|gurka|majs|artor|haricots|sockerartor)/, 50],
  [/^(broccoli|blomkal|vitkal|spenat|gronkal|sallad)/, 60], [/^(bonor|kikartor|linser)/, 60],
  [/^(krossade tomater|passerade tomater|tomatsas)/, 100], [/^kokosmjolk/, 60],
  [/^(gradde|matlagningsgradde|vispgradde|creme fraiche|graddfil|turkisk yoghurt)/, 40], [/^(mjolk|filmjolk|yoghurt)/, 100],
  [/^(ost|riven ost|parmesan|mozzarella|feta)/, 30], [/^(smor|olja|olivolja|rapsolja)/, 10],
  [/^(pasta|spaghetti|makaroner|penne|nudlar|lasagneplattor|okokt pasta)/, 80], [/^(ris|bulgur|couscous|quinoa)/, 70],
  [/^(potatis|sotpotatis)/, 200], [/^(mjol|vetemjol|strobrod)/, 15], [/^(tomatpure|soja|socker|honung|buljong)/, 10],
];
// Räknas i styck när livsmedlet har en styckvikt
const COUNT_FOODS = /^(agg|gul lok|lok|rodlok|paprika|tomat|morot|zucchini|squash|aubergine|potatis|banan|apple|citron|lime|avokado|vitlok)/;
function ingCalc(it) {
  const g = amtGrams(it.amt);
  it.kcal = Math.round(it.amt.k * g / 100);
  it.protein = Math.round(it.amt.p * g / 10) / 10;
  if (it.amt.fa != null) { it.fat = r1(it.amt.fa * g / 100); it.fiber = r1((it.amt.fi || 0) * g / 100); }
  return it;
}
// Gram till mängd i livsmedlets egen enhet: styck för ägg och grönsaker, annars avrundade gram
function gramsToAmt(a, g, count) {
  if (count && a.u.st) { const n = g / a.u.st; a.unit = "st"; a.n = n >= 1.5 ? Math.round(n) : Math.max(0.5, Math.round(n * 2) / 2); }
  else if (a.unit !== "g") a.n = Math.max(0.5, Math.round(g / unitGrams(a, a.unit) * 2) / 2);
  else { a.unit = "g"; a.n = g < 100 ? Math.max(5, Math.round(g / 5) * 5) : Math.round(g / 25) * 25; }
  return a;
}
function ingredient(i, portions) {
  if (i.qty != null || i.unit) return ingCalc({ name: i.name, text: i.text, amt: amtFromItem(i) });
  const key = norm(i.name), hit = PORTION_GUESS.find(([re]) => re.test(key));
  const per = hit ? hit[1] : Math.min(i.food.portion || 100, 150);
  const a = amtFromItem({ ...i, unit: "g", grams: per * portions });
  return ingCalc({ name: i.name, text: i.text, est: true, amt: gramsToAmt(a, per * portions, COUNT_FOODS.test(key)) });
}
// Fler eller färre portioner: de uppskattade mängderna följer med, de man skrivit själv står kvar
function scaleIngredients(r, from) {
  for (const it of r.items) if (it.est && it.amt) ingCalc(Object.assign(it, { amt: gramsToAmt(it.amt, amtGrams(it.amt) * r.portions / from, it.amt.unit === "st") }));
}
const ingText = it => it.amt ? `${cap(it.name)}` : cap(it.text);
function addIngredients() {
  const el = $("ring"), text = (el.value || "").trim();
  if (!text) return;
  const r = parseFood(text), ok = r.items.filter(i => i.known);
  ok.forEach(i => recipeEdit.items.push(ingredient(i, recipeEdit.portions)));
  recipeEdit.msg = r.unknown.length ? `Känns inte igen: ${r.unknown.join(", ")}. Skriv mängd och livsmedel, t.ex. "200 g nötfärs".` : "";
  render();
  const again = $("ring");
  if (again) { again.value = r.unknown.join(", "); again.focus(); }
}
document.addEventListener("keydown", ev => { if (ev.target.id === "ring" && ev.key === "Enter") { ev.preventDefault(); addIngredients(); } });
document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-rlist],[data-rclose],[data-rnew],[data-rmeal],[data-rsort],[data-redit],[data-ruse],[data-rcancel],[data-rport],[data-ringadd],[data-rdel],[data-rsave],[data-rremove],[data-ristep],[data-ropen],[data-rback],[data-rn]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset;
  if (ds.ringadd !== undefined) { addIngredients(); return; }
  const top = () => window.scrollTo(0, 0);
  if (ds.rlist !== undefined) { if (tab !== "recept") recBack = tab; tab = "recept"; recipeOpen = null; recipeEdit = null; recQ = ""; top(); }
  else if (ds.rclose !== undefined) { tab = recBack || "kost"; recipeOpen = null; recipeEdit = null; top(); }
  else if (ds.rnew !== undefined) { recipeEdit = { idx: null, name: "", portions: 4, items: [], msg: "" }; top(); }
  else if (ds.redit) { recipeOpen = null; const r = recipes()[+ds.redit]; recipeEdit = { idx: +ds.redit, name: r.name, portions: r.portions, items: r.items.map(i => ({ ...i })), msg: "" }; }
  else if (ds.ruse) {
    // Plus i listan: en portion, och man stannar i listan. Från ett öppet recept: så många man valt, sedan tillbaka.
    const r = recipes()[+ds.ruse], p = perPortion(r), open = recipeOpen, n = open ? open.n : 1, meal = recMeal();
    if (n === 1) addQuick(p, meal); else logFood({ ...p, qty: n }, meal);
    r.used = TODAY; r.uses = (r.uses || 0) + 1;
    const where = `Tillagt i ${MEALS[meal][0].toLowerCase()}`;
    if (open) {
      // Knappen blir grön en kort stund, sedan tillbaka dit man kom ifrån där måltiden lyser till
      save(); flashBtn(t, where); t.disabled = true;
      setTimeout(() => { recipeOpen = null; tab = recBack || "kost"; kostOpen = meal; render(); top(); }, 750);
      return;
    }
    save(); render(); flashSel(`[data-ruse="${ds.ruse}"]`);
    return;
  }
  else if (ds.rmeal) recMealPick = +ds.rmeal;
  else if (ds.rsort) recSort = ds.rsort;
  else if (ds.rcancel !== undefined) { if (recipeEdit.idx != null) recipeOpen = { idx: recipeEdit.idx, n: 1 }; recipeEdit = null; top(); }
  else if (ds.rport) { const from = recipeEdit.portions; recipeEdit.portions = Math.max(1, from + +ds.rport); scaleIngredients(recipeEdit, from); }
  else if (ds.ristep) {
    const it = recipeEdit.items[+ds.ristep], n = stepAmount(it.amt, +ds.dir);
    if (!n) recipeEdit.items.splice(+ds.ristep, 1);
    else { it.amt.n = n; ingCalc(it); }
  }
  else if (ds.ropen) { recipeOpen = { idx: +ds.ropen, n: 1 }; recMealPick = null; top(); }
  else if (ds.rback !== undefined) { recipeOpen = null; top(); }
  else if (ds.rn !== undefined) recipeOpen.n = Math.max(0.5, Math.min(10, recipeOpen.n + +ds.dir * 0.5));
  else if (ds.rdel) recipeEdit.items.splice(+ds.rdel, 1);
  else if (ds.rsave !== undefined) {
    const r = recipeEdit, name = (r.name || "").trim() || "Mitt recept";
    const rec = { name, portions: r.portions, items: r.items };
    const old = r.idx == null ? {} : recipes()[r.idx];
    if (old.used) { rec.used = old.used; rec.uses = old.uses; }
    if (r.idx == null) recipes().push(rec); else recipes()[r.idx] = rec;
    recipeOpen = { idx: r.idx == null ? recipes().length - 1 : r.idx, n: 1 };
    recipeEdit = null; top();
  }
  else if (ds.rremove !== undefined) { recipes().splice(recipeEdit.idx, 1); recipeEdit = null; recipeOpen = null; }
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
const perUnit = f => {
  if (f.amt) return { name: f.name, kcal: f.kcal, protein: f.protein, fat: f.fat, fiber: f.fiber, amt: { ...f.amt } };
  const s = f.per || f;
  return { name: f.name, kcal: s.kcal, protein: s.protein, fat: s.fat, fiber: s.fiber };
};
function setQty(f, q) {
  const u = perUnit(f);
  f.kcal = Math.round(u.kcal * q);
  f.protein = Math.round(u.protein * q);
  if (u.fat != null) f.fat = g1(u.fat * q);
  if (u.fiber != null) f.fiber = g1(u.fiber * q);
  if (q === 1) { delete f.qty; delete f.per; }
  else { f.qty = q; f.per = { kcal: u.kcal, protein: u.protein }; if (u.fat != null) { f.per.fat = u.fat; f.per.fiber = u.fiber; } }
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
let recipeList = false;   // (äldre) listan som ruta; recepten är nu en egen sida
let recBack = "kost";     // sidan man kom från till Recept
let recSort = "senast";   // "senast" använda först eller "namn"
let recQ = "";            // sökningen bland recepten
let recMealPick = null;   // vald måltid i ett öppet recept
let recipeOpen = null;    // { idx, n } när ett recept visas: ingredienser och hur många portioner man åt
const sumOf = (items, k) => items.reduce((a, i) => a + (+i[k] || 0), 0);
// Fett och fibrer räknas när minst en ingrediens har dem; ingredienser utan värden räknas som 0
function recipeTotal(r) {
  const t = { kcal: sumKcal(r.items), protein: sumOf(r.items, "protein") };
  if (r.items.some(i => i.fat != null)) { t.fat = sumOf(r.items, "fat"); t.fiber = sumOf(r.items, "fiber"); }
  return t;
}
function perPortion(r) {
  const t = recipeTotal(r), n = Math.max(1, r.portions || 1), p = { name: r.name, kcal: Math.round(t.kcal / n), protein: g1(t.protein / n) };
  if (t.fat != null) { p.fat = g1(t.fat / n); p.fiber = g1(t.fiber / n); }
  return p;
}
const recMeal = () => recMealPick ?? (foodSheet ? foodSheet.meal : mealByClock());
const mealFor = () => MEALS[recMeal()][0].toLowerCase();
const stepper = (attr, val, label) => `<div class="fstep"><button ${attr} data-dir="-1" aria-label="${label}: mindre">−</button><b class="famt">${val}</b><button ${attr} data-dir="1" aria-label="${label}: mer">+</button></div>`;
const portionsText = n => n === 1 ? "1 portion" : `${fmtNum(n)} portioner`;
// Recept är en egen sida: sök, sortering och en lista som klarar många recept
function receptView() { return recipeEdit ? recipeEditPage() : recipeOpen && recipes()[recipeOpen.idx] ? recipeOpenPage() : recipesPage(); }
function recipesPage() {
  const list = recipes().map((r, i) => ({ r, i }));
  const sorted = recSort === "namn" ? list.sort((a, b) => a.r.name.localeCompare(b.r.name, "sv"))
    : list.sort((a, b) => (b.r.used || "").localeCompare(a.r.used || "") || (b.r.uses || 0) - (a.r.uses || 0) || a.r.name.localeCompare(b.r.name, "sv"));
  let letter = "";
  const rows = sorted.map(({ r, i }) => {
    const p = perPortion(r), first = r.name.charAt(0).toUpperCase();
    const head = recSort === "namn" && first !== letter ? `<div class="klabel rletter" data-rgroup="${esc(first)}">${esc(letter = first)}</div>` : "";
    return `${head}<div class="qadd rrow" data-rq="${esc(norm(r.name + " " + r.items.map(it => it.name).join(" ")))}" data-rl="${esc(first)}">
      <button class="grow col rname" data-ropen="${i}"><b>${esc(r.name)}</b><span class="muted small">${portionsText(r.portions)} · ${p.kcal} kcal${r.portions === 1 ? "" : "/portion"} · ${fmtNum(Math.round(p.protein))} g protein</span></button>
      <button class="qplus" data-ruse="${i}" aria-label="Lägg till en portion ${esc(r.name)}">${icon("plus", 18)}</button></div>`;
  }).join("");
  return `<div class="recpage foodsheet"><button class="backbtn" data-rclose>${icon("left", 18)}${{ kost: "Kost", idag: "Hem" }[recBack] || "Tillbaka"}</button>
    <h1>Recept</h1><div class="muted rsub">${list.length ? `${list.length} recept · plus lägger till en portion i ${mealFor()}` : "Bygg en rätt en gång, logga sedan en portion med ett tryck."}</div>
    ${list.length > 3 ? `<div class="finput rsearch">${icon("search", 18)}<input id="rsearch" type="search" placeholder="Sök recept eller ingrediens" value="${esc(recQ)}" autocomplete="off" aria-label="Sök recept"></div>
      <div class="fopts"><button class="flink ${recSort === "senast" ? "on" : ""}" data-rsort="senast" aria-pressed="${recSort === "senast"}">Senast använda</button>
        <button class="flink ${recSort === "namn" ? "on" : ""}" data-rsort="namn" aria-pressed="${recSort === "namn"}">A–Ö</button></div>` : ""}
    ${list.length ? `<section class="card rlist qgrid">${rows}<div class="muted rnone" hidden>Inga recept matchar.</div></section>` : ""}
    <div class="pagefoot"><button class="primary wide bigbtn" data-rnew>${icon("plus", 18)}Nytt recept</button></div></div>`;
}
// Sökningen filtrerar raderna utan att sidan ritas om, så att tangentbordet stannar
function filterRecipes() {
  const q = norm(recQ.trim());
  let shown = 0;
  for (const el of document.querySelectorAll(".rlist .rrow")) { el.hidden = !!q && !el.dataset.rq.includes(q); if (!el.hidden) shown++; }
  for (const h of document.querySelectorAll(".rlist .rletter")) h.hidden = ![...document.querySelectorAll(`.rlist .rrow[data-rl="${CSS.escape(h.dataset.rgroup)}"]`)].some(x => !x.hidden);
  const none = document.querySelector(".rnone");
  if (none) none.hidden = shown > 0;
}
document.addEventListener("input", ev => { if (ev.target.id === "rsearch") { recQ = ev.target.value; filterRecipes(); } });
function recipeOpenPage() {
  const r = recipes()[recipeOpen.idx], t = recipeTotal(r), p = perPortion(r), n = recipeOpen.n, meal = recMeal();
  const tile = (v, l) => `<div><b>${v}</b><span>${l}</span></div>`;
  return `<div class="recpage foodsheet"><button class="backbtn" data-rback>${icon("left", 18)}Recept</button>
    <div class="row between rtitle"><span class="col"><span class="klabel">Recept · ${portionsText(r.portions)}</span><h1>${esc(r.name)}</h1></span>
      <button class="pillbtn" data-redit="${recipeOpen.idx}">${icon("edit", 16)}Ändra</button></div>
    <div class="rstats four">${tile(tnum(p.kcal), "kcal/portion")}${tile(`${fmtNum(Math.round(p.protein))} g`, "protein")}
      ${p.fat != null ? `${tile(`${fmtNum(Math.round(p.fat))} g`, "fett")}${tile(`${fmtNum(Math.round(p.fiber))} g`, "fibrer")}` : ""}</div>
    <div class="muted small rtotal2">Hela receptet: ${tnum(t.kcal)} kcal${t.fat != null ? ` · ${fmtNum(Math.round(t.fat))} g fett · ${fmtNum(Math.round(t.fiber))} g fibrer` : ""}</div>
    <div class="klabel fsub">Ingredienser</div>
    <div class="ringlist">${r.items.map(it => `<div class="iline"><span class="grow">${esc(it.amt ? `${amtText(it.amt)} ${it.name.toLowerCase()}` : cap(it.text))}</span><span class="muted">${tnum(it.kcal)} kcal</span></div>`).join("")}</div>
    <div class="klabel fsub">Lägg till i</div>
    <div class="mealseg">${MEALS.map(([nm], i) => `<button data-rmeal="${i}" class="${i === meal ? "on" : ""}" aria-pressed="${i === meal}">${nm}</button>`).join("")}</div>
    <div class="pagefoot"><div class="row between reat"><span>Hur mycket åt du?</span>${stepper("data-rn", portionsText(n), "Portioner")}</div>
      <button class="primary wide bigbtn" data-ruse="${recipeOpen.idx}">Lägg till i ${mealFor()} · ${tnum(p.kcal * n)} kcal</button></div></div>`;
}
function recipeEditPage() {
  const r = recipeEdit, t = recipeTotal(r), p = perPortion(r);
  return `<div class="recpage foodsheet"><button class="backbtn" data-rcancel>${icon("left", 18)}Avbryt</button>
    <span class="klabel">${r.idx == null ? "Nytt recept" : "Ändra recept"}</span>
    <input id="rname" class="rnamein" value="${esc(r.name)}" placeholder="Namn, t.ex. Lasagne" autocomplete="off" aria-label="Namn på receptet">
    <div class="row between rport"><span class="col"><span>Portioner</span><span class="muted small">Mängderna räknas för så många</span></span>
      <div class="fstep"><button data-rport="-1" ${r.portions <= 1 ? "disabled" : ""} aria-label="Färre portioner">−</button><b class="famt qcount">${r.portions}</b>
      <button data-rport="1" aria-label="Fler portioner">+</button></div></div>
    <div class="finput ringin"><input id="ring" placeholder="t.ex. nötfärs, ägg, lök, 2 dl grädde" autocomplete="off" aria-label="Ingredienser"><button class="primary small" data-ringadd>Lägg till</button></div>
    <div class="muted small rhint">Skriv bara vad som ingår. Utan mängd uppskattar vi en vanlig mängd för ${portionsText(r.portions).replace("1 portion", "en portion")}.</div>
    ${r.msg ? `<div class="muted small warntext rhint">${esc(r.msg)}</div>` : ""}
    ${r.items.length ? `<div class="klabel fsub">Ingredienser · ${r.items.length}</div>
      <div class="ringlist">${r.items.map((it, k) => `<div class="krow ing"><span class="grow"><b>${esc(ingText(it))}</b><span class="muted small">${tnum(it.kcal)} kcal · ${it.est ? `<span class="esttag">uppskattad mängd</span>` : it.amt ? "som du skrev" : `${fmtNum(+it.protein || 0)} g protein`}</span></span>
        ${it.amt ? stepper(`data-ristep="${k}"`, amtText(it.amt), it.name) : `<button class="small ghost iconbtn" data-rdel="${k}" aria-label="Ta bort ${esc(it.name)}">${icon("close", 18)}</button>`}</div>`).join("")}</div>
      <div class="rstats two"><div><b>${tnum(p.kcal)}</b><span>kcal per portion · ${fmtNum(Math.round(p.protein))} g protein${p.fat != null ? ` · ${fmtNum(Math.round(p.fat))} g fett · ${fmtNum(Math.round(p.fiber))} g fibrer` : ""}</span></div><div><b>${tnum(t.kcal)}</b><span>kcal i hela receptet</span></div></div>` : ""}
    <div class="pagefoot row">${r.idx != null ? `<button class="ghost dangertext" data-rremove>Ta bort</button>` : ""}
      <button class="primary grow bigbtn" data-rsave ${r.items.length ? "" : "disabled"}>Spara recept</button></div></div>`;
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
  if (have && have.amt && f.amt && have.amt.unit === f.amt.unit) { have.amt.n += f.amt.n; applyAmt(have); markFresh(have); }
  else if (have && !have.amt) { setQty(have, (have.qty || 1) + 1); markFresh(have); }
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
let kostOpen = null;   // måltiden som är utfälld i Kost
let kostDay = false;  // en annan dag är vald i veckoremsan
function mealCard(meal, L) {
  const items = L.food.map((f, i) => ({ f, i })).filter(x => (x.f.meal ?? -1) === meal);
  const name = meal < 0 ? "Övrigt" : MEALS[meal][0];
  if (!items.length) return meal < 0 ? "" : `<div class="kmrow empty" aria-label="${name}, inget än"><span class="kmic">${mealIcon(meal)}</span>
    <span class="grow col"><b>${name}</b><span class="muted small">Inget än</span></span></div>`;
  const sum = sumKcal(items.map(x => x.f)), prot = items.reduce((a, x) => a + (+x.f.protein || 0), 0), open = kostOpen === meal;
  const added = sumKcal(items.filter(x => fresh.has(x.f)).map(x => x.f));
  const preview = items.length > 2 ? `${items.length} saker · ${fmtNum(Math.round(prot))} g protein` : items.map(x => isEst(x.f) ? "≈ Uppskattning" : x.f.name).join(", ");
  return `<button class="kmrow ${items.some(x => fresh.has(x.f)) ? "fresh" : ""}" data-kmeal="${meal}" aria-expanded="${open}"><span class="kmic">${mealIcon(meal)}</span>
      <span class="grow col"><b>${name}</b><span class="muted small kprev">${esc(preview)}</span></span>
      ${added ? `<span class="kplus" aria-label="${tnum(added)} kcal tillagt">+${tnum(added)}</span>` : ""}<b class="kmsum">${tnum(sum)}</b><span class="chev">${icon(open ? "down" : "right", 18)}</span></button>
    ${open ? `<div class="kmitems">${items.map(({ f, i }) => `<button class="krow ${isEst(f) ? "est" : ""} ${fresh.has(f) ? "fresh" : ""}" data-fooditem="${i}">
      <span class="grow"><b>${foodTitle(f)}</b>${isEst(f) ? `<span class="muted small">ungefärligt</span>` : ""}</span><span class="kkcal">${tnum(f.kcal)}</span></button>`).join("")}</div>` : ""}`;
}
// Veckan: en stapel per dag mot kalorimålet. Ett tryck visar den dagen.
function kostWeek() {
  const goal = macros().kcal;
  return `<div class="kweek" role="group" aria-label="Veckan">${weekDates(weekStart(logDate())).map((d, i) => {
    const kc = eaten(d).kcal, pct = goal ? Math.min(1, kc / goal) : 0;
    return `<button class="kwd ${d === logDate() ? "on" : ""}" data-kday="${d}" ${d > TODAY ? "disabled" : ""} aria-pressed="${d === logDate()}" aria-label="${WD_LONG[i]}: ${tnum(kc)} kcal">
      <span>${WD[i][0]}</span><i class="ktr"><i class="${kc > goal * 1.05 ? "over" : ""}" style="height:${Math.round(pct * 100)}%"></i></i></button>`; }).join("")}</div>`;
}
// Kvar idag: kcal som en stapel och protein under
function kostSummary(e, m) {
  const left = m.kcal - e.kcal, pct = m.kcal ? Math.min(100, Math.round(e.kcal / m.kcal * 100)) : 0;
  return `<section class="card dayring ksum" aria-label="${editDate ? dateLabel(editDate) : "Dagens intag"}">
    <div class="row between ksumtop"><span class="col"><span class="klabel">${left >= 0 ? (editDate ? "Kvar den dagen" : "Kvar idag") : "Över målet"}</span>
      <b class="kleft">${tnum(Math.abs(left))} <small>kcal</small></b></span>
      <span class="muted small kate">${tnum(e.kcal)} av ${tnum(m.kcal)}<br>ätit</span></span></div>
    <div class="bar kbar ${left < -m.kcal * 0.05 ? "over" : ""}"><div style="width:${pct}%"></div></div>
    <div class="kmacros">
      <div class="kprot"><span class="muted small">Protein</span><span class="small"><b>${tnum(e.protein)}</b> / ${tnum(m.protein)} g</span>${bar(e.protein, m.protein, true, "prot")}</div>
      <div class="kfat"><span class="muted small">Fett</span><span class="small"><b>${tnum(e.fat)}</b> / ${tnum(m.fat)} g</span>${bar(e.fat, m.fat, false, "fat")}</div>
      <div class="kfib"><span class="muted small">Fibrer</span><span class="small"><b>${tnum(e.fiber)}</b> / ${m.fiber} g</span>${bar(e.fiber, m.fiber, true, "fib")}</div></div>
    ${e.n > e.known ? `<div class="muted small kmiss">Fett och fibrer saknas för ${e.n - e.known} av ${e.n} saker idag.</div>` : ""}
    ${S.profileSet === false ? `<button class="link small" data-tab="profil" data-popen="kalori">Målet bygger på standardvärden – ställ in ditt</button>` : ""}</section>`;
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

// Bladet för att lägga till mat: måltid, ett fält, tre små val och en enda knapp längst ned.
// Knappen visar måltid och summa och uppdateras medan man skriver.
function addSheet(m) {
  const meal = foodSheet.meal, mealName = MEALS[meal][0].toLowerCase(), q = quickList(meal), shown = quickMore ? q : q.slice(0, 6);
  const food = day().food, items = food.map((f, i) => ({ f, i })).filter(x => x.f.meal === meal);
  const double = items.length > 1;
  const last = items.length ? null : lastSlot(meal), saved = items.length ? [] : savedFor(meal).slice(0, 3);   // en uppskattning bredvid riktig mat kan räknas dubbelt
  const now = [...items.filter(x => fresh.has(x.f)).reverse(), ...items.filter(x => !fresh.has(x.f))].map(({ f, i }) => `<div class="nrow krow ${isEst(f) ? "est" : ""} ${fresh.has(f) ? "fresh" : ""}"><span class="grow"><b>${itemName(f)}</b><span class="muted small">${f.kcal} kcal${isEst(f) && double ? ` · <span class="warntext">kan räknas dubbelt</span>` : ""}</span></span>
    ${isEst(f) ? `<button class="small qminus" data-mdel="${i}" aria-label="Ta bort uppskattningen">${icon("close", 18)}</button>`
      : `<div class="fstep"><button data-mstep="-1" data-mi="${i}" aria-label="Mindre ${esc(f.name)}">−</button><b class="famt qcount">${amountText(f) || "1"}</b>
         <button data-mstep="1" data-mi="${i}" aria-label="Mer ${esc(f.name)}">+</button></div>`}</div>`).join("");
  // Förslagen som en lista: namn och kcal, plus till höger (stjärna för favoriter)
  const quick = shown.map((f, i) => `<button class="qadd ${f.kind === "meal" ? "meal" : f.kind === "recipe" ? "recipe" : ""}" data-quick="${i}" aria-label="Lägg till ${esc(f.name)}">
      <span class="grow col"><b>${esc(f.name)}</b><span class="muted small">${f.kcal} kcal${f.kind === "recipe" ? " per portion" : f.kind === "meal" ? " · sparad måltid" : ""}</span></span>
      <span class="qplus ${f.kind === "fav" ? "fav" : ""}" aria-hidden="true">${f.kind === "fav" ? "★" : icon("plus", 18)}</span></button>`).join("");
  return `<div class="overlay" data-fsclose><div class="sheet foodsheet" role="dialog" aria-label="Lägg till mat">
    <div class="row between fshead"><span class="col"><span class="klabel">Lägg till mat</span><h2>${MEALS[meal][0]}</h2></span>
      <button class="small ghost iconbtn" data-fsclose aria-label="Stäng">${icon("close", 18)}</button></div>
    <div class="mealseg" role="radiogroup" aria-label="Måltid">${MEALS.map(([n], i) => `<button role="radio" data-sheetmeal="${i}" class="${i === meal ? "on" : ""}" aria-checked="${i === meal}">${n}</button>`).join("")}</div>
    <div class="finput">${icon("search", 18)}<input id="fname" placeholder="${items.length ? "Lägg till mer …" : "t.ex. 2 ägg och 1 banan"}" autocomplete="off" aria-label="Vad åt du?">
      ${CAN_SCAN ? `<button class="fscan" data-scan aria-label="Skanna streckkod">${icon("barcode", 22)}</button>` : ""}</div>
    <div class="fopts"><button class="flink ${foodPanel === "kcal" ? "on" : ""}" data-fpanel="${foodPanel === "kcal" ? "senaste" : "kcal"}" aria-pressed="${foodPanel === "kcal"}">Bara kcal</button>
      <button class="flink" data-rlist>Recept${recipes().length ? ` (${recipes().length})` : ""}</button></div>
    <div class="manual" ${foodPanel === "kcal" ? "" : "hidden"}><div class="row">
      <label class="field grow">kcal<input id="fkcal" type="number" inputmode="numeric" placeholder="ca ${mealTarget(meal, m)}"></label>
      <label class="field grow">Protein (g)<input id="fprot" type="number" inputmode="numeric" placeholder="valfritt"></label></div>
      <div class="muted small">Med text i fältet sparas den som namn, annars blir det en uppskattning.</div></div>
    <div id="fpreview" class="fpreview"></div>
    <div class="fidle">
    ${items.length ? `<div class="row between nowhead"><span class="klabel accent">I ${mealName}en nu · <span class="${items.some(x => fresh.has(x.f)) ? "oktext" : ""}">${items.length} ${items.length === 1 ? "sak" : "saker"}</span></span>
      ${items.filter(x => !isEst(x.f)).length > 1 ? `<button class="linkbtn2 small" data-savegroup="${meal}">Spara som måltid</button>` : ""}</div><div class="nowcard">${now}</div>` : ""}
    ${foodPanel === "senaste" ? `${!items.length && (last || saved.length) ? `<div class="kshort">
      ${saved.map(({ m: sm, idx }) => `<button class="klink" data-usemeal="${idx}" data-meal="${meal}">${esc(sm.name)}<span class="muted"> · ${sm.kcal} kcal</span></button>`).join("")}
      ${last ? `<button class="klink" data-repeat="${meal}">↻ Samma som ${whenText(last.date)}<span class="muted"> · ${esc(last.items.map(f => isEst(f) ? "uppskattning" : f.name).join(", "))}</span></button>` : ""}</div>` : ""}
    ${q.length ? `<h3 class="klabel fsub">Senaste</h3><div class="qgrid">${quick}</div>
      ${q.length > 6 ? `<button class="small ghost qmore" data-quickmore>${quickMore ? "Visa färre" : `Visa fler (${q.length - 6})`}</button>` : ""}` : ""}` : ""}
    </div>
    <div class="sheet-foot"><button class="primary wide" id="faddbtn" data-addfood>Klar</button></div>
  </div></div>`;
}
// Vad knappen längst ned gör just nu: lägga till det som står i fältet (med summa) eller stänga
function foodPending() {
  const text = ($("fname") && $("fname").value || "").trim(), manual = foodPanel === "kcal" ? Math.round(+($("fkcal") || {}).value || 0) : 0;
  if (manual) return { kcal: manual, ready: true };
  if (!text) return { ready: false };
  const known = (S.learned || {})[norm(text)];
  if (known) return { kcal: known.kcal, ready: true, learned: known };
  const ok = foodDraft.filter(d => d.amt), unk = foodDraft.some(d => !d.amt);
  const kcal = ok.reduce((a, d) => a + Math.round(d.amt.k * amtGrams(d.amt) / 100), 0);
  if (unk) return cloud.sample ? { ready: true, claude: true } : { ready: false, unknown: true, kcal };
  return { kcal, ready: ok.length > 0 };
}
function updateFoodBtn() {
  const b = $("faddbtn");
  if (!b || !foodSheet) return;
  const meal = foodSheet.meal, name = MEALS[meal][0].toLowerCase(), p = foodPending();
  const inMeal = sumKcal(day().food.filter(f => f.meal === meal));
  b.disabled = !!p.unknown;
  b.textContent = p.ready ? `Lägg till i ${name}${p.claude ? "" : ` · ${tnum(p.kcal)} kcal`}`
    : p.unknown ? "Välj vad du menade ovan" : inMeal ? `Klar · ${tnum(inMeal)} kcal i ${name}en` : "Klar";
}
// Fältet styr vad som visas: tolkade rader när man skrivit något, annars det som redan finns och förslagen
function foodPreview() {
  const input = $("fname"), out = $("fpreview");
  if (!input || !out) return;
  const text = input.value.trim(), idle = document.querySelector(".fidle");
  if (idle) idle.hidden = !!text;
  if (!text) { out.innerHTML = ""; foodDraft = []; updateFoodBtn(); return; }
  const known = (S.learned || {})[norm(text)];
  if (known) {
    foodDraft = [];
    out.innerHTML = `<div class="drow"><div class="grow"><b>${esc(text)}</b><div class="muted small">${known.kcal} kcal · ${known.protein} g protein · sparad uträkning</div></div></div>`;
  } else {
    const r = parseFood(text);
    out.innerHTML = draftRows(r.items) + (r.unknown.length && cloud.sample
      ? `<div class="fask-ai"><button class="small" data-askai>Räkna ut med Claude</button></div>` : "");
  }
  updateFoodBtn();
}
// Ett förslag ersätter ordet i fältet och behåller mängden
function pickFood(j, k) {
  const d = foodDraft[j], x = d && d.sugg[k];
  if (!x) return;
  const f = x.food, amount = d.prefix.trim() ? d.prefix : f.portion || f.st ? "" : f.dl ? "1 dl " : "100 g ";
  const input = $("fname");
  input.value = input.value.replace(d.text, amount + x.name);
  foodPreview();
  input.focus();
}
function itemSheet() {
  const f = day().food[foodItem];
  if (!f) { foodItem = null; return ""; }
  const q = f.qty || 1, u = perUnit(f);
  return `<div class="overlay" data-itemclose><div class="sheet">
    <div class="row between"><h2>${itemName(f)}</h2><button class="small ghost" data-itemclose aria-label="Stäng">${icon("close", 18)}</button></div>
    ${f.amt ? `<div class="row qtyrow"><span class="grow">Mängd</span>${amtInputs(f.amt, "data-iamt")}</div>`
      : `<div class="row qtyrow"><span class="grow">Antal</span>
      <button class="step" data-qty="-1" ${q <= 0.5 ? "disabled" : ""} aria-label="Färre">−</button><b class="qcount">${fmtNum(q)}</b>
      <button class="step" data-qty="1" aria-label="Fler">+</button></div>`}
    <div class="muted" style="margin-top:8px">${f.kcal} kcal · ${f.protein} g protein${f.fat != null ? ` · ${fmtNum(f.fat)} g fett · ${fmtNum(f.fiber || 0)} g fibrer` : ""}${!f.amt && q !== 1 ? ` <span class="small">(${u.kcal} kcal per st)</span>` : ""}</div>
    <div class="row" style="margin-top:12px">${isEst(f) ? `<span class="grow muted small">En uppskattning blir aldrig favorit eller förslag.</span>`
      : `<button class="grow" data-itemfav>${isFav(f) ? "★ Favorit" : "☆ Gör till favorit"}</button>`}
      <button class="ghost" data-delfood="${foodItem}" data-itemclose>Ta bort</button></div>
    <button class="primary wide" data-itemclose style="margin-top:12px">Klar</button>
  </div></div>`;
}

function kostView() {
  const m = macros(), e = eaten(), L = day();
  m.kcal += burnedOn(logDate());
  // Medan man lägger till är den måltiden utfälld, och den förblir det efteråt
  if (foodSheet) kostOpen = foodSheet.meal;
  else if (kostOpen == null) { const has = MEALS.map((_, i) => i).filter(i => L.food.some(f => f.meal === i)); kostOpen = has.includes(mealByClock()) ? mealByClock() : has.pop() ?? null; }
  const wd = cap(parse(logDate()).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" }));
  return `<h1>Kost</h1><div class="muted kdate">${wd} · vecka ${weekNo(logDate())}</div>
    ${kostWeek()}
    ${kostSummary(e, m)}
    ${!L.food.length && yesterdayFood() ? `<button class="klink kday" data-repeatday>Samma mat som igår<span class="muted"> · hela dagen, ${tnum(sumKcal(yesterdayFood()))} kcal</span></button>` : ""}
    <section class="card kdaycard" aria-label="Måltider">${MEALS.map((_, i) => mealCard(i, L)).join("")}${mealCard(-1, L)}</section>
    <button class="card homerow krecept" data-rlist><span class="kmic">${icon("kost", 18)}</span><span class="grow col"><b>Dina recept</b>
      <span class="muted small">${recipes().length ? `${recipes().length} recept` : "Bygg en rätt en gång, logga en portion med ett tryck"}</span></span><span class="chev">${icon("right", 18)}</span></button>
    <div class="muted small credit">Näringsvärden: Livsmedelsverkets livsmedelsdatabas (CC BY 4.0) och egna uppskattningar.</div>
    <div class="kadd"><button class="primary grow kaddmain" data-addto="${mealByClock()}" data-focusname>${icon("plus", 20)}Lägg till mat</button>
      ${CAN_SCAN ? `<button class="kscan" data-scan aria-label="Skanna streckkod">${icon("barcode", 22)}</button>` : ""}</div>
    ${foodSheet ? addSheet(m) : foodItem != null ? itemSheet() : ""}`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-addfood],[data-addto],[data-kmeal],[data-kday],[data-fsclose],[data-quick],[data-mstep],[data-mdel],[data-repeat],[data-savegroup],[data-sheetmeal],[data-usemeal],[data-repeatday],[data-quickmore],[data-fpanel],[data-fpick],[data-fvar],[data-amtopen],[data-fooditem],[data-itemclose],[data-qty],[data-itemfav]");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i fönstret
  const ds = t.dataset;
  if (ds.addfood !== undefined) {
    // Knappen längst ned: lägger till det som står i fältet (eller bara kcal) och stänger bladet
    if (!foodSheet) return;
    const meal = foodSheet.meal, p = foodPending(), text = ($("fname").value || "").trim();
    if (!p.ready) { foodSheet = null; render(); return; }
    if (p.claude) { askClaude(true); return; }
    if (foodPanel === "kcal" && +$("fkcal").value) {
      const prot = Math.round(+$("fprot").value || 0), mm = macros();
      logFood(text ? { name: text, kcal: p.kcal, protein: prot }
        : { name: "Uppskattning", kcal: p.kcal, protein: prot || Math.round(p.kcal * mm.protein / mm.kcal), est: true }, meal);
    }
    else if (p.learned) logFood({ name: text, kcal: p.learned.kcal, protein: p.learned.protein }, meal);
    else foodDraft.filter(d => d.amt).forEach(d => logFood({ name: d.name, amt: d.amt }, meal));
    foodDraft = [];
    foodSheet = null;
    kostOpen = meal;
  }
  else if (ds.fpanel) { foodPanel = foodPanel === ds.fpanel && ds.fpanel === "kcal" ? "senaste" : ds.fpanel; }
  else if (ds.fpick) { const [j, k] = ds.fpick.split(":").map(Number); pickFood(j, k); return; }
  else if (ds.fvar) { const [j, k] = ds.fvar.split(":").map(Number); pickVariant(j, k); return; }
  else if (ds.amtopen !== undefined) { const e = t.closest("[data-drow]").querySelector(".famtedit"); e.hidden = !e.hidden; return; }
  else if (ds.addto) { foodSheet = { meal: +ds.addto }; quickMore = false; foodPanel = "senaste"; foodDraft = []; }
  else if (ds.fsclose !== undefined) foodSheet = null;
  else if (ds.kmeal !== undefined) kostOpen = kostOpen === +ds.kmeal ? -9 : +ds.kmeal;
  else if (ds.kday) { const d = ds.kday; editDate = d === TODAY ? null : d; kostDay = !!editDate; kostOpen = null; }
  else if (ds.itemclose !== undefined) {
    foodItem = null;
    if (ds.delfood !== undefined) return;   // själva borttagningen sköts av data-delfood
  }
  else if (ds.fooditem) foodItem = +ds.fooditem;
  else if (ds.quickmore !== undefined) quickMore = !quickMore;
  else if (ds.quick) addQuick(quickCache[+ds.quick], foodSheet.meal);   // hamnar överst i "nu" och lyser till
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
  }
  else if (ds.savegroup) {
    const meal = +ds.savegroup, items = day().food.filter(f => f.meal === meal && !isEst(f));
    const names = items.map(f => f.name + qtyText(f)).join(", ");
    S.meals.push({
      name: names.length > 40 ? names.slice(0, 38) + "…" : names, slot: meal,
      kcal: sumKcal(items), protein: sumOf(items, "protein"), fat: g1(sumOf(items, "fat")), fiber: g1(sumOf(items, "fiber")),
      items: items.map(f => ({ ...perUnit(f), qty: f.qty })),
    });
    save(); render(); flashSel(`[data-savegroup="${meal}"]`, "Sparad bland snabbvalen");
    return;
  }
  const keep = $("fname") ? $("fname").value : "", kcalKeep = $("fkcal") ? $("fkcal").value : "";
  save();
  render();
  // Det man skrivit ligger kvar när man byter måltid eller val i bladet
  if (foodSheet && $("fname") && !ds.addto) { $("fname").value = keep; if ($("fkcal")) $("fkcal").value = kcalKeep; }
  if (foodSheet) foodPreview();
  if (ds.focusname !== undefined && $("fname")) $("fname").focus();
});

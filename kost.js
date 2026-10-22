"use strict";
// ---------- Kost: snabb loggning ----------
// Varje loggad sak hör till en måltid (frukost, lunch, mellanmål, middag). Favoriter, egna
// måltider och det man ätit nyligen ligger överst som snabbval, och en måltid kan upprepas
// från förra gången med ett tryck. Laddas före app.js; anropas först när appen ritas.

let foodMeal = null;      // vald måltid, eller null = efter tid på dygnet
let quickMore = false;    // visa fler snabbval
let quickCache = [];

// Måltid efter klockan: före 10 frukost, före 14 lunch, före 17 mellanmål, annars middag
function mealByClock() {
  const h = new Date().getHours();
  return h < 10 ? 0 : h < 14 ? 1 : h < 17 ? 2 : 3;
}
const currentMeal = () => foodMeal ?? mealByClock();

// All mat loggas här, så att den hamnar i rätt måltid
function logFood(item, meal = currentMeal()) {
  day().food.push({ name: item.name, kcal: Math.round(+item.kcal || 0), protein: Math.round(+item.protein || 0), meal });
}
const foodKey = f => f.name.trim().toLowerCase();
const favs = () => S.favs || (S.favs = []);
const isFav = f => favs().some(x => foodKey(x) === foodKey(f));
function toggleFav(f) {
  const i = favs().findIndex(x => foodKey(x) === foodKey(f));
  if (i >= 0) favs().splice(i, 1);
  else favs().push({ name: f.name, kcal: f.kcal, protein: f.protein });
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
    out.push({ ...f, kind: "recent" });
  }
  return (quickCache = out);
}

// Senaste dagen före idag (inom två veckor) då måltiden loggades
function lastSlot(meal) {
  for (let i = 1; i <= 14; i++) {
    const d = shift(TODAY, -i), items = ((S.log[d] && S.log[d].food) || []).filter(f => f.meal === meal);
    if (items.length) return { date: d, items };
  }
  return null;
}
const whenText = date => date === shift(TODAY, -1) ? "igår" : `i ${WD[weekdayOf(date)].toLowerCase()}s`;

function mealGroup(meal, name, target, L) {
  const items = L.food.map((f, i) => ({ f, i })).filter(x => (x.f.meal ?? -1) === meal);
  const sum = items.reduce((a, x) => a + (+x.f.kcal || 0), 0);
  if (meal < 0 && !items.length) return "";
  const last = !items.length && meal >= 0 ? lastSlot(meal) : null;
  const rows = items.map(({ f, i }) => `<div class="food"><div class="grow">${esc(f.name)}</div>
      <span class="muted nowrap">${f.kcal} kcal · ${f.protein} g</span>
      <button class="small ghost star ${isFav(f) ? "on" : ""}" data-favfood="${i}" aria-pressed="${isFav(f)}" aria-label="Favorit: ${esc(f.name)}">${isFav(f) ? "★" : "☆"}</button>
      <button class="small ghost" data-delfood="${i}" aria-label="Ta bort ${esc(f.name)}">✕</button></div>`).join("");
  return `<div class="mgroup">
    <div class="row between"><b>${name}</b><span class="muted">${sum ? `${sum} kcal` : ""}${target ? `${sum ? " · " : ""}mål ${target}` : ""}</span></div>
    ${rows}
    ${last ? `<button class="small again" data-repeat="${meal}">↻ Samma som ${whenText(last.date)}: ${esc(last.items.map(f => f.name).join(", "))}
      <span class="muted">${last.items.reduce((a, f) => a + (+f.kcal || 0), 0)} kcal</span></button>` : ""}
    ${meal === currentMeal() && !items.length ? `<div class="row qkcal"><input id="qm-${meal}" type="number" inputmode="numeric" placeholder="ca ${target} kcal" aria-label="Ungefär hur många kcal för ${name}">
      <button class="small" data-qmeal="${meal}">Logga ungefär</button></div>` : ""}
    ${items.length > 1 ? `<button class="small ghost" data-savegroup="${meal}">Spara som måltid</button>` : ""}
  </div>`;
}

function kostView() {
  const m = macros(), e = eaten(), L = day(), cm = currentMeal();
  const q = quickList(), shown = quickMore ? q : q.slice(0, 8);
  const quick = shown.map((f, i) => `<div class="qrow"><button class="grow qadd" data-quick="${i}"><span class="plus">+</span> ${esc(f.name)}
      <span class="muted nowrap">${f.kcal} kcal</span></button>
    ${f.kind === "meal" ? `<button class="small ghost" data-delmeal="${f.idx}" aria-label="Ta bort måltiden ${esc(f.name)}">✕</button>`
      : `<button class="small ghost star ${f.kind === "fav" ? "on" : ""}" data-qfav="${i}" aria-pressed="${f.kind === "fav"}" aria-label="Favorit: ${esc(f.name)}">${f.kind === "fav" ? "★" : "☆"}</button>`}</div>`).join("");
  return `<h1>Kost</h1>
    <div class="card"><div class="row between"><h2>Dagens mål</h2><span class="muted">${e.kcal} / ${m.kcal} kcal</span></div>
      ${bar(e.kcal, m.kcal)}
      <div class="row between" style="margin-top:8px"><span class="muted">Protein</span><span class="muted">${e.protein} / ${m.protein} g</span></div>
      ${bar(e.protein, m.protein)}
      <div class="muted small">Fett ${m.fat} g · Kolhydrater ${m.carbs} g</div></div>
    <div class="card"><h2>Logga</h2>
      <div class="seg mealpick">${MEALS.map(([n], i) => `<button data-mealpick="${i}" class="${cm === i ? "on" : ""}" aria-pressed="${cm === i}">${n}</button>`).join("")}</div>
      <div class="fwrap"><input id="fname" placeholder="Sök eller skriv, t.ex. 2 dl mjölk och 1 banan" autocomplete="off"
        role="combobox" aria-autocomplete="list" aria-controls="fsugg">
        <div id="fsugg" class="sugg" role="listbox" hidden></div></div>
      <div id="fpreview" class="muted fpreview"></div>
      <div class="row" style="margin-top:8px">
        <label class="field grow">kcal<input id="fkcal" type="number" inputmode="numeric"></label>
        <label class="field grow">Protein (g)<input id="fprot" type="number" inputmode="numeric"></label>
        <button class="primary" data-addfood style="align-self:flex-end">Logga</button></div>
      <div class="row wrap" style="margin-top:8px"><button class="small" data-savemeal>Spara som min måltid</button>
        ${CAN_SCAN ? `<button class="small" data-scan>📷 Skanna streckkod</button>` : ""}</div>
      ${q.length ? `<div class="muted" style="margin:14px 0 2px">Snabbval · loggas i ${MEALS[cm][0].toLowerCase()}</div>${quick}
        ${q.length > 8 ? `<button class="small ghost" data-quickmore>${quickMore ? "Visa färre" : `Visa fler (${q.length - 8})`}</button>` : ""}`
        : `<div class="muted small" style="margin-top:12px">Det du loggar hamnar här som snabbval. Tryck på ☆ för att spara en favorit.</div>`}
      <div class="muted small" style="margin-top:10px">Näringsvärden: Livsmedelsverkets livsmedelsdatabas (CC BY 4.0) och egna uppskattningar.</div></div>
    <div class="card"><h2>Måltider idag</h2>
      ${MEALS.map(([n, share], i) => mealGroup(i, n, Math.round(m.kcal * share / 10) * 10, L)).join("")}
      ${mealGroup(-1, "Övrigt", 0, L)}</div>`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest("[data-quick],[data-qfav],[data-favfood],[data-repeat],[data-mealpick],[data-savegroup],[data-quickmore]");
  if (!t) return;
  const ds = t.dataset;
  if (ds.mealpick) foodMeal = +ds.mealpick;
  else if (ds.quickmore !== undefined) quickMore = !quickMore;
  else if (ds.quick) {
    const f = quickCache[+ds.quick];
    // En sparad måltid med flera delar loggas del för del, så att varje del kan tas bort
    if (f.kind === "meal" && f.items) f.items.forEach(x => logFood(x));
    else logFood(f);
    toast(`${f.name} · ${MEALS[currentMeal()][0].toLowerCase()}`);
  }
  else if (ds.qfav) toggleFav(quickCache[+ds.qfav]);
  else if (ds.favfood) toggleFav(day().food[+ds.favfood]);
  else if (ds.repeat) {
    const meal = +ds.repeat, last = lastSlot(meal);
    if (last) last.items.forEach(f => logFood(f, meal));
  }
  else if (ds.savegroup) {
    const meal = +ds.savegroup, items = day().food.filter(f => f.meal === meal);
    const names = items.map(f => f.name).join(", ");
    S.meals.push({
      name: `${MEALS[meal][0]}: ${names.length > 40 ? names.slice(0, 38) + "…" : names}`,
      kcal: items.reduce((a, f) => a + (+f.kcal || 0), 0), protein: items.reduce((a, f) => a + (+f.protein || 0), 0),
      items: items.map(({ name, kcal, protein }) => ({ name, kcal, protein })),
    });
    toast("Sparad bland snabbvalen");
  }
  save();
  render();
});

"use strict";
// Märkesvaror från Open Food Facts, separat från Livsmedelsverkets databas.
// Katalogen och importerade produktdata är ODbL-1.0; se produkter.json och README.
const productCodes = new Map(), productBrands = new Set(), productAliases = new Map(), productChoices = new Map();
let productChoiceContext = null;
const OFF_SEARCH = "https://search.openfoodfacts.org/search";
const OFF_FIELDS = "code,product_name,product_name_sv,brands,quantity,product_quantity,product_quantity_unit,serving_quantity,serving_quantity_unit,nutriments,last_modified_t,obsolete,data_quality_errors_tags";
const productText = value => String(value || "").replace(/\s+och\s+|\s*\+\s*/gi, " & ").replace(/[,;\n]/g, " ").replace(/\s+/g, " ").trim();
function productNumber(value, max = 100) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}
function productQuantity(text) {
  const s = String(text || "").trim().toLowerCase().replace(/,/g, ".");
  const m = s.match(/^(?:(\d+)\s*[x×]\s*)?(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\s*(?:℮)?$/);
  if (!m) return null;
  const amount = +(m[1] || 1) * +m[2] * ({ kg: 1000, g: 1, ml: 1, cl: 10, l: 1000 }[m[3]]);
  return amount > 0 && amount <= 50000 ? { amount, basis: /l$/.test(m[3]) ? "ml" : "g" } : null;
}
function offFood(pr) {
  if (!pr || !/^\d{8,14}$/.test(String(pr.code || "")) || pr.obsolete === true) return null;
  const name = productText(pr.product_name_sv || pr.product_name);
  const brand = productText(Array.isArray(pr.brands) ? pr.brands[0] : String(pr.brands || "").split(",")[0]);
  if (!name || !brand || name.length > 160 || brand.length > 80) return null;
  const n = pr.nutriments || {};
  let kcal = productNumber(n["energy-kcal_100g"], 950);
  if (kcal === null && n["energy-kcal_100g"] == null) {
    const kj = productNumber(n["energy-kj_100g"], 3975);
    if (kj !== null) kcal = kj / 4.184;
  }
  const p = productNumber(n.proteins_100g), fat = productNumber(n.fat_100g), fib = productNumber(n.fiber_100g);
  if (kcal === null || p === null) return null;
  for (const key of ["fat_100g", "fiber_100g"]) if (n[key] != null && n[key] !== "" && productNumber(n[key]) === null) return null;
  const quantity = productQuantity(pr.quantity);
  const explicit = productNumber(pr.product_quantity, 50000), explicitUnit = pr.product_quantity_unit;
  const pack = quantity || (explicit > 0 && ["g", "ml"].includes(explicitUnit) ? { amount: explicit, basis: explicitUnit } : null);
  // Utan känd bas kan produktens volym inte antas väga lika mycket. Enheten från
  // förpackningen används när den finns; annars används OFF:s standardbas 100 g.
  const basis = pack ? pack.basis : "g";
  const head = fold(name).startsWith(fold(brand) + " ") ? name : `${brand} ${name}`;
  const title = /^\d/.test(head) ? `Produkt ${head}` : head;
  const label = `${title}${pr.quantity ? ` (${productText(String(pr.quantity).replace(/(\d),(\d)/g, "$1.$2"))})` : ""}`;
  const food = { code: String(pr.code), n: [label.toLowerCase()], label, brand, basis,
    kcal: Math.round(kcal * 10) / 10, p, fat, fib, updated: productNumber(pr.last_modified_t, 5000000000) };
  if (basis === "ml") food.dl = 100;
  if (pack) food.forp = pack.amount;
  return food;
}
function registerProduct(food) {
  const prev = productCodes.get(food.code);
  // En ny hämtning får uppdatera katalogen, men aldrig ett redan loggat värde.
  if (prev && prev.updated && food.updated && prev.updated > food.updated) return prev;
  if (prev) {
    for (const alias of prev.n) productAliases.get(alias)?.delete(prev.code);
    for (const key of Object.keys(prev)) delete prev[key];
  }
  const f = prev ? Object.assign(prev, food) : food;
  for (const alias of f.n) {
    if (!productAliases.has(alias)) productAliases.set(alias, new Set());
    productAliases.get(alias).add(f.code);
  }
  if (!prev) { productCodes.set(f.code, f); FOODS.push(f); }
  productBrands.add(fold(f.brand));
  for (const alias of f.n) if (alias.includes(" med ") && !MED_DISHES.includes(alias)) MED_DISHES.push(alias);
  SEARCH = null;
  return f;
}
function addProducts(records) {
  return (records || []).map(offFood).filter(Boolean).map(registerProduct);
}

function chooseProduct(index, food) {
  productChoices.set(index, { alias: food.n[0], food: { ...food, n: [...food.n] } });
}
function chosenProduct(text, index) {
  const entry = productChoices.get(index);
  return entry && fold(text) === fold(entry.alias) ? entry.food : null;
}
function exactRestaurantProduct(text, index) {
  return !!chosenProduct(text, index)?.restaurant ||
    [...(productAliases.get(text) || [])].some(code => productCodes.get(code)?.restaurant);
}
function ambiguousProduct(text) { return (productAliases.get(text)?.size || 0) > 1; }
function brandedQuery(text) {
  const words = ` ${fold(text).replace(/[^\p{L}\p{N}]+/gu, " ")} `;
  return [...productBrands].some(b => words.includes(` ${b.replace(/[^\p{L}\p{N}]+/gu, " ")} `));
}
const productsReady = window.claude ? Promise.resolve([]) : fetch("produkter.json")
  .then(r => { if (!r.ok) throw Error("Katalogen saknas"); return r.json(); })
  .then(data => {
    const result = addProducts(data.products);
    if (document.getElementById("fname") && typeof foodPreview === "function") foodPreview();
    return result;
  }).catch(() => []);

const productSearch = { query: "", id: 0, hits: [], status: "idle", cache: new Map(), controller: null, nextRequest: 0 };
function productQuery(text) {
  const { rest } = splitAmount(text);
  const words = (rest.slice(0, 120).match(/[\p{L}\p{N}]+/gu) || []).slice(0, 12);
  return words.length ? `countries_tags:"en:sweden" AND ${words.map(w => `(${w} OR brands_tags:${w})`).join(" AND ")}` : "";
}
function updateProductSearch(text) {
  if (!text || (typeof foodSheet !== "undefined" && foodSheet !== productChoiceContext)) {
    productChoices.clear(); productChoiceContext = typeof foodSheet === "undefined" ? null : foodSheet;
  }
  if (text !== productSearch.query) {
    productSearch.query = text; productSearch.id++; productSearch.hits = []; productSearch.status = "idle";
    if (productSearch.controller) productSearch.controller.abort();
  }
  drawProductSearch();
}
function drawProductSearch() {
  const out = document.getElementById("productresults");
  if (!out) return;
  const p = productSearch;
  if (window.claude || !p.query || p.query.length < 2 || foodPanel === "kcal") { out.innerHTML = ""; return; }
  const msg = { loading: "Söker märkesvaror…", empty: "Inga produkter med användbara näringsvärden hittades. Prova ett annat namn eller skanna streckkoden.",
    error: "Kunde inte söka på nätet. Dina lokala livsmedel fungerar fortfarande.", cooldown: "Vänta några sekunder innan du söker igen." }[p.status];
  out.innerHTML = `<div class="productsearch"><button class="small" data-productsearch ${p.status === "loading" ? "disabled" : ""}>Sök märkesvaror på nätet</button>
    ${msg ? `<div class="muted small" role="status">${esc(msg)}</div>` : ""}
    ${p.status === "error" ? `<a class="small" target="_blank" rel="noopener" href="https://search.openfoodfacts.org/?q=${encodeURIComponent(productQuery(p.query))}">Öppna sökningen hos Open Food Facts</a>` : ""}
    ${p.hits.length ? `<div class="fask-opts">${p.hits.map((f, i) => `<button data-productpick="${i}"><span>${esc(f.label)}</span><span class="muted small">${fmtNum(f.kcal)} kcal · ${fmtNum(f.p)} g protein per 100 ${f.basis}</span></button>`).join("")}</div>` : ""}
    <div class="muted small">Open Food Facts (ODbL). Kontrollera mot förpackningen.</div></div>`;
}
async function searchProducts(text) {
  updateProductSearch(text);
  const p = productSearch, id = ++p.id, key = fold(text.trim()), query = productQuery(text);
  if (!query || text.trim().length < 2) return;
  const cached = p.cache.get(key);
  if (cached && Date.now() - cached.time < 300000) {
    p.hits = cached.hits; p.status = p.hits.length ? "done" : "empty"; drawProductSearch(); return;
  }
  if (Date.now() < p.nextRequest) { p.status = "cooldown"; drawProductSearch(); return; }
  p.nextRequest = Date.now() + 6000;
  p.status = "loading"; p.hits = []; drawProductSearch();
  const controller = new AbortController(); p.controller = controller;
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const params = new URLSearchParams({ q: query, langs: "sv,en", fields: OFF_FIELDS, page_size: "15" });
    const res = await fetch(`${OFF_SEARCH}?${params}`, { signal: controller.signal });
    if (!res.ok) throw Error("Söktjänsten svarar inte");
    const data = await res.json();
    if (!Array.isArray(data.hits)) throw Error("Ogiltigt svar");
    if (id !== p.id || !foodSheet || !document.getElementById("fname") || document.getElementById("fname").value.trim() !== text) return;
    const codes = new Set();
    p.hits = data.hits.map(offFood).filter(f => f && !codes.has(f.code) && codes.add(f.code));
    p.status = p.hits.length ? "done" : "empty";
    for (const f of p.hits) productBrands.add(fold(f.brand));
    // Ett hittat märke får inte lämna kvar en generisk gissning i utkastet.
    if (typeof foodPreview === "function") foodPreview();
    p.cache.set(key, { time: Date.now(), hits: p.hits });
    if (p.cache.size > 20) p.cache.delete(p.cache.keys().next().value);
  } catch (e) { if (id === p.id) { p.status = "error"; p.hits = []; } }
  finally { clearTimeout(timer); if (id === p.id) { p.controller = null; drawProductSearch(); } }
}
function pickProduct(index) {
  const f = productSearch.hits[index], input = document.getElementById("fname");
  if (!f || !input || input.value.trim() !== productSearch.query) return;
  const selected = registerProduct(f);
  chooseProduct(0, selected);
  const { prefix } = splitAmount(input.value);
  input.value = prefix + selected.n[0];
  foodPreview(); input.focus();
}
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-productsearch],[data-productpick]");
  if (!t || t.disabled) return;
  if (t.dataset.productsearch !== undefined) {
    const input = document.getElementById("fname");
    if (input) searchProducts(input.value.trim());
  } else pickProduct(+t.dataset.productpick);
});

// Restaurangernas publicerade standardportioner är en separat källa, inte OFF-data.
function restaurantFood(record) {
  if (!record || !/^mcd-se-\d{6}$/.test(record.id || "") || record.chain !== "McDonald's") return null;
  const name = productText(record.name).replace(/[®™]/g, "").trim(), n = record.per_portion || {};
  const kcal = productNumber(n.kcal, 5000), p = productNumber(n.protein, 500);
  if (!name || name.length > 160 || kcal === null || p === null) return null;
  const fat = productNumber(n.fat, 500), fib = productNumber(n.fiber, 500);
  if ((n.fat != null && fat === null) || (n.fiber != null && fib === null)) return null;
  const sourceUrl = /^https:\/\/www\.mcdonalds\.com\/se\/sv-se\/(?:product\/[\w-]+\.html|naringskalkylatorn\.html)$/.test(record.source_url || "")
    ? record.source_url : "https://www.mcdonalds.com/se/sv-se/naringskalkylatorn.html";
  const label = `McDonald's ${name}`;
  const alternatives = new Set([name, name.replace(/mcnuggets/gi, "nuggets").replace(/coca[- ]?cola/gi, "cola")]);
  const aliases = new Set([label.toLowerCase()]);
  for (const value of alternatives) for (const chain of ["mcdonalds", "mc donalds", "donken"]) aliases.add(`${chain} ${value}`.toLowerCase());
  if (record.id === "mcd-se-200000") { aliases.add("big mac"); aliases.add("bigmac"); }
  // 100 är en intern skalfaktor per portion, aldrig en påstådd vikt i gram.
  return { code: record.id, label, n: [...aliases], brand: "McDonald's", restaurant: true,
    basis: "portion", def: "portion", portion: 100, kcal, p, fat, fib,
    source: { name: "McDonald's Sverige", url: sourceUrl, checked: record.checked_at || null },
    updated: Number.isFinite(Date.parse(record.checked_at)) ? Date.parse(record.checked_at) / 1000 : null };
}
function addRestaurants(records) {
  const result = (records || []).map(restaurantFood).filter(Boolean).map(registerProduct);
  for (const alias of ["mcdonalds", "mc donalds", "donken"]) productBrands.add(alias);
  return result;
}
const restaurantsReady = window.claude ? Promise.resolve([]) : fetch("restauranger.json")
  .then(r => { if (!r.ok) throw Error("Restaurangkatalogen saknas"); return r.json(); })
  .then(data => {
    const result = addRestaurants(data.restaurants);
    if (document.getElementById("fname") && typeof foodPreview === "function") foodPreview();
    return result;
  }).catch(() => []);
function productSourceHtml(amount) {
  if (!amount) return "";
  if (amount.source && /^mcd-se-\d{6}$/.test(amount.code || "") &&
    /^https:\/\/www\.mcdonalds\.com\/se\/sv-se\/(?:product\/[\w-]+\.html|naringskalkylatorn\.html)$/.test(amount.source.url || "")) {
    return `<div class="muted small">Standardportion enligt <a href="${esc(amount.source.url)}" target="_blank" rel="noopener">McDonald's Sverige</a>. Avser produkten, inte en hel meny.</div>`;
  }
  if (/^\d{8,14}$/.test(amount.code || "")) return `<div class="muted small">Produktdata: <a href="https://world.openfoodfacts.org/product/${amount.code}" target="_blank" rel="noopener">Open Food Facts</a> (ODbL). Kontrollera mot förpackningen.</div>`;
  return "";
}

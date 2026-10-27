"use strict";
// ---------- Streckkodsskanner (Open Food Facts) ----------
// Laddas före app.js; funktionerna anropas först när appen används.
// Bara på den publika webbplatsen: i Claude får sidan varken använda kameran eller hämta data utifrån.
const CAN_SCAN = !window.claude;
const ZXING_URL = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
const scanner = { el: null, stream: null, timer: 0, zx: null, product: null };

function openScanner() {
  const el = document.createElement("div");
  el.className = "overlay scan-overlay";
  el.innerHTML = `<div class="sheet scan-sheet" role="dialog" aria-label="Skanna streckkod">
    <div class="row between"><h2>Skanna streckkod</h2><button class="small ghost" data-scanclose aria-label="Stäng">${icon("close", 18)}</button></div>
    <div class="scan-view"><video playsinline muted></video><div class="scan-frame"></div></div>
    <div class="muted" id="scanstatus">Startar kameran…</div>
    <div class="row" style="margin-top:10px"><input id="scancode" inputmode="numeric" placeholder="Eller skriv streckkoden" autocomplete="off">
      <button class="small" data-scanlookup>Sök</button></div>
    <div id="scanresult"></div>
    <div class="muted small" style="margin-top:10px">Produktdata: Open Food Facts (ODbL).</div></div>`;
  document.body.appendChild(el);
  scanner.el = el;
  startCamera();
}

function closeScanner() {
  stopCamera();
  if (scanner.el) scanner.el.remove();
  scanner.el = null;
  scanner.product = null;
}

function scanStatus(msg) {
  const st = scanner.el && scanner.el.querySelector("#scanstatus");
  if (st) st.textContent = msg;
}

async function startCamera() {
  const video = scanner.el.querySelector("video");
  try {
    scanner.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    video.srcObject = scanner.stream;
    await video.play();
  } catch (e) {
    scanner.el.querySelector(".scan-view").hidden = true;
    scanStatus("Kameran gick inte att starta. Skriv in streckkoden under i stället.");
    return;
  }
  scanStatus("Rikta kameran mot streckkoden.");
  // Inbyggd streckkodsläsare där den finns (Chrome på Android), annars ZXing
  if ("BarcodeDetector" in window) {
    const det = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
    const tick = async () => {
      if (!scanner.stream) return;
      try {
        const codes = await det.detect(video);
        if (codes.length) return onBarcode(codes[0].rawValue);
      } catch (e) { /* bilden var inte klar */ }
      scanner.timer = setTimeout(tick, 250);
    };
    tick();
    return;
  }
  try {
    await loadScript(ZXING_URL);
    scanner.zx = new window.ZXing.BrowserMultiFormatReader();
    scanner.zx.decodeFromVideoElementContinuously(video, res => { if (res && scanner.stream) onBarcode(res.getText()); });
  } catch (e) {
    scanStatus("Streckkodsläsaren gick inte att ladda. Skriv in streckkoden under i stället.");
  }
}

function stopCamera() {
  clearTimeout(scanner.timer);
  if (scanner.zx) { try { scanner.zx.reset(); } catch (e) { /* redan stoppad */ } scanner.zx = null; }
  if (scanner.stream) scanner.stream.getTracks().forEach(t => t.stop());
  scanner.stream = null;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const sc = document.createElement("script");
    sc.src = src; sc.onload = resolve; sc.onerror = reject;
    document.head.appendChild(sc);
  });
}

function onBarcode(code) {
  stopCamera();
  scanner.el.querySelector("#scancode").value = code;
  lookupBarcode(code);
}

async function lookupBarcode(code) {
  code = String(code).replace(/\D/g, "");
  const out = scanner.el.querySelector("#scanresult");
  if (code.length < 6) { scanStatus("Skriv hela streckkoden, 8 eller 13 siffror."); return; }
  scanner.el.querySelector(".scan-view").hidden = true;
  scanStatus(`Söker ${code}…`);
  out.innerHTML = "";
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_sv,brands,nutriments,serving_quantity,quantity`);
    const data = await res.json();
    const pr = data.product, n = pr && pr.nutriments || {};
    const kcal = n["energy-kcal_100g"] ?? (n.energy_100g ? n.energy_100g / 4.184 : null);
    if (!pr || kcal == null) {
      scanStatus("Produkten finns inte i Open Food Facts, eller saknar kalorier. Skriv in den för hand i stället.");
      out.innerHTML = `<button class="small" style="margin-top:8px" data-scanagain>Skanna igen</button>`;
      return;
    }
    const name = [pr.product_name_sv || pr.product_name, (pr.brands || "").split(",")[0]].filter(Boolean).join(" · ") || `Produkt ${code}`;
    scanner.product = { code, name, kcal: +kcal, p: +(n.proteins_100g || 0), fa: n.fat_100g == null ? null : +n.fat_100g, fi: +(n.fiber_100g || 0) };
    const portion = Math.round(+pr.serving_quantity || 100);
    scanStatus("Hittad! Ange hur mycket du åt.");
    out.innerHTML = `<div class="card scan-product"><b>${esc(name)}</b>
      <div class="muted">${Math.round(kcal)} kcal · ${fmtNum(+(n.proteins_100g || 0))} g protein per 100 g</div>
      <div class="row" style="margin-top:10px"><label class="field grow">Mängd (g)<input id="scangrams" type="number" inputmode="decimal" value="${portion}"></label>
        <div class="grow" id="scancalc"></div></div>
      <button class="primary wide" style="margin-top:10px" data-scanlog>Logga</button>
      <button class="small" data-scanagain>Skanna en annan vara</button></div>`;
    updateScanCalc();
  } catch (e) {
    scanStatus("Kunde inte nå Open Food Facts. Kontrollera nätet och försök igen.");
  }
}

function updateScanCalc() {
  const pr = scanner.product, g = +scanner.el.querySelector("#scangrams").value || 0;
  scanner.el.querySelector("#scancalc").innerHTML = `<b>${Math.round(pr.kcal * g / 100)} kcal</b><div class="muted">${fmtNum(pr.p * g / 100)} g protein</div>`;
}

function logScanned() {
  const pr = scanner.product, g = +scanner.el.querySelector("#scangrams").value || 0;
  if (!pr || !g) return;
  const amt = { n: Math.round(g), unit: "g", k: pr.kcal, p: pr.p, u: {} };
  if (pr.fa != null) { amt.fa = pr.fa; amt.fi = pr.fi; }
  logFood({ name: pr.name, amt });
  closeScanner();
  save();
  render();
  toast(`Loggat: ${pr.name}`);
}

// Skannerns knappar ligger utanför appens vanliga omritning
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-scan], [data-scanclose], [data-scanlookup], [data-scanlog], [data-scanagain], .scan-overlay");
  if (!t) return;
  if (t.matches("[data-scan]")) openScanner();
  else if (t.matches("[data-scanclose]") || (t.classList.contains("scan-overlay") && ev.target === t)) closeScanner();
  else if (t.matches("[data-scanlookup]")) { stopCamera(); lookupBarcode(scanner.el.querySelector("#scancode").value); }
  else if (t.matches("[data-scanlog]")) logScanned();
  else if (t.matches("[data-scanagain]")) {
    scanner.product = null;
    scanner.el.querySelector("#scanresult").innerHTML = "";
    scanner.el.querySelector(".scan-view").hidden = false;
    startCamera();
  }
  else return;
  ev.stopImmediatePropagation();
}, true);
document.addEventListener("input", ev => { if (ev.target.id === "scangrams") updateScanCalc(); });

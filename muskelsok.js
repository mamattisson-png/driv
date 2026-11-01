"use strict";
// ---------- Sök på muskel ----------
// En vy för både övningar (orange) och stretch (turkos): en realistisk anatomibild fram eller bak där man trycker
// på en muskel, och en lista under. Bilden är AI-genererad (ChatGPT) åt Driv; formerna ovanpå kommer från
// designkanvasen och färgar den valda muskeln. Stretchövningar har en egen sida med vad som töjs och Starta.
// Det är DRIV:s gemensamma övningsbibliotek: samma vy när man bläddrar, lägger till i ett pass, lägger till en daily
// eller byter övning. Laddas efter stretch-guide.js; app.js ritar den (VIEWS.stretchguide, Träna och libCtx).

const ANAT = {"f": {"vb": "-240 30 1190 1190", "clip": [0.0, 0.0, 620.0, 1254.0], "regs": [["nacke", "M335,150 L375,150 L388,212 L355,226 L322,212Z"], ["axlar", "M195,230 L240,225 L255,260 L240,300 L205,300 L185,270Z M515,230 L470,225 L455,260 L470,300 L505,300 L525,270Z"], ["brost", "M255,250 L345,245 L350,320 L300,340 L255,320 L240,285Z M360,245 L450,250 L470,285 L455,320 L410,340 L360,320Z"], ["biceps", "M195,302 L230,305 L235,350 L220,405 L190,400 L178,350Z M515,302 L480,305 L475,350 L490,405 L520,400 L532,350Z"], ["mage", "M310,345 L400,345 L405,420 L395,480 L355,500 L315,480 L305,420Z"], ["lar_fram", "M245,560 L300,540 L340,590 L345,700 L330,780 L290,790 L255,760 L240,680Z M370,590 L410,540 L465,560 L470,680 L455,760 L420,790 L380,780 L365,700Z"]], "labels": [["axlar", [72.0, 235.0, 215.0, 262.0], [215.0, 262.0], [-228.0, 183.0, 300.0, 104.0], [-78.0, 249.0], "Axlar"], ["brost", [72.0, 365.0, 300.0, 290.0], [300.0, 290.0], [-228.0, 313.0, 300.0, 104.0], [-78.0, 379.0], "Bröst"], ["biceps", [72.0, 495.0, 205.0, 352.0], [205.0, 352.0], [-228.0, 443.0, 300.0, 104.0], [-78.0, 509.0], "Biceps"], ["nacke", [638.0, 195.0, 372.0, 188.0], [372.0, 188.0], [638.0, 143.0, 300.0, 104.0], [788.0, 209.0], "Nacke"], ["mage", [638.0, 420.0, 385.0, 420.0], [385.0, 420.0], [638.0, 368.0, 300.0, 104.0], [788.0, 434.0], "Mage"], ["lar_fram", [638.0, 640.0, 430.0, 660.0], [430.0, 660.0], [638.0, 588.0, 300.0, 104.0], [788.0, 654.0], "Framsida lår"]]}, "b": {"vb": "305 30 1190 1190", "clip": [640.0, 0.0, 614.0, 1254.0], "regs": [["nacke", "M878,118 L922,118 L932,172 L900,182 L868,172Z"], ["overrygg", "M850,180 L900,170 L950,180 L990,235 L935,275 L900,325 L865,275 L810,235Z"], ["axlar", "M745,230 L790,225 L805,265 L790,300 L755,300 L735,265Z M1055,230 L1010,225 L995,265 L1010,300 L1045,300 L1065,265Z"], ["triceps", "M735,302 L775,302 L780,360 L765,410 L735,405 L722,350Z M1065,302 L1025,302 L1020,360 L1035,410 L1065,405 L1078,350Z"], ["lats", "M790,300 L850,330 L890,420 L870,460 L820,460 L800,400Z M1010,300 L950,330 L910,420 L930,460 L980,460 L1000,400Z"], ["landrygg", "M868,395 L900,388 L932,395 L938,465 L900,478 L862,465Z"], ["sate", "M810,480 L850,470 L895,480 L898,560 L880,605 L840,610 L812,590 L800,540Z M902,480 L950,470 L990,480 L1000,540 L990,590 L960,610 L920,605 L902,560Z"], ["lar_bak", "M812,615 L850,605 L893,615 L895,700 L885,790 L860,830 L830,830 L812,780 L805,700Z M908,615 L950,605 L990,615 L995,700 L985,780 L965,830 L935,830 L912,790 L905,700Z"], ["vader", "M790,840 L830,830 L860,850 L870,920 L860,980 L830,990 L800,975 L785,920Z M930,850 L965,830 L1010,840 L1020,920 L1005,975 L975,990 L945,980 L935,920Z"]], "labels": [["overrygg", [617.0, 185.0, 900.0, 225.0], [900.0, 225.0], [317.0, 133.0, 300.0, 104.0], [467.0, 199.0], "Övre rygg"], ["axlar", [617.0, 305.0, 765.0, 262.0], [765.0, 262.0], [317.0, 253.0, 300.0, 104.0], [467.0, 319.0], "Axlar"], ["triceps", [617.0, 425.0, 750.0, 355.0], [750.0, 355.0], [317.0, 373.0, 300.0, 104.0], [467.0, 439.0], "Triceps"], ["lats", [617.0, 545.0, 830.0, 400.0], [830.0, 400.0], [317.0, 493.0, 300.0, 104.0], [467.0, 559.0], "Lats"], ["nacke", [1183.0, 190.0, 912.0, 150.0], [912.0, 150.0], [1183.0, 138.0, 300.0, 104.0], [1333.0, 204.0], "Nacke"], ["landrygg", [1183.0, 385.0, 905.0, 430.0], [905.0, 430.0], [1183.0, 333.0, 300.0, 104.0], [1333.0, 399.0], "Ländrygg"], ["sate", [1183.0, 520.0, 960.0, 540.0], [960.0, 540.0], [1183.0, 468.0, 300.0, 104.0], [1333.0, 534.0], "Säte"], ["lar_bak", [1183.0, 690.0, 950.0, 710.0], [950.0, 710.0], [1183.0, 638.0, 300.0, 104.0], [1333.0, 704.0], "Baksida lår"], ["vader", [1183.0, 880.0, 985.0, 910.0], [985.0, 910.0], [1183.0, 828.0, 300.0, 104.0], [1333.0, 894.0], "Vader"]]}};
const MUSKLER = [["nacke", "Nacke"], ["brost", "Bröst"], ["axlar", "Axlar"], ["biceps", "Biceps"], ["mage", "Mage"], ["lar_fram", "Framsida lår"],
  ["overrygg", "Övre rygg"], ["lats", "Lats"], ["triceps", "Triceps"], ["landrygg", "Ländrygg"], ["sate", "Säte"], ["lar_bak", "Baksida lår"], ["vader", "Vader"]];
const MUSKEL_NAMN = Object.fromEntries(MUSKLER);
const MUSKEL_FRAM = ["nacke", "brost", "axlar", "biceps", "mage", "lar_fram"];

// Vilka muskler en övning tränar: muskelgrupperna (prim) och, för ryggen, orden i muskeltexten
function trainsMuscle(id, k) {
  const e = EX[id], prim = e.prim || [], txt = (e.name + " " + (e.muscles || "")).toLowerCase();
  const back = prim.includes("rygg");
  return {
    nacke: /nacke|shrug|kappmuskel|trapez/.test(txt),
    brost: prim.includes("brost"), axlar: prim.includes("axlar"), biceps: prim.includes("biceps") || prim.includes("underarmar"),
    triceps: prim.includes("triceps"), mage: prim.includes("mage"), lar_fram: prim.includes("framsida_lar"),
    lar_bak: prim.includes("baksida_lar"), sate: prim.includes("sate"), vader: prim.includes("vader"),
    lats: back && /lats|breda rygg|rygg \(lats\)|latsdrag|pull|chins/.test(txt) || /lats/.test(txt) && !prim.length,
    overrygg: back && /övre rygg|mellersta rygg|romb|kapp|baksida axlar|rodd|face pull/.test(txt),
    landrygg: /länd|nedre rygg|ryggslut|erector/.test(txt) || back && /marklyft|good morning|hyperext|superman|bird dog/.test(txt),
  }[k] || false;
}
// Stretchens mål (stretchTargets) per muskel, i ordning: det första målet töjs mest
const STRETCH_TO_MUSKEL = { neck: "nacke", chest: "brost", shoulders: "axlar", biceps: "biceps", forearms: "biceps", triceps: "triceps", obliques: "mage",
  quads: "lar_fram", hip_flexors: "lar_fram", adductors: "lar_fram", hamstrings: "lar_bak", glutes: "sate", hip_rotators: "sate",
  calves: "vader", ankles: "vader", shins: "vader", feet: "vader", thoracic_back: "overrygg", upper_back: "overrygg", lats: "lats", lower_back: "landrygg" };
const stretchMuscles = id => [...new Set((EX[id].stretchTargets || []).map(t => STRETCH_TO_MUSKEL[t]).filter(Boolean))];

let msk = { mode: "ex", sel: "brost", view: "f", q: "", limit: 30, back: "pass", cat: "alla", gear: "alla" };
let mskDetail = null;   // stretchövningen vars sida är öppen

const accOf = mode => mode === "st" ? "var(--stretch)" : "var(--accent)";
// Anatomibilden för en sida. strong/soft: muskler som färgas starkt/svagt; labels: etiketter att trycka på.
function anatSvg(side, { strong = [], soft = [], labels = true, mode = "ex", vb, label }) {
  const A = ANAT[side], c = A.clip, id = "anclip-" + side + (labels ? "" : "-d");
  const regs = A.regs.map(([k, d]) => `<path d="${d}" class="an-reg ${strong.includes(k) ? "on" : soft.includes(k) ? "soft" : ""}" ${labels ? `data-mus="${k}"` : ""}><title>${MUSKEL_NAMN[k]}</title></path>`).join("");
  const labs = labels ? A.labels.map(([k, l, dot, r, t, text]) => { const on = strong.includes(k);
    return `<g class="an-lab ${on ? "on" : ""}" data-mus="${k}" role="button" tabindex="0" aria-label="${text}" aria-pressed="${on}"><line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}"/><circle cx="${dot[0]}" cy="${dot[1]}" r="9"/>
      <rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" rx="52"/><text x="${t[0]}" y="${t[1]}" text-anchor="middle">${text}</text></g>`; }).join("") : "";
  return `<svg class="anat ${mode === "st" ? "st" : ""}" viewBox="${vb || A.vb}" role="img" aria-label="${label || (side === "f" ? "Kroppen framifrån" : "Kroppen bakifrån")}">
    <clipPath id="${id}"><rect x="${c[0]}" y="${c[1]}" width="${c[2]}" height="${c[3]}"/></clipPath>
    <image href="icons/anatomi.webp" x="0" y="0" width="1254" height="1254" clip-path="url(#${id})"/>${regs}${labs}</svg>`;
}

// Biblioteket öppnas i ett sammanhang: "browse" (Träna, Hem), "workout" (lägg till eller byt i ett pass) eller "daily".
// libCtx = { kind, target, replace, today } medan biblioteket visas ovanpå den vy man kom från.
let libCtx = null;
// Öppna biblioteket från ett pass eller Dailys: listan börjar på passets typ, eller den övning som ska bytas
function openLibrary(ctx) {
  libCtx = ctx;
  const list = exList(ctx.target), orig = ctx.replace != null ? list[ctx.replace] : null;
  const d = ctx.kind === "workout" ? (ctx.target.startsWith("draft:") ? draft.days[+ctx.target.slice(6)] : dayById(ctx.target)) : null;
  const typeCat = d && { push: "push", cpush: "push", pull: "pull", cpull: "pull", legs: "legs", lower: "legs", clegs: "legs" }[d.type];
  msk = { ...msk, mode: orig && EX[orig.id].cat === "stretch" ? "st" : "ex", sel: null, view: "f", q: "", limit: 30,
    cat: orig ? (PASS_FILTER[EX[orig.id].cat] ? EX[orig.id].cat : "alla") : typeCat || "alla", gear: "alla" };
  mskDetail = null;
  window.scrollTo(0, 0);
}
const libTargetName = t => t === "daily" ? "Dailys" : t.startsWith("draft:") ? draft.days[+t.slice(6)].name : dayById(t).name;

function muscleView() {
  if (mskDetail && EX[mskDetail]) return stretchPage(mskDetail);
  const ctx = libCtx || { kind: "browse" }, browse = ctx.kind === "browse";
  const st = msk.mode === "st", q = norm(msk.q.trim()), cat = msk.cat || "alla", gear = msk.gear || "alla";
  const have = browse ? [] : exList(ctx.target).map(e => e.id);
  const replacing = !browse && ctx.replace != null ? exList(ctx.target)[ctx.replace] : null;
  // Kondition passar i Dailys men inte i ett pass; stretch finns under sin egen flik
  const pool = Object.keys(EX).filter(id => (q || (st ? EX[id].cat === "stretch" : EX[id].cat !== "stretch")) && (ctx.kind !== "workout" || EX[id].cat !== "cardio"));
  const list = pool.filter(id => (!replacing || id !== replacing.id) && (!q || norm(EX[id].name + " " + (EX[id].aliases || []).join(" ") + " " + (EX[id].muscles || "") + " " + (PASS_WORDS[EX[id].cat] || "")).includes(q))
    && (q || !msk.sel || (st ? stretchMuscles(id).includes(msk.sel) : trainsMuscle(id, msk.sel)))
    && (q || st || cat === "alla" || EX[id].cat === cat) && (q || gear === "alla" || gearGroup(id) === gear));
  const title = q ? "Sökresultat – styrka och stretch" : msk.sel ? MUSKEL_NAMN[msk.sel] : st ? "Alla stretchövningar" : cat !== "alla" ? `Alla ${areaLabel(cat).toLowerCase()}-övningar` : "Alla övningar";
  const heading = replacing ? `Byt ut ${esc(EX[replacing.id].name)}` : ctx.kind === "daily" ? "Lägg till daily" : ctx.kind === "workout" ? `Lägg till i ${esc(libTargetName(ctx.target))}` : "Sök på muskel";
  const back = browse ? `<button class="backbtn" ${msk.back === "idag" ? 'data-tab="idag"' : "data-exlibclose"}>${icon("left", 18)}${msk.back === "idag" ? "Hem" : "Träna"}</button>`
    : `<button class="backbtn" data-libclose>${icon("left", 18)}${ctx.kind === "daily" ? "Dailys" : esc(libTargetName(ctx.target))}</button>`;
  // Plus: i ett sammanhang läggs övningen till direkt (eller byter ut); annars väljer man var den ska in
  const action = id => browse ? addBtn(id)
    : have.includes(id) && !replacing ? `<span class="sg-add have" aria-label="Finns redan">${icon("check", 18)}</span>`
    : `<button class="sg-add" data-libpick="${id}" aria-label="${replacing ? "Välj" : "Lägg till"} ${esc(EX[id].name)}">${icon(replacing ? "right" : "plus", 18)}</button>`;
  const rows = list.slice(0, msk.limit).map(id => `<div class="h3-row sg-row msk-row ${have.includes(id) ? "have" : ""}"><button class="sg-open" ${st && browse ? `data-mskdetail="${id}"` : `data-info="${id}"`} aria-label="Visa ${esc(EX[id].name)}">
      <span class="thumb exl">${figure(id)}</span><span class="grow"><b>${esc(EX[id].name)}</b><small>${EX[id].sets} × ${esc(EX[id].reps)} · ${esc(EX[id].muscles || "")}</small></span></button>${action(id)}</div>`).join("");
  const filters = `<div class="pfilters msk-filters">${st ? "" : `<label class="pfilter ${cat !== "alla" ? "on" : ""}"><span class="sr">Passtyp</span><select data-mskcat aria-label="Passtyp">
      <option value="alla">Alla passtyper</option>${Object.keys(PASS_FILTER).map(k => `<option value="${k}" ${cat === k ? "selected" : ""}>${areaLabel(k)}</option>`).join("")}</select>${icon("down", 16)}</label>`}
    <label class="pfilter ${gear !== "alla" ? "on" : ""}"><span class="sr">Utrustning</span><select data-mskgear aria-label="Utrustning">
      <option value="alla">All utrustning</option>${Object.entries(GEAR_FILTER).map(([k, n]) => `<option value="${k}" ${gear === k ? "selected" : ""}>${n}</option>`).join("")}</select>${icon("down", 16)}</label></div>`;
  return `<div class="msk ${st ? "st" : ""} ${browse ? "" : "msk-ctx"}">${back}
    <h1>${heading}</h1>
    ${ctx.today != null ? `<div class="tseg pswapwhen" role="radiogroup" aria-label="Hur länge">${[[true, "Bara i dag"], [false, "Även framåt"]].map(([v, n]) =>
      `<button role="radio" data-libtoday="${v}" class="${ctx.today === v ? "on" : ""}" aria-checked="${ctx.today === v}">${n}</button>`).join("")}</div>` : ""}
    <div class="msk-tabs" role="tablist"><button role="tab" aria-selected="${!st}" class="${st ? "" : "on"}" data-mskmode="ex">Övningar</button><button role="tab" aria-selected="${st}" class="${st ? "on" : ""}" data-mskmode="st">Stretch</button></div>
    <section class="msk-map"><div class="msk-side" role="radiogroup" aria-label="Sida"><button class="${msk.view === "f" ? "on" : ""}" data-mskview="f" aria-pressed="${msk.view === "f"}">Fram</button><button class="${msk.view === "b" ? "on" : ""}" data-mskview="b" aria-pressed="${msk.view === "b"}">Bak</button></div>
      ${anatSvg(msk.view, { strong: q || !msk.sel ? [] : [msk.sel], mode: msk.mode })}</section>
    <div class="psearch">${icon("search", 18)}<input id="mskq" type="search" placeholder="${st ? "Sök stretchövning" : "Sök övning eller muskel"}" value="${esc(msk.q)}" autocomplete="off" aria-label="Sök"></div>
    ${filters}
    <div class="row between sg-head"><h2>${title}</h2><span class="muted small">${list.length} ${q ? (list.length === 1 ? "träff" : "träffar") : st ? (list.length === 1 ? "stretch" : "stretchövningar") : (list.length === 1 ? "övning" : "övningar")}${msk.sel && !q ? ` · <button class="link small" data-mus="">Visa alla</button>` : ""}</span></div>
    ${rows ? `<section class="h3-list">${rows}</section>` : `<div class="muted sg-none">${q ? "Inga övningar matchar." : `Inga ${st ? "stretchövningar" : "övningar"} matchar. Prova en annan muskel eller utrustning.`}</div>`}
    ${list.length > msk.limit ? `<button class="wide sg-more" data-mskmore>Visa fler (${list.length - msk.limit})</button>` : ""}</div>`;
}

// En stretchövning: vad som töjs, hur länge, hur man gör, Starta och Lägg till
function stretchPage(id) {
  const e = EX[id], ms = stretchMuscles(id), most = ms.slice(0, 1), also = ms.slice(1);
  if (typeof dailyClock !== "undefined" && dailyClock && dailyClock.id === id) return `<div class="msk st">${dailyClockView()}</div>`;
  const secs = (String(e.reps).match(/(\d+)\s*(s|sek)/) || [])[1];
  const tile = (v, l) => `<div><b>${v}</b><span>${l}</span></div>`;
  const chip = (k, strong) => `<span class="msk-tchip ${strong ? "on" : ""}"><i></i>${MUSKEL_NAMN[k]}</span>`;
  const back = ms.some(k => !MUSKEL_FRAM.includes(k)), front = ms.some(k => MUSKEL_FRAM.includes(k));
  return `<div class="msk st"><button class="backbtn" data-mskdetail="">${icon("left", 18)}Stretch</button>
    <h1 class="msk-h">${esc(e.name)}</h1>
    <div class="msk-tchips">${most.map(k => chip(k, true)).join("")}${also.map(k => chip(k, false)).join("")}</div>
    <section class="msk-map msk-both" aria-label="Muskler som töjs">${front || !back ? anatSvg("f", { strong: most, soft: also, labels: false, mode: "st", vb: "0 30 640 1190" }) : ""}${back ? anatSvg("b", { strong: most, soft: also, labels: false, mode: "st", vb: "620 30 640 1190" }) : ""}
      <div class="msk-legend"><span><i class="on"></i>Töjs mest</span>${also.length ? `<span><i></i>Töjs också</span>` : ""}</div></section>
    <div class="rstats three">${tile(secs ? `${secs} s` : esc(e.reps), secs ? "håll" : "reps")}${tile(`${e.sets} ×`, "gånger")}${tile(gearOf(id) ? "1" : "0", "utrustning")}</div>
    <section class="card msk-how"><div class="row" style="gap:14px;align-items:center"><span class="thumb msk-fig">${figure(id, "", true)}</span>
      <div><h2>Så här gör du</h2><span class="muted small">Det ska dra${most.length ? ` i ${MUSKEL_NAMN[most[0]].toLowerCase()}` : ""}, inte göra ont.</span></div></div>
      <ol class="msk-steps">${(e.cues || []).map(c => `<li>${esc(c)}</li>`).join("")}</ol><a href="https://musclewiki.com/exercises" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;margin-top:18px;color:#12b7a5;font-weight:700;text-decoration:none">Visa fler övningar på MuscleWiki ↗</a></section>
    <div class="pagefoot row"><button class="grow ghost" data-sgadd="${id}">${icon("plus", 16)}Lägg till</button>
      <button class="primary grow bigbtn" data-dclockstart="${id}">${icon("timer", 18)}Starta${secs ? ` · ${secs} s` : ""}</button></div></div>`;
}

document.addEventListener("change", ev => {
  const ds = ev.target.dataset || {};
  if (ds.mskcat !== undefined) msk.cat = ev.target.value; else if (ds.mskgear !== undefined) msk.gear = ev.target.value; else return;
  msk.limit = 30; render();
});
document.addEventListener("input", ev => {
  if (ev.target.id !== "mskq") return;
  msk.q = ev.target.value; msk.limit = 30;
  const pos = ev.target.selectionStart;
  render();
  const f = $("mskq"); if (f) { f.focus(); f.setSelectionRange(pos, pos); }
});
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-mus],[data-libpick],[data-libclose],[data-libtoday],[data-mskmode],[data-mskview],[data-mskmore],[data-mskdetail],[data-exlib],[data-tab=stretchguide]");
  if (!t) return;
  const ds = t.dataset;
  if (ds.tab === "stretchguide") { msk.mode = "st"; msk.back = "idag"; msk.q = ""; mskDetail = null; return; }   // själva bytet görs av app.js
  ev.stopImmediatePropagation();
  if (ds.exlib !== undefined) { exLib = { q: "", f: "alla" }; libCtx = null; msk = { ...msk, mode: "ex", sel: "brost", back: "pass", q: "", cat: "alla", gear: "alla" }; mskDetail = null; tab = "pass"; passOpen = false; }
  else if (ds.libpick) {
    // Lägg till (eller byt) med den vanliga logiken, och tillbaka dit man kom ifrån
    const c = libCtx, name = EX[ds.libpick].name;
    addExercise(c.target, ds.libpick, c.replace, c.today);
    libCtx = null; save(); render();
    toast(c.replace != null ? `Bytt till ${name}` : `${name} tillagd i ${libTargetName(c.target)}`);
    return;
  }
  else if (ds.libclose !== undefined) libCtx = null;
  else if (ds.libtoday) libCtx.today = ds.libtoday === "true";
  else if (ds.mus !== undefined) {
    msk.sel = ds.mus || null; msk.q = ""; msk.limit = 30;
    if (!msk.sel) { render(); return; }
    // Visa den sida där muskeln finns
    if (!ANAT[msk.view].regs.some(r => r[0] === ds.mus)) msk.view = msk.view === "f" ? "b" : "f";
  }
  else if (ds.mskmode) { msk.mode = ds.mskmode; msk.limit = 30; }
  else if (ds.mskview) msk.view = ds.mskview;
  else if (ds.mskmore !== undefined) msk.limit += 30;
  else if (ds.mskdetail !== undefined) mskDetail = ds.mskdetail || null;
  render();
  window.scrollTo(0, 0);
});

"use strict";
// ---------- Plats och kort pass ----------
// Man tränar på olika ställen med olika utrustning (gymmet, jobbet, hemma). Före passet väljer man var man är,
// och övningar som inte går att göra där byts mot den närmaste för samma muskler. Kort pass behåller bara
// basövningarna och kör två set var. Allt gäller bara dagens pass: mallen återställs när passet sparas eller
// avbryts (restoreSwaps i app.js), och senast nästa dag. Platserna ställs in under Inställningar → Platser.
// Laddas före app.js.

const GEAR_ALL = ["bar", "db", "kb", "cable", "machine", "bw"];
const GEAR_NAMES = { bar: "Skivstång", db: "Hantlar", kb: "Kettlebell", cable: "Kabel", machine: "Maskiner", bw: "Kroppsvikt" };
function places() {
  if (!S.places || !S.places.length) S.places = [{ id: "gym", name: "Gymmet", gear: GEAR_ALL.slice() }, { id: "hemma", name: "Hemma", gear: ["bw"] }];
  return S.places;
}
const placeById = id => places().find(p => p.id === id) || places()[0];
// Kroppsvikt går alltid; stretch och kondition räknas inte som utrustning
const fitsPlace = (id, gear) => { const g = EX[id] ? gearOf(id) : null; return !g || g === "bw" || gear.includes(g); };

// Närmaste övning för samma muskler som går att göra med utrustningen
function altFor(id, gear, avoid = []) {
  const e = EX[id], prim = e.prim || [], area = areaOf(id);
  let best = null, top = 0;
  for (const k of Object.keys(EX)) {
    const x = EX[k];
    if (k === id || avoid.includes(k) || x.cat === "stretch" || x.cat === "cardio" || !fitsPlace(k, gear)) continue;
    const xp = x.prim || [];
    let sc = (areaOf(k) === area ? 4 : 0) + (prim[0] && xp[0] === prim[0] ? 4 : 0) + xp.filter(m => prim.includes(m)).length * 2 + (x.cat === e.cat ? 1 : 0);
    if (ISOLATION.has(k) === ISOLATION.has(id)) sc += 1;
    if (sc > top) { top = sc; best = k; }
  }
  return top >= 6 ? best : null;
}
const isBasic = id => !ISOLATION.has(id) && EX[id] && EX[id].cat !== "core";

// Tar bort dagens anpassning: bytta övningar tillbaka, borttagna på sin plats, setten som de var
function undoPlan(d, w) {
  if (!w || !d) return;
  for (const s of (w.psets || [])) { const e = d.ex.find(x => x.id === s.id); if (e) e.sets = s.sets; }
  for (const s of (w.pswap || []).slice().reverse()) { const i = d.ex.findIndex(x => x.id === s.id); if (i >= 0) { const o = Object.assign({}, s.orig); if (d.ex[i].ss) o.ss = true; else delete o.ss; d.ex[i] = o; } }
  for (const r of (w.premoved || []).slice().reverse()) if (!d.ex.some(x => x.id === r.entry.id)) d.ex.splice(Math.min(r.idx, d.ex.length), 0, Object.assign({}, r.entry));
  delete w.psets; delete w.pswap; delete w.premoved;
}
// Anpassar dagens pass efter plats och kort pass
function planDay(d, placeId, short) {
  const w = workoutFor(d);
  undoPlan(d, w);
  const p = placeById(placeId);
  w.place = p.id; w.short = !!short;
  if (p.id !== places()[0].id || p.gear.length < GEAR_ALL.length) {
    const used = d.ex.map(e => e.id);
    d.ex.slice().forEach(e => {
      if (!EX[e.id] || fitsPlace(e.id, p.gear)) return;
      const i = d.ex.indexOf(e), alt = altFor(e.id, p.gear, used);
      if (alt) { used.push(alt); const n = { id: alt, sets: e.sets, reps: EX[alt].reps }; if (e.ss) n.ss = true; d.ex[i] = n; (w.pswap = w.pswap || []).push({ id: alt, orig: e }); }
      else { d.ex.splice(i, 1); (w.premoved = w.premoved || []).push({ idx: i, entry: e }); }
    });
  }
  if (short) {
    // Basövningarna (minst två), två set var
    const keep = d.ex.filter(e => isBasic(e.id)), keepIds = (keep.length >= 2 ? keep : d.ex.slice(0, 2)).map(e => e.id);
    d.ex.slice().forEach(e => { if (keepIds.includes(e.id)) return; const i = d.ex.indexOf(e); d.ex.splice(i, 1); (w.premoved = w.premoved || []).push({ idx: i, entry: e }); });
    d.ex.forEach(e => { if (+e.sets > 2) { (w.psets = w.psets || []).push({ id: e.id, sets: e.sets }); e.sets = 2; } });
  }
  save();
}
// Vad övningen bytte ut ("i stället för Bänkpress")
const swappedFrom = (w, id) => { const s = w && (w.pswap || []).find(x => x.id === id); return s && EX[s.orig.id] ? EX[s.orig.id].name : ""; };

// Valen på dagens pass innan det har börjat
function placeBar(d, w) {
  const ps = places(), cur = (w && w.place) || ps[0].id, short = !!(w && w.short);
  return `<div class="pl-bar" role="group" aria-label="Var tränar du idag?"><span class="pl-q">Var tränar du?</span>
    <div class="pl-chips">${ps.map(p => `<button class="pl-chip ${p.id === cur ? "on" : ""}" data-place="${esc(p.id)}" data-pday="${d.id}" aria-pressed="${p.id === cur}">${esc(p.name)}</button>`).join("")}
      <button class="pl-chip pl-short ${short ? "on" : ""}" data-pshort="${d.id}" aria-pressed="${short}">${icon("timer", 14)}Kort pass</button></div>
    ${w && (w.pswap || w.premoved) ? `<p class="muted small pl-note">Anpassat för idag. Passet återställs när det är sparat.</p>` : ""}</div>`;
}

// Inställningar → Platser
let plEdit = null;   // platsen vars namn ändras
function placesSummary() { return places().map(p => p.name).join(", "); }
function placesBody() {
  return `${places().map((p, i) => `<section class="card pl-card">
      <div class="row between"><input class="pl-name" data-plname="${esc(p.id)}" maxlength="24" value="${esc(p.name)}" aria-label="Platsens namn">
        ${i > 0 ? `<button class="small ghost" data-pldel="${esc(p.id)}" aria-label="Ta bort ${esc(p.name)}">${icon("close", 16)}</button>` : `<span class="muted small">Vanligast</span>`}</div>
      <div class="pl-gear">${GEAR_ALL.filter(g => g !== "bw").map(g => `<button class="pl-g ${p.gear.includes(g) ? "on" : ""}" data-plgear="${g}" data-plid="${esc(p.id)}" aria-pressed="${p.gear.includes(g)}">${GEAR_NAMES[g]}</button>`).join("")}
        <span class="pl-g on fixed">Kroppsvikt</span></div></section>`).join("")}
    <button class="ghost wide pl-add" data-pladd>${icon("plus", 16)}Lägg till plats</button>
    <p class="muted small pl-help">Den första platsen är den vanliga. På Träna väljer du var du är idag, och övningar som saknar utrustning där byts mot närmaste alternativ.</p>`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-place],[data-pshort],[data-plgear],[data-pladd],[data-pldel]");
  if (!t) return;
  ev.stopImmediatePropagation();
  const ds = t.dataset;
  if (ds.place) { const d = dayById(ds.pday), w = workoutOn(logDate(), d.id); planDay(d, ds.place, w && w.short); toast(`${placeById(ds.place).name}: passet är anpassat`); }
  else if (ds.pshort) { const d = dayById(ds.pshort), w = workoutOn(logDate(), d.id); planDay(d, (w && w.place) || places()[0].id, !(w && w.short)); }
  else if (ds.plgear) { const p = placeById(ds.plid), g = ds.plgear; p.gear = p.gear.includes(g) ? p.gear.filter(x => x !== g) : [...p.gear, g]; if (!p.gear.includes("bw")) p.gear.push("bw"); save(); }
  else if (ds.pladd !== undefined) { places().push({ id: "p" + Date.now().toString(36), name: "Jobbet", gear: ["bw", "db"] }); save(); }
  else if (ds.pldel) { S.places = places().filter(p => p.id !== ds.pldel); save(); }
  render();
}, true);
document.addEventListener("change", ev => {
  const f = ev.target.closest && ev.target.closest("[data-plname]");
  if (!f) return;
  const p = placeById(f.dataset.plname); p.name = f.value.trim().slice(0, 24) || p.name; save(); render();
});

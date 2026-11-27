"use strict";
// ---------- Kort pass ----------
// Har man ont om tid gör Kort pass dagens pass kortare: bara basövningarna, två set var. Gäller bara dagens pass:
// mallen återställs när passet sparas eller avbryts (restoreSwaps i app.js), och senast nästa dag.
// Utrustning väljer man i stället när man komponerar egna pass (filtret i övningsbiblioteket). Laddas före app.js.

const isBasic = id => !ISOLATION.has(id) && EX[id] && EX[id].cat !== "core";

// Tar bort dagens anpassning: bytta övningar tillbaka, borttagna på sin plats, setten som de var
function undoPlan(d, w) {
  if (!w || !d) return;
  for (const s of (w.psets || [])) { const e = d.ex.find(x => x.id === s.id); if (e) e.sets = s.sets; }
  for (const s of (w.pswap || []).slice().reverse()) { const i = d.ex.findIndex(x => x.id === s.id); if (i >= 0) { const o = Object.assign({}, s.orig); if (d.ex[i].ss) o.ss = true; else delete o.ss; d.ex[i] = o; } }
  for (const r of (w.premoved || []).slice().reverse()) if (!d.ex.some(x => x.id === r.entry.id)) d.ex.splice(Math.min(r.idx, d.ex.length), 0, Object.assign({}, r.entry));
  delete w.psets; delete w.pswap; delete w.premoved;
}
// Kort pass på eller av för dagens pass
function planDay(d, short) {
  const w = workoutFor(d);
  undoPlan(d, w);
  w.short = !!short;
  if (short) {
    // Basövningarna (minst två), två set var
    const keep = d.ex.filter(e => isBasic(e.id)), keepIds = (keep.length >= 2 ? keep : d.ex.slice(0, 2)).map(e => e.id);
    d.ex.slice().forEach(e => { if (keepIds.includes(e.id)) return; const i = d.ex.indexOf(e); d.ex.splice(i, 1); (w.premoved = w.premoved || []).push({ idx: i, entry: e }); });
    d.ex.forEach(e => { if (+e.sets > 2) { (w.psets = w.psets || []).push({ id: e.id, sets: e.sets }); e.sets = 2; } });
  }
  save();
}
const swappedFrom = () => "";
function shortBar(d, w) {
  const on = !!(w && w.short);
  return `<div class="pl-bar"><button class="pl-chip pl-short ${on ? "on" : ""}" data-pshort="${d.id}" aria-pressed="${on}">${icon("timer", 14)}Kort pass${on ? " · på" : ""}</button>
    <span class="muted small pl-note">${on ? "Bara basövningarna, två set var. Passet återställs när det är sparat." : "Ont om tid? Bara basövningarna, två set var."}</span></div>`;
}
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-pshort]");
  if (!t) return;
  ev.stopImmediatePropagation();
  const d = dayById(t.dataset.pshort), w = workoutOn(logDate(), d.id);
  planDay(d, !(w && w.short));
  render();
}, true);

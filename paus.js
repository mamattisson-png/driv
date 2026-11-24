"use strict";
// ---------- Paus ----------
// Sjuk, på semester eller annat: under en paus räknas varken träning eller dailys. Sviten bryts inte,
// veckans mål krymper med dagarna som är pausade (en helt pausad vecka hoppas över), och påminnelserna tystnar.
// Allt loggat ligger kvar och går fortfarande att bocka av. Pausen ställs in på ett ställe: Inställningar → Paus.
// S.pauses = [{ id, from, to, why }]; to är sista dagen (null = tills man avslutar). Laddas före app.js.

const PAUS_WHY = { sjuk: "Sjuk", semester: "Semester", annat: "Annat" };
const pauses = () => S.pauses || [];
const pauseOn = d => pauses().find(p => p.from <= d && (!p.to || d <= p.to)) || null;
const activePause = () => pauseOn(TODAY);
// Kommande paus som inte har börjat än
const nextPause = () => pauses().filter(p => p.from > TODAY).sort((a, b) => a.from < b.from ? -1 : 1)[0] || null;
// Veckans mål: krymper med pausade dagar; 0 = hela veckan pausad (räknas inte alls)
function weekGoal(ws) {
  const goal = S.plan.count, active = weekDates(ws).filter(d => !pauseOn(d)).length;
  return active === 7 ? goal : active === 0 ? 0 : Math.max(1, Math.round(goal * active / 7));
}
// "till 28 november", "tills vidare"
const pauseUntil = p => p.to ? `till ${+p.to.slice(8)} ${MONTHS[+p.to.slice(5, 7) - 1]}` : "tills du avslutar";
const pauseLabel = p => p.to ? `${PAUS_WHY[p.why] || "Paus"} ${pauseUntil(p)}` : PAUS_WHY[p.why] || "Paus";

// Kortet på Hem och Dailys under en paus
function pauseCard(where) {
  const p = activePause();
  if (!p) return "";
  const text = p.why === "sjuk" ? "Krya på dig. Sviten och dailys väntar tills du är tillbaka."
    : p.why === "semester" ? "Njut av ledigheten. Sviten och dailys väntar tills du är tillbaka."
    : "Sviten och dailys väntar tills du är tillbaka.";
  return `<section class="pz-card ${where || ""}"><span class="pz-ic">${icon("paus", 22)}</span><span class="grow"><b>Pausad · ${esc(pauseLabel(p))}</b><small>${text}</small></span>
    <button class="small ghost" data-pausopen>Ändra</button></section>`;
}

// Inställningar → Paus
let pzDraft = null;   // { why, from, to, open } medan man ställer in en ny paus
function pauseSummary() {
  const p = activePause(), n = nextPause();
  return p ? `Pausad · ${pauseLabel(p)}` : n ? `${PAUS_WHY[n.why]} från ${+n.from.slice(8)} ${MONTHS[+n.from.slice(5, 7) - 1]}` : "Av";
}
function pauseBody() {
  const p = activePause() || nextPause();
  if (p && !pzDraft) {
    const now = p.from <= TODAY;
    return `<section class="card pz-now"><b>${now ? "Pausad" : "Planerad paus"} · ${esc(PAUS_WHY[p.why])}</b>
        <span class="muted small">${now ? "" : `Från ${dateLabel(p.from)}, `}${p.to ? `till och med ${dateLabel(p.to)}` : "tills du avslutar den"}</span></section>
      <button class="primary wide bigbtn" data-pausend="${esc(p.id)}">${now ? "Avsluta pausen idag" : "Ta bort pausen"}</button>
      <button class="ghost wide" data-pausedit="${esc(p.id)}" style="margin-top:8px">Ändra datum</button>`;
  }
  const d = pzDraft || { why: "sjuk", from: TODAY, to: "", open: false };
  return `<div class="pz-why" role="radiogroup" aria-label="Varför">${Object.entries(PAUS_WHY).map(([k, l]) =>
      `<button role="radio" class="${d.why === k ? "on" : ""}" aria-checked="${d.why === k}" data-pauswhy="${k}">${l}</button>`).join("")}</div>
    <div class="grid2 pz-dates"><label class="field">Från<input type="date" data-pausfrom value="${d.from}" min="${shift(TODAY, -30)}"></label>
      <label class="field">Till och med<input type="date" data-pausto value="${d.to}" min="${d.from}" ${d.open ? "disabled" : ""}></label></div>
    <label class="card psw"><span class="grow">Tills jag avslutar den</span><input type="checkbox" class="switch" data-pausopenend ${d.open ? "checked" : ""}></label>
    <button class="primary wide bigbtn" data-pausstart ${d.open || d.to ? "" : "disabled"}>Pausa</button>
    ${pzDraft && pzDraft.id ? `<button class="ghost wide" data-pauscancel style="margin-top:8px">Avbryt</button>` : ""}
    <p class="muted small pz-note">Allt du loggar under pausen sparas som vanligt.</p>`;
}

document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-pausopen],[data-pauswhy],[data-pausstart],[data-pausend],[data-pausedit],[data-pauscancel]");
  if (!t) return;
  ev.stopImmediatePropagation();
  const ds = t.dataset;
  if (ds.pausopen !== undefined) { pzDraft = null; openProfRow("paus"); return; }
  if (ds.pauswhy) pzDraft = { ...(pzDraft || { from: TODAY, to: "", open: false }), why: ds.pauswhy };
  else if (ds.pausstart !== undefined) {
    const d = pzDraft || { why: "sjuk", from: TODAY, to: "", open: false };
    const to = d.open ? null : d.to < d.from ? d.from : d.to;
    const L = S.pauses || (S.pauses = []);
    if (d.id) { const p = L.find(x => x.id === d.id); if (p) Object.assign(p, { why: d.why, from: d.from, to }); }
    else L.push({ id: "p" + Date.now().toString(36), why: d.why, from: d.from, to });
    pzDraft = null; save(); toast(d.from <= TODAY ? "Pausad" : "Pausen är planerad");
  }
  else if (ds.pausend) {
    const L = S.pauses || [], p = L.find(x => x.id === ds.pausend);
    // En pågående paus slutar igår (idag räknas igen); en kommande tas bort
    if (p && p.from < TODAY) p.to = shift(TODAY, -1); else if (p) L.splice(L.indexOf(p), 1);
    save(); toast("Välkommen tillbaka!");
  }
  else if (ds.pausedit) { const p = pauses().find(x => x.id === ds.pausedit); if (p) pzDraft = { id: p.id, why: p.why, from: p.from, to: p.to || "", open: !p.to }; }
  else if (ds.pauscancel !== undefined) pzDraft = null;
  render();
}, true);
document.addEventListener("change", ev => {
  const t = ev.target, ds = t.dataset || {};
  if (ds.pausfrom === undefined && ds.pausto === undefined && ds.pausopenend === undefined) return;
  const d = pzDraft || (pzDraft = { why: "sjuk", from: TODAY, to: "", open: false });
  if (ds.pausfrom !== undefined) d.from = t.value || TODAY;
  else if (ds.pausto !== undefined) d.to = t.value;
  else d.open = t.checked;
  render();
});

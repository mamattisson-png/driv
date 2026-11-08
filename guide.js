"use strict";
// ---------- Appguide ----------
// Frivillig rundtur: först flikarna, sedan sådant som är svårt att hitta (uppvärmning, supersets, dailys under passet).
// Startas med i-knappen på Hem eller från Inställningar, aldrig av sig själv. Varje steg visar det verkliga elementet
// med en lysande ram och ett kort med en pil som pekar på det. Kan avslutas när som helst.
// Laddas före app.js; render() i app.js ritar rutan och placerar den efter varje ritning.

const day0 = () => (todaysPass().d || S.plan.days[0]).id;
const TOUR = [
  { tab: "idag", sel: '#nav [data-tab="idag"]', title: "Hem", text: "Dagens översikt: passet, maten och dina dailys i tur och ordning." },
  { tab: "pass", sel: '#nav [data-tab="pass"]', title: "Träna", text: "Starta passet, se veckans pass och sök övningar genom att trycka på kroppen." },
  { tab: "dailys", sel: '#nav [data-tab="dailys"]', title: "Dailys", text: "Det du vill göra varje dag: övningar med timer och kosttillskott att bocka av." },
  { tab: "kost", sel: '#nav [data-tab="kost"]', title: "Kost", text: "Logga mat per måltid. Ringen visar hur mycket som är kvar idag." },
  { tab: "historik", sel: '#nav [data-tab="historik"]', title: "Historik", text: "Alla dagar du tränat och ätit, och hur du utvecklas över tid." },
  { tab: "pass", prep: () => { startEdit(dayById(day0())); editing = true; chosenDay = day0(); passOpen = true; exSheet = 0; },
    sel: '.exset:has([data-exstep="warm"])', title: "Uppvärmning", text: "Öppna en övning när du ändrar passet och välj hur många lättare set du vill värma upp med. De räknas inte in i dina rekord." },
  { tab: "pass", prep: () => startFocus(day0()), sel: ".fsteps", title: "Övningarna i passet", text: "Tryck på en övning för att gå till den. Dra den åt höger eller vänster för att ändra ordning." },
  { tab: "pass", prep: () => startFocus(day0()), sel: "[data-fmore]", title: "Fler val under passet", text: "Under Mer: kör som superset, lägg till uppvärmning, byt, lägg till eller ta bort övningar och ändra ordning." },
  { tab: "pass", prep: () => startFocus(day0()), sel: "[data-fdopen]", title: "Dailys under passet", text: "Hinner du inte med dailys separat? Öppna dem här och bocka av mellan seten." },
  { tab: "idag", sel: "[data-tourstart]", title: "Klart!", text: "Guiden startar du igen med den här knappen, eller under Inställningar." },
];
let tour = null;   // index i TOUR medan guiden visas

// Gör vyn ren innan ett steg visas, så att rätt element finns, och förbered det steget behöver
function tourPrep(step) {
  if (focus) endFocus();
  editing = false; editSnap = null; exSheet = null; passOpen = false; chosenDay = null;
  if (typeof exLib !== "undefined") exLib = null;
  mealPage = null; foodSheet = null; foodItem = null;
  histDay = null; histView = "kalender"; modal = null;
  tab = step.tab;
  if (step.prep) step.prep();
  window.scrollTo(0, 0);
}
function tourView() {
  if (tour == null) return "";
  const s = TOUR[tour], last = tour === TOUR.length - 1;
  return `<div class="tour" role="dialog" aria-label="Appguide"><div class="tour-ring"></div>
    <div class="tour-card"><span class="tour-arrow" aria-hidden="true"></span>
      <div class="row between"><span class="klabel accent">${tour + 1} av ${TOUR.length}</span>
      <button class="small ghost iconbtn" data-tourend aria-label="Avsluta guiden">${icon("close", 18)}</button></div>
      <h2>${s.title}</h2><p>${s.text}</p>
      <div class="row tour-btns">${tour ? `<button class="grow" data-tourprev>Tillbaka</button>` : `<button class="grow ghost" data-tourend>Hoppa över</button>`}
        <button class="primary grow" data-tournext>${last ? "Klar" : "Nästa"}</button></div></div></div>`;
}
// Ramen lyser runt elementet, och kortet pekar på det med en pil: under elementet, eller ovanför om det inte får plats
function positionTour() {
  if (tour == null) return;
  const el = [...document.querySelectorAll(TOUR[tour].sel)].find(e => !e.closest(".tour") && e.getClientRects().length);
  const ring = document.querySelector(".tour-ring"), card = document.querySelector(".tour-card");
  if (!ring || !card) return;
  if (!el) { ring.style.display = "none"; card.className = "tour-card free"; card.style.cssText = "bottom:110px"; return; }
  if (!el.closest("#nav")) el.scrollIntoView({ block: "center" });
  const r = el.getBoundingClientRect(), pad = 5;
  ring.style.cssText = `top:${r.top - pad}px;left:${r.left - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
  const ch = card.offsetHeight, cw = card.offsetWidth, below = r.bottom + pad + 14, above = r.top - pad - 14 - ch;
  const down = below + ch < innerHeight - 8 || above < 8;
  card.className = "tour-card " + (down ? "under" : "over");
  const left = card.getBoundingClientRect().left;
  card.style.cssText = `top:${down ? below : above}px;--ax:${Math.max(22, Math.min(cw - 22, r.left + r.width / 2 - left))}px`;
}
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-tourstart],[data-tourskip],[data-tournext],[data-tourprev],[data-tourend]");
  if (!t) return;
  ev.stopImmediatePropagation();
  const ds = t.dataset;
  if (ds.tourstart !== undefined || ds.tourskip !== undefined) { S.tourAsked = true; save(); }
  if (ds.tourskip !== undefined) { render(); return; }
  if (ds.tourstart !== undefined) tour = 0;
  else if (ds.tourprev !== undefined) tour = Math.max(0, tour - 1);
  else if (ds.tournext !== undefined) tour = tour + 1 < TOUR.length ? tour + 1 : null;
  else tour = null;
  if (tour != null) tourPrep(TOUR[tour]); else { tourPrep({ tab: "idag" }); }
  render();
}, true);
document.addEventListener("keydown", ev => { if (tour != null && ev.key === "Escape") { tour = null; tourPrep({ tab: "idag" }); render(); } });
addEventListener("resize", () => positionTour());

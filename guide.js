"use strict";
// ---------- Appguide ----------
// Frivillig rundtur genom flikarna. Startas med i-knappen på Hem eller från Inställningar, aldrig av sig själv.
// Varje steg byter till rätt flik, lyser upp ett verkligt element och förklarar det. Kan avslutas när som helst.
// Laddas före app.js; render() i app.js ritar rutan och placerar den efter varje ritning.

const TOUR = [
  { tab: "idag", sel: ".h3-card", title: "Dagens pass", text: "Här ser du dagens pass. Starta det direkt, eller tryck på kortet för att se övningarna." },
  { tab: "idag", sel: 'button.h3-card[data-tab="kost"]', title: "Dagens mat", text: "Kalorier och protein för dagen. Ett tryck tar dig till Kost." },
  { tab: "idag", sel: 'button.h3-card[data-tab="dailys"]', title: "Dina dailys", text: "Det du vill göra varje dag. Stegen får en grön bock när de är klara." },
  { tab: "idag", sel: ".home3 .h3-list", title: "Övrigt idag", text: "Stretchguiden, annan aktivitet, veckans vägning och vänner." },
  { tab: "pass", sel: ".daypass", title: "Träna", text: "Starta nästa pass. I passet loggar du vikt och reps set för set, med vilotimer mellan seten." },
  { tab: "pass", sel: ".wkcards", title: "Veckans pass", text: "Bocken visar vad du kört den här veckan, och den orange ramen vad som står på tur." },
  { tab: "pass", sel: "[data-exlib]", title: "Sök på muskel", text: "Tryck på kroppen för att hitta övningar och stretchar. Plus lägger till dem i Dailys eller ett pass." },
  { tab: "dailys", sel: ".dlx-top", title: "Dailys", text: "Hur mycket du gjort idag, och de senaste sju dagarna." },
  { tab: "dailys", sel: ".dlx .h3-list", title: "Bocka av", text: "Starta en övning med timer, eller bocka av den direkt. Kosttillskott fungerar likadant." },
  { tab: "kost", sel: ".kringbox", title: "Kost", text: "Hur mycket som är kvar idag, vad du ätit och bränt, och protein, fett och fibrer." },
  { tab: "kost", sel: ".kmeals", title: "Måltider", text: "Tryck på en måltid för att se vad du ätit, eller på plus för att lägga till mat." },
  { tab: "historik", sel: ".calcard", title: "Historik", text: "Alla dagar du tränat eller loggat. Tryck på en dag för att se eller ändra den." },
  { tab: "historik", sel: ".hseg", title: "Utveckling", text: "Här ser du hur vikterna och passen utvecklas över tid." },
  { tab: "idag", sel: "#nav", title: "Menyn", text: "Flikarna Hem, Träna, Dailys, Kost och Historik finns alltid här nere." },
  { tab: "idag", sel: '.homehead [data-tab="profil"]', title: "Inställningar", text: "Profil, mål och inställningar. Guiden startar du igen med i-knappen bredvid." },
];
let tour = null;   // index i TOUR medan guiden visas

// Gör vyn ren innan ett steg visas, så att rätt element finns
function tourPrep(step) {
  tab = step.tab;
  passOpen = false; editing = false; chosenDay = null;
  if (typeof exLib !== "undefined") exLib = null;
  mealPage = null; foodSheet = null; foodItem = null;
  histDay = null; histView = "kalender";
  modal = null;
}
function tourView() {
  if (tour == null) return "";
  const s = TOUR[tour], last = tour === TOUR.length - 1;
  return `<div class="tour" role="dialog" aria-modal="true" aria-label="Appguide"><div class="tour-spot"></div>
    <div class="tour-card"><div class="row between"><span class="klabel accent">Steg ${tour + 1} av ${TOUR.length}</span>
      <button class="small ghost iconbtn" data-tourend aria-label="Avsluta guiden">${icon("close", 18)}</button></div>
      <h2>${s.title}</h2><p>${s.text}</p>
      <div class="tour-dots" aria-hidden="true">${TOUR.map((_, i) => `<i class="${i === tour ? "on" : i < tour ? "done" : ""}"></i>`).join("")}</div>
      <div class="row tour-btns">${tour ? `<button class="grow" data-tourprev>Tillbaka</button>` : `<button class="grow ghost" data-tourend>Hoppa över</button>`}
        <button class="primary grow" data-tournext>${last ? "Klar" : "Nästa"}</button></div></div></div>`;
}
// Ljuset läggs över elementet; kortet hamnar under det, eller ovanför om det inte får plats
function positionTour() {
  if (tour == null) return;
  const el = [...document.querySelectorAll(TOUR[tour].sel)].find(e => !e.closest(".tour"));
  const spot = document.querySelector(".tour-spot"), card = document.querySelector(".tour-card");
  if (!spot || !card) return;
  if (!el) { spot.style.cssText = "display:none"; card.style.cssText = "top:auto;bottom:24px"; return; }
  if (!el.closest("#nav")) el.scrollIntoView({ block: "center" });
  const r = el.getBoundingClientRect(), pad = 6, top = Math.max(4, r.top - pad), h = Math.min(innerHeight - 8, r.height + pad * 2);
  spot.style.cssText = `top:${top}px;left:${r.left - pad}px;width:${r.width + pad * 2}px;height:${h}px`;
  const ch = card.offsetHeight, below = top + h + 12;
  card.style.cssText = below + ch < innerHeight - 8 ? `top:${below}px` : `top:${Math.max(8, top - ch - 12)}px`;
}
document.addEventListener("click", ev => {
  const t = ev.target.closest && ev.target.closest("[data-tourstart],[data-tournext],[data-tourprev],[data-tourend]");
  if (!t) return;
  ev.stopImmediatePropagation();
  const ds = t.dataset;
  if (ds.tourstart !== undefined) tour = 0;
  else if (ds.tourprev !== undefined) tour = Math.max(0, tour - 1);
  else if (ds.tournext !== undefined) tour = tour + 1 < TOUR.length ? tour + 1 : null;
  else tour = null;
  if (tour != null) tourPrep(TOUR[tour]); else { tab = "idag"; window.scrollTo(0, 0); }
  render();
}, true);
document.addEventListener("keydown", ev => { if (tour != null && ev.key === "Escape") { tour = null; render(); } });
addEventListener("resize", () => positionTour());

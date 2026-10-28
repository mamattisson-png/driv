"use strict";

// Gemensam lista för alla användare. Uppdateras och publiceras tillsammans med appen.
// Status: planned = planerat, working = under arbete, idea = idé.
const UPCOMING_FEATURES = [
  {
    title: "Stretch guiden",
    status: "planned",
    description: "Välj en muskel på en kroppskarta och hitta stretchövningar att lägga till i dina dailys eller träningspass.",
  },
];

function upcomingFeaturesView() {
  const statuses = { planned: "Planerat", working: "Under arbete", idea: "Idé" };
  return `<p class="muted small upcoming-intro">Här ser du vad som är på gång i Driv. Listan uppdateras när planerna ändras.</p>
    ${UPCOMING_FEATURES.length ? `<ul class="upcoming-list" aria-label="Kommande funktioner">${UPCOMING_FEATURES.map(item =>
      `<li><span class="upcoming-status">${statuses[item.status] || statuses.planned}</span>
        <h3>${esc(item.title)}</h3><p class="muted small">${esc(item.description)}</p></li>`).join("")}</ul>`
      : `<p class="muted small">Inga nya funktioner är planerade just nu.</p>`}`;
}

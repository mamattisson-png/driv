"use strict";

// Gemensam källa: docs/kommande.md i samma version av DRIV.
// Hämtas från den egna domänen och kan därför även lagras av service workern.
let upcomingItems = null;
let upcomingError = false;
let upcomingLoading = false;

function parseUpcomingMarkdown(markdown) {
  const rows = [];
  const details = {};
  for (const line of markdown.split(/\r?\n/)) {
    const detail = line.match(/^(\d+)\. \*\*[^*]+\*\*:\s*(.*)$/);
    if (detail) details[+detail[1]] = detail[2];
  }
  for (const line of markdown.split(/\r?\n/)) {
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const cols = line.split("|").slice(1, -1).map(x => x.trim());
    if (cols.length < 5) continue;
    const id = Number(cols[0]);
    if (!Number.isInteger(id)) continue;
    rows.push({ id, title: cols[1], category: cols[2], priority: cols[3],
      status: cols[4], description: details[id] || "" });
  }
  return rows;
}

function upcomingFeaturesView() {
  if (!upcomingItems) return '<p class="muted small">Laddar förbättringslistan…</p>';
  const active = upcomingItems.filter(x => x.status !== "Klar");
  const done = upcomingItems.filter(x => x.status === "Klar");
  const renderItem = item => `<li><span class="upcoming-status">${esc(item.status)} · ${esc(item.priority)} prioritet</span>
    <h2>${item.id}. ${esc(item.title)}</h2>
    <p class="muted small">${esc(item.description || item.category)}</p></li>`;
  return `<p class="muted small upcoming-intro">Planerade förbättringar i DRIV. Samma lista som utvecklarna använder på GitHub.</p>
    <h2>Återstår (${active.length})</h2>
    ${active.length ? `<ul class="upcoming-list" aria-label="Planerade förbättringar">${active.map(renderItem).join("")}</ul>` : '<p class="muted small">Inga öppna förbättringar.</p>'}
    ${done.length ? `<h2>Klart (${done.length})</h2><ul class="upcoming-list" aria-label="Genomförda förbättringar">${done.map(renderItem).join("")}</ul>` : ""}`;
}

async function loadUpcomingFeatures() {
  if (upcomingItems || upcomingLoading) return;
  upcomingLoading = true;
  try {
    const response = await fetch("docs/kommande.md");
    if (!response.ok) throw new Error("Kunde inte läsa listan");
    const parsed = parseUpcomingMarkdown(await response.text());
    if (!parsed.length) throw new Error("Listan är tom");
    upcomingItems = parsed;
    upcomingError = false;
  } catch (err) {
    upcomingError = true;
  } finally {
    upcomingLoading = false;
    const target = document.getElementById("upcoming-content");
    if (target) target.innerHTML = upcomingError
      ? '<p class="muted small">Kunde inte ladda förbättringslistan. Kontrollera anslutningen och öppna sidan igen.</p>'
      : upcomingFeaturesView();
  }
}

function upcomingFeaturesPage() {
  // Hämtningen påverkar inte pass, timer eller annan appdata.
  if (!upcomingItems && !upcomingLoading) void loadUpcomingFeatures();
  return `<section class="upcoming-page"><button class="backbtn" data-tab="profil">${icon("left", 18)}Inställningar</button>
    <h1 class="ptitle">Kommande funktioner</h1><div id="upcoming-content">${upcomingFeaturesView()}</div></section>`;
}

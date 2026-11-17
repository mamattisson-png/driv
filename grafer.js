"use strict";
// ---------- Grafer ----------
// Alla grafer ser likadana ut: en stor siffra och en tolkning överst (byggs av den som visar grafen),
// sedan grafen med två värden på axeln, svagt rutnät, värden utskrivna där de behövs, en streckad mållinje
// och tryck/dra som visar en punkt. areaChart för en kurva över tid, barChart för staplar.
// Laddas före app.js.

const CH = { W: 342, H: 170, L: 8, R: 42, T: 22, B: 24 };
const chNum = v => fmtNum(Math.round(v * 10) / 10);
// Två jämna värden på axeln inom lo–hi
function chTicks(lo, hi) {
  const span = hi - lo, step = [0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100].find(s => span / s <= 4) || 100;
  const a = Math.ceil((lo + span * 0.15) / step) * step, b = Math.floor((hi - span * 0.15) / step) * step;
  return a < b ? [a, b] : [Math.round((lo + hi) / 2 / step) * step];
}

// pts: [{v, label (axel, valfri), tip (text vid tryck)}], goal: mållinjens värde, unit: enhet
function areaChart({ pts, goal = null, unit = "", id = "a", aria = "" }) {
  const { W, H, L, R, T, B } = CH, n = pts.length;
  let lo = Math.min(...pts.map(p => p.v), goal ?? Infinity), hi = Math.max(...pts.map(p => p.v), goal ?? -Infinity);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const pad = (hi - lo) * 0.18; lo -= pad; hi += pad;
  const x = i => L + (n === 1 ? (W - L - R) / 2 : i * (W - L - R) / (n - 1)), y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const P = pts.map((p, i) => [x(i), y(p.v)]);
  let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  for (let i = 1; i < n; i++) { const [x0, y0] = P[i - 1], [x1, y1] = P[i], cx = (x0 + x1) / 2; d += ` C${cx.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`; }
  const grid = chTicks(lo, hi).map(t => `<line class="ch-grid" x1="${L}" x2="${W - R}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/><text class="ch-ax" x="${W - R + 6}" y="${(y(t) + 4).toFixed(1)}">${chNum(t)}</text>`).join("");
  const gl = goal != null ? `<line class="ch-goal" x1="${L}" x2="${W - R}" y1="${y(goal).toFixed(1)}" y2="${y(goal).toFixed(1)}"/><text class="ch-goalt" x="${L + 2}" y="${(y(goal) - 6).toFixed(1)}">Mål ${chNum(goal)}${unit ? " " + unit : ""}</text>` : "";
  const labs = pts.map((p, i) => p.label ? `<text class="ch-ax" x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}">${p.label}</text>` : "").join("");
  const [ex, ey] = P[n - 1];
  const data = esc(JSON.stringify(P.map((p, i) => [+p[0].toFixed(1), +p[1].toFixed(1), pts[i].tip])));
  return `<div class="ch-wrap"><svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}" data-chpts="${data}">
    <defs><linearGradient id="chg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent-strong)" stop-opacity=".24"/><stop offset="1" stop-color="var(--accent-strong)" stop-opacity="0"/></linearGradient></defs>
    ${grid}${gl}<path d="${d} L${ex.toFixed(1)},${H - B} L${P[0][0].toFixed(1)},${H - B} Z" fill="url(#chg${id})"/><path class="ch-line" d="${d}"/>
    ${n <= 16 ? P.map(([px, py]) => `<circle class="ch-pt" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3"/>`).join("") : ""}
    <circle class="ch-end" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="5.5"/>${labs}
    <g class="ch-tip" style="display:none"><line class="ch-cross" y1="${T}" y2="${H - B}"/><circle class="ch-sel" r="6"/><rect class="ch-tipbg" rx="9" height="28"/><text class="ch-tipt" text-anchor="middle"></text></g>
    <rect class="ch-hit" x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg></div>`;
}

// vals: [{v, label, tip, cls}], goal: mållinjen, top: utskrivet värde ovanför stapeln (valfritt)
function barChart({ vals, goal = null, aria = "", max = null, fmt = chNum, base = 0 }) {
  const { W, H, L, R, T, B } = CH, n = vals.length;
  // base: var staplarna börjar (för vikter i en övning syns skillnaderna bättre om axeln inte börjar på 0)
  const top0 = Math.max(max ?? 0, goal ?? 0, ...vals.map(b => b.v)), hi = base + (top0 - base) * 1.1 || 1;
  const slot = (W - L - R) / n, bw = Math.max(6, slot - Math.min(10, slot * 0.28)), y = v => T + (hi - Math.max(base, v)) / (hi - base) * (H - T - B);
  const grid = chTicks(base, hi).map(t => `<line class="ch-grid" x1="${L}" x2="${W - R}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/><text class="ch-ax" x="${W - R + 6}" y="${(y(t) + 4).toFixed(1)}">${fmt(t)}</text>`).join("");
  const gl = goal != null ? `<line class="ch-goal" x1="${L}" x2="${W - R}" y1="${y(goal).toFixed(1)}" y2="${y(goal).toFixed(1)}"/><text class="ch-goalt" x="${W - R + 6}" y="${(y(goal) + 4).toFixed(1)}">Mål</text>` : "";
  const bars = vals.map((b, i) => {
    const x0 = L + i * slot + (slot - bw) / 2, h = b.v > 0 ? Math.max(4, H - B - y(b.v)) : 2, top = H - B - h, r = Math.min(4, bw / 2, h);
    return `<g class="ch-b ${b.cls || ""}" data-chtip="${esc(b.tip || "")}"><rect class="ch-bhit" x="${(L + i * slot).toFixed(1)}" y="${T}" width="${slot.toFixed(1)}" height="${H - T - B}" fill="transparent"/>
      <path d="M${x0.toFixed(1)},${H - B} V${(top + r).toFixed(1)} Q${x0.toFixed(1)},${top.toFixed(1)} ${(x0 + r).toFixed(1)},${top.toFixed(1)} H${(x0 + bw - r).toFixed(1)} Q${(x0 + bw).toFixed(1)},${top.toFixed(1)} ${(x0 + bw).toFixed(1)},${(top + r).toFixed(1)} V${H - B} Z"/>
      ${b.top ? `<text class="ch-val" x="${(x0 + bw / 2).toFixed(1)}" y="${(top - 6).toFixed(1)}" text-anchor="middle">${b.top}</text>` : ""}
      ${b.label ? `<text class="ch-ax" x="${(x0 + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${b.label}</text>` : ""}</g>`;
  }).join("");
  return `<div class="ch-wrap"><svg class="ch ch-bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">${grid}${gl}${bars}</svg><div class="ch-read muted small" aria-live="polite"></div></div>`;
}

// Tryck och dra i en kurva: närmaste punkt markeras med sitt värde
(() => {
  const show = (svg, ev) => {
    const pts = JSON.parse(svg.dataset.chpts || "[]"); if (!pts.length) return;
    const r = svg.getBoundingClientRect(), vx = (ev.clientX - r.left) / r.width * CH.W;
    let best = pts[0]; for (const p of pts) if (Math.abs(p[0] - vx) < Math.abs(best[0] - vx)) best = p;
    const g = svg.querySelector(".ch-tip"), [px, py, tip] = best, w = Math.max(70, String(tip).length * 6.6 + 18);
    const bx = Math.min(CH.W - w - 2, Math.max(2, px - w / 2)), by = py - 44 < 2 ? py + 14 : py - 44;
    g.style.display = "";
    g.querySelector(".ch-cross").setAttribute("x1", px); g.querySelector(".ch-cross").setAttribute("x2", px);
    const c = g.querySelector(".ch-sel"); c.setAttribute("cx", px); c.setAttribute("cy", py);
    const bg = g.querySelector(".ch-tipbg"); bg.setAttribute("x", bx); bg.setAttribute("y", by); bg.setAttribute("width", w);
    const t = g.querySelector(".ch-tipt"); t.setAttribute("x", bx + w / 2); t.setAttribute("y", by + 18); t.textContent = tip;
  };
  let active = null;
  document.addEventListener("pointerdown", ev => { const s = ev.target.closest && ev.target.closest("svg[data-chpts]"); if (!s) return; active = s; show(s, ev); });
  document.addEventListener("pointermove", ev => { if (active) show(active, ev); else { const s = ev.target.closest && ev.target.closest("svg[data-chpts]"); if (s && ev.pointerType === "mouse") show(s, ev); } });
  document.addEventListener("pointerup", () => { active = null; });
  // Tryck på en stapel visar dess värde under grafen
  document.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest(".ch-b[data-chtip]");
    if (!b) return;
    const svg = b.closest("svg"); svg.querySelectorAll(".ch-b.sel").forEach(x => x.classList.remove("sel")); b.classList.add("sel");
    const out = svg.parentNode.querySelector(".ch-read"); if (out) out.textContent = b.dataset.chtip;
  });
})();

"use strict";
// Animerade streckgubbar som visar hur en övning går till.
// Sidovy, vänd åt höger. Vinklar i grader: 0 = rakt ned, 90 = framåt, 180 = rakt upp.
// En pose anger höft (h), bålens vinkel (t) eller axel (s), hand (a) och fot (f).
// Armbågar och knän räknas fram med tvåleds-IK; eb/kb väljer åt vilket håll leden böjer.

const BODY = { torso: 30, neck: 9, head: 5.5, ua: 16, fa: 15, th: 21, sh: 20, toe: 5 };
const FLOOR = 95;
const DUR = 2.6;
const REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

const rad = a => a * Math.PI / 180;
const dir = a => [Math.sin(rad(a)), Math.cos(rad(a))];
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const angleOf = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]) * 180 / Math.PI;
const n1 = x => (Math.round(x * 10) / 10).toString();

function ik(root, target, a, b, bend) {
  const dx = target[0] - root[0], dy = target[1] - root[1];
  const d = Math.hypot(dx, dy) || 0.01;
  const reach = Math.max(Math.abs(a - b) + 0.01, Math.min(d, a + b - 0.01));
  const ux = dx / d, uy = dy / d;
  const ang = Math.acos((a * a + reach * reach - b * b) / (2 * a * reach)) * bend;
  const c = Math.cos(ang), s = Math.sin(ang);
  return [root, [root[0] + a * (ux * c - uy * s), root[1] + a * (ux * s + uy * c)],
    [root[0] + ux * reach, root[1] + uy * reach]];
}

function withToe(l) {
  const [k, f] = [l[1], l[2]];
  const len = Math.hypot(f[0] - k[0], f[1] - k[1]) || 1;
  return [...l, add(f, [(f[1] - k[1]) / len, -(f[0] - k[0]) / len], BODY.toe)];
}

function sideJoints(p) {
  const H = p.h;
  const t = p.s ? angleOf(H, p.s) : p.t;
  const S = p.s || add(H, dir(t), BODY.torso);
  const eb = p.eb ?? 1, kb = p.kb ?? -1;
  const arm = (hand, bend) => ik(S, hand, BODY.ua, BODY.fa, bend);
  const leg = (foot, bend) => withToe(ik(H, foot, BODY.th, BODY.sh, bend));
  const A = arm(p.a, eb), L = leg(p.f, kb);
  return {
    head: add(S, dir(t), BODY.neck),
    torso: [H, S, add(S, dir(t), BODY.neck - BODY.head)],
    arm: A, arm2: p.a2 ? arm(p.a2, p.eb2 ?? eb) : A,
    leg: L, leg2: p.f2 ? leg(p.f2, p.kb2 ?? kb) : L,
  };
}

// Framifrån (används där sidovyn vore missvisande, t.ex. sidolyft)
function frontJoints(p) {
  const [cx, hy] = p.h;
  const sy = hy - BODY.torso;
  const mirror = q => [2 * cx - q[0], q[1]];
  const eb = p.eb ?? -1;
  const legR = p.leg ? [[cx + 5, hy], ...p.leg] : [[cx + 5, hy], [cx + 6, hy + BODY.th], [cx + 7, FLOOR], [cx + 11, FLOOR]];
  return {
    head: [cx, sy - BODY.neck],
    torso: [[cx, hy], [cx, sy], [cx, sy - BODY.neck + BODY.head]],
    shoulders: [[cx - 9, sy], [cx + 9, sy]],
    hips: [[cx - 5, hy], [cx + 5, hy]],
    arm: ik([cx + 9, sy], p.a, BODY.ua, BODY.fa, eb),
    arm2: ik([cx - 9, sy], mirror(p.a), BODY.ua, BODY.fa, -eb),
    leg: legR, leg2: p.leg2 ? [[cx - 5, hy], ...p.leg2] : legR.map(mirror),
  };
}

const pts = arr => arr.map(q => n1(q[0]) + "," + n1(q[1])).join(" ");

// ---------- Rörelsen ----------
// Poserna tonas över i hela kroppen, inte punkt för punkt: varje mellanläge räknas fram med
// samma leder och längder, så att armar och ben aldrig töjs och lederna svänger i bågar.
// Farten bromsas i vändlägena (cosinus), och rörelsen går fram och tillbaka.
const FRAMES = 16;
const lerp = (a, b, u) => a + (b - a) * u;
const lerpP = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
const POSE_STEP = new Set(["eb", "kb", "eb2", "kb2"]);
function lerpPose(A, B, u) {
  if (!!A.s !== !!B.s) {   // den ena anger axeln, den andra bålens vinkel: räkna om till vinkel
    const toT = P => P.s ? { ...P, t: angleOf(P.h, P.s), s: undefined } : P;
    A = toT(A); B = toT(B);
  }
  const o = { ...A };
  for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const a = A[k], b = B[k];
    if (a == null || b == null || POSE_STEP.has(k)) o[k] = u < 0.5 ? (a ?? b) : (b ?? a);
    else if (typeof a === "number") o[k] = lerp(a, b, u);
    else if (Array.isArray(a[0])) o[k] = a.map((q, i) => lerpP(q, b[i] || q, u));
    else o[k] = lerpP(a, b, u);
  }
  return o;
}
function frames(J, A, B, n) {
  return Array.from({ length: n + 1 }, (_, k) => J(lerpPose(A, B, 0.5 - 0.5 * Math.cos(2 * Math.PI * k / n))));
}
const anv = (attr, list) => list.every(v => v === list[0]) ? "" :
  `<animate attributeName="${attr}" values="${list.join(";")}" dur="${DUR}s" repeatCount="indefinite"/>`;
// Ritfunktioner som tar alla lägen (fr) och en funktion som plockar ut punkten ur ett läge
function segF(fr, g1, g2, cls, w) {
  const a = fr.map(g1), b = fr.map(g2);
  return `<line class="${cls}"${w ? ` stroke-width="${w}"` : ""} x1="${n1(a[0][0])}" y1="${n1(a[0][1])}" x2="${n1(b[0][0])}" y2="${n1(b[0][1])}">` +
    anv("x1", a.map(q => n1(q[0]))) + anv("y1", a.map(q => n1(q[1]))) + anv("x2", b.map(q => n1(q[0]))) + anv("y2", b.map(q => n1(q[1]))) + "</line>";
}
function circF(fr, g, r, cls) {
  const a = fr.map(g);
  return `<circle class="${cls}" cx="${n1(a[0][0])}" cy="${n1(a[0][1])}" r="${r}">` + anv("cx", a.map(q => n1(q[0]))) + anv("cy", a.map(q => n1(q[1]))) + "</circle>";
}
function polyF(fr, g, cls) {
  const a = fr.map(f => pts(g(f)));
  return `<polyline class="${cls}" points="${a[0]}">${anv("points", a)}</polyline>`;
}

function sceneShape(s) {
  const [kind, ...v] = s;
  if (kind === "rect") return `<rect class="fe" x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}" rx="1.5"/>`;
  if (kind === "line") return `<line class="fe" x1="${v[0]}" y1="${v[1]}" x2="${v[2]}" y2="${v[3]}"/>`;
  if (kind === "bar") return `<line class="fe fbar" x1="${v[0]}" y1="${v[1]}" x2="${v[2]}" y2="${v[3]}"/>`;
  return "";
}

// Det man håller i: stång, hantlar, kabel, viktskiva och dyna följer händer och fötter
function holds(ex, fr) {
  let out = "";
  const h = f => f.arm[2], h2 = f => f.arm2[2];
  if (ex.hold === "bar" && ex.view === "front") {
    out += segF(fr, f => add(h2(f), [-9, 0]), f => add(h(f), [9, 0]), "fwbar");
    for (const [g, k] of [[h2, -9], [h, 9]]) out += segF(fr, f => add(g(f), [k, -4.5]), f => add(g(f), [k, 4.5]), "fwbar fwplate");
  } else if (ex.hold === "bar") out += circF(fr, h, 6.5, "fw");
  if (ex.hold === "db") {
    out += circF(fr, h, 3.6, "fw");
    if (fr.some(f => pts([h(f)]) !== pts([h2(f)]))) out += circF(fr, h2, 3.6, "fw");
  }
  if (ex.cable) {
    const c = ex.cable;
    out = `<rect class="fe" x="${c[0] - 4}" y="${c[1] - 4}" width="8" height="8" rx="1.5"/>` + segF(fr, () => c, h, "fc") + out + circF(fr, h, 2.4, "fw");
  }
  if (ex.plate) { const v = ex.plate; out += segF(fr, f => add(f.leg[3], v, -1), f => add(f.leg[3], v), "fe fplate"); }
  if (ex.pad) out += circF(fr, f => f.leg[2], 3.4, "fp");
  return out;
}

// ---------- Kroppen ----------
// Rundade lemmar med olika tjocklek (lår tjockare än underben osv.), bortre sidan i en mörkare ton.
const LIMB_W = { ua: 5.6, fa: 4.6, th: 8, sh: 6.2, foot: 4, torso: 11.5, neck: 4.4, hand: 2.6 };
function limbs(fr, part, cls, arm) {
  const g = i => f => f[part][i];
  return arm ? segF(fr, g(0), g(1), cls, LIMB_W.ua) + segF(fr, g(1), g(2), cls, LIMB_W.fa) + circF(fr, g(2), LIMB_W.hand, cls + "h")
    : segF(fr, g(0), g(1), cls, LIMB_W.th) + segF(fr, g(1), g(2), cls, LIMB_W.sh) + (fr[0][part][3] ? segF(fr, g(2), g(3), cls, LIMB_W.foot) : "");
}
// En mörk kant runt främre arm och ben, så att de syns även framför bålen (som i curl)
function outline(fr, part) {
  const g = i => f => f[part][i], k = 2.6, arm = part === "arm";
  return segF(fr, g(0), g(1), "f2o", (arm ? LIMB_W.ua : LIMB_W.th) + k) + segF(fr, g(1), g(2), "f2o", (arm ? LIMB_W.fa : LIMB_W.sh) + k);
}
function body(fr, front) {
  let out = limbs(fr, "leg2", "f2 f2far") + limbs(fr, "arm2", "f2 f2far", true);
  if (front) out += segF(fr, f => f.hips[0], f => f.hips[1], "f2", 9) + segF(fr, f => f.shoulders[0], f => f.shoulders[1], "f2", 9);
  return out + segF(fr, f => f.torso[0], f => f.torso[1], "f2", LIMB_W.torso) + segF(fr, f => f.torso[1], f => f.torso[2], "f2", LIMB_W.neck) +
    circF(fr, f => f.head, BODY.head + 0.8, "f2h") + outline(fr, "leg") + limbs(fr, "leg", "f2") + outline(fr, "arm") + limbs(fr, "arm", "f2", true);
}

// Animeras bara där en övning visas ensam (övningsrutan, fokusläget); i listor är bilden stilla.
// Stillbilden visar arbetsläget (botten i knäböj, toppen i curl), utom när man står och
// startläget är det böjda (marklyft, good morning): då visas det.
function figure(id, cls = "", animate = false) {
  const ex = EX[id];
  if (!ex) return "";
  const front = ex.view === "front", J = front ? frontJoints : sideJoints;
  const still = !ex.B || REDUCED || !animate;
  let fr;
  if (!still) fr = frames(J, ex.A, ex.B, FRAMES);
  else {
    const a = J(ex.A), b = ex.B ? J(ex.B) : a;
    fr = [ex.B && !(a.head[1] > b.head[1] + 8 && a.leg[2][1] > FLOOR - 4) ? b : a];
  }
  return `<svg class="fig ${cls}" viewBox="0 -16 120 116" role="img" aria-label="${ex.name}">` +
    `<line class="ffloor" x1="2" y1="${FLOOR + 2.5}" x2="118" y2="${FLOOR + 2.5}"/>` +
    (ex.scene || []).map(sceneShape).join("") + body(fr, front) + holds(ex, fr) + "</svg>";
}

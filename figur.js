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
  const legR = [[cx + 5, hy], [cx + 6, hy + BODY.th], [cx + 7, FLOOR], [cx + 11, FLOOR]];
  return {
    head: [cx, sy - BODY.neck],
    torso: [[cx, hy], [cx, sy], [cx, sy - BODY.neck + BODY.head]],
    shoulders: [[cx - 9, sy], [cx + 9, sy]],
    hips: [[cx - 5, hy], [cx + 5, hy]],
    arm: ik([cx + 9, sy], p.a, BODY.ua, BODY.fa, eb),
    arm2: ik([cx - 9, sy], mirror(p.a), BODY.ua, BODY.fa, -eb),
    leg: legR, leg2: legR.map(mirror),
  };
}

const pts = arr => arr.map(q => n1(q[0]) + "," + n1(q[1])).join(" ");

function anim(attr, a, b, still) {
  if (still || a === b) return "";
  return `<animate attributeName="${attr}" values="${a};${b};${a}" dur="${DUR}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/>`;
}
function poly(a, b, cls, still) {
  const pa = pts(a), pb = pts(b);
  return `<polyline class="${cls}" points="${pa}">${anim("points", pa, pb, still)}</polyline>`;
}
function circ(a, b, r, cls, still) {
  return `<circle class="${cls}" cx="${n1(a[0])}" cy="${n1(a[1])}" r="${r}">` +
    anim("cx", n1(a[0]), n1(b[0]), still) + anim("cy", n1(a[1]), n1(b[1]), still) + "</circle>";
}
function seg(a1, a2, b1, b2, cls, still) {
  return `<line class="${cls}" x1="${n1(a1[0])}" y1="${n1(a1[1])}" x2="${n1(a2[0])}" y2="${n1(a2[1])}">` +
    anim("x1", n1(a1[0]), n1(b1[0]), still) + anim("y1", n1(a1[1]), n1(b1[1]), still) +
    anim("x2", n1(a2[0]), n1(b2[0]), still) + anim("y2", n1(a2[1]), n1(b2[1]), still) + "</line>";
}

function sceneShape(s) {
  const [kind, ...v] = s;
  if (kind === "rect") return `<rect class="fe" x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}" rx="1.5"/>`;
  if (kind === "line") return `<line class="fe" x1="${v[0]}" y1="${v[1]}" x2="${v[2]}" y2="${v[3]}"/>`;
  if (kind === "bar") return `<line class="fe fbar" x1="${v[0]}" y1="${v[1]}" x2="${v[2]}" y2="${v[3]}"/>`;
  return "";
}

// Ankarpunkten flyttas en bit bort från handen så att linjen syns tydligt
function holds(ex, A, B, still) {
  let out = "";
  const ha = A.arm[2], hb = B.arm[2], ha2 = A.arm2[2], hb2 = B.arm2[2];
  // Framifrån syns stången som en linje mellan händerna, från sidan som en skiva
  if (ex.hold === "bar" && ex.view === "front") {
    out += seg(add(ha2, [-9, 0]), add(ha, [9, 0]), add(hb2, [-9, 0]), add(hb, [9, 0]), "fwbar", still);
    // Viktskivor i stångens ändar
    for (const [a, b, k] of [[ha2, hb2, -9], [ha, hb, 9]])
      out += seg(add(a, [k, -4.5]), add(a, [k, 4.5]), add(b, [k, -4.5]), add(b, [k, 4.5]), "fwbar fwplate", still);
  } else if (ex.hold === "bar") out += circ(ha, hb, 6.5, "fw", still);
  if (ex.hold === "db") {
    out += circ(ha, hb, 3.6, "fw", still);
    if (pts([ha2]) !== pts([ha]) || pts([hb2]) !== pts([hb])) out += circ(ha2, hb2, 3.6, "fw", still);
  }
  if (ex.cable) {
    const c = ex.cable;
    out = `<rect class="fe" x="${c[0] - 4}" y="${c[1] - 4}" width="8" height="8" rx="1.5"/>` +
      seg(c, ha, c, hb, "fc", still) + out + circ(ha, hb, 2.4, "fw", still);
  }
  if (ex.plate) {
    const pa = A.leg[3], pb = B.leg[3], v = ex.plate;
    out += seg(add(pa, v, -1), add(pa, v), add(pb, v, -1), add(pb, v), "fe fplate", still);
  }
  if (ex.pad) out += circ(A.leg[2], B.leg[2], 3.4, "fp", still);
  return out;
}

// Animeras bara där en övning visas ensam (övningsrutan, fokusläget); i listor är bilden stilla
function figure(id, cls = "", animate = false) {
  const ex = EX[id];
  if (!ex) return "";
  const front = ex.view === "front";
  const J = front ? frontJoints : sideJoints;
  const A = J(ex.A), B = J(ex.B || ex.A);
  const still = !ex.B || REDUCED || !animate;   // utan animation visas startläget
  const far = front ? "fb" : "fb ff";
  let body = poly(A.leg2, B.leg2, far, still) + poly(A.arm2, B.arm2, far, still);
  if (front) body += poly(A.hips, B.hips, "fb", still) + poly(A.shoulders, B.shoulders, "fb", still);
  body += poly(A.torso, B.torso, "fb", still) + poly(A.leg, B.leg, "fb", still) +
    circ(A.head, B.head, BODY.head, "fh", still) + poly(A.arm, B.arm, "fb", still);
  return `<svg class="fig ${cls}" viewBox="0 -16 120 116" role="img" aria-label="${ex.name}">` +
    `<line class="ffloor" x1="2" y1="${FLOOR + 2.5}" x2="118" y2="${FLOOR + 2.5}"/>` +
    (ex.scene || []).map(sceneShape).join("") + body + holds(ex, A, B, still) + "</svg>";
}

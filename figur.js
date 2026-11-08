"use strict";
// Övningsfigurer: leder och poser (nedan) och ritningen av kroppen med höjdkurvor (längst ned).
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

// ---------- Figuren som ritas: höjdkurvor (J1) ----------
// Kroppen räknas fram ur samma poser som ovan. Varje kroppsdel får en egen form, och runt hela kroppen
// går tre höjdkurvor. Musklerna som övningen tränar (prim i övningsdatan) är orange.
// Allt är platta färger, så inget kan byta ljus eller skugga mitt i en rörelse.
// I listor är bilden stilla i startläget. Ensam (övningsrutan) animeras den: händer och fötter rör sig
// i bågar runt axel och höft, beräknat i 24 lägen per repetition som webbläsaren glider mellan.
(function () {
  const N_FRAMES = 24;
  const RINGS = [[10.5, 8.9, "--r3"], [6.9, 5.3, "--r2"], [3.3, 1.8, "--r1"]];
  const MUSCLE_OF = { framsida_lar: "quad", sate: "glute", brost: "chest", triceps: "tri", axlar: "delt",
    baksida_lar: "hams", vader: "calf", biceps: "bic", rygg: "back", mage: "abs", underarmar: "fore" };
  let uidN = 0;

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const lerpP = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const P2 = p => n1(p[0]) + " " + n1(p[1]);
  function shoulderOf(p, front) {
    if (front) return [p.h[0] + 9, p.h[1] - BODY.torso];
    if (p.s) return p.s;
    return add(p.h, dir(p.t), BODY.torso);
  }
  function arc(fromA, fromB, a, b, k, base) {
    const va = sub(a, fromA), vb = sub(b, fromB);
    const ra = Math.hypot(va[0], va[1]), rb = Math.hypot(vb[0], vb[1]);
    let aa = Math.atan2(va[1], va[0]), ab = Math.atan2(vb[1], vb[0]);
    if (ab - aa > Math.PI) ab -= 2 * Math.PI;
    if (aa - ab > Math.PI) ab += 2 * Math.PI;
    const ang = aa + (ab - aa) * k, r = ra + (rb - ra) * k;
    return [base[0] + Math.cos(ang) * r, base[1] + Math.sin(ang) * r];
  }
  function lerpPose(A, B, k, front) {
    // Framifrån är bortre benet en spegling av det närmre om inget annat anges.
    // Saknas det i ena läget fylls det i, så att benet glider i stället för att hoppa.
    if (front && (A.leg2 || B.leg2) && !(A.leg2 && B.leg2)) {
      const fill = P => { const cx = P.h[0], leg = P.leg || [[cx + 6, P.h[1] + BODY.th], [cx + 7, FLOOR], [cx + 11, FLOOR]];
        return Object.assign({}, P, { leg, leg2: P.leg2 || leg.map(q => [2 * cx - q[0], q[1]]) }); };
      A = fill(A); B = fill(B);
    }
    if (front && (A.leg || B.leg) && !(A.leg && B.leg)) {
      const fill = P => P.leg ? P : Object.assign({}, P, { leg: [[P.h[0] + 6, P.h[1] + BODY.th], [P.h[0] + 7, FLOOR], [P.h[0] + 11, FLOOR]] });
      A = fill(A); B = fill(B);
    }
    const out = Object.assign({}, A);
    for (const key of Object.keys(B)) {
      const a = A[key], b = B[key];
      if (Array.isArray(a) && Array.isArray(b) && Array.isArray(a[0])) out[key] = a.map((q, i) => lerpP(q, b[i] || q, k));
      else if (Array.isArray(a) && Array.isArray(b)) out[key] = lerpP(a, b, k);
      else if (typeof a === "number" && typeof b === "number" && key !== "eb" && key !== "kb") out[key] = a + (b - a) * k;
      else if (a === undefined) out[key] = b;
    }
    const sA = shoulderOf(A, front), sB = shoulderOf(B, front), sK = shoulderOf(out, front);
    for (const key of ["a", "a2"]) if (A[key] && B[key]) out[key] = arc(sA, sB, A[key], B[key], k, sK);
    for (const key of ["f", "f2"]) if (A[key] && B[key] && !front) out[key] = arc(A.h, B.h, A[key], B[key], k, out.h);
    return out;
  }
  function smooth(P) {
    const n = P.length;
    let d = `M${P2(P[0])}`;
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${P2(c1)} ${P2(c2)} ${P2(p2)}`;
    }
    return d + "Z";
  }
  const prof = (arr, t) => { const x = t * (arr.length - 1), i = Math.min(arr.length - 2, Math.floor(x)); return arr[i] + (arr[i + 1] - arr[i]) * (x - i); };
  // En lem: framsidan pekar åt `sign` gånger normalen, så att formen följer kroppen när den roterar
  function limb(p1, p2, front, back, sign = -1, steps = 7) {
    const d = sub(p2, p1), len = Math.hypot(d[0], d[1]) || .01, u = [d[0] / len, d[1] / len];
    const nF = [-u[1] * sign, u[0] * sign];
    const F = [], B = [];
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1), c = add(p1, u, len * t);
      F.push(add(c, nF, prof(front, t))); B.push(add(c, nF, -prof(back, t)));
    }
    const capE = (front[front.length - 1] + back[back.length - 1]) / 2, capS = (front[0] + back[0]) / 2;
    const P = [...F, add(add(p2, u, capE * .8), nF, (front[front.length - 1] - back[back.length - 1]) / 2), ...B.reverse(), add(add(p1, u, -capS * .8), nF, (front[0] - back[0]) / 2)];
    return { d: smooth(P), pts: P, p1, p2, u, nF, len, front, back, w: (prof(front, .5) + prof(back, .5)) / 2, mid: lerpP(p1, p2, .5) };
  }
  const at = (L, t, off) => add(add(L.p1, L.u, L.len * t), L.nF, off);
  const PROF = {
    thighF: [3.4, 4.0, 4.1, 3.8, 3.2, 2.6, 2.3], thighB: [4.2, 3.8, 3.4, 3.0, 2.6, 2.3, 2.2],
    shinF: [2.4, 2.2, 1.9, 1.6, 1.4, 1.2, 1.1], shinB: [2.3, 3.1, 3.2, 2.6, 1.8, 1.3, 1.2],
    uaF: [2.6, 2.7, 2.6, 2.3, 1.9, 1.7], uaB: [2.8, 2.8, 2.6, 2.2, 1.9, 1.7],
    faF: [1.9, 2.2, 1.9, 1.6, 1.3, 1.2], faB: [1.8, 2.1, 1.9, 1.6, 1.3, 1.2],
    torF: [2.0, 3.4, 3.5, 3.3, 3.8, 5.0, 5.5, 4.8, 2.6], torB: [4.4, 5.6, 4.6, 3.7, 4.0, 4.7, 5.1, 4.6, 2.3],
  };
  function buildBody(J) {
    const parts = [];
    const legParts = (L, far) => {
      const avgF = J.side ? PROF.thighF : PROF.thighF.map((v, i) => (v + PROF.thighB[i]) / 2 * .92);
      const avgB = J.side ? PROF.thighB : avgF;
      parts.push({ k: "thigh", far, L: limb(L[0], L[1], avgF, avgB, -1) });
      const sF = J.side ? PROF.shinF : PROF.shinB.map((v, i) => (v + PROF.shinF[i]) / 2);
      parts.push({ k: "shin", far, L: limb(L[1], L[2], sF, J.side ? PROF.shinB : sF, -1) });
      const v = sub(L[3], L[2]), vl = Math.hypot(v[0], v[1]) || 1, vu = [v[0] / vl, v[1] / vl];
      parts.push({ k: "foot", far, L: limb(add(L[2], vu, -1.8), add(L[3], vu, .8), [1.3, 1.9, 1.8, 1.4, 1.0], [1.6, 1.3, 1.1, 1.0, .9], 1, 5) });
    };
    const armParts = (A, far) => {
      parts.push({ k: "ua", far, L: limb(A[0], A[1], PROF.uaF, PROF.uaB, -1) });
      parts.push({ k: "fa", far, L: limb(A[1], A[2], PROF.faF, PROF.faB, -1) });
      parts.push({ k: "hand", far, c: A[2], r: 2.1 });
    };
    if (J.side) {
      legParts(J.leg2, true); armParts(J.arm2, true);
      const d = sub(J.S, J.H), len = Math.hypot(d[0], d[1]), u = [d[0] / len, d[1] / len];
      parts.push({ k: "torso", far: false, L: limb(add(J.H, u, -4), add(J.S, u, 3), PROF.torF, PROF.torB, 1, 9) });
      legParts(J.leg, false);
      parts.push({ k: "neck", far: false, L: limb(J.S, J.neckTop, [2.2, 2.0, 2.0], [2.2, 2.0, 1.9], 1, 3) });
      // Huvudet följer bålen men hålls närmare lodrätt när man står upp, som när man tittar framåt
      const nf = limb(J.S, J.head, [1, 1], [1, 1], 1, 2), up = Math.abs(nf.u[1]);
      const fwd = [Math.sign(nf.nF[0]) || 1, 0], fb = lerpP(nf.nF, fwd, .6 * up), fl = Math.hypot(fb[0], fb[1]) || 1;
      parts.push({ k: "head", far: false, c: J.head, face: [fb[0] / fl, fb[1] / fl] });
      armParts(J.arm, false);
    } else {
      legParts(J.leg2, false); legParts(J.leg, false);
      const [sl, sr] = J.shoulders, cx = J.S[0], sy = J.S[1], hy = J.H[1];
      const T = [[cx, sy - 3.6], [cx + 3.6, sy - 3.1], [sr[0] - .5, sy - 2.2], [sr[0] + 1.6, sy + .8], [cx + 8.6, sy + 8], [cx + 6.6, sy + 17],
        [cx + 6.1, sy + 22], [cx + 7.2, hy - 2], [cx + 6.6, hy + 2.4], [cx, hy + 3.6],
        [cx - 6.6, hy + 2.4], [cx - 7.2, hy - 2], [cx - 6.1, sy + 22], [cx - 6.6, sy + 17], [cx - 8.6, sy + 8], [sl[0] - 1.6, sy + .8], [sl[0] + .5, sy - 2.2], [cx - 3.6, sy - 3.1]];
      parts.push({ k: "torsoF", far: false, d: smooth(T), pts: T, cx, sy, hy });
      parts.push({ k: "neck", far: false, L: limb(J.S, J.neckTop, [2.3, 2.1, 2.0], [2.3, 2.1, 2.0], 1, 3) });
      parts.push({ k: "head", far: false, c: J.head, face: null });
      armParts(J.arm2, false); armParts(J.arm, false);
    }
    return parts;
  }

  // ---------- Driv-atleten ----------
  // Allt räknas fram ur kroppens egna mått. Kläder och muskler är delar av samma lemform,
  // så de ligger alltid exakt på kroppen. Inga klippformer används, eftersom Safari kan
  // hålla kvar gamla klippformer mellan bildrutor. Allt skuggas med samma ljus uppifrån vänster.
  function openSmooth(P) {
    let d = "";
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, P.length - 1)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${P2(c1)} ${P2(c2)} ${P2(p2)}`;
    }
    return d;
  }
  const edgeF = (L, t) => prof(L.front, Math.min(1, Math.max(0, t)));
  const edgeB = (L, t) => prof(L.back, Math.min(1, Math.max(0, t)));

  // En bit av en lem mellan t0 och t1 med exakt samma kontur som lemmen.
  // Ändarna rundas bara där lemmen själv är rundad (t0 = 0 eller t1 = 1), annars är snittet rakt.
  function slice(L, t0, t1, extra = .12, steps = 8) {
    const F = [], B = [];
    for (let i = 0; i < steps; i++) {
      const t = t0 + (t1 - t0) * i / (steps - 1);
      F.push(at(L, t, edgeF(L, t) + extra)); B.push(at(L, t, -(edgeB(L, t) + extra)));
    }
    B.reverse();
    const capS = t0 <= 0, capE = t1 >= 1;
    const cS = add(add(L.p1, L.u, -(L.front[0] + L.back[0]) / 2 * .8 - extra), L.nF, (L.front[0] - L.back[0]) / 2);
    const fl = L.front.length - 1, bl = L.back.length - 1;
    const cE = add(add(L.p2, L.u, (L.front[fl] + L.back[bl]) / 2 * .8 + extra), L.nF, (L.front[fl] - L.back[bl]) / 2);
    if (capS && capE) return smooth([...F, cE, ...B, cS]);
    if (capE) { const P = [...F, cE, ...B]; return `M${P2(P[0])}${openSmooth(P)}Z`; }
    if (capS) { const P = [...B, cS, ...F]; return `M${P2(P[0])}${openSmooth(P)}Z`; }
    return `M${P2(F[0])}${openSmooth(F)}L${P2(B[0])}${openSmooth(B)}Z`;
  }

  // En muskel som en lins längs en lems ena sida. Ytterkanten ligger strax innanför lemmens kontur,
  // innerkanten en bit in mot (eller förbi) mitten. Ändarna avsmalnar mjukt.
  // side: +1 framsida, -1 baksida. inner: hur långt in innerkanten går, som andel av halva bredden.
  function lens(L, side, t0, t1, inner, ends = [.6, .6], steps = 9) {
    const O = [], I = [];
    for (let i = 0; i < steps; i++) {
      const s = i / (steps - 1), t = t0 + (t1 - t0) * s;
      const edge = side > 0 ? edgeF(L, t) : -edgeB(L, t);
      const w = Math.pow(Math.sin(Math.PI * s), s < .5 ? ends[0] : ends[1]);
      const o = edge * .94, n = edge * inner, c = (o + n) / 2;
      O.push(at(L, t, c + (o - c) * w)); I.push(at(L, t, c + (n - c) * w));
    }
    return `M${P2(O[0])}${openSmooth(O)}${openSmooth([O[O.length - 1], ...I.slice().reverse()]).slice(0)}Z`;
  }

  // Musklerna per övning, med vilken lem de hör till
  function muscleShapes(ex, parts, J, which) {
    const out = [];
    const get = (k, far = false) => parts.find(p => p.k === k && p.far === far);
    const torso = parts.find(p => p.k === "torso");
    for (const m of ex.hot) {
      if (which && !which.includes(m)) continue;
      if (m === "quad" && J.side) { const T = get("thigh").L; out.push({ d: lens(T, 1, .1, .9, -.2, [.5, .7]), L: T }); }
      // Höftleden ligger ungefär vid t = 0,11 på bålen; sätet sitter på baksidan runt den
      // Sätet syns bara från sidan. Bröstet framifrån ritas som två bröstmuskler på övre bålen.
      if (m === "glute" && torso) { const T = torso.L; out.push({ d: lens(T, -1, .01, .26, .3, [.4, .7]), L: T }); }
      if (m === "chest" && torso) { const T = torso.L; out.push({ d: lens(T, 1, .6, .89, .15, [.6, .5]), L: T }); }
      if (m === "chest" && !torso) { const tf = parts.find(p => p.k === "torsoF");
        for (const sx of [-1, 1]) out.push({ d: smooth([[tf.cx + sx * .8, tf.sy + 2.2], [tf.cx + sx * 5.4, tf.sy + 1.6], [tf.cx + sx * 6.6, tf.sy + 5], [tf.cx + sx * 4.4, tf.sy + 8.2], [tf.cx + sx * .9, tf.sy + 7.6]]) }); }
      if (m === "fdelt") { const U = get("ua").L; out.push({ d: lens(U, 1, .0, .4, -.1, [.25, .7]), L: U }); }
      if (m === "tri") { const U = get("ua").L; out.push({ d: lens(U, -1, .12, .86, .05, [.6, .6]), L: U }); }
      if (m === "hams" && J.side) { const T = get("thigh").L; out.push({ d: lens(T, -1, .12, .9, -.1, [.6, .5]), L: T }); }
      if (m === "calf" && J.side) { const T = get("shin").L; out.push({ d: lens(T, -1, .06, .62, -.2, [.4, .8]), L: T }); }
      if (m === "bic" && J.side) { const U = get("ua").L; out.push({ d: lens(U, 1, .14, .86, .0, [.6, .6]), L: U }); }
      if (m === "back" && torso) { const T = torso.L; out.push({ d: lens(T, -1, .42, .92, .1, [.6, .5]), L: T }); }
      if (m === "abs" && torso) { const T = torso.L; out.push({ d: lens(T, 1, .2, .52, .1, [.5, .5]), L: T }); }
      if (m === "fore") for (const p of parts.filter(p => p.k === "fa" && (!J.side || !p.far))) out.push({ d: slice(p.L, .04, .62, -.35), L: p.L });
      // Framifrån täcker lårmusklerna och vaderna hela kroppsdelens bredd
      if (!J.side && (m === "quad" || m === "hams")) for (const p of parts.filter(p => p.k === "thigh")) out.push({ d: slice(p.L, .08, .9, -.45), L: p.L });
      if (!J.side && m === "calf") for (const p of parts.filter(p => p.k === "shin")) out.push({ d: slice(p.L, .08, .6, -.4), L: p.L });
      if (!J.side && m === "bic") for (const p of parts.filter(p => p.k === "ua")) out.push({ d: slice(p.L, .14, .86, -.4), L: p.L });
      if (!J.side && m === "abs") { const tf = parts.find(p => p.k === "torsoF");
        out.push({ d: smooth([[tf.cx - 3.6, tf.sy + 11], [tf.cx + 3.6, tf.sy + 11], [tf.cx + 3.4, tf.hy - 3], [tf.cx, tf.hy - 1.6], [tf.cx - 3.4, tf.hy - 3]]) }); }
      if (m === "delt") for (const p of parts.filter(p => p.k === "ua")) {
        // Sidan av axeln: täcker hela överarmens topp, rundad vid axeln, avsmalnande nedåt
        const U = p.L, O = [], I = [];
        for (let i = 0; i < 8; i++) {
          const s = i / 7, t = .02 + .36 * s, w = Math.pow(Math.cos(Math.PI / 2 * s), .55);
          const f = edgeF(U, t) * .94, b = -edgeB(U, t) * .94, c = (f + b) / 2;
          O.push(at(U, t, c + (f - c) * w)); I.push(at(U, t, c + (b - c) * w));
        }
        const top = at(U, -.07, (edgeF(U, 0) - edgeB(U, 0)) / 2);
        out.push({ d: smooth([top, ...O, ...I.reverse()]), L: U });
      }
    }
    return out;
  }

  function chains(parts, J) {
    const pick = (ks, far) => parts.filter(p => ks.includes(p.k) && p.far === far);
    const LEG = ["thigh", "shin", "foot"], ARM = ["ua", "fa", "hand"], CORE = ["torso", "torsoF", "neck", "head"];
    if (J.side) return [
      { far: true, items: pick(LEG, true) }, { far: true, items: pick(ARM, true) },
      { far: false, items: pick(CORE, false) }, { far: false, items: pick(LEG, false) }, { far: false, items: pick(ARM, false) }];
    // Framifrån: båda benen, bålen och sedan armarna var för sig
    const legs = parts.filter(p => LEG.includes(p.k)), arms = parts.filter(p => ARM.includes(p.k));
    return [{ far: false, items: legs }, { far: false, items: pick(CORE, false) },
      { far: false, items: arms.slice(0, 3) }, { far: false, items: arms.slice(3) }];
  }

  // Bålen framifrån saknar mittlinje, så den får en egen lem från höft till axlar

  // Från figurens leder (sideJoints/frontJoints ovan) till formatet som kroppsformerna byggs av
  function toJ(J, front) {
    const o = { side: !front, head: J.head, H: J.torso[0], S: J.torso[1], neckTop: J.torso[2], arm: J.arm, arm2: J.arm2, leg: J.leg, leg2: J.leg2 };
    if (front) { o.shoulders = J.shoulders; o.hips = J.hips; }
    return o;
  }
  // Leder i läget k (0 = start, 1 = slut). Byter armbåge eller knä böjriktning mellan lägena glider
  // den leden rakt mellan start och slut, som tidigare, i stället för att slå över i ett ryck.
  function jointsAt(ex, k) {
    const front = ex.view === "front", J0 = front ? frontJoints : sideJoints;
    let A = ex.A, B = ex.B || ex.A;
    // Finns andra handen eller foten bara i ena läget utgår den från samma ställe som den första
    for (const [two, one] of [["a2", "a"], ["f2", "f"]]) {
      if (A[two] && !B[two]) B = Object.assign({}, B, { [two]: B[one] });
      if (B[two] && !A[two]) A = Object.assign({}, A, { [two]: A[one] });
    }
    const J = J0(lerpPose(A, B, k, front));
    if (B !== A && k > 0 && k < 1) {
      const JA = J0(A), JB = J0(B);
      // Böjriktningen med samma standardvärden som sideJoints och frontJoints använder
      const bend = (p, key) => {
        const eb = p.eb ?? (front ? -1 : 1), kb = p.kb ?? -1;
        return { eb, kb, eb2: p.eb2 ?? eb, kb2: p.kb2 ?? kb }[key];
      };
      for (const [key, limbKey] of [["eb", "arm"], ["eb2", "arm2"], ["kb", "leg"], ["kb2", "leg2"]]) {
        if (bend(A, key) !== bend(B, key) && JA[limbKey] && JB[limbKey]) J[limbKey] = J[limbKey].map((q, i) => i === 1 ? lerpP(JA[limbKey][1], JB[limbKey][1], k) : q);
      }
    }
    return toJ(J, front);
  }
  const hotOf = ex => (ex.prim || []).map(m => MUSCLE_OF[m]).filter(Boolean)
    .map(m => m === "delt" && ex.view !== "front" ? "fdelt" : m);

  // Allt som ritas i ett läge, i ritordning, som platta element med sina geometrier.
  // Samma övning ger alltid samma lista, så varje element kan animeras mellan lägena.
  function frame(ex, k, hot) {
    const J = jointsAt(ex, k), parts = buildBody(J), mx = Object.assign({}, ex, { hot });
    const el = [];
    const P = (d, attrs) => el.push({ t: "path", d, attrs });
    const C = (c, r, attrs) => el.push({ t: "circle", c, r, attrs });
    const Ln = (a, b, attrs) => el.push({ t: "line", a, b, attrs });
    // Kroppsdelarna, i den ordning höjdkurvorna och kedjorna refererar till dem
    const shapes = parts.map(p => p.k === "head" ? { t: "circle", c: p.c, r: 5.3 } : p.k === "hand" ? { t: "circle", c: p.c, r: p.r }
      : { t: "path", pts: p.L ? p.L.pts : p.pts });
    const equip = [], front = [];
    const plateR = ex.hold === "bar" ? 7 : 3.7;
    const plate = (c, list) => list.push({ t: "plate", c, r: plateR });
    if (ex.hold === "bar" && ex.view === "front") {
      const h = J.arm[2], h2 = J.arm2[2];
      front.push({ t: "line", a: add(h2, [-9, 0]), b: add(h, [9, 0]), attrs: `stroke="var(--equip-hi)" stroke-width="2.2" stroke-linecap="round"` });
      for (const [p, s] of [[h2, -9], [h, 9]]) front.push({ t: "line", a: add(p, [s, -4.6]), b: add(p, [s, 4.6]), attrs: `stroke="var(--equip-hi)" stroke-width="3.4" stroke-linecap="round"` });
    } else if (ex.hold === "bar") plate(J.arm[2], equip);
    if (ex.hold === "db") {
      const h = J.arm[2], h2 = J.arm2[2], two = !!(ex.A.a2 || (ex.B && ex.B.a2));
      if (J.side) { if (two) plate(h2, equip); plate(h, front); } else { plate(h, front); plate(h2, front); }
    }
    if (ex.cable) {
      const c = ex.cable, h = J.arm[2];
      equip.push({ t: "path", d: `M${P2([c[0] - 4, c[1] - 4])}h8v8h-8Z`, attrs: `fill="var(--equip)"` });
      equip.push({ t: "line", a: c, b: h, attrs: `stroke="var(--equip-hi)" stroke-width="1"` });
      front.push({ t: "circle", c: h, r: 2.2, attrs: `fill="var(--equip-hi)"` });
    }
    if (ex.plate) { const p = J.leg[3], v = ex.plate; equip.push({ t: "line", a: add(p, v, -1), b: add(p, v), attrs: `stroke="var(--equip-hi)" stroke-width="2.6" stroke-linecap="round"` }); }
    if (ex.pad) front.push({ t: "circle", c: J.leg[2], r: 3.2, attrs: `fill="var(--equip-hi)"` });
    // Musklerna: kroppens efter närmre benet, armens efter närmre armen
    const ch = chains(parts, J).map(c => ({ far: c.far && J.side, idx: c.items.map(p => parts.indexOf(p)),
      arm: c.items.some(p => p.k === "ua"), leg: c.items.some(p => p.k === "thigh") }));
    const musc = {};
    if (J.side) {
      musc.leg = muscleShapes(mx, parts, J, ["quad", "glute", "chest", "hams", "calf", "back", "abs"]).map(m => m.d);
      musc.arm = muscleShapes(mx, parts, J, ["tri", "fdelt", "bic", "fore"]).map(m => m.d);
    } else musc.all = muscleShapes(mx, parts, J).map(m => m.d);
    return { J, shapes, equip, front, ch, musc };
  }

  const pathOf = s => s.t === "circle" ? circleD(s.c, s.r) : s.d;
  // Riktning för en sluten form: positiv yta = medurs på skärmen, samma håll som cirklarna ritas
  const area = P => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return a; };
  // En cirkel som stig med fast antal kommandon, så den kan animeras som de andra formerna
  const circleD = (c, r) => `M${P2([c[0] + r, c[1]])}A${n1(r)} ${n1(r)} 0 1 1 ${P2([c[0] - r, c[1]])}A${n1(r)} ${n1(r)} 0 1 1 ${P2([c[0] + r, c[1]])}Z`;

  // Ytterkanterna för alla lägen, så att varje övning beskärs efter sin egen storlek
  function bounds(frames, ex) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const grow = (x, y, m = 0) => { x0 = Math.min(x0, x - m); x1 = Math.max(x1, x + m); y0 = Math.min(y0, y - m); y1 = Math.max(y1, y + m); };
    const pad = RINGS[0][0] / 2 + .6;
    for (const f of frames) {
      for (const s of f.shapes) {
        if (s.t === "circle") grow(s.c[0], s.c[1], s.r + pad);
        else for (const q of s.pts) grow(q[0], q[1], pad);
      }
      for (const e of [...f.equip, ...f.front]) {
        if (e.t === "plate" || e.t === "circle") grow(e.c[0], e.c[1], e.r + 1);
        else if (e.t === "line") { grow(e.a[0], e.a[1], 2); grow(e.b[0], e.b[1], 2); }
        else if (e.t === "path") { const n = e.d.match(/-?\d*\.?\d+/g) || []; grow(+n[0], +n[1], 9); }
      }
    }
    for (const [kind, ...v] of ex.scene || []) {
      if (kind === "rect") { grow(v[0], v[1], 1); grow(v[0] + v[2], v[1] + v[3], 1); } else { grow(v[0], v[1], 2); grow(v[2], v[3], 2); }
    }
    grow(x0, FLOOR + 3.5);
    // Små lägen förstoras inte orimligt mycket
    const w = x1 - x0, h = y1 - y0, minS = 62;
    if (w < minS) { x0 -= (minS - w) / 2; x1 += (minS - w) / 2; }
    if (h < minS) { y0 -= (minS - h); }
    return [x0, y0, x1 - x0, y1 - y0].map(n1);
  }

  // Ett attribut som står still eller glider mellan lägena
  const DURS = `dur="${DUR}s" repeatCount="indefinite" calcMode="linear"`;
  const val = (name, list) => {
    const a = list.map(String);
    return a.every(v => v === a[0]) ? `${name}="${a[0]}"` : `${name}="${a[0]}"`;
  };
  const anims = (name, list) => {
    const a = list.map(String);
    return a.length > 1 && a.some(v => v !== a[0]) ? `<animate attributeName="${name}" values="${a.join(";")}" ${DURS}/>` : "";
  };
  function element(tag, geo, attrs, id) {
    // geo: { namn: [värde per läge] }
    const open = Object.entries(geo).map(([k, v]) => val(k, v)).join(" ");
    const inner = Object.entries(geo).map(([k, v]) => anims(k, v)).join("");
    return `<${tag}${id ? ` id="${id}"` : ""} ${open} ${attrs || ""}>${inner}</${tag}>`;
  }
  const geoOf = list => {
    const s = list[0];
    if (s.t === "line") return ["line", { x1: list.map(e => n1(e.a[0])), y1: list.map(e => n1(e.a[1])), x2: list.map(e => n1(e.b[0])), y2: list.map(e => n1(e.b[1])) }];
    if (s.t === "circle") return ["circle", { cx: list.map(e => n1(e.c[0])), cy: list.map(e => n1(e.c[1])), r: list.map(e => n1(e.r)) }];
    return ["path", { d: list.map(pathOf) }];
  };
  const drawList = (lists, extra) => lists.map(list => {
    const s = list[0];
    if (s.t === "plate") {
      const c = { cx: list.map(e => n1(e.c[0])), cy: list.map(e => n1(e.c[1])) }, r = s.r;
      return element("circle", c, `r="${n1(r)}" fill="var(--equip-hi)"`) + element("circle", c, `r="${n1(r * .72)}" fill="none" stroke="var(--figbg, var(--bg))" stroke-width=".7"`) +
        element("circle", c, `r="${n1(r * .42)}" fill="none" stroke="var(--figbg, var(--bg))" stroke-width=".6"`) + element("circle", c, `r="${n1(r * .15)}" fill="var(--figbg, var(--bg))"`);
    }
    const [tag, geo] = geoOf(list);
    return element(tag, geo, s.attrs || extra || "");
  }).join("");
  // Lista per element över alla lägen
  const across = (frames, pick) => { const first = pick(frames[0]); return first.map((_, i) => frames.map(f => pick(f)[i])); };

  // Stilla bilder blir alltid likadana för en övning, så de byggs bara en gång
  const cache = new Map();
  // ---------- Rätt håll på kroppen ----------
  // Figuren ritas alltid som om den tittar åt höger: framsidan (bröst, knäskålar, tår) räknas fram ur det.
  // En pose som egentligen tittar åt vänster (t.ex. ligger på rygg med huvudet åt höger) skulle då ritas
  // som om den låg på mage, med knän och armbågar som böjer åt fel håll. Sådana övningar speglas, och en
  // enskild led som ändå böjer fel vänds. Knät böjer så att hälen går bakåt, armbågen så att handen går framåt.
  const BEND_T = .3;   // en led räknas som tydligt böjd över ungefär 17 grader
  const bendOf = (a, b, c) => { const u = sub(b, a), v = sub(c, b); return (u[0] * v[1] - u[1] * v[0]) / ((Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1])) || 1); };
  // Positivt = böjer rätt för en figur som tittar åt höger
  function limbBends(p) {
    const J = sideJoints(p);
    return { kb: bendOf(...J.leg.slice(0, 3)), kb2: bendOf(...J.leg2.slice(0, 3)), eb: -bendOf(...J.arm), eb2: -bendOf(...J.arm2) };
  }
  const mirrorPt = q => [100 - q[0], q[1]];
  function mirrorPose(p) {
    const o = Object.assign({}, p);
    for (const k of ["h", "s", "a", "a2", "f", "f2"]) if (p[k]) o[k] = mirrorPt(p[k]);
    if (typeof p.t === "number") o.t = -p.t;
    const kb = p.kb ?? -1, eb = p.eb ?? 1;
    o.kb = -kb; o.eb = -eb; o.kb2 = -(p.kb2 ?? kb); o.eb2 = -(p.eb2 ?? eb);
    return o;
  }
  function mirrorEx(ex) {
    const o = Object.assign({}, ex, { A: mirrorPose(ex.A) });
    if (ex.B) o.B = mirrorPose(ex.B);
    if (ex.cable) o.cable = mirrorPt(ex.cable);
    if (ex.plate) o.plate = [-ex.plate[0], ex.plate[1]];
    if (ex.scene) o.scene = ex.scene.map(([kind, ...v]) => kind === "rect" ? [kind, 100 - v[0] - v[2], v[1], v[2], v[3]] : [kind, 100 - v[0], v[1], 100 - v[2], v[3]]);
    return o;
  }
  // Knän som tydligt böjer bakåt vänds alltid (ett knä kan inte det); armbågar bara när hela figuren speglats
  function fixLimbs(p, arms) {
    const b = limbBends(p), o = Object.assign({}, p);
    const kb = p.kb ?? -1, eb = p.eb ?? 1, kb2 = p.kb2 ?? kb, eb2 = p.eb2 ?? eb;
    o.kb = b.kb < -BEND_T ? -kb : kb; o.kb2 = b.kb2 < -BEND_T ? -kb2 : kb2;
    o.eb = arms && b.eb < -BEND_T ? -eb : eb; o.eb2 = arms && b.eb2 < -BEND_T ? -eb2 : eb2;
    return o;
  }
  const facedCache = new Map();
  function faced(ex) {
    if (ex.view === "front" || globalThis.FIG_RAW) return ex;
    if (facedCache.has(ex)) return facedCache.get(ex);
    // Böjer det närmre knät tydligt bakåt i alla lägen där det är böjt, tittar figuren egentligen åt vänster
    const knees = [ex.A, ex.B].filter(Boolean).map(p => limbBends(p).kb).filter(v => Math.abs(v) > BEND_T);
    const mirror = knees.length > 0 && knees.every(v => v < 0);
    let out = mirror ? mirrorEx(ex) : ex;
    out = Object.assign({}, out, { A: fixLimbs(out.A, mirror) });
    if (ex.B) out.B = fixLimbs(out.B, mirror);
    facedCache.set(ex, out);
    return out;
  }
  function figure(id, cls = "", animate = false) {
    const ex = EX[id] && EX[id].A ? faced(EX[id]) : EX[id];
    if (!ex || !ex.A) return "";
    const still = !ex.B || REDUCED || !animate;
    const key = id + "|" + cls;
    if (still && cache.has(key)) return cache.get(key);
    const out = draw(ex, cls, still);
    if (still) cache.set(key, out);
    return out;
  }
  function draw(ex, cls, still) {
    const hot = hotOf(ex);
    const ks = still ? [0] : Array.from({ length: N_FRAMES + 1 }, (_, i) => (1 - Math.cos(2 * Math.PI * i / N_FRAMES)) / 2);
    const frames = ks.map(k => frame(ex, k, hot));
    const f0 = frames[0], uid = "fg" + (uidN++);
    const vb = bounds(frames, ex);
    const box = `x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}"`;
    // Alla kroppsdelar vänds åt samma håll och slås ihop till en form, så att överlapp inte blir hål.
    // Hela kroppen och varje kedja definieras en gång och återanvänds av höjdkurvorna, konturen och fyllningen.
    const rev = f0.shapes.map(sh => sh.pts ? area(sh.pts) < 0 : false);
    const partOf = (sh, i) => sh.t === "circle" ? circleD(sh.c, sh.r) : rev[i] ? smooth(sh.pts.slice().reverse()) : smooth(sh.pts);
    const joined = idx => frames.map(f => idx.map(i => partOf(f.shapes[i], i)).join(""));
    let defs = "";
    f0.ch.forEach((c, ci) => { defs += element("path", { d: joined(c.idx) }, "", `${uid}c${ci}`); });
    defs += element("path", { d: joined(f0.shapes.map((_, i) => i)) }, "", `${uid}b`);
    let s = `<svg class="fig ${cls}" viewBox="${vb.join(" ")}" role="img" aria-label="${ex.name}"><defs>${defs}</defs>`;
    s += `<line class="ffloor" x1="${vb[0]}" y1="${FLOOR + 2.5}" x2="${n1(+vb[0] + +vb[2])}" y2="${FLOOR + 2.5}"/>`;
    // Höjdkurvorna: kroppen ritas bred i kurvans färg och sedan lite smalare i bakgrundens färg, från yttersta kurvan och inåt
    s += `<g stroke-linejoin="round">` + RINGS.map(([wo, wi, col]) => `<use href="#${uid}b" fill="var(${col})" stroke="var(${col})" stroke-width="${wo}"/>` +
      `<use href="#${uid}b" fill="var(--figbg, var(--bg))" stroke="var(--figbg, var(--bg))" stroke-width="${wi}"/>`).join("") + `</g>`;
    s += (ex.scene || []).map(([kind, ...v]) => kind === "rect"
      ? `<rect x="${v[0]}" y="${v[1] - .5}" width="${v[2]}" height="${v[3] + 1}" rx="1.8" fill="var(--equip)"/>`
      : `<line x1="${v[0]}" y1="${v[1]}" x2="${v[2]}" y2="${v[3]}" stroke="var(--equip)" stroke-width="${kind === "bar" ? 3.2 : 2.4}" stroke-linecap="round"/>`).join("");
    s += drawList(across(frames, f => f.equip));
    const muscles = key => across(frames, f => f.musc[key] || []).map(list => element("path", { d: list }, `fill="var(--accent)"`)).join("");
    f0.ch.forEach((c, ci) => {
      s += `<use href="#${uid}c${ci}" fill="none" stroke="var(--figbg, var(--bg))" stroke-width="1.1" stroke-linejoin="round"/>` +
        `<use href="#${uid}c${ci}" fill="var(${c.far ? "--fig-far" : "--text"})"/>`;
      if (f0.J.side && !c.far && c.leg) s += muscles("leg");
      if (f0.J.side && !c.far && c.arm) s += muscles("arm");
    });
    if (!f0.J.side) s += muscles("all");
    s += drawList(across(frames, f => f.front));
    return s + "</svg>";
  }
  globalThis.figure = figure;
  globalThis.figureJoints = jointsAt;
})();

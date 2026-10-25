"use strict";

// ---------- Upplägg ----------
const WD = ["Mån", "Tis", "Ons", "Tors", "Fre", "Lör", "Sön"];
// Passtyper: rubrik, muskler, övningskategorier i väljaren och färg på etiketten
const TYPES = {
  push: { label: "Push", muscles: "Bröst, axlar, triceps", cats: ["push"] },
  pull: { label: "Pull", muscles: "Rygg, baksida axlar, biceps", cats: ["pull"] },
  legs: { label: "Legs", muscles: "Lår, säte, vader", cats: ["legs"] },
  upper: { label: "Överkropp", muscles: "Bröst, rygg, axlar, armar", cats: ["push", "pull"] },
  lower: { label: "Underkropp", muscles: "Lår, säte, vader", cats: ["legs"] },
  full: { label: "Helkropp", muscles: "Hela kroppen", cats: ["legs", "push", "pull"] },
  cpush: { label: "Push", color: "push", muscles: "Bröst, axlar, triceps med kroppsvikt", cats: ["bw"] },
  cpull: { label: "Pull", color: "pull", muscles: "Rygg, biceps, grepp med kroppsvikt", cats: ["bw"] },
  clegs: { label: "Ben & bål", color: "legs", muscles: "Ben, säte och bål med kroppsvikt", cats: ["bw"] },
  cfull: { label: "Helkropp", color: "full", muscles: "Hela kroppen med kroppsvikt", cats: ["bw"] },
  chest: { label: "Bröst", color: "push", muscles: "Bröst, triceps", cats: ["push"] },
  back: { label: "Rygg", color: "pull", muscles: "Rygg, biceps", cats: ["pull"] },
  shoulders: { label: "Axlar", color: "upper", muscles: "Axlar, armar", cats: ["push", "pull"] },
  arms: { label: "Armar", color: "lower", muscles: "Biceps, triceps, underarmar", cats: ["pull", "push"] },
  str5a: { label: "Styrka A", fixedName: true, color: "full", muscles: "Knäböj, bänkpress, rodd", cats: ["legs", "push", "pull"] },
  str5b: { label: "Styrka B", fixedName: true, color: "full", muscles: "Knäböj, militärpress, marklyft", cats: ["legs", "push", "pull"] },
  sq: { label: "Knäböj", color: "legs", muscles: "Knäböj och ben", cats: ["legs"] },
  bp: { label: "Bänkpress", color: "push", muscles: "Bänkpress, bröst, triceps", cats: ["push"] },
  dl: { label: "Marklyft", color: "pull", muscles: "Marklyft, rygg, baksida", cats: ["pull", "legs"] },
  chestback: { label: "Bröst & rygg", color: "push", muscles: "Bröst, rygg", cats: ["push", "pull"] },
  shoulderarms: { label: "Axlar & armar", color: "upper", muscles: "Axlar, biceps, triceps", cats: ["push", "pull"] },
  hfull: { label: "Hantlar", color: "full", muscles: "Hela kroppen med hantlar", cats: ["push", "pull", "legs"] },
  glutes: { label: "Rumpa", color: "lower", muscles: "Säte, baksida lår", cats: ["legs"] },
  custom: { label: "Pass", color: "full", muscles: "Dina egna övningar", cats: ["all"] },
};
// Program: vilka passtyper som ingår för varje antal pass i veckan
const PROGRAMS = {
  ppl: { name: "Push / Pull / Legs", info: "Tre olika pass som roterar. Klassiskt för att bygga muskler.", days: {
    3: ["push", "pull", "legs"], 4: ["push", "pull", "legs", "upper"],
    5: ["push", "pull", "legs", "upper", "lower"], 6: ["push", "pull", "legs", "push", "pull", "legs"] } },
  helkropp: { name: "Helkropp", info: "Hela kroppen varje pass. Bra när du tränar få dagar.", days: {
    2: ["full", "full"], 3: ["full", "full", "full"], 4: ["full", "full", "full", "full"] } },
  overunder: { name: "Över/Underkropp", info: "Överkropp och underkropp varannan gång.", days: {
    2: ["upper", "lower"], 3: ["upper", "lower", "upper"], 4: ["upper", "lower", "upper", "lower"] } },
  cali: { name: "Calisthenics", info: "Bara kroppsvikt: golvet, en stång och en bänk räcker.", days: {
    3: ["cpush", "cpull", "clegs"], 4: ["cpush", "cpull", "clegs", "cfull"],
    5: ["cpush", "cpull", "clegs", "cpush", "cpull"], 6: ["cpush", "cpull", "clegs", "cpush", "cpull", "clegs"] } },
  split: { name: "Kroppsdelssplit", info: "En muskelgrupp per pass.", days: {
    4: ["chest", "back", "legs", "shoulders"], 5: ["chest", "back", "legs", "shoulders", "arms"] } },
  arnold: { name: "Arnold split", info: "Bröst och rygg, axlar och armar, ben. Mycket volym.", days: {
    3: ["chestback", "shoulderarms", "legs"], 6: ["chestback", "shoulderarms", "legs", "chestback", "shoulderarms", "legs"] } },
  styrka5x5: { name: "Styrka 5×5", info: "Få basövningar med tunga set om 5. Enkelt sätt att bli starkare.", days: {
    3: ["str5a", "str5b", "str5a"] } },
  styrkelyft: { name: "Styrkelyft", info: "Knäböj, bänkpress och marklyft i fokus, med hjälpövningar.", days: {
    3: ["sq", "bp", "dl"], 4: ["sq", "bp", "dl", "upper"] } },
  hantlar: { name: "Hemma med hantlar", info: "Helkropp med bara hantlar och en bänk.", days: {
    2: ["hfull", "hfull"], 3: ["hfull", "hfull", "hfull"], 4: ["hfull", "hfull", "hfull", "hfull"] } },
  rumpa: { name: "Rumpa & ben", info: "Extra fokus på säte och baksida lår, plus ett överkroppspass.", days: {
    3: ["glutes", "upper", "lower"], 4: ["glutes", "upper", "glutes", "lower"] } },
  eget: { name: "Eget upplägg", info: "Bygg helt själv: välj antal pass, döp dem och lägg till dina egna övningar.", days: {
    1: ["custom"], 2: ["custom", "custom"], 3: ["custom", "custom", "custom"], 4: ["custom", "custom", "custom", "custom"],
    5: ["custom", "custom", "custom", "custom", "custom"], 6: ["custom", "custom", "custom", "custom", "custom", "custom"] } },
};
// Alla upplägg går att köra 1–7 pass i veckan. Utöver det upplägget är tänkt för fylls det på med passtyper som passar.
const EXTRA_DAYS = {
  ppl: { 1: ["full"], 2: ["upper", "lower"], 7: ["push", "pull", "legs", "upper", "push", "pull", "legs"] },
  helkropp: { 1: ["full"], 5: Array(5).fill("full"), 6: Array(6).fill("full"), 7: Array(7).fill("full") },
  overunder: { 1: ["full"], 5: ["upper", "lower", "upper", "lower", "upper"], 6: ["upper", "lower", "upper", "lower", "upper", "lower"],
    7: ["upper", "lower", "upper", "lower", "upper", "lower", "full"] },
  cali: { 1: ["cfull"], 2: ["cfull", "cfull"], 7: ["cpush", "cpull", "clegs", "cfull", "cpush", "cpull", "clegs"] },
  split: { 1: ["full"], 2: ["upper", "lower"], 3: ["chestback", "shoulderarms", "legs"],
    6: ["chest", "back", "legs", "shoulders", "arms", "legs"], 7: ["chest", "back", "legs", "shoulders", "arms", "legs", "full"] },
  arnold: { 1: ["full"], 2: ["upper", "lower"], 4: ["chestback", "shoulderarms", "legs", "chestback"],
    5: ["chestback", "shoulderarms", "legs", "chestback", "shoulderarms"],
    7: ["chestback", "shoulderarms", "legs", "chestback", "shoulderarms", "legs", "full"] },
  styrka5x5: { 1: ["str5a"], 2: ["str5a", "str5b"], 4: ["str5a", "str5b", "str5a", "str5b"], 5: ["str5a", "str5b", "str5a", "str5b", "str5a"],
    6: ["str5a", "str5b", "str5a", "str5b", "str5a", "str5b"], 7: ["str5a", "str5b", "str5a", "str5b", "str5a", "str5b", "str5a"] },
  styrkelyft: { 1: ["str5a"], 2: ["str5a", "str5b"], 5: ["sq", "bp", "dl", "upper", "lower"], 6: ["sq", "bp", "dl", "sq", "bp", "dl"],
    7: ["sq", "bp", "dl", "upper", "sq", "bp", "dl"] },
  hantlar: { 1: ["hfull"], 5: Array(5).fill("hfull"), 6: Array(6).fill("hfull"), 7: Array(7).fill("hfull") },
  rumpa: { 1: ["glutes"], 2: ["glutes", "upper"], 5: ["glutes", "upper", "lower", "glutes", "upper"],
    6: ["glutes", "upper", "lower", "glutes", "upper", "lower"], 7: ["glutes", "upper", "lower", "glutes", "upper", "lower", "glutes"] },
  eget: { 7: Array(7).fill("custom") },
};
for (const [id, pr] of Object.entries(PROGRAMS)) {
  // Det antal pass upplägget är gjort för, t.ex. "3–6" eller "3 eller 6"
  const n = pr.fit = Object.keys(pr.days).map(Number);
  pr.best = n.length === 1 ? `${n[0]}` : n[n.length - 1] - n[0] === n.length - 1 ? `${n[0]}–${n[n.length - 1]}` : n.join(" eller ");
  Object.assign(pr.days, EXTRA_DAYS[id]);
}
const DEFAULT_WEEKDAYS = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
const counts = prog => Object.keys(PROGRAMS[prog].days).map(Number);

// Standardövningar per passtyp; typ2/typ3 används när samma typ återkommer i veckan
const DEFAULT_EX = {
  push: ["bankpress", "lutande_hantelpress", "militarpress", "sidolyft", "dips", "triceps_pushdown"],
  push2: ["sittande_axelpress", "hantelpress", "armhavningar", "sidolyft", "fransk_press"],
  pull: ["marklyft", "chins", "skivstangsrodd", "kabelrodd", "face_pulls", "bicepscurl"],
  pull2: ["latsdrag", "hantelrodd", "face_pulls", "hammercurl"],
  legs: ["knaboj", "rumansk_marklyft", "benpress", "bencurl", "utfall", "vadpress"],
  legs2: ["benpress", "hip_thrust", "benspark", "bencurl", "vadpress"],
  upper: ["bankpress", "skivstangsrodd", "sittande_axelpress", "latsdrag", "bicepscurl", "triceps_pushdown"],
  upper2: ["lutande_hantelpress", "chins", "militarpress", "kabelrodd", "hammercurl", "fransk_press"],
  lower: ["knaboj", "hip_thrust", "benspark", "bencurl", "vadpress"],
  lower2: ["marklyft", "benpress", "utfall", "bencurl", "vadpress"],
  full: ["knaboj", "bankpress", "skivstangsrodd", "militarpress", "rumansk_marklyft"],
  full2: ["marklyft", "lutande_hantelpress", "chins", "utfall", "sidolyft"],
  full3: ["benpress", "hantelpress", "latsdrag", "hip_thrust", "face_pulls"],
  cpush: ["armhavningar", "dips", "pike_pushups", "diamant_armhavningar", "plankan"],
  cpush2: ["pike_pushups", "dips", "armhavningar", "l_sit"],
  cpull: ["pullups", "australiensisk_rodd", "chins", "hangande_benlyft"],
  cpull2: ["chins", "australiensisk_rodd", "pullups", "hollow_hold"],
  clegs: ["bulgarisk", "pistol", "hoppknaboj", "glute_bridge", "hollow_hold"],
  cfull: ["burpees", "pullups", "dips", "bulgarisk", "l_sit"],
  chest: ["bankpress", "lutande_hantelpress", "hantelpress", "dips", "triceps_pushdown", "fransk_press"],
  back: ["marklyft", "chins", "skivstangsrodd", "latsdrag", "kabelrodd", "bicepscurl"],
  shoulders: ["militarpress", "sittande_axelpress", "sidolyft", "face_pulls", "bicepscurl", "triceps_pushdown"],
  arms: ["bicepscurl", "hammercurl", "triceps_pushdown", "fransk_press", "dips"],
  // id@SxR ger egna set × reps
  str5a: ["knaboj@5x5", "bankpress@5x5", "skivstangsrodd@5x5"],
  str5b: ["knaboj@5x5", "militarpress@5x5", "marklyft@1x5"],
  sq: ["knaboj@5x3", "benpress", "utfall", "plankan"],
  bp: ["bankpress@5x3", "lutande_hantelpress", "dips", "triceps_pushdown", "face_pulls"],
  dl: ["marklyft@5x3", "rumansk_marklyft", "chins", "skivstangsrodd", "hangande_benlyft"],
  chestback: ["bankpress", "skivstangsrodd", "lutande_hantelpress", "chins", "dips", "kabelrodd"],
  chestback2: ["hantelpress", "latsdrag", "armhavningar", "hantelrodd", "face_pulls"],
  shoulderarms: ["militarpress", "sidolyft", "face_pulls", "bicepscurl", "fransk_press", "hammercurl"],
  shoulderarms2: ["sittande_axelpress", "sidolyft", "hammercurl", "triceps_pushdown", "bicepscurl"],
  hfull: ["hantelpress", "hantelrodd", "utfall", "sittande_axelpress", "hammercurl", "glute_bridge"],
  hfull2: ["lutande_hantelpress", "hantelrodd", "bulgarisk", "sidolyft", "fransk_press", "armhavningar"],
  hfull3: ["utfall", "armhavningar", "hantelrodd", "sittande_axelpress", "glute_bridge", "hammercurl"],
  glutes: ["hip_thrust", "rumansk_marklyft", "bulgarisk", "utfall", "glute_bridge", "bencurl"],
  glutes2: ["hip_thrust", "knaboj", "bencurl", "bulgarisk", "glute_bridge"],
  custom: [],
};
// Dailys: övningar, löpning eller promenad som bockas av varje dag
const DEFAULT_DAILY = ["plankan", "hangande_benlyft", "russian_twist", "lop"];
const isRun = id => id === "lop";

// ---------- Kost ----------
// Måltid och andel av dagens kalorier
const MEALS = [["Frukost", 0.25], ["Lunch", 0.30], ["Mellanmål", 0.15], ["Middag", 0.30]];
const ACTIVITY = [
  [1.2, "Stillasittande"], [1.375, "Lätt aktiv (1–3 pass/v)"],
  [1.55, "Aktiv (3–5 pass/v)"], [1.725, "Mycket aktiv (6–7 pass/v)"],
];
const GOALS = { cut: ["Gå ner (−400 kcal)", -400], keep: ["Behålla", 0], bulk: ["Bygga (+250 kcal)", 250] };

// ---------- Lagring ----------
const KEY = "ppl-traning-v2";
const KEY_V1 = "ppl-traning-v1";

function exEntry(spec) {
  const [id, sr] = spec.split("@");
  const e = { id, sets: EX[id].sets, reps: EX[id].reps };
  if (sr) { const [sets, reps] = sr.split("x"); e.sets = +sets; e.reps = reps; }
  return e;
}

// Behåller ett befintligt pass på samma plats om typen är densamma, så att egna övningar finns kvar
function makeDays(prog, count, old = []) {
  const types = PROGRAMS[prog].days[count];
  const seen = {};
  return types.map((type, i) => {
    const round = seen[type] = (seen[type] || 0) + 1;
    const repeated = !TYPES[type].fixedName && types.filter(t => t === type).length > 1;
    const name = TYPES[type].label + (repeated ? " " + "ABCDEFG"[(round - 1) % 7] : "");
    const prev = old[i];
    // Ett pass man själv döpt behåller sitt namn
    if (prev && prev.type === type) return prev.named ? prev : { ...prev, name };
    const list = DEFAULT_EX[round > 1 && DEFAULT_EX[type + round] ? type + round : type];
    return { id: `d${i + 1}-${type}-${Date.now().toString(36)}`, type, name, ex: list.map(exEntry) };
  });
}

function freshState() {
  return {
    v: 2, setupDone: false,
    profile: { sex: "m", age: 30, height: 180, weight: 80, activity: 1.55, goal: "keep" },
    kcalOverride: null,
    meals: [],
    weights: {},           // datum → kg
    learned: {},           // rätter som Claude räknat ut, så att de känns igen nästa gång
    plan: { program: "ppl", count: 3, mode: "flex", weekdays: DEFAULT_WEEKDAYS[3].slice(), days: makeDays("ppl", 3) },
    daily: DEFAULT_DAILY.map(exEntry),
    log: {},
  };
}

// v1 hade fasta id:n (push0 …) och dagnamn som typ. Övningarna matchas på namn.
const V1_NAMES = {
  "Bänkpress": "bankpress", "Lutande hantelpress": "lutande_hantelpress", "Militärpress": "militarpress",
  "Sidolyft": "sidolyft", "Dips": "dips", "Triceps pushdown": "triceps_pushdown", "Marklyft": "marklyft",
  "Chins / latsdrag": "chins", "Skivstångsrodd": "skivstangsrodd", "Sittande kabelrodd": "kabelrodd",
  "Face pulls": "face_pulls", "Bicepscurl": "bicepscurl", "Knäböj": "knaboj", "Rumänsk marklyft": "rumansk_marklyft",
  "Benpress": "benpress", "Bencurl": "bencurl", "Utfall": "utfall", "Vadpress": "vadpress",
};
function migrateV1(old) {
  const s = freshState();
  if (old.profile) s.profile = old.profile;
  s.kcalOverride = old.kcalOverride || null;
  const idMap = {};
  for (const d in old.program || {}) for (const ex of old.program[d]) if (V1_NAMES[ex.name]) idMap[ex.id] = V1_NAMES[ex.name];
  for (const [date, L] of Object.entries(old.log || {})) {
    const n = { workouts: [], dailies: {}, food: L.food || [] };
    if (L.workout) {
      const d = s.plan.days.find(x => x.type === L.workout.day);
      const w = { dayId: d ? d.id : "d1", done: !!L.workout.done, sets: {} };
      for (const [k, v] of Object.entries(L.workout.sets || {})) if (idMap[k]) w.sets[idMap[k]] = v;
      n.workouts.push(w);
    }
    const od = L.dailies || {};
    if (od.mage) for (const id of ["plankan", "hangande_benlyft", "russian_twist"]) n.dailies[id] = true;
    if (od.lop) n.dailies.lop = od.lop;
    s.log[date] = n;
  }
  return s;
}

// Äldre data hade dailys som mage/lop/steg; nu är de en lista av övningar
function upgradeDailies(s) {
  if (!s.dailies) return s;
  const old = s.dailies, items = [];
  if (old.mage && old.mage.on) items.push(...(old.mage.ex || []));
  if (old.lop && old.lop.on) items.push(exEntry("lop"));
  if (old.steg && old.steg.on) items.push(exEntry("promenad"));
  s.daily = items;
  delete s.dailies;
  for (const L of Object.values(s.log || {})) {
    const d = L.dailies || (L.dailies = {});
    if (d.mage && typeof d.mage === "object") {
      for (const [id, v] of Object.entries(d.mage)) if (v) d[id] = true;
    }
    delete d.mage;
    if (d.steg) d.promenad = true;
    delete d.steg;
  }
  return s;
}

// Tidigare fick en dag bara ha ett pass (workout); nu är det en lista (workouts)
function upgradeWorkouts(s) {
  for (const L of Object.values(s.log || {})) {
    if ("workout" in L) {
      // En äldre version av appen kan ha loggat i det gamla fältet efter uppgraderingen
      const ws = L.workouts || [], w = L.workout;
      if (w) { const i = ws.findIndex(x => x.dayId === w.dayId); if (i >= 0) ws[i] = w; else ws.push(w); }
      L.workouts = ws;
      delete L.workout;
    }
    if (!L.workouts) L.workouts = [];
  }
  return s;
}
// Äldre mat: uppskattningar ("Lunch (ca 830 kcal)") märks som uppskattningar och tas bort ur
// favoriterna. Fritext som är ett känt livsmedel får mängd (2 st, 150 g) i stället för antal (× 2),
// men bara om den uträknade kcal stämmer med den sparade, så att egna värden aldrig skrivs över.
const isEstName = n => /\(ca \d+ kcal\)$/.test(n || "");
function upgradeFood(s) {
  if (s.favs) s.favs = s.favs.filter(f => !f.est && !isEstName(f.name));
  for (const L of Object.values(s.log || {})) for (const f of L.food || []) {
    if (f.amt || f.est || f.plain) continue;
    if (isEstName(f.name)) { f.est = true; continue; }
    const r = parseFood(f.name), it = r.items.length === 1 && !r.unknown.length && r.items[0];
    if (it && Math.abs(it.kcal - (f.per ? f.per.kcal : f.kcal)) <= 2) {
      const amt = amtFromItem(it);
      amt.n *= f.qty || 1;
      Object.assign(f, { name: it.name, amt });
      delete f.qty; delete f.per;
      applyAmt(f);
    } else f.plain = true;   // prövad: behålls som den är
  }
  return s;
}
const normalize = s => upgradeFood(upgradeWorkouts(upgradeDailies(s)));

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(Object.assign(freshState(), JSON.parse(raw)));
    const v1 = localStorage.getItem(KEY_V1);
    if (v1) return migrateV1(JSON.parse(v1));
  } catch (e) { /* tom eller blockerad lagring: börja om */ }
  return freshState();
}

let S = load();
function saveLocal() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignoreras */ }
}
function save() {
  stamp();
  saveLocal();
  clearTimeout(cloud.timer);
  cloud.timer = setTimeout(pushCloud, 600);
}

// ---------- Tidsstämplar för synk ----------
// Varje inställning och varje del av en dag (pass, mat, dailys …) får en tidsstämpel i _t när den
// ändras. Vid synk vinner den nyaste versionen av varje del, så att två enheter inte skriver över
// varandras loggning. Saknas stämpel räknas den som 0, och vid lika vinner kontots version.
const stampSnap = {};
// En tom dag som bara skapats när appen visades får aldrig vinna över riktig loggning
const isEmpty = v => v == null || v === false || v === "" ||
  (typeof v === "object" && !Object.keys(v).length);
function stampParts(obj, prefix, now, initial) {
  const t = obj._t || (obj._t = {});
  const keys = new Set([...Object.keys(obj), ...Object.keys(t)]);
  keys.delete("_t");
  if (prefix === "s:") keys.delete("log");
  for (const k of keys) {
    const json = String(JSON.stringify(obj[k]));
    const id = prefix + k;
    if (!initial && id in stampSnap && stampSnap[id] !== json) t[k] = now;
    // En ny dag eller ett nytt fält räknas också som en ändring
    else if (!initial && !(id in stampSnap) && !isEmpty(obj[k])) t[k] = now;
    stampSnap[id] = json;
  }
}
function stamp(initial = false) {
  const now = Date.now();
  stampParts(S, "s:", now, initial);
  for (const [date, L] of Object.entries(S.log)) stampParts(L, date + ":", now, initial);
}
// Väljer del för del den version som ändrats senast. b är kontots version.
function mergeParts(a, b) {
  const ta = a._t || {}, tb = b._t || {}, out = { _t: {} };
  const keys = new Set([...Object.keys(a), ...Object.keys(b), ...Object.keys(ta), ...Object.keys(tb)]);
  keys.delete("_t");
  for (const k of keys) {
    const x = ta[k] || 0, y = tb[k] || 0;
    const src = x > y ? a : y > x ? b : k in b ? b : a;
    if (k in src) out[k] = src[k];
    if ((src === a ? x : y)) out._t[k] = src === a ? x : y;
  }
  return out;
}
function mergeLog(a, b) {
  const out = {};
  for (const date of new Set([...Object.keys(a), ...Object.keys(b)]))
    out[date] = a[date] && b[date] ? mergeParts(a[date], b[date]) : a[date] || b[date];
  return out;
}
function mergeState(local, remote) {
  const { log: la, ...sa } = local, { log: lb, ...sb } = remote;
  return normalize(Object.assign(mergeParts(sa, sb), { log: mergeLog(la, lb) }));
}
stamp(true);

// I en publicerad artifact synkas allt till kontots privata databas: ett dokument
// med inställningar och ett per månad med loggen. localStorage är cache och reserv.
const cloud = { col: null, sent: {}, queue: {}, status: "local", timer: 0, sample: null };

function splitDocs(state) {
  const { log, ...settings } = state;
  const docs = { settings };
  for (const [date, entry] of Object.entries(log)) {
    const id = "m-" + date.slice(0, 7);
    (docs[id] = docs[id] || { days: {} }).days[date] = entry;
  }
  return docs;
}
function joinDocs(docs) {
  const s = Object.assign(freshState(), docs.settings || {});
  s.log = {};
  for (const [id, d] of Object.entries(docs)) if (id.startsWith("m-")) Object.assign(s.log, d.days || {});
  return normalize(s);
}

// Skriver bara dokument som ändrats. Har någon annan enhet ändrat samma dokument sedan sist
// slås deras version ihop med vår först, så att inget skrivs över.
function pushCloud() {
  if (!cloud.col) return;
  if (cloud.pushing) { cloud.again = true; return; }
  cloud.pushing = pullChanged().catch(() => {}).then(writeDocs).finally(() => {
    cloud.pushing = null;
    if (cloud.again) { cloud.again = false; pushCloud(); }
  });
}
async function pullChanged() {
  const col = cloud.col;
  if (!col || !col.getMany) return;
  const docs = splitDocs(S);
  const ids = Object.keys(docs).filter(id => cloud.sent[id] !== JSON.stringify(docs[id]));
  if (!ids.length) return;
  let pulled = false;
  for (const d of await col.getMany(ids)) {
    const json = JSON.stringify(d.data());
    if (cloud.sent[d.id] === json) continue;
    const body = JSON.parse(json);
    if (d.id === "settings") {
      const { log, ...cur } = S;
      S = normalize(Object.assign(mergeParts(cur, body), { log }));
    } else {
      const days = upgradeWorkouts({ log: body.days || {} }).log;
      for (const [date, L] of Object.entries(days)) S.log[date] = S.log[date] ? mergeParts(S.log[date], L) : L;
    }
    cloud.sent[d.id] = json;
    pulled = true;
  }
  if (pulled) { stamp(true); saveLocal(); render(); }
}
function writeDocs() {
  if (!cloud.col) return;
  const docs = splitDocs(S);
  const write = (id, op) => {
    cloud.queue[id] = (cloud.queue[id] || Promise.resolve()).then(op).catch(e => {
      delete cloud.sent[id];
      // Saknar man skrivrätt (t.ex. via en delad länk) sparas allt bara i webbläsaren
      if (e && e.code === "invalid_argument") { cloud.col = null; cloud.status = "local"; }
      else cloud.status = "error";
      render();
    });
    return cloud.queue[id];
  };
  const writes = [];
  for (const [id, body] of Object.entries(docs)) {
    const json = JSON.stringify(body);
    if (cloud.sent[id] === json) continue;
    cloud.sent[id] = json;
    writes.push(write(id, () => cloud.col.doc(id).set(JSON.parse(json))));
  }
  for (const id of Object.keys(cloud.sent)) {
    if (docs[id]) continue;
    delete cloud.sent[id];
    writes.push(write(id, () => cloud.col.doc(id).delete()));
  }
  return Promise.all(writes);
}

async function connectCloud() {
  if (!window.claude || !window.claude.use) return;
  try {
    const [db, user, sample] = await Promise.all(["db", "user", "sample"].map(n => window.claude.use(n)));
    cloud.sample = sample;
    const uid = user && await user.id();
    if (!db || !uid) return;
    await attachCollection(db.collection("data/users/" + uid), false);
  } catch (e) {
    cloud.status = "error";
  }
  render();
}

// Kopplar appen till ett kontos dokument. Med merge slås det som redan finns på enheten ihop
// med kontot, del för del efter tidsstämpel. Första gången enheten kopplas till kontot vinner
// kontots upplägg, så att en ny telefon inte skriver över det man redan har.
async function attachCollection(col, merge, firstSync = false) {
  const snap = await col.get();
  cloud.col = col;
  cloud.sent = {};
  cloud.status = "cloud";
  if (snap.empty) {
    if (S.setupDone || Object.keys(S.log).length) pushCloud();
    return;
  }
  const docs = {};
  // Snapshots kan vara frysta; kopiera så att appen kan ändra i datan
  for (const d of snap.docs) { const json = JSON.stringify(d.data()); docs[d.id] = JSON.parse(json); cloud.sent[d.id] = json; }
  const remote = joinDocs(docs);
  if (!merge) S = remote;
  else if (firstSync) {
    const log = mergeLog(S.log, remote.log);
    S = normalize(Object.assign(!remote.setupDone && S.setupDone ? { ...S } : remote, { log }));
  } else S = mergeState(S, remote);
  stamp(true);
  saveLocal();
  if (merge) pushCloud();
  if (S.setupDone && tab === "upplagg") { tab = "idag"; draft = null; }
}

// ---------- Påminnelser om dailys ----------
// En kalenderhändelse som upprepas varje dag fungerar på alla telefoner, även när appen är stängd
function reminderIcs(time) {
  const [hh, mm] = time.split(":");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const start = TODAY.replace(/-/g, "") + "T" + hh + mm + "00";
  const url = location.protocol === "https:" && !window.claude ? location.href.split("#")[0] : "";
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Driv//Dailys//SV", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:driv-dailys-${stamp}@driv`, `DTSTAMP:${stamp}`, `DTSTART:${start}`, "DURATION:PT15M",
    "RRULE:FREQ=DAILY", "SUMMARY:Driv: dags för dina dailys",
    `DESCRIPTION:Bocka av dagens dailys i Driv.${url ? "\\n" + url : ""}`, ...(url ? [`URL:${url}`] : []),
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Dags för dina dailys", "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
const dailiesLeft = () => S.daily.filter(e => !dailyDone(TODAY, e.id)).length;

// Siffra på appikonen med antal dailys kvar (där systemet stöder det)
function updateBadge() {
  if (!navigator.setAppBadge) return;
  const left = dailiesLeft();
  (left ? navigator.setAppBadge(left) : navigator.clearAppBadge()).catch(() => {});
}

// Notis när appen öppnas efter påminnelsetiden och något är ogjort, högst en gång per dag
async function remindIfDue() {
  const r = S.reminder;
  if (!r || !r.notify || !("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date(), [hh, mm] = r.time.split(":").map(Number);
  if (now.getHours() * 60 + now.getMinutes() < hh * 60 + mm || r.lastNotified === TODAY || !dailiesLeft()) return;
  r.lastNotified = TODAY;
  save();
  const body = `${dailiesLeft()} av ${S.daily.length} dailys kvar idag.`;
  const opts = { body, icon: "icons/icon-192.png", tag: "dailys" };
  // Installerade appar visar notiser via service workern; annars en vanlig notis
  try {
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if (reg) return await reg.showNotification("Driv: dags för dina dailys", opts);
  } catch (e) { /* ingen service worker här */ }
  try { new Notification("Driv: dags för dina dailys", opts); } catch (e) { /* notiser stöds inte här */ }
}

function reminderCard() {
  const r = S.reminder || { time: "20:00" };
  const canNotify = "Notification" in window && !window.claude;
  const perm = canNotify ? Notification.permission : "denied";
  return `<div class="card"><h2>Påminnelse</h2>
    <div class="row"><label class="field grow">Påminn mig varje dag kl.
      <input type="time" id="remtime" value="${esc(r.time)}"></label>
      <button class="small" data-remcal style="align-self:flex-end">📅 Lägg till i kalendern</button></div>
    <div class="muted small" style="margin-top:6px">Kalendern påminner dig även när appen är stängd.</div>
    ${canNotify ? (perm === "granted"
      ? `<label class="row" style="margin-top:10px"><input type="checkbox" data-remnotify ${r.notify ? "checked" : ""}>
          <span>Notis när jag öppnar appen efter den tiden och något är ogjort</span></label>`
      : perm === "default" ? `<button class="small" style="margin-top:10px" data-remperm>Tillåt notiser från Driv</button>`
      : `<div class="muted small" style="margin-top:6px">Notiser är avstängda för Driv i telefonens inställningar.</div>`) : ""}</div>`;
}

// ---------- Datum ----------
function iso(d) {
  const z = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
const parse = s => new Date(s + "T12:00:00");
const shift = (s, days) => { const d = parse(s); d.setDate(d.getDate() + days); return iso(d); };
const weekdayOf = s => (parse(s).getDay() + 6) % 7;
const weekStart = s => shift(s, -weekdayOf(s));
function weekNo(s) {
  const d = parse(s);
  d.setDate(d.getDate() + 3 - weekdayOf(s));
  const jan4 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - jan4) / 864e5 - 3 + (jan4.getDay() + 6) % 7) / 7);
}
let TODAY = iso(new Date());
// Dagen man loggar för: idag, eller en tidigare dag som öppnats från Historik
let editDate = null;
const logDate = () => editDate || TODAY;
// Appen kan ligga öppen över midnatt; då ska det nya datumet gälla
function refreshToday() {
  const now = iso(new Date());
  if (now === TODAY) return false;
  TODAY = now; chosenDay = null; editing = false; foodSheet = null; foodItem = null;
  if (focus) endFocus();
  return true;
}

function day(date = logDate()) {
  if (!S.log[date]) S.log[date] = { workouts: [], dailies: {}, food: [] };
  return S.log[date];
}
// En dag kan ha flera pass, men bara ett av varje pass i upplägget
const workoutsOn = date => (S.log[date] && S.log[date].workouts) || [];
const workoutOn = (date, dayId) => workoutsOn(date).find(w => w.dayId === dayId) || null;
// Alla set för en övning en dag, från alla pass
const setsOn = (date, exId) => workoutsOn(date).flatMap(w => w.sets[exId] || []);
const exIdsOn = date => workoutsOn(date).flatMap(w => Object.keys(w.sets));
const dayById = id => S.plan.days.find(d => d.id === id);
// "flex": passen körs i ordning vilka dagar som helst. "fixed": varje pass har en veckodag.
const isFixed = () => S.plan.mode === "fixed";
function scheduledDay(date) {
  if (!isFixed()) return null;
  const i = S.plan.weekdays.indexOf(weekdayOf(date));
  return i >= 0 ? S.plan.days[i] : null;
}
function nextScheduled(from) {
  for (let i = 1; i <= 7; i++) {
    const d = shift(from, i), p = scheduledDay(d);
    if (p) return { date: d, day: p };
  }
  return null;
}
// Passet efter det senast avklarade, oavsett veckodag
function nextInRotation() {
  const dates = Object.keys(S.log).filter(d => d < TODAY && workoutsOn(d).some(w => w.done)).sort();
  const lastW = dates.length ? workoutsOn(dates[dates.length - 1]).filter(w => w.done).pop() : null;
  const last = lastW ? S.plan.days.findIndex(x => x.id === lastW.dayId) : -1;
  return S.plan.days[(last + 1) % S.plan.days.length];
}
const suggestedDay = () => isFixed() ? (scheduledDay(TODAY) || nextScheduled(TODAY).day) : nextInRotation();
const passLabel = d => `Pass ${S.plan.days.indexOf(d) + 1} · ${esc(d.name)}`;
// Text i rubrikbandet bredvid etiketten: passets nummer, och namnet om det inte redan står på etiketten
const passBand = d => `Pass ${S.plan.days.indexOf(d) + 1}${norm(d.name) === norm(TYPES[d.type].label) ? "" : ` · <span class="nocaps">${esc(d.name)}</span>`}`;

// ---------- Kalorier ----------
// Mifflin–St Jeor
const bmr = p => 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "m" ? 5 : -161);
const tdee = p => Math.round(bmr(p) * p.activity);
function kcalGoal() {
  if (S.kcalOverride) return S.kcalOverride;
  return Math.round((tdee(S.profile) + GOALS[S.profile.goal][1]) / 10) * 10;
}
// Protein 2 g/kg, fett 0,8 g/kg, resten kolhydrater
function macros() {
  const kcal = kcalGoal(), w = S.profile.weight;
  const protein = Math.round(2 * w), fat = Math.round(0.8 * w);
  return { kcal, protein, fat, carbs: Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4)) };
}
function eaten(date = logDate()) {
  return (S.log[date] ? S.log[date].food : []).reduce(
    (a, f) => ({ kcal: a.kcal + (+f.kcal || 0), protein: a.protein + (+f.protein || 0) }), { kcal: 0, protein: 0 });
}

// ---------- Veckojämförelse ----------
function weekDates(ws) { return [0, 1, 2, 3, 4, 5, 6].map(i => shift(ws, i)); }
const hasData = s => s && (+s.kg > 0 || +s.reps > 0);

// Bästa set (högst vikt, sedan flest reps), total volym och totala reps för en övning en vecka
function exWeek(exId, ws) {
  let best = null, vol = 0, reps = 0;
  for (const d of weekDates(ws)) {
    for (const s of setsOn(d, exId)) {
      if (!hasData(s)) continue;
      const kg = +s.kg || 0, r = +s.reps || 0;
      vol += kg * r; reps += r;
      if (!best || kg > best.kg || (kg === best.kg && r > best.reps)) best = { kg, reps: r };
    }
  }
  return best && { ...best, vol, totalReps: reps };
}

const fmtNum = n => (Math.round(n * 10) / 10).toString().replace(".", ",");
function deltaBadge(v, unit) {
  if (v === 0) return `<span class="delta same">±0 ${unit}</span>`;
  return `<span class="delta ${v > 0 ? "up" : "down"}">${v > 0 ? "+" : "−"}${fmtNum(Math.abs(v))} ${unit}</span>`;
}
// Jämför mot förra veckan: vikt om övningen körs med vikt, annars reps
// Övningar på tid (plankan, L-sit …) loggas i sekunder i stället för reps
const isTimed = id => /\d\s*s\b|sek/.test(EX[id].reps);
const repUnit = id => isTimed(id) ? "s" : "reps";

// Kroppsviktsövningar jämförs i reps/sekunder, med extra vikt bara om den använts
function exDelta(cur, prev, id) {
  if (!cur || !prev) return "";
  const unit = repUnit(id);
  if (cur.kg || prev.kg) {
    const d = cur.kg - prev.kg;
    return d !== 0 ? deltaBadge(d, "kg") : deltaBadge(cur.reps - prev.reps, unit);
  }
  return EX[id].bw ? deltaBadge(cur.reps - prev.reps, unit) : deltaBadge(cur.totalReps - prev.totalReps, unit);
}
function fmtSet(b, id) {
  if (!b) return "–";
  const r = `${b.reps} ${repUnit(id)}`;
  if (!b.kg) return r;
  return EX[id].bw ? `${r} +${fmtNum(b.kg)} kg` : `${fmtNum(b.kg)} kg × ${b.reps}`;
}

function dailyDone(date, id) {
  const v = S.log[date] && S.log[date].dailies[id];
  return isRun(id) ? !!(v && (v.km || v.min)) : v === true;
}
const allDailiesDone = date => S.daily.length > 0 && S.daily.every(e => dailyDone(date, e.id));
// Antal dagar i rad som test(datum) gäller, räknat från idag eller igår
function streakOf(test) {
  let n = 0, d = test(TODAY) ? TODAY : shift(TODAY, -1);
  while (test(d)) { n++; d = shift(d, -1); }
  return n;
}
function weekSummary(ws) {
  const dates = weekDates(ws);
  const logged = dates.filter(d => S.log[d]);
  const kcalDays = logged.filter(d => eaten(d).kcal > 0);
  return {
    // Sparade pass, och aktiviteter på minst 45 minuter (om de ska räknas)
    passes: logged.reduce((a, d) => a + workoutsOn(d).filter(w => w.done).length + actsOn(d).filter(actCounts).length, 0),
    km: logged.reduce((a, d) => a + (+(S.log[d].dailies.lop || {}).km || 0), 0),
    dailies: dates.filter(allDailiesDone).length,
    kcal: kcalDays.length ? Math.round(kcalDays.reduce((a, d) => a + eaten(d).kcal, 0) / kcalDays.length) : 0,
  };
}

// ---------- Kroppsvikt ----------
const weights = () => S.weights || (S.weights = {});
function weekAvgWeight(ws) {
  const v = weekDates(ws).map(d => weights()[d]).filter(x => x > 0);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function latestWeight() {
  const d = Object.keys(weights()).sort().pop();
  return d ? { date: d, kg: weights()[d] } : null;
}
// Om en ändring är bra beror på målet: ner när man vill gå ner, upp när man vill bygga
function weightBadge(diff) {
  const r = Math.round(diff * 10) / 10, goal = S.profile.goal;
  if (!r) return `<span class="delta same">±0 kg</span>`;
  const good = goal === "cut" ? r < 0 : goal === "bulk" ? r > 0 : Math.abs(r) <= 0.5;
  return `<span class="delta ${good ? "up" : "down"}">${r > 0 ? "+" : "−"}${fmtNum(Math.abs(r))} kg</span>`;
}
function logWeight(kg, date = logDate()) {
  if (!(kg > 20 && kg < 400)) return false;
  weights()[date] = Math.round(kg * 10) / 10;
  // Kalorimålet följer den senaste vikten
  S.profile.weight = latestWeight().kg;
  return true;
}
// En vägning i veckan räcker. Från vägningsdagen (Profil) visas rutan tills veckan har en vägning;
// sedan bara veckans vikt och skillnaden mot förra veckan.
let weightEditing = false;
const weighDay = () => S.weighDay ?? 0;
// På Hem visas vägningen bara när den är dags; vikten över tid finns under Historik
function weighCardDue() {
  const ws = weekStart(TODAY), weighed = weekDates(ws).some(d => d <= TODAY && weights()[d] > 0);
  return weighed && !weightEditing ? "" : weightCard();
}
function weightCard() {
  const ws = weekStart(TODAY), last = latestWeight();
  const weighed = weekDates(ws).filter(d => d <= TODAY && weights()[d] > 0).pop();
  const prev = weekAvgWeight(shift(ws, -7)), now = weekAvgWeight(ws);
  if (weighed && !weightEditing) {
    return `<section class="card kmeal"><div class="khead"><svg class="kicon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20h14l-2-12H7zM9 8a3 3 0 0 1 6 0M12 11v3"/></svg><span class="grow">Veckans vikt</span><span>${fmtNum(now)} kg</span></div>
      <div class="kbody row between"><span>${prev != null ? `${weightBadge(now - prev)} <span class="muted small">mot förra veckan</span>` : `<span class="muted small">Första vägningen</span>`}</span>
      <button class="small ghost" data-wedit>Ändra</button></div></section>`;
  }
  if (!weighed && weekdayOf(TODAY) < weighDay()) return "";
  const date = weighed || TODAY;
  return `<section class="card kmeal"><div class="khead"><svg class="kicon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20h14l-2-12H7zM9 8a3 3 0 0 1 6 0M12 11v3"/></svg><span class="grow">Veckans vägning</span><span>${last ? `Förra: ${fmtNum(last.kg)} kg` : ""}</span></div>
    <div class="kbody"><div class="row"><input id="wkg" type="number" inputmode="decimal" step="0.1" placeholder="${last ? fmtNum(last.kg).replace(",", ".") : "kg"}" aria-label="Vikt i kg"
      value="${weights()[date] ?? ""}"><button data-wsave data-wdate="${date}">Spara</button></div>
    <div class="row between" style="margin-top:4px"><span class="muted small">En gång i veckan räcker. Väg dig gärna på morgonen, samma veckodag. Kalorimålet följer din senaste vikt.</span>
      <button class="small ghost" data-hideweight>Dölj vikt</button></div></div></section>`;
}
// Vägningar som punkter och veckosnitt som linje, de senaste åtta veckorna
function weightChart() {
  const start = shift(weekStart(TODAY), -49), days = [];
  for (let i = 0; i < 56; i++) days.push(shift(start, i));
  const pts = days.map((d, i) => ({ i, d, kg: weights()[d] })).filter(p => p.kg > 0);
  if (pts.length < 2) return `<div class="muted">Grafen visas när du vägt dig minst två gånger.</div>`;
  const avgs = [];
  for (let w = 0; w < 8; w++) {
    const a = weekAvgWeight(shift(start, w * 7));
    if (a != null) avgs.push({ i: w * 7 + 3, kg: a, ws: shift(start, w * 7) });
  }
  const W = 320, H = 170, L = 34, Rr = 12, T = 14, B = 26;
  let lo = Math.min(...pts.map(p => p.kg)), hi = Math.max(...pts.map(p => p.kg));
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
  const x = i => L + i * (W - L - Rr) / 55, y = v => T + (hi - v) * (H - T - B) / (hi - lo);
  const ticks = [lo, (lo + hi) / 2, hi];
  const path = avgs.map((a, k) => `${k ? "L" : "M"}${x(a.i).toFixed(1)},${y(a.kg).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return `<div class="readout" id="wreadout">${WD[weekdayOf(last.d)]} ${last.d.slice(8)}/${+last.d.slice(5, 7)}: <b>${fmtNum(last.kg)} kg</b></div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" data-readout="wreadout" role="img" aria-label="Vikt de senaste åtta veckorna">
      ${ticks.map(t => `<line class="grid" x1="${L}" x2="${W - Rr}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>
        <text class="axis" x="${L - 6}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end">${fmtNum(Math.round(t * 2) / 2)}</text>`).join("")}
      ${[0, 3, 7].map(w => `<text class="axis" x="${x(w * 7 + 3).toFixed(1)}" y="${H - 6}" text-anchor="middle">v.${weekNo(shift(start, w * 7))}</text>`).join("")}
      ${pts.map(p => `<circle class="wdot" cx="${x(p.i).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="3"/>`).join("")}
      ${avgs.length > 1 ? `<path class="line" d="${path}"/>` : ""}
      ${avgs.map(a => `<circle class="dot" cx="${x(a.i).toFixed(1)}" cy="${y(a.kg).toFixed(1)}" r="4.5"/>`).join("")}
      ${pts.map(p => `<g data-pt data-label="${WD[weekdayOf(p.d)]} ${p.d.slice(8)}/${+p.d.slice(5, 7)}: ${fmtNum(p.kg)} kg"><circle class="hit" cx="${x(p.i).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="10"/></g>`).join("")}
      ${avgs.map(a => `<g data-pt data-label="Snitt v.${weekNo(a.ws)}: ${fmtNum(a.kg)} kg"><circle class="hit" cx="${x(a.i).toFixed(1)}" cy="${y(a.kg).toFixed(1)}" r="12"/></g>`).join("")}
      <text class="axis" x="${L}" y="10">kg</text>
    </svg>
    <div class="legend muted small"><span><i class="lg-dot"></i>Vägning</span><span><i class="lg-line"></i>Veckosnitt</span></div>`;
}

// ---------- Rendering ----------
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Fyra flikar; Profil nås via kugghjulet uppe till höger
const TABS = [["idag", "🏠", "Hem"], ["pass", "🏋️", "Träna"], ["kost", "🍽️", "Kost"], ["historik", "📅", "Historik"]];
let tab = S.setupDone ? "idag" : "upplagg";
let chosenDay = null;
let editing = false;
let dailyEditing = false;
let progOpen = false;      // listan med upplägg är ihopfälld tills man vill byta
let setupMore = false;     // första gången: övningar, dailys och kalorimål är valfria och ihopfällda
let modal = null;          // { info: exId } eller { pick: lista, replace, cat, q }
let weekOffset = 0;
let draft = null;          // utkast i upplägg-vyn
let confirmReset = false;
let importMsg = "";

function render() {
  const nav = document.getElementById("nav");
  nav.classList.toggle("hidden", tab === "upplagg");
  nav.innerHTML = TABS.map(([id, ic, lbl]) =>
    `<button data-tab="${id}" class="${tab === id ? "on" : ""}"><span>${ic}</span>${lbl}</button>`).join("");
  const banner = editDate && (tab === "kost" || (tab === "pass" && focus && !editing))
    ? `<div class="editbar">📅 Du ändrar <b>${dateLabel(editDate)}</b><button class="small" data-editdone>Klar</button></div>` : "";
  // Kugghjulet behövs inte i upplägget eller i fokusläget, där det skulle ligga över texten
  // Första starten: Logga in i hörnet för den som redan har ett konto
  const corner = tab === "upplagg" && !S.setupDone && sbEnabled && account.step !== "in" && !welcomeLogin
    ? `<button class="corner-login small" data-welcomelogin="login">Logga in</button>` : "";
  const gear = tab === "upplagg" || (tab === "pass" && focus && !editing) ? corner : `<button class="gear ${tab === "profil" ? "on" : ""}" data-tab="profil" aria-label="Profil och inställningar">⚙️</button>`;
  document.getElementById("app").innerHTML = gear + banner + VIEWS[tab]() + (modal ? renderModal() : "") + (actSheet ? actSheetView() : "");
  if (modal && modal.pick) filterPicker();
  afterFocusRender();
  updateBadge();
}

// Med reachGood är det bra att nå eller passera målet (protein); annars blir det rött över målet
function bar(value, goal, reachGood = false) {
  const pct = goal ? Math.min(100, Math.round(value / goal * 100)) : 0;
  const cls = reachGood ? (goal && value >= goal ? "ok" : "") : value > goal * 1.05 ? "over" : "";
  return `<div class="bar ${cls}"><div style="width:${pct}%"></div></div>`;
}
const thumb = (id, cls = "") => `<button class="thumb ${cls}" data-info="${id}" aria-label="Visa ${esc(EX[id].name)}">${figure(id)}</button>`;
const tag = t => `<span class="tag ${TYPES[t].color || t}">${TYPES[t].label}</span>`;

function currentPassDay() {
  const L = S.log[TODAY];
  const todays = workoutsOn(logDate());
  const id = (focus && focus.dayId) || chosenDay || (todays.length ? todays[todays.length - 1].dayId : suggestedDay().id);
  return dayById(id) || S.plan.days[0];
}

// Schemat: kommande dagar med fasta veckodagar, annars passen i tur och ordning
// Dagens dailys som en kort lista att bocka av, direkt på Idag
function dailiesCard(inPass, banded) {
  const n = S.daily.length, date = logDate(), L = day(date);
  if (dailyEditing) return `<div class="card"><div class="row between"><h2>Redigera dailys</h2><button class="small ghost" data-dedit>Klar</button></div>
    ${exRows("daily", S.daily, true)}
    </div>`;
  if (!n) return `<div class="card"><h2>Dailys</h2><div class="muted">Det du vill göra varje dag, till exempel plankan eller löpning.</div>
    <button style="margin-top:10px" data-openpick="daily">+ Lägg till daily</button></div>`;
  const done = S.daily.filter(e => dailyDone(date, e.id)).length, st = streakOf(allDailiesDone);
  const rows = S.daily.map(e => {
    const id = e.id, ok = dailyDone(date, id), its = streakOf(d => dailyDone(d, id)), v = L.dailies[id] || {};
    const sub = isRun(id) ? "" : EX[id].cat === "cardio" ? esc(e.reps || "") : `${e.sets} × ${esc(e.reps)}`;
    const ctl = isRun(id)
      ? `<label class="runf"><input class="run" type="number" inputmode="decimal" step="0.1" min="0" value="${v.km || ""}" data-run="${id}" data-f="km" aria-label="Kilometer"><span>km</span></label>
         <label class="runf"><input class="run" type="number" inputmode="numeric" min="0" value="${v.min || ""}" data-run="${id}" data-f="min" aria-label="Minuter"><span>min</span></label>
         <button class="done-btn big ${ok ? "on" : ""}" data-runcheck="${id}" aria-pressed="${ok}" aria-label="${esc(EX[id].name)}: ${ok ? "klar" : "fyll i km eller minuter"}">✓</button>`
      : `<button class="done-btn big ${ok ? "on" : ""}" data-dcheck="${id}" aria-pressed="${ok}" aria-label="${esc(EX[id].name)} klar">✓</button>`;
    return `<div class="daily ${ok ? "ok" : ""}">${thumb(id, "xs")}<div class="grow"><b>${esc(EX[id].name)}</b>
      <span class="muted small">${[sub, its ? `🔥 ${its}` : ""].filter(Boolean).join(" · ")}</span></div>${ctl}</div>`;
  }).join("");
  if (banded) return `<section class="card kmeal dailies"><div class="khead"><span class="kcheck" aria-hidden="true">✓</span><span class="grow">Dailys${st ? ` · 🔥 ${st} d` : ""}</span><span>${done} / ${n}</span></div>
    <div class="kbody">${rows}
    <button class="small ghost" style="margin-top:6px" data-dedit>Redigera dailys</button></div></section>`;
  return `<div class="card"><div class="row between"><h2>Dailys</h2><span class="muted">${done} av ${n} klara${st ? ` · 🔥 ${st} d` : ""}</span></div>
    <div class="bar ok"><div style="width:${Math.round(done / n * 100)}%"></div></div>
    ${rows}
    ${inPass ? "" : `<button class="small ghost" style="margin-top:6px" data-dedit>Redigera dailys</button>`}</div>`;
}

// Alla pass som knappar; används på Idag och under Pass
function dayPicker(selected) {
  return `<div class="daypick" style="grid-template-columns:repeat(${S.plan.days.length <= 4 ? S.plan.days.length : Math.ceil(S.plan.days.length / 2)},1fr)">${S.plan.days.map((k, i) =>
    `<button data-pick="${k.id}" class="${k.id === selected ? "on" : ""}" aria-pressed="${k.id === selected}">${tag(k.type)}<div class="muted">${isFixed() ? WD[S.plan.weekdays[i]] : `Pass ${i + 1}`}</div></button>`).join("")}</div>`;
}

const VIEWS = {
  upplagg() {
    if (!draft) draft = {
      program: S.plan.program || "ppl",
      count: S.plan.count,
      mode: S.plan.mode || "flex",
      weekdays: S.plan.weekdays.slice(),
      days: JSON.parse(JSON.stringify(S.plan.days)),
    };
    const n = draft.count, fixed = draft.mode === "fixed";
    const picked = draft.weekdays.length, ok = !fixed || picked === n;
    const sorted = draft.weekdays.slice().sort((a, b) => a - b);
    const p = S.profile;
    return `${S.setupDone ? "" : `<div class="brand"><img src="icons/icon-192.png" alt=""><div><b class="wordmark">DRIV</b><span class="muted">Ditt mål. Ditt driv.</span></div></div>`}
      ${S.setupDone ? `<button class="small ghost backlink" data-cancelsetup>‹ ${setupFrom === "idag" ? "Hem" : "Profil"}</button>` : ""}
      <h1>${S.setupDone ? "Ditt upplägg" : "Välj ditt upplägg"}</h1>
      ${!S.setupDone && account.step === "in" ? `<div class="muted" style="margin:-4px 0 12px">Inloggad som <b>${esc(account.email)}</b>.
        ${cloud.status === "cloud" ? "Kontot har inget sparat upplägg än. Välj ett nedan och tryck Kom igång, så sparas det på kontot." : cloud.status === "error" ? "Kunde inte hämta från kontot. Ladda om sidan." : "Hämtar från kontot…"}</div>`
      : !S.setupDone && sbEnabled ? (welcomeLogin
        ? `<div class="card"><div class="row between"><h2>${welcomeLogin === "login" ? "Logga in" : "Skapa konto"}</h2>
              <button class="small ghost" data-welcomelogin="" aria-label="Stäng">✕</button></div>${accountBody(welcomeLogin)}</div>`
        : "") : ""}
      <div class="card"><div class="row between"><h2>1. Vilket upplägg?</h2>
          <button class="small" data-progtoggle aria-expanded="${progOpen}">${progOpen ? "Fäll ihop" : `Visa alla ${Object.keys(PROGRAMS).length}`}</button></div>
        ${progOpen ? "" : `<div class="proglist"><button class="on" data-progtoggle><b>${PROGRAMS[draft.program].name}</b>
          <div class="muted">${PROGRAMS[draft.program].info}</div><div class="muted small">Tryck för att byta upplägg</div></button></div>`}
        <div ${progOpen ? "" : "hidden"}>
        <div class="proglist">${Object.entries(PROGRAMS).map(([id, pr]) => `<button data-prog="${id}" class="${draft.program === id ? "on" : ""}" aria-pressed="${draft.program === id}">
          <b>${pr.name}</b><div class="muted">${pr.info}</div><div class="muted small">Gjort för ${pr.best} pass i veckan</div></button>`).join("")}</div>
        </div></div>
      <div class="card"><h2>2. Hur många pass i veckan?</h2>
        <div class="seg count">${counts(draft.program).map(c => `<button data-count="${c}" class="${n === c ? "on" : ""}" aria-pressed="${n === c}"><b>${c}</b><div class="muted">pass</div></button>`).join("")}</div>
        <div class="muted small" style="margin-top:8px">Passen blir: ${draft.days.map(d => esc(d.name)).join(", ")}.
          ${PROGRAMS[draft.program].fit.includes(n) ? "" : `${PROGRAMS[draft.program].name} är gjort för ${PROGRAMS[draft.program].best} pass, så passen har anpassats.`}
          ${n === 7 ? " Sju pass i veckan kräver bra återhämtning – lyssna på kroppen." : ""}</div>
        </div>
      <div class="card"><h2>3. När tränar du?</h2>
        <div class="seg two">
          <button data-mode="flex" class="${fixed ? "" : "on"}" aria-pressed="${!fixed}"><b>Olika dagar</b><div class="muted">Pass 1, 2, 3 … i ordning</div></button>
          <button data-mode="fixed" class="${fixed ? "on" : ""}" aria-pressed="${fixed}"><b>Fasta dagar</b><div class="muted">Varje pass har en veckodag</div></button></div>
        ${fixed ? `<div class="seg wd" style="margin-top:12px">${WD.map((name, i) => `<button data-wd="${i}" class="${draft.weekdays.includes(i) ? "on" : ""}" aria-pressed="${draft.weekdays.includes(i)}">${name}</button>`).join("")}</div>
          <div class="muted" style="margin-top:8px">${ok ? `✓ ${n} dagar valda. Tryck på en vald dag för att avmarkera den.` : `Välj ${n} dagar (${picked} valda)`}</div>`
          : `<div class="muted" style="margin-top:8px">Appen föreslår nästa pass i ordningen när du tränar, vilken dag det än är.</div>`}</div>
      ${!S.setupDone && !setupMore ? `<button class="wide" data-setupmore>Anpassa övningar, dailys och kalorimål <span class="muted">(valfritt)</span></button>
        <div class="muted small" style="margin:-4px 0 12px">Allt är förifyllt och kan ändras när som helst under Profil.</div>` : `
      <div class="card"><h2>4. Övningar</h2>
        <div class="muted" style="margin-bottom:8px">${draft.program === "eget" ? "Lägg till övningar i varje pass." : "Förifyllt. Byt, ta bort eller lägg till."} Tryck på en bild för att se hur övningen görs.</div>
        ${draft.days.map((d, i) => `<details class="plan-day" open><summary>${fixed && ok ? `<b>${WD[sorted[i]]}</b> · ` : ""}<b>Pass ${i + 1}</b> ${tag(d.type)}
            <span class="muted">${d.ex.length} övningar</span></summary>
          ${d.type === "custom" ? `<label class="field" style="margin:4px 0 6px">Namn på passet
            <input value="${esc(d.name)}" data-dayname="${i}" placeholder="T.ex. Bröst & triceps"></label>` : ""}
          ${d.ex.length ? "" : `<div class="muted" style="margin:6px 0">Inga övningar än. Lägg till dem nedan.</div>`}
          ${exRows("draft:" + i, d.ex, false)}</details>`).join("")}</div>
      <div class="card"><h2>5. Dailys</h2>
        <div class="muted" style="margin-bottom:8px">Det du vill göra varje dag. Du bockar av och ändrar dem på Hem.</div>
        ${exRows("daily", S.daily, false)}</div>
      <div class="card"><h2>6. Kalorimål</h2>${profileFields(p)}
        <div class="muted" style="margin-top:8px">Mål: <b>${kcalGoal()} kcal</b> · ${macros().protein} g protein per dag</div></div>`}
      <button class="primary wide" data-savesetup ${ok ? "" : "disabled"}>${S.setupDone ? "Spara upplägg" : "Kom igång"}</button>

      ${S.setupDone ? `<button class="ghost wide" data-cancelsetup>Avbryt</button>` : ""}`;
  },

  idag() {
    const m = macros(), e = eaten(), L = day();
    m.kcal += burnedOn(TODAY);
    const todays = workoutsOn(TODAY);
    const suggested = todays.length ? dayById(todays[todays.length - 1].dayId) : isFixed() ? scheduledDay(TODAY) : nextInRotation();
    const d = (chosenDay && dayById(chosenDay)) || suggested;
    const weekPasses = weekSummary(weekStart(TODAY)).passes;
    const others = todays.filter(w => !d || w.dayId !== d.id).map(w => dayById(w.dayId)).filter(Boolean);
    let passCard;
    if (d) {
      // Dagens pass med alla övningar, så att man vet vad som ska göras när man kommer till gymmet
      const w = workoutOn(TODAY, d.id);
      const done = d.ex.filter(x => exDone(w, x)).length;
      const rows = d.ex.map(x => {
        const t = todayTarget(x), ok = exDone(w, x);
        return `<li class="${ok ? "done" : ""}"><span class="grow">${esc(EX[x.id].name)}</span>
          <span class="muted small nowrap">${ok ? `<span class="okmark">✓</span>` : `${x.sets} × ${esc(x.reps)}${t ? ` · ${fmtTarget(t, x.id)}` : ""}`}</span></li>`;
      }).join("");
      passCard = `<section class="card kmeal daypass"><div class="khead">${tag(d.type)}<span class="grow">${passBand(d)}</span>
          <span>${editing ? "Ändrar" : w && w.done ? "✓ Klart" : `${done} / ${d.ex.length}`}</span></div>
        <div class="kbody">
        ${editing ? `${exRows(d.id, d.ex, true)}<button class="primary wide bigbtn" style="margin-top:14px" data-edit>Klar</button></div></section>` : `
        ${d.ex.length ? `<ol class="exnames">${rows}</ol>` : `<div class="muted">Passet har inga övningar än.</div>`}
        ${others.length ? `<div class="muted small">Idag har du även loggat ${others.map(o => esc(o.name)).join(", ")}.</div>` : ""}
        <button class="primary wide bigbtn" style="margin-top:12px" data-focusstart="${d.id}">${w && w.done ? "Öppna passet" : w ? "▶ Fortsätt passet" : "▶ Starta passet"}</button>
        <div class="row between" style="margin-top:8px"><span class="muted small">${weekPasses} av ${S.plan.count} pass den här veckan</span>
          <button class="link small" data-edit>Ändra övningar</button></div></div></section>`}`;
    } else {
      const nx = nextScheduled(TODAY);
      passCard = `<section class="card kmeal"><div class="khead"><span class="grow">Vilodag</span><span>😌</span></div>
        <div class="kbody"><div class="muted">Nästa pass: ${WD[weekdayOf(nx.date)]} · ${esc(nx.day.name)}</div>
        <button class="wide" style="margin-top:12px" data-focusstart="${nx.day.id}">Kör ett pass ändå</button></div></section>`;
    }
    // Hem har dagens datum som rubrik
    return `<h1>${new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, c => c.toUpperCase())} <span class="muted">v.${weekNo(TODAY)}</span></h1>
      ${(() => {
        const lw = letterWeekToShow();
        return lw ? `<div class="card letter-card"><div class="row between"><h2>📬 Din vecka</h2>
          <button class="small ghost" data-letterclose="${lw}" aria-label="Stäng sammanfattningen">✕</button></div>${weekLetter(lw)}</div>` : "";
      })()}
      <div class="row between homepasses"><span class="klabel">Ditt upplägg · <span class="nocaps">${PROGRAMS[S.plan.program || "ppl"].name}</span></span>
        <button class="link small" data-tab="upplagg">Ändra upplägg</button></div>
      ${S.plan.days.length > 1 ? dayPicker(d && d.id) : ""}
      ${accountNudge()}
      ${social.pendingCode ? friendsHome() : ""}
      ${homeSummary(e, m, weekPasses)}
      ${passCard}
      ${homeActs()}
      ${account.step === "in" && !social.pendingCode ? friendsHome() : ""}
      ${dailiesCard(false, true)}
      ${S.hideWeight ? "" : weighCardDue()}
      ${social.pendingCode || account.step === "in" ? "" : friendsHome()}`;
  },

  pass() {
    if (focus && !editing) return focusView();
    const d = currentPassDay();
    const w = workoutOn(logDate(), d.id);
    const done = d.ex.filter(x => exDone(w, x)).length, logged = w && Object.values(w.sets).some(a => a.some(hasData));
    const Day = editDate ? dateLabel(editDate).replace(/^./, c => c.toUpperCase()) : "";
    return `${editDate ? `<button class="small ghost backlink" data-editdone>‹ Tillbaka till Historik</button>
        <h1>Logga i efterhand</h1><div class="pastsub">📅 ${Day} · vecka ${weekNo(editDate)}</div>
        <div class="muted small pastnote">Ett pass du redan har gjort. Inget startas, fyll bara i vad du lyfte.</div>`
      : `<h1>Träna <span class="muted">v.${weekNo(logDate())}</span></h1>`}
      ${dayPicker(d && d.id)}
      ${editing ? `<div class="card"><div class="row between"><h2>${passLabel(d)}</h2><button class="small ghost" data-edit>Klar</button></div>
          <div class="muted">${TYPES[d.type].muscles}</div></div>${editList(d)}`
        : !d.ex.length ? `<div class="card muted">Passet har inga övningar än. <button class="link" data-edit>Lägg till övningar</button></div>`
        : editDate ? `${pastLog(d, w)}
          <div class="row between passmeta"><span class="muted small">${TYPES[d.type].muscles}</span><button class="link small" data-edit>Redigera passet</button></div>
          ${w && w.done ? `<div class="card done-card"><b>✓ Passet är sparat för ${dateLabel(editDate)}.</b>
                <button class="small" style="margin-top:8px" data-finish="${d.id}">Öppna passet igen</button></div>`
            : `<button class="primary wide bigbtn" data-finish="${d.id}">✓ Spara och gå tillbaka till Historik</button>
               <div class="muted small finish-note">Passet sparas på ${dateLabel(editDate)}.</div>`}`
        : `${passOverview(d, w)}
          <div class="row between passmeta"><span class="muted small">${TYPES[d.type].muscles}</span><button class="link small" data-edit>Redigera passet</button></div>
          ${w && w.done
            ? `<div class="card done-card"><b>✓ Bra jobbat, passet är sparat!</b>
                <div class="muted small">Det räknas in i veckans pass och jämförelsen med förra veckan.</div>${friendsAfterPass()}
                <button class="small" style="margin-top:8px" data-finish="${d.id}">Öppna passet igen</button></div>`
            : logged
            ? `<button class="primary wide bigbtn" data-finish="${d.id}">✓ Spara passet · ${done} av ${d.ex.length} klara</button>
               <div class="muted small finish-note">Fortsätt genom att trycka på en övning. Passet räknas även om du inte hunnit alla.</div>`
            : `<button class="primary wide bigbtn" data-focusstart="${d.id}">▶ Starta passet</button>
               <div class="muted small finish-note">En övning i taget. Allt du loggar sparas direkt.</div>`}`}
      ${editing ? "" : actsCard(logDate(), editDate ? "Annan träning den här dagen" : "Annan träning")}`;
  },

  kost: () => kostView(),

  historik: () => historikView(),

  profil() {
    checkPush();
    const p = S.profile, m = macros(), rs = restSettings(), r = S.reminder;
    const cloudText = {
      cloud: account.step === "in" ? `✓ Sparas på ditt konto (${esc(account.email)}).` : "✓ Sparas på ditt konto och följer med mellan mobil och dator.",
      error: "Kunde inte spara till kontot just nu. Allt finns kvar i den här webbläsaren och sparas igen vid nästa ändring.",
      local: "Sparas i den här webbläsaren. Exportera för en säkerhetskopia.",
    }[cloud.status];
    const data = `<h3 class="sheet-sub">Data</h3><div class="muted" style="margin-bottom:8px">${cloudText}</div>
        <div class="row wrap"><button data-export>Exportera</button><button data-import>Importera</button>
        <button class="${confirmReset ? "primary" : "ghost"}" data-reset>${confirmReset ? "Tryck igen för att radera allt" : "Nollställ allt"}</button></div>
        ${importMsg ? `<div class="muted" style="margin-top:8px">${esc(importMsg)}</div>` : ""}
        <input type="file" id="importfile" accept="application/json" class="hidden">`;
    const friends = !sbEnabled ? "" : account.step !== "in" ? "Kräver ett konto"
      : social.profile ? `${social.friends.length ? `${social.friends.length} ${social.friends.length === 1 ? "vän" : "vänner"}` : "Inga vänner än"} · kod ${esc(social.profile.code)}` : "Välj ditt namn";
    return `<h1>Profil</h1>
      <div class="card plist">
        ${sbEnabled ? profRow("vanner", "👋", "Vänner", friends, friendsCard()) : ""}
        <button class="prow-head" data-tab="upplagg"><span class="pic">🗓️</span><span class="grow"><b>Upplägg</b>
          <span class="muted small">${PROGRAMS[S.plan.program || "ppl"].name} · ${isFixed() ? S.plan.weekdays.map(i => WD[i]).join(", ") : `${S.plan.count} pass i veckan`}</span></span><span class="chev">›</span></button>
        ${profRow("kalori", "🍽️", "Kalorimål", `${m.kcal} kcal · ${GOALS[p.goal][0]}`, `${profileFields(p)}
          <div class="muted" style="margin-top:10px">Underhåll (TDEE): ${tdee(p)} kcal · Mål: ${m.kcal} kcal</div>
          <div class="muted">Protein ${m.protein} g · Fett ${m.fat} g · Kolhydrater ${m.carbs} g</div>
          <label class="field" style="margin-top:10px">Eget kalorimål (lämna tomt för beräknat)
            <input type="number" inputmode="numeric" id="override" value="${S.kcalOverride || ""}" placeholder="${m.kcal}"></label>`)}
        ${profRow("vikt", "⚖️", "Vikt", S.hideWeight ? "Dold" : `Vägning varje ${WD_LONG[weighDay()]}`, `
          <label class="row"><input type="checkbox" data-showweight ${S.hideWeight ? "" : "checked"}><span>Visa vikt på Hem och i Historik</span></label>
          <label class="field" style="margin-top:8px">Vägningsdag<select data-weighday>${WD.map((w, i) => `<option value="${i}" ${weighDay() === i ? "selected" : ""}>${WD_LONG[i].replace(/^./, c => c.toUpperCase())}</option>`).join("")}</select></label>
          <div class="muted small" style="margin-top:4px">Döljer du vikten används vikten i Kalorimål, och sparade vägningar finns kvar.</div>`)}
        ${profRow("notiser", "🔔", "Notiser", pushSummary(), pushBody())}
        ${S.daily.length ? profRow("paminnelse", "⏰", "Påminnelse i kalendern", r ? `Kl. ${esc(r.time)}` : "Ingen", reminderCard()) : ""}
        ${profRow("utseende", "🌗", "Utseende", THEMES[themeNow()], `<div class="chips">${Object.entries(THEMES).map(([k, n]) =>
          `<button data-theme-set="${k}" class="${themeNow() === k ? "on" : ""}" aria-pressed="${themeNow() === k}">${n}</button>`).join("")}</div>
          <div class="muted small" style="margin-top:8px">Automatiskt följer telefonens inställning. Valet gäller den här enheten.</div>`)}
        ${profRow("aktiviteter", "🎾", "Aktiviteter", [S.actCount !== false ? "Räknas som pass" : "", S.actKcal ? "kcal läggs till" : ""].filter(Boolean).join(" · ") || "Padel, vandring och annat", `
          <label class="row"><input type="checkbox" data-actcount ${S.actCount !== false ? "checked" : ""}><span>En aktivitet på minst 45 minuter räknas som ett pass i veckan</span></label>
          <label class="row" style="margin-top:8px"><input type="checkbox" data-actkcal ${S.actKcal ? "checked" : ""}><span>Lägg till förbrända kcal i dagens kalorimål</span></label>
          <div class="muted small" style="margin-top:6px">Förbrända kcal är en uppskattning efter aktivitet, tid och din vikt. Den blir lätt för hög, därför är det avstängt från början.</div>`)}
        ${profRow("vila", "⏱️", "Vilotimer", rs.on ? `På · ${rs.compound} / ${rs.iso} sek` : "Av", `
          <label class="row"><input type="checkbox" data-resttoggle ${rs.on ? "checked" : ""}><span>Starta en vilotimer när jag bockar av ett set</span></label>
          <div class="grid2" style="margin-top:10px">
            <label class="field">Basövningar (sek)<input type="number" inputmode="numeric" id="restcompound" value="${rs.compound}"></label>
            <label class="field">Isolering och mage (sek)<input type="number" inputmode="numeric" id="restiso" value="${rs.iso}"></label></div>`)}
        ${sbEnabled ? profRow("tyck", "💬", "Tyck till", "Vad saknas, vad är krångligt?", feedbackCard()) : ""}
        ${profRow("konto", "👤", sbEnabled ? "Konto och data" : "Data", account.step === "in" ? esc(account.email) : sbEnabled ? "Inte inloggad" : "Sparas i webbläsaren",
          `${accountCard()}${data}`)}
      </div>`;
  },
};

// Utseende: automatiskt (som telefonen), ljust eller mörkt. Sparas per enhet.
const THEMES = { auto: "Automatiskt", light: "Ljust", dark: "Mörkt" };
function themeNow() { try { return localStorage.getItem("driv-theme") || "auto"; } catch (e) { return "auto"; } }
function setTheme(t) {
  try { if (t === "auto") localStorage.removeItem("driv-theme"); else localStorage.setItem("driv-theme", t); } catch (e) {}
  if (t === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
}

let setupFrom = null;
// Hem: en rad med dagens kalorier, protein och veckans pass. Tryck för att komma till Kost.
function homeSummary(e, m, wp) {
  return `<button class="card homesum" data-go="kost">
    <span><b>${tnum(e.kcal)}</b> <span class="muted">/ ${tnum(m.kcal)} kcal</span></span>
    <span><b>${tnum(e.protein)}</b> <span class="muted">/ ${m.protein} g protein</span></span>
    <span><b>${wp}</b> <span class="muted">av ${S.plan.count} pass</span></span></button>`;
}
// Profilen är en lista där en rad i taget kan fällas ut
let profOpen = null;
function profRow(id, icon, title, summary, body) {
  const open = profOpen === id;
  return `<div class="prow ${open ? "open" : ""}" id="p-${id}"><button class="prow-head" data-psec="${id}" aria-expanded="${open}">
      <span class="pic">${icon}</span><span class="grow"><b>${title}</b><span class="muted small">${summary}</span></span><span class="chev">›</span></button>
    ${open ? `<div class="prow-body">${body}</div>` : ""}</div>`;
}
function openProfRow(id, focusId) {
  tab = "profil"; profOpen = id; render();
  const el = document.getElementById(`p-${id}`);
  if (el && el.scrollIntoView) el.scrollIntoView({ block: "start" });
  const f = focusId && document.getElementById(focusId);
  if (f) f.focus({ preventScroll: true });
}

// Unika livsmedel/måltider från loggen, senast först
let recentCache = [];
function recentFoods() {
  const seen = new Set(), out = [];
  for (const d of Object.keys(S.log).sort().reverse()) {
    for (const f of S.log[d].food.slice().reverse()) {
      const key = f.name.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(f);
      if (out.length >= 30) return (recentCache = out);
    }
  }
  return (recentCache = out);
}

function profileFields(p) {
  const sel = (f, opts) => `<select data-prof="${f}">${opts.map(([v, l]) => `<option value="${v}" ${String(p[f]) === String(v) ? "selected" : ""}>${l}</option>`).join("")}</select>`;
  const num = (f, l) => `<label class="field">${l}<input type="number" inputmode="decimal" data-prof="${f}" value="${p[f]}"></label>`;
  return `<div class="grid2"><label class="field">Kön${sel("sex", [["m", "Man"], ["f", "Kvinna"]])}</label>${num("age", "Ålder")}
    ${num("height", "Längd (cm)")}${num("weight", "Vikt (kg)")}</div>
    <label class="field" style="margin-top:10px">Aktivitet${sel("activity", ACTIVITY)}</label>
    <label class="field" style="margin-top:10px">Mål${sel("goal", Object.entries(GOALS).map(([k, v]) => [k, v[0]]))}</label>`;
}

function exDone(w, ex) {
  const sets = w && w.sets[ex.id];
  if (!sets) return false;
  for (let i = 0; i < ex.sets; i++) if (!(sets[i] && sets[i].ok)) return false;
  return true;
}

// Förra gångens set, som förslag: senaste gången före dagen man loggar. Loggar man en tidigare
// dag och övningen inte gjorts före den, används närmaste gången efter.
function lastSets(exId) {
  const date = logDate(), dates = Object.keys(S.log).filter(d => d !== date).sort();
  const order = [...dates.filter(d => d < date).reverse(), ...dates.filter(d => d > date)];
  for (const d of order) {
    const w = workoutsOn(d).filter(x => (x.sets[exId] || []).some(hasData)).pop();
    if (w) return w.sets[exId];
  }
  return null;
}


// ---------- Supersets ----------
// ex.ss = true betyder att övningen körs växelvis med nästa. En grupp är övningar i rad som hänger ihop.
function ssGroup(d, idx) {
  let a = idx, b = idx;
  while (a > 0 && d.ex[a - 1].ss) a--;
  while (b < d.ex.length - 1 && d.ex[b].ss) b++;
  return b > a ? [a, b] : null;
}
// Nästa övning i samma varv som ännu inte gjort set i, eller null om varvet är slut
function ssNext(d, idx, i) {
  const g = ssGroup(d, idx), w = workoutOn(logDate(), d.id);
  if (!g) return null;
  for (let k = idx + 1; k <= g[1]; k++) {
    const st = w && w.sets[d.ex[k].id] && w.sets[d.ex[k].id][i];
    if (i < d.ex[k].sets && !(st && st.ok)) return k;
  }
  return null;
}
const ssLabel = (d, idx) => { const g = ssGroup(d, idx); return g ? `Superset ${idx - g[0] + 1}/${g[1] - g[0] + 1}` : ""; };

// Övningslistor kan ligga i ett passdag-id, "draft:<index>" (upplägget) eller "daily"
function exList(target) {
  if (target === "daily") return S.daily;
  if (target.startsWith("draft:")) return draft.days[+target.slice(6)].ex;
  return dayById(target).ex;
}
function targetCats(target) {
  if (target === "daily") return ["core"];
  const d = target.startsWith("draft:") ? draft.days[+target.slice(6)] : dayById(target);
  return TYPES[d.type].cats;
}

// Rader med byt/ta bort; withOrder lägger till sortering och set × reps
function exRows(target, list, withOrder) {
  return list.map((e, i) => `<div class="subex">${thumb(e.id, "sm")}
      <div class="grow"><b>${esc(EX[e.id].name)}</b>${EX[e.id].cat === "cardio" ? `<div class="muted">${esc(e.reps || EX[e.id].muscles)}</div>`
        : `<div class="row" style="margin-top:4px">
        <input type="number" inputmode="numeric" min="1" style="width:52px" value="${e.sets}" data-ed="${i}" data-t="${target}" data-f="sets" aria-label="Antal set"><span class="muted">×</span>
        <input style="width:76px" value="${esc(e.reps)}" data-ed="${i}" data-t="${target}" data-f="reps" aria-label="Reps"></div>`}</div>
      ${withOrder ? `<div class="col"><button class="small ghost" data-mv="-1" data-t="${target}" data-idx="${i}" ${i ? "" : "disabled"} aria-label="Flytta upp">↑</button>
        <button class="small ghost" data-mv="1" data-t="${target}" data-idx="${i}" ${i < list.length - 1 ? "" : "disabled"} aria-label="Flytta ned">↓</button></div>` : ""}
      <button class="small" data-swap="${target}" data-idx="${i}">Byt</button>
      <button class="small ghost" data-xdel="${target}" data-idx="${i}" aria-label="Ta bort">✕</button></div>
      ${withOrder && target !== "daily" && i < list.length - 1 ? `<button class="sslink ${e.ss ? "on" : ""}" data-ss="${target}" data-idx="${i}" aria-pressed="${!!e.ss}">${e.ss
        ? `🔗 Superset med ${esc(EX[list[i + 1].id].name)} <span class="muted">· tryck för att dela</span>` : "＋ Superset med nästa"}</button>` : ""}`).join("") +
    `<button class="small" style="margin-top:8px" data-openpick="${target}">+ Lägg till ${target === "daily" ? "daily" : "övning"}</button>`;
}

function editList(d) {
  return `<div class="card">${exRows(d.id, d.ex, true)}</div>`;
}

const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Bästa set vecka för vecka, de senaste tolv veckorna
function weeklySeries(id) {
  const out = [];
  for (let k = 11; k >= 0; k--) {
    const ws = shift(weekStart(TODAY), -7 * k), b = exWeek(id, ws);
    out.push({ ws, week: weekNo(ws), best: b });
  }
  return out;
}
function chartModal(id) {
  const series = weeklySeries(id), pts = series.filter(x => x.best);
  // Vikt om övningen körts med vikt, annars reps eller sekunder
  const useKg = pts.some(x => x.best.kg), val = b => useKg ? b.kg : b.reps;
  const unit = useKg ? "kg" : repUnit(id);
  if (pts.length < 2) return `<div class="muted" style="margin:12px 0">Grafen visas när du loggat ${esc(EX[id].name)} två olika veckor.</div>`;
  const W = 320, H = 170, L = 34, Rr = 12, T = 14, B = 26;
  const vals = pts.map(x => val(x.best));
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.15; lo = Math.max(0, lo - pad); hi += pad;
  const x = i => L + i * (W - L - Rr) / (series.length - 1);
  const y = v => T + (hi - v) * (H - T - B) / (hi - lo);
  const ticks = [lo, (lo + hi) / 2, hi];
  const idx = series.map((s, i) => s.best ? i : -1).filter(i => i >= 0);
  const path = idx.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(val(series[i].best)).toFixed(1)}`).join(" ");
  const last = idx[idx.length - 1];
  return `<div class="readout" id="readout">v.${series[last].week}: <b>${fmtSet(series[last].best, id)}</b></div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bästa set per vecka i ${esc(EX[id].name)}">
      ${ticks.map(t => `<line class="grid" x1="${L}" x2="${W - Rr}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>
        <text class="axis" x="${L - 6}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end">${fmtNum(Math.round(t * 2) / 2)}</text>`).join("")}
      ${series.map((s, i) => i % 3 === 2 || i === series.length - 1 ? `<text class="axis" x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">v.${s.week}</text>` : "").join("")}
      <path class="line" d="${path}"/>
      ${idx.map(i => `<g data-pt="${i}" data-label="v.${series[i].week}: ${esc(fmtSet(series[i].best, id))}">
        <circle class="hit" cx="${x(i).toFixed(1)}" cy="${y(val(series[i].best)).toFixed(1)}" r="14"/>
        <circle class="dot" cx="${x(i).toFixed(1)}" cy="${y(val(series[i].best)).toFixed(1)}" r="4.5"/></g>`).join("")}
      <text class="axis" x="${L}" y="10">${unit}</text>
    </svg>
    <table class="charttable"><tr><th>Vecka</th><th>Bästa set</th></tr>
      ${pts.slice().reverse().map(s => `<tr><td>v.${s.week}</td><td>${fmtSet(s.best, id)}</td></tr>`).join("")}</table>`;
}

// ---------- Veckobrev ----------
// Övningar där veckans bästa set slog allt du gjort tidigare
function weekRecords(ws) {
  const ids = new Set();
  for (const d of weekDates(ws)) {
    for (const id of exIdsOn(d)) if (EX[id]) ids.add(id);
  }
  const out = [];
  for (const id of ids) {
    const best = exWeek(id, ws), before = bestBefore(id, ws);
    if (best && before && betterSet(best, before)) out.push({ id, best });
  }
  return out;
}
function weekLetter(ws) {
  const prevWs = shift(ws, -7), cur = weekSummary(ws), prev = weekSummary(prevWs);
  const plus = weekPlus(ws), recs = weekRecords(ws);
  const wNow = weekAvgWeight(ws), wPrev = weekAvgWeight(prevWs);
  const goalPasses = S.plan.count;
  const headline = cur.passes >= goalPasses ? "Alla pass klara – starkt jobbat! 💪"
    : cur.passes ? `${cur.passes} av ${goalPasses} pass. Varje pass räknas.` : "Ingen träning loggad den här veckan. Ny chans nu!";
  const line = (icon, label, value, extra = "") => `<div class="letter-row"><span>${icon}</span><span class="grow">${label}</span><b>${value}</b>${extra}</div>`;
  return `<div class="letter">
    <div class="muted small">Vecka ${weekNo(ws)} · ${ws.slice(8)}/${+ws.slice(5, 7)} – ${shift(ws, 6).slice(8)}/${+shift(ws, 6).slice(5, 7)}</div>
    <h3>${headline}</h3>
    ${line("🏋️", "Pass", `${cur.passes} av ${goalPasses}`, prev.passes || cur.passes ? deltaBadge(cur.passes - prev.passes, "st") : "")}
    ${plus.plus + plus.same + plus.minus ? line("📈", "Övningar som gått framåt", `${plus.plus} av ${plus.plus + plus.same + plus.minus}`) : ""}
    ${recs.length ? line("🏆", "Nya PB", recs.map(r => `${esc(EX[r.id].name)} ${fmtSet(r.best, r.id)}`).join(", ")) : ""}
    ${S.daily.length ? line("✅", "Dagar med alla dailys", `${cur.dailies} av 7`) : ""}
    ${cur.km || prev.km ? line("🏃", "Löpning", `${fmtNum(cur.km)} km`, deltaBadge(Math.round((cur.km - prev.km) * 10) / 10, "km")) : ""}
    ${!S.hideWeight && wNow != null ? line("⚖️", "Vikt, snitt", `${fmtNum(wNow)} kg`, wPrev != null ? weightBadge(wNow - wPrev) : "") : ""}
    ${cur.kcal ? line("🍽️", "Kalorier per dag", `${cur.kcal}`, `<span class="muted small">mål ${macros().kcal}</span>`) : ""}
    ${plusStreak() > 1 ? `<div class="letter-foot">🔥 ${plusStreak()} plusveckor i rad. Håll i!</div>` : ""}
  </div>`;
}
// På söndagar visas den här veckan, på måndagar förra veckan, tills man stänger brevet
function letterWeekToShow() {
  const wd = weekdayOf(TODAY), ws = wd === 6 ? weekStart(TODAY) : wd === 0 ? shift(weekStart(TODAY), -7) : null;
  if (!ws || S.letterSeen === ws) return null;
  const sum = weekSummary(ws);
  return sum.passes || sum.dailies || sum.kcal || Object.keys(S.log).some(d => d >= ws && d < shift(ws, 7)) ? ws : null;
}

function renderModal() {
  if (modal.letter) {
    return `<div class="overlay" data-close><div class="sheet"><div class="row between"><h2>Din vecka</h2><button class="small ghost" data-close>✕</button></div>
      ${weekLetter(modal.letter)}</div></div>`;
  }
  if (modal.chart) {
    return `<div class="overlay" data-close><div class="sheet"><div class="row between"><h2>${esc(EX[modal.chart].name)}</h2><button class="small ghost" data-close>✕</button></div>
      <div class="muted">Bästa set per vecka, senaste 12 veckorna</div>${chartModal(modal.chart)}</div></div>`;
  }
  if (modal.info) {
    const e = EX[modal.info];
    return `<div class="overlay" data-close><div class="sheet"><div class="row between"><h2>${esc(e.name)}</h2><button class="small ghost" data-close>✕</button></div>
      ${figure(modal.info, "big", true)}<div class="muted">${esc(e.muscles)}</div>
      ${gearOf(modal.info) ? `<div class="gearbox"><b>${GEAR[gearOf(modal.info)][0]}</b><div>${GEAR[gearOf(modal.info)][1]}</div></div>` : ""}
      <ol>${e.cues.map(c => `<li>${esc(c)}</li>`).join("")}</ol></div></div>`;
  }
  const list = exList(modal.pick);
  const replacing = modal.replace != null ? list[modal.replace] : null;
  const first = targetCats(modal.pick)[0];
  const cat = modal.cat || (replacing && first !== "bw" ? EX[replacing.id].cat : first);
  modal.cat = cat;
  const have = list.map(e => e.id);
  const forDaily = modal.pick === "daily";
  const ids = Object.keys(EX).filter(id => forDaily || EX[id].cat !== "cardio");
  const chips = [...Object.keys(CATS), "bw", ...(forDaily ? ["cardio"] : []), "all"];
  const chipName = c => CATS[c] || { bw: "Kroppsvikt", cardio: "Kondition", all: "Alla" }[c];
  return `<div class="overlay" data-close><div class="sheet"><div class="row between">
      <h2>${replacing ? `Byt ut ${esc(EX[replacing.id].name)}` : "Välj övning"}</h2><button class="small ghost" data-close>✕</button></div>
    <input id="exsearch" type="search" placeholder="Sök övning eller muskel, t.ex. bröst" value="${esc(modal.q || "")}" autocomplete="off" style="margin-bottom:10px">
    <div class="chips" style="margin-bottom:10px">${chips.map(c => `<button data-cat="${c}" class="${c === cat ? "on" : ""}">${chipName(c)}</button>`).join("")}</div>
    <div class="pickgrid">${ids.map(id => `<div class="pick ${have.includes(id) ? "have" : ""}" data-cat="${EX[id].cat}" data-bw="${EX[id].bw ? 1 : ""}" data-q="${esc(norm(EX[id].name + " " + EX[id].muscles + " " + (CATS[EX[id].cat] || "") + " " + (gearOf(id) ? GEAR[gearOf(id)][0] : "")))}">
      ${thumb(id)}<div class="pname">${esc(EX[id].name)}</div><div class="muted small">${esc(EX[id].muscles)}</div>
      ${have.includes(id) ? `<span class="muted small">Finns redan</span>` : `<button class="small primary" data-add="${id}">${replacing ? "Välj" : "Lägg till"}</button>`}</div>`).join("")}</div>
    <div class="muted" id="nohits" hidden>Inga övningar matchar sökningen.</div></div></div>`;
}

// Sökning filtrerar alla kategorier; utan sökord visas vald kategori
function filterPicker() {
  const q = norm((modal && modal.q || "").trim());
  let shown = 0;
  for (const el of document.querySelectorAll(".pick")) {
    const hit = q ? el.dataset.q.includes(q)
      : modal.cat === "all" || el.dataset.cat === modal.cat || (modal.cat === "bw" && el.dataset.bw);
    el.hidden = !hit;
    if (hit) shown++;
  }
  const none = document.getElementById("nohits");
  if (none) none.hidden = shown > 0;
}

// ---------- Logg ----------
function workoutFor(d) {
  const L = day();
  let w = L.workouts.find(x => x.dayId === d.id);
  if (!w) L.workouts.push(w = { dayId: d.id, sets: {}, done: false });
  return w;
}
function setAt(d, exId, i) {
  const w = workoutFor(d);
  w.sets[exId] = w.sets[exId] || [];
  return (w.sets[exId][i] = w.sets[exId][i] || {});
}
// Förra gångens set på samma plats, eller dess sista set om det var färre
const hintSet = (prev, i) => prev ? prev[i] || prev.filter(hasData).pop() || {} : {};

// Målintervall ur "8–10", "5", "10/ben" eller "45 s"
function repRange(r) {
  const nums = String(r || "").match(/\d+/g) || [];
  const lo = +nums[0] || 0;
  return { lo, hi: +(nums[1] || nums[0]) || lo };
}
const weightStep = id => EX[id].hold === "db" ? 2 : EX[id].cat === "legs" || id === "marklyft" ? 5 : 2.5;
// Bättre set: högre vikt, eller samma vikt och fler reps/sekunder
const betterSet = (a, b) => !b || (+a.kg || 0) > (+b.kg || 0) || ((+a.kg || 0) === (+b.kg || 0) && (+a.reps || 0) > (+b.reps || 0));
const topSet = sets => sets.filter(hasData).reduce((best, x) => betterSet(x, best) ? x : best, null);

// Dagens mål med dubbel progression: nådde du toppen av intervallet förra gången höjs vikten
// och reps börjar om nerifrån, annars siktar du på en rep (eller fem sekunder) till
function todayTarget(ex) {
  const top = topSet(lastSets(ex.id) || []);
  if (!top) return null;
  const kg = +top.kg || 0, reps = +top.reps || 0, { lo, hi } = repRange(ex.reps);
  if (isTimed(ex.id)) return { kg, reps: reps + 5, why: "+5 s" };
  if (EX[ex.id].bw && !kg) return { kg: 0, reps: reps + 1, why: "+1 rep" };
  if (hi && reps >= hi) {
    const step = weightStep(ex.id);
    return { kg: kg + step, reps: lo || reps, why: `+${fmtNum(step)} kg` };
  }
  return { kg, reps: hi ? Math.min(reps + 1, hi) : reps + 1, why: "+1 rep" };
}
const fmtTarget = (t, id) => EX[id].bw
  ? `${t.reps} ${repUnit(id)}${t.kg ? ` +${fmtNum(t.kg)} kg` : ""}`
  : `${fmtNum(t.kg)} kg × ${t.reps}`;
// Exempelvärden för ett set: dagens mål om det finns, annars förra gångens set
function setHint(ex, i) {
  const t = todayTarget(ex);
  return t ? { kg: t.kg || "", reps: t.reps } : hintSet(lastSets(ex.id), i);
}

// Bästa set före den här veckan, för att kunna säga när man slår PB (personbästa)
function bestBefore(exId, date) {
  let best = null;
  for (const d of Object.keys(S.log)) {
    if (d >= date) continue;
    const t = topSet(setsOn(d, exId));
    if (t && betterSet(t, best)) best = t;
  }
  return best;
}
// Kollar ett nyss avbockat set mot förra veckan och mot allt tidigare
const toasted = new Set();
function checkRecord(exId, s) {
  if (!hasData(s) || toasted.has(exId)) return;
  const ws = weekStart(logDate()), prevWeek = exWeek(exId, shift(ws, -7)), ever = bestBefore(exId, ws);
  const set = fmtSet({ kg: +s.kg || 0, reps: +s.reps || 0 }, exId);
  if (ever && betterSet(s, ever)) toast(`🏆 Nytt PB i ${EX[exId].name}: ${set}`);
  else if (prevWeek && betterSet(s, prevWeek)) toast(`📈 Bättre än förra veckan i ${EX[exId].name}: ${set}`);
  else return;
  toasted.add(exId);
}
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("out"), 2600);
  setTimeout(() => el.remove(), 3100);
}

// Veckans plus: hur många övningar som gått upp, stått still eller gått ned mot förra veckan
function weekPlus(ws) {
  const prevWs = shift(ws, -7), res = { plus: 0, same: 0, minus: 0, ids: [] };
  const ids = new Set();
  for (const d of weekDates(ws)) {
    for (const id of exIdsOn(d)) if (EX[id]) ids.add(id);
  }
  for (const id of ids) {
    const c = exWeek(id, ws), p = exWeek(id, prevWs);
    if (!c || !p) continue;
    if (betterSet(c, p)) { res.plus++; res.ids.push(id); }
    else if (betterSet(p, c)) res.minus++;
    else res.same++;
  }
  return res;
}
// Veckor i rad med fler plus än minus, räknat från förra veckan (och den här om den redan är i plus)
function plusStreak() {
  let ws = weekStart(TODAY), n = 0;
  const now = weekPlus(ws);
  if (now.plus > now.minus) n++;
  for (ws = shift(ws, -7); ; ws = shift(ws, -7)) {
    const r = weekPlus(ws);
    if (!(r.plus > r.minus)) break;
    n++;
  }
  return n;
}

// Ett avbockat set med tomma fält får exempelvärdena: förra gångens set, annars målet
// (vid ett intervall som 8–10 det lägsta värdet)
// Vikten från ett tidigare set idag följer med till nästa set, om inget annat skrivits där
function liveHint(d, ex, i) {
  // I efterhand föreslås det som faktiskt gjordes närmast före (eller efter), utan höjning
  const past = editDate && hintSet(lastSets(ex.id), i);
  const h = past && hasData(past) ? { kg: past.kg, reps: past.reps } : { ...setHint(ex, i) };
  const w = workoutOn(logDate(), d.id), sets = (w && w.sets[ex.id]) || [];
  for (let j = i - 1; j >= 0; j--) if (sets[j] && sets[j].kg !== undefined && sets[j].kg !== "") { h.kg = sets[j].kg; break; }
  return h;
}
// Rimliga gränser, så att ett felskrivet tal inte förstör statistiken
const setMax = (exId, f) => f === "kg" ? 500 : isTimed(exId) ? 3600 : 300;
const clampSet = (exId, f, v) => Math.min(setMax(exId, f), Math.max(0, v));

function fillFromHint(d, exId, i) {
  const ex = d.ex.find(x => x.id === exId);
  const s = setAt(d, exId, i), prev = liveHint(d, ex, i);
  const target = parseInt(String(ex && ex.reps || ""), 10);
  if (s.reps === undefined || s.reps === "") s.reps = +prev.reps || (target > 0 ? target : "");
  if ((s.kg === undefined || s.kg === "") && +prev.kg) s.kg = +prev.kg;
}

// Passet räknas som klart när alla övningar är avbockade
function syncDone(d) {
  const w = workoutOn(logDate(), d.id);
  if (w) w.done = d.ex.length > 0 && d.ex.every(x => exDone(w, x));
}

function saveSetup() {
  const weekdays = draft.weekdays.slice().sort((a, b) => a - b);
  S.plan = { program: draft.program, count: draft.count, mode: draft.mode, weekdays, days: draft.days };
  // Har man hoppat över kalorimålet påminner Kost om att ställa in det
  if (!S.setupDone && !setupMore) S.profileSet = false;
  S.setupDone = true;
  draft = null;
  tab = "idag";
}

// ---------- Händelser ----------
document.addEventListener("click", ev => {
  // Tryck på en punkt i grafen visar dess värde
  const pt = ev.target.closest && ev.target.closest("[data-pt]");
  if (pt) {
    document.querySelectorAll("[data-pt].sel").forEach(g => g.classList.remove("sel"));
    pt.classList.add("sel");
    const svg = pt.closest("svg");
    const r = document.getElementById((svg && svg.dataset.readout) || "readout");
    if (r) r.textContent = pt.dataset.label;
    return;
  }
  if (suggCache && !ev.target.closest(".fwrap")) hideSuggestions();
  const t = ev.target.closest("button, input[type=checkbox], .overlay");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i rutan
  const ds = t.dataset, prevTab = tab;
  if (ds.close !== undefined) { modal = null; render(); return; }
  if (ds.info) { modal = { info: ds.info }; render(); return; }
  if (ds.chart) { modal = { chart: ds.chart }; render(); return; }
  if (ds.letter) { modal = { letter: ds.letter }; render(); return; }
  if (ds.openpick) { modal = { pick: ds.openpick }; render(); return; }
  if (ds.swap) { modal = { pick: ds.swap, replace: +ds.idx }; render(); filterPicker(); return; }
  if (ds.cat) {
    modal.cat = ds.cat;
    modal.q = "";
    render();
    filterPicker();
    return;
  }
  if (ds.askai !== undefined) { askClaude(); return; }
  if (ds.sugg !== undefined) { pickSuggestion(+ds.sugg); return; }
  if (ds.tab) {
    tab = ds.tab; editing = false; dailyEditing = false; draft = null; editDate = null; histDay = null;
    if (tab !== "pass") chosenDay = null;
    if (ds.popen) profOpen = ds.popen;
    if (tab === "upplagg") setupFrom = prevTab;
  }
  else if (ds.themeSet) setTheme(ds.themeSet);
  else if (ds.psec) profOpen = profOpen === ds.psec ? null : ds.psec;
  else if (ds.go) { tab = ds.go; if (ds.day) chosenDay = ds.day; }
  else if (ds.pick) { chosenDay = ds.pick; }
  else if (ds.edit !== undefined) editing = !editing;
  else if (ds.ok) {
    const d = currentPassDay(), s = setAt(d, ds.ok, +ds.i);
    s.ok = !s.ok;
    const idx = d.ex.findIndex(x => x.id === ds.ok), inRound = s.ok && ssNext(d, idx, +ds.i) != null;
    // I ett superset vilar man först när varvet är klart
    if (s.ok) { fillFromHint(d, ds.ok, +ds.i); checkRecord(ds.ok, s); if (!editDate && !inRound) startRest(ds.ok); }
    syncDone(d);
    if (s.ok) focusAfterSet(d, idx, +ds.i);
  }
  else if (ds.exok) {
    const d = currentPassDay(), ex = d.ex.find(x => x.id === ds.exok);
    const val = !exDone(workoutOn(logDate(), d.id), ex);
    for (let i = 0; i < ex.sets; i++) {
      setAt(d, ex.id, i).ok = val;
      if (val) fillFromHint(d, ex.id, i);
    }
    if (val) checkRecord(ex.id, topSet(workoutOn(logDate(), d.id).sets[ex.id] || []) || {});
    syncDone(d);
  }
  else if (ds.fillall) {
    // Hela passet i efterhand: varje tomt fält får förslaget och alla set bockas av
    const d = dayById(ds.fillall);
    for (const ex of d.ex) for (let i = 0; i < ex.sets; i++) { fillFromHint(d, ex.id, i); const st = setAt(d, ex.id, i); if (hasData(st)) st.ok = true; }
    syncDone(d);
  }
  else if (ds.finish) {
    const w = workoutFor(dayById(ds.finish));
    // I efterhand räknas set med ifyllda värden som gjorda när passet sparas
    if (editDate && !w.done) for (const arr of Object.values(w.sets)) for (const st of arr) if (st && hasData(st)) st.ok = true;
    w.done = !w.done;
    shareWorkout(dayById(ds.finish), logDate(), w.done);
    // Ett sparat pass visar veckan; i efterhand går man tillbaka till dagen i Historik
    if (w.done) { histDay = editDate; editDate = null; tab = "historik"; }
  }
  else if (ds.setcount) {
    const d = currentPassDay(), ex = d.ex.find(x => x.id === ds.ex);
    ex.sets = Math.max(1, ex.sets + +ds.setcount);
    syncDone(d);
  }
  else if (ds.dcheck) day().dailies[ds.dcheck] = !dailyDone(logDate(), ds.dcheck);
  else if (ds.dedit !== undefined) dailyEditing = !dailyEditing;
  else if (ds.letterclose) S.letterSeen = ds.letterclose;
  else if (ds.hideweight !== undefined) { S.hideWeight = true; toast("Vikten är dold. Visa den igen under Profil."); }
  else if (ds.showweight !== undefined) S.hideWeight = !t.checked;
  else if (ds.wsave !== undefined) {
    const date = ds.wdate || logDate();
    if (!logWeight(+String($("wkg").value).replace(",", "."), date)) { toast("Skriv vikten i kg, till exempel 80,5"); return; }
    weightEditing = false;
    toast(`Vikt sparad: ${fmtNum(weights()[date])} kg`);
  }
  else if (ds.wedit !== undefined) weightEditing = true;
  // Löpning bockas av genom att fylla i km eller minuter; bocken leder dit
  else if (ds.runcheck) {
    if (!dailyDone(logDate(), ds.runcheck)) { const k = document.querySelector(`[data-run="${ds.runcheck}"][data-f="km"]`); if (k) k.focus(); }
    else toast("Klar. Ändra km eller minuter om det behövs.");
    return;
  }
  else if (ds.resttoggle !== undefined) S.rest = Object.assign({}, restSettings(), { on: t.checked });
  else if (ds.sendcode !== undefined) { sendLoginCode(); return; }
  else if (ds.fbsend !== undefined) { sendFeedback(); return; }
  else if (ds.fbagain !== undefined) { feedback.sent = false; feedback.msg = ""; }
  else if (ds.verifycode !== undefined) { verifyLoginCode(); return; }
  else if (ds.welcomelogin !== undefined) welcomeLogin = ds.welcomelogin || null;
  else if (ds.gokonto !== undefined) {
    openProfRow("konto", "acctemail");
    return;
  }
  else if (ds.nudgelater !== undefined) S.nudgeUntil = shift(TODAY, 14);
  else if (ds.changeemail !== undefined) { account.step = "email"; account.msg = ""; }
  else if (ds.signout !== undefined) { signOut(); return; }
  else if (ds.delacct !== undefined) {
    if (!account.confirmDelete) { account.confirmDelete = true; render(); return; }
    account.confirmDelete = false;
    socialRpc("driv_delete_me").then(async () => {
      try { localStorage.removeItem("driv-synced"); } catch (e) { /* blockerad lagring */ }
      await signOut();
      account.msg = "Kontot är raderat. Det du loggat finns kvar på den här enheten.";
      render();
    }, () => { account.msg = "Kunde inte radera kontot just nu. Försök igen."; render(); });
    return;
  }
  else if (ds.remcal !== undefined) {
    const time = (S.reminder && S.reminder.time) || "20:00";
    saveFile("driv-dailys.ics", reminderIcs(time), "text/calendar");
    return;
  }
  else if (ds.remperm !== undefined) {
    Notification.requestPermission().then(p => {
      S.reminder = Object.assign({ time: "20:00" }, S.reminder, { notify: p === "granted" });
      save(); render();
    });
    return;
  }
  else if (ds.remnotify !== undefined) S.reminder = Object.assign({ time: "20:00" }, S.reminder, { notify: t.checked });
  else if (ds.addfood !== undefined || ds.savemeal !== undefined) {
    const name = document.getElementById("fname").value.trim();
    const kcal = Math.round(+document.getElementById("fkcal").value || 0);
    const protein = Math.round(+document.getElementById("fprot").value || 0);
    if (!name && !kcal) return;
    // Okänd rätt utan egna värden: låt Claude uppskatta och logga sedan
    if (ds.addfood !== undefined && name && cloud.sample && !$("fkcal").dataset.manual
      && !(S.learned || {})[norm(name)] && parseFood(name).unknown.length) {
      askClaude(true);
      return;
    }
    const item = { name: name || "Mat", kcal, protein };
    if (ds.savemeal !== undefined) { S.meals.push(item); toast("Sparad bland snabbvalen"); }
    else logFood(item);
  }
  else if (ds.qmeal) {
    const [slot, share] = MEALS[+ds.qmeal], m = macros();
    const kcal = Math.round(+document.getElementById("qm-" + ds.qmeal).value || Math.round(m.kcal * share / 10) * 10);
    // Protein uppskattas med samma andel som i dagens mål
    logFood({ name: "Uppskattning", kcal, protein: Math.round(kcal * m.protein / m.kcal), est: true }, +ds.qmeal);
  }
  else if (ds.delmeal) S.meals.splice(+ds.delmeal, 1);
  else if (ds.delfood) day().food.splice(+ds.delfood, 1);
  else if (ds.xdel) exList(ds.xdel).splice(+ds.idx, 1);
  else if (ds.mv) {
    const list = exList(ds.t), i = +ds.idx, j = i + +ds.mv;
    [list[i], list[j]] = [list[j], list[i]];
  }
  else if (ds.ss) { const e = exList(ds.ss)[+ds.idx]; if (e.ss) delete e.ss; else e.ss = true; }
  else if (ds.add) {
    const list = exList(modal.pick);
    if (modal.replace != null) list[modal.replace] = exEntry(ds.add);
    else list.push(exEntry(ds.add));
    modal = null;
  }
  else if (ds.count) {
    draft.count = +ds.count;
    draft.days = makeDays(draft.program, draft.count, draft.days);
    if (draft.weekdays.length !== draft.count) draft.weekdays = DEFAULT_WEEKDAYS[draft.count].slice();
  }
  else if (ds.mode) draft.mode = ds.mode;
  else if (ds.progtoggle !== undefined) progOpen = !progOpen;
  else if (ds.setupmore !== undefined) setupMore = true;
  else if (ds.prog) {
    draft.program = ds.prog;
    progOpen = false;
    const c = counts(ds.prog);
    if (!c.includes(draft.count)) draft.count = c.includes(3) ? 3 : c[0];
    if (draft.weekdays.length !== draft.count) draft.weekdays = DEFAULT_WEEKDAYS[draft.count].slice();
    draft.days = makeDays(draft.program, draft.count, draft.days);
  }
  else if (ds.wd) {
    const i = +ds.wd, w = draft.weekdays;
    if (w.includes(i)) w.splice(w.indexOf(i), 1);
    else if (w.length < draft.count) w.push(i);
  }
  else if (ds.savesetup !== undefined) saveSetup();
  else if (ds.cancelsetup !== undefined) { draft = null; tab = setupFrom || "profil"; }
  else if (ds.week) weekOffset = Math.min(0, weekOffset + +ds.week);
  else if (ds.editdone !== undefined) { histDay = editDate; editDate = null; tab = "historik"; chosenDay = null; if (focus) endFocus(); }
  else if (ds.export !== undefined) { exportData(); return; }
  else if (ds.import !== undefined) { document.getElementById("importfile").click(); return; }
  else if (ds.reset !== undefined) {
    if (!confirmReset) { confirmReset = true; render(); return; }
    S = freshState(); tab = "upplagg"; draft = null;
  }
  else return;
  confirmReset = false;
  save();
  render();
  // En ny flik börjar högst upp
  if (tab !== prevTab) window.scrollTo(0, 0);
  // En utfälld rad längst ned rullas upp så att innehållet syns ovanför flikraden
  if (ds.psec && profOpen) { const r = document.getElementById(`p-${profOpen}`); if (r && r.scrollIntoView) r.scrollIntoView({ block: "nearest" }); }
});

document.addEventListener("change", ev => {
  const t = ev.target, ds = t.dataset;
  if (ds.set) {
    const d = currentPassDay(), v = t.value === "" ? "" : clampSet(ds.set, ds.f, +t.value || 0);
    if (v !== "" && v !== +t.value) {
      t.value = v;
      toast(`Högst ${setMax(ds.set, ds.f)} ${ds.f === "kg" ? "kg" : isTimed(ds.set) ? "sekunder" : "reps"}`);
    }
    setAt(d, ds.set, +ds.i)[ds.f] = v;
    // Senare set utan egen vikt visar den nya vikten som förslag
    const ex = d.ex.find(x => x.id === ds.set);
    if (ds.f === "kg" && ex) for (const inp of document.querySelectorAll(`[data-set="${ds.set}"][data-f="kg"]`)) {
      const k = +inp.dataset.i > +ds.i && liveHint(d, ex, +inp.dataset.i).kg;
      if (k) inp.placeholder = k;
    }
    save();
    return;   // ingen omritning, så att fokus stannar kvar i fältet
  }
  if (ds.run) { const L = day(); L.dailies[ds.run] = Object.assign({}, L.dailies[ds.run], { [ds.f]: +t.value || 0 }); }
  else if (ds.weighday !== undefined) S.weighDay = +t.value;
  else if (ds.prof) { S.profile[ds.prof] = ds.prof === "sex" || ds.prof === "goal" ? t.value : +t.value; S.profileSet = true; }
  else if (ds.dayname) {
    const d = draft.days[+ds.dayname];
    d.name = t.value.trim() || d.name;
    d.named = true;
  }
  else if (ds.ed) { const ex = exList(ds.t)[+ds.ed]; ex[ds.f] = ds.f === "sets" ? Math.max(1, +t.value || 1) : t.value; }
  else if (t.id === "override") S.kcalOverride = +t.value || null;
  else if (t.id === "restcompound" || t.id === "restiso") {
    S.rest = Object.assign({}, restSettings(), { [t.id === "restiso" ? "iso" : "compound"]: Math.max(10, Math.min(600, +t.value || 60)) });
  }
  else if (t.id === "remtime") S.reminder = Object.assign({}, S.reminder, { time: t.value || "20:00" });
  else if (t.id === "importfile" && t.files[0]) {
    t.files[0].text().then(txt => {
      try {
        const data = JSON.parse(txt);
        S = data.v === 2 ? normalize(Object.assign(freshState(), data)) : migrateV1(data);
        importMsg = "Importerat.";
        save();
      } catch (e) { importMsg = "Kunde inte läsa filen. Välj en JSON-fil som exporterats från appen."; }
      render();
    });
    return;
  }
  else return;
  save();
  render();
});

// Matloggen räknas ut medan man skriver; egna värden i kcal/protein skrivs inte över
const $ = id => document.getElementById(id);
// Förslag för den del man skriver just nu (efter senaste komma, "och" eller +)
let suggCache = null;
function hideSuggestions() {
  const box = $("fsugg");
  if (box) box.hidden = true;
  suggCache = null;
}
function showSuggestions() {
  const text = $("fname").value, box = $("fsugg");
  const m = text.match(/^([\s\S]*(?:,(?!\d)|\s+och\s+|\+|;|\n)\s*)?([\s\S]*)$/);
  const head = m[1] || "", { prefix, rest } = splitAmount(m[2]);
  const list = rest.trim().length >= 2 ? suggestFoods(rest, 6) : [];
  if (!list.length) return hideSuggestions();
  suggCache = { head, prefix, list };
  box.innerHTML = `<div class="sugg-head muted small"><span>Förslag</span><span>kcal · protein per 100 g</span></div>` +
    list.map((x, i) => `<button role="option" data-sugg="${i}"><span>${esc(x.label)}${x.fuzzy ? ` <span class="small muted">menade du?</span>` : ""}</span>
    <span class="muted small">${x.food.kcal} · ${fmtNum(x.food.p)} g</span></button>`).join("");
  box.hidden = false;
}
// Byter ut delen man skriver mot det valda namnet och behåller mängden
function pickSuggestion(i) {
  const { head, prefix, list } = suggCache, x = list[i], f = x.food;
  const amount = prefix.trim() ? prefix : f.portion || f.st ? "" : f.dl ? "1 dl " : "100 g ";
  const input = $("fname");
  input.value = head + amount + x.name;
  hideSuggestions();
  foodPreview(false);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function foodPreview(suggest = true) {
  const text = $("fname").value, out = $("fpreview");
  if (suggest) showSuggestions();
  const addrow = document.querySelector(".addrow");
  if (addrow) addrow.hidden = !text.trim() && !manualKcal;
  if (!text.trim()) { out.innerHTML = ""; return; }
  const known = (S.learned || {})[norm(text.trim())];
  if (known) {
    for (const [id, v] of [["fkcal", known.kcal], ["fprot", known.protein]]) if (!$(id).dataset.manual) $(id).value = v;
    out.innerHTML = `${esc(text)} <span class="fg">≈ ${known.kcal} kcal · ${known.protein} g protein</span> <span class="small">(sparad uträkning)</span>`;
    return;
  }
  const r = parseFood(text);
  // Delen man skriver på visas som förslag, inte som "känns inte igen"
  if (suggCache && r.items.length && !r.items[r.items.length - 1].known) {
    r.unknown = r.unknown.slice(0, -1);
    r.items = r.items.slice(0, -1);
  }
  for (const [id, v] of [["fkcal", r.kcal], ["fprot", r.protein]]) if (!$(id).dataset.manual) $(id).value = v || "";
  const lines = r.items.map(i => i.known
    ? `${esc(i.text)}${i.corrected ? ` <span class="small">→ ${esc(i.corrected)}</span>` : ""} <span class="fg">≈ ${i.kcal} kcal · ${fmtNum(i.protein)} g protein</span> <span class="small">(${i.grams} g)</span>`
    : `${esc(i.text)} <span class="unk">känns inte igen</span>`);
  let tip = "";
  if (r.unknown.length) tip = cloud.sample
    ? `<div style="margin-top:6px"><button class="small" data-askai>Räkna ut med Claude</button> eller tryck Logga direkt</div>`
    : `<div>Skriv mängd och livsmedel, t.ex. "150 g kyckling", eller fyll i kcal själv.</div>`;
  // Med fönstret för en måltid öppet blir varje tolkad rad en mängd som går att ändra
  out.innerHTML = (foodSheet ? draftRows(r.items) : lines.join("<br>")) + tip;
  const manual = document.querySelector(".manual");
  // Fälten för egna kcal visas bara när något inte känns igen, eller när man bett om dem
  if (manual) manual.hidden = !(manualKcal || r.unknown.length);
}

async function askClaude(logAfter = false) {
  const text = $("fname").value.trim(), out = $("fpreview");
  if (!text || !cloud.sample) return;
  out.textContent = "Räknar ut…";
  try {
    const r = await cloud.sample.json(
      `Uppskatta energi och protein för det här som en person i Sverige har ätit: "${text}". ` +
      `Anta vanliga svenska portionsstorlekar där mängd saknas. Svara bara med JSON: ` +
      `{"kcal": heltal, "protein": heltal i gram, "tolkning": "kort beskrivning på svenska av mängderna du antog"}`,
      { modelTier: "quick" });
    $("fkcal").value = Math.round(+r.kcal || 0);
    $("fprot").value = Math.round(+r.protein || 0);
    $("fkcal").dataset.manual = $("fprot").dataset.manual = "1";
    out.innerHTML = `Claude: ${esc(r.tolkning || text)} <span class="fg">≈ ${Math.round(+r.kcal || 0)} kcal · ${Math.round(+r.protein || 0)} g protein</span>`;
    S.learned = S.learned || {};
    S.learned[norm(text)] = { kcal: Math.round(+r.kcal || 0), protein: Math.round(+r.protein || 0) };
    save();
    if (logAfter) {
      logFood({ name: text, kcal: +r.kcal || 0, protein: +r.protein || 0 });
      save();
      render();
    }
  } catch (e) {
    out.textContent = e && e.code === "not_granted"
      ? "Claude får inte användas här. Fyll i kcal själv."
      : "Kunde inte räkna ut just nu. Fyll i kcal själv eller försök igen.";
  }
}

document.addEventListener("input", ev => {
  const t = ev.target;
  if (t.id === "exsearch") { modal.q = t.value; filterPicker(); }
  else if (t.id === "fname") foodPreview();
  else if (t.id === "fkcal" || t.id === "fprot") t.dataset.manual = t.value ? "1" : "";
});

render();
connectCloud();
connectSupabase();
remindIfDue();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  if (refreshToday()) render();
  if (account.step === "in") connectSupabase();
});
// Ett tryck efter midnatt visar först den nya dagen, så att inget loggas på gårdagen
document.addEventListener("click", ev => {
  if (refreshToday()) { ev.stopPropagation(); ev.preventDefault(); render(); }
}, true);
setInterval(() => {
  const typing = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (document.visibilityState === "visible" && !typing && refreshToday()) render();
}, 60000);

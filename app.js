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
// Löpning loggas under Annan träning; den som redan har den som daily behåller den
const DEFAULT_DAILY = ["plankan", "hangande_benlyft", "russian_twist"];
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
// Testläget har egen data under andra nycklar, så att den riktiga loggen aldrig rörs
const KEY = window.DRIV_TEST ? "driv-test" : "ppl-traning-v2";
const KEY_V1 = window.DRIV_TEST ? "driv-test-v1" : "ppl-traning-v1";

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
    if (raw) {
      const { _localOwner, ...state } = JSON.parse(raw);
      account.localUid = _localOwner === undefined ? localOwner() : _localOwner;
      return normalize(Object.assign(freshState(), state));
    }
    account.localUid = localOwner();
    const v1 = localStorage.getItem(KEY_V1);
    if (v1) return migrateV1(JSON.parse(v1));
  } catch (e) { /* tom eller blockerad lagring: börja om */ }
  return freshState();
}

let S = load();
function saveLocal() {
  try { localStorage.setItem(KEY, JSON.stringify({ ...S, _localOwner: account.localUid || null })); } catch (e) { /* ignoreras */ }
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
// Varje matpost/pass har egen identitet. Borttagningar sparas som gravstenar så att
// en gammal offlinekopia inte kan återuppliva en post som redan tagits bort.
const listSnap = {};
const syncLists = ["food", "workouts", "acts"];
function stableJson(value) {
  return JSON.stringify(value, (key, v) => v && typeof v === "object" && !Array.isArray(v)
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
}
const itemBody = item => { const { _id, _ts, ...body } = item; return stableJson(body); };
function legacyItemId(item, occurrence) {
  const text = itemBody(item);
  let a = 2166136261, b = 5381;
  for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ text.charCodeAt(i); }
  return `old-${occurrence}-${(a >>> 0).toString(36)}-${(b >>> 0).toString(36)}`;
}
function listItems(L, key) {
  const seen = new Map();
  return (L[key] || []).map(item => {
    const body = itemBody(item), occurrence = seen.get(body) || 0;
    seen.set(body, occurrence + 1);
    return { ...item, _id: item._id || legacyItemId(item, occurrence),
      _ts: item._ts ?? ((L._t || {})[key] || 0) };
  });
}
function stampList(L, key, prefix, now, initial) {
  const snapKey = prefix + key;
  if (!Array.isArray(L[key]) && !listSnap[snapKey]) return;
  const old = listSnap[snapKey] || {}, next = {};
  const deleted = ((L._deleted || (L._deleted = {}))[key] ||= {});
  const migrated = initial ? listItems(L, key) : null;
  (L[key] || []).forEach((item, i) => {
    if (!item._id) item._id = initial ? migrated[i]._id : crypto.randomUUID();
    const body = itemBody(item);
    if (!initial && (!old[item._id] || old[item._id].body !== body)) item._ts = Math.max(now, (item._ts || 0) + 1, (deleted[item._id] || 0) + 1);
    else item._ts ??= (L._t || {})[key] || 0;
    next[item._id] = { body, ts: item._ts };
  });
  if (!initial) for (const id of Object.keys(old)) if (!(id in next)) deleted[id] = Math.max(now, (deleted[id] || 0) + 1, old[id].ts + 1);
  listSnap[snapKey] = next;
}
function mergeList(a, b, key, out) {
  const deleted = {};
  for (const L of [a, b]) for (const [id, ts] of Object.entries((L._deleted || {})[key] || {})) deleted[id] = Math.max(deleted[id] || 0, ts);
  const items = new Map();
  for (const L of [a, b]) for (const item of listItems(L, key)) {
    const prev = items.get(item._id);
    if (!prev || item._ts >= prev._ts) items.set(item._id, item);
  }
  out[key] = [...items.values()].filter(item => !(item._id in deleted) || item._ts > deleted[item._id]);
  (out._deleted || (out._deleted = {}))[key] = deleted;
}
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
  if (initial) {
    for (const key of Object.keys(stampSnap)) delete stampSnap[key];
    for (const key of Object.keys(listSnap)) delete listSnap[key];
  }
  const now = Date.now();
  stampParts(S, "s:", now, initial);
  for (const [date, L] of Object.entries(S.log)) {
    for (const key of syncLists) stampList(L, key, date + ":", now, initial);
    if (L.dailies) {
      L._dailyBase ??= L._dailyT ? 0 : ((L._t || {}).dailies || 0);
      const daily = { ...L.dailies, _t: L._dailyT || Object.fromEntries(Object.keys(L.dailies).map(k => [k, L._dailyBase])) };
      stampParts(daily, date + ":daily:", now, initial);
      L._dailyT = daily._t;
    }
    stampParts(L, date + ":", now, initial);
  }
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
  if (a.dailies || b.dailies) {
    const keys = new Set([...Object.keys(a.dailies || {}), ...Object.keys(b.dailies || {}), ...Object.keys(a._dailyT || {}), ...Object.keys(b._dailyT || {})]);
    const dailyPart = L => ({ ...L.dailies, _t: Object.fromEntries([...keys].map(k => [k,
      (L._dailyT || {})[k] ?? (Object.prototype.hasOwnProperty.call(L.dailies || {}, k) ? (L._dailyBase ?? ((L._t || {}).dailies || 0)) : undefined)]).filter(([, ts]) => ts !== undefined)) });
    const { _t, ...daily } = mergeParts(dailyPart(a), dailyPart(b));
    out.dailies = daily; out._dailyT = _t;
    out._dailyBase = Math.max(a._dailyBase ?? (ta.dailies || 0), b._dailyBase ?? (tb.dailies || 0));
  }
  for (const key of syncLists) {
    const arrays = [a[key], b[key]].filter(Array.isArray);
    // Äldre primitiva värden (t.ex. gamla importer) använder delens tidsstämpel.
    if (arrays.length && arrays.every(xs => xs.every(x => x && typeof x === "object"))) mergeList(a, b, key, out);
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

function mergeDoc(id, local, remote) {
  return id === "settings" ? mergeParts(local, remote) : { days: mergeLog(local.days || {}, remote.days || {}) };
}
function applyCloudDoc(id, body) {
  if (id === "settings") {
    const { log, ...cur } = S;
    S = normalize(Object.assign(mergeParts(cur, body), { log }));
  } else {
    const days = upgradeWorkouts({ log: body.days || {} }).log;
    S.log = mergeLog(S.log, days);
  }
}

// Skriver bara dokument som ändrats. Har någon annan enhet ändrat samma dokument sedan sist
// slås deras version ihop med vår först, så att inget skrivs över.
function pushCloud() {
  const col = cloud.col;
  if (!col) return;
  if (cloud.pushing) { cloud.again = true; return; }
  cloud.pushing = pullChanged(col).then(() => writeDocs(col)).catch(() => {
    if (cloud.col === col) { cloud.status = "error"; render(); }
  }).finally(() => {
    cloud.pushing = null;
    if (cloud.again) { cloud.again = false; pushCloud(); }
  });
}
async function pullChanged(col = cloud.col) {
  if (!col || !col.getMany || cloud.col !== col) return;
  const docs = splitDocs(S);
  const ids = Object.keys(docs).filter(id => cloud.sent[id] !== JSON.stringify(docs[id]));
  if (!ids.length) return;
  const rows = await col.getMany(ids);
  if (cloud.col !== col) return;
  let pulled = false;
  for (const d of rows) {
    const json = JSON.stringify(d.data());
    if (cloud.sent[d.id] === json) continue;
    applyCloudDoc(d.id, JSON.parse(json));
    cloud.sent[d.id] = json;
    pulled = true;
  }
  if (pulled) { stamp(true); saveLocal(); render(); }
}
async function writeDocs(col = cloud.col) {
  if (!col || cloud.col !== col) return;
  const docs = splitDocs(S);
  for (const [id, body] of Object.entries(docs)) {
    if (cloud.col !== col) return;
    const json = JSON.stringify(body), prev = cloud.sent[id];
    if (prev === json) continue;
    const saved = await col.doc(id).set(JSON.parse(json), prev === undefined ? undefined : JSON.parse(prev));
    if (cloud.col !== col) return;
    cloud.sent[id] = JSON.stringify(saved || JSON.parse(json));
    if (saved) { applyCloudDoc(id, saved); stamp(true); saveLocal(); render(); }
  }
  // Saknade månader raderas bara om de fortfarande är exakt den lästa versionen.
  for (const id of Object.keys(cloud.sent)) {
    if (cloud.col !== col) return;
    if (docs[id]) continue;
    await col.doc(id).delete(JSON.parse(cloud.sent[id]));
    if (cloud.col === col) delete cloud.sent[id];
  }
  if (cloud.col === col) cloud.status = "cloud";
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
  cloud.col = col;
  const snap = await col.get();
  if (cloud.col !== col) return;
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
  const opts = { body, icon: "icons/icon-192-v2.png", tag: "dailys" };
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
      <button class="small" data-remcal style="align-self:flex-end">Lägg till i kalendern</button></div>
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
  TODAY = now; chosenDay = null; editing = false; foodSheet = null; foodItem = null; mealPage = null;
  if (focus) endFocus();
  restoreOldSwaps(); save();
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
  // Fibrer enligt de nordiska näringsrekommendationerna: minst 25 g för kvinnor och 35 g för män
  return { kcal, protein, fat, carbs: Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4)), fiber: S.profile.sex === "f" ? 25 : 35 };
}
// Fett och fibrer finns bara på mat från de vanliga livsmedlen och recept; known räknar hur många som har dem
function eaten(date = logDate()) {
  return (S.log[date] ? S.log[date].food : []).reduce((a, f) => ({ kcal: a.kcal + (+f.kcal || 0), protein: a.protein + (+f.protein || 0),
    fat: a.fat + (+f.fat || 0), fiber: a.fiber + (+f.fiber || 0), known: a.known + (f.fat != null && f.fiber != null ? 1 : 0), n: a.n + 1 }),
    { kcal: 0, protein: 0, fat: 0, fiber: 0, known: 0, n: 0 });
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
    // Löpning loggas som daily eller som aktivitet
    km: logged.reduce((a, d) => a + (+(S.log[d].dailies.lop || {}).km || 0)
      + actsOn(d).filter(x => x.name === "Löpning").reduce((k, x) => k + (+x.km || 0), 0), 0),
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
    return `<section class="card wrow" aria-label="Veckans vikt"><div class="grow"><b>Veckans vikt · ${fmtNum(now)} kg</b>
      <span class="muted small">${prev != null ? `${weightBadge(now - prev)} mot förra veckan` : "Första vägningen"}</span></div>
      <button class="small" data-wedit>Ändra</button></section>`;
  }
  if (!weighed && weekdayOf(TODAY) < weighDay()) return "";
  const date = weighed || TODAY;
  // Kompakt rad: dölja vikten görs under Profil → Vikt
  return `<section class="card wrow" aria-label="Veckans vägning"><div class="grow"><b>Veckans vägning</b>
      ${last ? `<span class="muted small">Senast ${fmtNum(last.kg)} kg · ${dateLabel(last.date)}</span>` : ""}</div>
    <input id="wkg" type="number" inputmode="decimal" step="0.1" placeholder="kg" aria-label="Vikt i kg" value="${weights()[date] ?? ""}">
    <button class="small" data-wsave data-wdate="${date}">Spara</button></section>`;
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
const TABS = [["idag", "hem", "Hem"], ["pass", "trana", "Träna"], ["dailys", "check", "Dailys"], ["kost", "kost", "Kost"], ["historik", "historik", "Historik"]];
let tab = S.setupDone ? "idag" : "upplagg";
let profBack = "idag";   // fliken man kom från, dit tillbaka-pilen i Profil går
let vannerBack = "idag"; // dit tillbaka-pilen på vänsidan går
let passDone = null;     // { dayId, date } medan skärmen för ett avslutat pass visas
let chosenDay = null;
let editing = false;
let dailyEditing = false;
let progOpen = false;      // programmen visas i Upplägg först när man vill byta
let modal = null;          // { info: exId } eller { pick: lista, replace, cat, q }
let weekOffset = 0;
let draft = null;          // utkast i upplägg-vyn
let confirmReset = false;
let importMsg = "";

function render() {
  const oldFocusScroll = document.querySelector(".focus-scroll");
  if (focus && oldFocusScroll) focus.scrollTop = oldFocusScroll.scrollTop;
  if (TABS.some(([id]) => id === tab)) profBack = tab;
  const nav = document.getElementById("nav");
  // Menyn är tillgänglig även under ett pågående pass.
  const inFocus = tab === "pass" && !!focus && !editing && !editDate && !focus.suspended;
  nav.classList.toggle("hidden", tab === "upplagg" || !!passDone);
  document.body.classList.toggle("onboard", tab === "upplagg" && !S.setupDone);
  document.body.classList.toggle("infocus", inFocus);
  nav.innerHTML = TABS.map(([id, ic, lbl]) =>
    `<button data-tab="${id}" class="${tab === id || (tab === "recept" && id === "kost") ? "on" : ""}" ${tab === id ? 'aria-current="page"' : ""}>${icon(ic, 22)}${lbl}</button>`).join("");
  const banner = editDate && (tab === "kost" || (tab === "pass" && focus && !editing))
    ? `<div class="editbar">Du ändrar <b>${dateLabel(editDate)}</b><button class="small" data-editdone>Klar</button></div>` : "";
  // Samma inställningsknapp på alla huvudvyer. Hem har knappen i sin egen header.
  const gear = tab === "idag" || tab === "profil" || tab === "upplagg" || passDone ? "" : `<button class="gear" data-tab="profil" aria-label="Inställningar"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-1.87 1.87-.06-.06A1.7 1.7 0 0 0 16 18.4a1.7 1.7 0 0 0-1 1.56V21h-6v-1.04A1.7 1.7 0 0 0 8 18.4a1.7 1.7 0 0 0-1.87.34l-.06.06-1.87-1.87.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14H2v-4h1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.34-1.87L4.2 7.07 6.07 5.2l.06.06A1.7 1.7 0 0 0 8 5.6 1.7 1.7 0 0 0 9 4V3h6v1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.87-.34l.06-.06 1.87 1.87-.06.06A1.7 1.7 0 0 0 19.4 9 1.7 1.7 0 0 0 21 10h1v4h-1a1.7 1.7 0 0 0-1.6 1Z"/></svg></button>`;
  document.getElementById("app").innerHTML = passDone ? passDoneView()
    : gear + banner + VIEWS[tab]() + (modal ? renderModal() : "") + (actSheet ? actSheetView() : "");
  if (modal && modal.pick) filterPicker();
  if (tab === "recept" && typeof filterRecipes === "function") filterRecipes();
  const focusScroll = document.querySelector(".focus-scroll");
  if (focusScroll && focus) focusScroll.scrollTop = focus.scrollTop || 0;
  afterFocusRender();
  updateBadge();
}

// Med reachGood är det bra att nå eller passera målet (protein); annars blir det rött över målet
function bar(value, goal, reachGood = false, extra = "") {
  const pct = goal ? Math.min(100, Math.round(value / goal * 100)) : 0;
  const cls = reachGood ? (goal && value >= goal ? "ok" : "") : value > goal * 1.05 ? "over" : "";
  return `<div class="bar ${cls} ${extra}"><div style="width:${pct}%"></div></div>`;
}
const thumb = (id, cls = "") => `<button class="thumb ${cls}" data-info="${id}" aria-label="Visa ${esc(EX[id].name)}">${figure(id)}</button>`;
const tag = t => `<span class="tag ${TYPES[t].color || t}">${TYPES[t].label}</span>`;

function currentPassDay() {
  const L = S.log[TODAY];
  const todays = workoutsOn(logDate());
  const id = (focus && !editDate && !focus.suspended && focus.dayId) || chosenDay || (todays.length ? todays[todays.length - 1].dayId : suggestedDay().id);
  return dayById(id) || S.plan.days[0];
}

// Schemat: kommande dagar med fasta veckodagar, annars passen i tur och ordning
// Dagens dailys som en kort lista att bocka av, direkt på Idag
// Dailys: separat tidsstyrd övning med automatisk vila (testfunktion).
let dailyClock = null;
let dailyClockTick = null;
function dailySeconds(e) {
  const m = String(e.reps || "").match(/(\d+)\s*(?:sek|s\b)/i);
  return m ? Math.max(5, Math.min(1800, +m[1])) : 45;
}
function dailyClockView() {
  if (!dailyClock) return "";
  const c = dailyClock, e = S.daily.find(x => x.id === c.id);
  if (!e) return "";
  const left = c.paused ? Math.ceil(c.remaining / 1000) : Math.max(0, Math.ceil((c.end - Date.now()) / 1000));
  const fmt = n => String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
  const rest = c.phase === "rest", done = c.phase === "done", reps = !c.timed && c.phase === "work";
  return `<div class="daily-focus" role="region" aria-label="Daily timer">
    <div class="daily-focus-top"><span>${esc(EX[c.id]?.name || "Daily")}</span><button class="ghost small" data-dclockstop aria-label="Stäng timer">✕</button></div>
    <div class="daily-focus-figure">${figure(c.id)}</div><div class="daily-focus-label">${done ? "Övningen klar!" : rest ? "Vila inför nästa set" : "Träning pågår"}</div>
    <div class="daily-focus-sets">${done ? "Alla set klara" : `Set ${c.set} av ${c.total}`}</div>
    <div class="daily-focus-ring ${rest ? "rest" : ""} ${done ? "complete" : ""}">
      ${done ? `<span class="daily-focus-check">✓</span>` : reps ? `<span>${esc(c.reps || "Set")}</span>` : `<span id="daily-clock-time">${fmt(left)}</span>`}
    </div>
    <div class="daily-focus-caption">${done ? "Bra jobbat!" : rest ? "Nästa set startar automatiskt" : c.timed ? `${c.work} sekunder · ${c.total} set` : `Utför ${esc(c.reps || "repetitionerna")} och markera setet klart`}</div>
    <div class="daily-focus-actions">${done ? `<button data-dclockstop>Stäng</button>` : `<button class="ghost" data-dclockpause>${c.paused ? "▶ Fortsätt" : "Ⅱ Pausa"}</button><button class="ghost" data-dclockskip>${rest ? "Starta nästa set" : c.timed ? "Hoppa över" : "✓ Set klart"}</button>`}</div>
  </div>`;
}
function dailyClockSound() {
  try {
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return;
    const ctx = new A(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; gain.gain.value = 0.12;
    osc.start(); osc.stop(ctx.currentTime + 0.18);
    osc.onended = () => ctx.close();
  } catch (_) {}
}
function dailyClockAdvance() {
  if (!dailyClock) return;
  const c = dailyClock;
  dailyClockSound();
  if (c.phase === "work") {
    if (c.set >= c.total) {
      day().dailies[c.id] = true;
      c.phase = "done"; clearInterval(dailyClockTick); dailyClockTick = null;
      save(); render(); return;
    }
    c.phase = "rest"; c.end = Date.now() + c.rest * 1000;
  } else {
    c.phase = "work"; c.set++; c.end = Date.now() + c.work * 1000;
  }
  render();
}
function dailyClockRefresh() {
  if (!dailyClock || dailyClock.paused || dailyClock.phase === "done" || (dailyClock.phase === "work" && !dailyClock.timed)) return;
  if (Date.now() >= dailyClock.end) { dailyClockAdvance(); return; }
  const el = document.getElementById("daily-clock-time");
  if (el) {
    const n = Math.max(0, Math.ceil((dailyClock.end - Date.now()) / 1000));
    el.textContent = String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
  }
}
let supplementEditing = null;
function supplementsCard() {
  const a = S.supplements || [];
  const rows = a.map((x,i) => {
    const ok = day().dailies["supp:"+x.id] === true;
    return `<div class="daily ${ok ? "ok" : ""}"><div class="dailys-suppicon">${esc(x.icon || "◇")}</div><div class="grow"><b>${esc(x.name)}</b><span class="muted small">${esc(x.dose || "")}</span>${x.note ? `<div class="muted small" style="margin-top:4px">${esc(x.note)}</div>` : ""}</div><button class="done-btn big ${ok ? "on" : ""}" data-suppcheck="${esc(x.id)}" aria-label="Markera ${esc(x.name)} som taget">${icon("check",18)}</button><button class="ghost small" data-suppedit="${i}" aria-label="Redigera">✎</button></div>`;
  }).join("");
  const form = supplementEditing !== null ? (() => { const old = a[supplementEditing] || {}; return `<form id="supplement-form" class="supplement-form"><h3>${supplementEditing < 0 ? "Lägg till kosttillskott" : "Redigera kosttillskott"}</h3><label>Namn<input name="name" required maxlength="80" placeholder="T.ex. Kreatin" value="${esc(old.name || "")}"></label><label>Ikon<select name="icon"><option value="◇" ${!old.icon || old.icon==="◇"?"selected":""}>◇ Standard</option><option value="◈" ${old.icon==="◈"?"selected":""}>◈ Kapsel</option><option value="✦" ${old.icon==="✦"?"selected":""}>✦ Vitamin</option><option value="●" ${old.icon==="●"?"selected":""}>● Tablett</option><option value="♡" ${old.icon==="♡"?"selected":""}>♡ Hälsa</option></select></label><label>Dosering<input name="dose" maxlength="60" placeholder="T.ex. 5 g" value="${esc(old.dose || "")}"></label><label>Anteckning (valfri)<textarea name="note" rows="2" maxlength="300" placeholder="T.ex. tillsammans med frukost">${esc(old.note || "")}</textarea></label><div class="row"><button type="button" class="ghost" data-suppcancel>Avbryt</button><button type="submit">Spara</button></div></form>`; })() : "";
  return `<section class="card dailies" aria-label="Kosttillskott"><div class="dhead"><h2>Kosttillskott</h2><span class="muted small">${a.filter(x=>day().dailies["supp:"+x.id]).length} av ${a.length} tagna</span></div>${rows}${form}${supplementEditing === null ? `<button class="ghost small" data-suppadd style="margin-top:10px">+ Lägg till kosttillskott</button>` : ""}</section>`;
}
document.addEventListener("click", ev => {
  const t = ev.target.closest?.("[data-dclockstart],[data-dclockpause],[data-dclockskip],[data-dclockstop],[data-suppadd],[data-suppedit],[data-suppcheck],[data-suppcancel]");
  if (!t) return;
  ev.stopImmediatePropagation();
  const d = t.dataset;
  if (d.dclockstart) {
    const e = S.daily.find(x => x.id === d.dclockstart); if (!e) return;\n    if (typeof focusDailies !== "undefined" && focusDailies) focusDailies = false;
    const timed = /\\d+\\s*(?:s|sek)\\b/i.test(e.reps || "");
    const work = dailySeconds(e);
    dailyClock = {id:e.id,work,timed,reps:e.reps||"",rest:30,total:Math.max(1,+e.sets||1),set:1,phase:"work",end:Date.now()+work*1000,paused:false};
    clearInterval(dailyClockTick); dailyClockTick = setInterval(dailyClockRefresh,250);
  } else if (d.dclockpause !== undefined && dailyClock) {
    if (dailyClock.paused) {dailyClock.end = Date.now()+dailyClock.remaining;dailyClock.paused=false;}
    else {dailyClock.remaining=Math.max(0,dailyClock.end-Date.now());dailyClock.paused=true;}
  } else if (d.dclockskip !== undefined) dailyClockAdvance();
  else if (d.dclockstop !== undefined) {dailyClock=null;clearInterval(dailyClockTick);dailyClockTick=null;}
  else if (d.suppcheck) day().dailies["supp:"+d.suppcheck] = !day().dailies["supp:"+d.suppcheck];
  else if (d.suppcancel !== undefined) supplementEditing = null;
  else if (d.suppadd !== undefined || d.suppedit !== undefined) supplementEditing = d.suppedit !== undefined ? +d.suppedit : -1;
  save();render();
}, true);

document.addEventListener("submit", ev => {
  if (ev.target.id !== "supplement-form") return;
  ev.preventDefault(); ev.stopImmediatePropagation();
  const f = new FormData(ev.target), name = String(f.get("name") || "").trim();
  if (!name || supplementEditing === null) return;
  const a = S.supplements || (S.supplements=[]), i = supplementEditing;
  const item = {id:i >= 0 ? a[i].id : "s"+Date.now(),name,icon:String(f.get("icon")||"◇"),dose:String(f.get("dose")||"").trim(),note:String(f.get("note")||"").trim()};
  if (i >= 0) a[i] = item; else a.push(item);
  supplementEditing = null; save(); render();
}, true);

function dailiesCard(inPass, banded) {
  const n = S.daily.length, date = logDate(), L = day(date);
  if (dailyEditing) return `<div class="card"><div class="row between"><h2>Redigera dailys</h2><button class="small ghost" data-dedit>Klar</button></div>
    ${exRows("daily", S.daily, true)}
    </div>`;
  if (!n) return `<div class="card"><h2>Dailys</h2><div class="muted">Det du vill göra varje dag, till exempel plankan eller hängande benlyft.</div>
    <button style="margin-top:10px" data-openpick="daily">+ Lägg till daily</button></div>`;
  const done = S.daily.filter(e => dailyDone(date, e.id)).length, st = streakOf(allDailiesDone);
  const rows = S.daily.map(e => {
    const id = e.id, ok = dailyDone(date, id), its = streakOf(d => dailyDone(d, id)), v = L.dailies[id] || {};
    const sub = isRun(id) ? "" : EX[id].cat === "cardio" ? esc(e.reps || "") : `${e.sets} × ${esc(e.reps)}`;
    const check = `${icon("check", 18)}`;
    const ctl = isRun(id)
      ? `<label class="runf"><input class="run" type="number" inputmode="decimal" step="0.1" min="0" value="${v.km || ""}" data-run="${id}" data-f="km" aria-label="Kilometer"><span>km</span></label>
         <label class="runf"><input class="run" type="number" inputmode="numeric" min="0" value="${v.min || ""}" data-run="${id}" data-f="min" aria-label="Minuter"><span>min</span></label>
         <button class="done-btn big ${ok ? "on" : ""}" data-runcheck="${id}" aria-pressed="${ok}" aria-label="${esc(EX[id].name)}: ${ok ? "klar" : "fyll i km eller minuter"}">${check}</button>`
      : `<button class="done-btn big ${ok ? "on" : ""}" data-dcheck="${id}" aria-pressed="${ok}" aria-label="${esc(EX[id].name)} klar">${check}</button>`;
    return `<div class="daily ${ok ? "ok" : ""}">${thumb(id, "dt")}<div class="grow"><b>${esc(EX[id].name)}</b>
      ${sub ? `<span class="muted small">${sub}</span>` : ""}</div>${its > 1 ? `<span class="muted small streak">${its} dagar i rad</span>` : ""}${!ok && !isRun(id) ? `<button class="ghost small" data-dclockstart="${id}" aria-label="Starta ${esc(EX[id].name)}">▶ Starta</button>` : ""}${ctl}</div>`;
  }).join("");
  // Rubriken: antal klara, och ett tryck öppnar Redigera dailys (inte under passet)
  const head = `<div class="dhead"><h2>Dailys${st > 1 ? `<span class="muted small"> · alla ${st} dagar i rad</span>` : ""}</h2>
    ${inPass ? `<span class="muted small">${done} av ${n} klara</span>` : `<button class="ghost small" data-dedit aria-label="Redigera dailys, ${done} av ${n} klara">${done} av ${n} klara${icon("right", 16)}</button>`}</div>`;
  return `${dailyClock ? dailyClockView() : `<section class="card dailies" aria-label="Dailys">${head}${rows}</section>${inPass ? "" : supplementsCard()}`}`;
}

// Alla pass som knappar; används på Idag och under Pass
function dayPicker(selected) {
  return `<div class="daypick" role="tablist" aria-label="Välj pass" style="grid-template-columns:repeat(${S.plan.days.length <= 4 ? S.plan.days.length : Math.ceil(S.plan.days.length / 2)},minmax(0,1fr))">${S.plan.days.map((k, i) =>
    `<button role="tab" data-pick="${k.id}" class="${k.id === selected ? "on" : ""}" aria-selected="${k.id === selected}" aria-pressed="${k.id === selected}"><b>${esc(TYPES[k.type] && k.type !== "custom" ? TYPES[k.type].label : k.name)}</b><span>${isFixed() ? WD[S.plan.weekdays[i]] : `Pass ${i + 1}`}</span></button>`).join("")}</div>`;
}

const VIEWS = {
  upplagg() {
    if (S.setupDone) return upplaggView();
    if (welcomeLogin && sbEnabled && account.step !== "in") return loginView();
    if (account.step === "in" && !onb) onb = 1;
    return onb ? onbView() : welcomeView();
  },

  dailys() {
    const a=S.supplements||[], ex=S.daily||[], n=ex.filter(e=>dailyDone(logDate(),e.id)).length, sn=a.filter(x=>day().dailies["supp:"+x.id]).length;
    const total=ex.length+a.length, count=n+sn, pct=total?Math.round(count/total*100):0;
    const week=Array.from({length:7},(_,i)=>shift(TODAY,i-3)).map(d=>`<span class="${d===TODAY?"on":""}">${d.slice(-2)}</span>`).join("");
    const rows=ex.map(e=>{const ok=dailyDone(logDate(),e.id),timed=/\d+\s*(?:s|sek)\b/i.test(e.reps||"");return `<div class="daily">${thumb(e.id,"dt")}<div class="grow"><b>${esc(EX[e.id].name)}</b><span class="muted small">${e.sets} × ${esc(e.reps||"")}</span></div>${!ok?`<button class="ghost small" data-dclockstart="${e.id}">▶ Starta</button>`:""}<button class="done-btn big ${ok?"on":""}" data-dcheck="${e.id}">${icon("check",18)}</button></div>`;}).join("");
    return `<div class="dailys-page"><h1>Dailys</h1>${dailyClock?dailyClockView():`<div class="dailys-week">${week}</div><div class="dailys-progress"><div class="dailys-progress-ring" style="--p:${pct}%">${pct}%</div><div><b>${count} av ${total}</b><div class="muted small">klara idag</div></div></div><div class="dailys-summary"><span>Träning <b>${n}/${ex.length}</b></span><span>Kosttillskott <b>${sn}/${a.length}</b></span></div><div class="dailys-sectionhead"><h2>Övningar</h2><button class="ghost small" data-dedit>✎ ${dailyEditing?"Klar":"Redigera"}</button></div>${dailyEditing?exRows("daily",S.daily,true):rows}<button class="ghost small dailys-add" data-openpick="daily">+ Lägg till övning</button>${supplementsCard()}`}</div>`;
  },
  idag() {
    const m = macros(), e = eaten();
    m.kcal += burnedOn(TODAY);
    const t = todaysPass(), d = t.d, w = t.w, done = w && w.done;
    const started = !done && (t.active || (w && d.ex.some(x => ((w.sets[x.id]) || []).some(s => s && s.ok))));
    const passes = weekSummary(weekStart(TODAY)).passes, acts = actsOn(TODAY);
    const greet = done ? "Bra jobbat idag." : started ? "Fortsätt där du var." : t.rest ? (acts.length ? "Snyggt, aktiv vilodag." : "Vilodag idag.") : "Dags att köra.";
    const nDone = d.ex.filter(x => exDone(w, x)).length;
    const status = done ? `<span class="oktext">${icon("check", 14)}Genomfört idag</span>` : started ? `${nDone} av ${d.ex.length} övningar` : t.rest ? `Vila · nästa ${WD_LONG[weekdayOf(t.next)]}` : "Inte gjort än";
    const passTile = `<button class="htile passtile ${done ? "ok" : t.rest ? "" : "go"}" data-tab="pass" aria-label="${passLabel(t)}: ${esc(d.name)}, ${done ? "genomfört" : started ? "påbörjat" : t.rest ? "vilodag" : "inte gjort än"}. Till Träna">
        <span class="klabel ${done ? "oktext" : "accent"}">${passLabel(t)}</span>
        <span class="col"><b class="hname">${esc(d.name)}</b><span class="muted small">${status}</span>${acts.length ? `<span class="muted small">+ ${esc(acts.map(a => a.name).join(", "))}</span>` : ""}</span>
        <span class="hlink">Till Träna${icon("right", 14)}</span></button>`;
    const pct = m.kcal ? e.kcal / m.kcal : 0;
    const kcalTile = `<button class="htile kcaltile" data-go="kost" aria-label="Kalorier: ${tnum(e.kcal)} av ${tnum(m.kcal)}"><span class="klabel">Kalorier</span>
        <span class="ringbox">${ring(pct, 64, pct > 1.05 ? "over" : "")}<b>${Math.round(pct * 100)}%</b></span>
        <span><b class="hnum">${tnum(e.kcal)}</b><span class="muted small"> / ${tnum(m.kcal)}</span></span></button>`;
    const segs = Math.max(S.plan.count, passes);
    const week = `<section class="card weekrow" aria-label="Veckan: ${passes} av ${S.plan.count} pass"><span class="klabel">Veckan</span>
      <span class="wsegs" aria-hidden="true">${Array.from({ length: segs }, (_, i) => `<i class="${i < passes ? "on" : ""}"></i>`).join("")}</span>
      <b class="small">${passes} av ${S.plan.count} pass</b></section>`;
    const lw = letterWeekToShow();
    const letter = !lw ? "" : (() => {
      const c = weekSummary(lw), recs = weekRecords(lw).length;
      return `<div class="card homerow letter-card"><span class="hricon">${icon("mail", 22)}</span>
        <span class="grow"><b>Din vecka ${weekNo(lw)}</b><span class="muted small">${c.passes} av ${S.plan.count} pass${recs ? ` · ${recs} ${recs === 1 ? "nytt personbästa" : "nya personbästa"}` : ""}</span></span>
        <button class="small" data-letter="${lw}">Visa</button><button class="small ghost iconbtn" data-letterclose="${lw}" aria-label="Stäng sammanfattningen">${icon("close", 18)}</button></div>`;
    })();
    const today = new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
    return `<header class="homehead"><div class="brand"><img src="icons/icon-192-v2.png" alt=""><div class="ordbild"><span class="wordmark">DRIV</span><span class="slogan">Ditt mål. <em>Ditt driv.</em></span></div></div>
        <button class="gear avbtn" data-tab="profil" aria-label="Inställningar"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-1.87 1.87-.06-.06A1.7 1.7 0 0 0 16 18.4a1.7 1.7 0 0 0-1 1.56V21h-6v-1.04A1.7 1.7 0 0 0 8 18.4a1.7 1.7 0 0 0-1.87.34l-.06.06-1.87-1.87.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14H2v-4h1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.34-1.87L4.2 7.07 6.07 5.2l.06.06A1.7 1.7 0 0 0 8 5.6 1.7 1.7 0 0 0 9 4V3h6v1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.87-.34l.06-.06 1.87 1.87-.06.06A1.7 1.7 0 0 0 19.4 9 1.7 1.7 0 0 0 21 10h1v4h-1a1.7 1.7 0 0 0-1.6 1Z"/></svg></button></header>
      <div class="muted homedate">${cap(today)}</div>
      <h1 class="greet">${greet}</h1>
      <div class="htiles">${passTile}${kcalTile}</div>
      ${week}
      ${letter}
      ${accountNudge()}${installNudge()}
      ${friendsNudge()}
      ${friendsHome()}
      ${S.hideWeight ? "" : weighCardDue()}`;
  },

  pass() {
    if (editDate) return pastView();
    if (focus && !editing && !focus.suspended) return focusView();
    const d = currentPassDay();
    if (editing) return editView(d) + (exSheet != null && d.ex[exSheet] ? exSheetView(d) : "");
    if (passOpen && chosenDay) return passetView(d);
    return traningView();
  },

  kost: () => kostView(),

  recept: () => receptView(),

  historik: () => historikView(),

  vanner() { return friendsView(); },

  kommande: () => upcomingFeaturesPage(),

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
        <input type="file" id="importfile" accept="application/json" class="hidden">${installHelp()}
`;
    const friends = !sbEnabled ? "" : account.step !== "in" ? "Kräver ett konto"
      : social.profile ? `${social.friends.length ? `${social.friends.length} ${social.friends.length === 1 ? "vän" : "vänner"}` : "Inga vänner än"} · kod ${esc(social.profile.code)}` : "Välj ditt namn";
    const name = profName();
    const last = latestWeight();
    const group = (label, rows) => `<section class="pgroup" aria-label="${label}"><h2 class="klabel">${label}</h2><div class="card plist">${rows}</div></section>`;
    const pushSwitch = canPush() && account.step === "in"
      ? `<input type="checkbox" role="switch" class="switch" data-pushtoggle aria-label="Notiser" ${push.on ? "checked" : ""} ${push.busy ? "disabled" : ""}>` : "";
    const themeSeg = `<div class="tseg" role="radiogroup" aria-label="Utseende">${Object.entries(THEMES).map(([k, n]) =>
      `<button role="radio" data-theme-set="${k}" class="${themeNow() === k ? "on" : ""}" aria-checked="${themeNow() === k}" aria-pressed="${themeNow() === k}">${k === "auto" ? "Auto" : n}</button>`).join("")}</div>`;
    return `<button class="backbtn" data-tab="${profBack}">${icon("left", 18)}${{ idag: "Hem", pass: "Träna", kost: "Kost", historik: "Historik" }[profBack] || "Tillbaka"}</button>
      <h1 class="ptitle">Inställningar</h1>
      <section class="card pcard" aria-label="Du"><div class="row"><span class="avatar" aria-hidden="true">${esc(name.slice(0, 1).toUpperCase())}</span>
          <div class="grow col"><b>${esc(name)}</b><span class="muted small">${cloud.status === "cloud" ? "Sparas på ditt konto" : "Sparas på den här enheten"}</span></div>
          <button class="small" data-editprof>Ändra</button></div>
        <div class="pstats"><div><b>${S.plan.count}</b><span>pass i veckan</span></div><div><b>${tnum(m.kcal)}</b><span>kcal om dagen</span></div>
          <div><b>${fmtNum(last ? last.kg : p.weight)}</b><span>kg senast</span></div></div></section>
      ${group("Träning", `${profRow("vila", "timer", "Vilotimer", rs.on ? `På · ${rs.compound} / ${rs.iso} sek` : "Av", `
          <label class="row"><input type="checkbox" data-resttoggle ${rs.on ? "checked" : ""}><span>Starta en vilotimer när jag bockar av ett set</span></label>
          <div class="grid2" style="margin-top:10px">
            <label class="field">Basövningar (sek)<input type="number" inputmode="numeric" id="restcompound" value="${rs.compound}"></label>
            <label class="field">Isolering och mage (sek)<input type="number" inputmode="numeric" id="restiso" value="${rs.iso}"></label></div>`)}
        ${profRow("aktiviteter", "aktivitet", "Annan träning", [S.actCount !== false ? "Räknas som pass" : "", S.actKcal ? "kcal läggs till" : ""].filter(Boolean).join(" · ") || "Padel, vandring och annat", `
          <label class="row"><input type="checkbox" data-actcount ${S.actCount !== false ? "checked" : ""}><span>En aktivitet på minst 45 minuter räknas som ett pass i veckan</span></label>
          <label class="row" style="margin-top:8px"><input type="checkbox" data-actkcal ${S.actKcal ? "checked" : ""}><span>Lägg till förbrända kcal i dagens kalorimål</span></label>
          <div class="muted small" style="margin-top:6px">Förbrända kcal är en uppskattning efter aktivitet, tid och din vikt. Den blir lätt för hög, därför är det avstängt från början.</div>`)}`)}
      ${group("Kost och kropp", `${profRow("kalori", "kost", "Kalorimål", `${tnum(m.kcal)} kcal · ${GOALS[p.goal][0].split(" (")[0]}`, `${profileFields(p)}
          <div class="muted" style="margin-top:10px">Underhåll (TDEE): ${tdee(p)} kcal · Mål: ${m.kcal} kcal</div>
          <div class="muted">Protein ${m.protein} g · Fett ${m.fat} g · Kolhydrater ${m.carbs} g</div>
          <label class="field" style="margin-top:10px">Eget kalorimål (lämna tomt för beräknat)
            <input type="number" inputmode="numeric" id="override" value="${S.kcalOverride || ""}" placeholder="${m.kcal}"></label>`)}
        ${profRow("vikt", "vikt", "Vikt", S.hideWeight ? "Dold" : `Vägning varje ${WD_LONG[weighDay()]}`, `
          <label class="row"><input type="checkbox" data-showweight ${S.hideWeight ? "" : "checked"}><span>Visa vikt på Hem och i Historik</span></label>
          <label class="field" style="margin-top:8px">Vägningsdag<select data-weighday>${WD.map((w, i) => `<option value="${i}" ${weighDay() === i ? "selected" : ""}>${WD_LONG[i].replace(/^./, c => c.toUpperCase())}</option>`).join("")}</select></label>
          <div class="muted small" style="margin-top:4px">Döljer du vikten används vikten i Kalorimål, och sparade vägningar finns kvar.</div>`)}`)}
      ${group(sbEnabled ? "Vänner och notiser" : "Notiser", `${sbEnabled ? `<div class="prow" id="p-vanner"><div class="prow-line"><button class="prow-head" data-tab="vanner"><span class="pic">${icon("vanner", 20)}</span><span class="grow"><b>Vänner</b>
          <span class="muted small">${friends}</span></span><span class="chev">${icon("right", 18)}</span></button></div></div>` : ""}
        ${profRow("notiser", "bell", "Notiser", pushSummary(), pushBody(), pushSwitch)}
        ${S.daily.length ? profRow("paminnelse", "kalender", "Påminnelse i kalendern", r ? `För dina dailys · kl. ${esc(r.time)}` : "För dina dailys · ingen vald", reminderCard()) : ""}`)}
      ${group("Appen", `${profRow("utseende", "utseende", "Utseende", "", null, themeSeg)}
        ${profRow("konto", "data", sbEnabled ? "Konto och data" : "Data", account.step === "in" ? esc(account.email) : sbEnabled ? "Inloggning, exportera, importera" : "Exportera, importera",
          `${accountCard()}${data}`)}
        <div class="prow"><div class="prow-line"><button class="prow-head" data-tab="kommande"><span class="pic">${icon("idea", 20)}</span><span class="grow"><b>Kommande funktioner</b>
          <span class="muted small">Se vad som är på gång i Driv</span></span><span class="chev">${icon("right", 18)}</span></button></div></div>
        ${sbEnabled ? profRow("tyck", "chat", "Tyck till", "Vad saknas, vad är krångligt?", feedbackCard()) : ""}
        ${isDevAccount() ? `<div class="prow"><div class="prow-line"><button class="prow-head" data-opentest><span class="pic">${icon("test", 20)}</span><span class="grow"><b>Testläge</b>
          <span class="muted small">Egen data som inte rör ditt konto</span></span><span class="chev">${icon("right", 18)}</span></button></div></div>` : ""}`)}
      ${account.step === "in" ? `<button class="wide plogout" data-signout>${icon("logout", 18)}Logga ut</button>` : ""}`;
  },
};

// Logga i efterhand (från Historik): välj pass och fyll i alla set på en gång
function pastView() {
  const d = currentPassDay();
  const w = workoutOn(logDate(), d.id);
  const Day = dateLabel(editDate).replace(/^./, c => c.toUpperCase());
  return `<button class="small ghost backlink" data-editdone>‹ Tillbaka till Historik</button>
      <h1>Logga i efterhand</h1><div class="pastsub">${Day} · vecka ${weekNo(editDate)}</div>
      <div class="muted small pastnote">Ett pass du redan har gjort. Inget startas, fyll bara i vad du lyfte.</div>
      ${dayPicker(d && d.id)}
      ${!d.ex.length ? `<div class="card muted">Passet har inga övningar än.</div>`
        : `${pastLog(d, w)}
          ${w && w.done ? `<div class="card done-card"><b>Passet är sparat för ${dateLabel(editDate)}.</b>
                <button class="small" style="margin-top:8px" data-finish="${d.id}">Öppna passet igen</button></div>`
            : `<button class="primary wide bigbtn" data-finish="${d.id}">Spara och gå tillbaka till Historik</button>
               <div class="muted small finish-note">Passet sparas på ${dateLabel(editDate)}.</div>`}`}
      ${actsCard(logDate(), "Annan träning den här dagen")}`;
}

// Utseende: automatiskt (som telefonen), ljust eller mörkt. Sparas per enhet.
const THEMES = { auto: "Automatiskt", light: "Ljust", dark: "Mörkt" };
// Mörkt är standard; Automatiskt följer telefonen
function themeNow() { try { return localStorage.getItem("driv-theme") || "dark"; } catch (e) { return "dark"; } }
function setTheme(t) {
  try { localStorage.setItem("driv-theme", t); } catch (e) {}
  if (t === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
}

let setupFrom = null;

// Profilen är en lista där en rad i taget kan fällas ut
let profOpen = null;
// Testläget nås från profilen för utvecklarens konto. Bara en hash av e-posten står i koden.
const fnvHash = str => { let h = 0x811c9dc5; for (const b of new TextEncoder().encode(str)) h = Math.imul((h ^ b) >>> 0, 0x01000193) >>> 0; return h.toString(16).padStart(8, "0"); };
const isDevAccount = () => account.step === "in" && fnvHash(String(account.email || "").trim().toLowerCase()) === "b24ae646";
// Namnet i profilen: det vännerna ser, annars det sparade, annars början på e-posten
const profName = () => (social.profile && social.profile.name) || S.name || (account.step === "in" ? account.email.split("@")[0] : "Du");
// body null: raden fälls inte ut (valet ligger direkt i raden). extra: en kontroll till höger, t.ex. en strömbrytare.
function profRow(id, ic, title, summary, body, extra = "") {
  const open = profOpen === id || body === null;
  const inner = `<span class="pic">${icon(ic, 20)}</span><span class="grow"><b>${title}</b>${summary ? `<span class="muted small">${summary}</span>` : ""}</span>`;
  const head = body === null ? `<div class="prow-head">${inner}</div>`
    : `<button class="prow-head" data-psec="${id}" aria-expanded="${open}">${inner}${extra ? "" : `<span class="chev">${icon("right", 18)}</span>`}</button>`;
  return `<div class="prow ${open ? "open" : ""}" id="p-${id}"><div class="prow-line">${head}${extra}</div>
    ${open && body ? `<div class="prow-body">${body}</div>` : ""}</div>`;
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

function profileFields(p, noGoal) {
  const sel = (f, opts) => `<select data-prof="${f}">${opts.map(([v, l]) => `<option value="${v}" ${String(p[f]) === String(v) ? "selected" : ""}>${l}</option>`).join("")}</select>`;
  const num = (f, l) => `<label class="field">${l}<input type="number" inputmode="${f === "age" ? "numeric" : "decimal"}" step="${f === "age" ? 1 : 0.1}" data-prof="${f}" value="${p[f]}"></label>`;
  return `<div class="grid2"><label class="field">Kön${sel("sex", [["m", "Man"], ["f", "Kvinna"]])}</label>${num("age", "Ålder")}
    ${num("height", "Längd (cm)")}${num("weight", "Vikt (kg)")}</div>
    <label class="field" style="margin-top:10px">Aktivitet${sel("activity", ACTIVITY)}</label>
    ${noGoal ? "" : `<label class="field" style="margin-top:10px">Mål${sel("goal", Object.entries(GOALS).map(([k, v]) => [k, v[0]]))}</label>`}`;
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
      <div class="grow"><b>${esc(EX[e.id].name)}</b>${target === "daily" ? "" : muscleLine(e.id)}${EX[e.id].cat === "cardio" ? `<div class="muted">${esc(e.reps || EX[e.id].muscles)}</div>`
        : `<div class="row" style="margin-top:4px">
        <input type="number" inputmode="numeric" min="1" style="width:52px" value="${e.sets}" data-ed="${i}" data-t="${target}" data-f="sets" aria-label="Antal set"><span class="muted">×</span>
        <input type="text" inputmode="numeric" style="width:76px" value="${esc(e.reps)}" data-ed="${i}" data-t="${target}" data-f="reps" aria-label="Reps"></div>`}</div>
      ${withOrder ? `<div class="col"><button class="small ghost" data-mv="-1" data-t="${target}" data-idx="${i}" ${i ? "" : "disabled"} aria-label="Flytta upp">↑</button>
        <button class="small ghost" data-mv="1" data-t="${target}" data-idx="${i}" ${i < list.length - 1 ? "" : "disabled"} aria-label="Flytta ned">↓</button></div>` : ""}
      <button class="small" data-swap="${target}" data-idx="${i}">Byt</button>
      <button class="small ghost" data-xdel="${target}" data-idx="${i}" aria-label="Ta bort">${icon("close", 18)}</button></div>
      ${withOrder && target !== "daily" && i < list.length - 1 ? `<button class="sslink ${e.ss ? "on" : ""}" data-ss="${target}" data-idx="${i}" aria-pressed="${!!e.ss}">${e.ss
        ? `Superset med ${esc(EX[list[i + 1].id].name)} <span class="muted">· tryck för att dela</span>` : "＋ Superset med nästa"}</button>` : ""}`).join("") +
    `<button class="small" style="margin-top:8px" data-openpick="${target}">+ Lägg till ${target === "daily" ? "daily" : "övning"}</button>`;
}

// ---------- Muskelkartan ----------
// Vilka muskelgrupper varje passtyp ska träna. Saknas typen (eget pass) visas inget kort.
const TYPE_TARGETS = {
  push: "brost axlar triceps", cpush: "brost axlar triceps", pull: "rygg biceps", cpull: "rygg biceps",
  legs: "framsida_lar baksida_lar sate vader", lower: "framsida_lar baksida_lar sate vader",
  clegs: "framsida_lar baksida_lar sate mage", upper: "brost rygg axlar biceps triceps",
  full: "brost rygg axlar framsida_lar baksida_lar", cfull: "brost rygg axlar framsida_lar baksida_lar",
  hfull: "brost rygg axlar framsida_lar baksida_lar", glutes: "sate baksida_lar framsida_lar",
  chest: "brost triceps", back: "rygg biceps", shoulders: "axlar", arms: "biceps triceps underarmar",
  str5a: "framsida_lar brost rygg", str5b: "framsida_lar axlar rygg", sq: "framsida_lar sate", bp: "brost triceps",
  dl: "baksida_lar sate rygg", chestback: "brost rygg", shoulderarms: "axlar biceps triceps",
};
const targetsOf = type => (TYPE_TARGETS[type] || "").split(" ").filter(Boolean);
// Med: någon övning har muskeln som huvudmuskel. Delvis: bara som hjälpmuskel. Saknas: ingen alls.
function muscleStatus(type, list) {
  return targetsOf(type).map(key => {
    const prim = list.filter(e => EX[e.id] && (EX[e.id].prim || []).includes(key)).length;
    const sec = list.filter(e => EX[e.id] && (EX[e.id].sec || []).includes(key)).length;
    return { key, label: MUSCLE_GROUPS[key], state: prim ? "ok" : sec ? "part" : "miss", prim };
  });
}
const joinOch = xs => xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} och ${xs[xs.length - 1]}`;
const capFirst = s => s.charAt(0).toUpperCase() + s.slice(1);
function muscleAdvice(type, status) {
  const red = status.filter(s => s.state === "miss").map(s => s.label.toLowerCase());
  const part = status.filter(s => s.state === "part").map(s => s.label.toLowerCase());
  if (red.length && part.length) return `Lägg till en övning för ${joinOch(red)}. ${capFirst(joinOch(part))} tränas bara indirekt.`;
  if (red.length) return `Lägg till en övning för ${joinOch(red)}.`;
  if (part.length) return `${capFirst(joinOch(part))} tränas bara indirekt. En egen övning ger mer effekt.`;
  return `Bra! Passet täcker allt ${TYPES[type].label} ska träna.`;
}
// Högst tre övningar som inte finns i passet och har en röd eller orange muskel som huvudmuskel; röda först.
// Övningarna ska passa passet: kroppsvikt i calisthenics, hantlar eller kroppsvikt i hantelpassen.
function muscleSuggestions(type, list, status) {
  const need = [...status.filter(s => s.state === "miss"), ...status.filter(s => s.state === "part")].map(s => s.key);
  if (!need.length) return [];
  const have = new Set(list.map(e => e.id)), cats = TYPES[type].cats;
  const fits = id => cats.includes("bw") ? !!EX[id].bw : type === "hfull" ? ["db", "bw"].includes(gearGroup(id)) : true;
  const rank = id => Math.min(...EX[id].prim.map(m => need.includes(m) ? need.indexOf(m) : 99));
  return Object.keys(EX).filter(id => EX[id].prim && !have.has(id) && fits(id) && rank(id) < 99)
    .map((id, i) => ({ id, r: rank(id), i })).sort((a, b) => a.r - b.r || a.i - b.i).slice(0, 3).map(x => x.id);
}
// Gubben fram och bak: bara passets målmuskler färgas, resten och huvudet är neutralt grått
const FIG_FRONT = [
  ["axlar", '<ellipse cx="29" cy="41" rx="8" ry="8.5"/><ellipse cx="71" cy="41" rx="8" ry="8.5"/>'],
  ["brost", '<path d="M49 33 L37 33 Q31 35 32 44 Q34 54 43 55 Q49 55 49 50 Z"/><path d="M51 33 L63 33 Q69 35 68 44 Q66 54 57 55 Q51 55 51 50 Z"/>'],
  ["biceps", '<ellipse cx="24" cy="61" rx="5" ry="10"/><ellipse cx="76" cy="61" rx="5" ry="10"/>'],
  ["underarmar", '<ellipse cx="21" cy="85" rx="4.5" ry="11"/><ellipse cx="79" cy="85" rx="4.5" ry="11"/>'],
  ["mage", '<rect x="43" y="58" width="14" height="36" rx="6"/><path d="M41 58 Q36 70 38 92 L41 92 Z"/><path d="M59 58 Q64 70 62 92 L59 92 Z"/>'],
  ["framsida_lar", '<ellipse cx="42" cy="130" rx="8" ry="22"/><ellipse cx="58" cy="130" rx="8" ry="22"/>'],
  ["", '<ellipse cx="42" cy="174" rx="5" ry="14"/><ellipse cx="58" cy="174" rx="5" ry="14"/>'],
];
const FIG_BACK = [
  ["rygg", '<path d="M50 29 L39 36 L50 47 L61 36 Z"/><path d="M48 49 Q37 47 35 58 Q37 71 48 76 Z"/><path d="M52 49 Q63 47 65 58 Q63 71 52 76 Z"/><rect x="45" y="77" width="10" height="16" rx="4"/>'],
  ["axlar", '<ellipse cx="29" cy="41" rx="8" ry="8.5"/><ellipse cx="71" cy="41" rx="8" ry="8.5"/>'],
  ["triceps", '<ellipse cx="24" cy="61" rx="5" ry="10"/><ellipse cx="76" cy="61" rx="5" ry="10"/>'],
  ["underarmar", '<ellipse cx="21" cy="85" rx="4.5" ry="11"/><ellipse cx="79" cy="85" rx="4.5" ry="11"/>'],
  ["sate", '<ellipse cx="42" cy="104" rx="8" ry="8"/><ellipse cx="58" cy="104" rx="8" ry="8"/>'],
  ["baksida_lar", '<ellipse cx="42" cy="136" rx="7" ry="18"/><ellipse cx="58" cy="136" rx="7" ry="18"/>'],
  ["vader", '<ellipse cx="42" cy="174" rx="6" ry="13"/><ellipse cx="58" cy="174" rx="6" ry="13"/>'],
];
const STATE_WORD = { ok: "med", part: "delvis", miss: "saknas" };
function muscleFigure(parts, status, side) {
  const st = Object.fromEntries(status.map(s => [s.key, s.state]));
  const inFig = new Set(parts.map(([k]) => k)), shown = status.map(s => s.key).filter(k => inFig.has(k));
  const label = `${side}: ${shown.length ? shown.map(k => `${MUSCLE_GROUPS[k].toLowerCase()} ${STATE_WORD[st[k]]}`).join(", ") : "inga muskler i passet"}`;
  return `<figure class="mfig"><svg width="60" height="120" viewBox="0 0 100 200" role="img" aria-label="${label}">
    <g class="m-head"><circle cx="50" cy="14" r="9"/><rect x="46" y="23" width="8" height="7" rx="2"/></g>
    ${parts.map(([k, shapes]) => `<g class="m-${st[k] || "off"}">${shapes}</g>`).join("")}</svg><figcaption>${side === "Framsida" ? "Fram" : "Bak"}</figcaption></figure>`;
}
const STATE_ICON = { ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', part: '<path d="M6 12h12"/>', miss: '<path d="M12 6v7M12 18v.5"/>' };
// Kortet ovanför övningslistan när man ändrar ett pass
function muscleCard(target, type, list) {
  if (!TYPES[type] || !targetsOf(type).length) return "";
  const status = muscleStatus(type, list), sugg = muscleSuggestions(type, list, status), allOk = status.every(s => s.state === "ok");
  const detail = s => s.state === "ok" ? `${s.prim} ${s.prim === 1 ? "övning" : "övningar"}` : s.state === "part" ? "Delvis, bara indirekt" : "Saknas";
  return `<section class="card mcard" aria-label="Muskler i passet">
    <div class="mtop"><div class="mfigs">${muscleFigure(FIG_FRONT, status, "Framsida")}${muscleFigure(FIG_BACK, status, "Baksida")}</div>
      <div class="mlist"><div class="klabel">${esc(TYPES[type].label)} tränar</div>
        ${status.map(s => `<div class="mrow"><span class="mdot ${s.state}" aria-hidden="true"><svg viewBox="0 0 24 24">${STATE_ICON[s.state]}</svg></span>
          <span class="grow"><b>${s.label}</b><span class="mdet ${s.state}">${detail(s)}</span></span></div>`).join("")}</div></div>
    <div class="mlegend" aria-hidden="true"><span><i class="mdot ok"></i>Med</span><span><i class="mdot part"></i>Delvis</span><span><i class="mdot miss"></i>Saknas</span></div>
    <div class="mrec ${allOk ? "ok" : ""}">${icon("idea", 18)}<span>${muscleAdvice(type, status)}</span></div>
    ${sugg.length ? `<div class="msugg">${sugg.map(id => `<button class="small" data-mcadd="${id}" data-t="${target}">${icon("plus", 14)}${esc(EX[id].name)}</button>`).join("")}</div>` : ""}
  </section>`;
}
// Musklerna under övningens namn: huvudmuskeln i fet stil, hjälpmusklerna grå
function muscleLine(id) {
  const e = EX[id];
  if (!e || !e.prim) return "";
  return `<div class="mline"><b>${e.prim.map(k => MUSCLE_GROUPS[k]).join(", ")}</b>${e.sec.length ? ` · ${e.sec.map(k => MUSCLE_GROUPS[k].toLowerCase()).join(", ")}` : ""}</div>`;
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
  const plus = weekPlus(ws), recs = weekRecords(ws), tried = plus.plus + plus.same + plus.minus;
  const wNow = weekAvgWeight(ws), wPrev = weekAvgWeight(prevWs);
  const goalPasses = S.plan.count;
  const headline = cur.passes >= goalPasses ? "Alla pass klara – starkt jobbat!"
    : cur.passes ? `${cur.passes} av ${goalPasses} pass. Varje pass räknas.` : "Ingen träning loggad den här veckan. Ny chans nu!";
  // Fyra siffror i rutnät, sedan personbästa som en lista
  const stat = (label, value, extra = "") => `<div class="lstat"><div class="klabel">${label}</div><div class="lbig">${value}</div>${extra}</div>`;
  const stats = [
    stat("Pass", `${cur.passes} av ${goalPasses}`, prev.passes || cur.passes ? deltaBadge(cur.passes - prev.passes, "mot förra") : ""),
    S.daily.length ? stat("Alla dailys", `${cur.dailies} av 7 dagar`) : "",
    !S.hideWeight && wNow != null ? stat("Vikt, snitt", `${fmtNum(wNow)} kg`, wPrev != null ? weightBadge(wNow - wPrev) : "") : "",
    cur.kcal ? stat("Kalorier per dag", tnum(cur.kcal), `<span class="muted small">mål ${tnum(macros().kcal)}</span>`) : "",
    cur.km || prev.km ? stat("Löpning", `${fmtNum(cur.km)} km`) : "",
  ].filter(Boolean).slice(0, 4).join("");
  return `<div class="letter">
    <div class="muted small">Vecka ${weekNo(ws)} · ${+ws.slice(8)}/${+ws.slice(5, 7)} – ${+shift(ws, 6).slice(8)}/${+shift(ws, 6).slice(5, 7)}</div>
    <h3>${headline}</h3>
    <div class="lstats">${stats}</div>
    ${tried ? `<div class="lline"><b>${plus.plus} av ${tried}</b> övningar gick framåt mot förra veckan</div>` : ""}
    ${recs.length ? `<h4 class="sheet-sub">Nya personbästa</h4>
      ${recs.slice(0, 5).map(r => `<div class="lpb"><span class="grow">${esc(EX[r.id].name)}</span><b>${fmtSet(r.best, r.id)}</b></div>`).join("")}
      ${recs.length > 5 ? `<div class="muted small">och ${recs.length - 5} till</div>` : ""}` : ""}
    ${plusStreak() > 1 ? `<div class="letter-foot">${plusStreak()} plusveckor i rad. Håll i!</div>` : ""}
  </div>`;
}
// På söndagar visas den här veckan, på måndagar förra veckan, tills man stänger brevet
function letterWeekToShow() {
  const wd = weekdayOf(TODAY), ws = wd === 6 ? weekStart(TODAY) : wd === 0 ? shift(weekStart(TODAY), -7) : null;
  if (!ws || S.letterSeen === ws) return null;
  const sum = weekSummary(ws);
  return sum.passes || sum.dailies || sum.kcal || Object.keys(S.log).some(d => d >= ws && d < shift(ws, 7)) ? ws : null;
}

// Konfetti runt bocken när passet är klart. Samma mönster varje gång (fast frö).
function confetti() {
  const cols = ["#ff6b1a", "#6fd99a", "#fbbf24", "#5e95ff", "#ff8a47", "#b17cff"];
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const parts = [];
  for (let i = 0; i < 28; i++) {
    const a = rnd() * Math.PI * 2, r = 46 + rnd() * 64, x = (160 + Math.cos(a) * r * 1.5).toFixed(1), y = (64 + Math.sin(a) * r * 0.7).toFixed(1);
    const c = cols[i % cols.length], rot = Math.round(rnd() * 180), dl = (rnd() * 0.25).toFixed(2);
    parts.push(i % 3 ? `<rect x="${x}" y="${y}" width="8" height="3.5" rx="1.5" fill="${c}" transform="rotate(${rot} ${x} ${y})" style="animation-delay:${dl}s"/>`
      : `<circle cx="${x}" cy="${y}" r="2.6" fill="${c}" style="animation-delay:${dl}s"/>`);
  }
  return `<svg class="confetti" viewBox="0 0 320 130" aria-hidden="true">${parts.join("")}</svg>`;
}

// Skärmen när ett pass är klart: tid, set, nya personbästa och total vikt, och delning med vänner
function passDoneView() {
  const d = dayById(passDone.dayId), date = passDone.date;
  if (!d) { passDone = null; return VIEWS[tab](); }
  const w = workoutOn(date, d.id);
  const okSets = w ? Object.values(w.sets).flatMap(a => a.filter(s => s && s.ok)) : [];
  const vol = okSets.reduce((a, s) => a + (+s.kg || 0) * (+s.reps || 0), 0);
  const min = w && w.start && w.end ? Math.max(1, Math.round((w.end - w.start) / 60000)) : null;
  const prs = d.ex.map(x => { const t = topSet(setsOn(date, x.id)), b = bestBefore(x.id, date); return t && b && betterSet(t, b) ? { id: x.id, t, b } : null; }).filter(Boolean);
  const passes = weekSummary(weekStart(date)).passes;
  const stat = (v, l) => `<div><b>${v}</b><span class="muted small">${l}</span></div>`;
  const stats = [min != null ? stat(min, min === 1 ? "minut" : "minuter") : "", stat(okSets.length, "set"), stat(prs.length, prs.length === 1 ? "nytt PB" : "nya PB"),
    vol ? stat(vol >= 1000 ? `${fmtNum(Math.round(vol / 100) / 10)} t` : `${Math.round(vol)} kg`, "total vikt") : ""].filter(Boolean);
  const gain = p => { const dk = (+p.t.kg || 0) - (+p.b.kg || 0); return dk > 0 ? `+${fmtNum(dk)} kg` : `+${(+p.t.reps || 0) - (+p.b.reps || 0)} ${repUnit(p.id)}`; };
  const when = parse(date).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
  const sharing = typeof social !== "undefined" && social.profile && social.profile.sharing;
  return `<div class="passdone">
    <div class="pdtop">${confetti()}<span class="pdcheck" aria-hidden="true">${icon("check", 36)}</span><h1>Passet klart!</h1>
      <span class="muted">${esc(d.name)} · ${when}</span><span class="muted small">${passes} av ${S.plan.count} pass den här veckan</span></div>
    <section class="pdstats ${stats.length % 2 ? "odd" : ""}" aria-label="Passet">${stats.join("")}</section>
    ${prs.length ? `<section class="card pdpbs" aria-label="Nya personbästa">${prs.map(p => `<div class="pdpb"><span class="grow col"><b>${esc(EX[p.id].name)}</b>
        <span class="muted small">${fmtSet2({ kg: +p.t.kg || 0, reps: +p.t.reps || 0 }, p.id)}</span></span><span class="pbtag">PB ${gain(p)}</span></div>`).join("")}</section>` : ""}
    ${sharing ? `<label class="card pdshare"><span class="grow col"><b>Dela med vänner</b><span class="muted small">De ser att du kört ${esc(d.name)}, inga vikter</span></span>
      <input type="checkbox" role="switch" class="switch" data-pdshare ${passDone.shared === false ? "" : "checked"} aria-label="Dela passet med vänner"></label>` : ""}
    ${inviteCard()}
    <div class="pdspace"></div>
    <button class="wide bigbtn lightbtn" data-passdoneclose>Klar</button></div>`;
}

function renderModal() {
  if (modal.cancelPass) return cancelPassSheet(modal.cancelPass);
  if (modal.letter) {
    return `<div class="overlay" data-close><div class="sheet"><div class="row between"><h2>Din vecka</h2><button class="small ghost" data-close>${icon("close", 18)}</button></div>
      ${weekLetter(modal.letter)}</div></div>`;
  }
  if (modal.chart) {
    return `<div class="overlay" data-close><div class="sheet"><div class="row between"><h2>${esc(EX[modal.chart].name)}</h2><button class="small ghost" data-close>${icon("close", 18)}</button></div>
      <div class="muted">Bästa set per vecka, senaste 12 veckorna</div>${chartModal(modal.chart)}</div></div>`;
  }
  if (modal.prof) {
    // Ändra profilen i en ruta i stället för att hoppa ned i listan
    return `<div class="overlay" data-close><div class="sheet profsheet"><div class="row between"><h2>Din profil</h2><button class="small ghost iconbtn" data-close aria-label="Stäng">${icon("close", 18)}</button></div>
      <div class="row"><span class="avatar" aria-hidden="true">${esc(profName().slice(0, 1).toUpperCase())}</span>
        <label class="field grow">Namn<input id="pname" maxlength="40" autocomplete="given-name" value="${esc(profName() === "Du" ? "" : profName())}" placeholder="Ditt namn"></label></div>
      ${sbEnabled ? `<div class="muted small" style="margin-top:6px">Namnet syns för dina vänner.</div>` : ""}
      <button class="primary wide" style="margin-top:12px" data-pnamesave ${social.busy ? "disabled" : ""}>Spara</button>
      ${sbEnabled ? `<h3 class="klabel" style="margin-top:20px">Konto</h3>${accountBody()}` : ""}</div></div>`;
  }
  if (modal.info) {
    const e = EX[modal.info];
    return `<div class="overlay" data-close><div class="sheet">${modal.back ? `<button class="small ghost backlink" data-infoback>‹ Tillbaka till övningarna</button>` : ""}
      <div class="row between"><h2>${esc(e.name)}</h2><button class="small ghost iconbtn" data-close aria-label="Stäng">${icon("close", 18)}</button></div>
      ${figure(modal.info, "big", true)}<div class="muted">${esc(e.muscles)}</div>
      ${gearOf(modal.info) ? `<div class="gearbox"><b>${GEAR[gearOf(modal.info)][0]}</b><div>${GEAR[gearOf(modal.info)][1]}</div></div>` : ""}
      <ol>${e.cues.map(c => `<li>${esc(c)}</li>`).join("")}</ol>
      ${mwUrl(modal.info) ? `<a class="mwlink" href="${mwUrl(modal.info)}" target="_blank" rel="noopener">${MW[modal.info].startsWith("exercises/") ? "Liknande övningar på MuscleWiki" : "Mer om övningen på MuscleWiki"} <span aria-hidden="true">↗</span></a>` : ""}</div></div>`;
  }
  const list = exList(modal.pick);
  const replacing = modal.replace != null ? list[modal.replace] : null;
  const forDaily = modal.pick === "daily";
  // Kroppsdelar; kondition bara för dailys. Startar där man troligen letar.
  const areas = Object.keys(AREAS).filter(a => forDaily || a !== "kondition");
  if (!modal.area) {
    const t = forDaily ? null : (modal.pick.startsWith("draft:") ? draft.days[+modal.pick.slice(6)] : dayById(modal.pick)).type;
    modal.area = replacing ? areaOf(replacing.id) : forDaily ? "mage" : { push: "brost", cpush: "brost", pull: "rygg", cpull: "rygg", legs: "ben", lower: "ben", clegs: "ben" }[t] || "alla";
  }
  modal.gear = modal.gear || "alla";
  const have = list.map(e => e.id);
  const ids = Object.keys(EX).filter(id => forDaily || EX[id].cat !== "cardio");
  const row = id => `<div class="pick ${have.includes(id) ? "have" : ""}" data-area="${areaOf(id)}" data-gear="${gearGroup(id)}"
      data-q="${esc(norm(EX[id].name + " " + EX[id].muscles + " " + AREAS[areaOf(id)] + " " + (gearOf(id) ? GEAR[gearOf(id)][0] : "")))}">
      ${thumb(id, "pt")}<div class="grow"><div class="pname">${esc(EX[id].name)}</div><div class="muted small">${esc(EX[id].muscles)}</div></div>
      ${have.includes(id) ? `<span class="pickhave" aria-label="Finns redan">${icon("check", 18)}</span>`
        : `<button class="pickadd" data-add="${id}" aria-label="${replacing ? "Välj" : "Lägg till"} ${esc(EX[id].name)}">${icon(replacing ? "right" : "plus", 20)}</button>`}</div>`;
  return `<div class="overlay" data-close><div class="sheet picksheet"><div class="row between">
      <h2>${replacing ? `Byt ut ${esc(EX[replacing.id].name)}` : forDaily ? "Lägg till daily" : "Lägg till övning"}</h2><button class="small ghost iconbtn" data-close aria-label="Stäng">${icon("close", 18)}</button></div>
    ${modal.today != null ? `<div class="tseg pswapwhen" role="radiogroup" aria-label="Hur länge">${[[true, "Bara i dag"], [false, "Även framåt"]].map(([v, n]) =>
      `<button role="radio" data-swapwhen="${v}" class="${modal.today === v ? "on" : ""}" aria-checked="${modal.today === v}">${n}</button>`).join("")}</div>` : ""}
    <div class="psearch">${icon("search", 18)}<input id="exsearch" type="search" placeholder="Sök övning eller muskel" value="${esc(modal.q || "")}" autocomplete="off" aria-label="Sök övning"></div>
    <div class="pfilters">
      <label class="pfilter ${modal.area !== "alla" ? "on" : ""}"><span class="sr">Kroppsdel</span><select data-areasel aria-label="Kroppsdel">
        <option value="alla">Alla kroppsdelar</option>${areas.map(a => `<option value="${a}" ${modal.area === a ? "selected" : ""}>${AREAS[a]}</option>`).join("")}</select>${icon("down", 16)}</label>
      <label class="pfilter ${modal.gear !== "alla" ? "on" : ""}"><span class="sr">Utrustning</span><select data-gearsel aria-label="Utrustning">
        <option value="alla">All utrustning</option>${Object.entries(GEAR_FILTER).map(([k, n]) => `<option value="${k}" ${modal.gear === k ? "selected" : ""}>${n}</option>`).join("")}</select>${icon("down", 16)}</label></div>
    <div class="picklist">${areas.map(a => {
      const group = ids.filter(id => areaOf(id) === a);
      return group.length ? `<section class="pgroup2" data-group="${a}"><h3 class="klabel">${AREAS[a]}</h3>${group.map(row).join("")}</section>` : "";
    }).join("")}</div>
    <div class="muted" id="nohits" hidden><span></span><button class="small" data-pickall hidden></button></div></div></div>`;
}

document.addEventListener("click", ev => {
  if (!ev.target.closest || !ev.target.closest("[data-pickall]") || !modal || !modal.pick) return;
  modal.area = "alla"; render(); filterPicker();
});
// Sökningen gäller inom vald kroppsdel och utrustning. Finns inget där men i andra kroppsdelar
// erbjuds en knapp som söker i alla.
function filterPicker() {
  const q = norm((modal && modal.q || "").trim());
  let shown = 0, elsewhere = 0;
  for (const el of document.querySelectorAll(".pick")) {
    const match = (!q || el.dataset.q.includes(q)) && (modal.gear === "alla" || el.dataset.gear === modal.gear);
    const hit = match && (modal.area === "alla" || el.dataset.area === modal.area);
    el.hidden = !hit;
    if (hit) shown++; else if (match) elsewhere++;
  }
  for (const g of document.querySelectorAll(".pgroup2")) g.hidden = !g.querySelector(".pick:not([hidden])");
  const none = document.getElementById("nohits");
  if (!none) return;
  none.hidden = shown > 0;
  const btn = none.querySelector("[data-pickall]");
  none.firstChild.textContent = elsewhere && modal.area !== "alla" ? `Inget i ${AREAS[modal.area]} matchar.` : "Inga övningar matchar. Prova en annan kroppsdel eller utrustning.";
  btn.hidden = !(elsewhere && modal.area !== "alla");
  btn.textContent = `Visa ${elsewhere} i alla kroppsdelar`;
}

// ---------- Logg ----------
function workoutFor(d) {
  const L = day();
  let w = L.workouts.find(x => x.dayId === d.id);
  if (!w) L.workouts.push(w = { dayId: d.id, sets: {}, done: false });
  // Klockan i fokusläget: passet räknas från när det startades
  if (!w.start && focus && focus.dayId === d.id && !editDate) w.start = focus.start;
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
const fmtTarget = (t, id) => fmtSet2({ kg: +t.kg || 0, reps: t.reps }, id);
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
  const set = fmtSet2({ kg: +s.kg || 0, reps: +s.reps || 0 }, exId);
  if (ever && betterSet(s, ever)) toast(`Nytt PB i ${EX[exId].name}: ${set}`);
  else if (prevWeek && betterSet(s, prevWeek)) toast(`Bättre än förra veckan i ${EX[exId].name}: ${set}`);
  else return;
  toasted.add(exId);
}
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  // Överst på skärmen, så att den aldrig hamnar över knapparna längst ned
  el.innerHTML = `<span class="toastic" aria-hidden="true">${icon(/^(Högst|Skriv|Kunde)/.test(msg) ? "info" : "check", 22)}</span><span></span>`;
  el.lastChild.textContent = msg;
  document.body.appendChild(el);
  // Ett nytt besked ersätter det förra
  document.querySelectorAll(".toast").forEach(t => t !== el && t.remove());
  setTimeout(() => el.classList.add("out"), 1100);
  setTimeout(() => el.remove(), 1600);
}

// En knapp som svarar själv: grön med en bock en kort stund, sedan som förut. Ritas inte om.
function flashBtn(el, label) {
  if (!el || el.classList.contains("flashed")) return;
  const html = el.innerHTML;
  el.classList.add("flashed");
  el.innerHTML = label ? `${icon("check", 20)}<span>${esc(label)}</span>` : icon("check", 18);
  setTimeout(() => { if (el.isConnected) { el.classList.remove("flashed"); el.innerHTML = html; } }, 1300);
}
// Efter omritning: samma knapp hittas igen med en väljare
const flashSel = (sel, label) => flashBtn(document.querySelector(sel), label);
// Fel visas vid fältet, inte som ett besked
function fieldError(input, msg) {
  if (!input) return toast(msg);
  input.classList.add("bad");
  input.setAttribute("aria-invalid", "true");
  // I en etikett hamnar felet sist i den, annars under fältets rad
  const field = input.closest(".field"), at = field || input.closest(".finput, .row") || input;
  let e = field ? field.querySelector(".ferr") : at.nextElementSibling;
  if (!e || !e.classList.contains("ferr")) { e = document.createElement("div"); e.className = "ferr"; e.setAttribute("role", "alert"); if (field) field.append(e); else at.after(e); }
  e.innerHTML = `${icon("info", 16)}<span></span>`;
  e.lastChild.textContent = msg;
  input.focus();
  input.addEventListener("input", () => { input.classList.remove("bad"); input.removeAttribute("aria-invalid"); e.remove(); }, { once: true });
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
// Övningar som bytts ut bara för ett pass läggs tillbaka i passet. Setten på den nya övningen ligger kvar i loggen.
function restoreSwaps(d, w) {
  if (!w.swap) return;
  if (d) for (const s of w.swap.slice().reverse()) {
    const i = d.ex.findIndex(x => x.id === s.id);
    if (i >= 0) { const o = Object.assign({}, s.orig); if (d.ex[i].ss) o.ss = true; else delete o.ss; d.ex[i] = o; }
  }
  delete w.swap;
}
// Byten från tidigare dagar som aldrig sparades läggs också tillbaka
function restoreOldSwaps() {
  for (const [date, L] of Object.entries(S.log || {})) if (date < TODAY) for (const w of L.workouts || []) if (w.swap) restoreSwaps(dayById(w.dayId), w);
}
function syncDone(d) {
  const w = workoutOn(logDate(), d.id);
  if (w) w.done = d.ex.length > 0 && d.ex.every(x => exDone(w, x));
}

function saveSetup() {
  const back = S.setupDone ? setupFrom : null;
  const weekdays = draft.weekdays.slice().sort((a, b) => a - b);
  S.plan = { program: draft.program, count: draft.count, mode: draft.mode, weekdays, days: draft.days };
  // Har man hoppat över kalorimålet påminner Kost om att ställa in det
  if (!S.setupDone && S.profileSet !== true) S.profileSet = false;
  S.setupDone = true;
  draft = null;
  // Ändrat upplägg: tillbaka dit man kom ifrån (Träna, Profil eller Hem)
  tab = back && back !== "upplagg" ? back : "idag";
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
  const t = ev.target.closest("button, input[type=checkbox], .overlay");
  if (!t || t.disabled) return;
  if (t.classList.contains("overlay") && ev.target !== t) return;   // klick inne i rutan
  const ds = t.dataset, prevTab = tab;
  if (ds.close !== undefined) { modal = null; render(); return; }
  if (ds.opentest !== undefined) {
    try { localStorage.setItem("driv-dev", "1"); } catch (e) { /* blockerad lagring */ }
    location.href = `${location.pathname}?test`;
    return;
  }
  if (ds.editprof !== undefined) { modal = { prof: true }; render(); return; }
  if (ds.pnamesave !== undefined) {
    const name = ($("pname").value || "").trim();
    if (!name) { fieldError($("pname"), "Skriv ett namn."); return; }
    S.name = name; save(); modal = null; render(); toast("Namnet är sparat");
    if (sbEnabled && account.step === "in" && social.loaded && !social.error)
      socialAction(() => socialRpc("driv_profile_save", { p_name: name, p_sharing: social.profile ? social.profile.sharing : true }));
    return;
  }
  if (ds.info) { modal = { info: ds.info, back: modal && modal.pick ? modal : null }; render(); return; }
  if (ds.infoback !== undefined) { modal = modal.back; render(); filterPicker(); return; }
  if (ds.chart) { modal = { chart: ds.chart }; render(); return; }
  if (ds.letter) { modal = { letter: ds.letter }; render(); return; }
  if (ds.openpick) { modal = { pick: ds.openpick }; render(); return; }
  if (ds.swap) { exSheet = null; modal = { pick: ds.swap, replace: +ds.idx }; render(); filterPicker(); return; }
  if (ds.swapwhen) { modal.today = ds.swapwhen === "true"; render(); filterPicker(); return; }
  if (ds.askai !== undefined) { askClaude(); return; }
  if (ds.passdoneclose !== undefined) { passDone = null; tab = "idag"; render(); window.scrollTo(0, 0); return; }
  if (ds.tab) {
    if (ds.tab === "vanner" && tab !== "vanner") vannerBack = tab;
    passDone = null;
    if (ds.tab === "pass" && focus) focus.suspended = false;
    tab = ds.tab; editing = false; dailyEditing = false; draft = null; editDate = null; histDay = null;
    chosenDay = null; passOpen = false; kostDay = false; mealPage = null; foodSheet = null; foodItem = null; recipeOpen = null; recipeEdit = null;
    editSnap = null; exSheet = null; ordna = false; trSheet = null;
    if (ds.popen) profOpen = ds.popen;
    if (tab === "upplagg") setupFrom = prevTab;
  }
  else if (ds.themeSet) setTheme(ds.themeSet);
  else if (ds.psec) profOpen = profOpen === ds.psec ? null : ds.psec;
  else if (ds.go) { tab = ds.go; if (ds.day) chosenDay = ds.day; if (tab === "kost") { mealPage = null; foodSheet = null; foodItem = null; } }
  else if (ds.pick) { chosenDay = ds.pick; passOpen = true; if (!editDate) window.scrollTo(0, 0); }
  else if (ds.edit !== undefined) {
    editing = !editing;
    if (editing) startEdit(currentPassDay()); else { editSnap = null; exSheet = null; ordna = false; }
    window.scrollTo(0, 0);
  }
  // Övningarna ändras bara i Träna; från Hem kommer man dit med passet öppet för ändring
  else if (ds.editpass) { tab = "pass"; chosenDay = ds.editpass; passOpen = true; editing = true; editDate = null; startEdit(dayById(ds.editpass)); window.scrollTo(0, 0); }
  else if (ds.ok && ds.w !== undefined) {
    // Uppvärmning: inga rekord, ingen vila; nästa set väljs
    const d = currentPassDay(), ex = d.ex.find(x => x.id === ds.ok), s = warmAt(d, ds.ok, +ds.i);
    s.ok = !s.ok;
    if (s.ok && ex) { const h = warmHint(d, ex, +ds.i); if (s.reps === undefined || s.reps === "") s.reps = h.reps; if ((s.kg === undefined || s.kg === "") && +h.kg) s.kg = h.kg; }
    if (focus && !editDate && !focus.suspended) focus.sel = null;
  }
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
    // Avsluta från fokusläget ska aldrig öppna ett redan automatiskt sparat pass igen.
    w.done = ds.focusend !== undefined ? true : !w.done;
    if (w.done) {
      restoreSwaps(dayById(ds.finish), w);
      if (w.start && !editDate) w.end = Date.now();
      // Historiska loggar ska inte avbryta vilan i ett pågående pass.
      if (!focus || (!editDate && focus.dayId === ds.finish)) stopRest();
    }
    shareWorkout(dayById(ds.finish), logDate(), w.done);
    // Ett sparat pass visar skärmen Pass klart; i efterhand går man tillbaka till dagen i Historik
    if (w.done && editDate) { histDay = editDate; editDate = null; tab = "historik"; }
    else if (w.done) { passDone = { dayId: ds.finish, date: logDate() }; tab = "idag"; }
  }
  else if (ds.setcount) {
    const d = currentPassDay(), ex = d.ex.find(x => x.id === ds.ex);
    ex.sets = Math.max(1, ex.sets + +ds.setcount);
    syncDone(d);
  }
  else if (ds.dcheck) day().dailies[ds.dcheck] = !dailyDone(logDate(), ds.dcheck);
  else if (ds.dedit !== undefined) dailyEditing = !dailyEditing;
  else if (ds.letterclose) S.letterSeen = ds.letterclose;
  else if (ds.showweight !== undefined) S.hideWeight = !t.checked;
  else if (ds.wsave !== undefined) {
    const date = ds.wdate || logDate();
    if (!logWeight(+String($("wkg").value).replace(",", "."), date)) { fieldError($("wkg"), "Skriv vikten i kg, till exempel 80,5"); return; }
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
  else if (ds.welcomelogin !== undefined) { welcomeLogin = ds.welcomelogin || null; account.msg = ""; }
  else if (ds.gokonto !== undefined) {
    openProfRow("konto", "acctemail");
    return;
  }
  else if (ds.goalpick) { S.profile.goal = ds.goalpick; S.profileSet = true; }
  else if (ds.nudgelater !== undefined) S.nudgeUntil = shift(TODAY, 14);
  else if (ds.installlater !== undefined) S.installUntil = shift(TODAY, 30);
  else if (ds.install !== undefined) {
    if (installEvt) installEvt.prompt().catch(() => {});
    installEvt = null;
  }
  else if (ds.changeemail !== undefined) { account.step = "email"; account.msg = ""; }
  else if (ds.signout !== undefined) { signOut(); return; }
  else if (ds.delacct !== undefined) {
    if (!account.confirmDelete) { account.confirmDelete = true; render(); return; }
    account.confirmDelete = false;
    socialRpc("driv_delete_me").then(async () => {
      await signOut();
      account.msg = "Kontot är raderat. En lokal säkerhetskopia finns kvar på den här enheten.";
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
  else if (ds.delmeal) S.meals.splice(+ds.delmeal, 1);
  else if (ds.delfood) day().food.splice(+ds.delfood, 1);
  else if (ds.xdel) { exList(ds.xdel).splice(+ds.idx, 1); exSheet = null; }
  else if (ds.mcadd) exList(ds.t).push(exEntry(ds.mcadd));
  else if (ds.mv) {
    const list = exList(ds.t), i = +ds.idx, j = i + +ds.mv;
    [list[i], list[j]] = [list[j], list[i]];
  }
  else if (ds.ss) { const e = exList(ds.ss)[+ds.idx]; if (e.ss) delete e.ss; else e.ss = true; }
  else if (ds.add) {
    const list = exList(modal.pick);
    if (modal.replace != null) {
      const orig = list[modal.replace], e = exEntry(ds.add);
      if (orig.ss) e.ss = true;
      list[modal.replace] = e;
      // Bara i dag: det gamla läggs tillbaka i passet när det sparas (eller nästa dag)
      if (modal.today) { const w = workoutFor(dayById(modal.pick)); (w.swap = w.swap || []).push({ id: e.id, orig }); }
    }
    else list.push(exEntry(ds.add));
    modal = null;
  }
  else if (ds.count) {
    draft.count = Math.max(1, Math.min(7, +ds.count));
    draft.days = makeDays(draft.program, draft.count, draft.days);
    if (draft.weekdays.length !== draft.count) draft.weekdays = DEFAULT_WEEKDAYS[draft.count].slice();
  }
  else if (ds.mode) draft.mode = ds.mode;
  else if (ds.progtoggle !== undefined) progOpen = !progOpen;
  else if (ds.prog) {
    draft.program = ds.prog;
    if (S.setupDone) progOpen = false;
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
  else if (ds.savesetup !== undefined) { saveSetup(); onb = 0; daysOpen = false; progOpen = false; }
  else if (ds.cancelsetup !== undefined) { draft = null; tab = setupFrom || "profil"; }
  else if (ds.week) weekOffset = Math.min(0, weekOffset + +ds.week);
  // Klar: tillbaka till Historik, eller till idag om dagen valdes i Kosts veckoremsa
  else if (ds.editdone !== undefined && kostDay && tab === "kost") { editDate = null; kostDay = false; closeMealEditor(); }
  else if (ds.editdone !== undefined) { if (tab === "kost") closeMealEditor(); histDay = editDate; editDate = null; tab = "historik"; chosenDay = null; }
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
  // Väljarens filter: sökningen står kvar och gäller inom vald kroppsdel; listan börjar högst upp
  if ((ds.areasel !== undefined || ds.gearsel !== undefined) && modal && modal.pick) {
    if (ds.areasel !== undefined) modal.area = t.value; else modal.gear = t.value;
    render(); filterPicker();
    const s = document.querySelector(".picksheet");
    if (s && ds.areasel !== undefined) s.scrollTop = 0;
    return;
  }
  if (ds.set) {
    const d = currentPassDay(), v = t.value === "" ? "" : clampSet(ds.set, ds.f, +t.value || 0);
    if (v !== "" && v !== +t.value) {
      t.value = v;
      toast(`Högst ${setMax(ds.set, ds.f)} ${ds.f === "kg" ? "kg" : isTimed(ds.set) ? "sekunder" : "reps"}`);
    }
    (ds.w !== undefined ? warmAt(d, ds.set, +ds.i) : setAt(d, ds.set, +ds.i))[ds.f] = v;
    // Senare set utan egen vikt visar den nya vikten som förslag
    const ex = d.ex.find(x => x.id === ds.set);
    if (ds.f === "kg" && ex && ds.w === undefined) for (const inp of document.querySelectorAll(`[data-set="${ds.set}"][data-f="kg"]:not([data-w])`)) {
      const k = +inp.dataset.i > +ds.i && liveHint(d, ex, +inp.dataset.i).kg;
      if (k) inp.placeholder = k;
    }
    save();
    return;   // ingen omritning, så att fokus stannar kvar i fältet
  }
  if (ds.run) { const L = day(); L.dailies[ds.run] = Object.assign({}, L.dailies[ds.run], { [ds.f]: +t.value || 0 }); }
  else if (ds.weighday !== undefined) S.weighDay = +t.value;
  else if (ds.prof) { S.profile[ds.prof] = ds.prof === "sex" || ds.prof === "goal" ? t.value : +t.value; S.profileSet = true; }
  else if (ds.passname) {
    const d = dayById(ds.passname);
    if (d) { d.name = t.value.trim() || d.name; d.named = true; }
  }
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
    out.innerHTML = `<div class="drow"><div class="grow"><b>${esc(text)}</b><div class="muted small">Claude: ${esc(r.tolkning || text)} · ${Math.round(+r.kcal || 0)} kcal · ${Math.round(+r.protein || 0)} g protein</div></div></div>`;
    S.learned = S.learned || {};
    S.learned[norm(text)] = { kcal: Math.round(+r.kcal || 0), protein: Math.round(+r.protein || 0) };
    save();
    if (logAfter) {
      const meal = foodSheet ? foodSheet.meal : currentMeal();
      logFood({ name: text, kcal: +r.kcal || 0, protein: +r.protein || 0 }, meal);
      foodSheet = null; mealPage = meal;
      save();
      render();
    } else updateFoodBtn();
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
  else if (["fkcal", "fprot", "ffat", "ffiber"].includes(t.id)) updateFoodBtn();
});

restoreOldSwaps();
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

// ---------- Testläge ----------
// Ett band överst med exempeldata, börja om och lämna. Allt gäller bara testdatan.
function seedDemo() {
  if (!S.setupDone) { ensureDraft(); saveSetup(); }
  const D = S.plan.days;
  for (let k = 1; k <= 20; k++) {
    if (S.log[shift(TODAY, -k)]) continue;
    const d = D[k % D.length], trained = k % 2 === 1;
    S.log[shift(TODAY, -k)] = {
      workouts: trained ? [{ dayId: d.id, done: true, sets: Object.fromEntries(d.ex.slice(0, 3).map((x, i) =>
        [x.id, [{ kg: EX[x.id].bw ? 0 : 40 + 10 * i + Math.round((20 - k) / 3) * 2.5, reps: 8, ok: true }]])) }] : [],
      dailies: Object.fromEntries(S.daily.filter(e => !isRun(e.id)).map((e, i) => [e.id, (k + i) % 4 !== 0])),
      food: [{ name: "Havregrynsgröt", kcal: 330, protein: 12, meal: 0 }, { name: "Kyckling och ris", kcal: 650, protein: 45, meal: 1 },
        { name: "Kvarg", kcal: 180, protein: 30, meal: 2 }, { name: "Lax och potatis", kcal: 700, protein: 40, meal: 3 }],
      acts: k % 6 === 0 ? [{ name: "Padel", min: 60, int: 2 }] : [],
    };
  }
  for (const k of [21, 14, 7]) weights()[shift(TODAY, -k)] = 82 - (21 - k) / 14;
  S.profile.weight = latestWeight().kg;
  save(); render();
  toast("Exempeldata tillagd");
}
if (window.DRIV_TEST) {
  document.body.insertAdjacentHTML("afterbegin", `<div class="testbar" role="status"><b>Testläge</b>
    <span class="grow"><span class="testsub">· egen data, sparas inte på kontot</span></span>
    <button data-testseed>Exempeldata</button><button data-testreset>Börja om</button><button data-testexit>Lämna</button></div>`);
  document.addEventListener("click", ev => {
    const t = ev.target.closest && ev.target.closest("[data-testseed],[data-testreset],[data-testexit]");
    if (!t) return;
    if (t.dataset.testseed !== undefined) seedDemo();
    else if (t.dataset.testreset !== undefined) {
      try { localStorage.removeItem(KEY); } catch (e) { /* blockerad lagring */ }
      location.reload();
    }
    else location.href = location.pathname;
  });
}

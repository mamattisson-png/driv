"use strict";
// ---------- Sök övningar ----------
// Övningarna hittas även på engelska och sökningen tål felstavningar och förkortningar:
// "lg extension" hittar Bensparkar, "bench" Bänkpress. Engelskan används bara för sökningen och visas inte.
// Laddas efter övningsfilerna och före muskelsok.js.

// Delar av svenska namn (utan prickar och ringar) och vad de heter på engelska
const EN_WORDS = [
  ["bankpress", "bench press"], ["golvpress", "floor press"], ["brostpress", "chest press machine"], ["hantelpress", "dumbbell press"],
  ["axelpress", "shoulder press overhead press"], ["militarpress", "military press overhead press ohp"], ["arnoldpress", "arnold press"],
  ["kettlebellpress", "kettlebell press"], ["landminepress", "landmine press"], ["larsenpress", "larsen press"], ["benpress", "leg press"],
  ["press", "press"], ["armhavning", "push up pushup"], ["push", "push"], ["pike", "pike"], ["diamant", "diamond"],
  ["flyes", "fly flye flies"], ["pullover", "pullover"], ["dips", "dips dip"], ["skullcrusher", "skull crusher lying triceps extension"],
  ["fransk", "french press overhead triceps extension"], ["pushdown", "pushdown pressdown"], ["kickback", "kickback"],
  ["tricepssträckning", "triceps extension"], ["tricepsstrackning", "triceps extension"],
  ["sidolyft", "lateral raise side raise"], ["framlyft", "front raise"], ["shrugs", "shrug"], ["upprakt rodd", "upright row"],
  ["face pulls", "face pull"], ["marklyft", "deadlift"], ["rumansk", "romanian rdl"], ["sumo", "sumo"], ["rackpull", "rack pull"],
  ["good morning", "good morning"], ["knaboj", "squat"], ["frontboj", "front squat"], ["gobletknaboj", "goblet squat"], ["goblet", "goblet"],
  ["hoppknaboj", "jump squat"], ["boxknaboj", "box squat"], ["hack", "hack squat"], ["pistol", "pistol squat"], ["squat", "squat"],
  ["vaggsittning", "wall sit"], ["utfallsboj", "split squat"], ["bulgarisk", "bulgarian split squat"], ["bakatutfall", "reverse lunge"],
  ["sidoutfall", "side lunge lateral lunge"], ["gaende utfall", "walking lunge"], ["utfall", "lunge"], ["stegupp", "step up"],
  ["benspark", "leg extension quad extension"], ["bensparkar", "leg extension"], ["bensträckning", "leg extension"], ["benstrackning", "leg extension"],
  ["bencurl", "leg curl hamstring curl"], ["nordic", "nordic hamstring curl"], ["hip thrust", "hip thrust"], ["glute bridge", "glute bridge"],
  ["hoftabduktion", "hip abduction"], ["hoftadduktion", "hip adduction"], ["sateskickback", "glute kickback"], ["asnesparkar", "donkey kick"],
  ["musslan", "clamshell"], ["frog pumps", "frog pump"], ["vadpress", "calf raise"], ["tahavning", "calf raise heel raise"],
  ["rodd", "row"], ["hantelrodd", "dumbbell row"], ["skivstangsrodd", "barbell row bent over row"], ["kabelrodd", "seated cable row"],
  ["maskinrodd", "machine row"], ["pendlayrodd", "pendlay row"], ["meadowsrodd", "meadows row"], ["australiensisk", "inverted row australian pull up"],
  ["t bar", "t bar row"], ["enarmsrodd", "single arm row one arm row"], ["latsdrag", "lat pulldown pulldown"], ["chins", "chin up chinup"],
  ["pull ups", "pull up pullup"], ["rygglyft", "back extension hyperextension"], ["superman", "superman"],
  ["bicepscurl", "biceps curl bicep curl"], ["hantelcurl", "dumbbell curl"], ["hammercurl", "hammer curl"], ["koncentrationscurl", "concentration curl"],
  ["scottcurl", "preacher curl"], ["scottbank", "preacher"], ["spidercurl", "spider curl"], ["zottmancurl", "zottman curl"], ["ezcurl", "ez bar curl"],
  ["omvand curl", "reverse curl"], ["handledscurl", "wrist curl"], ["curl", "curl"],
  ["plank", "plank"], ["sidoplanka", "side plank"], ["dead bug", "dead bug"], ["bird dog", "bird dog"], ["crunch", "crunch"],
  ["cykelcrunch", "bicycle crunch"], ["situps", "sit up situp"], ["benlyft", "leg raise"], ["knalyft", "knee raise"], ["hangande", "hanging"],
  ["russian twist", "russian twist"], ["pallof", "pallof press"], ["magrulle", "ab wheel rollout"], ["fallkniven", "jackknife v up"],
  ["fladdersparkar", "flutter kicks"], ["saxsparkar", "scissor kicks"], ["hollow", "hollow hold"], ["l sit", "l sit"], ["mountain climbers", "mountain climber"],
  ["burpees", "burpee"], ["kettlebellsving", "kettlebell swing"], ["dodhang", "dead hang"], ["bjornplanka", "bear plank"], ["walkout", "walkout inchworm"],
  ["lopning", "running run"], ["promenad", "walking walk"], ["cykling", "cycling bike"], ["roddmaskin", "rowing machine rower"], ["hopprep", "jump rope"],
  ["simning", "swimming"], ["crosstrainer", "elliptical cross trainer"], ["trappmaskin", "stair climber"],
  // Utrustning och grepp
  ["skivstang", "barbell"], ["stang", "bar barbell"], ["hantel", "dumbbell db"], ["kabel", "cable"], ["maskin", "machine"], ["smithmaskin", "smith machine"],
  ["kettlebell", "kettlebell kb"], ["band", "band"], ["kroppsvikt", "bodyweight"], ["lutande", "incline"], ["nedatlutande", "decline"],
  ["sittande", "seated"], ["staende", "standing"], ["liggande", "lying"], ["enarms", "single arm one arm unilateral"], ["enbens", "single leg one leg unilateral"],
  ["ett ben", "single leg one leg"], ["en arm", "single arm one arm"], ["vaxelvis", "alternating"], ["underhandsgrepp", "underhand supinated"],
  ["overhandsgrepp", "overhand pronated"], ["neutralt", "neutral grip"], ["brett", "wide"], ["smalt", "narrow close grip"], ["omvand", "reverse"],
  ["assisterade", "assisted"], ["excentrisk", "eccentric negative"],
  // Stretch
  ["stretch", "stretch"], ["tojning", "stretch"], ["hoftbojar", "hip flexor"], ["duvan", "pigeon"], ["katt", "cat"], ["ko", "cow"],
  ["barnets", "childs pose child"], ["nedatgaende hund", "downward dog"], ["kobran", "cobra"], ["fjarilen", "butterfly"], ["fjaril", "butterfly"],
  ["grodan", "frog"], ["couchstretch", "couch stretch"], ["varldens basta", "worlds greatest stretch"], ["framatfallning", "forward fold hamstring"],
  ["vadstretch", "calf stretch"], ["lårstretch", "quad stretch"], ["larstretch", "quad stretch"], ["brostoppning", "chest opener"],
  ["brostryggs", "thoracic"], ["nacke", "neck"], ["nack", "neck"], ["handled", "wrist"], ["fotled", "ankle"], ["hoft", "hip"], ["axel", "shoulder"],
  ["skuldra", "shoulder"], ["skulderblad", "scapula shoulder blade"], ["sate", "glute"], ["adduktor", "adductor groin"], ["armcirklar", "arm circles"],
  ["vindrutetorkare", "windshield wiper"], ["trad nalen", "thread the needle"], ["snoanglar", "snow angels"], ["dorr", "doorway"],
  // Muskler
  ["brost", "chest pecs"], ["rygg", "back"], ["lats", "lats"], ["biceps", "biceps"], ["triceps", "triceps"], ["axlar", "shoulders delts"],
  ["framsida lar", "quads quadriceps"], ["baksida lar", "hamstrings"], ["lar", "thigh legs"], ["vader", "calves"], ["vad", "calf"],
  ["mage", "abs core"], ["bal", "core"], ["underarm", "forearm"], ["ben", "legs leg"], ["arm", "arm arms"],
];
const exNorm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9/ ]+/g, " ");

// Söktexten per övning: namn, muskler, passtyp, MuscleWiki-namnet och engelska ord. Byggs en gång.
let exSearchCache = null;
function exSearchText(id) {
  if (!exSearchCache) exSearchCache = {};
  if (exSearchCache[id]) return exSearchCache[id];
  const e = EX[id], sv = exNorm(`${e.name} ${e.muscles || ""} ${typeof PASS_WORDS !== "undefined" ? PASS_WORDS[e.cat] || "" : ""}`);
  // MuscleWikis engelska namn: den kontrollerade länken i första hand
  const slug = typeof MW_LANK !== "undefined" && MW_LANK[id] ? MW_LANK[id] : typeof MW !== "undefined" && MW[id] && MW[id].startsWith("exercise/") ? MW[id].slice(9) : "";
  const mw = slug.replace(/-/g, " ");
  // Korta delord bara i början av ett ord ("vad" i vadpress, inte i "kvadrat")
  const en = EN_WORDS.filter(([k]) => k.length < 5 ? (" " + sv).includes(" " + k) : sv.includes(k)).map(([, v]) => v).join(" ");
  return (exSearchCache[id] = ` ${sv} ${exNorm(mw)} ${en} `.replace(/\s+/g, " "));
}

// Avstånd mellan två ord (antal tecken som skiljer), avbryts när det blir för stort
function editDist(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
// Hur väl ett sökord passar ett ord i texten: 3 = början av ett ord, 2 = inne i ett ord, 1 = nästan (felstavat eller förkortat), 0 = inte alls
function tokenScore(t, words, text) {
  if (text.includes(" " + t)) return 3;
  if (t.length >= 3 && text.includes(t)) return 2;
  const max = t.length <= 3 ? 1 : t.length <= 6 ? 1 : 2;
  for (const w of words) {
    if (w.length < 2) continue;
    // Förkortning: bokstäverna i samma ordning från ordets början ("lg" → leg, "bnk" → bank)
    if (t.length >= 2 && w[0] === t[0] && t.length < w.length) {
      let i = 0; for (const c of w) if (c === t[i]) i++;
      if (i === t.length && t.length >= Math.min(3, w.length - 1)) return 1;
      if (i === t.length && t.length === 2 && w.length <= 4) return 1;
    }
    if (t.length >= 3) for (let n = t.length - 1; n <= Math.min(w.length, t.length + 1); n++) if (n > 0 && editDist(t, w.slice(0, n), max) <= max) return 1;
  }
  return 0;
}
// Poäng för en övning mot sökningen; 0 = träffar inte. Alla sökord måste passa.
function exSearchScore(id, q) {
  const qs = exNorm(q).trim();
  if (!qs) return 1;
  const text = exSearchText(id), words = text.trim().split(" ");
  let score = 0;
  for (const t of qs.split(" ")) { const s = tokenScore(t, words, text); if (!s) return 0; score += s; }
  // Namnet först: börjar namnet med sökningen eller innehåller det hela uttrycket
  const name = " " + exNorm(EX[id].name) + " ";
  if (name.startsWith(" " + qs)) score += 4; else if (name.includes(qs)) score += 2; else if (text.includes(" " + qs)) score += 2;
  return score;
}

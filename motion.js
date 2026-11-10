"use strict";
// ---------- Träningsformer och motion ----------
// Alla träningsformer som går att söka på och logga. MET-värden för lugnt, medel och hårt
// (Compendium of Physical Activities, avrundade). km: sträckan går att fylla i. Sökorden är synonymer,
// vardagsord och engelska namn, så att "jogga", "spin" och "thai" hittar rätt.
// EMS finns inte i tabellverket: värdena är en uppskattning (lätta övningar med ström, ungefär som cirkelträning).
// Laddas före aktivitet.js och efter sok.js.

const ACTIVITY_LIST = [
  // Gå, springa och cykla
  ["Promenad", [3, 3.5, 4.5], 1, "gå gang walk walking gåtur"],
  ["Hundpromenad", [3, 3.5, 4.5], 1, "hund rasta dog walk"],
  ["Stavgång", [4, 4.8, 6], 1, "stavar nordic walking"],
  ["Vandring", [4, 6, 7.5], 1, "hiking fjäll fjällvandring trekking"],
  ["Löpning", [7, 9.5, 11.5], 1, "springa jogga jogging run running löpband terräng"],
  ["Intervaller", [8, 10, 12], 1, "intervall intervallöpning backe backintervaller sprint"],
  ["Orientering", [7, 9, 11], 1, "orienteering karta"],
  ["Cykling", [4, 7, 10], 1, "cykla bike biking landsväg racer pendla"],
  ["Mountainbike", [6.5, 8.5, 11], 1, "mtb terrängcykel"],
  ["Spinning", [5, 7, 10.5], 0, "spin indoor cycling inomhuscykel motionscykel cykelpass"],
  ["Elcykel", [3.5, 4.5, 6], 1, "e-bike ebike"],
  // Vatten
  ["Simning", [5, 7, 9.5], 1, "simma crawl bröstsim swim swimming"],
  ["Vattengympa", [3.5, 4.5, 5.5], 0, "vattenträning aqua aquafit vattenjogging"],
  ["Kanot", [3, 5, 7], 1, "paddla paddling canoe"],
  ["Kajak", [3.5, 5, 7], 1, "paddla kayak"],
  ["SUP", [3, 5, 6.5], 1, "stand up paddle paddelbräda"],
  ["Rodd", [4.8, 7, 8.5], 1, "roddmaskin rowing concept2 rodd ergometer"],
  ["Segling", [3, 4.5, 5.5], 0, "segla sailing båt"],
  ["Surfing", [3, 5, 6], 0, "surfa surf vindsurfing kitesurfing"],
  ["Dykning", [5, 7, 9], 0, "dyka snorkling diving"],
  // Gym och gruppträning
  ["Styrketräning", [3.5, 5, 6], 0, "gym styrka vikter strength weights lyfta"],
  ["Cirkelträning", [4.3, 6, 8], 0, "circuit stationer"],
  ["Crossfit", [5.5, 8, 10], 0, "wod functional fitness"],
  ["HIIT", [6, 8, 10], 0, "högintensiv tabata intervallträning"],
  ["Funktionell träning", [4, 5.5, 7], 0, "functional bål core"],
  ["Kettlebell", [5, 7, 9.8], 0, "kettlebellträning kb sving"],
  ["Calisthenics", [3.5, 5, 8], 0, "kroppsvikt bodyweight street workout"],
  ["Gympa", [4.5, 6, 7.5], 0, "friskis svettis jympa motionsgympa"],
  ["Aerobics", [5, 7, 8.5], 0, "aerobic step"],
  ["Bodypump", [4, 5, 6.5], 0, "body pump skivstångspass les mills"],
  ["Bodycombat", [6, 7.5, 9], 0, "body combat les mills"],
  ["Zumba", [5.5, 6.5, 8], 0, "dansfitness"],
  ["Crosstrainer", [5, 6.5, 8], 0, "cross trainer elliptical"],
  ["Trappmaskin", [6, 8.5, 10], 0, "trappor stairmaster stair climber trappgång"],
  ["Hopprep", [8, 11, 12.5], 0, "hoppa rep jump rope skipping"],
  ["EMS", [3.5, 4.5, 5.5], 0, "ems träning elektrisk muskelstimulering bodystreet ems pass"],
  // Kropp och sinne
  ["Yoga", [2.5, 3, 4], 0, "hatha yin"],
  ["Power yoga", [3.5, 4, 5], 0, "vinyasa ashtanga poweryoga"],
  ["Hot yoga", [3, 4, 5], 0, "bikram varm yoga"],
  ["Pilates", [3, 3.8, 5], 0, "reformer mattpilates"],
  ["Barre", [3.5, 4.5, 5.5], 0, "balett barre"],
  ["Stretching", [2.3, 2.5, 3], 0, "stretch rörlighet töjning mobility"],
  ["Tai chi", [3, 4, 5], 0, "qigong taichi"],
  ["Rehabträning", [2.5, 3, 4], 0, "rehab sjukgymnastik fysioterapi"],
  ["Dans", [4, 5.5, 7], 0, "dansa dance bugg salsa balett jazz"],
  // Kamp
  ["Boxning", [5.5, 7.8, 9.5], 0, "boxas boxing säck sparring"],
  ["Kickboxning", [7, 9, 10.3], 0, "thaiboxning thai muay kickboxing"],
  ["Kampsport", [6, 8, 10], 0, "karate judo taekwondo jujutsu bjj mma"],
  ["Brottning", [6, 6, 8], 0, "brottas wrestling"],
  ["Fäktning", [4, 6, 8], 0, "fencing"],
  // Racket och bollsport
  ["Padel", [5, 6, 8], 0, "padelboll"],
  ["Tennis", [5, 7, 8], 0, ""],
  ["Badminton", [5, 5.5, 7], 0, "fjäderboll"],
  ["Squash", [7, 9, 12], 0, ""],
  ["Bordtennis", [3, 4, 5], 0, "pingis ping pong"],
  ["Pickleball", [4, 5, 6], 0, ""],
  ["Fotboll", [6, 7, 10], 0, "football soccer futsal lira"],
  ["Innebandy", [6, 8, 10], 0, "floorball"],
  ["Ishockey", [6, 8, 10], 0, "hockey"],
  ["Bandy", [6, 8, 10], 0, ""],
  ["Handboll", [6, 8, 12], 0, "handball"],
  ["Basket", [4.5, 6.5, 8], 0, "basketboll basketball"],
  ["Volleyboll", [3, 4, 6], 0, "volleyball"],
  ["Beachvolley", [6, 8, 8], 0, "beachvolleyboll sandvolleyboll"],
  ["Rugby", [6.3, 8.3, 10], 0, ""],
  ["Amerikansk fotboll", [6, 8, 9], 0, "american football"],
  ["Golf", [3.5, 4.3, 5], 1, "golfrunda"],
  ["Frisbeegolf", [3, 3.5, 4], 1, "discgolf disc golf"],
  ["Bowling", [3, 3.8, 4.5], 0, ""],
  ["Boule", [2.5, 3, 3.5], 0, "petanque kubb"],
  // Vinter och hjul
  ["Skidor", [6.8, 9, 12.5], 1, "längdskidor längdåkning skidåkning klassiskt skate cross country"],
  ["Utförsåkning", [4.3, 5.3, 8], 0, "slalom alpint skidor backe utför"],
  ["Snowboard", [4.3, 5.3, 8], 0, "snowboarding"],
  ["Rullskidor", [7, 9, 12], 1, "rullskida"],
  ["Skridskor", [5.5, 7, 9], 1, "åka skridskor skating långfärdsskridskor konståkning"],
  ["Inlines", [7.5, 9.8, 12.5], 1, "rullskridskor inlineåkning rollerblades"],
  ["Skateboard", [4, 5, 6], 0, "skejt skate"],
  // Övrigt
  ["Klättring", [5, 7, 8], 0, "klättra climbing"],
  ["Bouldering", [5, 6, 7.5], 0, "boulder"],
  ["Ridning", [4, 5.5, 7.3], 0, "rida häst hoppning dressyr"],
  ["Fiske", [2.5, 3.5, 4], 0, "fiska"],
  ["Trädgårdsarbete", [3, 4, 5.5], 0, "trädgård gräva rensa ogräs klippa gräs"],
  ["Snöskottning", [5, 5.3, 6], 0, "skotta snö"],
  ["Lek med barn", [2.5, 4, 5.8], 0, "leka barn lekpark"],
];
// Snabbvalen innan man söker: de vanligaste först (efter det man själv loggat mest)
const POPULAR_ACTS = ["Löpning", "Promenad", "Padel", "Cykling", "Styrketräning", "Yoga", "Simning", "Fotboll", "Gympa", "Spinning", "Vandring", "Tennis", "Golf", "Dans", "Skidor"];
const ACTIVITIES = ACTIVITY_LIST.map(([name, met, km, words]) => ({ name, met, ...(km ? { km: true } : {}), words }));

// Sök bland träningsformerna med samma tåliga sökning som övningarna (sok.js): synonymer, början av ord och felstavningar
function actSearch(q) {
  const qs = exNorm(q).trim();
  if (!qs) return [];
  return ACTIVITIES.map(a => {
    const text = ` ${exNorm(a.name)} ${exNorm(a.words)} `, words = text.trim().split(/\s+/);
    let score = 0;
    for (const t of qs.split(" ")) { const s = tokenScore(t, words, text); if (!s) return null; score += s; }
    if (exNorm(a.name).startsWith(qs)) score += 4;
    return { a, score };
  }).filter(Boolean).sort((x, y) => y.score - x.score || x.a.name.localeCompare(y.a.name, "sv"))
    // Bara de som ligger nära bästa träffen, så att en felstavning inte ger brus när något passar bra
    .filter((x, _, all) => all[0].score < 3 || x.score >= Math.max(2, all[0].score / 3)).map(x => x.a.name);
}

// "2 av 3 pass", eller "4 pass · målet 3 nått" när veckans mål är passerat
const passGoal = (passes, goal = S.plan.count) => passes > goal ? `${passes} pass · målet ${goal} nått` : `${passes} av ${goal} pass`;

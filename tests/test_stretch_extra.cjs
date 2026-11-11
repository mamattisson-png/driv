// Data-only regression checks: node tests/test_stretch_extra.cjs
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ctx = vm.createContext({ window: { matchMedia: () => ({ matches: false }) } });
const run = code => vm.runInContext(code, ctx);
for (const file of ['ovningar.js', 'figur.js']) run(fs.readFileSync(path.join(root, file), 'utf8'));
const before = run('JSON.stringify({EX,MW})');
const oldNames = new Set(JSON.parse(before).EX ? Object.values(JSON.parse(before).EX).map(e => e.name.toLocaleLowerCase('sv')) : []);
run(fs.readFileSync(path.join(root, 'stretch-extra.js'), 'utf8'));
const rows = JSON.parse(run('JSON.stringify(EXTRA_STRETCH_IDS.map(id => ({id,...EX[id],wiki:MW[id],svg:figure(id,"",true)})))'));
assert.ok(rows.length >= 80 && rows.length <= 100, `Expected 80–100 exercises; got ${rows.length}`);
assert.equal(new Set(rows.map(e => e.id)).size, rows.length);
assert.equal(new Set(rows.map(e => e.name.toLocaleLowerCase('sv'))).size, rows.length);
const previous = JSON.parse(before);
for (const [id, ex] of Object.entries(previous.EX)) {
  assert.deepEqual(JSON.parse(run(`JSON.stringify(EX[${JSON.stringify(id)}])`)), ex, `Old exercise changed: ${id}`);
  assert.equal(run(`MW[${JSON.stringify(id)}]`), previous.MW[id]);
}
const targets = new Set();
const poses = new Set();
let timed = 0, dynamic = 0;
for (const e of rows) {
  assert.match(e.id, /^strx_[a-z0-9_]+$/);
  assert.ok(!previous.EX[e.id], `ID collision: ${e.id}`);
  assert.ok(!oldNames.has(e.name.toLocaleLowerCase('sv')), `Old name duplicated: ${e.name}`);
  assert.equal(e.cat, 'stretch'); assert.equal(e.bw, true);
  assert.equal(e.cues.length, 3); assert.ok(e.cues.every(c => typeof c === 'string' && c.length >= 15));
  assert.ok(e.muscles.length > 5); assert.ok(e.sets >= 1 && e.sets <= 3);
  assert.match(e.reps, /^(?:[1-9]\d?(?:–[1-9]\d?)?)(?: s)?(?:\/(?:sida|ben|arm|riktning))?$/);
  if (/ s/.test(e.reps)) { timed++; assert.ok(parseInt(e.reps) >= 15); }
  else { dynamic++; assert.ok(parseInt(e.reps) <= 15); assert.ok(e.B || ['strx_ankle_circles','strx_ankle_point_flex','strx_seated_internal_rotation','strx_prone_wipers','strx_ninety_switch','strx_supine_wipers'].includes(e.id), `${e.id} needs movement poses or a documented anatomical fallback`); }
  // No generic category link is acceptable as a direct stretch demonstration.
  // Explicit reviewed exercise pages only. Category/muscle pages must never masquerade as demos.
  const verifiedStretchPages = new Set([
    "exercise/laying-chin-tucks",
    "exercise/shoulders-stretch-variation-two",
    "exercise/chest-stretch-variation-two",
    "exercise/puppy-pose",
    "exercise/adductor-stretch-dynamic-unilateral-4-point-position",
    "exercise/quad-stretch-floor-prone",
    "exercise/hamstrings-stretch-variation-two",
    "exercise/soleus-stretch-static",
    "exercise/calf-stretch-on-box-bilateral",
    "exercise/calves-stretch-variation-one",
    "exercise/ankle-circle",
  ]);
  assert.ok(e.wiki === undefined || verifiedStretchPages.has(e.wiki), `${e.id}: unreviewed or generic MuscleWiki link ${e.wiki}`);
  assert.ok(e.stretchTargets.length > 0);
  e.stretchTargets.forEach(t => { assert.match(t, /^[a-z][a-z0-9_]+$/); targets.add(t); });
  assert.ok(e.svg.startsWith('<svg')); assert.ok(!/NaN|Infinity|undefined|null/.test(e.svg), e.id);
  for (const p of [e.A, e.B].filter(Boolean)) {
    assert.ok(p.h && p.a && (p.f || e.view === 'front'), e.id);
    const numbers = JSON.stringify(p).match(/-?\d+(?:\.\d+)?/g).map(Number);
    assert.ok(numbers.every(Number.isFinite));
  }
  poses.add(JSON.stringify(e.A));
}
assert.ok(timed >= 45 && dynamic >= 20, 'Include both held stretches and controlled mobility');
assert.ok(poses.size >= 45, 'Use movement-specific poses');
for (const tag of ['neck','shoulders','chest','lats','triceps','biceps','forearms','hip_flexors','glutes','adductors','quads','hamstrings','calves','ankles']) assert.ok(targets.has(tag), tag);
console.log(`${rows.length} new stretches: ${timed} timed, ${dynamic} dynamic; old exercises/links unchanged; figures and targets valid.`);


// Audit consistency across all 125 stretch exercises, not just the 83 extra ones.
// This is an offline data regression test, NOT independent verification of MW content.
{
  const auditFile = fs.readFileSync(path.join(root, 'docs/stretch-musclewiki-review-queue.md'), 'utf8');
  const auditRows = auditFile.split(/\r?\n/)
    .filter(line => line.startsWith('| ') && /\| (?:verified|no_exact_match) \|/.test(line))
    .map(line => {
      const cells = line.split('|').map(cell => cell.trim());
      return { id: cells[1], source: cells[3], url: cells[4], status: cells[5], evidence: cells[6] };
    });
  assert.equal(auditRows.length, 125, 'Audit queue must cover all 125 stretches');
  assert.equal(new Set(auditRows.map(row => row.id)).size, 125, 'Duplicate audit ID');
  for (const [source, count] of [['ovningar.js', 26], ['stretch-extra.js', 83], ['stretch-guide.js', 16]]) {
    assert.equal(auditRows.filter(row => row.source === source).length, count, source);
  }

  // The guide's additional 16 exercises are not loaded in this data-only VM
  // (its UI registers DOM handlers), so inspect its explicit link map instead.
  const guideSource = fs.readFileSync(path.join(root, 'stretch-guide.js'), 'utf8');
  const guideList = guideSource.split('const more = [')[1]?.split('\n  ];')[0];
  assert.ok(guideList, 'Stretch guide exercise list not found');
  const guideCodes = new Set([...guideList.matchAll(/^\s*\["([a-z0-9_]+)",\s*"/gm)].map(m => m[1]));
  assert.equal(guideCodes.size, 16, 'Expected 16 guide stretches');
  const guideMapBlock = guideSource.match(/const verifiedDirectLinks = \{([\s\S]*?)\n\s*\};/);
  assert.ok(guideMapBlock, 'Guide direct-link map not found');
  const guideLinks = Object.fromEntries(
    [...guideMapBlock[1].matchAll(/\b([a-z0-9_]+):\s*"(exercise\/[a-z0-9-]+)"/g)]
      .map(m => ['strg_' + m[1], m[2]])
  );
  const liveLinks = JSON.parse(run('JSON.stringify(MW)'));
  const exerciseIds = new Set(JSON.parse(run('JSON.stringify(Object.keys(EX).filter(id => EX[id].cat === "stretch"))')));
  const auditedIds = new Set(auditRows.map(row => row.id));
  for (const id of exerciseIds) assert.ok(auditedIds.has(id), 'Unaudited stretch: ' + id);

  for (const row of auditRows) {
    assert.ok(row.evidence && row.evidence.length > 12, row.id + ': missing review evidence');
    if (row.source === 'stretch-guide.js') {
      assert.ok(guideCodes.has(row.id.replace(/^strg_/, '')), row.id + ': unknown guide exercise');
    } else {
      assert.ok(exerciseIds.has(row.id), row.id + ': missing exercise');
    }
    const actual = row.source === 'stretch-guide.js' ? guideLinks[row.id] : liveLinks[row.id];
    if (row.status === 'verified') {
      assert.match(row.url, /^https:\/\/musclewiki\.com\/exercise\/[a-z0-9-]+$/, row.id);
      assert.equal(actual, row.url.replace('https://musclewiki.com/', ''), row.id + ': audit/code link mismatch');
    } else {
      assert.equal(row.url, '—', row.id + ': unverified URL in audit');
      assert.ok(!actual || !actual.startsWith('exercise/'), row.id + ': unverified direct link in code');
    }
  }
  for (const id of Object.keys(guideLinks)) {
    assert.ok(auditedIds.has(id), id + ': unaudited guide direct link');
  }
  console.log('125 stretch audit entries match code: 31 reviewed direct links, 94 without exact match.');
}


// Render the actual mobile stretch-detail template in isolation. A generic
// MuscleWiki browse link must never be presented as an exercise demonstration.
{
  const source = fs.readFileSync(path.join(root, 'muskelsok.js'), 'utf8');
  const start = source.indexOf('function stretchPage(id) {');
  const end = source.indexOf('// Menyn lämnar alltid biblioteket', start);
  assert.ok(start >= 0 && end > start, 'Stretch detail renderer not found');
  const ex = { name: 'Teststretch', cat: 'stretch', reps: '30 s', sets: 2, cues: ['Gör rörelsen lugnt.'] };
  const mw = {
    linked: 'exercise/child-pose-arms-extended',
    category: 'exercises/chest/bodyweight',
  };
  const sandbox = vm.createContext({
    EX: { linked: ex, missing: ex, category: ex },
    MW: mw,
    stretchMuscles: () => [],
    MUSKEL_FRAM: [],
    MUSKEL_NAMN: {},
    anatSvg: () => '',
    gearOf: () => null,
    icon: () => '',
    figure: () => '',
    esc: value => value,
    mwUrl: id => mw[id] ? 'https://musclewiki.com/' + mw[id] : null,
  });
  vm.runInContext(source.slice(start, end), sandbox);
  const linked = vm.runInContext("stretchPage('linked')", sandbox);
  const missing = vm.runInContext("stretchPage('missing')", sandbox);
  const category = vm.runInContext("stretchPage('category')", sandbox);
  assert.match(linked, /href="https:\/\/musclewiki\.com\/exercise\/child-pose-arms-extended"/);
  for (const [name, html] of [['linked', linked], ['missing', missing], ['category', category]]) {
    assert.ok(!html.includes('https://musclewiki.com/exercises'), name + ': generic browse link');
  }
  assert.ok(!missing.includes('musclewiki.com'), 'Unlinked stretch must not have a MW link');
  assert.ok(!category.includes('musclewiki.com'), 'Category link must be hidden');
  console.log('Stretch detail renders only direct MuscleWiki links; no generic browse fallback.');
}

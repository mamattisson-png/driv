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
  assert.match(e.wiki, /^(?:exercises\/(traps|shoulders|chest|lats|lowerback|triceps|biceps|forearms|glutes|quads|hamstrings|calves)\/stretches|exercise\/adductor-stretch-dynamic-unilateral-4-point-position)$/);
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

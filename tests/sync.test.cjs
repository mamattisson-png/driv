// Tests the actual merge functions extracted from app.js, without starting the UI.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const source = fs.readFileSync('app.js', 'utf8');
const start = source.indexOf('function stableJson(');
const end = source.indexOf('stamp(true);', start);
assert.ok(start >= 0 && end > start, 'Could not locate sync functions');
const ctx = vm.createContext({ normalize: x => x, crypto: require('node:crypto').webcrypto, S: { log: {} } });
const mergeStart = source.indexOf('function mergeDoc(');
const mergeEnd = source.indexOf('function applyCloudDoc(', mergeStart);
assert.ok(mergeStart > end && mergeEnd > mergeStart, 'Could not locate mergeDoc');
vm.runInContext(source.slice(start, end) + '\n' + source.slice(mergeStart, mergeEnd), ctx);
const merge = (id, a, b) => vm.runInContext('mergeDoc', ctx)(id, a, b);
const plain = x => JSON.parse(JSON.stringify(x));
const day = (workouts, deleted = {}) => ({
  workouts, _deleted: { workouts: deleted }, _t: { workouts: 100 },
});

test('concurrent additions to one day survive merge', () => {
  const a = { days: { '2026-10-29': day([{ _id: 'set-a', _ts: 101, reps: 10 }]) } };
  const b = { days: { '2026-10-29': day([{ _id: 'set-b', _ts: 102, reps: 12 }]) } };
  const result = plain(merge('m-2026-10', a, b));
  assert.deepEqual(result.days['2026-10-29'].workouts.map(x => x._id).sort(), ['set-a', 'set-b']);
});

test('newer edit of same workout wins', () => {
  const a = { days: { '2026-10-29': day([{ _id: 'same', _ts: 200, reps: 12 }]) } };
  const b = { days: { '2026-10-29': day([{ _id: 'same', _ts: 100, reps: 8 }]) } };
  assert.equal(merge('m-2026-10', a, b).days['2026-10-29'].workouts[0].reps, 12);
});

test('deleted workout is not resurrected by offline copy', () => {
  const a = { days: { '2026-10-29': day([], { gone: 200 }) } };
  const b = { days: { '2026-10-29': day([{ _id: 'gone', _ts: 100, reps: 8 }]) } };
  assert.equal(merge('m-2026-10', a, b).days['2026-10-29'].workouts.length, 0);
});

test('changes on separate dates both survive', () => {
  const a = { days: { '2026-10-28': day([{ _id: 'a', _ts: 1 }]) } };
  const b = { days: { '2026-10-29': day([{ _id: 'b', _ts: 2 }]) } };
  assert.equal(Object.keys(merge('m-2026-10', a, b).days).length, 2);
});

test('settings merge prefers latest timestamp', () => {
  const result = merge('settings', { goal: 2000, _t: { goal: 100 } }, { goal: 2200, _t: { goal: 200 } });
  assert.equal(result.goal, 2200);
});

test('independent daily habits survive merge', () => {
  const a = { dailies: { water: true }, _dailyT: { water: 200 }, _t: { dailies: 200 } };
  const b = { dailies: { creatine: true }, _dailyT: { creatine: 300 }, _t: { dailies: 300 } };
  const result = merge('m-2026-10', { days: { '2026-10-29': a } }, { days: { '2026-10-29': b } });
  assert.equal(result.days['2026-10-29'].dailies.water, true);
  assert.equal(result.days['2026-10-29'].dailies.creatine, true);
});

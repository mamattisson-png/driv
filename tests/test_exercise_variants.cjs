"use strict";
// Run with: node tests/test_exercise_variants.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const ctx = vm.createContext({window: {matchMedia: () => ({matches: false})}});
const load = file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), ctx);
for (const file of ["ovningar.js", "styrka-extra.js", "stretch-extra.js", "ovningar-varianter.js", "figur.js"]) load(file);
const result = vm.runInContext(`(() => {
  const ids = EXTRA_VARIANT_IDS;
  const names = Object.values(EX).map(e => e.name.toLocaleLowerCase("sv").trim());
  if (ids.length !== 22) throw Error("Expected twenty-two new variants");
  if (new Set(ids).size !== ids.length || new Set(names).size !== names.length) throw Error("Duplicate exercise id or name");
  for (const id of ids) {
    const e = EX[id];
    if (!e || e.cues.length !== 3 || !e.aliases.length || !MW[id]) throw Error(id + ": incomplete metadata");
    if (!e.prim.length || !e.reps || !e.gear) throw Error(id + ": missing training metadata");
    const svg = figure(id, "", true);
    if (!svg.includes("<svg") || /NaN|Infinity|undefined/.test(svg)) throw Error(id + ": invalid figure");
  }
  return ids.length;
})()`, ctx);
assert.equal(result, 22);
console.log("22 new exercise variants: unique names, metadata, and figures verified.");

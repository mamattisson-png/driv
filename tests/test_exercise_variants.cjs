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
  if (ids.length !== 32) throw Error("Expected thirty-two new variants");
  if (new Set(ids).size !== ids.length || new Set(names).size !== names.length) throw Error("Duplicate exercise id or name");
  for (const id of ids) {
    const e = EX[id];
    if (!e || e.cues.length !== 3 || !e.aliases.length || !MW[id]) throw Error(id + ": incomplete metadata");
    if (!e.prim.length || !e.reps || !e.gear) throw Error(id + ": missing training metadata");
    if (gearOf(id) !== e.gear || e.bw !== (e.gear === "bw")) throw Error(id + ": gear mismatch");
    if (e.gear === "bw" && (e.hold || e.cable || e.plate || e.pad)) throw Error(id + ": invalid bodyweight props");
    if (e.gear === "db" && e.hold !== "db" || e.gear === "bar" && e.hold !== "bar") throw Error(id + ": wrong weight props");
    if (!AREA_IDS[areaOf(id)].split(" ").includes(id)) throw Error(id + ": missing area index");
    const svg = figure(id, "", true);
    if (!svg.includes("<svg") || /NaN|Infinity|undefined/.test(svg)) throw Error(id + ": invalid figure");
  }
  return ids.length;
})()`, ctx);
assert.equal(result, 32);
console.log("32 new exercise variants: unique names, metadata, and figures verified.");

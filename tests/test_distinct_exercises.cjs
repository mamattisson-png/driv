"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname,"..");
const ctx = vm.createContext({window:{matchMedia:()=>({matches:false})}});
for(const file of ["ovningar.js","styrka-extra.js","stretch-extra.js","ovningar-distinkta.js","figur.js"])
  vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),ctx,{filename:file});
const n = vm.runInContext(`(() => {
 const names = Object.values(EX).map(e=>e.name.toLocaleLowerCase("sv").trim());
 if(new Set(names).size !== names.length) throw Error("Duplicate exercise names");
 if(EXTRA_DISTINCT_IDS.length !== 13) throw Error("Expected thirteen distinct exercises");
 for(const id of EXTRA_DISTINCT_IDS){
  const e=EX[id];
  if(!e || !e.aliases?.length || e.cues?.length !== 3 || !e.reps || !MW[id]) throw Error(id+": incomplete");
  if(!AREA_IDS[areaOf(id)].split(" ").includes(id)) throw Error(id+": missing index");
  if(!figure(id,"",true).includes("<svg")) throw Error(id+": no figure");
 }
 return EXTRA_DISTINCT_IDS.length;
})()`,ctx);
assert.equal(n,13);
console.log("Thirteen distinct exercise records validated");

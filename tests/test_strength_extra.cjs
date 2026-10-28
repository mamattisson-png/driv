'use strict';
// Run with: node tests/test_strength_extra.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({window:{matchMedia:()=>({matches:false})}});
const run = text => vm.runInContext(text, context);
const load = name => run(fs.readFileSync(path.join(root, name), 'utf8'));
load('ovningar.js'); load('figur.js');
const before = run('JSON.stringify(EX)');
const oldIds = run('Object.keys(EX)');
const oldFigures = oldIds.map(id=>run(`figure(${JSON.stringify(id)}, '', true)`));
assert.ok(fs.existsSync(path.join(root,'styrka-extra.js')), 'strength extension exists');
load('styrka-extra.js');
assert.equal(run('EXTRA_STRENGTH_IDS.length'), 240, '240 hand-selected strength exercises');
assert.equal(run('Object.keys(EX).length'), oldIds.length+240);
assert.equal(run(`JSON.stringify(Object.fromEntries(${JSON.stringify(oldIds)}.map(id=>[id,EX[id]])))`),before,'old data unchanged');
oldIds.forEach((id,i)=>assert.equal(run(`figure(${JSON.stringify(id)}, '', true)`),oldFigures[i],id+' old SVG unchanged'));
run(`(() => {
  const ids = EXTRA_STRENGTH_IDS;
  const names = Object.values(EX).map(e=>e.name.toLocaleLowerCase('sv').trim());
  if(new Set(names).size!==names.length) throw Error('duplicate exercise names');
  if(new Set(ids).size!==ids.length) throw Error('duplicate extension ids');
  const areas = new Set(), gears = new Set();
  for(const id of ids) {
    const e=EX[id], g=gearOf(id);
    function check(ok, label) { if(!ok) throw Error(id+': '+label); }
    check(/^stx_[a-z0-9_]+$/.test(id),'stable ascii id');
    check(['push','pull','legs','core'].includes(e.cat),'strength category');
    check(typeof e.name==='string' && e.name.length>4,'name');
    check(typeof e.muscles==='string' && e.muscles.length>3,'muscle description');
    check(Number.isInteger(e.sets) && e.sets>0 && e.sets<=5,'sets');
    check(typeof e.reps==='string' && /\\d/.test(e.reps),'reps');
    check(e.cues.length>=3 && e.cues.every(c=>typeof c==='string'&&c.length>=16),'instructions');
    check(e.prim.length>0 && [...e.prim,...e.sec].every(m=>MUSCLE_GROUPS[m]),'muscle groups');
    check(typeof e.bw==='boolean' && e.bw===(g==='bw'),'explicit bodyweight');
    check(Object.hasOwn(GEAR,e.gear) && g===e.gear,'explicit supported gear');
    check(!e.cable || g==='cable','cable only for cable gear');
    check(!e.plate && !e.pad || g==='machine','machine-only pads/plates');
    check(!e.hold || ['bar','db'].includes(e.hold),'supported drawn weight');
    check(g!=='bw' || !e.hold,'no free-weight image on bodyweight');
    check(g!=='db' || e.hold!=='bar','no bar on dumbbell');
    check(g!=='bar' || e.hold!=='db','no dumbbell on bar');
    check(!e.duration && !e.timed,'no hidden time flags');
    check(!/\\bs(?:\\/|$)/.test(e.reps) || !e.B,'timed holds have static illustration');
    check(typeof MW[id]==='string' && /^(exercise\\/[a-z0-9-]+|exercises\\/[a-z0-9-]+\\/[a-z0-9-]+)$/.test(MW[id]),'source link');
    check(mwUrl(id).startsWith('https://musclewiki.com/'),'wiki coverage');
    for(const animate of [false,true]) {
      const svg=figure(id,'',animate);
      check(svg.includes('<svg') && !/NaN|Infinity|undefined/.test(svg),'finite SVG');
    }
    areas.add(areaOf(id)); gears.add(g);
  }
  if(areas.size!==6 || gears.size!==6) throw Error('broad body/equipment coverage');
})()`);
// Posture/axis regressions that generic finite-coordinate checks cannot catch.
run(`(() => {
  const check=(ok,label)=>{if(!ok)throw Error(label);};
  check(!EX.stx_forearm_rotate.B,'forearm rotation must not animate wrist flexion');
  for(const id of ['db_floor','db_single_floor','kb_floor','db_floor_fly','skull_floor']) {
    check(EX['stx_'+id].A.h[1]>=85,id+' lies on the floor');
    check(!EX['stx_'+id].scene.length,id+' has no floating bench');
  }
  check(EX.stx_curl_seated.A.h[1]>=60,'seated curl uses a seated pose');
  check(EX.stx_cable_incline_press.scene.length>0,'incline cable press has a bench');
  check(JSON.stringify(EX.stx_deadbug_arms.A.f)===JSON.stringify(EX.stx_deadbug_arms.B.f),'arm-only dead bug has still legs');
  check(JSON.stringify(EX.stx_deadbug_legs.A.a)===JSON.stringify(EX.stx_deadbug_legs.B.a),'leg-only dead bug has still arms');
  check(JSON.stringify(EX.stx_birddog_arms.A.f2)===JSON.stringify(EX.stx_birddog_arms.B.f2),'arm-only bird dog has still legs');
  check(JSON.stringify(EX.stx_birddog_legs.A.a2)===JSON.stringify(EX.stx_birddog_legs.B.a2),'leg-only bird dog has still arms');
  check(EX.stx_hip_adduct_side.cues.some(c=>/undre/.test(c))&&!EX.stx_hip_adduct_side.cues.some(c=>/övre benet/.test(c)),'adduction cues target lower leg');
})()`);
// Script must work in its actual load order, before the renderer too.
const orderContext=vm.createContext({window:{matchMedia:()=>({matches:false})}});
for(const file of ['ovningar.js','styrka-extra.js','figur.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),orderContext);
assert.equal(vm.runInContext('EXTRA_STRENGTH_IDS.every(id=>!!figure(id))',orderContext),true);
console.log('240 strength exercises: data, gear, muscles, links, SVG and preservation verified.');

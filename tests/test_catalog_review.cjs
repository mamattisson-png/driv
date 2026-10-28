'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const ctx=vm.createContext({window:{matchMedia:()=>({matches:false})}});
for(const file of ['ovningar.js','styrka-extra.js','stretch-extra.js','figur.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const errors=vm.runInContext(`(() => {
 const errors=[],check=(ok,msg)=>{if(!ok)errors.push(msg)};
 for(const code of ['wrist_bar','wrist_reverse_bar','wrist_cable','forearm_rotate']){
  const e=EX['stx_'+code];
  check(!e.B && e.A.h[1]>=60 && e.A.s && e.A.s[0]>e.A.h[0],code+': static supported wrist pose');
 }
 check(MUSCLE_GROUPS.insida_lar==='Insida lår','inner-thigh group exists');
 for(const code of ['hip_adduct_side','hip_adduct_machine']){
  const e=EX['stx_'+code];check(e.prim.includes('insida_lar')&&!e.prim.includes('framsida_lar'),code+': adduction must not count as quads');
 }
 check(EX.stx_sideplank_copenhagen.prim.includes('insida_lar'),'Copenhagen targets adductors');
 const knee=sideJoints(EX.stx_sideplank_copenhagen.A).leg[1];
 check(knee[0]>=5&&knee[0]<=25.2&&Math.abs(knee[1]-76)<0.2,'Copenhagen knee rests on bench');
 for(const code of ['ankle_circles','ankle_point_flex','seated_internal_rotation','prone_wipers','ninety_switch','supine_wipers']){
  check(!EX['strx_'+code].B,code+': no false rotation via knee movement');
 }
 check(Math.abs(sideJoints(EX.strx_prone_wipers.A).leg[1][1]-90)<0.2,'prone rotation thigh remains supported');
 return errors;
})()`,ctx);
assert.equal(errors.length,0,errors.join('\n'));
console.log('Catalog review regressions: supported wrists, adductors, Copenhagen support and rotational start poses passed.');

import assert from 'node:assert/strict';
import {buildSofa} from '../blockforge/objects/sofa/build.mjs';
const nodes=await buildSofa(),mats=nodes[0].mats;
for(const m of mats){assert.ok(m.positions.every(Number.isFinite));assert.ok(m.normals.every(Number.isFinite));}
const bounds=m=>{const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<m.positions.length;i+=3)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],m.positions[i+k]);hi[k]=Math.max(hi[k],m.positions[i+k]);}return {lo,hi};};
const seats=bounds(mats.find(m=>m.sourceGroup.endsWith(':seats'))),backs=bounds(mats.find(m=>m.sourceGroup.endsWith(':backs'))),pillows=bounds(mats.find(m=>m.sourceGroup.endsWith(':pillows')));
assert.ok(seats.lo[2]>.29&&seats.hi[2]<.51,'Compiled seat covers must sit on the carcass, not at the origin');
assert.ok(seats.lo[0]<-1.2&&seats.hi[0]>1.2,'All three cushions must retain their placements');
assert.ok(backs.lo[2]>.39&&backs.hi[2]>.97&&backs.hi[2]<1.03,'Back cushions must stand upright and remain supported');
assert.ok(pillows.lo[2]>.42&&pillows.hi[2]<.92,'Loose pillows must rest inside the sofa');
console.log(JSON.stringify({passed:true,triangles:mats.reduce((n,m)=>n+m.indices.length/3,0),seats,backs,pillows}));

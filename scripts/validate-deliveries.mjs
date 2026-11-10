import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
const source=JSON.parse(await readFile('public/native/studio.json','utf8'));
for(const profile of ['desktop','mobile']){
 const boot=JSON.parse(gunzipSync(await readFile(`public/native/bootstrap-${profile}.json.gz`))),packed=await readFile(`public/${boot.worldFile}`),world=JSON.parse(gunzipSync(packed));assert.ok(packed.length<(profile==='mobile'?1500000:3000000),`${profile} world exceeds its download budget`);
 assert.equal(boot.tier,profile);assert.equal(world.tier,profile);assert.equal(world.cameras.length,13);
 for(const mesh of world.meshes){const g=mesh.instances.geometry;assert.ok(g.positions.every(Number.isFinite));assert.equal(g.normals.length,g.positions.length);assert.ok(g.normals.every(Number.isFinite));assert.equal(g.uvs.length,g.positions.length/3*2);assert.ok(g.indices.every(i=>Number.isInteger(i)&&i>=0&&i<g.positions.length/3));
  const id=mesh.instances.placements[0].key;
  if(world.entityMetadata[id]?.sequenceOnly||/^identity\/(seven|floating-crystal)\//.test(id)||id.startsWith('architecture/floor/')){
   const original=source.meshes.find(m=>m.instances.placements[0].key===id).instances.geometry;assert.equal(g.indices.length,original.indices.length);
   for(let i=0;i<g.indices.length;i++)for(let k=0;k<3;k++)assert.ok(Math.abs(g.positions[g.indices[i]*3+k]-original.positions[original.indices[i]*3+k])<1e-5,`Critical geometry changed: ${profile}/${id}`);
  }
 }
 for(const file of Object.values(boot.assetMap))await access(`public/${file}`);
 const materials=JSON.parse(await readFile(`public/${profile==='mobile'?'mobile':'optimized'}/materials.json`,'utf8'));await access(`public/${materials.environment.file}`);for(const material of materials.materials)for(const [role,file]of Object.entries(material.maps))if(profile!=='mobile'||role!=='roughness')await access(`public/${file}`);
 console.log(`${profile}: valid mesh attributes, full crystal and engraved floor geometry, and complete release assets`);
}

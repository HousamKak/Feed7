// Same production pattern as the engine's studio project: modular source ->
// native world compiler source + assets -> hybrid artifact, save and clients.
import {readFile,writeFile,mkdir,readdir,rename} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {atomicWrite,publishWebDelivery} from './web-delivery.mjs';
import {createContext,D,P} from '../world/context.mjs';
import {buildArchitecture} from '../world/architecture.mjs';
import {buildRecording} from '../world/recording.mjs';
import {buildLounge} from '../world/lounge.mjs';
import {buildGraphics} from '../world/graphics.mjs';
import {buildCeiling} from '../world/ceiling.mjs';
import {buildCircuits} from '../world/circuits.mjs';
import {projectRoot,engineImport} from './engine.mjs';
import {cameraStops} from '../world/camera-route.mjs';

const tier=process.argv.includes('--hero')?'hero':'web';
const buildRoot=tier==='hero'?resolve(projectRoot,'../artifacts/native/hero-source'):projectRoot;
const ctx=createContext({tier});await buildArchitecture(ctx);await buildRecording(ctx);await buildLounge(ctx);await buildGraphics(ctx);buildCeiling(ctx);
await buildCircuits(ctx);
for(const mesh of ctx.rig.meshes())ctx.items.push({id:mesh.id,mesh,metadata:{emission:.8}});
const assetDir=join(buildRoot,'assets');await mkdir(assetDir,{recursive:true});await mkdir(join(buildRoot,'worlds'),{recursive:true});
const materials={},assets={},entities=[],appearance={},entityMetadata={};
const materialByColor=new Map(),geometryCache=new Map();
const digest=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
async function authoringIdentity(){
 const files=[];
 async function walk(dir){for(const entry of await readdir(join(projectRoot,dir),{withFileTypes:true})){const rel=join(dir,entry.name);if(entry.isDirectory())await walk(rel);else if(entry.name.endsWith('.mjs')||dir==='world'&&entry.name.endsWith('.json'))files.push(rel);}}
 await walk('world');await walk('objects');files.push('tools/build-world.mjs','tools/web-delivery.mjs','tools/native-parts.mjs','bakes/manifest.json','objects/chair/chair.object.json','objects/chair/production-uvs.json');
 const inputs=[];for(const file of files.sort())inputs.push([file.replaceAll('\\','/'),createHash('sha256').update(await readFile(join(projectRoot,file))).digest('hex')]);return digest(inputs);
}
const roleFor=color=>['wood','woodDark'].some(k=>P[k]===color)?'wood':color===P.leather?'leather':color===P.fabric?'fabric':color===P.wall?'wall':color===P.stone?'stone':['leaf','leafDark'].some(k=>P[k]===color)?'leaf':'solid';
function material(color,metadata={}){
 const semanticRole={'emerald-crystal':'crystal','brand-crystal':'crystal','architectural-glass':'glass',fabric:'fabric',wood:'wood',leather:'leather',lens:'lens'}[metadata.semanticMaterial];
 const role=metadata.graphic?'graphic':metadata.screen?'screen':semanticRole|| (metadata.scan==='stone'?'stone':roleFor(color));
 const key=JSON.stringify([color,role,metadata.emission||0,metadata.graphic||'',metadata.screen||'',metadata.metalness||0,metadata.motion?.kind==='glow'?metadata.motion.phase||0:0,metadata.alwaysVisible||false]);
 if(materialByColor.has(key))return materialByColor.get(key);
 const id=`m${materialByColor.size}`;materialByColor.set(key,id);materials[id]={baseColor:color};appearance[id]={color,role,...metadata};return id;
}
const p3=(p,i)=>p.slice(i*3,i*3+3);
const rounded=v=>+v.toFixed(6);
function indexed(positions,indices,normals,uvs){
 // Preserve supplied construction normals and seam UVs. For the older kit's
 // colour-group mesh form, weld only positions and let the native compiler
 // preserve the resulting smooth normals.
 if(normals?.length)return {positions,indices,normals,uvs};
 const map=new Map(),pos=[],ix=[];
 for(const v of indices){const p=p3(positions,v),key=p.join(',');if(!map.has(key)){map.set(key,pos.length/3);pos.push(...p);}ix.push(map.get(key));}
 return {positions:pos,indices:ix,uvs:[]};
}
async function emit(id,positions,indices,normals,uvs,mat,at=[0,0,0],yaw=0,metadata={}){
 if(!positions.every(Number.isFinite))throw new Error(`Non-finite native source geometry: ${id}`);
 if(normals&&!normals.every(Number.isFinite))throw new Error(`Non-finite native source normals: ${id}`);
 const g=indexed(positions,indices,normals,uvs);
 const {faceNormals}=await engineImport('src/object/ObjectMeshParts.js');
 g.normals=g.normals?.length?g.normals:Array.from(faceNormals(g.positions,g.indices));
 const sig=digest(g);let asset=geometryCache.get(sig);
 if(!asset){
  asset=`mesh-${geometryCache.size}`;geometryCache.set(sig,asset);const lines=[];
  for(let i=0;i<g.positions.length;i+=3)lines.push(`v ${g.positions.slice(i,i+3).map(rounded).join(' ')}`);
  for(let i=0;i<g.normals.length;i+=3)lines.push(`vn ${Array.from(g.normals.slice(i,i+3)).map(rounded).join(' ')}`);
  const hasUV=g.uvs?.length===g.positions.length/3*2;
  const uv=hasUV?g.uvs:null;
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity,z0=Infinity,z1=-Infinity;for(let i=0;i<g.positions.length;i+=3){x0=Math.min(x0,g.positions[i]);x1=Math.max(x1,g.positions[i]);y0=Math.min(y0,g.positions[i+1]);y1=Math.max(y1,g.positions[i+1]);z0=Math.min(z0,g.positions[i+2]);z1=Math.max(z1,g.positions[i+2]);}
  for(let i=0;i<g.positions.length/3;i++){
   const nx=Math.abs(g.normals[i*3]),ny=Math.abs(g.normals[i*3+1]),nz=Math.abs(g.normals[i*3+2]);
   const image=metadata.graphic||metadata.screen;
   let iu=nx>ny&&nx>nz?(g.positions[i*3+1]-y0)/(y1-y0||1):(g.positions[i*3]-x0)/(x1-x0||1);
   if((nx>ny&&nx>nz&&g.normals[i*3]<0)||(ny>nx&&ny>nz&&g.normals[i*3+1]>0))iu=1-iu;
   const iv=nz>nx&&nz>ny?(g.positions[i*3+1]-y0)/(y1-y0||1):(g.positions[i*3+2]-z0)/(z1-z0||1);
   const u=uv?uv[i*2]:image?iu:nx>ny&&nx>nz?g.positions[i*3+1]:g.positions[i*3];
   const v=uv?uv[i*2+1]:image?iv:nz>nx&&nz>ny?g.positions[i*3+1]:g.positions[i*3+2];
   lines.push(`vt ${u.toFixed(6)} ${v.toFixed(6)}`);
  }
  for(let i=0;i<g.indices.length;i+=3)lines.push('f '+g.indices.slice(i,i+3).map(v=>`${v+1}/${v+1}/${v+1}`).join(' '));
  await writeFile(join(assetDir,`${asset}.obj`),lines.join('\n'));
  assets[asset]={file:`assets/${asset}.obj`,frame:{up:'z',unit:'m',handedness:'right'},license:'LicenseRef-Private-Local',source:'FEED7 native world codebase and local Blockforge production dependencies'};
 }
 entities.push({id,transform:{translation:at,rotation:[0,0,Math.sin(yaw/2),Math.cos(yaw/2)]},components:{shape:{mesh:{asset}},surface:{material:mat},semantic:{class:id.split('/')[0],tags:['native-source']}}});entityMetadata[id]=metadata;
}
for(const item of ctx.items){
 if(item.mesh){
  let i=0;for(const [color,g]of item.mesh.groups)await emit(`${item.id}/part-${i++}`,g.pos.flat(),g.tris.flat(),null,null,material(color,item.metadata),[0,0,0],0,item.metadata);
 }else{
  let i=0;for(const node of item.nodes)for(const m of node.mats){const color=m.spec?.baseColor||P[m.material]||P.fabric;await emit(`${item.id}/part-${i++}`,m.positions,m.indices,m.normals,m.uvs,material(color,{...item.metadata,scan:undefined,semanticMaterial:m.material,materialSpec:m.spec}),item.at,item.yaw,item.metadata);}
 }
}
const project={format:'blockforge-world-project/1',id:tier==='hero'?`${D.id}-hero`:D.id,entry:'worlds/main.world.json',space:{frame:'bf-grid-z-up/1',lengthUnit:'m'},targets:{web:{backend:'hybrid/1',cellSize:.1,samplingStep:.05,meshes:['*'],meshCollision:'none',mode:'final'}},limits:{maxTriangles:3000000,maxCells:1000000},apply:{target:'web'}};
const world={format:'blockforge-world-source/1',space:project.space,bounds:D.bounds,materials,assets,entities,rules:[{id:'seven-preserved',kind:'feature-preservation/1',scope:'target',subjects:entities.filter(e=>e.id.startsWith('identity/seven/')).map(e=>e.id),parameters:{minCells:0,minTriangles:10},severity:'error',requiredEvidence:'sampled',onUnknown:'block-final'}]};
await writeFile(join(buildRoot,'world.project.json'),JSON.stringify(project,null,2));
await writeFile(join(buildRoot,'worlds/main.world.json'),JSON.stringify(world,null,2));
console.log(`Authored ${entities.length} native entities using ${Object.keys(assets).length} reusable mesh assets. Compiling world...`);
const {compileProject,readVoxelArtifact}=await engineImport('cli/worldc/compiler.js');
const built=await compileProject(buildRoot,{outDir:resolve(projectRoot,`../artifacts/native/worldc${tier==='hero'?'-hero':''}`),targets:['web'],mode:'final'});
const manifest=built.builds.web.manifest;
if(manifest.validation.status!=='pass')throw new Error(`Native world did not pass validation: ${manifest.validation.status}`);
const compiled=readVoxelArtifact(built.store,manifest);
const lightRig=JSON.parse(await readFile(join(projectRoot,'world/lighting.json'),'utf8'));
const out=resolve(projectRoot,'../public/native');await mkdir(out,{recursive:true});
const delivery={format:'feed7-native-world/1',project:project.id,tier,compiler:'Blockforge worldc hybrid/1',cellSizeM:.1,meshes:compiled.meshes,appearance,entityMetadata,entityMaterials:Object.fromEntries(entities.map(e=>[e.id,e.components.surface.material])),cameras:cameraStops,lightRig,lights:ctx.rig.fixtures.flatMap(f=>f.lights.map((l,i)=>({...l,id:ctx.rig.lightId(f,i)}))),provenance:{sourceRevision:manifest.sourceRevision,artifact:manifest.artifact,validation:manifest.validation,localOnly:true}};
delivery.provenance.authoringRevision=await authoringIdentity();
delivery.provenance.deliveryRevision=digest({geometry:manifest.artifact.sha256,authoring:delivery.provenance.authoringRevision,appearance,entityMetadata,lightRig,cameras:cameraStops});
const deliveryFile=tier==='hero'?resolve(projectRoot,'../artifacts/native/hero-world.json'):join(out,'studio.json');
await atomicWrite(deliveryFile,JSON.stringify(delivery));
if(tier==='web')await publishWebDelivery(delivery,out);
await writeFile(tier==='hero'?resolve(projectRoot,'../artifacts/native/hero-build-report.json'):join(projectRoot,'world-build-report.json'),JSON.stringify({source:'Native Feed7 world codebase',tier,entities:entities.length,assets:Object.keys(assets).length,meshes:compiled.meshes.length,sourceRevision:manifest.sourceRevision,validation:manifest.validation,losses:manifest.losses},null,2));
console.log(`Native ${tier} world passed: ${compiled.meshes.length} compiled meshes. Artifact: ${deliveryFile}`);

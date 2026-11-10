import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {engineImport} from './engine.mjs';
import {atomicWrite} from './web-delivery.mjs';
const {MeshoptSimplifier:S}=await engineImport('src/object/third_party/meshopt_simplifier.js');await S.ready;
const mobile=!process.argv.includes('--desktop'),profile=mobile?'mobile':'desktop',assetRoot=mobile?'mobile':'optimized';
const source=JSON.parse(await readFile('public/native/studio.json','utf8')),bootstrap=JSON.parse(await readFile('public/native/bootstrap.json','utf8'));
const data=structuredClone(source);let before=0,after=0;
for(const mesh of data.meshes){const g=mesh.instances.geometry,id=mesh.instances.placements[0].key,meta=data.entityMetadata[id]||{},count=g.indices.length/3;before+=count*mesh.instances.placements.length;
 const preserve=meta.sequenceOnly||id.startsWith('architecture/floor/')||id.startsWith('identity/seven/')||id.startsWith('identity/floating-crystal/');let indices=new Uint32Array(g.indices);
 if(!preserve&&count>80){
  if(id.startsWith('decor/olive')&&data.appearance[data.entityMaterials[id]]?.role==='leaf'){
   const parent=new Int32Array(g.positions.length/3);for(let i=0;i<parent.length;i++)parent[i]=i;
   const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
   for(let i=0;i<indices.length;i+=3){const root=find(indices[i]);parent[find(indices[i+1])]=root;parent[find(indices[i+2])]=root;}
   const roots=new Map(),kept=[];for(let i=0;i<indices.length;i+=3){const root=find(indices[i]);if(!roots.has(root))roots.set(root,roots.size);if(roots.get(root)%(mobile?4:2)===0)kept.push(indices[i],indices[i+1],indices[i+2]);}indices=new Uint32Array(kept);
  }else{
   const attributes=new Float32Array(g.positions.length/3*5);for(let i=0;i<g.positions.length/3;i++){attributes.set(g.normals.slice(i*3,i*3+3),i*5);attributes.set(g.uvs?.slice(i*2,i*2+2)||[0,0],i*5+3);}
   [indices]=S.simplifyWithAttributes(indices,new Float32Array(g.positions),3,attributes,5,[.02,.02,.02,.01,.01],null,Math.max(24,Math.floor(indices.length*(mobile?.2:.5)/3)*3),mobile?.025:.003,['Permissive']);
  }
 }
 const remap=new Map(),vertices=new Map(),positions=[],normals=[],uvs=[],out=[];for(const vertex of indices){if(!remap.has(vertex)){const p=g.positions.slice(vertex*3,vertex*3+3).map(v=>+v.toFixed(preserve?6:mobile?3:4)),n=g.normals.slice(vertex*3,vertex*3+3).map(v=>+v.toFixed(mobile?3:4)),uv=g.uvs?.slice(vertex*2,vertex*2+2).map(v=>+v.toFixed(mobile?4:5))||[],key=[...p,...n,...uv].join(',');if(!vertices.has(key)){vertices.set(key,positions.length/3);positions.push(...p);normals.push(...n);uvs.push(...uv);}remap.set(vertex,vertices.get(key));}out.push(remap.get(vertex));}
 mesh.instances.geometry={positions,normals,uvs,indices:out};after+=out.length/3*mesh.instances.placements.length;
}
data.tier=profile;data.compiler+=` + Meshopt ${profile} delivery`;data.provenance[profile]={sourceRevision:source.provenance.sourceRevision,drawnTrianglesBefore:before,drawnTriangles:after,criticalCrystalPreserved:true};
const bytes=JSON.stringify(data),hash=createHash('sha256').update(bytes).digest('hex'),worldFile=`native/studio-${profile}-${hash.slice(0,16)}.json.gz`,packed=gzipSync(bytes,{level:9});await writeFile(`public/${worldFile}`,packed);
const mobileRoot=`public/${assetRoot}`;for(const dir of ['blockforge','generated','brand'])await mkdir(`${mobileRoot}/${dir}`,{recursive:true});
const materials=JSON.parse(await readFile('public/blockforge/materials.json','utf8')),assetMap={};
for(const record of materials.materials)for(const [role,file]of Object.entries(record.maps)){if(mobile&&role==='roughness')continue;const target=`${assetRoot}/${file}`,size=role==='normal'?(mobile?256:512):role==='roughness'?256:mobile?512:1024;execFileSync('magick',[`public/${file}`,'-resize',`${size}x${size}>`,'-quality',mobile?'78':'86',`public/${target}`]);assetMap[file]=target;record.maps[role]=target;}
materials.environment.file=`${assetRoot}/blockforge/studio-small-09.hdr`;execFileSync('magick',['public/blockforge/studio-small-09.hdr','-resize',mobile?'256x128':'512x256',`public/${materials.environment.file}`]);await writeFile(`${mobileRoot}/materials.json`,JSON.stringify(materials));
for(const file of ['generated/basalt-floor.webp','generated/emerald-acoustic.webp','generated/emerald-signal.webp','generated/production-detail.webp','brand/digital-world.jpg']){const target=`${assetRoot}/${file}`;execFileSync('magick',[`public/${file}`,'-resize',mobile?'768x768>':'1280x1280>','-quality',mobile?'76':'86',`public/${target}`]);assetMap[file]=target;}
await mkdir(`${mobileRoot}/native-art`,{recursive:true});for(const file of await readdir('public/native-art'))if(file.endsWith('.svg')){const input=`native-art/${file}`,target=`${assetRoot}/native-art/${file.replace('.svg','.webp')}`;execFileSync('magick',['-background','none',`public/${input}`,'-resize',mobile?(file==='campaign.svg'?'768x768>':'512x512>'):'1280x1280>','-quality','86',`public/${target}`]);assetMap[input]=target;}
bootstrap.nativeLogo.geometry=data.meshes.find(m=>data.entityMetadata[m.instances.placements[0].key]?.sequenceOnly==='logo').instances.geometry;
bootstrap.worldFile=worldFile;bootstrap.assetMap=assetMap;bootstrap.mobileAssets=assetMap;bootstrap.tier=profile;bootstrap.compiler=data.compiler;bootstrap.provenance={...data.provenance};await atomicWrite(`public/native/bootstrap-${profile}.json`,JSON.stringify(bootstrap));await atomicWrite(`public/native/bootstrap-${profile}.json.gz`,gzipSync(JSON.stringify(bootstrap),{level:9}));
await writeFile(`artifacts/native/${profile}-build-report.json`,JSON.stringify({beforeTriangles:before,afterTriangles:after,desktopBytes:gzipSync(JSON.stringify(source)).length,mobileBytes:packed.length,optimizedBytes:packed.length,worldFile},null,2));console.log(JSON.stringify({profile,beforeTriangles:before,afterTriangles:after,MB:packed.length/1e6,worldFile}));

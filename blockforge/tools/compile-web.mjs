// Compile native Blockforge object source. Three.js is deliberately absent.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {engineImport,projectRoot} from './engine.mjs';

const O=await engineImport('src/object/index.js');
const {loadInstanceFile,instanceLoader}=await engineImport('cli/objectInstance.js');
await O.installDefaultSimplifier();
const source=join(projectRoot,'objects/chair');
const loaded=await loadInstanceFile(source);
// Sub-millimetre individual stitches belong to the hero tier. Their welt cords
// remain in the web tier; omitting threads also avoids foliage-style thinning.
const webSource={...loaded.raw,parts:loaded.raw.parts.filter(p=>!p.id?.startsWith('thread_'))};
const c=O.compileObject(webSource,{base:loaded.base,load:instanceLoader(),mesh:['web']});
if(!c.ok)throw new Error(O.formatIssues(c).join('\n'));
const inst=c.instance;
const nativeUvs=JSON.parse(await readFile(join(source,'production-uvs.json'),'utf8'));
const uvMaps={};
const key=(a,b,c)=>[a,b,c].map(v=>Math.fround(v)).join(',');
for(const [id,m]of Object.entries(nativeUvs)){
 const lookup=uvMaps[id]=new Map();for(let i=0;i<m.positions.length;i+=3)lookup.set(key(...m.positions.slice(i,i+3)),m.uvs.slice(i/3*2,i/3*2+2));
}
const groups=[];
for(const s of c.mesh.web.surfaces){
 const byMat=new Map();
 for(let t=0;t<s.indices.length;t+=3){
  const p=inst.parts[s.labels[s.indices[t]]];
  const name=p.material||inst.groups[p.group].material;
  if(!byMat.has(name))byMat.set(name,[]);
  byMat.get(name).push(s.indices[t],s.indices[t+1],s.indices[t+2]);
 }
 for(const [material,ix]of byMat){
  const ids=new Map(),positions=[],normals=[],uvs=[];
  const indices=ix.map(v=>{
   if(!ids.has(v)){
    ids.set(v,positions.length/3);
    for(let k=0;k<3;k++){positions.push(+s.positions[v*3+k].toFixed(6));normals.push(+s.normals[v*3+k].toFixed(5));}
    const native=uvMaps[material]?.get(key(s.positions[v*3],s.positions[v*3+1],s.positions[v*3+2]));
    if(!native)throw new Error(`Native seam UV missing after simplification: ${material}, vertex ${v} at ${s.positions.slice(v*3,v*3+3)}`);
    uvs.push(...native.map(v=>+v.toFixed(6)));
   }
   return ids.get(v);
  });
  groups.push({name:s.name,material,positions,normals,uvs,indices});
 }
}
const files=loaded.project.files;
const inputs=[];
for(const name of files){const bytes=await readFile(resolve(source,name));inputs.push({file:name,sha256:createHash('sha256').update(bytes).digest('hex')});}
const dependency=JSON.parse(await readFile(join(source,'production-dependency.json'),'utf8'));
const artifact={format:'feed7-blockforge-mesh/1',id:inst.id,source:'blockforge/objects/chair',tier:'web',frame:'bf-native-z-up',uvUnit:'metres',materials:inst.materials,groups,provenance:{compiler:'Blockforge ObjectCompile.compileObject',productionModule:dependency.module,productionVersion:dependency.version,privateLocalPreview:true,inputs},triangles:groups.reduce((n,g)=>n+g.indices.length/3,0)};
const out=resolve(projectRoot,'../public/native');await mkdir(out,{recursive:true});
await writeFile(join(out,'chair.json'),JSON.stringify(artifact));
await writeFile(join(projectRoot,'build-report.json'),JSON.stringify({format:'feed7-native-build/1',assets:[{id:artifact.id,tier:artifact.tier,triangles:artifact.triangles,inputs,dependency}],scope:'Local preview of the existing production chair adapted to FEED7 finishes. The room and remaining assets are still the prototype.'},null,2));
console.log(`Native chair: ${artifact.triangles} triangles, ${groups.length} material groups. Compiled to public/native/chair.json`);

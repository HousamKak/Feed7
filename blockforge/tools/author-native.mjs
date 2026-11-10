// Local adaptation of the developed Blockforge production furniture pipeline.
// The private upstream project is a dependency, never copied or modified here.
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {engineImport,projectRoot,ENGINE} from './engine.mjs';
import {object} from './native-parts.mjs';

const dependency='Projects/T marbota/src/objects/chair-type1';
const production=await engineImport(`${dependency}/index.mjs`);
// Changes only this process's variant table, not the engine files.
production.VARIANTS.feed7={...production.VARIANTS.default,
 outer:'velvet-rust',inner:'velvet-rust',seat:'velvet-rust',
 shellWelt:'velvet-rust',seatWelt:'velvet-rust',shellThread:'thread-rust',seatThread:'thread-rust',
 clothScale:.45,restUV:true,clothNormal:true};
const nodes=production.build({tier:'hero',variant:'feed7',seed:7,name:'feed7-upholstered-chair'});
const materials={},groups={},parts=[],uvSources={};
for(const node of nodes)for(const m of node.mats){
 const id=m.material.replaceAll('-','_'),velvet=m.material.startsWith('velvet'),wood=m.material.startsWith('wood'),thread=m.material.startsWith('thread');
 materials[id]={color:velvet?'#365744':wood?'#68492e':thread?'#45664e':'#1a201b',finish:velvet||thread?'cloth':wood?'matte':'metal',roughness:velvet?.86:wood?.42:.7};
 groups[id]={material:id};
 parts.push({id,attach:'root',group:id,material:id,shape:{mesh:{positions:m.positions,normals:m.normals,indices:m.indices}}});
 // ObjectSpec /1 does not carry source UV arrays. Retain the pattern coordinates
 // beside it for remapping after the mesh budget pass.
 uvSources[id]={positions:m.positions,uvs:m.uvs};
}
const chair=object('feed7-production-tub-chair','FEED7 upholstered tub chair',materials,groups,parts);
chair.detail.mesh=[{name:'hero',samplesPerMetre:240,budget:{triangles:400000,method:'simplify'}},{name:'web',samplesPerMetre:80,budget:{triangles:24000,method:'simplify'}}];
chair.provenance={method:'authored',notes:'Local FEED7 finish adaptation of the existing Blockforge production chair pipeline, including its baked upholstery. Not a Three.js-authored model.'};
const source=join(projectRoot,'objects/chair');await mkdir(source,{recursive:true});
const save=(name,data)=>writeFile(join(source,name),JSON.stringify(data));
await save('chair.object.json',chair);await save('production-uvs.json',uvSources);
await save('object.project.json',{format:'blockforge-object-project/1',id:'feed7-chair',entry:'chair.object.json',exports:[]});
const recipes={};for(const [id,m]of Object.entries(materials))recipes[id]={recipe:id.startsWith('wood')?'walnut-oiled':id.startsWith('velvet')?'velvet-cotton':'paint-satin',set:{baseColor:m.color}};
await save('recipes.json',recipes);
const inputs=[];
async function record(dir){for(const entry of await readdir(join(ENGINE,dependency,dir),{withFileTypes:true})){
 const rel=join(dir,entry.name);if(entry.isDirectory()){await record(rel);continue;}
 if(!/\.(mjs|json|py)$/.test(entry.name))continue;
 const bytes=await readFile(join(ENGINE,dependency,rel));inputs.push({file:join(dependency,rel).replaceAll('\\','/'),sha256:createHash('sha256').update(bytes).digest('hex')});
}}
await record('');
await save('production-dependency.json',{format:'feed7-local-dependency/1',module:dependency,version:production.VERSION,variant:'feed7',seed:7,upstreamTier:'hero',upstreamTriangles:nodes.reduce((n,x)=>n+x.triangles,0),private:true,inputs});
console.log(`Adapted existing native production chair: ${nodes[0].triangles} hero triangles, real cloth bakes, welts, stitches and walnut frame. Local only.`);

import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {projectRoot} from '../../tools/engine.mjs';
const cache=new Map();
export function buildChair({tier='web'}={}){
 if(!cache.has(tier))cache.set(tier,(async()=>{
  let groups;
  if(tier==='hero'){
   const raw=JSON.parse(await readFile(join(projectRoot,'objects/chair/chair.object.json'),'utf8')),uv=JSON.parse(await readFile(join(projectRoot,'objects/chair/production-uvs.json'),'utf8'));
   groups=raw.parts.filter(p=>p.shape?.mesh).map(p=>({...p.shape.mesh,uvs:uv[p.material].uvs,material:p.material}));
  }else groups=JSON.parse(await readFile(join(projectRoot,'../public/native/chair.json'),'utf8')).groups;
  const mats=groups.map(g=>({...g,material:g.material.startsWith('velvet')?'fabric':g.material.startsWith('wood')?'wood':g.material.startsWith('thread')?'fabric':'ink'}));
  return [{name:'FEED7 upholstered tub chair',mats}];
 })());return cache.get(tier);
}

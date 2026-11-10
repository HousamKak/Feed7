import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {engineImport,projectRoot} from '../tools/engine.mjs';
export const K=await engineImport('Projects/studio 3d and interior design/src/styles/kit.mjs');
export const D=JSON.parse(await readFile(join(projectRoot,'world/design.json'),'utf8'));
export const P=D.palette;
export function createContext({tier='web'}={}){
 const items=[],rig=new K.Rig('feed7',{scale:1});
 return {items,rig,tier,mesh(id,metadata={}){const mesh=new K.Mesh(id);items.push({id,mesh,metadata});return mesh;},nodes(id,nodes,at=[0,0,0],yaw=0,metadata={}){items.push({id,nodes,at,yaw,metadata});}};
}
export const box=(m,center,size,color)=>m.box(center.map((v,k)=>v-size[k]/2),center.map((v,k)=>v+size[k]/2),color);
export const face=(y=10)=>({u:[1,0],n:[0,-1],at:s=>[s,y],length:30});

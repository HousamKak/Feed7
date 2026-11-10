// A purpose-built FEED7 sofa using native object source and the engine's baked
// pressure-cloth cushions. The cafe banquette is a method reference, not a sofa.
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {engineImport,projectRoot} from '../../tools/engine.mjs';
import {object} from '../../tools/native-parts.mjs';
import {roundedBox,cylinder} from '../primitives.mjs';

export async function buildSofa({tier='web'}={}){
 const O=await engineImport('src/object/index.js');await O.installDefaultSimplifier();
 const {Mesh}=await engineImport('Projects/T marbota/src/objects/chair-type1/lib/mesh.mjs');
 const materials={leather:{color:'#a0714f',finish:'cloth',roughness:.66,pbr:'leather-brown'},wood:{color:'#654a31',finish:'matte',roughness:.4},fabric:{color:'#3b6250',finish:'cloth',roughness:.9},seam:{color:'#76523c',finish:'cloth',roughness:.8},feet:{color:'#17211b',finish:'metal',roughness:.5}};
 const groups={frame:{material:'leather'},seats:{material:'leather'},backs:{material:'leather'},pillows:{material:'fabric'},wood:{material:'wood'},seams:{material:'seam'},feet:{material:'feet'}};
 const parts=[],frame=new Mesh();
 roundedBox(frame,[0,0,.235],[2.72,.85,.20],.055,'leather');roundedBox(frame,[0,.39,.64],[2.72,.16,.69],.055,'leather');roundedBox(frame,[0,0,.125],[2.50,.70,.10],.018,'wood');
 for(const s of [-1,1]){roundedBox(frame,[s*1.32,0,.45],[.18,.92,.56],.065,'leather');for(const y of [-.29,.29])cylinder(frame,[s*1.18,y,0],[s*1.18,y,.08],.026,'feet',32);}
 for(const m of frame.toMats())parts.push({id:`frame-${m.material}`,attach:'root',group:m.material==='leather'?'frame':m.material,material:m.material,shape:{mesh:{positions:m.positions,normals:m.normals,indices:m.indices}}});
 const read=async id=>JSON.parse(await readFile(join(projectRoot,'bakes',`${id}.part.json`),'utf8')).block;
 const seat=await read('sofa-seat'),back=await read('sofa-back'),pillow=await read('throw');
 const {qRot}=await engineImport('src/object/ObjectMath.js');
 const place=(source,id,group,material,t,angle=0)=>{
  const q=[Math.sin(angle/2),0,0,Math.cos(angle/2)],raw=source.shape.mesh,positions=[],normals=[];
  for(let i=0;i<raw.positions.length;i+=3){const p=qRot(q,raw.positions.slice(i,i+3)),n=qRot(q,raw.normals.slice(i,i+3));positions.push(...p.map((v,k)=>v+t[k]));normals.push(...n);}
  return {id,attach:'root',group,material,shape:{mesh:{positions,normals,indices:raw.indices}}};
 };
 const welts=new Mesh();
 for(const [i,x]of [-.83,0,.83].entries()){
  parts.push(place(seat,`seat-${i}`,'seats','leather',[x,-.025,.39]));
  const angle=Math.PI/2-.12;parts.push(place(back,`back-${i}`,'backs','leather',[x,.29,.70],angle));
  const path=[];for(let j=0;j<=100;j++){const a=j/100*Math.PI*2;path.push([x+Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**.42*.389,-.025+Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.42*.366,.446]);}welts.tube(path,.0025,7,'seam',{closed:true,caps:false});
 }
 for(const [i,x]of [-.94,.94].entries())parts.push(place(pillow,`throw-${i}`,'pillows','fabric',[x,.07,.66],Math.PI/2-.28));
 for(const m of welts.toMats())parts.push({id:'seat-welts',attach:'root',group:'seams',material:'seam',shape:{mesh:{positions:m.positions,normals:m.normals,indices:m.indices}}});
 const raw=object('feed7-sofa','FEED7 tailored lounge sofa',materials,groups,parts);raw.detail.mesh=[{name:'hero',samplesPerMetre:180,budget:{triangles:600000,method:'simplify'}},{name:'web',samplesPerMetre:70,budget:{triangles:35000,method:'simplify'}}];
 await writeFile(join(projectRoot,'objects/sofa/sofa.object.json'),JSON.stringify(raw));
 const result=O.compileObject(raw,{mesh:[tier]});if(!result.ok)throw new Error(O.formatIssues(result).join('\n'));
 const mats=[];
 for(const s of result.mesh[tier].surfaces){const p=result.instance.parts[s.labels[s.indices[0]]];const own=p.material||result.instance.groups[p.group].material;const material=own==='wood'?'wood':own==='fabric'?'fabric':own==='feet'?'ink':'leather';mats.push({material,sourceGroup:s.name,positions:Array.from(s.positions),normals:Array.from(s.normals),uvs:Array.from(s.uvs||[]),indices:Array.from(s.indices)});}
 return [{name:'feed7-sofa',mats}];
}

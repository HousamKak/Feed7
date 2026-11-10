// Native Blockforge part descriptions. These are engine source, not converted
// Three.js meshes. Coordinates are metres, Z up, with the sitter facing -Y.
// Native lofts avoid sampling a room-sized SDF lattice for small bevels.
export function box(id,group,material,center,size,round=.01){
 const [w,d,h]=size.map(v=>v/2),r=Math.max(.0001,Math.min(round,w*.99,d*.99,h*.99));
 const sections=[];
 for(const [z,inset]of [[-h,r],[-h+r*.3,r*.28],[-h+r,0],[h-r,0],[h-r*.3,r*.28],[h,r]]){
  const points=[];const cr=Math.max(.0001,r-inset);
  for(let k=0;k<4;k++)for(let j=0;j<=6;j++){
   const a=k*Math.PI/2+j*Math.PI/12;
   points.push([center[0]+Math.sign(Math.cos((k+.5)*Math.PI/2))*(w-r)+Math.cos(a)*cr,center[1]+Math.sign(Math.sin((k+.5)*Math.PI/2))*(d-r)+Math.sin(a)*cr]);
  }
  sections.push({at:center[2]+z,points,crease:true});
 }
 return {id,attach:'root',group,material,shape:{surface:{axis:'z',sections,closed:true,caps:true,smooth:false}}};
}
export function turned(id,group,material,profile,at=[0,0,0]){
 return {id,attach:'root',group,material,at:{t:at},shape:{surface:{axis:'z',revolve:{profile,segments:64}}}};
}
export function rod(id,group,material,a,b,r=.012,r2=r){
 const delta=b.map((v,i)=>Math.abs(v-a[i])),axis=delta.indexOf(Math.max(...delta)),other=[0,1,2].filter(i=>i!==axis),sections=[];
 for(const [p,radius]of [[a,r],[b,r2]]){const points=[];for(let i=0;i<16;i++){const t=i*Math.PI*2/16;points.push([p[other[0]]+Math.cos(t)*radius,p[other[1]]+Math.sin(t)*radius]);}sections.push({at:p[axis],points,crease:true});}
 sections.sort((a,b)=>a.at-b.at);
 return {id,attach:'root',group,material,shape:{surface:{axis:['x','y','z'][axis],sections,closed:true,caps:true,smooth:true}}};
}
export const curve=(id,group,material,points,radius)=>({id,attach:'root',group,material,shape:{curve:{points,radius,blend:radius*.5}}});
export const object=(id,title,materials,groups,parts)=>({format:'blockforge-object/1',id,title,version:1,materials,groups,parts:[{id:'root',roles:['support']},...parts],detail:{mesh:[{name:'hero',samplesPerMetre:240,budget:{triangles:800000,method:'simplify'}},{name:'web',samplesPerMetre:80,budget:{triangles:24000,method:'simplify'}}],targets:{cycles:'hero',still:'hero',web:'web',native:'web'},uvs:{mode:'box'}},licence:{id:'own',author:'FEED7'},provenance:{method:'authored',notes:'Authored as native Blockforge object source. No Three.js geometry is used.'}});

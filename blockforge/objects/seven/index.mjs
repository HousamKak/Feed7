import {engineImport} from '../../tools/engine.mjs';
const {triangulate2}=await engineImport('Projects/studio 3d and interior design/src/lib/mesh.mjs');
const shape=[[-1.25,3.5],[1.35,3.5],[1.35,2.75],[-.18,0],[-1.1,0],[.45,2.73],[-1.25,2.73]];
const cross2=(a,b)=>a[0]*b[1]-a[1]*b[0];
function inset(d){return shape.map((p,i)=>{
 const prev=shape[(i+shape.length-1)%shape.length],next=shape[(i+1)%shape.length],u=[p[0]-prev[0],p[1]-prev[1]],v=[next[0]-p[0],next[1]-p[1]],ul=Math.hypot(...u),vl=Math.hypot(...v),n=[u[1]/ul,-u[0]/ul],o=[v[1]/vl,-v[0]/vl],a=[p[0]+n[0]*d,p[1]+n[1]*d],delta=[(o[0]-n[0])*d,(o[1]-n[1])*d],t=cross2(delta,v)/cross2(u,v);return [a[0]+u[0]*t,a[1]+u[1]*t];
});}
export function build(){
 const positions=[],normals=[],uvs=[],indices=[];
 function tri(a,b,c){const u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n);if(l<1e-10)return;const i=positions.length/3;for(const p of [a,b,c]){positions.push(...p);normals.push(...n.map(x=>x/l));uvs.push(p[0],p[2]);}indices.push(i,i+1,i+2);}
 const rings=[[.43,.095],[.25,0],[-.14,0],[-.39,.085],[-.58,.18]].map(([y,d])=>inset(d).map(([x,z])=>[x,y,z]));
 for(let r=0;r<rings.length-1;r++)for(let i=0;i<shape.length;i++){
  const j=(i+1)%shape.length,a=rings[r][i],b=rings[r+1][i],c=rings[r+1][j],d=rings[r][j];
  if(r>=2){const u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1,m=a.map((v,k)=>(v+b[k]+c[k]+d[k])/4+n[k]/l*.028);tri(a,b,m);tri(b,c,m);tri(c,d,m);tri(d,a,m);}else{tri(a,b,c);tri(a,c,d);}
 }
 for(const [a,b,c]of triangulate2(inset(.095)))tri(rings[0][a],rings[0][b],rings[0][c]);
 const front=rings.at(-1);for(const [a,b,c]of triangulate2(inset(.18))){const p=front[a].map((v,k)=>(v+front[b][k]+front[c][k])/3-(k===1?.055:0));tri(front[a],front[c],p);tri(front[c],front[b],p);tri(front[b],front[a],p);}
 return [{name:'Faceted emerald crystal 7',mats:[{material:'emerald-crystal',positions,normals,uvs,indices,spec:{baseColor:'#65b58a',roughness:.035,metallic:0,transmission:.94,ior:1.9,thickness:1.01,attenuationColor:'#0e713f',attenuationDistance:1.8,dispersion:.08,flatShading:true}}]}];
}

export function buildOrb(){
 const t=(1+Math.sqrt(5))/2,vertices=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(p=>{const l=Math.hypot(...p);return p.map(v=>v/l*.68);});
 const faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]],edges=new Map(),corners=vertices.map(()=>[]),positions=[],normals=[],uvs=[],indices=[];
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>a.map((v,k)=>v-b[k]),dot=(a,b)=>a.reduce((n,v,k)=>n+v*b[k],0);
 function tri(a,b,c){let n=cross(sub(b,a),sub(c,a));if(dot(n,a)<0){[b,c]=[c,b];n=cross(sub(b,a),sub(c,a));}const l=Math.hypot(...n)||1,i=positions.length/3;for(const p of [a,b,c]){positions.push(...p);normals.push(...n.map(v=>v/l));uvs.push(p[0],p[2]);}indices.push(i,i+1,i+2);}
 for(const f of faces){const center=[0,1,2].map(k=>f.reduce((n,i)=>n+vertices[i][k],0)/3),q=f.map(i=>vertices[i].map((v,k)=>v*.82+center[k]*.18));tri(...q);f.forEach((v,i)=>corners[v].push(q[i]));for(let i=0;i<3;i++){const a=f[i],b=f[(i+1)%3],key=[a,b].sort((x,y)=>x-y).join('/'),p={a,b,pa:q[i],pb:q[(i+1)%3]};if(edges.has(key)){const e=edges.get(key);const aa=e.a===a?e.pa:e.pb,bb=e.b===b?e.pb:e.pa;tri(aa,bb,p.pb);tri(aa,p.pb,p.pa);}else edges.set(key,p);}}
 for(let i=0;i<corners.length;i++){const points=corners[i],center=[0,1,2].map(k=>points.reduce((n,p)=>n+p[k],0)/points.length),axis=vertices[i].map(v=>v/.68),u0=cross(axis,Math.abs(axis[2])<.8?[0,0,1]:[0,1,0]),ul=Math.hypot(...u0),u=u0.map(v=>v/ul),v=cross(axis,u);points.sort((a,b)=>Math.atan2(dot(sub(a,center),v),dot(sub(a,center),u))-Math.atan2(dot(sub(b,center),v),dot(sub(b,center),u)));for(let j=0;j<points.length;j++)tri(center,points[j],points[(j+1)%points.length]);}
 return [{name:'Floating cut emerald crystal',mats:[{material:'emerald-crystal',positions,normals,uvs,indices,spec:{baseColor:'#6dbb91',roughness:.035,metallic:0,transmission:.94,ior:1.9,thickness:1.2,attenuationColor:'#0e713f',attenuationDistance:1.8,dispersion:.08,flatShading:true}}]}];
}

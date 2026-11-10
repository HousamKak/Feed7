import {readFile} from 'node:fs/promises';
import {K,box} from './context.mjs';
import {chamferRoute,sampleRoute,routeLength} from './circuit-routes.mjs';
export async function buildCircuits(ctx){
 const source=JSON.parse(await readFile(new URL('./circuits.json',import.meta.url),'utf8'));
 const routes=source.routes.map(p=>chamferRoute(p,source.channel.cornerChamfer));
 const contacts=ctx.mesh('circuits/logo-contact',{emission:1.1,alwaysVisible:true,contactEffect:'landing'});
 for(const [i,r]of [.6,1.05,1.6].entries())K.ring(contacts,r,.009,-.008,'#93e9b8',K.translate([0,-24,0]),80,6);
 function entryDistance(r){if(r<3)return 0;const root=routes[[0,1,0,1][r-3]],point=routes[r][0];let distance=0,best=Infinity,entry=0;for(let i=1;i<root.length;i++){const a=root[i-1],b=root[i],v=b.map((x,k)=>x-a[k]),length=Math.hypot(...v),t=Math.max(0,Math.min(1,v.reduce((n,x,k)=>n+x*(point[k]-a[k]),0)/(length*length))),near=a.map((x,k)=>x+v[k]*t),delta=Math.hypot(...point.map((x,k)=>x-near[k]));if(delta<best){best=delta;entry=distance+t*length;}distance+=length;}return entry;}
 for(let r=0;r<routes.length;r++){
  const route=routes[r],positions=[],normals=[],uvs=[],indices=[];let distance=entryDistance(r);
  for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),n=[dy/l*.058,-dx/l*.058],k=positions.length/3;
   for(const p of [[a[0]+n[0],a[1]+n[1]],[a[0]-n[0],a[1]-n[1]],[b[0]-n[0],b[1]-n[1]],[b[0]+n[0],b[1]+n[1]]]){positions.push(...p,-.032);normals.push(0,0,1);}
   uvs.push(distance,0,distance,1,distance+l,1,distance+l,0);indices.push(k,k+2,k+1,k,k+3,k+2);distance+=l;
  }
  ctx.nodes(`circuits/recessed-inlay-${r}`,[{mats:[{material:'circuit-inlay',positions,normals,uvs,indices,spec:{baseColor:'#183c2e',roughness:.28,metallic:.65}}]}],[0,0,0],0,{alwaysVisible:true,emission:.04,contactEffect:'energized-track'});
 }
 for(let r=0;r<routes.length;r++)for(let j=0;j<2;j++){
  const phase=j*.5+r*.073,motion={kind:'route-packet',route:routes[r],speed:1.05+r*.07,phase,length:routeLength(routes[r]),entryDistance:entryDistance(r)},m=ctx.mesh(`circuits/light-packet-${r}-${j}`,{motion,emission:2.8,alwaysVisible:true});
  // Flat light packs sit below the floor surface, inside the routed channels.
  box(m,[0,0,-.025],[.082,.18,.008],'#bcffcf');
  box(m,[0,-.15,-.025],[.071,.09,.006],'#59bc86');
  box(m,[0,-.25,-.025],[.059,.065,.005],'#286a49');
 }
}

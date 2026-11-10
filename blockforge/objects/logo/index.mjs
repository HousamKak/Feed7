// The supplied brand silhouette, cut as a solid crystal in native Z-up space.
// No browser geometry builders are involved in the native logo.
import {readFile} from 'node:fs/promises';
import {engineImport} from '../../tools/engine.mjs';
const {triangulate2}=await engineImport('Projects/studio 3d and interior design/src/lib/mesh.mjs');
export async function buildLogo(){
 const data=JSON.parse(await readFile(new URL('../../../public/brand/monogram.json',import.meta.url),'utf8'));
 const positions=[],normals=[],uvs=[],indices=[];
 const cutCoordinate=p=>p[0]+p[2]*.65;
 function crown(p){const s=(cutCoordinate(p)+.11)/.44,wave=Math.abs((s-Math.floor(s))*2-1),weight=Math.max(0,Math.min(1,(-p[1]-.085)/.055));return [p[0],p[1]-.035*wave*weight,p[2]].map(v=>Math.round(v*1e6)/1e6);}
 function emit(a,b,c){[a,b,c]=[a,b,c].map(crown);const u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n);if(l<1e-12)return;const i=positions.length/3;for(const p of [a,b,c]){positions.push(...p);normals.push(...n.map(v=>v/l));uvs.push(p[0],p[2]);}indices.push(i,i+1,i+2);}
 function clip(poly,cut,sign){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(cutCoordinate(a)-cut)*sign,db=(cutCoordinate(b)-cut)*sign;if(da>=-1e-10)out.push(a);if(da*db<-1e-18){const t=da/(da-db);out.push(a.map((v,k)=>v+(b[k]-v)*t));}}return out;}
 function tri(a,b,c){let polygons=[[a,b,c]];for(const cut of [-.55,-.33,-.11,.11,.33,.55]){const next=[];for(const poly of polygons){const ds=poly.map(p=>cutCoordinate(p)-cut);if(Math.min(...ds)<-1e-10&&Math.max(...ds)>1e-10){next.push(clip(poly,cut,1),clip(poly,cut,-1));}else next.push(poly);}polygons=next;}for(const poly of polygons)for(let i=1;i<poly.length-1;i++)emit(poly[0],poly[i],poly[i+1]);}
 for(const commands of data.paths){
  let current;const outline=[],point=(x,y)=>[(x-data.width/2)/data.height,(data.height/2-y)/data.height];
  for(const [op,...v]of commands){if(op==='M'||op==='L'){current=point(...v);outline.push(current);}else if(op==='C'){const a=current,b=point(v[0],v[1]),c=point(v[2],v[3]),d=point(v[4],v[5]);for(let i=1;i<=8;i++){const t=i/8,s=1-t;outline.push([0,1].map(k=>s*s*s*a[k]+3*s*s*t*b[k]+3*s*t*t*c[k]+t*t*t*d[k]));}current=d;}}
  const area=outline.reduce((n,p,i)=>n+p[0]*outline[(i+1)%outline.length][1]-p[1]*outline[(i+1)%outline.length][0],0);if(area<0)outline.reverse();
  function inset(d){return outline.map((p,i)=>{const prev=outline[(i+outline.length-1)%outline.length],next=outline[(i+1)%outline.length],a=[p[0]-prev[0],p[1]-prev[1]],b=[next[0]-p[0],next[1]-p[1]],al=Math.hypot(...a),bl=Math.hypot(...b),na=[-a[1]/al,a[0]/al],nb=[-b[1]/bl,b[0]/bl],den=1+na[0]*nb[0]+na[1]*nb[1];return p.map((v,k)=>v+d*(na[k]+nb[k])/Math.max(.25,den));});}
  // Broad polished bevels, a deep waist, and smaller crown facets.
  const rings=[[.09,.012],[.05,0],[-.035,0],[-.085,.012],[-.14,.025]].map(([y,d])=>inset(d).map(([x,z])=>[x,y,z]));
  for(let r=0;r<rings.length-1;r++)for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length,a=rings[r][i],b=rings[r+1][i],c=rings[r+1][j],d=rings[r][j];tri(a,c,b);tri(a,d,c);}
  for(const [r,back]of [[0,true],[rings.length-1,false]]){const ring=rings[r],cap=triangulate2(ring.map(p=>[p[0],p[2]]));if(cap.length!==outline.length-2)throw new Error('Incomplete crystal logo cap');for(const [a,b,c]of cap)back?tri(ring[a],ring[c],ring[b]):tri(ring[a],ring[b],ring[c]);}
 }
 return [{name:'Original ivory FEED7 crystal logo',mats:[{material:'brand-crystal',positions,normals,uvs,indices,spec:{baseColor:'#f2eee3',roughness:.025,metallic:0,transmission:.86,ior:1.9,thickness:.265,attenuationColor:'#f2eee3',attenuationDistance:.8,dispersion:.05,flatShading:true}}]}];
}

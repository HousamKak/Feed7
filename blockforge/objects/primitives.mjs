// Native production mesh helpers. They use the engine's own mesh builder and
// preserve metric UVs. There is no browser geometry dependency in this codebase.
import {engineImport} from '../tools/engine.mjs';
export const {Mesh}=await engineImport('Projects/T marbota/src/objects/chair-type1/lib/mesh.mjs');
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,s)=>a.map(v=>v*s);
export const norm=a=>mul(a,1/(Math.hypot(...a)||1));
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function roundedBox(m,center,size,r,material){
 const half=size.map(v=>v/2);r=Math.min(r,...half.map(v=>v*.95));
 const sample=(t,h)=>{const v=[-h,-h+r*.28,-h+r*.65,-h+r,0,h-r,h-r*.65,h-r*.28,h];const f=t*8,i=Math.min(7,Math.floor(f));return v[i]+(v[i+1]-v[i])*(f-i);};
 for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
  const u=(axis+1)%3,v=(axis+2)%3;
  m.grid((a,b)=>{const q=[0,0,0];q[axis]=half[axis]*sign;q[u]=sample(a,half[u]);q[v]=sample(b,half[v]);const inner=q.map((x,k)=>Math.max(-half[k]+r,Math.min(half[k]-r,x))),d=norm(sub(q,inner));return add(center,add(inner,mul(d,r)));},8,8,{mat:material,flip:sign<0,uv:(a,b)=>[a*size[u],b*size[v]]});
 }
}
export function cylinder(m,a,b,r,material,segments=32,r2=r){
 const axis=norm(sub(b,a)),l=Math.hypot(...sub(b,a)),bevel=Math.min(.0015,l*.15,r*.15);
 m.lathe([[0,0],[r-bevel,0],[r,bevel],[r2,l-bevel],[r2-bevel,l],[0,l]],a,axis,segments,material);
}
export function ring(m,center,axis,r,tube,material,segments=48,sides=7){
 const n=norm(axis),u=norm(cross(n,Math.abs(n[2])<.8?[0,0,1]:[0,1,0])),v=cross(n,u),path=[];
 for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;path.push(add(center,add(mul(u,Math.cos(a)*r),mul(v,Math.sin(a)*r))));}m.tube(path,tube,sides,material,{closed:true,caps:false});
}
export function curve(points,steps=48){
 const out=[];for(let i=0;i<=steps;i++){const f=i/steps*(points.length-1),j=Math.min(points.length-2,Math.floor(f)),t=f-j,p0=points[Math.max(0,j-1)],p1=points[j],p2=points[j+1],p3=points[Math.min(points.length-1,j+2)];out.push(p1.map((v,k)=>.5*((2*v)+(-p0[k]+p2[k])*t+(2*p0[k]-5*v+4*p2[k]-p3[k])*t*t+(-p0[k]+3*v-3*p2[k]+p3[k])*t*t*t)));}return out;
}
export function quad(m,points,material){const g=m.part(material),i=g.P.length;g.P.push(...points);g.UV.push([0,0],[1,0],[1,1],[0,1]);g.I.push(i,i+1,i+2,i,i+2,i+3);}
export function tripod(m,h,{spread=.48,material='ink'}={}){
 cylinder(m,[0,0,.12],[0,0,h],.018,material);
 for(let i=0;i<3;i++){const a=i/3*Math.PI*2,foot=[Math.cos(a)*spread,Math.sin(a)*spread,.025],top=[0,0,h*.55];cylinder(m,top,foot,.014,'metal',16,.009);cylinder(m,[0,0,h*.29],[foot[0]*.7,foot[1]*.7,h*.13],.006,'metal',12);roundedBox(m,foot,[.065,.05,.035],.012,'rubber');}
 for(const z of [.35,.70,1.05])if(z<h){cylinder(m,[0,0,z-.015],[0,0,z+.015],.028,'ink',24);roundedBox(m,[.04,0,z],[.045,.028,.022],.006,'rubber');}
}
export const SPECS={ink:{baseColor:'#19221d',roughness:.48,metallic:.15},metal:{baseColor:'#4c5b52',roughness:.3,metallic:.9},brass:{baseColor:'#a79670',roughness:.35,metallic:.9},rubber:{baseColor:'#101812',roughness:.86},grille:{baseColor:'#344039',roughness:.48,metallic:.75},lens:{baseColor:'#243b37',roughness:.045,metallic:.05,transmission:.9,ior:1.5},diffuser:{baseColor:'#e4e2d7',roughness:.95,emission:.25},screen:{baseColor:'#233d30',roughness:.25,emission:.15}};
export const result=(m,id)=>[{name:id,id:`feed7/${id}`,object:{id,version:'1.0.0'},mats:m.toMats(Object.fromEntries(Object.entries(SPECS).map(([id,spec])=>[id,{spec}])))}];

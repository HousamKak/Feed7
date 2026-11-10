import {Mesh,add,roundedBox,cylinder,ring,curve,quad,tripod,result} from '../primitives.mjs';
export function build({tier='web'}={}){
 const m=new Mesh(),h=2.25,r=.50,depth=.35,n=8,front=[0,0,h],segments=tier==='hero'?12:6;
 tripod(m,h-.45,{spread:.56});
 const point=(i,t)=>{const a=(i+.5)/n*Math.PI*2,rr=.11+(r-.11)*t,bulge=Math.sin(t*Math.PI)*.022;return [Math.cos(a)*(rr+bulge),depth*(1-t),h+Math.sin(a)*(rr+bulge)];};
 for(let i=0;i<n;i++){
  const a=(i+.5)/n*Math.PI*2,b=(i+1.5)/n*Math.PI*2;
  m.grid((u,v)=>{const p=point(i,v),q=point(i+1,v),s=Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*.008;return [p[0]+(q[0]-p[0])*u,depth*(1-v)+s,p[2]+(q[2]-p[2])*u];},segments,12,{mat:'rubber',uv:(u,v)=>[u*.38,v*.47]});
  m.tube(Array.from({length:17},(_,j)=>point(i,j/16)),.0035,6,'ink');
  m.tube([point(i,1),point(i+1,1)],.007,8,'ink');
  quad(m,[[0,-.002,h],point(i,1).map((v,k)=>v+(k===1?-.002:0)),point(i+1,1).map((v,k)=>v+(k===1?-.002:0)),[0,-.002,h]],'diffuser');
 }
 cylinder(m,[0,depth-.01,h],[0,depth+.035,h],.12,'ink',48);ring(m,[0,depth+.04,h],[0,1,0],.075,.008,'metal');
 m.tube(curve([[-.22,.15,h],[-.22,.15,h-.38],[.22,.15,h-.38],[.22,.15,h]],48),.012,10,'metal');
 for(const s of [-1,1]){cylinder(m,[s*.19,.15,h],[s*.245,.15,h],.029,'ink',32);cylinder(m,[s*.245,.15,h],[s*.255,.15,h],.012,'brass',24);}
 roundedBox(m,[0,.35,h-.10],[.16,.06,.07],.01,'ink');
 return result(m,'softbox');
}

import {K,P,box} from './context.mjs';
export function buildCeiling(ctx){
 const body=ctx.mesh('ceiling/racetrack-frames');
 for(const [id,x,y,z]of [['recording',-9,5,5.0],['digital',9,5,5.0]]){
  const path=K.roundRect(x,y,5.8,3.1,.65,ctx.tier==='hero'?20:12).map(([x,y])=>[x,y,z]);path.push(path[0]);body.tube(path,.048,12,P.ink);
  const glow=ctx.rig.fixture(`ceiling-${id}`,{name:`${id} suspended luminaire`,kind:'architectural',emission:4,lights:[{type:'area',at:[x,y,z-.08],dir:[0,0,-1],size:[4.4,2],color:'#fff0dc',intensity:30}]});glow.tube(path.map(p=>[p[0],p[1],p[2]-.038]),.016,10,'#f2e6c9');
  for(const dx of [-2.15,2.15])for(const dy of [-1,1])body.tube([[x+dx,y+dy,z],[x+dx,y+dy,8.4]],.006,6,P.metal);
 }
 const wash=ctx.rig.fixture('rear-wall-cove',{name:'Concealed warm wall wash',kind:'cove',emission:3,lights:[{type:'area',at:[0,9.8,7.8],dir:[0,.3,-1],size:[22,.3],color:'#ffdfaf',intensity:18}]});box(wash,[0,10.10,7.93],[27,.05,.028],'#efd7b0');
 // An airy mobile and warm pool over the conversation area.
 const mobile=ctx.mesh('ceiling/lounge-mobile',{metalness:.8,motion:{kind:'spin',axis:'y',speed:.045,pivot:[9,-5,3.65]}});
 for(let i=0;i<3;i++)K.ring(mobile,.65+i*.22,.018,0,i===1?P.brass:P.metal,p=>[9+p[0],-5+p[1]*Math.cos(i*.7)-p[2]*Math.sin(i*.7),3.65+p[1]*Math.sin(i*.7)+p[2]*Math.cos(i*.7)],96,8);
 body.tube([[9,-5,4.65],[9,-5,8.4]],.007,6,P.metal);
}

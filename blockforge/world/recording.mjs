import {K,P,box,face,D} from './context.mjs';
import {buildChair} from '../objects/chair/delivery.mjs';
import {build as microphone} from '../objects/microphone/index.mjs';
import {build as camera} from '../objects/camera/index.mjs';
import {build as softbox} from '../objects/softbox/index.mjs';
export async function buildRecording(ctx){
 const {center:[cx,cy,z],tableRadius:r,chairDistance:dist}=D.zones.recording;
 const set=ctx.mesh('recording/table',{scan:'walnut-natural'});
 set.lathe([[0,0],[.48,0],[.50,.025],[.46,.065],[.22,.12],[.20,.67],[.44,.71],[r-.03,.72],[r,.735],[r,.775],[r-.03,.79],[0,.79]],96,P.wood,K.translate([cx,cy,z]));
 for(let i=0;i<44;i++){const a=i/44*Math.PI*2;set.cylinder(.008,z+.1,z+.67,8,P.woodDark,K.translate([cx+Math.cos(a)*.208,cy+Math.sin(a)*.208,0]));}
 const chairs=await buildChair({tier:ctx.tier});
 for(const [id,dx,dy,yaw]of [['west',-dist,0,Math.PI/2],['east',dist,0,-Math.PI/2],['north',0,dist,0],['south',0,-dist,Math.PI]])ctx.nodes(`recording/chair-${id}`,chairs,[cx+dx,cy+dy,z],yaw,{production:'Blockforge chair-type1',scan:'mixed'});
 const acoustics=ctx.mesh('recording/acoustic-wall',{scan:'walnut-natural'});K.slatWall(acoustics,face(8.5),{s0:-12.2,s1:-5.8,z0:z,z1:4.2,pitch:.12,slat:.05,depth:.08,felt:P.ink,colors:[P.wood,P.woodDark],round:true});
 const badge=ctx.mesh('recording/on-air',{emission:1});K.ring(badge,.72,.018,0,P.amber,p=>[p[0]+cx,8.32-p[2],p[1]+2.5],96,8);
 for(const [i,[dx,dy]]of [[-.48,.35],[.48,-.35]].entries()){ctx.nodes(`recording/microphone-${i}`,microphone({tier:ctx.tier,seed:7+i}),[cx+dx,cy+dy,z+.79],i===0?-Math.PI/2:Math.PI/2,{production:'FEED7 native broadcast microphone'});K.headphones(ctx.mesh(`recording/headphones-${i}`),cx+dx,cy+dy*.1,z+.80,dx<0?35:-35,{color:P.ink,band:P.woodDark});}
 for(const [i,[x,y]]of [[-12,2],[-6,7]].entries())ctx.nodes(`recording/camera-${i}`,camera({tier:ctx.tier}),[x,y,z],Math.atan2(cy-y,cx-x)+Math.PI/2,{production:'FEED7 native cinema camera'});
 for(const [i,[x,y]]of [[-12,6.5],[-6.1,3.3]].entries()){
  ctx.nodes(`recording/softbox-${i}`,softbox({tier:ctx.tier}),[x,y,z],Math.atan2(cy-y,cx-x)+Math.PI/2,{production:'FEED7 native octagonal softbox'});
  const at=[x,y,z+2.25],dir=[cx-x,cy-y,1.1-at[2]],length=Math.hypot(...dir);ctx.rig.fixture(i===0?'recording-key':'recording-fill',{kind:'key',name:'Recording softbox',lights:[{type:'area',at,dir:dir.map(v=>v/length),size:[.9,.9],color:'#fff0dc',intensity:i===0?40:25}]});
 }
 const clouds=ctx.mesh('recording/clouds',{scan:'linen'});K.clouds(clouds,[[-10.7,5,1.3,2.5],[-9,5,1.3,2.5],[-7.3,5,1.3,2.5]],4.4,{color:P.fabric,edge:P.ink,drop:.3});
 for(let i=0;i<25;i++){const x=-12+i*.25,z=1.3+Math.sin(i*.7)*.08,bars=ctx.mesh(`recording/waveform-${i}`,{emission:.6,motion:{kind:'scale',axis:'y',amplitude:.65,period:2.4+(i%5)*.18,phase:i*.55,pivot:[x,8.27,z]}});box(bars,[x,8.27,z],[.07,.025,.15+Math.sin(i*.4)**2*.45],P.amber);}
 const artwork=ctx.mesh('graphics/production',{graphic:'generated/production-detail.webp'});artwork.panel([-12.3,10.13,4.5],[-5.7,10.13,4.5],[-5.7,10.13,7.2],[-12.3,10.13,7.2],P.ivory,[0,-1,0]);
}

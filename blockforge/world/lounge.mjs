import {K,P,box} from './context.mjs';
import {engineImport} from '../tools/engine.mjs';
import {flattenNodes} from './production.mjs';
import {buildSofa} from '../objects/sofa/build.mjs';
import {build as taskChair} from '../objects/task-chair/index.mjs';
import {build as monitor} from '../objects/monitor/index.mjs';
import {buildChair} from '../objects/chair/delivery.mjs';
export async function buildLounge(ctx){
 const nodes=await buildSofa({tier:ctx.tier});
 ctx.nodes('lounge/sofa',nodes,[9.4,-5.2,.02],-Math.PI/2,{production:'Blockforge tailored sofa with pressure-cloth bakes',scan:'mixed'});
 const tables=ctx.mesh('lounge/tables',{scan:'walnut-natural'});K.coffeeTable(tables,[8.0,-5.2],{kind:'round',r:.7,h:.39,color:P.wood,base:P.ink,accent:P.brass});
 const rug=ctx.mesh('lounge/rug',{scan:'linen'});K.rug(rug,[8.5,-5.0],{kind:'border',w:4.6,d:4.0,colors:[P.fabric,'#596551',P.woodDark]});
 const conversationChairs=await buildChair({tier:ctx.tier});
 for(const [i,[x,y]]of [[6.8,-4.6],[6.8,-5.8]].entries())ctx.nodes(`lounge/conversation-chair-${i}`,conversationChairs,[x,y,.015],Math.atan2(-5.2-y,8.0-x)+Math.PI/2,{production:'FEED7 matching upholstered recording chair'});
 const display=ctx.mesh('technology/workstations',{scan:'walnut-natural'});box(display,[9,6.1,.93],[5.7,.85,.09],P.wood);for(const x of [6.4,11.6])box(display,[x,6.1,.55],[.08,.7,.78],P.ink);
 const electronics=ctx.mesh('technology/electronics');
 for(const [i,x]of [7.5,9,10.5].entries()){
  ctx.nodes(`technology/monitor-${i}`,monitor(),[x,6.2,.975],0,{production:'FEED7 native display assembly'});
  box(electronics,[x,5.8,1.0],[.55,.20,.018],P.ink);for(let row=0;row<5;row++)for(let col=0;col<15;col++)box(electronics,[x-.25+col*.035,5.72+row*.033,1.012],[.029,.025,.007],row===4?P.metal:P.ink);
  ctx.nodes(`technology/task-chair-${i}`,taskChair(),[x,5.2,.18],Math.PI,{production:'FEED7 native ergonomic task chair'});
 }
 for(const [id,x]of [['design',7.5],['code',9],['growth',10.5]]){const screen=ctx.mesh(`screens/${id}`,{screen:id,emission:.4});screen.panel([x-.64,6.226,1.225],[x+.64,6.226,1.225],[x+.64,6.226,1.945],[x-.64,6.226,1.945],P.ivory,[0,-1,0]);}
 const art=ctx.mesh('graphics/signal',{graphic:'generated/emerald-signal.webp'});art.panel([5.8,10.13,3.7],[12.2,10.13,3.7],[12.2,10.13,7.1],[5.8,10.13,7.1],P.ivory,[0,-1,0]);
 const shelves=ctx.mesh('gallery/shelves',{scan:'walnut-natural'});for(let k=0;k<3;k++){box(shelves,[-10,10.02,1.0+k*.8],[5,.35,.06],P.wood);K.books(shelves,-12,-8,1.03+k*.8,K.translate([0,9.9,0]),7+k,[P.woodDark,P.fabric,P.ivory,P.leather]);}
 for(let i=0;i<9;i++){const ribbons=ctx.mesh(`gallery/ribbon-${i}`,{metalness:.9,roughness:.24,motion:{kind:'spin',axis:'y',speed:.045+i*.008,pivot:[-9,-3.3,1.4]}}),path=[];for(let j=0;j<48;j++){const a=j/47*Math.PI*2;path.push([-9+Math.cos(a)*(1.05+i*.08),-3.3+Math.sin(a)*.42,1.4+Math.sin(a+i*.22)*1.1]);}ribbons.tube(path,.017,8,i%3===0?P.brass:'#9baaa1');}
 const plinth=ctx.mesh('gallery/plinth');plinth.cylinder(1.8,0,.18,80,P.ink,K.translate([-9,-3.3,0]));
 const planting=await engineImport('Projects/T marbota/src/objects/planting/index.mjs');
 const trees=flattenNodes(planting.buildPottedOlive({tier:ctx.tier==='hero'?'hero':'max',seed:7}));
 for(const n of trees)for(const m of n.mats)m.material=/leaf|blade/.test(m.material)?/under|back/.test(m.material)?'leafDark':'leaf':/bark|wood/.test(m.material)?'woodDark':'ink';
 for(const [i,[x,y,yaw]]of [[-12.7,7.7,0],[12.7,7.8,.7],[-12,-4,1.4],[12,-4,2.2],[5,-7,3.0]].entries())ctx.nodes(`decor/olive-${i}`,trees,[x,y,0],yaw,{production:'Blockforge potted olive',scan:'mixed'});
 K.floorLamp(ctx.mesh('lounge/lamp'),ctx.rig,'lounge-practical',11,-2.8,{kind:'arc',h:1.7,body:P.brass,shade:P.ivory,intensity:15});
}

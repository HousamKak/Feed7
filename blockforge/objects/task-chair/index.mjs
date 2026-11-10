import {Mesh,roundedBox,cylinder,curve,result} from '../primitives.mjs';
export function build(){
 const m=new Mesh();
 cylinder(m,[0,0,.08],[0,0,.40],.025,'metal',32);cylinder(m,[0,0,.24],[0,0,.39],.04,'ink',32);
 for(let i=0;i<5;i++){
  const a=i/5*Math.PI*2,foot=[Math.cos(a)*.31,Math.sin(a)*.31,.06];m.tube(curve([[0,0,.17],[foot[0]*.45,foot[1]*.45,.10],foot],20),.018,10,'metal');
  const tangent=[-Math.sin(a),Math.cos(a),0];for(const s of [-1,1]){const c=[foot[0]+tangent[0]*s*.014,foot[1]+tangent[1]*s*.014,.035];cylinder(m,[c[0]-tangent[0]*.009,c[1]-tangent[1]*.009,c[2]],[c[0]+tangent[0]*.009,c[1]+tangent[1]*.009,c[2]],.032,'rubber',24);}
 }
 roundedBox(m,[0,0,.44],[.55,.54,.105],.045,'fabric');roundedBox(m,[0,0,.388],[.48,.46,.035],.012,'ink');
 // Curved, raked padded back with a separate structural shell and lumbar roll.
 const backPoint=(u,v,offset=0)=>{const x=(u-.5)*.56,z=.47+v*.55,y=.205+v*.085+.10*(x/.28)**2+offset;return [x,y,z];};
 const back=(offset,material)=>m.grid((u,v)=>backPoint(u,v,offset),20,24,{mat:material,uv:(u,v)=>[u*.56,v*.55],flip:material==='ink'});
 back(0,'fabric');back(.035,'ink');
 const edge=[];for(let i=0;i<=20;i++)edge.push(backPoint(i/20,0,.0175));for(let i=1;i<=20;i++)edge.push(backPoint(1,i/20,.0175));for(let i=19;i>=0;i--)edge.push(backPoint(i/20,1,.0175));for(let i=19;i>=0;i--)edge.push(backPoint(0,i/20,.0175));m.tube(edge,.0185,8,'ink',{closed:true,caps:false});
 for(const s of [-1,1]){m.tube(curve([[s*.23,.22,.45],[s*.27,.23,.68],[s*.27,.30,.94]],32),.013,10,'ink');m.tube(curve([[s*.25,-.03,.40],[s*.32,-.03,.55],[s*.32,.01,.64]],24),.014,10,'metal');roundedBox(m,[s*.32,.035,.65],[.085,.31,.048],.018,'rubber');}
 roundedBox(m,[0,.21,.60],[.42,.09,.115],.042,'fabric');roundedBox(m,[0,.29,1.04],[.34,.10,.13],.045,'fabric');
 roundedBox(m,[.15,-.03,.36],[.14,.03,.025],.008,'ink');
 const nodes=result(m,'ergonomic-task-chair');for(const mat of nodes[0].mats)if(mat.material==='fabric')mat.spec={baseColor:'#314a3c',roughness:.87};return nodes;
}

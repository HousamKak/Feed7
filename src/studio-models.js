import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Models are authored in metres, Y up. The chair faces local -Z. Construction
// details are real geometry, shared by the studio, modelling preview and export.
const add=(g,geometry,material,p=[0,0,0],r=[0,0,0],name='')=>{const o=new THREE.Mesh(geometry,material);o.position.set(...p);o.rotation.set(...r);o.castShadow=o.receiveShadow=true;o.name=name;g.add(o);return o;};
const soft=(g,mat,p,size,r=.04,name='')=>add(g,new RoundedBoxGeometry(...size,5,Math.min(r,...size.map(s=>s*.45))),mat,p,[0,0,0],name);
const rod=(g,mat,a,b,r=.012,foot=r)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const o=add(g,new THREE.CylinderGeometry(r,foot,delta.length(),12),mat,av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;};
const tube=(g,mat,points,r=.003,closed=false,segments=48)=>add(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'centripetal'),segments,r,5,closed),mat);
const ring=(g,mat,radius,tubeRadius,p,rotation=[0,0,0])=>add(g,new THREE.TorusGeometry(radius,tubeRadius,6,48),mat,p,rotation);
const cylinder=(g,mat,r,h,p,top=r)=>add(g,new THREE.CylinderGeometry(top,r,h,48),mat,p);

// RoundedBoxGeometry duplicates vertices along its UV seams. Recomputing normals
// directly would shade every triangle separately after sculpting the cushion.
function smoothSculptedNormals(geometry){
 const p=geometry.attributes.position,index=geometry.index?.array||Array.from({length:p.count},(_,i)=>i),sums=new Map(),keys=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*100000)).join(',');keys.push(key);if(!sums.has(key))sums.set(key,new THREE.Vector3());}
 for(let i=0;i<index.length;i+=3){a.fromBufferAttribute(p,index[i]);b.fromBufferAttribute(p,index[i+1]);c.fromBufferAttribute(p,index[i+2]);const n=b.sub(a).cross(c.sub(a));for(let j=0;j<3;j++)sums.get(keys[index[i+j]]).add(n);}
 for(const n of sums.values())n.normalize();const normals=new Float32Array(p.count*3);for(let i=0;i<p.count;i++)sums.get(keys[i]).toArray(normals,i*3);geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
}

function seamLoop(g,mat,w,d,y,z=0){const points=[];for(let i=0;i<64;i++){const a=i/64*Math.PI*2,c=Math.cos(a),s=Math.sin(a);points.push([Math.sign(c)*Math.pow(Math.abs(c),.5)*w/2,y,z+Math.sign(s)*Math.pow(Math.abs(s),.5)*d/2]);}return tube(g,mat,points,.0025,true,64);}

export function createChair(m,{upholstery=m.fabric}={}){
 const g=new THREE.Group();g.name='Tailored conference chair';
 const shell=soft(g,m.ink,[0,.435,0],[.67,.05,.65],.025,'Seat pan');
 const seat=soft(g,upholstery,[0,.5,-.015],[.65,.115,.63],.05,'Upholstered seat');
 const p=seat.geometry.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i)/.325,z=p.getZ(i)/.315,y=p.getY(i);p.setY(i,y-(y>0?.016:0)*Math.max(0,1-x*x)*Math.max(0,1-z*z)+z*.012);}smoothSculptedNormals(seat.geometry);
 seamLoop(g,m.seam,.615,.59,.521,-.015);
 // A tapered, curved shell with a lumbar swell, rather than a rectangular slab.
 const back=soft(g,upholstery,[0,.87,.245],[.64,.61,.095],.043,'Curved backrest');
 const v=back.geometry.attributes.position;
 for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i),t=(y+.305)/.61;v.setXYZ(i,x*(.92+.08*Math.sin(t*Math.PI)),y,v.getZ(i)+t*.13-.095*Math.pow(x/.32,2)-.018*Math.sin(t*Math.PI));}smoothSculptedNormals(back.geometry);
 const seam=[],ray=new THREE.Raycaster();back.updateMatrixWorld(true);for(let i=0;i<72;i++){const a=i/72*Math.PI*2,x=Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.35)*.265,y=Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.35)*.245,t=(y+.305)/.61,px=x*(.92+.08*Math.sin(t*Math.PI)),py=.87+y;ray.set(new THREE.Vector3(px,py,-1),new THREE.Vector3(0,0,1));const hit=ray.intersectObject(back,false)[0];if(hit)seam.push([px,py,hit.point.z-.0018]);}tube(g,m.seam,seam,.002,true,72);
 for(const side of [-1,1]){
  rod(g,m.metal,[side*.235,.43,.21],[side*.24,.79,.31],.014);
  tube(g,m.metal,[[side*.29,.43,-.12],[side*.36,.51,-.11],[side*.36,.67,-.07],[side*.34,.69,.16]],.013);
  const arm=soft(g,upholstery,[side*.35,.701,-.005],[.075,.045,.36],.02,'Arm pad');arm.rotation.x=-.04;
  for(const z of [-.235,.235]){
   rod(g,m.metal,[side*.23,.425,z],[side*.295,.025,z*1.2],.021,.012);
   cylinder(g,m.ink,.017,.016,[side*.295,.008,z*1.2]);
  }
 }
 rod(g,m.metal,[-.23,.395,.22],[.23,.395,.22],.013);
 cylinder(g,m.metal,.04,.018,[0,.405,0]);
 return g;
}

export function createMicrophone(m){
 const g=new THREE.Group();g.name='Broadcast microphone and articulated desk stand';
 // The weighted stand rests on the tabletop at y=0.
 const profile=[[0,0],[.105,0],[.12,.009],[.12,.024],[.11,.035],[.028,.035],[.026,.045],[0,.045]].map(p=>new THREE.Vector2(...p));
 add(g,new THREE.LatheGeometry(profile,64),m.ink);
 ring(g,m.metal,.111,.002,[0,.029,0],[Math.PI/2,0,0]);
 cylinder(g,m.metal,.021,.13,[0,.105,0]);
 const elbow=[0,.3,.10],joint=[0,.39,.31];
 for(const x of [-.017,.017]){rod(g,m.ink,[x,.15,0],[x,...elbow.slice(1)],.009);rod(g,m.ink,[x,...elbow.slice(1)],[x,...joint.slice(1)],.009);}
 for(const p of [[0,.15,0],elbow,joint]){const bolt=cylinder(g,m.metal,.022,.052,p);bolt.rotation.z=Math.PI/2;const cap=cylinder(g,m.ink,.012,.056,p);cap.rotation.z=Math.PI/2;}
 // A spring, hinge bolts, yoke, socket and cable make the support read as hardware.
 const spring=[];for(let i=0;i<=100;i++){const t=i/100;spring.push([.009*Math.cos(t*Math.PI*22),.18+t*.115,.035+t*.04+.009*Math.sin(t*Math.PI*22)]);}tube(g,m.metal,spring,.0015,false,100);
 const mic=new THREE.Group();mic.position.set(0,.435,.35);mic.rotation.x=-.18;g.add(mic);
 const body=add(mic,new THREE.CylinderGeometry(.033,.036,.125,40),m.ink,[0,0,.005],[Math.PI/2,0,0],'Microphone barrel');
 const grille=add(mic,new THREE.CapsuleGeometry(.035,.055,6,32),m.grille,[0,0,-.095],[Math.PI/2,0,0],'Capsule grille');
 for(let i=0;i<13;i++)ring(mic,m.metal,.0357,.0008,[0,0,-.045-i*.006]);
 for(let i=0;i<12;i++){const a=i*Math.PI*2/12;rod(mic,m.metal,[Math.cos(a)*.0358,Math.sin(a)*.0358,-.047],[Math.cos(a)*.0358,Math.sin(a)*.0358,-.12],.00065);}
 for(const z of [-.036,.062])ring(mic,m.metal,.035,.002,[0,0,z]);
 tube(mic,m.metal,[[-.055,.015,0],[-.055,-.052,0],[0,-.065,0],[.055,-.052,0],[.055,.015,0]],.006);
 for(const x of [-.047,.047]){const knob=cylinder(mic,m.ink,.014,.022,[x,0,0]);knob.rotation.z=Math.PI/2;}
 const socket=add(mic,new THREE.CylinderGeometry(.014,.014,.027,20),m.metal,[0,0,.087],[Math.PI/2,0,0]);
 soft(mic,m.metal,[0,.035,.025],[.011,.003,.026],.001);
 tube(g,m.cable,[[0,.42,.45],[.035,.35,.41],[.035,.3,.1],[.025,.16,.01],[.025,.045,-.04],[.12,.008,-.12],[.24,.006,-.28]],.0035);
 return g;
}

export function createSofa(m){
 const g=new THREE.Group();g.name='Tailored three-seat sofa';
 soft(g,m.wood,[0,.22,0],[3.4,.15,.91],.03,'Timber base');
 soft(g,m.fabric,[0,.29,0],[3.5,.16,.98],.08,'Upholstered deck');
 for(const x of [-1.48,1.48])for(const z of [-.34,.34]){rod(g,m.wood,[x,.22,z],[x*1.035,.025,z*1.07],.035,.022);cylinder(g,m.ink,.024,.012,[x*1.035,.006,z*1.07]);}
 for(const side of [-1,1])soft(g,m.fabric,[side*1.69,.57,.02],[.22,.59,1.01],.09,'Padded arm');
 soft(g,m.fabric,[0,.69,.43],[3.3,.68,.22],.08,'Back frame');
 for(let i=0;i<3;i++){
  const x=(i-1)*1.055;
  const seat=soft(g,m.fabric,[x,.445,-.065],[1.025,.15,.76],.07,'Separate seat cushion');
  const pos=seat.geometry.attributes.position;for(let j=0;j<pos.count;j++){const xx=pos.getX(j)/.513,z=pos.getZ(j)/.38;if(pos.getY(j)>0)pos.setY(j,pos.getY(j)-.013*(1-xx*xx)*(1-z*z));}smoothSculptedNormals(seat.geometry);
  seamLoop(g,m.seam,1.0,.73,.483,-.065).position.x=x;
  const back=soft(g,m.fabric,[x,.8,.32],[1.02,.57,.22],.09,'Loose back cushion');back.rotation.x=-.14;
 }
 for(const [x,z,rot]of [[-1.34,.18,-.13],[1.32,.21,.16]]){
  const pillow=soft(g,m.leather,[x,.69,z],[.43,.43,.16],.065,'Throw pillow');pillow.rotation.set(-.15,.1,rot);
 }
 return g;
}

export function createPlant(m,{scale=1}={}){
 const g=new THREE.Group();g.name='Branched ficus in ceramic planter';
 const profile=[[0,0],[.24,0],[.28,.025],[.35,.53],[.35,.58],[.32,.595],[.30,.56],[.30,.52]].map(p=>new THREE.Vector2(...p));
 add(g,new THREE.LatheGeometry(profile,48),m.ink);cylinder(g,m.soil,.30,.025,[0,.535,0]);ring(g,m.metal,.333,.006,[0,.585,0],[Math.PI/2,0,0]);
 tube(g,m.wood,[[0,.53,0],[.035,1.1,.015],[-.015,1.8,-.01],[.08,2.55,.02]],.024);
 for(let b=0;b<8;b++){
  const angle=b*2.399,level=.95+b*.19,reach=.5+Math.sin(b*1.2)*.13;
  const end=[Math.cos(angle)*reach,level+.32,Math.sin(angle)*reach];
  tube(g,m.wood,[[0,level-.12,0],[end[0]*.5,level+.08,end[2]*.5],end],.008);
  for(let j=0;j<5;j++){
   const t=.32+j*.16,side=j%2?1:-1,a=angle+side*.65;
   const origin=[end[0]*t,level+.32*t,end[2]*t];
   const length=.27+.05*Math.sin(b+j),P=[],UV=[],I=[];
   for(let v=0;v<=10;v++){const u=v/10,w=Math.pow(Math.sin(u*Math.PI),.85)*length*.34;
    for(let k=0;k<5;k++){const s=(k-2)/2;P.push(s*w,u*length,Math.sin(u*Math.PI)*length*.15-Math.abs(s)*w*.24);UV.push(k/4,u);}}
   for(let v=0;v<10;v++)for(let k=0;k<4;k++){const n=v*5+k;I.push(n,n+5,n+1,n+1,n+5,n+6);}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));geo.setIndex(I);geo.computeVertexNormals();
   const leaf=add(g,geo,j%3===0?m.leafLight:m.leaf,origin,[.8+Math.sin(b+j)*.3,a,side*.65],'Curved leaf');
   const vein=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,.002),new THREE.Vector3(0,length*.5,length*.15+.002),new THREE.Vector3(0,length,.002)]),10,.0009,3,false),m.vein);leaf.add(vein);
  }
 }
 g.scale.setScalar(scale);return g;
}

export function createTable(m){
 const g=new THREE.Group();g.name='Ribbed-pedestal conference table';
 const profile=[[0,-.07],[1.58,-.07],[1.63,-.04],[1.65,-.01],[1.65,.025],[1.63,.06],[1.58,.07],[0,.07]].map(p=>new THREE.Vector2(...p));
 add(g,new THREE.LatheGeometry(profile,96),m.wood,[0,.74,0],[0,0,0],'Rounded tabletop');
 cylinder(g,m.ink,.28,.65,[0,.37,0]);cylinder(g,m.ink,.59,.06,[0,.04,0]);
 ring(g,m.metal,.56,.007,[0,.045,0],[Math.PI/2,0,0]);
 cylinder(g,m.metal,.36,.025,[0,.655,0]);
 for(let i=0;i<28;i++){const a=i*Math.PI*2/28;cylinder(g,m.wood,.013,.55,[Math.cos(a)*.281,.37,Math.sin(a)*.281]);}
 for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;cylinder(g,m.metal,.012,.018,[Math.cos(a)*.28,.638,Math.sin(a)*.28]);cylinder(g,m.cable,.055,.012,[Math.cos(a)*.43,.006,Math.sin(a)*.43]);}
 cylinder(g,m.ink,.058,.005,[0,.811,-.52]);soft(g,m.cable,[0,.815,-.52],[.065,.003,.009],.001,'Cable grommet slot');
 return g;
}

export function createCamera(m){
 const g=new THREE.Group();g.name='Production camera with zoom lens';
 soft(g,m.ink,[0,0,0],[.30,.195,.17],.025,'Camera body');
 soft(g,m.cable,[.135,-.01,.015],[.075,.17,.16],.03,'Contoured hand grip');
 soft(g,m.metal,[0,-.108,0],[.10,.025,.10],.007,'Tripod quick-release plate');
 tube(g,m.ink,[[-.08,.1,-.045],[-.08,.17,-.045],[.08,.17,.035],[.08,.1,.035]],.013);
 for(const [z,r,h]of [[.10,.065,.055],[.15,.071,.055],[.205,.078,.05],[.24,.079,.02]]){
  add(g,new THREE.CylinderGeometry(r,r,h,48),m.ink,[0,0,z],[Math.PI/2,0,0]);
  ring(g,m.metal,r,.0015,[0,0,z+h/2]);
 }
 for(const z of [.15,.205])for(let i=0;i<36;i++){const a=i*Math.PI*2/36,r=z<.2?.0725:.0795;rod(g,m.cable,[Math.cos(a)*r,Math.sin(a)*r,z-.015],[Math.cos(a)*r,Math.sin(a)*r,z+.015],.0016);}
 const glass=m.lens.clone();glass.transparent=true;glass.opacity=.82;glass.depthWrite=false;add(g,new THREE.SphereGeometry(.095,48,16,0,Math.PI*2,0,.75),glass,[0,0,.157],[Math.PI/2,0,0],'Convex front lens element');add(g,new THREE.RingGeometry(.012,.055,9),m.ink,[0,0,.215],[0,0,0],'Nine-blade aperture');
 ring(g,m.ink,.069,.005,[0,0,.255]);ring(g,m.metal,.057,.001,[0,0,.254]);
 const monitor=soft(g,m.ink,[-.235,.035,-.015],[.18,.12,.018],.008,'Flip-out monitor');monitor.rotation.y=-.35;
 soft(g,m.lens,[-.235,.035,-.028],[.155,.094,.004],.003);
 for(const x of [-.075,.075]){cylinder(g,m.cable,.021,.015,[x,.105,-.015]);ring(g,m.metal,.017,.001,[x,.115,-.015],[Math.PI/2,0,0]);}
 add(g,new THREE.SphereGeometry(.006,12,8),m.record,[.065,.112,.045]);
 soft(g,m.ink,[.045,-.01,-.098],[.08,.065,.025],.006,'Viewfinder eyecup');
 for(const x of [-.12,.12])ring(g,m.metal,.013,.003,[x,.065,-.04],[0,Math.PI/2,0]);
 return g;
}

export function createSoftbox(m){
 const g=new THREE.Group();g.name='Octagonal fabric softbox';
 add(g,new THREE.CylinderGeometry(.61,.22,.47,8,1,true),m.cable,[0,0,0],[Math.PI/2,0,0],'Fabric shell');
 add(g,new THREE.CircleGeometry(.585,8),m.diffuser,[0,0,.24],[0,0,0],'Diffusion cloth');add(g,new THREE.RingGeometry(.582,.612,8),m.cable,[0,0,.241],[0,0,0],'Diffuser retaining bezel');
 const rim=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;rim.push([Math.cos(a)*.61,Math.sin(a)*.61,.237]);rod(g,m.seam,[Math.cos(a)*.61,Math.sin(a)*.61,.235],[Math.cos(a)*.22,Math.sin(a)*.22,-.235],.004);}
 for(let i=0;i<rim.length;i++)rod(g,m.ink,rim[i],rim[(i+1)%rim.length],.012);
 add(g,new THREE.CircleGeometry(.22,32),m.ink,[0,0,-.238],[0,Math.PI,0],'Rear closure');
 cylinder(g,m.ink,.15,.09,[0,0,-.27]).rotation.x=Math.PI/2;
 tube(g,m.metal,[[-.26,0,-.2],[-.26,-.28,-.2],[0,-.33,-.2],[.26,-.28,-.2],[.26,0,-.2]],.017);
 return g;
}

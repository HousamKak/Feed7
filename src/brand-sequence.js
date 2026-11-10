import * as THREE from 'three';
import {assetUrl} from './config.js';

export const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*t*(t*(t*6-15)+10);};

export async function createBrandSequence(scene,{nativeLogo,nativeCircuitFloor=false,mobile=false}={}){
 const response=await fetch(assetUrl('brand/monogram.json'));if(!response.ok)throw new Error('Brand geometry unavailable');
 const data=await response.json();
 const shapes=data.paths.map(commands=>{const shape=new THREE.Shape();const point=(x,y)=>[(x-data.width/2)/data.height,(data.height/2-y)/data.height];for(const [op,...v]of commands){if(op==='M')shape.moveTo(...point(...v));if(op==='L')shape.lineTo(...point(...v));if(op==='C')shape.bezierCurveTo(...point(v[0],v[1]),...point(v[2],v[3]),...point(v[4],v[5]));if(op==='Z')shape.closePath();}return shape;});
 const root=new THREE.Group();root.userData.webOnly=true;scene.add(root);
 const crystalSpec=nativeLogo?.appearance?.materialSpec||{};
 const porcelain=new THREE.MeshPhysicalMaterial({color:crystalSpec.baseColor||'#f2eee3',metalness:0,roughness:crystalSpec.roughness??.025,transmission:crystalSpec.transmission??.86,ior:crystalSpec.ior??1.9,thickness:crystalSpec.thickness??.23,attenuationColor:crystalSpec.attenuationColor||'#f2eee3',attenuationDistance:crystalSpec.attenuationDistance??.8,dispersion:crystalSpec.dispersion??.05,clearcoat:1,clearcoatRoughness:.025,flatShading:true});
 if(mobile){porcelain.transmission=0;porcelain.dispersion=0;porcelain.roughness=.07;}
 const edge=porcelain;
 let geometry;
 if(nativeLogo){const src=nativeLogo.geometry;geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(src.positions.map(v=>v*nativeLogo.cellSizeM),3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(src.normals,3));geometry.setIndex(src.indices);geometry.rotateX(-Math.PI/2);}
 else geometry=new THREE.ExtrudeGeometry(shapes,{depth:.109,bevelEnabled:true,bevelThickness:.012,bevelSize:.009,bevelSegments:2,curveSegments:48});
 const mark=new THREE.Group();root.add(mark);
 const body=new THREE.Mesh(geometry,nativeLogo?porcelain:[porcelain,edge]);mark.add(body);
 const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=128;
 const haloContext=haloCanvas.getContext('2d'),gradient=haloContext.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,'rgba(221,235,218,.12)');gradient.addColorStop(.4,'rgba(179,204,184,.04)');gradient.addColorStop(1,'rgba(0,40,22,0)');haloContext.fillStyle=gradient;haloContext.fillRect(0,0,128,128);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(haloCanvas),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));halo.position.set(0,5.8,27.6);halo.scale.set(8,10,1);root.add(halo);
 const rim=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,40),new THREE.LineBasicMaterial({color:'#b9e9cf',transparent:true,opacity:.2}));rim.visible=false;mark.add(rim);
 if(!nativeCircuitFloor){const stage=new THREE.Mesh(new THREE.PlaneGeometry(65,55),new THREE.MeshStandardMaterial({color:'#020806',roughness:.85,metalness:.12}));stage.rotation.x=-Math.PI/2;stage.position.set(0,-.04,22);root.add(stage);}
 // Keep the light count stable when the opening geometry is hidden. Changing
 // intensity avoids compiling a new lighting program at studio entry.
 const glow=new THREE.PointLight('#e6efe5',45,22,2);glow.position.set(-3,5,31);scene.add(glow);
 const rimLight=new THREE.PointLight('#ffe8cb',70,22,2);rimLight.position.set(4,7,26);scene.add(rimLight);
 const roads=[];
 const signal=new THREE.MeshBasicMaterial({color:new THREE.Color('#73e8ae').multiplyScalar(1.5),transparent:true,opacity:1});
 const roadMat=new THREE.MeshStandardMaterial({color:'#102e23',metalness:.7,roughness:.32});
 const routes=[
  [[-.55,.07,17],[ -.55,.07,12],[-4,.07,9],[-4,.07,3],[-9,.07,0],[-9,.07,-5]],
  [[.55,.07,17],[.55,.07,13],[4,.07,10],[4,.07,4],[9,.07,1],[9,.07,-6]],
  [[0,.07,17],[0,.07,10],[0,.07,6],[0,.07,3],[0,.07,-1]],
  [[-4,.07,9],[-9,.07,9],[-12,.07,6],[-12,.07,0],[-12,.07,-7]],
  [[4,.07,10],[9,.07,10],[12,.07,7],[12,.07,1],[12,.07,-7]],
  [[-4,.07,3],[-4,.07,-4],[-2,.07,-7],[0,.07,-9]],
  [[4,.07,4],[6,.07,3],[9,.07,3.5]]
 ];
 for(const points of nativeCircuitFloor?[]:routes){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.08);const geo=new THREE.TubeGeometry(curve,90,.024,5,false);const lit=new THREE.Mesh(geo,signal);root.add(lit);const track=new THREE.Mesh(new THREE.TubeGeometry(curve,90,.095,5,false),roadMat);track.position.y=-.035;root.add(track);roads.push({curve,lit,track,count:geo.index.count});}
 const pulses=[];for(let i=0;i<(nativeCircuitFloor?0:14);i++){const o=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),new THREE.MeshBasicMaterial({color:'#e9ffe8'}));root.add(o);pulses.push(o);}
 const positions=new Float32Array(180*3);for(let i=0;i<180;i++){positions[i*3]=Math.sin(i*13.37)*13;positions[i*3+1]=.7+(i%37)*.19;positions[i*3+2]=15+(Math.sin(i*7.1)*.5+.5)*22;}
 const dust=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(positions,3)),new THREE.PointsMaterial({color:'#c5e4cd',size:.018,transparent:true,opacity:.22,depthWrite:false}));root.add(dust);
 const point=new THREE.Vector3();
 const blueprint=new THREE.Group();root.add(blueprint);
 const blueprintMat=new THREE.LineBasicMaterial({color:'#67dca3',transparent:true,opacity:.22});
 for(const [x,y,z,w,h,d]of [[0,4,0,28,8,22],[-9,1.2,-5,6.6,2.4,6.6],[9,1.2,-5,6.6,2.4,6.6],[8,1,3.8,7,2,4]]){const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d)),blueprintMat);outline.position.set(x,y,z);blueprint.add(outline);}
 const sweep=new THREE.Mesh(new THREE.TorusGeometry(15,.012,5,100),new THREE.MeshBasicMaterial({color:'#b2ffcc',transparent:true,opacity:.5}));sweep.rotation.x=Math.PI/2;root.add(sweep);
 const ivory=new THREE.Color('#f2eee3');
 return {shapes,update(progress,time,reduced=false){
  const closing=progress>11;const phase=closing?(12-progress)*3:progress;
  root.visible=progress<3.1||progress>11.05;
  const unfold=smooth(.2,1.5,phase),reveal=smooth(1.5,2.9,phase);
  porcelain.color.copy(ivory);porcelain.metalness=0;
  blueprint.visible=phase>1.1&&phase<2.95;blueprintMat.opacity=.28*smooth(1.1,1.7,phase)*(1-smooth(2.3,2.95,phase));
  sweep.visible=reveal>.01&&reveal<.99;sweep.position.set(0,11*reveal,-1);sweep.scale.setScalar(.9+reveal*.15);
  const angle=-Math.PI/2*unfold,height=4.8+unfold*9.7;
  // Keep the lowest crystal edge above the floor throughout the rotation.
  const support=height*.5*Math.cos(angle)+.432*Math.sin(-angle);
  mark.position.set(0,support+.035+3.365*(1-unfold)*(1-unfold),THREE.MathUtils.lerp(28,24,unfold));
  const idle=1-unfold;mark.position.y+=(reduced?0:Math.sin(time*.7)*.1)*idle;
  mark.rotation.set(-Math.PI/2*unfold,reduced?0:Math.sin(time*.3)*.045*idle,reduced?0:Math.sin(time*.25)*.012*idle);
  halo.material.opacity=idle*(reduced?.32:.32+Math.sin(time*.65)*.025);halo.position.y=mark.position.y;halo.visible=mark.visible;
  mark.scale.set(4.8,4.8+unfold*9.7,4.8);mark.visible=phase<2.9;
  const length=smooth(.65,2.6,phase);roads.forEach(({lit,track,count},i)=>{const f=THREE.MathUtils.clamp(length*1.35-i*.045,0,1);lit.geometry.setDrawRange(0,Math.floor(f*count/30)*30);track.geometry.setDrawRange(0,Math.floor(f*count/30)*30);});
  pulses.forEach((o,i)=>{const route=roads[i%roads.length],u=(time*.13+i*.071)%1;o.visible=length>.05&&u<length;route.curve.getPoint(u,point);o.position.copy(point);o.position.y+=.06;});
  dust.rotation.y=reduced?0:Math.sin(time*.05)*.015;dust.material.opacity=.22*(1-smooth(2,3,phase));
  glow.intensity=45*(1-reveal)*(reduced?1:1+Math.sin(time*.65)*.06);rimLight.intensity=70*(1-reveal);
  return reveal;
 }};
}

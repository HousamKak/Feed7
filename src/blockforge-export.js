import * as THREE from 'three';

// Authoring bridge: a real Blockforge build plan, in its 20-units-per-metre,
// Z-up frame. Canvas signage becomes vertex color so the native world has no
// external texture dependencies. Web-only reflections and screen animation
// remain in the site renderer; architectural geometry is shared exactly.
export function exportBlockforge(scene,stops){
 scene.updateMatrixWorld(true);const operations=[];let count=0;
 const r=v=>Math.round(v*10000)/10000;
 const exportMesh=o=>{
  if(o.isInstancedMesh){const matrix=new THREE.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);const instance=new THREE.Mesh(o.geometry,o.material);instance.matrixWorld.multiplyMatrices(o.matrixWorld,matrix);exportMesh(instance);}return;}
  if(!o.isMesh||o.isReflector||!o.geometry?.attributes.position||!o.material?.color)return;
  const mat=o.material;if(Array.isArray(mat))return;
  let geometry=o.geometry.clone(),pixels=null,canvas;
  if(mat.map?.image&&geometry.type==='PlaneGeometry'){
   const {width,height}=geometry.parameters;geometry.dispose();geometry=new THREE.PlaneGeometry(width,height,180,Math.max(24,Math.round(180*height/width)));
   const image=mat.map.image;canvas=image;if(!image.getContext){canvas=document.createElement('canvas');canvas.width=image.naturalWidth||image.width;canvas.height=image.naturalHeight||image.height;canvas.getContext('2d').drawImage(image,0,0);}pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  }
  const pos=geometry.attributes.position,normal=geometry.attributes.normal,uv=geometry.attributes.uv;
  const positions=[],normals=[],colors=[],indices=[];const v=new THREE.Vector3(),n=new THREE.Vector3(),normalMatrix=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
  for(let i=0;i<pos.count;i++){
   v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);positions.push(r(v.x*20),r(v.z*20),r(v.y*20));
   if(normal){n.fromBufferAttribute(normal,i).applyMatrix3(normalMatrix).normalize();normals.push(r(n.x),r(n.z),r(n.y));}
   if(pixels){const x=Math.min(canvas.width-1,Math.max(0,Math.round(uv.getX(i)*(canvas.width-1)))),y=Math.min(canvas.height-1,Math.max(0,Math.round((1-uv.getY(i))*(canvas.height-1)))),p=(y*canvas.width+x)*4;colors.push(pixels[p],pixels[p+1],pixels[p+2]);}
  }
  const index=geometry.index?.array||Array.from({length:pos.count},(_,i)=>i);
  for(let i=0;i<index.length;i+=3){if(pixels){const u=(uv.getX(index[i])+uv.getX(index[i+1])+uv.getX(index[i+2]))/3,w=(uv.getY(index[i])+uv.getY(index[i+1])+uv.getY(index[i+2]))/3,x=Math.min(canvas.width-1,Math.max(0,Math.floor(u*canvas.width))),y=Math.min(canvas.height-1,Math.max(0,Math.floor((1-w)*canvas.height)));if(pixels[(y*canvas.width+x)*4+3]<100)continue;}indices.push(index[i],index[i+2],index[i+1]);}
  if(!indices.length){geometry.dispose();return;}
  const color='#'+mat.color.getHexString();
  operations.push({op:'mesh_set',mesh:{id:`feed7/studio/${String(++count).padStart(4,'0')}`,positions,indices,color,...(normals.length?{normals}:{}),...(colors.length?{colors}:{}),emission:mat.isMeshBasicMaterial?5:0,shadows:!mat.isMeshBasicMaterial,collision:mat.transparent?'none':'mesh',source:{project:'FEED7',authoring:'feed7-studio',units:'20 grid units per metre',webOpacity:mat.opacity}}});geometry.dispose();
 };
 scene.traverse(exportMesh);
 operations.push({op:'world_style',background:'#061814',fog:false,lighting:{sun:{azimuth:210,elevation:55,color:'#d6ffe4',intensity:1.4,shadows:true},ambient:{color:'#8cc9ac',intensity:.45},ao:{enabled:true,strength:.8},exposure:1.1,toneMapping:'aces'}});
 operations.push({op:'lights',lights:[{id:'emerald-fill',type:'point',position:[120,-100,120],color:'#37ffb0',intensity:4,range:480},{id:'recording-warm',type:'point',position:[-160,-100,100],color:'#ffc98e',intensity:3,range:320}]});
 return {version:1,label:'FEED7 Emerald Studio',operations,cameras:stops.map((s,i)=>({name:`FEED7 chapter ${i+1}`,position:[s.p[0]*20,s.p[2]*20,s.p[1]*20],target:[s.t[0]*20,s.t[2]*20,s.t[1]*20]}))};
}

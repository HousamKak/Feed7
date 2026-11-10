import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {assetUrl} from './config.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {cameraStops} from './camera-tour.js';
import {loadBlockforgeMaterials} from './blockforge-materials.js';
import {createBrandSequence,smooth} from './brand-sequence.js';
import {createMicrophone,createSofa,createPlant,createTable,createCamera,createSoftbox} from './studio-models.js';
import {loadNativeChair} from './native-models.js';

// FEED7's art-directed studio. Metres, Y up. Camera stops live with the scene,
// independently of the editorial overlays so the world remains easy to extend.
export async function createStudio(container, onReady) {
 if(new URLSearchParams(location.search).has('model')){const {createModelReview}=await import('./model-review.js');return createModelReview(container,onReady);}
 if(!new URLSearchParams(location.search).has('prototype')){const {createNativeStudio}=await import('./native-studio.js');return createNativeStudio(container,onReady);}
 let dirty=true;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const mobile=innerWidth<760;
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 const pixelRatio=Math.min(devicePixelRatio||1,1.75);renderer.setPixelRatio(pixelRatio);
 renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 container.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-label','FEED7 immersive emerald studio. Use the chapter navigation to move through the space.');
 const scene=new THREE.Scene(); scene.background=new THREE.Color('#061814'); scene.fog=new THREE.FogExp2('#061814',.016);
 const camera=new THREE.PerspectiveCamera(mobile?60:49,innerWidth/innerHeight,.08,140);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enabled=false;controls.enableDamping=!reduced;controls.dampingFactor=.08;controls.minDistance=5;controls.maxDistance=34;controls.minPolarAngle=.35;controls.maxPolarAngle=1.47;controls.minAzimuthAngle=-1.1;controls.maxAzimuthAngle=1.1;controls.enablePan=false;
 const imported=await loadBlockforgeMaterials(renderer);const env=imported.environment;scene.environment=env.texture;scene.environmentIntensity=.7;
 scene.add(new THREE.HemisphereLight('#e5eff7','#242a21',.75));
 const key=new THREE.DirectionalLight('#fff1df',2.4); key.position.set(-3,12,8);scene.add(key);
 key.castShadow=!mobile;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-19;key.shadow.camera.right=19;key.shadow.camera.top=16;key.shadow.camera.bottom=-16;key.shadow.camera.far=50;key.shadow.normalBias=.025;key.shadow.bias=-.0001;
 const side=new THREE.DirectionalLight('#a4c5ba',.65); side.position.set(-12,5,2);scene.add(side);
 const warm=new THREE.PointLight('#ffc98e',100,16,2);warm.position.set(-8,5,-5);scene.add(warm);
 const fill=new THREE.PointLight('#e1f1e8',55,24,2);fill.position.set(6,6,-5);scene.add(fill);
 const sequence=await createBrandSequence(scene);
 const world=new THREE.Group();scene.add(world);
 const assemblyPlane=new THREE.Plane(new THREE.Vector3(0,-1,0),11);renderer.localClippingEnabled=true;
 const mats={
  wall:new THREE.MeshStandardMaterial({color:'#07372a',roughness:.86,metalness:0}),
  green:new THREE.MeshStandardMaterial({color:'#096646',roughness:.52,metalness:.08}),
  ink:new THREE.MeshStandardMaterial({color:'#05100d',roughness:.48,metalness:.15}),
  metal:new THREE.MeshStandardMaterial({color:'#223a32',roughness:.28,metalness:.9}),
  white:new THREE.MeshStandardMaterial({color:'#d8e3cf',roughness:.65}),
  fabric:new THREE.MeshStandardMaterial({color:'#0e382c',roughness:.95}),
  leather:new THREE.MeshStandardMaterial({color:'#aa7048',roughness:.65}),
  wood:new THREE.MeshStandardMaterial({color:'#534331',roughness:.6}),
  neon:new THREE.MeshBasicMaterial({color:new THREE.Color('#37ffb0').multiplyScalar(1.25)}),
  light:new THREE.MeshBasicMaterial({color:new THREE.Color('#e9ffdb').multiplyScalar(2)}),
  amber:new THREE.MeshBasicMaterial({color:new THREE.Color('#ffcf8b').multiplyScalar(1.5)}),
  glass:new THREE.MeshPhysicalMaterial({color:'#65d8ad',transparent:true,opacity:.17,roughness:.12,metalness:.4,side:THREE.DoubleSide,depthWrite:false}),
  leaf:new THREE.MeshStandardMaterial({color:'#23794c',roughness:.6,side:THREE.DoubleSide})
 };
 Object.assign(mats,{seam:new THREE.MeshStandardMaterial({color:'#1b2922',roughness:.9}),grille:new THREE.MeshStandardMaterial({color:'#303633',roughness:.58,metalness:.7}),cable:new THREE.MeshStandardMaterial({color:'#111713',roughness:.86}),soil:new THREE.MeshStandardMaterial({color:'#221c14',roughness:1}),vein:new THREE.MeshStandardMaterial({color:'#526347',roughness:.85}),leafLight:new THREE.MeshStandardMaterial({color:'#3e5730',roughness:.64,side:THREE.DoubleSide})});mats.leaf.color.set('#254429');mats.lens=new THREE.MeshPhysicalMaterial({color:'#132724',roughness:.08,metalness:.5,clearcoat:1});mats.record=new THREE.MeshBasicMaterial({color:'#cc4938'});mats.diffuser=new THREE.MeshStandardMaterial({color:'#eeeadd',roughness:.9,emissive:'#e4dfd0',emissiveIntensity:.25});
 const textureLoader=new THREE.TextureLoader();
 const [stone,fabric,art,production]=await Promise.all(['basalt-floor','emerald-acoustic','emerald-signal','production-detail'].map(name=>textureLoader.loadAsync(assetUrl(`generated/${name}.webp`))));
 for(const t of [stone,fabric,art,production]){t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
 for(const t of [stone,fabric]){t.wrapS=t.wrapT=THREE.RepeatWrapping;}
 stone.repeat.set(5,4);fabric.repeat.set(3,3);
 const fabricHeight=fabric.clone();fabricHeight.colorSpace=THREE.NoColorSpace;
 mats.fabric.map=fabric;mats.fabric.color.set('#9fb5a5');mats.fabric.bumpMap=fabricHeight;mats.fabric.bumpScale=.035;
 mats.rug=mats.fabric.clone();
 const stoneHeight=stone.clone();stoneHeight.colorSpace=THREE.NoColorSpace;
 const stoneMaterial=new THREE.MeshPhysicalMaterial({map:stone,color:'#a5b7aa',bumpMap:stoneHeight,bumpScale:.035,roughness:.62,metalness:.08,clearcoat:.12,transparent:!mobile,opacity:mobile?1:.88,depthWrite:mobile});
 const batches=new Map();
 function box(x,y,z,w,h,d,mat=mats.wall,rotation=0){
  const geo=new THREE.BoxGeometry(w,h,d); const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.rotation.y=rotation;mesh.updateMatrix();geo.applyMatrix4(mesh.matrix);
  if(!batches.has(mat))batches.set(mat,[]); batches.get(mat).push(geo);return mesh;
 }
 function mesh(geo,mat,x,y,z,rx=0,ry=0,rz=0){const o=new THREE.Mesh(geo,mat);o.castShadow=!mat.isMeshBasicMaterial&&!mat.transparent;o.receiveShadow=true;o.position.set(x,y,z);o.rotation.set(rx,ry,rz);world.add(o);return o;}
 function rounded(x,y,z,w,h,d,mat=mats.fabric,r=.1){const o=mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3)),mat,x,y,z);o.castShadow=true;o.receiveShadow=true;return o;}
 function cyl(x,y,z,r,h,mat=mats.ink,rt=r){return mesh(new THREE.CylinderGeometry(rt,r,h,48),mat,x,y,z);}
 function ring(x,y,z,r,t=.025,mat=mats.neon,rx=Math.PI/2){return mesh(new THREE.TorusGeometry(r,t,8,100),mat,x,y,z,rx);}
 function line(a,b,r=.025,mat=mats.metal){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const o=mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),mat,...av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
 function canvasTexture(draw,w=1536,h=768){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw(ctx,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return {texture:t,ctx,c};}
 const grain=canvasTexture((c,w,h)=>{c.fillStyle='#99836b';c.fillRect(0,0,w,h);for(let i=0;i<900;i++){const v=Math.sin(i*91.7)*.5+.5;c.strokeStyle=`rgba(42,25,12,${.02+v*.12})`;c.lineWidth=.5+v*2;c.beginPath();c.moveTo(0,i*h/900);c.bezierCurveTo(w*.3,i*h/900+Math.sin(i)*8,w*.7,i*h/900+Math.cos(i)*5,w,i*h/900);c.stroke();}},512,512).texture;
 grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(2,2);mats.wood.map=grain;mats.wood.color.set('#b29b7c');
 for(const [key,id,color]of [['wood','walnut-natural','#d2b693'],['leather','leather-brown','#d5ab77'],['wall','painted-plaster','#154334'],['fabric','linen','#365748']]){Object.assign(mats[key],imported.materials[id]);mats[key].color.set(color);mats[key].needsUpdate=true;}
 mats.fabric.bumpMap=null;mats.fabric.roughness=.9;

 function sign(text,x,y,z,w,h,{color='#f6f7f4',bg=null,size=180,rotation=0,sub=''}={}){
  const {texture}=canvasTexture((c,cw,ch)=>{if(bg){c.fillStyle=bg;c.fillRect(0,0,cw,ch);}c.fillStyle=color;c.font=`800 ${size}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,cw/2,ch/2-(sub?45:0));if(sub){c.font='26px Arial';c.fillStyle='#8ec9b1';c.fillText(sub,cw/2,ch/2+100);}});
  return mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:!bg,side:THREE.DoubleSide}),x,y,z,0,rotation);
 }
 function framedImage(texture,x,y,z,w,h){box(x,y,z-.08,w+.16,h+.16,.1,mats.ink);const o=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture}),x,y,z);box(x,y-h/2-.09,z,.8,.015,.03,mats.neon);return o;}
 // Architecture: a cutaway front, double-height feature wall, layered terraces.
 box(0,-.32,0,29,.6,25,mats.ink);
 box(0,4,-10.6,29,8.5,.4);box(-14.3,3,-3,.35,6.5,15);box(14.3,3,-3,.35,6.5,15);
 box(0,.04,-10.33,28,.045,.04,mats.neon);
 for(let i=-14;i<=14;i+=.7){box(i,4,-10.25,.12,8,.2,mats.ink);}
 for(const x of [-13.7,-4.7,4.7,13.7]){box(x,4,-10.05,.055,7.5,.055,mats.neon);box(x,7.76,-4,.055,.055,12,mats.neon);}
 for(const z of [-9.5,-5,-.5,4,8.5]){box(0,.015,z,28,.012,.025,mats.metal);}
 for(const x of [-12,-8,-4,0,4,8,12])box(x,.015,0,.025,.012,23,mats.metal);
 // Suspended ceiling blades anchor the lighting sculpture in a real space.
 for(let i=0;i<11;i++){const x=-13+i*2.6;box(x,8.65,-4,.13,.6,13,mats.ink);if(i%2===0)box(x,8.33,-4,.035,.025,11.7,mats.light);}
 box(0,8.65,-10,28,.6,.25,mats.ink);
 let mirror,lastReflection=-Infinity,frameTime=0;
 if(!mobile){mirror=new Reflector(new THREE.PlaneGeometry(27,23),{clipBias:.003,textureWidth:640,textureHeight:400,color:0x344c42});mirror.rotation.x=-Math.PI/2;mirror.position.y=-.005;const updateReflection=mirror.onBeforeRender;mirror.onBeforeRender=function(...args){if(frameTime-lastReflection<100)return;lastReflection=frameTime;updateReflection.apply(this,args);};world.add(mirror);}
 mesh(new THREE.PlaneGeometry(27,23),stoneMaterial,0,.003,0,-Math.PI/2);
 // Back wall, oversized identity, ticker, and luminous portal.
 const brandTexture=await textureLoader.loadAsync(assetUrl('brand/wordmark.svg'));brandTexture.colorSpace=THREE.SRGBColorSpace;mesh(new THREE.PlaneGeometry(13.8,4.3),new THREE.MeshBasicMaterial({map:brandTexture,transparent:true}),0,5.3,-9.99);
 sign('YOUR DIGITAL WORLD. OUR EXPERTISE.',0,7.5,-9.98,14,.75,{size:56,color:'#8acbb0'});
 box(0,1.65,-10,6.5,2.7,.2,mats.ink);
 sign('CREATE. BUILD. GROW.',0,1.65,-9.87,6.2,1.7,{size:95,color:'#46e4a6',sub:'STRATEGY  /  CREATIVE  /  TECHNOLOGY'});
 // The suspended orbital sculpture and its architectural suspension cables.
 const orbit=new THREE.Group();world.add(orbit);orbit.position.set(0,6.8,-1.2);
 orbit.userData.dynamic=true;
 for(const [r,tilt]of [[4.6,.12],[3.9,-.12]]){
  const o=new THREE.Mesh(new THREE.TorusGeometry(r,.065,12,128),mats.metal);o.rotation.set(Math.PI/2+tilt,0,.12);orbit.add(o);
  const glow=new THREE.Mesh(new THREE.TorusGeometry(r,.018,8,128),mats.neon);glow.rotation.copy(o.rotation);glow.position.y=-.065;orbit.add(glow);
 }
 for(const x of [-3.5,3.5])for(const z of [-3,1])line([x,7,z],[x,10,z],.012);
 const core=mesh(new THREE.IcosahedronGeometry(.62,0),mats.green,0,6.8,-1.2);const wire=mesh(new THREE.IcosahedronGeometry(.8,0),new THREE.MeshBasicMaterial({color:'#70eab4',wireframe:true}),0,6.8,-1.2);
 core.userData.dynamic=wire.userData.dynamic=true;
 // Central sunken presentation island, terrazzo edge and halo.
 cyl(0,.12,-1,4.1,.24,mats.ink);ring(0,.25,-1,4.06,.025);cyl(0,.3,-1,3.85,.15,mats.green);
 cyl(0,.41,-1,3.1,.08,mats.ink);ring(0,.46,-1,3.08,.012,mats.light);
 // Sculptural hero desk: curved segmented reception with glowing kick plate.
 const desk=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.1,1.05,64,1,true,Math.PI*.68,Math.PI*.64),mats.green);desk.position.set(0,1.0,-.9);world.add(desk);
 const deskEdge=mesh(new THREE.TorusGeometry(2.12,.035,8,70,Math.PI*.64),mats.neon,0,.52,-.9,Math.PI/2,0,Math.PI*.68);
 box(0,1.57,-2,3.5,.12,1.15,mats.ink);
 sign('F / 7',0,1.08,1.23,1.8,.85,{size:230});
 // A dimensional, polished 7 is the studio's central art piece. Its halo and
 // suspended orbit read from the entrance and remain distinct in reflections.
 const seven=new THREE.Shape();seven.moveTo(-1.25,3.5);seven.lineTo(1.35,3.5);seven.lineTo(1.35,2.75);seven.lineTo(-.18,0);seven.lineTo(-1.1,0);seven.lineTo(.45,2.73);seven.lineTo(-1.25,2.73);seven.closePath();
 const sevenGeo=new THREE.ExtrudeGeometry(seven,{depth:.35,bevelEnabled:true,bevelThickness:.06,bevelSize:.055,bevelSegments:4,steps:1});
 const sculpture=new THREE.Group();sculpture.position.set(.2,.55,-1.2);sculpture.rotation.y=-.18;world.add(sculpture);
 sculpture.userData.dynamic=true;
 const chrome=new THREE.MeshPhysicalMaterial({color:'#d6d8d5',metalness:.98,roughness:.2,clearcoat:1,clearcoatRoughness:.12});
 const sevenBody=new THREE.Mesh(sevenGeo,chrome);sevenBody.castShadow=true;sculpture.add(sevenBody);
 const sevenOutline=new THREE.LineSegments(new THREE.EdgesGeometry(sevenGeo,35),new THREE.LineBasicMaterial({color:'#4add9c'}));sevenOutline.visible=false;sculpture.add(sevenOutline);
 ring(.2,2.8,-1.65,2.28,.025,mats.neon,0);
 ring(.2,2.8,-1.68,2.45,.012,mats.metal,0);
 cyl(.2,.52,-1.2,1.5,.1,mats.ink);ring(.2,.58,-1.2,1.48,.014,mats.light);
 // Recording floor on the left: acoustic wall, stage, cameras and microphones.
 box(-9,.18,-5,7,.35,7,mats.ink);box(-9,.37,-1.5,7,.025,.045,mats.amber);
 for(let i=0;i<30;i++)box(-12.4+i*.235,2.25,-8.65,.105,3.8,.2,i%3===0?mats.wood:mats.ink);
 ring(-9,3,-8.45,1.05,.035,mats.amber,0);sign('ON AIR',-9,3,-8.36,2.6,.8,{size:155,color:'#ffe5bb'});
 sign('01 / CREATIVE FLOOR',-9,4.55,-9.98,6.3,.8,{size:95});
 framedImage(production,-9,6.4,-9.98,6.6,2.7);
 const soundBars=[];for(let i=0;i<25;i++){const bar=mesh(new THREE.BoxGeometry(.115,1,.08),mats.amber,-12+i*.25,1.7,-8.3);bar.scale.y=.25;bar.userData.dynamic=true;soundBars.push(bar);}
 const recordingTable=createTable(mats);recordingTable.position.set(-9,.355,-5);world.add(recordingTable);

 const nativeChair=await loadNativeChair(mats);
 function chair(x,z,angle=0,mat=mats.fabric){const g=nativeChair(mat);const base=z< -1.5?(x< -5?.355:.31):0;g.position.set(x,base,z);g.rotation.y=angle;world.add(g);return g;}

 chair(-11.05,-5,-Math.PI/2,mats.leather);chair(-6.95,-5,Math.PI/2,mats.leather);chair(-9,-7.05,Math.PI);chair(-9,-2.95,0);
 for(const [x,yaw]of [[-9.8,-.45],[-8.2,.45]]){const mic=createMicrophone(mats);mic.position.set(x,1.165,-5);mic.rotation.y=yaw;world.add(mic);}
 function tripod(x,z,softbox=false){
  const base=.355,height=softbox?2.0:1.75;
  line([x,base,z],[x,base+height,z],.024,mats.ink);
  for(let a=0;a<3;a++){const t=a*Math.PI*2/3,fx=x+Math.cos(t)*.6,fz=z+Math.sin(t)*.6;line([x,base+.7,z],[fx,base+.025,fz],.018,mats.metal);cyl(fx,base+.018,fz,.028,.035,mats.cable);}
  for(const y of [.65,1.15,1.55]){cyl(x,base+y,z,.034,.045,mats.ink);rounded(x+.04,base+y,z,.07,.025,.025,mats.cable,.005);}
  const gear=softbox?createSoftbox(mats):createCamera(mats);gear.position.set(x,base+height+(softbox?.25:.125),z);world.add(gear);
 }
 tripod(-12,-2);tripod(-6,-6,true);tripod(-11.9,-6.3,true);

 for(let i=0;i<3;i++){box(-10.8+i*1.7,5.8,-5,1.4,.13,2.8,mats.fabric);line([-10.8+i*1.7,5.8,-5],[-10.8+i*1.7,8,-5],.012);}
 // Digital lab: glass fins, workstation and live generative screens.
 sign('02 / DIGITAL LAB',9,7.65,-9.98,6.3,.7,{size:100});
 framedImage(art,9,5.5,-9.98,6.35,3.45);
 box(9,.16,-5,7,.3,7,mats.ink);box(9,.33,-1.5,7,.035,.045,mats.neon);
 box(9,1.1,-6.5,5.5,.16,1.4,mats.ink);box(6.5,.6,-6.5,.12,1.05,1.2,mats.metal);box(11.5,.6,-6.5,.12,1.05,1.2,mats.metal);
 box(9,1.05,-5.78,5.4,.035,.03,mats.neon);
 const screens=[];
 function screen(x,y,z,w,h,type){box(x,y,z,w+.1,h+.1,.14,mats.ink);const tex=canvasTexture(()=>{},640,400);const o=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex.texture}),x,y,z+.08);screens.push({...tex,type});return o;}
 screen(7.6,2.1,-6.8,2.4,1.5,'code');screen(10.3,2.1,-6.8,2.4,1.5,'design');
 box(9,1.22,-6.15,1.1,.04,.35,mats.metal);chair(9,-4.7,Math.PI);
 const fins=[];for(let i=0;i<4;i++){const fin=new THREE.Group();fin.userData.dynamic=true;fin.position.set(13.3,2,-7.5+i*1.4);fin.add(new THREE.Mesh(new THREE.BoxGeometry(.05,3.4,1),mats.glass));const edge=new THREE.Mesh(new THREE.BoxGeometry(.035,.025,1),mats.neon);edge.position.y=1.71;fin.add(edge);world.add(fin);fins.push(fin);}
 // A field of slow-moving data particles lives over the digital workstation.
 const particlePositions=new Float32Array(80*3);for(let i=0;i<80;i++){const a=i*2.399,r=.5+(i%9)*.22;particlePositions[i*3]=9+Math.cos(a)*r;particlePositions[i*3+1]=3.1+(i%13)*.09;particlePositions[i*3+2]=-5.8+Math.sin(a)*.7;}
 const particlesGeo=new THREE.BufferGeometry();particlesGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
 const particles=new THREE.Points(particlesGeo,new THREE.PointsMaterial({color:'#8dffc3',size:.026,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}));world.add(particles);
 const runners=[];for(let i=0;i<8;i++){const runner=mesh(new THREE.SphereGeometry(.035,8,6),mats.light,0,.06,0);runner.userData.dynamic=true;runners.push(runner);}
 // Rack: framed glass with illuminated nodes and visible cable channels.
 box(6,1.45,-8.5,.9,2.2,.8,mats.metal);for(let i=0;i<8;i++){box(6,.55+i*.25,-8.04,.76,.18,.04,mats.ink);box(6.25,.55+i*.25,-8.01,.04,.035,.015,mats.neon);}
 // Growth wall has a live graph, independent from all business claims.
 screen(0,3.05,-9.7,5.7,2.5,'growth');
 // Lounge and strategy area with sculptural furniture.
 box(8,.013,3.8,7,.018,4,mats.rug);
 const sofa=createSofa(mats);sofa.position.set(9.4,.025,4.4);world.add(sofa);

 rounded(9.45,.5025,2.8,.52,.045,.37,mats.ink,.015);rounded(9.43,.5375,2.78,.45,.025,.32,mats.white,.008);
 cyl(9,.44,2.7,1.05,.08,mats.white);cyl(9,.22,2.7,.36,.36,mats.metal);cyl(9,.035,2.7,.6,.025,mats.metal);
 plant(8.7,.48,2.65,.24);mesh(new THREE.LatheGeometry([[0,0],[.045,0],[.05,.008],[.055,.085],[.052,.09],[.046,.085],[.041,.015],[0,.015]].map(p=>new THREE.Vector2(...p)),40),mats.white,9.05,.48,2.4);ring(9.115,.525,2.4,.034,.006,mats.white,0);
 chair(6.2,2.7,-Math.PI/2,mats.leather);
 // A kinetic gallery occupies the open foreground. Repeated chrome ribbons
 // are instanced: eleven independently moving forms, a single draw call.
 cyl(-8.5,.18,2.4,2,.32,mats.ink);ring(-8.5,.35,2.4,1.96,.018,mats.amber);
 cyl(-8.5,.47,2.4,1.28,.28,mats.green);ring(-8.5,.62,2.4,1.26,.012,mats.light);
 const ribbons=new THREE.InstancedMesh(new THREE.TorusGeometry(1,.055,8,64),chrome,11);
 ribbons.userData.dynamic=true;ribbons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);ribbons.frustumCulled=false;world.add(ribbons);
 const ribbonTransform=new THREE.Object3D();
 function animateRibbons(time){for(let i=0;i<11;i++){ribbonTransform.position.set(-8.5,.85+i*.22,2.4);ribbonTransform.rotation.set(Math.PI/2,0,time*.19+i*.27);ribbonTransform.scale.set(1.32,.72,1);ribbonTransform.updateMatrix();ribbons.setMatrixAt(i,ribbonTransform.matrix);}ribbons.instanceMatrix.needsUpdate=true;}
 animateRibbons(0);
 // Freestanding artwork and a low plinth bring the generated imagery into
 // the room itself, with a second composition beside the chrome installation.
 framedImage(art,-11.3,2.5,.3,2.25,3.25);box(-11.3,.55,.22,.16,1.1,.16,mats.metal);box(-11.3,.06,.22,2.5,.12,.7,mats.ink);
 sign('IDEAS IN MOTION',-8.5,.68,3.75,2.8,.5,{size:92,color:'#d4e8d8'});
 for(let i=0;i<5;i++)box(-11+i*1.3,.025,5.2,.5,.012,.035,i%2?mats.metal:mats.amber);
 // A restrained mobile over the lounge, like an idea taking shape.
 const mobileArt=new THREE.Group();mobileArt.position.set(9,4.4,3.8);mobileArt.userData.dynamic=true;world.add(mobileArt);
 for(let i=0;i<3;i++){const loop=new THREE.Mesh(new THREE.TorusGeometry(.7+i*.25,.016,8,64),i===1?mats.amber:mats.metal);loop.rotation.set(i*.6,i*.9,.3);mobileArt.add(loop);}
 line([9,5.4,3.8],[9,8.4,3.8],.008);
 // Plants break up the hard architecture with generous silhouettes.
 // Curved, pointed leaves and branching stems give the plants an organic silhouette.
 function plant(x,y,z,s=1){const p=createPlant(mats,{scale:s});p.position.set(x,y,z);world.add(p);return p;}

 plant(-13,0,-8,1.25);plant(12,0,-9,1.2);plant(-5,0,-8,1);plant(13,0,1,1.2);plant(-12,0,3,1.25);
 // Foreground columns and wayfinding provide parallax during entry.
 for(const x of [-13.7,13.7]){box(x,3.4,5,.5,6.8,.55,mats.ink);box(x-.28,3.4,5,.035,6.2,.5,mats.neon);}
 sign('A WORLD BUILT FOR GROWTH.',0,.07,7.8,9,1.4,{size:90,color:'#6bb695'}).rotation.x=-Math.PI/2;
 sign('F7',-13.8,3,1.2,2,2,{size:320,color:'#18a775',rotation:Math.PI/2});
 new THREE.TextureLoader().load(assetUrl('brand/digital-world.jpg'),texture=>{texture.colorSpace=THREE.SRGBColorSpace;rounded(-14.05,3,-4,.12,3.8,2.35,mats.ink,.03);mesh(new THREE.PlaneGeometry(2.1,3.65),new THREE.MeshBasicMaterial({map:texture}),-13.97,3,-4,0,Math.PI/2);dirty=true;});
 // Consolidate architecture by material: hundreds of slats, few draw calls.
 for(const [mat,geometries]of batches){const geo=mergeGeometries(geometries);const o=new THREE.Mesh(geo,mat);o.castShadow=![mats.glass,mats.neon,mats.light,mats.amber].includes(mat);o.receiveShadow=true;world.add(o);geometries.forEach(g=>g.dispose());}
 // Merge all static furniture and planting by material and shadow state. Moving
 // installations stay separate; this removes hundreds of repeated draw calls.
 scene.updateMatrixWorld(true);
 // Use the engine's physical tile size in metres, rather than stretching a
 // scan once over an entire wall, chair, or tabletop.
 world.traverse(o=>{const tile=o.material?.userData?.tileMeters;if(!o.isMesh||!tile||o.geometry.userData.nativePatternUvs)return;const pos=o.geometry.attributes.position,norm=o.geometry.attributes.normal,uv=new Float32Array(pos.count*2),v=new THREE.Vector3(),n=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);n.fromBufferAttribute(norm,i).applyMatrix3(nm);const ax=Math.abs(n.x),ay=Math.abs(n.y),az=Math.abs(n.z);uv[i*2]=(ax>ay&&ax>az?v.z:v.x)/tile;uv[i*2+1]=(ay>ax&&ay>az?v.z:v.y)/tile;}o.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));});
 const staticGroups=new Map();world.traverse(o=>{if(!o.isMesh||o.isReflector||o.material.transparent)return;for(let p=o;p&&p!==scene;p=p.parent)if(p.userData.dynamic)return;const key=o.material.uuid+o.castShadow+o.receiveShadow;if(!staticGroups.has(key))staticGroups.set(key,[]);staticGroups.get(key).push(o);});
 let batchedMeshes=0;for(const objects of staticGroups.values()){if(objects.length<2)continue;const geometries=objects.map(o=>{let g=o.geometry.clone();if(g.index){const expanded=g.toNonIndexed();g.dispose();g=expanded;}g.applyMatrix4(o.matrixWorld);return g;});const combined=mergeGeometries(geometries);if(combined){const o=new THREE.Mesh(combined,objects[0].material);o.castShadow=objects[0].castShadow;o.receiveShadow=objects[0].receiveShadow;world.add(o);for(const old of objects){old.removeFromParent();old.geometry.dispose();}batchedMeshes+=objects.length-1;}geometries.forEach(g=>g.dispose());}
 world.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){m.clippingPlanes=[assemblyPlane];m.clipShadows=false;}});
 const target=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{samples:mobile?2:4,type:THREE.HalfFloatType});
 const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.16,.5,1.15);composer.addPass(bloom);composer.addPass(new OutputPass());const fxaa=new ShaderPass(FXAAShader);composer.addPass(fxaa);
 let renderScale=1;function sizePasses(){composer.setPixelRatio(pixelRatio*renderScale);composer.setSize(innerWidth,innerHeight);bloom.setSize(innerWidth*pixelRatio*renderScale*.6,innerHeight*pixelRatio*renderScale*.6);fxaa.material.uniforms.resolution.value.set(1/(innerWidth*pixelRatio*renderScale),1/(innerHeight*pixelRatio*renderScale));}sizePasses();
 const stops=cameraStops;
 // Intermediate waypoints stay in the circulation aisle, away from the
 // centrepiece. Cubic interpolation gives the dolly a gentle, continuous arc.
 const route=stops.map((s,i)=>({at:i,...s}));
 route.splice(9,0,{at:8.5,p:[5.5,3.3,-.5],t:[3.5,3,-8],fov:49});
 route.splice(8,0,{at:7.5,p:[1,3.7,5.8],t:[2,2,-4],fov:49});
 const path=new THREE.CatmullRomCurve3(route.map(s=>new THREE.Vector3(...s.p)),false,'catmullrom',.15);
 const gaze=new THREE.CatmullRomCurve3(route.map(s=>new THREE.Vector3(...s.t)),false,'catmullrom',.15);
 if(import.meta.env.DEV&&new URLSearchParams(location.search).has('authoring')){const {exportBlockforge}=await import('./blockforge-export.js');const {exportCycles}=await import('./cycles-export.js');window.__FEED7_AUTHORING__={exportCycles:()=>{const y=world.position.y;world.position.y=0;const data=exportCycles(world);world.position.y=y;return data;},exportPlan:()=>{const y=world.position.y;world.position.y=0;const plan=exportBlockforge(world,stops);world.position.y=y;return plan;}};}
 let progress=0,current=0,last=0,paused=false,frame=0,active=true,exploring=false,lastScreen=0,slowFrames=0,frameCount=0,suspended=false,motionTime=0,shadowReady=false,fastFrames=0;
 const look=new THREE.Vector3(),point=new THREE.Vector3();
 let pointer={x:0,y:0};const onPointer=e=>{pointer.x=(e.clientX/innerWidth-.5);pointer.y=(e.clientY/innerHeight-.5);};window.addEventListener('pointermove',onPointer,{passive:true});
 function drawScreens(time){for(const s of screens){if(s.type==='code'&&s.drawn)continue;const c=s.ctx,w=1024,h=640;c.setTransform(s.c.width/w,0,0,s.c.height/h,0,0);c.fillStyle='#061c16';c.fillRect(0,0,w,h);c.strokeStyle='#164b37';c.lineWidth=1;for(let x=40;x<w;x+=80){c.beginPath();c.moveTo(x,80);c.lineTo(x,h);c.stroke();}for(let y=80;y<h;y+=80){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}c.fillStyle='#9bd0b4';c.font='20px monospace';c.fillText(s.type==='growth'?'FEED7 / GROWTH SYSTEMS':s.type==='code'?'FEED7 / DEVELOPMENT':'FEED7 / DESIGN SYSTEM',40,42);
   if(s.type==='growth'){c.font='bold 56px Arial';c.fillStyle='#f6f7f4';c.fillText('Built for what’s next.',40,133);c.strokeStyle='#38eaa1';c.lineWidth=5;c.beginPath();for(let i=0;i<100;i++){let x=45+i*9.3,y=530-i*3.2+Math.sin(i*.12+time)*25;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.fillStyle='#18a775';for(let i=0;i<12;i++)c.fillRect(50+i*79,570-i*10,38,20+i*10);}
   else if(s.type==='code'){const colors=['#39e7a4','#93b9a4','#6a977f'];for(let i=0;i<18;i++){c.fillStyle=colors[i%3];c.fillRect(55+(i%3)*22,110+i*25,100+((i*67)%470),6);}c.fillStyle='#18a775';c.fillRect(760,100,210,480);c.fillStyle='#061814';c.font='bold 170px Arial';c.fillText('7',810,400);}
   else{c.drawImage(art.image,0,0,w,h);c.fillStyle='#06181455';c.fillRect(0,0,w,h);c.strokeStyle='#d3ffe6';c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.ellipse(520,330,190,60+i*35,time*.1+i*.2,0,Math.PI*2);c.stroke();}c.fillStyle='#f6f7f4';c.font='bold 72px Arial';c.fillText('Make waves.',40,570);}
   s.texture.needsUpdate=true;s.drawn=true;
 }}
 function render(ms){if(!active)return;frame=requestAnimationFrame(render);if(document.hidden||suspended){last=ms;return;}const rawDt=last?ms-last:16.7;const dt=Math.min(rawDt/1000,.05)||.016;last=ms;if((paused||reduced)&&!exploring&&!dirty&&Math.abs(progress-current)<.0001)return;dirty=false;frameTime=ms;frameCount++;if(!paused&&!reduced&&frameCount>90&&rawDt>25)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(rawDt<20)fastFrames++;else fastFrames=0;if(slowFrames>90&&renderScale>.85){renderScale=.85;sizePasses();slowFrames=0;}if(fastFrames>300&&renderScale<1){renderScale=1;sizePasses();fastFrames=0;}
 current+= (progress-current)*(reduced?1:1-Math.exp(-dt*5));const value=Math.max(0,Math.min(stops.length-1,current));let k=0;while(k<route.length-2&&value>route[k+1].at)k++;let a=route[k],b=route[k+1],t=(value-a.at)/(b.at-a.at);t=t*t*t*(t*(t*6-15)+10);const u=(k+t)/(route.length-1);path.getPoint(u,point);gaze.getPoint(u,look);
  const ci=Math.floor(value),blend=smooth(0,1,value-ci);camera.filmOffset=mobile?0:THREE.MathUtils.lerp(stops[ci].align==='right'?8:0,stops[Math.min(ci+1,stops.length-1)].align==='right'?8:0,blend);
  camera.fov=a.fov+(b.fov-a.fov)*t;if(mobile){point.y+=.4;camera.fov+=13;}
  if(!reduced&&!paused){motionTime+=dt;const t=motionTime;point.x+=pointer.x*.15;point.y-=pointer.y*.1;orbit.rotation.y=t*.025;orbit.rotation.z=Math.sin(t*.23)*.035;core.rotation.y=t*.2;wire.rotation.z=-t*.15;core.position.y=6.8+Math.sin(t*.7)*.09;
   animateRibbons(t);mobileArt.rotation.y=t*.08;mobileArt.rotation.z=Math.sin(t*.3)*.1;
   sculpture.position.y=.55+Math.sin(t*.65)*.065;sculpture.rotation.y=-.18+Math.sin(t*.22)*.11;
   soundBars.forEach((bar,i)=>{const h=.12+Math.pow(Math.sin(t*2.2+i*.43)*.5+.5,2)*.65;bar.scale.y=h;bar.position.y=1.4+h*.5;});
   fins.forEach((fin,i)=>{fin.rotation.y=Math.sin(t*.5+i*.7)*.18;});
   const positions=particlesGeo.attributes.position;for(let i=0;i<80;i++){positions.setY(i,3.05+(i%13)*.09+Math.sin(t*.6+i*.5)*.15);}positions.needsUpdate=true;particles.material.opacity=.28+Math.sin(t*.7)*.15;
   runners.forEach((runner,i)=>{const a=t*.18+i*Math.PI/4;runner.position.set(Math.cos(a)*4.15,.07,-1+Math.sin(a)*4.15);});
  }
  const assembly=sequence.update(current,motionTime,reduced);world.visible=assembly>.001;if(assembly>.99&&!shadowReady){renderer.shadowMap.needsUpdate=true;shadowReady=true;}assemblyPlane.constant=11*assembly-.05;world.position.y=-.25*(1-assembly);key.intensity=2.4*(.3+.7*assembly);
  if(exploring)controls.update();else{camera.position.copy(point);camera.lookAt(look);}camera.updateProjectionMatrix();if(!paused&&!reduced&&ms-lastScreen>150){drawScreens(motionTime*.4);lastScreen=ms;}composer.render();
 }
 drawScreens(0);render(0);requestAnimationFrame(()=>onReady?.());
 function resize(){dirty=true;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);sizePasses();}window.addEventListener('resize',resize);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();container.dispatchEvent(new CustomEvent('studio-error'));});
 return {jumpTo(v){progress=current=v;dirty=true;},setProgress(v){if(v!==progress)dirty=true;progress=v;},setPaused(v){paused=v;dirty=true;},setSuspended(v){suspended=v;dirty=true;},setExplore(v){dirty=true;exploring=v;controls.enabled=v;if(v){controls.target.copy(look);controls.update();}},destroy(){active=false;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',onPointer);controls.dispose();composer.dispose();env.dispose();renderer.dispose();},getStats(){return {...renderer.info.render,batchedMeshes,renderScale};}};
}

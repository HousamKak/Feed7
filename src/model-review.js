import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {BASE} from './config.js';
import {loadNativeChair} from './native-models.js';
import {loadBlockforgeMaterials} from './blockforge-materials.js';
import {loadNativeWorldModel} from './native-world-models.js';

// Direct-link geometry inspection. Uses the production model builders,
// neutral lighting and free orbit, without the website's grade or overlays.
export async function createModelReview(container,onReady){
 document.body.classList.add('model-review');
 const models=['chair','task-chair','monitor','seven','microphone','sofa','plant','table','camera','softbox'];
 const requested=new URLSearchParams(location.search).get('model'),name=models.includes(requested)?requested:'chair';
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor('#b8bcb8');renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;container.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.01,100);
 const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=environment.texture;scene.environmentIntensity=.5;pmrem.dispose();
 const m={};for(const [key,color,metalness,roughness]of [['fabric','#66776b',0,.88],['leather','#79543b',0,.65],['wood','#796048',0,.55],['ink','#1b2420',.2,.5],['metal','#8a918d',.85,.3],['seam','#26322b',0,.9],['grille','#313a35',.7,.58],['cable','#111713',0,.85],['soil','#211a13',0,1],['vein','#64774e',0,.9],['leaf','#294a2e',0,.65],['leafLight','#4a613c',0,.65],['lens','#18322b',.5,.08],['record','#bf3025',0,.4],['diffuser','#e8e5dc',0,.95]])m[key]=new THREE.MeshStandardMaterial({color,metalness,roughness,side:key.includes('leaf')?THREE.DoubleSide:THREE.FrontSide});
 {
  const imported=await loadBlockforgeMaterials(renderer,{environment:false});
  for(const [slot,id]of [['fabric','linen'],['wood','walnut-natural'],['leather','leather-brown']]){Object.assign(m[slot],imported.materials[id]);m[slot].needsUpdate=true;}
 }
 const nativeChair=await loadNativeChair(m);
 const model=name==='chair'?nativeChair():await loadNativeWorldModel(name,m);scene.add(model);
 const bounds=new THREE.Box3().setFromObject(model),centre=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),radius=Math.max(size.x,size.y,size.z);
 scene.add(new THREE.HemisphereLight('#ffffff','#6b7168',1.5));
 const key=new THREE.DirectionalLight('#fff7e8',3);key.position.set(-radius*2,radius*3,radius*2);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=key.shadow.camera.bottom=-radius*2;key.shadow.camera.right=key.shadow.camera.top=radius*2;key.shadow.normalBias=.005;scene.add(key);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(radius*20,radius*20),new THREE.MeshStandardMaterial({color:'#a5aaa5',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=bounds.min.y-.003;floor.receiveShadow=true;scene.add(floor);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(centre);controls.minDistance=radius*.6;controls.maxDistance=radius*8;
 const toolbar=document.createElement('div');toolbar.className='model-toolbar';toolbar.innerHTML=`<strong>${model.name}</strong><nav>${models.map(key=>`<a href="${BASE}?model=${key}">${key}</a>`).join('')}</nav><div><button data-view="three-quarter">Three quarter</button><button data-view="front">Front</button><button data-view="side">Side</button><button id="model-clay">Clay view</button><a href="${BASE}">Return to studio</a></div><small>Drag to orbit. Scroll to zoom. Compiled native geometry, neutral lighting.</small>`;document.body.appendChild(toolbar);
 let queued=false;const draw=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;renderer.render(scene,camera);});};
 function view(which){const d=radius*2.65,face=name==='chair'?-1:1;const vector=which==='front'?new THREE.Vector3(0,.35,face*d):which==='side'?new THREE.Vector3(d,.35,0):new THREE.Vector3(d*.75,d*.42,face*d*.8);camera.position.copy(centre).add(vector);controls.update();draw();}
 toolbar.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
 const clay=new THREE.MeshStandardMaterial({color:'#b8b6ac',roughness:.72});toolbar.querySelector('#model-clay').onclick=e=>{scene.overrideMaterial=scene.overrideMaterial?null:clay;e.currentTarget.textContent=scene.overrideMaterial?'Material view':'Clay view';draw();};
 controls.addEventListener('change',draw);view('three-quarter');
 const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);draw();};window.addEventListener('resize',resize);
 window.__FEED7_MODEL_REVIEW__={name,provenance:model.userData,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},view};
 onReady?.();return {setProgress(){},setPaused(){},setSuspended(){},setExplore(){},jumpTo(){},destroy(){controls.dispose();renderer.dispose();environment.dispose();window.removeEventListener('resize',resize);toolbar.remove();}};
}

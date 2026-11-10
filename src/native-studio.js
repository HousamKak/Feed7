// Renderer for a compiled Blockforge world. No room or furniture geometry is
// authored here. Positions, normals, UVs, topology and instances come from worldc.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {assetUrl} from './config.js';
import {loadBlockforgeMaterials,loadBlockforgeEnvironment,tintScannedMaterial} from './blockforge-materials.js';
import {createBrandSequence,smooth} from './brand-sequence.js';
import {drawStudioScreen} from './studio-screens.js';
import {sampleRoute} from '../blockforge/world/circuit-routes.mjs';
import {createStudioAtmosphere} from './studio-atmosphere.js';
import atmosphereDefaults from '../blockforge/world/atmosphere.json';
import {prepareStudio,waitForGPU} from './studio-preparation.js';

export async function createNativeStudio(container,onReady){
 const mobile=matchMedia('(max-width:760px), (pointer:coarse)').matches||navigator.connection?.saveData===true,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const areaLighting=!mobile&&new URLSearchParams(location.search).get('quality')==='high';
 const worker=new Worker(new URL('./native-world-loader.js',import.meta.url),{type:'module'});
 const worldDownload=new Promise((resolve,reject)=>{worker.onmessage=({data})=>{worker.terminate();data.error?reject(new Error(data.error)):resolve(data.data);};worker.onerror=e=>{worker.terminate();reject(new Error(e.message));};});
 // Retain a rejection handler while the small opening scene is prepared.
 worldDownload.catch(()=>{});
 const response=await fetch(assetUrl(`native/bootstrap-${mobile?'mobile':'desktop'}.json.gz`),{cache:'no-cache'});if(!response.ok)throw new Error('Native opening unavailable');
 const decoded=!response.headers.get('content-encoding')?.includes('gzip')?new Response(response.body.pipeThrough(new DecompressionStream('gzip'))):response;
 const bootstrap=await decoded.json();let data,imported,worldReady=false;
 const pixelRatio=()=>Math.min(devicePixelRatio||1,mobile?1.25:1.5,Math.sqrt((mobile?800000:3000000)/(innerWidth*innerHeight)));
 const renderer=new THREE.WebGLRenderer({antialias:!mobile,powerPreference:'high-performance'});renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight);renderer.transmissionResolutionScale=.75;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.localClippingEnabled=true;container.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','FEED7 studio, compiled from the native Blockforge world codebase');
 // Three also creates a multisampled HDR target internally for transmission.
 // Normalize it before allocation, as well as our compositor's own targets.
 const bindTarget=renderer.setRenderTarget.bind(renderer);renderer.setRenderTarget=(target,...args)=>{if(target?.texture.type===THREE.HalfFloatType&&target.samples)target.samples=0;return bindTarget(target,...args);};
 const rig=bootstrap.lightRig;
 if(areaLighting)(await import('three/addons/lights/RectAreaLightUniformsLib.js')).RectAreaLightUniformsLib.init();
 const scene=new THREE.Scene();scene.background=new THREE.Color(rig.background);scene.fog=new THREE.FogExp2(rig.background,.013);renderer.toneMappingExposure=rig.exposure;
 const atmosphere=createStudioAtmosphere(scene,bootstrap.atmosphere||atmosphereDefaults,rig.background,{mobile});
 const camera=new THREE.PerspectiveCamera(49,innerWidth/innerHeight,.06,150),controls=new OrbitControls(camera,renderer.domElement);controls.enabled=false;controls.minDistance=3;controls.maxDistance=40;controls.enableDamping=!reduced;
 scene.environmentIntensity=rig.environmentIntensity;
 // The opening gets its own small reflection environment. Bulk room requests
 // start after this critical scene, so they cannot compete for its bandwidth.
 const environmentDownload=loadBlockforgeEnvironment(renderer,{mobile:true,optimized:true});environmentDownload.catch(()=>{});let studioEnvironment;
 scene.add(new THREE.HemisphereLight(rig.hemisphere.sky,rig.hemisphere.ground,rig.hemisphere.intensity));
 for(const spec of rig.lights){if(mobile&&(spec.type==='area'||spec.type==='spot'&&spec.id!=='crystal-key'))continue;const l=spec.type==='area'?(areaLighting?new THREE.RectAreaLight(spec.color,spec.intensity,...spec.size):new THREE.PointLight(spec.color,spec.intensity*spec.size[0]*spec.size[1]/Math.PI,18,2)):spec.type==='directional'?new THREE.DirectionalLight(spec.color,spec.intensity):spec.type==='spot'?new THREE.SpotLight(spec.color,spec.intensity,spec.range,(spec.angleDegrees||40)*Math.PI/180,.65,2):new THREE.PointLight(spec.color,spec.intensity,spec.range,2);l.position.set(spec.at[0],spec.at[2],-spec.at[1]);if(spec.target){if(l.target){l.target.position.set(spec.target[0],spec.target[2],-spec.target[1]);scene.add(l.target);}else l.lookAt(spec.target[0],spec.target[2],-spec.target[1]);}if(spec.shadows&&!mobile){l.castShadow=true;l.shadow.mapSize.set(2048,2048);Object.assign(l.shadow.camera,{left:-18,right:18,top:16,bottom:-16,far:50});l.shadow.normalBias=.025;}scene.add(l);}
 const nativeLogo=bootstrap.nativeLogo;
 const sequence=await createBrandSequence(scene,{nativeLogo,nativeCircuitFloor:true,mobile}),world=new THREE.Group(),permanent=new THREE.Group(),packets=[],contacts=[],traces=[];scene.add(world,permanent);
 const contactLight=new THREE.PointLight('#9ce9ba',0,10,2);contactLight.position.set(0,.5,24);scene.add(contactLight);
 const clip=new THREE.Plane(new THREE.Vector3(0,-1,0),11);
 const loader=new THREE.TextureLoader(),materials=new Map(),animated=[],screens=[],circuitUniforms={wave:{value:-100},time:{value:0},ignition:{value:0}};
 async function makeMaterial(id){
  if(materials.has(id))return materials.get(id);const a=data.appearance[id],scan={wood:'walnut-natural',fabric:'linen',leather:'leather-brown',wall:'painted-plaster'}[a.role];
  const options={color:a.color,roughness:a.materialSpec?.roughness??a.roughness??.75,metalness:a.materialSpec?.metallic??a.metalness??(['#34453e','#a79670','#9baaa1','#c5cbc4'].includes(a.color)?.75:0)};
  if(scan){Object.assign(options,imported.materials[scan]);options.color=a.color;}
  if(a.role==='stone'){const path=bootstrap.assetMap['generated/basalt-floor.webp'],map=await loader.loadAsync(assetUrl(path));map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(.3,.3);options.map=map;options.color='#b8c2b8';options.roughness=.5;options.metalness=.08;}
  let m;
  if(a.graphic){const map=await loader.loadAsync(assetUrl(bootstrap.assetMap[a.graphic]||a.graphic));map.colorSpace=THREE.SRGBColorSpace;m=new THREE.MeshBasicMaterial({map,transparent:!!a.transparent,side:THREE.DoubleSide});}
  else if(a.screen){const canvas=document.createElement('canvas');canvas.width=mobile?512:1024;canvas.height=mobile?288:576;const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=mobile?1:Math.min(8,renderer.capabilities.getMaxAnisotropy());m=new THREE.MeshBasicMaterial({map});screens.push({canvas,map,kind:a.screen});}
  else if(a.role==='fabric')m=mobile?new THREE.MeshStandardMaterial(options):new THREE.MeshPhysicalMaterial({...options,sheen:1,sheenRoughness:.75,sheenColor:'#8aab91'});
  else if(a.role==='lens')m=new THREE.MeshPhysicalMaterial({...options,transmission:mobile?0:.75,ior:1.5,thickness:.006,clearcoat:1,clearcoatRoughness:.04});
  else if(a.role==='crystal')m=new THREE.MeshPhysicalMaterial({...options,transmission:mobile?0:a.materialSpec?.transmission??.94,ior:a.materialSpec?.ior??1.9,thickness:a.materialSpec?.thickness||1.01,attenuationColor:a.materialSpec?.attenuationColor||'#0e713f',attenuationDistance:a.materialSpec?.attenuationDistance||1.8,dispersion:mobile?0:a.materialSpec?.dispersion??.08,clearcoat:1,clearcoatRoughness:.025,flatShading:true});
  else if(a.role==='glass')m=mobile?new THREE.MeshStandardMaterial({...options,transparent:true,opacity:.78,roughness:.2}):new THREE.MeshPhysicalMaterial({...options,transmission:.45,ior:1.47,thickness:.075,clearcoat:1,clearcoatRoughness:.08});
  else m=new THREE.MeshStandardMaterial({...options,side:a.role==='leaf'?THREE.DoubleSide:THREE.FrontSide});
  if(a.emission&&!m.isMeshBasicMaterial){m.emissive.set(a.color);m.emissiveIntensity=a.emission;}
  if(a.materialSpec?.emission&&!m.isMeshBasicMaterial){m.emissive.set(a.color);m.emissiveIntensity=a.materialSpec.emission;}
  if(scan)tintScannedMaterial(m,a.color);
  if(a.contactEffect==='energized-track'){
   m.onBeforeCompile=shader=>{Object.assign(shader.uniforms,{circuitWave:circuitUniforms.wave,circuitTime:circuitUniforms.time,circuitIgnition:circuitUniforms.ignition});shader.vertexShader='varying float trackDistance;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntrackDistance=uv.x;');shader.fragmentShader='varying float trackDistance;uniform float circuitWave,circuitTime,circuitIgnition;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    float waveDelta=(trackDistance-circuitWave)*.6;
    float lead=exp(-waveDelta*waveDelta);
    float trail=exp(-max(0.,circuitWave-trackDistance)*.14)*step(trackDistance,circuitWave);
    float signal=pow(max(0.,sin(trackDistance*.5-circuitTime*1.5)),24.)*.13;
    totalEmissiveRadiance+=vec3(.12,.72,.32)*(lead*2.8+trail*.35+signal)*circuitIgnition;`);};m.customProgramCacheKey=()=> 'feed7-circuit-wave/1';
  }
  m.clippingPlanes=a.alwaysVisible?[]:[clip];materials.set(id,m);return m;
 }
 const basis=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2),inverse=basis.clone().invert(),matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3();
 async function populateWorld(){
 data=await worldDownload;if(data.provenance.validation.status!=='pass')throw new Error('Native world has not passed compiler validation');imported=await materialDownload;studioEnvironment=await studioEnvironmentDownload;if(!active)return;scene.environment=studioEnvironment.texture;
 await Promise.all(Object.keys(data.appearance).map(makeMaterial));
 for(const mesh of data.meshes){
  const src=mesh.instances.geometry,placements=mesh.instances.placements,first=placements[0].key,id=data.entityMaterials[first],meta=data.entityMetadata[first]||{},appearance=data.appearance[id];
  if(meta.sequenceOnly)continue;
  if(!active)return;await new Promise(resolve=>setTimeout(resolve,0));
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(src.positions.map(v=>v*data.cellSizeM),3));geometry.setIndex(new THREE.BufferAttribute(src.indices,1));if(src.normals)geometry.setAttribute('normal',new THREE.Float32BufferAttribute(src.normals,3));else geometry.computeVertexNormals();
  if(src.uvs){const tile=imported.materials[{wood:'walnut-natural',fabric:'linen',leather:'leather-brown',wall:'painted-plaster'}[appearance.role]]?.userData.tileMeters||1;geometry.setAttribute('uv',new THREE.Float32BufferAttribute(src.uvs.map(v=>v/tile),2));}
  geometry.rotateX(-Math.PI/2);
  geometry.computeBoundingSphere();
  const material=await makeMaterial(id),object=new THREE.InstancedMesh(geometry,material,placements.length);object.name=first;object.castShadow=!meta.graphic&&!meta.emission&&!meta.motion;object.receiveShadow=true;
  if(meta.contactEffect==='landing')contacts.push({object,material});
  if(meta.contactEffect==='energized-track')traces.push(material);
  placements.forEach((placement,i)=>{
   position.set(placement.translation[0]*data.cellSizeM,placement.translation[2]*data.cellSizeM,-placement.translation[1]*data.cellSizeM);
   rotation.fromArray(placement.rotation).premultiply(basis).multiply(inverse);
   if(Array.isArray(placement.scale))scale.set(placement.scale[0],placement.scale[2],placement.scale[1]);else scale.setScalar(placement.scale||1);
   matrix.compose(position,rotation,scale);object.setMatrixAt(i,matrix);
  });object.instanceMatrix.needsUpdate=true;object.computeBoundingSphere();
  if(meta.motion?.kind==='route-packet'){
   placements.forEach((placement,i)=>packets.push({object,index:i,motion:data.entityMetadata[placement.key].motion}));object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);object.frustumCulled=false;permanent.add(object);
  }else if(['spin','sway','bob','scale'].includes(meta.motion?.kind)){
   const pivot=new THREE.Vector3(meta.motion.pivot[0],meta.motion.pivot[2],-meta.motion.pivot[1]);const group=new THREE.Group();group.position.copy(pivot);object.position.copy(pivot).negate();group.add(object);world.add(group);animated.push({group,motion:meta.motion,baseY:group.position.y});
  }else (meta.alwaysVisible?permanent:world).add(object);
  if(meta.motion?.kind==='glow'&&material.emissive)animated.push({material,motion:meta.motion,baseEmission:material.emissiveIntensity});
 }
 drawScreens();performance.mark('feed7-gpu-preparation-start');
 const preparation=await prepareStudio({renderer,scene,camera,world,clip,materials,stops,mobile,active:()=>active});if(!active)return;
 shadowReady=true;worldReady=true;dirty=true;performance.mark('feed7-world-ready');window.__FEED7_NATIVE_WORLD__={...window.__FEED7_NATIVE_WORLD__,ready:true,preparation,meshes:data.meshes.length,entities:Object.keys(data.entityMaterials).length};
 container.dispatchEvent(new CustomEvent('studio-loaded'));
 }
 // Render to the antialiased canvas directly. Transmission stays physically
 // shaded, without the intermediate HDR resolves that caused black frames.
 const stops=bootstrap.cameras,route=stops.map((s,i)=>({...s,at:i}));const path=new THREE.CatmullRomCurve3(route.map(s=>new THREE.Vector3(...s.p)),false,'catmullrom',.15),gaze=new THREE.CatmullRomCurve3(route.map(s=>new THREE.Vector3(...s.t)),false,'catmullrom',.15);
 let progress=0,current=0,paused=false,suspended=false,exploring=false,active=true,dirty=true,last=0,time=0,frame,lastScreen=-Infinity,lastPaint=-Infinity,shadowReady=false;
 function drawScreens(){for(const {canvas,map,kind}of screens){drawStudioScreen(canvas,kind,time);map.needsUpdate=true;}}
 function resize(){dirty=true;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(pixelRatio());renderer.setSize(innerWidth,innerHeight);}resize();
 const look=new THREE.Vector3(),point=new THREE.Vector3();
 function render(ms){if(!active)return;frame=requestAnimationFrame(render);if(mobile&&ms-lastPaint<1000/30-1)return;lastPaint=ms;const dt=Math.min((ms-last)/1000||.016,.05);last=ms;if(document.hidden||suspended)return;if((paused||reduced)&&!exploring&&!dirty&&Math.abs(progress-current)<.0001)return;dirty=false;
  const destination=worldReady?progress:0;current+=(destination-current)*(reduced?1:1-Math.exp(-dt*5));const value=THREE.MathUtils.clamp(current,0,stops.length-1),ci=Math.min(Math.floor(value),stops.length-2),t=smooth(0,1,value-ci),u=(ci+t)/(stops.length-1);path.getPoint(u,point);gaze.getPoint(u,look);camera.fov=stops[ci].fov+(stops[ci+1].fov-stops[ci].fov)*t+(mobile?13:0);camera.filmOffset=mobile?0:THREE.MathUtils.lerp(stops[ci].align==='right'?8:0,stops[ci+1].align==='right'?8:0,t);
  if(!paused&&!reduced){time+=dt;for(const a of animated){const m=a.motion,phase=time*Math.PI*2/(m.period||6)+(m.phase||0),axis=m.axis||'y';if(m.kind==='spin'){a.group.rotation[axis]=time*m.speed;if(m.bob)a.group.position.y=a.baseY+Math.sin(time*Math.PI*2/(m.bobPeriod||6))*m.bob;}else if(m.kind==='sway')a.group.rotation[axis]=Math.sin(phase)*m.amplitude;else if(m.kind==='bob')a.group.position.y=a.baseY+Math.sin(phase)*m.amplitude;else if(m.kind==='scale')a.group.scale[axis]=1+Math.sin(phase)*m.amplitude;else if(m.kind==='glow')a.material.emissiveIntensity=a.baseEmission*(1+Math.sin(phase)*m.amplitude);}}
  const assembly=sequence.update(current,time,reduced);world.visible=worldReady&&assembly>.001;clip.constant=10.8*assembly-.1;world.position.y=-.2*(1-assembly);
  atmosphere.update(current,time,reduced);
  const closing=current>11,phase=closing?(12-current)*3:current,contact=smooth(1.12,1.48,phase),ignition=smooth(1.23,1.5,phase),pulse=contact*(1-smooth(1.5,2.35,phase));
  contactLight.intensity=worldReady?38*pulse:0;for(const c of contacts){c.object.visible=pulse>.001;c.material.emissiveIntensity=1.8*pulse;}
  for(const material of traces)material.emissiveIntensity=.04+.7*pulse+.09*ignition;
  const wave=Math.max(0,phase-1.26)*27;circuitUniforms.wave.value=wave;circuitUniforms.time.value=time;circuitUniforms.ignition.value=ignition;
  for(const packet of packets){const m=packet.motion,launch=wave-(m.entryDistance||0),ambient=time*m.speed+m.phase*m.length,blend=smooth(2.2,3.1,phase),travel=THREE.MathUtils.lerp(Math.max(0,launch),ambient,blend),s=sampleRoute(m.route,travel);position.set(s.point[0],0,-s.point[1]);rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.atan2(-s.direction[0],s.direction[1]));scale.setScalar(ignition>.01&&(blend>.01||launch>0)?ignition:0);matrix.compose(position,rotation,scale);packet.object.setMatrixAt(packet.index,matrix);packet.object.instanceMatrix.needsUpdate=true;}
  if(exploring)controls.update();else{camera.position.copy(point);camera.lookAt(look);controls.target.copy(look);}camera.updateProjectionMatrix();if(ms-lastScreen>(mobile?500:150)&&!paused&&!reduced){drawScreens();lastScreen=ms;}if(assembly>.99&&!shadowReady){renderer.shadowMap.needsUpdate=true;shadowReady=true;}renderer.setRenderTarget(null);renderer.setViewport(0,0,innerWidth,innerHeight);renderer.render(scene,camera);
 }
 drawScreens();render(0);window.addEventListener('resize',resize);
 window.__FEED7_NATIVE_WORLD__={project:bootstrap.project,compiler:bootstrap.compiler,sourceRevision:bootstrap.provenance.sourceRevision,deliveryRevision:bootstrap.provenance.deliveryRevision,validation:bootstrap.provenance.validation.status,tier:mobile?'mobile':'desktop',ready:false,renderPipeline:'direct-physical/4'};
 if(import.meta.env.DEV&&new URLSearchParams(location.search).has('debug'))window.__FEED7_DEBUG__={scene,camera,renderer,world,permanent};
 const environment=await environmentDownload;scene.environment=environment.texture;sequence.setEnvironment(environment.texture,rig.environmentIntensity);await renderer.compileAsync(scene,camera);dirty=true;await new Promise(resolve=>requestAnimationFrame(resolve));await waitForGPU(renderer,()=>active);
 await document.fonts.ready;window.__FEED7_NATIVE_WORLD__.openingReady=true;performance.mark('feed7-logo-visible');worker.postMessage(new URL(assetUrl(bootstrap.worldFile),location.href).href);onReady?.();
 const studioEnvironmentDownload=mobile?Promise.resolve(environment):loadBlockforgeEnvironment(renderer,{optimized:true});studioEnvironmentDownload.catch(()=>{});
 const materialDownload=loadBlockforgeMaterials(renderer,{mobile,optimized:true,environment:false});materialDownload.catch(()=>{});
 const worldBuild=populateWorld();worldBuild.catch(e=>{console.error('Native studio loading failed:',e);container.dispatchEvent(new CustomEvent('studio-error'));});
 return {whenWorldReady:()=>worldBuild,isReadyForTour:()=>worldReady,setProgress(v){progress=v;dirty=true;},jumpTo(v){progress=v;current=worldReady?v:0;dirty=true;},setPaused(v){paused=v;dirty=true;},setSuspended(v){suspended=v;dirty=true;},setExplore(v){exploring=v;controls.enabled=v;dirty=true;},getStats(){return {...renderer.info.render,nativeWorld:true};},destroy(){active=false;worker.terminate();cancelAnimationFrame(frame);window.removeEventListener('resize',resize);controls.dispose();atmosphere.dispose();renderer.dispose();environment.dispose();if(studioEnvironment!==environment)studioEnvironment?.dispose();}};
}

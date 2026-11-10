import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {engineImport,projectRoot} from './engine.mjs';
const {compileProject}=await engineImport('cli/worldc/compiler.js');
const {reconcile,fileDestination}=await engineImport('cli/worldc/reconcile.js');
const out=resolve(projectRoot,'../artifacts/native/worldc');
const built=await compileProject(projectRoot,{outDir:out,targets:['web'],mode:'final'});
const file=resolve(projectRoot,'../artifacts/native/feed7-native.save.json');await mkdir(resolve(projectRoot,'../artifacts/native'),{recursive:true});
const baseFile=resolve(projectRoot,'../artifacts/native/worldc-base.save.json');
const result=await reconcile({project:'feed7-studio',manifest:built.builds.web.manifest,store:built.store,outDir:out,destination:fileDestination(baseFile)});
// Apply the same lighting and play layers that the studio example writes on top
// of its compiled shell. Geometry remains owned by worldc reconciliation.
const [{World},{EventBus},{UndoManager},{Serializer},{applyBuildPlan}]=await Promise.all(['src/engine/World.js','src/engine/EventBus.js','src/persistence/UndoManager.js','src/persistence/Serializer.js','src/bridge/BuildExecutor.js'].map(engineImport));
const data=JSON.parse(await readFile(baseFile,'utf8')),delivery=JSON.parse(await readFile(resolve(projectRoot,'../public/native/studio.json'),'utf8'));
const eventBus=new EventBus(),engine={world:new World(),eventBus,undoManager:new UndoManager(eventBus)},serializer=new Serializer(),camera={...data.camera};serializer.deserialize(data,engine.world,camera);
const scale=1/delivery.cellSizeM;
const lights=delivery.lightRig.lights.filter(l=>l.type==='point').map(l=>({id:l.id,type:'point',position:l.at.map(v=>v*scale),color:l.color,intensity:l.intensity,range:l.range*scale}));
const plan={version:1,label:'FEED7 native lighting and play',operations:[{op:'world_style',background:delivery.lightRig.background,fog:false,lighting:{sun:{azimuth:220,elevation:55,color:'#ffefda',intensity:1.5,shadows:true},ambient:{color:'#d4e4d9',intensity:.5},exposure:1.15,toneMapping:'aces',ao:{enabled:true,strength:.6}}},{op:'lights',lights},{op:'play_settings',scale,rig:'first'},{op:'spawn_point',id:'feed7-entrance',at:[0,-100,1],yaw:0,default:true}]};
for(const mesh of delivery.meshes){
 const meta=delivery.entityMetadata[mesh.instances.placements[0].key]||{};
 const extra={};if(meta.emission)extra.emission=Math.min(15,Math.max(1,Math.round(meta.emission*6)));
 if(meta.motion?.kind==='spin')extra.motion={pivot:meta.motion.pivot.map(v=>v*scale),axis:[0,0,1],radiansPerSecond:meta.motion.speed};
 plan.operations.push({op:'mesh_set',mesh:{...mesh,...extra}});
}
const toGrid=p=>[p[0]*scale,-p[2]*scale,p[1]*scale];
plan.operations.push({op:'camera_shot',name:'feed7-studio-tour',ease:'inOut',loop:true,keyframes:delivery.cameras.slice(3,12).map((stop,i)=>({t:i*5,cue:stop.id,hold:.75,position:toGrid(stop.p),target:toGrid(stop.t),fov:stop.fov}))});
const applied=applyBuildPlan(engine,plan,{});if(applied?.errors?.length)throw new Error(JSON.stringify(applied.errors));
await writeFile(file,JSON.stringify(serializer.serialize(engine.world,camera)));
await writeFile(resolve(projectRoot,'../artifacts/native/feed7-native.plan.json'),JSON.stringify(plan));
console.log(JSON.stringify({file,changes:result.changes,validation:built.builds.web.manifest.validation.status}));

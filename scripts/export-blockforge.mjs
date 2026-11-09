import {chromium} from '@playwright/test';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const root=process.env.BLOCKFORGE_ROOT||'D:/dev/block game';
const out=resolve('studio');await mkdir(out,{recursive:true});
const options={headless:true};if(process.env.CHROME_EXECUTABLE)options.executablePath=process.env.CHROME_EXECUTABLE;
const browser=await chromium.launch(options);
let plan;
try{const page=await browser.newPage({viewport:{width:1440,height:960}});await page.goto((process.env.STUDIO_URL||'http://localhost:5173')+'/?authoring=1');await page.waitForFunction(()=>!!window.__FEED7_AUTHORING__);plan=await page.evaluate(()=>window.__FEED7_AUTHORING__.exportPlan());}finally{await browser.close();}
const {cameras,...buildPlan}=plan;
await writeFile(join(out,'feed7.plan.json'),JSON.stringify(buildPlan));
await writeFile(join(out,'camera-route.json'),JSON.stringify(cameras,null,2));
const load=path=>import(pathToFileURL(join(root,path)).href);
const [{World},{EventBus},{UndoManager},{Serializer},{applyBuildPlan}]=await Promise.all([load('src/engine/World.js'),load('src/engine/EventBus.js'),load('src/persistence/UndoManager.js'),load('src/persistence/Serializer.js'),load('src/bridge/BuildExecutor.js')]);
const eventBus=new EventBus(),world=new World(),engine={world,eventBus,undoManager:new UndoManager(eventBus)};
world.metadata.name='FEED7 / Emerald Growth Studio';
const result=applyBuildPlan(engine,buildPlan,{});
if(result?.errors?.length)throw new Error(JSON.stringify(result.errors));
const camera={offsetX:0,offsetY:0,zoom:1,rotation:0};
const save=new Serializer().serialize(world,camera);
await writeFile(join(out,'feed7.save.json'),JSON.stringify(save));
// Independently reload through the actual Blockforge serializer, which validates
// mesh fields, triangle limits, material references, and world reconstruction.
const reloaded=new World();new Serializer().deserialize(JSON.parse(await readFile(join(out,'feed7.save.json'),'utf8')),reloaded,{...camera});
if(reloaded.meshes.size!==world.meshes.size)throw new Error('Blockforge reload lost meshes.');
const triangleCount=[...reloaded.meshes.values()].reduce((n,m)=>n+m.indices.length/3,0);
const sha=async file=>createHash('sha256').update((await readFile(file,'utf8')).replace(/\r\n/g,'\n')).digest('hex');
await writeFile(join(out,'manifest.json'),JSON.stringify({format:'feed7-studio/1',name:'FEED7 / Emerald Growth Studio',blocksPerMetre:20,meshCount:reloaded.meshes.size,triangleCount,verifiedBy:'Blockforge World + BuildExecutor + Serializer deserialize',source:{file:'src/studio.js',sha256:await sha(resolve('src/studio.js')),cameraRouteFile:'src/camera-tour.js',cameraRouteSha256:await sha(resolve('src/camera-tour.js'))},outputs:await Promise.all(['feed7.save.json','feed7.plan.json','camera-route.json'].map(async file=>({file,sha256:await sha(join(out,file))}))),notes:['SHA-256 hashes use UTF-8 text with LF newlines.','Native geometry export, Z up.','Signage is baked to vertex colors.','Animated displays, transparent glass, orbit controls, and mirror reflections retain their richer web rendering.','One-way export; native edits do not automatically change the web source.']},null,2));
console.log(`Blockforge world verified: ${reloaded.meshes.size} meshes, ${triangleCount} triangles. Files: ${out}`);

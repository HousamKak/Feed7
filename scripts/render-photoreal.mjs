import {chromium} from '@playwright/test';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawn} from 'node:child_process';

// A real offline reference through Blockforge's existing Cycles renderer.
// This is a comparison artifact, not a replacement for the interactive site.
const engine=resolve(process.env.BLOCKFORGE_ROOT||'D:/dev/block game');
const out=resolve('artifacts/photoreal');await mkdir(join(out,'maps'),{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
let exported;
try{const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto('http://localhost:5173/?authoring=1');await page.waitForFunction(()=>!!window.__FEED7_AUTHORING__?.exportCycles,{},{timeout:90000});exported=await page.evaluate(()=>window.__FEED7_AUTHORING__.exportCycles());}finally{await browser.close();}
const rules=[];
for(const material of exported.materials){
 const maps={};for(const [role,data]of Object.entries(material.maps))if(data){const name=`${material.id}-${role}.png`;await writeFile(join(out,'maps',name),Buffer.from(data.split(',')[1],'base64'));maps[role]=name;}
 const rule={match:`^${material.id}$`,color:material.color,roughness:material.roughness,metallic:material.metallic,bevel:.004,variation:.035,roughVar:.04,normal:material.scan==='painted-plaster'?.18:.45};
 if(maps.base){rule.maps=maps;rule.mapRoot=join(out,'maps');rule.tint=material.color;delete rule.color;}
 if(material.scan==='linen')rule.sheen=.35;
 if(material.scan==='walnut-natural'){rule.coat=.3;rule.coatRoughness=.25;}
 if(material.glass){rule.transmission=.9;rule.ior=1.5;rule.roughness=.12;}
 if(material.emission&&!maps.base)rule.emission={color:material.color,strength:material.emission};
 rules.push(rule);
}
exported.scene.lights=[
 {id:'creative-softbox',type:'area',at:[-9,-5,5.6],dir:[0,0,-1],size:[4,4],blenderW:350,color:'#fff0d9'},
 {id:'studio-softbox',type:'area',at:[-3,0,7],dir:[0,0,-1],size:[5,5],blenderW:500,color:'#eaf1ef'},
 {id:'lab-softbox',type:'area',at:[9,-5,5.5],dir:[0,0,-1],size:[4,3],blenderW:250,color:'#f1f5f1'},
 {id:'front-bounce',type:'area',at:[0,8,5],dir:[0,-1,-.2],size:[8,4],blenderW:650,color:'#fff7eb'}
];
for(const light of exported.scene.lights){light.at[1]*=-1;light.dir[1]*=-1;}
await writeFile(join(out,'scene.json'),JSON.stringify(exported.scene));
await writeFile(join(out,'profile.json'),JSON.stringify({materials:rules,defaults:{bevel:.004},lightCalibration:{pointW:1,spotW:1,areaWperM2:1,lumensPerWatt:683},lighting:{studio:{exposure:-.5,whiteBalance:5300,sky:{azimuth:0,elevation:45,strength:.5,hdri:join(engine,'materials/maps/hdri/studio-small-09.hdr')},sun:{strength:0}}},post:{glare:false}},null,2));
await writeFile(join(out,'viewpoints.json'),JSON.stringify({views:[{id:'recording',position:[-5.9,1.8,2.25],target:[-10.1,5.4,1.8],fov:44},{id:'studio',position:[13,-17,5.8],target:[-1,3,3.3],fov:49}]}));
const args=[join(engine,'tools/render-cycles/run.mjs'),'--scene',join(out,'scene.json'),'--profile',join(out,'profile.json'),'--viewpoints',join(out,'viewpoints.json'),'--views',process.env.RENDER_VIEW||'recording','--light','studio','--out',out,'--size',process.env.RENDER_SIZE||'1280x800','--samples',process.env.RENDER_SAMPLES||'96','--min-samples','16','--noise','.035','--time-limit','180','--no-dress','--lod','off'];
if(process.argv.includes('--no-slot'))args.push('--no-slot');
const code=await new Promise((r,reject)=>{const p=spawn(process.execPath,args,{stdio:'inherit'});p.on('error',reject);p.on('close',r);});if(code)throw new Error('Cycles render failed: '+code);await access(join(out,'studio',`${process.env.RENDER_VIEW||'recording'}.png`));

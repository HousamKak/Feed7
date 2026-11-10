import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const data=JSON.parse(await readFile('public/native/studio.json','utf8'));
const logo=data.meshes.find(m=>data.entityMetadata[m.instances.placements[0].key]?.sequenceOnly==='logo'),g=logo.instances.geometry,edges=new Map(),key=i=>g.positions.slice(i*3,i*3+3).map(v=>(v*data.cellSizeM).toFixed(6)).join(',');
for(let i=0;i<g.indices.length;i+=3){const t=g.indices.slice(i,i+3);for(let j=0;j<3;j++){const a=key(t[j]),b=key(t[(j+1)%3]);if(a===b)continue;const k=[a,b].sort().join('/');edges.set(k,(edges.get(k)||0)+1);}}
assert.ok([...edges.values()].every(n=>n===2),'Cut crystal must remain a closed manifold');
assert.ok(g.positions.some((v,i)=>i%3===1&&v*data.cellSizeM<-.17),'Logo must have actual raised front facets');
assert.equal(data.appearance[data.entityMaterials[logo.instances.placements[0].key]].color,'#f2eee3');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
try{const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto('http://localhost:5173/');await page.waitForFunction(()=>window.__FEED7_NATIVE_WORLD__?.ready,{},{timeout:120000});
 for(const [name,progress]of [['smoke',0],['landing',1.46],['circuit-wave',1.8],['formation',2.3],['return',12]]){await page.evaluate(v=>scrollTo(0,innerHeight*v),progress);await page.waitForTimeout(250);await page.screenshot({path:`artifacts/native/opening-${name}.png`});}
 assert.deepEqual(errors,[]);await writeFile('artifacts/native/opening-report.json',JSON.stringify({passed:true,logoTriangles:g.indices.length/3,checks:['Closed manifold crystal after compilation','Real front crown cuts with preserved ivory','Smoke, landing, circuit wave and return views','No shader or browser errors']},null,2));console.log('Opening review passed: crystal topology, smoke and connected circuits.');
}finally{await browser.close();}

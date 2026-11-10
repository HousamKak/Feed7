import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';

const artifact=JSON.parse(await readFile('public/native/chair.json','utf8'));
assert.equal(artifact.provenance.compiler,'Blockforge ObjectCompile.compileObject');
for(const input of artifact.provenance.inputs){
 const bytes=await readFile(resolve(artifact.source,input.file));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),input.sha256,`Stale native asset: ${input.file}`);
}
const points=[];
for(const g of artifact.groups){
 assert.ok(g.positions.every(Number.isFinite)&&g.normals.every(Number.isFinite));
 assert.equal(g.positions.length,g.normals.length);
 assert.ok(g.indices.every(v=>Number.isInteger(v)&&v>=0&&v<g.positions.length/3));
 for(let i=0;i<g.positions.length;i+=3)points.push([-g.positions[i],g.positions[i+2],g.positions[i+1]]);
}
const clearances=[];
for(const [x,z,angle]of [[-11.05,-5,-Math.PI/2],[-6.95,-5,Math.PI/2],[-9,-7.05,Math.PI],[-9,-2.95,0]]){
 const c=Math.cos(angle),s=Math.sin(angle);
 const closest=Math.min(...points.map(p=>Math.hypot(x+c*p[0]+s*p[2]+9,z-s*p[0]+c*p[2]+5)));
 assert.ok(closest>1.675,'Native chair must clear the recording tabletop');clearances.push(+(closest-1.675).toFixed(4));
}
await mkdir('artifacts/native',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{channel:'chrome'})});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1200,height:950},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.NATIVE_QA_URL||'http://localhost:5173/';
 await page.goto(`${base}?model=chair`);await page.waitForFunction(()=>window.__FEED7_MODEL_REVIEW__);
 const provenance=await page.evaluate(()=>window.__FEED7_MODEL_REVIEW__.provenance);
 assert.equal(provenance.source,artifact.source);assert.equal(provenance.triangles,artifact.triangles);
 await page.screenshot({path:'artifacts/native/chair-local.png'});
 await page.getByRole('button',{name:'Side',exact:true}).click();await page.screenshot({path:'artifacts/native/chair-side.png'});
 const loaded=page.waitForResponse(r=>r.url().endsWith('/native/studio.json')&&r.ok());
 await page.goto(base);await loaded;await page.waitForSelector('.loading.done',{state:'attached'});
 await page.locator('[data-chapter="6"]').click();await page.waitForTimeout(1600);
 await page.screenshot({path:'artifacts/native/studio-local.png'});assert.equal(await page.locator('body.fallback').count(),0);
 assert.deepEqual(errors,[]);
 await writeFile('artifacts/native/local-report.json',JSON.stringify({passed:true,triangles:artifact.triangles,provenance,tableClearanceMetres:clearances,checks:['Native source hashes match browser artifact','Finite geometry and valid indices','All four chairs clear table','Model inspection uses native artifact','Full local studio loads native chair','No browser runtime errors']},null,2));
 console.log(`Native QA passed: ${artifact.triangles} triangles, source hashes verified, table clearances ${clearances.join(', ')} m, local studio and model review loaded.`);
}finally{await browser.close();}

import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const data=JSON.parse(await readFile('public/native/studio.json','utf8'));
assert.equal(data.provenance.validation.status,'pass');
assert.ok(data.meshes.length>50);assert.ok(Object.keys(data.entityMaterials).length>80);
for(const mesh of data.meshes){const g=mesh.instances.geometry;assert.ok(g.positions.every(Number.isFinite));assert.ok(g.normals.every(Number.isFinite));assert.ok(g.indices.every(v=>Number.isInteger(v)&&v>=0&&v<g.positions.length/3));}
await mkdir('artifacts/native',{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'}),errors=[],missing=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});page.on('console',m=>{if(m.type()==='error')console.log(m.text());});
 await page.goto('http://localhost:5173/?native=1');await page.waitForSelector('.loading.done',{state:'attached',timeout:90000});assert.equal(await page.locator('body.fallback').count(),0);
 await page.waitForFunction(()=>window.__FEED7_NATIVE_WORLD__?.ready,{},{timeout:120000});const native=await page.evaluate(()=>window.__FEED7_NATIVE_WORLD__);assert.equal(native.sourceRevision,data.provenance.sourceRevision);assert.equal(native.compiler,'Blockforge worldc hybrid/1');
 for(let i=0;i<13;i++){await page.locator(`[data-chapter="${i}"]`).click();await page.waitForTimeout(350);assert.equal(await page.locator(`[data-chapter="${i}"]`).getAttribute('aria-current'),'step');if([0,3,6,8,10,12].includes(i))await page.screenshot({path:`artifacts/native/world-chapter-${i}.png`});}
 await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();await page.waitForSelector('.loading.done',{state:'attached',timeout:90000});await page.waitForTimeout(500);
 const hidden=await page.addStyleTag({content:'header,main,.tour-footer,.grain,.world-shade,.tour-progress{visibility:hidden!important}'}),digest=b=>createHash('sha256').update(b).digest('hex');
 const a=digest(await page.locator('#world canvas').screenshot());await page.waitForTimeout(400);assert.notEqual(a,digest(await page.locator('#world canvas').screenshot()),'Native scene journey must animate');await hidden.evaluate(el=>el.remove());
 await page.getByRole('button',{name:'Pause ambient animations'}).click();await page.waitForTimeout(400);await page.addStyleTag({content:'header,main,.tour-footer,.grain,.world-shade,.tour-progress{visibility:hidden!important}'});const frozen=digest(await page.locator('#world canvas').screenshot());await page.waitForTimeout(400);assert.equal(frozen,digest(await page.locator('#world canvas').screenshot()),'Ambient pause must freeze the native renderer');
 await page.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://localhost:5173/');await mobile.waitForFunction(()=>window.__FEED7_NATIVE_WORLD__?.ready,{},{timeout:120000});assert.equal(await mobile.locator('body.fallback').count(),0);for(const i of [0,3,6,8,10,12]){await mobile.locator(`[data-chapter="${i}"]`).click();await mobile.waitForTimeout(150);assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}await mobile.screenshot({path:'artifacts/native/world-mobile.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 await writeFile('artifacts/native/world-local-report.json',JSON.stringify({passed:true,...native,checks:['Native compiler validation and central 7 preservation rule','Finite mesh data and indices','Browser uses matching native artifact','All thirteen chapters and six visual compositions','Ambient animation and exact pause','Mobile reduced motion and layout','No fallback or missing assets','No browser runtime errors']},null,2));console.log('Native world browser QA passed: '+JSON.stringify(native));
}catch(e){console.log('Native world QA failed',e);throw e;}finally{await browser.close();}

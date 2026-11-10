import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='artifacts/native/models';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'}),errors=[],report={};
try{const page=await browser.newPage({viewport:{width:1200,height:950},deviceScaleFactor:1.25});page.on('pageerror',e=>errors.push(e.message));
 for(const name of ['chair','task-chair','monitor','seven','microphone','sofa','plant','table','camera','softbox']){
  await page.goto(`http://localhost:5173/?model=${name}`);await page.waitForFunction(()=>window.__FEED7_MODEL_REVIEW__,{},{timeout:60000});
  const info=await page.evaluate(()=>{const {name,provenance,bounds}=window.__FEED7_MODEL_REVIEW__;return {name,provenance,bounds};});
  assert.ok(info.provenance.compiler.startsWith('Blockforge'));assert.ok(info.provenance.triangles>0);assert.ok([...info.bounds.min,...info.bounds.max].every(Number.isFinite));report[name]=info;
  for(const view of ['three-quarter','front','side']){await page.evaluate(v=>window.__FEED7_MODEL_REVIEW__.view(v),view);await page.waitForTimeout(100);await page.screenshot({path:`${out}/${name}-${view}.png`});}
  await page.locator('#model-clay').click();await page.waitForTimeout(100);await page.screenshot({path:`${out}/${name}-clay.png`});
 }
 assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({passed:true,models:report,checks:['All ten inspectable assets use native compiler output','Finite bounds','Material, front, side and clay views','No browser runtime errors']},null,2));console.log('Native model review passed for all ten assets.');
}finally{await browser.close();}

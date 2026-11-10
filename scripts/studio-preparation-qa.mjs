import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:1200,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__GPU_UPLOADS__={buffers:0,textures:0};for(const [method,key]of [['bufferData','buffers'],['texImage2D','textures']]){const original=WebGL2RenderingContext.prototype[method];WebGL2RenderingContext.prototype[method]=function(...args){window.__GPU_UPLOADS__[key]++;return original.apply(this,args);};}});
 await page.goto('http://localhost:5173/?debug=1');await page.waitForFunction(()=>window.__FEED7_NATIVE_WORLD__?.ready,{},{timeout:180000});
 const frames=[];for(const stop of [0,2,3,4,5,6,7,8,9,10,11,12,4,3,2]){await page.evaluate(i=>scrollTo(0,innerHeight*i),stop);await page.waitForTimeout(1200);frames.push(await page.evaluate(stop=>({stop,uploads:{...window.__GPU_UPLOADS__},programs:window.__FEED7_DEBUG__.renderer.info.programs.length,geometries:window.__FEED7_DEBUG__.renderer.info.memory.geometries}),stop));}
 const report={errors,state:await page.evaluate(()=>window.__FEED7_NATIVE_WORLD__),frames};await writeFile('artifacts/native/preparation-latest.json',JSON.stringify(report,null,2));if(!process.argv.includes('--baseline')){assert.deepEqual(errors,[]);assert.equal(report.state.preparation.shadowsPrepared,true);for(const frame of frames){assert.deepEqual(frame.uploads,frames[0].uploads,'Camera transitions must not allocate GPU buffers or textures');assert.equal(frame.programs,frames[0].programs,'Camera transitions must not compile more shaders');}}
 await writeFile(`artifacts/native/preparation-${process.argv.includes('--baseline')?'before':'after'}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}

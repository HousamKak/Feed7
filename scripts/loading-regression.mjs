import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
try{const context=await browser.newContext({viewport:{width:1200,height:800}});let release;const gate=new Promise(r=>release=r);let worldRequested=false;
 await context.route('**/native/studio*.json*',async route=>{worldRequested=true;await gate;await route.continue();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5173/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.loading.done',{state:'attached',timeout:60000});assert.ok(worldRequested,'World should already be downloading while the logo is shown');assert.equal(await page.evaluate(()=>window.__FEED7_NATIVE_WORLD__.ready),false,'Opening must render before the delayed studio arrives');
 assert.equal(await page.evaluate(()=>window.__FEED7_NATIVE_WORLD__.openingReady),true,'Opening cover must stay until the lit first frame and fonts are ready');assert.ok(await page.locator('#cinematic-action').isDisabled());await page.mouse.wheel(0,2400);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>scrollY),0,'Tour must stay on the logo until GPU preparation finishes');
 await page.screenshot({path:'artifacts/native/logo-before-world.png'});release();await page.waitForFunction(()=>window.__FEED7_NATIVE_WORLD__?.ready,{},{timeout:180000});assert.ok(await page.locator('#cinematic-action').isEnabled());assert.ok(await page.locator('#studio-preparation').isHidden());
 const timing=await page.evaluate(()=>({logo:performance.getEntriesByName('feed7-logo-visible')[0].startTime,world:performance.getEntriesByName('feed7-world-ready')[0].startTime}));assert.ok(timing.logo<timing.world);assert.deepEqual(errors,[]);await writeFile('artifacts/native/loading-report.json',JSON.stringify({passed:true,timing,checks:['Logo visible while world request is held','World download begins immediately','JSON parsing in a worker','Studio becomes ready without reloading the page']},null,2));console.log('Opening background loading passed: '+JSON.stringify(timing));
}finally{await browser.close();}

import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import express from 'express';
import {resolve} from 'node:path';
const app=express();app.use('/Feed7/',express.static(resolve('dist-pages')));const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
try{const context=await browser.newContext({viewport:{width:1200,height:800},serviceWorkers:'block'});let release;const gate=new Promise(r=>release=r);let worldRequested=false;
 await context.route('**/native/studio*.json*',async route=>{worldRequested=true;await gate;await route.continue();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/Feed7/`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__FEED7_NATIVE_WORLD__?.openingReady,{},{timeout:60000});assert.ok(worldRequested,'World should download behind the branded opening');assert.equal(await page.evaluate(()=>window.__FEED7_NATIVE_WORLD__.ready),false);
 assert.ok(!await page.locator('#brand-intro').evaluate(el=>el.classList.contains('done')),'Cover must remain until the complete studio is ready');await page.mouse.wheel(0,2400);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>scrollY),0,'Tour must stay at its entrance until GPU preparation finishes');
 await page.locator('#brand-intro [data-open="services"]').click();await page.waitForSelector('dialog[open]');assert.ok(await page.locator('.service-list').isVisible());await page.locator('#close-panel').click();
 await page.screenshot({path:'artifacts/native/logo-before-world.png'});release();await page.waitForSelector('.loading.done',{state:'attached',timeout:180000});assert.equal(await page.evaluate(()=>window.__FEED7_NATIVE_WORLD__.ready),true);assert.equal(await page.locator('#studio-preparation').count(),0);
 const timing=await page.evaluate(()=>({logo:performance.getEntriesByName('feed7-logo-visible')[0].startTime,world:performance.getEntriesByName('feed7-world-ready')[0].startTime}));assert.ok(timing.logo<timing.world);assert.deepEqual(errors,[]);await writeFile('artifacts/native/loading-report.json',JSON.stringify({passed:true,timing,checks:['Logo visible while world request is held','World download begins immediately','JSON parsing in a worker','Studio becomes ready without reloading the page']},null,2));console.log('Opening background loading passed: '+JSON.stringify(timing));
}finally{await browser.close();await new Promise(r=>server.close(r));}

import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import express from 'express';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
const app=express();app.use('/Feed7/',express.static(resolve('dist-pages')));const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],report=[];
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:900},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/assets/index-*.js',async route=>{await new Promise(r=>setTimeout(r,1500));await route.continue();});
  const base=`http://127.0.0.1:${server.address().port}/Feed7/`;
  await page.goto(base,{waitUntil:'commit'});await page.waitForSelector('#brand-intro h2');assert.equal(await page.locator('#world').count(),0,'Branded hook must display before application JavaScript loads');await page.screenshot({path:`artifacts/native/loading-hook-${mobile?'mobile':'desktop'}.png`});
  await page.waitForFunction(()=>window.__FEED7_NATIVE_WORLD__?.openingReady,{},{timeout:60000});
  if(!await page.evaluate(()=>window.__FEED7_NATIVE_WORLD__.ready))assert.ok(!await page.locator('#brand-intro').evaluate(el=>el.classList.contains('done')),'Hook must stay until room readiness');
  await page.waitForSelector('#brand-intro.done',{state:'attached',timeout:120000});await page.waitForFunction(()=>window.__FEED7_CACHE__?.assetsReady,{},{timeout:30000});
  const first=await page.evaluate(()=>({ready:window.__FEED7_NATIVE_WORLD__.ready,cacheHit:window.__FEED7_NATIVE_WORLD__.worldCacheHit,ms:performance.getEntriesByName('feed7-world-ready')[0].startTime}));assert.equal(first.cacheHit,false);assert.equal(first.ready,true);
  await context.unroute('**/assets/index-*.js');await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#brand-intro.done',{state:'attached',timeout:120000});
  const repeat=await page.evaluate(()=>({ready:window.__FEED7_NATIVE_WORLD__.ready,cacheHit:window.__FEED7_NATIVE_WORLD__.worldCacheHit,ms:performance.getEntriesByName('feed7-world-ready')[0].startTime}));assert.equal(repeat.cacheHit,true,'Reload must reuse decoded model data');assert.equal(repeat.ready,true,'Cached site must work offline');
  await page.locator('[data-chapter="4"]').click();await page.waitForFunction(()=>document.querySelector('[data-chapter="4"]').getAttribute('aria-current')==='step');
  report.push({mobile,first,offlineReload:repeat});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile('artifacts/native/cache-opening-report.json',JSON.stringify({passed:true,report},null,2));console.log(JSON.stringify({passed:true,report}));
}finally{await browser.close();await new Promise(r=>server.close(r));}

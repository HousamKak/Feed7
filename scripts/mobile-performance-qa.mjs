import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import express from 'express';
import {resolve} from 'node:path';
const app=express();app.use('/Feed7/',express.static(resolve('dist-pages')));const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=process.env.MOBILE_QA_URL||`http://127.0.0.1:${server.address().port}/Feed7/`;
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],requests=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:200000,uploadThroughput:100000});
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForSelector('.loading.done',{state:'attached',timeout:60000});await page.waitForFunction(()=>window.__FEED7_NATIVE_WORLD__?.ready,{},{timeout:180000});
 const state=await page.evaluate(()=>window.__FEED7_NATIVE_WORLD__);assert.equal(state.tier,'mobile');assert.equal(state.preparation.views.length,2);assert.ok(!requests.some(u=>/studio-[a-f0-9]+\.json\.gz/.test(u)),'Phone must not download the desktop world');assert.ok(!requests.some(u=>u.includes('RectAreaLightUniformsLib')||u.includes('prototype-studio')));
 await page.screenshot({path:'artifacts/native/mobile-optimized-opening.png'});
 for(const i of [2,3,4,6,8,10,12]){await page.locator(`[data-chapter="${i}"]`).click();await page.waitForFunction(i=>document.querySelector(`[data-chapter="${i}"]`).getAttribute('aria-current')==='step',i,{timeout:15000});if([3,6,10].includes(i))await page.screenshot({path:`artifacts/native/mobile-optimized-${i}.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 const timings=await page.evaluate(()=>({logo:performance.getEntriesByName('feed7-logo-visible')[0].startTime,ready:performance.getEntriesByName('feed7-world-ready')[0].startTime,resources:performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,bytes:r.transferSize}))}));
 assert.deepEqual(errors,[]);const build=JSON.parse(await readFile('artifacts/native/mobile-build-report.json','utf8'));await writeFile('artifacts/native/mobile-performance-report.json',JSON.stringify({passed:true,network:'1.6 Mbps, 80 ms latency, cold cache',state,build,timings,checks:['Mobile-only world and texture delivery','No desktop area-light or prototype code','Two-view GPU preparation','High DPR phone viewport','Working chapter navigation and no horizontal overflow','No runtime or shader errors']},null,2));console.log(JSON.stringify({passed:true,build,timings:{logo:timings.logo,ready:timings.ready},state}));
}finally{await browser.close();await new Promise(r=>server.close(r));}

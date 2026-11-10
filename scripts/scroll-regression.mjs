import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],frames=[];
try{const page=await browser.newPage({viewport:{width:1000,height:700},reducedMotion:'no-preference'});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5173/');await page.waitForFunction(()=>window.__FEED7_NATIVE_WORLD__?.ready,{},{timeout:90000});assert.equal(await page.evaluate(()=>window.__FEED7_NATIVE_WORLD__.renderPipeline),'direct-physical/4');assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollbarWidth),'none');
 for(const progress of [0,.5,1,2,3,3.5,4,4.5,11,11.25,11.5,11.75,12,11.5,11,4,3.5,3,2,1,.5,0]){
  await page.evaluate(v=>scrollTo(0,innerHeight*v),progress);await page.waitForTimeout(180);
  const png=(await page.locator('#world canvas').screenshot()).toString('base64');
  const dark=await page.evaluate(async b64=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data;let black=0;for(let i=0;i<a.length;i+=4)if(a[i]<3&&a[i+1]<3&&a[i+2]<3)black++;return black/(a.length/4);},png);
  frames.push({progress,blackFraction:dark});if(dark>=.03)await page.screenshot({path:'artifacts/native/scroll-black-failure.png'});assert.ok(dark<.03,`Unexpected black resolve at ${progress}: ${dark}`);
 }
 assert.deepEqual(errors,[]);await writeFile('artifacts/native/scroll-regression.json',JSON.stringify({passed:true,frames,checks:['Hidden scrollbar with working scrolling','No black transmission resolve forwards or backwards','Orbit and closing transitions','No runtime errors']},null,2));console.log('Scroll regression passed: '+frames.length+' forward and reverse frames.');
}finally{await browser.close();}

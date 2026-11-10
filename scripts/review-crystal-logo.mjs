import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const data=JSON.parse(await readFile('public/native/studio.json','utf8'));
const key=Object.keys(data.entityMetadata).find(k=>data.entityMetadata[k].sequenceOnly==='logo');
assert.ok(key,'Logo must be authored in the native world');
const spec=data.appearance[data.entityMaterials[key]].materialSpec;
assert.equal(spec.baseColor,'#f2eee3');assert.ok(spec.transmission>.5);
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
try{const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5173/');await page.waitForFunction(()=>window.__FEED7_NATIVE_WORLD__?.ready,{},{timeout:120000});await page.screenshot({path:'artifacts/native/crystal-logo.png'});assert.deepEqual(errors,[]);console.log('Native crystal logo passed: original ivory, compiled geometry, no browser errors.');}finally{await browser.close();}

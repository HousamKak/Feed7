import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import express from 'express';
import {createApp} from '../server/app.mjs';

// Real browser QA against the production bundle and a separate in-memory
// database. No demo submissions or credentials enter the user's local data.
const password=randomBytes(24).toString('hex');
const {app,db}=createApp({dbPath:':memory:',adminPassword:password});
app.use(express.static(resolve('dist')));app.get('/{*path}',(req,res)=>res.sendFile(resolve('dist/index.html')));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
const options={headless:true};
if(process.env.CHROME_EXECUTABLE)options.executablePath=process.env.CHROME_EXECUTABLE;
else if(existsSync('C:/Users/houss/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'))options.executablePath='C:/Users/houss/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const browser=await chromium.launch(options);const errors=[];await mkdir('artifacts/qa',{recursive:true});
const p=await browser.newPage({viewport:{width:1440,height:960}});p.on('pageerror',e=>errors.push(e.message));
const close=async()=>{await p.getByRole('button',{name:'Close dialog'}).click();};
const ready=async page=>{await page.waitForSelector('.loading.done',{state:'attached'});await page.waitForTimeout(1000);};
try{
 await p.goto(base);await ready(p);assert.equal(await p.title(),'FEED7 / A world built for growth.');assert.equal(await p.locator('canvas').count(),1);
 const hashes=[];
 for(let i=0;i<9;i++){
  await p.locator(`[data-chapter="${i}"]`).click();await p.waitForTimeout(1500);assert.equal(await p.locator(`[data-chapter="${i}"]`).getAttribute('aria-current'),'step');
  const canvas=await p.locator('#world canvas').screenshot();hashes.push(createHash('sha256').update(canvas).digest('hex'));
  await p.screenshot({path:`artifacts/qa/desktop-${i}.png`});
  const title=await p.locator('h1').boundingBox(),footer=await p.locator('.tour-footer').boundingBox();assert.ok(title.y+title.height<footer.y-40,`Chapter ${i} headline overlaps footer`);
 }
 assert.equal(new Set(hashes).size,9,'Every chapter must render a distinct camera view');
 await p.getByRole('button',{name:'Look around'}).click();assert.equal(await p.locator('#explore-toggle').getAttribute('aria-pressed'),'true');await p.mouse.move(900,450);await p.mouse.down();await p.mouse.move(1100,520,{steps:10});await p.mouse.up();await p.waitForTimeout(500);await p.screenshot({path:'artifacts/qa/explore-mode.png'});await p.getByRole('button',{name:'Return to the tour'}).click();assert.equal(await p.locator('#explore-toggle').getAttribute('aria-pressed'),'false');
 await p.getByRole('button',{name:'Pause ambient animations'}).click();assert.ok(await p.getByRole('button',{name:'Resume ambient animations'}).isVisible());
 await p.locator('header [data-open=services]').click();await p.getByRole('button',{name:'Technology',exact:true}).click();assert.equal(await p.locator('.service-item').count(),3);await p.locator('.service-item').first().locator('summary').click();assert.ok(await p.getByText('Custom web applications',{exact:true}).isVisible());await close();
 await p.getByRole('button',{name:'Search',exact:true}).click();await p.locator('#search-input').fill('recovery');assert.equal(await p.locator('.search-result').count(),1);await p.locator('.search-result').click();assert.ok(await p.locator('details[open]').isVisible());await close();
 await p.locator('header [data-open=work]').click();await p.locator('[data-concept="0"]').click();assert.ok(await p.getByText('No client performance metrics or commercial results are claimed.',{exact:false}).isVisible());await close();
 await p.locator('header [data-open=about]').click();assert.ok(await p.getByText('Every part should work together.').isVisible());await close();
 await p.locator('.studio-map').click();await p.getByRole('button',{name:/^FAQ/}).click();await p.locator('#panel-content details').first().locator('summary').click();assert.ok(await p.getByText('We bring strategy, marketing, creative production',{exact:false}).isVisible());await close();
 await p.locator('header [data-open=request]').click();await p.getByLabel('Your name').fill('Browser QA');await p.getByLabel('Email address').fill('qa@example.test');await p.getByLabel('What can we help with?').selectOption('studio');await p.getByLabel('Your project',{exact:true}).fill('We want to record a three-person podcast in the studio next month.');await p.getByRole('checkbox').check();await p.getByRole('button',{name:'Send your brief'}).click();await p.getByRole('link',{name:'Open your project space'}).waitFor();
 const portal=await p.getByRole('link',{name:'Open your project space'}).getAttribute('href');await p.getByRole('link',{name:'Open your project space'}).click();await ready(p);await p.locator('.status-badge').waitFor();assert.equal(await p.locator('.status-badge').textContent(),'New');await p.screenshot({path:'artifacts/qa/client-portal.png'});
 await p.goto(base+'/admin');await ready(p);await p.getByLabel('Admin password').fill(password);await p.getByRole('button',{name:'Sign in'}).click();await p.getByRole('button',{name:'Requests',exact:true}).waitFor();
 await p.locator('.admin-request summary').first().click();await p.getByLabel('Request status').selectOption('Reviewing');await p.getByLabel('Update for the client portal').fill('Your recording brief is being reviewed by the studio team.');await p.getByRole('button',{name:'Save update'}).click();await p.getByRole('button',{name:'Services',exact:true}).click();await p.locator('.admin-request summary').first().click();await p.locator('details[open]').getByLabel('Short introduction').fill('A browser-verified strategy introduction.');await p.getByRole('button',{name:'Save service'}).click();await p.waitForTimeout(250);
 const cms=await (await p.request.get(base+'/api/content')).json();assert.equal(cms.services[0].short,'A browser-verified strategy introduction.');
 await p.getByRole('button',{name:'Projects',exact:true}).click();await p.getByText('+ Add project',{exact:true}).click();await p.getByLabel('Project title').fill('Studio launch QA');await p.getByLabel('Project description').fill('A browser test project.');await p.locator('#add-record [name=clientId]').selectOption({label:'Browser QA'});await p.getByRole('button',{name:'Create',exact:false}).click();await p.locator('summary').filter({hasText:'Studio launch QA'}).waitFor();await p.locator('summary').filter({hasText:'Studio launch QA'}).click();await p.getByLabel('Project status').selectOption('In progress');await p.getByRole('button',{name:'Save changes'}).click();await p.waitForTimeout(250);await p.screenshot({path:'artifacts/qa/admin.png'});
 await p.getByRole('button',{name:'Sign out'}).click();await p.getByLabel('Admin password').waitFor();await p.goto(base+portal);await ready(p);await p.locator('.status-badge').waitFor();assert.equal(await p.locator('.status-badge').textContent(),'Reviewing');assert.ok(await p.getByText('Your recording brief is being reviewed by the studio team.').isVisible());
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(base);await ready(mobile);
 for(let i=0;i<9;i++){await mobile.locator(`[data-chapter="${i}"]`).click();await mobile.waitForTimeout(200);await mobile.screenshot({path:`artifacts/qa/mobile-${i}.png`});assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile horizontal overflow');const h=await mobile.locator('h1').boundingBox(),f=await mobile.locator('.scroll-cue').boundingBox();assert.ok(h.y+h.height<f.y-40,`Mobile chapter ${i} headline overlaps controls`);}
 await mobile.getByRole('button',{name:'Open menu'}).click();await mobile.getByRole('button',{name:'All services'}).click();assert.equal(await mobile.locator('.service-item').count(),10);await mobile.getByRole('button',{name:'Close dialog'}).click();
 const fallback=await browser.newPage({viewport:{width:390,height:844}});await fallback.addInitScript(()=>{const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type.startsWith('webgl'))return null;return getContext.call(this,type,...args);};});await fallback.goto(base);await fallback.waitForSelector('body.fallback');await fallback.waitForTimeout(1200);await fallback.getByRole('button',{name:'All our services'}).click();assert.equal(await fallback.locator('.service-item').count(),10);await fallback.screenshot({path:'artifacts/qa/fallback.png'});
 assert.deepEqual(errors,[],'No browser runtime errors');
 console.log('Browser QA passed: 9 desktop and 9 mobile camera views; responsive bounds; services, search, work, FAQ; project request → admin review → private portal; CMS; project management; logout; WebGL fallback.');
}catch(error){await p.screenshot({path:'artifacts/qa/failure.png'}).catch(()=>{});throw error;}finally{await browser.close();await new Promise(r=>server.close(r));db.close();}

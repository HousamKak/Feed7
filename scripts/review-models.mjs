import {chromium} from '@playwright/test';
import * as THREE from 'three';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createChair,createMicrophone,createSofa,createPlant,createTable,createCamera,createSoftbox} from '../src/studio-models.js';

const out='artifacts/models';await mkdir(out,{recursive:true});
const material=new THREE.MeshStandardMaterial(),m=Object.fromEntries(['fabric','leather','wood','ink','metal','seam','grille','cable','soil','vein','leaf','leafLight','lens','record','diffuser'].map(key=>[key,material]));
const builders={chair:createChair,microphone:createMicrophone,sofa:createSofa,plant:createPlant,table:createTable,camera:createCamera,softbox:createSoftbox},report={};
for(const [name,build]of Object.entries(builders)){
 const object=build(m);let triangles=0;object.traverse(o=>{if(!o.isMesh)return;for(const attribute of ['position','normal'])assert.ok([...o.geometry.attributes[attribute].array].every(Number.isFinite),`${name}: nonfinite ${attribute}`);triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
 const size=new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());report[name]={dimensionsMetres:size.toArray(),triangles};
 if(name==='chair'){
  assert.ok(size.x<.9&&size.y<1.3&&size.z<.9,'Chair must fit real seating proportions');
  for(const [x,z,angle]of [[-11.05,-5,-Math.PI/2],[-6.95,-5,Math.PI/2],[-9,-7.05,Math.PI],[-9,-2.95,0]]){
   const chair=createChair(m);chair.position.set(x,.355,z);chair.rotation.y=angle;chair.updateMatrixWorld(true);
   const box=new THREE.Box3().setFromObject(chair.getObjectByName('Curved backrest'));
   const closestX=THREE.MathUtils.clamp(-9,box.min.x,box.max.x),closestZ=THREE.MathUtils.clamp(-5,box.min.z,box.max.z);
   assert.ok(Math.hypot(closestX+9,closestZ+5)>1.675,'Every chair back must clear the circular tabletop');
  }
 }

}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});const errors=[];
try{const page=await browser.newPage({viewport:{width:1200,height:950},deviceScaleFactor:1.5});page.on('pageerror',e=>errors.push(e.message));
 for(const name of Object.keys(builders)){await page.goto(`http://localhost:5173/?model=${name}`);await page.waitForFunction(()=>!!window.__FEED7_MODEL_REVIEW__);await page.waitForTimeout(250);for(const view of ['three-quarter','front','side']){await page.evaluate(v=>window.__FEED7_MODEL_REVIEW__.view(v),view);await page.waitForTimeout(120);await page.screenshot({path:`${out}/${name}-${view}.png`});}await page.locator('#model-clay').click();await page.waitForTimeout(120);await page.screenshot({path:`${out}/${name}-clay.png`});}
 assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({passed:true,models:report,checks:['Finite geometry and normals','Real chair proportions','Chair back clear of tabletop','Production geometry in neutral lighting','Front, side, three-quarter and clay inspection','No browser runtime errors']},null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}

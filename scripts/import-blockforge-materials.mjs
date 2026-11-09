import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Use the actual engine compiler and licensed library. Runtime files are
// self-contained, so Pages and CI do not require a Blockforge checkout.
const engine=resolve(process.env.BLOCKFORGE_ROOT||'D:/dev/block game');
const load=p=>import(pathToFileURL(join(engine,p)).href);
const {loadMaterial,loadHdri,decodeAnyPng}=await load('lib/materialLib.js');
const {compileMaterial}=await load('src/material/MaterialSpec.js');
const {encodePng}=await load('lib/png.js');
const output=resolve('public/blockforge');await mkdir(output,{recursive:true});
const temp=resolve('artifacts/material-import');await mkdir(temp,{recursive:true});
const records=[];
for(const id of ['walnut-natural','linen','leather-brown','painted-plaster']){
 const source=loadMaterial(id);
 if(source.source.licence!=='CC0-1.0')throw new Error(`Unexpected licence: ${id}`);
 const entry=compileMaterial(source,{blocksPerMeter:1,metalness:0,normalScale:id==='painted-plaster'?.18:.45});
 const paths={};
 for(const role of ['base','nr']){
  const bytes=await readFile(join(engine,source.maps[role]));
  if(createHash('sha256').update(bytes).digest('hex')!==source.source.packed[role])throw new Error(`Scan checksum mismatch: ${id}/${role}`);
  const image=decodeAnyPng(bytes);
  if(role==='base'){
   const path=join(output,`${id}-base.webp`);
   execFileSync('magick',[join(engine,source.maps.base),'-alpha','off','-resize','768x768','-quality','86',path]);paths.base=`blockforge/${id}-base.webp`;
  }else{
   const normal=new Uint8Array(image.data),rough=new Uint8Array(image.data);
   for(let i=0;i<normal.length;i+=4){const x=normal[i]/127.5-1,y=normal[i+1]/127.5-1;normal[i+2]=Math.round(127.5+127.5*Math.sqrt(Math.max(0,1-x*x-y*y)));normal[i+3]=255;rough[i]=rough[i+1]=rough[i+2]=image.data[i+2];rough[i+3]=255;}
   for(const [name,data]of [['normal',normal],['roughness',rough]]){
    const png=join(temp,`${id}-${name}.png`);await writeFile(png,encodePng({...image,data}));
    execFileSync('magick',[png,'-resize','512x512','-define','webp:lossless=true',join(output,`${id}-${name}.webp`)]);paths[name]=`blockforge/${id}-${name}.webp`;
   }
  }
 }
 records.push({id,pbr:entry.pbr,average:source.average,maps:paths,source:source.source});
}
const hdri=loadHdri('studio-small-09');
execFileSync('magick',[join(engine,hdri.file),'-resize','1024x512',join(output,'studio-small-09.hdr')]);
await writeFile(join(output,'materials.json'),JSON.stringify({compiler:'Blockforge src/material/MaterialSpec.js compileMaterial',materials:records,environment:{file:'blockforge/studio-small-09.hdr',source:hdri.source}},null,2));
console.log('Imported four verified CC0 material scans and studio HDRI using Blockforge’s material compiler.');

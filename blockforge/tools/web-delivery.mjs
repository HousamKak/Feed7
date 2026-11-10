import {writeFile,readFile,rename} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {setTimeout as delay} from 'node:timers/promises';
import {join} from 'node:path';
export async function atomicWrite(file,body){await writeFile(file+'.next',body);for(let i=0;;i++){try{await rename(file+'.next',file);return;}catch(e){if(i>=19||!['EPERM','EBUSY'].includes(e.code))throw e;await delay(100);}}}
export async function publishWebDelivery(delivery,out){
 const revision=delivery.provenance.deliveryRevision,name=`studio-${revision.slice(0,16)}.json.gz`,worldFile=`native/${name}`;
 // Versioned payloads stay immutable while a browser is streaming them.
 try{await writeFile(join(out,name),gzipSync(JSON.stringify(delivery),{level:6}),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
 const logo=delivery.meshes.find(m=>delivery.entityMetadata[m.instances.placements[0].key]?.sequenceOnly==='logo');
 const atmosphere=JSON.parse(await readFile(new URL('../world/atmosphere.json',import.meta.url),'utf8'));
 await atomicWrite(join(out,'bootstrap.json'),JSON.stringify({worldFile,lightRig:delivery.lightRig,atmosphere,cameras:delivery.cameras,nativeLogo:{geometry:logo.instances.geometry,cellSizeM:delivery.cellSizeM,appearance:delivery.appearance[delivery.entityMaterials[logo.instances.placements[0].key]]},provenance:delivery.provenance,project:delivery.project,compiler:delivery.compiler}));
 await atomicWrite(join(out,'revision.json'),JSON.stringify({revision}));
}

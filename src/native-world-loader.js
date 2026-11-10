// Retain decoded geometry between visits, keyed by the immutable world URL.
const database=new Promise(resolve=>{try{const request=indexedDB.open('feed7-worlds',1);request.onupgradeneeded=()=>request.result.createObjectStore('worlds');request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);}catch{resolve(null);}});
async function stored(url,value){const db=await database;if(!db)return;return new Promise(resolve=>{try{const tx=db.transaction('worlds',value?'readwrite':'readonly'),request=value?tx.objectStore('worlds').put(value,url):tx.objectStore('worlds').get(url);let result;request.onsuccess=()=>result=request.result;tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>resolve();}catch{resolve();}});}
self.onmessage=async({data:url})=>{try{
 let data=await stored(url),cacheHit=!!data;
 if(!data){
 self.postMessage({progress:{phase:'world',value:0}});
 const response=await fetch(url,{cache:'force-cache',priority:'low'});if(!response.ok)throw new Error('Compiled native world unavailable');
 // Vite marks precompressed files with Content-Encoding, which fetch already
 // decodes. Static hosts may serve the same bytes without that header.
 const alreadyDecoded=response.headers.get('content-encoding')?.includes('gzip');
 const decoded=url.endsWith('.gz')&&!alreadyDecoded?new Response(response.body.pipeThrough(new DecompressionStream('gzip'))):response;
 data=await decoded.json();
 for(const mesh of data.meshes){const g=mesh.instances.geometry,small=g.positions.length/3<=65535;for(const name of ['positions','normals','uvs','indices'])if(g[name])g[name]=name==='indices'?(small?new Uint16Array(g[name]):new Uint32Array(g[name])):new Float32Array(g[name]);}
 await stored(url,data);
 }
 self.postMessage({progress:{phase:cacheHit?'cache':'world',value:1}});
 const transfer=[];for(const mesh of data.meshes)for(const name of ['positions','normals','uvs','indices'])if(mesh.instances.geometry[name])transfer.push(mesh.instances.geometry[name].buffer);
 self.postMessage({data,cacheHit},transfer);
}catch(e){self.postMessage({error:e.message});}};

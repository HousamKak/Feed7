// Parse and pack the large world away from the opening animation's main thread.
self.onmessage=async({data:url})=>{try{
 const response=await fetch(url,{cache:'no-cache',priority:'low'});if(!response.ok)throw new Error('Compiled native world unavailable');
 // Vite marks precompressed files with Content-Encoding, which fetch already
 // decodes. Static hosts may serve the same bytes without that header.
 const alreadyDecoded=response.headers.get('content-encoding')?.includes('gzip');
 const decoded=url.endsWith('.gz')&&!alreadyDecoded?new Response(response.body.pipeThrough(new DecompressionStream('gzip'))):response;
 const data=await decoded.json(),transfer=[];
 for(const mesh of data.meshes){const g=mesh.instances.geometry,small=g.positions.length/3<=65535;for(const name of ['positions','normals','uvs','indices'])if(g[name]){g[name]=name==='indices'?(small?new Uint16Array(g[name]):new Uint32Array(g[name])):new Float32Array(g[name]);transfer.push(g[name].buffer);}}
 self.postMessage({data},transfer);
}catch(e){self.postMessage({error:e.message});}};

const VERSION='__FEED7_VERSION__',CACHE='feed7-assets-v1';
const root=new URL(self.registration.scope),versionKey=new URL('__cache-version',root).href;
const publicAsset=url=>url.origin===root.origin&&url.pathname.startsWith(root.pathname)&&!url.pathname.includes('/api/')&&!url.pathname.includes('/admin')&&!url.searchParams.has('portal')&&!url.pathname.endsWith('/sw.js');
const immutable=url=>/\/assets\/.*-[\w-]+\.(js|css)$/.test(url.pathname)||/\/native\/studio-(desktop|mobile)-[a-f0-9]+\.json\.gz$/.test(url.pathname);
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE),previous=await cache.match(versionKey);if((await previous?.text())!==VERSION){for(const request of await cache.keys())if(!immutable(new URL(request.url)))await cache.delete(request);await cache.put(versionKey,new Response(VERSION));}await self.clients.claim();})()));
async function cacheAsset(request){const cache=await caches.open(CACHE),hit=await cache.match(request,{ignoreVary:true});if(hit)return hit;const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response;}
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||!publicAsset(url))return;
 if(request.mode==='navigate'){event.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(request,{ignoreVary:true}),network=fetch(request).then(async response=>{if(response.ok)await cache.put(request,response.clone());return response;}).catch(error=>{if(hit)return hit;throw error;});event.waitUntil(network.then(()=>{}).catch(()=>{}));return hit?Promise.race([network,new Promise(resolve=>setTimeout(()=>resolve(hit),700))]):network;})());}
 else event.respondWith(cacheAsset(request));
});
self.addEventListener('message',event=>{if(event.data?.type!=='CACHE_URLS')return;event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const url of event.data.urls||[]){if(!publicAsset(new URL(url)))continue;try{if(!await cache.match(url,{ignoreVary:true})){const response=await fetch(url,{cache:'force-cache',credentials:'same-origin'});if(response.ok)await cache.put(url,response);}}catch{}}
 const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-180)))if(key.url!==versionKey)await cache.delete(key);event.ports[0]?.postMessage({ready:true});})());});

import {assetUrl,STATIC_HOSTED} from './config.js';
export async function initializePersistentCache(){
 if(!import.meta.env.PROD||!STATIC_HOSTED||!('serviceWorker'in navigator))return false;
 try{const registration=await navigator.serviceWorker.register(assetUrl('sw.js'),{scope:import.meta.env.BASE_URL,updateViaCache:'none'});if(!navigator.serviceWorker.controller)await Promise.race([new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true})),new Promise(resolve=>setTimeout(resolve,1200))]);return !!registration.active;}catch{return false;}
}
export async function cacheUsedAssets(){
 if(!import.meta.env.PROD||!STATIC_HOSTED||!navigator.serviceWorker?.controller)return false;
 try{const urls=[location.href,...performance.getEntriesByType('resource').map(r=>r.name)].filter(url=>new URL(url).origin===location.origin),channel=new MessageChannel();const ready=new Promise(resolve=>{channel.port1.onmessage=()=>resolve(true);setTimeout(()=>resolve(false),15000);});navigator.serviceWorker.controller.postMessage({type:'CACHE_URLS',urls},[channel.port2]);const stored=await ready;channel.port1.close();window.__FEED7_CACHE__={assetsReady:stored};return stored;}catch{return false;}
}

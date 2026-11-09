import * as THREE from 'three';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {assetUrl} from './config.js';

export async function loadBlockforgeMaterials(renderer){
 const response=await fetch(assetUrl('blockforge/materials.json'));
 if(!response.ok)throw new Error('Blockforge material manifest unavailable');
 const manifest=await response.json(),loader=new THREE.TextureLoader(),materials={};
 await Promise.all(manifest.materials.map(async record=>{
  const [map,normalMap,roughnessMap]=await Promise.all(['base','normal','roughness'].map(key=>loader.loadAsync(assetUrl(record.maps[key]))));
  map.colorSpace=THREE.SRGBColorSpace;
  for(const texture of [map,normalMap,roughnessMap]){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}
  materials[record.id]={map,normalMap,roughnessMap,userData:{blockforgeMaterial:record.id,tileMeters:record.pbr.tile},metalness:record.pbr.metalness,normalScale:new THREE.Vector2(record.pbr.normalScale,record.pbr.normalScale)};
 }));
 const hdr=await new RGBELoader().loadAsync(assetUrl(manifest.environment.file));
 const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(hdr);hdr.dispose();pmrem.dispose();
 return {materials,environment};
}

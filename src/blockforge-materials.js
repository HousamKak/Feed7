import * as THREE from 'three';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {assetUrl} from './config.js';
import {Color} from 'three';

// The material library's linear-ratio tint: change the target albedo without
// multiplying an already blue fabric or dark leather by another dark colour.
export function tintScannedMaterial(material,target){
 const color=new Color(target);material.userData={...material.userData,targetColor:color.getHexString()};
 if(material.map&&material.userData.average){const average=new Color(material.userData.average);color.r=Math.min(8,color.r/Math.max(average.r,.002));color.g=Math.min(8,color.g/Math.max(average.g,.002));color.b=Math.min(8,color.b/Math.max(average.b,.002));}
 material.color.copy(color);return material;
}

export async function loadBlockforgeMaterials(renderer,{environment:includeEnvironment=true}={}){
 const response=await fetch(assetUrl('blockforge/materials.json'));
 if(!response.ok)throw new Error('Blockforge material manifest unavailable');
 const manifest=await response.json(),loader=new THREE.TextureLoader(),materials={};
 const hdrDownload=includeEnvironment?new RGBELoader().loadAsync(assetUrl(manifest.environment.file)):null;
 hdrDownload?.catch(()=>{});
 await Promise.all(manifest.materials.map(async record=>{
  const [map,normalMap,roughnessMap]=await Promise.all(['base','normal','roughness'].map(key=>loader.loadAsync(assetUrl(record.maps[key]))));
  map.colorSpace=THREE.SRGBColorSpace;
  for(const texture of [map,normalMap,roughnessMap]){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}
  materials[record.id]={map,normalMap,roughnessMap,userData:{blockforgeMaterial:record.id,tileMeters:record.pbr.tile,average:record.average},metalness:record.pbr.metalness,normalScale:new THREE.Vector2(record.pbr.normalScale,record.pbr.normalScale)};
 }));
 if(!includeEnvironment)return {materials,environment:null};
 const hdr=await hdrDownload;
 const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(hdr);hdr.dispose();pmrem.dispose();
 return {materials,environment};
}

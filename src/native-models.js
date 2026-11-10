import * as THREE from 'three';
import {assetUrl} from './config.js';
import {tintScannedMaterial} from './blockforge-materials.js';

// Rendering adapter only. All chair geometry comes from the Blockforge compiler.
// Native Z-up becomes browser Y-up via a rotation, preserving face winding.
let chairPromise;
function upholsteryMaterial(source,color){
 const target=color||(source?.userData.targetColor?'#'+source.userData.targetColor:source?.color)||'#365744';
 const m=new THREE.MeshPhysicalMaterial({color:target,map:source?.map||null,normalMap:source?.normalMap||null,normalScale:source?.normalScale?.clone()||new THREE.Vector2(.3,.3),roughnessMap:source?.roughnessMap||null,roughness:.84,metalness:0,sheen:1,sheenRoughness:.72,sheenColor:'#78947b'});m.userData={...source?.userData};return tintScannedMaterial(m,target);
}
export function loadNativeChair(materials){
 chairPromise??=fetch(assetUrl('native/chair.json'),{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(`Native chair failed to load: ${r.status}`);return r.json();});
 return chairPromise.then(data=>{
  const template=new THREE.Group();template.name='Blockforge upholstered tub chair';
  template.userData={source:data.source,compiler:data.provenance.compiler,productionModule:data.provenance.productionModule,tier:data.tier,triangles:data.triangles};
  for(const part of data.groups){
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(part.positions,3));
   geometry.setAttribute('normal',new THREE.Float32BufferAttribute(part.normals,3));
   const role=part.material.startsWith('velvet')?'upholstery':part.material.startsWith('wood')?'wood':part.material.startsWith('thread')?'thread':'frame';
   if(part.uvs.length)geometry.setAttribute('uv',new THREE.Float32BufferAttribute(part.uvs,2));
   geometry.setIndex(part.indices);geometry.rotateX(-Math.PI/2);geometry.rotateY(Math.PI);
   const spec=data.materials[part.material];
   geometry.userData.nativePatternUvs=true;
   const supplied=role==='upholstery'?materials.fabric:role==='wood'?materials.wood:role==='thread'?materials.seam:materials.ink;
   const material=role==='upholstery'?upholsteryMaterial(supplied,spec.color):supplied?supplied.clone():new THREE.MeshStandardMaterial();
   material.color.set(spec.color);material.roughness=spec.roughness??.8;
   material.metalness=part.material==='steel_black'?.3:0;
   if(role==='upholstery'||role==='wood')tintScannedMaterial(material,spec.color);
   if(role==='upholstery'){material.roughness=.86;}
   const tile=material.userData.tileMeters||.27;
   if(geometry.attributes.uv){const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/tile,uv.getY(i)/tile);}
   const mesh=new THREE.Mesh(geometry,material);mesh.name=part.name;mesh.userData.nativeRole=role;mesh.castShadow=true;mesh.receiveShadow=true;template.add(mesh);
  }
  return (upholstery=null)=>{
   const model=template.clone(true);
   if(upholstery)model.traverse(o=>{if(o.isMesh&&o.userData.nativeRole==='upholstery'){o.material=upholsteryMaterial(upholstery);}});
   return model;
  };
 });
}

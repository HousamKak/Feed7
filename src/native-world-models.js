import * as THREE from 'three';
import {assetUrl} from './config.js';
import {tintScannedMaterial} from './blockforge-materials.js';
import {drawStudioScreen} from './studio-screens.js';
let compiled;
const prefixes={microphone:['recording/microphone-0/'],table:['recording/table/'],camera:['recording/camera-0/'],softbox:['recording/softbox-0/','fixture/feed7/recording-key/'],sofa:['lounge/sofa/'],plant:['decor/olive-0/'],'task-chair':['technology/task-chair-0/'],monitor:['technology/monitor-0/','screens/design/'],seven:['identity/seven/']};

// Inspect the actual compiled production objects used by the native room.
export async function loadNativeWorldModel(name,materials){
 compiled??=fetch(assetUrl('native/studio.json'),{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('Native asset library unavailable');return r.json();});
 const data=await compiled,group=new THREE.Group();group.name=`Blockforge ${name}`;const basis=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2),inverse=basis.clone().invert();let triangles=0,referenceYaw=null;
 for(const mesh of data.meshes){const src=mesh.instances.geometry;for(const placement of mesh.instances.placements){
  if(!prefixes[name]?.some(prefix=>placement.key.startsWith(prefix)))continue;
  referenceYaw??=2*Math.atan2(placement.rotation[2],placement.rotation[3]);
  const a=data.appearance[data.entityMaterials[placement.key]],role=a.role;
  const supplied=materials[role==='fabric'?'fabric':role==='leather'?'leather':role==='wood'?'wood':role==='leaf'?'leaf':'metal'];
  let material=role==='crystal'?new THREE.MeshPhysicalMaterial({color:a.color,roughness:.045,transmission:.94,thickness:.48,ior:1.9,attenuationColor:'#0e713f',attenuationDistance:1.8,dispersion:.08,clearcoat:1,flatShading:true}):role==='lens'?new THREE.MeshPhysicalMaterial({color:a.color,roughness:.045,transmission:.75,thickness:.006,ior:1.5,clearcoat:1}):a.emission?new THREE.MeshStandardMaterial({color:a.color,roughness:.9,emissive:a.color,emissiveIntensity:.3}):supplied.clone();material.color.set(role==='wood'?'#ceb08e':a.color);if(!['lens','crystal'].includes(role)){material.roughness=a.materialSpec?.roughness??(role==='wood'?.45:role==='leaf'?.65:.8);material.metalness=a.materialSpec?.metallic??(['wood','fabric','leather','leaf'].includes(role)?0:.2);}if(role==='leaf')material.side=THREE.DoubleSide;
  if(a.screen){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=576;drawStudioScreen(canvas,a.screen,3);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;material=new THREE.MeshBasicMaterial({map});}
  if(['wood','fabric','leather'].includes(role))tintScannedMaterial(material,a.color);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(src.positions.map(v=>v*data.cellSizeM),3));geometry.setIndex(src.indices);if(src.normals)geometry.setAttribute('normal',new THREE.Float32BufferAttribute(src.normals,3));else geometry.computeVertexNormals();if(src.uvs){const tile=material.userData.tileMeters||1;geometry.setAttribute('uv',new THREE.Float32BufferAttribute(src.uvs.map(v=>v/tile),2));}geometry.rotateX(-Math.PI/2);
  const object=new THREE.Mesh(geometry,material);object.name=placement.key;object.position.set(placement.translation[0]*data.cellSizeM,placement.translation[2]*data.cellSizeM,-placement.translation[1]*data.cellSizeM);object.quaternion.fromArray(placement.rotation).premultiply(basis).multiply(inverse);if(Array.isArray(placement.scale))object.scale.set(placement.scale[0],placement.scale[2],placement.scale[1]);else object.scale.setScalar(placement.scale||1);object.castShadow=true;object.receiveShadow=true;group.add(object);triangles+=src.indices.length/3;
 }}
 if(!group.children.length)throw new Error(`Native world object not found: ${name}`);
 const bounds=new THREE.Box3().setFromObject(group),centre=bounds.getCenter(new THREE.Vector3());group.position.set(-centre.x,-bounds.min.y,-centre.z);const root=new THREE.Group();root.add(group);root.rotation.y=-(referenceYaw||0);root.name=group.name;root.userData={compiler:data.compiler,source:'blockforge/world',sourceRevision:data.provenance.sourceRevision,deliveryRevision:data.provenance.deliveryRevision,triangles};return root;
}

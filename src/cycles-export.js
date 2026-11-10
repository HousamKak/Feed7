import * as THREE from 'three';

// Authoring bridge into Blockforge's existing Blender Cycles scene format.
// Geometry stays in metres, converted from Three Y-up to the engine's Z-up.
export function exportCycles(world){
 world.updateMatrixWorld(true);const nodes=[],materials=[],known=new Map();let serial=0;
 function imageData(texture){if(!texture?.image)return null;const im=texture.image,c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;if(!c.width||!c.height)return null;c.getContext('2d').drawImage(im,0,0);return c.toDataURL('image/png');}
 function material(m){if(known.has(m.uuid))return known.get(m.uuid);const id=`surface-${materials.length}`;known.set(m.uuid,id);materials.push({id,color:'#'+m.color.getHexString(),roughness:m.roughness??.5,metallic:m.metalness??0,glass:!!m.transparent&&!m.map,emission:m.isMeshBasicMaterial&&!m.map?2:0,alpha:!!m.transparent&&!!m.map,scan:m.userData?.blockforgeMaterial,maps:{base:imageData(m.map),normal:imageData(m.normalMap),rough:imageData(m.roughnessMap)}});return id;}
 function visit(o){if(!o.isMesh||o.isReflector||Array.isArray(o.material)||!o.geometry.attributes.position)return;
  if(o.isInstancedMesh){const matrix=new THREE.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);const copy=new THREE.Mesh(o.geometry,o.material);copy.matrixWorld.multiplyMatrices(o.matrixWorld,matrix);visit(copy);}return;}
  const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,P=[],N=[],UV=[],I=[],v=new THREE.Vector3(),normal=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
  o.material.map?.updateMatrix();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);P.push(v.x,-v.z,v.y);if(n){normal.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(normal.x,-normal.z,normal.y);}if(uv){const t=new THREE.Vector2().fromBufferAttribute(uv,i);if(o.material.map)t.applyMatrix3(o.material.map.matrix);UV.push(t.x,t.y);}}
  const index=g.index?.array||Array.from({length:p.count},(_,i)=>i);for(let i=0;i<index.length;i+=3)I.push(index[i],index[i+1],index[i+2]);
  nodes.push({id:`feed7/${++serial}`,name:`Studio surface ${serial}`,mats:[{material:material(o.material),positions:P,normals:N,uvs:UV,indices:I}]});
 }
 world.traverse(visit);return {scene:{format:'blockforge-cycles-scene/1',nodes,lights:[]},materials};
}

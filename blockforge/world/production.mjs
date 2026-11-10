// Consume the existing production object contract, including its instancers.
// This is engine geometry; no Three.js objects or constructors are involved.
export function flattenNodes(nodes){
 const prototypes=new Map(nodes.filter(n=>n.prototype).map(n=>[n.id,n])),out=[];
 for(const node of nodes){
  if(node.prototype)continue;
  if(!node.instances){out.push(node);continue;}
  const proto=prototypes.get(node.instances.mesh);if(!proto)throw new Error(`Missing native prototype ${node.instances.mesh}`);
  const mats=proto.mats.map(m=>({material:m.material,positions:[],normals:[],uvs:[],indices:[]}));
  for(const matrix of node.instances.matrices)for(let mi=0;mi<proto.mats.length;mi++){
   const src=proto.mats[mi],dst=mats[mi],base=dst.positions.length/3;
   for(let v=0;v<src.positions.length;v+=3){const x=src.positions[v],y=src.positions[v+1],z=src.positions[v+2];dst.positions.push(matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]);const a=src.normals[v],b=src.normals[v+1],c=src.normals[v+2],n=[matrix[0]*a+matrix[4]*b+matrix[8]*c,matrix[1]*a+matrix[5]*b+matrix[9]*c,matrix[2]*a+matrix[6]*b+matrix[10]*c],l=Math.hypot(...n)||1;dst.normals.push(...n.map(v=>v/l));}
   dst.uvs.push(...src.uvs);dst.indices.push(...src.indices.map(v=>v+base));
  }
  out.push({id:node.id,mats});
 }
 return out;
}

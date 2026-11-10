import * as THREE from 'three';
// A screen-space atmosphere effect. Studio meshes remain native compiler output.
// One draw, no framebuffer copies, no textures or particle simulation.
export function createStudioAtmosphere(scene,settings,background,{mobile=false}={}){
 const uniforms={time:{value:0},aspect:{value:innerWidth/innerHeight},strength:{value:settings.strength},base:{value:new THREE.Color(background)},green:{value:new THREE.Color(settings.color)},highlight:{value:new THREE.Color(settings.highlight)}};
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,
 vertexShader:`varying vec2 uvScreen;void main(){uvScreen=position.xy*.5+.5;gl_Position=vec4(position.xy,1.,1.);}`,
 fragmentShader:`precision highp float;
 varying vec2 uvScreen;uniform float time,aspect,strength;uniform vec3 base,green,highlight;
 float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float n=0.,a=.5;mat2 r=mat2(.8,-.6,.6,.8);for(int i=0;i<${mobile?2:4};i++){n+=a*noise(p);p=r*p*2.03+7.1;a*=.5;}return n;}
 void main(){
  vec2 p=(uvScreen-.5)*vec2(aspect,1.)*3.8;float t=time;
  vec2 warp=vec2(fbm(p*.75+vec2(t*.23,-t*.17)),fbm(p*.8+vec2(-t*.19,t*.13)+13.));
  vec2 flow=p+warp*2.5+vec2(t*.17,-t*.22);
  float cloud=fbm(flow*1.35),wisps=${mobile?'cloud':'fbm(flow*2.8+warp)'};
  float ribbon=exp(-pow((p.y+.28-sin(p.x*.8+t*.22)*.45+(warp.y-.5)*1.7)*.8,2.));
  float density=smoothstep(.24,.76,cloud)*(.38+.62*ribbon);
  float rim=pow(clamp(wisps*1.6-.35,0.,1.),3.)*density;
  float veil=(.68+.32*sin(p.x*.65+p.y*.8+t*.14));
  vec3 color=base+green*density*veil*strength+highlight*rim*.12*strength;
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='FEED7 emerald atmosphere';mesh.renderOrder=-10000;mesh.frustumCulled=false;scene.add(mesh);
 return {update(progress,time,reduced){uniforms.time.value=reduced?0:time*settings.speed;uniforms.aspect.value=innerWidth/innerHeight;const opening=progress<3?1-THREE.MathUtils.smoothstep(progress,1.8,3):progress>11?THREE.MathUtils.smoothstep(progress,11,12):0;uniforms.strength.value=settings.strength*THREE.MathUtils.lerp(settings.studioStrength,1,opening);},dispose(){geometry.dispose();material.dispose();scene.remove(mesh);}};
}

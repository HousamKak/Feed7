const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));

export async function waitForGPU(renderer,active){
 const gl=renderer.getContext(),fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
 if(!fence)throw new Error('Studio GPU preparation could not start');
 try{while(active()){const status=gl.clientWaitSync(fence,0,0);if(status===gl.ALREADY_SIGNALED||status===gl.CONDITION_SATISFIED)return;if(status===gl.WAIT_FAILED)throw new Error('Studio GPU preparation failed');await nextFrame();}}finally{gl.deleteSync(fence);}
}

// Compilation alone does not upload geometry, initialize transmission buffers,
// or build depth shaders and shadow maps. Exercise the real draws before entry.
export async function prepareStudio({renderer,scene,camera,world,clip,materials,stops,mobile,active}){
 const textures=new Set();for(const material of materials.values())for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
 let uploaded=0;for(const texture of textures){if(!active())return;renderer.initTexture(texture);if(++uploaded%3===0)await nextFrame();}
 const warmViews=mobile?[3,4]:[3,2,4],frusta=[];
 await renderer.compileAsync(scene,camera);
 for(let index=0;index<warmViews.length&&active();index++){
  const view=stops[warmViews[index]],savedCamera=camera.clone(),visible=world.visible,height=world.position.y,constant=clip.constant,previousTarget=renderer.getRenderTarget();
  try{
   world.visible=true;world.position.y=0;clip.constant=11;
   camera.position.fromArray(view.p);camera.lookAt(...view.t);camera.fov=view.fov+(mobile?13:0);camera.filmOffset=mobile?0:view.align==='right'?8:0;camera.updateProjectionMatrix();camera.updateMatrixWorld();
   if(index===0){scene.traverse(o=>{if(o.isGroup||o.isMesh||o.isPoints||o.isLine||o.isSprite){frusta.push([o,o.frustumCulled,o.visible]);o.frustumCulled=false;o.visible=true;}});renderer.shadowMap.needsUpdate=true;}
   // Use the actual canvas configuration, including its tone mapping. An
   // offscreen target selects different programs and leaves first-use work.
   renderer.setRenderTarget(null);renderer.render(scene,camera);
  }finally{
   for(const [object,culled,visible]of frusta){object.frustumCulled=culled;object.visible=visible;}frusta.length=0;
   renderer.setRenderTarget(previousTarget);camera.copy(savedCamera);world.visible=visible;world.position.y=height;clip.constant=constant;
   // Both draws happen in one task. Only the restored opening is presented.
   renderer.render(scene,camera);
  }
  await nextFrame();
 }
 await waitForGPU(renderer,active);
 return {views:warmViews.map(i=>stops[i].id),textures:textures.size,geometries:renderer.info.memory.geometries,programs:renderer.info.programs.length,shadowsPrepared:true};
}

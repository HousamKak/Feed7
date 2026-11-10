export function createLoadingIntro(){
 const root=document.querySelector('#brand-intro'),status=document.querySelector('#intro-status'),detail=document.querySelector('#intro-detail');let progress=0;
 const copy={opening:['01 / THE SPARK','Every world starts with an idea.'],world:['02 / THE CONNECTION','A signal is finding its way.'],cache:['02 / THE CONNECTION','Picking up where you left off.'],geometry:['03 / THE WORLD','The pieces are finding their place.'],gpu:['04 / YOUR FRONT ROW','Your next perspective is almost here.']};
 const update=({phase='opening',value=0}={})=>{if(!root)return;const text=copy[phase]||copy.world;status.textContent=text[0];detail.textContent=text[1];const ranges={opening:[.04,.22],world:[.22,.65],cache:[.22,.7],geometry:[.65,.87],gpu:[.87,.98]},[start,end]=ranges[phase]||ranges.world;progress=Math.max(progress,start+(end-start)*Math.max(0,Math.min(1,value||0)));root.style.setProperty('--intro-progress',progress);root.dataset.phase=phase;};
 const listener=event=>update(event.detail);window.addEventListener('feed7-loading',listener);update();
 return {update,complete(){if(!root)return;root.style.setProperty('--intro-progress',1);root.classList.add('done');document.documentElement.classList.remove('intro-active');window.removeEventListener('feed7-loading',listener);try{localStorage.setItem('feed7-visited','1');}catch{}},};
}

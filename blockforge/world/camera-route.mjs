// One authored route shared by the renderer and interface. Each composition
// leaves breathing room on the left for the editorial layer.
export const cameraStops = [
 {id:'origin',p:[0,4.5,43],t:[0,4.5,28],fov:39,map:[27,33],focus:'Beyond the scroll',note:'One studio. Every growth service. Under one roof.',destination:'audit'},
 {id:'signal',p:[4.8,7.8,33],t:[0,1,20],fov:49,map:[27,33],focus:'The problem',note:'Every piece works alone.',destination:'next'},
 {id:'formation',p:[8.5,7,23],t:[0,2,-1],fov:49,map:[27,30],focus:'The connection',note:'Every piece, connected.',destination:'next'},
 {id:'entrance',p:[13,5.8,17],t:[-1,3.3,-3],fov:49,map:[15,27],focus:'One studio',note:'Strategy, content, ads and tech under one roof.',destination:'services'},
 {id:'orbit',p:[7.8,7.6,7.8],t:[-1.8,4.9,-1.5],fov:48,map:[27,21],focus:'Strategy first',note:'Nothing gets made without a reason behind it.',destination:'why'},
 {id:'creative',p:[-2.8,3.2,2.4],t:[-10,2,-5.8],fov:49,map:[15,12],focus:'Social & design',note:'Strategy, calendar, posting and community, with visuals that lead.',destination:'services',filter:'Creative'},
 {id:'recording',p:[-5.9,2.25,-1.8],t:[-10.1,1.8,-5.4],fov:44,map:[12,11],focus:'Shot to perform',note:'Concept, script, shooting and editing in reel and ad formats.',destination:'request',filter:'video'},
 {id:'gallery',p:[-1.7,3.7,9.5],t:[-9.7,2.2,2.3],fov:48,map:[15,29],focus:'Premium execution',note:'Agency-level quality, studio-level speed.',destination:'work'},
 {id:'technology',p:[3.5,2.8,1],t:[8.2,2,-6.5],fov:49,map:[39,13],focus:'Built to sell',note:'Websites, stores, dashboards, CRM and automations.',destination:'services',filter:'Technology'},
 {id:'growth',p:[6.3,3.2,-2.2],t:[-1.6,3.1,-9.5],fov:48,map:[30,12],focus:'Every dollar tracked',note:'Pixel and tracking setup, weekly optimization, clear reporting.',destination:'services',filter:'Growth'},
 {id:'strategy',p:[2,3.4,-.3],t:[8,1.5,3.5],fov:49,map:[42,30],focus:'Audit first',note:'We study your brand, your competitors and your numbers.',destination:'about'},
 {id:'together',p:[-10.5,7.1,16.5],t:[1.5,3,-2.6],fov:52,map:[27,28],focus:'No pitch deck',note:'No pressure. Just clarity.',destination:'audit'},
 {id:'return',p:[0,4.5,43],t:[0,4.5,28],fov:39,map:[27,33],focus:'Let’s talk',note:'Your next chapter starts on WhatsApp.',destination:'whatsapp'}
].map((stop,i)=>({...stop,align:i<3||i===12?'center':(i-3)%2?'right':'left'}));

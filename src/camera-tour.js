// One authored route shared by the renderer and interface. Each composition
// leaves breathing room on the left for the editorial layer.
export const cameraStops = [
 {id:'origin',p:[0,4.5,43],t:[0,4.5,28],fov:39,map:[27,33],focus:'Beyond the scroll',note:'A single idea. An entire world waiting within.',destination:'next'},
 {id:'signal',p:[4.8,7.8,33],t:[0,1,20],fov:49,map:[27,33],focus:'Follow the signal',note:'An identity becomes a road. A road becomes a connection.',destination:'next'},
 {id:'formation',p:[8.5,7,23],t:[0,2,-1],fov:49,map:[27,30],focus:'A world taking shape',note:'Every connection finds its place.',destination:'next'},
 {id:'entrance',p:[13,5.8,17],t:[-1,3.3,-3],fov:49,map:[15,27],focus:'A connected world',note:'An entire studio. Yours to explore.',destination:'next'},
 {id:'orbit',p:[7.8,7.6,7.8],t:[-1.8,4.9,-1.5],fov:48,map:[27,21],focus:'The orbital installation',note:'Suspended light. A floating signature. Always in motion.',destination:'about'},
 {id:'creative',p:[-2.8,3.2,2.4],t:[-10,2,-5.8],fov:49,map:[15,12],focus:'The creative floor',note:'Warm light, tactile materials, and room for a big idea.',destination:'services',filter:'Creative'},
 {id:'recording',p:[-5.9,2.25,-1.8],t:[-10.1,1.8,-5.4],fov:44,map:[12,11],focus:'Sound in motion',note:'An animated waveform sets the rhythm of the recording floor.',destination:'request',filter:'studio'},
 {id:'gallery',p:[-1.7,3.7,9.5],t:[-9.7,2.2,2.3],fov:48,map:[15,29],focus:'The kinetic gallery',note:'Eleven chrome ribbons. One constantly changing silhouette.',destination:'work'},
 {id:'technology',p:[3.5,2.8,1],t:[8.2,2,-6.5],fov:49,map:[39,13],focus:'The digital lab',note:'Live screens, drifting data, and slowly pivoting glass.',destination:'services',filter:'Technology'},
 {id:'growth',p:[6.3,3.2,-2.2],t:[-1.6,3.1,-9.5],fov:48,map:[30,12],focus:'The growth room',note:'From the first spark to a connected customer journey.',destination:'services',filter:'Growth'},
 {id:'strategy',p:[2,3.4,-.3],t:[8,1.5,3.5],fov:49,map:[42,30],focus:'A seat at the table',note:'A quieter corner to turn ambition into a clear direction.',destination:'services',filter:'Growth'},
 {id:'together',p:[-10.5,7.1,16.5],t:[1.5,3,-2.6],fov:52,map:[27,28],focus:'Your next chapter',note:'You have seen our world. Let’s build yours.',destination:'request'},
 {id:'return',p:[0,4.5,43],t:[0,4.5,28],fov:39,map:[27,33],focus:'Every end is a beginning',note:'Back to the idea. Ready for your next chapter.',destination:'restart'}
].map((stop,i)=>({...stop,align:i<3||i===12?'center':(i-3)%2?'right':'left'}));

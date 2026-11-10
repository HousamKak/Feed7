import {Mesh,roundedBox,cylinder,ring,curve,quad,tripod,result} from '../primitives.mjs';
export function build({tier='web'}={}){
 const m=new Mesh(),h=1.65,hero=tier==='hero';tripod(m,h-.15,{spread:.48});
 roundedBox(m,[0,0,h-.11],[.12,.16,.045],.009,'metal');roundedBox(m,[0,0,h],[.29,.18,.19],.025,'ink');roundedBox(m,[.14,.012,h],[.072,.19,.15],.024,'rubber');
 m.tube(curve([[-.08,0,h+.10],[-.08,0,h+.17],[.08,0,h+.17],[.08,0,h+.1]],40),.012,10,'ink');
 const at=[0,-.08,h],axis=[0,-1,0];
 m.lathe([[0,0],[.056,0],[.058,.025],[.065,.03],[.065,.075],[.069,.08],[.069,.12],[.073,.125],[.073,.17],[.078,.18],[.078,.205],[.074,.215],[0,.215]],at,axis,64,'ink');
 for(const d of [.033,.078,.126,.183,.207])ring(m,[0,-.08-d,h],axis,d>.17?.078:.067,.0015,'metal');
 const n=hero?64:36;for(const [d,r]of [[.05,.066],[.102,.070],[.15,.074]])for(let i=0;i<n;i++){const a=i/n*Math.PI*2;cylinder(m,[Math.cos(a)*r,-.08-d-.012,h+Math.sin(a)*r],[Math.cos(a)*r,-.08-d+.012,h+Math.sin(a)*r],.0010,'rubber',6);}
 cylinder(m,[0,-.291,h],[0,-.295,h],.063,'rubber',64);
 for(let i=0;i<9;i++){const a=i/9*Math.PI*2,b=a+.67;quad(m,[[Math.cos(a)*.058,-.297,h+Math.sin(a)*.058],[Math.cos(b)*.058,-.297,h+Math.sin(b)*.058],[Math.cos(b+.35)*.023,-.298,h+Math.sin(b+.35)*.023],[Math.cos(a+.35)*.023,-.298,h+Math.sin(a+.35)*.023]],'metal');}
 m.lathe([[0,.214],[.062,.214],[.064,.218],[.059,.221],[.045,.226],[.020,.230],[0,.232]],at,axis,64,'lens');
 for(const x of [-.10,0,.09]){cylinder(m,[x,.025,h+.093],[x,.025,h+.112],.019,'rubber',32);for(let i=0;i<16;i++){const a=i/16*Math.PI*2;cylinder(m,[x+Math.cos(a)*.0195,.025+Math.sin(a)*.0195,h+.097],[x+Math.cos(a)*.0195,.025+Math.sin(a)*.0195,h+.108],.0008,'metal',5);}}
 roundedBox(m,[-.20,.045,h+.02],[.025,.15,.12],.006,'ink');roundedBox(m,[-.215,.045,h+.02],[.002,.13,.095],.003,'screen');cylinder(m,[-.16,.10,h-.02],[-.16,.10,h+.08],.009,'metal',20);
 for(const z of [-.035,.005,.045])roundedBox(m,[-.147,.03,h+z],[.002,.028,.009],.002,'rubber');
 return result(m,'camera');
}

import {Mesh,roundedBox,cylinder,curve,result} from '../primitives.mjs';
export function build(){
 const m=new Mesh();
 roundedBox(m,[0,.03,.016],[.45,.30,.032],.018,'metal');cylinder(m,[0,.10,.03],[0,.10,.30],.024,'metal',32);roundedBox(m,[0,.105,.34],[.19,.055,.17],.018,'ink');
 roundedBox(m,[0,.055,.61],[1.36,.055,.81],.018,'ink');
 for(const x of [-.4,-.2,0,.2,.4])for(let i=0;i<3;i++)roundedBox(m,[x,.085,.51+i*.015],[.09,.004,.004],.001,'rubber');
 cylinder(m,[.58,.023,.245],[.58,.02,.245],.0025,'screen',12);
 m.tube(curve([[0,.09,.45],[.035,.13,.28],[.02,.15,.03],[.15,.19,0]],32),.003,8,'rubber');
 return result(m,'studio-monitor');
}

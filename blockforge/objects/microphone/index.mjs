import {Mesh,add,sub,mul,norm,cross,roundedBox,cylinder,ring,curve,result} from '../primitives.mjs';
export function build({tier='web',seed=7}={}){
 const m=new Mesh(),hero=tier==='hero';
 m.lathe([[0,0],[.105,0],[.117,.009],[.117,.024],[.108,.035],[.026,.035],[.025,.045],[0,.045]],[0,0,0],[0,0,1],64,'ink');
 ring(m,[0,0,.028],[0,0,1],.108,.0018,'metal');
 const joints=[[0,0,.05],[.03,.02,.24],[.25,.08,.46],[.37,.12,.39]];
 for(const s of [-1,1]){const off=[0,s*.011,0];for(let i=0;i<2;i++)cylinder(m,add(joints[i],off),add(joints[i+1],off),.0065,'metal',16);}
 for(const p of joints.slice(0,3)){cylinder(m,add(p,[0,-.026,0]),add(p,[0,.026,0]),.024,'ink',32);cylinder(m,add(p,[0,-.030,0]),add(p,[0,-.027,0]),.009,'brass',24);roundedBox(m,add(p,[.003,-.032,0]),[.012,.002,.002],.0005,'rubber');}
 for(const side of [-1,1]){
  const a=add(joints[1],[.025,side*.025,-.018]),b=add(joints[2],[-.035,side*.025,-.026]),axis=norm(sub(b,a)),u=norm(cross(axis,[0,1,0])),v=cross(axis,u),path=[];
  const count=hero?240:128;for(let i=0;i<=count;i++){const t=i/count,angle=t*Math.PI*2*18;path.push(add(add(a,mul(sub(b,a),t)),add(mul(u,Math.cos(angle)*.006),mul(v,Math.sin(angle)*.006))));}m.tube(path,.0012,5,'metal');
 }
 const body=[.38,.12,.33],axis=[0,-1,0];
 m.tube(curve([[.25,.08,.46],[.30,.10,.46],[.37,.12,.39]],32),.008,10,'ink');
 m.tube(curve([[.33,.10,.38],[.33,.10,.30],[.43,.10,.30],[.43,.10,.38]],32),.006,10,'metal');
 m.lathe([[0,0],[.025,0],[.032,.01],[.033,.14],[.036,.155],[.036,.205],[.031,.218],[0,.222]],body,axis,64,'ink');
 const rings=hero?30:16,wires=hero?28:16,segments=hero?64:40;
 for(let i=0;i<rings;i++){const d=.148+i/(rings-1)*.064,r=.0365-Math.max(0,d-.202)*.18;ring(m,add(body,mul(axis,d)),axis,r,.00065,'grille',segments,5);}
 for(let i=0;i<wires;i++){const a=i/wires*Math.PI*2,path=[];for(let j=0;j<=12;j++){const d=.148+j/12*.066,r=.0368-Math.max(0,d-.202)*.18;path.push(add(add(body,mul(axis,d)),[Math.cos(a)*r,0,Math.sin(a)*r]));}m.tube(path,.00065,5,'grille');}
 ring(m,add(body,mul(axis,.143)),axis,.0368,.002,'metal');
 for(const s of [-1,1])cylinder(m,[.38+s*.036,.10,.35],[.38+s*.047,.10,.35],.013,'metal',24);
 roundedBox(m,[.38,.044,.362],[.015,.055,.003],.0015,'rubber');
 m.tube(curve([[.38,.135,.33],[.43,.17,.38],[.24,.12,.43],[.01,.06,.21],[.00,.03,.035],[-.08,-.10,.008]],72),.0028,8,'rubber');
 return result(m,'microphone');
}

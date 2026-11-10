import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {projectRoot} from '../tools/engine.mjs';
import {K,P,box} from './context.mjs';
import {Mesh as DetailMesh,roundedBox} from '../objects/primitives.mjs';
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
export async function buildGraphics(ctx){
 const output=resolve(projectRoot,'../public/native-art');await mkdir(output,{recursive:true});
 async function label(id,lines,{fill='#dce9dd',background='none',size=80}={}){
  const texts=lines.map((line,i)=>`<text x="800" y="${120+i*110}" text-anchor="middle" fill="${fill}" font-family="Arial,sans-serif" font-weight="700" font-size="${size}">${escape(line)}</text>`).join('');
  await writeFile(join(output,`${id}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${lines.length*110+65}" viewBox="0 0 1600 ${lines.length*110+65}"><rect width="100%" height="100%" fill="${background}"/>${texts}</svg>`);return `native-art/${id}.svg`;
 }
 function glassPanel(id,center,size){const m=new DetailMesh();roundedBox(m,center,size,.045,'architectural-glass');const mats=m.toMats();for(const mat of mats)mat.spec={baseColor:'#28553e',roughness:.16,metallic:.08,transmission:.45,ior:1.47,thickness:.075};ctx.nodes(id,[{mats}],[0,0,0],0,{production:'FEED7 rounded forest-green liquid glass'});}
 function rear(id,graphic,x,z,w,h,y=9.99){glassPanel(`wall-content/${id}/frame`,[x,y+.055,z],[w+.14,.075,h+.14]);const art=ctx.mesh(`wall-content/${id}/image`,{graphic,transparent:true});art.panel([x-w/2,y,z-h/2],[x+w/2,y,z-h/2],[x+w/2,y,z+h/2],[x-w/2,y,z+h/2],P.ivory,[0,-1,0]);}
 rear('recording-label',await label('recording-label',['01 / CREATIVE FLOOR'],{size:100}),-9,7.5,6.4,.65);
 rear('digital-label',await label('digital-label',['02 / DIGITAL LAB'],{size:100}),9,7.5,6.4,.65);
 rear('on-air',await label('on-air',['ON AIR'],{fill:'#e7c38f',size:148}),-9,2.55,1.55,.32,8.29);
 glassPanel('wall-content/growth-board/frame',[0,10.02,1.88],[6.15,.12,2.65]);
 const growth=ctx.mesh('screens/growth-wall',{screen:'growth-wall',emission:.25});growth.panel([-2.95,9.91,.64],[2.95,9.91,.64],[2.95,9.91,3.12],[-2.95,9.91,3.12],P.ivory,[0,-1,0]);
 // The supplied agency poster returns to the left wall, in its framed mount.
 glassPanel('wall-content/agency-poster/frame',[-14.0,4.0,2.9],[.09,2.35,3.9]);
 const poster=ctx.mesh('wall-content/agency-poster/image',{graphic:'brand/digital-world.jpg'});poster.panel([-13.93,2.9,1.06],[-13.93,5.1,1.06],[-13.93,5.1,4.74],[-13.93,2.9,4.74],P.ivory,[1,0,0]);
 // Keep the gallery caption clear of duplicate freestanding image displays.
 rear('gallery-caption',await label('gallery-caption',['IDEAS IN MOTION'],{size:105}),-9,0.55,3.0,.45,-5.15);
 // A campaign print on the lounge wall. It is an in-house brand exploration.
 await writeFile(join(output,'campaign.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><rect width="1200" height="1600" fill="#142d22"/><circle cx="1060" cy="200" r="650" fill="none" stroke="#8fb59b" stroke-width="2"/><circle cx="180" cy="1480" r="760" fill="none" stroke="#8fb59b" stroke-width="2"/><g fill="#e4e8d9" font-family="Arial,sans-serif" font-weight="700"><text x="95" y="150" font-size="38" letter-spacing="9">FEED7 / CREATIVE</text><text x="85" y="700" font-size="170">MAKE</text><text x="85" y="890" font-size="170">YOUR</text><text x="85" y="1080" font-size="170" fill="#69b68f">MOVE.</text><text x="95" y="1475" font-size="28" letter-spacing="5">A WORLD BUILT FOR GROWTH.</text></g></svg>');
 glassPanel('wall-content/lounge-art/frame',[14.02,-4.1,2.4],[.09,2.5,3.35]);
 const loungeArt=ctx.mesh('wall-content/lounge-art/image',{graphic:'native-art/campaign.svg'});loungeArt.panel([13.95,-2.95,.81],[13.95,-5.25,.81],[13.95,-5.25,4.0],[13.95,-2.95,4.0],P.ivory,[-1,0,0]);
 // Visible gallery shelves replace the ones hidden behind the acoustic wall.
 const shelves=ctx.mesh('wall-content/library',{scan:'walnut-natural'});
 for(let row=0;row<3;row++){const z=1.0+row*.75;box(shelves,[-13.8,-3.6,z],[.42,5.0,.055],P.wood);let y=-5.9;for(let i=0;i<24;i++){const w=.07+(i*17%8)*.01,h=.24+(i*13%9)*.025;box(shelves,[-13.76,y+w/2,z+h/2+.04],[.24,w-.008,h],[P.fabric,P.leather,P.ivory,P.woodDark][i%4]);y+=w+.025;}}
 const rack=ctx.mesh('technology/equipment-rack');box(rack,[6.1,8.2,1.3],[.95,.75,2.25],P.metal);for(let i=0;i<8;i++){box(rack,[6.1,7.805,.42+i*.25],[.82,.07,.18],P.ink);for(let j=0;j<9;j++)box(rack,[5.8+j*.045,7.763,.42+i*.25],[.025,.006,.055],P.metal);const led=ctx.mesh(`technology/rack-led-${i}`,{emission:1.15,motion:{kind:'glow',amplitude:.12,period:3.8,phase:i*.7}});box(led,[6.4,7.76,.42+i*.25],[.035,.015,.015],P.glow);}
}

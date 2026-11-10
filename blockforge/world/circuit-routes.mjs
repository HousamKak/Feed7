export function chamferRoute(points,distance=.28){
 const out=[points[0]];
 for(let i=1;i<points.length-1;i++){const p=points[i],a=points[i-1],b=points[i+1],al=Math.hypot(p[0]-a[0],p[1]-a[1]),bl=Math.hypot(b[0]-p[0],b[1]-p[1]),d=Math.min(distance,al*.3,bl*.3);out.push([p[0]-(p[0]-a[0])/al*d,p[1]-(p[1]-a[1])/al*d],[p[0]+(b[0]-p[0])/bl*d,p[1]+(b[1]-p[1])/bl*d]);}
 out.push(points.at(-1));return out;
}
export function routeLength(points){let n=0;for(let i=1;i<points.length;i++)n+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);return n;}
export function sampleRoute(points,distance){const length=routeLength(points);let d=(distance%length+length)%length;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=l)return {point:[a[0]+(b[0]-a[0])*d/l,a[1]+(b[1]-a[1])*d/l],direction:[(b[0]-a[0])/l,(b[1]-a[1])/l]};d-=l;}return {point:points.at(-1),direction:[0,1]};}

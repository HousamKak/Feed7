// Display pixels only. The monitor bodies and screen surfaces are native assets.
export function drawStudioScreen(canvas,kind,time=0){
 const c=canvas.getContext('2d');c.setTransform(canvas.width/1024,0,0,canvas.height/576,0,0);c.fillStyle='#0a1712';c.fillRect(0,0,1024,576);
 const text=(s,x,y,size=18,color='#dce7d9',weight=400)=>{c.fillStyle=color;c.font=`${weight} ${size}px Arial`;c.fillText(s,x,y);};
 const line=(a,b,color='#294235',width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();};
 if(kind==='growth-wall'){
  text('FEED7 / CONNECTED GROWTH',44,48,18,'#a6c3ac',600);text('CREATE. BUILD. GROW.',44,124,60,'#ecede2',800);
  for(let i=0;i<6;i++)line([44,190+i*58],[980,190+i*58],'#1c3428');
  const gradient=c.createLinearGradient(0,210,0,540);gradient.addColorStop(0,'#6cb58e55');gradient.addColorStop(1,'#6cb58e00');c.beginPath();for(let i=0;i<=100;i++){const x=44+i*9.36,y=470-i*2.05+Math.sin(i*.09+time*.35)*12;i?c.lineTo(x,y):c.moveTo(x,y);}c.lineTo(980,530);c.lineTo(44,530);c.closePath();c.fillStyle=gradient;c.fill();c.beginPath();for(let i=0;i<=100;i++){const x=44+i*9.36,y=470-i*2.05+Math.sin(i*.09+time*.35)*12;i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle='#76d49b';c.lineWidth=4;c.stroke();text('STRATEGY',50,560,16,'#8da997');text('CREATIVE',400,560,16,'#8da997');text('TECHNOLOGY',800,560,16,'#8da997');return;
 }
 c.fillStyle='#15261c';c.fillRect(0,0,1024,46);text('FEED7 STUDIO',22,30,17,'#dce7d9',700);text(kind==='design'?'Brand canvas':kind==='code'?'World workspace':'Campaign signals',236,30,16,'#96b69f');text('PROJECT / 07',855,30,13,'#96b69f');
 c.fillStyle='#101f17';c.fillRect(0,46,164,530);for(const [i,s]of ['Overview','Studio','Campaigns','Assets','Settings'].entries()){if(i===1){c.fillStyle='#254831';c.fillRect(12,114+i*43,140,34);}text(s,26,136+i*43,15,i===1?'#cee5ca':'#7b9985');}text('IN-HOUSE',25,536,12,'#607b68');
 if(kind==='design'){
  c.fillStyle='#080f0b';c.fillRect(190,76,795,455);const g=c.createLinearGradient(220,80,920,520);g.addColorStop(0,'#1b5d3c');g.addColorStop(1,'#11291d');c.fillStyle=g;c.fillRect(220,95,735,410);
  c.save();c.translate(745,260);c.rotate(time*.04);for(let i=0;i<4;i++){c.strokeStyle=i%2?'#8bbd8c':'#d2dfb1';c.lineWidth=i%2?2:3;c.beginPath();c.ellipse(0,0,130,45+i*15,i*.5,0,Math.PI*2);c.stroke();}c.restore();
  text('YOUR NEXT CHAPTER',255,146,15,'#a9c7a8',600);text('MAKE',250,267,80,'#e3ead9',800);text('WAVES.',250,352,80,'#e3ead9',800);text('A connected digital world.',256,452,20,'#aecbad');text('FRAME 07   /   100%',222,553,12,'#7d9a84');
 }else if(kind==='code'){
  text('studio.world',198,80,17,'#d2dfcf',600);line([188,96],[997,96]);
  const lines=['import { studio } from "feed7";','','world.create({','  identity: "FEED7",','  spaces: [','    creative(),','    recording(),','    technology(),','  ],','  light: warmEvening(),','  motion: smoothConnections(),','});','','studio.build();'];
  for(let i=0;i<lines.length;i++){text(String(i+1).padStart(2,'0'),195,129+i*28,14,'#43614e');text(lines[i],236,129+i*28,19,i===0?'#b4c89f':i%3===0?'#70b98b':'#b6c7bb');}
  c.fillStyle='#79bb8b';c.fillRect(236+(Math.floor(time*.7)%4)*10,494,2,20);text('WORLD READY',788,549,12,'#79bb8b');
 }else{
  text('A signal worth following.',197,103,31,'#dae8d5',700);text('Creative exploration / concept workspace',198,134,14,'#7f9f88');
  for(let i=0;i<3;i++){c.fillStyle='#193022';c.fillRect(197+i*263,163,246,85);text(['DISCOVER','CONNECT','CREATE'][i],214+i*263,190,13,'#92b298',600);for(let j=0;j<5;j++){c.fillStyle=j===i+1?'#bad2ac':'#365b40';c.fillRect(215+i*263+j*34,214,26,7);}}
  for(let i=0;i<5;i++)line([197,295+i*47],[979,295+i*47],'#20372a');c.beginPath();for(let i=0;i<=80;i++){const x=200+i*9.6,y=455-i*1.7+Math.sin(i*.13+time*.3)*16;i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle='#87d49d';c.lineWidth=3;c.stroke();text('A STRATEGY THAT MOVES FORWARD',200,548,12,'#7b9b84');
 }
}

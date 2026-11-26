import React,{useEffect,useRef} from 'react';
import type {Lesson} from './catalog';
type Props={lesson:Lesson;angle:number;zoom:number;playing:boolean;selected:number;onSelect:(i:number)=>void};
// Procedural XYZ meshes, painter projection, no network assets.
export function Scene({lesson,angle,zoom,playing,selected,onSelect}:Props){
 const ref=useRef<HTMLCanvasElement>(null), hits=useRef<{x:number;y:number;i:number}[]>([]),clock=useRef(0);
 useEffect(()=>{const c=ref.current,ctx=c?.getContext('2d');if(!c||!ctx)return;let raf=0,last=performance.now();
 const draw=(now:number)=>{if(playing)clock.current+=Math.min(50,now-last)/1000;last=now;const t=clock.current,w=c.width,h=c.height,a=angle*Math.PI/180;
 const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,['room','stage'].includes(lesson.scene)?'#28334c':'#78b6d5');sky.addColorStop(1,'#f5e4bd');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 type V=[number,number,number];const faces:{p:V[];col:string;d:number}[]=[];
 const project=(v:V):V=>{const [x,y,z]=v,X=x*Math.cos(a)-z*Math.sin(a),Z=x*Math.sin(a)+z*Math.cos(a),d=18+Z;return [w/2+X*1000*zoom/d,h*.62+(Z*.45-y)*1000*zoom/d,Z]};
 const face=(vs:V[],col:string)=>{const p=vs.map(project);faces.push({p,col,d:p.reduce((s,v)=>s+v[2],0)/p.length})};
 const ring=(x:number,y:number,z:number,rx:number,rz:number,n=12):V[]=>Array.from({length:n},(_,i)=>[x+rx*Math.cos(i*2*Math.PI/n),y,z+rz*Math.sin(i*2*Math.PI/n)]);
 const solid=(x:number,y:number,z:number,rx:number,rz:number,ht:number,top:number,col:string,n=12)=>{const b=ring(x,y,z,rx,rz,n),u=ring(x,y+ht,z,rx*top,rz*top,n);for(let i=0;i<n;i++){const j=(i+1)%n;face([b[i],b[j],u[j],u[i]],col); }face(u,col)};
 const ball=(x:number,y:number,z:number,r:number,col:string,sy=1)=>{for(let k=0;k<8;k++){const p=k*Math.PI/8-Math.PI/2,q=(k+1)*Math.PI/8-Math.PI/2;const b=ring(x,y+r*Math.sin(p)*sy,z,r*Math.cos(p),r*Math.cos(p)),u=ring(x,y+r*Math.sin(q)*sy,z,r*Math.cos(q),r*Math.cos(q));for(let i=0;i<12;i++)face([b[i],b[(i+1)%12],u[(i+1)%12],u[i]],col)}};
 const tree=(x:number,z:number,s=1,col='#386b42')=>{solid(x,0,z,.12*s,.12*s,1.5*s,.65,'#76513a');ball(x,1.7*s,z,.65*s,col,1.4);ball(x+.35*s,1.5*s,z,.43*s,'#568451')};
 const person=(x:number,z:number,col:string,s=1)=>{const b=Math.sin(t*2+x)*.035;solid(x-.13*s,0,z,.09*s,.10*s,.58*s,1,'#373c45');solid(x+.13*s,0,z,.09*s,.10*s,.58*s,1,'#373c45');solid(x,.55*s,z,.32*s,.20*s,.68*s,.65,col);ball(x,1.46*s+b,z,.19*s,'#c9936c');ball(x,1.56*s+b,z,.19*s,'#292b2e',.55);solid(x-.36*s,.65*s,z,.08*s,.08*s,.55*s,1,col);solid(x+.36*s,.65*s,z,.08*s,.08*s,.55*s,1,col)};
 const house=(x:number,z:number,s=1,long=false)=>{const l=long?2.5:1.1;solid(x,0,z,l*s,.8*s,1.2*s,1,'#b98a56',4);for(let j=-1;j<=1;j++)solid(x+j*.65*s,0,z-.65*s,.07,.07,1.5*s,1,'#62452f');const y=1.2*s;face([[x-l*s,y,z-.9*s],[x+l*s,y,z-.9*s],[x+l*s,y+.8*s,z],[x-l*s,y+.8*s,z]],'#80503b');face([[x-l*s,y,z+.9*s],[x+l*s,y,z+.9*s],[x+l*s,y+.8*s,z],[x-l*s,y+.8*s,z]],'#aa7046')};
 const hill=(x:number,z:number,r:number,ht:number,col:string)=>{solid(x,0,z,r,r,ht,0,col,9)};
 const boat=(x:number,z:number,s=1)=>{const y=.1+Math.sin(t*1.6)*.07;solid(x,y,z,1.35*s,.48*s,.36*s,1.25,'#795039',10);solid(x,y+.36*s,z,.045,.045,1.6*s,1,'#5c4536');face([[x,y+.5*s,z],[x,y+1.9*s,z],[x+1.1*s,y+.5*s,z]],'#eee0ba')};
 const water=['sea','river'].includes(lesson.scene);face([[-6,-.1,-5],[6,-.1,-5],[6,-.1,5],[-6,-.1,5]],water?'#397e99':'#83965e');
 if(water){for(let j=0;j<38;j++){const x=(j%8-3.5)*1.35,z=Math.floor(j/8)*1.8-4;const y=.02+Math.sin(t+j)*.015;face([[x,y,z],[x+.7,y,z],[x+.9,y,z+.05],[x+.15,y,z+.05]],'#a1d5dc')}}
 const anchors:V[]=[[-3,1,0],[0,1,0],[3,1,0]];
 switch(lesson.id){
 case 1: hill(-3,2,2,1.5,'#6e8c72');hill(3,2,2,2,'#587c70');solid(0,0,0,.65,.65,2.8+selected*.65,1,'#a89a83');person(-1.5,0,'#b48b54',1.7);ball(0,4+selected*.6,0,2.2,'#d8e5eb',.16);break;
 case 2:house(-3,0,1.2);person(0,0,'#4c627d');for(let j=0;j<4;j++)ball(2+j*.35,1+j*.3,0,.35,'#a9c4d2');break;
 case 3:for(let j=0;j<7;j++)solid(-3+j*.35,0,2,.045,.045,2.8,1,'#444952');person(-1,0,'#e5dfca');person(1,0,'#38465a');face([[-.8,.85,-.6],[.8,.85,-.6],[.8,.85,.6],[-.8,.85,.6]],'#fff2d4');ball(2,1.6,0,.25,'#f9b94d');break;
 case 4:house(-3,0,1,true);person(0,0,'#9b392e',1.3);person(.9,.3,'#3b4d69',1.2);for(let j=0;j<4;j++)person(2+j*.55,1,'#8d5140',.8);break;
 case 5:person(-3,0,'#eee0c6',1.5);person(0,0,'#a67b52');for(let j=0;j<4;j++)ball(3, .3+j*.18,0,.23-j*.035,'#ef9d35',1.5);break;
 case 6:boat(-3,0);hill(3,1,1.7,3,'#626f79');hill(3,-2,1.2,2,'#84939b');break;
 case 7:for(let j=0;j<5;j++)hill(j*2-4,2,1.7,2+j%3,'#738d78');ball(0,.6,1,.7,'#39494a');tree(3,-1);break;
 case 8:for(let j=0;j<5;j++)tree(-4+j*2,2,1,'#8da34f');person(-1,-1,'#e5d3b5');person(1,-1,'#567e85');break;
 case 9:house(-3,0);for(let j=0;j<4;j++)tree(j-1,2);tree(3,0,1.5,'#678c3d');break;
 case 11:for(let j=0;j<3;j++)house(-4+j*1.5,2,.65);person(-1,0,'#8d735d');person(0,0,'#b2a18a');person(1,0,'#625b55');solid(3,0,0,.65,.65,.55,1,'#806344');ball(3,.65,0,.25,'#b8a38a',.4);break;
 case 12:house(-3,1);person(0,0,'#77664c');person(3,0,'#a48a69');break;
 case 13:boat(0,0,.7);hill(4,3,2,.7,'#788f79');break;
 case 14:for(let j=0;j<4;j++)hill(-4+j*.9,2,1.5,2-j*.35,'#668c76');house(3,2,.8);tree(2,1);break;
 case 15:house(-3,1,1.4,true);person(0,0,'#ded3b9');person(3,0,'#85576d');break;
 case 16:person(-2,0,'#a85e65');person(0,0,'#76929c');solid(3,0,0,.6,.4,.5,1,'#8c6342');ball(3,.65,0,.18,'#e4bd68');break;
 case 17:boat(-2,0);break;
 case 18:for(let j=0;j<4;j++)hill(j*2-3,3,1.5,2,'#708a6a');person(-2,0,'#4c526d');person(2,0,'#a66d62');break;
 case 19:house(-3,1);for(let j=0;j<3;j++)person(-.6+j*.7,0,'#69584a');tree(3,1);break;
 case 20:person(0,0,'#303743',1.3);solid(-3,0,1,.3,.3,2,1,'#b39c75');solid(3,0,1,.3,.3,2,1,'#b39c75');break;
 case 21:for(let j=0;j<5;j++)hill(j*2-4,2,1.7,2+j%3,'#647d79');for(let j=0;j<3;j++)person(2+j*.6,-1,'#69734e',.75);break;
 case 22:face([[-4,.01,-2],[4,.01,-2],[4,.01,2],[-4,.01,2]],'#a96c50');person(0,0,'#eee5d1');for(let j=0;j<5;j++)person(2+j*.5,2,'#596b81',.7);break;
 case 23:house(-3,1);tree(0,2,1.4,'#bd874a');for(let j=0;j<3;j++)person(2+j*.6,0,'#8b6e65');break;
 case 24:for(let j=0;j<9;j++)tree((j%5-2)*2,Math.floor(j/5)*2+1,1.3);person(0,-1,'#777a58');ball(3,1.4,1,.3,'#826c55');break;
 case 25:ball(-3,1,0,.55,'#a46b3d',1.3);solid(-3,1.5,0,.12,.08,1.3,1,'#704b33');for(let j=0;j<5;j++)ball(j*.6-1,1+Math.sin(t+j)*.4,0,.16,'#c7b7d5');break;
 case 26:house(3,2);hill(-3,2,1.5,1,'#778c86');ball(0,1.8,0,.7,'#d1e0df');break;
 case 27:person(-2,0,'#665b77');solid(0,0,0,.65,.5,.7,1,'#986b43');person(3,0,'#8a735f');break;
 case 28:person(-2,0,'#405a72');person(0,0,'#92705e');person(3,0,'#777b58');break;
 case 30:boat(-3,0,1.2);person(-2.8,0,'#b98b59',.65);break;
 default:for(let j=0;j<3;j++)person(j*2-2,0,['#4c7180','#a16b50','#78885e'][j]);
 }
 faces.sort((a,b)=>b.d-a.d);for(const f of faces){ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=f.col;ctx.fill();ctx.strokeStyle='#24374612';ctx.stroke()}
 hits.current=anchors.map((v,i)=>{const p=project([v[0],v[1]+1.6,v[2]]);ctx.beginPath();ctx.arc(p[0],p[1],18,0,Math.PI*2);ctx.fillStyle=i===selected?'#b96b20':'#075e66';ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 20px Arial';ctx.textAlign='center';ctx.fillText(String(i+1),p[0],p[1]+7);return{x:p[0],y:p[1],i}});if(playing)raf=requestAnimationFrame(draw)};draw(last);return()=>cancelAnimationFrame(raf)},[lesson,angle,zoom,playing,selected]);
 return <canvas ref={ref} width={960} height={540} className="w-full h-auto rounded-xl border" aria-label={'Cảnh minh họa '+lesson.title} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)*960/r.width,y=(e.clientY-r.top)*540/r.height;const hit=hits.current.find(p=>Math.hypot(p.x-x,p.y-y)<28);if(hit)onSelect(hit.i)}}/>;
}

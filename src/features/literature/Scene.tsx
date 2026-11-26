import React,{useEffect,useRef,useState} from 'react';
import {renderer} from './GL';
import type {Lesson} from './catalog';
type Props={lesson:Lesson;angle:number;zoom:number;playing:boolean;selected:number;onSelect:(i:number)=>void};
// Procedural XYZ meshes, painter projection, no network assets.
export function Scene({lesson,angle,zoom,playing,selected,onSelect}:Props){
 const surface=useRef<HTMLCanvasElement>(null), engine=useRef<ReturnType<typeof renderer>>(null), [failed,F]=useState(false);
 useEffect(()=>{try{engine.current=surface.current?renderer(surface.current):null;F(!engine.current)}catch{F(true)}return()=>{engine.current?.dispose();engine.current=null}},[]);
 const ref=useRef<HTMLCanvasElement>(null), hits=useRef<{x:number;y:number;i:number}[]>([]),clock=useRef(0);
 useEffect(()=>{const c=ref.current,ctx=c?.getContext('2d');if(!c||!ctx)return;let raf=0,last=performance.now();
 const draw=(now:number)=>{if(playing)clock.current+=Math.min(50,now-last)/1000;last=now;const t=clock.current,w=c.width,h=c.height,a=angle*Math.PI/180;
 const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,['room','stage'].includes(lesson.scene)?'#28334c':'#78b6d5');sky.addColorStop(1,'#f5e4bd');ctx.clearRect(0,0,w,h);
 type V=[number,number,number];const faces:{p:V[];col:string;d:number}[]=[];
 const project=(v:V):V=>{const [x,y,z]=v,X=x*Math.cos(a)-z*Math.sin(a),Z=x*Math.sin(a)+z*Math.cos(a),d=18+Z*.91-(y-1.3)*.41;return [w/2+X*h*1.25*zoom/d,h/2-((y-1.3)*.91+Z*.41)*h*1.25*zoom/d,Z]};
 const face=(vs:V[],col:string)=>{const p=vs.map(project);faces.push({p:vs,col,d:p.reduce((s,v)=>s+v[2],0)/p.length})};
 const ring=(x:number,y:number,z:number,rx:number,rz:number,n=12):V[]=>Array.from({length:n},(_,i)=>[x+rx*Math.cos(i*2*Math.PI/n),y,z+rz*Math.sin(i*2*Math.PI/n)]);
 const solid=(x:number,y:number,z:number,rx:number,rz:number,ht:number,top:number,col:string,n=12)=>{const b=ring(x,y,z,rx,rz,n),u=ring(x,y+ht,z,rx*top,rz*top,n);for(let i=0;i<n;i++){const j=(i+1)%n;face([b[i],b[j],u[j],u[i]],col); }face(u,col)};
 const ball=(x:number,y:number,z:number,r:number,col:string,sy=1)=>{for(let k=0;k<8;k++){const p=k*Math.PI/8-Math.PI/2,q=(k+1)*Math.PI/8-Math.PI/2;const b=ring(x,y+r*Math.sin(p)*sy,z,r*Math.cos(p),r*Math.cos(p)),u=ring(x,y+r*Math.sin(q)*sy,z,r*Math.cos(q),r*Math.cos(q));for(let i=0;i<12;i++)face([b[i],b[(i+1)%12],u[(i+1)%12],u[i]],col)}};
 const tree=(x:number,z:number,s=1,col='#386b42')=>{solid(x,0,z,.12*s,.12*s,1.5*s,.65,'#76513a');ball(x,1.7*s,z,.65*s,col,1.4);ball(x+.35*s,1.5*s,z,.43*s,'#568451')};
 const ellipsoid=(x:number,y:number,z:number,rx:number,ry:number,rz:number,col:string)=>{for(let k=0;k<16;k++){const a=k*Math.PI/16-Math.PI/2,b=(k+1)*Math.PI/16-Math.PI/2;const r=ring(x,y+ry*Math.sin(a),z,rx*Math.cos(a),rz*Math.cos(a),24),u=ring(x,y+ry*Math.sin(b),z,rx*Math.cos(b),rz*Math.cos(b),24);for(let i=0;i<24;i++)face([r[i],r[(i+1)%24],u[(i+1)%24],u[i]],col)}};
 const limb=(a:V,b:V,r:number,col:string)=>{const d=b.map((v,i)=>v-a[i]) as V,L=Math.hypot(...d)||1;const u:V=[d[1]/L,-d[0]/L,0];const ul=Math.hypot(...u)||1;const U=u.map(v=>v/ul) as V;const W:V=[d[1]*U[2]-d[2]*U[1],d[2]*U[0]-d[0]*U[2],d[0]*U[1]-d[1]*U[0]];const rings=[a,b].map((p,k)=>Array.from({length:16},(_,i)=>p.map((v,j)=>v+r*(k?.75:1)*(U[j]*Math.cos(i*Math.PI/8)+W[j]/L*Math.sin(i*Math.PI/8))) as V));for(let i=0;i<16;i++)face([rings[0][i],rings[0][(i+1)%16],rings[1][(i+1)%16],rings[1][i]],col)};
 const person=(x:number,z:number,col:string,s=1)=>{const skin='#b98460',b=Math.sin(t*2+x)*.025;const P=(a:number,y:number,c:number):V=>[x+a*s,y*s,z+c*s];const E=(a:number,y:number,c:number,rx:number,ry:number,rz:number,color:string)=>ellipsoid(...P(a,y,c),rx*s,ry*s,rz*s,color);const L=(a:V,b:V,r:number,c:string)=>limb(P(...a),P(...b),r*s,c);for(const side of [-1,1]){L([side*.13,.85,0],[side*.16,.43,.025],.105,'#403b36');L([side*.16,.43,.025],[side*.17,.10,0],.075,'#403b36');E(side*.17,.075,-.07,.095,.075,.17,'#332b25');}E(0,.88,0,.25,.23,.15,col);E(0,1.19,0,.30,.34,.17,col);for(let j=0;j<7;j++){const xx=(j-3)*.055;face([P(xx,.75,-.13),P(xx+.025,.75,-.14),P(xx+.04,1.35,-.17),P(xx+.015,1.35,-.16)],col)}E(0,1.49,0,.09,.13,.09,skin);E(0,1.68+b,0,.155,.205,.145,skin);E(0,1.79+b,.035,.16,.12,.145,'#302820');E(0,1.65+b,-.137,.035,.055,.045,skin);for(const side of [-1,1]){E(side*.065,1.71+b,-.128,.025,.012,.012,'#342923');E(side*.15,1.66+b,0,.025,.05,.035,skin);const lift=lesson.id===5&&x<0&&side===1?.65:lesson.id===3?.24:0;L([side*.24,1.36,0],[side*.38,1.06+lift,-.04],.085,col);L([side*.38,1.06+lift,-.04],[side*.35,.86+lift,-.24],.06,skin);E(side*.35,.86+lift,-.24,.055,.08,.055,skin)}};
 const house=(x:number,z:number,s=1,long=false)=>{const l=long?2.5:1.1;solid(x,0,z,l*s,.8*s,1.2*s,1,'#b98a56',4);for(let j=-1;j<=1;j++)solid(x+j*.65*s,0,z-.65*s,.07,.07,1.5*s,1,'#62452f');const y=1.2*s;face([[x-l*s,y,z-.9*s],[x+l*s,y,z-.9*s],[x+l*s,y+.8*s,z],[x-l*s,y+.8*s,z]],'#80503b');face([[x-l*s,y,z+.9*s],[x+l*s,y,z+.9*s],[x+l*s,y+.8*s,z],[x-l*s,y+.8*s,z]],'#aa7046')};
 const hill=(x:number,z:number,r:number,ht:number,col:string)=>{solid(x,0,z,r,r,ht,0,col,9)};
 const boat=(x:number,z:number,s=1)=>{const y=.1+Math.sin(t*1.6)*.07;solid(x,y,z,1.35*s,.48*s,.36*s,1.25,'#795039',10);solid(x,y+.36*s,z,.045,.045,1.6*s,1,'#5c4536');face([[x,y+.5*s,z],[x,y+1.9*s,z],[x+1.1*s,y+.5*s,z]],'#eee0ba')};
 const water=['sea','river'].includes(lesson.scene);face([[-6,-.1,-5],[6,-.1,-5],[6,-.1,5],[-6,-.1,5]],water?'#397e99':['room','stage'].includes(lesson.scene)?'#51473e':'#83965e');
 if(water){for(let j=0;j<38;j++){const x=(j%8-3.5)*1.35,z=Math.floor(j/8)*1.8-4;const y=.02+Math.sin(t+j)*.015;face([[x,y,z],[x+.7,y,z],[x+.9,y,z+.05],[x+.15,y,z+.05]],'#a1d5dc')}}
 const anchors:V[]=[[-3,1,0],[0,1,0],[3,1,0]];
 switch(lesson.id){
 case 1: hill(-3,2,2,1.5,'#6e8c72');hill(3,2,2,2,'#587c70');solid(0,0,0,.65,.65,2.8+selected*.65,1,'#a89a83');person(-1.5,0,'#b48b54',1.7);ball(0,4+selected*.6,0,2.2,'#d8e5eb',.16);break;
 case 2:house(-3,0,1.2);person(0,0,'#4c627d');for(let j=0;j<4;j++)ball(2+j*.35,1+j*.3,0,.35,'#a9c4d2');break;
 case 3:{
 const wall=(x:number,z:number,w:number,h:number)=>{face([[x,0,z],[x+w,0,z],[x+w,h,z],[x,h,z]],'#514b43');for(let k=0;k<6;k++)for(let j=0;j<9;j++){const xx=x+j*w/9+(k%2)*.12,yy=k*h/6;face([[xx,yy,z-.02],[Math.min(x+w,xx+w/9-.035),yy,z-.02],[Math.min(x+w,xx+w/9-.035),yy+h/6-.035,z-.02],[xx,yy+h/6-.035,z-.02]],(j+k)%3?'#665c50':'#777064')}};
 wall(-5,3,10,4);face([[-5,0,-2],[-5,0,3],[-5,4,3],[-5,4,-2]],'#514b43');
 for(let j=0;j<8;j++)solid(2+j*.38,0,2.8,.065,.065,3.3,1,'#34383a');
 person(-1.5,0,'#e5dfca',1.15);person(.9,.3,'#374d58');person(2.3,.5,'#76624c');
 solid(-.2,0,-.4,1.25,.65,.78,1,'#755137',4);face([[-1.25,.81,-1],[.85,.81,-1],[.85,.81,.25],[-1.25,.81,.25]],'#fff1ce');
 for(let j=0;j<4;j++)face([[-.9+j*.43,.82,-.8],[-.75+j*.43,.82,-.8],[-.75+j*.43,.82,-.1],[-.9+j*.43,.82,-.1]],'#514333');
 solid(-1.5,1.12,0,.48,.15,.12,1,'#795333',4);solid(2.2,.9,.15,.24,.24,.12,1,'#383333');solid(-3,0,1,.09,.09,2.4,1,'#755137');ball(-3,2.5+Math.sin(t*5)*.07,1,.22,'#ffb74c',1.8);ball(-3,2.55,1,.12,'#fff0a0',1.8);
 anchors[0]=[-4,1.5,2];anchors[1]=[-.2,.1,-.4];anchors[2]=[-3,1.2,1];break;}
 case 4:house(-3,0,1,true);person(0,0,'#9b392e',1.3);person(.9,.3,'#3b4d69',1.2);for(let j=0;j<4;j++)person(2+j*.55,1,'#8d5140',.8);break;
 case 5:for(let j=0;j<9;j++)hill(j*1.4-5.6,3,1.8,1.5+Math.sin(j*2)*.7,'#687b79');person(-1.7,0,'#eee0c6',1.65);person(1,0,'#a67b52',1.1);person(2.3,1,'#86705a',.95);for(let j=0;j<12;j++){const f=j/12;ellipsoid(-1.1+Math.sin(t*6+j)*.09,2.65+f*.6,-.4,.17*(1-f)+.025,.22,.13*(1-f)+.02,j%2?'#ffb43c':'#ffe4a0')}break;
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
 default:for(let j=0;j<3;j++){solid(j*2-2,0,0,.7,.5,.18,1,'#76583d',4);face([[j*2-2.6,.2,-.4],[j*2-1.4,.2,-.4],[j*2-1.4,.2,.4],[j*2-2.6,.2,.4]],'#f1e4c6');}
 }
 engine.current?.draw(faces,a,zoom,['room','stage'].includes(lesson.scene));
 hits.current=anchors.map((v,i)=>{const p=project([v[0],v[1]+1.6,v[2]]);ctx.beginPath();ctx.arc(p[0],p[1],18,0,Math.PI*2);ctx.fillStyle=i===selected?'#b96b20':'#075e66';ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 20px Arial';ctx.textAlign='center';ctx.fillText(String(i+1),p[0],p[1]+7);return{x:p[0],y:p[1],i}});if(playing)raf=requestAnimationFrame(draw)};draw(last);return()=>cancelAnimationFrame(raf)},[lesson,angle,zoom,playing,selected]);
 return <div className="relative w-full aspect-video rounded-xl overflow-hidden border bg-slate-200"><canvas ref={surface} width={960} height={540} className="absolute inset-0 w-full h-full"/>{failed&&<p className="absolute inset-0 p-6 bg-white">Thiết bị không hỗ trợ WebGL. Hãy chuyển sang chế độ 2D.</p>}<canvas ref={ref} width={960} height={540} className="absolute inset-0 w-full h-full" aria-label={'Cảnh minh họa '+lesson.title} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)*960/r.width,y=(e.clientY-r.top)*540/r.height;const hit=hits.current.find(p=>Math.hypot(p.x-x,p.y-y)<28);if(hit)onSelect(hit.i)}}/></div>;
}

'use strict';
/* ===== Açık dünya arayüzü: HUD, mini harita, tam harita, mob isim etiketleri ===== */
const OWL=[];
function owUI(on){
 const h=$('owhud');if(!h)return;
 h.classList.toggle('off',!on);
 document.body.classList.toggle('mow',on);
 if(!on){if(typeof owNpcOff==='function')owNpcOff();{const c=document.getElementById('clsm');if(c)c.classList.remove('open')} /* açık dünyadan çıkınca sınıf seçim penceresi lobide açık kalmasın */$('ab').classList.add('off');$('bigmap').classList.add('off');OW.map=false;OWL.forEach(l=>{l.e.style.display='none';l.v=0})}
 else if(!OWL.length)owLabInit();
 const sm=$('ab').querySelector('small');if(sm)sm.textContent=touch?'kapatmak için OTO düğmesine bas ya da joystick kullan':'kapatmak için F (ya da bir hareket tuşu)';
 hudS='';
}
function owLabInit(){
 const c=$('owl');
 for(let i=0;i<16;i++){
  const e=document.createElement('div');e.className='mlb';e.innerHTML='<span></span><i><u></u></i>';e.style.display='none';c.appendChild(e);
  OWL.push({e,s:e.firstChild,u:e.querySelector('u'),t:''});
 }
}
function lvCol(L){
 const d=L-SV.ow.lvl;
 return d<=-6?'#9aa7b3':d<=-2?'#4dff6a':d<=2?'#ffe14d':d<=5?'#ff9a2a':'#ff3b3b';
}
const _pv=V3(),_cd=V3();
function owLabels(){
 cam.getWorldDirection(_cd);
 const c=[];
 for(const m of OW.act){
  if(m.state==='dead'||!m.g)continue;
  const dx=m.x-p.x,dz=m.z-p.z,d=Math.hypot(dx,dz);
  if(d>(m.state==='idle'?42:60))continue;
  if((dx*_cd.x+dz*_cd.z)/(d||1)<.15)continue;
  c.push([d,m]);
 }
 c.sort((a,b)=>a[0]-b[0]);
 for(let i=0;i<OWL.length;i++){
  const l=OWL[i];
  /* performans: DOM'a yalnızca değişen değer yazılır; konum left/top yerine transform ile (sayfa yeniden düzenlenmez) */
  if(i>=c.length){if(l.v){l.v=0;l.e.style.display='none'}continue}
  const m=c[i][1];
  _pv.set(m.x,owH(m.x,m.z)+1.95*m.sc+.35,m.z).project(cam);
  if(_pv.z>1){if(l.v){l.v=0;l.e.style.display='none'}continue}
  if(!l.v){l.v=1;l.e.style.display='block';l.e.style.left='0';l.e.style.top='0'}
  const px=Math.round((_pv.x*.5+.5)*innerWidth),py=Math.round((-_pv.y*.5+.5)*innerHeight);
  if(px!==l.px||py!==l.py){l.px=px;l.py=py;l.e.style.transform='translate('+px+'px,'+py+'px) translate(-50%,-100%)'}
  const tx='Lv '+m.L+' '+m.name;
  if(tx!==l.t){l.t=tx;l.s.textContent=tx}
  const lc=lvCol(m.L);if(lc!==l.c){l.c=lc;l.s.style.color=lc}
  const ag=m.state==='aggro';if(ag!==l.ag){l.ag=ag;l.e.classList.toggle('ag',ag)}
  const f=Math.round(clamp(m.hp/m.max,0,1)*100);
  if(f!==l.f){l.f=f;l.u.style.width=f+'%';l.u.style.background=f>50?'#4dff6a':f>25?'#ffcf3a':'#ff4a4a'}
 }
}

let hudS='',vT=0;
function owHud(){
 const o=SV.ow,need=owXpNeed(o.lvl),s=o.lvl+'|'+o.xp+'|'+o.med;
 if(s===hudS)return;hudS=s;
 $('owlv').textContent='Lv '+o.lvl;
 $('owxp').style.width=Math.min(100,o.xp/need*100)+'%';
 $('owxt').textContent=o.lvl>=60?'MAKS':fmt(o.xp)+' / '+fmt(need)+' XP';
 $('owmed').textContent='✚ '+o.med+' (H)';
}
function owMini(){
 const cv=$('mm'),c=cv.getContext('2d'),W=cv.width,R=120,k=OW.bmap.width/(OWH*2),sc=W/(R*2);
 c.clearRect(0,0,W,W);
 c.save();c.beginPath();c.arc(W/2,W/2,W/2-1,0,6.2832);c.clip();
 c.fillStyle='#0b1118';c.fillRect(0,0,W,W);
 c.drawImage(OW.bmap,(p.x+OWH-R)*k,(p.z+OWH-R)*k,R*2*k,R*2*k,0,0,W,W);
 for(const cm of OW.camps){
  const x=(cm.x-p.x)*sc+W/2,y=(cm.z-p.z)*sc+W/2;
  if(x<-6||y<-6||x>W+6||y>W+6)continue;
  let al=0;for(const m of cm.mem)if(m.state!=='dead')al++;
  if(!al)continue;
  c.fillStyle=cm.boss?'#b040ff':lvCol(cm.L);c.strokeStyle='#000a';c.lineWidth=1.5;
  c.beginPath();c.arc(x,y,cm.boss?4.5:cm.wild?2.2:3.5,0,6.2832);c.fill();c.stroke();
 }
 for(const m of OW.act){
  if(m.state!=='aggro')continue;
  c.fillStyle='#ff2a2a';c.beginPath();c.arc((m.x-p.x)*sc+W/2,(m.z-p.z)*sc+W/2,2,0,6.2832);c.fill();
 }
 const vx=(0-p.x)*sc+W/2,vy=(0-p.z)*sc+W/2;
 c.fillStyle='#fff';c.fillRect(vx-3,vy-3,6,6);
 c.translate(W/2,W/2);c.rotate(Math.atan2(-Math.cos(p.yaw),-Math.sin(p.yaw)));
 c.fillStyle='#27e0ff';c.strokeStyle='#000';c.lineWidth=1.5;
 c.beginPath();c.moveTo(7,0);c.lineTo(-5,-5);c.lineTo(-2,0);c.lineTo(-5,5);c.closePath();c.fill();c.stroke();
 c.restore();
 c.strokeStyle='#27e0ffaa';c.lineWidth=2;c.beginPath();c.arc(W/2,W/2,W/2-1,0,6.2832);c.stroke();
}
function owBig(){
 const cv=$('bm2'),c=cv.getContext('2d'),W=cv.width,sc=W/(OWH*2);
 c.clearRect(0,0,W,W);
 c.drawImage(OW.bmap,0,0,W,W);
 c.strokeStyle='#000a';c.lineWidth=2;c.strokeRect(1,1,W-2,W-2);
 c.font='700 13px system-ui';c.textAlign='center';c.textBaseline='middle';
 const lab=[['Yeşil Vadi',-70,-80],['Kızıl Çöl',320,0],['Buz Ovası',0,-330],['Kasvetli Bataklık',-320,0],['Kül Diyarı',0,330]];
 c.fillStyle='#fff';c.shadowColor='#000';c.shadowBlur=4;
 for(const l of lab)c.fillText(l[0],(l[1]+OWH)*sc,(l[2]+OWH)*sc);
 c.shadowBlur=0;
 for(const cm of OW.camps){
  if(cm.wild)continue; /* yaban zombi sürüleri büyük haritayı doldurmasın, yalnız mini haritada */
  let al=0;for(const m of cm.mem)if(m.state!=='dead')al++;
  if(!al)continue;
  const x=(cm.x+OWH)*sc,y=(cm.z+OWH)*sc;
  c.fillStyle=cm.boss?'#b040ff':lvCol(cm.L);c.strokeStyle='#000c';c.lineWidth=2;
  c.beginPath();c.arc(x,y,8,0,6.2832);c.fill();c.stroke();
  c.fillStyle='#000';c.font='700 9px system-ui';c.fillText(cm.L,x,y+.5);
 }
 c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=2;
 c.beginPath();c.rect(W/2-5,W/2-5,10,10);c.fill();c.stroke();
 c.save();c.translate((p.x+OWH)*sc,(p.z+OWH)*sc);c.rotate(Math.atan2(-Math.cos(p.yaw),-Math.sin(p.yaw)));
 c.fillStyle='#27e0ff';c.lineWidth=2;
 c.beginPath();c.moveTo(11,0);c.lineTo(-8,-8);c.lineTo(-3,0);c.lineTo(-8,8);c.closePath();c.fill();c.stroke();
 c.restore();
}
function toggleMap(v){
 OW.map=v===undefined?!OW.map:!!v;
 $('bigmap').classList.toggle('off',!OW.map);
 if(OW.map)owBig();
}
function owVisual(dt){
 owLabels();
 vT-=dt;if(vT>0)return;vT=.1;
 owHud();owMini();if(OW.map)owBig();
}

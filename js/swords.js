'use strict';
/* ===== Açık dünya kılıçları: 10 farklı model, istatistik, yükseltme verisi ===== */
const SWD=[
 {id:'s0',n:'Demir Kılıç',r:1,p:0,up:40,dmg:80,rate:.6,range:3.4,ang:.8,hitT:.45,pose:'sword',gl:null,d:'Her maceranın başlangıcı. Dengeli, güvenilir bir kılıç.'},
 {id:'s1',n:'Ay Palası',r:1,p:300,up:60,dmg:92,rate:.55,range:3.5,ang:.85,hitT:.45,pose:'sword',gl:null,d:'Eğri bıçağı geniş bir yay çizer. Kalabalıkta rahat vurur.'},
 {id:'s2',n:'Sakura Katana',r:2,p:900,up:90,dmg:105,rate:.5,range:3.7,ang:.75,hitT:.42,pose:'sword',gl:null,d:'İnce, uzun ve hızlı. Bir nefeste iki kesik.'},
 {id:'s3',n:'Kırlangıç Meci',r:2,p:1100,up:110,dmg:78,rate:.34,range:4.0,ang:.45,hitT:.4,pose:'sword',gl:null,d:'Çok hızlı saplama. Dar ama uzun menzilli.'},
 {id:'s4',n:'Çelik Claymore',r:3,p:1800,up:150,dmg:165,rate:1,range:4.2,ang:1.05,hitT:.5,pose:'gsword',gl:null,d:'İki elle taşınan ağır kılıç. Yavaş, ama ezer geçer.'},
 {id:'s5',n:'Yılan Dişi',r:3,p:1500,up:130,dmg:100,rate:.48,range:3.5,ang:.8,hitT:.43,pose:'sword',gl:0x6dff4a,d:'Zehir yeşili bıçak. Hızlı ve acımasız.'},
 {id:'s6',n:'Don Keskisi',r:4,p:3000,up:200,dmg:128,rate:.5,range:3.8,ang:.8,hitT:.42,pose:'sword',gl:0x7fe9ff,d:'Buz tutmuş bıçak, soğuk bir parıltı bırakır.'},
 {id:'s7',n:'Magma Yaran',r:4,p:4200,up:250,dmg:190,rate:.95,range:4.3,ang:1.1,hitT:.5,pose:'gsword',gl:0xff6a1a,d:'Lav damarlı dev kılıç. Her darbe kor saçar.'},
 {id:'s8',n:'Gece Yarısı',r:5,p:7000,up:350,dmg:150,rate:.42,range:3.9,ang:.8,hitT:.4,pose:'sword',gl:0xa060ff,d:'Gölgeden dökülmüş katana. Sessiz, çok hızlı.'},
 {id:'s9',n:'Ejderha Bıçağı',r:5,p:12000,up:500,dmg:210,rate:.5,range:4.0,ang:.85,hitT:.42,pose:'sword',gl:0xffd24a,d:'Altın bıçak, içinde şimşek dolaşır. Efsanelerin kılıcı.'}
];
const SWID={};SWD.forEach(s=>SWID[s.id]=s);
const SW_MAXLV=10;
const swLv=id=>(SV.ow.su&&SV.ow.su[id])||0;
const swMul=id=>1+.1*swLv(id);
const SW_R=[null,{n:'Sıradışı',c:'#9aa0ad',g:['#6b6f7d','#9da1ad']},{n:'Gelişmiş',c:'#6fbf8e',g:['#4a7d68','#86bfa4']},{n:'Nadir',c:'#5b9be0',g:['#41679a','#7fb1ea']},{n:'Destansı',c:'#b07bff',g:['#7352a8','#b99ae6']},{n:'Efsanevi',c:'#ffb73a',g:['#a3702a','#e2ad56']}];

/* WP kayıtları: pozlar eski bıçak/kılıç/iki el sistemini kullanır */
SWD.forEach(s=>{
 const two=s.pose==='gsword';
 WP[s.id]={n:s.n,hold:s.id,melee:1,sw:1,rate:s.rate,dmg:s.dmg,range:Math.max(4,s.range+.3),ang:s.ang,hitT:s.hitT,pose:s.pose,glow:s.gl,
  gR:two?[0,0,.08]:[0,0,0],gL:two?[0,0,-.1]:null,mz:[0,0,two?1.5:.95],st:[40,100,0,60,0],ic:'🗡️',d:s.d};
 if(!two)delete WP[s.id].gL;
});

/* Kılıç modelleri: bıçak +z yönünde, el orijinde */
function swParts(k){
 const P=(w,h,d,x,y,z,c)=>({w,h,d,x,y,z,c}),D=0x1d2228;
 switch(k){
 case 's0':return[P(.018,.05,.78,0,0,.55,STEEL),P(.006,.052,.6,0,0,.5,STEEL2),P(.2,.025,.035,0,0,.15,0x8a6a2a),P(.03,.03,.16,0,0,.05,D),P(.045,.045,.045,0,0,-.04,0x8a6a2a)];
 case 's1':{
  const a=[P(.03,.03,.16,0,0,.04,0x3a2a1a),P(.2,.026,.04,0,0,.14,0xd9ac4d),P(.045,.045,.045,0,0,-.05,0xd9ac4d)];
  for(let i=0;i<6;i++){const t=i/5;a.push(P(.017,.05+.03*Math.sin(t*2.4),.15,Math.pow(t,2)*.1,0,.2+i*.14,i<5?STEEL:STEEL2))}
  a.push(P(.006,.02,.7,.015,.02,.55,STEEL2));return a}
 case 's2':{
  const a=[P(.028,.028,.3,0,0,.02,0x1b1f2a),P(.09,.09,.02,0,0,.18,0xd9ac4d),P(.03,.03,.3,0,0,.02,0x1b1f2a),P(.022,.052,.98,0,0,.7,STEEL),P(.006,.054,.8,0,0,.66,STEEL2),P(.016,.02,.06,0,.036,1.19,STEEL)];
  for(let i=0;i<5;i++)a.push(P(.032,.03,.03,0,0,-.08+i*.06,i%2?0xc03a5a:0x1b1f2a));
  return a}
 case 's3':return[P(.012,.026,1.05,0,0,.72,STEEL),P(.004,.028,.9,0,0,.7,STEEL2),
  P(.14,.02,.02,0,0,.18,0xd9ac4d),P(.02,.14,.02,0,0,.18,0xd9ac4d),P(.1,.1,.02,0,0,.2,0xd9ac4d),P(.03,.03,.18,0,0,.06,0x2a1a1a),P(.04,.04,.04,0,0,-.05,0xd9ac4d)];
 case 's4':return[P(.034,.11,1.35,0,0,.88,STEEL),P(.012,.112,1.1,0,0,.84,STEEL2),
  P(.4,.035,.05,0,0,.2,0x6a6f78),P(.05,.09,.05,-.2,0,.2,0x6a6f78),P(.05,.09,.05,.2,0,.2,0x6a6f78),P(.034,.034,.38,0,0,-.02,D),P(.07,.07,.07,0,0,-.22,0x6a6f78)];
 case 's5':{
  const a=[P(.02,.055,.82,0,0,.58,0x3fa34d),P(.006,.058,.7,0,0,.54,0xa6ff6a),P(.03,.03,.16,0,0,.05,0x1a2a1a),P(.045,.045,.045,0,0,-.04,0x3fa34d),
   P(.2,.025,.035,0,0,.15,0x3a4a2a),P(.02,.07,.03,-.1,.04,.16,0xe8f0d0),P(.02,.07,.03,.1,.04,.16,0xe8f0d0)];
  for(let i=0;i<4;i++){a.push(P(.02,.02,.05,0,.036,.35+i*.15,0x3fa34d))}
  return a}
 case 's6':{
  const a=[P(.022,.052,.96,0,0,.7,0xaee8ff),P(.006,.054,.8,0,0,.66,0xf2fcff),P(.03,.03,.3,0,0,.02,0x203a50),P(.09,.09,.02,0,0,.18,0xe8f8ff),P(.12,.02,.02,0,0,.18,0xe8f8ff),P(.02,.12,.02,0,0,.18,0xe8f8ff)];
  for(let i=0;i<3;i++)a.push(P(.016,.03,.05,0,.04,.45+i*.2,0xdff6ff));
  return a}
 case 's7':{
  const a=[P(.04,.12,1.3,0,0,.86,0x2a2224),P(.012,.122,1.1,0,0,.84,0xff6a1a),P(.4,.04,.06,0,0,.2,0x3a2a2a),P(.034,.034,.38,0,0,-.02,0x1a1214),P(.07,.07,.07,0,0,-.22,0xff6a1a),P(.05,.05,.08,-.2,.04,.2,0x6a2a1a),P(.05,.05,.08,.2,.04,.2,0x6a2a1a)];
  for(let i=0;i<6;i++){a.push(P(.04,.04,.06,0,.075,.4+i*.17,0x3a2a2a));a.push(P(.04,.04,.06,0,-.075,.45+i*.17,0x3a2a2a))}
  return a}
 case 's8':return[P(.02,.05,.98,0,0,.7,0x16161e),P(.006,.054,.9,0,0,.68,0xa060ff),P(.03,.03,.3,0,0,.02,0x120e1c),P(.1,.1,.02,0,0,.18,0x2a1a44),P(.06,.04,.02,0,0,.2,0xa060ff),P(.016,.02,.06,0,.036,1.19,0xa060ff),
  P(.03,.03,.3,0,0,.02,0x120e1c)];
 case 's9':{
  const a=[P(.024,.06,.92,0,0,.66,0xf0c040),P(.008,.062,.78,0,0,.62,0x7fe9ff),P(.03,.03,.17,0,0,.05,0x3a1a0a),P(.05,.05,.05,0,0,-.05,0xf0c040),
   P(.3,.03,.04,0,0,.14,0xf0c040),P(.04,.14,.03,-.15,.06,.14,0xf0c040),P(.04,.14,.03,.15,.06,.14,0xf0c040),P(.03,.08,.03,-.2,.1,.14,0xd9a020),P(.03,.08,.03,.2,.1,.14,0xd9a020),P(.04,.04,.06,0,0,.2,0x7fe9ff)];
  for(let i=0;i<3;i++)a.push(P(.014,.03,.04,0,.034,.4+i*.17,0xd9a020));
  return a}
 }
 return[];
}
/* Blade çizgisi: parlama ve iz efektleri için bıçağın ucu ve uzunluğu */
const SWBL={s0:[.2,.95],s1:[.2,.9],s2:[.22,1.2],s3:[.2,1.25],s4:[.22,1.55],s5:[.2,.98],s6:[.22,1.2],s7:[.22,1.5],s8:[.22,1.2],s9:[.2,1.12]};

/* Sahip olunan kılıçların listesi (açık dünya) */
function swOwned(){return SWD.filter(s=>SV.ow.sw.includes(s.id)).map(s=>s.id)}
/* Yükseltme maliyeti: seviye 0..9 → bir sonrakine */
function swUpCost(id,lv){
 const s=SWID[id],n=lv+1;
 return{tl:Math.round(s.up*Math.pow(n,1.45)),ore:2+lv*2,polish:lv>=3?lv-1:0,core:lv>=6?lv-4:0,redcore:lv>=9?1:0};
}
function swSellPrice(id){return Math.round(SWID[id].p*.4)}

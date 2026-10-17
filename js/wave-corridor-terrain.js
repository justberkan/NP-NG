'use strict';
/* Deterministik parkur ve tek aktif dekor grubu: diğer oyun modlarına dokunmaz. */
const WCT={root:null,decor:null,bridges:[],pits:[],key:'',theme:'',fallLimit:-9};
const WC_THEMES=[{name:'Orman',floor:0x425747,wall:0x34483b,sky:0x203c39,accent:0x4d8e55},{name:'Kış',floor:0xabc0cb,wall:0x607e95,sky:0x829eaf,accent:0xcfeefa},{name:'Cehennem',floor:0x423133,wall:0x38282c,sky:0x391d22,accent:0xff6a21}];
function wcThemeAt(round){return WC_THEMES[Math.floor((round-1)/10)%3]}
function wcPitAt(x,z){for(const pit of WCT.pits)if(z>pit.z-5&&z<pit.z+5){if(WCG.game&&(WCG.game.round>pit.round||(WCG.game.round===pit.round&&WCG.game.state!=='spawner')))return null;return pit}return null}
function wcTerrainHeight(x,z){const pit=wcPitAt(x,z);if(!pit)return 0;for(const step of pit.steps)if(Math.abs(x-step.x)<step.w/2+.12&&Math.abs(z-step.z)<step.d/2+.12)return 0;return -30}
function wcTerrainBuild(){
 WCT.root=new THREE.Group();S.add(WCT.root);WCT.pits=[];WCT.bridges=[];WCT.key='';WCT.theme='';WCT.rear=30;WCT.streamKey='';WCT.surface=null;
 for(let round=5;round<=100;round+=5){const z=-WC.gap*round+15;WCT.pits.push({round,z,steps:[{x:-1.1,z:z+2.8,w:2.6,d:2.5},{x:1.1,z,w:2.6,d:2.5},{x:-1.1,z:z-2.8,w:2.6,d:2.5}]})}
 wcTerrainTick();
}
function wcStreamTerrain(){
 const g=WCG.game,front=g.spawnerZ(g.idx)-12;
 // En gerideki yaşayan oyuncu ve onun son güvenli noktası tutulur.
 let rear=g.spawnerZ(g.idx)+90;
 for(const q of wcPlayers())if(q.alive){rear=Math.max(rear,q.position.z+45);const safe=q.id===WCG.id?p.safe:WCG.peers.get(q.id)?.safe;if(safe)rear=Math.max(rear,safe.z+15)}
 // Oda sahibi karar verir; konuklar aynı sınırı snapshot'tan alır.
 if(WCG.owner)WCT.rear=Math.min(WCT.rear,Math.min(30,Math.ceil(rear/30)*30));
 const key=front+':'+WCT.rear+':'+g.round+':'+g.state;if(key===WCT.streamKey)return;WCT.streamKey=key;
 if(WCT.surface){WCT.root.remove(WCT.surface);WCT.surface.geometry.dispose();WCT.surface.material.dispose()}
 const parts=[],add=(w,h,d,x,y,z,c)=>{if(d>0)parts.push({w,h,d,x,y,z,c})};let edge=WCT.rear;
 for(const pit of WCT.pits){if(pit.z+5<=front||pit.z-5>=WCT.rear)continue;const open=g.round<pit.round||(g.round===pit.round&&g.state==='spawner');if(!open)continue;
 const high=Math.min(edge,pit.z+5),low=Math.max(front,pit.z-5);add(36,.5,edge-high,0,-.25,(edge+high)/2,0x78848a);edge=low;
 for(const q of pit.steps)if(q.z+q.d/2>front&&q.z-q.d/2<WCT.rear)add(q.w,1.3,q.d,q.x,-.65,q.z,0xb6a078);
 }
 add(36,.5,edge-front,0,-.25,(edge+front)/2,0x78848a);if(WCT.rear<30)add(g.half*2,10,.5,0,5,WCT.rear,0x303e45);WCT.surface=mergeBoxes(parts);WCT.floor=WCT.surface;WCT.floor.material.color.setHex(wcThemeAt(g.round).floor);WCT.root.add(WCT.surface);
 const length=WCT.rear-front;for(const wall of [g.wallL,g.wallR]){wall.scale.z=length/(WC.totalRounds*WC.gap+100);wall.position.z=(front+WCT.rear)/2}
 // Aynı geometriyi paylaşan kafesler silinmez; yalnız aktif kafes sahne ağacında kalır.
 for(let i=0;i<g.spawners.length;i++){const m=g.spawners[i];if(i===g.idx&&g.state==='spawner'){if(!m.parent)S.add(m)}else S.remove(m)}
 for(const pick of WCG.pickups)if(pick.z>WCT.rear)pick.t=0;
 WCT.stats={front,rear:WCT.rear,length,vertices:WCT.surface.geometry.attributes.position.count,spawners:g.spawners.filter(m=>!!m.parent).length};
}
function wcTerrainTick(){const g=WCG.game;if(!g||!WCT.root)return;wcStreamTerrain();const theme=wcThemeAt(g.round),key=theme.name+':'+g.round+':'+g.state;
 for(const b of WCT.bridges)b.mesh.visible=g.round>b.round||(g.round===b.round&&g.state!=='spawner');
 if(WCT.key===key)return;WCT.key=key;
 if(WCT.theme!==theme.name){WCT.theme=theme.name;S.background.setHex(theme.sky);g.wallL.material.color.setHex(theme.wall);WCT.floor.material.color.setHex(theme.floor);S.fog.color.setHex(theme.sky)}
 if(WCT.decor){WCT.root.remove(WCT.decor);WCT.decor.geometry.dispose();WCT.decor.material.dispose()}
 const parts=[],add=(w,h,d,x,y,z,c)=>parts.push({w,h,d,x,y,z,c}),base=-WC.gap*g.round,half=g.half;
 for(let i=0;i<12;i++){const z=base+40-i*7;for(const side of [-1,1]){const x=side*(half+.15);if(theme.name==='Orman'){add(.45,3,.45,x,1.5,z,0x604936);add(1.7,1.6,1.7,x,3,z,theme.accent);add(1.2,.9,1.2,x,4,z,0x3a7049)}else if(theme.name==='Kış'){add(.8,1.2+(i%3)*.45,.9,x,.6,z,theme.accent);add(1.7,.16,1.8,x,1.3,z,0xeaf5fa)}else{add(.8,2+i%3,.9,x,1,z,0x241d25);add(.15,1.6,.95,x-side*.45,1,z,theme.accent)}}}
 // Kenar şeritleri ve parkur girişindeki sarı uyarı: boşluğun yeri okunabilir.
 const pit=WCT.pits.find(q=>q.round===g.round);if(pit&&g.state==='spawner'){for(const sign of [-1,1])for(let i=-3;i<=3;i++)add(.55,.035,.25,i, .02,pit.z+sign*5.25,0xffc34b)}
 WCT.decor=mergeBoxes(parts);WCT.root.add(WCT.decor);
}
function wcFallActor(q){if((q===p&&typeof admToolOn==='function'&&admToolOn('noclip'))||q.adminFly||q.hp<=0||q.y>WCT.fallLimit)return false;const immortal=q.adminGod||(q===p&&typeof admToolOn==='function'&&admToolOn('god'));q.lives=Math.max(0,(q.lives??3)-(immortal?0:1));q.rescue=(q.rescue||0)+1;q.vx=q.vy=q.vz=0;if(!q.lives){q.hp=0;q.dead=1e9;return true}const safe=q.safe||{x:0,z:8};q.x=safe.x;q.z=Math.min(safe.z,WCT.rear-2);q.y=0;q.g=true;return true}
function wcTerrainPlayer(){if(!WCG.game||WCG.ended)return;
 if(WCG.owner){if(wcFallActor(p)){p.inv=2;firing=false;hudHp();wcPickupNotice(p.lives?'Düştün! Kalan hak: '+p.lives:'Düşüş hakların bitti')}for(const q of WCG.peers.values())if(q.id!==WCG.id)wcFallActor(q)}
 if(p.dead<=0&&p.y>=-.02&&p.y<.15&&wcTerrainHeight(p.x,p.z)===0&&!wcPitAt(p.x,p.z))p.safe={x:p.x,z:p.z};
 for(const q of WCG.peers.values())if(q.hp>0&&q.y>=-.02&&q.y<.15&&!wcPitAt(q.x,q.z))q.safe={x:q.x,z:q.z};
}
function wcTerrainDispose(){if(!WCT.root)return;const gs=new Set(),ms=new Set();WCT.root.traverse(o=>{if(o.isMesh){gs.add(o.geometry);ms.add(o.material)}});S.remove(WCT.root);for(const g of gs)g.dispose();for(const m of ms)m.dispose();WCT.root=null;WCT.decor=null;WCT.pits=[];WCT.bridges=[]}
const _wcGroundAt=groundAt;groundAt=function(x,z,y){if(mode==='wc'&&WCG.game)return wcTerrainHeight(x,z);return _wcGroundAt(x,z,y)};

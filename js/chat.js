'use strict';
/* ===== N.P.N.G sohbet: yazılı (Enter) + sesli (WebRTC, sunucu sinyalleşme) =====
   Aynı odadaki (arena / açık dünya) oyuncular arasında çalışır. Ses: B tuşu bas-konuş, 🎤 düğmesi: Kapalı → Bas-konuş → Açık mikrofon. */
const CH={typing:false,mode:0,stream:null,track:null,peers:new Map(),ids:[],ptt:false,hideT:0};
const CHICE={iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]};
function chMyId(){return (typeof OWN!=='undefined'&&OWN.on)?OWN.id:(MPL.ready?MPL.id:0)}
function chInRoom(){return !!chMyId()}
(function chInit(){
 const box=document.createElement('div');box.id='chb';box.className='off';
 box.innerHTML='<div id="chl"></div><div id="chr"><input id="chi" maxlength="120" placeholder="Mesaj yaz… (Enter gönder, Esc iptal)" autocomplete="off"><button id="chm" title="Sesli sohbet">🎤 Ses: Kapalı</button></div><div id="chv"></div>';
 document.body.appendChild(box);
 const inp=box.querySelector('#chi'),btn=box.querySelector('#chm');
 btn.onclick=e=>{e.stopPropagation();chVoiceCycle()};
 btn.onmousedown=e=>e.stopPropagation();
 inp.addEventListener('keydown',e=>{
  e.stopPropagation();
  if(e.code==='Enter'||e.code==='NumpadEnter'){const v=inp.value.trim();if(v)mpSend({t:'chat',m:v});chClose()}
  else if(e.code==='Escape'){chClose()}
 });
 inp.addEventListener('keyup',e=>e.stopPropagation());
 addEventListener('keydown',e=>{
  if(CH.typing)return;
  if((e.code==='Enter'||e.code==='NumpadEnter')&&(state==='play'||state==='pause')&&chInRoom()&&!e.repeat){
   e.preventDefault();e.stopImmediatePropagation();chOpen();return}
  if(e.code==='KeyB'&&!e.repeat&&CH.mode===1&&state==='play'){CH.ptt=true;chMic()}
 },true);
 addEventListener('keyup',e=>{if(e.code==='KeyB'&&CH.ptt){CH.ptt=false;chMic()}});
 setInterval(chShow,500);
})();
function chOpen(){
 const box=$('chb'),inp=$('chi');CH.typing=true;box.classList.add('typing');inp.value='';
 for(const k in key)key[k]=0;
 box.classList.remove('off');$('chl').classList.add('show');
 setTimeout(()=>inp.focus(),0);
}
function chClose(){
 CH.typing=false;const box=$('chb');box.classList.remove('typing');$('chi').blur();
 CH.hideT=Date.now()+6000;
}
function chShow(){
 const box=$('chb');if(!box)return;
 const vis=chInRoom()&&(state==='play'||state==='pause');
 box.classList.toggle('off',!vis);
 $('chl').classList.toggle('show',CH.typing||Date.now()<CH.hideT);
 if(!chInRoom()&&CH.mode)chVoiceStop();
}
function chAdd(name,txt,sys){
 const l=$('chl'),d=document.createElement('div');d.className='chm'+(sys?' sys':'');
 if(!sys){const b=document.createElement('b');b.textContent=name+': ';d.appendChild(b)}
 d.appendChild(document.createTextNode(txt));l.appendChild(d);
 while(l.children.length>40)l.removeChild(l.firstChild);
 l.scrollTop=l.scrollHeight;CH.hideT=Date.now()+8000;
}
/* ----- Sesli sohbet ----- */
function chMic(){
 if(!CH.track)return;
 CH.track.enabled=CH.mode===2||(CH.mode===1&&CH.ptt);
 chVUI();
}
function chVUI(){
 const b=$('chm');if(!b)return;
 const nm=['Kapalı','Bas-konuş (B)','Açık mikrofon'][CH.mode];
 b.textContent='🎤 Ses: '+nm;b.className=CH.mode?'on':'';
 const v=$('chv');
 v.textContent=CH.mode?[...CH.peers.keys()].length+' kişiyle bağlı'+(CH.track&&CH.track.enabled?' · KONUŞUYORSUN':''):'';
}
async function chVoiceCycle(){
 if(CH.mode===0){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){chAdd('','Bu tarayıcıda mikrofon desteklenmiyor (https/localhost gerekir).',1);return}
  try{CH.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false})}
  catch(e){chAdd('','Mikrofon izni verilmedi.',1);return}
  CH.track=CH.stream.getAudioTracks()[0];CH.mode=1;chMic();
  mpSend({t:'vj',on:true});
 }else if(CH.mode===1){CH.mode=2;chMic()}
 else chVoiceStop();
 chVUI();
}
function chVoiceStop(){
 CH.mode=0;CH.ptt=false;
 if(CH.stream){CH.stream.getTracks().forEach(t=>t.stop())}
 CH.stream=null;CH.track=null;
 for(const id of [...CH.peers.keys()])chPeerClose(id);
 if(MPL.ws)mpSend({t:'vj',on:false});
 chVUI();
}
function chPeerClose(id){
 const p=CH.peers.get(id);if(!p)return;
 try{p.pc.close()}catch(e){}
 if(p.au){p.au.srcObject=null;p.au.remove()}
 CH.peers.delete(id);chVUI();
}
function chPeer(id){
 let p=CH.peers.get(id);if(p)return p;
 const pc=new RTCPeerConnection(CHICE);p={pc,q:[],au:null,ready:false};CH.peers.set(id,p);
 pc.onicecandidate=e=>{if(e.candidate)mpSend({t:'vs',to:id,d:{c:e.candidate}})};
 pc.ontrack=e=>{
  if(!p.au){p.au=document.createElement('audio');p.au.autoplay=true;document.body.appendChild(p.au)}
  p.au.srcObject=e.streams[0]||new MediaStream([e.track]);
  const pr=p.au.play();if(pr&&pr.catch)pr.catch(()=>{});
 };
 pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState))chPeerClose(id);else chVUI()};
 return p;
}
async function chOffer(id){
 if(!CH.track)return;
 const p=chPeer(id);
 const tr=p.pc.addTransceiver('audio',{direction:'sendrecv'});
 try{await tr.sender.replaceTrack(CH.track)}catch(e){}
 const o=await p.pc.createOffer();await p.pc.setLocalDescription(o);
 mpSend({t:'vs',to:id,d:{s:p.pc.localDescription}});
}
async function chSig(from,d){
 if(!CH.track)return;
 try{
  if(d.s){
   const p=chPeer(from);
   if(d.s.type==='offer'){
    await p.pc.setRemoteDescription(d.s);
    const tr=p.pc.getTransceivers()[0];
    if(tr){tr.direction='sendrecv';try{await tr.sender.replaceTrack(CH.track)}catch(e){}}
    const a=await p.pc.createAnswer();await p.pc.setLocalDescription(a);
    mpSend({t:'vs',to:from,d:{s:p.pc.localDescription}});
   }else await p.pc.setRemoteDescription(d.s);
   p.ready=true;for(const c of p.q)try{await p.pc.addIceCandidate(c)}catch(e){}p.q=[];
  }else if(d.c){
   const p=chPeer(from);
   if(p.ready)try{await p.pc.addIceCandidate(d.c)}catch(e){}else p.q.push(d.c);
  }
 }catch(e){console.warn('voice',e)}
}
/* sunucudan gelen */
function chatMsgIn(m){
 switch(m.t){
 case'chat':chAdd(m.n,m.m);return true;
 case'vl':CH.ids=m.ids;if(CH.mode){const me=chMyId();for(const id of m.ids)if(me<id)chOffer(id)}return true;
 case'vp':{
  if(!CH.mode)return true;
  if(m.on){if(chMyId()<m.id)chOffer(m.id)}else chPeerClose(m.id);
  return true}
 case'vs':chSig(m.from,m.d||{});return true;
 }
 return false;
}

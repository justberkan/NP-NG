'use strict';
/* ===== N.P.N.G sohbet: yazılı (Enter) + sesli (oyun sunucusu üzerinden) =====
   Aynı odadaki (arena / açık dünya) oyuncular arasında çalışır. Ses: B tuşu bas-konuş, 🎤 düğmesi: Kapalı → Bas-konuş → Açık mikrofon
   (dokunmatikte Kapalı ↔ Açık). Mikrofon kapalıyken de diğerlerini duyarsın; 🔈 düğmesi gelen sesi kapatır. */
const CH={typing:false,mode:0,stream:null,track:null,peers:new Map(),ids:[],ptt:false,hideT:0,hear:true,node:null,src:null,buf:[],loudT:0,talk:new Map()};
try{CH.hear=localStorage.getItem('npng_vin')!=='0'}catch(e){}
function chMyId(){return (typeof OWN!=='undefined'&&OWN.on)?OWN.id:(MPL.ready?MPL.id:0)}
function chInRoom(){return !!chMyId()}
(function chInit(){
 const box=document.createElement('div');box.id='chb';box.className='off';
 box.innerHTML='<div id="chl"></div><div id="chr"><input id="chi" maxlength="120" placeholder="Mesaj yaz… (Enter gönder, Esc iptal)" autocomplete="off"><button id="chm" title="Sesli sohbet">🎤 Ses: Kapalı</button><button id="chh" title="Gelen sesi aç/kapat">🔈 Duy: Açık</button></div><div id="chv"></div>';
 document.body.appendChild(box);
 const inp=box.querySelector('#chi'),btn=box.querySelector('#chm');
 btn.onclick=e=>{e.stopPropagation();chVoiceCycle()};
 const hb=box.querySelector('#chh');hb.onclick=e=>{e.stopPropagation();chHear(!CH.hear)};hb.onmousedown=e=>e.stopPropagation();
 if(typeof touch!=='undefined'&&touch)box.classList.add('tch'); /* mobil: Enter yok → ses düğmeleri hep görünür */
 btn.onmousedown=e=>e.stopPropagation();
 inp.addEventListener('keydown',e=>{
  e.stopPropagation();
  if(e.code==='Enter'||e.code==='NumpadEnter'){const v=inp.value.trim();if(v)mpSend({t:'chat',m:v});chClose()}
  else if(e.code==='Escape'){chClose()}
 });
 inp.addEventListener('keyup',e=>e.stopPropagation());
 addEventListener('keydown',e=>{
  if(CH.typing)return;
  if(kMatch(e,'chat')&&(state==='play'||state==='pause')&&chInRoom()&&!e.repeat){
   e.preventDefault();e.stopImmediatePropagation();chOpen();return}
  if(kMatch(e,'ptt')&&!e.repeat&&CH.mode===1&&state==='play'){CH.ptt=true;chMic()}
 },true);
 addEventListener('keyup',e=>{if(typeof kMatch==='function'&&kMatch(e,'ptt')&&CH.ptt){CH.ptt=false;chMic()}});
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
/* ----- Sesli sohbet (Berkan, 2026-10-20: "oyun içi ses gitmiyor") -----
   Eskiden WebRTC eşler arası (yalnız STUN) idi: mobil hat / CGNAT / bazı modemlerde bağlantı kurulamıyor, ses gitmiyordu
   (oyun sunucusu tünelden yalnız HTTP/WS geçirdiği için TURN de yoktu). Artık ses oyunun kendi WebSocket'inden gider:
   mikrofon → 16 kHz mono → μ-law (8 bit) → 60 ms paket → sunucu → aynı odadakiler → WebAudio ile sırayla çalınır.
   Oyun bağlanabiliyorsa ses de gider. Konuşan: ~21 KB/sn; susunca gönderim durur (sessizlik kapısı). */
const VR=16000,VFR=960; /* 60 ms */
const _muE=new Uint8Array(65536);(function(){for(let i=-32768;i<32768;i++){let s=i,sg=0;if(s<0){s=-s;sg=0x80}s=Math.min(32635,s)+132;let e=7;for(let m=0x4000;(s&m)===0&&e>0;m>>=1)e--;const man=(s>>(e+3))&15;_muE[i+32768]=~(sg|(e<<4)|man)&255}})();
const _muD=new Float32Array(256);for(let u=0;u<256;u++){const x=~u&255,sg=x&0x80,e=(x>>4)&7,man=x&15;let s=((man<<3)+132)<<e;s-=132;_muD[u]=(sg?-s:s)/32768}
function vEnc(f32){const o=new Uint8Array(f32.length);for(let i=0;i<f32.length;i++){const v=Math.max(-1,Math.min(1,f32[i]))*32767|0;o[i]=_muE[v+32768]}let b='';for(let i=0;i<o.length;i++)b+=String.fromCharCode(o[i]);return btoa(b)}
function vDec(b64){const b=atob(b64),o=new Float32Array(b.length);for(let i=0;i<b.length;i++)o[i]=_muD[b.charCodeAt(i)];return o}
function vCtx(){try{if(!ac)ac=new AudioContext();if(ac.state==='suspended')ac.resume()}catch(e){}return ac}
const VWK='class V extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}}registerProcessor("npng-mic",V)';
async function vCapStart(){
 const a=vCtx();if(!a||!CH.stream)return;
 CH.src=a.createMediaStreamSource(CH.stream);CH.buf=[];CH.acc=0;
 const onPcm=c=>{ /* cihaz örnekleme hızından 16 kHz'e indir */
  const st=a.sampleRate/VR;let t=CH.acc||0;
  while(t<c.length){CH.buf.push(c[t|0]);t+=st}
  CH.acc=t-c.length;
  while(CH.buf.length>=VFR){const fr=Float32Array.from(CH.buf.splice(0,VFR));vSend(fr)}
 };
 try{
  if(!a.audioWorklet)throw 0;
  if(!CH.wkOk){await a.audioWorklet.addModule(URL.createObjectURL(new Blob([VWK],{type:'application/javascript'})));CH.wkOk=1}
  CH.node=new AudioWorkletNode(a,'npng-mic');CH.node.port.onmessage=e=>onPcm(e.data);
 }catch(e){ /* eski tarayıcı: ScriptProcessor */
  CH.node=a.createScriptProcessor(2048,1,1);CH.node.onaudioprocess=e=>onPcm(e.inputBuffer.getChannelData(0));
 }
 const z=a.createGain();z.gain.value=0;CH.src.connect(CH.node);CH.node.connect(z);z.connect(a.destination);CH.sink=z; /* düğüm çalışsın diye sessiz çıkış */
}
function vCapStop(){try{if(CH.src)CH.src.disconnect();if(CH.node)CH.node.disconnect();if(CH.sink)CH.sink.disconnect()}catch(e){}CH.src=CH.node=CH.sink=null;CH.buf=[]}
function vSend(fr){
 if(!CH.track||!CH.track.enabled||!chInRoom())return;
 let e=0;for(let i=0;i<fr.length;i+=4)e+=fr[i]*fr[i];const rms=Math.sqrt(e/(fr.length/4)),now=performance.now();
 if(rms>.012)CH.loudT=now;
 if(now-CH.loudT>350)return; /* sessizlik: gönderme */
 mpSend({t:'va',d:vEnc(fr)});CH.sent=(CH.sent||0)+1;
}
function vPlay(from,b64){
 if(!CH.hear)return;
 const a=vCtx();if(!a)return;
 const pcm=vDec(b64),r=a.sampleRate/VR,n=Math.floor(pcm.length*r),buf=a.createBuffer(1,n,a.sampleRate),d=buf.getChannelData(0);
 for(let i=0;i<n;i++){const x=i/r,j=x|0,f=x-j;d[i]=pcm[j]*(1-f)+(pcm[Math.min(pcm.length-1,j+1)])*f}
 let p=CH.peers.get(from);if(!p){p={next:0,g:a.createGain()};p.g.connect(a.destination);CH.peers.set(from,p)}
 p.g.gain.value=(typeof SET!=='undefined'&&SET.volume!=null?SET.volume:1)*1.2;
 const now=a.currentTime;if(p.next<now+.04||p.next>now+.6)p.next=now+.08; /* titreme tamponu ~80 ms; birikirse sıfırla */
 const s=a.createBufferSource();s.buffer=buf;s.connect(p.g);s.start(p.next);p.next+=buf.duration;p.got=(p.got||0)+1;
 CH.talk.set(from,performance.now());
}
function chHear(on){
 CH.hear=!!on;try{localStorage.setItem('npng_vin',on?'1':'0')}catch(e){}
 if(chInRoom())mpSend({t:'vm',on:!CH.hear});
 if(!on)for(const p of CH.peers.values())p.next=0;
 chVUI();
}
function chMic(){
 if(!CH.track)return;
 CH.track.enabled=CH.mode===2||(CH.mode===1&&CH.ptt);
 chVUI();
}
function chName(id){const e=typeof OWN!=='undefined'&&OWN.on?OWN.ents.get(id):(typeof MPL!=='undefined'&&MPL.info?MPL.info.get(id):null);return e&&e.name||('#'+id)}
function chVUI(){
 const b=$('chm');if(!b)return;
 const nm=['Kapalı','Bas-konuş (B)','Açık mikrofon'][CH.mode];
 b.textContent='🎤 Ses: '+nm;b.className=CH.mode?'on':'';
 const h=$('chh');if(h){h.textContent=CH.hear?'🔈 Duy: Açık':'🔇 Duy: Kapalı';h.className=CH.hear?'':'mute'}
 const v=$('chv'),now=performance.now(),tk=[...CH.talk].filter(([,t])=>now-t<400).map(([id])=>chName(id));
 v.textContent=(tk.length?'🔊 '+tk.join(', '):'')+(CH.track&&CH.track.enabled?(tk.length?' · ':'')+'KONUŞUYORSUN':'');
}
setInterval(()=>{if(chInRoom())chVUI()},300);
async function chVoiceCycle(){
 const tch=typeof touch!=='undefined'&&touch;
 if(CH.mode===0){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){chAdd('','Bu tarayıcıda mikrofon desteklenmiyor (https/localhost gerekir).',1);return}
  try{CH.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false})}
  catch(e){chAdd('','Mikrofon izni verilmedi.',1);return}
  CH.track=CH.stream.getAudioTracks()[0];CH.mode=tch?2:1;chMic();
  await vCapStart();
  mpSend({t:'vj',on:true});
 }else if(CH.mode===1){CH.mode=2;chMic()}
 else chVoiceStop();
 chVUI();
}
function chVoiceStop(){
 CH.mode=0;CH.ptt=false;vCapStop();
 if(CH.stream){CH.stream.getTracks().forEach(t=>t.stop())}
 CH.stream=null;CH.track=null;
 if(MPL.ws)mpSend({t:'vj',on:false});
 chVUI();
}
/* sunucudan gelen */
function chatMsgIn(m){
 switch(m.t){
 case'chat':chAdd(m.n,m.m);return true;
 case'va':vPlay(m.from,m.d);return true;
 case'vl':case'vp':case'vs':return true; /* eski eşler arası sinyaller: yok say */
 }
 return false;
}

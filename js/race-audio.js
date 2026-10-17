'use strict';
/* User-supplied recordings; decode once and retain only short loop/impact slices. */
const RaceAudio=(()=>{
 const files={track:'assets/race/audio/engine-track.mp3',rev:'assets/race/audio/engine-rev.mp3',crash:'assets/race/audio/crash.mp3'};
 let context=null,loading=null,buffers={},session=null,generation=0,lastHit=-10;
 const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 function crop(buffer,offset,length){
  const n=Math.max(1,Math.min(Math.floor(length*buffer.sampleRate),buffer.length-Math.floor(offset*buffer.sampleRate))),copy=context.createBuffer(Math.min(2,buffer.numberOfChannels),n,buffer.sampleRate),start=Math.floor(offset*buffer.sampleRate),edge=Math.min(Math.floor(.025*buffer.sampleRate),Math.floor(n/4));
  for(let channel=0;channel<copy.numberOfChannels;channel++){const dst=copy.getChannelData(channel);dst.set(buffer.getChannelData(channel).subarray(start,start+n));for(let i=0;i<edge;i++){const k=i/edge;dst[i]*=k;dst[n-i-1]*=k}}
  return copy;
 }
 function slice(buffer,impact){
  const data=buffer.getChannelData(0),rate=buffer.sampleRate,duration=buffer.duration,length=Math.min(impact?1.5:3.2,duration),step=impact?.2:.5;let best=0,score=impact?-Infinity:Infinity;
  for(let t=0;t+length<=Math.min(duration,impact?duration:35);t+=step){let energy=0,variation=0,prev=0,count=0;
   for(let i=Math.floor(t*rate);i<Math.min(data.length,(t+length)*rate);i+=512){const value=data[i]*data[i];energy+=value;variation+=Math.abs(value-prev);prev=value;count++}
   const rms=Math.sqrt(energy/Math.max(1,count)),value=impact?rms:variation/Math.max(.001,energy)+Math.max(0,.035-rms)*30;
   if(impact?value>score:value<score){score=value;best=t}
  }return crop(buffer,best,length);
 }
 async function load(){
  if(loading)return loading;
  loading=Promise.all(Object.entries(files).map(async([key,url])=>{try{const response=await fetch(url);if(!response.ok)throw Error('audio '+response.status);const buffer=await context.decodeAudioData(await response.arrayBuffer());buffers[key]=slice(buffer,key==='crash')}catch(e){console.warn('Yarış ses dosyası yüklenemedi:',url,e.message)}}));return loading;
 }
 function voice(buffer,volume,pan){
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=volume;source.connect(gain);let panner=null;
  if(context.createStereoPanner){panner=context.createStereoPanner();panner.pan.value=pan||0;gain.connect(panner);panner.connect(session.master)}else gain.connect(session.master);
  source.start();const v={source,gain,panner};session.voices.push(v);return v;
 }
 function stop(){generation++;if(session){for(const v of session.voices){try{v.source.stop()}catch(_){}v.source.disconnect();v.gain.disconnect();if(v.panner)v.panner.disconnect()}for(const source of session.shots){try{source.stop()}catch(_){}source.disconnect()}session.master.disconnect()}session=null}
 function start(){
  stop();if(!RACE.v||RACE.v.air||window.BGMODE)return;
  try{ac=ac||new AudioContext();context=ac;const resumed=context.resume();if(resumed&&resumed.catch)resumed.catch(()=>{});
   const token=generation,master=context.createGain();master.gain.value=0;master.connect(context.destination);session={master,voices:[],shots:new Set(),next:0,base:null,rev:null,opponents:[]};
   load().then(()=>{if(token!==generation||!session||!RACE.on||!RACE.v||RACE.v.air)return;const base=buffers.track||buffers.rev;if(!base)return;session.base=voice(base,0);if(buffers.rev)session.rev=voice(buffers.rev,0);for(let i=0;i<2;i++)session.opponents.push(voice(base,0,i? .5:-.5))});
  }catch(e){console.warn('Yarış örnek sesleri açılamadı; sentez motoru kullanılacak.',e.message)}
 }
 function param(p,value){p.setTargetAtTime(value,context.currentTime,.065)}
 function update(){
  if(!session||!session.base||!RACE.v)return false;const now=context.currentTime;if(now<session.next)return true;session.next=now+.04;
  const v=RACE.v,active=state==='play'&&!window.BGMODE&&!(typeof document!=='undefined'&&document.hidden),volume=(typeof SET!=='undefined'?SET.volume:1)??1;
  param(session.master.gain,active?cl(volume,0,1):0);
  const speed=Math.abs(v.spd),max=20+v.def.spd*.22,r=cl(speed/max,0,1),gear=Math.floor(speed/10),rpm=cl((speed-gear*10)/10,0,1);
  param(session.base.source.playbackRate,.72+r*.40+rpm*.12);param(session.base.gain.gain,.10+r*.07);
  if(session.rev){param(session.rev.source.playbackRate,.75+rpm*.45+r*.15);param(session.rev.gain.gain,(v.boostT>0?.11:.045)*r)}
  const nearest=RACE.list.filter(o=>o!==v&&!o.done&&!o.air).map(o=>({o,d:Math.hypot(o.x-v.x,o.z-v.z)})).sort((a,b)=>a.d-b.d).slice(0,2);
  session.opponents.forEach((voice,i)=>{const near=nearest[i],gain=near?cl(1-near.d/40,0,1)*.045:0;param(voice.gain.gain,gain);if(near){param(voice.source.playbackRate,.75+cl(Math.abs(near.o.spd)/45,0,1)*.5);if(voice.panner)param(voice.panner.pan,cl(((near.o.x-v.x)*Math.cos(v.yaw)-(near.o.z-v.z)*Math.sin(v.yaw))/14,-.9,.9))}});
  return true;
 }
 function hit(v,severity){
  if(!session||!buffers.crash||state!=='play'||window.BGMODE||context.currentTime-lastHit<.25||!RACE.v)return;
  const distance=v===RACE.v?0:Math.hypot(v.x-RACE.v.x,v.z-RACE.v.z);if(distance>35)return;lastHit=context.currentTime;
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers.crash;gain.gain.value=cl(severity||.25,.08,.45)*cl(1-distance/40,0,1);source.connect(gain);gain.connect(session.master);session.shots.add(source);source.onended=()=>{if(session)session.shots.delete(source);source.disconnect();gain.disconnect()};source.start();
 }
 if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(session&&document.hidden)session.master.gain.setValueAtTime(0,context.currentTime)});
 return {start,update,stop,hit,files,version:'1.0.0'};
})();

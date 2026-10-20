'use strict';
/* Sosyal lobi (sl_*) + oyuncu durumu (cst) + kazanç bandı (/api/wins, cwin) testleri */
const fs=require('fs'),os=require('os'),path=require('path'),net=require('net'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),results=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const check=(name,ok,detail)=>{results.push({name,ok,detail});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?' '+JSON.stringify(detail):''}`);if(!ok)throw Error(name)};
let child,dir,log='',clients=[];
async function until(fn,timeout=3000){const start=Date.now();while(Date.now()-start<timeout){const v=fn();if(v)return v;await sleep(5)}throw Error('Timed out: '+log.slice(-1200))}
async function peer(port,n){const ws=new WebSocket(`ws://127.0.0.1:${port}`),p={ws,messages:[],send:m=>ws.send(JSON.stringify(m))};clients.push(p);ws.addEventListener('message',e=>p.messages.push(JSON.parse(e.data)));await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true})});p.send({t:'auth',mode:'register',name:'sl'+n,pass:'test-only-password'});await until(()=>p.messages.find(m=>m.t==='auth'&&m.ok));return p}
const last=(p,t)=>p.messages.slice().reverse().find(m=>m.t===t);
(async()=>{
 const port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
 dir=fs.mkdtempSync(path.join(os.tmpdir(),'npng-sl-'));
 child=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:dir}});child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
 await until(()=>log.includes('sunucucu çalışıyor')||log.includes('sunucusu çalışıyor'));
 const a=await peer(port,'a'),b=await peer(port,'b'),c=await peer(port,'c');
 // --- sosyal lobi akışı ---
 a.send({t:'sl_create'});
 const w=await until(()=>last(a,'sl_welcome'));
 check('sl_create oda kurar ve kod verir',/^[0-9A-F]{6}$/.test(w.code),{code:w.code});
 check('Oda kurucusu otomatik oda sahibi',w.host===w.id&&w.players.length===1);
 a.send({t:'sl_mode',mode:'zom'});await until(()=>last(a,'sl_members')&&last(a,'sl_members').mode==='zom');
 check('Oda sahibi modu değiştirebilir',true);
 b.send({t:'sl_mode',mode:'race'});
 check('Oda sahibi olmayan mod değiştiremez (sl_members mode korunur)',last(a,'sl_members')===null||last(a,'sl_members').mode==='zom');
 b.send({t:'sl_join',code:w.code});await until(()=>last(b,'sl_welcome'));
 c.send({t:'sl_join',code:'XXXXXX'});
 check('Bilinmeyen koda katılım reddedilir',!!await until(()=>last(c,'sl_error'),1500));
 c.send({t:'sl_join',code:w.code});await until(()=>last(c,'sl_welcome'));
 const mm=await until(()=>last(a,'sl_members'));
 check('sl_members 3 üyeyi listeler',mm.players.length===3);
 a.send({t:'sl_start'});
 check('Hazır olmayan oyuncu varken başlatma reddedilir',!!await until(()=>last(a,'sl_error'),1500)&&!last(a,'sl_go'));
 b.send({t:'sl_ready',v:1});await sleep(30);c.send({t:'sl_ready',v:1});await sleep(30);a.send({t:'sl_ready',v:1});
 await until(()=>last(a,'sl_members')&&last(a,'sl_members').players.every(p=>p.ready));
 check('Hazır işaretleri yayılır',true);
 a.send({t:'sl_start'});
 const go=await until(()=>last(b,'sl_go'));
 check('Herkes hazır olunca sl_go yayınlanır',go.mode==='zom');
 await sleep(80);
 check('Başlatılan odada sl_members gelmez (oda kapanır)',last(a,'sl_members').players.length===3);
 // host ayrılınca oda kapanır
 const ma=a.messages.length;a.send({t:'sl_create'});const w2=await until(()=>a.messages.slice(ma).find(m=>m.t==='sl_welcome'));
 const mi2=b.messages.length;b.send({t:'sl_join',code:w2.code});await until(()=>b.messages.slice(mi2).find(m=>m.t==='sl_welcome'));
 a.ws.close();await until(()=>last(b,'sl_closed'),3000);
 check('Oda sahibi ayrılınca oda kapanır ve bildirilir',!!last(b,'sl_closed'));
 // --- oyuncu durumu (cst) arkadaş listesinde görünür ---
 b.send({t:'fadd',n:'slc'});await sleep(30);c.send({t:'facc',n:'slb'});await sleep(30);
 c.send({t:'cst',v:'Kumarhane'});await until(()=>{const f=last(b,'fl');return f&&f.fr.find(x=>x[0]==='slc'&&x[2]==='Kumarhane')},6000);
 check('cst arkadaş listesinde durum olarak görünür',true);
 c.send({t:'cst',v:'Hack Modu'});
 await sleep(120);
 check('Beyaz listede olmayan durum reddedilir',!last(b,'fl').fr.find(x=>x[0]==='slc'&&x[2]==='Hack Modu'));
 // --- kazanç bandı ---
 c.send({t:'cwin',amount:1234});
 const cw=await until(()=>last(b,'cwin'));
 check('cwin bağlı herkese yayınlanır',cw.n==='slc'&&cw.a===1234,{cw});
 c.send({t:'cwin',amount:-5});c.send({t:'cwin',amount:0});c.send({t:'cwin',amount:NaN});
 await sleep(150);
 check('Geçersiz kazanç miktarları reddedilir',last(b,'cwin').a===1234);
 const wins=await new Promise((res,rej)=>{const http=require('http');http.get(`http://127.0.0.1:${port}/api/wins`,r=>{let d='';r.on('data',x=>d+=x);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej)});
 check('/api/wins son kazancı listeler',Array.isArray(wins.wins)&&wins.wins.length===1&&wins.wins[0].a===1234,wins);
})().catch(e=>{results.push({name:'exception',ok:false,detail:e.stack});console.error(e);process.exitCode=1}).finally(async()=>{
 for(const p of clients)try{p.ws.close()}catch(e){}
 if(child&&child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill()});
 if(dir&&path.dirname(dir)===os.tmpdir()&&path.basename(dir).startsWith('npng-sl-'))fs.rmSync(dir,{recursive:true,force:true});
 const out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'sociallobby.json'),JSON.stringify({results,serverLog:log},null,2));
});

'use strict';
/* Komut satırından adminlik (Claude, 2026-10-20 · Berkan: "cmd üzerinden adminlik verilebilsin").
   node admin.cjs ver/al/liste → data/admins.txt; çalışan sunucu 3 sn içinde okur ve bağlı oyuncuya 'admf' yollar.
   İnternetten gelen oyuncu gibi bağlanmak için x-forwarded-for başlığı kullanılır (yerelden giren her zaman admindir). */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),{spawn,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let failed=0;
const check=(name,ok,detail)=>{if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' — '+JSON.stringify(detail):''}`)};
let child=null,log='';const dir=fs.mkdtempSync(path.join(os.tmpdir(),'npng-admin-'));
const cli=(...a)=>spawnSync(process.execPath,['admin.cjs',...a],{cwd:root,env:{...process.env,MMOFPS_DATA:dir},encoding:'utf8'});
(async()=>{
  const port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const q=s.address().port;s.close(()=>r(q))})});
  child=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:dir}});
  child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
  {const t=Date.now();while(!log.includes('sunucusu çalışıyor')){if(Date.now()-t>8000||child.exitCode!==null)throw Error('sunucu başlamadı: '+log);await sleep(25)}}
  const ws=new WebSocket(`ws://127.0.0.1:${port}`,{headers:{'x-forwarded-for':'203.0.113.7'}}),msgs=[];
  ws.addEventListener('message',e=>{try{msgs.push(JSON.parse(e.data))}catch(x){}});
  await new Promise((r,j)=>{ws.addEventListener('open',r);ws.addEventListener('error',j)});
  const wait=async(f,ms=5000)=>{const t=Date.now();while(Date.now()-t<ms){const m=msgs.find(f);if(m)return m;await sleep(20)}return null};
  ws.send(JSON.stringify({t:'auth',mode:'register',name:'Uzaktan1',pass:'sifre1234',save:{v:3,tl:0}}));
  const a=await wait(m=>m.t==='auth');
  check('İnternetten giren yeni hesap admin değil',a&&a.ok&&a.admin===false,a&&{ok:a.ok,admin:a.admin});
  msgs.length=0;ws.send(JSON.stringify({t:'alist'}));await sleep(300);
  check('Admin olmayan admin listesini alamaz',!msgs.some(m=>m.t==='alist'));
  let r=cli('ver','Uzaktan1');
  check('admin.cjs ver çalışır',r.status===0&&/artık admin/.test(r.stdout),r.stdout.trim());
  const f1=await wait(m=>m.t==='admf'&&m.on===true);
  check('Çalışan sunucu 3 sn içinde admin yapar (yeniden bağlanmadan)',!!f1);
  msgs.length=0;ws.send(JSON.stringify({t:'alist'}));const al=await wait(m=>m.t==='alist',2000);
  check('Admin olunca admin listesi gelir',!!al&&al.a.some(x=>x[0]==='Uzaktan1'));
  r=cli('liste');check('admin.cjs liste gösterir',/uzaktan1/.test(r.stdout),r.stdout.trim());
  r=cli('ver','x');check('Geçersiz ad reddedilir',r.status===1);
  msgs.length=0;r=cli('al','Uzaktan1');
  const f2=await wait(m=>m.t==='admf'&&m.on===false);
  check('admin.cjs al ile yetki 3 sn içinde kalkar',r.status===0&&!!f2,r.stdout.trim());
  ws.close();
})().catch(e=>{console.error(e);failed++}).finally(async()=>{
  if(child&&child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill('SIGTERM')});
  try{if(path.basename(dir).startsWith('npng-admin-'))fs.rmSync(dir,{recursive:true,force:true})}catch(e){}
  console.log(failed?`admin-cli: ${failed} FAIL`:'admin-cli: hepsi PASS');
  process.exitCode=failed?1:0;
});

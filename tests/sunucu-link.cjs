'use strict';
/* Sunucu linki algılama: halka açık Host (Cloudflare tünel vb.) data/public-url.json'a yazılır,
   /public-url.json üzerinden sunulur; yerel/LAN hostlar kaydı bozmaz; yeniden başlatmada korunur. */
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const http=require('node:http');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const cwd=path.join(__dirname,'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function get(port,u,host){
 return new Promise((resolve,reject)=>{
  const req=http.request({host:'127.0.0.1',port,path:u,method:'GET',headers:host?{Host:host}:{}},res=>{let b='';res.on('data',d=>b+=d);res.on('end',()=>resolve({status:res.statusCode,body:b}))});
  req.on('error',reject);req.end()})}
function startServer(port,data){
 const s=spawn(process.execPath,['server.js'],{cwd,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:data}});
 let log='';s.stdout.on('data',b=>log+=b);s.stderr.on('data',b=>log+=b);
 return new Promise((resolve,reject)=>{
  const t0=Date.now();
  const poll=setInterval(()=>{
   get(port,'/api/info').then(r=>{if(r.status===200){clearInterval(poll);resolve(s)}}).catch(()=>{});
   if(s.exitCode!==null||Date.now()-t0>8000){clearInterval(poll);reject(new Error(log||'Test sunucusu başlamadı'))}
  },100)})}
(async()=>{
 const port=20000+Math.floor(Math.random()*20000);
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'npng-url-'));
 const check=(name,cond,extra)=>{assert.ok(cond,name);console.log('PASS',name,extra?'· '+JSON.stringify(extra):'')};
 let server=await startServer(port,data);
 try{
  /* Başlangıçta kayıt yok */
  let r=await get(port,'/public-url.json');
  check('Başlangıçta url yok',r.status===200&&JSON.parse(r.body).url===null);
  /* Tünel hostu algılanır ve https olarak yayınlanır */
  await get(port,'/index.html','abc123.trycloudflare.com');
  r=await get(port,'/public-url.json');
  const j1=JSON.parse(r.body);
  check('Tünel hostu algılandı',j1.url==='https://abc123.trycloudflare.com',{url:j1.url});
  check('Zaman damgası yazıldı',j1.t>0,{t:j1.t});
  /* Yerel host kaydı bozmaz */
  await get(port,'/index.html','localhost:'+port);
  await get(port,'/index.html','127.0.0.1:'+port);
  r=await get(port,'/public-url.json');
  check('Yerel host kaydı bozmaz',JSON.parse(r.body).url==='https://abc123.trycloudflare.com');
  /* LAN hostu da bozmaz */
  await get(port,'/index.html','192.168.1.77:3000');
  r=await get(port,'/public-url.json');
  check('LAN hostu kaydı bozmaz',JSON.parse(r.body).url==='https://abc123.trycloudflare.com');
  /* Yeni tünel hostu üzerine yazılır */
  await get(port,'/','xyz.trycloudflare.com');
  r=await get(port,'/public-url.json');
  check('Yeni tünel hostu üzerine yazıldı',JSON.parse(r.body).url==='https://xyz.trycloudflare.com');
  /* Disk dosyası aynı değeri taşıyor */
  const onDisk=JSON.parse(fs.readFileSync(path.join(data,'public-url.json'),'utf8'));
  check('Disk dosyası aynı url',onDisk.url==='https://xyz.trycloudflare.com');
  /* Normal dosya sunumu hâlâ çalışıyor */
  r=await get(port,'/index.html');
  check('index.html sunuluyor',r.status===200&&r.body.includes('<'));
  r=await get(port,'/assets/yok-boyle-dosya');
  check('Bilinmeyen dosya 404',r.status===404);
  /* Yeniden başlatmada değer korunur */
  await new Promise(resolve=>{server.once('exit',resolve);server.kill()});
  server=await startServer(port,data);
  r=await get(port,'/public-url.json');
  check('Yeniden başlatmada korunuyor',JSON.parse(r.body).url==='https://xyz.trycloudflare.com');
  console.log('sunucu-link: hepsi PASS');
 }finally{
  if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill()});
  try{fs.rmSync(data,{recursive:true,force:true})}catch(e){}
 }
})().catch(e=>{console.error(e);process.exitCode=1});

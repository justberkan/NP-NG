'use strict';
// İzole dizindeki gerçek sunucuda dosya sunumu ve gizli dosya sınırlarını doğrular.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const net=require('node:net');
const {spawn}=require('node:child_process');
let root,child,port,logs='';
const request=(url,method='GET')=>new Promise((resolve,reject)=>{
  const req=http.request({host:'127.0.0.1',port,path:url,method},res=>{
    let body='';res.setEncoding('utf8');res.on('data',s=>body+=s);
    res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));
  });req.setTimeout(3000,()=>req.destroy(new Error('HTTP zaman aşımı')));req.on('error',reject);req.end();
});
test.before(async()=>{
  root=fs.mkdtempSync(path.join(os.tmpdir(),'npng-http-'));
  fs.copyFileSync(path.join(__dirname,'../server.js'),path.join(root,'server.js'));
  fs.copyFileSync(path.join(__dirname,'../server-wavecorridor.js'),path.join(root,'server-wavecorridor.js'));
  fs.copyFileSync(path.join(__dirname,'../server-rooms.js'),path.join(root,'server-rooms.js')); /* ortak oda kuralları (2026-10-20) */
  fs.copyFileSync(path.join(__dirname,'../server-blackjack.js'),path.join(root,'server-blackjack.js')); /* canlı blackjack modülü (2026-10-20) */
  fs.copyFileSync(path.join(__dirname,'../server-horror.js'),path.join(root,'server-horror.js'));
  for(const f of ['server-hit-validation.js','server-hit-collision.js','server-hit-collision.bin','js/mapcol.js']){
    fs.mkdirSync(path.dirname(path.join(root,f)),{recursive:true});
    fs.copyFileSync(path.join(__dirname,'..',f),path.join(root,f));
  }
  for(const [name,body] of Object.entries({'index.html':'<h1>NPNG fixture</h1>build 202610191415','js/test.js':'window.fixture=1;','assets/model.glb':'fixture-model','.git/config':'private-git','data/accounts.json':'{}','_yedek/private.txt':'private-backup','.env':'private-env','NOTLAR.md':'private-notes','tests/private.txt':'private-test','assets/.env':'private-nested'})){
    const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,body);
  }
  port=await new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})});
  child=spawn(process.execPath,[path.join(root,'server.js'),String(port)],{windowsHide:true,env:{...process.env,PORT:String(port)}});
  child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Sunucu başlamadı: '+logs)),5000);
    const poll=setInterval(()=>{if(logs.includes('sunucusu çalışıyor')){clearInterval(poll);clearTimeout(timer);resolve()}else if(child.exitCode!==null){clearInterval(poll);clearTimeout(timer);reject(new Error(logs))}},25);
    timer.unref();
  });
});
test.after(async()=>{
  if(child&&child.exitCode===null){await new Promise(resolve=>{child.once('exit',resolve);child.kill()})}
  if(root){const resolved=path.resolve(root);if(path.dirname(resolved)===path.resolve(os.tmpdir())&&path.basename(resolved).startsWith('npng-http-'))fs.rmSync(resolved,{recursive:true,force:true});}
});
test('Oyun dosyaları ve yeni dosya yeniden başlatmadan sunulur',async()=>{
  const home=await request('/');assert.equal(home.status,200);assert.match(home.body,/NPNG fixture/);
  assert.equal(home.headers['cache-control'],'no-store');
  assert.equal((await request('/js/test.js?v=1')).body,'window.fixture=1;');
  fs.writeFileSync(path.join(root,'assets/new.js'),'window.newAsset=1;');
  assert.equal((await request('/assets/new.js')).body,'window.newAsset=1;');
  fs.writeFileSync(path.join(root,'assets/new.js'),'window.newAsset=2;');
  assert.equal((await request('/assets/new.js')).body,'window.newAsset=2;');
  assert.equal((await request('/assets/missing.glb')).status,404);
});
test('Özel dosyalar HTTP üzerinden okunamaz',async()=>{
  for(const url of ['/.git/config','/.env','/data/accounts.json','/_yedek/private.txt','/NOTLAR.md','/tests/private.txt','/assets/.env','/server.js','/assets/../.git/config','/js/%2e%2e/.git/config','/js/..%5c.git%5cconfig']){
    const res=await request(url);assert.equal(res.status,403,url);
  }
});
test('HEAD gövdesiz, yazma yöntemleri reddedilir',async()=>{
  const head=await request('/js/test.js','HEAD');assert.equal(head.status,200);assert.equal(head.body,'');
  assert.equal((await request('/js/test.js','POST')).status,405);
});
test('API bilgi yanıtı ve sunucu canlılığı',async()=>{const r=await request('/api/info');assert.equal(r.status,200);assert.equal(JSON.parse(r.body).game,'mmofps')});
test('Bozuk yüzde kodlaması sunucuyu kapatmaz',async()=>{
  assert.equal((await request('/assets/%E0%A4%A')).status,400);
  assert.equal((await request('/api/info')).status,200);
});

test('Manifest yalnız public dosyalar; doğru hash, cache güncelleme ve silme',async()=>{
 const crypto=require('node:crypto');const get=async()=>{const r=await request('/api/manifest');assert.equal(r.status,200);return JSON.parse(r.body)};
 const m=await get();assert.equal(m.build,'202610191415');assert(m.files.length>0);for(const f of m.files){assert(f.p==='index.html'||/^(assets|js|css|lib)\//.test(f.p));assert(!f.p.split('/').some(x=>x.startsWith('.')));const b=fs.readFileSync(path.join(root,f.p));assert.equal(f.size,b.length);assert.equal(f.sha256,crypto.createHash('sha256').update(b).digest('hex'))}
 assert(!m.files.some(f=>/accounts|private|server\.js/.test(f.p)));
 const f=path.join(root,'js/test.js');fs.writeFileSync(f,'window.fixture=2;');const next=await get();assert.notEqual(m.files.find(x=>x.p==='js/test.js').sha256,next.files.find(x=>x.p==='js/test.js').sha256);
 fs.unlinkSync(path.join(root,'assets/new.js'));assert(!(await get()).files.some(x=>x.p==='assets/new.js'));
 const link=path.join(root,'assets','outside');fs.symlinkSync(path.join(root,'data'),link,'junction');assert(!(await get()).files.some(x=>x.p.includes('outside')));
 assert.equal((await request('/api/manifest','HEAD')).body,'');
});

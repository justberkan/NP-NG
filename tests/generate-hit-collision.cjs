'use strict';
// Regenerate from the actual browser map loader, including transforms and roof caps.
// Usage: node tests/generate-hit-collision.cjs (no live server or account data used).
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),zlib=require('zlib');
const {spawn}=require('child_process'),{chromium}=require('playwright'),net=require('net');
const root=path.resolve(__dirname,'..');
(async()=>{
 const port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'npng-collision-'));
 const server=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:data}});
 let log='';server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);
 let browser;
 try{
  for(let i=0;!log.includes('sunucusu çalışıyor');i++){if(i>200||server.exitCode!==null)throw Error(log);await new Promise(r=>setTimeout(r,50))}
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${port}`);
  await page.waitForFunction(()=>typeof mapLoad==='function');
  const packed=await page.evaluate(async()=>{
   const out={arena:ARENA.boxes.map(b=>[b.x1,0,b.z1,b.x2,b.h,b.z2])};
   for(const id of ['dust2','mc']){
    const m=await new Promise(r=>mapLoad(id,r));if(!m)throw Error('Map load failed: '+id);
    const c=m.col, o={};
    for(const k of ['n','cs','ox','oz','NXc','NZc','bb'])o[k]=c[k];
    // GLTFLoader may finish mesh promises in different orders; canonicalize triangle and cell indices.
    const order=Array.from({length:c.n},(_,i)=>i).sort((a,b)=>{for(let k=0;k<9;k++){const d=c.T[a*9+k]-c.T[b*9+k];if(d)return d}return 0});
    const inverse=new Int32Array(c.n),T=new Float32Array(c.n*9);
    order.forEach((old,i)=>{inverse[old]=i;T.set(c.T.subarray(old*9,old*9+9),i*9)});
    const idx=Int32Array.from(c.idx,i=>inverse[i]);
    for(let i=0;i<c.cnt.length-1;i++)idx.subarray(c.cnt[i],c.cnt[i+1]).sort();
    const arrays={T,cnt:c.cnt,idx};
    for(const k of ['T','cnt','idx']){const bytes=new Uint8Array(arrays[k].buffer,arrays[k].byteOffset,arrays[k].byteLength);let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));o[k]=btoa(s)}
    out[id]=o;
    if(id==='dust2'){
     const clear=(a,b)=>{const d=new THREE.Vector3(b.x-a.x,b.y-a.y,b.z-a.z),len=d.length();d.normalize();const h=mcRayCast2(c,a,d,len);return !h||h.t>=len-.18};
     o.passages=[];
     for(let i=0;i<m.nav.n&&o.passages.length<6;i++)for(const axis of [0,1]){
      const x=m.nav.X[i],z=m.nav.Z[i],y=m.nav.Y[i]+1.4;
      const a={x:x-(axis?0:3),y,z:z-(axis?3:0)},b={x:x+(axis?0:3),y,z:z+(axis?3:0)};
      if(!clear(a,b))continue;
      const side=v=>({x:v.x+(axis?1.5:0),y:v.y,z:v.z+(axis?0:1.5)});
      const other=v=>({x:v.x-(axis?1.5:0),y:v.y,z:v.z-(axis?0:1.5)});
      if(!clear(side(a),side(b))&&!clear(other(a),other(b))&&o.passages.every(q=>Math.hypot(q.a.x-a.x,q.a.z-a.z)>4))o.passages.push({a,b});
     }
    }
   }
   out.weaponProfiles=Object.fromEntries(WMOD.filter(m=>!WM_HIDE.has(m.id)).map(m=>[m.id,{cls:m.cls,rate:m.cs.rate}]));
   return out;
  });
  packed.sources={};for(const f of ['js/core.js','js/maps.js','js/mapcol.js','js/weapons.js','js/catalog.js','assets/map_dust2.js','assets/map_mc.js'])packed.sources[f]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n')).digest('hex');
  const bytes=zlib.gzipSync(Buffer.from(JSON.stringify(packed)),{level:9});
  if(bytes.length>2*1024*1024)throw Error('Collision data exceeds 2 MiB: '+bytes.length);
  fs.writeFileSync(path.join(root,'server-hit-collision.bin'),bytes);
  console.log(JSON.stringify({bytes:bytes.length,triangles:{dust2:packed.dust2.n,mc:packed.mc.n},sources:packed.sources},null,2));
 }finally{if(browser)await browser.close();if(server.exitCode===null)await new Promise(r=>{server.once('exit',r);server.kill()});if(path.dirname(data)===os.tmpdir()&&path.basename(data).startsWith('npng-collision-'))fs.rmSync(data,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});

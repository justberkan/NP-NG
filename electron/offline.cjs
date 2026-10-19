'use strict';
const fs=require('node:fs'),pfs=fs.promises,path=require('node:path'),crypto=require('node:crypto');
const {Readable,Transform}=require('node:stream'),{pipeline}=require('node:stream/promises');
const LIMITS=Object.freeze({bytes:600*1024*1024,files:5000,seed:2*1024*1024,manifest:2*1024*1024,parallel:2});
const SEED_KEYS=Object.freeze(['mmofps_sv','mmofps_set','mmofps_kb','mmofps_fov','mmofps_pvp','npng_legal_v1','npng_map']);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
function safePath(root,p){
 if(typeof p!=='string'||p.length>1024||!(p==='index.html'||/^(assets|js|css|lib)\/.+/.test(p))||/[\\:\0%?#]/.test(p)||p.split('/').some(s=>!s||s.startsWith('.')||/[. ]$/.test(s)||/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(s)))throw Error('Unsafe path');
 const base=path.resolve(root),f=path.resolve(base,p);if(!f.startsWith(base+path.sep))throw Error('Path escape');return f;
}
async function regular(root,p){const f=safePath(root,p);let cur=path.resolve(root);for(const part of p.split('/')){cur=path.join(cur,part);if((await pfs.lstat(cur)).isSymbolicLink())throw Error('Symbolic link')};const real=await pfs.realpath(f),base=await pfs.realpath(root);if(!real.startsWith(base+path.sep))throw Error('Path escape');if(!(await pfs.stat(real)).isFile())throw Error('Not file');return real}
function validateManifest(m){
 if(!m||typeof m.build!=='string'||m.build.length>100||!Array.isArray(m.files)||!m.files.length||m.files.length>LIMITS.files)throw Error('Invalid manifest');
 let bytes=0;const names=new Set();for(const f of m.files){safePath(path.resolve('offline-validation'),f.p);const key=f.p.toLowerCase();if(names.has(key)||!Number.isSafeInteger(f.size)||f.size<0||!/^[a-f0-9]{64}$/.test(f.sha256))throw Error('Invalid file');names.add(key);bytes+=f.size;if(bytes>LIMITS.bytes)throw Error('Cache too large')}
 if(!names.has('index.html'))throw Error('Missing index');return m;
}
async function digest(f){const hash=crypto.createHash('sha256');let size=0;for await(const b of fs.createReadStream(f)){size+=b.length;hash.update(b)}return{sha256:hash.digest('hex'),size}}
async function boundedJSON(res,limit){let size=0;const chunks=[];for await(const b of res.body){size+=b.length;if(size>limit)throw Error('Response too large');chunks.push(Buffer.from(b))}return JSON.parse(Buffer.concat(chunks).toString('utf8'))}
async function atomicJSON(f,data){await pfs.mkdir(path.dirname(f),{recursive:true});const tmp=f+'.tmp';await pfs.writeFile(tmp,JSON.stringify(data));await pfs.rename(tmp,f)}
// Recovery keeps the last complete directory after a crash between the two renames.
async function recover(home){await pfs.mkdir(home,{recursive:true});const live=path.join(home,'offline-game'),old=live+'.old';if(!fs.existsSync(live)&&fs.existsSync(old))await pfs.rename(old,live);return live}
async function status(home){try{const live=await recover(home),meta=JSON.parse(await pfs.readFile(path.join(live,'offline-meta.json'),'utf8'));await regular(live,'index.html');return {available:true,...meta}}catch(e){return{available:false}}}
const jobs=new Map();
function sync(home,url,onProgress=()=>{}){
 home=path.resolve(home);if(jobs.has(home))return jobs.get(home);
 const task=syncCopy(home,url,onProgress).finally(()=>jobs.delete(home));jobs.set(home,task);return task;
}
async function syncCopy(home,url,onProgress){
 const base=new URL(url);if(!['http:','https:'].includes(base.protocol)||base.username||base.password)throw Error('Invalid origin');
 const response=await fetch(new URL('/api/manifest',base),{redirect:'error',signal:AbortSignal.timeout(30000)});if(response.status===404)return{skipped:true};if(!response.ok)throw Error('Manifest HTTP '+response.status);
 const m=validateManifest(await boundedJSON(response,LIMITS.manifest)),live=await recover(home),stage=live+'.new',old=live+'.old';
 // All deletion targets are fixed children of the application profile, never manifest paths.
 await pfs.rm(stage,{recursive:true,force:true});await pfs.mkdir(stage);let done=0,cursor=0,failed;
 onProgress({state:'syncing',percent:0});
 async function worker(){while(!failed&&cursor<m.files.length){const entry=m.files[cursor++];try{
  const dest=safePath(stage,entry.p);await pfs.mkdir(path.dirname(dest),{recursive:true});let reuse=false;
  try{const src=await regular(live,entry.p),d=await digest(src);if(d.sha256===entry.sha256&&d.size===entry.size){await pfs.copyFile(src,dest);reuse=true}}catch(e){}
  if(!reuse){const res=await fetch(new URL('/'+entry.p.split('/').map(encodeURIComponent).join('/'),base),{redirect:'error',signal:AbortSignal.timeout(120000)});if(!res.ok)throw Error('File HTTP '+res.status);let size=0;const bound=new Transform({transform(b,enc,cb){size+=b.length;cb(size>entry.size?Error('File too large'):null,b)}});await pipeline(Readable.fromWeb(res.body),bound,fs.createWriteStream(dest,{flags:'wx'}))}
  const d=await digest(dest);if(d.size!==entry.size||d.sha256!==entry.sha256)throw Error('Hash mismatch: '+entry.p);
  onProgress({state:'syncing',percent:Math.floor(++done/m.files.length*100)});
 }catch(e){failed=e}}}
 await Promise.all([worker(),worker()]);if(failed)throw failed;
 const meta={build:m.build,url:base.origin,tarih:new Date().toISOString()};await atomicJSON(path.join(stage,'offline-meta.json'),meta);
 await pfs.rm(old,{recursive:true,force:true});if(fs.existsSync(live))await pfs.rename(live,old);
 try{await pfs.rename(stage,live)}catch(e){if(fs.existsSync(old))await pfs.rename(old,live);throw e}
 await atomicJSON(path.join(home,'offline-meta.json'),meta);onProgress({state:'ready',percent:100,...meta});return meta;
}
function validateSeed(data){if(!data||typeof data!=='object'||Array.isArray(data)||Buffer.byteLength(JSON.stringify(data))>LIMITS.seed)throw Error('Invalid seed');const out={};for(const k of Object.keys(data)){if(!SEED_KEYS.includes(k))throw Error('Forbidden seed key');if(data[k]===null)continue;if(typeof data[k]!=='string')throw Error('Invalid seed value');if(k==='npng_map'){if(!/^[a-zA-Z0-9_-]{1,64}$/.test(data[k]))throw Error('Invalid map')}else JSON.parse(data[k]);out[k]=data[k]}return out}
async function saveSeed(home,data){return atomicJSON(path.join(home,'offline-seed.json'),validateSeed(data))}
async function readSeed(home){try{return validateSeed(JSON.parse(await pfs.readFile(path.join(home,'offline-seed.json'),'utf8')))}catch(e){return{}}}
async function serve(home,request){
 try{const u=new URL(request.url);if(u.protocol!=='npng:'||u.hostname!=='game'||u.port||u.username||u.password)return new Response('',{status:403});
 if(!['GET','HEAD'].includes(request.method))return new Response('',{status:405});
 if(u.pathname.startsWith('/api/'))return Response.json({offline:true},{status:503});
 if(u.pathname==='/__seed')return new Response('<!doctype html><title>Hazırlanıyor</title>',{headers:{'Content-Type':'text/html'}});
 const p=decodeURIComponent(u.pathname.slice(1)),live=await recover(home),f=await regular(live,p);
 const headers={'Content-Type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
 return new Response(request.method==='HEAD'?null:Readable.toWeb(fs.createReadStream(f)),{headers});
 }catch(e){return new Response('',{status:404})}
}
module.exports={LIMITS,SEED_KEYS,MIME,safePath,regular,validateManifest,digest,validateSeed,saveSeed,readSeed,recover,status,sync,serve};

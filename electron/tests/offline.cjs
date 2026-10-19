'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const o=require('../offline.cjs'),{canNavigate}=require('../policy.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function clean(dir){const p=path.resolve(dir);assert.equal(path.dirname(p),path.resolve(os.tmpdir()));assert(path.basename(p).startsWith('npng-offline-unit-'));fs.rmSync(p,{recursive:true,force:true})}
test('Untrusted paths, manifests, seed keys and scheme origin',()=>{
 for(const p of ['../index.html','assets/../data/a','assets/.secret','assets\\x','assets/x:ads','assets/%2e%2e/x','assets/con','assets/x.','assets//x','index.html/x'])assert.throws(()=>o.safePath(os.tmpdir(),p),p);
 const m={build:'1',files:[{p:'index.html',size:1,sha256:hash('x')}]};assert.equal(o.validateManifest(m),m);assert.throws(()=>o.validateManifest({...m,files:[...m.files,...m.files]}));assert.throws(()=>o.validateManifest({...m,files:[{...m.files[0],size:o.LIMITS.bytes+1}]}));
 assert.throws(()=>o.validateSeed({mmofps_srv:'{}'}));assert.throws(()=>o.validateSeed({mmofps_sv:'bad'}));assert.throws(()=>o.validateSeed({mmofps_sv:JSON.stringify('x'.repeat(o.LIMITS.seed))}));assert.deepEqual(o.validateSeed({mmofps_sv:'{}',npng_map:'dust2'}),{mmofps_sv:'{}',npng_map:'dust2'});
 assert(canNavigate('npng://game/assets/casino/dede/index.html','npng://game'));for(const u of ['npng://evil/index.html','https://game/','npng://game:80/','npng://name@game/'])assert(!canNavigate(u,'npng://game'));
});
test('Real HTTP: two transfers, changed-only download, atomic failure, 404, protocol and recovery',async()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'npng-offline-unit-'));let files={'index.html':'<h1>one</h1>','js/test.js':'one','assets/casino/dede/index.html':'<h1>fixture iframe</h1>'},bad=false,missing=false,active=0,max=0,hits=[];
 const server=http.createServer((q,r)=>{if(q.url==='/api/manifest'){if(missing){r.writeHead(404);return r.end()}r.setHeader('Content-Type','application/json');return r.end(JSON.stringify({build:'123',files:Object.entries(files).map(([p,b])=>({p,size:Buffer.byteLength(b),sha256:hash(b)}))}))}const p=decodeURIComponent(q.url.slice(1));hits.push(p);active++;max=Math.max(max,active);setTimeout(()=>{r.end(bad?'wrong':files[p]);active--},30)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 try{await o.sync(home,url);assert(max<=2);assert.equal(hits.length,3);assert.equal((await o.status(home)).available,true);
 hits=[];await o.sync(home,url);assert.equal(hits.length,0);files['js/test.js']='two';await o.sync(home,url);assert.deepEqual(hits,['js/test.js']);
 bad=true;files['js/test.js']='new';await assert.rejects(o.sync(home,url));assert.equal(fs.readFileSync(path.join(home,'offline-game/js/test.js'),'utf8'),'two');
 missing=true;assert.deepEqual(await o.sync(home,url),{skipped:true});
 await o.saveSeed(home,{mmofps_sv:'{}'});assert.deepEqual(await o.readSeed(home),{mmofps_sv:'{}'});
 const res=await o.serve(home,{url:'npng://game/assets/casino/dede/index.html?v=1',method:'GET'});assert.equal(res.status,200);assert.match(await res.text(),/fixture iframe/);
 assert.equal((await o.serve(home,{url:'npng://game/api/info',method:'GET'})).status,503);
 assert.equal((await o.serve(home,{url:'npng://game/assets/%2e%2e%5cdata/accounts.json',method:'GET'})).status,404);
 const external=path.join(home,'secret');fs.writeFileSync(external,'secret');fs.symlinkSync(home,path.join(home,'offline-game/assets/link'),'junction');assert.equal((await o.serve(home,{url:'npng://game/assets/link/secret',method:'GET'})).status,404);
 fs.rmSync(path.join(home,'offline-game.old'),{recursive:true,force:true});fs.renameSync(path.join(home,'offline-game'),path.join(home,'offline-game.old'));await o.recover(home);assert.equal((await o.status(home)).available,true);
 }finally{await new Promise(r=>server.close(r));clean(home)}
});

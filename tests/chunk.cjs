'use strict';
// Parçalı test koşucusu: node tests/chunk.cjs tests/a.cjs tests/b.cjs ...
// run.cjs ile aynı ortamı kurar (geçici port + geçici veri dizini), yalnızca verilen testleri koşar.
const {spawn,spawnSync}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net');
const cwd=path.resolve(__dirname,'..');
(async()=>{
  const files=process.argv.slice(2);
  if(!files.length){console.error('kullanim: node tests/chunk.cjs <test...>');process.exit(2)}
  const port=await new Promise((resolve,reject)=>{const s=net.createServer();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})});
  const data=fs.mkdtempSync(path.join(os.tmpdir(),'npng-tests-'));
  const server=spawn(process.execPath,['server.js'],{cwd,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:data}});
  let log='';server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);
  try{
    await new Promise((resolve,reject)=>{
      const started=Date.now();
      const poll=setInterval(()=>{
        if(log.includes('sunucusu çalışıyor')){clearInterval(poll);resolve()}
        else if(server.exitCode!==null||Date.now()-started>8000){clearInterval(poll);reject(new Error(log||'Test sunucusu başlamadı'))}
      },25);
      server.once('error',e=>{clearInterval(poll);reject(e)});
    });
    console.log('TEST-SUNUCU port',port);
    for(const f of files){
      const args=f==='tests/http.cjs'?['--test',f]:[f];
      console.log('--- BASLA',f);
      const t0=Date.now();
      const result=spawnSync(process.execPath,args,{cwd,windowsHide:true,stdio:'inherit',env:{...process.env,TEST_URL:`http://127.0.0.1:${port}`}});
      console.log('--- BITTI',f,'kod',result.status,(Date.now()-t0)+'ms');
      if(result.status!==0)process.exitCode=1;
    }
  }catch(e){
    console.error('CIKTI:',log);console.error(e);process.exitCode=1;
  }finally{
    if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill()});
    const resolved=path.resolve(data),tmp=path.resolve(os.tmpdir());
    if(path.dirname(resolved)===tmp&&path.basename(resolved).startsWith('npng-tests-'))fs.rmSync(resolved,{recursive:true,force:true});
  }
})().catch(e=>{console.error(e);process.exitCode=1});

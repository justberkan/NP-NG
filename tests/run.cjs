'use strict';
// npm test: kendi sunucusunu ve geçici hesap dizinini açar; var olan oyuna dokunmaz.
const {spawn,spawnSync}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net');
const cwd=path.resolve(__dirname,'..');
(async()=>{
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
    const commands=[['tests/server-hit.cjs'],['--test','tests/http.cjs'],['tests/movement.cjs'],['tests/smoke.cjs'],['tests/lobby-atmosphere.cjs'],['tests/audit.cjs'],['tests/offline-save.cjs'],['tests/casino-rtp.cjs'],['tests/casino-dede.cjs'],['tests/casino-roach.cjs'],['tests/horror.cjs'],['tests/horror-open.cjs'],['tests/rooms-lobby.cjs'],['tests/starttrack.cjs'],['tests/trade.cjs'],['tests/casino-games.cjs'],['tests/live-blackjack.cjs'],['tests/glide-sprint.cjs'],['tests/mobile.cjs'],['tests/ow-slam-auto.cjs'],['tests/ow-loot.cjs'],['tests/ow-zombies.cjs'],['tests/voice.cjs'],['tests/admin-cli.cjs']]; /* audit.cjs: tüm modlar aç/kapa + sızıntı + lobi tıklama (2026-10-17) · offline-save.cjs: çevrimdışı kayıt kuralı (2026-10-19) · casino-rtp/casino-dede: DEDE RTP kapısı + oyun içi para (2026-10-19) */
    for(const args of commands){
      const result=spawnSync(process.execPath,args,{cwd,windowsHide:true,stdio:'inherit',env:{...process.env,TEST_URL:`http://127.0.0.1:${port}`}});
      if(result.status!==0){process.exitCode=1;}
    }
  }finally{
    if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill()});
    const resolved=path.resolve(data),tmp=path.resolve(os.tmpdir());
    if(path.dirname(resolved)===tmp&&path.basename(resolved).startsWith('npng-tests-'))fs.rmSync(resolved,{recursive:true,force:true});
  }
})().catch(e=>{console.error(e);process.exitCode=1});

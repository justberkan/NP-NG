'use strict';
const http=require('node:http'),https=require('node:https');
const {gameURL}=require('./policy.cjs');
function settings(o={}){if(!o||typeof o!=='object')o={};return{fullscreen:o.fullscreen!==false,keepAwake:o.keepAwake!==false,vsync:o.vsync===true}}
function probe(value,timeout=4500){
 let url;try{url=gameURL(value)}catch(e){return Promise.resolve({ok:false,error:e.message})}
 return new Promise(resolve=>{let done=false;const start=performance.now();let timer;
 const finish=result=>{if(done)return;done=true;clearTimeout(timer);resolve(result)};
 const req=(url.startsWith('https:')?https:http).request(url,{method:'HEAD',headers:{'User-Agent':'NPNG-Launcher/0.2.0'}},res=>{const status=res.statusCode;res.resume();finish({ok:status>=200&&status<300,ms:Math.round(performance.now()-start),status,error:status>=300&&status<400?'Adres yönlendiriliyor; son oyun adresini kullan.':status>=400?'Sunucu HTTP '+status+' yanıtı verdi.':''})});
 timer=setTimeout(()=>{finish({ok:false,error:'Sunucu yanıt vermedi. Yerel sunucuyu başlat veya adresi kontrol et.'});req.destroy()},timeout);
 req.on('error',()=>finish({ok:false,error:'Sunucuya ulaşılamadı. Adresi ve bağlantını kontrol et.'}));req.end();
 });
}
async function startLocal({folder,executable,log,port=3000}){
 const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
 const url='http://localhost:'+port+'/';
 if((await probe(url,700)).ok)return{ok:true,alreadyRunning:true};
 if(!folder||!fs.existsSync(path.join(folder,'server.js')))return{ok:false,error:'Önce server.js içeren oyun klasörünü seç.'};
 if(fs.existsSync(log)&&fs.statSync(log).size>1048576){const previous=log+'.previous';if(fs.existsSync(previous))fs.unlinkSync(previous);fs.renameSync(log,previous)}
 const fd=fs.openSync(log,'a');let child;
 try{child=spawn(executable,[path.join(folder,'server.js')],{cwd:folder,env:{...process.env,ELECTRON_RUN_AS_NODE:'1',PORT:String(port)},detached:true,windowsHide:true,stdio:['ignore',fd,fd]})}finally{fs.closeSync(fd)}
 let failed=false;child.once('error',()=>{failed=true});child.unref();
 for(let i=0;i<15;i++){if(failed)break;const status=await probe(url,500);if(status.ok)return{ok:true};await new Promise(r=>setTimeout(r,200))}
 return{ok:false,error:'Sunucu başlatılamadı. Oyun klasörünü ve local-server.log kaydını kontrol et.'};
}
module.exports={settings,probe,startLocal};

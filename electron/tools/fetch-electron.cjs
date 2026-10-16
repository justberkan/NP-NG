'use strict';
// Standart indirme ağda yarıda kalırsa resmi paketi kaldığı yerden alır ve sabit checksum ile doğrular.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Readable}=require('node:stream'),{pipeline}=require('node:stream/promises');
(async()=>{
 const root=path.resolve(__dirname,'..'),version=require(path.join(root,'node_modules/electron/package.json')).version;
 const name=`electron-v${version}-win32-x64.zip`,dest=path.join(root,'test-results',name);fs.mkdirSync(path.dirname(dest),{recursive:true});
 const hashes=require(path.join(root,'node_modules/electron/checksums.json')),expected=hashes[name];if(!expected)throw Error('Resmi checksum yok');
 const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex');
 if(fs.existsSync(dest)&&hash()===expected){console.log('Electron paketi zaten doğrulanmış.');return}
 const size=fs.existsSync(dest)?fs.statSync(dest).size:0;
 const response=await fetch(`https://github.com/electron/electron/releases/download/v${version}/${name}`,{headers:size?{Range:`bytes=${size}-`}:{},signal:AbortSignal.timeout(900000)});
 if(!response.ok)throw Error('HTTP '+response.status);
 const resume=size>0&&response.status===206;
 if(resume&&!response.headers.get('content-range')?.startsWith(`bytes ${size}-`))throw Error('Sunucu yanlış parça döndürdü');
 await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(dest,{flags:resume?'a':'w'}));
 if(hash()!==expected)throw Error('Electron SHA256 uyuşmadı');console.log('PASS resmi Electron paketi SHA256 doğrulandı: '+expected);
})().catch(e=>{console.error(e.message);process.exitCode=1});

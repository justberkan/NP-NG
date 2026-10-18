'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto');
const root=__dirname;
const data=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,'server-hit-collision.bin'))));
// Trusted repository code only: use exactly the client's ray algorithm, not a second approximation.
/* Claude (birleştirme): js/mapcol.js değişip ışın fonksiyonları ayıklanamazsa sunucu ÇÖKMEZ;
   harita duvar kontrolü kapanır (hız/menzil/zaman kontrolleri sürer) ve konsola yüksek sesle yazılır. */
let ray=null;
try{
 const source=fs.readFileSync(path.join(root,'js/mapcol.js'),'utf8');
 const a=source.slice(source.indexOf('function mcRayCast('),source.indexOf('function mcRayMesh('));
 const b=source.slice(source.indexOf('function mcRayCast2('),source.indexOf('function mcNav('));
 ray=Function(a+'\n'+b+'\nreturn mcRayCast2;')();
}catch(e){console.error('[vuruş doğrulama] js/mapcol.js ışın kodu okunamadı, Dust2/MC duvar kontrolü KAPALI: '+e.message)}
const warned=new Set();
for(const id of ['dust2','mc'])for(const [key,Type] of [['T',Float32Array],['cnt',Int32Array],['idx',Int32Array]]){
 const bytes=Buffer.from(data[id][key],'base64');const buf=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);data[id][key]=new Type(buf);
}
function boxHit(box,o,d,far){
 let lo=0,hi=far;
 for(let i=0;i<3;i++){const k=['x','y','z'][i];if(Math.abs(d[k])<1e-10){if(o[k]<box[i]||o[k]>box[i+3])return false;continue}
  let x=(box[i]-o[k])/d[k],y=(box[i+3]-o[k])/d[k];if(x>y)[x,y]=[y,x];lo=Math.max(lo,x);hi=Math.min(hi,y);if(lo>hi)return false}
 return hi>1e-4&&lo<far;
}
function blocked(map,o,target,padding){
 const dx=target.x-o.x,dy=target.y-o.y,dz=target.z-o.z,len=Math.hypot(dx,dy,dz);
 if(len<=padding)return false;
 const d={x:dx/len,y:dy/len,z:dz/len},far=len-padding;
 if(map==='arena')return data.arena.some(box=>boxHit(box,o,d,far));
 const col=data[map];
 /* Bilinmeyen harita (çarpışma verisi üretilmemiş) ya da ışın kodu yoksa: duvar kontrolü atlanır, diğer kontroller sürer.
    Eskiden bilinmeyen haritada TÜM vuruşlar reddediliyordu; yeni harita eklenince çevrimiçi hasar sessizce kesilirdi. */
 if(!col||!ray){if(!warned.has(map)){warned.add(map);console.error('[vuruş doğrulama] '+map+' için çarpışma verisi yok: node tests/generate-hit-collision.cjs çalıştırın. Duvar kontrolü bu haritada KAPALI.')}return false}
 const h=ray(col,o,d,far);return !!h&&h.t<far;
}
function verifySources(){for(const [f,expected] of Object.entries(data.sources))if(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n')).digest('hex')!==expected)throw Error('Regenerate hit collision data: '+f);return true}
module.exports={blocked,verifySources,data};

'use strict';
/* N.P.N.G. admin yönetimi — sunucu bilgisayarında komut satırından (Berkan, 2026-10-20).
   Kullanım:  node admin.cjs liste
              node admin.cjs ver <kullanıcı>
              node admin.cjs al  <kullanıcı>
   data/admins.txt dosyasını düzenler. Çalışan sunucu dosyayı 3 sn içinde yeniden okur; oyundaki oyuncunun
   admin düğmesi yeniden bağlanmadan açılır/kapanır. Sunucu bilgisayarından (localhost) girenler zaten her zaman admindir. */
const fs=require('fs'),path=require('path');
const DATA=process.env.MMOFPS_DATA||path.join(__dirname,'data'),F=path.join(DATA,'admins.txt'),ACC=path.join(DATA,'accounts.json');
const NAME=/^[A-Za-z0-9_ÇĞİÖŞÜçğıöşü]{3,14}$/;
const lower=s=>s.toLowerCase(); /* sunucuyla aynı (hesap anahtarı name.toLowerCase()) */
function read(){try{return fs.readFileSync(F,'utf8').split(/\r?\n/).map(s=>s.trim()).filter(Boolean)}catch(e){return []}}
function write(list){fs.mkdirSync(DATA,{recursive:true});const t=F+'.tmp';fs.writeFileSync(t,list.join('\r\n')+(list.length?'\r\n':''));fs.renameSync(t,F)}
function accounts(){try{return JSON.parse(fs.readFileSync(ACC,'utf8'))}catch(e){return {}}}
const [cmd,raw]=process.argv.slice(2);
const say=(s,code=0)=>{console.log(s);process.exitCode=code};
const list=read();
if(!cmd||cmd==='liste'||cmd==='list'){
  say(list.length?'Adminler:\n  '+list.join('\n  ')+'\n(Sunucu bilgisayarından girenler de her zaman admindir.)':'Kayıtlı admin yok. (Sunucu bilgisayarından girenler her zaman admindir.)');
}else if(cmd==='ver'||cmd==='al'){
  const name=String(raw||'').trim();
  if(!NAME.test(name))say('Geçersiz kullanıcı adı: "'+name+'" (3-14 karakter: harf, rakam, _).',1);
  else{
    const key=lower(name),has=list.some(x=>lower(x)===key),acc=accounts()[key];
    if(cmd==='ver'){
      if(has)say(name+' zaten admin.');
      else{list.push(key);write(list);say('✓ '+name+' artık admin.'+(acc?'':'\n  Not: bu isimde hesap henüz yok; o isimle kayıt olunca admin olur.')+'\n  Sunucu açıksa 3 sn içinde geçerli olur, yeniden başlatmaya gerek yok.')}
    }else{
      if(!has)say(name+' zaten admin değil.');
      else{write(list.filter(x=>lower(x)!==key));say('✓ '+name+' adminlikten çıkarıldı (3 sn içinde geçerli).')}
    }
  }
}else say('Kullanım: node admin.cjs liste | ver <kullanıcı> | al <kullanıcı>',1);

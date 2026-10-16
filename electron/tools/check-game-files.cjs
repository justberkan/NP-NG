'use strict';
// Oyun dosyalarını yalnız okur. Paralel Claude değişiklikleri varsa adlarını raporlar.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),out=path.resolve(__dirname,'../test-results'),before=JSON.parse(fs.readFileSync(path.join(out,'game-files-snapshot.json'),'utf8'));
const changed=[];for(const entry of before){const p=path.join(root,entry.path);if(!fs.existsSync(p)||crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==entry.hash)changed.push(entry.path)}
const result={date:new Date().toISOString(),checked:before.length,changed,explanation:changed.length?'Dosyalar dışarıdan değişmiş olabilir; Codex C1 yalnız electron altında çalıştı.':'Başlangıçta kaydedilen oyun dosyalarının tamamı byte düzeyinde aynı.'};
fs.writeFileSync(path.join(out,'game-files-check.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));

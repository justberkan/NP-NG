'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{DatabaseSync}=require('node:sqlite');
const dir=path.resolve(__dirname,'../../docs/codex-ekonomi'),raw=fs.readFileSync(path.join(dir,'competitive-economy.v1.json'),'utf8'),cfg=JSON.parse(raw),file=path.join(dir,'competitive-economy.v1.sqlite');
if(fs.existsSync(file))throw Error('Mevcut veritabanı korunuyor; otomatik üzerine yazılmaz.');
const db=new DatabaseSync(file);try{
 db.exec(fs.readFileSync(path.join(dir,'schema.sqlite.sql'),'utf8'));db.exec('BEGIN IMMEDIATE');
 db.prepare('INSERT INTO economy_configs VALUES(?,?,?)').run(cfg.version,raw,crypto.createHash('sha256').update(raw).digest('hex'));
 const insert=db.prepare('INSERT INTO catalog_items VALUES(?,?,?,?,?)');for(const i of cfg.items)insert.run(cfg.version,i.id,i.price,i.killReward,JSON.stringify(i));
 db.exec('COMMIT');console.log('Hazır SQLite: '+cfg.items.length+' katalog öğesi; maç/hesap/cüzdan yok.');
}finally{db.close()}

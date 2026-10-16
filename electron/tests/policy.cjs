'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {gameURL,canNavigate,shortcut,PERFORMANCE_SWITCHES}=require('../policy.cjs');
test('Yalnız HTTP(S) sunucular; dosya/komut/kimlik bilgisi reddedilir',()=>{
 for(const u of ['file:///C:/test','javascript:alert(1)','data:text/html,abc','https://u:p@example.com','not a url',null,'x'.repeat(2049)])assert.throws(()=>gameURL(u));
 assert.equal(gameURL(' http://localhost:3000 '),'http://localhost:3000/');assert.equal(gameURL('https://demo.trycloudflare.com/'),'https://demo.trycloudflare.com/');
});
test('Oyun başka kaynağa yönlenemez',()=>{
 assert.ok(canNavigate('https://npng.example/path','https://npng.example'));assert.ok(!canNavigate('https://npng.example.evil/path','https://npng.example'));assert.ok(!canNavigate('file:///C:/','https://npng.example'));
});
test('W/R ve oyun tuşları korunur; tarayıcı pencere/sekme kısayolları engellenir',()=>{
 assert.equal(shortcut({key:'w',control:true}),'close');assert.equal(shortcut({key:'r',control:true}),'reload');assert.equal(shortcut({key:'F5'}),'reload');assert.equal(shortcut({key:'F11'}),'fullscreen');
 for(const key of ['l','n','t','p','o','s','q'])assert.equal(shortcut({key,control:true}),'block');
 assert.equal(shortcut({key:'w'}),'game');assert.equal(shortcut({key:'Escape'}),'game');assert.equal(shortcut({key:'F4',alt:true}),'game');assert.equal(shortcut({key:'w',control:true,shift:true}),'block');
});
test('Zorunlu beş performans anahtarı mevcut',()=>{
 for(const s of ['disable-frame-rate-limit','disable-gpu-vsync','force_high_performance_gpu','disable-background-timer-throttling','disable-renderer-backgrounding'])assert.ok(PERFORMANCE_SWITCHES.includes(s));
});

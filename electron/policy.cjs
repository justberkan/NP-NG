'use strict';
const PERFORMANCE_SWITCHES=Object.freeze([
 'disable-frame-rate-limit','disable-gpu-vsync','force_high_performance_gpu',
 'disable-background-timer-throttling','disable-renderer-backgrounding'
]);
function gameURL(value){
 if(typeof value!=='string'||value.length>2048)throw new Error('Geçerli bir sunucu adresi yaz.');
 let u;try{u=new URL(value.trim())}catch(e){throw new Error('Adres http:// veya https:// ile başlamalı.');}
 if(!['http:','https:'].includes(u.protocol)||!u.hostname||u.username||u.password)throw new Error('Yalnız kullanıcı adı/şifre içermeyen HTTP veya HTTPS oyun adresi kullanılabilir.');
 return u.href;
}
function canNavigate(value,origin){try{return new URL(gameURL(value)).origin===origin}catch(e){return false}}
function shortcut(input){
 const key=String(input.key||'').toLowerCase(),ctrl=input.control||input.meta;
 if(key==='f11')return 'fullscreen';
 if(key==='f5'||ctrl&&!input.shift&&!input.alt&&key==='r')return 'reload';
 if(ctrl&&!input.shift&&!input.alt&&key==='w')return 'close';
 if(ctrl&&['l','n','t','p','o','s','u','q','w','r','i','j','d','h'].includes(key))return 'block';
 if(input.alt&&['arrowleft','arrowright','home'].includes(key))return 'block';
 if(key==='browserback'||key==='browserforward')return 'block';
 return 'game';
}
module.exports={PERFORMANCE_SWITCHES,gameURL,canNavigate,shortcut};

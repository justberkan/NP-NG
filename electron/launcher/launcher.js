'use strict';
const form=document.getElementById('server-form'),address=document.getElementById('address'),button=document.getElementById('connect'),status=document.getElementById('status'),hint=document.getElementById('hint');
let remote='';
function mode(remoteMode){
 if(remoteMode){address.value=remote;address.placeholder='https://oyun-adresi.example';hint.textContent='Oyunun veya arkadaşının paylaştığı sunucu linkini yapıştır.';address.focus()}
 else{if(address.value&&!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(address.value))remote=address.value;address.value='http://localhost:3000/';hint.textContent='Önce oyun klasöründeki SUNUCU-BASLAT.bat dosyasını aç.'}
}
form.addEventListener('change',event=>{if(event.target.name==='server')mode(event.target.value==='remote')});
form.addEventListener('submit',async event=>{
 event.preventDefault();button.disabled=true;status.textContent='Sunucuya bağlanılıyor…';
 try{const result=await window.npngLauncher.connect(address.value);status.textContent=result.ok?'':result.error}
 catch(e){status.textContent='Bağlantı kurulamadı. Adresi kontrol edip yeniden dene.'}
 finally{button.disabled=false}
});
window.npngLauncher.onStatus(message=>{status.textContent=message});
window.npngLauncher.preferences().then(p=>{
 address.value=p.url;document.getElementById('version').textContent='v'+p.version;status.textContent=p.error||'';
 if(!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(p.url)){remote=p.url;form.querySelector('[value=remote]').checked=true;hint.textContent='Kaydedilmiş sunucu adresin.'}
}).catch(()=>{status.textContent='Kayıtlı adres okunamadı; yerel sunucuyu kullanabilirsin.'});

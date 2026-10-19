'use strict';
/* iOS Safari user-scalable=no'yu yok sayar: iki parmakla ve çift dokunmayla sayfa yakınlaşıp oyun bozuluyordu (Berkan, 2026-10-19).
   Oyun tuşları pointerdown kullandığı için bu engeller oyunu etkilemez; yazı kutularında çift dokunma serbest. */
if(typeof touch!=='undefined'&&touch){
 for(const ev of['gesturestart','gesturechange','gestureend'])document.addEventListener(ev,e=>e.preventDefault(),{passive:false});
 let _lastTap=0;
 document.addEventListener('touchend',e=>{const n=Date.now();if(n-_lastTap<320&&!(e.target&&e.target.closest&&e.target.closest('input,textarea,select')))e.preventDefault();_lastTap=n},{passive:false});
}
/* ===== Kontroller: tuş eşleme sistemi (Kimi) =====
   Her eylem için ana tuş + yedek tuş; fare tuşları atanabilir; çakışma uyarısı;
   varsayılana dönüş; localStorage'a kalıcı kayıt. Oyun davranışını değiştirmez,
   yalnızca tuş okuma yerlerini eşlemeden okur. */
const KDEF=[
 ['fwd','İleri','KeyW',null],['back','Geri','KeyS',null],['left','Sol','KeyA',null],['right','Sağ','KeyD',null],
 ['jump','Zıpla (bhop/süzül)','Space',null],
 ['crouch','Eğil / kay','KeyC','ControlLeft'],
 ['sprint','Hızlan (Naruto koşusu)','ShiftLeft','ShiftRight'],
 ['dash','Sınıf yeteneği (dash)','ShiftLeft','ShiftRight'],
 ['hook','Kanca','KeyQ',null],
 ['reload','Şarjör doldur','KeyR',null],
 ['wNext','Sonraki silah (açık dünya)','KeyR',null],
 ['slot1','Silah 1','Digit1',null],['slot2','Silah 2','Digit2',null],['slot3','Silah 3','Digit3',null],
 ['slot4','Silah 4','Digit4',null],['slot5','Silah 5','Digit5',null],['slot6','Silah 6','Digit6',null],['slot7','Silah 7','Digit7',null],
 ['sk1','Yetenek 1 / kart 1','Digit1',null],['sk2','Yetenek 2 / kart 2','Digit2',null],['sk3','Yetenek 3 / kart 3','Digit3',null],
 ['sk4','Yetenek 4 / kart 4','Digit4',null],['sk5','Yetenek 5 / kart 5','Digit5',null],
 ['interact','Etkileşim (E)','KeyE',null],
 ['auto','Otomatik savaş aç/kapat','KeyF',null],
 ['map','Harita','KeyM',null],
 ['med','İlk yardım çantası','KeyH',null],
 ['tp','Üçüncü şahıs görünüm','KeyV',null],
 ['grip','Tutuş değiştir (yakın dövüş)','KeyG',null],
 ['chat','Sohbet / onay','Enter','NumpadEnter'],
 ['ptt','Bas-konuş (mikrofon)','KeyB',null],
 ['raceFire','Yarış: özelliği ileri kullan','KeyF',null],
 ['raceBack','Yarış: özelliği geri kullan','KeyQ',null],
 ['raceDrop','Yarış: slot özelliğini yere bırak','KeyG',null],
 ['raceDrift','Yarış: el freni (drift)','Space',null],
 ['raceBoost','Yarış: nitro / art yakıcı','ShiftLeft',null]
];
let KB={};
function kReset(){
 KB={};
 for(const d of KDEF)KB[d[0]]={p:d[2],s:d[3]||null};
}
function kLoad(){
 kReset();
 try{
  const s=JSON.parse(localStorage.getItem('mmofps_kb')||'null');
  if(s&&typeof s==='object')for(const k in s){
   if(!KB[k]||!s[k]||typeof s[k]!=='object')continue;
   if(typeof s[k].p==='string')KB[k].p=s[k].p;
   KB[k].s=(typeof s[k].s==='string')?s[k].s:null;
  }
 }catch(e){}
}
function kSave(){try{localStorage.setItem('mmofps_kb',JSON.stringify(KB))}catch(e){}}
kLoad();
/* e.code'un bağlı olduğu eylemi bul (çakışma denetimi) */
function kOwner(code){
 if(!code)return null;
 for(const k in KB){const b=KB[k];if(b.p===code||b.s===code)return k}
 return null;
}
function kName(id){const d=KDEF.find(x=>x[0]===id);return d?d[1]:id}
/* atama; çakışan eylem kimliği varsa onu döndürür (uyarı için), atama yine de yapılır */
function kSet(id,slot,code){
 const o=kOwner(code);
 if(!KB[id])return null;
 KB[id][slot==='s'?'s':'p']=code;kSave();
 return o&&o!==id?o:null;
}
/* olay eylemin tuşlarıyla eşleşiyor mu (ana ya da yedek) */
function kMatch(e,id){
 const b=KB[id];if(!b)return false;
 return e.code===b.p||e.code===b.s;
}
/* basılı tutma durumu (fizik döngüsü): key[] ham izleme üzerinden */
function kDown(id){
 const b=KB[id];if(!b)return false;
 return (b.p&&key[b.p])===1||(b.s&&key[b.s])===1;
}
function kLabel(code){
 if(!code)return '—';
 if(code.startsWith('Mouse'))return ['Sol tık','Orta tık','Sağ tık','Geri','İleri'][+code.slice(5)]||code;
 if(code.startsWith('Key'))return code.slice(3);
 if(code.startsWith('Digit'))return code.slice(5);
 if(code.startsWith('Numpad'))return 'Num '+code.slice(6);
 const M={Space:'Space',ShiftLeft:'Shift',ShiftRight:'Shift Sağ',ControlLeft:'Ctrl',ControlRight:'Ctrl Sağ',AltLeft:'Alt',AltRight:'Alt Sağ',Enter:'Enter',Escape:'Esc',Tab:'Tab',Backspace:'Geri Al',CapsLock:'Caps',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'};
 return M[code]||code;
}
/* ----- Ayarlar sekmesi HTML ----- */
function kontrollerHTML(){
 const rows=KDEF.map(d=>{
  const b=KB[d[0]];
  return `<div class='sr2 kb2' data-kr='${d[0]}'><span>${d[1]}</span><b class='kbb' data-kb='${d[0]}' data-sl='p' title='Ana tuşa basarak değiştir'>${kLabel(b.p)}</b><b class='kbb alt' data-kb='${d[0]}' data-sl='s' title='Yedek tuşa basarak değiştir'>${kLabel(b.s)}</b></div>`;
 }).join('');
 return `<div class='pn2'><h3>Kontroller</h3><p class='note'>Değiştirmek için kutuya bas, sonra yeni tuşa bas. Fare tuşları da atanır (sol/sağ/orta tık). Aynı tuş birden çok eylemde kullanılabilir; çakışma olursa uyarı çıkar. Atamalar bu tarayıcıda kalıcıdır.</p>${rows}<div class='row' style='margin-top:10px'><button class='btn alt' id='kb-rst'>Varsayılana dön</button></div><p class='ms' id='kb-msg'></p></div>`;
}
/* yakalama: bir kezlik dinleyici ile tuş/fare okur; cb(code) */
function kCapture(cb){
 const fin=code=>{
  removeEventListener('keydown',kd,true);removeEventListener('mousedown',md,true);
  document.removeEventListener('contextmenu',cx,true);
  document.body.classList.remove('kb-cap');
  cb(code);
 };
 const kd=e=>{e.preventDefault();e.stopPropagation();if(e.code==='Escape')fin(null);else fin(e.code)};
 const md=e=>{e.preventDefault();e.stopPropagation();fin('Mouse'+e.button)};
 const cx=e=>e.preventDefault();
 addEventListener('keydown',kd,true);addEventListener('mousedown',md,true);
 document.addEventListener('contextmenu',cx,true);
 document.body.classList.add('kb-cap');
}
function kontrollerWire(a){
 a.querySelectorAll('[data-kb]').forEach(el=>el.onclick=()=>{
  const id=el.dataset.kb,sl=el.dataset.sl;
  el.textContent='… tuşa bas';el.classList.add('wait');
  kCapture(code=>{
   el.classList.remove('wait');
   if(!code){el.textContent=kLabel(KB[id][sl]);return}
   const c=kSet(id,sl,code);
   el.textContent=kLabel(code);
   const msg=a.querySelector('#kb-msg');
   if(msg)msg.textContent=c?`Uyarı: ${kLabel(code)} şu an "${kName(c)}" eyleminde kullanılıyor. İki eylem de aynı tuşla çalışır; farklı modlardaysa sorun olmaz.`:'';
  });
 });
 const rst=a.querySelector('#kb-rst');
 if(rst)rst.onclick=()=>{kReset();kSave();const msg=a.querySelector('#kb-msg');if(msg)msg.textContent='Varsayılan tuşlara dönüldü.';a.querySelectorAll('[data-kb]').forEach(el=>{el.textContent=kLabel(KB[el.dataset.kb][el.dataset.sl])})};
}

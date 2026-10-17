'use strict';
/* Yerde hareket. 1415'teki "kademeli ivmelenme/fren" karşı tuşla duruşu ~0.25 sn'ye çıkarmıştı
   (tests/movement.cjs: "Karşı tuşla duruş 100 ms altında" FAIL). Krunker tarzı keskin his için
   1415 öncesi formül geri alındı: hız hedefe yürürken 12/sn, bırakınca 20/sn üstel yaklaşır. Son hızlar değişmedi.
   p.groundAccel animasyon tarafında okunabilsin diye yaklaşık ivme olarak tutulur. */
const AthleticMotion={
 ground(p,wx,wz,maxSpeed,dt,sprint){
  const moving=(wx||wz)?1:0,k=Math.min(1,(moving?12:20)*dt);
  const ax=(wx*maxSpeed-p.vx)*k,az=(wz*maxSpeed-p.vz)*k;
  p.vx+=ax;p.vz+=az;p.groundAccel=dt>0?Math.hypot(ax,az)/dt:0;
 }
};

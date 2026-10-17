
'use strict';

const WC = {
  totalRounds: 100, maxAlive: 5, gap: 30,
  startHalfWidth: 4, widenPerSpawner: 0.12,
  spawnInterval: .06, bossEvery: 10,
  zombiesPerRound: r => 5 * r,
  spawnerHp: r => 60 + r * 5,
  zombie: { hp: r => 40 + r * 3, dmg: r => 8 + r * 0.2, speed: r => 2.4 + Math.min(r * 0.03, 2.2) },
  boss: { hp: r => 600 + r * 120, dmg: r => 20 + r * 0.6, speed: 2.2, scale: 2.2 },
  rise: { duration: 1.2, depth: 2.6, stagger: 0.3 },
  drops: { ammo: 0.35, health: 0.08, lifetime: 15 },
  reward: r => (r <= 20 ? 300 : r <= 50 ? 600 : r <= 80 ? 1200 : r <= 99 ? 2500 : 0),
  finalReward: 100000,
};

/*
 api (oyunun gerçek sistemlerine bağlanacak):
   getPlayers()            -> [{ position:{x,z}, alive:boolean }]
   spawnZombie(opts)       -> zombie  // opts: {x,y,z,hp,damage,speed,boss,scale}
                              // zombie: { object3D, alive } ; ölünce oyun zombie.onDeath?.(zombie) çağırmalı
   addMoney(amount)        // tüm oyunculara/takıma
   healAllAlive()          // hayatta olanların canı %100
   dropPickup(type, pos, lifetime) // type: "ammo" | "health"
   endGame(win, stats)     // stats: {round, earned}
   ui: { message(text), hud({round,total,alive,queue,spawnerHp,spawnerMax,bossHp}) }
*/
class WaveCorridor {
  constructor(scene, api, cfg = WC) {
    this.scene = scene; this.api = api; this.c = cfg;
    this.state = "idle"; this.round = 1; this.idx = 0; this.queue = 0;
    this.bossPending = false; this.broken = 0; this.earned = 0;
    this.spawnCd = 0; this.half = cfg.startHalfWidth; this.targetHalf = this.half;
    this.sp = { hp: 1, max: 1 };
    this.active = new Set(); this.rising = [];
    this.spawnerHitbox = []; this.spawners = [];
    this._build();
  }

  /* ---------- Harita ve spawner mimarisi ---------- */
  _build() {
    const c = this.c, len = c.totalRounds * c.gap + 100;
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x59616b });
    const wallGeo = new THREE.BoxGeometry(1, 10, len);
    this.wallL = new THREE.Mesh(wallGeo, wallMat); this.wallR = new THREE.Mesh(wallGeo, wallMat);
    this.wallL.position.set(-c.startHalfWidth - 0.5, 5, -len / 2 + 50);
    this.wallR.position.set(c.startHalfWidth + 0.5, 5, -len / 2 + 50);
    this.scene.add(this.wallL, this.wallR);
    this.matIdle = new THREE.MeshLambertMaterial({color:0x080d12});
    this.matActive = new THREE.MeshLambertMaterial({color:0x0c151a,emissive:0x010204});
    this.hitMat=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
    const bars=[],P=(w,h,d,x,y,z)=>bars.push({w,h,d,x,y,z,c:0xffffff});
    for(const y of [-1.16,1.16]){P(2.5,.16,2.5,0,y,0)}
    for(const x of [-1.17,1.17])for(const z of [-1.17,1.17])P(.18,2.4,.18,x,0,z);
    for(const k of [-.72,-.24,.24,.72]){P(.09,2.3,.09,k,0,1.2);P(.09,2.3,.09,k,0,-1.2);P(.09,2.3,.09,-1.2,0,k);P(.09,2.3,.09,1.2,0,k)}
    for(const y of [-.6,0,.6]){P(2.4,.09,.09,0,y,1.2);P(2.4,.09,.09,0,y,-1.2);P(.09,.09,2.4,-1.2,y,0);P(.09,.09,2.4,1.2,y,0)}
    const cageGeo=mergeBoxes(bars).geometry,hitGeo=new THREE.BoxGeometry(2.5,2.5,2.5);
    const flameGeo=mergeBoxes([{w:.2,h:.65,d:.2,x:.4,y:-.55,z:.35,c:0xff8d13},{w:.25,h:.9,d:.22,x:-.45,y:-.42,z:-.25,c:0xffcc29},{w:.18,h:.48,d:.18,x:.4,y:.35,z:-.4,c:0xffe77c}]).geometry;
    this.flameMat=new THREE.MeshBasicMaterial({vertexColors:true});
    const dollGeo=mergeBoxes([{w:.48,h:.45,d:.45,x:0,y:.38,z:0,c:0x507f35},{w:.42,h:.6,d:.28,x:0,y:-.13,z:0,c:0x226d78},{w:.17,h:.4,d:.2,x:-.13,y:-.61,z:0,c:0x293a80},{w:.17,h:.4,d:.2,x:.13,y:-.61,z:0,c:0x293a80},{w:.15,h:.15,d:.5,x:-.31,y:.08,z:.2,c:0x507f35},{w:.15,h:.15,d:.5,x:.31,y:.08,z:.2,c:0x507f35}]).geometry;
    this.dollMat=new THREE.MeshLambertMaterial({vertexColors:true});
    for(let i=0;i<c.totalRounds;i++){
      const m=new THREE.Mesh(hitGeo,this.hitMat);m.position.set(0,1.25,this.spawnerZ(i));m.userData={spawner:true,tg:1};m.visible=false;
      const cage=new THREE.Mesh(cageGeo,this.matIdle),fire=new THREE.Mesh(flameGeo,this.flameMat),doll=new THREE.Mesh(dollGeo,this.dollMat);doll.scale.setScalar(.7);
      m.add(cage,fire,doll);m.userData.cage=cage;m.userData.doll=doll;m.userData.fire=fire;this.scene.add(m);this.spawners.push(m);
    }
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#303639';ctx.fillRect(0,0,128,128);
    for(let row=0;row<4;row++)for(let col=-1;col<4;col++){const value=91+((row*37+col*17+127)%35);ctx.fillStyle='rgb('+value+','+(value+3)+','+value+')';ctx.fillRect(col*48+(row%2)*24+2,row*32+2,44,28)}
    this.stoneTexture=new THREE.CanvasTexture(canvas);this.stoneTexture.wrapS=this.stoneTexture.wrapT=THREE.RepeatWrapping;this.stoneTexture.repeat.set(3,3);this.stoneTexture.magFilter=THREE.NearestFilter;
    this.gate=new THREE.Mesh(new THREE.BoxGeometry(1,8,.8),new THREE.MeshLambertMaterial({map:this.stoneTexture}));this.scene.add(this.gate);this.syncGate();
  }
  spawnerZ(i) { return -this.c.gap * (i + 1); }
  activateSpawner(m){if(m?.userData.cage)m.userData.cage.material=this.matActive}
  syncGate(){if(!this.gate)return;this.gate.position.set(0,4,this.spawnerZ(this.idx)-3.2);this.gate.scale.x=this.half*2;this.gate.visible=this.state!=='over';}
  getBounds() { return { halfWidth:this.half-1,minZ:this.spawnerZ(this.idx)-2.3 }; }

  start() { this.state = "spawner"; this._startSpawner(1); }

  _startSpawner(r) {
    this.round = r; this.idx = r - 1;
    this.sp.max = this.sp.hp = this.c.spawnerHp(r);
    const m = this.spawners[this.idx];m.visible=true; this.activateSpawner(m);this.syncGate();
    this.spawnerHitbox = [m]; this.state = "spawner";
    this.api.ui.message(`Tur ${r}/${this.c.totalRounds}: Spawner’ı kır!`);
  }

  /* ---------- Spawner kırılma → ödül + duvar + tur başlangıcı ---------- */
  damageSpawner(dmg) {
    if (this.state !== "spawner") return;
    if(!Number.isFinite(dmg)||dmg<=0)return; this.sp.hp = Math.max(0,this.sp.hp-dmg);
    if (this.sp.hp <= 0) this._breakSpawner();
  }
  _breakSpawner() {
    const c = this.c;
    this.spawners[this.idx].visible = false; this.spawnerHitbox = [];
    this.broken++; this.targetHalf = c.startHalfWidth + this.broken * c.widenPerSpawner;
    const rw = c.reward(this.round);
    if (rw > 0) { this.api.addMoney(rw); this.earned += rw; }   // anında ara ödül
    const boss = this.round % c.bossEvery === 0;
    this.bossPending = boss;
    this.queue = boss ? 0 : c.zombiesPerRound(this.round);
    this.batchI = 0; this.spawnCd = 1; this.state = "round";
    this.api.ui.message(boss ? `BOSS! +${rw} TL` : `Tur ${this.round} başladı +${rw} TL`);
  }

  /* ---------- Spawn queue + boss ---------- */
  spawnPosition(boss){
    const limit=Math.max(.5,this.half-1.1),base=this.spawnerZ(this.idx)+5,players=this.api.getPlayers().filter(p=>p.alive&&p.position);let best={x:0,z:base},score=-Infinity;
    for(let row=0;row<4;row++)for(const t of [-1,-.5,0,.5,1]){
      const x=t*limit,z=base+row*2.3;let clearance=8;
      for(const e of this.active)clearance=Math.min(clearance,Math.hypot(x-e.object3D.position.x,z-e.object3D.position.z));
      for(const p of players)clearance=Math.min(clearance,Math.hypot(x-p.position.x,z-p.position.z)-.3);
      const value=clearance-row*.12-Math.abs(t)*.01;if(value>score){score=value;best={x,z}}
    }return best;
  }
  _spawn(boss, delay) {
    if (this.active.size >= this.c.maxAlive) return;            // sert üst sınır
    const c = this.c, r = this.round, d = boss ? c.boss : c.zombie;
    const spot=this.spawnPosition(boss);
    const z = this.api.spawnZombie({
      x:spot.x, y:-c.rise.depth, z:spot.z,
      hp: d.hp(r), damage: d.dmg(r), speed: boss ? d.speed : d.speed(r),
      boss, scale: boss ? d.scale : 1,
    });
    z.frozen = true;
    z.onDeath = zz => this._onDeath(zz);
    this.active.add(z); this.rising.push({ z, t: -delay });
  }
  _onDeath(z) {
    if(!this.active.delete(z))return;
    this.rising=this.rising.filter(e=>e.z!==z);
    const p = z.object3D.position, dr = this.c.drops, k = z.boss ? 1 : Math.random();
    if (z.boss) { this.api.dropPickup("ammo", p, dr.lifetime); this.api.dropPickup("health", p, dr.lifetime); }
    else if (k < dr.ammo) this.api.dropPickup("ammo", p, dr.lifetime);
    else if (k < dr.ammo + dr.health) this.api.dropPickup("health", p, dr.lifetime);
    if(this.state==="round"&&this.queue>0&&!this.bossPending&&this.active.size<this.c.maxAlive){this._spawn(false,0);this.queue--;}
  }
  _roundLogic(dt) {
    this.spawnCd -= dt;
    if (this.spawnCd <= 0) {
      if (this.bossPending) { this._spawn(true, 0); this.bossPending = false; }   // boss varken normal spawn yok
      else if(this.queue>0&&this.active.size<this.c.maxAlive){
        this._spawn(false,0);this.queue--;this.spawnCd=this.c.spawnInterval;
      }
    }

    if (!this.bossPending && this.queue === 0 && this.active.size === 0) this._roundDone();
  }

  /* ---------- Can yenileme + sonraki tur / final ödülü ---------- */
  _roundDone() {
    this.api.wallCleared?.();this.gate.visible=false;
    this.api.healAllAlive();
    if (this.round >= this.c.totalRounds) {
      this.api.addMoney(this.c.finalReward); this.earned += this.c.finalReward;
      this.state = "over"; return this.api.endGame(true, { round: this.round, earned: this.earned });
    }
    this.api.ui.message("Tur tamam! Can yenilendi");
    this._startSpawner(this.round + 1);
  }

  /* ---------- Her karede çağır ---------- */
  update(dt) {
    if (this.state !== "spawner" && this.state !== "round") return;
    const c = this.c;
    if (!this.api.getPlayers().some(p => p.alive)) {               // co-op: herkes öldü
      this.state = "over"; return this.api.endGame(false, { round: this.round, earned: this.earned });
    }
    this.half += (this.targetHalf - this.half) * Math.min(1, dt * 2);   // duvar genişleme
    this.syncGate();const doll=this.spawners[this.idx]?.userData.doll;if(doll)doll.rotation.y+=dt*.9;this.flameT=(this.flameT||0)+dt;const fire=this.spawners[this.idx]?.userData.fire;if(fire)fire.scale.y=.9+Math.sin(this.flameT*12)*.1;
    this.wallL.position.x = -(this.half + 0.5); this.wallR.position.x = this.half + 0.5;
    for (let i = this.rising.length - 1; i >= 0; i--) {                 // doğuş animasyonu
      const e = this.rising[i]; e.t += dt;
      if (!e.z.alive) { this.rising.splice(i, 1); continue; }
      const k = Math.min(1, Math.max(0, e.t / c.rise.duration));
      e.z.object3D.position.y = -c.rise.depth * (1 - k);
      if (e.t >= c.rise.duration) { e.z.frozen = false; e.z.object3D.position.y = 0; this.rising.splice(i, 1); }
    }
    if (this.state === "round") this._roundLogic(dt);
    const boss = [...this.active].find(z => z.boss && z.alive);
    this.api.ui.hud({ round: this.round, total: c.totalRounds, alive: this.active.size, queue: this.queue,
      spawnerHp: this.state === "spawner" ? this.sp.hp : null, spawnerMax: this.sp.max, bossHp: boss ? boss.hp : null });
  }

  dispose() {
    const gs=new Set(),ms=new Set([this.matIdle,this.matActive]);
    for(const m of [this.wallL,this.wallR,this.gate,...this.spawners]){this.scene.remove(m);m.traverse(o=>{if(o.isMesh){gs.add(o.geometry);ms.add(o.material)}})}
    this.stoneTexture.dispose();
    for(const g of gs)g.dispose();for(const m of ms)m.dispose();this.active.clear();this.rising.length=0;this.spawnerHitbox=[];
  }
}

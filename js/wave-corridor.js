
'use strict';

const WC = {
  totalRounds: 100, maxAlive: 12, gap: 30,
  startHalfWidth: 4, widenPerSpawner: 0.12,
  batchSizes: [5, 6], bossEvery: 10,
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
    this.batchI = 0; this.bossPending = false; this.broken = 0; this.earned = 0;
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
    const geo = new THREE.CylinderGeometry(1.4, 1.8, 2.4, 12);
    this.matIdle = new THREE.MeshLambertMaterial({ color: 0x552222 });
    this.matActive = new THREE.MeshLambertMaterial({ color: 0xff3322, emissive: 0x881100 });
    for (let i = 0; i < c.totalRounds; i++) {
      const m = new THREE.Mesh(geo, this.matIdle);
      m.position.set(0, 1.2, this.spawnerZ(i)); m.userData.spawner = true; m.userData.tg=1;
      this.scene.add(m); this.spawners.push(m);
    }
  }
  spawnerZ(i) { return -this.c.gap * (i + 1); }
  getBounds() { return { halfWidth: this.half - 1, minZ: this.spawnerZ(this.idx) + (this.state === "round" ? 4 : 2.5) }; }

  start() { this.state = "spawner"; this._startSpawner(1); }

  _startSpawner(r) {
    this.round = r; this.idx = r - 1;
    this.sp.max = this.sp.hp = this.c.spawnerHp(r);
    const m = this.spawners[this.idx]; m.material = this.matActive;
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
  _spawn(boss, delay) {
    if (this.active.size >= this.c.maxAlive) return;            // sert üst sınır
    const c = this.c, r = this.round, d = boss ? c.boss : c.zombie;
    const z = this.api.spawnZombie({
      x: (Math.random() - 0.5) * 3, y: -c.rise.depth, z: this.spawnerZ(this.idx) + 5,
      hp: d.hp(r), damage: d.dmg(r), speed: boss ? d.speed : d.speed(r),
      boss, scale: boss ? d.scale : 1,
    });
    z.frozen = true;
    z.onDeath = zz => this._onDeath(zz);
    this.active.add(z); this.rising.push({ z, t: -delay });
  }
  _onDeath(z) {
    if(!this.active.delete(z))return;
    const p = z.object3D.position, dr = this.c.drops, k = z.boss ? 1 : Math.random();
    if (z.boss) { this.api.dropPickup("ammo", p, dr.lifetime); this.api.dropPickup("health", p, dr.lifetime); }
    else if (k < dr.ammo) this.api.dropPickup("ammo", p, dr.lifetime);
    else if (k < dr.ammo + dr.health) this.api.dropPickup("health", p, dr.lifetime);
  }
  _roundLogic(dt) {
    this.spawnCd -= dt;
    if (this.spawnCd <= 0) {
      if (this.bossPending) { this._spawn(true, 0); this.bossPending = false; }   // boss varken normal spawn yok
      else if (this.queue > 0) {
        const n = Math.min(this.c.batchSizes[this.batchI % 2], this.queue);
        if (this.active.size + n <= this.c.maxAlive) {
          for (let i = 0; i < n; i++) this._spawn(false, i * this.c.rise.stagger);
          this.queue -= n; this.batchI++; this.spawnCd = 0.6;
        }
      }
    }
    if (!this.bossPending && this.queue === 0 && this.active.size === 0) this._roundDone();
  }

  /* ---------- Can yenileme + sonraki tur / final ödülü ---------- */
  _roundDone() {
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
    for(const m of [this.wallL,this.wallR,...this.spawners]){this.scene.remove(m);gs.add(m.geometry);ms.add(m.material)}
    for(const g of gs)g.dispose();for(const m of ms)m.dispose();this.active.clear();this.rising.length=0;this.spawnerHitbox=[];
  }
}

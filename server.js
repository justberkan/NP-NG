'use strict';
/* =====================================================================
   MMOFPS Online - Çevrimiçi Arena sunucusu
   Ek paket GEREKTİRMEZ. Sadece Node.js (v16+) yeterli.
   Başlatma:  node server.js [port]      (Windows: SUNUCU-BASLAT.bat)
   Hem oyunu (http) hem de oyuncu bağlantılarını (WebSocket) sunar.
   Hesaplar (kullanıcı adı + şifre) ve oyuncu kayıtları data/accounts.json dosyasında saklanır (bu dosyayı yedekle!).
   Sunucu şunları denetler: hasar (silah tablosundan), ateş hızı, menzil,
   ölüm / yeniden doğma, skor. Hareket istemciden gelir (hız sınırı vardır).
   ===================================================================== */
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const PORT = +process.env.PORT || +process.argv[2] || 3000;
const ROOT = __dirname;
const MAXP = 12, KILL_LIMIT = 20, TM_LIMIT = 30, RESPAWN_MS = 3000, PROTECT_MS = 2000, NEXT_ROUND_MS = 10000;
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/* Silah tablosu (oyundaki WP ile aynı değerler). d=hasar, r=ateş aralığı (sn), m=yakın dövüş menzili */
const WPN = {
  rifle: { d: 25, r: .1 }, smg: { d: 15, r: .065 }, pistol: { d: 35, r: .26 }, dual: { d: 22, r: .13 },
  knife: { d: 50, r: .32, m: 2.6 }, sword: { d: 80, r: .6, m: 3.4 }, gsword: { d: 140, r: 1.05, m: 4.2 }
};
const {createValidator,LIMITS:HIT_LIMITS}=require('./server-hit-validation');
const HIT=createValidator();
const SPAWNS = [];
const WCNET = require('./server-wavecorridor')({send,weapons:WPN});
const HORNET = require('./server-horror')({send,weapons:WPN});
for (const x of [-10, -5, 0, 5, 10]) { SPAWNS.push([x, 24]); SPAWNS.push([x, -24]); }

/* ---------- HTTP: oyun dosyalarını sun ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.webp': 'image/webp', '.jpeg': 'image/jpeg', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  // Yalnız istemci dosyalarını sun; Git, hesaplar ve yedekler web kökü değildir.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end('405'); return; }
  let u;
  try { u = decodeURIComponent((req.url || '/').split('?')[0]); }
  catch (e) { res.writeHead(400); res.end('400'); return; }
  if (u === '/api/info') { res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify({ game: 'mmofps', players: totalPlayers(), max: MAXP })); return; }
  if (u === '/') u = '/index.html';
  const parts = u.split('/');
  const publicPath = u === '/index.html' || /^\/(assets|js|css|lib)\//.test(u);
  if (!publicPath || /[\\\0:]/.test(u) || parts.some(s => s.startsWith('.'))) { res.writeHead(403); res.end('403'); return; }
  const f = path.normalize(path.join(ROOT, u));
  if (!f.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end('403'); return; }
  fs.realpath(f, (err, real) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    // assets içinden dışarıya veya özel dizinlere verilen sembolik bağları da engelle.
    const relative = path.relative(fs.realpathSync(ROOT), real).split(path.sep).join('/');
    if (relative !== 'index.html' && (!/^(assets|js|css|lib)\//.test(relative) || relative.split('/').some(s => s.startsWith('.')))) { res.writeHead(403); res.end('403'); return; }
    fs.readFile(real, (e, d) => {
      if (e) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(d);
    });
  });
});

/* ---------- WebSocket (RFC 6455, bağımlılıksız) ---------- */
function frame(op, payload) {
  const n = payload.length; let h;
  if (n < 126) h = Buffer.from([0x80 | op, n]);
  else if (n < 65536) { h = Buffer.alloc(4); h[0] = 0x80 | op; h[1] = 126; h.writeUInt16BE(n, 2); }
  else { h = Buffer.alloc(10); h[0] = 0x80 | op; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); }
  return Buffer.concat([h, payload]);
}
function send(c, o) { if (c.sock.writable) { try { c.sock.write(frame(1, Buffer.from(JSON.stringify(o)))); } catch (e) { } } }
function bcast(o, except) { const b = frame(1, Buffer.from(JSON.stringify(o))); for (const c of players.values()) if (c !== except && c.sock.writable) { try { c.sock.write(b); } catch (e) { } } }

server.on('upgrade', (req, sock) => {
  if (String(req.headers.upgrade).toLowerCase() !== 'websocket' || !req.headers['sec-websocket-key']) { sock.destroy(); return; }
  const acc = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + GUID).digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n');
  sock.setNoDelay(true);
  const ip = String(req.headers['cf-connecting-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || sock.remoteAddress);
  const lo = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(sock.remoteAddress) && !req.headers['cf-connecting-ip'] && !req.headers['x-forwarded-for'] && !req.headers['x-real-ip'];
  const c = { ip, local: lo, user: null, acc: null, sock, buf: Buffer.alloc(0), frag: null, id: 0, joined: false, seen: Date.now(), msgs: 0, msgT: Date.now() };
  sock.on('data', d => { c.buf = Buffer.concat([c.buf, d]); c.seen = Date.now(); parse(c); });
  conns.add(c);
  sock.on('close', () => { WCNET.leave(c); HORNET.leave(c); BJ.leave(c); leave(c); owLeave(c); conns.delete(c); if (c.user && users.get(c.user) === c) users.delete(c.user); });
  sock.on('error', () => { try { sock.destroy(); } catch (e) { } });
});
function parse(c) {
  for (; ;) {
    const b = c.buf; if (b.length < 2) return;
    const fin = b[0] & 0x80, op = b[0] & 0x0f, masked = b[1] & 0x80; let len = b[1] & 0x7f, off = 2;
    if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
    if (len > 2000000) { c.sock.destroy(); return; }
    const hd = off + (masked ? 4 : 0), need = hd + len;
    if (b.length < need) return;
    const payload = Buffer.from(b.subarray(hd, need));
    if (masked) { const m = b.subarray(off, off + 4); for (let i = 0; i < payload.length; i++) payload[i] ^= m[i & 3]; }
    c.buf = b.subarray(need);
    if (op === 8) { try { c.sock.end(frame(8, Buffer.alloc(0))); } catch (e) { } return; }
    if (op === 9) { try { c.sock.write(frame(10, payload)); } catch (e) { } continue; }
    if (op === 1 || op === 0) {
      if (op === 1) c.frag = [payload]; else if (c.frag) c.frag.push(payload);
      if (fin && c.frag) { const s = Buffer.concat(c.frag).toString('utf8'); c.frag = null; onText(c, s); }
    }
  }
}

/* ---------- Hesaplar ---------- */
const DATA = process.env.MMOFPS_DATA || path.join(ROOT, 'data'), ACC_F = path.join(DATA, 'accounts.json');
let ACC = {}; try { ACC = JSON.parse(fs.readFileSync(ACC_F, 'utf8')); } catch (e) { }
let accDirty = false;
function flushAcc() {
  if (!accDirty) return; accDirty = false;
  try { fs.mkdirSync(DATA, { recursive: true }); const t = ACC_F + '.tmp'; fs.writeFileSync(t, JSON.stringify(ACC)); if (fs.existsSync(ACC_F)) fs.copyFileSync(ACC_F, ACC_F + '.bak'); fs.renameSync(t, ACC_F); }
  catch (e) { console.log('Kayıt yazılamadı: ' + e.message); }
}
setInterval(flushAcc, 5000); process.on('exit', flushAcc); process.on('SIGINT', () => process.exit()); process.on('SIGTERM', () => process.exit());
// Windows: konsol penceresi kapatılınca SIGHUP, Ctrl+Break'te SIGBREAK gelir; hesaplar diske yazılıp çıkılsın
process.on('SIGHUP', () => process.exit()); if (process.platform === 'win32') process.on('SIGBREAK', () => process.exit());
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 32).toString('hex');
const users = new Map(), fails = new Map(), conns = new Set();
const BJ = require('./server-blackjack')({ send, users, ACC, dirty: () => { accDirty = true; }, log: s => console.log(s) }); // canlı blackjack masaları (2026-10-20)
console.log('Kayıtlı hesap sayısı: ' + Object.keys(ACC).length);

/* ---------- Oyun durumu ---------- */
let nextId = 1;
/* Odalar: 'ar' = serbest arena, 'tm:<harita>' = 5v5 takım (arena/dust2/mc). Tüm oda işlemleri useRoom ile odayı seçer. */
const ROOMS = new Map(); let CUR = null, players = new Map();
const TM_MAPS = ['arena', 'dust2', 'mc'];
function getRoom(key) {
  let r = ROOMS.get(key);
  if (!r) {
    const tm = key.indexOf('tm:') === 0, zo = key === 'zo';
    r = { key, kind: tm ? 'tm' : zo ? 'zo' : 'ar', map: tm ? key.slice(3) : 'arena', players: new Map(), roundOver: false, limit: tm ? TM_LIMIT : KILL_LIMIT, max: tm ? 10 : zo ? 8 : MAXP, tk: { 1: 0, 2: 0 },
      zs: new Map(), zid: 1, wave: 0, waveCd: 2, over: false };
    ROOMS.set(key, r);
  }
  return r;
}
function useRoom(r) { CUR = r; players = r ? r.players : new Map(); return r; }
function totalPlayers() { let n = 0; for (const r of ROOMS.values()) n += r.players.size; return n; }
const num = (v, lo, hi, d = 0) => (typeof v === 'number' && isFinite(v)) ? Math.max(lo, Math.min(hi, v)) : d;
const r2 = v => Math.round(v * 100) / 100;
const cleanName = s => String(s || 'Oyuncu').replace(/[<>&"'`\\]/g, '').trim().slice(0, 14) || 'Oyuncu';
const cleanMod = s => /^[a-z0-9_]{1,24}$/i.test(String(s)) ? String(s) : null;
const cleanId = s => /^[a-z0-9]{1,8}$/i.test(String(s)) ? String(s) : null;
function pickSpawn(except) {
  let best = SPAWNS[0], bd = -1;
  for (const s of SPAWNS) {
    let m = 1e9; for (const o of players.values()) if (o !== except && o.alive) m = Math.min(m, Math.hypot(o.x - s[0], o.z - s[1]));
    m += Math.random() * 6; if (m > bd) { bd = m; best = s; }
  }
  return best;
}
function pub(c) { return { id: c.id, name: c.name, ch: c.ch, w: c.w, sk: c.sk, mods: c.mods, team: c.team || 0, x: r2(c.x), y: r2(c.y), z: r2(c.z), yaw: r2(c.yaw), hp: c.hp, k: c.k, d: c.d }; }
function board() { return [...players.values()].sort((a, b) => b.k - a.k || a.d - b.d).map(c => [c.id, c.name, c.k, c.d, c.team || 0]); }
function sendBoard() { bcast({ t: 'board', b: board() }); }

function onText(c, s) {
  const now = Date.now();
  if (now - c.msgT > 1000) { c.msgT = now; c.msgs = 0; }
  if (++c.msgs > 150) return; // saniyede en fazla 150 mesaj
  let m; try { m = JSON.parse(s); } catch (e) { return; }
  if (!m || typeof m.t !== 'string') return;
  if (m.t.startsWith('wc_')) return WCNET.handle(c,m,now);
  if (m.t.startsWith('ic_')) return HORNET.handle(c,m,now);
  if (m.t === 'auth') return doAuth(c, m, now);
  if (m.t === 'save') {
    if (!c.acc || !m.data || typeof m.data !== 'object') return;
    const s = JSON.stringify(m.data); if (s.length > 1500000) return;
    // Çevrimdışı sınırsız para (1e9) ya da bozuk para hesaba yazılamaz: reddet, hesaptaki kaydı geri gönder.
    if (!saveMoneyOk(m.data)) { console.log('! ' + c.acc.name + ' geçersiz kayıt reddedildi (tl=' + String(m.data.tl).slice(0, 20) + ')'); send(c, { t: 'sfix', save: c.acc.save, ts: c.acc.ts }); return; }
    c.acc.save = m.data; c.acc.ts = now; accDirty = true; send(c, { t: 'saved', ts: c.acc.ts }); return;
  }
  if (m.t === 'aimscore') {
    if (!c.acc) return; const sc = Math.round(num(m.s, 0, 1e6)); c.acc.aim = Math.max(c.acc.aim || 0, sc); accDirty = true;
    const top = Object.keys(ACC).filter(k => ACC[k].aim).map(k => [ACC[k].name, ACC[k].aim]).sort((a, b) => b[1] - a[1]).slice(0, 10);
    send(c, { t: 'aimtop', top, me: c.acc.aim }); return;
  }
  if (m.t === 'quit') { if (c.rm) useRoom(c.rm); leave(c); owLeave(c); return; }
  if (m.t.startsWith('bj')) return BJ.handle(c, m, now);
  if (c.rm && c.joined) useRoom(c.rm);
  if (m.t === 'chat' || m.t === 'vj' || m.t === 'va' || m.t === 'vm') return chatMsg(c, m, now);
  if (m.t[0] === 'a' && m.t !== 'auth') { if (['alist', 'agive', 'aclr', 'akick', 'atools', 'aheal'].includes(m.t)) return admMsg(c, m); }
  if (m.t[0] === 'o' && owMsg(c, m, now)) return;
  if (m.t[0] === 'f' && frMsg(c, m)) return;
  if (m.t === 'join') {
    if (!c.acc) { send(c, { t: 'err', m: 'Önce giriş yapmalısın.' }); return; }
    if (c.joined) return;
    owLeave(c);
    const key = m.room === 'tm' && TM_MAPS.includes(m.map) ? 'tm:' + m.map : m.room === 'zo' ? 'zo' : 'ar';
    const rm = useRoom(getRoom(key));
    if (players.size >= rm.max) { send(c, { t: 'err', m: 'Oda dolu (' + rm.max + ' oyuncu).' }); return; }
    c.rm = rm; c.id = nextId++; c.joined = true;
    c.name = c.acc.name; c.ch = cleanId(m.ch) || 'c0'; c.w = WPN[m.w] ? m.w : 'rifle';
    c.sk = {}; if (m.sk && typeof m.sk === 'object') for (const k of Object.keys(WPN)) { const v = cleanId(m.sk[k]); if (v) c.sk[k] = v; }
    c.mods = {}; if (m.mods && typeof m.mods === 'object') for (const k of ['rifle', 'smg', 'pistol', 'knife']) { const v = cleanMod(m.mods[k]); if (v) c.mods[k] = v; }
    if (rm.kind === 'tm') { let a = 0, b = 0; for (const o of players.values()) { if (o.team === 1) a++; else b++; } c.team = a <= b ? 1 : 2; } else c.team = rm.kind === 'zo' ? 1 : 0;
    c.hp = 100; c.alive = true; c.k = 0; c.d = 0; c.inv = now + PROTECT_MS; c.last = {}; c.lt = now; c.free = now + 6000;
    const sp = pickSpawn(c); c.x = sp[0]; c.y = 0; c.z = sp[1]; c.yaw = sp[1] > 0 ? 0 : Math.PI; c.pitch = 0; c.vx = c.vz = 0; c.fl = 1; c.rq = -1; c.sw = -1; c.cb = 0; c.ad = 0;
    HIT.reset(c,now);
    send(c, { t: 'welcome', serverAt:now, wave: rm.wave, id: c.id, sp: { x: c.x, z: c.z }, limit: rm.limit, kind: rm.kind, map: rm.map, team: c.team, tk: rm.tk, players: [...players.values()].map(pub) });
    players.set(c.id, c); // kendisi hariç herkese duyur
    bcast({ t: 'join', p: pub(c) }, c); sendBoard();
    console.log('+ ' + c.name + ' katıldı [' + rm.key + (c.team ? ' T' + c.team : '') + '] (' + players.size + ' oyuncu)');
    return;
  }
  if (!c.joined) return;
  switch (m.t) {
    case 'zhit': return zHit(c, m, now);
    case 'aimscore': return;
    case 'st': { // konum + animasyon durumu
      if (!c.alive || CUR.roundOver) return;
      const dt = Math.max(.02, (now - c.lt) / 1000); c.lt = now;
      const BND = c.admin&&c.adtools?.noclip?10000:CUR.kind === 'tm' ? 400 : 80; let x = num(m.x, -BND, BND), y = num(m.y, c.admin&&c.adtools?.noclip?-500:-80, c.admin&&c.adtools?.noclip?500:120), z = num(m.z, -BND, BND);
      const dist = Math.hypot(x - c.x, y - c.y, z - c.z);
      if (!(c.admin&&c.adtools?.noclip) && now > (c.free || 0) && dist > 60 * dt + 4) { send(c, { t: 'fix', x: c.x, y: c.y, z: c.z }); return; } // ışınlanma / aşırı hız
      c.x = x; c.y = y; c.z = z; c.yaw = num(m.yaw, -50, 50); c.pitch = num(m.pitch, -1.6, 1.6);
      c.vx = num(m.vx, -60, 60); c.vz = num(m.vz, -60, 60); c.fl = num(m.f, 0, 511) | 0;
      if (WPN[m.w]) c.w = m.w;
      HIT.record(c,now,m.sentAt);
      c.rq = num(m.rq, -1, 1, -1); c.sw = num(m.sw, -1, 1, -1); c.cb = num(m.cb, 0, 15) | 0; c.ad = num(m.ad, 0, 1);
      break;
    }
    case 'fire': { // ateş efekti (tracer / namlu alevi)
      if (!c.alive || !WPN[m.w] || WPN[m.w].m) return;
      const W = WPN[m.w]; if (c.last['f' + m.w] && now - c.last['f' + m.w] < W.r * 1000 * .5) return; c.last['f' + m.w] = now;
      bcast({ t: 'fx', id: c.id, k: 'f', w: m.w, side: m.side === 2 ? 2 : 1, pt: [r2(num(m.x, -200, 200)), r2(num(m.y, -20, 100)), r2(num(m.z, -200, 200))] }, c);
      break;
    }
    case 'sw': { // yakın dövüş savuruşu
      if (!c.alive || !WPN[c.w] || !WPN[c.w].m) return;
      bcast({ t: 'fx', id: c.id, k: 's', w: c.w, cb: num(m.cb, 0, 15) | 0 }, c);
      break;
    }
    case 'hit': { // hasar iddiası: sunucu doğrular ve uygular
      const W = WPN[m.w], v = players.get(m.id | 0);
      if (!c.alive || CUR.roundOver || !W || !v || v === c || !v.alive || v.inv > now || (v.admin&&v.adtools?.god)) return;
      if (CUR.kind !== 'ar' && v.team === c.team) return; // dost ateşi yok
      const checked=HIT.validate(c,v,m,W,CUR.map,now);
      if(checked===false)return;
      if(checked===null){
        HIT.legacy();
        const key='h'+m.w,minGap=W.r*1000*(W.m?HIT_LIMITS.legacyMeleeRate:HIT_LIMITS.legacyGunRate);
        if(c.last[key]&&now-c.last[key]<minGap)return HIT.reject(c,m,'legacy-fire-rate',now);c.last[key]=now;
        const d=Math.hypot(c.x-v.x,c.y-v.y,c.z-v.z),reach=W.m?W.m+HIT_LIMITS.legacyMeleeSlack:(CUR.kind==='tm'?HIT_LIMITS.legacyGunTeamRange:HIT_LIMITS.legacyGunArenaRange);
        if(d>reach)return HIT.reject(c,m,'legacy-range',now);
      }
      const hd = !W.m && !!m.hd, dmg = W.d * (hd ? 2 : 1);
      v.hp -= dmg; v.lastBy = c.id;
      if (v.hp > 0) { bcast({ t: 'hp', id: v.id, hp: v.hp, by: c.id }); return; }
      v.hp = 0; v.alive = false; v.d++; c.k++;
      bcast({ t: 'hp', id: v.id, hp: 0, by: c.id });
      bcast({ t: 'die', id: v.id, by: c.id, w: m.w, hd, x: r2(v.x), y: r2(v.y), z: r2(v.z), kx: r2(c.x), kz: r2(c.z) });
      sendBoard();
      if (CUR.kind === 'tm') { CUR.tk[c.team]++; bcast({ t: 'tk', tk: CUR.tk }); if (CUR.tk[c.team] >= CUR.limit) return endRound(c); }
      else if (c.k >= CUR.limit) return endRound(c);
      { const rm = CUR; setTimeout(() => { useRoom(rm); respawn(v); }, RESPAWN_MS); }
      break;
    }
  }
}
/* Berkan kuralı (2026-10-19): çevrimdışı = para sınırsız ve kayıt yok; online hesap 31 TL ile başlar. */
const START_TL = 31, INF_TL = 1e9;
function saveMoneyOk(sv) { const t = sv && sv.tl; return typeof t === 'number' && Number.isFinite(t) && t < INF_TL; }
/* Eski açık: çevrimdışı 1e9 TL hesaplara sızdı. Girişte onarılır: sızan 1e9 düşülür, en az 31 TL kalır. */
function repairSave(a, now) {
  if (!a.save || typeof a.save !== 'object' || saveMoneyOk(a.save)) return;
  const old = a.save.tl, t = Number(old);
  a.save.tl = Number.isFinite(t) ? Math.max(START_TL, Math.round(t - INF_TL)) : START_TL;
  if (a.save.tl >= INF_TL) a.save.tl = START_TL;
  a.ts = now; accDirty = true; console.log('! ' + a.name + ' kaydı onarıldı: tl ' + old + ' -> ' + a.save.tl);
}
for (const k in ACC) repairSave(ACC[k], Date.now()); flushAcc(); // açılışta tüm hesaplar (admin listesi de doğru görünsün); onarım hemen diske
function doAuth(c, m, now) {
  if (c.user) return;
  const reply = (ok, err, extra) => send(c, Object.assign({ t: 'auth', ok, err }, extra || {}));
  const f = fails.get(c.ip);
  if (f && now - f[1] < 600000 && f[0] >= 8) return reply(0, 'Çok fazla yanlış deneme. 10 dakika bekle.');
  const bad = msg => { const q = fails.get(c.ip); if (!q || now - q[1] > 600000) fails.set(c.ip, [1, now]); else q[0]++; reply(0, msg); };
  const name = String(m.name || '').trim();
  if (!/^[A-Za-z0-9_ÇĞİÖŞÜçğıöşü]{3,14}$/.test(name)) return reply(0, 'Kullanıcı adı 3-14 karakter (harf, rakam, _) olmalı.');
  const key = name.toLowerCase(); let a = ACC[key];
  { const bu = BANS.get(key); if (bu && bu > now && !c.local) return reply(0, 'Admin seni geçici olarak attı. ' + Math.ceil((bu - now) / 60000) + ' dk sonra gir.'); }
  if (m.mode === 'register') {
    const pw = String(m.pass || ''); if (pw.length < 4 || pw.length > 64) return reply(0, 'Şifre 4-64 karakter olmalı.');
    if (a) return reply(0, 'Bu kullanıcı adı alınmış. Başka bir ad dene ya da giriş yap.');
    const salt = crypto.randomBytes(16).toString('hex');
    a = ACC[key] = { name, salt, hash: hashPw(pw, salt), toks: [], ts: 0, save: null, created: now };
    if (m.save && typeof m.save === 'object' && JSON.stringify(m.save).length < 1500000) { a.save = m.save; a.save.tl = START_TL; a.ts = now; }
    accDirty = true; flushAcc(); console.log('+ yeni hesap: ' + name); // yeni hesap hemen diske (Windows'ta zorla kapatmada 5 sn'lik kayıp olmasın)
  } else if (m.mode === 'token') {
    if (!a || typeof m.tok !== 'string' || !a.toks.includes(m.tok)) return reply(0, 'Oturum süresi dolmuş. Tekrar giriş yap.');
  } else {
    if (!a) return bad('Kullanıcı adı veya şifre yanlış.');
    const h = Buffer.from(hashPw(m.pass || '', a.salt), 'hex'), g = Buffer.from(a.hash, 'hex');
    if (h.length !== g.length || !crypto.timingSafeEqual(h, g)) return bad('Kullanıcı adı veya şifre yanlış.');
  }
  fails.delete(c.ip);
  let tok = null; if (m.mode !== 'token') { tok = crypto.randomBytes(24).toString('hex'); a.toks.push(tok); if (a.toks.length > 6) a.toks.shift(); accDirty = true; }
  const old = users.get(key); if (old && old !== c) { send(old, { t: 'kicked' }); HORNET.leave(old); BJ.leave(old); leave(old); old.acc = null; old.user = null; try { old.sock.end(); } catch (e) { } }
  c.user = key; c.acc = a; users.set(key, c);
  c.admin = !!c.local || ADMINS.has(key);
  repairSave(a, now);
  reply(1, null, { name: a.name, tok, admin: c.admin, save: a.save, ts: a.ts });
  BJ.onAuth(c); // bağlı değilken biten canlı blackjack kazancı
}
function respawn(v) {
  if (!players.has(v.id) || CUR.roundOver) return;
  const sp = pickSpawn(v);
  v.hp = 100; v.alive = true; v.x = sp[0]; v.y = 0; v.z = sp[1]; v.vx = v.vz = 0; v.inv = Date.now() + PROTECT_MS; v.lt = Date.now(); v.free = Date.now() + 4000;
  HIT.reset(v,Date.now());
  bcast({ t: 'resp', id: v.id, x: sp[0], z: sp[1] });
}
function endRound(winner) {
  const rm = CUR; rm.roundOver = true;
  const tmw = rm.kind === 'tm';
  bcast({ t: 'end', win: winner.id, name: tmw ? 'Takım ' + winner.team : winner.name, wt: tmw ? winner.team : 0, b: board(), tk: rm.tk });
  console.log('* Tur bitti [' + rm.key + ']. Kazanan: ' + (tmw ? 'Takım ' + winner.team : winner.name));
  setTimeout(() => {
    useRoom(rm); rm.roundOver = false; rm.tk = { 1: 0, 2: 0 }; const sps = {};
    for (const c of players.values()) { c.k = c.d = 0; c.hp = 100; c.alive = true; c.vx = c.vz = 0; c.inv = Date.now() + PROTECT_MS; c.lt = Date.now(); c.free = Date.now() + 4000; const sp = pickSpawn(c); c.x = sp[0]; c.y = 0; c.z = sp[1]; HIT.reset(c,Date.now());sps[c.id] = [sp[0], sp[1]]; }
    bcast({ t: 'round', sps, tk: rm.tk }); sendBoard();
  }, NEXT_ROUND_MS);
}
/* ----- Zombi co-op odası (sunucu otoriteli) ----- */
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
function zStartWave(rm) {
  rm.wave++; rm.waveCd = 3; rm.zs.clear();
  for (const c of players.values()) {
    if (!c.alive) { const sp = pickSpawn(c); c.alive = true; c.hp = 60; c.x = sp[0]; c.y = 0; c.z = sp[1]; c.vx = c.vz = 0; c.inv = Date.now() + PROTECT_MS; c.lt = Date.now(); c.free = Date.now() + 4000; HIT.reset(c,Date.now()); bcast({ t: 'resp', id: c.id, x: sp[0], z: sp[1] }); bcast({ t: 'hp', id: c.id, hp: c.hp, by: 0 }); }
    else { c.hp = Math.min(100, c.hp + 30); bcast({ t: 'hp', id: c.id, hp: c.hp, by: 0 }); }
  }
  const n = Math.min(40, 3 + rm.wave * 2), arr = [...players.values()];
  for (let i = 0; i < n; i++) {
    const t = arr[Math.floor(Math.random() * arr.length)] || { x: 0, z: 0 }, a = Math.random() * 6.28;
    const id = rm.zid++, hp = 60 + rm.wave * 8;
    rm.zs.set(id, { id, x: clampN(t.x + Math.cos(a) * 22, -28, 28), z: clampN(t.z + Math.sin(a) * 22, -28, 28), hp, max: hp, sp: 2.6 + Math.min(2, rm.wave * .25) + Math.random(), cd: Math.random(), atk: 0, yaw: 0 });
  }
  bcast({ t: 'wave', w: rm.wave, n }); sendBoard();
}
function zDamagePlayer(rm, c, d, z) {
  if(c.admin&&c.adtools?.god)return;
  c.hp -= d;
  if (c.hp > 0) { bcast({ t: 'hp', id: c.id, hp: c.hp, by: 0 }); return; }
  c.hp = 0; c.alive = false; c.d++;
  bcast({ t: 'hp', id: c.id, hp: 0, by: 0 });
  bcast({ t: 'die', id: c.id, by: 0, w: 'zombie', hd: false, x: r2(c.x), y: r2(c.y), z: r2(c.z), kx: r2(z.x), kz: r2(z.z) });
  sendBoard();
  if (![...players.values()].some(o => o.alive)) {
    rm.over = true; bcast({ t: 'end', win: 0, name: 'Zombiler', wt: 0, b: board(), wave: rm.wave });
    console.log('* Zombi oyunu bitti [' + rm.key + '] dalga ' + rm.wave);
    setTimeout(() => {
      useRoom(rm); rm.over = false; rm.wave = 0; rm.waveCd = 2; rm.zs.clear(); const sps = {};
      for (const o of players.values()) { o.k = o.d = 0; o.hp = 100; o.alive = true; o.vx = o.vz = 0; o.inv = Date.now() + PROTECT_MS; o.lt = Date.now(); o.free = Date.now() + 4000; const sp = pickSpawn(o); o.x = sp[0]; o.y = 0; o.z = sp[1]; sps[o.id] = [sp[0], sp[1]]; }
      bcast({ t: 'round', sps, tk: rm.tk }); sendBoard();
    }, NEXT_ROUND_MS);
  }
}
function zHit(c, m, now) {
  const rm = CUR; if (rm.kind !== 'zo' || !c.alive || rm.over) return;
  const W = WPN[m.w], z = rm.zs.get(m.id | 0); if (!W || !z) return;
  const checked=HIT.validate(c,z,m,W,rm.map,now);
  if(checked===false)return;
  if(checked===null){
    HIT.legacy();
    const key='z'+m.w,minGap=W.r*1000*(W.m?HIT_LIMITS.legacyMeleeRate:HIT_LIMITS.legacyGunRate);
    if(c.last[key]&&now-c.last[key]<minGap)return HIT.reject(c,m,'legacy-fire-rate',now);c.last[key]=now;
    const d=Math.hypot(c.x-z.x,c.z-z.z),reach=W.m?W.m+HIT_LIMITS.legacyMeleeSlack:HIT_LIMITS.legacyGunArenaRange;
    if(d>reach)return HIT.reject(c,m,'legacy-range',now);
  }
  const hd = !W.m && !!m.hd; z.hp -= W.d * (hd ? 2 : 1);
  if (z.hp > 0) return;
  rm.zs.delete(z.id); c.k++;
  bcast({ t: 'zd', id: z.id, by: c.id, hd, x: r2(z.x), z: r2(z.z), w: m.w }); sendBoard();
}
function zTick(rm, dt) {
  useRoom(rm); if (rm.over || !players.size) return;
  const now = Date.now(), alive = [...players.values()].filter(c => c.alive);
  if (!rm.zs.size) { rm.waveCd -= dt; if (rm.waveCd <= 0) zStartWave(rm); return; }
  const zl = [...rm.zs.values()];
  for (const z of zl) {
    let t = null, bd = 1e9; for (const c of alive) { const d = Math.hypot(c.x - z.x, c.z - z.z); if (d < bd) { bd = d; t = c; } }
    if (!t) continue;
    const dx = t.x - z.x, dz = t.z - z.z, d = bd || 1; z.yaw = Math.atan2(dx, dz);
    if (d > 1.3) { z.x += dx / d * z.sp * dt; z.z += dz / d * z.sp * dt; }
    for (const o of zl) { if (o === z) continue; const ox = z.x - o.x, oz = z.z - o.z, od = Math.hypot(ox, oz); if (od < .7 && od > 1e-3) { z.x += ox / od * (.7 - od) * .5; z.z += oz / od * (.7 - od) * .5; } }
    z.x = clampN(z.x, -28, 28); z.z = clampN(z.z, -28, 28);
    z.cd -= dt; if (z.atk > 0) z.atk -= dt;
    if (d < 1.7 && t.y < 2.5 && z.cd <= 0 && t.inv <= now) { z.cd = .9; z.atk = .5; zDamagePlayer(rm, t, 10, z); if (rm.over) return; }
  }
  bcast({ t: 'zs', s: zl.filter(z => rm.zs.has(z.id)).map(z => [z.id, r2(z.x), r2(z.z), r2(z.yaw), Math.round(z.hp), z.atk > 0 ? 1 : 0]) });
}
setInterval(() => { for (const rm of ROOMS.values()) if (rm.kind === 'zo') { zTick(rm,.05);const now=Date.now();for(const z of rm.zs.values())HIT.record(z,now); } }, 50);

/* ----- Sohbet + sesli sohbet sinyalleşmesi (aynı odadaki oyuncular) ----- */
function roomOf(c) { return c.ow ? { map: OWP, id: c.oid, key: 'o' } : c.joined && c.rm ? { map: c.rm.players, id: c.id, key: 'a' } : null; }
function sendRoom(c, o, except) { const r = roomOf(c); if (!r) return; for (const p of r.map.values()) if (p !== except) send(p, o); }
function chatMsg(c, m, now) {
  const r = roomOf(c); if (!r || !c.acc) return;
  if (m.t === 'chat') {
    if (now - (c.chT || 0) < 400) return; c.chT = now;
    const tx = String(m.m || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120); if (!tx) return;
    sendRoom(c, { t: 'chat', id: r.id, n: c.name, m: tx, tm: !!m.tm });
    return;
  }
  if (m.t === 'vj') { // sese katıl / ayrıl
    c.voice = !!m.on; const ids = [];
    for (const p of r.map.values()) if (p !== c && p.voice) ids.push(r.map === OWP ? p.oid : p.id);
    send(c, { t: 'vl', ids });
    sendRoom(c, { t: 'vp', id: r.id, on: c.voice }, c);
    return;
  }
  /* Sesli sohbet sunucudan geçer (2026-10-20): eşler arası WebRTC mobil hat/CGNAT'ta bağlanamıyordu.
     İstemci 60 ms μ-law paketleri yollar (~21 KB/sn, yalnız konuşurken); sunucu aynı odadaki, sesi kapatmamış herkese iletir. */
  if (m.t === 'va') {
    if (!c.voice || typeof m.d !== 'string' || m.d.length > 2000) return;
    if (now - (c.vaT || 0) > 1000) { c.vaT = now; c.vaN = 0; } if (++c.vaN > 25) return; // saniyede en fazla 25 paket
    const o = { t: 'va', from: r.id, d: m.d };
    for (const p of r.map.values()) if (p !== c && !p.vmute) send(p, o);
    return;
  }
  if (m.t === 'vm') { c.vmute = !!m.on; return; } // gelen sesi kapat/aç
}

function leave(c) {
  if (c.rm) useRoom(c.rm);
  if (!c.joined || !players.has(c.id)) return;
  players.delete(c.id); c.joined = false; c.rm = null; if (c.voice) { c.voice = false; bcast({ t: 'vp', id: c.id, on: false }); }
  bcast({ t: 'leave', id: c.id }); sendBoard();
  console.log('- ' + c.name + ' ayrıldı (' + players.size + ' oyuncu)');
}

/* ---------- Admin: sunucu PC'sinden (localhost) giren hesap ya da data/admins.txt'teki isimler ---------- */
const ADMINS = new Set(); let admT = -1;
/* data/admins.txt: ADMIN.bat / node admin.cjs ile düzenlenir; 3 sn'de bir değişiklik okunur, bağlı oyuncunun yetkisi anında güncellenir (2026-10-20) */
function loadAdmins() {
  let t = 0; try { t = fs.statSync(path.join(DATA, 'admins.txt')).mtimeMs; } catch (e) { }
  if (t === admT) return; admT = t; ADMINS.clear();
  try { for (const l of fs.readFileSync(path.join(DATA, 'admins.txt'), 'utf8').split(/\r?\n/)) if (l.trim()) ADMINS.add(l.trim().toLowerCase()); } catch (e) { }
  for (const [k, c] of users) { const a = !!c.local || ADMINS.has(k); if (a !== !!c.admin) { c.admin = a; if (!a) c.adtools = null; send(c, { t: 'admf', on: a }); console.log('[admin] ' + (c.acc ? c.acc.name : k) + (a ? ' admin yapıldı' : ' adminlikten çıkarıldı')); } }
}
loadAdmins(); setInterval(loadAdmins, 3000);
const BANS = new Map(); // anahtar -> bitiş zamanı
function debtOf(sv) { let t = 0; if (sv && sv.eco && Array.isArray(sv.eco.debts)) for (const d of sv.eco.debts) t += Math.max(0, (d.total || 0) - (d.paid || 0)); return Math.round(t); }
function admMsg(c, m) {
  if (!c.admin || !c.acc) {if(m.t==='atools')send(c,{t:'atools',flags:{}});return true;}
  const key = String(m.n || '').trim().toLowerCase(), a = ACC[key], o = users.get(key), now = Date.now();
  switch (m.t) {
    case 'atools': {const flags={};for(const k of ['noclip','esp','god','ammo'])flags[k]=m.flags?.[k]===true;if(c.adtools?.noclip&&!flags.noclip)c.free=Date.now()+2000;c.adtools=flags;send(c,{t:'atools',flags});return true;}
    case 'aheal': {c.hp=100;send(c,{t:'aheal',hp:100});if(c.wcroom){const host=c.wcroom.members.get(c.wcroom.host);if(host)send(host,{t:'wc_admin_heal',id:c.wcid})}if(c.joined){useRoom(c.rm);bcast({t:'hp',id:c.id,hp:100,by:0})}return true;}
    case 'alist': {
      const rows = Object.keys(ACC).map(k => { const b = ACC[k], u = users.get(k), live = u && u.sock.writable; return [b.name, live ? 1 : 0, live ? where(u) : '', Math.round((b.save && b.save.tl) || 0), debtOf(b.save), (b.save && b.save.ow && b.save.ow.lvl) || 1, ADMINS.has(k) || (u && u.local) ? 1 : 0]; });
      send(c, { t: 'alist', a: rows }); return true;
    }
    case 'agive': {
      if (!a) return send(c, { t: 'afb', m: 'Oyuncu bulunamadı.' }), true;
      const amt = Math.round(num(m.amt, -1e9, 1e9, 0)); if (!amt) return true;
      if (o && o.sock.writable) send(o, { t: 'adm', k: 'give', amt });
      else if (a.save) { a.save.tl = Math.min(INF_TL - 1, Math.max(0, Math.round((a.save.tl || 0) + amt))); a.ts = now; accDirty = true; }
      send(c, { t: 'afb', m: a.name + ' hesabına ' + amt + ' TL ' + (amt > 0 ? 'verildi' : 'düşüldü') + (o ? '' : ' (çevrimdışı, girince görür)') }); console.log('[admin] ' + c.name + ' -> ' + a.name + ' ' + amt + ' TL'); return true;
    }
    case 'aclr': {
      if (!a) return send(c, { t: 'afb', m: 'Oyuncu bulunamadı.' }), true;
      if (o && o.sock.writable) send(o, { t: 'adm', k: 'clrdebt' });
      else if (a.save && a.save.eco) { a.save.eco.debts = []; a.ts = now; accDirty = true; }
      send(c, { t: 'afb', m: a.name + ' borçları silindi' }); console.log('[admin] ' + c.name + ' borç sildi: ' + a.name); return true;
    }
    case 'akick': {
      if (!a || !o) return send(c, { t: 'afb', m: 'Oyuncu çevrimiçi değil.' }), true;
      if (o === c) return send(c, { t: 'afb', m: 'Kendini atamazsın.' }), true;
      const mins = Math.round(num(m.min, 0, 1440, 0)); if (mins) BANS.set(key, now + mins * 60000);
      send(o, { t: 'kickedby', min: mins }); leave(o); owLeave(o); try { o.sock.end(); } catch (e) { }
      send(c, { t: 'afb', m: a.name + ' oyundan atıldı' + (mins ? ' (' + mins + ' dk giremez)' : '') }); console.log('[admin] ' + c.name + ' attı: ' + a.name); return true;
    }
  }
  return true;
}

/* ---------- Açık dünya odası (ortak mob, PvE/PvP) ---------- */
const OWP = new Map(), OW_MAX = 50; let nextOid = 1000; // herkes tek ortak açık dünyada
/* Ortak ganimet (Berkan, 2026-10-19): mobu öldürenin eşyası 15 sn yalnız ona ait, sonra herkes alabilir; 90 sn sonra kaybolur.
   Eşya listesini öldüren istemci üretir (önceki gibi); sunucu yalnız son 5 sn'de gerçekten öldürene, öldürme başına bir kez izin verir. */
const OWLOOT = new Map(); let nextLid = 1;
const LOOT_FREE_MS = 15000, LOOT_TTL_MS = 90000, LOOT_MAX = 300;
const lootRow = (l, now) => [l.id, l.it, l.n, l.x, l.z, l.o, now - l.t];
const owMobs = new Map(), owOwner = new Map();
const owpub = c => ({ id: c.oid, name: c.name, ch: c.ch, w: c.w, x: r2(c.x), y: r2(c.y), z: r2(c.z), yaw: r2(c.yaw), pvp: c.pvp ? 1 : 0, lvl: c.lvl });
function obcast(o, except) { const b = frame(1, Buffer.from(JSON.stringify(o))); for (const c of OWP.values()) if (c !== except && c.sock.writable) { try { c.sock.write(b); } catch (e) { } } }
function owLeave(c) {
  if (!c.ow) return;
  c.ow = false; OWP.delete(c.oid); if (c.voice) { c.voice = false; obcast({ t: 'vp', id: c.oid, on: false }); }
  for (const [i, w] of owOwner) if (w.o === c.oid) { owOwner.delete(i); obcast({ t: 'omo', i, o: 0 }); }
  obcast({ t: 'oleave', id: c.oid }); console.log('- ' + c.name + ' açık dünyadan ayrıldı (' + OWP.size + ')');
}
function owMsg(c, m, now) {
  if (m.t === 'ojoin') {
    if (!c.acc) return true;
    if (c.ow) return true;
    if (c.joined) leave(c);
    if (OWP.size >= OW_MAX) { send(c, { t: 'err', m: 'Açık dünya dolu (' + OW_MAX + ' oyuncu).' }); return true; }
    c.oid = nextOid++; c.ow = true; c.name = c.acc.name; c.ch = cleanId(m.ch) || 'c0'; c.w = cleanId(m.w) || 's0';
    c.pvp = !!m.pvp; c.lvl = num(m.lvl, 1, 60, 1); c.x = c.z = 0; c.y = 0; c.yaw = 0; c.pitch = 0; c.vx = c.vz = 0; c.fl = 1; c.sw = -1; c.cb = 0; c.hpf = 1; c.ot = 0; c.pvT = 0; c.hmT = 0;
    const mobs = []; for (const [i, w] of owMobs) if (w.dead || w.hp < w.max) mobs.push([i, Math.round(w.hp), w.max, w.dead ? 1 : 0]);
    send(c, { t: 'owel', id: c.oid, players: [...OWP.values()].map(owpub), mobs, loot: [...OWLOOT.values()].map(l => lootRow(l, now)) });
    OWP.set(c.oid, c); obcast({ t: 'ojn', p: owpub(c) }, c);
    console.log('+ ' + c.name + ' açık dünyaya girdi (' + OWP.size + ')');
    return true;
  }
  if (!c.ow) return false;
  switch (m.t) {
    case 'ofx': { // takım etkileri (şifa / koruma): aynı açık dünyadaki diğerlerine aktar
      const k = ['heal', 'hot', 'guard'].includes(m.k) ? m.k : null; if (!k || now - (c.fxT || 0) < 250) return true; c.fxT = now;
      obcast({ t: 'ofx', id: c.oid, k, x: num(m.x, -470, 470), z: num(m.z, -470, 470), r: num(m.r, 1, 30, 10), a: num(m.a, 0, 1, .3), d: num(m.d, 0, 12, 0) }, c); return true;
    }
    case 'oquit': owLeave(c); return true;
    case 'ost': {
      c.x = num(m.x, -470, 470); c.y = num(m.y, -5, 120); c.z = num(m.z, -470, 470); c.yaw = num(m.yaw, -50, 50); c.pitch = num(m.pitch, -1.6, 1.6);
      c.vx = num(m.vx, -60, 60); c.vz = num(m.vz, -60, 60); c.fl = num(m.f, 0, 511) | 0; c.w = cleanId(m.w) || c.w;
      c.sw = num(m.sw, -1, 1, -1); c.cb = num(m.cb, 0, 15) | 0; c.hpf = num(m.hp, 0, 1, 1); c.lvl = num(m.lvl, 1, 60, c.lvl);
      return true;
    }
    case 'osw': obcast({ t: 'ofx', id: c.oid, cb: num(m.cb, 0, 15) | 0 }, c); return true;
    case 'opvpset': c.pvp = !!m.v; obcast({ t: 'opv', id: c.oid, v: c.pvp ? 1 : 0 }); return true;
    case 'omd': { // mob hasarı
      const i = m.i | 0; if (i < 0 || i > 20000) return true;
      const mx = num(m.max, 0, 5e6, 0); let w = owMobs.get(i);
      if (!w) { if (mx < 1) return true; w = { hp: mx, max: mx, dead: false, hit: new Map() }; owMobs.set(i, w); }
      if (w.dead) return true;
      const d = num(m.d, 0, w.max, 0); if (d <= 0) return true;
      w.hit.set(c.oid, now); w.hp -= d;
      if (w.hp > 0) { obcast({ t: 'omh', i, hp: Math.round(w.hp), max: w.max }); return true; }
      w.hp = 0; w.dead = true; owOwner.delete(i);
      const part = []; for (const [o, t] of w.hit) if (now - t < 60000 && OWP.has(o)) part.push(o);
      obcast({ t: 'omk', i, by: c.oid, part });
      c.lootQ = (c.lootQ || []).filter(q => now - q.t < 5000); c.lootQ.push({ i, t: now }); if (c.lootQ.length > 8) c.lootQ.shift(); // ganimet hakkı
      const rt = num(m.rt, 8, 130, 25) * 1000;
      setTimeout(() => { w.dead = false; w.hp = w.max; w.hit.clear(); owOwner.delete(i); obcast({ t: 'omr', i }); }, rt);
      return true;
    }
    case 'olt': { // ganimet bırak: yalnız son 5 sn'de bu mobu öldüren, öldürme başına bir kez
      const q = (c.lootQ || []).findIndex(e => e.i === (m.i | 0) && now - e.t < 5000);
      if (q < 0) return true; c.lootQ.splice(q, 1);
      const x = num(m.x, -470, 470), z = num(m.z, -470, 470);
      if (Math.hypot(x - c.x, z - c.z) > 40) return true;
      const rows = [];
      for (const e of (Array.isArray(m.it) ? m.it.slice(0, 10) : [])) {
        if (!Array.isArray(e) || OWLOOT.size >= LOOT_MAX) continue;
        const it = String(e[0] || ''); if (!/^[a-z0-9]{1,16}$/.test(it)) continue;
        const l = { id: nextLid++, it, n: Math.max(1, Math.min(5, e[1] | 0)), x: r2(x), z: r2(z), o: c.oid, t: now };
        OWLOOT.set(l.id, l); rows.push(lootRow(l, now));
      }
      if (rows.length) obcast({ t: 'oln', l: rows });
      return true;
    }
    case 'olp': { // ganimet al: sahibi her zaman, başkaları 15 sn sonra; yakında olmalı (sahibi otomatik savaşta 25 m'den toplar)
      const l = OWLOOT.get(m.id | 0); if (!l) { send(c, { t: 'olx', id: m.id | 0 }); return true; }
      if (l.o !== c.oid && now - l.t < LOOT_FREE_MS) { send(c, { t: 'olr', id: l.id, w: LOOT_FREE_MS - (now - l.t) }); return true; }
      if (Math.hypot(l.x - c.x, l.z - c.z) > (l.o === c.oid ? 25 : 12)) return true;
      OWLOOT.delete(l.id); send(c, { t: 'olg', id: l.id, it: l.it, n: l.n }); obcast({ t: 'olx', id: l.id }, c);
      return true;
    }
    case 'omp': { // mob konumları: sahip olan oyuncu yollar
      if (!Array.isArray(m.m)) return true;
      const out = [], rej = [];
      for (const e of m.m.slice(0, 40)) {
        if (!Array.isArray(e) || e.length < 12) continue;
        const i = e[0] | 0, ow = owOwner.get(i), w = owMobs.get(i);
        if (w && w.dead) continue;
        if (ow && ow.o !== c.oid && now - ow.t < 2500) { rej.push([i, ow.o]); continue; }
        if (e[4] === 0) { if (ow && ow.o === c.oid) owOwner.delete(i); } else owOwner.set(i, { o: c.oid, t: now });
        out.push(e.slice(0, 12).map(v => typeof v === 'number' && isFinite(v) ? Math.round(v * 100) / 100 : 0));
      }
      for (const r of rej) send(c, { t: 'omo', i: r[0], o: r[1] });
      if (out.length) obcast({ t: 'omp', o: c.oid, m: out }, c);
      return true;
    }
    case 'opvp': { // oyuncu - oyuncu hasarı (ikisi de PvP modunda ve köy dışında olmalı)
      const v = OWP.get(m.id | 0);
      if (!v || v === c || !c.pvp || !v.pvp) return true;
      if (Math.hypot(c.x, c.z) < 14 || Math.hypot(v.x, v.z) < 14) return true;
      if (Math.hypot(c.x - v.x, c.z - v.z) > 12) return true;
      if (now - c.pvT < 100) return true; c.pvT = now;
      send(v, { t: 'opvh', from: c.oid, d: num(m.d, 0, 900) });
      return true;
    }
    case 'opk': obcast({ t: 'okill', id: c.oid, by: m.by | 0, vn: c.name, bn: (OWP.get(m.by | 0) || {}).name || '?' }); return true;
    case 'ohm': { // uzak menzilli mobun verdiği hasar
      const v = OWP.get(m.to | 0); if (!v) return true;
      if (now - c.hmT < 60) return true; c.hmT = now;
      send(v, { t: 'ohm', d: num(m.d, 0, 500) }); return true;
    }
  }
  return false;
}
setInterval(() => {
  if (OWP.size < 2) return;
  const s = []; for (const c of OWP.values()) s.push([c.oid, r2(c.x), r2(c.y), r2(c.z), r2(c.yaw), r2(c.pitch), r2(c.vx), r2(c.vz), c.fl, r2(c.sw), c.cb, c.w, r2(c.hpf), c.pvp ? 1 : 0]);
  obcast({ t: 'osnap', s });
}, 80);

/* ---------- Arkadaşlar ve aktif oyuncular ---------- */
const where = c => c.ow ? 'Açık Dünya' : c.joined ? (c.rm && c.rm.kind === 'tm' ? '5v5 Online' : c.rm && c.rm.kind === 'zo' ? 'Zombi Co-op' : 'Arena') : 'Lobi';
function flFor(c) {
  const a = c.acc, av = k => { const s = ACC[k] && ACC[k].save; return (s && s.av) || 'a0'; };
  const fr = (a.fr || []).map(k => { const o = users.get(k); return [ACC[k] ? ACC[k].name : k, o && o.sock.writable ? 1 : 0, o ? where(o) : '', av(k)]; });
  const rq = (a.rq || []).map(k => ACC[k] ? ACC[k].name : k), act = [];
  for (const [k, o] of users) { if (o === c || !o.acc || !o.sock.writable) continue; act.push([o.acc.name, where(o), (a.fr || []).includes(k) ? 1 : 0, av(k)]); if (act.length >= 40) break; }
  return { t: 'fl', fr, rq, act };
}
function sendFl(c) { if (!c.acc) return; const o = flFor(c), s = JSON.stringify(o); if (c.flS === s) return; c.flS = s; send(c, o); }
function frMsg(c, m) {
  if (!c.acc || !c.user) return true;
  const a = c.acc; a.fr = a.fr || []; a.rq = a.rq || [];
  const key = String(m.n || '').trim().toLowerCase(), note = t => send(c, { t: 'fm', m: t });
  switch (m.t) {
    case 'fl': c.flS = ''; sendFl(c); return true;
    case 'fadd': {
      if (!key || key === c.user) return note('Kendini ekleyemezsin.');
      const b = ACC[key]; if (!b) return note('Böyle bir oyuncu yok.');
      b.fr = b.fr || []; b.rq = b.rq || [];
      if (a.fr.includes(key)) return note('Zaten arkadaşsınız.');
      if (a.rq.includes(key)) { a.rq = a.rq.filter(k => k !== key); a.fr.push(key); b.fr.push(c.user); accDirty = true; note(b.name + ' ile arkadaş oldunuz!'); }
      else if (b.rq.includes(c.user)) return note('İstek zaten gönderilmiş.');
      else { b.rq.push(c.user); accDirty = true; note('İstek gönderildi: ' + b.name); }
      break;
    }
    case 'facc': {
      const b = ACC[key]; if (!b || !a.rq.includes(key)) return note('İstek bulunamadı.');
      b.fr = b.fr || []; a.rq = a.rq.filter(k => k !== key); if (!a.fr.includes(key)) a.fr.push(key); if (!b.fr.includes(c.user)) b.fr.push(c.user); accDirty = true; note(b.name + ' ile arkadaş oldunuz!'); break;
    }
    case 'frej': a.rq = a.rq.filter(k => k !== key); accDirty = true; break;
    case 'fdel': { a.fr = a.fr.filter(k => k !== key); const b = ACC[key]; if (b && b.fr) b.fr = b.fr.filter(k => k !== c.user); accDirty = true; break; }
    default: return false;
  }
  c.flS = ''; sendFl(c); const o = users.get(key); if (o) { o.flS = ''; sendFl(o); }
  return true;
}
setInterval(() => { for (const c of users.values()) sendFl(c); }, 4000);
setInterval(() => { const now = Date.now(); for (const l of OWLOOT.values()) if (now - l.t > LOOT_TTL_MS) { OWLOOT.delete(l.id); obcast({ t: 'olx', id: l.id }); } }, 5000); // süresi dolan ganimet
/* hasar almış ama 20 sn boyunca vurulmamış moblar iyileşir */
setInterval(() => { const now = Date.now(); for (const [i, w] of owMobs) { if (w.dead || w.hp >= w.max) continue; let last = 0; for (const t of w.hit.values()) last = Math.max(last, t); if (now - last > 20000) { w.hp = w.max; w.hit.clear(); obcast({ t: 'omh', i, hp: w.max, max: w.max }); } } }, 5000);

/* Konum yayını (20 Hz), oda başına */
setInterval(() => {
  for (const rm of ROOMS.values()) {
    if (rm.players.size < 2) continue; useRoom(rm);
    const s = []; for (const c of players.values()) if (c.alive) s.push([c.id, r2(c.x), r2(c.y), r2(c.z), r2(c.yaw), r2(c.pitch), r2(c.vx), r2(c.vz), c.fl, r2(c.rq), r2(c.sw), c.cb, c.w, r2(c.ad)]);
    bcast({ t: 'snap', s });
  }
}, 50);
setInterval(() => {
  const now = Date.now();
  for (const c of [...conns]) { if (now - c.seen > 40000) { try { c.sock.destroy(); } catch (e) { } leave(c); conns.delete(c); } else { try { c.sock.write(frame(9, Buffer.alloc(0))); } catch (e) { } } }
}, 10000);

server.on('error', e => { console.log(e.code === 'EADDRINUSE' ? '\nHATA: ' + PORT + ' portu zaten kullanımda. Sunucu başka bir pencerede açık olabilir.\n' : '\nHATA: ' + e.message); process.exit(1); });
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n==============================================');
  console.log('  N.P.N.G sunucusu çalışıyor (port ' + PORT + ')');
  console.log('==============================================');
  console.log('  Bu bilgisayarda oyna :  http://localhost:' + PORT);
  for (const l of Object.values(os.networkInterfaces())) for (const a of l || []) if (a.family === 'IPv4' && !a.internal) console.log('  Aynı ağdaki arkadaşlar:  http://' + a.address + ':' + PORT);
  console.log('  (İnternetten girmek için modemde ' + PORT + ' portunu bu bilgisayara yönlendir.)');
  console.log('  Kapatmak için bu pencereyi kapat ya da Ctrl+C.\n');
});

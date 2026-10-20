'use strict';
/* Canlı Blackjack (Claude, 2026-10-20 · Berkan: "canlı oynanabilir, aktif biri varsa masaya katılabilir, turunu bekler").
   Sunucu yetkili: kartları sunucu karıştırır ve dağıtır, sonuçları sunucu hesaplar. Para oyuncunun kaydında (istemci SV.tl):
   kabul edilen bahis 'bjok' ile düşülür, el sonunda kazanç 'bjpay' ile eklenir. Oyuncu bağlı değilse kazanç hesapta bekletilir
   (acc.bjPend) ve sonraki girişte verilir.
   Kurallar: 6 deste, krupiye yumuşak 17'de durur (S17), blackjack 3:2, ilk iki kartta ikiye katlama, bir kez bölme
   (bölünen aslara birer kart), sigorta yok. Krupiye ilk kartlarda blackjack ise el hemen biter (oyuncu blackjack'i berabere). */
const crypto = require('crypto');
const FAST = !!process.env.MMOFPS_BJ_FAST; /* yalnız testler: kısa süreler */
const SEATS = 5, BET_MS = FAST ? 2500 : 12000, ALLBET_MS = FAST ? 300 : 1500, TURN_MS = FAST ? 2500 : 15000, END_MS = FAST ? 1200 : 5500, DEAL_MS = FAST ? 80 : 450, DEALER_MS = FAST ? 120 : 750, DECKS = 6;
const TABLES = [{ id: 1, n: 'Masa 1', min: 10 }, { id: 2, n: 'Masa 2', min: 100 }, { id: 3, n: 'Masa 3 · VIP', min: 1000 }];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'], SUITS = ['s', 'h', 'd', 'c'];
const cv = c => { const r = c[0]; return r === 'A' ? 11 : 'TJQK'.includes(r) ? 10 : +r; };
function hv(cards) { let t = 0, a = 0; for (const c of cards) { t += cv(c); if (c[0] === 'A') a++; } while (t > 21 && a) { t -= 10; a--; } return { t, soft: a > 0 }; }
const isBJ = h => h.cards.length === 2 && !h.split && hv(h.cards).t === 21;
module.exports = function ({ send, users, ACC, dirty, log }) {
  let rnd = n => crypto.randomInt(n);
  if (process.env.MMOFPS_BJ_SEED) { /* yalnız testler: tekrarlanabilir karıştırma */
    let a = +process.env.MMOFPS_BJ_SEED | 0;
    const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    rnd = n => Math.floor(r() * n);
  }
  const tables = TABLES.map(d => ({ ...d, max: d.min * 1000, seats: Array(SEATS).fill(null), watch: new Set(), ph: 'idle', until: 0, shoe: [], dealer: [], hole: true, cur: null, rd: 0, timer: null, last: [] }));
  const T = id => tables.find(t => t.id === id);
  function shuffle(t) { const s = []; for (let d = 0; d < DECKS; d++) for (const r of RANKS) for (const u of SUITS) s.push(r + u); for (let i = s.length - 1; i > 0; i--) { const j = rnd(i + 1); [s[i], s[j]] = [s[j], s[i]]; } t.shoe = s; }
  function draw(t) { if (!t.shoe.length) shuffle(t); return t.shoe.pop(); }
  function deliver(key, amt, rd, tb) {
    if (amt <= 0) return;
    const c = users.get(key);
    if (c && c.sock && c.sock.writable && c.acc) { send(c, { t: 'bjpay', a: amt, rd, tb }); return; }
    const a = ACC[key]; if (!a) return; a.bjPend = (a.bjPend || 0) + amt; dirty();
  }
  /* ---------- durum ---------- */
  function pubSeat(s) {
    if (!s) return null;
    return { n: s.name, bet: s.bet, wait: s.wait ? 1 : 0, away: s.c ? 0 : 1, win: s.win || 0,
      hands: s.hands.map(h => ({ c: h.cards, v: hv(h.cards).t, s: hv(h.cards).soft ? 1 : 0, bet: h.bet, st: h.st, res: h.res || '' })) };
  }
  function state(t) {
    const now = Date.now(), d = t.hole && t.dealer.length ? [t.dealer[0], null] : t.dealer;
    return { t: 'bjs', tb: t.id, n: t.n, min: t.min, max: t.max, ph: t.ph, ms: Math.max(0, t.until - now), rd: t.rd,
      turn: t.cur, d, dv: t.dealer.length ? hv(t.hole ? [t.dealer[0]] : t.dealer).t : 0, seats: t.seats.map(pubSeat), shoe: t.shoe.length, last: t.last };
  }
  function bc(t) { const s = state(t); for (const c of t.watch) send(c, s); }
  function list() { return tables.map(t => [t.id, t.n, t.min, t.seats.filter(Boolean).length, t.ph]); }
  function timer(t, ms, fn) { clearTimeout(t.timer); t.until = Date.now() + ms; t.timer = setTimeout(fn, ms); }
  /* ---------- akış ---------- */
  function bettors(t) { return t.seats.filter(s => s && s.bet > 0 && !s.wait); }
  function maybeStartBet(t) {
    if (t.ph === 'idle' && bettors(t).length) { t.ph = 'bet'; timer(t, BET_MS, () => deal(t)); }
    if (t.ph === 'bet') { const act = t.seats.filter(s => s && !s.wait && s.c); if (act.length && act.every(s => s.bet > 0) && t.until - Date.now() > ALLBET_MS) timer(t, ALLBET_MS, () => deal(t)); }
  }
  function deal(t) {
    const B = bettors(t); if (!B.length) { t.ph = 'idle'; t.until = 0; bc(t); return; }
    t.rd++; t.ph = 'deal'; t.cur = null; t.dealer = []; t.hole = true;
    if (t.shoe.length < 52 * DECKS * .25) shuffle(t);
    for (const s of B) s.hands = [{ cards: [], bet: s.bet, st: 'play' }];
    for (let k = 0; k < 2; k++) { for (const s of B) s.hands[0].cards.push(draw(t)); t.dealer.push(draw(t)); }
    for (const s of B) if (isBJ(s.hands[0])) s.hands[0].st = 'bj';
    bc(t);
    const dbj = hv(t.dealer).t === 21;
    timer(t, DEAL_MS * 2, () => { if (dbj) { t.hole = false; settle(t); } else next(t); });
  }
  function curHand(t) { if (!t.cur) return null; const s = t.seats[t.cur[0]]; return s && s.hands[t.cur[1]]; }
  /* sıradaki oynanacak el (soldan sağa, koltuk içinde el sırası) */
  function next(t) {
    t.ph = 'play';
    for (let i = 0; i < SEATS; i++) {
      const s = t.seats[i]; if (!s || s.wait || !(s.bet > 0)) continue;
      for (let h = 0; h < s.hands.length; h++) {
        const H = s.hands[h]; if (H.st !== 'play') continue;
        if (hv(H.cards).t >= 21) { H.st = hv(H.cards).t > 21 ? 'bust' : 'stand'; continue; }
        if (!s.c) { H.st = 'stand'; continue; } /* masadan kalkmış: otomatik dur */
        t.cur = [i, h]; timer(t, TURN_MS, () => act(t, i, h, 'stand', true)); bc(t); return;
      }
    }
    t.cur = null; dealerPlay(t);
  }
  function act(t, i, h, a, auto) {
    if (t.ph !== 'play' || !t.cur || t.cur[0] !== i || t.cur[1] !== h) return false;
    const s = t.seats[i], H = s.hands[h];
    if (a === 'hit') { H.cards.push(draw(t)); const v = hv(H.cards).t; if (v > 21) H.st = 'bust'; else if (v === 21) H.st = 'stand'; }
    else if (a === 'stand') H.st = 'stand';
    else if (a === 'double') { H.bet *= 2; H.dbl = 1; H.cards.push(draw(t)); H.st = hv(H.cards).t > 21 ? 'bust' : 'stand'; }
    else if (a === 'split') {
      const c2 = H.cards.pop(), N = { cards: [c2], bet: H.bet, st: 'play', split: 1 }; H.split = 1;
      H.cards.push(draw(t)); N.cards.push(draw(t)); s.hands.splice(h + 1, 0, N);
      if (H.cards[0][0] === 'A') { H.st = 'stand'; N.st = 'stand'; } /* bölünen aslara birer kart */
    } else return false;
    if (auto) s.idle = (s.idle || 0) + 1; else s.idle = 0;
    next(t); return true;
  }
  function dealerPlay(t) {
    t.ph = 'dealer'; t.hole = false; bc(t);
    const live = bettors(t).some(s => s.hands.some(h => h.st === 'stand' || h.st === 'play'));
    const step = () => {
      const v = hv(t.dealer);
      if (live && (v.t < 17)) { t.dealer.push(draw(t)); bc(t); timer(t, DEALER_MS, step); }
      else settle(t);
    };
    timer(t, DEALER_MS, step);
  }
  function settle(t) {
    t.ph = 'end'; t.cur = null; t.hole = false;
    const dv = hv(t.dealer).t, dbj = t.dealer.length === 2 && dv === 21, res = [];
    for (const s of bettors(t)) {
      let pay = 0;
      for (const H of s.hands) {
        const v = hv(H.cards).t, bj = isBJ(H);
        if (H.st === 'bust' || v > 21) { H.res = 'lose'; }
        else if (bj && !dbj) { H.res = 'bj'; pay += H.bet * 2.5; }
        else if (dbj) { H.res = bj ? 'push' : 'lose'; if (bj) pay += H.bet; }
        else if (dv > 21 || v > dv) { H.res = 'win'; pay += H.bet * 2; }
        else if (v === dv) { H.res = 'push'; pay += H.bet; }
        else H.res = 'lose';
      }
      pay = Math.floor(pay); s.win = pay;
      const staked = s.hands.reduce((a, h) => a + h.bet, 0);
      res.push([s.name, pay - staked]);
      deliver(s.key, pay, t.rd, t.id);
      if (log) log('[bj] ' + t.n + ' el ' + t.rd + ': ' + s.name + ' ' + (pay - staked >= 0 ? '+' : '') + (pay - staked));
    }
    t.last = [{ rd: t.rd, d: dv, r: res }, ...t.last].slice(0, 6);
    bc(t);
    timer(t, END_MS, () => reset(t));
  }
  function reset(t) {
    for (let i = 0; i < SEATS; i++) {
      const s = t.seats[i]; if (!s) continue;
      if (!s.c || (s.idle || 0) >= 2) { if (s.c) send(s.c, { t: 'bjmsg', m: 'İki el üst üste süren doldu: masadan kaldırıldın.' }); t.seats[i] = null; continue; }
      s.bet = 0; s.hands = []; s.wait = false; s.win = 0;
    }
    t.ph = 'idle'; t.until = 0; t.dealer = []; t.hole = true; t.cur = null; bc(t);
  }
  /* ---------- oyuncu ---------- */
  function seatOf(t, c) { return t.seats.findIndex(s => s && s.c === c); }
  function leave(c) {
    const t = c.bjT; if (!t) return;
    t.watch.delete(c); c.bjT = null;
    const i = seatOf(t, c);
    if (i >= 0) {
      const s = t.seats[i];
      const inHand = (t.ph === 'deal' || t.ph === 'play' || t.ph === 'dealer' || t.ph === 'end') && s.bet > 0 && !s.wait;
      if (inHand) { s.c = null; if (t.cur && t.cur[0] === i) next(t); } /* eli bitince ödenir, koltuk el sonunda boşalır */
      else { if (s.bet > 0 && t.ph === 'bet') deliver(s.key, s.bet, t.rd, t.id); t.seats[i] = null; if (t.ph === 'bet' && !bettors(t).length) { clearTimeout(t.timer); t.ph = 'idle'; t.until = 0; } }
    }
    bc(t);
  }
  function handle(c, m, now) {
    if (!c.acc) { send(c, { t: 'bjmsg', m: 'Canlı masa için çevrimiçi giriş yap.' }); return; }
    if (now - (c.bjW || 0) > 1000) { c.bjW = now; c.bjN = 0; } if (++c.bjN > 15) return; // saniyede en fazla 15 masa mesajı
    switch (m.t) {
      case 'bjlist': send(c, { t: 'bjlist', l: list() }); return;
      case 'bjjoin': { const t = T(m.tb | 0) || tables[0]; if (c.bjT && c.bjT !== t) leave(c); c.bjT = t; t.watch.add(c); send(c, state(t)); send(c, { t: 'bjlist', l: list() }); return; }
      case 'bjleave': leave(c); return;
    }
    const t = c.bjT; if (!t) return;
    const me = seatOf(t, c);
    switch (m.t) {
      case 'bjsit': {
        if (me >= 0) return send(c, { t: 'bjmsg', m: 'Zaten bir koltukta oturuyorsun.' });
        const i = m.s | 0; if (i < 0 || i >= SEATS || t.seats[i]) return send(c, { t: 'bjmsg', m: 'Bu koltuk dolu.' });
        /* aynı hesap başka bağlantıdan oturuyorsa (yeniden bağlanma) koltuğu devral */
        const old = t.seats.findIndex(s => s && s.key === c.user);
        if (old >= 0) { t.seats[old].c = c; bc(t); return; }
        const mid = t.ph !== 'idle' && t.ph !== 'bet';
        t.seats[i] = { key: c.user, name: c.acc.name, c, bet: 0, hands: [], wait: mid, idle: 0 };
        if (mid) send(c, { t: 'bjmsg', m: 'El sürüyor: sıradaki elde oynayacaksın.' });
        bc(t); return;
      }
      case 'bjstand': { if (me >= 0) leave(c), c.bjT = t, t.watch.add(c), send(c, state(t)); return; }
      case 'bjbet': {
        if (me < 0) return; const s = t.seats[me];
        if (s.wait || !(t.ph === 'idle' || t.ph === 'bet')) return send(c, { t: 'bjmsg', m: 'Bahisler şu an kapalı, sıradaki eli bekle.' });
        const a = Math.floor(+m.a || 0), tl = +m.tl;
        if (!(a >= t.min && a <= t.max)) return send(c, { t: 'bjmsg', m: 'Bu masada bahis ₺' + t.min + ' – ₺' + t.max + '.' });
        if (!(Number.isFinite(tl) && tl >= a && tl < 1e9)) return send(c, { t: 'bjmsg', m: 'Yetersiz bakiye.' });
        if (s.bet > 0) return;
        s.bet = a; s.idle = 0; send(c, { t: 'bjok', a, tb: t.id }); maybeStartBet(t); bc(t); return;
      }
      case 'bjact': {
        if (me < 0 || !t.cur || t.cur[0] !== me) return;
        const s = t.seats[me], H = s.hands[t.cur[1]], a = m.a;
        if (a === 'double' || a === 'split') {
          if (H.cards.length !== 2) return;
          if (a === 'double' && (H.split && H.cards[0][0] === 'A')) return;
          if (a === 'split' && (s.hands.length > 1 || cv(H.cards[0]) !== cv(H.cards[1]))) return;
          const tl = +m.tl; if (!(Number.isFinite(tl) && tl >= H.bet && tl < 1e9)) return send(c, { t: 'bjmsg', m: 'Yetersiz bakiye.' });
          send(c, { t: 'bjok', a: H.bet, tb: t.id });
        }
        act(t, me, t.cur[1], a, false); return;
      }
    }
  }
  function onAuth(c) { const a = c.acc; if (a && a.bjPend > 0) { const v = Math.floor(a.bjPend); a.bjPend = 0; dirty(); send(c, { t: 'bjpay', a: v, pend: 1 }); } }
  return { handle, leave, onAuth, _tables: tables };
};

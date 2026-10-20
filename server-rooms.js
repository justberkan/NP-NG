'use strict';
/* Co-op oda ortak kuralları (Claude 2026-10-20 · Berkan: lobi listesi, oda kodu, şifreli lobi, arkadaş davet/katıl).
   Dalga Ağacı (wc_) ve Inlı Cinlı (ic_) odaları aynı biçimde: kod, sahip adı, kişi, şifre (yalnız özeti saklanır), davetliler. */
const crypto = require('crypto');
const MODES = { wc: 'Koridor: Dalga Ağacı', ic: 'Inlı Cinlı' };
const hashPass = s => { s = String(s || '').trim().slice(0, 32); return s ? crypto.createHash('sha256').update('npng-oda:' + s).digest('hex') : ''; };
/* oda kurulurken: kod, şifre, ad, harita */
function setup(r, c, m, mode) {
  r.mode = mode; r.owner = c.acc ? c.acc.name : '?'; r.pass = hashPass(m.pass); r.map = String(m.map || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 20);
  r.created = Date.now(); r.inv = new Set();
}
/* katılırken: şifre ya da davet. Dönen metin hata, boşsa geçer */
function check(r, c, m) {
  if (!r.pass) return '';
  if (c.user && r.inv && r.inv.has(c.user)) return '';
  if (!m.pass) return 'NEED_PASS';
  return hashPass(m.pass) === r.pass ? '' : 'BAD_PASS';
}
const errText = e => e === 'NEED_PASS' ? 'Bu oda şifreli: şifreyi yaz.' : 'Şifre yanlış.';
function row(r, max) {
  return { mode: r.mode, name: MODES[r.mode] || r.mode, code: r.code, owner: r.owner, n: r.members.size, max: max || 0, lock: r.pass ? 1 : 0, map: r.map || '',
    players: [...r.members.values()].map(c => c.acc ? c.acc.name : '?'), age: Math.round((Date.now() - (r.created || Date.now())) / 1000) };
}
module.exports = { MODES, hashPass, setup, check, errText, row };

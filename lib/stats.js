// عدّاد زيارات بسيط جوه الموقع (من غير كوكيز ولا بيانات شخصية): بيعدّ كل خطوة في اليوم بتوقيت القاهرة.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'stats.json');
const EVENTS = ['visit', 'order_cta', 'form_start', 'photo_added', 'begin_checkout', 'receipt_uploaded'];
let db = { days: {} };
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); if (!db.days) db.days = {}; } catch {}

let dirty = false;
function flush() {
  if (!dirty) return;
  dirty = false;
  try { const tmp = FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(db)); fs.renameSync(tmp, FILE); } catch {}
}
setInterval(flush, 5000).unref();
// لما Railway يقفل النسخة القديمة وقت الـ Deploy، نحفظ الأرقام الأول
for (const sig of ['SIGTERM', 'SIGINT']) process.once(sig, () => { flush(); process.exit(0); });

const cairoDay = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });

// منع التكرار: نفس الزائر ونفس الخطوة مرة واحدة كل 30 دقيقة
const seen = new Map();
setInterval(() => { const t = Date.now(); for (const [k, v] of seen) if (t - v > 30 * 60000) seen.delete(k); }, 10 * 60000).unref();

const clean = (s, n = 30) => String(s || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, n);

function record({ e, src, dev, sid }, ip) {
  if (!EVENTS.includes(e)) return false;
  const k = `${clean(sid, 40) || ip}|${e}`;
  if (seen.has(k) && Date.now() - seen.get(k) < 30 * 60000) return false;
  seen.set(k, Date.now());
  const day = cairoDay();
  const d = (db.days[day] ||= { ev: {}, src: {}, dev: {} });
  d.ev[e] = (d.ev[e] || 0) + 1;
  if (e === 'visit') {
    const s = clean(src) || 'direct';
    if (Object.keys(d.src).length < 40 || d.src[s]) d.src[s] = (d.src[s] || 0) + 1;
    const v = dev === 'mobile' ? 'mobile' : 'desktop';
    d.dev[v] = (d.dev[v] || 0) + 1;
  }
  dirty = true;
  return true;
}

function days(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = cairoDay(new Date(Date.now() - i * 86400000));
    const d = db.days[day] || { ev: {}, src: {}, dev: {} };
    out.push({ day, ...d });
  }
  return out;
}

module.exports = { record, days, cairoDay, EVENTS, since: () => Object.keys(db.days).sort()[0] || null };

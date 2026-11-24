require('dotenv').config();
const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const store = require('./lib/store');
const paymob = require('./lib/paymob');
const notify = require('./lib/notify');

const PORT = Number(process.env.PORT || 3000);
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const PRICE_EGP = Number(process.env.PRICE_EGP || 199);
// manual = إنستاباي/محفظة + مراجعة الإيصال · paymob = دفع أوتوماتيك · mock = تجريبي · free = مجاني
const PAYMENT_MODE = ['paymob', 'free', 'manual'].includes(process.env.PAYMENT_MODE) ? process.env.PAYMENT_MODE : 'mock';
const MANUAL_PAY = {
  instapay: process.env.INSTAPAY_ADDRESS || 'mohamed86kamel@instapay',
  instapayLink: process.env.INSTAPAY_LINK || 'https://ipn.eg/C/Q/mohamed86kamel/instapay?ISIGN=23052602MEUCIQDgVtGZXD8W5q1aQokJnYWgVOMMsNmHJCnt8sjkReUbSAIgMj+tLuOyyfn+gaERu7VIIJ2c/MF3MixI5qe1CYeIA4A=',
  wallet: process.env.WALLET_NUMBER || '01020025259',
};
const ADMIN_KEY = process.env.ADMIN_KEY || process.env.AUTOMATION_SECRET || '';
const AUTOMATION_SECRET = process.env.AUTOMATION_SECRET || '';
const IMAGES_COUNT = 10;

const DATA = path.join(__dirname, 'data');
const PHOTOS = path.join(DATA, 'photos');
const RESULTS = path.join(DATA, 'results');
const RECEIPTS = path.join(DATA, 'receipts');
fs.mkdirSync(RECEIPTS, { recursive: true });
fs.mkdirSync(PHOTOS, { recursive: true });
fs.mkdirSync(RESULTS, { recursive: true });

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const rnd = (n = 16) => crypto.randomBytes(n).toString('hex');
const safeEq = (a, b) => {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
};

// ---------- رفع الصورة ----------
const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const uploadPhoto = multer({
  storage: multer.diskStorage({
    destination: PHOTOS,
    filename: (req, file, cb) => cb(null, rnd(12) + ALLOWED[file.mimetype]),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    ALLOWED[file.mimetype] ? cb(null, true) : cb(new Error('نوع الصورة لازم يكون JPG أو PNG أو WEBP')),
});

const uploadReceipt = multer({
  storage: multer.diskStorage({
    destination: RECEIPTS,
    filename: (req, file, cb) => cb(null, rnd(12) + (ALLOWED[file.mimetype] || '.pdf')),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    ALLOWED[file.mimetype] || file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('ارفع صورة الإيصال (JPG أو PNG) أو PDF')),
});

// ---------- برومبتات الصفحات (lib/prompts.js) ----------
const { buildPrompts: buildPagePrompts, STYLE } = require('./lib/prompts');
const buildPrompts = (order) => buildPagePrompts(order, IMAGES_COUNT);

// ---------- إرسال الطلب للأتمتة ----------
async function dispatchToAutomation(order) {
  const url = process.env.AUTOMATION_WEBHOOK_URL;
  const payload = {
    orderId: order.id,
    photoUrl: `${BASE_URL}/files/photo/${order.id}?key=${order.photoKey}`,
    child: { name: order.childName, age: order.childAge, gender: order.childGender },
    interests: order.interests,
    favoriteAnimal: order.favoriteAnimal,
    notes: order.notes,
    imagesCount: IMAGES_COUNT,
    style: STYLE,
    suggestedPrompts: buildPrompts(order),
    callbackUrl: `${BASE_URL}/api/automation/callback`,
    callbackHeader: 'x-automation-secret',
  };
  if (!url) {
    console.warn(`[automation] AUTOMATION_WEBHOOK_URL مش متظبط — الطلب ${order.id} مستني.`);
    store.update(order.id, { status: 'processing', dispatchedAt: new Date().toISOString(), lastPayload: payload });
    return;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-automation-secret': AUTOMATION_SECRET },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    store.update(order.id, { status: 'processing', dispatchedAt: new Date().toISOString(), dispatchError: null });
    console.log(`[automation] الطلب ${order.id} اتبعت`);
  } catch (e) {
    console.error(`[automation] فشل إرسال ${order.id}:`, e.message);
    store.update(order.id, { status: 'processing', dispatchError: e.message, lastPayload: payload });
  }
}

function markPaid(orderId, paymentRef) {
  const order = store.get(orderId);
  if (!order || !['awaiting_payment', 'awaiting_review', 'payment_rejected'].includes(order.status)) return order;
  const updated = store.update(orderId, { status: 'paid', paidAt: new Date().toISOString(), paymentRef });
  dispatchToAutomation(updated);
  return updated;
}

function publicOrder(o) {
  return {
    id: o.id,
    status: o.status,
    childName: o.childName,
    createdAt: o.createdAt,
    paymentMode: PAYMENT_MODE,
    price: o.price,
    manualPay: PAYMENT_MODE === 'manual' ? MANUAL_PAY : undefined,
    rejectReason: o.status === 'payment_rejected' ? o.rejectReason || '' : undefined,
    images: (o.images || []).map((_, i) => `/files/result/${o.id}/${i}?t=${o.accessToken}`),
    zipUrl: o.status === 'ready' ? `/api/orders/${o.id}/zip?t=${o.accessToken}` : null,
  };
}

function authOrder(req, res) {
  const o = store.get(req.params.id);
  if (!o || !safeEq(req.query.t, o.accessToken)) { res.status(404).json({ error: 'الطلب مش موجود' }); return null; }
  return o;
}

// ---------- API ----------
app.get('/api/config', (req, res) => res.json({ price: PAYMENT_MODE === 'free' ? 0 : PRICE_EGP, currency: 'EGP', paymentMode: PAYMENT_MODE, imagesCount: IMAGES_COUNT }));

app.post('/api/orders', (req, res) => {
  uploadPhoto.single('photo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'الصورة أكبر من 10 ميجا' : err.message });
    const b = req.body || {};
    const cleanup = () => req.file && fs.unlink(req.file.path, () => {});
    const fail = (msg) => { cleanup(); res.status(400).json({ error: msg }); };
    // طلب مجاني من الأدمن — لازم مفتاح الأدمن، والعميل مايشوفش الخيار ده أصلاً
    const adminFree = b.adminFree === 'true';
    if (adminFree && !isAdmin(req)) { cleanup(); return res.status(401).json({ error: 'مفتاح الأدمن غلط' }); }

    if (!req.file) return fail('ارفع صورة الطفل');
    const childName = String(b.childName || '').trim().slice(0, 40);
    const email = String(b.email || '').trim().slice(0, 120);
    const parentName = String(b.parentName || '').trim().slice(0, 80);
    let interests = [];
    try { interests = JSON.parse(b.interests || '[]'); } catch { interests = String(b.interests || '').split(','); }
    interests = interests.map((s) => String(s).trim().slice(0, 60)).filter(Boolean).slice(0, 10);

    if (!childName) return fail('اكتب اسم الطفل');
    if (!parentName && !adminFree) return fail('اكتب اسمك');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !(adminFree && !email)) return fail('الإيميل مش صحيح');
    if (!interests.length) return fail('اختار حاجة واحدة على الأقل الطفل بيحبها');
    if (b.consent !== 'true') return fail('لازم توافق على الشروط');

    const order = store.create({
      id: 'ord_' + rnd(6),
      accessToken: rnd(16),
      photoKey: rnd(16),
      status: 'awaiting_payment',
      childName,
      childAge: Number(b.childAge) > 0 && Number(b.childAge) < 18 ? Number(b.childAge) : null,
      childGender: ['boy', 'girl'].includes(b.childGender) ? b.childGender : null,
      interests,
      favoriteAnimal: String(b.favoriteAnimal || '').trim().slice(0, 40),
      notes: String(b.notes || '').trim().slice(0, 300),
      parentName,
      email,
      phone: String(b.phone || '').trim().slice(0, 20),
      photoFile: req.file.filename,
      images: [],
      price: PAYMENT_MODE === 'free' || adminFree ? 0 : PRICE_EGP,
      adminFree: adminFree || undefined,
      createdAt: new Date().toISOString(),
    });

    const orderPage = `/order.html?id=${order.id}&t=${order.accessToken}`;
    if (adminFree) { markPaid(order.id, 'admin_free'); console.log(`[admin] طلب مجاني ${order.id}`); return res.json({ orderId: order.id, redirect: orderPage }); }
    if (PAYMENT_MODE === 'free') { markPaid(order.id, 'free'); return res.json({ orderId: order.id, redirect: orderPage }); }
    if (PAYMENT_MODE === 'mock' || PAYMENT_MODE === 'manual') return res.json({ orderId: order.id, redirect: orderPage });

    try {
      const checkoutUrl = await paymob.createCheckout({ order, priceEgp: PRICE_EGP, baseUrl: BASE_URL });
      res.json({ orderId: order.id, redirect: checkoutUrl });
    } catch (e) {
      console.error(e.message);
      res.status(502).json({ error: 'حصلت مشكلة في بوابة الدفع، جرب تاني بعد شوية' });
    }
  });
});

app.get('/api/orders/:id', (req, res) => {
  const o = authOrder(req, res); if (!o) return;
  res.json(publicOrder(o));
});

// ---------- الدفع اليدوي (إنستاباي / محفظة) ----------
app.post('/api/orders/:id/receipt', (req, res) => {
  uploadReceipt.single('receipt')(req, res, (err) => {
    const cleanup = () => req.file && fs.unlink(req.file.path, () => {});
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'الصورة أكبر من 10 ميجا' : err.message });
    if (PAYMENT_MODE !== 'manual') { cleanup(); return res.status(403).json({ error: 'غير متاح' }); }
    const o = store.get(req.params.id);
    if (!o || !safeEq(req.query.t, o.accessToken)) { cleanup(); return res.status(404).json({ error: 'الطلب مش موجود' }); }
    if (!['awaiting_payment', 'payment_rejected'].includes(o.status)) { cleanup(); return res.status(400).json({ error: 'الطلب ده اتدفع خلاص' }); }
    if (!req.file) return res.status(400).json({ error: 'ارفع صورة إيصال التحويل' });
    const b = req.body || {};
    if (o.receiptFile) fs.unlink(path.join(RECEIPTS, o.receiptFile), () => {});
    const updated = store.update(o.id, {
      status: 'awaiting_review',
      receiptFile: req.file.filename,
      paymentMethod: b.method === 'wallet' ? 'wallet' : 'instapay',
      senderInfo: String(b.senderInfo || '').trim().slice(0, 80),
      receiptAt: new Date().toISOString(),
      rejectReason: null,
    });
    console.log(`[payment] إيصال جديد للطلب ${o.id} (${updated.paymentMethod})`);
    notify.notifyAdmin([
      '🧾 إيصال دفع جديد — ColorMe Toon',
      `الطفل: ${updated.childName}`,
      `ولي الأمر: ${updated.parentName || '-'} ${updated.phone ? '(' + updated.phone + ')' : ''}`,
      `المبلغ: ${updated.price} جنيه — ${updated.paymentMethod === 'wallet' ? 'محفظة' : 'إنستاباي'}`,
      updated.senderInfo ? `حوّل من: ${updated.senderInfo}` : '',
      `راجعه: ${BASE_URL}/admin.html`,
    ].filter(Boolean).join('\n'));
    res.json(publicOrder(updated));
  });
});

// ---------- لوحة الأدمن ----------
const isAdmin = (req) => safeEq(req.get('x-admin-key') || req.query.key, ADMIN_KEY);

app.get('/api/admin/orders', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'المفتاح غلط' });
  const list = store.all()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 200)
    .map((o) => ({
      id: o.id, status: o.status, childName: o.childName, parentName: o.parentName, phone: o.phone, email: o.email,
      price: o.price, paymentMethod: o.paymentMethod, senderInfo: o.senderInfo, receiptAt: o.receiptAt,
      hasReceipt: !!o.receiptFile, adminFree: !!o.adminFree, createdAt: o.createdAt, images: (o.images || []).length, rejectReason: o.rejectReason,
      orderUrl: `/order.html?id=${o.id}&t=${o.accessToken}`,
    }));
  res.json({ paymentMode: PAYMENT_MODE, whatsapp: { configured: notify.configured(), phone: notify.PHONE }, orders: list });
});

app.post('/api/admin/notify-test', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'المفتاح غلط' });
  if (!notify.configured()) return res.status(400).json({ error: 'إشعار الواتساب مش متظبط لسه (ناقص CALLMEBOT_APIKEY في Railway)' });
  const r = await notify.send('✅ تجربة إشعار من ColorMe Toon — الإشعارات شغالة!');
  res.json({ results: r, ok: r.some((x) => x.ok) });
});

app.get('/api/admin/orders/:id/receipt', (req, res) => {
  if (!isAdmin(req)) return res.status(401).end();
  const o = store.get(req.params.id);
  if (!o || !o.receiptFile) return res.status(404).end();
  res.sendFile(path.join(RECEIPTS, o.receiptFile));
});

app.post('/api/admin/orders/:id/approve', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'المفتاح غلط' });
  const o = store.get(req.params.id);
  if (!o) return res.status(404).json({ error: 'الطلب مش موجود' });
  if (!['awaiting_review', 'awaiting_payment', 'payment_rejected'].includes(o.status)) return res.status(400).json({ error: 'الطلب اتأكد قبل كده' });
  const free = !!(req.body && req.body.free);
  if (free) store.update(o.id, { price: 0, adminFree: true });
  const u = markPaid(o.id, free ? 'admin_free' : `manual_${o.paymentMethod || 'instapay'}_${rnd(3)}`);
  console.log(`[payment] الأدمن ${free ? 'فعّل مجاناً' : 'أكّد دفع'} ${o.id}`);
  res.json({ ok: true, status: u.status });
});

app.post('/api/admin/orders/:id/reject', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'المفتاح غلط' });
  const o = store.get(req.params.id);
  if (!o || o.status !== 'awaiting_review') return res.status(400).json({ error: 'الطلب مش مستني مراجعة' });
  const reason = String((req.body && req.body.reason) || '').trim().slice(0, 200);
  store.update(o.id, { status: 'payment_rejected', rejectReason: reason });
  res.json({ ok: true });
});

// دفع تجريبي — شغال بس في وضع mock
app.post('/api/orders/:id/mock-pay', (req, res) => {
  if (PAYMENT_MODE !== 'mock') return res.status(403).json({ error: 'غير متاح' });
  const o = authOrder(req, res); if (!o) return;
  res.json(publicOrder(markPaid(o.id, 'mock_' + rnd(4))));
});

// Paymob بيبعت هنا نتيجة الدفع
app.post('/api/paymob/callback', (req, res) => {
  const obj = req.body && req.body.obj;
  if (!obj || !paymob.verifyHmac(obj, req.query.hmac)) return res.status(401).end();
  const orderId = obj.order && (obj.order.merchant_order_id || obj.special_reference);
  if (obj.success === true && obj.pending === false && orderId) markPaid(orderId, String(obj.id));
  res.status(200).end();
});

// الأتمتة بتحمّل صورة الطفل من هنا
app.get('/files/photo/:id', (req, res) => {
  const o = store.get(req.params.id);
  if (!o || !o.photoFile || !safeEq(req.query.key, o.photoKey)) return res.status(404).end();
  const p = path.join(PHOTOS, o.photoFile);
  if (!fs.existsSync(p)) return res.status(410).end();
  res.sendFile(p);
});

// ---------- استقبال الصور من الأتمتة ----------
// يدعم طريقتين:
//  1) JSON: { "orderId": "...", "images": ["https://...png", ...] }
//  2) multipart/form-data: orderId + ملفات في حقل "images"
//  ولو فشلت: { "orderId": "...", "status": "failed", "error": "..." }
const uploadResults = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 20 } });

async function downloadImage(url) {
  if (!/^https?:\/\//i.test(url)) throw new Error('رابط مش صالح: ' + url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} لـ ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > 15 * 1024 * 1024) throw new Error('صورة كبيرة جداً');
  const ct = r.headers.get('content-type') || '';
  return { buf, ext: ct.includes('jpeg') ? '.jpg' : ct.includes('webp') ? '.webp' : '.png' };
}

app.post('/api/automation/callback', uploadResults.array('images', 20), async (req, res) => {
  if (!safeEq(req.get('x-automation-secret'), AUTOMATION_SECRET)) return res.status(401).json({ error: 'unauthorized' });
  const b = req.body || {};
  const o = store.get(b.orderId);
  if (!o) return res.status(404).json({ error: 'order not found' });

  if (b.status === 'failed') {
    store.update(o.id, { status: 'failed', error: String(b.error || '').slice(0, 500) });
    return res.json({ ok: true });
  }

  try {
    let items = [];
    if (req.files && req.files.length) {
      items = req.files.map((f) => ({ buf: f.buffer, ext: path.extname(f.originalname) || '.png' }));
    } else {
      let urls = b.images;
      if (typeof urls === 'string') { try { urls = JSON.parse(urls); } catch { urls = [urls]; } }
      if (!Array.isArray(urls) || !urls.length) return res.status(400).json({ error: 'images مطلوبة' });
      items = await Promise.all(urls.slice(0, 20).map(downloadImage));
    }
    const dir = path.join(RESULTS, o.id);
    fs.mkdirSync(dir, { recursive: true });
    const append = b.append === 'true' || b.append === true; // لو الأتمتة بتبعت صورة صورة
    const existing = append ? o.images || [] : [];
    const names = items.map((it, i) => {
      const name = `page-${String(existing.length + i + 1).padStart(2, '0')}${it.ext}`;
      fs.writeFileSync(path.join(dir, name), it.buf);
      return name;
    });
    const images = [...existing, ...names];
    const done = !append || images.length >= IMAGES_COUNT || b.final === 'true' || b.final === true;
    store.update(o.id, { images, status: done ? 'ready' : 'processing', readyAt: done ? new Date().toISOString() : null });
    console.log(`[automation] الطلب ${o.id}: اتستلم ${names.length} صورة (${done ? 'جاهز' : 'لسه'})`);
    res.json({ ok: true, received: names.length, total: images.length, status: done ? 'ready' : 'processing' });
  } catch (e) {
    console.error('[automation callback]', e.message);
    res.status(400).json({ error: e.message });
  }
});

// إعادة إرسال طلب للأتمتة (لو فشل)
app.post('/api/admin/orders/:id/retry', (req, res) => {
  if (!safeEq(req.get('x-automation-secret'), AUTOMATION_SECRET)) return res.status(401).end();
  const o = store.get(req.params.id);
  if (!o || o.status === 'awaiting_payment') return res.status(400).json({ error: 'الطلب مش مدفوع' });
  dispatchToAutomation(o);
  res.json({ ok: true });
});

// ---------- تحميل النتايج ----------
app.get('/files/result/:id/:n', (req, res) => {
  const o = authOrder(req, res); if (!o) return;
  const name = (o.images || [])[Number(req.params.n)];
  if (!name) return res.status(404).end();
  res.sendFile(path.join(RESULTS, o.id, name));
});

app.get('/api/orders/:id/zip', (req, res) => {
  const o = authOrder(req, res); if (!o) return;
  if (o.status !== 'ready') return res.status(400).json({ error: 'لسه مش جاهز' });
  res.attachment(`coloring-${o.childName.replace(/[^\p{L}\p{N}]+/gu, '-')}.zip`);
  const zip = archiver('zip', { zlib: { level: 6 } });
  zip.on('error', () => res.end());
  zip.pipe(res);
  for (const name of o.images) zip.file(path.join(RESULTS, o.id, name), { name });
  zip.finalize();
});

// ---------- مسح صور الأطفال القديمة تلقائياً ----------
function purgeOldPhotos() {
  const days = Number(process.env.DELETE_PHOTO_AFTER_DAYS || 7);
  const cutoff = Date.now() - days * 864e5;
  for (const o of store.all()) {
    if (o.photoFile && new Date(o.createdAt).getTime() < cutoff) {
      fs.unlink(path.join(PHOTOS, o.photoFile), () => {});
      store.update(o.id, { photoFile: null, photoDeletedAt: new Date().toISOString() });
    }
  }
}
setInterval(purgeOldPhotos, 6 * 36e5);
purgeOldPhotos();

app.listen(PORT, () => {
  console.log(`✅ الموقع شغال على ${BASE_URL}  (الدفع: ${PAYMENT_MODE})`);
});

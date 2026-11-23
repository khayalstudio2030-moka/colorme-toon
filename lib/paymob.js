// تكامل Paymob (Unified Checkout / Intention API)
const crypto = require('crypto');

const API = 'https://accept.paymob.com';

async function createCheckout({ order, priceEgp, baseUrl }) {
  const integrationIds = (process.env.PAYMOB_INTEGRATION_IDS || '')
    .split(',').map((s) => Number(s.trim())).filter(Boolean);

  const [first, ...rest] = (order.parentName || 'Customer').trim().split(/\s+/);
  const body = {
    amount: Math.round(priceEgp * 100),
    currency: 'EGP',
    payment_methods: integrationIds,
    items: [{ name: 'كتاب تلوين مخصص - 10 صفحات', amount: Math.round(priceEgp * 100), quantity: 1 }],
    billing_data: {
      first_name: first || 'Customer',
      last_name: rest.join(' ') || 'NA',
      email: order.email,
      phone_number: order.phone || 'NA',
    },
    special_reference: order.id,
    notification_url: `${baseUrl}/api/paymob/callback`,
    redirection_url: `${baseUrl}/order.html?id=${order.id}&t=${order.accessToken}`,
  };

  const res = await fetch(`${API}/v1/intention/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.client_secret) {
    throw new Error('Paymob intention failed: ' + JSON.stringify(data));
  }
  return `${API}/unifiedcheckout/?publicKey=${encodeURIComponent(process.env.PAYMOB_PUBLIC_KEY)}&clientSecret=${encodeURIComponent(data.client_secret)}`;
}

// التحقق من HMAC بتاع callback المعاملة (Transaction processed callback)
const HMAC_FIELDS = [
  'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction',
  'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded',
  'is_standalone_payment', 'is_voided', 'order.id', 'owner', 'pending',
  'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success',
];

function pick(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

function verifyHmac(obj, receivedHmac) {
  if (!receivedHmac || !process.env.PAYMOB_HMAC_SECRET) return false;
  const str = HMAC_FIELDS.map((f) => {
    const v = pick(obj, f);
    return v === undefined || v === null ? '' : String(v);
  }).join('');
  const calc = crypto.createHmac('sha512', process.env.PAYMOB_HMAC_SECRET).update(str).digest('hex');
  const a = Buffer.from(calc), b = Buffer.from(String(receivedHmac));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { createCheckout, verifyHmac };

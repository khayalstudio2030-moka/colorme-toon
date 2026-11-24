// إشعارات واتساب للأدمن (CallMeBot مجاني للاستخدام الشخصي، أو TextMeBot)
// المتغيرات:
//   ADMIN_WHATSAPP   رقمك بالصيغة الدولية (افتراضي 201550169555)
//   CALLMEBOT_APIKEY المفتاح اللي البوت بيبعتهولك على واتساب
//   TEXTMEBOT_APIKEY بديل لو CallMeBot مش متاح
//   NOTIFY_WEBHOOK_URL اختياري: يبعت نفس الرسالة JSON لأي webhook (مثلاً n8n)

const PHONE = String(process.env.ADMIN_WHATSAPP || '201550169555').replace(/[^\d]/g, '');

function configured() {
  return !!(process.env.CALLMEBOT_APIKEY || process.env.TEXTMEBOT_APIKEY || process.env.NOTIFY_WEBHOOK_URL);
}

async function send(text) {
  const jobs = [];
  const t = encodeURIComponent(text);
  if (process.env.CALLMEBOT_APIKEY) {
    const key = encodeURIComponent(process.env.CALLMEBOT_APIKEY);
    jobs.push(['callmebot', fetch(`https://api.callmebot.com/whatsapp.php?phone=%2B${PHONE}&text=${t}&apikey=${key}`)]);
  }
  if (process.env.TEXTMEBOT_APIKEY) {
    const key = encodeURIComponent(process.env.TEXTMEBOT_APIKEY);
    jobs.push(['textmebot', fetch(`https://api.textmebot.com/send.php?recipient=%2B${PHONE}&apikey=${key}&text=${t}`)]);
  }
  if (process.env.NOTIFY_WEBHOOK_URL) {
    jobs.push(['webhook', fetch(process.env.NOTIFY_WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: PHONE, text }),
    })]);
  }
  const results = [];
  for (const [name, p] of jobs) {
    try {
      const r = await p;
      const body = (await r.text()).slice(0, 200).replace(/<[^>]+>/g, ' ').trim();
      results.push({ name, ok: r.ok, status: r.status, body });
      if (!r.ok) console.error(`[notify] ${name} رجّع ${r.status}: ${body}`);
    } catch (e) {
      results.push({ name, ok: false, error: e.message });
      console.error(`[notify] ${name} فشل:`, e.message);
    }
  }
  return results;
}

// ما يوقفش الطلب أبداً لو الإشعار فشل
function notifyAdmin(text) {
  if (!configured()) return;
  send(text).catch(() => {});
}

module.exports = { notifyAdmin, send, configured, PHONE };

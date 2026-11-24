// إشعارات للأدمن لما يترفع إيصال جديد. أي واحد متظبط من دول بيشتغل (وممكن أكتر من واحد مع بعض):
//
//  تليجرام (مجاني ورسمي — الأنسب):
//    TELEGRAM_BOT_TOKEN  من @BotFather
//    TELEGRAM_CHAT_ID    اختياري — لو مش موجود بيتعرف لوحده من آخر حد بعت /start للبوت
//
//  واتساب عن طريق Green API (خطة Developer المجانية، محتاج رقم واتساب تاني يبعت منه):
//    GREENAPI_URL (مثلاً https://7103.api.greenapi.com)، GREENAPI_ID، GREENAPI_TOKEN
//
//  واتساب عن طريق CallMeBot / TextMeBot: CALLMEBOT_APIKEY أو TEXTMEBOT_APIKEY
//  أي webhook (مثلاً n8n): NOTIFY_WEBHOOK_URL
//
//  ADMIN_WHATSAPP رقم الواتساب اللي يستلم (افتراضي 201550169555)

const fs = require('fs');
const path = require('path');

const PHONE = String(process.env.ADMIN_WHATSAPP || '201550169555').replace(/[^\d]/g, '');
const TG_CACHE = path.join(__dirname, '..', 'data', 'telegram_chat.json');
const env = (k) => (process.env[k] || '').trim();

function channels() {
  const c = [];
  if (env('TELEGRAM_BOT_TOKEN')) c.push('telegram');
  if (env('GREENAPI_URL') && env('GREENAPI_ID') && env('GREENAPI_TOKEN')) c.push('whatsapp_greenapi');
  if (env('CALLMEBOT_APIKEY')) c.push('callmebot');
  if (env('TEXTMEBOT_APIKEY')) c.push('textmebot');
  if (env('NOTIFY_WEBHOOK_URL')) c.push('webhook');
  return c;
}
const configured = () => channels().length > 0;

// يجيب chat id بتاع تليجرام: من المتغير، أو من الكاش، أو من آخر رسالة اتبعتت للبوت
async function telegramChatId(token) {
  if (env('TELEGRAM_CHAT_ID')) return env('TELEGRAM_CHAT_ID');
  try { const c = JSON.parse(fs.readFileSync(TG_CACHE, 'utf8')); if (c.chatId) return c.chatId; } catch {}
  const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const d = await r.json();
  const msgs = (d.result || []).map((u) => u.message || u.my_chat_member || u.edited_message).filter(Boolean);
  const last = msgs.reverse().find((m) => m.chat && m.chat.type === 'private');
  if (!last) throw new Error('ابعت /start للبوت من تليجرام الأول');
  const chatId = String(last.chat.id);
  try { fs.mkdirSync(path.dirname(TG_CACHE), { recursive: true }); fs.writeFileSync(TG_CACHE, JSON.stringify({ chatId, name: last.chat.first_name || '' })); } catch {}
  return chatId;
}

async function sendOne(name, text) {
  const t = encodeURIComponent(text);
  switch (name) {
    case 'telegram': {
      const token = env('TELEGRAM_BOT_TOKEN');
      const chat_id = await telegramChatId(token);
      return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text, disable_web_page_preview: true }),
      });
    }
    case 'whatsapp_greenapi':
      return fetch(`${env('GREENAPI_URL').replace(/\/$/, '')}/waInstance${env('GREENAPI_ID')}/sendMessage/${env('GREENAPI_TOKEN')}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: `${PHONE}@c.us`, message: text }),
      });
    case 'callmebot':
      return fetch(`https://api.callmebot.com/whatsapp.php?phone=%2B${PHONE}&text=${t}&apikey=${encodeURIComponent(env('CALLMEBOT_APIKEY'))}`);
    case 'textmebot':
      return fetch(`https://api.textmebot.com/send.php?recipient=%2B${PHONE}&apikey=${encodeURIComponent(env('TEXTMEBOT_APIKEY'))}&text=${t}`);
    case 'webhook':
      return fetch(env('NOTIFY_WEBHOOK_URL'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: PHONE, text }),
      });
  }
}

async function send(text) {
  const results = [];
  for (const name of channels()) {
    try {
      const r = await sendOne(name, text);
      const body = (await r.text()).slice(0, 200).replace(/<[^>]+>/g, ' ').trim();
      results.push({ name, ok: r.ok, status: r.status, body: r.ok ? undefined : body });
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

module.exports = { notifyAdmin, send, configured, channels, PHONE };

// طلب صورة واحدة من Nano Banana (Gemini) مباشرة من السيرفر
// بيستخدمه رسم الصفحات (lib/pages.js) وتلوين الغلاف (lib/cover.js)
const fs = require('fs');
const path = require('path');

const MODEL = () => process.env.GEMINI_IMAGE_MODEL || 'gemini-nano-banana-2.1';
const enabled = () => !!(process.env.GEMINI_API_KEY || '').trim();

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const mimeOf = (f) => MIME[path.extname(f).toLowerCase()] || 'image/jpeg';
const imagePart = (file) => ({ inline_data: { mime_type: mimeOf(file), data: fs.readFileSync(file).toString('base64') } });

// parts: [{text}, {inline_data}...] — بيرجّع { buf, ext } أو بيرمي خطأ
async function generateImage(parts, { aspectRatio = '3:4', timeoutMs = 240000 } = {}) {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) throw new Error('ناقص GEMINI_API_KEY');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL()}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio } } }),
      signal: ctrl.signal,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Gemini ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
    const img = ((d.candidates?.[0]?.content?.parts) || []).find((p) => p.inlineData || p.inline_data);
    if (!img) throw new Error('Nano Banana مارجعش صورة: ' + JSON.stringify(d).slice(0, 300));
    const x = img.inlineData || img.inline_data;
    const mime = x.mimeType || x.mime_type || 'image/png';
    return { buf: Buffer.from(x.data, 'base64'), ext: mime.includes('jpeg') ? '.jpg' : '.png' };
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Gemini اتأخر أكتر من اللازم (timeout)');
    throw e;
  } finally { clearTimeout(timer); }
}

module.exports = { generateImage, imagePart, mimeOf, enabled, MODEL };

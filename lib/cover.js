// غلاف الكتاب: بناخد صفحة من صفحات الطفل ونلوّنها كأن طفل لوّنها بإيده (Nano Banana)
// محتاج GEMINI_API_KEY في Railway. لو مش موجود، الـ PDF بيتعمل بغلاف من غير ألوان.
const fs = require('fs');
const path = require('path');

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-nano-banana-2.1';
const enabled = () => !!(process.env.GEMINI_API_KEY || '').trim();

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const mimeOf = (f) => MIME[path.extname(f).toLowerCase()] || 'image/png';

function prompt(order) {
  const who = order.childGender === 'girl' ? 'girl' : order.childGender === 'boy' ? 'boy' : 'child';
  return [
    'Color the first image (a black-and-white coloring book page) as if a 6-year-old child colored it by hand with wax crayons and felt markers.',
    'Bright cheerful colors, clearly visible crayon strokes and waxy texture, coloring that goes slightly outside the lines in a few places,',
    'uneven fills with small white gaps, a little scribbly shading, on slightly textured white paper.',
    'Keep the drawing, composition and every black outline exactly the same as the first image.',
    order.photoAvailable
      ? `Use the second image only as a reference for the ${who}'s real colors (hair, skin, eyes and clothes).`
      : '',
    'Make it look charming and handmade, not digital. No text, no letters, no numbers.',
  ].filter(Boolean).join(' ');
}

// بيرجّع { buf, ext } أو بيرمي خطأ
async function colorPage({ pagePath, photoPath, order }) {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  const parts = [{ text: prompt({ ...order, photoAvailable: !!photoPath }) },
    { inline_data: { mime_type: mimeOf(pagePath), data: fs.readFileSync(pagePath).toString('base64') } }];
  if (photoPath) parts.push({ inline_data: { mime_type: mimeOf(photoPath), data: fs.readFileSync(photoPath).toString('base64') } });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 240000);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '3:4' } } }),
      signal: ctrl.signal,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Gemini ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
    const img = ((d.candidates?.[0]?.content?.parts) || []).find((p) => p.inlineData || p.inline_data);
    if (!img) throw new Error('Nano Banana مارجعش صورة: ' + JSON.stringify(d).slice(0, 300));
    const x = img.inlineData || img.inline_data;
    const mime = x.mimeType || x.mime_type || 'image/png';
    return { buf: Buffer.from(x.data, 'base64'), ext: mime.includes('jpeg') ? '.jpg' : '.png' };
  } finally { clearTimeout(timer); }
}

module.exports = { colorPage, enabled };

// كتب الحروف والأرقام: بنحط الحرف/الرقم المفرّغ فوق الرسمة والكلمة تحتها، جوه نفس الصورة
// عشان الطفل يلوّنهم مع الرسمة، ويظهروا في صفحة الطلب والـ ZIP والـ PDF.
// (pngjs + jpeg-js: JavaScript بس، من غير مكتبات نظام)
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

const GLYPHS = path.join(__dirname, '..', 'assets', 'glyphs');

function decode(file) {
  const buf = fs.readFileSync(file);
  if (buf[0] === 0x89 && buf[1] === 0x50) { const p = PNG.sync.read(buf); return { w: p.width, h: p.height, d: p.data }; }
  const j = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 1024 });
  return { w: j.width, h: j.height, d: j.data };
}

// بنرسم صورة (RGBA) على الكانفاس بتصغير bilinear ومزج بالشفافية
function draw(dst, W, src, sw, sh, dx, dy, tw, th) {
  for (let y = 0; y < th; y++) {
    const fy = ((y + 0.5) * sh) / th - 0.5, y0 = Math.max(0, Math.floor(fy)), y1 = Math.min(sh - 1, y0 + 1), wy = Math.min(1, Math.max(0, fy - y0));
    for (let x = 0; x < tw; x++) {
      const fx = ((x + 0.5) * sw) / tw - 0.5, x0 = Math.max(0, Math.floor(fx)), x1 = Math.min(sw - 1, x0 + 1), wx = Math.min(1, Math.max(0, fx - x0));
      const px = [0, 0, 0, 0];
      for (const [xx, yy, ww] of [[x0, y0, (1 - wx) * (1 - wy)], [x1, y0, wx * (1 - wy)], [x0, y1, (1 - wx) * wy], [x1, y1, wx * wy]]) {
        const i = (yy * sw + xx) * 4;
        for (let c = 0; c < 4; c++) px[c] += src[i + c] * ww;
      }
      const a = px[3] / 255;
      if (a <= 0) continue;
      const o = ((dy + y) * W + dx + x) * 4;
      for (let c = 0; c < 3; c++) dst[o + c] = Math.round(dst[o + c] * (1 - a) + px[c] * a);
    }
  }
}

function placeFit(dst, W, img, boxX, boxY, boxW, boxH) {
  const s = Math.min(boxW / img.w, boxH / img.h, 1.6);
  const tw = Math.max(1, Math.round(img.w * s)), th = Math.max(1, Math.round(img.h * s));
  draw(dst, W, img.d, img.w, img.h, boxX + Math.round((boxW - tw) / 2), boxY + Math.round((boxH - th) / 2), tw, th);
}

// set: ar | en | num_ar | num_en — n: رقم الصفحة من 1
function composePage(rawPath, set, n) {
  const id = `${set}-${String(n).padStart(2, '0')}`;
  const big = path.join(GLYPHS, `${id}-big.png`), word = path.join(GLYPHS, `${id}-word.png`);
  if (!fs.existsSync(big)) return null;
  const page = decode(rawPath);
  const W = page.w;
  const topH = Math.round(W * 0.3), botH = Math.round(W * 0.2), H = topH + page.h + botH;
  const out = new PNG({ width: W, height: H });
  out.data.fill(255);
  // الرسمة في النص
  out.data.set(page.d.subarray(0, W * page.h * 4), topH * W * 4);
  for (let i = topH * W * 4 + 3; i < (topH + page.h) * W * 4; i += 4) out.data[i] = 255;
  const g = (f) => { const p = PNG.sync.read(fs.readFileSync(f)); return { w: p.width, h: p.height, d: p.data }; };
  placeFit(out.data, W, g(big), Math.round(W * 0.05), Math.round(topH * 0.06), Math.round(W * 0.9), Math.round(topH * 0.9));
  if (fs.existsSync(word)) placeFit(out.data, W, g(word), Math.round(W * 0.06), topH + page.h + Math.round(botH * 0.04), Math.round(W * 0.88), Math.round(botH * 0.8));
  return PNG.sync.write(out, { deflateLevel: 6 });
}

module.exports = { composePage };

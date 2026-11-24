// بيعمل كتاب التلوين PDF: غلاف (صفحة ملوّنة + اسم الطفل + اللوجو) وبعده الصفحات، كل صفحة على A4
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const FONTS = path.join(__dirname, '..', 'assets', 'fonts');
const LOGO = path.join(__dirname, '..', 'public', 'img', 'logo.png');
const A4 = { w: 595.28, h: 841.89 };
const INK = '#141414', ORANGE = '#ff8a3d', BLUE = '#45b8e8', PAPER = '#fffdf7';
// بنستخدم خصائص الخط عشان العربي يتوصل ويتكتب من اليمين للشمال صح
const AR = { features: ['rlig', 'liga', 'init', 'medi', 'fina', 'isol', 'calt'] };
const hasLatin = (s) => /[A-Za-z]/.test(s);

function fitImage(doc, file, x, y, w, h) {
  const img = doc.openImage(file);
  const s = Math.min(w / img.width, h / img.height);
  const iw = img.width * s, ih = img.height * s;
  doc.image(img, x + (w - iw) / 2, y + (h - ih) / 2, { width: iw, height: ih });
  return { x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih };
}

function cover(doc, order, coverPath, firstPage) {
  doc.rect(0, 0, A4.w, A4.h).fill(PAPER);
  // شريط مخطط فوق وتحت زي ستايل الموقع
  for (let i = -40; i < A4.w + 40; i += 14) {
    doc.save().polygon([i, 0], [i + 7, 0], [i - 3, 14], [i - 10, 14]).fill(ORANGE).restore();
    doc.save().polygon([i, A4.h - 14], [i + 7, A4.h - 14], [i - 3, A4.h], [i - 10, A4.h]).fill(BLUE).restore();
  }
  // اللوجو
  if (fs.existsSync(LOGO)) doc.image(LOGO, A4.w / 2 - 34, 34, { width: 68 });
  // العنوان
  doc.fillColor(INK).font('ar-b').fontSize(30).text('كتاب تلوين', 40, 112, { width: A4.w - 80, align: 'center', ...AR });
  const name = order.childName || '';
  doc.fillColor(ORANGE).font(hasLatin(name) ? 'lat-b' : 'ar-b').fontSize(name.length > 14 ? 40 : 54)
    .text(name, 40, 150, { width: A4.w - 80, align: 'center', ...(hasLatin(name) ? {} : AR) });

  // الصورة الملوّنة في إطار بظل
  const box = { x: 78, y: 250, w: A4.w - 156, h: 510 };
  const pic = coverPath || firstPage;
  if (pic) {
    const img = doc.openImage(pic);
    const s = Math.min(box.w / img.width, box.h / img.height);
    const w = img.width * s, h = img.height * s, x = (A4.w - w) / 2, y = box.y + (box.h - h) / 2;
    doc.save().roundedRect(x + 8, y + 8, w, h, 16).fill(INK).restore();
    doc.save().roundedRect(x, y, w, h, 16).fill('#ffffff').restore();
    doc.save().roundedRect(x, y, w, h, 16).clip();
    doc.image(img, x, y, { width: w, height: h });
    doc.restore();
    doc.save().roundedRect(x, y, w, h, 16).lineWidth(4).stroke(INK).restore();
  }
  doc.fillColor(INK).font('ar').fontSize(13).text('اتعمل بحب مخصوص علشانك', 40, 778, { width: A4.w - 80, align: 'center', ...AR });
  doc.fillColor('#6b6680').font('lat-b').fontSize(11).text('colormetoon.com', 40, 800, { width: A4.w - 80, align: 'center' });
}

// بيرجّع Buffer
function buildBook({ order, pages, coverPath }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false, info: { Title: `ColorMe Toon — ${order.childName || ''}`, Author: 'ColorMe Toon' } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.registerFont('ar-b', path.join(FONTS, 'baloo-bhaijaan-2-arabic-800-normal.woff'));
    doc.registerFont('ar', path.join(FONTS, 'baloo-bhaijaan-2-arabic-500-normal.woff'));
    doc.registerFont('lat-b', 'Helvetica-Bold'); // الخط اللاتيني من Baloo بيتلخبط مع العربي لأن ليهم نفس الاسم جوه

    doc.addPage();
    cover(doc, order, coverPath, pages[0]);
    for (const p of pages) {
      doc.addPage();
      try { fitImage(doc, p, 28, 28, A4.w - 56, A4.h - 56); } catch (e) { console.error('[book] صفحة مش مدعومة', p, e.message); }
    }
    doc.end();
  });
}

module.exports = { buildBook };

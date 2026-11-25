// غلاف الكتاب: بناخد صفحة من صفحات الطفل ونلوّنها كأن طفل لوّنها بإيده (Nano Banana)
// محتاج GEMINI_API_KEY في Railway. لو مش موجود، الـ PDF بيتعمل بغلاف من غير ألوان.
const { generateImage, imagePart, enabled } = require('./gemini');

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
  const parts = [{ text: prompt({ ...order, photoAvailable: !!photoPath }) }, imagePart(pagePath)];
  if (photoPath) parts.push(imagePart(photoPath));
  return generateImage(parts);
}

module.exports = { colorPage, enabled };

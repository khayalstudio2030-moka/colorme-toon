// رسم صفحات التلوين من السيرفر مباشرة (بدل n8n) — نفس الموديل ونفس البرومبت ونفس الإعدادات
// اللي كانت في الـ Workflow "ColorMe Toon — توليد صفحات التلوين (Nano Banana)"
const { generateImage, imagePart, enabled } = require('./gemini');

// نفس الجملة اللي n8n بيضيفها على كل برومبت (Split into 10 pages)
const LIKENESS = ' Keep the child\'s face, hairstyle and features recognizable from the reference photo, but drawn as a simple cartoon. Output must be pure black outlines on a white background, no color, no gray, suitable for printing on A4.';

function pagePrompt(basePrompt, order) {
  const extra = order.notes ? ` Extra details from the parent (may be Arabic, translate them): ${order.notes}` : '';
  return basePrompt + LIKENESS + extra;
}

// بيرسم صفحة واحدة — نفس ترتيب الـ parts في n8n: البرومبت ثم صورة الطفل
async function drawPage({ prompt, photoPath }) {
  return generateImage([{ text: prompt }, imagePart(photoPath)]);
}

module.exports = { pagePrompt, drawPage, enabled, LIKENESS };

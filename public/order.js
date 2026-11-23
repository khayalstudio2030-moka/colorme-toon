(() => {
  const q = new URLSearchParams(location.search);
  const id = q.get('id'), t = q.get('t');
  const box = document.getElementById('box');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let timer;

  async function load() {
    try {
      const r = await fetch(`/api/orders/${encodeURIComponent(id)}?t=${encodeURIComponent(t)}`);
      if (!r.ok) throw new Error();
      show(await r.json());
    } catch {
      box.innerHTML = '<div class="big">🤔</div><h2>مش لاقيين الطلب ده</h2><p class="hint">اتأكد إنك فاتح اللينك الصح.</p>';
    }
  }

  function show(o) {
    clearTimeout(timer);
    const name = esc(o.childName);
    if (o.status === 'awaiting_payment') {
      if (o.paymentMode === 'mock') {
        box.innerHTML = `<div class="big">💳</div><h2>خطوة الدفع</h2>
          <p class="hint">الموقع شغال في وضع الدفع التجريبي — مفيش فلوس هتتخصم.</p>
          <button class="btn" id="pay">ادفع (تجريبي)</button>`;
        document.getElementById('pay').onclick = async (e) => {
          e.target.disabled = true;
          const r = await fetch(`/api/orders/${id}/mock-pay?t=${t}`, { method: 'POST' });
          show(await r.json());
        };
      } else {
        box.innerHTML = `<div class="big">💳</div><h2>مستنيين تأكيد الدفع…</h2>
          <p class="hint">لو لسه دافع، استنى ثواني والصفحة هتتحدث لوحدها.</p><div class="progress"><i></i></div>`;
        timer = setTimeout(load, 4000);
      }
    } else if (o.status === 'paid' || o.status === 'processing') {
      box.innerHTML = `<img class="mascot" src="/img/step-interests.png" alt=""/><h2>بنرسم صفحات ${name} دلوقتي!</h2>
        <p class="hint">ده بياخد كام دقيقة. سيب الصفحة مفتوحة أو ارجعلها بعدين بنفس اللينك.</p>
        <div class="progress"><i></i></div>
        ${o.images.length ? `<p class="hint">خلص ${o.images.length} من 10</p>` : ''}`;
      timer = setTimeout(load, 5000);
    } else if (o.status === 'ready') {
      box.innerHTML = `<img class="mascot" src="/img/step-download.png" alt=""/><h2>كتاب تلوين ${name} جاهز!</h2>
        <p class="hint">اطبعهم على ورق A4 وسيب ${name} يلوّن 🎨</p>
        <a class="btn" href="${o.zipUrl}">⬇️ حمّل الـ ${o.images.length} صفحات (ZIP)</a>
        <div class="gallery">${o.images.map((u, i) =>
          `<a href="${u}" download="page-${i + 1}" target="_blank"><img src="${u}" alt="صفحة ${i + 1}" loading="lazy"/><span>صفحة ${i + 1}</span></a>`).join('')}</div>`;
    } else {
      box.innerHTML = `<div class="big">😕</div><h2>حصلت مشكلة في تجهيز الصفحات</h2>
        <p class="hint">متقلقش، فريقنا هيتواصل معاك على الإيميل ويحلّها.</p>`;
    }
  }

  if (!id || !t) box.innerHTML = '<div class="big">🤔</div><h2>اللينك ناقص</h2>';
  else load();
})();

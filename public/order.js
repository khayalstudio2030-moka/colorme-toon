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
    if (o.paymentMode === 'manual' && ['awaiting_payment', 'payment_rejected'].includes(o.status)) {
      manualPay(o);
    } else if (o.status === 'awaiting_review') {
      box.innerHTML = `<div class="big">🧾</div><h2>استلمنا إيصال التحويل!</h2>
        <p class="hint">بنراجع الدفع دلوقتي، وأول ما يتأكد هنبدأ نرسم صفحات ${name} على طول.<br/>عادةً خلال ساعة في مواعيد العمل. الصفحة دي هتتحدث لوحدها.</p>
        <div class="progress"><i></i></div>`;
      timer = setTimeout(load, 10000);
    } else if (o.status === 'awaiting_payment') {
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
        <p class="hint">اطبع الكتاب على ورق A4 وسيب ${name} يلوّن 🎨</p>
        <div class="dl-row">
          ${o.coverStatus === 'pending'
            ? '<span class="btn is-wait" aria-disabled="true">🖍️ بنلوّن الغلاف… ثواني</span>'
            : `<a class="btn" href="${o.pdfUrl}">📕 حمّل الكتاب PDF</a>`}
          <a class="btn alt small" href="${o.zipUrl}">🗂️ الصور (ZIP)</a>
        </div>
        <div class="gallery">${o.coverUrl ? `<a href="${o.coverUrl}" target="_blank" class="cover-card"><img src="${o.coverUrl}" alt="غلاف الكتاب"/><span>🎨 الغلاف</span></a>` : ''}${o.images.map((u, i) =>
          `<a href="${u}" download="page-${i + 1}" target="_blank"><img src="${u}" alt="صفحة ${i + 1}" loading="lazy"/><span>صفحة ${i + 1}</span></a>`).join('')}</div>`;
      if (o.coverStatus === 'pending') timer = setTimeout(load, 4000);
    } else {
      box.innerHTML = `<div class="big">😕</div><h2>حصلت مشكلة في تجهيز الصفحات</h2>
        <p class="hint">متقلقش، فريقنا هيتواصل معاك على الإيميل ويحلّها.</p>`;
    }
  }

  function manualPay(o) {
    const m = o.manualPay;
    const rejected = o.status === 'payment_rejected';
    box.innerHTML = `<div class="big">💳</div><h2>ادفع ${o.price} جنيه وابعتلنا الإيصال</h2>
      ${rejected ? `<p class="err-box">⚠️ مقدرناش نأكد التحويل اللي فات${o.rejectReason ? ': ' + esc(o.rejectReason) : ''}. ابعت الإيصال الصح تاني.</p>` : ''}
      <p class="hint">حوّل المبلغ بأي طريقة من دول، وبعدين ارفع صورة (سكرين شوت) من التحويل تحت.</p>
      <div class="pay-grid">
        <div class="pay-opt">
          <h3>إنستاباي</h3>
          <img class="qr" src="/img/instapay-qr.png" alt="QR إنستاباي" />
          <div class="copy-row"><code>${esc(m.instapay)}</code><button type="button" class="copy" data-v="${esc(m.instapay)}">نسخ</button></div>
          <a class="btn alt small" href="${esc(m.instapayLink)}" target="_blank" rel="noopener">افتح إنستاباي وادفع</a>
        </div>
        <div class="pay-opt">
          <h3>محفظة إلكترونية</h3>
          <p class="hint" style="margin:6px 0">فودافون كاش، أورنج كاش، اتصالات كاش، WE Pay أو أي محفظة</p>
          <div class="copy-row big-num"><code>${esc(m.wallet)}</code><button type="button" class="copy" data-v="${esc(m.wallet)}">نسخ</button></div>
        </div>
      </div>
      <form id="rf" class="receipt-form">
        <label class="lbl">دفعت بإيه؟</label>
        <div class="seg">
          <label><input type="radio" name="method" value="instapay" checked /><span>إنستاباي</span></label>
          <label><input type="radio" name="method" value="wallet" /><span>محفظة</span></label>
        </div>
        <label class="lbl" for="sender">اسمك أو الرقم اللي حوّلت منه</label>
        <input type="text" id="sender" maxlength="80" placeholder="عشان نلاقي التحويل بسرعة" />
        <label class="lbl" for="receipt">صورة إيصال التحويل</label>
        <input type="file" id="receipt" accept="image/*,application/pdf" />
        <p class="err" id="rerr"></p>
        <button class="btn" id="send">ابعت الإيصال ✅</button>
      </form>`;
    box.querySelectorAll('.copy').forEach((b) => b.onclick = async () => {
      try { await navigator.clipboard.writeText(b.dataset.v); b.textContent = 'اتنسخ ✓'; setTimeout(() => (b.textContent = 'نسخ'), 1500); } catch {}
    });
    document.getElementById('rf').onsubmit = async (e) => {
      e.preventDefault();
      const err = document.getElementById('rerr'); err.textContent = '';
      const f = document.getElementById('receipt').files[0];
      if (!f) return (err.textContent = 'ارفع صورة إيصال التحويل');
      if (f.size > 10 * 1024 * 1024) return (err.textContent = 'الصورة أكبر من 10 ميجا');
      const fd = new FormData();
      fd.append('receipt', f);
      fd.append('method', document.querySelector('input[name=method]:checked').value);
      fd.append('senderInfo', document.getElementById('sender').value.trim());
      const btn = document.getElementById('send'); btn.disabled = true; btn.textContent = 'بنرفع… ⏳';
      try {
        const r = await fetch(`/api/orders/${encodeURIComponent(id)}/receipt?t=${encodeURIComponent(t)}`, { method: 'POST', body: fd });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'حصلت مشكلة');
        show(d);
      } catch (ex) { err.textContent = ex.message; btn.disabled = false; btn.textContent = 'ابعت الإيصال ✅'; }
    };
  }

  if (!id || !t) box.innerHTML = '<div class="big">🤔</div><h2>اللينك ناقص</h2>';
  else load();
})();

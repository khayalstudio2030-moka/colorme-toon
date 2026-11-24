(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LABEL = {
    awaiting_review: 'مستني مراجعة الدفع', awaiting_payment: 'لسه مدفعش', payment_rejected: 'الدفع اترفض',
    paid: 'مدفوع', processing: 'بيترسم', ready: 'جاهز', failed: 'فشل',
  };
  const TABS = [['awaiting_review', 'مستني مراجعة'], ['active', 'شغال / جاهز'], ['awaiting_payment', 'لسه مدفعش'], ['all', 'الكل']];
  let key = '';
  try { key = localStorage.getItem('cmt_admin') || ''; } catch {}
  let tab = 'awaiting_review';
  let data = [];

  const api = async (url, opts = {}) => {
    const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), 'x-admin-key': key, 'Content-Type': 'application/json' } });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) throw Object.assign(new Error(d.error || 'المفتاح غلط'), { auth: true });
    if (!r.ok) throw new Error(d.error || 'حصلت مشكلة');
    return d;
  };

  function showLogin(msg) {
    $('panel').style.display = 'none'; $('login').style.display = '';
    $('lerr').textContent = msg || '';
  }

  async function load() {
    try {
      const d = await api('/api/admin/orders');
      data = d.orders;
      const w = d.whatsapp || {};
      $('wa').innerHTML = w.configured
        ? `🔔 الإشعارات شغالة على: ${esc((w.channels || []).map((c) => ({ telegram: 'تليجرام', whatsapp_greenapi: 'واتساب ' + w.phone, callmebot: 'واتساب ' + w.phone, textmebot: 'واتساب ' + w.phone, webhook: 'Webhook' }[c] || c)).join('، '))} <button class="chip" id="watest">جرّب رسالة</button>`
        : `🔔 الإشعارات لسه مش متفعّلة (ناقص TELEGRAM_BOT_TOKEN في Railway)`;
      const wt = $('watest');
      if (wt) wt.onclick = async () => {
        wt.disabled = true;
        try { const r = await api('/api/admin/notify-test', { method: 'POST', body: '{}' }); alert(r.ok ? 'اتبعتت ✅ شوف تليجرام / واتساب' : 'مااتبعتتش: ' + JSON.stringify(r.results)); }
        catch (e) { alert(e.message); }
        wt.disabled = false;
      };
      $('login').style.display = 'none'; $('panel').style.display = '';
      render();
    } catch (e) { if (e.auth) showLogin(key ? e.message : ''); else alert(e.message); }
  }

  function filtered() {
    if (tab === 'all') return data;
    if (tab === 'active') return data.filter((o) => ['paid', 'processing', 'ready', 'failed'].includes(o.status));
    if (tab === 'awaiting_payment') return data.filter((o) => ['awaiting_payment', 'payment_rejected'].includes(o.status));
    return data.filter((o) => o.status === tab);
  }

  function render() {
    $('tabs').innerHTML = TABS.map(([k, l]) => {
      const n = k === 'all' ? data.length : (k === tab ? filtered().length : null);
      const cnt = k === 'awaiting_review' ? data.filter((o) => o.status === 'awaiting_review').length : n;
      return `<button class="chip ${k === tab ? 'on' : ''}" data-k="${k}">${l}${cnt != null ? ` (${cnt})` : ''}</button>`;
    }).join('');
    $('tabs').querySelectorAll('button').forEach((b) => (b.onclick = () => { tab = b.dataset.k; render(); }));
    const list = filtered();
    if (!list.length) { $('list').innerHTML = '<p class="empty">مفيش طلبات هنا 👌</p>'; return; }
    $('list').innerHTML = list.map((o) => {
      const rc = o.hasReceipt ? `/api/admin/orders/${o.id}/receipt?key=${encodeURIComponent(key)}` : '';
      return `<div class="ord">
        ${rc ? `<a href="${rc}" target="_blank"><img class="rc" src="${rc}" alt="الإيصال" onerror="this.outerHTML='<div class=rc>📄 الإيصال<br/>(اضغط للفتح)</div>'"/></a>` : '<div class="rc">مفيش إيصال</div>'}
        <div>
          <h3>${esc(o.childName)} <span class="badge ${o.status}">${LABEL[o.status] || o.status}</span>${o.adminFree ? ' <span class="badge free">🎁 مجاني</span>' : ''}</h3>
          <div class="meta">
            <div><b>المبلغ:</b> ${esc(o.price)} جنيه ${o.paymentMethod ? `— ${o.paymentMethod === 'wallet' ? 'محفظة' : 'إنستاباي'}` : ''}</div>
            ${o.senderInfo ? `<div><b>حوّل من:</b> ${esc(o.senderInfo)}</div>` : ''}
            <div><b>ولي الأمر:</b> ${esc(o.parentName)} — <a href="tel:${esc(o.phone)}">${esc(o.phone || '-')}</a> — ${esc(o.email)}</div>
            <div><b>وقت الطلب:</b> ${new Date(o.createdAt).toLocaleString('ar-EG')}</div>
            ${o.receiptAt ? `<div><b>وقت الإيصال:</b> ${new Date(o.receiptAt).toLocaleString('ar-EG')}</div>` : ''}
            ${o.rejectReason ? `<div><b>سبب الرفض:</b> ${esc(o.rejectReason)}</div>` : ''}
            ${o.images ? `<div><b>الصفحات:</b> ${o.images} من 10</div>` : ''}
            <div class="hint" style="font-size:12px">${o.id}</div>
          </div>
          <div class="acts">
            ${['awaiting_review', 'awaiting_payment', 'payment_rejected'].includes(o.status) && o.hasReceipt ? `<button class="btn small" data-a="approve" data-id="${o.id}">✅ تأكيد الدفع وابدأ الرسم</button>` : ''}
            ${['awaiting_payment', 'payment_rejected'].includes(o.status) ? `<button class="btn alt small" data-a="free" data-id="${o.id}">🎁 فعّله مجاناً</button>` : ''}
            ${o.status === 'awaiting_review' ? `<button class="btn alt small" data-a="reject" data-id="${o.id}">❌ رفض</button>` : ''}
            <a class="chip" href="${o.orderUrl}" target="_blank">صفحة الطلب</a>
          </div>
        </div>
      </div>`;
    }).join('');
    $('list').querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => act(b.dataset.a, b.dataset.id, b)));
  }

  async function act(a, id, btn) {
    const o = data.find((x) => x.id === id);
    let body = {};
    if (a === 'approve' && !confirm(`تأكيد استلام ${o.price} جنيه لطلب ${o.childName}؟ الكتاب هيبدأ يترسم على طول.`)) return;
    if (a === 'reject') {
      const reason = prompt('سبب الرفض (هيظهر للعميل):', 'التحويل موصلش أو المبلغ ناقص');
      if (reason === null) return;
      body = { reason };
    }
    if (a === 'free') {
      if (!confirm(`تعمل طلب ${o.childName} مجاناً؟ الكتاب هيبدأ يترسم من غير دفع.`)) return;
      a = 'approve'; body = { free: true };
    }
    btn.disabled = true;
    try { await api(`/api/admin/orders/${id}/${a}`, { method: 'POST', body: JSON.stringify(body) }); await load(); }
    catch (e) { alert(e.message); btn.disabled = false; }
  }

  $('enter').onclick = () => {
    key = $('key').value.trim();
    try { localStorage.setItem('cmt_admin', key); } catch {}
    load();
  };
  $('key').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('enter').click(); });
  $('refresh').onclick = load;
  $('logout').onclick = () => { key = ''; try { localStorage.removeItem('cmt_admin'); } catch {} showLogin(); };
  setInterval(() => { if (key && $('panel').style.display !== 'none') load(); }, 30000);

  if (key) load(); else showLogin();
})();

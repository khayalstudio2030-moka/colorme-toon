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
        : `🔔 الإشعارات لسه مش متفعّلة (ناقص TELEGRAM_BOT_TOKEN في Railway)`
      $('wa').innerHTML += `<br/>🖍️ الرسم: ${d.generator === 'server' ? 'من السيرفر مباشرة (Gemini)' : 'عن طريق n8n'}`;
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
            ${o.images ? `<div><b>الصفحات:</b> ${o.images} من 10${o.coverStatus ? ` — <b>الغلاف:</b> ${{ done: '✅ جاهز', pending: '⏳ بيتلوّن', failed: '❌ فشل', off: 'مش متفعّل' }[o.coverStatus] || o.coverStatus}` : ''}</div>` : ''}
            ${o.status === 'failed' && o.error ? `<div style="color:#c0392b"><b>المشكلة:</b> ${esc(o.error)}</div>` : ''}
            <div class="hint" style="font-size:12px">${o.id}${o.generator === 'server' ? ' — اترسم من السيرفر' : ''}</div>
          </div>
          <div class="acts">
            ${['awaiting_review', 'awaiting_payment', 'payment_rejected'].includes(o.status) && o.hasReceipt ? `<button class="btn small" data-a="approve" data-id="${o.id}">✅ تأكيد الدفع وابدأ الرسم</button>` : ''}
            ${['awaiting_payment', 'payment_rejected'].includes(o.status) ? `<button class="btn alt small" data-a="free" data-id="${o.id}">🎁 فعّله مجاناً</button>` : ''}
            ${o.status === 'awaiting_review' ? `<button class="btn alt small" data-a="reject" data-id="${o.id}">❌ رفض</button>` : ''}
            ${o.status === 'failed' || (['paid', 'processing'].includes(o.status) && o.dispatchedAt && Date.now() - new Date(o.dispatchedAt) > 15 * 60000) ? `<button class="btn small" data-a="resume" data-id="${o.id}">🔁 كمّل الرسم</button>` : ''}
            ${o.status === 'ready' ? `<button class="chip" data-a="redo" data-id="${o.id}">🖌️ أعد رسم صفحة</button>` : ''}
            ${o.status === 'ready' ? `<button class="chip" data-a="cover" data-id="${o.id}">🎨 ${o.coverStatus === 'done' ? 'لوّن الغلاف تاني' : o.coverStatus === 'pending' ? 'الغلاف بيتلوّن…' : 'لوّن الغلاف'}</button>` : ''}
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
    if (a === 'cover') {
      if (o.coverStatus === 'pending') return;
      if (!confirm('تلوّن غلاف جديد للطلب ده؟ (صورة واحدة من رصيد Google)')) return;
    }
    if (a === 'resume' && !confirm(`تكمّل رسم طلب ${o.childName}؟ الصفحات الناقصة بس هي اللي هتترسم.`)) return;
    if (a === 'redo') {
      const n = prompt(`رقم الصفحة اللي عايز ترسمها تاني (1 لـ 10)؟\nصفحة 1 بيتعمل منها الغلاف كمان، فهيتلوّن من جديد.`, '');
      if (n === null || !n.trim()) return;
      a = 'redo-page'; body = { page: Number(n.trim()) };
      btn.textContent = '⏳ بنرسم الصفحة… (حوالي دقيقة)';
    }
    if (a === 'free') {
      if (!confirm(`تعمل طلب ${o.childName} مجاناً؟ الكتاب هيبدأ يترسم من غير دفع.`)) return;
      a = 'approve'; body = { free: true };
    }
    btn.disabled = true;
    try { await api(`/api/admin/orders/${id}/${a}`, { method: 'POST', body: JSON.stringify(body) }); await load(); }
    catch (e) { alert(e.message); btn.disabled = false; }
  }


  // ---------- الإحصائيات ----------
  const STEPS = [
    ['visit', 'دخلوا الموقع'], ['order_cta', 'داسوا «اطلب»'], ['form_start', 'بدأوا يملوا الفورم'],
    ['photo_added', 'رفعوا صورة الطفل'], ['begin_checkout', 'بعتوا الطلب'], ['receipt_uploaded', 'رفعوا إيصال الدفع'],
  ];
  const SRC = { facebook: 'فيسبوك', instagram: 'إنستجرام', tiktok: 'تيك توك', google: 'جوجل', linkedin: 'لينكد إن', whatsapp: 'واتساب', direct: 'مباشر / من غير مصدر', efham: 'منصة افهم' };
  const RANGES = [[1, 'النهارده'], ['y', 'امبارح'], [7, 'آخر 7 أيام'], [30, 'آخر 30 يوم']];
  let range = 7, statsData = null;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const dayName = (d) => new Date(d + 'T12:00:00').toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'numeric' });

  async function loadStats() {
    $('stats').innerHTML = '<p class="empty">⏳ بنحمّل الأرقام…</p>';
    try { statsData = await api('/api/admin/stats?days=30'); renderStats(); }
    catch (e) { $('stats').innerHTML = `<p class="empty">${esc(e.message)}</p>`; }
  }

  function renderStats() {
    const all = statsData.days;
    const sel = range === 'y' ? all.slice(-2, -1) : all.slice(-range);
    const ev = {}, src = {}, dev = {}, ord = { created: 0, receipts: 0, ready: 0, paidCount: 0, revenue: 0, free: 0 };
    for (const d of sel) {
      for (const [k, v] of Object.entries(d.ev || {})) ev[k] = (ev[k] || 0) + v;
      for (const [k, v] of Object.entries(d.src || {})) src[k] = (src[k] || 0) + v;
      for (const [k, v] of Object.entries(d.dev || {})) dev[k] = (dev[k] || 0) + v;
      for (const k of Object.keys(ord)) ord[k] += d.orders[k] || 0;
    }
    const v0 = ev.visit || 0;
    // نسبة الشراء من الأيام اللي العدّاد كان شغال فيها بس
    let cv = 0, cp = 0;
    for (const d of sel) if (statsData.since && d.day >= statsData.since) { cv += d.ev.visit || 0; cp += d.orders.paidCount || 0; }
    const conv = cv ? Math.min(pct(cp, cv), 100) + '%' : '—';
    // أكبر نقطة الناس بتخرج عندها
    let worst = -1, worstLoss = 0;
    STEPS.forEach(([k], i) => { if (!i) return; const prev = ev[STEPS[i - 1][0]] || 0, cur = ev[k] || 0; if (prev - cur > worstLoss) { worstLoss = prev - cur; worst = i; } });
    const funnel = STEPS.map(([k, l], i) => {
      const n = ev[k] || 0, prev = i ? ev[STEPS[i - 1][0]] || 0 : n;
      const lost = i ? prev - n : 0;
      return `<div class="fun-row ${i === worst ? 'worst' : ''}"><div>${l}</div><div class="fun-bar"><i style="width:${v0 ? Math.max(pct(n, v0), n ? 2 : 0) : 0}%"></i></div>
        <div><b>${n}</b> ${i ? `<span class="hint">(${pct(n, prev)}%)</span>` : ''}${lost > 0 ? `<div class="st-drop">خرج ${lost}</div>` : ''}</div></div>`;
    }).join('');
    const srcRows = Object.entries(src).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<tr><td>${esc(SRC[k] || k)}</td><td>${n}</td><td>${pct(n, v0)}%</td></tr>`).join('') || '<tr><td colspan="3">لسه مفيش</td></tr>';
    const mob = dev.mobile || 0, desk = dev.desktop || 0;
    const daily = all.slice(-(range === 30 ? 30 : 7)).reverse().map((d) => `<tr><td>${dayName(d.day)}</td><td>${d.ev.visit || 0}</td><td>${d.ev.order_cta || 0}</td><td>${d.ev.photo_added || 0}</td><td>${d.orders.created}</td><td>${d.orders.receipts}</td><td>${d.orders.revenue}</td></tr>`).join('');
    let note = '';
    if (!v0) note = 'لسه مفيش زيارات في الفترة دي. العدّاد بدأ يشتغل من يوم ' + (statsData.since ? dayName(statsData.since) : 'النهارده') + '.';
    else if (worst > 0) note = `📍 أكتر مكان الناس بتخرج منه: بين «${STEPS[worst - 1][1]}» و«${STEPS[worst][1]}» — خرج ${worstLoss} من ${ev[STEPS[worst - 1][0]]}.`;

    $('stats').innerHTML = `
      <h3 style="margin:0 0 8px">📊 الإحصائيات</h3>
      <div class="tabs" style="margin:0">${RANGES.map(([k, l]) => `<button class="chip ${k === range ? 'on' : ''}" data-r="${k}">${l}</button>`).join('')}</div>
      <div class="st-kpis">
        <div class="st-kpi"><b>${v0}</b><span>زيارة</span></div>
        <div class="st-kpi"><b>${ord.created - ord.free}</b><span>طلب اتعمل${ord.free ? ` (+${ord.free} مجاني)` : ''}</span></div>
        <div class="st-kpi"><b>${ord.receipts}</b><span>إيصال اترفع</span></div>
        <div class="st-kpi"><b>${ord.paidCount}</b><span>طلب مدفوع ومتأكد</span></div>
        <div class="st-kpi"><b>${ord.revenue}</b><span>جنيه دخل</span></div>
        <div class="st-kpi"><b>${conv}</b><span>من الزوار اشتروا</span></div>
      </div>
      <h4 style="margin:14px 0 4px">الزوار وصلوا لحد فين؟</h4>
      <div class="fun">${funnel}</div>
      ${note ? `<div class="st-note">${note}</div>` : ''}
      <div class="st-cols" style="margin-top:16px">
        <div><h4 style="margin:0 0 6px">جايين منين؟</h4><table class="st-tbl"><tr><th>المصدر</th><th>زيارات</th><th>النسبة</th></tr>${srcRows}</table></div>
        <div><h4 style="margin:0 0 6px">بيستخدموا إيه؟</h4><table class="st-tbl"><tr><th>الجهاز</th><th>زيارات</th><th>النسبة</th></tr>
          <tr><td>📱 موبايل</td><td>${mob}</td><td>${pct(mob, mob + desk)}%</td></tr><tr><td>💻 كمبيوتر</td><td>${desk}</td><td>${pct(desk, mob + desk)}%</td></tr></table></div>
      </div>
      <h4 style="margin:16px 0 6px">يوم بيوم</h4>
      <div style="overflow-x:auto"><table class="st-tbl"><tr><th>اليوم</th><th>زيارات</th><th>داسوا اطلب</th><th>رفعوا صورة</th><th>طلبات</th><th>إيصالات</th><th>جنيه</th></tr>${daily}</table></div>
      <p class="hint" style="font-size:12px;margin-top:10px">الأرقام دي من الموقع نفسه، ومش بتعدّ زياراتك إنت (المتصفح اللي فاتح بيه اللوحة). الطلبات والفلوس محسوبة من الطلبات الحقيقية.</p>`;
    $('stats').querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => { range = b.dataset.r === 'y' ? 'y' : Number(b.dataset.r); renderStats(); }));
  }

  $('statsBtn').onclick = () => {
    const box = $('stats');
    if (box.style.display === 'none') { box.style.display = ''; $('statsBtn').textContent = '📊 اخفي الإحصائيات'; loadStats(); }
    else { box.style.display = 'none'; $('statsBtn').textContent = '📊 الإحصائيات'; }
  };

  $('enter').onclick = () => {
    key = $('key').value.trim();
    try { localStorage.setItem('cmt_admin', key); } catch {}
    load();
  };
  $('key').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('enter').click(); });
  $('refresh').onclick = () => { load(); if ($('stats').style.display !== 'none') loadStats(); };
  $('logout').onclick = () => { key = ''; try { localStorage.removeItem('cmt_admin'); } catch {} showLogin(); };
  setInterval(() => { if (key && $('panel').style.display !== 'none') load(); }, 30000);

  if (key) load(); else showLogin();
})();

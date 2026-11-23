(() => {
  const PRESETS = [
    '⚽ كورة القدم', '🦖 الديناصورات', '🚀 الفضاء', '🎨 الرسم', '🚗 العربيات', '🐱 القطط',
    '🐶 الكلاب', '🦄 اليونيكورن', '👸 الأميرات', '🦸 الأبطال الخارقين', '🏊 السباحة', '🚲 العجلة',
    '🎵 المزيكا', '💃 الرقص', '📚 القراءة', '🧁 الطبخ', '🌊 البحر', '🦁 الغابة والحيوانات',
  ];
  const MAX = 10;
  const selected = new Set();
  const $ = (id) => document.getElementById(id);

  fetch('/api/config').then((r) => r.json()).then((c) => {
    if (c.paymentMode === 'free') {
      $('priceTag').innerHTML = '10 صفحات <b>مجاناً</b> 🎁';
      $('go').textContent = 'اعمل الكتاب مجاناً 🚀';
    } else {
      $('price').textContent = c.price;
      if (c.paymentMode === 'mock') $('go').textContent = 'ادفع واعمل الكتاب (دفع تجريبي) 🚀';
    }
  }).catch(() => {});

  // الاهتمامات
  const chips = $('chips');
  function render() {
    chips.innerHTML = '';
    const all = [...PRESETS, ...[...selected].filter((s) => !PRESETS.includes(s))];
    for (const label of all) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (selected.has(label) ? ' on' : '') + (!PRESETS.includes(label) ? ' custom' : '');
      b.textContent = label;
      b.onclick = () => {
        if (selected.has(label)) selected.delete(label);
        else if (selected.size < MAX) selected.add(label);
        render();
      };
      chips.appendChild(b);
    }
  }
  render();
  function addCustom() {
    const v = $('customInterest').value.trim();
    if (v && selected.size < MAX) { selected.add(v); $('customInterest').value = ''; render(); }
  }
  $('addInterest').onclick = addCustom;
  $('customInterest').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } });

  // الصورة
  const drop = $('drop'), photo = $('photo');
  photo.addEventListener('change', () => {
    const f = photo.files[0];
    if (!f) return drop.classList.remove('has');
    $('pimg').src = URL.createObjectURL(f);
    drop.classList.add('has');
  });
  ['dragenter', 'dragover'].forEach((e) => drop.addEventListener(e, () => drop.classList.add('over')));
  ['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, () => drop.classList.remove('over')));

  // الإرسال
  $('f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('err'); err.textContent = '';
    const f = photo.files[0];
    const fail = (m) => { err.textContent = m; };
    if (!f) return fail('ارفع صورة الطفل الأول');
    if (f.size > 10 * 1024 * 1024) return fail('الصورة أكبر من 10 ميجا');
    if (!$('childName').value.trim()) return fail('اكتب اسم الطفل');
    if (!selected.size) return fail('اختار حاجة واحدة على الأقل بيحبها');
    if (!$('parentName').value.trim()) return fail('اكتب اسمك');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('email').value.trim())) return fail('الإيميل مش صحيح');
    if (!$('consent').checked) return fail('لازم توافق على استخدام الصورة');

    const fd = new FormData();
    fd.append('photo', f);
    ['childName', 'childAge', 'notes', 'parentName', 'phone', 'email'].forEach((k) => fd.append(k, $(k).value.trim()));
    const g = document.querySelector('input[name=childGender]:checked');
    if (g) fd.append('childGender', g.value);
    // نشيل الإيموجي قبل ما نبعت
    fd.append('interests', JSON.stringify([...selected].map((s) => s.replace(/^[\p{Extended_Pictographic}️\s]+/u, ''))));
    fd.append('consent', 'true');

    const btn = $('go'); const txt = btn.textContent;
    btn.disabled = true; btn.textContent = 'ثانية واحدة… ⏳';
    try {
      const r = await fetch('/api/orders', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'حصلت مشكلة');
      location.href = d.redirect;
    } catch (ex) {
      fail(ex.message);
      btn.disabled = false; btn.textContent = txt;
    }
  });
})();

(() => {
  const PRESETS = [
    '⚽ كورة القدم', '🏀 كورة السلة', '🦖 الديناصورات', '🚀 الفضاء', '🤖 الروبوتات', '🔬 العلوم',
    '♟️ الشطرنج', '🎨 الرسم', '🚗 العربيات', '🦸 الأبطال الخارقين', '🏴‍☠️ القراصنة', '🏊 السباحة',
    '🚲 العجلة', '🐎 ركوب الخيل', '🤸 الجمباز', '🩰 الباليه', '💃 الرقص', '🎵 المزيكا',
    '📚 القراءة', '🧁 الطبخ', '🌻 الزراعة', '👸 الأميرات', '🦄 اليونيكورن', '🧜 عروسة البحر',
    '🌊 البحر', '⛄ الثلج والشتا', '🦁 الغابة والحيوانات', '🐱 القطط', '🐶 الكلاب',
  ];
  const ANIMALS = [
    '🐱 قطة', '🐶 كلب', '🐰 أرنب', '🐎 حصان', '🦜 ببغاء', '🐧 بطريق', '🐬 دولفين', '🦁 أسد', '🐢 سلحفاة',
    '🦆 بطة', '🐘 فيل', '🐟 سمكة', '🦋 فراشة', '🐼 باندا', '🦒 زرافة', '🐒 قرد', '🦖 ديناصور', '🦄 يونيكورن',
  ];
  const HABITS = [
    '🦷 غسيل السنان', '🌙 النوم بدري', '📵 قفل الموبايل', '🧸 ترتيب اللعب', '🥦 الأكل الصحي', '🧼 غسيل الإيدين',
    '🍽️ مساعدة ماما', '✏️ المذاكرة', '📚 القراءة', '🌸 الأدب', '🤝 المشاركة', '💧 شرب الماية', '🤸 الرياضة', '👟 يلبس لوحده', '🛁 الاستحمام',
  ];
  const strip = (s) => s.replace(/^[\p{Extended_Pictographic}\u200d\ufe0f\s]+/u, '').trim();
  let animal = '';
  const MAX = 10;
  const selected = new Set();
  const $ = (id) => document.getElementById(id);

  // وضع "طلب مجاني" — بيظهر بس لما الأدمن يفتح الرابط من لوحة الطلبات وهو داخل بمفتاحه
  let adminKey = '';
  try { if (new URLSearchParams(location.search).get('free') === '1') adminKey = localStorage.getItem('cmt_admin') || ''; } catch {}

  fetch('/api/config').then((r) => r.json()).then((c) => {
    if (c.paymentMode === 'free') {
      $('priceTag').innerHTML = '10 صفحات <b>مجاناً</b> 🎁';
      $('go').textContent = 'اعمل الكتاب مجاناً 🚀';
    } else {
      $('price').textContent = c.price;
      if (c.paymentMode === 'mock') $('go').textContent = 'ادفع واعمل الكتاب (دفع تجريبي) 🚀';
      if (c.paymentMode === 'manual') $('go').textContent = 'كمّل للدفع (إنستاباي / محفظة) 🚀';
    }
    if (adminKey) {
      $('go').textContent = '🎁 اعمل الكتاب مجاناً (أدمن)';
      const bar = document.createElement('div');
      bar.className = 'admin-bar';
      bar.textContent = '🎁 وضع الطلب المجاني — انت داخل كأدمن، الطلب ده مش هيتطلب منه دفع.';
      document.body.prepend(bar);
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

  // نوع الكتاب
  const habitSel = new Set();
  const hchips = $('habitChips');
  function renderHabits() {
    hchips.innerHTML = '';
    for (const label of HABITS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (habitSel.has(label) ? ' on' : '');
      b.textContent = label;
      b.onclick = () => { if (habitSel.has(label)) habitSel.delete(label); else if (habitSel.size < MAX) habitSel.add(label); renderHabits(); };
      hchips.appendChild(b);
    }
  }
  renderHabits();
  const bookType = () => (document.querySelector('input[name=bookType]:checked') || {}).value || 'hobbies';
  function syncType() {
    const t = bookType();
    $('secHobbies').hidden = t !== 'hobbies';
    $('secHabits').hidden = t !== 'habits';
    $('secLetters').hidden = t !== 'letters';
  }
  document.querySelectorAll('input[name=bookType]').forEach((r) => r.addEventListener('change', () => { syncType(); if (window.track) window.track('book_type_' + bookType(), {}, true); }));
  try { const q = new URLSearchParams(location.search).get('book'); const r = q && document.querySelector(`input[name=bookType][value="${q}"]`); if (r) r.checked = true; } catch {}
  syncType();

  // الحيوان المفضل (اختيار واحد)
  const achips = $('animalChips');
  function renderAnimals() {
    achips.innerHTML = '';
    const list = animal && !ANIMALS.some((a) => strip(a) === animal) ? [...ANIMALS, animal] : ANIMALS;
    for (const label of list) {
      const b = document.createElement('button');
      b.type = 'button';
      const v = strip(label);
      b.className = 'chip' + (animal === v ? ' on' : '') + (!ANIMALS.includes(label) ? ' custom' : '');
      b.textContent = label;
      b.onclick = () => { animal = animal === v ? '' : v; renderAnimals(); };
      achips.appendChild(b);
    }
  }
  renderAnimals();
  function addAnimal() {
    const v = $('customAnimal').value.trim();
    if (v) { animal = v; $('customAnimal').value = ''; renderAnimals(); }
  }
  $('addAnimal').onclick = addAnimal;
  $('customAnimal').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addAnimal(); } });

  // الموبايل: اعرض أكتر في الهوايات والحيوانات
  document.querySelectorAll('.more-chips').forEach((b) => (b.onclick = () => { $(b.dataset.for).classList.remove('collapsed'); b.classList.add('gone'); }));

  // الزرار الثابت تحت: يختفي لما الفورم يظهر
  const sticky = $('stickyCta'), orderSec = $('order');
  if (sticky && orderSec && 'IntersectionObserver' in window) {
    new IntersectionObserver((es) => es.forEach((e) => sticky.classList.toggle('hide', e.isIntersecting || e.boundingClientRect.top < 0))).observe(orderSec);
  }

  // الصورة
  const drop = $('drop'), photo = $('photo');
  photo.addEventListener('change', () => {
    const f = photo.files[0];
    if (!f) return drop.classList.remove('has');
    $('pimg').src = URL.createObjectURL(f);
    drop.classList.add('has');
    if (window.track) window.track('photo_added', {}, true);
  });
  // أول ما حد يبدأ يملا الفورم
  $('f').addEventListener('focusin', () => { if (window.track) window.track('form_start', {}, true); });
  $('f').addEventListener('click', () => { if (window.track) window.track('form_start', {}, true); });
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
    const t = bookType();
    const g0 = document.querySelector('input[name=childGender]:checked');
    if (t === 'hobbies' && !selected.size) return fail('اختار حاجة واحدة على الأقل بيحبها');
    if (t === 'habits' && !habitSel.size) return fail('اختار عادة واحدة على الأقل');
    if (t === 'habits' && !g0) return fail('اختار ولد ولا بنت (عشان الجمل اللي في الكتاب)');
    if (!adminKey && !$('parentName').value.trim()) return fail('اكتب اسمك');
    const em = $('email').value.trim();
    if (!(adminKey && !em) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return fail('الإيميل مش صحيح');
    if (!$('consent').checked) return fail('لازم توافق على استخدام الصورة');

    const fd = new FormData();
    fd.append('photo', f);
    ['childName', 'childAge', 'notes', 'parentName', 'phone', 'email'].forEach((k) => fd.append(k, $(k).value.trim()));
    const g = document.querySelector('input[name=childGender]:checked');
    if (g) fd.append('childGender', g.value);
    // نشيل الإيموجي قبل ما نبعت
    fd.append('bookType', t);
    if (t === 'hobbies') {
      fd.append('interests', JSON.stringify([...selected].map(strip)));
      if (animal) fd.append('favoriteAnimal', animal);
    }
    if (t === 'habits') fd.append('habits', JSON.stringify([...habitSel].map(strip)));
    if (t === 'letters') fd.append('lettersSet', (document.querySelector('input[name=lettersSet]:checked') || {}).value || 'ar');
    fd.append('consent', 'true');
    if (adminKey) fd.append('adminFree', 'true');

    const btn = $('go'); const txt = btn.textContent;
    btn.disabled = true; btn.textContent = 'ثانية واحدة… ⏳';
    try {
      const r = await fetch('/api/orders', { method: 'POST', body: fd, headers: adminKey ? { 'x-admin-key': adminKey } : {} });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'حصلت مشكلة');
      if (window.track && !adminKey) window.track('begin_checkout', { value: Number($('price').textContent) || 199, currency: 'EGP' });
      setTimeout(() => { location.href = d.redirect; }, 400);
    } catch (ex) {
      fail(ex.message);
      btn.disabled = false; btn.textContent = txt;
    }
  });
})();

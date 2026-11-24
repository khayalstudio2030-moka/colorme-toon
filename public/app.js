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
  const strip = (s) => s.replace(/^[\p{Extended_Pictographic}\u200d\ufe0f\s]+/u, '').trim();
  let animal = '';
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
    fd.append('interests', JSON.stringify([...selected].map(strip)));
    if (animal) fd.append('favoriteAnimal', animal);
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

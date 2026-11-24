(() => {
  // نماذج — أطفال متخيّلين اتعملوا بالذكاء الاصطناعي
  const KIDS = [
    { g: 'ولد', tags: ['⚽ كورة القدم', '🦖 الديناصورات', '🚀 الفضاء', '🚲 العجلة'] },
    { g: 'ولد', tags: ['🤖 الروبوتات', '🔬 العلوم', '♟️ الشطرنج', '🔭 النجوم'] },
    { g: 'ولد', tags: ['🚂 القطارات', '🚒 المطافي', '🐰 الأرانب', '🚜 المزرعة'] },
    { g: 'ولد', tags: ['🏊 السباحة', '🏀 كورة السلة', '🐬 الدلافين', '🌊 البحر'] },
    { g: 'ولد', tags: ['🥁 المزيكا', '🦁 الأسود', '🐎 ركوب الخيل', '🏝️ المغامرات'] },
    { g: 'بنت', tags: ['🩰 الباليه', '👑 الأميرات', '🦄 اليونيكورن', '🐱 القطط'] },
    { g: 'بنت', tags: ['📚 القراءة', '🎨 الرسم', '🦋 الفراشات', '🐱 القطط'] },
    { g: 'بنت', tags: ['🌻 الزراعة', '🧁 الطبخ', '🦆 البط', '🐰 الأرانب'] },
    { g: 'بنت', tags: ['🤸 الجمباز', '🐎 ركوب الخيل', '🎀 الرقص بالشريطة'] },
    { g: 'بنت', tags: ['🧜 عروسة البحر', '🏖️ البحر', '🐧 البطريق', '🐠 السمك'] },
  ];
  const $ = (id) => document.getElementById(id);
  const kidsEl = $('galKids'); if (!kidsEl) return;
  const id = (i) => `kid${String(i + 1).padStart(2, '0')}`;
  const page = (i, n) => `/img/gallery/${id(i)}-p${n}.webp`;
  let cur = 0, lbIdx = 0;

  kidsEl.innerHTML = KIDS.map((k, i) =>
    `<button class="gal-kid" role="tab" data-i="${i}" aria-label="نموذج ${i + 1} — ${k.g}"><img src="/img/gallery/${id(i)}-photo.webp" alt="" loading="lazy" /></button>`).join('');

  function show(i) {
    cur = i;
    kidsEl.querySelectorAll('.gal-kid').forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', j === i); });
    $('galPhoto').src = `/img/gallery/${id(i)}-photo.webp`;
    $('galPhoto').alt = `الصورة الأصلية — نموذج ${i + 1}`;
    $('galPages').innerHTML = [1, 2, 3, 4, 5, 6].map((n) =>
      `<button class="gal-page" data-n="${n}"><img src="${page(i, n)}" alt="صفحة تلوين ${n}" loading="lazy" /></button>`).join('');
    $('galTags').innerHTML = `<b>${KIDS[i].g === 'بنت' ? 'بنت بتحب' : 'ولد بيحب'}:</b> ` + KIDS[i].tags.map((t) => `<span>${t}</span>`).join('');
    document.dispatchEvent(new CustomEvent('gallery:change', { detail: { index: i } }));
  }
  kidsEl.addEventListener('click', (e) => { const b = e.target.closest('.gal-kid'); if (b) show(+b.dataset.i); });

  // عرض الصفحة كبيرة
  const lb = $('lightbox');
  const open = (n) => { lbIdx = n; $('lbImg').src = page(cur, n); lb.hidden = false; document.body.style.overflow = 'hidden'; document.dispatchEvent(new CustomEvent('lightbox:open')); };
  const close = () => { lb.hidden = true; document.body.style.overflow = ''; };
  const step = (d) => open(((lbIdx - 1 + d + 6) % 6) + 1);
  $('galPages').addEventListener('click', (e) => { const b = e.target.closest('.gal-page'); if (b) open(+b.dataset.n); });
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lb-x')) close(); });
  lb.querySelector('.lb-prev').onclick = () => step(-1);
  lb.querySelector('.lb-next').onclick = () => step(1);
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(1);
    if (e.key === 'ArrowRight') step(-1);
  });

  show(0);
})();

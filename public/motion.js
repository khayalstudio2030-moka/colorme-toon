// حركات الموقع بـ GSAP — الصفحة الرئيسية، صفحة الطلب، لوحة الأدمن
// لو GSAP ماتحمّلش أو المستخدم مفعّل "تقليل الحركة"، الموقع بيشتغل عادي من غير حركة.
(() => {
  if (!window.gsap) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const CLEAR = { clearProps: 'transform,opacity,visibility' };
  gsap.defaults({ ease: 'power3.out', duration: 0.7 });

  // يظهر العنصر لما يوصله السكرول (مرة واحدة)
  function onView(targets, vars, trigger, start = 'top 85%') {
    const els = typeof targets === 'string' ? $$(targets) : [].concat(targets).filter(Boolean);
    if (!els.length) return;
    gsap.from(els, {
      ...CLEAR, ...vars,
      scrollTrigger: window.ScrollTrigger ? { trigger: trigger || els[0], start, once: true } : undefined,
    });
  }

  // ---------- الهيدر (كل الصفحات) ----------
  gsap.from('header.top .brand', { y: -30, autoAlpha: 0, duration: 0.6, ...CLEAR });
  gsap.from('header.top .btn', { y: -30, autoAlpha: 0, duration: 0.6, delay: 0.1, ...CLEAR });
  // اللوجو بيتهز هزة صغيرة لما تقف عليه
  const logo = $('header.top .brand img');
  if (logo) logo.addEventListener('mouseenter', () => gsap.fromTo(logo, { rotate: 0 }, { rotate: 360, duration: 0.8, ease: 'back.out(1.6)' }));

  // ================= الصفحة الرئيسية =================
  const hero = $('.hero');
  if (hero) {
    const tl = gsap.timeline({ defaults: { ...CLEAR } });
    tl.from('.hero h1', { y: 50, autoAlpha: 0, duration: 0.8 })
      .from('.hero p.lead', { y: 30, autoAlpha: 0 }, '-=0.45')
      .from('.hero .price-tag', { scale: 0.4, autoAlpha: 0, duration: 0.6, ease: 'back.out(2.2)' }, '-=0.35')
      .from('.hero-art img', { scale: 0.7, rotate: -12, autoAlpha: 0, duration: 1, ease: 'elastic.out(1, 0.6)' }, 0.15);

    // خط الماركر تحت "بطل طفلك" بيترسم من اليمين للشمال
    const mark = $('.hero h1 mark');
    if (mark) {
      gsap.set(mark, { backgroundRepeat: 'no-repeat', backgroundPosition: 'right bottom', backgroundSize: '0% 100%' });
      tl.to(mark, { backgroundSize: '100% 100%', duration: 0.7, ease: 'power2.inOut', clearProps: 'none' }, 0.55);
    }
    // صورة الهيرو بتطفو بالراحة
    gsap.to('.hero-art img', { y: -12, rotate: 1.5, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.2 });
    // التاج بيلمع كل شوية
    gsap.timeline({ repeat: -1, repeatDelay: 4, delay: 2.4 })
      .to('.hero .price-tag', { scale: 1.07, rotate: -2, duration: 0.3, ease: 'power1.out' })
      .to('.hero .price-tag', { scale: 1, rotate: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
  }

  // ---------- الخطوات ----------
  if ($('.steps')) {
    onView('.steps .step', { y: 70, autoAlpha: 0, stagger: 0.15, duration: 0.8 }, '.steps');
    onView('.steps .step .n', { scale: 0, rotate: -90, stagger: 0.15, delay: 0.35, duration: 0.6, ease: 'back.out(2.5)' }, '.steps');
    $$('.steps .step').forEach((st) => {
      const img = $('img', st);
      if (!img) return;
      st.addEventListener('mouseenter', () => gsap.to(img, { rotate: -4, scale: 1.05, duration: 0.3, ease: 'back.out(3)' }));
      st.addEventListener('mouseleave', () => gsap.to(img, { rotate: 0, scale: 1, duration: 0.4 }));
    });
  }

  // ---------- نماذج من شغلنا ----------
  if ($('#gallery')) {
    onView('#gallery .head > *', { y: 40, autoAlpha: 0, stagger: 0.12 }, '#gallery');
    onView('#gallery .gal-kid', { scale: 0, autoAlpha: 0, stagger: 0.05, duration: 0.5, ease: 'back.out(2)' }, '#galKids');
    onView('#gallery .gal-tags, #gallery .gal-note, #gallery .btn', { y: 20, autoAlpha: 0, stagger: 0.1 }, '#galTags');
    gsap.to('.gal-arrow', { x: -10, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    const animateShow = () => {
      const photo = $('.gal-photo'), pages = $$('.gal-page'), tags = $$('#galTags span');
      gsap.killTweensOf([photo, ...pages, ...tags]);
      const tl = gsap.timeline({ defaults: { ...CLEAR } });
      tl.from(photo, { x: 60, rotate: 6, autoAlpha: 0, duration: 0.6 })
        .from(pages, { y: 40, scale: 0.85, rotate: () => gsap.utils.random(-6, 6), autoAlpha: 0, stagger: 0.07, duration: 0.55, ease: 'back.out(1.6)' }, 0.15)
        .from(tags, { y: 12, autoAlpha: 0, stagger: 0.05, duration: 0.35 }, 0.3);
      return tl;
    };
    // أول مرة: لما القسم يبان. بعد كده: مع كل اختيار طفل
    if (window.ScrollTrigger) {
      const tl = animateShow(); tl.pause();
      ScrollTrigger.create({ trigger: '.gal-show', start: 'top 85%', once: true, onEnter: () => tl.play() });
    }
    document.addEventListener('gallery:change', () => animateShow());
    // الدايرة المختارة بتنط
    $('#galKids').addEventListener('click', (e) => {
      const b = e.target.closest('.gal-kid');
      if (b) gsap.fromTo(b, { y: 0 }, { y: -10, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', clearProps: 'y' });
    });
    // فتح الصفحة الكبيرة
    document.addEventListener('lightbox:open', () => {
      gsap.fromTo('#lightbox', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, clearProps: 'opacity,visibility' });
      gsap.fromTo('#lbImg', { scale: 0.8, rotate: -3 }, { scale: 1, rotate: 0, duration: 0.45, ease: 'back.out(1.7)', clearProps: 'transform' });
    });
    $$('.lb-nav').forEach((b) => b.addEventListener('click', () =>
      gsap.fromTo('#lbImg', { x: b.classList.contains('lb-next') ? -40 : 40, autoAlpha: 0.3 }, { x: 0, autoAlpha: 1, duration: 0.35, clearProps: 'transform,opacity,visibility' })));
  }

  // ---------- فورم الطلب ----------
  const orderCard = $('#order');
  if (orderCard && $('#f')) {
    onView(orderCard, { y: 80, autoAlpha: 0, duration: 0.9 }, orderCard);
    onView('#f .field', { y: 30, autoAlpha: 0, stagger: 0.06, duration: 0.5, delay: 0.2 }, orderCard);
    // الاختيارات (الهوايات/الحيوانات) بتتحرك لما تتداس
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('#chips .chip, #animalChips .chip, #chips button, #animalChips button');
      if (chip) gsap.fromTo(chip, { scale: 0.85 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.4)', clearProps: 'transform' });
    });
    // معاينة صورة الطفل بعد الرفع
    const pimg = $('#pimg');
    if (pimg) pimg.addEventListener('load', () => gsap.from(pimg, { scale: 0.5, rotate: -10, autoAlpha: 0, duration: 0.6, ease: 'back.out(2)', ...CLEAR }));
    // رسالة الخطأ بتتهز
    const err = $('#err');
    if (err) new MutationObserver(() => {
      if (err.textContent.trim()) gsap.fromTo(err, { x: 0 }, { x: 8, duration: 0.07, yoyo: true, repeat: 5, ease: 'none', clearProps: 'transform' });
    }).observe(err, { childList: true, characterData: true, subtree: true });
    // زرار الإرسال بيلفت النظر لما الفورم يبان
    const go = $('#go');
    if (go && window.ScrollTrigger) ScrollTrigger.create({
      trigger: go, start: 'top 90%', once: true,
      onEnter: () => gsap.fromTo(go, { scale: 1 }, { scale: 1.07, duration: 0.25, yoyo: true, repeat: 3, ease: 'power1.inOut', clearProps: 'transform' }),
    });
  }

  // أزرار: ضغطة صغيرة في كل الموقع
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn');
    if (b && !b.disabled) gsap.fromTo(b, { scale: 0.94 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', clearProps: 'transform' });
  });

  // الفوتر
  onView('footer', { y: 20, autoAlpha: 0 }, 'footer', 'top bottom');

  // ================= صفحة الطلب =================
  const box = $('#box');
  if (box) {
    gsap.from(box, { y: 40, scale: 0.96, autoAlpha: 0, duration: 0.7, ...CLEAR });
    let lastKey = '';
    const animateBox = () => {
      const h = $('h2', box);
      const key = h ? h.textContent : box.textContent.slice(0, 40);
      if (key === lastKey) return; // نفس الحالة (تحديث تلقائي) — من غير حركة
      lastKey = key;
      const kids = Array.from(box.children);
      gsap.from(kids, { y: 25, autoAlpha: 0, stagger: 0.07, duration: 0.5, ...CLEAR });
      const mascot = $('.mascot, .big', box);
      if (mascot) gsap.to(mascot, { y: -10, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      const imgs = $$('img:not(.mascot)', box).filter((i) => i.closest('.grid, .pages, .imgs, a'));
      if (imgs.length) gsap.from(imgs, { scale: 0.7, autoAlpha: 0, stagger: 0.06, duration: 0.5, ease: 'back.out(1.8)', delay: 0.2, ...CLEAR });
      if (/جاهز/.test(key)) confetti();
    };
    new MutationObserver(animateBox).observe(box, { childList: true });
  }

  // كونفيتي لما الكتاب يجهز 🎉
  function confetti() {
    const colors = ['#ff8a3d', '#45b8e8', '#ff9eb5', '#ffd23f', '#7bd389'];
    const layer = document.createElement('div');
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden';
    document.body.appendChild(layer);
    const W = window.innerWidth, H = window.innerHeight;
    for (let i = 0; i < 90; i++) {
      const p = document.createElement('i');
      const s = gsap.utils.random(6, 12);
      p.style.cssText = `position:absolute;top:-20px;left:${gsap.utils.random(0, W)}px;width:${s}px;height:${s * 0.6}px;background:${gsap.utils.random(colors)};border-radius:2px`;
      layer.appendChild(p);
      gsap.to(p, {
        y: H + 40, x: `+=${gsap.utils.random(-120, 120)}`, rotate: gsap.utils.random(-720, 720),
        duration: gsap.utils.random(1.8, 3.2), delay: gsap.utils.random(0, 0.6), ease: 'power1.in',
      });
    }
    gsap.delayedCall(4.2, () => layer.remove());
  }

  // ================= لوحة الأدمن =================
  const list = $('#list');
  if (list && $('#panel')) {
    let seen = new Set();
    new MutationObserver(() => {
      const cards = $$('.ord', list);
      const fresh = cards.filter((c) => { const id = (c.textContent.match(/ord_[a-f0-9]+/) || [])[0]; return id && !seen.has(id); });
      cards.forEach((c) => { const id = (c.textContent.match(/ord_[a-f0-9]+/) || [])[0]; if (id) seen.add(id); });
      if (fresh.length) gsap.from(fresh, { y: 30, autoAlpha: 0, stagger: 0.06, duration: 0.45, ...CLEAR });
    }).observe(list, { childList: true });
    const login = $('#login');
    if (login && login.style.display !== 'none') gsap.from(login, { y: 30, autoAlpha: 0, ...CLEAR });
  }
})();

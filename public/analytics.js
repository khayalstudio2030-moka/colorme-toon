// تتبع الزيارات: Meta Pixel + Google Analytics 4
// الأرقام دي عامة (بتظهر في أي موقع بيستخدمهم)، مش أسرار.
(() => {
  const META_PIXEL_ID = '2212783202863868';
  const GA4_ID = 'G-GXBMSG0Z8F';

  // مانتتبعش لوحة الأدمن ولا الطلبات المجانية بتاعة الأدمن
  let skip = location.pathname.startsWith('/admin');
  try { if (new URLSearchParams(location.search).get('free') === '1' || localStorage.getItem('cmt_admin')) skip = true; } catch {}

  const fbOk = !skip && /^\d+$/.test(META_PIXEL_ID);
  const gaOk = !skip && /^G-[A-Z0-9]+$/.test(GA4_ID);

  if (fbOk) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  if (gaOk) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID);
  }

  // أسماء الأحداث في جوجل ← الحدث المقابل في ميتا
  const META = {
    form_start: ['trackCustom', 'FormStart'],
    photo_added: ['trackCustom', 'PhotoAdded'],
    begin_checkout: ['track', 'InitiateCheckout'],
    receipt_uploaded: ['track', 'Purchase'],
    order_cta: ['trackCustom', 'OrderCTA'],
  };
  const sent = {};

  // track('begin_checkout', {value:199}) — once: true يبعت الحدث مرة واحدة بس في الزيارة
  window.track = (name, params = {}, once = false) => {
    if (once) { if (sent[name]) return; sent[name] = 1; }
    try {
      if (gaOk) window.gtag('event', name, params);
      const m = META[name];
      if (fbOk && m) window.fbq(m[0], m[1], params);
    } catch {}
  };
})();

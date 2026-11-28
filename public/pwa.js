// تسجيل الأبلكيشن (PWA) + زرار «نزّل التطبيق»
(() => {
  if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  let deferred = null;
  const btns = () => document.querySelectorAll('[data-install]');
  const show = (on) => btns().forEach((b) => (b.hidden = !on));
  function toast(html) {
    let t = document.getElementById('pwaTip');
    if (!t) {
      t = document.createElement('div');
      t.id = 'pwaTip';
      t.style.cssText = 'position:fixed;left:12px;right:12px;bottom:90px;z-index:60;background:#fff;border:3px solid #141414;border-radius:16px;padding:14px 16px;box-shadow:4px 4px 0 #141414;font-size:15px;line-height:1.7;text-align:center';
      t.onclick = () => t.remove();
      document.body.appendChild(t);
    }
    t.innerHTML = html + '<div style="font-size:12px;color:#777;margin-top:6px">(دوس هنا عشان تقفل)</div>';
  }
  if (standalone) return show(false);
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; show(true); });
  addEventListener('appinstalled', () => { show(false); if (window.track) window.track('app_installed', {}, true); });
  document.addEventListener('DOMContentLoaded', () => {
    if (ios) show(true);
    btns().forEach((b) => b.addEventListener('click', async (ev) => {
      ev.preventDefault();
      if (deferred) { deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; show(false); return; }
      if (ios) return toast('على الآيفون: دوس زرار المشاركة <b>⬆️</b> تحت في Safari، وبعدين اختار <b>«إضافة إلى الشاشة الرئيسية»</b>.');
      toast('من قايمة المتصفح <b>⋮</b> اختار <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>.');
    }));
  });
})();

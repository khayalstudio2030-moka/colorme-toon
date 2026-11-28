// ColorMe Toon — Service Worker بسيط: الموقع يتنزّل كأبلكيشن.
// دايماً بنجيب من النت الأول (عشان أي تحديث يظهر على طول)، والكاش احتياطي بس لو النت قاطع.
const CACHE = 'cmt-v1';
const CORE = ['/', '/styles.css', '/app.js', '/img/logo.png', '/icons/icon-192.png', '/offline.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // الطلبات والصور والملفات الخاصة والتتبع: من النت بس، من غير كاش
  if (req.method !== 'GET' || url.origin !== location.origin || /^\/(api|files|admin)/.test(url.pathname)) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('/offline.html') : Response.error())))
  );
});

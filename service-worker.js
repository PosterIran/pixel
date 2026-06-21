const CACHE_NAME = 'poster-iran-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://akbari5561.github.io/PosterIran/icons/logo.png'
];

// نصب سرویس‌ورکر به صورت کاملاً ایمن و مقاوم در برابر خطای کش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // استفاده از روش انفرادی برای جلوگیری از خرابی کل فرآیند نصب در صورت لود نشدن یک فایل
      return Promise.allSettled(
        urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.warn('کش کردن آدرس زیر با خطا مواجه شد ولی نصب ادامه می‌یابد:', url, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// فعال‌سازی و پاکسازی کش‌های قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('در حال حذف کش قدیمی:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// مدیریت آفلاین درخواست‌ها
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
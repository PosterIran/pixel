// ارتقای نسخه کش جهت اعمال آنی تغییرات بر روی دستگاه کاربران
const CACHE_NAME = 'poster-iran-cache-v6';

// فایل‌هایی که به صورت آفلاین باید همواره بدون نقص در دسترس باشند
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://akbari5561.github.io/PosterIran/icons/logo.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// فایل‌های پویا که اولویت لود آنها با شبکه آنلاین است
const NETWORK_FIRST_ASSETS = [
  './index.html',
  './manifest.json'
];

// نصب سرویس‌ورکر و لود اولیه فایل‌های کلیدی
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('کش کردن دارایی‌های ثابت جهت لود بدون نقص آفلاین...');
      return Promise.allSettled(
        STATIC_ASSETS.map(url => {
          return cache.add(url).catch(err => {
            console.warn('خطای جزئی در پیش‌کش کردن آدرس:', url, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// فعال‌سازی و پاکسازی آنی کش‌های قدیمی تداخل‌برانگیز
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

// مدیریت هوشمند و پویا درخواست‌ها: کش کردن فایل‌های جانبی در زمان آنلاین بودن
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // بررسی فایل‌های حساس به آپدیت آنلاین (Network-First)
  const isNetworkFirst = NETWORK_FIRST_ASSETS.some(asset => {
    const cleanAsset = asset.replace('./', '');
    return requestUrl.pathname.endsWith(cleanAsset) || requestUrl.pathname === '/PosterIran/' || requestUrl.pathname === '/';
  });
  
  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
    );
  } else {
    // استراتژی Cache-First همراه با کش کردن پویا برای وب‌فونت‌ها و استایل‌های CDN
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            
            // ذخیره خودکار فونت‌های گوگل و فایل‌های FontAwesome و تصاویر پروژه در حافظه محلی
            if (
              requestUrl.href.includes('fonts.gstatic.com') ||
              requestUrl.href.includes('cdnjs.cloudflare.com') ||
              requestUrl.href.includes('fonts.googleapis.com') ||
              requestUrl.href.includes('tailwindcss.com') ||
              requestUrl.href.includes('/Image/')
            ) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
          }
          return networkResponse;
        }).catch(() => {
          // در صورت آفلاین بودن کامل و عدم دسترسی به کش تصاویر
          if (event.request.destination === 'image') {
            return caches.match('https://akbari5561.github.io/PosterIran/icons/logo.png');
          }
        });
      })
    );
  }
});
// نام کانتینر کش به همراه شماره نسخه (با تغییر این عدد، کل کش قبلی پاک و از نو ساخته می‌شود)
const CACHE_NAME = 'poster-iran-cache-v2.1.6';

// لیست فایل‌های کلیدی و حیاتی برنامه
// نکته: فایل js/script.js حذف شد چون در HTML شما وجود نداشت. اگر وجود دارد، آن را برگردانید.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css?v=2.1.5',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// ۱. نصب سرویس‌ورکر و کش کردن فایل‌های حیاتی
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 کش‌گذاری فایل‌های پایه نسخه v2.1.2 آغاز شد.');
      
      // استفاده از cache: 'reload' فقط در مرحله نصب عالی است تا مطمئن شویم فایل‌های تازه از سرور می‌آیند
      const cachePromises = ASSETS_TO_CACHE.map((url) => {
        return fetch(url, { cache: 'reload' })
          .then((response) => {
            if (response.ok) {
              return cache.put(url, response);
            }
            console.warn(`⚠️ کش نشدن فایل (احتمالاً ۴۰۴ یا مشکل CORS): ${url}`);
          })
          .catch((err) => {
            console.error(`❌ خطای شبکه در کش کردن: ${url}`, err);
          });
      });
      
      return Promise.all(cachePromises);
    })
    // نکته مهم: self.skipWaiting() از اینجا حذف شد تا کنترل به‌روزرسانی به منطق HTML شما (message) سپرده شود.
  );
});

// ۲. فعال‌سازی و پاکسازی کش‌های قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 در حال حذف کش منسوخ شده:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('✅ سرویس‌ورکر جدید فعال شد و کنترل صفحات را به دست گرفت.');
      return self.clients.claim();
    })
  );
});

// ۳. استراتژی هوشمند دریافت داده‌ها (Fetch Strategy)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // الف) درخواست‌های خارجی خاص (مثل API هوش مصنوعی یا تصاویر بزرگ گالری)
  // استراتژی: Network First (اول شبکه)، اگر نشد کش
  if (requestUrl.host.includes('generativelanguage.googleapis.com') || requestUrl.pathname.includes('/Image/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // اگر پاسخ موفق بود، آن را در کش ذخیره کن (برای دفعات بعدی که آفلاین بود)
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // ب) فایل‌های استاتیک محلی و حیاتی (HTML, CSS, JS, Manifest, Icons)
  // استراتژی: Cache First (اول کش)، اگر نبود شبکه. (این سریع‌ترین حالت برای PWA است)
  const isLocalAsset = event.request.destination === 'document' ||
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    requestUrl.origin === self.location.origin;
  
  if (isLocalAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // بازگشت آنی از کش (سرعت نور!)
        }
        // اگر در کش نبود، از شبکه بگیر و در کش ذخیره کن
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }
  
  // ج) سایر فایل‌های خارجی (مثل فونت‌ها و CDNها)
  // استراتژی: Cache First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// ۴. مدیریت دستور فعال‌سازی فوری از طرف فایل HTML
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('🔄 دستور skipWaiting از کلاینت دریافت شد. فعال‌سازی فوری...');
    self.skipWaiting();
  }
});
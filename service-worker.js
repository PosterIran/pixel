// نام کش اصلی برنامه (فایل‌های حیاتی و استاتیک)
const CACHE_NAME = 'poster-iran-cache-v3.4.0';

// نام کش اختصاصی و دائمی تصاویر گالری (جدا از کش برنامه تا با آپدیت نسخه‌ها پاک نشود)
const IMAGE_CACHE_NAME = 'poster-iran-images-v1';

// لیست فایل‌های کلیدی و حیاتی برنامه
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css?v=3.4.0',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// ۱. نصب سرویس‌ورکر و کش کردن فایل‌های حیاتی پایه
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 کش‌گذاری فایل‌های پایه نسخه v3.4.0 آغاز شد.');
      
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
  );
});

// ۲. فعال‌سازی و پاکسازی کش‌های منسوخ‌شده (بدون دست زدن به کش تصاویر گالری)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // فقط کش‌های قدیمی برنامه پاک می‌شوند؛ کش تصاویر محصولات کاملاً حفظ می‌شود
          if (cache !== CACHE_NAME && cache !== IMAGE_CACHE_NAME) {
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
  
  // الف) درخواست‌های تصاویر گالری (مسیر Image/)
  // استراتژی: Cache-First (اول کش اختصاصی تصاویر، اگر نبود دانلود و ذخیره دائمی)
  // این روش باعث می‌شود سرعت لود گالری در مراجعات بعدی صفر ثانیه شود و ترافیک اینترنت کاربر حفظ گردد.
  if (requestUrl.pathname.includes('/Image/') || requestUrl.host.includes('generativelanguage.googleapis.com')) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // اگر تصویر در کش بود، آن را آنی برگردان و در پس‌زمینه نسخه جدید را آپدیت کن
            fetch(event.request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
            }).catch(() => {});
            return cachedResponse;
          }
          
          // اگر در کش نبود، از اینترنت بگیر و در کش تصاویر ذخیره کن
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              cache.put(event.request, responseToCache);
            }
            return networkResponse;
          }).catch(() => {
            // حالت آفلاین کامل که تصویر در کش هم نبوده
            return new Response('تصویر در دسترس نیست', { status: 404, statusText: 'Offline' });
          });
        });
      })
    );
    return;
  }
  
  // ب) فایل‌های استاتیک محلی و حیاتی (HTML, CSS, JS, Manifest, Icons)
  // استراتژی: Cache First (اول کش برنامه، اگر نبود شبکه)
  const isLocalAsset = event.request.destination === 'document' ||
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    requestUrl.origin === self.location.origin;
  
  if (isLocalAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
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
  // استراتژی: Cache First با فالبک شبکه
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
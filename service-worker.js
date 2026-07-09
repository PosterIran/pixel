// نام کانتینر کش به همراه شماره نسخه جدید جهت پاکسازی کش قدیمی در صورت تغییر نسخه
// نسخه جدید v2.1.2 برای اعمال تغییرات آنی در تمام مرورگرهای دسکتاپ و موبایل
const CACHE_NAME = 'poster-iran-cache-v2.1.2';

// لیست فایل‌های کلیدی و حیاتی برنامه
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css?v=2.1.1',
  './js/script.js?v=2.1.1',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// نصب سرویس‌ورکر و کش کردن کدهای هسته اولیه با اضافه کردن هدرهای کش‌شکن در درخواست‌های نصب
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 کش‌گذاری فایل‌های پایه نسخه v2.1.2 آغاز شد.');
      
      // برای رفع باگ کش مرورگر در زمان نصب، درخواست‌ها را با هدر عدم ذخیره‌سازی کش ارسال می‌کنیم
      const cachePromises = ASSETS_TO_CACHE.map((url) => {
        // ایجاد یک درخواست تمیز با نادیده گرفتن کش مرورگر جهت دریافت فایل ۱۰۰٪ جدید از سرور
        const request = new Request(url, { cache: 'reload' });
        return fetch(request).then((response) => {
          if (response.ok) {
            return cache.put(url, response);
          }
          console.warn(`⚠️ دریافت فایل جهت کش با مشکل مواجه شد (احتمال عدم وجود فایل روی هاست): ${url}`);
        }).catch((err) => {
          console.error(`❌ خطا در کش کردن فایل لوکال: ${url}`, err);
        });
      });
      return Promise.all(cachePromises);
    }).then(() => self.skipWaiting()) // آماده‌سازی ورکر جدید برای فعال‌سازی فوری
  );
});

// اکتیو کردن سرویس‌ورکر جدید و پاکسازی همزمان پوشه‌های کش قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 در حال حذف کش‌های منسوخ شده قبلی...', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // به دست گرفتن کنترل فوری تمام صفحات فعال کلاینت
  );
});

// استراتژی کش ترکیبی با دور زدن سخت‌افزاری کش مرورگر دسکتاپ (Windows Bypass)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // برای درخواست‌های سمت تصاویر بزرگ، کاتالوگ ابری و APIها نیازی به کش‌گذاری سخت‌گیرانه لوکال نیست
  if (requestUrl.host.includes('generativelanguage.googleapis.com') || requestUrl.pathname.includes('/Image/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  
  // برای فایل‌های محلی سایت (HTML, JS, CSS) - مرورگر را مجبور می‌کنیم کش دیسک خود را نادیده گرفته و به سرور متصل شود
  const isLocalAsset = event.request.destination === 'document' || 
                       event.request.destination === 'script' || 
                       event.request.destination === 'style' ||
                       requestUrl.origin === self.location.origin;

  if (isLocalAsset) {
    event.respondWith(
      // ساخت یک درخواست مستقیم بدون کش جهت اجبار مرورگر ویندوز به دریافت نسخه جدید از سرور
      fetch(new Request(event.request, { cache: 'no-cache' }))
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // در صورت قطع بودن کامل اینترنت، نسخه کش شده قبلی را تحویل بده
        return caches.match(event.request);
      })
    );
  } else {
    // برای سایر فایل‌های خارجی معمولی (مانند فونت‌ها یا CDNها)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
    );
  }
});

// مدیریت دستور فعال‌سازی فوری ارسالی از کدهای کلاینت
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
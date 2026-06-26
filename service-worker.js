```javascript
// نام کانتینر کش به همراه شماره نسخه جدید جهت پاکسازی کش قدیمی در صورت تغییر نسخه
// نسخه جدید v2.1.1 برای خنثی کردن کش‌های قبلی فایرفاکس
const CACHE_NAME = 'poster-iran-cache-v2.1.1';

// لیست فایل‌های کلیدی - آیکون‌ها و مانیفست برای فایرفاکس الزامی هستند
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
      console.log('📦 کش‌گذاری فایل‌های پایه نسخه v2.1.1 انجام شد.');
      
      // برای رفع باگ کش مرورگر در زمان نصب، درخواست‌ها را با هدر عدم ذخیره‌سازی کش ارسال می‌کنیم
      const cachePromises = ASSETS_TO_CACHE.map((url) => {
        const request = new Request(url, { cache: 'reload' });
        return fetch(request).then((response) => {
          if (response.ok) {
            return cache.put(url, response);
          }
          throw new Error(`خطا در دریافت فایل نصب: ${url}`);
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

// استراتژی کش ترکیبی: Network First برای دریافت آخرین تغییرات و Cache Fallback برای مواقع آفلاین کلاینت
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // برای درخواست‌های سمت تصاویر بزرگ، کاتالوگ ابری و APIها نیازی به کش‌گذاری سخت‌گیرانه لوکال نیست
  if (requestUrl.host.includes('generativelanguage.googleapis.com') || requestUrl.pathname.includes('/Image/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  
  // استراتژی Network-First برای فایل‌های اصلی کلاینت جهت بروزرسانی آنی تغییرات هنگام اتصال اینترنت
  event.respondWith(
    fetch(event.request)
    .then((networkResponse) => {
      // اگر پاسخ دریافتی از سرور معتبر بود، کش را با داده جدید آپدیت می‌کنیم
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
      }
      return networkResponse;
    })
    .catch(() => {
      // در صورت قطع بودن اینترنت یا خطا، فایل از کش لوکال لود می‌شود
      return caches.match(event.request);
    })
  );
});

// مدیریت دستور فعال‌سازی فوری ارسالی از کدهای index.html کلاینت
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

```

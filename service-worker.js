```js
// =====================================================
// Service Worker - پوستر ایران
// حالت: همیشه آخرین نسخه آنلاین
// =====================================================

// نام ثابت؛ نیازی نیست برای هر تغییر آن را عوض کنید.
const CACHE_NAME = 'poster-iran-cache';


// =====================================================
// 1. نصب Service Worker جدید
// =====================================================

self.addEventListener('install', (event) => {

  console.log('🚀 Service Worker جدید نصب شد.');

  // فعال شدن فوری نسخه جدید
  self.skipWaiting();

});


// =====================================================
// 2. فعال‌سازی Service Worker جدید
// =====================================================

self.addEventListener('activate', (event) => {

  event.waitUntil(

    // کنترل فوری تمام صفحات باز
    self.clients.claim()

      .then(() => {

        console.log('✅ Service Worker جدید فعال شد.');

      })

  );

});


// =====================================================
// 3. دریافت فایل‌ها
// =====================================================
//
// نکته مهم:
// هیچ فایل HTML / CSS / JS از Cache خوانده نمی‌شود.
//
// همیشه ابتدا از اینترنت دریافت می‌شود.
// بنابراین تغییرات جدید سایت نمایش داده می‌شوند.
//

self.addEventListener('fetch', (event) => {

  const request = event.request;

  // فقط درخواست‌های GET را مدیریت می‌کنیم.
  if (request.method !== 'GET') {
    return;
  }


  event.respondWith(

    fetch(request, {
      cache: 'no-store'
    })

      .then((response) => {

        // پاسخ مستقیم از شبکه
        return response;

      })

      .catch((error) => {

        // اگر اینترنت قطع باشد،
        // دیگر نسخه قدیمی از Cache نمایش داده نمی‌شود.

        console.warn(
          '⚠️ اینترنت در دسترس نیست:',
          request.url
        );

        throw error;

      })

  );

});
```

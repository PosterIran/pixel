```js
// ============================================================
// Service Worker - پوستر ایران
// حالت: آنلاین / بدون کش برای HTML و CSS و JS
// ============================================================

// نام ثابت کش
// برای تغییرات معمولی نیازی به تغییر این نام نیست.
const CACHE_NAME = 'poster-iran-cache';


// ============================================================
// 1. نصب Service Worker
// ============================================================

self.addEventListener('install', (event) => {

    console.log('🚀 Service Worker جدید در حال نصب است...');

    // فعال شدن فوری نسخه جدید
    self.skipWaiting();

});


// ============================================================
// 2. فعال شدن Service Worker جدید
// ============================================================

self.addEventListener('activate', (event) => {

    event.waitUntil(

        caches.keys()
            .then((cacheNames) => {

                // حذف تمام کش‌های قبلی
                return Promise.all(
                    cacheNames.map((cacheName) => {

                        console.log(
                            '🧹 حذف کش قدیمی:',
                            cacheName
                        );

                        return caches.delete(cacheName);

                    })
                );

            })
            .then(() => {

                // کنترل فوری تمام صفحات باز
                return self.clients.claim();

            })
            .then(() => {

                console.log(
                    '✅ Service Worker جدید فعال شد.'
                );

            })

    );

});


// ============================================================
// 3. مدیریت درخواست‌های سایت
// ============================================================
//
// نکته بسیار مهم:
//
// HTML
// CSS
// JavaScript
// تصاویر
// Manifest
//
// از Cache خوانده نمی‌شوند.
//
// درخواست ابتدا به اینترنت می‌رود.
// بنابراین آخرین نسخه فایل از GitHub Pages دریافت می‌شود.
//
// ============================================================

self.addEventListener('fetch', (event) => {

    const request = event.request;

    // فقط درخواست‌های GET
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

            console.warn(
                '⚠️ دریافت فایل از اینترنت ناموفق بود:',
                request.url
            );

            // چون سایت را آنلاین می‌خواهیم،
            // در صورت قطع اینترنت نسخه قدیمی نمایش داده نمی‌شود.
            throw error;

        })

    );

});


// ============================================================
// 4. دریافت فرمان از index.html
// ============================================================
//
// این بخش با کدی که قبلاً در index.html داری
// سازگار است.
//
// ============================================================

self.addEventListener('message', (event) => {

    if (
        event.data &&
        event.data.action === 'skipWaiting'
    ) {

        console.log(
            '🔄 فعال‌سازی فوری Service Worker جدید...'
        );

        self.skipWaiting();

    }

});
```

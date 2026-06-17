// نام کش جدید برای اعمال سریع تر تغییرات بر روی دستگاه کاربران
const CACHE_NAME = 'poster-iran-cache-v4';

// فایل‌هایی که به صورت آفلاین همواره در دسترس خواهند بود
const STATIC_ASSETS = [
'./',
'./icons/icon-192x192.png',
'./icons/icon-512x512.png',
'https://akbari5561.github.io/PosterIran/icons/logo.png',
'https://cdn.tailwindcss.com',
'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap',
'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// فایل‌های پویا و حساس به تغییر که باید همیشه آپدیت باشند (استراتژی Network-First)
const NETWORK_FIRST_ASSETS = [
'./index.html',
'./manifest.json'
];

// نصب سرویس‌ورکر و کش کردن دارایی‌های ثابت
self.addEventListener('install', (event) => {
event.waitUntil(
caches.open(CACHE_NAME).then((cache) => {
console.log('در حال کش کردن دارایی‌های استاتیک...');
return Promise.allSettled(
[...STATIC_ASSETS, ...NETWORK_FIRST_ASSETS].map(url => {
return cache.add(url).catch(err => {
console.warn('خطا در کش اولیه آدرس:', url, err);
});
})
);
}).then(() => self.skipWaiting())
);
});

// فعال‌سازی و پاکسازی کش‌های قدیمی به صورت آنی
self.addEventListener('activate', (event) => {
event.waitUntil(
caches.keys().then((cacheNames) => {
return Promise.all(
cacheNames.map((cacheName) => {
if (cacheName !== CACHE_NAME) {
console.log('حذف کش قدیمی تداخل‌برانگیز:', cacheName);
return caches.delete(cacheName);
}
})
);
}).then(() => {
console.log('سرویس‌ورکر جدید با موفقیت فعال شد.');
return self.clients.claim();
})
);
});

// مدیریت هوشمند درخواست‌ها: Network-First برای HTML و مانیفست / Cache-First برای تصاویر و فونت‌ها
self.addEventListener('fetch', (event) => {
const requestUrl = new URL(event.request.url);

// بررسی اینکه آیا فایل درخواستی جزو فایل‌های حساس به آپدیت است یا خیر
const isNetworkFirst = NETWORK_FIRST_ASSETS.some(asset => {
const cleanAsset = asset.replace('./', '');
return requestUrl.pathname.endsWith(cleanAsset) || requestUrl.pathname === '/PosterIran/' || requestUrl.pathname === '/';
});

if (isNetworkFirst) {
// استراتژی Network-First: ابتدا دریافت آخرین تغییرات از سرور، در صورت آفلاین بودن لود از کش
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
.catch(() => {
// در صورت آفلاین بودن، از کش لود کن
return caches.match(event.request);
})
);
} else {
// استراتژی Cache-First برای بقیه منابع (مثل تصاویر، استیکرها و فونت‌ها برای لود فوق‌العاده سریع)
event.respondWith(
caches.match(event.request).then((cachedResponse) => {
if (cachedResponse) {
return cachedResponse;
}
return fetch(event.request).then((networkResponse) => {
if (networkResponse && networkResponse.status === 200) {
const responseClone = networkResponse.clone();
caches.open(CACHE_NAME).then((cache) => {
cache.put(event.request, responseClone);
});
}
return networkResponse;
});
})
);
}
});
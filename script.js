// ۱. ثبت Service Worker برای قابلیت آفلاین (تغییر یافته و بهینه‌سازی شده)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .then(reg => console.log('✅ Service Worker با موفقیت در فایل مجزا ثبت شد:', reg.scope))
      .catch(err => console.log('❌ خطا در ثبت Service Worker:', err));
  });
}

// ۲. منطق پاپ‌آپی نصب نسخه وب‌اپلیکیشن PWA (سازگار با مرورگرهای موبایل و دستگاه‌های iOS/Android)
let deferredPrompt;
const installBanner = document.getElementById('install-banner');
const btnInstall = document.getElementById('btnInstall');
const btnClose = document.getElementById('btnClose');

window.addEventListener('beforeinstallprompt', (e) => {
  // جلوگیری از رفتار پیش‌فرض مرورگر جهت مدیریت دستی بنر نصب
  e.preventDefault();
  deferredPrompt = e;
  
  // در صورتی که کاربر قبلاً پیشنهاد را رد نکرده باشد، بنر را نمایان کن
  const isDismissed = localStorage.getItem('install_prompt_dismissed');
  const isInstalled = localStorage.getItem('pwa_installed');
  
  if (isDismissed !== 'true' && isInstalled !== 'true') {
    if (installBanner) {
      installBanner.classList.remove('pointer-events-none', 'translate-y-20', 'opacity-0');
      installBanner.classList.add('translate-y-0', 'opacity-100');
    }
  }
});

if (btnInstall) {
  btnInstall.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`انتخاب نصب کاربر: ${outcome}`);
      deferredPrompt = null;
      if (installBanner) {
        installBanner.classList.remove('translate-y-0', 'opacity-100');
        installBanner.classList.add('pointer-events-none', 'translate-y-20', 'opacity-0');
      }
    }
  });
}

if (btnClose) {
  btnClose.addEventListener('click', () => {
    if (installBanner) {
      installBanner.classList.remove('translate-y-0', 'opacity-100');
      installBanner.classList.add('pointer-events-none', 'translate-y-20', 'opacity-0');
    }
    localStorage.setItem('install_prompt_dismissed', 'true');
  });
}
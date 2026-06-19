```javascript
// ۱. ثبت Service Worker برای قابلیت آفلاین
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker ثبت شد!'))
            .catch(err => console.log('خطا در ثبت Service Worker:', err));
    });
}

// ۲. منطق پاپ‌آپ نصب (همان کدی که قبلاً نوشتیم اما اینجا تمیزتر شده)
let deferredPrompt;
const installBanner = document.getElementById('install-banner');
const btnInstall = document.getElementById('btnInstall');
const btnClose = document.getElementById('btnClose');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // اگر کاربر قبلاً پاپ‌آپ را نبسته باشد، آن را نشان بده
  if (localStorage.getItem('install_prompt_dismissed') !== 'true') {
    installBanner.style.display = 'flex';
  }
});

btnInstall.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('کاربر اپلیکیشن را نصب کرد');
    }
    deferredPrompt = null;
    installBanner.style.display = 'none';
  }
});
btnClose.addEventListener('click', () => {
  installBanner.style.display = 'none';
  localStorage.setItem('install_prompt_dismissed', 'true');
});

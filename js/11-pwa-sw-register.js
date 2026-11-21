/* ===== Professional Store PWA + FCM Service Worker ===== */
if ('serviceWorker' in navigator) {
  var __swPromise = null;
  // تسجيل واحد فقط لـ sw.js يُستخدم من PWA ومن الإشعارات
  window.__registerStoreSW = function () {
    if (!__swPromise) {
      __swPromise = navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then(function (r) {
        window.__professionalServiceWorkerRegistration = r;
        r.update().catch(function () {});
        return r;
      });
    }
    return __swPromise;
  };
  window.addEventListener('load', async function () {
    try {
      const registration = await window.__registerStoreSW();
      console.log('✅ تم تفعيل تطبيق بروفيشنال PWA + FCM', registration.scope);
    } catch (error) {
      console.warn('⚠️ تعذر تفعيل PWA/FCM:', error);
    }
  });
}

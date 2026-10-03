/* ============================================================
   Professional Store PWA — Service Worker
   Version: v4
   - Offline cache
   - Network-first HTML
   - Cache-first static assets
   - Push notifications
   - Notification click handling
   - In-app notification messages
   - Safe update / activation
   ============================================================ */

const CACHE_NAME = 'professional-store-pwa-v4';

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

/* ============================================================
   INSTALL
   ============================================================ */

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(CORE).catch(error => {
          console.warn(
            '[Professional Store SW] بعض ملفات CORE لم يتم تخزينها:',
            error
          );
        });
      })
      .then(() => self.skipWaiting())
  );
});

/* ============================================================
   ACTIVATE
   ============================================================ */

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

/* ============================================================
   FETCH
   ============================================================ */

self.addEventListener('fetch', event => {
  if (!event.request) return;

  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  /* ----------------------------------------------------------
     لا نعمل Cache للـService Worker نفسه
     ---------------------------------------------------------- */

  if (url.pathname.endsWith('/sw.js')) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store'
      })
    );
    return;
  }

  /* ----------------------------------------------------------
     HTML / Navigation
     
     دائمًا نحاول الشبكة أولًا حتى تصل تحديثات الموقع
     للمستخدم بدون الحاجة لمسح Cache يدويًا.
     ---------------------------------------------------------- */

  if (
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname === '/'
  ) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store'
      })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                return cache.put(event.request, copy);
              })
              .catch(() => {});
          }

          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cached => {
              return cached || caches.match('./index.html');
            });
        })
    );

    return;
  }

  /* ----------------------------------------------------------
     Static Assets
     
     Cache First:
     - الصور
     - الأيقونات
     - الملفات الثابتة
     ---------------------------------------------------------- */

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          return cached;
        }

        return fetch(event.request)
          .then(response => {
            if (response && response.ok) {
              const copy = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  return cache.put(event.request, copy);
                })
                .catch(() => {});
            }

            return response;
          });
      })
      .catch(() => {
        return new Response(
          'Offline',
          {
            status: 503,
            statusText: 'Offline'
          }
        );
      })
  );
});

/* ============================================================
   PUSH NOTIFICATIONS
   ============================================================

   هذا الحدث يستقبل Push Notification من خدمة Push مثل
   Firebase Cloud Messaging أو Web Push.

   مثال Payload:

   {
     "title": "تم قبول طلبك",
     "body": "تم قبول طلبك رقم #12345",
     "icon": "./icon-192.png",
     "badge": "./icon-192.png",
     "url": "./index.html?open=orders",
     "tag": "order-12345"
   }

   ============================================================ */

self.addEventListener('push', event => {

  let data = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (error) {
    try {
      data = {
        body: event.data
          ? event.data.text()
          : 'لديك إشعار جديد'
      };
    } catch (textError) {
      data = {};
    }
  }

  const title =
    data.title ||
    data.notification?.title ||
    'بروفيشنال ستور';

  const body =
    data.body ||
    data.notification?.body ||
    'لديك تحديث جديد';

  const icon =
    data.icon ||
    data.notification?.icon ||
    './icon-192.png';

  const badge =
    data.badge ||
    './icon-192.png';

  const notificationUrl =
    data.url ||
    data.notification?.click_action ||
    './index.html';

  const tag =
    data.tag ||
    data.id ||
    `professional-store-${Date.now()}`;

  const options = {
    body: body,

    icon: icon,

    badge: badge,

    tag: tag,

    renotify: true,

    requireInteraction: false,

    vibrate: [
      200,
      100,
      200
    ],

    data: {
      url: notificationUrl,

      notificationId:
        data.notificationId ||
        data.id ||
        '',

      type:
        data.type ||
        'general',

      orderId:
        data.orderId ||
        '',

      returnId:
        data.returnId ||
        ''
    },

    actions: Array.isArray(data.actions)
      ? data.actions
      : []
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});

/* ============================================================
   NOTIFICATION CLICK
   ============================================================ */

self.addEventListener('notificationclick', event => {

  event.notification.close();

  const notificationData =
    event.notification.data || {};

  const targetUrl =
    notificationData.url ||
    './index.html';

  event.waitUntil(

    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

      .then(clientList => {

        /* ------------------------------------------------------
           إذا كان التطبيق مفتوحًا بالفعل:
           نركز عليه ونرسل له الرابط.
           ------------------------------------------------------ */

        for (const client of clientList) {

          if (
            client.url &&
            'focus' in client
          ) {

            return client
              .focus()
              .then(() => {

                if (
                  'postMessage' in client
                ) {

                  client.postMessage({
                    type: 'OPEN_NOTIFICATION_TARGET',

                    url: targetUrl,

                    notificationId:
                      notificationData.notificationId || '',

                    notificationType:
                      notificationData.type || '',

                    orderId:
                      notificationData.orderId || '',

                    returnId:
                      notificationData.returnId || ''
                  });

                }

                return client;
              });
          }
        }

        /* ------------------------------------------------------
           التطبيق غير مفتوح:
           افتح المتجر.
           ------------------------------------------------------ */

        if (
          self.clients.openWindow
        ) {

          return self.clients.openWindow(
            targetUrl
          );
        }

        return null;
      })
  );
});

/* ============================================================
   NOTIFICATION CLOSE
   ============================================================ */

self.addEventListener('notificationclose', event => {

  /*
   يمكن لاحقًا استخدام هذا الحدث لتسجيل أن المستخدم
   أغلق الإشعار بدون فتحه.
  */

});

/* ============================================================
   MESSAGE FROM PAGE
   ============================================================

   يسمح لصفحة مدير.html بإرسال إشعار محلي إلى Service Worker.

   مثال من الصفحة:

   navigator.serviceWorker.controller.postMessage({
       type: 'SHOW_NOTIFICATION',
       title: 'تم قبول الطلب',
       body: 'تم قبول طلبك بنجاح',
       url: './index.html',
       orderId: '123'
   });

   ============================================================ */

self.addEventListener('message', event => {

  if (!event.data) {
    return;
  }

  const message =
    event.data;

  /* ----------------------------------------------------------
     عرض إشعار من داخل الموقع
     ---------------------------------------------------------- */

  if (
    message.type ===
    'SHOW_NOTIFICATION'
  ) {

    const title =
      message.title ||
      'بروفيشنال ستور';

    const body =
      message.body ||
      'لديك تحديث جديد';

    const icon =
      message.icon ||
      './icon-192.png';

    const badge =
      message.badge ||
      './icon-192.png';

    const url =
      message.url ||
      './index.html';

    const tag =
      message.tag ||
      message.notificationId ||
      `local-${Date.now()}`;

    event.waitUntil(

      self.registration.showNotification(
        title,
        {
          body: body,

          icon: icon,

          badge: badge,

          tag: tag,

          renotify: true,

          requireInteraction: false,

          vibrate: [
            200,
            100,
            200
          ],

          data: {
            url: url,

            notificationId:
              message.notificationId ||
              '',

            type:
              message.notificationType ||
              'general',

            orderId:
              message.orderId ||
              '',

            returnId:
              message.returnId ||
              ''
          }
        }
      )
    );

    return;
  }

  /* ----------------------------------------------------------
     فتح رابط معين
     ---------------------------------------------------------- */

  if (
    message.type ===
    'OPEN_URL'
  ) {

    const url =
      message.url ||
      './index.html';

    event.waitUntil(

      self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })

        .then(clientList => {

          for (const client of clientList) {

            if (
              client.url &&
              'focus' in client
            ) {

              return client
                .focus()
                .then(() => {

                  if (
                    'postMessage' in client
                  ) {

                    client.postMessage({
                      type:
                        'OPEN_NOTIFICATION_TARGET',

                      url: url
                    });

                  }

                  return client;
                });
            }
          }

          if (
            self.clients.openWindow
          ) {

            return self.clients.openWindow(
              url
            );
          }

          return null;
        })
    );
  }

});

/* ============================================================
   SKIP WAITING
   ============================================================

   يسمح للصفحة بطلب تفعيل النسخة الجديدة من Service Worker
   فورًا.

   ============================================================ */

self.addEventListener(
  'message',
  event => {

    if (
      event.data &&
      event.data.type ===
      'SKIP_WAITING'
    ) {

      self.skipWaiting();
    }

  }
);
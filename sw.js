/* ============================================================
   Professional Store PWA
   Firebase Cloud Messaging + Web Push Service Worker
   Version: v5

   الوظائف:
   - استقبال Firebase Cloud Messaging
   - استقبال Web Push
   - إشعارات تعمل والتطبيق مغلق
   - إشعارات تعمل والتطبيق في الخلفية
   - فتح الطلب/المرتجع عند الضغط على الإشعار
   - دعم Data Payload و Notification Payload
   - Offline Cache
   - Network First للصفحات
   - Cache First للملفات الثابتة
   - تحديث آمن للـ Service Worker
   ============================================================ */

'use strict';


/* ============================================================
   CACHE
   ============================================================ */

const CACHE_NAME =
  'professional-store-pwa-v5';

const CORE = [
  './',
  './index.html',
  './manifest.json'
];


/* ============================================================
   INSTALL
   ============================================================ */

self.addEventListener('install', event => {

  event.waitUntil(

    caches
      .open(CACHE_NAME)

      .then(cache => {

        /*
         * لا نستخدم cache.addAll هنا.
         * إذا كان ملف واحد غير موجود فلن يفشل تثبيت
         * Service Worker بالكامل.
         */

        return Promise.all(

          CORE.map(url =>

            fetch(
              new Request(
                url,
                {
                  cache: 'no-store'
                }
              )
            )

              .then(response => {

                if (
                  response &&
                  response.ok
                ) {

                  return cache.put(
                    url,
                    response
                  );

                }

              })

              .catch(() => {

                /*
                 * تجاهل فشل ملف منفرد.
                 */

              })

          )

        );

      })

      .catch(() => {})

      .then(() => {

        return self.skipWaiting();

      })

  );

});


/* ============================================================
   ACTIVATE
   ============================================================ */

self.addEventListener('activate', event => {

  event.waitUntil(

    caches
      .keys()

      .then(keys => {

        return Promise.all(

          keys

            .filter(
              key =>
                key !== CACHE_NAME
            )

            .map(
              key =>
                caches.delete(key)
            )

        );

      })

      .then(() => {

        return self.clients.claim();

      })

  );

});


/* ============================================================
   FETCH
   ============================================================ */

self.addEventListener('fetch', event => {

  if (!event.request) {
    return;
  }

  if (
    event.request.method !== 'GET'
  ) {
    return;
  }

  const url =
    new URL(
      event.request.url
    );


  /* ----------------------------------------------------------
     Service Worker نفسه
     ---------------------------------------------------------- */

  if (
    url.pathname.endsWith('/sw.js')
  ) {

    event.respondWith(

      fetch(
        event.request,
        {
          cache: 'no-store'
        }
      )

    );

    return;
  }


  /* ----------------------------------------------------------
     صفحات HTML
     
     Network First
     ---------------------------------------------------------- */

  if (

    event.request.mode ===
      'navigate'

    ||

    event.request.destination ===
      'document'

    ||

    url.pathname.endsWith(
      '/index.html'
    )

    ||

    url.pathname === '/'

  ) {

    event.respondWith(

      fetch(
        event.request,
        {
          cache: 'no-store'
        }
      )

        .then(response => {

          if (
            response &&
            response.ok
          ) {

            const copy =
              response.clone();

            caches
              .open(CACHE_NAME)
              .then(cache => {

                return cache.put(
                  event.request,
                  copy
                );

              })

              .catch(() => {});

          }

          return response;

        })

        .catch(() => {

          return caches
            .match(event.request)

            .then(cached => {

              return (
                cached ||

                caches.match(
                  './index.html'
                )

              );

            });

        })

    );

    return;
  }


  /* ----------------------------------------------------------
     الملفات الثابتة
     
     Cache First
     ---------------------------------------------------------- */

  event.respondWith(

    caches
      .match(event.request)

      .then(cached => {

        if (cached) {
          return cached;
        }

        return fetch(
          event.request
        )

          .then(response => {

            if (
              response &&
              response.ok
            ) {

              const copy =
                response.clone();

              caches
                .open(CACHE_NAME)
                .then(cache => {

                  return cache.put(
                    event.request,
                    copy
                  );

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
   PUSH
   ============================================================

   هذا هو الجزء الأساسي.

   Firebase Cloud Messaging سيرسل Push إلى هذا الـService Worker
   حتى إذا كانت صفحة المتجر مغلقة.

   ============================================================ */

self.addEventListener(
  'push',
  event => {

    event.waitUntil(

      handlePushNotification(
        event
      )

    );

  }
);


/* ============================================================
   HANDLE PUSH
   ============================================================ */

async function handlePushNotification(
  event
) {

  let payload = {};

  try {

    if (event.data) {

      payload =
        event.data.json();

    }

  }

  catch (error) {

    try {

      payload = {

        body:
          event.data
            ? event.data.text()
            : ''

      };

    }

    catch (textError) {

      payload = {};

    }

  }


  /*
   * Firebase يمكن أن يرسل البيانات بهذا الشكل:
   *
   * {
   *   notification: {...},
   *   data: {...}
   * }
   *
   * أو Data Payload فقط:
   *
   * {
   *   data: {...}
   * }
   */

  const notification =
    payload.notification ||
    {};

  const data =
    payload.data ||
    {};


  /* ==========================================================
     TITLE
     ========================================================== */

  const title =

    data.title ||

    notification.title ||

    payload.title ||

    'بروفيشنال ستور';


  /* ==========================================================
     BODY
     ========================================================== */

  const body =

    data.body ||

    notification.body ||

    payload.body ||

    'لديك تحديث جديد في متجر بروفيشنال';


  /* ==========================================================
     ICON
     ========================================================== */

  const icon =

    data.icon ||

    notification.icon ||

    payload.icon ||

    './icon-192.png';


  /* ==========================================================
     BADGE
     ========================================================== */

  const badge =

    data.badge ||

    notification.badge ||

    './icon-192.png';


  /* ==========================================================
     ORDER ID
     ========================================================== */

  const orderId =

    data.orderId ||

    data.orderID ||

    data.order_id ||

    payload.orderId ||

    '';


  /* ==========================================================
     RETURN ID
     ========================================================== */

  const returnId =

    data.returnId ||

    data.returnID ||

    data.return_id ||

    payload.returnId ||

    '';


  /* ==========================================================
     NOTIFICATION TYPE
     ========================================================== */

  const notificationType =

    data.type ||

    data.notificationType ||

    data.notification_type ||

    payload.type ||

    'general';


  /* ==========================================================
     NOTIFICATION ID
     ========================================================== */

  const notificationId =

    data.notificationId ||

    data.notificationID ||

    data.notification_id ||

    payload.notificationId ||

    '';


  /* ==========================================================
     URL
     ========================================================== */

  let targetUrl =

    data.url ||

    data.click_action ||

    data.clickAction ||

    notification.click_action ||

    notification.clickAction ||

    payload.url ||

    './index.html';


  /*
   * Firebase fcm_options.link
   */

  if (

    !targetUrl ||

    targetUrl === './index.html'

  ) {

    if (
      notification.fcm_options &&
      notification.fcm_options.link
    ) {

      targetUrl =
        notification
          .fcm_options
          .link;

    }

  }


  /*
   * تأكد أن الرابط لا يخرج إلى موقع خارجي
   * بدون داعٍ.
   */

  try {

    const absoluteUrl =
      new URL(
        targetUrl,
        self.location.origin
      );

    if (
      absoluteUrl.origin !==
      self.location.origin
    ) {

      targetUrl =
        './index.html';

    }

    else {

      targetUrl =
        absoluteUrl.href;

    }

  }

  catch (error) {

    targetUrl =
      './index.html';

  }


  /* ==========================================================
     TAG
     ========================================================== */

  const tag =

    data.tag ||

    payload.tag ||

    (
      notificationType +
      '-' +
      (
        orderId ||
        returnId ||
        notificationId ||
        Date.now()
      )
    );


  /* ==========================================================
     NOTIFICATION OPTIONS
     ========================================================== */

  const options = {

    body:
      String(body),

    icon:
      icon,

    badge:
      badge,

    tag:
      tag,

    renotify:
      true,

    requireInteraction:
      false,

    silent:
      false,

    vibrate: [
      200,
      100,
      200
    ],

    data: {

      url:
        targetUrl,

      notificationId:
        notificationId,

      type:
        notificationType,

      orderId:
        orderId,

      returnId:
        returnId

    }

  };


  /* ==========================================================
     ACTIONS
     ========================================================== */

  if (
    Array.isArray(
      data.actions
    )
  ) {

    options.actions =
      data.actions;

  }

  else if (
    Array.isArray(
      payload.actions
    )
  ) {

    options.actions =
      payload.actions;

  }


  /* ==========================================================
     SHOW NOTIFICATION
     ========================================================== */

  await self.registration
    .showNotification(
      String(title),
      options
    );

}


/* ============================================================
   NOTIFICATION CLICK
   ============================================================ */

self.addEventListener(
  'notificationclick',
  event => {

    event.notification.close();


    const notificationData =
      event.notification.data ||
      {};


    const targetUrl =

      notificationData.url ||

      './index.html';


    event.waitUntil(

      openNotificationTarget(
        targetUrl,
        notificationData
      )

    );

  }
);


/* ============================================================
   OPEN NOTIFICATION TARGET
   ============================================================ */

async function openNotificationTarget(
  targetUrl,
  notificationData
) {

  let finalUrl =
    './index.html';


  try {

    const url =
      new URL(
        targetUrl,
        self.location.origin
      );


    if (
      url.origin ===
      self.location.origin
    ) {

      finalUrl =
        url.href;

    }

  }

  catch (error) {

    finalUrl =
      './index.html';

  }


  const clientList =
    await self.clients.matchAll({

      type:
        'window',

      includeUncontrolled:
        true

    });


  /* ----------------------------------------------------------
     التطبيق مفتوح أو في الخلفية
     ---------------------------------------------------------- */

  for (
    const client of clientList
  ) {

    if (
      !client ||
      !client.url
    ) {

      continue;

    }


    try {

      const clientUrl =
        new URL(
          client.url
        );


      if (
        clientUrl.origin !==
        self.location.origin
      ) {

        continue;

      }

    }

    catch (error) {

      continue;

    }


    if (
      'focus' in client
    ) {

      await client.focus();


      if (
        'postMessage' in client
      ) {

        client.postMessage({

          type:
            'OPEN_NOTIFICATION_TARGET',

          url:
            finalUrl,

          notificationId:
            notificationData
              .notificationId ||
            '',

          notificationType:
            notificationData
              .type ||
            '',

          orderId:
            notificationData
              .orderId ||
            '',

          returnId:
            notificationData
              .returnId ||
            ''

        });

      }


      return;

    }

  }


  /* ----------------------------------------------------------
     التطبيق مغلق تمامًا
     
     يفتح التطبيق عند الضغط على الإشعار.
     ---------------------------------------------------------- */

  if (
    'openWindow' in
    self.clients
  ) {

    await self.clients.openWindow(
      finalUrl
    );

  }

}


/* ============================================================
   NOTIFICATION CLOSE
   ============================================================ */

self.addEventListener(
  'notificationclose',
  event => {

    /*
     * لا نقوم بأي شيء هنا حاليًا.
     * يمكن ربطه لاحقًا بإحصائيات الإشعارات.
     */

  }
);


/* ============================================================
   MESSAGE FROM APP
   ============================================================

   يسمح لصفحة المتجر بإرسال إشعار محلي.

   ============================================================ */

self.addEventListener(
  'message',
  event => {

    if (
      !event.data
    ) {

      return;

    }


    const message =
      event.data;


    /* ========================================================
       SKIP WAITING
       ======================================================== */

    if (
      message.type ===
      'SKIP_WAITING'
    ) {

      self.skipWaiting();

      return;

    }


    /* ========================================================
       SHOW NOTIFICATION
       ======================================================== */

    if (
      message.type ===
      'SHOW_NOTIFICATION'
    ) {

      event.waitUntil(

        showLocalNotification(
          message
        )

      );

      return;

    }


    /* ========================================================
       OPEN URL
       ======================================================== */

    if (
      message.type ===
      'OPEN_URL'
    ) {

      const url =
        message.url ||
        './index.html';


      event.waitUntil(

        openNotificationTarget(
          url,
          {
            url:
              url,

            notificationId:
              message.notificationId ||
              '',

            type:
              message.notificationType ||
              '',

            orderId:
              message.orderId ||
              '',

            returnId:
              message.returnId ||
              ''
          }
        )

      );

    }

  }
);


/* ============================================================
   LOCAL NOTIFICATION
   ============================================================ */

async function showLocalNotification(
  message
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


  const notificationId =
    message.notificationId ||
    '';


  const notificationType =
    message.notificationType ||
    'general';


  const orderId =
    message.orderId ||
    '';


  const returnId =
    message.returnId ||
    '';


  const tag =

    message.tag ||

    notificationId ||

    (
      notificationType +
      '-' +
      (
        orderId ||
        returnId ||
        Date.now()
      )
    );


  await self.registration
    .showNotification(

      String(title),

      {

        body:
          String(body),

        icon:
          icon,

        badge:
          badge,

        tag:
          tag,

        renotify:
          true,

        requireInteraction:
          false,

        silent:
          false,

        vibrate: [
          200,
          100,
          200
        ],

        data: {

          url:
            url,

          notificationId:
            notificationId,

          type:
            notificationType,

          orderId:
            orderId,

          returnId:
            returnId

        }

      }

    );

}


/* ============================================================
   SERVICE WORKER ERROR PROTECTION
   ============================================================ */

self.addEventListener(
  'error',
  event => {

    /*
     * لا نسمح لخطأ غير متوقع داخل Service Worker
     * بإيقاف بقية وظائف الإشعارات.
     */

    console.error(
      '[Professional Store SW] Error:',
      event.error
    );

  }
);


self.addEventListener(
  'unhandledrejection',
  event => {

    console.error(
      '[Professional Store SW] Unhandled Promise:',
      event.reason
    );

  }
);

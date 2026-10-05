/* PROFESSIONAL STORE SW v6 - FCM ACCEPTED STATUS FIX */
/* ============================================================
   Professional Store PWA
   Firebase Cloud Messaging + Web Push Service Worker
   Version: v6

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
   Firebase Cloud Messaging — نفس إعداد Messaging المستخدم في المتجر
   الإضافة هنا للاستقبال في الخلفية/والتطبيق مغلق فقط.
   لا تغيّر نظام الـ PWA أو الـ Cache الحالي.
   ============================================================ */
try {
  importScripts(
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js'
  );

  firebase.initializeApp({
    apiKey: 'AIzaSyARX12v1lvgKaFhIoYWRtv1Nqxpt8zz8HE',
    authDomain: 'rashfa-9d95d.firebaseapp.com',
    databaseURL: 'https://rashfa-9d95d-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'rashfa-9d95d',
    storageBucket: 'rashfa-9d95d.firebasestorage.app',
    messagingSenderId: '973516999258',
    appId: '1:973516999258:web:e71f8d42efd8e461e0a663'
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notification = payload?.notification || {};
    const data = payload?.data || {};

    const status = String(
      data.status ||
      data.orderStatus ||
      data.returnStatus ||
      data.state ||
      payload?.status ||
      payload?.orderStatus ||
      payload?.returnStatus ||
      ''
    ).trim().toLowerCase();

    const statusTextMap = {
      accepted: 'تم قبول طلبك',
      accept: 'تم قبول طلبك',
      approved: 'تم قبول طلبك',
      confirmed: 'تم تأكيد طلبك',
      processing: 'جاري تجهيز طلبك',
      preparing: 'جاري تجهيز طلبك',
      ready: 'طلبك جاهز للتسليم',
      shipped: 'تم شحن طلبك',
      out_for_delivery: 'طلبك خرج للتوصيل',
      'out-for-delivery': 'طلبك خرج للتوصيل',
      delivered: 'تم توصيل طلبك',
      completed: 'تم إكمال طلبك',
      cancelled: 'تم إلغاء طلبك',
      canceled: 'تم إلغاء طلبك',
      return_accepted: 'تم قبول طلب المرتجع',
      'return-accepted': 'تم قبول طلب المرتجع',
      return_approved: 'تم قبول طلب المرتجع',
      'return-approved': 'تم قبول طلب المرتجع',
      return_rejected: 'تم رفض طلب المرتجع',
      'return-rejected': 'تم رفض طلب المرتجع',
      return_received: 'تم استلام طلب المرتجع',
      'return-received': 'تم استلام طلب المرتجع',
      return_processing: 'جاري مراجعة طلب المرتجع',
      'return-processing': 'جاري مراجعة طلب المرتجع',
      return_completed: 'تم إكمال طلب المرتجع',
      'return-completed': 'تم إكمال طلب المرتجع'
    };

    const mappedStatusText = statusTextMap[status] || '';
    const isAccepted = ['accepted', 'accept', 'approved'].includes(status);

    const title =
      notification.title ||
      data.title ||
      (isAccepted ? '✅ تم قبول الطلب' :
       status === 'confirmed' ? '✅ تم تأكيد الطلب' :
       'بروفيشنال ستور');

    const body =
      notification.body ||
      data.body ||
      mappedStatusText ||
      'لديك تحديث جديد في متجر بروفيشنال ستور';

    const url =
      data.url ||
      data.click_action ||
      data.clickAction ||
      notification.click_action ||
      notification.clickAction ||
      './index.html';

    self.registration.showNotification(String(title), {
      body: String(body),
      icon: data.icon || notification.icon || './icon-192.png',
      badge: data.badge || notification.badge || './icon-72.png',
      tag: data.tag || `fcm-${data.orderId || data.orderID || status || Date.now()}`,
      renotify: true,
      requireInteraction: false,
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      data: {
        ...data,
        url
      }
    });
  });
} catch (error) {
  console.warn('FCM background messaging unavailable:', error);
}


/* ============================================================
   CACHE
   ============================================================ */

const CACHE_NAME =
  'professional-store-pwa-v6';

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

              .catch(() => {})

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
     BODY STATUS MAP
     ========================================================== */

  const statusTextMap = {
    'accepted': 'تم قبول طلبك',
    'accept': 'تم قبول طلبك',
    'approved': 'تم قبول طلبك',
    'confirmed': 'تم تأكيد طلبك',
    'processing': 'جاري تجهيز طلبك',
    'preparing': 'جاري تجهيز طلبك',
    'ready': 'طلبك جاهز للتسليم',
    'shipped': 'تم شحن طلبك',
    'out_for_delivery': 'طلبك خرج للتوصيل',
    'out-for-delivery': 'طلبك خرج للتوصيل',
    'delivered': 'تم توصيل طلبك',
    'completed': 'تم إكمال طلبك',
    'cancelled': 'تم إلغاء طلبك',
    'canceled': 'تم إلغاء طلبك',
    'return_accepted': 'تم قبول طلب المرتجع',
    'return-accepted': 'تم قبول طلب المرتجع',
    'return_approved': 'تم قبول طلب المرتجع',
    'return-approved': 'تم قبول طلب المرتجع',
    'return_rejected': 'تم رفض طلب المرتجع',
    'return-rejected': 'تم رفض طلب المرتجع',
    'return_received': 'تم استلام طلب المرتجع',
    'return-received': 'تم استلام طلب المرتجع',
    'return_processing': 'جاري مراجعة طلب المرتجع',
    'return-processing': 'جاري مراجعة طلب المرتجع',
    'return_completed': 'تم إكمال طلب المرتجع',
    'return-completed': 'تم إكمال طلب المرتجع'
  };

  const mappedStatusText = statusTextMap[status] || '';

  /* ==========================================================
     BODY
     ========================================================== */

  const body =

    data.body ||

    notification.body ||

    payload.body ||

    mappedStatusText ||

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
     ORDER / RETURN STATUS
     ========================================================== */

  const statusType = String(
    data.statusType ||
    data.entityType ||
    notificationType
  ).trim().toLowerCase();


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
        returnId,

      status:
        status,

      statusType:
        statusType

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

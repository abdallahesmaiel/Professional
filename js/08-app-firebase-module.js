// ============================================================
// جافا سكريبت كامل - الجزء الثاني (Firebase + Logic + Returns)
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";
import { getDatabase, ref, onValue, push, set, get, remove, update, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = { 
  apiKey: "AIzaSyARX12v1lvgKaFhIoYWRtv1Nqxpt8zz8HE", 
  authDomain: "rashfa-9d95d.firebaseapp.com", 
  databaseURL: "https://rashfa-9d95d-default-rtdb.asia-southeast1.firebasedatabase.app", 
  projectId: "rashfa-9d95d", 
  storageBucket: "rashfa-9d95d.firebasestorage.app", 
  messagingSenderId: "973516999258", 
  appId: "1:973516999258:web:e71f8d42efd8e461e0a663" 
};

let app, database;

// ============================================================
// ===== Firebase Cloud Messaging (FCM) — additive integration =====
// ============================================================
const FCM_VAPID_KEY = 'BBewszrMAow4Jtcb1B8TxTQRKsWgaTTHJYT1z-73DqlUkpnsMeMuoEE7qHLaoELdM68RgSjAu7aZcwqCvjuRHqs';
const FCM_TOKEN_STORAGE_KEY = 'professional_store_fcm_token_v1';
let fcmMessaging = null;
let fcmServiceWorkerRegistration = null;
let fcmReady = false;

function saveFcmTokenLocally(token) {
  try { if (token) localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token); } catch (_) {}
}
function getSavedFcmToken() {
  try { return localStorage.getItem(FCM_TOKEN_STORAGE_KEY) || ''; } catch (_) { return ''; }
}

function setFcmButtonState() {
  const btn = document.getElementById('phoneNotificationBtn');
  const state = document.getElementById('phoneNotificationState');
  if (!btn || !state) return;
  const permission = ('Notification' in window) ? Notification.permission : 'unsupported';
  if (permission === 'granted' && getSavedFcmToken()) {
    btn.classList.add('enabled');
    btn.classList.remove('denied');
    state.textContent = 'مفعلة ✓';
  } else if (permission === 'denied') {
    btn.classList.remove('enabled');
    btn.classList.add('denied');
    state.textContent = 'مرفوضة';
  } else if (permission === 'granted') {
    btn.classList.add('enabled');
    btn.classList.remove('denied');
    state.textContent = 'مفعلة ✓';
  }
}

async function ensureFcmServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    if (fcmServiceWorkerRegistration) return fcmServiceWorkerRegistration;
    if (window.__professionalServiceWorkerRegistration) {
      fcmServiceWorkerRegistration = window.__professionalServiceWorkerRegistration;
      return fcmServiceWorkerRegistration;
    }
    fcmServiceWorkerRegistration = await (window.__registerStoreSW ? window.__registerStoreSW() : navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }));
    await navigator.serviceWorker.ready;
    return fcmServiceWorkerRegistration;
  } catch (e) {
    console.warn('FCM service worker:', e);
    try {
      fcmServiceWorkerRegistration = await navigator.serviceWorker.ready;
      return fcmServiceWorkerRegistration;
    } catch (_) { return null; }
  }
}

async function initFirebaseWebPush() {
  try {
    if (!app || !('Notification' in window) || !('serviceWorker' in navigator)) return false;
    if (!(await isMessagingSupported())) return false;
    fcmServiceWorkerRegistration = await ensureFcmServiceWorker();
    if (!fcmServiceWorkerRegistration) return false;
    fcmMessaging = getMessaging(app);
    onMessage(fcmMessaging, payload => {
      const n = payload?.notification || {};
      const d = payload?.data || {};
      const title = n.title || d.title || 'سوق بروفيشنال';
      const body = n.body || d.body || 'لديك إشعار جديد';
      NotificationSystem.info(body, title);
    });
    fcmReady = true;
    setFcmButtonState();
    return true;
  } catch (e) {
    console.warn('FCM initialization:', e);
    fcmReady = false;
    return false;
  }
}

async function activateFirebaseWebPush(showMessage = true) {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      if (showMessage) NotificationSystem.warning('هذا المتصفح لا يدعم إشعارات الهاتف.');
      return '';
    }
    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
    if (permission !== 'granted') {
      setFcmButtonState();
      if (showMessage) NotificationSystem.warning('لم يتم السماح بإشعارات الهاتف.');
      return '';
    }
    if (!fcmReady) await initFirebaseWebPush();
    if (!fcmMessaging || !fcmServiceWorkerRegistration) {
      if (showMessage) NotificationSystem.error('تعذر تجهيز خدمة إشعارات Firebase حالياً.');
      return '';
    }
    const token = await getToken(fcmMessaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: fcmServiceWorkerRegistration
    });
    if (!token) throw new Error('FCM token was not returned');
    saveFcmTokenLocally(token);
    setFcmButtonState();
    if (showMessage) NotificationSystem.success('🔔 تم تفعيل إشعارات الهاتف وحفظ رمز الجهاز.');
    console.log('FCM registration token:', token);
    return token;
  } catch (e) {
    console.warn('FCM activation:', e);
    setFcmButtonState();
    if (showMessage) NotificationSystem.error('تعذر تفعيل إشعارات Firebase. تأكد من HTTPS وWeb Push/VAPID.');
    return '';
  }
}

window.getProfessionalFCMToken = getSavedFcmToken;
window.enableProfessionalPushNotifications = () => activateFirebaseWebPush(true);

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('✅ Firebase متصل بنجاح');
} catch (e) { 
  console.warn('⚠️ فشل اتصال Firebase، سيتم استخدام البيانات المحلية:', e); 
}


// ============================================================
// ===== Terms consent (first order only) =====
// ============================================================
let auth = null;
let pendingAuthAction = null;
let authUser = null;
const AUTH_RESUME_KEY = 'professional_auth_resume_v3';
const STORE_ORIGIN = 'https://professional-rose.vercel.app';

function setAuthResume(payload) {
  try { sessionStorage.setItem(AUTH_RESUME_KEY, JSON.stringify(payload || {})); } catch(e) {}
}
function getAuthResume() {
  try {
    const raw = sessionStorage.getItem(AUTH_RESUME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}
function clearAuthResume() {
  try { sessionStorage.removeItem(AUTH_RESUME_KEY); } catch(e) {}
}



function setAuthFeedback(msg, type='error') {
  const el = document.getElementById('authFeedback');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'auth-feedback ' + type;
  el.style.display = msg ? 'block' : 'none';
}

const AUTH_TERMS_VERSION = 'professional_auth_terms_v1';

const LEGAL_CONTENT = {
  privacy: {
    title: 'سياسة الخصوصية',
    html: `
      <p>نحن نستخدم تسجيل الدخول بحساب Google لتسهيل إنشاء الحساب والدخول إلى المتجر وربط طلباتك بحسابك.</p>
      <h3>ما البيانات التي نستخدمها؟</h3>
      <ul>
        <li>البيانات الأساسية اللازمة من حساب Google لتسجيل الدخول مثل الاسم والبريد الإلكتروني.</li>
        <li>بيانات الطلب التي تدخلها عند الشراء واللازمة للفـاتورة والتوصيل مثل الاسم والعنوان ورقم الهاتف وتفاصيل المنتجات والطلب.</li>
      </ul>
      <h3>ما الذي لا نجمعه؟</h3>
      <p>لا نطلب بيانات إضافية غير اللازمة لتسجيل الدخول أو تنفيذ الطلب، ولا نطلب كلمات مرور Google أو رموز التحقق الخاصة بحسابك.</p>
      <p>تُستخدم البيانات لتسجيل الدخول، حفظ الحساب، تسهيل إتمام الطلبات، متابعة الطلبات والمرتجعات، وإظهار البيانات اللازمة في الفاتورة والخدمات المرتبطة بالطلب.</p>
    `
  },
  terms: {
    title: 'الشروط والأحكام',
    html: `
      <h3>فحص المنتج عند الاستلام</h3>
      <p>يحق للعميل تجربة المنتج وفحصه وقت الاستلام للتأكد من أنه يعمل وبالحالة المناسبة قبل قبول الاستلام.</p>
      <h3>المرتجعات والمنتجات التالفة</h3>
      <p>إذا تم تسليم المنتج للعميل بحالة جيدة وسليمة، ثم تم إرجاعه ووجد أنه تعرض لتلف بعد التسليم، فلا يُقبل إرجاع المنتج ولا يتم رد قيمة المنتج.</p>
      <p>لذلك يُرجى فحص وتجربة المنتج عند الاستلام والتأكد من حالته قبل إتمام الاستلام.</p>
      <h3>رسوم الشحن وإثبات الجدية (للشحن خارج مركز أدفو)</h3>
      <p>عند طلب شحن إلى إحدى المحافظات (خارج مركز أدفو) مع الدفع عند الاستلام، يلتزم العميل بتحويل <strong>رسوم الشحن أولاً</strong> كإثبات للجدية، وإرسال لقطة شاشة التحويل عبر واتساب.</p>
      <p>يتم <strong>خصم المبلغ المحوَّل من إجمالي الفاتورة</strong>، ويدفع العميل المتبقي عند الاستلام. مثال: منتجات 100 ج + شحن 50 ج = 150 ج؛ يحوّل العميل 50 ج مقدماً ويدفع 100 ج عند الاستلام.</p>
      <p><strong>لا يتم استرداد رسوم الشحن</strong> في حالة عدم الرد على المتجر أو شركة الشحن، أو عدم استلام الطلب.</p>
      <h3>مدة طلب الاسترجاع</h3>
      <p>تظل إمكانية طلب الاسترجاع مرتبطة بالمدة المحددة في المتجر، وهي خلال 24 ساعة من وقت تسليم الطلب، وفقاً لحالة المنتج وشروط الاسترجاع.</p>
    `
  }
};

function isAuthTermsAccepted(){
  try { return localStorage.getItem(AUTH_TERMS_VERSION) === 'accepted'; } catch(e) { return false; }
}
function setAuthTermsAccepted(){
  try { localStorage.setItem(AUTH_TERMS_VERSION,'accepted'); } catch(e) {}
}
function syncAuthConsentState(){
  const cb=document.getElementById('authTermsConsent');
  const btn=document.getElementById('authConsentBtn');
  if(!cb || !btn) return;
  btn.disabled=!cb.checked;
}
function openLegalPage(type){
  const data=LEGAL_CONTENT[type] || LEGAL_CONTENT.privacy;
  const overlay=document.getElementById('legalOverlay');
  const title=document.getElementById('legalTitle');
  const content=document.getElementById('legalContent');
  if(!overlay || !title || !content) return;
  title.textContent=data.title;
  content.innerHTML=data.html;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closeLegalPage(){
  const overlay=document.getElementById('legalOverlay');
  if(!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
  if(!document.querySelector('.modal-overlay.show,.legal-overlay.show')) document.body.style.overflow='';
}

document.getElementById('authTermsConsent')?.addEventListener('change', syncAuthConsentState);
document.querySelectorAll('[data-legal-page]').forEach(btn=>btn.addEventListener('click',e=>{
  e.preventDefault();
  e.stopPropagation();
  openLegalPage(btn.dataset.legalPage);
}));
document.getElementById('legalCloseBtn')?.addEventListener('click',closeLegalPage);
document.getElementById('legalOverlay')?.addEventListener('click',e=>{if(e.target.id==='legalOverlay') closeLegalPage();});

function showAuthChoice() {
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  if (title) title.textContent = 'الموافقة على الشروط';
  if (subtitle) subtitle.textContent = 'للمتابعة في أول طلب، يرجى الموافقة على سياسة الخصوصية والشروط والأحكام.';
  setAuthFeedback('');
  const consent=document.getElementById('authTermsConsent');
  if(consent) consent.checked=false;
  syncAuthConsentState();
}

// تظهر الموافقة مرة واحدة فقط (عند أول طلب)، وبعد القبول لا تظهر مجدداً.
function openAuthModal({resume=null}={}) {
  if (isAuthTermsAccepted()) { resumeAfterConsent(resume); return; }
  if (resume) setAuthResume(resume);
  const modal = document.getElementById('authModalOverlay');
  modal?.classList.add('show');
  modal?.setAttribute('aria-hidden','false');
  showAuthChoice();
}

function closeAuthModal() {
  const m = document.getElementById('authModalOverlay');
  if (!m) return;
  m.classList.remove('show');
  m.setAttribute('aria-hidden','true');
  setAuthFeedback('');
}

function confirmTermsConsent() {
  const consent=document.getElementById('authTermsConsent');
  if(!consent?.checked){
    setAuthFeedback('يجب الموافقة على سياسة الخصوصية والشروط والأحكام أولاً.');
    syncAuthConsentState();
    return;
  }
  setAuthTermsAccepted();
  const resume = getAuthResume();
  clearAuthResume();
  closeAuthModal();
  setTimeout(() => resumeAfterConsent(resume), 100);
}

function resumeAfterConsent(resume) {
  try {
    if (resume && resume.type === 'checkout') openCheckoutModal({skipAuth:true});
  } catch(e) { console.error('resumeAfterConsent:', e); }
}

document.getElementById('authConsentBtn')?.addEventListener('click', confirmTermsConsent);
document.getElementById('authCloseBtn')?.addEventListener('click',()=>{ pendingAuthAction=null; clearAuthResume(); closeAuthModal(); });
document.getElementById('authModalOverlay')?.addEventListener('click',e=>{if(e.target.id==='authModalOverlay'){pendingAuthAction=null; clearAuthResume(); closeAuthModal();}});

// ===== Utils =====
function calculateFinalPrice(bp, dt, dv) {
  if (!dt || dt === 'none' || !dv) return bp;
  const p = parseFloat(bp) || 0, v = parseFloat(dv) || 0;
  if (dt === 'amount') return Math.max(0, p - v);
  if (dt === 'percent') return Math.max(0, p - p * (Math.min(v, 100) / 100));
  return p;
}

function getDiscountLabel(dt, dv) {
  if (!dt || dt === 'none' || !dv) return '';
  return dt === 'amount' ? `خصم ${parseFloat(dv).toFixed(2)} ج` : `خصم ${parseFloat(dv)}%`;
}

function getEffectivePrice(p) {
  const bp = Number(p.price || 0), dt = p.discountType || 'none', dv = parseFloat(p.discountValue) || 0;
  const fp = calculateFinalPrice(bp, dt, dv);
  const hd = dt !== 'none' && dv > 0 && fp < bp;
  return { 
    basePrice: bp, 
    finalPrice: hd ? fp : bp, 
    hasDiscount: hd, 
    discountType: dt, 
    discountValue: dv, 
    discountLabel: hd ? getDiscountLabel(dt, dv) : '' 
  };
}

const CLOUDINARY_CLOUD_NAME = 'dzprjrvu7';

function optimizeCloudinaryUrl(u) {
  if (!u) return '';
  return u.includes('cloudinary.com') && u.includes('/upload/') && !u.includes('q_auto') ? u.replace('/upload/', '/upload/q_auto:good,f_auto/') : u;
}

function getThumbnailUrl(u, w = 400) {
  if (!u) return '';
  return u.includes('cloudinary.com') && u.includes('/upload/') ? u.replace('/upload/', `/upload/q_auto:good,f_auto,w_${w},c_limit/`) : u;
}

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ===== Notification System =====
const NotificationSystem = {
  icons: { 
    success: 'fa-circle-check', 
    error: 'fa-circle-xmark', 
    warning: 'fa-triangle-exclamation', 
    info: 'fa-circle-info' 
  },
  titles: { 
    success: 'تم بنجاح', 
    error: 'خطأ', 
    warning: 'تنبيه', 
    info: 'معلومة' 
  },
  show(msg, type = 'info', title = null, dur = 3500) {
    const c = document.getElementById('notificationCenter');
    if (!c) return;
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    const safe = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])).replace(/&lt;(\/?)(b|strong|br)&gt;/gi, '<$1$2>');
    n.innerHTML = `
      <div class="notification-icon"><i class="fa-solid ${this.icons[type]}"></i></div>
      <div class="notification-content">
        <div class="notification-title">${safe(title || this.titles[type])}</div>
        <div class="notification-message">${safe(msg)}</div>
      </div>
      <button class="notification-close"><i class="fa-solid fa-xmark"></i></button>
    `;
    c.appendChild(n);
    const t = setTimeout(() => {
      if (n.parentNode) { 
        n.style.animation = 'notifOut 0.35s ease forwards'; 
        setTimeout(() => n.remove(), 350); 
      }
    }, dur);
    n.querySelector('.notification-close').addEventListener('click', () => { 
      clearTimeout(t); 
      n.remove(); 
    });
    while (c.children.length > 2) c.firstChild.remove();
  },
  success(m, t) { this.show(m, 'success', t); },
  error(m, t) { this.show(m, 'error', t); },
  warning(m, t) { this.show(m, 'warning', t); },
  info(m, t) { this.show(m, 'info', t); }
};

// ============================================================
// ===== Phone Notifications — additive, no DB structure changes =====
// ============================================================
const PHONE_NOTIFICATION_PERMISSION_KEY = 'professional_phone_notifications_permission_v1';
const PHONE_NOTIFICATION_STATUS_KEY = 'professional_phone_notification_status_v1';
const PHONE_NOTIFICATION_RETURN_KEY = 'professional_phone_notification_returns_v1';
let phoneNotificationRegistration = null;
let phoneNotificationOrderUnsubscribers = new Map();
let phoneNotificationReturnUnsubscribe = null;
let phoneNotificationReady = false;
let phoneNotificationStatusMemory = {};
let phoneNotificationReturnMemory = {};

function phoneNotificationStorageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) { return fallback; }
}
function phoneNotificationStorageSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

function getOrderNotificationInfo(status, order) {
  const s = String(status || 'pending').toLowerCase();
  const id = String(order?.orderId || '').slice(-8);
  const map = {
    pending:   { title:'⏳ جاري قبول الطلب', body:`طلبك #${id} قيد المراجعة وسيتم تحديثك عند قبوله.` },
    accepted:  { title:'✅ تم قبول الطلب', body:`تم قبول طلبك #${id} وجاري تجهيزه.` },
    processing:{ title:'⚙️ جاري تجهيز الطلب', body:`جاري تجهيز طلبك #${id}.` },
    delivering:{ title:'🚚 جاري توصيل الطلب', body:`طلبك #${id} في الطريق إليك.` },
    shipped:   { title:'📦 تم شحن الطلب', body:`تم شحن طلبك #${id} وجاري توصيله.` },
    delivered: { title:'✅ تم توصيل الطلب', body:`تم توصيل طلبك #${id} بنجاح.` },
    returned:  { title:'↩️ تم تسجيل المرتجع', body:`تم تسجيل إرجاع طلبك #${id}.` },
    rejected:  { title:'❌ تم رفض الطلب', body:`تم رفض طلبك #${id}. افتح التطبيق لمعرفة التفاصيل.` },
    cancelled: { title:'✕ تم إلغاء الطلب', body:`تم إلغاء طلبك #${id}.` }
  };
  return map[s] || null;
}

async function ensurePhoneNotificationPermission() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    NotificationSystem.warning('هذا المتصفح لا يدعم إشعارات الهاتف.');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') {
    NotificationSystem.warning('الإشعارات مرفوضة من إعدادات المتصفح. اسمح بها للموقع ثم حاول مرة أخرى.');
    updatePhoneNotificationButton();
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    phoneNotificationStorageSet(PHONE_NOTIFICATION_PERMISSION_KEY, permission);
    updatePhoneNotificationButton();
    if (permission !== 'granted') {
      NotificationSystem.info('لم يتم السماح بإشعارات الهاتف.');
      return false;
    }
    await navigator.serviceWorker.ready;
    phoneNotificationReady = true;
    // FCM is initialized after permission is granted; failure here must not break local notifications.
    await activateFirebaseWebPush(false);
    NotificationSystem.success('🔔 تم تفعيل إشعارات الهاتف بنجاح');
    return true;
  } catch (e) {
    console.warn('Phone notification permission:', e);
    NotificationSystem.error('تعذر تفعيل إشعارات الهاتف.');
    return false;
  }
}

async function showPhoneNotification({title, body, tag, data={}}={}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    const registration = phoneNotificationRegistration || await navigator.serviceWorker.ready;
    phoneNotificationRegistration = registration;
    const payload = {
      type:'SHOW_NOTIFICATION', title, body,
      tag: tag || `professional-${Date.now()}`,
      url:'./index.html',
      ...data
    };
    if (registration.active) {
      registration.active.postMessage(payload);
      return true;
    }
  } catch (e) { console.warn('showPhoneNotification:', e); }
  return false;
}

function updatePhoneNotificationButton() {
  const btn = document.getElementById('phoneNotificationBtn');
  const state = document.getElementById('phoneNotificationState');
  if (!btn || !state) return;
  const supported = 'Notification' in window && 'serviceWorker' in navigator;
  btn.classList.remove('enabled','denied');
  if (!supported) { state.textContent = 'غير مدعومة'; return; }
  if (Notification.permission === 'granted') {
    btn.classList.add('enabled'); state.textContent = 'مفعلة ✓';
  } else if (Notification.permission === 'denied') {
    btn.classList.add('denied'); state.textContent = 'مرفوضة';
  } else { state.textContent = 'غير مفعلة'; }
}

// مزامنة محتوى وأسعار الطلب مع Firebase (عند تعديل المدير للطلب قبل القبول)
function syncOrderContents(o, d) {
  if (!o || !d || typeof d !== 'object') return false;
  const snap = () => JSON.stringify([o.items, o.subtotal, o.deliveryFee, o.total, o.coupon || null, o.requiresDeposit, o.depositAmount, o.depositPaid, o.depositPaidAmount, o.shippingZoneName]);
  const before = snap();
  if (d.items) {
    const arr = Array.isArray(d.items) ? d.items : Object.values(d.items);
    o.items = arr.filter(Boolean).map(i => ({ ...i }));
  }
  if (d.subtotal != null) o.subtotal = Number(d.subtotal);
  if (d.deliveryFee != null) o.deliveryFee = Number(d.deliveryFee);
  if (d.total != null) o.total = Number(d.total);
  if (d.coupon) o.coupon = d.coupon;
  // إثبات الجدية (الشحن): يتزامن فوراً مع ما يسجله المدير
  o.requiresDeposit = d.requiresDeposit === true;
  o.depositAmount = d.depositAmount != null ? Number(d.depositAmount) : undefined;
  o.depositPaid = d.depositPaid === true;
  o.depositPaidAmount = d.depositPaidAmount != null ? Number(d.depositPaidAmount) : undefined;
  if (d.shippingZoneName) o.shippingZoneName = d.shippingZoneName;
  return before !== snap();
}

function markInitialOrderNotificationStatus(orderId, status) {
  const key = String(orderId || '');
  if (!key) return;
  phoneNotificationStatusMemory[key] = String(status || '');
  phoneNotificationStorageSet(PHONE_NOTIFICATION_STATUS_KEY, phoneNotificationStatusMemory);
}

async function notifyOrderStatusChange(order, previousStatus, nextStatus) {
  const id = String(order?.orderId || '');
  if (!id || String(previousStatus || '') === String(nextStatus || '')) return;
  const info = getOrderNotificationInfo(nextStatus, order);
  if (!info) return;
  await showPhoneNotification({
    title: info.title,
    body: info.body,
    tag: `order-status-${id}-${nextStatus}`,
    data: { notificationType:`order_${nextStatus}`, orderId:id, notificationId:`order-${id}-${nextStatus}` }
  });
}

function setupOrderPhoneNotificationListeners() {
  if (!database) return;

  // لا نلغي المستمعين الحاليين كل مرة؛ نضيف فقط الطلبات التي لم يتم ربطها.
  // هذا يمنع فقدان المستمع عند إضافة طلب جديد أو تحديث الطلبات.
  phoneNotificationStatusMemory =
    phoneNotificationStorageGet(PHONE_NOTIFICATION_STATUS_KEY, {}) || {};

  const currentIds = new Set();

  (myOrders || []).forEach(order => {
    const id = String(order?.orderId || '');
    if (!id || id.startsWith('LOCAL-')) return;

    currentIds.add(id);
    if (phoneNotificationOrderUnsubscribers.has(id)) return;

    const orderRef = ref(database, `orders/${id}`);
    const unsub = onValue(orderRef, async snap => {
      if (!snap.exists()) return;

      const data = snap.val() || {};
      const next = String(data.status || order.status || 'pending').toLowerCase();
      const wasDepositPaid = order.depositPaid === true;
      if (syncOrderContents(order, data)) {
        if (!wasDepositPaid && order.depositPaid) NotificationSystem.success('✅ تم تأكيد استلام تحويل إثبات الجدية. تم خصمه من إجمالي طلبك.');
        saveOrders();
        if (document.querySelector('#cartPage')?.classList.contains('active-page')) renderCartPage();
      }

      // في أول قراءة:
      // - إن كانت هناك حالة محفوظة من قبل نستخدمها.
      // - وإلا نستخدم الحالة المحلية للطلب.
      // لذلك إذا كان الطلب محليًا pending ثم أصبح accepted أثناء غياب المستخدم،
      // سيتم إرسال إشعار القبول فور عودة/فتح المتجر بدل تجاهل أول تغيير.
      const storedStatus = phoneNotificationStatusMemory[id];
      const localStatus = String(order.status || 'pending').toLowerCase();
      const previous = storedStatus == null
        ? localStatus
        : String(storedStatus).toLowerCase();

      if (previous !== next) {
        markInitialOrderNotificationStatus(id, next);

        order.status = next;
        if (data.acceptedAt) order.acceptedAt = Number(data.acceptedAt);
        if (data.deliveredAt) order.deliveredAt = Number(data.deliveredAt);
        if (data.returnedAt) order.returnedAt = Number(data.returnedAt);
        if (next === 'returned' && order.deliveredAt) OrderTimerManager.startDeliveredTimer(order.orderId);
        if (data.returnedQuantities) order.returnedQuantities = data.returnedQuantities;

        await notifyOrderStatusChange(order, previous, next);

        if (document.querySelector('#cartPage')?.classList.contains('active-page')) {
          renderCartPage();
        }
      } else {
        // أول قراءة متطابقة: ثبت الحالة حتى لا يتكرر الإشعار عند إعادة الربط.
        if (storedStatus == null) {
          markInitialOrderNotificationStatus(id, next);
        }
      }
    }, () => {});

    phoneNotificationOrderUnsubscribers.set(id, unsub);
  });

  // تنظيف المستمعين الخاصة بطلبات لم تعد موجودة محليًا.
  for (const [id, unsub] of phoneNotificationOrderUnsubscribers.entries()) {
    if (currentIds.has(id)) continue;
    try { unsub(); } catch (_) {}
    phoneNotificationOrderUnsubscribers.delete(id);
  }
}

async function setupReturnPhoneNotificationListener() {
  if (phoneNotificationReturnUnsubscribe) {
    try { phoneNotificationReturnUnsubscribe(); } catch (_) {}
    phoneNotificationReturnUnsubscribe = null;
  }
  if (!database) return;
  const phone = getSavedPhone();
  if (!phone) return;
  const phoneHash = await hashFirstOrderPhone(phone);
  if (!phoneHash) return;
  phoneNotificationReturnMemory = phoneNotificationStorageGet(PHONE_NOTIFICATION_RETURN_KEY, {}) || {};
  const returnRef = ref(database, `returnRequestIndex/${phoneHash}`);
  phoneNotificationReturnUnsubscribe = onValue(returnRef, async snap => {
    if (!snap.exists()) return;
    const data = snap.val() || {};
    for (const [id, item] of Object.entries(data)) {
      const status = String(item?.status || 'pending').toLowerCase();
      const previous = phoneNotificationReturnMemory[id];
      if (previous == null) {
        phoneNotificationReturnMemory[id] = status;
        continue;
      }
      if (previous === status) continue;
      phoneNotificationReturnMemory[id] = status;
      phoneNotificationStorageSet(PHONE_NOTIFICATION_RETURN_KEY, phoneNotificationReturnMemory);
      const invoice = String(item?.invoiceCode || item?.orderId || id).slice(-12);
      const info = {
        pending: {title:'⏳ طلب الاسترجاع قيد المراجعة', body:`تم استلام طلب الاسترجاع #${invoice} وجاري مراجعته.`},
        approved: {title:'✅ تمت الموافقة على المرتجع', body:`تمت الموافقة على طلب الاسترجاع #${invoice}.`},
        completed:{title:'💰 اكتملت عملية الاسترجاع', body:`اكتملت عملية الاسترجاع #${invoice}.`},
        rejected:{title:'❌ تم رفض طلب الاسترجاع', body:`تم رفض طلب الاسترجاع #${invoice}. افتح التطبيق لمعرفة التفاصيل.`}
      }[status];
      if (info) await showPhoneNotification({
        title:info.title, body:info.body,
        tag:`return-status-${id}-${status}`,
        data:{notificationType:`return_${status}`,returnId:id,notificationId:`return-${id}-${status}`}
      });
    }
    phoneNotificationStorageSet(PHONE_NOTIFICATION_RETURN_KEY, phoneNotificationReturnMemory);
  }, () => {});
}

function bindPhoneNotificationButton() {
  const btn = document.getElementById('phoneNotificationBtn');
  if (!btn || btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', async () => {
    // تأكيد واضح من المستخدم قبل ظهور نافذة سماح المتصفح.
    if ('Notification' in window && Notification.permission === 'default') {
      const wantsNotifications = await window.proConfirm(
        '🔔 هل تريد تفعيل إشعارات الهاتف؟\\n\\nاضغط «موافق» للسماح بإشعارات الطلبات والمرتجعات، أو «إلغاء» للمتابعة بدون تفعيل.'
      );
      if (!wantsNotifications) return;
    }
    const ok = await ensurePhoneNotificationPermission();
    if (ok) {
      await setupReturnPhoneNotificationListener();
      setupOrderPhoneNotificationListeners();
      await activateFirebaseWebPush(false);
      updatePhoneNotificationButton();
    }
  });
  updatePhoneNotificationButton();
}

// ============================================================
// ===== Order Timer Manager =====
// ============================================================
const OrderTimerManager = {
  timers: new Map(),
  
  startDeliveredTimer(oid) {
    this.clearTimer(oid);

    const order = myOrders.find(o => o.orderId === oid);
    const deliveredAt = Number(order?.deliveredAt || Date.now());
    const elapsed = Math.max(0, Date.now() - deliveredAt);
    const TEN_MINUTES = 10 * 60 * 1000;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    // بعد 10 دقائق نخفي الطلب من واجهة السلة فقط، ولا نحذفه من myOrders.
    // صفحة المرتجعات تعتمد على myOrders وتحتاج الطلب طوال 24 ساعة.
    const cartRemaining = Math.max(0, TEN_MINUTES - elapsed);
    const cartTimer = setTimeout(() => {
      if (document.querySelector('#cartPage')?.classList.contains('active-page')) {
        renderCartPage();
      }
      console.log(`👁️ تم إخفاء الطلب ${oid} من السلة بعد 10 دقائق، مع إبقائه متاحاً للمرتجعات لمدة 24 ساعة`);
    }, cartRemaining);

    // الحذف الفعلي من Firebase بعد 24 ساعة من وقت التسليم نفسه.
    const dbRemaining = Math.max(0, TWENTY_FOUR_HOURS - elapsed);
    const dbTimer = setTimeout(async () => {
      if (database) {
        try { 
          await remove(ref(database, `orders/${oid}`)); 
        } catch (e) {}
      }
      const i = myOrders.findIndex(o => o.orderId === oid);
      if (i >= 0) { 
        myOrders.splice(i, 1); 
        saveOrders(); 
      }
      this.clearTimer(oid);
      if (document.querySelector('#cartPage')?.classList.contains('active-page')) {
        renderCartPage();
      }
      console.log(`🗑️ تم حذف الطلب ${oid} من قاعدة البيانات بعد 24 ساعة من التسليم`);
    }, dbRemaining);

    this.timers.set(oid, { timeout: dbTimer, cartTimer, type: 'delivered' });
  },
  
  startRejectedTimer(oid) {
    this.clearTimer(oid);
    const t = setTimeout(() => this.deleteOrderPermanently(oid), 24 * 60 * 60 * 1000);
    this.timers.set(oid, { timeout: t, type: 'rejected' });
  },
  
  clearTimer(oid) {
    const e = this.timers.get(oid);
    if (e) { 
      clearTimeout(e.timeout); 
      if (e.cartTimer) clearTimeout(e.cartTimer);
      if (e.countdownInterval) clearInterval(e.countdownInterval);
      this.timers.delete(oid); 
    }
  },
  
  async deleteOrderPermanently(oid) {
    if (database) {
      try { await remove(ref(database, `orders/${oid}`)); } catch (e) {}
    }
    const i = myOrders.findIndex(o => o.orderId === oid);
    if (i >= 0) { 
      myOrders.splice(i, 1); 
      saveOrders(); 
    }
    this.clearTimer(oid);
    if (document.querySelector('#cartPage')?.classList.contains('active-page')) {
      renderCartPage();
    }
  },
  
  startReturnedTimer(oid) {
    this.clearTimer(oid);
    const order = myOrders.find(o => o.orderId === oid);
    const returnedAt = Number(order?.returnedAt || Date.now());
    const deliveredAt = Number(order?.deliveredAt || returnedAt);
    const TEN_MINUTES = 10 * 60 * 1000;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const cartRemaining = Math.max(0, TEN_MINUTES - (Date.now() - returnedAt));
    const cartTimer = setTimeout(() => {
      if (document.querySelector('#cartPage')?.classList.contains('active-page')) {
        renderCartPage();
      }
    }, cartRemaining);
    const countdownInterval = setInterval(() => {
      const remaining = Math.max(0, TEN_MINUTES - (Date.now() - returnedAt));
      const sec = Math.ceil(remaining / 1000);
      document.querySelectorAll('[data-returned-countdown]').forEach(el => {
        if (el.dataset.returnedCountdown === String(oid)) {
          el.textContent = `${String(Math.floor(sec / 60)).padStart(2,'0')}:${String(sec % 60).padStart(2,'0')}`;
        }
      });
      if (remaining <= 0) clearInterval(countdownInterval);
    }, 1000);
    const dbRemaining = Math.max(0, TWENTY_FOUR_HOURS - (Date.now() - deliveredAt));
    const dbTimer = setTimeout(async () => {
      if (database) {
        try { await remove(ref(database, `orders/${oid}`)); } catch (e) {}
      }
      const i = myOrders.findIndex(o => o.orderId === oid);
      if (i >= 0) { myOrders.splice(i, 1); saveOrders(); }
      this.clearTimer(oid);
      if (document.querySelector('#cartPage')?.classList.contains('active-page')) renderCartPage();
    }, dbRemaining);
    this.timers.set(oid, { timeout: dbTimer, cartTimer, countdownInterval, type: 'returned' });
  },

  checkExistingOrders() {
    const n = Date.now();
    myOrders.forEach(o => {
      if ((o.status === 'returned' || o.returnedAt) && o.deliveredAt) {
        const elapsed = n - Number(o.deliveredAt);
        if (elapsed > 24 * 60 * 60 * 1000) {
          this.deleteOrderPermanently(o.orderId);
        } else {
          this.startReturnedTimer(o.orderId);
        }
      } else if (o.status === 'delivered' && o.deliveredAt) {
        const elapsed = n - Number(o.deliveredAt);
        // لا نحذف الطلب محلياً بعد 10 دقائق؛ يظل متاحاً للمرتجعات حتى نهاية الـ24 ساعة.
        // الإخفاء من السلة فقط يتم داخل renderCartPage.
        if (elapsed > 24 * 60 * 60 * 1000) {
          this.deleteOrderPermanently(o.orderId);
        } else {
          this.startDeliveredTimer(o.orderId);
        }
      } else if (o.status === 'rejected' && o.rejectedAt) {
        const elapsed = n - o.rejectedAt;
        if (elapsed > 24 * 60 * 60 * 1000) {
          this.deleteOrderPermanently(o.orderId);
        } else {
          this.startRejectedTimer(o.orderId);
        }
      }
    });
  }
};

// ============================================================
// ===== ✅ Completed Returns Timer Manager (جديد) =====
// ============================================================
const CompletedReturnsTimerManager = {
  deleteTimers: new Map(),
  countdownIntervals: new Map(),
  
  // بدء عداد الحذف التلقائي (24 ساعة)
  startAutoDelete(returnId, completedAt, onDelete) {
    this.clear(returnId);
    
    const elapsed = Date.now() - completedAt;
    const remaining = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);
    
    if (remaining <= 0) {
      onDelete(returnId);
      return;
    }
    
    const timer = setTimeout(() => {
      this.clear(returnId);
      onDelete(returnId);
    }, remaining);
    
    this.deleteTimers.set(returnId, timer);
    console.log(`⏰ بدأ عداد الحذف للمرتجع ${returnId} - ${Math.floor(remaining / 1000)} ثانية متبقية`);
  },
  
  // بدء عداد العرض التنازلي (يُحدّث كل ثانية)
  startCountdown(returnId, completedAt, updateCallback) {
    this.stopCountdown(returnId);
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - completedAt;
      const remaining = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);
      
      if (remaining <= 0) {
        this.stopCountdown(returnId);
        if (updateCallback) updateCallback('00:00:00');
        return;
      }
      
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      if (updateCallback) updateCallback(formatted);
    }, 1000);
    
    this.countdownIntervals.set(returnId, interval);
  },
  
  stopCountdown(returnId) {
    const interval = this.countdownIntervals.get(returnId);
    if (interval) {
      clearInterval(interval);
      this.countdownIntervals.delete(returnId);
    }
  },
  
  clear(returnId) {
    const timer = this.deleteTimers.get(returnId);
    if (timer) {
      clearTimeout(timer);
      this.deleteTimers.delete(returnId);
    }
    this.stopCountdown(returnId);
  },
  
  clearAll() {
    this.deleteTimers.forEach(timer => clearTimeout(timer));
    this.deleteTimers.clear();
    this.countdownIntervals.forEach(interval => clearInterval(interval));
    this.countdownIntervals.clear();
    console.log('🧹 تم إيقاف جميع عدادات المرتجعات المكتملة');
  }
};

// ===== State =====
let allProducts = [];
let cartItems = [];
let myOrders = [];
let wishlist = [];
let currentCategory = 'all';
const storeFacets = { cats: new Set(), rating: 0, inStock: false, discount: 0 };
let sugDebounceT = null;
let currentSort = 'newest';
let currentPriceMin = null;
let currentPriceMax = null;
let currentSearchQuery = '';
let selectedPaymentMethod = 'cod';
let codFee = 0;
let deliveryFee = 5;
let shippingRates = { edfu: null, governorates: {} };
let storeWhatsappNumber = '';
let firstOrderFreeDelivery = true;
let freeShipEnabled = false;
let freeShipThreshold = 0;
let firstOrderEligible = false;
let firstOrderCheckInProgress = false;
let appliedCoupon = null;
let couponDiscount = 0;
let targetProductId = null;
let targetProductIds = [];
let isTargetingProduct = false;
let homeVisibleLimit = 20;
let isSearchResultsMode = false;
let currentDetailProduct = null;
let returnsActiveTab = 'eligible';

// ===== V3 customer profile + product reviews =====
const REVIEW_STORAGE_KEY = 'professional_review_identity_v1';
const CHECKOUT_PROFILE_KEY = 'professional_checkout_profile_v1';
let selectedReviewRating = 5;
let currentProductReviews = [];

function getCustomerIdentity() {
  let x = loadFromStorage(REVIEW_STORAGE_KEY, null);
  if (!x?.customerId) {
    x = { customerId: 'guest-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36) };
    try { localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(x)); } catch (e) {}
  }
  return x;
}

function getCheckoutProfile() {
  return loadFromStorage(CHECKOUT_PROFILE_KEY, {});
}

function saveCheckoutProfile(name, address, phone, zone = '') {
  try {
    localStorage.setItem(CHECKOUT_PROFILE_KEY, JSON.stringify({ name, address, phone, zone, savedAt: Date.now() }));
    localStorage.setItem('professional_checkout_phone', phone);
  } catch (e) {}
}

function clearCheckoutProfile() {
  try { 
    localStorage.removeItem(CHECKOUT_PROFILE_KEY); 
    localStorage.removeItem('professional_checkout_phone');
  } catch (e) {}
  const el = $('#checkoutSavedNote');
  if (el) el.style.display = 'none';
  NotificationSystem.info('تم مسح بيانات الشراء المحفوظة');
}

function fillCheckoutProfile() {
  const p = getCheckoutProfile();
  if (!p.name && !p.address && !p.phone) return;
  const note = $('#checkoutSavedNote');
  if (note) note.style.display = 'flex';
  if (p.name && $('#custName')) $('#custName').value = p.name;
  if (p.address && $('#custAddress')) $('#custAddress').value = p.address;
  if (p.phone && $('#custPhone')) $('#custPhone').value = p.phone;
  if (p.zone && $('#custZone') && $('#custZone option[value="' + p.zone + '"]')) $('#custZone').value = p.zone;
}

function isCustomerVerifiedBuyer(pid) {
  return myOrders.some(o => 
    ['pending', 'processing', 'shipped', 'delivered'].includes(o.status) && 
    Array.isArray(o.items) && 
    o.items.some(i => String(i.productId) === String(pid))
  );
}

function starsText(a) {
  const n = Math.max(0, Math.min(5, Math.round(Number(a) || 0)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function escReview(v) {
  return String(v || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

// ===== طرق الدفع المصرية =====
const walletNumbers = {
  vodafone: '01097570965',
  etisalat: '01152321199',
  orange: '01234567890',
  we: '01012345678',
  instapay: '01098765432',
  bank: 'EG28 1234 5678 9012 3456 7890',
  visa: '0000-0000-0000-0000'
};

const PAYMENT_METHODS = {
  cod: { name: 'الدفع عند الاستلام', icon: 'fa-hand-holding-dollar', color: '' },
  vodafone: { name: 'فودافون كاش', icon: 'fa-mobile-screen', color: '#E60000' },
  etisalat: { name: 'اتصالات كاش', icon: 'fa-mobile-screen', color: '#0054A6' },
  orange: { name: 'أورنج كاش', icon: 'fa-mobile-screen', color: '#FF6600' },
  we: { name: 'وي باي', icon: 'fa-wallet', color: '#7B3FAF' },
  instapay: { name: 'إنستا باي', icon: 'fa-bolt', color: '#00BFA5' },
  bank: { name: 'تحويل بنكي', icon: 'fa-university', color: '#2E7D32' },
  visa: { name: 'فيزا كارد', icon: 'fa-cc-visa', color: '#1A1F71' }
};

window.__pay = { wallets: walletNumbers, methods: PAYMENT_METHODS, codFee: () => codFee };
window.__layer = { push: pushStoreLayerHistory, close: closeStoreLayerFromButton };

const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: 'fa-grid-2' },
  { id: 'مستلزمات شخصية', name: 'البقالة', icon: 'fa-basket-shopping' },
  { id: 'أجهزة كهربائية', name: 'أجهزة كهربائية', icon: 'fa-plug' },
  { id: 'أجهزة شخصية', name: 'أجهزة شخصية', icon: 'fa-mobile-screen' },
  { id: 'عناية طبيعية', name: 'عناية طبيعية', icon: 'fa-leaf' },
  { id: 'ملابس', name: 'ملابس', icon: 'fa-shirt' },
  { id: 'ألعاب وإكسسوارات', name: 'ألعاب وإكسسوارات', icon: 'fa-gamepad' }
];

// ===== Storage =====
function loadFromStorage(k, f = []) {
  try { 
    const d = localStorage.getItem(k); 
    return d ? JSON.parse(d) : f; 
  } catch (e) { 
    localStorage.removeItem(k); 
    return f; 
  }
}

cartItems = loadFromStorage('professional_cart_v4', []);
myOrders = loadFromStorage('professional_orders_v4', []);

// استرجاع الطلبات المسلّمة التي حُفظت في ذاكرة المرتجعات قبل انتهاء الـ24 ساعة.
try {
  const returnCache = loadFromStorage('professional_return_orders_v1', []);
  if (Array.isArray(returnCache) && returnCache.length) {
    const byId = new Map(myOrders.map(o => [String(o.orderId), o]));
    returnCache.forEach(o => {
      if (!o?.orderId) return;
      const age = Date.now() - Number(o.deliveredAt || 0);
      if (o.status === 'delivered' && o.deliveredAt && age >= 0 && age < 24 * 60 * 60 * 1000 && !byId.has(String(o.orderId))) {
        myOrders.push(o);
      }
    });
  }
} catch (e) {}

wishlist = loadFromStorage('professional_wishlist_v4', []);

function saveCart() {
  try { localStorage.setItem('professional_cart_v4', JSON.stringify(cartItems)); } catch (e) {}
  updateBadges();
}

function saveOrders() {
  try { localStorage.setItem('professional_orders_v4', JSON.stringify(myOrders)); } catch (e) {}
  // الطلبات الجديدة يجب أن تدخل المراقبة فورًا.
  try {
    if (database) {
      setTimeout(() => setupOrderPhoneNotificationListeners(), 0);
    }
  } catch (_) {}
  // نسخة محلية مخصصة للمرتجعات: الطلب المسلّم يبقى متاحاً حتى نهاية نافذة الـ24 ساعة.
  try {
    const returnEligibleOrders = myOrders.filter(o => {
      if (o.status !== 'delivered' || !o.deliveredAt) return false;
      return (Date.now() - Number(o.deliveredAt)) < 24 * 60 * 60 * 1000;
    });
    localStorage.setItem('professional_return_orders_v1', JSON.stringify(returnEligibleOrders));
  } catch (e) {}
}

function saveWishlist() {
  try { localStorage.setItem('professional_wishlist_v4', JSON.stringify(wishlist)); } catch (e) {}
  updateWishlistBadge();
  renderWishlistPage();
}

function updateBadges() {
  const t = cartItems.reduce((s, i) => s + (i.quantity || 0), 0);
  const tb = $('#cartCountTop');
  const bb = $('#bottomCartBadge');
  const mb = $('#menuCartBadge');
  if (tb) tb.textContent = t;
  if (bb) { bb.textContent = t; bb.classList.toggle('show', t > 0); }
  if (mb) { mb.textContent = t; mb.classList.toggle('hidden', t === 0); }
}

function updateWishlistBadge() {
  const b = $('#wishlistBadge');
  const mb = $('#menuWishlistBadge');
  const count = wishlist.length;
  if (b) { b.textContent = count; b.classList.toggle('hidden', count === 0); }
  if (mb) { mb.textContent = count; mb.classList.toggle('hidden', count === 0); }
}

function getCartProductsSubtotal() {
  return (cartItems || []).reduce((s, i) => s + ((i.finalPrice || i.price || 0)) * (i.quantity || 0), 0);
}

// شحن مجاني عند تخطي مبلغ معين: يُحسب على سعر المنتجات فقط (قبل الشحن ورسوم الدفع).
function isThresholdFreeShipping(subtotal = getCartProductsSubtotal()) {
  return freeShipEnabled && freeShipThreshold > 0 && subtotal > 0 && subtotal >= freeShipThreshold;
}

function getSelectedZoneKey() {
  return document.getElementById('custZone')?.value || '';
}

function getZoneName(key = getSelectedZoneKey()) {
  const o = key ? document.querySelector('#custZone option[value="' + key + '"]') : null;
  return o ? (o.dataset.zoneName || o.textContent.trim()) : '';
}

// سعر الشحن الأساسي للمنطقة (إن لم يُحدَّد سعر لها يُستخدم السعر الافتراضي)
function getZoneBaseFee(key = getSelectedZoneKey()) {
  if (!key) return deliveryFee;
  const v = key === 'edfu' ? shippingRates.edfu : shippingRates.governorates[key];
  return Number.isFinite(v) ? v : deliveryFee;
}

function getDeliveryFee() {
  return (isFirstOrderFreeShipping() || isThresholdFreeShipping()) ? 0 : getZoneBaseFee();
}

// إثبات الجدية: مطلوب لأي طلب COD خارج أدفو، حتى لو الشحن مجاني، وقيمته = سعر الشحن الفعلي للمنطقة.
// يُخصم من الفاتورة، ولا يُسترد إن رفض العميل الاستلام.
function getDepositAmount() {
  const k = getSelectedZoneKey();
  if (!k || k === 'edfu') return 0;
  return Math.max(0, Number(getZoneBaseFee(k)) || 0);
}

function isDepositRequired(df) {
  const k = getSelectedZoneKey();
  return !!k && k !== 'edfu' && selectedPaymentMethod === 'cod' && getDepositAmount() > 0;
}

const fmtMoney = n => Number(n).toFixed(2).replace(/\.00$/, '');

function updateDepositNotice(df, gt) {
  const box = document.getElementById('depositNotice');
  if (!box) return;
  if (!isDepositRequired(df)) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  const total = Math.max(0, gt);
  const dep = getDepositAmount();
  const freeShip = Number(df) === 0;
  const head = box.querySelector('.dn-head span');
  if (head) head.textContent = freeShip ? 'الشحن مجاني — لكن إثبات الجدية مطلوب' : 'إثبات الجدية — مطلوب لطلبات الشحن';
  const txt = box.querySelector('.dn-text');
  if (txt) txt.innerHTML = (freeShip
    ? 'التوصيل مجاني لطلبك 🎉، ولكن لتأكيد الطلب خارج مركز أدفو يرجى <b>تحويل <span id="dnFee">0</span> ج أولاً</b> (قيمة الشحن الفعلية) كإثبات للجدية، ثم إرسال <b>لقطة شاشة التحويل</b> عبر واتساب. سيتم <b>خصم المبلغ المحوَّل من إجمالي فاتورتك</b>، فلا تدفع أي زيادة.'
    : 'لتأكيد طلبك خارج مركز أدفو، يرجى <b>تحويل رسوم الشحن <span id="dnFee">0</span> ج أولاً</b> كإثبات للجدية، ثم إرسال <b>لقطة شاشة التحويل</b> عبر واتساب. سيتم <b>خصم المبلغ المحوَّل من إجمالي فاتورتك</b>.');
  const warn = box.querySelector('.dn-warn');
  if (warn) warn.innerHTML = '⚠️ المبلغ المحوَّل <b>غير قابل للاسترداد</b> إذا رفض العميل استلام الطلب أو لم يرد، لأنه يغطي مصاريف الشحن والمرتجع لدى شركة الشحن. وإذا استلمت الطلب يُخصم كاملاً من الفاتورة.';
  document.getElementById('dnFee').textContent = fmtMoney(dep);
  document.getElementById('dnTotal').textContent = fmtMoney(total) + ' ج';
  document.getElementById('dnPay').textContent = fmtMoney(dep) + ' ج';
  document.getElementById('dnRest').textContent = fmtMoney(Math.max(0, total - dep)) + ' ج';
  const ul = document.getElementById('dnNumbers');
  if (ul && !ul.dataset.ready) {
    ul.innerHTML = '';
    ['vodafone','etisalat','orange','we','instapay','bank'].forEach(k => {
      const num = walletNumbers[k];
      if (!num) return;
      const li = document.createElement('li');
      const n = document.createElement('span'); n.textContent = PAYMENT_METHODS[k].name;
      const b = document.createElement('b'); b.textContent = num;
      const c = document.createElement('button'); c.type = 'button'; c.textContent = 'نسخ';
      c.addEventListener('click', () => { try { navigator.clipboard.writeText(num); NotificationSystem.success('تم نسخ الرقم'); } catch (e) {} });
      li.append(n, b, c); ul.appendChild(li);
    });
    ul.dataset.ready = '1';
  }
  const wa = document.getElementById('dnWhatsapp');
  if (wa) {
    if (storeWhatsappNumber) {
      const nm = document.getElementById('custName')?.value.trim() || '';
      wa.href = 'https://wa.me/' + storeWhatsappNumber + '?text=' + encodeURIComponent('مرحباً، هذه لقطة شاشة تحويل رسوم الشحن (' + fmtMoney(dep) + ' ج) إثبات جدية لطلبي' + (nm ? ' باسم ' + nm : '') + '.');
      wa.style.display = 'flex';
    } else wa.style.display = 'none';
  }
}

function refreshZoneUI() {
  const sel = document.getElementById('custZone');
  if (!sel) return;
  sel.querySelectorAll('option[data-zone-name]').forEach(o => {
    const fee = getZoneBaseFee(o.value);
    o.textContent = o.dataset.zoneName + ' — ' + (fee === 0 ? 'مجاناً' : fee.toFixed(2).replace(/\.00$/, '') + ' ج');
  });
  const box = document.getElementById('zonePrice');
  if (!box) return;
  const key = sel.value;
  if (!key) {
    box.className = 'zone-price';
    box.innerHTML = '<i class="fa-solid fa-truck-fast"></i><span>اختر المنطقة لتظهر لك رسوم التوصيل</span>';
    return;
  }
  const fee = getDeliveryFee();
  const name = getZoneName(key);
  if (fee === 0) {
    box.className = 'zone-price ready free';
    const dep0 = (key !== 'edfu' && selectedPaymentMethod === 'cod') ? getDepositAmount() : 0;
    box.innerHTML = '<i class="fa-solid fa-gift"></i><span>التوصيل إلى ' + name + ': مجاناً 🎉' + (dep0 > 0 ? ' <small style="display:block;font-weight:700;opacity:.85">مع إثبات جدية ' + fmtMoney(dep0) + ' ج يُخصم من فاتورتك</small>' : '') + '</span>';
  } else {
    box.className = 'zone-price ready';
    box.innerHTML = '<i class="fa-solid fa-truck-fast"></i><span>التوصيل إلى ' + name + ': ' + fee.toFixed(2).replace(/\.00$/, '') + ' ج</span>';
  }
}

function loadShippingRates() {
  if (!database) return;
  try {
    onValue(ref(database, 'settings/shippingRates'), s => {
      const d = s.exists() ? (s.val() || {}) : {};
      const num = v => (v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))) ? Number(v) : null;
      shippingRates = { edfu: num(d.edfu), governorates: {} };
      Object.keys(d.governorates || {}).forEach(k => { const n = num(d.governorates[k]); if (n !== null) shippingRates.governorates[k] = n; });
      updateTotalSummary();
    });
  } catch (e) {}
}

function updateFreeShipHint() {
  const html = (() => {
    if (!freeShipEnabled || freeShipThreshold <= 0) return '';
    const st = getCartProductsSubtotal();
    if (st <= 0) return `<i class="fa-solid fa-truck-fast"></i><span>شحن مجاني للطلبات من ${freeShipThreshold.toFixed(0)} ج</span>`;
    if (st >= freeShipThreshold) return `<i class="fa-solid fa-circle-check"></i><span>🎉 مبروك! حصلت على شحن مجاني</span>`;
    const left = freeShipThreshold - st;
    const pct = Math.max(4, Math.min(100, Math.round((st / freeShipThreshold) * 100)));
    return `<div style="width:100%"><div style="display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-truck-fast"></i><span>أضف منتجات بـ <b>${left.toFixed(2)} ج</b> للحصول على شحن مجاني</span></div><div class="free-ship-bar"><span style="width:${pct}%"></span></div></div>`;
  })();
  document.querySelectorAll('.free-ship-hint').forEach(el => {
    el.innerHTML = html;
    el.style.display = html ? 'flex' : 'none';
    el.classList.toggle('reached', !!html && isThresholdFreeShipping());
  });
}

// ===== Settings =====
function loadCODFee() {
  if (!database) return;
  try {
    onValue(ref(database, 'settings/codFee'), s => {
      if (s.exists()) { codFee = parseFloat(s.val().fee) || 0; } 
      else { codFee = 0; }
      updateCODFeeDisplay();
      updateTotalSummary();
    });
  } catch (e) { codFee = 0; }
}

function loadDeliveryFee() {
  if (!database) return;
  try {
    onValue(ref(database, 'settings/deliveryFee'), s => {
      if (s.exists()) {
        const d = s.val() || {};
        deliveryFee = Number.isFinite(parseFloat(d.fee)) ? parseFloat(d.fee) : 5;
        firstOrderFreeDelivery = d.firstOrderFree !== false;
        freeShipEnabled = d.freeShippingEnabled === true;
        freeShipThreshold = Math.max(0, parseFloat(d.freeShippingThreshold) || 0);
      } else {
        deliveryFee = 5;
        firstOrderFreeDelivery = true;
        freeShipEnabled = false;
        freeShipThreshold = 0;
      }
      updateFirstOrderDeliveryUI();
      updateTotalSummary();
    });
  } catch (e) {
    deliveryFee = 5;
    firstOrderFreeDelivery = true;
  }
}

function hasLocalOrderForPhone(phone) {
  const normalized = String(phone || '').trim();
  if (!normalized) return false;
  return Array.isArray(myOrders) && myOrders.some(o => String(o.phone || '').trim() === normalized);
}

async function hashFirstOrderPhone(phone) {
  const normalized = String(phone || '').trim();
  if (!normalized) return '';
  try {
    const data = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    console.error('❌ تعذر إنشاء بصمة رقم الهاتف:', e);
    return '';
  }
}

async function checkFirstOrderEligibility(phone, silent = true) {
  const normalized = String(phone || '').trim();
  firstOrderEligible = false;
  
  if (!firstOrderFreeDelivery || !normalized) {
    updateFirstOrderDeliveryUI();
    updateTotalSummary();
    return false;
  }

  if (hasLocalOrderForPhone(normalized)) {
    updateFirstOrderDeliveryUI();
    updateTotalSummary();
    return false;
  }

  if (!database) {
    firstOrderEligible = true;
    updateFirstOrderDeliveryUI();
    updateTotalSummary();
    return true;
  }

  firstOrderCheckInProgress = true;
  updateFirstOrderDeliveryUI();

  try {
    const phoneHash = await hashFirstOrderPhone(normalized);
    if (!phoneHash) throw new Error('PHONE_HASH_FAILED');
    const snap = await get(ref(database, 'orderPhoneIndex/' + phoneHash));
    firstOrderEligible = !snap.exists();
  } catch (e) {
    firstOrderEligible = false;
    if (!silent) NotificationSystem.warning('تعذر التحقق من حالة أول طلب، حاول مرة أخرى.');
  } finally {
    firstOrderCheckInProgress = false;
    updateFirstOrderDeliveryUI();
    updateTotalSummary();
  }
  return firstOrderEligible;
}

function isFirstOrderFreeShipping() {
  return firstOrderFreeDelivery && firstOrderEligible;
}

function updateFirstOrderDeliveryUI() {
  const badge = document.getElementById('firstOrderFreeBadge');
  if (!badge) return;
  if (!firstOrderFreeDelivery) {
    badge.style.display = 'none';
    return;
  }
  badge.style.display = 'flex';
  badge.innerHTML = isFirstOrderFreeShipping()
    ? '<i class="fa-solid fa-gift"></i><span>🎁 أول طلب لك — التوصيل مجانًا</span>'
    : '<i class="fa-solid fa-truck-fast"></i><span>التوصيل مجاني للطلب الأول</span>';
}

function updateCODFeeDisplay() {
  const b = document.getElementById('codFeeBadge');
  if (b) {
    if (codFee > 0) { 
      b.textContent = `+${codFee.toFixed(0)} ج`; 
      b.style.display = 'inline'; 
    } else { 
      b.style.display = 'none'; 
    }
  }
}

// ===== Coupons =====
const defaultCoupons = {}; /* لا توجد أكواد ثابتة: الأكواد تأتي من لوحة التحكم (Firebase) فقط */

let activeCoupons = { ...defaultCoupons };
let couponListenerActive = false;

function loadCouponsFromFirebase() {
  if (!database) return;
  if (couponListenerActive) return;
  couponListenerActive = true;
  try {
    const couponsRef = ref(database, 'coupons');
    onValue(couponsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const loadedCoupons = {};
        for (const key in data) {
          if (data.hasOwnProperty(key) && key !== '_init') {
            const coupon = data[key];
            if (!coupon || !String(coupon.code || '').trim()) continue;
            loadedCoupons[String(coupon.code).toUpperCase().trim()] = {
              type: coupon.type || 'percent',
              value: coupon.value || 0,
              description: coupon.description || '',
              freeShipping: coupon.type === 'free_shipping',
              active: coupon.active !== false,
              maxUses: coupon.maxUses !== undefined ? coupon.maxUses : null,
              usedCount: coupon.usedCount || 0,
              expiryDate: coupon.expiryDate || null,
              id: key
            };
          }
        }
        if (Object.keys(loadedCoupons).length > 0) {
          activeCoupons = { ...defaultCoupons, ...loadedCoupons };
        } else {
          activeCoupons = { ...defaultCoupons };
        }
        checkAppliedCouponValidity();
      } else {
        activeCoupons = { ...defaultCoupons };
      }
    }, (error) => {
      console.warn('⚠️ فشل تحميل الكوبونات من Firebase:', error);
      activeCoupons = { ...defaultCoupons };
    });
  } catch (e) {
    console.warn('⚠️ خطأ في تحميل الكوبونات:', e);
    activeCoupons = { ...defaultCoupons };
  }
}

async function hasCustomerUsedCoupon(coupon, phone) {
  if (!coupon || !phone || !database || !coupon.id) return false;
  try {
    const phoneHash = await hashFirstOrderPhone(phone);
    if (!phoneHash) return false;
    const snap = await get(ref(database, `couponUses/${coupon.id}/${phoneHash}`));
    return snap.exists();
  } catch (e) {
    console.warn('Coupon customer usage check failed:', e);
    return false;
  }
}

function validateCoupon(couponCode) {
  const code = couponCode.toUpperCase().trim();
  const coupon = activeCoupons[code];
  if (!coupon) return { valid: false, message: '❌ كود غير صحيح' };
  if (coupon.active === false) return { valid: false, message: '❌ هذا الكوبون غير مفعل حالياً' };
  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate);
    const now = new Date();
    if (expiry < now) return { valid: false, message: '❌ انتهت صلاحية الكوبون' };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: `❌ تم استخدام الحد الأقصى للكوبون (${coupon.maxUses})` };
  }
  return { valid: true, coupon: coupon };
}

function checkAppliedCouponValidity() {
  if (!appliedCoupon) return;
  const validation = validateCoupon(appliedCoupon.code);
  if (!validation.valid) {
    const oldCoupon = appliedCoupon.code;
    removeCoupon();
    NotificationSystem.warning(`⚠️ تم إلغاء الكوبون ${oldCoupon}: ${validation.message}`);
  }
}

function applyCoupon(code) {
  const validation = validateCoupon(code);
  if (!validation.valid) return { success: false, message: validation.message };
  const coupon = validation.coupon;
  if (appliedCoupon && appliedCoupon.code === code.toUpperCase().trim()) {
    return { success: false, message: '⚠️ الكود مفعل بالفعل' };
  }
  appliedCoupon = { 
    code: code.toUpperCase().trim(), 
    ...coupon, 
    maxUses: coupon.maxUses, 
    usedCount: coupon.usedCount 
  };
  couponDiscount = 0;
  const statusEl = document.getElementById('couponStatus');
  if (statusEl) {
    statusEl.innerHTML = `<span class="coupon-applied"><i class="fa-solid fa-check"></i> تم تطبيق ${escapeStoreHtml(coupon.description)}</span>`;
  }
  updateTotalSummary();
  return { success: true, message: `✅ تم تطبيق ${coupon.description}` };
}

function removeCoupon() {
  appliedCoupon = null;
  couponDiscount = 0;
  updateTotalSummary();
  const st = $('#couponStatus');
  if (st) st.textContent = '';
}

function calculateCouponDiscount(subtotal) {
  if (!appliedCoupon) return 0;
  if (appliedCoupon.type === 'percent') return subtotal * (appliedCoupon.value / 100);
  if (appliedCoupon.type === 'free_shipping') return 0;
  if (appliedCoupon.type === 'fixed') return Math.min(appliedCoupon.value, subtotal);
  return 0;
}

function isFreeShipping() {
  return appliedCoupon && appliedCoupon.freeShipping === true;
}

function updateTotalSummary() {
  const se = document.getElementById('subtotalAmount');
  const de = document.getElementById('deliveryAmount');
  const ce = document.getElementById('codFeeAmount');
  const ge = document.getElementById('grandTotalAmount');
  const dr = document.getElementById('deliveryRow');
  const cr = document.getElementById('codFeeRow');
  const cdRow = document.getElementById('couponDiscountRow');
  const cdAmt = document.getElementById('couponDiscountAmount');
  if (!se || !de || !ce || !ge) return;

  const st = cartItems.reduce((s, i) => s + ((i.finalPrice || i.price || 0)) * (i.quantity || 0), 0);
  const fs = isFreeShipping();
  let df = fs ? 0 : getDeliveryFee();
  const cod = selectedPaymentMethod === 'cod' ? codFee : 0;
  const disc = calculateCouponDiscount(st);
  couponDiscount = disc;
  let gt = st + df + cod - disc;

  se.textContent = st.toFixed(2) + ' ج';
  de.textContent = df === 0 ? 'مجاناً 🎉' : df.toFixed(2) + ' ج';
  ce.textContent = cod.toFixed(2) + ' ج';

  if (cdRow) {
    if (disc > 0) {
      cdRow.style.display = 'flex';
      cdAmt.textContent = `-${disc.toFixed(2)} ج`;
    } else {
      cdRow.style.display = 'none';
    }
  }

  ge.textContent = Math.max(0, gt).toFixed(2) + ' ج';
  try {
    const sv = cartItems.reduce((a, i) => a + Math.max(0, Number(i.originalPrice || i.price || 0) - Number(i.finalPrice || i.price || 0)) * (i.quantity || 0), 0) + (disc || 0);
    let n = document.getElementById('savingsNote');
    if (!n) { n = document.createElement('div'); n.id = 'savingsNote'; (ge.closest('.breakdown-row, .summary-row, .total-row') || ge.parentElement).insertAdjacentElement('afterend', n); }
    n.style.display = sv > 0.009 ? 'block' : 'none';
    n.textContent = `🎉 وفّرت ${sv.toFixed(2)} ج في هذه الطلبية`;
  } catch (_) {}
  updateFreeShipHint();
  if (dr) { dr.classList.toggle('free', df === 0); dr.style.display = 'flex'; }
  if (cr) cr.style.display = (cod > 0) ? 'flex' : 'none';
  refreshZoneUI();
  updateDepositNotice(df, gt);
}

// قراءة إعدادات ثابتة: تظهر فوراً من الكاش ثم تتحدث مرة واحدة بـ get() (بدل مستمع دائم)
async function loadSettingCached(path, ttlMs, cb) {
  const key = 'store_setting_' + path.replace(/\W+/g, '_');
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
  if (cached && cached.v !== undefined) { try { cb(cached.v); } catch (e) { console.warn(e); } }
  if (cached && Date.now() - (cached.t || 0) < ttlMs) return;
  if (!database) return;
  try {
    const snap = await get(ref(database, path));
    const v = snap.exists() ? snap.val() : null;
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch (_) {}
    if (!cached || JSON.stringify(cached.v) !== JSON.stringify(v)) cb(v);
  } catch (e) { console.warn('settings', path, e); }
}

// ===== Wallets =====
function loadWalletNumbers() {
  if (!database) return;
  try {
    loadSettingCached('settings/wallets', 10 * 60 * 1000, v => {
      if (v) { Object.assign(walletNumbers, v); const u = document.getElementById('dnNumbers'); if (u) { delete u.dataset.ready; } }
      updateWalletInfoBox();
    });
  } catch (e) {}
}

function setupPaymentMethods() {
  const g = document.getElementById('paymentMethodsGrid');
  if (!g) return;
  g.querySelectorAll('.payment-method-option').forEach(o => {
    o.addEventListener('click', function() {
      g.querySelectorAll('.payment-method-option').forEach(x => x.classList.remove('selected'));
      this.classList.add('selected');
      selectedPaymentMethod = this.getAttribute('data-payment');
      updateWalletInfoBox();
      updateTotalSummary();
    });
  });
  document.getElementById('copyWalletBtn')?.addEventListener('click', () => {
    const n = document.getElementById('walletNumber')?.textContent;
    if (n && n !== '****') {
      navigator.clipboard.writeText(n)
        .then(() => NotificationSystem.success('تم نسخ الرقم'))
        .catch(() => NotificationSystem.info('انسخ يدوياً'));
    }
  });
  updateWalletInfoBox();
  updateTotalSummary();
}

function updateWalletInfoBox() {
  const wb = document.getElementById('walletInfoBox');
  const wl = document.getElementById('walletLabel');
  const wn = document.getElementById('walletNumber');
  if (!wb || !wl || !wn) return;
  const paymentConfig = {
    cod: { show: false },
    vodafone: { show: true, label: '📱 رقم فودافون كاش', number: walletNumbers.vodafone },
    etisalat: { show: true, label: '📱 رقم اتصالات كاش', number: walletNumbers.etisalat },
    orange: { show: true, label: '📱 رقم أورنج كاش', number: walletNumbers.orange },
    we: { show: true, label: '🏦 رقم وي باي', number: walletNumbers.we },
    instapay: { show: true, label: '⚡ رقم إنستا باي', number: walletNumbers.instapay },
    bank: { show: true, label: '🏦 رقم الحساب البنكي', number: walletNumbers.bank },
    visa: { show: true, label: '💳 رقم الفيزا', number: walletNumbers.visa }
  };
  const config = paymentConfig[selectedPaymentMethod] || paymentConfig['cod'];
  if (config.show) {
    wb.classList.add('show');
    wl.textContent = config.label;
    wn.textContent = config.number || '****';
  } else {
    wb.classList.remove('show');
  }
}

function resetPaymentSelection() {
  selectedPaymentMethod = 'cod';
  const g = document.getElementById('paymentMethodsGrid');
  if (g) {
    g.querySelectorAll('.payment-method-option').forEach(o => o.classList.remove('selected'));
    const c = g.querySelector('[data-payment="cod"]');
    if (c) c.classList.add('selected');
  }
  updateWalletInfoBox();
  updateTotalSummary();
}

// ===== Side Menu =====
function toggleSideMenu(open) {
  const menu = document.getElementById('sideMenu');
  const overlay = document.getElementById('sideMenuOverlay');
  if (open === undefined) {
    const isOpen = menu.classList.contains('open');
    open = !isOpen;
  }
  if (open) {
    menu.classList.add('open');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  } else {
    menu.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }
}

document.getElementById('hamburgerBtn')?.addEventListener('click', () => toggleSideMenu(true));
document.getElementById('closeMenu')?.addEventListener('click', () => toggleSideMenu(false));
document.getElementById('sideMenuOverlay')?.addEventListener('click', () => toggleSideMenu(false));

// ===== Navigation + Mobile/Tablet Back Button =====
const STORE_HISTORY_KEY = 'smartstore-pro-history-v2';
let suppressStoreHistory = false;

// حالة واحدة فقط تحفظ موضع متجر الصفحة الرئيسية وما يجب استعادته عند الرجوع.
// لا تنشئ هذه الحالة تاريخًا جديدًا ولا تغير بنية بيانات المتجر.
let storeHomeRestore = {
  scrollY: 0,
  productId: null,
  searchQuery: '',
  hasAnchor: false,
  visibleLimit: null
};

function getActiveStorePage() {
  const active = document.querySelector('.page.active-page');
  return active ? active.id.replace(/Page$/, '') : 'home';
}

function captureHomeRestoreState() {
  try {
    const home = document.getElementById('homePage');
    if (!home?.classList.contains('active-page')) return;

    // احفظ آخر موضع فعلي للعميل، وليس منتجًا قديمًا تم تمييزه من بحث سابق.
    // موضع التمرير هو المرجع الأساسي عند الرجوع من السلة/المفضلة/المرتجعات.
    storeHomeRestore.scrollY = Math.max(0, window.scrollY || 0);
    storeHomeRestore.visibleLimit = homeVisibleLimit;
    storeHomeRestore.searchQuery = String(currentSearchQuery || '');
    storeHomeRestore.productId = null;
    storeHomeRestore.hasAnchor = false;

    // ثبّت آخر موضع داخل حالة Home نفسها، حتى لا يعتمد الرجوع على
    // قيمة تمرير قديمة أو على استعادة المتصفح التلقائية.
    const currentState = history.state;
    if (currentState?.[STORE_HISTORY_KEY] === true && currentState.page === 'home') {
      history.replaceState({
        ...currentState,
        scrollY: storeHomeRestore.scrollY
      }, '', location.href);
    }
  } catch (e) {}
}

function setHomeProductRestoreAnchor(productId, scrollY) {
  const id = productId == null ? null : String(productId);
  storeHomeRestore.productId = id;
  storeHomeRestore.scrollY = Math.max(0, Number(scrollY) || window.scrollY || 0);
  storeHomeRestore.searchQuery = String(currentSearchQuery || '');
  storeHomeRestore.hasAnchor = !!id;
}

function restoreHomeView(fromHistory = false) {
  const home = document.getElementById('homePage');
  if (!home) return;

  const restoreY = Math.max(0, Number(storeHomeRestore.scrollY) || 0);
  const restoreProductId = storeHomeRestore.productId;
  const restoreSearch = storeHomeRestore.searchQuery;
  const restoreLimit = Number(storeHomeRestore.visibleLimit) || 0;

  // عند الرجوع إلى الصفحة الرئيسية من صفحة البحث/القسم، نبدأ Home بحالتها الطبيعية:
  // عرض جميع المنتجات بدون بقاء القسم أو السعر أو ترتيب البحث السابق.
  // هذا لا يغيّر بيانات المنتجات ولا أي وظيفة أخرى؛ فقط يصفر حالة الفلاتر أثناء الرجوع.
  currentSearchQuery = '';
  isSearchResultsMode = false;
  currentCategory = 'all';
  currentPriceMin = null;
  currentPriceMax = null;
  currentSort = 'newest';
  targetProductId = null;
  targetProductIds = [];
  isTargetingProduct = false;
  syncCategoryControls('all');
  const homeSort = document.getElementById('sortSelect');
  if (homeSort) homeSort.value = 'newest';
  const homePriceMin = document.getElementById('priceMin');
  const homePriceMax = document.getElementById('priceMax');
  if (homePriceMin) homePriceMin.value = '';
  if (homePriceMax) homePriceMax.value = '';
  const inp = document.getElementById('searchInput');
  const clr = document.getElementById('searchClear');
  if (inp) inp.value = '';
  clr?.classList.remove('visible');
  updateSearchResultsMode(false);
  renderSearchSuggestions('');
  renderSearchSuggestions('', 'searchPageSuggestions');

  if (restoreLimit > 0) homeVisibleLimit = restoreLimit;
  renderHomeProducts();
  renderRecentlyViewed();
  // ارجع لموضع التمرير فورًا قبل أول رسم للشاشة بدون انتظار
  if (!restoreProductId) window.scrollTo(0, restoreY);

  let userMoved = false;
  const stopRetry = () => { userMoved = true; };
  window.addEventListener('touchstart', stopRetry, { once: true, passive: true });
  window.addEventListener('wheel', stopRetry, { once: true, passive: true });
  setTimeout(() => {
    if (!userMoved && !restoreProductId && Math.abs((window.scrollY || 0) - restoreY) > 8) {
      window.scrollTo({ top: restoreY, behavior: 'auto' });
    }
  }, 450);

  // انتظر اكتمال إعادة رسم Home قبل إعادة موضع التمرير،
  // حتى لا يعيد المتصفح الموضع إلى الأعلى بعد استعادته مباشرة.
  setTimeout(() => {
    const target = restoreProductId
      ? document.getElementById(`product-${restoreProductId}`)
      : null;

    if (target) {
      const headerOffset = Math.max(
        72,
        document.querySelector('header')?.getBoundingClientRect().height || 0
      ) + 12;
      const targetTop =
        window.scrollY + target.getBoundingClientRect().top - headerOffset;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'auto' });
      storeHomeRestore.scrollY = Math.max(0, targetTop);
      targetProductId = restoreProductId;
      targetProductIds = [restoreProductId];
    } else {
      window.scrollTo({ top: restoreY, behavior: 'auto' });
    }

    // لا نمسح مرجع المنتج هنا؛ فهو مقصود أن يظل صالحًا عند التنقل
    // بين المفضلة/السلة/المرتجعات ثم العودة للمتجر.
    isTargetingProduct = false;
  }, 80);
}

function ensureStoreHistory() {
  try {
    const state = history.state;
    if (!state || state[STORE_HISTORY_KEY] !== true) {
      history.replaceState({
        [STORE_HISTORY_KEY]: true,
        page: getActiveStorePage(),
        scrollY: window.scrollY || 0,
        base: true
      }, '', location.href);
    }
  } catch (e) {}
}

function pushStorePageHistory(page) {
  try {
    const current = history.state || {};

    // أول انتقال من Home إلى أي صفحة داخلية:
    // نضع ثلاث خطوات واضحة في سجل المتصفح:
    // 1) Home من أعلى الصفحة
    // 2) Home عند آخر موضع كان فيه العميل
    // 3) الصفحة الداخلية الحالية
    // وبذلك يكون الرجوع: الموضع المحفوظ ← أعلى Home ← خارج الموقع.
    if (
      page !== 'home' &&
      current[STORE_HISTORY_KEY] === true &&
      current.page === 'home' &&
      current.base === true
    ) {
      const homeScrollY = Math.max(0, window.scrollY || 0);

      history.replaceState({
        ...current,
        [STORE_HISTORY_KEY]: true,
        page: 'home',
        scrollY: 0,
        base: true,
        layer: null,
        homeTopEntry: true
      }, '', location.href);

      history.pushState({
        [STORE_HISTORY_KEY]: true,
        page: 'home',
        scrollY: homeScrollY,
        visibleLimit: homeVisibleLimit,
        base: false,
        layer: null,
        homeRestoredEntry: true
      }, '', location.href);

      history.pushState({
        [STORE_HISTORY_KEY]: true,
        page,
        scrollY: 0,
        base: false,
        layer: null
      }, '', location.href);
      return;
    }

    // فتح صفحة داخلية مرة أخرى من Home بعد الرجوع: احتفظ بخطوة «آخر مكان» وحدّث موضعها، ثم أضف خطوة جديدة.
    if (
      page !== 'home' &&
      current[STORE_HISTORY_KEY] === true &&
      current.page === 'home' &&
      current.base === false &&
      !current.layer
    ) {
      history.replaceState({
        ...current,
        scrollY: Math.max(0, window.scrollY || 0),
        visibleLimit: homeVisibleLimit
      }, '', location.href);
      history.pushState({
        [STORE_HISTORY_KEY]: true,
        page,
        scrollY: 0,
        base: false,
        layer: null
      }, '', location.href);
      return;
    }

    // إذا كنا بالفعل داخل صفحات المتجر، غيّر الصفحة داخل نفس الخطوة.
    if (current[STORE_HISTORY_KEY] === true && current.base === false && !current.layer) {
      history.replaceState({
        ...current,
        [STORE_HISTORY_KEY]: true,
        page,
        scrollY: 0,
        base: false,
        layer: null
      }, '', location.href);
      return;
    }

    history.pushState({
      ...current,
      [STORE_HISTORY_KEY]: true,
      page,
      scrollY: 0,
      base: false,
      layer: null
    }, '', location.href);
  } catch (e) {}
}

function pushStoreLayerHistory(layer) {
  try {
    const current = history.state || {};
    history.pushState({
      ...current,
      [STORE_HISTORY_KEY]: true,
      page: getActiveStorePage(),
      layer,
      scrollY: window.scrollY || 0
    }, '', location.href);
  } catch (e) {}
}

function closeStoreLayerFromButton(layer, closeFn) {
  const state = history.state;
  if (state && state[STORE_HISTORY_KEY] === true && state.layer === layer) {
    try {
      history.back();
      return;
    } catch (e) {}
  }
  closeFn();
}

function closeDynamicBackLayers() {
  const orderSheet = document.querySelector('.od-ov');
  if (orderSheet) {
    if (typeof orderSheet.__close === 'function') orderSheet.__close(); else orderSheet.remove();
    return true;
  }

  const dynamicReturn = document.querySelector('.return-success-overlay');
  if (dynamicReturn) {
    dynamicReturn.remove();
    return true;
  }

  const refund = document.getElementById('refundSuccessModal');
  if (refund?.classList.contains('show')) {
    refund.classList.remove('show');
    return true;
  }

  return false;
}

window.__mkLayers = [];
window.__mkBack = function () {
  if (window.__mkSkip) { window.__mkSkip = false; return true; }
  const l = window.__mkLayers.pop();
  if (l) { try { l.pop(); } catch (e) {} return true; }
  return false;
};
function handleStoreBackNavigation(event) {
  if (window.__mkBack()) return;
  // طبقة واحدة في كل مرة: المعاينة/الدفع/المقارنة/الماسح/المرتجع
  // تُغلق أولًا، ولا نسمح للرجوع بتغيير الصفحة أسفلها.
  if ($('#productDetailModal')?.classList.contains('show')) {
    closeProductDetail(true);
    return;
  }
  if ($('#checkoutModalOverlay')?.classList.contains('show')) {
    if (window.__ckBack && window.__ckBack()) { pushStoreLayerHistory('checkout'); return; }
    closeCheckoutModal(true);
    return;
  }
  if ($('#compareModal')?.classList.contains('show')) {
    closeCompare(true);
    return;
  }
  if ($('#storeBarcodeReaderModal')?.classList.contains('show')) {
    closeStoreBarcodeReader(true);
    return;
  }
  if (closeDynamicBackLayers()) return;

  const state = event.state;

  if (state && state[STORE_HISTORY_KEY] === true && state.page) {
    suppressStoreHistory = true;

    if (state.page === 'home') {
      if (state.homeRestoredEntry) {
        // أول رجوع: العودة لنفس موضع Home الذي كان محفوظًا قبل فتح الصفحة الداخلية.
        storeHomeRestore.scrollY = Math.max(0, Number(state.scrollY) || 0);
        storeHomeRestore.visibleLimit = Number(state.visibleLimit) || storeHomeRestore.visibleLimit;
        storeHomeRestore.productId = null;
        storeHomeRestore.hasAnchor = false;
        switchPage('home', { fromHistory: true, restoreHome: true });
      } else if (state.homeTopEntry) {
        // ثاني رجوع: هذه هي خطوة بداية Home، وبعدها الرجوع التالي يخرج من الموقع.
        storeHomeRestore.scrollY = 0;
        storeHomeRestore.visibleLimit = null;
        storeHomeRestore.productId = null;
        storeHomeRestore.hasAnchor = false;
        switchPage('home', { fromHistory: true, restoreHome: true });
      } else {
        switchPage('home', { fromHistory: true, restoreHome: true });
      }
    } else {
      switchPage(state.page, { fromHistory: true });
    }

    setTimeout(() => { suppressStoreHistory = false; }, 0);
    return;
  }

  // حالة غير تابعة لسجل المتجر: اترك المتصفح يكمل الرجوع الطبيعي للخارج.
  // لا نعيد فتح Home هنا حتى لا يتحول الرجوع الثالث إلى رجوع وهمي داخل الموقع.
}

window.addEventListener('popstate', handleStoreBackNavigation);
try {
  // التمرير تتم إدارته هنا يدويًا حتى لا يتعارض ترميم المتصفح التلقائي
  // مع restoreHomeView ويسبب حركة للأعلى ثم رجوعًا للمكان السابق.
  history.scrollRestoration = 'manual';
} catch (e) {}
ensureStoreHistory();

function switchPage(p, options = {}) {
  closeSearchSuggestions(true);
  const currentPage = document.querySelector('.page.active-page');

  // الضغط على زر الصفحة المفتوحة من البار لا ينشئ خطوة جديدة،
  // لكنه يعيد العميل إلى بداية الصفحة كما هو متوقع في تطبيقات المتاجر.
  if (currentPage && currentPage.id === `${p}Page`) {
    toggleSideMenu(false);
    if (p === 'home' && options.fromHistory && options.restoreHome) {
      restoreHomeView(true);
    } else if (!options.fromHistory) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    return;
  }

  // قبل مغادرة المتجر الرئيسي احفظ موضعه ومرجع المنتج المستهدف.
  if (currentPage?.id === 'homePage' && p !== 'home' && !options.fromHistory) {
    captureHomeRestoreState();
  }

  if (!options.fromHistory && !suppressStoreHistory) {
    pushStorePageHistory(p);
  }

  if (p !== 'home' && !options.fromHistory) window.scrollTo(0, 0);

  $$('.page').forEach(x => x.classList.remove('active-page'));
  $$('.nav-item').forEach(x => x.classList.remove('active'));
  $$('.menu-item').forEach(x => x.classList.remove('active'));

  if (p === 'home') {
    $('#homePage')?.classList.add('active-page');
    document.querySelector('.nav-item[data-page="home"]')?.classList.add('active');
    document.querySelector('.menu-item[data-page="home"]')?.classList.add('active');

    // زر المتجر في البار السفلي = بداية الصفحة دائمًا.
    // زر رجوع الهاتف = استعادة آخر موضع محفوظ للصفحة الرئيسية.
    if (options.fromHistory && options.restoreHome) {
      restoreHomeView(true);
    } else if (!options.fromHistory) {
      currentSearchQuery = '';
      isSearchResultsMode = false;
      targetProductId = null;
      targetProductIds = [];
      isTargetingProduct = false;
      renderSearchSuggestions('');
      renderSearchSuggestions('', 'searchPageSuggestions');
      updateSearchResultsMode(false);
      renderHomeProducts();
      renderRecentlyViewed();
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      restoreHomeView(true);
    }
  } else if (p === 'search') {
    $('#searchPage')?.classList.add('active-page');
    populateSearchPageControls();
    renderSearchPage();
  } else if (p === 'wishlist') {
    $('#wishlistPage')?.classList.add('active-page');
    document.querySelector('.nav-item[data-page="wishlist"]')?.classList.add('active');
    document.querySelector('.menu-item[data-page="wishlist"]')?.classList.add('active');
    renderWishlistPage();
  } else if (p === 'cart') {
    $('#cartPage')?.classList.add('active-page');
    document.querySelector('.nav-item[data-page="cart"]')?.classList.add('active');
    document.querySelector('.menu-item[data-page="cart"]')?.classList.add('active');
    renderCartPage();
    refreshOrdersStatus().then(() => {
      if ($('#cartPage')?.classList.contains('active-page')) renderCartPage();
    }).catch(() => {});
  } else if (p === 'returns') {
    $('#returnsPage')?.classList.add('active-page');
    document.querySelector('.nav-item[data-page="returns"]')?.classList.add('active');
    document.querySelector('.menu-item[data-page="returns"]')?.classList.add('active');
    renderReturnsPage();
    refreshOrdersStatus().then(() => {
      if ($('#returnsPage')?.classList.contains('active-page')) renderReturnsPage();
    }).catch(() => {});
  } else if (p === 'deals') {
    $('#dealsPage')?.classList.add('active-page');
    document.querySelector('.nav-item[data-page="deals"]')?.classList.add('active');
    document.querySelector('.menu-item[data-page="deals"]')?.classList.add('active');
    renderDealsPage();
  } else if (p === 'about') {
    $('#aboutPage')?.classList.add('active-page');
    document.querySelector('.nav-item[data-page="about"]')?.classList.add('active');
    document.querySelector('.menu-item[data-page="about"]')?.classList.add('active');
    renderAboutPage();
  } else if (p === 'contact') {
    $('#contactPage')?.classList.add('active-page');
    document.querySelector('.nav-item[data-page="contact"]')?.classList.add('active');
    document.querySelector('.menu-item[data-page="contact"]')?.classList.add('active');
    renderContactPage();
  }

  toggleSideMenu(false);

  // الصفحات الفرعية تبدأ من أعلى الصفحة فقط.
  // الصفحة الرئيسية لها منطق استعادة مستقل أعلاه.
  if (p !== 'home' && !options.fromHistory) {
    window.scrollTo(0, 0);
  }
}

// ربط موحد للأزرار: يعمل حتى لو أعاد المتجر رسم/تحديث عناصر البار.
// لا ننشئ نسخة ثانية من نظام التنقل ولا نكرر مستمعات الأحداث.
document.addEventListener('click', (event) => {
  const button = event.target?.closest?.('.nav-item[data-page], .menu-item[data-page]');
  if (!button) return;

  const page = button.getAttribute('data-page');
  if (!page) return;

  event.preventDefault();
  switchPage(page);
});
$('#cartWidgetTop')?.addEventListener('click', () => switchPage('cart'));
$('#wishlistBtn')?.addEventListener('click', () => switchPage('wishlist'));
$('#logoArea')?.addEventListener('click', () => switchPage('home'));

// ============================================================
// ===== Returns System (COMPLETELY REWRITTEN - FIXED) =====
// ============================================================

let returnsPageState = {
  currentFilter: 'eligible',
  eligible: [],
  pending: [],
  approved: [],
  completed: [],
  allRequests: [],
  allOrders: []
};

function getSavedPhone() {
  try {
    const p = JSON.parse(localStorage.getItem('professional_checkout_profile_v1') || '{}');
    return String(p.phone || localStorage.getItem('professional_checkout_phone') || '').trim();
  } catch (e) {
    return String(localStorage.getItem('professional_checkout_phone') || '').trim();
  }
}

const RETURN_REQUEST_CACHE_KEY = 'professional_return_requests_cache_v2';

function getCachedCustomerReturnRequests() {
  try {
    const cached = JSON.parse(localStorage.getItem(RETURN_REQUEST_CACHE_KEY) || 'null');
    return Array.isArray(cached?.requests) ? cached.requests : [];
  } catch (_) {
    return [];
  }
}

function cacheCustomerReturnRequests(requests) {
  try {
    localStorage.setItem(RETURN_REQUEST_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      requests: Array.isArray(requests) ? requests : []
    }));
  } catch (_) {}
}

async function loadCustomerReturnRequests(options = {}) {
  const fresh = options.fresh === true;
  const cached = getCachedCustomerReturnRequests();

  // الاستخدام العادي في الواجهة يعرض الكاش فوراً.
  if (!fresh) return cached;
  if (!database) return cached;

  const phone = getSavedPhone();
  if (!phone) return cached;

  try {
    const phoneHash = await hashFirstOrderPhone(phone);
    if (!phoneHash) return cached;

    // الفهرس والجذر يُقرآن بالتوازي بدلاً من الانتظار المتسلسل.
    const [indexSnap, rootSnap] = await Promise.all([
      get(ref(database, `returnRequestIndex/${phoneHash}`)),
      get(ref(database, 'returnRequests')).catch(() => null)
    ]);

    if (!indexSnap?.exists()) {
      cacheCustomerReturnRequests([]);
      return [];
    }

    const data = indexSnap.val() || {};
    const rootData = rootSnap?.exists() ? (rootSnap.val() || {}) : {};
    const requests = [];

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        requests.push({
          id: key,
          ...(data[key] || {}),
          ...(rootData[key] || {}),
          phoneHash
        });
      }
    }

    requests.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
    cacheCustomerReturnRequests(requests);
    return requests;
  } catch (e) {
    console.warn('Return request index failed:', e);
    return cached;
  }
}

function getAlreadyReturnedQuantities(orderId, requests) {
  const map = {};
  const order = (myOrders || []).find(o => String(o.orderId) === String(orderId));

  // سجل دائم على الطلب نفسه: لا يتأثر بحذف سجل المرتجع من لوحة الإدارة.
  const ledger = order?.returnedQuantities || {};
  Object.keys(ledger || {}).forEach(k => {
    const q = Number(ledger[k] || 0);
    if (q > 0) map[String(k)] = q;
  });

  // الطلبات pending تُضاف فوق السجل الدائم لأنها لم تُرحّل للدفتر الدائم بعد.
  // approved/completed لا تُجمع مرة أخرى إذا كان لها سجل دائم، حتى لا تتضاعف الكمية.
  (requests || []).forEach(r => {
    if (String(r.orderId) !== String(orderId)) return;
    const status = String(r.status || '').toLowerCase();
    if (status !== 'pending' && status !== 'approved' && status !== 'completed') return;
    (r.items || []).forEach(i => {
      const k = String(i.productId || '');
      if (!k) return;
      const q = Number(i.quantity || 0);
      if (status === 'pending') {
        map[k] = (map[k] || 0) + q;
      } else if (!(k in ledger)) {
        // توافق مع السجلات القديمة التي لم يكن فيها returnedQuantities على الطلب.
        map[k] = (map[k] || 0) + q;
      }
    });
  });
  return map;
}

function isOrderFullyReturned(order, requests) {
  if (!order) return false;
  const returned = getAlreadyReturnedQuantities(order.orderId, requests);
  return (order.items || []).every(item => {
    const original = Number(item.quantity || 0);
    const done = Number(returned[String(item.productId || '')] || 0);
    return original > 0 ? done >= original : true;
  });
}

function hasActiveReturnRequest(orderId, requests) {
  return (requests || []).some(r => 
    String(r.orderId) === String(orderId) && 
    ['pending', 'approved'].includes(String(r.status || '').toLowerCase())
  );
}

async function submitReturnRequest(order, selections, reason, details) {
  if (!database) throw new Error('قاعدة البيانات غير متاحة');
  
  const phone = String(order.phone || getSavedPhone()).trim();
  if (!phone) throw new Error('رقم الهاتف غير متوفر');
  
  const phoneHash = await hashFirstOrderPhone(phone);
  if (!phoneHash) throw new Error('تعذر التحقق من العميل');
  
  const deliveredAt = Number(order.deliveredAt || 0);
  if (!deliveredAt) throw new Error('الطلب لم يتم تسليمه بعد');
  
  if (Date.now() - deliveredAt > 24 * 60 * 60 * 1000) {
    throw new Error('انتهت مدة الاسترجاع (24 ساعة من التسليم)');
  }
  
  const requests = await loadCustomerReturnRequests({fresh:true});
  
  if (hasActiveReturnRequest(order.orderId, requests)) {
    throw new Error('يوجد طلب استرجاع قيد المراجعة لهذه الفاتورة');
  }
  
  const alreadyReturned = getAlreadyReturnedQuantities(order.orderId, requests);
  
  const items = [];
  for (const sel of selections) {
    const item = order.items?.[sel.index];
    if (!item) throw new Error('منتج غير صالح');
    
    const original = Number(item.quantity || 0);
    const already = alreadyReturned[String(item.productId || '')] || 0;
    const maxAllowed = Math.max(0, original - already);
    const qty = Math.floor(Number(sel.quantity || 0));
    
    if (qty < 1) {
      throw new Error(`الكمية المطلوبة من "${item.name || 'المنتج'}" يجب أن تكون 1 على الأقل`);
    }
    if (qty > maxAllowed) {
      throw new Error(`الكمية المطلوبة من "${item.name || 'المنتج'}" لا يمكن أن تتجاوز ${maxAllowed}`);
    }
    
    items.push({
      productId: item.productId || '',
      name: item.name || '',
      quantity: qty,
      price: Number(item.price ?? item.finalPrice ?? item.unitPrice ?? 0)
    });
  }
  
  if (!items.length) throw new Error('اختر منتجاً واحداً على الأقل');
  
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const requestRef = push(ref(database, 'returnRequests'));
  
  const requestData = {
    orderId: order.orderId,
    invoiceCode: String(order.invoiceCode || order.invoiceNumber || order.orderId || '').slice(-8),
    customerName: order.recipientName || '',
    phone,
    phoneHash,
    items,
    total,
    deliveryRefund: 0,
    refundTotal: total,
    reason: reason + (details ? ` - ${details}` : ''),
    deliveredAt,
    status: 'pending',
    requestedAt: Date.now()
  };
  
  const updates = {};
  updates[`returnRequests/${requestRef.key}`] = requestData;
  updates[`returnRequestIndex/${phoneHash}/${requestRef.key}`] = {
    orderId: requestData.orderId,
    invoiceCode: requestData.invoiceCode,
    status: 'pending',
    total,
    refundTotal: requestData.refundTotal,
    items: requestData.items,
    requestedAt: requestData.requestedAt
  };
  
  await update(ref(database), updates);
  console.log('✅ تم إرسال طلب الاسترجاع بنجاح:', requestRef.key);
  return requestRef.key;
}

function showReturnSuccessOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'return-success-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(26,15,7,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);';
  overlay.innerHTML = `
    <div class="return-success-card" style="background:white;border-radius:24px;padding:32px 24px;max-width:420px;width:100%;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,0.3);">
      <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:40px;color:white;box-shadow:0 8px 24px rgba(16,185,129,0.4);">
        <i class="fa-solid fa-check"></i>
      </div>
      <h3 style="color:var(--primary-dark);font-size:22px;font-weight:900;margin-bottom:12px;">
        تم استلام المرتجع بنجاح!
      </h3>
      <p style="color:var(--gray-600);font-size:14px;line-height:1.9;margin-bottom:20px;">
        ستظل مهلة الاسترجاع مرتبطة بوقت تسليم الطلب الأصلي ولمدة <strong style="color:var(--accent-dark);">24 ساعة</strong>.<br>
        ستصلك رسالة عند الموافقة على الاسترجاع.
      </p>
      <button onclick="this.closest('.return-success-overlay').remove();" 
        style="padding:12px 32px;border-radius:99px;background:linear-gradient(135deg,var(--primary),var(--primary-medium));color:white;border:none;font-family:'Cairo',sans-serif;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 4px 14px rgba(74,44,23,0.25);">
        حسناً، شكراً
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => { 
    if (overlay.parentElement) overlay.remove(); 
  }, 5000);
}

function showRefundSuccessModal(amount) {
  const modal = document.getElementById('refundSuccessModal');
  const amountEl = document.getElementById('refundModalAmount');
  if (modal) {
    if (amountEl && amount) amountEl.textContent = `${Number(amount).toFixed(2)} ج`;
    modal.classList.add('show');
  }
}

document.getElementById('refundModalClose')?.addEventListener('click', () => {
  document.getElementById('refundSuccessModal')?.classList.remove('show');
});

document.getElementById('refundSuccessModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'refundSuccessModal') {
    e.target.classList.remove('show');
  }
});

// ============================================================
// ===== ✅ حذف مرتجع مكتمل واحد (جديد) =====
// ============================================================
async function deleteCompletedReturn(returnId, phoneHash) {
  try {
    if (!database || !returnId) return false;
    
    const updates = {};
    updates[`returnRequests/${returnId}`] = null;
    if (phoneHash) {
      updates[`returnRequestIndex/${phoneHash}/${returnId}`] = null;
    }
    
    await update(ref(database), updates);
    console.log(`🗑️ تم حذف المرتجع المكتمل ${returnId}`);
    return true;
  } catch (error) {
    console.error('فشل حذف المرتجع المكتمل:', error);
    return false;
  }
}

// حذف طلب مرتجع مرفوض فقط من سجل العميل وقاعدة البيانات.
// لا يغيّر الكميات المسترجعة ولا حالة الطلب الأصلي.
async function deleteRejectedReturn(returnId, phoneHash) {
  try {
    if (!database || !returnId) return false;
    const updates = {};
    updates[`returnRequests/${returnId}`] = null;
    if (phoneHash) updates[`returnRequestIndex/${phoneHash}/${returnId}`] = null;
    await update(ref(database), updates);
    console.log(`🗑️ تم حذف المرتجع المرفوض ${returnId}`);
    return true;
  } catch (error) {
    console.error('فشل حذف المرتجع المرفوض:', error);
    return false;
  }
}

// عداد مستقل للمرتجعات المرفوضة: تختفي من صفحة العميل بعد 10 دقائق فقط.
const RejectedReturnsTimerManager = {
  timers: new Map(),
  intervals: new Map(),
  clear(id) {
    const t = this.timers.get(id); if (t) clearTimeout(t);
    const i = this.intervals.get(id); if (i) clearInterval(i);
    this.timers.delete(id); this.intervals.delete(id);
  },
  clearAll() { [...this.timers.keys()].forEach(id => this.clear(id)); [...this.intervals.keys()].forEach(id => this.clear(id)); },
  start(id, rejectedAt, onExpire) {
    this.clear(id);
    const remaining = Math.max(0, 10 * 60 * 1000 - (Date.now() - Number(rejectedAt || Date.now())));
    if (remaining <= 0) { onExpire?.(id); return; }
    this.timers.set(id, setTimeout(() => { this.clear(id); onExpire?.(id); }, remaining));
  },
  countdown(id, rejectedAt, cb) {
    const tick = () => {
      const rem = Math.max(0, 10 * 60 * 1000 - (Date.now() - Number(rejectedAt || Date.now())));
      const sec = Math.ceil(rem / 1000);
      cb?.(`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`);
    };
    this.clearIntervalOnly(id);
    tick();
    this.intervals.set(id, setInterval(tick, 1000));
  },
  clearIntervalOnly(id) {
    const i = this.intervals.get(id); if (i) clearInterval(i);
    this.intervals.delete(id);
  }
};

function setupRejectedReturnsTimers(requests) {
  RejectedReturnsTimerManager.clearAll();
  (requests || []).forEach(req => {
    const rejectedAt = Number(req.rejectedAt || req.requestedAt || Date.now());
    RejectedReturnsTimerManager.start(req.id, rejectedAt, () => {
      if (document.querySelector('#returnsPage')?.classList.contains('active-page')) renderReturnsPage();
    });
    const el = document.querySelector(`[data-rejected-countdown="${req.id}"]`);
    if (el) RejectedReturnsTimerManager.countdown(req.id, rejectedAt, v => { if (el.isConnected) el.textContent = v; });
  });
}

// ============================================================
// ===== ✅ تفعيل العدادات والحذف التلقائي (جديد) =====
// ============================================================
function setupCompletedReturnsTimers(requests) {
  // إيقاف أي عدادات قديمة
  CompletedReturnsTimerManager.clearAll();
  
  if (!requests || !requests.length) return;
  
  requests.forEach(req => {
    const completedAt = Number(req.completedAt || req.approvedAt || req.requestedAt || Date.now());
    const phoneHash = req.phoneHash || getSavedPhone();
    
    // 1. بدء عداد الحذف التلقائي بعد 24 ساعة
    CompletedReturnsTimerManager.startAutoDelete(req.id, completedAt, async (returnId) => {
      console.log(`🗑️ حذف تلقائي للمرتجع ${returnId} بعد انتهاء 24 ساعة`);
      
      const phone = getSavedPhone();
      const hash = await hashFirstOrderPhone(phone);
      
      const success = await deleteCompletedReturn(returnId, hash);
      
      if (success) {
        NotificationSystem.info('🗑️ تم حذف مرتجع مكتمل تلقائياً بعد 24 ساعة');
        
        // إعادة تحميل الصفحة إذا كانت مفتوحة
        if (document.querySelector('#returnsPage')?.classList.contains('active-page')) {
          renderReturnsPage();
        }
      }
    });
    
    // 2. بدء عداد العرض التنازلي
    const digitsEl = document.querySelector(`[data-countdown-digits="${req.id}"]`);
    if (digitsEl) {
      CompletedReturnsTimerManager.startCountdown(req.id, completedAt, (formatted) => {
        if (digitsEl && digitsEl.parentNode) {
          digitsEl.textContent = formatted;
        }
      });
    }
  });
  
  console.log(`⏰ تم تفعيل ${requests.length} عداد حذف تلقائي`);
}

// ============================================================
// ===== ✅ Setup Completed Returns Events (زر الحذف) =====
// ============================================================
function setupCompletedReturnsEvents(container) {
  const clearBtn = container.querySelector('#clearCompletedReturnsBtn');
  if (!clearBtn) return;
  
  clearBtn.addEventListener('click', async () => {
    const requests = returnsPageState.completed || [];
    if (!requests.length) {
      NotificationSystem.info('لا توجد طلبات لمسحها');
      return;
    }
    
    if (!await window.proConfirm(`هل تريد مسح ${requests.length} طلب مرتجع مكتمل؟\n\n⚠️ سيتم حذفها نهائياً.`)) {
      return;
    }
    
    const originalHTML = clearBtn.innerHTML;
    clearBtn.disabled = true;
    clearBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري المسح...';
    
    try {
      if (!database) {
        NotificationSystem.warning('لا يوجد اتصال بقاعدة البيانات');
        clearBtn.disabled = false;
        clearBtn.innerHTML = originalHTML;
        return;
      }
      
      const phone = getSavedPhone();
      const phoneHash = await hashFirstOrderPhone(phone);
      
      if (!phoneHash) {
        throw new Error('تعذر التحقق من العميل');
      }
      
      // إيقاف العدادات المؤقتة
      CompletedReturnsTimerManager.clearAll();
      
      // تجهيز التحديثات (حذف جماعي)
      const updates = {};
      let deletedCount = 0;
      
      for (const req of requests) {
        if (req.id) {
          updates[`returnRequests/${req.id}`] = null;
          updates[`returnRequestIndex/${phoneHash}/${req.id}`] = null;
          deletedCount++;
        }
      }
      
      if (deletedCount === 0) {
        NotificationSystem.info('لا توجد طلبات صالحة للمسح');
        clearBtn.disabled = false;
        clearBtn.innerHTML = originalHTML;
        return;
      }
      
      await update(ref(database), updates);
      
      console.log(`✅ تم مسح ${deletedCount} مرتجع مكتمل`);
      NotificationSystem.success(`✅ تم مسح ${deletedCount} طلب بنجاح`);
      
      // إعادة تحميل الصفحة
      await renderReturnsPage();
      
    } catch (error) {
      console.error('فشل مسح الطلبات المكتملة:', error);
      NotificationSystem.error('❌ فشل مسح الطلبات. حاول مرة أخرى.');
      
      clearBtn.disabled = false;
      clearBtn.innerHTML = originalHTML;
      
      // إعادة المحاولة بعد 2 ثانية
      setTimeout(() => renderReturnsPage(), 2000);
    }
  });
}

// ============================================================
// ===== Render Returns Page (UPDATED - FIXED) =====
// ============================================================
async function renderReturnsPage(options = {}) {
  const container = document.getElementById('returnsPageContent');
  if (!container) return;
  
  // إيقاف أي عدادات قديمة قبل إعادة العرض
  CompletedReturnsTimerManager.clearAll();
  RejectedReturnsTimerManager.clearAll();
  
  container.innerHTML = `
    <div class="loading-spinner" style="padding:40px;">
      <i class="fa-solid fa-spinner fa-spin"></i> جاري تحميل طلبات الاسترجاع...
    </div>
  `;
  
  const allRequests = await loadCustomerReturnRequests();
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  
  const pendingRequests = allRequests.filter(r => String(r.status || '').toLowerCase() === 'pending');
  const approvedRequests = allRequests.filter(r => String(r.status || '').toLowerCase() === 'approved');
  const completedRequests = allRequests.filter(r => String(r.status || '').toLowerCase() === 'completed');
  const rejectedRequestsAll = allRequests.filter(r => String(r.status || '').toLowerCase() === 'rejected');
  const rejectedRequests = rejectedRequestsAll.filter(r => {
    const rejectedAt = Number(r.rejectedAt || r.requestedAt || 0);
    return !rejectedAt || (now - rejectedAt) < 10 * 60 * 1000;
  });
  
  const eligibleOrders = (myOrders || []).filter(o => {
    // returned = حالة الطلب أصبحت returned بعد إرجاع كل الكمية.
    if (!['delivered'].includes(String(o.status || '').toLowerCase()) || !o.deliveredAt) return false;
    if (now - Number(o.deliveredAt) > windowMs) return false;
    if (hasActiveReturnRequest(o.orderId, allRequests)) return false;
    // لا تمنعنا سجلات completed الجزئية؛ المنع فقط إذا استُنفدت كل الكمية.
    if (isOrderFullyReturned(o, allRequests)) return false;
    return true;
  });
  
  returnsPageState = {
    currentFilter: returnsPageState.currentFilter || 'eligible',
    eligible: eligibleOrders,
    pending: pendingRequests,
    approved: approvedRequests,
    completed: completedRequests,
    rejected: rejectedRequests,
    allRequests,
    allOrders: myOrders
  };
  
  let html = '';
  
  // Summary cards
  html += `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px;">
      <div style="background:linear-gradient(135deg,#FFFBF5,#FFF8ED);border:1px solid rgba(201,169,110,0.3);border-radius:16px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:var(--accent);">${eligibleOrders.length}</div>
        <div style="font-size:12px;font-weight:700;color:var(--gray-600);margin-top:4px;">متاح للاسترجاع</div>
      </div>
      <div style="background:linear-gradient(135deg,#FFF8E1,#FFF3CD);border:1px solid rgba(217,119,6,0.3);border-radius:16px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:var(--warning);">${pendingRequests.length}</div>
        <div style="font-size:12px;font-weight:700;color:var(--gray-600);margin-top:4px;">قيد المراجعة</div>
      </div>
      <div style="background:linear-gradient(135deg,#E8F5E9,#ECFDF5);border:1px solid rgba(5,150,105,0.3);border-radius:16px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:900;color:var(--success);">${approvedRequests.length + completedRequests.length}</div>
        <div style="font-size:12px;font-weight:700;color:var(--gray-600);margin-top:4px;">تم الاعتماد</div>
      </div>
    </div>
  `;
  
  // Tabs
  const tabs = [
    { id: 'eligible', label: 'متاح للاسترجاع', icon: 'fa-box-open', count: eligibleOrders.length },
    { id: 'pending', label: 'قيد المراجعة', icon: 'fa-clock', count: pendingRequests.length },
    { id: 'approved', label: 'تم الاعتماد', icon: 'fa-check-circle', count: approvedRequests.length },
    { id: 'completed', label: 'مكتمل', icon: 'fa-check-double', count: completedRequests.length },
    { id: 'rejected', label: 'مرفوض', icon: 'fa-circle-xmark', count: rejectedRequests.length }
  ];
  
  html += `<div class="returns-tabs">`;
  tabs.forEach(tab => {
    const isActive = returnsPageState.currentFilter === tab.id;
    html += `
      <button class="returns-tab ${isActive ? 'active' : ''}" data-tab="${tab.id}">
        <i class="fa-solid ${tab.icon}"></i>
        <span>${tab.label}</span>
        <span class="count-badge">${tab.count}</span>
      </button>
    `;
  });
  html += `</div>`;
  
  // Content based on filter
  html += `<div id="returnsTabContent">`;
  
  if (returnsPageState.currentFilter === 'eligible') {
    html += renderEligibleOrders(eligibleOrders, allRequests);
  } else if (returnsPageState.currentFilter === 'pending') {
    html += renderPendingRequests(pendingRequests);
  } else if (returnsPageState.currentFilter === 'approved') {
    html += renderApprovedRequests(approvedRequests);
  } else if (returnsPageState.currentFilter === 'completed') {
    html += renderCompletedRequests(completedRequests);
  } else if (returnsPageState.currentFilter === 'rejected') {
    html += renderRejectedRequests(rejectedRequests);
  }
  
  html += `</div>`;
  
  container.innerHTML = html;
  
  // Setup tab listeners
  container.querySelectorAll('.returns-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      returnsPageState.currentFilter = tab.dataset.tab;
      renderReturnsPage();
    });
  });
  
  // Setup events based on active tab
  if (returnsPageState.currentFilter === 'eligible') {
    setupEligibleOrderEvents(container);
  } else if (returnsPageState.currentFilter === 'completed') {
    setupCompletedReturnsTimers(completedRequests);
    setupCompletedReturnsEvents(container);
  } else if (returnsPageState.currentFilter === 'rejected') {
    setupRejectedReturnsTimers(rejectedRequests);
    setupRejectedReturnsEvents(container);
  }

  // عرض فوري من الذاكرة ثم مزامنة Firebase في الخلفية.
  if (options.fresh !== true && database && getSavedPhone()) {
    const cachedSnapshot = JSON.stringify(allRequests);
    loadCustomerReturnRequests({fresh:true}).then(freshRequests => {
      if (!document.querySelector('#returnsPage')?.classList.contains('active-page')) return;
      if (JSON.stringify(freshRequests) !== cachedSnapshot) {
        renderReturnsPage({fresh:true});
      }
    }).catch(() => {});
  }
}

// ===== Render Eligible Orders =====
function renderEligibleOrders(orders, allRequests) {
  if (!orders.length) {
    return `
      <div class="returns-empty-state">
        <div class="empty-icon">📦</div>
        <h3>لا توجد طلبات استرجاع متاحة</h3>
        <p>
          الاسترجاع متاح خلال <strong>24 ساعة</strong> من وقت التسليم فقط.<br>
          بعد موافقة الإدارة على طلبك، سيظهر في تبويب "قيد المراجعة".
        </p>
      </div>
    `;
  }
  
  let html = '';
  
  orders.forEach(order => {
    const invoiceCode = String(order.invoiceCode || order.invoiceNumber || order.orderId || '').slice(-8);
    const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('ar-EG') : '';
    const remainingMs = Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - Number(order.deliveredAt || 0)));
    const remainingHours = Math.ceil(remainingMs / 3600000);
    
    const alreadyReturned = getAlreadyReturnedQuantities(order.orderId, allRequests);
    
    html += `
      <div class="return-request-card" data-order-id="${order.orderId}">
        <div class="return-head">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:44px;height:44px;border-radius:50%;background:rgba(201,169,110,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--accent);">
              <i class="fa-solid fa-receipt"></i>
            </div>
            <div>
              <div style="font-weight:900;color:var(--primary-dark);font-size:15px;">فاتورة #${invoiceCode}</div>
              <div style="font-size:12px;color:var(--gray-500);margin-top:2px;">
                <i class="fa-solid fa-check-circle" style="color:var(--success);"></i>
                تم التسليم: ${deliveredDate}
              </div>
            </div>
          </div>
          <span class="return-countdown">
            <i class="fa-solid fa-clock"></i> ${remainingHours} ساعة متبقية
          </span>
        </div>
        
        <div style="background:var(--gold-light);border:1px solid rgba(201,169,110,0.3);border-radius:12px;padding:12px;margin:14px 0;font-size:12px;color:var(--primary-medium);line-height:1.8;">
          <i class="fa-solid fa-hand-pointer" style="color:var(--accent);"></i>
          <strong> طريقة الاسترجاع:</strong>
          1) اختر المنتجات 2) اكتب الكمية 3) اختر السبب 4) اضغط "طلب الاسترجاع"
        </div>
        
        <div style="margin-bottom:10px;color:var(--gray-600);font-size:13px;font-weight:700;">
          <i class="fa-solid fa-boxes-stacked"></i> اختر المنتجات والكميات:
        </div>
        
        <div style="display:flex;flex-direction:column;gap:10px;">
    `;
    
    (order.items || []).forEach((item, index) => {
      const originalQty = Number(item.quantity || 0);
      const alreadyQty = alreadyReturned[String(item.productId || '')] || 0;
      const availableQty = Math.max(0, originalQty - alreadyQty);
      const isDisabled = availableQty < 1;
      const unitPrice = Number(item.price ?? item.finalPrice ?? item.unitPrice ?? 0);
      
      // ✅ الإصلاح 1: حقل الكمية فارغ مع placeholder "1"
      html += `
        <div class="return-item-row ${isDisabled ? 'disabled' : ''}" data-item-row="${order.orderId}-${index}">
          <input type="checkbox" 
            class="return-item-checkbox" 
            data-order-id="${order.orderId}" 
            data-item-index="${index}"
            data-unit-price="${unitPrice}"
            data-max-qty="${availableQty}"
            ${isDisabled ? 'disabled' : ''}>
          
          <div style="flex:1;min-width:150px;">
            <div style="font-weight:800;color:var(--primary-dark);font-size:13px;margin-bottom:2px;">
              ${escapeStoreHtml(item.name || 'منتج')}
            </div>
            <div style="font-size:11px;color:var(--gray-500);">
              الكمية المتاحة للإرجاع: <strong style="color:var(--accent);">${availableQty}</strong> من <strong>${originalQty}</strong>
            </div>
            ${isDisabled ? `
              <div style="font-size:10px;color:var(--danger);margin-top:2px;">
                <i class="fa-solid fa-info-circle"></i> تم إرجاع كل الكمية المتاحة
              </div>
            ` : ''}
          </div>
          
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:11px;font-weight:700;color:var(--gray-600);">الكمية:</label>
            <input type="number" 
              class="return-qty-input" 
              data-order-id="${order.orderId}" 
              data-item-index="${index}"
              data-max-qty="${availableQty}"
              inputmode="numeric"
              min="1"
              max="${availableQty}"
              step="1"
              placeholder="1"
              ${isDisabled ? 'disabled' : ''}>
          </div>
          
          <div style="font-weight:800;color:var(--primary-medium);font-size:14px;min-width:80px;text-align:left;">
            ${(unitPrice * availableQty).toFixed(2)} ج
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
        
        <div class="return-total-box">
          <span style="font-weight:800;color:var(--primary-dark);font-size:14px;">
            <i class="fa-solid fa-money-bill-wave" style="color:var(--success);"></i> إجمالي الاسترجاع:
          </span>
          <span class="return-total-amount" data-order-id="${order.orderId}" style="font-weight:900;color:var(--success);font-size:20px;">
            0.00 ج
          </span>
        </div>
        
        <div style="margin-top:14px;">
          <label style="display:block;font-weight:800;color:var(--primary-dark);font-size:13px;margin-bottom:8px;">
            <i class="fa-solid fa-clipboard-list" style="color:var(--accent);"></i> سبب الاسترجاع <span style="color:var(--danger);">*</span>
          </label>
          <select class="return-reason-select customer-return-reason" 
            data-order-id="${order.orderId}"
            style="width:100%;padding:12px 14px;border:2px solid rgba(201,169,110,0.25);border-radius:12px;font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;background:var(--white);color:var(--primary-dark);cursor:pointer;">
            <option value="">-- اختر سبب الاسترجاع --</option>
            <option value="المنتج تالف">🔴 المنتج تالف / مكسور</option>
            <option value="المنتج غير مطابق للوصف">⚠️ المنتج غير مطابق للوصف</option>
            <option value="المقاس غير مناسب">📏 المقاس غير مناسب</option>
            <option value="المنتج وصل متأخراً">⏰ المنتج وصل متأخراً</option>
            <option value="تغيير في الرأي">💭 تغيير في الرأي</option>
            <option value="المنتج بجودة رديئة">👎 المنتج بجودة رديئة</option>
            <option value="أخرى">📝 سبب آخر</option>
          </select>
        </div>
        
        <div style="margin-top:12px;">
          <label style="display:block;font-weight:800;color:var(--primary-dark);font-size:13px;margin-bottom:8px;">
            <i class="fa-solid fa-comment-dots" style="color:var(--accent);"></i> تفاصيل إضافية (اختياري)
          </label>
          <textarea class="customer-return-details" 
            data-order-id="${order.orderId}"
            placeholder="اذكر أي تفاصيل قد تساعدنا..."
            style="width:100%;min-height:70px;padding:12px 14px;border:2px solid rgba(201,169,110,0.25);border-radius:12px;font-family:'Cairo',sans-serif;font-size:13px;resize:vertical;"></textarea>
        </div>
        
        <div style="margin-top:14px;padding:12px;background:rgba(239,68,68,0.06);border:1px dashed rgba(239,68,68,0.3);border-radius:12px;font-size:12px;color:var(--danger);text-align:center;line-height:1.7;">
          <i class="fa-solid fa-exclamation-triangle"></i>
          <strong> تنبيه:</strong> لا يمكن استرداد أموال التوصيل. يتم استرداد قيمة المنتجات فقط.
        </div>
        
        <button type="button" 
          class="btn btn-primary customer-return-submit" 
          data-order-id="${order.orderId}"
          style="width:100%;margin-top:16px;padding:14px;font-size:15px;font-weight:900;justify-content:center;">
          <i class="fa-solid fa-paper-plane"></i> تأكيد طلب الاسترجاع
        </button>
      </div>
    `;
  });
  
  return html;
}

// ===== Render Pending Requests =====
function renderPendingRequests(requests) {
  if (!requests.length) {
    return `
      <div class="returns-empty-state">
        <div class="empty-icon">⏳</div>
        <h3>لا توجد طلبات قيد المراجعة</h3>
        <p>عندما ترسل طلب استرجاع، سيظهر هنا حتى تتم مراجعته.</p>
      </div>
    `;
  }
  
  let html = '';
  requests.forEach(req => {
    const invoiceCode = String(req.invoiceCode || req.orderId || '').slice(-8);
    const requestedDate = req.requestedAt ? new Date(req.requestedAt).toLocaleString('ar-EG') : '';
    
    html += `
      <div class="return-request-card" style="border-right-color:var(--warning);">
        <div class="return-head">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:44px;height:44px;border-radius:50%;background:var(--warning-light);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--warning);">
              <i class="fa-solid fa-clock"></i>
            </div>
            <div>
              <div style="font-weight:900;color:var(--primary-dark);font-size:15px;">فاتورة #${invoiceCode}</div>
              <div style="font-size:12px;color:var(--gray-500);margin-top:2px;">
                تم الإرسال: ${requestedDate}
              </div>
            </div>
          </div>
          <span class="return-success-badge pending">
            <i class="fa-solid fa-hourglass-half"></i> جاري استلام المرتجع
          </span>
        </div>
        
        <div style="background:rgba(217,119,6,0.06);border:1px solid rgba(217,119,6,0.2);border-radius:14px;padding:14px;margin:14px 0;">
          <div style="font-weight:800;color:var(--warning);margin-bottom:6px;">
            <i class="fa-solid fa-info-circle"></i> تم استلام طلبك
          </div>
          <div style="color:var(--gray-600);font-size:13px;line-height:1.8;">
            نحن نراجع طلب الاسترجاع حالياً. لا تحتاج لإرسال الطلب مرة أخرى.
            سيتم إشعارك عند الموافقة على المرتجع.
          </div>
        </div>
        
        <div style="background:var(--gray-50);border-radius:14px;padding:12px;margin-bottom:12px;">
          <div style="font-weight:700;color:var(--primary-dark);margin-bottom:8px;font-size:13px;">
            <i class="fa-solid fa-list"></i> المنتجات المطلوب إرجاعها:
          </div>
          ${(req.items || []).map(it => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px dashed rgba(201,169,110,0.2);">
              <span style="color:var(--primary-dark);">${escapeStoreHtml(it.name || 'منتج')} × ${it.quantity || 0}</span>
              <span style="font-weight:800;color:var(--primary-medium);">${(Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2)} ج</span>
            </div>
          `).join('')}
        </div>
        
        <div class="return-refund-display">
          <span class="refund-label">💰 مبلغ الاسترداد:</span>
          <span class="refund-amount">${Number(req.refundTotal || req.total || 0).toFixed(2)} ج</span>
        </div>
      </div>
    `;
  });
  
  return html;
}

// ===== Render Approved Requests =====
function renderApprovedRequests(requests) {
  if (!requests.length) {
    return `
      <div class="returns-empty-state">
        <div class="empty-icon">✅</div>
        <h3>لا توجد طلبات معتمدة</h3>
        <p>بعد موافقة الإدارة على طلب الاسترجاع، سيظهر هنا.</p>
      </div>
    `;
  }
  
  let html = '';
  requests.forEach(req => {
    const invoiceCode = String(req.invoiceCode || req.orderId || '').slice(-8);
    const approvedDate = req.approvedAt ? new Date(req.approvedAt).toLocaleString('ar-EG') : '';
    
    html += `
      <div class="return-request-card" style="border-right-color:var(--success);">
        <div class="return-head">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:44px;height:44px;border-radius:50%;background:var(--success-light);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--success);">
              <i class="fa-solid fa-check-circle"></i>
            </div>
            <div>
              <div style="font-weight:900;color:var(--primary-dark);font-size:15px;">فاتورة #${invoiceCode}</div>
              ${approvedDate ? `<div style="font-size:12px;color:var(--gray-500);margin-top:2px;">تم الاعتماد: ${approvedDate}</div>` : ''}
            </div>
          </div>
          <span class="return-success-badge approved">
            <i class="fa-solid fa-check"></i> تم الاعتماد
          </span>
        </div>
        
        <div style="background:rgba(5,150,105,0.06);border:1px solid rgba(5,150,105,0.2);border-radius:14px;padding:14px;margin:14px 0;">
          <div style="font-weight:800;color:var(--success);margin-bottom:6px;">
            <i class="fa-solid fa-check-circle"></i> تم اعتماد طلب الاسترجاع
          </div>
          <div style="color:var(--gray-600);font-size:13px;line-height:1.8;">
            تمت الموافقة على طلبك. سيتم استرداد المبلغ في أقرب وقت.
          </div>
        </div>
        
        <div style="background:var(--gray-50);border-radius:14px;padding:12px;margin-bottom:12px;">
          <div style="font-weight:700;color:var(--primary-dark);margin-bottom:8px;font-size:13px;">
            <i class="fa-solid fa-list"></i> المنتجات:
          </div>
          ${(req.items || []).map(it => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px dashed rgba(201,169,110,0.2);">
              <span style="color:var(--primary-dark);">${escapeStoreHtml(it.name || 'منتج')} × ${it.quantity || 0}</span>
              <span style="font-weight:800;color:var(--primary-medium);">${(Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2)} ج</span>
            </div>
          `).join('')}
        </div>
        
        <div class="return-refund-display">
          <span class="refund-label">💰 مبلغ الاسترداد:</span>
          <span class="refund-amount">${Number(req.refundTotal || req.total || 0).toFixed(2)} ج</span>
        </div>
      </div>
    `;
  });
  
  return html;
}

// ===== Render Rejected Requests =====
function renderRejectedRequests(requests) {
  if (!requests.length) {
    return `
      <div class="returns-empty-state">
        <div class="empty-icon">❌</div>
        <h3>لا توجد طلبات مرفوضة</h3>
        <p>إذا رفضت الإدارة طلب استرجاع سيظهر هنا سبب الرفض. وتختفي الطلبات المرفوضة تلقائياً بعد 10 دقائق.</p>
      </div>
    `;
  }

  let html = `
    <div style="background:rgba(220,38,38,.05);border:1px dashed rgba(220,38,38,.25);border-radius:12px;padding:12px;margin-bottom:16px;font-size:12px;color:var(--danger);line-height:1.7;text-align:center;">
      <i class="fa-solid fa-hourglass-half"></i>
      <strong>تنبيه:</strong> الطلب المرفوض يظل ظاهراً لمدة 10 دقائق فقط، ثم يختفي من صفحة المرتجعات.
    </div>`;

  html += requests.map(req => {
    const invoiceCode = String(req.invoiceCode || req.orderId || '').slice(-8);
    const rejectedDate = req.rejectedAt ? new Date(req.rejectedAt).toLocaleString('ar-EG') : '';
    return `
      <div class="return-request-card rejected" data-rejected-id="${req.id}" style="border-right-color:var(--danger);">
        <div class="return-head">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:44px;height:44px;border-radius:50%;background:rgba(220,38,38,.1);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--danger);">
              <i class="fa-solid fa-circle-xmark"></i>
            </div>
            <div>
              <div style="font-weight:900;color:var(--primary-dark);font-size:15px;">فاتورة #${invoiceCode}</div>
              ${rejectedDate ? `<div style="font-size:12px;color:var(--gray-500);margin-top:2px;">تم الرفض: ${rejectedDate}</div>` : ''}
            </div>
          </div>
          <span class="return-success-badge" style="background:#FDE8E8;color:#C1121F;"><i class="fa-solid fa-xmark"></i> مرفوض</span>
        </div>
        <div style="background:rgba(220,38,38,.05);border:1px solid rgba(220,38,38,.18);border-radius:14px;padding:14px;margin:14px 0;">
          <div style="font-weight:800;color:var(--danger);margin-bottom:6px;"><i class="fa-solid fa-info-circle"></i> سبب الرفض</div>
          <div style="color:var(--gray-600);font-size:13px;line-height:1.8;">${req.rejectionReason || 'لم يتم توضيح سبب الرفض'}</div>
        </div>
        <div style="background:var(--gray-50);border-radius:14px;padding:12px;margin-bottom:12px;">
          ${(req.items || []).map(it => `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span>${escapeStoreHtml(it.name || 'منتج')} × ${it.quantity || 0}</span><span>${(Number(it.price || 0)*Number(it.quantity || 0)).toFixed(2)} ج</span></div>`).join('')}
        </div>
        <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
          <div class="auto-delete-countdown" style="flex:1;min-width:190px;">
            <i class="fa-solid fa-hourglass-half"></i>
            <span>يختفي بعد:</span>
            <span class="countdown-digits" data-rejected-countdown="${req.id}">10:00</span>
          </div>
          <button type="button" class="btn btn-danger btn-sm" data-delete-rejected="${req.id}">
            <i class="fa-solid fa-trash-can"></i> حذف
          </button>
        </div>
      </div>`;
  }).join('');
  return html;
}

function setupRejectedReturnsEvents(container) {
  container.querySelectorAll('[data-delete-rejected]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deleteRejected;
      const req = (returnsPageState.rejected || []).find(r => String(r.id) === String(id));
      if (!req) return;
      if (!await window.proConfirm(`هل تريد حذف طلب المرتجع المرفوض #${req.invoiceCode || req.orderId || ''} نهائياً؟`)) return;
      btn.disabled = true;
      const old = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحذف...';
      const phoneHash = req.phoneHash || await hashFirstOrderPhone(getSavedPhone());
      const ok = await deleteRejectedReturn(id, phoneHash);
      if (ok) {
        NotificationSystem.success('🗑️ تم حذف المرتجع المرفوض');
        await renderReturnsPage();
      } else {
        NotificationSystem.error('❌ فشل حذف المرتجع المرفوض');
        btn.disabled = false;
        btn.innerHTML = old;
      }
    });
  });
}

// ===== ✅ Render Completed Requests (مع العداد التنازلي) =====
function renderCompletedRequests(requests) {
  if (!requests.length) {
    return `
      <div class="returns-empty-state">
        <div class="empty-icon">🎉</div>
        <h3>لا توجد طلبات مكتملة</h3>
        <p>بعد استرداد المبلغ بنجاح، يظهر السجل هنا لمدة 10 دقائق فقط، بينما تظل الكمية المتبقية متاحة للاسترجاع حتى نهاية 24 ساعة من التسليم.</p>
      </div>
    `;
  }
  
  let html = `
    <div style="background:rgba(220,38,38,0.05);border:1px dashed rgba(220,38,38,0.25);border-radius:12px;padding:12px;margin-bottom:16px;font-size:12px;color:var(--danger);line-height:1.7;text-align:center;">
      <i class="fa-solid fa-info-circle"></i>
      <strong> تنبيه:</strong> تختفي الطلبات المكتملة من هذه الصفحة بعد 10 دقائق من اكتمال الاسترجاع، ولا تتأثر مهلة المرتجع الأصلية البالغة 24 ساعة من وقت التسليم.
    </div>
    <button type="button" class="btn-clear-returns" id="clearCompletedReturnsBtn">
      <i class="fa-solid fa-trash-can"></i> مسح كل الطلبات المكتملة الآن
    </button>
  `;
  
  requests.forEach(req => {
    const invoiceCode = String(req.invoiceCode || req.orderId || '').slice(-8);
    const completedAt = Number(req.completedAt || req.approvedAt || req.requestedAt || Date.now());
    const completedDate = new Date(completedAt).toLocaleString('ar-EG');
    
    html += `
      <div class="completed-return-card" data-completed-id="${req.id}">
        <div class="return-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:44px;height:44px;border-radius:50%;background:rgba(5,150,105,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--success);">
              <i class="fa-solid fa-check-double"></i>
            </div>
            <div>
              <div style="font-weight:900;color:var(--primary-dark);font-size:15px;">فاتورة #${invoiceCode}</div>
              <div style="font-size:12px;color:var(--gray-500);margin-top:2px;">تم الاسترداد: ${completedDate}</div>
            </div>
          </div>
          <span class="return-success-badge approved">
            <i class="fa-solid fa-check-double"></i> تم استعادة أموالك
          </span>
        </div>
        
        <div style="background:rgba(5,150,105,0.06);border:1px solid rgba(5,150,105,0.2);border-radius:14px;padding:14px;margin:12px 0;">
          <div style="font-weight:800;color:var(--success);margin-bottom:6px;">
            <i class="fa-solid fa-money-bill-wave"></i> تم استرداد المبلغ بنجاح
          </div>
          <div style="color:var(--gray-600);font-size:13px;line-height:1.8;">
            تم إرجاع الكميات إلى المخزون واسترداد المبلغ.
          </div>
        </div>
        
        <div style="background:rgba(255,255,255,0.6);border-radius:14px;padding:12px;margin-bottom:12px;">
          ${(req.items || []).map(it => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px dashed rgba(201,169,110,0.2);">
              <span style="color:var(--primary-dark);">${escapeStoreHtml(it.name || 'منتج')} × ${it.quantity || 0}</span>
              <span style="font-weight:800;color:var(--success);">${(Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2)} ج</span>
            </div>
          `).join('')}
        </div>
        
        <div class="return-refund-display" style="background:linear-gradient(135deg,#d1fae5,#a7f3d0);">
          <span class="refund-label">💰 المبلغ المسترد:</span>
          <span class="refund-amount">${Number(req.refundTotal || req.total || 0).toFixed(2)} ج</span>
        </div>
        
        <!-- ✅ عداد الحذف التلقائي -->
        <div class="auto-delete-countdown" data-countdown-id="${req.id}">
          <i class="fa-solid fa-hourglass-half"></i>
          <span>سيُحذف تلقائياً بعد:</span>
          <span class="countdown-digits" data-countdown-digits="${req.id}">--:--:--</span>
        </div>
      </div>
    `;
  });
  
  return html;
}

// ============================================================
// ===== Setup Eligible Order Events (FIXED) =====
// ============================================================
function setupEligibleOrderEvents(container) {
  // حساب إجمالي الطلب
  const calculateOrderTotal = (orderId) => {
    let total = 0;
    container.querySelectorAll(`.return-item-checkbox[data-order-id="${orderId}"]:checked`).forEach(cb => {
      const itemIndex = cb.dataset.itemIndex;
      const qtyInput = container.querySelector(`.return-qty-input[data-order-id="${orderId}"][data-item-index="${itemIndex}"]`);
      const unitPrice = parseFloat(cb.dataset.unitPrice) || 0;
      const rawValue = qtyInput?.value?.trim() || '';
      const qty = rawValue === '' ? 1 : Math.max(1, Math.floor(Number(rawValue) || 1));
      total += unitPrice * qty;
    });
    
    const totalEl = container.querySelector(`.return-total-amount[data-order-id="${orderId}"]`);
    if (totalEl) {
      totalEl.textContent = total.toFixed(2) + ' ج';
    }
    return total;
  };
  
  // ✅ Checkbox change
  container.querySelectorAll('.return-item-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const orderId = cb.dataset.orderId;
      const itemIndex = cb.dataset.itemIndex;
      const qtyInput = container.querySelector(`.return-qty-input[data-order-id="${orderId}"][data-item-index="${itemIndex}"]`);
      const row = container.querySelector(`.return-item-row[data-item-row="${orderId}-${itemIndex}"]`);
      
      if (qtyInput) {
        qtyInput.disabled = !cb.checked;
        // ✅ عند التفعيل: نترك الحقل كما هو (فارغ = يعرض placeholder "1")
      }
      
      if (row) {
        row.classList.toggle('selected', cb.checked);
      }
      
      calculateOrderTotal(orderId);
    });
  });
  
  // ✅ Quantity input - الكتابة الحرة بدون فرض قيمة
  container.querySelectorAll('.return-qty-input').forEach(input => {
    // عند الكتابة: نسمح بأي رقم، لكن نزيل الحروف
    input.addEventListener('input', () => {
      const orderId = input.dataset.orderId;
      const itemIndex = input.dataset.itemIndex;
      const maxQty = parseInt(input.dataset.maxQty || input.max, 10) || 0;
      
      // إزالة أي حروف غير رقمية
      let rawValue = input.value.replace(/[^\d]/g, '');
      
      // إذا تجاوز الحد الأقصى
      if (rawValue !== '' && parseInt(rawValue) > maxQty) {
        rawValue = String(maxQty);
        NotificationSystem.warning(`⚠️ الحد الأقصى ${maxQty} قطعة`);
      }
      
      // حفظ القيمة (بدون فرض قيمة افتراضية)
      input.value = rawValue;
      
      // تفعيل الـ checkbox عند الكتابة
      const cb = container.querySelector(`.return-item-checkbox[data-order-id="${orderId}"][data-item-index="${itemIndex}"]`);
      if (cb && !cb.disabled && rawValue !== '') {
        cb.checked = true;
        const row = container.querySelector(`.return-item-row[data-item-row="${orderId}-${itemIndex}"]`);
        if (row) row.classList.add('selected');
      }
      
      calculateOrderTotal(orderId);
    });
    
    // ✅ عند فقد التركيز: إذا كان فارغاً، نضع "1" تلقائياً
    input.addEventListener('blur', () => {
      const orderId = input.dataset.orderId;
      const itemIndex = input.dataset.itemIndex;
      
      if (input.value.trim() === '') {
        input.value = '1';
        
        const cb = container.querySelector(`.return-item-checkbox[data-order-id="${orderId}"][data-item-index="${itemIndex}"]`);
        if (cb && !cb.disabled) {
          cb.checked = true;
          const row = container.querySelector(`.return-item-row[data-item-row="${orderId}-${itemIndex}"]`);
          if (row) row.classList.add('selected');
        }
        
        calculateOrderTotal(orderId);
      }
    });
  });
  
  // Submit buttons
  container.querySelectorAll('.customer-return-submit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.orderId;
      const order = myOrders.find(o => String(o.orderId) === String(orderId));
      
      if (!order) {
        NotificationSystem.error('الطلب غير موجود');
        return;
      }
      
      
// جمع التحديدات
      const selections = [];
      container.querySelectorAll(`.return-item-checkbox[data-order-id="${orderId}"]:checked`).forEach(cb => {
        const itemIndex = Number(cb.dataset.itemIndex);
        const qtyInput = container.querySelector(`.return-qty-input[data-order-id="${orderId}"][data-item-index="${itemIndex}"]`);
        const rawValue = qtyInput?.value?.trim() || '';
        
        // ✅ إذا فارغ → نعتبره 1
        let qty = rawValue === '' ? 1 : Math.floor(Number(rawValue) || 1);
        
        if (qty < 1) qty = 1;
        
        const maxQty = parseInt(qtyInput?.dataset.maxQty || qtyInput?.max, 10) || 0;
        if (maxQty < 1) {
          NotificationSystem.warning('⚠️ لا توجد كمية متاحة لهذا المنتج للاسترجاع');
          return;
        }
        if (qty > maxQty) {
          NotificationSystem.warning(`⚠️ الحد الأقصى لهذا المنتج ${maxQty} قطعة`);
          qty = maxQty;
        }
        
        selections.push({ index: itemIndex, quantity: qty });
      });
      
      if (!selections.length) {
        NotificationSystem.warning('⚠️ اختر منتجاً واحداً على الأقل وحدد الكمية');
        return;
      }
      
      const reason = container.querySelector(`.customer-return-reason[data-order-id="${orderId}"]`)?.value || '';
      const details = container.querySelector(`.customer-return-details[data-order-id="${orderId}"]`)?.value.trim() || '';
      
      if (!reason) {
        NotificationSystem.warning('⚠️ اختر سبب الاسترجاع');
        return;
      }
      
      if (!await window.proConfirm('هل أنت متأكد من إرسال طلب الاسترجاع؟\n\n⚠️ لا يتم استرداد رسوم التوصيل.')) return;
      
      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.style.opacity = '0.85';
      btn.style.cursor = 'wait';
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري استلام المرتجع...';
      
      container.querySelectorAll(`[data-order-id="${orderId}"]`).forEach(el => {
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
          el.disabled = true;
        }
      });
      
      try {
        await submitReturnRequest(order, selections, reason, details);
        
        showReturnSuccessOverlay();
        NotificationSystem.success('✅ تم استلام طلب الاسترجاع بنجاح!');
        showPhoneNotification({
          title:'↩️ تم إرسال طلب الاسترجاع',
          body:`تم استلام طلب الاسترجاع للطلب #${String(order?.orderId || '').slice(-8)} وهو قيد المراجعة.`,
          tag:`return-requested-${order?.orderId || Date.now()}`,
          data:{notificationType:'return_requested',returnId:String(order?.orderId || ''),notificationId:`return-requested-${order?.orderId || Date.now()}`}
        });
        
        returnsPageState.currentFilter = 'pending';
        setTimeout(async () => {
          await renderReturnsPage();
        }, 1000);
        
      } catch (error) {
        console.error('Return request error:', error);
        NotificationSystem.error(error.message || '❌ فشل إرسال طلب الاسترجاع');
        
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.innerHTML = originalHTML;
        
        container.querySelectorAll(`[data-order-id="${orderId}"]`).forEach(el => {
          if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
            el.disabled = false;
          }
        });
        
        setTimeout(() => renderReturnsPage(), 1500);
      }
    });
  });
}

// ============================================================
// ===== Render Cart Page =====
// ============================================================
function renderCartPage() {
  const c = $('#cartPageContent');
  if (!c) return;
  let h = '';
  
  // الطلب المسلّم يظل داخل myOrders لمدة 24 ساعة حتى يكون متاحاً للمرتجعات،
  // ويختفي من واجهة السلة بعد 10 دقائق من التسليم.
  // أما الطلب الذي اكتمل استرجاعه فيظهر في السلة 10 دقائق من وقت اكتمال الاسترجاع فقط،
  // ثم يختفي من السلة مع بقاء سجل المرتجع في صفحة المرتجعات حتى نهاية الـ24 ساعة الأصلية.
  const visibleCartOrders = myOrders.filter(o => {
    const status = String(o.status || '').toLowerCase();
    if (status === 'returned' || o.returnedAt) {
      const returnedAt = Number(o.returnedAt || 0);
      if (!returnedAt) return false;
      return (Date.now() - returnedAt) <= 10 * 60 * 1000;
    }
    if (status === 'delivered' && o.deliveredAt) {
      return (Date.now() - Number(o.deliveredAt)) <= 10 * 60 * 1000;
    }
    return true;
  });
  
  if (visibleCartOrders.length > 0) {
    h += `<div class="cart-section">
      <div class="cart-section-title">
        <i class="fa-solid fa-list-check"></i> طلباتي (${visibleCartOrders.length})
      </div>`;
    
    visibleCartOrders.forEach(o => {
      const sm = {
        pending: { icon: '⏳', text: 'جاري قبول الطلب...', cls: 'badge-pending' },
        accepted: { icon: '✅', text: 'تم القبول', cls: 'badge-accepted' },
        delivering: { icon: '🚚', text: 'جاري التوصيل', cls: 'badge-delivering' },
        shipped: { icon: '📦', text: 'تم الشحن', cls: 'badge-shipped' },
        delivered: { icon: '✓', text: 'تم التوصيل ✓', cls: 'badge-delivered' },
        returned: { icon: '↩️', text: 'تم الاسترجاع', cls: 'badge-returned' },
        rejected: { icon: '❌', text: 'تم الرفض', cls: 'badge-rejected' },
        cancelled: { icon: '✕', text: 'ملغي', cls: 'badge-cancelled' }
      };
      
      const displayStatus = (String(o.status || '').toLowerCase() === 'returned' || o.returnedAt) ? 'returned' : String(o.status || '').toLowerCase();
      const st = sm[displayStatus] || sm['pending'];
      const date = o.createdAt ? new Date(o.createdAt).toLocaleString('ar-EG') : '';
      const pm = PAYMENT_METHODS[o.paymentMethod] || PAYMENT_METHODS['cod'];
      const it = (o.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
      const df = o.deliveryFee || 0;
      const cf = o.codFee || 0;
      const gt = o.total || 0;
      
      let th = '';
      if ((o.status === 'returned' || o.returnedAt) && o.returnedAt) {
        const r = Math.max(0, (10 * 60 * 1000) - (Date.now() - Number(o.returnedAt)));
        const sec = Math.ceil(r / 1000);
        th = r > 0
          ? `<div class="timer-badge"><i class="fa-solid fa-clock"></i> يختفي من السلة خلال <span data-returned-countdown="${String(o.orderId || '')}">${String(Math.floor(sec / 60)).padStart(2,'0')}:${String(sec % 60).padStart(2,'0')}</span></div>`
          : `<div class="timer-badge danger"><i class="fa-solid fa-trash"></i> جاري الإخفاء...</div>`;
      } else if (o.status === 'delivered' && o.deliveredAt) {
        const r = Math.max(0, (24 * 60 * 60 * 1000) - (Date.now() - o.deliveredAt));
        th = r > 0 
          ? `<div class="timer-badge"><i class="fa-solid fa-clock"></i> حذف سجل الطلب خلال ${Math.ceil(r / 3600000)} س</div>` 
          : `<div class="timer-badge danger"><i class="fa-solid fa-trash"></i> جاري الحذف...</div>`;
      } else if (o.status === 'rejected' && o.rejectedAt) {
        const r = Math.max(0, (24 * 60 * 60 * 1000) - (Date.now() - o.rejectedAt));
        const hr = Math.ceil(r / 3600000);
        th = r > 0 
          ? `<div class="timer-badge danger"><i class="fa-solid fa-clock"></i> حذف خلال ${hr >= 1 ? hr + ' س' : Math.ceil(r / 60000) + ' د'}</div>` 
          : `<div class="timer-badge danger"><i class="fa-solid fa-trash"></i> جاري الحذف...</div>`;
      }
      
      h += `
        <div class="current-order-block" data-oid="${o.orderId}">
          <div style="font-size:40px;">${st.icon}</div>
          <div class="status-badge-lg ${st.cls}">${st.text}</div>
          <p><strong>#${(o.orderId || '').slice(-8)}</strong> | ${date}</p>
          <p><strong>الدفع:</strong> <i class="fa-solid ${pm.icon}" style="color:${pm.color || 'inherit'}"></i> ${pm.name}</p>
          
          <div class="order-detail-breakdown">
            <div class="breakdown-row"><span>🛒 المنتجات:</span><span>${it.toFixed(2)} ج</span></div>
            <div class="breakdown-row"><span>🚚 التوصيل${o.shippingZoneName ? ' (' + o.shippingZoneName + ')' : ''}:</span><span>${df === 0 ? 'مجاناً 🎉' : df.toFixed(2) + ' ج'}</span></div>
            ${cf > 0 ? `<div class="breakdown-row"><span>💳 رسوم الدفع:</span><span>${cf.toFixed(2)} ج</span></div>` : ''}
            <div class="breakdown-row total"><span>💰 الإجمالي:</span><span>${gt.toFixed(2)} ج</span></div>
            ${o.requiresDeposit && o.depositPaid ? `<div class="breakdown-row"><span>✅ المدفوع (إثبات الجدية):</span><span>${Number(o.depositPaidAmount ?? o.depositAmount ?? 0).toFixed(2)} ج</span></div><div class="breakdown-row total"><span>🧾 المتبقي عند الاستلام:</span><span>${Math.max(0, gt - Number(o.depositPaidAmount ?? o.depositAmount ?? 0)).toFixed(2)} ج</span></div>` : ''}
            ${o.requiresDeposit && !o.depositPaid ? `<div class="breakdown-row"><span>⏳ إثبات الجدية:</span><span>بانتظار تحويل ${Number(o.depositAmount || 0).toFixed(2)} ج</span></div>` : ''}
          </div>
          
          ${o.recipientName ? `<p><strong>المستلم:</strong> ${escapeStoreHtml(o.recipientName)}</p>` : ''}
          ${o.shippingZoneName ? `<p><strong>المنطقة:</strong> ${o.shippingZoneName}</p>` : ''}
          ${o.address ? `<p><strong>العنوان:</strong> ${escapeStoreHtml(o.address)}</p>` : ''}
          ${o.phone ? `<p><strong>الهاتف:</strong> ${o.phone}</p>` : ''}
          
          ${th}
          
          <div class="order-items-preview">
            <small>المنتجات:</small>
            ${(o.items || []).map(i => `
              <div class="order-item-mini">
                <span>${i.name} × ${i.quantity}${i.customNote ? `<br><small style="color:var(--accent-dark);font-weight:700;">✍️ ${escapeStoreHtml(i.customNote)}</small>` : ''}</span>
                <span>${(i.price * i.quantity).toFixed(2)} ج</span>
              </div>
            `).join('')}
          </div>
          
          ${o.rejectionReason ? `<div class="rejection-reason">❌ ${o.rejectionReason}</div>` : ''}
          
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
            ${o.status === 'pending' && ((o.paymentMethod && o.paymentMethod !== 'cod') || (o.requiresDeposit && !o.depositPaid))
              ? `<button class="btn btn-gold" style="font-size:12px;padding:8px 16px;" data-pay-order="${o.orderId}"><i class="fa-solid fa-credit-card"></i> بيانات الدفع / إرسال الإيصال</button>`
              : ''
            }
            ${o.status === 'pending' 
              ? `<button class="btn btn-danger" style="font-size:12px;padding:8px 16px;" data-cancel-order="${o.orderId}">
                  <i class="fa-solid fa-xmark"></i> إلغاء الطلب
                </button>` 
              : ''
            }
            
            ${o.status === 'delivered' && o.deliveredAt && !o.returnedAt && Date.now() - Number(o.deliveredAt) <= 24 * 60 * 60 * 1000
              ? `<button class="btn btn-gold" style="font-size:12px;padding:8px 16px;" onclick="window.switchPage('returns')">
                  <i class="fa-solid fa-rotate-left"></i> الانتقال للمرتجعات
                </button>` 
              : ''
            }
            
            ${['delivered', 'returned', 'rejected'].includes(o.status)
              ? `<button class="btn btn-primary" style="font-size:12px;padding:8px 16px;" data-reorder-order="${o.orderId}"><i class="fa-solid fa-rotate-right"></i> اطلب مرة أخرى</button>`
              : ''
            }
            <button class="btn btn-outline" style="font-size:12px;padding:8px 16px;" data-track-order="${o.orderId}"><i class="fa-solid fa-location-dot"></i> تتبع الطلب</button>
            <button class="btn btn-outline" style="font-size:12px;padding:8px 16px;" data-invoice-order="${o.orderId}"><i class="fa-solid fa-file-invoice"></i> الفاتورة</button>
            <button class="btn btn-outline" style="font-size:12px;padding:8px 16px;" data-remove-order="${o.orderId}">
              <i class="fa-solid fa-xmark"></i> إخفاء
            </button>
          </div>
        </div>
      `;
    });
    
    h += `</div>`;
  }
  

  const cxQty = cartItems.reduce((s, i) => s + (i.quantity || 0), 0);
  if (cartItems.length === 0) {
    h += `
      <div class="cx-wrap"><div class="cx-empty">
        <span class="ic">🛒</span>
        <h3>سلتك فارغة</h3>
        <p>ابدأ بإضافة منتجاتك المفضلة وسنجهّزها لك بسرعة</p>
        <button class="cx-go" id="continueShoppingBtn"><i class="fa-solid fa-store"></i> تصفح المنتجات</button>
      </div></div>`;
  } else {
    let total = 0, savings = 0;
    let items = '';
    cartItems.forEach((item, idx) => {
      const ep = item.finalPrice || item.price || 0;
      const q = item.quantity || 0;
      const it = ep * q;
      total += it;
      if (item.hasDiscount) savings += Math.max(0, ((item.originalPrice || item.price || 0) - ep) * q);
      const img = getThumbnailUrl(item.image, 200);
      items += `
        <div class="cx-card" style="animation-delay:${Math.min(idx, 6) * 40}ms">
          <img class="cx-img" src="${img}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
          <div class="cx-info">
            <div class="cx-name">${escapeStoreHtml(item.name || '')}</div>
            ${(() => { const pp = allProducts.find(x => x.id === item.productId); const left = pp ? (pp.quantity || 0) : 99; return left > 0 && left <= 5 ? `<span class="cx-low">🔥 متبقي ${left} فقط</span>` : ''; })()}
            ${item.note ? `<span class="cx-note"><i class="fa-solid fa-pen"></i> ${escapeStoreHtml(item.note)} <button type="button" data-edit-note="${idx}">تعديل</button></span>` : ''}
            <div class="cx-price">
              ${item.hasDiscount ? `<s>${(item.originalPrice || item.price).toFixed(2)}</s>` : ''}
              <span>${ep.toFixed(2)} ج</span>
              ${item.hasDiscount && item.discountLabel ? `<span class="cx-off">🏷️ ${escapeStoreHtml(item.discountLabel)}</span>` : ''}
            </div>
            <div class="cx-row">
              <div class="cx-qty">
                <button type="button" data-qty-idx="${idx}" data-qty-delta="-1" ${q <= 1 ? 'disabled' : ''} aria-label="إنقاص">−</button>
                <b>${q}</b>
                <button type="button" data-qty-idx="${idx}" data-qty-delta="1" ${q >= (item.maxQty || 99) ? 'disabled' : ''} aria-label="زيادة">+</button>
              </div>
              <div class="cx-line">${it.toFixed(2)} <small>ج</small></div>
            </div>
          </div>
          <button type="button" class="cx-del" data-remove-idx="${idx}" aria-label="حذف"><svg class="mk-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg></button>
          <button type="button" class="cx-fav ${wishlist.includes(item.productId) ? 'on' : ''}" data-save-idx="${idx}" aria-label="نقل للمفضلة"><i class="fa-${wishlist.includes(item.productId) ? 'solid' : 'regular'} fa-heart"></i> ${wishlist.includes(item.productId) ? 'في المفضلة' : 'احفظ للمفضلة'}</button>
        </div>`;
    });
    h += `
      <div class="cx-wrap">
        <div class="cx-head">
          <h3><svg class="mk-ico" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20.2" r="1.6"/><circle cx="18" cy="20.2" r="1.6"/><path d="M2 3h3l2.7 11.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 7H6"/></svg> سلتك <span class="cx-chip">${cxQty} قطعة</span></h3>
          <button type="button" class="cx-clear" id="clearCartBtn"><i class="fa-solid fa-trash"></i> تفريغ السلة</button>
        </div>
        <div class="free-ship-hint" style="display:none;"></div>
        <div class="cx-list">${items}</div>
        <div class="cx-sum">
          <h4>ملخص الطلب</h4>
          <div class="r"><span>المنتجات (${cxQty})</span><span>${total.toFixed(2)} ج</span></div>
          ${savings > 0 ? `<div class="r" style="color:var(--success)"><span>🏷️ وفّرت</span><span>${savings.toFixed(2)} ج</span></div>` : ''}
          <div class="r"><span>التوصيل</span><span class="muted">يُحسب حسب منطقتك</span></div>
          <div class="r t"><span>الإجمالي</span><span>${total.toFixed(2)} ج</span></div>
        </div>
        <div class="cx-trust">
          <div><span>🔒</span>بياناتك آمنة</div>
          <div><span>🚚</span>توصيل سريع</div>
          <div><span>↩️</span>استرجاع 24 ساعة</div>
        </div>
        ${(() => {
          const inCart = new Set(cartItems.map(i => i.productId));
          const sug = allProducts.filter(p => wishlist.includes(p.id) && !inCart.has(p.id) && (p.quantity || 0) > 0).slice(0, 8);
          if (!sug.length) return '';
          return `<div class="cx-sug"><h4>❤️ من مفضلتك</h4><div class="cx-sug-row">${sug.map(p => {
            const pr = getEffectivePrice(p);
            return `<div class="cx-sug-card"><img src="${getThumbnailUrl(p.image, 200)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><div class="n">${escapeStoreHtml(p.name || '')}</div><div class="p">${pr.finalPrice.toFixed(2)} ج</div><button type="button" data-sug-add="${escapeStoreHtml(String(p.id))}">+ أضف</button></div>`;
          }).join('')}</div></div>`;
        })()}
        <div class="cx-more"><button type="button" id="continueShoppingBtn2"><i class="fa-solid fa-plus"></i> متابعة التسوق</button></div>
        <div class="cx-bar">
          <div class="tot"><small>الإجمالي</small><b>${total.toFixed(2)} ج</b></div>
          <button type="button" class="cx-go" id="openCheckoutBtn">متابعة لإتمام الطلب <i class="fa-solid fa-arrow-left"></i></button>
        </div>
      </div>`;
  }
  if (c.__cartHtml === h && c.childElementCount > 0) { updateFreeShipHint(); return; }
  const keepY = window.scrollY;
  c.classList.toggle('cx-static', c.childElementCount > 0);
  c.__cartHtml = h;
  c.innerHTML = h;
  if (c.classList.contains('cx-static') && Math.abs(window.scrollY - keepY) > 1) window.scrollTo(0, keepY);
  updateFreeShipHint();
  
  c.querySelectorAll('[data-remove-order]').forEach(b => 
    b.addEventListener('click', () => removeOrderManually(b.getAttribute('data-remove-order')))
  );
  c.querySelectorAll('[data-cancel-order]').forEach(b => 
    b.addEventListener('click', () => cancelOrder(b.getAttribute('data-cancel-order')))
  );
  c.querySelectorAll('[data-reorder-order]').forEach(b => 
    b.addEventListener('click', () => reorderOrder(b.getAttribute('data-reorder-order')))
  );
  c.querySelectorAll('[data-edit-note]').forEach(b => b.addEventListener('click', async () => {
    const idx = parseInt(b.getAttribute('data-edit-note'));
    const item = cartItems[idx]; if (!item) return;
    const p = allProducts.find(x => x.id === item.productId) || {};
    const note = await askProductDetails({ name: item.name, detailsLabel: p.detailsLabel || item.detailsLabel, detailsOptions: p.detailsOptions || item.detailsOptions }, item.note || '');
    if (note === null) return;
    const dup = cartItems.findIndex((x, k) => k !== idx && x.productId === item.productId && String(x.note || '') === note);
    if (dup >= 0) { cartItems[dup].quantity += item.quantity; cartItems.splice(idx, 1); }
    else item.note = note;
    saveCart(); renderCartPage();
  }));
  c.querySelectorAll('[data-qty-idx]').forEach(b => 
    b.addEventListener('click', () => changeQty(parseInt(b.getAttribute('data-qty-idx')), parseInt(b.getAttribute('data-qty-delta'))))
  );
  c.querySelectorAll('[data-remove-idx]').forEach(b => 
    b.addEventListener('click', () => removeItem(parseInt(b.getAttribute('data-remove-idx'))))
  );
  c.querySelectorAll('[data-save-idx]').forEach(b => b.addEventListener('click', () => {
    const idx = parseInt(b.getAttribute('data-save-idx')); const it = cartItems[idx]; if (!it) return;
    if (!wishlist.includes(it.productId)) wishlist.push(it.productId);
    const removed = { ...it };
    cartItems.splice(idx, 1);
    saveWishlist(); saveCart(); renderCartPage();
    window.__cxUndo('نُقل المنتج إلى المفضلة', () => { cartItems.splice(Math.min(idx, cartItems.length), 0, removed); saveCart(); renderCartPage(); });
  }));
  c.querySelectorAll('[data-sug-add]').forEach(b => b.addEventListener('click', () => addToCart(b.getAttribute('data-sug-add'))));
  $('#continueShoppingBtn')?.addEventListener('click', () => switchPage('home'));
  $('#continueShoppingBtn2')?.addEventListener('click', () => switchPage('home'));
  $('#openCheckoutBtn')?.addEventListener('click', openCheckoutModal);
  $('#clearCartBtn')?.addEventListener('click', clearCart);
}

// ============================================================
// ===== Order Actions =====
// ============================================================
async function removeOrderManually(oid) {
  if (!await window.proConfirm('حذف الطلب؟')) return;
  if (database) {
    try { await remove(ref(database, `orders/${oid}`)); } catch (e) {}
  }
  myOrders = myOrders.filter(o => o.orderId !== oid);
  OrderTimerManager.clearTimer(oid);
  saveOrders();
  renderCartPage();
}

async function cancelOrder(oid) {
  if (!await window.proConfirm('هل تريد إلغاء هذا الطلب؟ سيتم حذفه نهائياً')) return;
  const order = myOrders.find(o => o.orderId === oid);
  if (!order) return;
  if (order.status !== 'pending') { 
    NotificationSystem.warning('لا يمكن إلغاء طلب غير معلق'); 
    return; 
  }
  try {
    if (database) {
      const rm = { ['orders/' + oid]: null };
      [...new Set((order.items || []).map(i => i.vendorId).filter(Boolean))].forEach(v => { rm['vendorOrders/' + v + '/' + oid] = null; });
      await update(ref(database), rm);
    }
    myOrders = myOrders.filter(o => o.orderId !== oid);
    OrderTimerManager.clearTimer(oid);
    saveOrders();
    NotificationSystem.success('✅ تم إلغاء الطلب وحذفه بنجاح');
    renderCartPage();
  } catch (e) { 
    NotificationSystem.error('فشل الإلغاء'); 
  }
}

function changeQty(idx, d) {
  if (idx < 0 || idx >= cartItems.length) return;
  const item = cartItems[idx];
  const nq = (item.quantity || 0) + d;
  if (nq < 1) { 
    removeItem(idx); 
    return; 
  }
  const p = allProducts.find(x => x.id === item.productId);
  const ms = (p?.quantity || item.maxQty || 99) - productQtyInCart(item.productId, idx);
  if (nq > ms && d > 0) { 
    NotificationSystem.warning(`الحد الأقصى ${ms}`); 
    return; 
  }
  item.quantity = nq;
  saveCart();
  renderCartPage();
}

window.__cxUndo = function (msg, undo) {
  document.getElementById('cxSnack')?.remove();
  const el = document.createElement('div'); el.id = 'cxSnack';
  el.innerHTML = `<span>${msg}</span><button type="button">تراجع</button>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
  const kill = () => { el.classList.remove('on'); setTimeout(() => el.remove(), 250); };
  el.querySelector('button').onclick = () => { undo(); kill(); };
  setTimeout(kill, 5000);
};
function removeItem(idx) {
  if (idx < 0 || idx >= cartItems.length) return;
  const removed = { ...cartItems[idx] };
  cartItems.splice(idx, 1);
  saveCart();
  renderCartPage();
  window.__cxUndo('تم حذف المنتج من السلة', () => { cartItems.splice(Math.min(idx, cartItems.length), 0, removed); saveCart(); renderCartPage(); });
}

async function clearCart() {
  if (cartItems.length === 0) { 
    NotificationSystem.info('السلة فارغة'); 
    return; 
  }
  if (!await window.proConfirm('⚠️ هل أنت متأكد من تفريغ السلة بالكامل؟')) return;
  cartItems = [];
  saveCart();
  NotificationSystem.success('✅ تم تفريغ السلة بنجاح');
  renderCartPage();
}

// ============================================================
// ===== Checkout =====
// ============================================================
function openCheckoutModal(options = {}) {
  if (cartItems.length === 0) { 
    NotificationSystem.warning('السلة فارغة'); 
    return; 
  }
  if (!options.skipAuth && !isAuthTermsAccepted()) {
    openAuthModal({ resume: { type: 'checkout' } });
    return;
  }
  resetPaymentSelection();
  removeCoupon();
  if (!$('#checkoutModalOverlay')?.classList.contains('show')) pushStoreLayerHistory('checkout');
  $('#checkoutModalOverlay')?.classList.add('show');
  $('#checkoutForm')?.reset();
  fillCheckoutProfile();
  const existingPhone = $('#custPhone')?.value.trim();
  if (existingPhone) checkFirstOrderEligibility(existingPhone, true);
  const fb = $('#checkoutFeedback');
  if (fb) { 
    fb.style.display = 'none'; 
    fb.textContent = ''; 
  }
  updateTotalSummary();
  if (window.__ckReset) window.__ckReset();
}

function closeCheckoutModal(fromHistory = false) {
  const modal = $('#checkoutModalOverlay');
  if (!modal) return;
  if (!fromHistory && modal.classList.contains('show')) {
    closeStoreLayerFromButton('checkout', () => modal.classList.remove('show'));
    return;
  }
  modal.classList.remove('show');
}

// إغلاق صفحة إتمام الطلب بعد الإرسال: يعيد الخطوات للأولى أولاً حتى لا يعتبر زر الرجوع
// الإغلاقَ رجوعاً من خطوة المراجعة، ثم يغلق الصفحة فوراً ويرتّب سجل المتصفح.
function closeCheckoutAfterOrder() {
  return new Promise(resolve => {
    const modal = $('#checkoutModalOverlay');
    try { window.__ckReset && window.__ckReset(); } catch (e) {}
    if (!modal || !modal.classList.contains('show')) { resolve(); return; }
    modal.classList.remove('show');
    const st = history.state;
    if (st && st[STORE_HISTORY_KEY] === true && st.layer === 'checkout') {
      let done = false;
      const fin = () => { if (done) return; done = true; window.removeEventListener('popstate', fin); resolve(); };
      window.addEventListener('popstate', fin);
      setTimeout(fin, 400);
      try { history.back(); } catch (e) { fin(); }
    } else {
      resolve();
    }
  });
}

$('#cancelCheckout')?.addEventListener('click', closeCheckoutModal);
document.getElementById('clearSavedCheckout')?.addEventListener('click', clearCheckoutProfile);
// تغيير المنطقة أو طريقة الدفع يعيد حساب التوصيل والإجمالي فوراً
document.getElementById('custZone')?.addEventListener('change', () => updateTotalSummary());
document.getElementById('custName')?.addEventListener('input', () => updateTotalSummary());

$('#checkoutModalOverlay')?.addEventListener('click', function(e) { 
  if (e.target === this) closeCheckoutModal(); 
});

$('#applyCouponBtn')?.addEventListener('click', function() {
  const input = document.getElementById('couponInput');
  if (!input) return;
  const code = input.value.trim();
  if (!code) { 
    NotificationSystem.warning('⚠️ أدخل كود الخصم'); 
    return; 
  }
  const result = applyCoupon(code);
  if (result.success) { 
    NotificationSystem.success(result.message); 
    updateTotalSummary(); 
  } else { 
    NotificationSystem.error(result.message); 
    const statusEl = document.getElementById('couponStatus');
    if (statusEl) { 
      statusEl.innerHTML = `<span style="color:var(--danger);font-weight:700;">${result.message}</span>`; 
      setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 4000); 
    }
  }
});

document.getElementById('custPhone')?.addEventListener('blur', function() {
  localStorage.setItem('professional_checkout_phone', this.value.trim());
  checkFirstOrderEligibility(this.value.trim(), false);
});

async function submitOrderImpl(e) {
  e.preventDefault();
  const name = $('#custName')?.value.trim();
  const address = $('#custAddress')?.value.trim();
  const phone = $('#custPhone')?.value.trim();
  const zoneKey = getSelectedZoneKey();
  const fb = $('#checkoutFeedback');
  
  if (!zoneKey) {
    if (fb) {
      fb.style.display = 'block';
      fb.style.background = 'var(--danger-light)';
      fb.style.color = 'var(--danger)';
      fb.textContent = '⚠️ اختر منطقة التوصيل أولاً';
    }
    $('#custZone')?.focus();
    return;
  }
  
  if (!name || !address || !phone) { 
    if (fb) { 
      fb.style.display = 'block'; 
      fb.style.background = 'var(--danger-light)'; 
      fb.style.color = 'var(--danger)'; 
      fb.textContent = '⚠️ املأ جميع الحقول'; 
    } 
    return; 
  }
  
  if (!/^01[0-9]{9}$/.test(phone)) { 
    if (fb) { 
      fb.style.display = 'block'; 
      fb.style.background = 'var(--danger-light)'; 
      fb.style.color = 'var(--danger)'; 
      fb.textContent = '⚠️ رقم هاتف غير صحيح'; 
    } 
    return; 
  }
  
  if (cartItems.length === 0) { 
    closeCheckoutModal(); 
    return; 
  }
  
  // منتجات تتطلب تفاصيل (مثلاً أضيفت قبل تفعيل الخيار) لا بد أن تكتمل قبل الإرسال
  const missingDetails = cartItems.find(i => !i.note && allProducts.find(x => x.id === i.productId)?.needsDetails === true);
  if (missingDetails) {
    await closeCheckoutAfterOrder();
    switchPage('cart');
    NotificationSystem.warning(`"${missingDetails.name}" يحتاج تفاصيل — احذفه وأضفه من جديد لتحديدها`);
    return;
  }
  
  saveCheckoutProfile(name, address, phone, zoneKey);
  
  if (appliedCoupon) {
    const validation = validateCoupon(appliedCoupon.code);
    if (!validation.valid) { 
      NotificationSystem.error(`⚠️ ${validation.message}`); 
      removeCoupon(); 
      return; 
    }
    const alreadyUsed = await hasCustomerUsedCoupon(validation.coupon, phone);
    if (alreadyUsed) {
      NotificationSystem.error('❌ لقد استخدمت هذا الكوبون من قبل. كل عميل يمكنه استخدام الكوبون مرة واحدة فقط.');
      removeCoupon();
      return;
    }
  }
  
  await checkFirstOrderEligibility(phone, false);
  
  const subtotal = cartItems.reduce((s, i) => s + ((i.finalPrice || i.price || 0)) * (i.quantity || 0), 0);
  const fs = isFreeShipping();
  let df = (fs || isFirstOrderFreeShipping()) ? 0 : getDeliveryFee();
  const cf = (selectedPaymentMethod === 'cod' ? codFee : 0);
  const disc = calculateCouponDiscount(subtotal);
  const gt = subtotal + df + cf - disc;
  
  const orderData = {
    items: cartItems.map(i => ({ 
      productId: i.productId, 
      name: i.name, 
      price: i.finalPrice || i.price || 0, 
      quantity: i.quantity, 
      image: i.image || '',
      ...(i.note ? { customNote: String(i.note).slice(0, 120) } : {}),
      ...(allProducts.find(x => x.id === i.productId)?.vendorId ? { vendorId: allProducts.find(x => x.id === i.productId).vendorId } : {})
    })),
    subtotal,
    deliveryFee: df,
    shippingZone: zoneKey,
    shippingZoneName: getZoneName(zoneKey),
    ...(isDepositRequired(df) ? { requiresDeposit: true, depositAmount: Math.min(getDepositAmount(), Math.max(0, gt)), depositPaid: false } : {}),
    codFee: cf,
    total: Math.max(0, gt),
    recipientName: name,
    address,
    phone,
    paymentMethod: selectedPaymentMethod,
    coupon: appliedCoupon ? { code: appliedCoupon.code, discount: disc } : null,
    status: 'pending',
    createdAt: Date.now()
  };
  
  const btn = $('#confirmOrder');
  if (btn) { 
    btn.disabled = true; 
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...'; 
  }
  
  if (database) {
    try {
      const nr = push(ref(database, 'orders'));
      const phoneHash = await hashFirstOrderPhone(phone);
      if (!phoneHash) throw new Error('PHONE_HASH_FAILED');

      const updates = {};
      updates['orders/' + nr.key] = orderData;
      // تقسيم الطلب على التجار: كل تاجر يرى منتجاته فقط (بدون بيانات العميل)
      const partsByVendor = {};
      orderData.items.forEach(it => {
        if (!it.vendorId) return;
        const { vendorId, ...clean } = it;
        (partsByVendor[vendorId] = partsByVendor[vendorId] || []).push(clean);
      });
      Object.entries(partsByVendor).forEach(([vid, items]) => {
        updates['vendorOrders/' + vid + '/' + nr.key] = {
          orderId: nr.key, shortId: String(nr.key).slice(-8), createdAt: orderData.createdAt, status: 'pending',
          items, subtotal: items.reduce((t, x) => t + Number(x.price || 0) * Number(x.quantity || 0), 0)
        };
      });
      updates['orderPhoneIndex/' + phoneHash] = {
        hasOrder: true,
        createdAt: Date.now()
      };
      await update(ref(database), updates);

      if (appliedCoupon) {
        const phoneHashForCoupon = await hashFirstOrderPhone(phone);
        const couponId = activeCoupons[appliedCoupon.code]?.id;
        if (couponId && phoneHashForCoupon) {
          try {
            const usedRef = ref(database, `couponUses/${couponId}/${phoneHashForCoupon}`);
            const usedSnap = await get(usedRef);
            if (!usedSnap.exists()) {
              await set(usedRef, { usedAt: Date.now() });
              try {
                await update(ref(database, `coupons/${couponId}`), {
                  usedCount: increment(1),
                  lastUsedAt: Date.now()
                });
              } catch (couponCounterError) {
                console.warn('تعذر تحديث عداد الكوبون، لكن الطلب تم حفظه:', couponCounterError);
              }
            }
          } catch (couponSyncError) {
            console.warn('تعذر مزامنة استخدام الكوبون، لكن الطلب تم حفظه:', couponSyncError);
          }
        }
      }
      
      myOrders.unshift({ orderId: nr.key, ...orderData, rejectionReason: '' });
      cartItems = [];
      saveCart();
      saveOrders();
      removeCoupon();
      await closeCheckoutAfterOrder();
      NotificationSystem.success('تم إرسال الطلب!', '🎉 تم!');
      if (orderData.requiresDeposit) NotificationSystem.warning('لتأكيد طلبك: حوّل ' + fmtMoney(orderData.depositAmount) + ' ج (إثبات جدية بقيمة الشحن) وأرسل لقطة الشاشة على واتساب. سيتم خصمها من الفاتورة.');
      renderCartPage();
      switchPage('cart');
      try { window.__orderDone && window.__orderDone({ orderId: nr.key, ...orderData }); } catch (_) {}
      if (btn) { 
        btn.disabled = false; 
        btn.innerHTML = '🚀 إرسال الطلب'; 
      }
      return;
    } catch (err) {
      console.error('❌ خطأ في إرسال الطلب:', err);
      if (err?.message === 'COUPON_ALREADY_USED') {
        NotificationSystem.error('❌ لقد استخدمت هذا الكوبون من قبل. كل عميل يمكنه استخدامه مرة واحدة فقط.');
        removeCoupon();
        if (btn) { 
          btn.disabled = false; 
          btn.innerHTML = '🚀 إرسال الطلب'; 
        }
        return;
      }
      const serverCode = err?.code || err?.message || 'UNKNOWN_ERROR';
      console.error('تفاصيل خطأ Firebase:', serverCode, err);
      if (serverCode === 'PERMISSION_DENIED' || serverCode === 'permission-denied') {
        NotificationSystem.error('تم تسجيل الدخول، لكن قواعد Firebase تمنع حفظ الطلب. يجب تحديث صلاحيات العملاء في Realtime Database.');
      } else {
        NotificationSystem.error('تعذر إرسال الطلب إلى الخادم. سلتك محفوظة، تأكد من اتصالك وحاول مرة أخرى.');
      }
      // لا نفرّغ السلة ولا نعرض نجاحًا كاذبًا: الطلب لم يصل للخادم
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🚀 إرسال الطلب';
      }
      return;
    }
  }
  
  // Local fallback (فقط عند عدم توفر قاعدة البيانات أصلًا)
  const lid = 'LOCAL-' + Date.now().toString(36).toUpperCase().slice(-6);
  myOrders.unshift({ orderId: lid, ...orderData, rejectionReason: '' });
  cartItems = [];
  saveCart();
  saveOrders();
  removeCoupon();
  await closeCheckoutAfterOrder();
  NotificationSystem.success('تم الحفظ محلياً', '🎉 تم!');
  renderCartPage();
  switchPage('cart');
  if (btn) { 
    btn.disabled = false; 
    btn.innerHTML = '🚀 إرسال الطلب'; 
  }
}

let orderSubmitInFlight = false;
$('#confirmOrder')?.addEventListener('click', async function(e) {
  e.preventDefault();
  if (orderSubmitInFlight) return;          // منع الإرسال المتكرر
  orderSubmitInFlight = true;
  const b = this;
  b.disabled = true;
  b.setAttribute('aria-busy', 'true');
  b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';
  try {
    await submitOrderImpl(e);
  } catch (err) {
    console.error('خطأ غير متوقع أثناء إرسال الطلب:', err);
    NotificationSystem.error('حدث خطأ غير متوقع، حاول مرة أخرى.');
  } finally {
    orderSubmitInFlight = false;
    b.disabled = false;
    b.removeAttribute('aria-busy');
    b.innerHTML = '🚀 إرسال الطلب';
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#checkoutModalOverlay')?.classList.contains('show')) closeCheckoutModal();
  if (e.key === 'Escape' && $('#productDetailModal')?.classList.contains('show')) closeProductDetail();
});

// ============================================================
// ===== Product Detail =====
// ============================================================
// ============================================================
// ===== تحسينات المتجر: مشابهة / اطلب مرة أخرى / سجل البحث =====
// ============================================================
// ===== محرك "المنتجات المشابهة الذكي": تشابه الاسم والوصف (عربي/إنجليزي) =====
const SIM_STOP = new Set(('في من علي الي عن مع او ثم هذا هذه ذلك تلك هو هي ده دي كل بعد قبل حتي لكل جدا ايضا كما اي ان لا ما لم لن قد تم يتم بدون ضد حسب مثل بين عند علي the and for with from your you this that new pro original اصلي جديد عرض خصم سعر جوده عاليه افضل مميز مميزه خاص خاصه للبيع متوفر متوفره قطعه قطع حبه عدد منتج منتجات مناسب مناسبه يناسب استخدام يستخدم').split(/\s+/));
function simNorm(t) {
  return String(t || '').toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
function simStem(w) {
  if (/^(وال|بال|كال|فال)/.test(w) && w.length > 5) w = w.slice(3);
  else if (/^لل/.test(w) && w.length > 4) w = w.slice(2);
  else if (/^ال/.test(w) && w.length > 4) w = w.slice(2);
  if (w.length > 4 && /ات$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 4 && /(ين|ون)$/.test(w)) w = w.slice(0, -2);
  if (w.length > 3 && /ه$/.test(w)) w = w.slice(0, -1);
  return w;
}
function simTokens(text) {
  const out = [];
  simNorm(text).split(' ').forEach(w => {
    if (!w || w.length < 2 || /^\d+$/.test(w)) return;
    const s = simStem(w);
    if (s.length < 2 || SIM_STOP.has(w) || SIM_STOP.has(s)) return;
    out.push(s);
  });
  return out;
}
function simTrigrams(text) {
  const set = new Set();
  simNorm(text).split(' ').forEach(w => { if (w.length < 3) return; const x = ' ' + w + ' '; for (let i = 0; i < x.length - 2; i++) set.add(x.substr(i, 3)); });
  return set;
}
let _simIdx = null;
function simBuildIndex(products) {
  const N = products.length, df = new Map(), docs = new Map();
  products.forEach(p => {
    const nt = simTokens(p.name), dt = simTokens(String(p.description || '').slice(0, 400));
    const uniq = new Set([...nt, ...dt]); uniq.forEach(t => df.set(t, (df.get(t) || 0) + 1));
    docs.set(p.id, { nt, dt, tri: simTrigrams(p.name) });
  });
  const idf = t => Math.log(1 + N / (1 + (df.get(t) || 0)));
  const vec = (tokens, mult, into) => { tokens.forEach(t => into.set(t, (into.get(t) || 0) + mult)); return into; };
  docs.forEach(d => {
    const vn = vec(d.nt, 1, new Map()), va = vec(d.dt, 1, vec(d.nt, 3, new Map()));
    const wn = new Map(), wa = new Map(); let nn = 0, na = 0;
    vn.forEach((tf, t) => { const w = (1 + Math.log(tf)) * idf(t); wn.set(t, w); nn += w * w; });
    va.forEach((tf, t) => { const w = (1 + Math.log(tf)) * idf(t); wa.set(t, w); na += w * w; });
    d.wn = wn; d.wa = wa; d.nn = Math.sqrt(nn) || 1; d.na = Math.sqrt(na) || 1;
  });
  return { docs, key: products, n: N };
}
function simCos(a, an, b, bn) {
  if (!a.size || !b.size) return 0;
  const [s, l] = a.size <= b.size ? [a, b] : [b, a]; let dot = 0;
  s.forEach((w, t) => { const x = l.get(t); if (x) dot += w * x; });
  return dot / (an * bn);
}
function findSimilarProducts(p, products, opts = {}) {
  if (!_simIdx || _simIdx.key !== products || _simIdx.n !== products.length) _simIdx = simBuildIndex(products);
  const A = _simIdx.docs.get(p.id); if (!A) return [];
  const catOf = opts.catKey || (x => x.category || ''), priceOf = opts.price || (x => Number(x.price) || 0);
  const myCat = catOf(p), base = priceOf(p), max = opts.max || 20, MIN = opts.min ?? 0.22;
  const scored = [];
  products.forEach(x => {
    if (x.id === p.id) return;
    const B = _simIdx.docs.get(x.id); if (!B) return;
    const cosN = simCos(A.wn, A.nn, B.wn, B.nn), cosA = simCos(A.wa, A.na, B.wa, B.na);
    let tri = 0; if (A.tri.size && B.tri.size) { let i = 0; A.tri.forEach(g => { if (B.tri.has(g)) i++; }); tri = i / (A.tri.size + B.tri.size - i); }
    const cat = catOf(x) === myCat ? 1 : 0, pd = Math.abs(priceOf(x) - base), price = 1 / (1 + pd / Math.max(base, 1));
    const score = 0.40 * cosN + 0.30 * cosA + 0.12 * tri + 0.12 * cat + 0.06 * price;
    scored.push({ x, score, text: cosN + cosA + tri, cat });
  });
  scored.forEach(o => { o.rank = o.score * ((o.x.quantity || 0) > 0 ? 1 : 0.75); });   // النافد أقل أولوية لكن لا يختفي
  let good = scored.filter(o => o.score >= MIN && o.text > 0.12);
  if (good.length < 2) {   // اسم فريد/قسم صغير: كمّل بأقرب منتجات نفس القسم
    const have = new Set(good.map(o => o.x.id));
    scored.filter(o => o.cat && !have.has(o.x.id)).sort((a, b) => b.rank - a.rank).slice(0, 4 - good.length).forEach(o => good.push(o));
  }
  good.sort((a, b) => b.rank - a.rank);
  return good.slice(0, max).map(o => o.x);
}

function renderSimilarProducts(p) {
  const wrap = document.getElementById('similarWrap'), oldRow = document.getElementById('similarRow');
  if (!wrap || !oldRow) return;
  // عنصر جديد في كل مرة: يضمن أن التمرير يبدأ من أول منتج ولا يتذكر آخر موضع
  const row = oldRow.cloneNode(false); row.innerHTML = '';
  oldRow.replaceWith(row);
  const list = findSimilarProducts(p, allProducts, { catKey: x => getStoreCategoryKey(x.category || ''), price: x => getEffectivePrice(x).finalPrice || 0, max: 20 });
  if (!list.length) { wrap.hidden = true; row.innerHTML = ''; return; }
  row.innerHTML = list.map(x => {
    const pi = getEffectivePrice(x), id = escapeStoreHtml(String(x.id));
    const oos = (x.quantity || 0) <= 0;
    return `<div class="sim-card${oos ? ' out' : ''}" data-sim-id="${id}"><div class="im">${x.image ? `<img loading="lazy" decoding="async" src="${getThumbnailUrl(x.image, 240)}" alt="">` : `<i class="fas ${x.icon || 'fa-box'}"></i>`}</div><div class="nm">${escapeStoreHtml(x.name || '')}</div><div class="pr">${oos ? '<small style="color:var(--discount);font-weight:800">نفد</small>' : `${pi.hasDiscount ? `<s>${pi.basePrice.toFixed(0)}</s>` : ''}${pi.finalPrice.toFixed(2)} ج`}</div></div>`;
  }).join('');
  row.querySelectorAll('[data-sim-id]').forEach(el => el.addEventListener('click', () => openProductDetail(el.getAttribute('data-sim-id'))));
  wrap.hidden = false;
  // ابدأ دائماً من أول منتج مشابه، وارجع لأعلى المعاينة عند فتح منتج جديد
  resetSimilarScroll();
  ['#productDetailModal', '#productDetailModal .modal-card'].forEach(sel => { const el = document.querySelector(sel); if (el) el.scrollTop = 0; });
  // المعاينة قد تكون مخفية الآن (display:none) فلا يُطبَّق التمرير — نعيده بعد ظهورها
  [0, 60, 250, 600].forEach(t => setTimeout(resetSimilarScroll, t));
}
function resetSimilarScroll() {
  const r = document.getElementById('similarRow'); if (!r) return;
  r.scrollLeft = 0; try { r.scrollTo({ left: 0, behavior: 'auto' }); } catch (_) {}
}

function reorderOrder(oid) {
  const o = (myOrders || []).find(x => x.orderId === oid); if (!o) return;
  let added = 0, skipped = 0;
  (o.items || []).forEach(i => {
    const p = allProducts.find(x => x.id === i.productId);
    if (!p || (p.quantity || 0) < 1) { skipped++; return; }
    const note = String(i.customNote || i.note || '').trim().slice(0, 120);
    const find = () => cartItems.find(c => c.productId === i.productId && String(c.note || '') === note);
    const before = find()?.quantity || 0;
    if (addToCartCore(i.productId, note) === false) { skipped++; return; }
    const line = find();
    if (line) { line.quantity = Math.min(before + Math.max(1, Number(i.quantity) || 1), p.quantity || 99); }
    added++;
  });
  saveCart(); updateBadges();
  if ($('#cartPage')?.classList.contains('active-page')) renderCartPage();
  if (added) NotificationSystem.success(`🔁 أُضيف ${added} منتج للسلة${skipped ? ` (${skipped} غير متاح حالياً)` : ''}`);
  else NotificationSystem.warning('المنتجات غير متاحة حالياً');
}

const SH_KEY = 'store_search_history';
const getSearchHistory = () => { try { return JSON.parse(localStorage.getItem(SH_KEY) || '[]').filter(Boolean).slice(0, 8); } catch (_) { return []; } };
function saveSearchHistory(q) {
  q = String(q || '').trim(); if (q.length < 2 || /^\d{8,}$/.test(q)) return;
  const h = getSearchHistory().filter(x => x !== q); h.unshift(q);
  try { localStorage.setItem(SH_KEY, JSON.stringify(h.slice(0, 10))); } catch (_) {}
}
function clearSearchHistory() { try { localStorage.removeItem(SH_KEY); } catch (_) {} }
function renderSearchHistory(box) {
  const h = getSearchHistory();
  if (!h.length) { box.hidden = true; box.innerHTML = ''; box.classList.remove('is-history'); return; }
  box.classList.add('is-history');
  box.innerHTML = `<div class="sh-box"><div class="sh-head"><span><i class="fa-solid fa-clock-rotate-left"></i> عمليات البحث الأخيرة</span><button type="button" data-sh-clear>مسح</button></div><div class="sh-chips">${h.map(q => `<button type="button" class="sh-chip" data-sh-q="${escapeStoreHtml(q)}"><i class="fa-solid fa-magnifying-glass" style="font-size:11px;opacity:.6"></i>${escapeStoreHtml(q)}</button>`).join('')}</div></div>`;
  box.hidden = false;
  box.querySelector('[data-sh-clear]')?.addEventListener('click', e => { e.stopPropagation(); clearSearchHistory(); box.hidden = true; box.innerHTML = ''; box.classList.remove('is-history'); });
  box.querySelectorAll('[data-sh-q]').forEach(b => b.addEventListener('click', () => {
    const q = b.getAttribute('data-sh-q'), inp = document.getElementById('searchInput'), clr = document.getElementById('searchClear');
    if (inp) inp.value = q; clr?.classList.add('visible');
    box.hidden = true; box.classList.remove('is-history'); saveSearchHistory(q); openSearchResultsPage(q);
  }));
}
document.addEventListener('click', e => {
  if (!e.target.closest('.search-container, .search-page-search')) closeSearchSuggestions(false);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearchSuggestions(true); });
document.addEventListener('click', e => {
  const box = document.getElementById('searchSuggestions');
  if (box && box.classList.contains('is-history') && !e.target.closest('#searchSuggestions') && e.target.id !== 'searchInput') { box.hidden = true; box.classList.remove('is-history'); }
});

function openProductDetail(productId) {
  const p = allProducts.find(x => x.id === productId);
  if (!p) return;
  currentDetailProduct = p;
  rememberRecentlyViewed(productId);
  renderRecentlyViewed();
  
  const pi = getEffectivePrice(p);
  const img = getThumbnailUrl(p.image, 600);
  
  $('#detailImage').src = img || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><rect fill=%22%23E8DCD0%22 width=%22200%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2260%22>📦</text></svg>';
  $('#detailName').textContent = p.name || 'منتج';
  $('#detailDesc').textContent = p.description || '';
  
  const priceHtml = pi.hasDiscount 
    ? `<span class="original">${pi.basePrice.toFixed(2)} ج</span> ${pi.finalPrice.toFixed(2)} ج <small style="font-size:14px;color:var(--discount);font-weight:700;">${pi.discountLabel}</small>` 
    : `${pi.basePrice.toFixed(2)} ج`;
  $('#detailPrice').innerHTML = priceHtml;
  
  const stock = (p.quantity || 0) > 0;
  $('#detailStock').textContent = !stock ? '❌ غير متوفر' : ((p.quantity || 0) <= 5 ? `🔥 متبقي ${p.quantity} قطع فقط — اطلبه قبل النفاذ` : `✅ متوفر (${p.quantity} قطعة)`);
  $('#detailStock').className = `stock-info ${stock ? 'in-stock' : 'out-of-stock'}`;
  
  const detailBarcode = normalizeStoreBarcode(p.barcode || '');
  const detailBarcodeRow = $('#detailBarcodeRow');
  const detailBarcodeValue = $('#detailBarcode');
  if (detailBarcodeRow && detailBarcodeValue) {
    detailBarcodeValue.textContent = detailBarcode;
    detailBarcodeRow.style.display = detailBarcode ? 'flex' : 'none';
  }
  
  updateStoreProductStructuredData(p);
  
  $('#detailAddToCart').disabled = !stock;
  $('#detailQuickBuy').disabled = !stock;
  $('#detailAddToCart').dataset.productId = productId;
  $('#detailQuickBuy').dataset.productId = productId;
  
  const eligibility = $('#reviewEligibility');
  if (eligibility) {
    eligibility.innerHTML = isCustomerVerifiedBuyer(productId) 
      ? '✅ لديك طلب سابق لهذا المنتج — سيظهر تقييمك كـ <b>شراء موثّق</b>.' 
      : 'شاركنا رأيك ليساعد العملاء الآخرين.';
  }
  
  selectReviewRating(5);
  $('#reviewText').value = '';
  loadProductReviews(productId);
  
  try { renderSimilarProducts(p); } catch (e) { console.warn('similar', e); }
  const modal = $('#productDetailModal');
  const modalCard = modal?.querySelector('.modal-card');
  const reviewPanel = $('#productReviewPanel');
  if (modalCard) modalCard.scrollTop = 0;
  if (reviewPanel) reviewPanel.scrollTop = 0;
  if (!modal?.classList.contains('show')) pushStoreLayerHistory('product-detail');
  modal?.classList.add('show');
  
  requestAnimationFrame(() => {
    if (modalCard) modalCard.scrollTop = 0;
    window.requestAnimationFrame(() => {
      if (modalCard) modalCard.scrollTop = 0;
    });
  });
}

function closeProductDetail(fromHistory = false) {
  const modal = $('#productDetailModal');
  const modalCard = modal?.querySelector('.modal-card');
  if (modalCard) modalCard.scrollTop = 0;
  try { resetSimilarScroll(); } catch (_) {}
  if (!modal) return;

  if (!fromHistory && modal.classList.contains('show')) {
    closeStoreLayerFromButton('product-detail', () => modal.classList.remove('show'));
    return;
  }
  modal.classList.remove('show');
}

// ===== Product preview top controls + share link =====
async function shareCurrentProduct() {
  const p = currentDetailProduct;
  if (!p || !p.id) return;

  // رابط المشاركة يمر عبر Vercel API حتى يحصل واتساب على صورة المنتج وبيانات Open Graph من السيرفر.
  const shareUrl = new URL('/api/product-share?product=' + encodeURIComponent(String(p.id)), window.location.origin).href;
  const shareData = {
    title: p.name || 'المنتج',
    text: `شاهد هذا المنتج: ${p.name || 'منتج'}`,
    url: shareUrl
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
  } catch (error) {
    if (error?.name === 'AbortError') return;
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast('✅ تم نسخ رابط المنتج للمشاركة', 'success');
  } catch (error) {
    const ta = document.createElement('textarea');
    ta.value = shareUrl;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('✅ تم نسخ رابط المنتج للمشاركة', 'success'); }
    catch (_) { showToast('⚠️ تعذر نسخ الرابط، يمكنك نسخه من شريط العنوان', 'error'); }
    ta.remove();
  }
}

$('#detailCloseTopBtn')?.addEventListener('click', () => closeProductDetail());
$('#detailShareBtn')?.addEventListener('click', shareCurrentProduct);

function handleProductUrlOnLoad() {
  const productId = new URLSearchParams(window.location.search).get('product');
  if (!productId) return;
  const product = allProducts.find(x => String(x.id) === String(productId));
  if (!product) return;
  setTimeout(() => openProductDetail(product.id), 0);
}

$('#productDetailModal')?.addEventListener('click', function(e) { 
  if (e.target === this) closeProductDetail(); 
});

$('#detailAddToCart')?.addEventListener('click', function() { 
  const pid = this.dataset.productId; 
  if (pid) addToCart(pid); 
});

$('#detailQuickBuy')?.addEventListener('click', async function() {
  const pid = this.dataset.productId;
  if (!pid) return;
  const added = await addToCart(pid);
  if (added === false) return;     // أُلغيت نافذة التفاصيل أو المنتج غير متاح
  closeProductDetail(); 
  setTimeout(openCheckoutModal, 120); 
});

document.querySelectorAll('#starPicker button').forEach(b => 
  b.addEventListener('click', () => selectReviewRating(b.dataset.rating))
);

$('#submitReviewBtn')?.addEventListener('click', submitProductReview);

// ============================================================
// ===== Store Barcode / SEO helpers =====
// ============================================================
function normalizeStoreBarcode(value) {
  return String(value ?? '')
    .trim()
    .replace(/[\s\u200B-\u200D\uFEFF]/g, '')
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

function escapeStoreHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ 
    '&': '&amp;', 
    '<': '&lt;', 
    '>': '&gt;', 
    '"': '&quot;', 
    "'": '&#39;' 
  }[ch]));
}

function setBarcodeSearchStatus(message, type = 'info') {
  const el = document.getElementById('barcodeSearchStatus');
  if (!el) return;
  el.textContent = message || '';
  el.style.color = type === 'error' 
    ? 'var(--danger)' 
    : type === 'success' 
      ? 'var(--success)' 
      : 'var(--primary-light)';
}

function findProductByBarcode(value) {
  const q = normalizeStoreBarcode(value);
  if (!q) return null;
  return allProducts.find(p => normalizeStoreBarcode(p.barcode || '') === q) || null;
}

function searchStoreByBarcode(value, openDetails = true) {
  const q = normalizeStoreBarcode(value);
  if (!q) return null;
  const p = findProductByBarcode(q);
  const inp = document.getElementById('searchInput');
  const clr = document.getElementById('searchClear');
  if (inp) inp.value = q;
  if (clr) clr.classList.add('visible');

  // عند اكتمال الباركود: اعرض كل المنتجات، واجعل المنتج المطابق هو الهدف
  // حتى يظل ظاهرًا مع باقي المنتجات ويتم الانتقال إليه تلقائيًا.
  if (p) {
    currentSearchQuery = '';
    currentCategory = 'all';
    currentPriceMin = null;
    currentPriceMax = null;
    currentSort = 'newest';
    homeVisibleLimit = 20;
    targetProductId = p.id;
    targetProductIds = [p.id];
    isTargetingProduct = false;
    syncCategoryControls('all');
    const ss = document.getElementById('sortSelect');
    if (ss) ss.value = 'newest';
    updateSearchResultsMode(false);
    renderSearchSuggestions('');
    if (document.getElementById('searchPage')?.classList.contains('active-page')) switchPage('home');
    if (document.getElementById('homePage')?.classList.contains('active-page')) renderHomeProducts();
    setBarcodeSearchStatus(`تم العثور على: ${p.name || 'المنتج'}`, 'success');
    return p;
  }

  // لو لم يكتمل/لا يوجد باركود مطابق، اترك البحث النصي يعمل بشكل طبيعي.
  activateStoreSearch(q);
  targetProductId = null;
  targetProductIds = [];
  isTargetingProduct = false;
  if (document.getElementById('homePage')?.classList.contains('active-page')) renderHomeProducts();
  setBarcodeSearchStatus('لم يتم العثور على منتج بهذا الباركود', 'error');
  return null;
}

let storeBarcodeStream = null;
let storeBarcodeTimer = null;
let storeBarcodeDetector = null;
let storeBarcodeReader = null;
let storeBarcodeHits = { value: '', count: 0 };

function stopStoreBarcodeCamera() {
  if (storeBarcodeTimer) { 
    clearTimeout(storeBarcodeTimer); 
    storeBarcodeTimer = null; 
  }
  try { storeBarcodeReader?.reset?.(); } catch (e) {}
  storeBarcodeReader = null;
  if (storeBarcodeStream) { 
    storeBarcodeStream.getTracks().forEach(t => { 
      try { t.stop(); } catch (e) {} 
    }); 
    storeBarcodeStream = null; 
  }
  storeBarcodeDetector = null;
}

function closeStoreBarcodeReader(fromHistory = false) {
  const modal = document.getElementById('storeBarcodeReaderModal');
  if (!modal) return;
  if (!fromHistory && modal.classList.contains('show')) {
    closeStoreLayerFromButton('barcode', () => {
      stopStoreBarcodeCamera();
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    });
    return;
  }
  stopStoreBarcodeCamera();
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

async function handleStoreBarcodeImage(file) {
  if (!file) return;
  setBarcodeSearchStatus('جاري قراءة الباركود من الصورة...', 'info');
  try {
    let value = '';
    if ('BarcodeDetector' in window) {
      try {
        const detector = new BarcodeDetector({ 
          formats: ['ean_8', 'ean_13', 'upc_a', 'upc_e', 'code_39', 'code_93', 'code_128', 'itf', 'codabar', 'qr_code', 'data_matrix'] 
        });
        const bitmap = await createImageBitmap(file);
        const results = await detector.detect(bitmap);
        bitmap.close?.();
        value = results?.[0]?.rawValue || '';
      } catch (e) { 
        console.warn('BarcodeDetector image failed', e); 
      }
    }
    if (!value) {
      try {
        const mod = await import('https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm');
        const ZX = mod.BrowserMultiFormatReader || mod.BrowserBarcodeReader;
        if (ZX) {
          const reader = new ZX();
          const url = URL.createObjectURL(file);
          try {
            const result = await reader.decodeFromImageUrl(url);
            value = result?.getText?.() || '';
          } finally { 
            URL.revokeObjectURL(url); 
          }
        }
      } catch (e) { 
        console.warn('ZXing image fallback failed', e); 
      }
    }
    value = normalizeStoreBarcode(value);
    if (!value) throw new Error('NO_BARCODE');
    closeStoreBarcodeReader();
    searchStoreByBarcode(value, true);
  } catch (e) {
    console.error('Barcode image read failed', e);
    setBarcodeSearchStatus('تعذر قراءة الباركود من الصورة. استخدم صورة أوضح.', 'error');
  }
}

async function startStoreBarcodeCamera() {
  const modal = document.getElementById('storeBarcodeReaderModal');
  const video = document.getElementById('storeBarcodeVideo');
  const status = document.getElementById('storeBarcodeReaderStatus');
  if (!modal || !video) return;
  stopStoreBarcodeCamera();
  if (!modal.classList.contains('show')) pushStoreLayerHistory('barcode');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  if (status) status.textContent = 'جاري تشغيل الكاميرا...';
  
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('NO_CAMERA_API');
    storeBarcodeStream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: { ideal: 'environment' }, 
        width: { ideal: 1280 }, 
        height: { ideal: 720 } 
      }, 
      audio: false 
    });
    video.srcObject = storeBarcodeStream;
    await video.play();
    
    if ('BarcodeDetector' in window) {
      try {
        storeBarcodeDetector = new BarcodeDetector({ 
          formats: ['ean_8', 'ean_13', 'upc_a', 'upc_e', 'code_39', 'code_93', 'code_128', 'itf', 'codabar'] 
        });
      } catch (e) { 
        storeBarcodeDetector = null; 
      }
    }
    
    storeBarcodeHits = { value: '', count: 0 };
    
    const scan = async () => {
      if (!storeBarcodeStream || video.readyState < 2) return;
      try {
        let value = '';
        if (storeBarcodeDetector) {
          const results = await storeBarcodeDetector.detect(video);
          value = results?.[0]?.rawValue || '';
        } else {
          return;
        }
        value = normalizeStoreBarcode(value);
        if (value) {
          if (storeBarcodeHits.value === value) storeBarcodeHits.count++;
          else storeBarcodeHits = { value, count: 1 };
          if (storeBarcodeHits.count >= 2) {
            stopStoreBarcodeCamera();
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            searchStoreByBarcode(value, true);
            return;
          }
          if (status) status.textContent = 'تم التقاط الباركود...';
        }
      } catch (e) {}
      storeBarcodeTimer = setTimeout(scan, 90);
    };
    
    if (storeBarcodeDetector) scan();
    else {
      try {
        const mod = await import('https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm');
        const Reader = mod.BrowserMultiFormatReader || mod.BrowserBarcodeReader;
        if (!Reader) throw new Error('ZXING_UNAVAILABLE');
        storeBarcodeReader = new Reader();
        if (status) status.textContent = 'وجّه الكاميرا إلى الباركود';
        storeBarcodeReader.decodeFromVideoDevice(undefined, video, (result, err) => {
          if (!result) return;
          const value = normalizeStoreBarcode(result.getText?.() || '');
          if (!value) return;
          if (storeBarcodeHits.value === value) storeBarcodeHits.count++;
          else storeBarcodeHits = { value, count: 1 };
          if (storeBarcodeHits.count >= 2) {
            stopStoreBarcodeCamera();
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
            searchStoreByBarcode(value, true);
          }
        });
      } catch (e) { 
        throw e; 
      }
    }
  } catch (e) {
    console.error('Store camera error', e);
    stopStoreBarcodeCamera();
    if (status) status.textContent = 'تعذر تشغيل الكاميرا. يمكنك اختيار صورة للباركود.';
  }
}

function updateStoreProductStructuredData(product) {
  if (!product) return;
  const barcode = normalizeStoreBarcode(product.barcode || '');
  let script = document.getElementById('storeProductStructuredData');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'storeProductStructuredData';
    document.head.appendChild(script);
  }
  const price = Number(getEffectivePrice(product).finalPrice ?? product.price ?? 0);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name || 'منتج',
    description: product.description || '',
    image: product.image ? [product.image] : undefined,
    sku: barcode || String(product.id),
    url: location.origin + location.pathname + '?product=' + encodeURIComponent(String(product.id)),
    ...(product.brand ? { brand: { '@type': 'Brand', name: String(product.brand) } } : {}),
    ...(product.rating && Number(product.rating.count) > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(product.rating.average || 0).toFixed(1), reviewCount: Number(product.rating.count) } } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EGP',
      price: price.toFixed(2),
      availability: (Number(product.quantity || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'),
      itemCondition: 'https://schema.org/NewCondition',
      url: location.origin + location.pathname + '?product=' + encodeURIComponent(String(product.id))
    }
  };
  if (/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(barcode)) data.gtin = barcode;
  script.textContent = JSON.stringify(data);
}

function updateStoreProductsStructuredData() {
  if (currentDetailProduct) updateStoreProductStructuredData(currentDetailProduct);
}

function handleBarcodeUrlOnLoad() {
  const params = new URLSearchParams(location.search);
  const barcode = normalizeStoreBarcode(params.get('barcode') || params.get('gtin') || '');
  if (barcode) searchStoreByBarcode(barcode, true);
}

// ============================================================
// ===== Load Products =====
// ============================================================
// ===== كاش المنتجات: عرض فوري من آخر نسخة محفوظة ثم تحديث من Firebase =====
const PRODUCTS_CACHE_KEY = 'store_products_cache_v1';
const PRODUCTS_CACHE_MAX_AGE = 12 * 60 * 60 * 1000;
function readProductsCache() {
  try {
    const c = JSON.parse(localStorage.getItem(PRODUCTS_CACHE_KEY) || 'null');
    if (!c || !Array.isArray(c.p) || !c.p.length) return null;
    if (Date.now() - (c.t || 0) > PRODUCTS_CACHE_MAX_AGE) return null;
    return c.p;
  } catch (_) { return null; }
}
function writeProductsCache(list) {
  try { localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({ t: Date.now(), p: list })); }
  catch (_) { try { localStorage.removeItem(PRODUCTS_CACHE_KEY); } catch (__) {} }
}
let productsFromCache = false;

function loadProducts() {
  console.log('🔄 جاري تحميل المنتجات...');
  const cached = readProductsCache();
  if (cached && !allProducts.length) {
    allProducts = cached;
    productsFromCache = true;
    try {
      renderFlashSale();
      if ($('#homePage')?.classList.contains('active-page')) renderHomeProducts();
    } catch (e) { console.warn('cache render', e); }
  }
  if (!database) { 
    console.warn('⚠️ لا يوجد اتصال بقاعدة البيانات'); 
    loadDefaultProducts(); 
    return; 
  }
  try {
    onValue(ref(database, 'products'), (snap) => {
      allProducts = [];
      if (snap.exists()) {
        snap.forEach(child => {
          const d = child.val();
          // منتجات التجار تظهر فقط بعد اعتماد المدير وطالما التاجر غير موقوف
          if (d.vendorId && (d.approval !== 'approved' || d.vendorSuspended === true)) return;
          let img = d.image || '';
          if (d.cloudinary_public_id && !img) {
            img = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${d.cloudinary_public_id}`;
          }
          img = optimizeCloudinaryUrl(img);
          allProducts.push({
            id: child.key,
            vendorId: d.vendorId || '',
            name: d.name || 'منتج',
            price: Number(d.price) || 0,
            finalPrice: d.finalPrice ? Number(d.finalPrice) : null,
            description: d.description || '',
            icon: d.icon || 'fa-box',
            image: img,
            images: (() => { const v = d.images || d.gallery || d.extraImages || d.photos; const arr = Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : []); return arr.filter(u => typeof u === 'string' && u).slice(0, 8).map(optimizeCloudinaryUrl); })(),
            quantity: d.quantity ?? 10,
            discountType: d.discountType || 'none',
            discountValue: parseFloat(d.discountValue) || 0,
            category: d.category || 'أجهزة شخصية',
            barcode: normalizeStoreBarcode(d.barcode || d.barCode || d.gtin || ''),
            createdAt: d.createdAt || Date.now(),
            rating: d.rating || { average: 0, count: 0 },
            // تفاصيل يكتبها العميل (رقم / لون ...) — بدونها لا تظهر نافذة التفاصيل
            needsDetails: d.needsDetails === true,
            detailsLabel: typeof d.detailsLabel === 'string' ? d.detailsLabel : '',
            detailsOptions: Array.isArray(d.detailsOptions) ? d.detailsOptions.filter(x => typeof x === 'string' && x) : (d.detailsOptions && typeof d.detailsOptions === 'object' ? Object.values(d.detailsOptions).filter(x => typeof x === 'string' && x) : [])
          });
        });
        console.log(`✅ تم تحميل ${allProducts.length} منتج`);
        if (allProducts.length) { writeProductsCache(allProducts); productsFromCache = false; }
      }
      if (allProducts.length === 0) { 
        console.warn('⚠️ لا توجد منتجات، جاري تحميل الافتراضية'); 
        loadDefaultProducts(); 
      }
      syncCartWithProducts();
      saveCart();
      renderFlashSale();
      renderWishlistPage();
      if ($('#homePage')?.classList.contains('active-page')) renderHomeProducts();
      updateStoreProductsStructuredData();
      if (!window.__storeBarcodeUrlHandled) { 
        window.__storeBarcodeUrlHandled = true; 
        setTimeout(handleBarcodeUrlOnLoad, 0); 
      }
      if (!window.__storeProductUrlHandled) {
        window.__storeProductUrlHandled = true;
        handleProductUrlOnLoad();
      }
    }, (err) => { 
      console.error('❌ خطأ Firebase:', err); 
      if (allProducts.length && productsFromCache) {
        NotificationSystem.warning('تعذر التحديث، بنعرض آخر نسخة محفوظة من المنتجات', 'اتصال ضعيف');
        return;
      }
      loadDefaultProducts(); 
    });
  } catch (e) { 
    console.error('❌ خطأ في تحميل المنتجات:', e); 
    loadDefaultProducts(); 
  }
}

function loadDefaultProducts() {
  console.log('📦 تحميل المنتجات الافتراضية');
  allProducts = [
    { id: '1', name: 'مجموعة أدوات حلاقة احترافية', price: 450, icon: 'fa-cut', description: 'مجموعة متكاملة للعناية الشخصية', quantity: 15, image: '', discountType: 'percent', discountValue: 10, category: 'مستلزمات شخصية', createdAt: Date.now() - 500000, rating: { average: 4.8, count: 24 } },
    { id: '2', name: 'فرشاة أسنان كهربائية', price: 320, icon: 'fa-tooth', description: 'تنظيف عميق مع 3 سرعات', quantity: 20, image: '', discountType: 'none', discountValue: 0, category: 'مستلزمات شخصية', createdAt: Date.now() - 450000, rating: { average: 4.5, count: 18 } },
    { id: '3', name: 'جهاز قهوة اسبريسو', price: 890, icon: 'fa-mug-hot', description: 'قهوة احترافية في المنزل', quantity: 8, image: '', discountType: 'none', discountValue: 0, category: 'أجهزة كهربائية', createdAt: Date.now() - 400000, rating: { average: 4.9, count: 32 } },
    { id: '4', name: 'خلاط مطبخ متعدد الاستخدامات', price: 550, icon: 'fa-blender', description: '5 سرعات مع ملحقات', quantity: 12, image: '', discountType: 'percent', discountValue: 15, category: 'أجهزة كهربائية', createdAt: Date.now() - 350000, rating: { average: 4.3, count: 15 } },
    { id: '5', name: 'هاتف ذكي 128GB', price: 3200, icon: 'fa-mobile-screen-button', description: 'شاشة 6.7 بوصة، كاميرا 108MP', quantity: 6, image: '', discountType: 'none', discountValue: 0, category: 'أجهزة شخصية', createdAt: Date.now() - 300000, rating: { average: 4.7, count: 42 } },
    { id: '6', name: 'سماعات لاسلكية', price: 399, icon: 'fa-headphones', description: 'صوت نقي مع إلغاء الضوضاء', quantity: 10, image: '', discountType: 'percent', discountValue: 20, category: 'أجهزة شخصية', createdAt: Date.now() - 250000, rating: { average: 4.4, count: 28 } },
    { id: '7', name: 'زيت أركان طبيعي', price: 180, icon: 'fa-flask', description: 'زيت عضوي 100% للعناية بالبشرة', quantity: 25, image: '', discountType: 'none', discountValue: 0, category: 'عناية طبيعية', createdAt: Date.now() - 200000, rating: { average: 4.6, count: 19 } },
    { id: '8', name: 'مجموعة كريمات عناية', price: 280, icon: 'fa-jar', description: 'مجموعة متكاملة للبشرة', quantity: 18, image: '', discountType: 'percent', discountValue: 10, category: 'عناية طبيعية', createdAt: Date.now() - 150000, rating: { average: 4.2, count: 11 } },
    { id: '9', name: 'قميص رسمي رجالي', price: 450, icon: 'fa-shirt', description: 'قطن فاخر، مقاس M-XXL', quantity: 30, image: '', discountType: 'none', discountValue: 0, category: 'ملابس', createdAt: Date.now() - 100000, rating: { average: 4.1, count: 8 } },
    { id: '10', name: 'جاكيت شتوي رجالي', price: 750, icon: 'fa-vest', description: 'مقاوم للماء والرياح', quantity: 15, image: '', discountType: 'percent', discountValue: 20, category: 'ملابس', createdAt: Date.now() - 50000, rating: { average: 4.8, count: 14 } },
    { id: '11', name: 'فستان سهرة أنيق', price: 620, icon: 'fa-dress', description: 'تصميم عصري وفاخر', quantity: 10, image: '', discountType: 'none', discountValue: 0, category: 'ملابس', createdAt: Date.now() - 30000, rating: { average: 4.9, count: 9 } },
    { id: '12', name: 'بنطلون جينز كلاسيك', price: 380, icon: 'fa-vest', description: 'جينز مريح لمختلف المناسبات', quantity: 25, image: '', discountType: 'percent', discountValue: 15, category: 'ملابس', createdAt: Date.now() - 10000, rating: { average: 4.3, count: 7 } }
  ];
  syncCartWithProducts();
  saveCart();
  renderFlashSale();
  renderWishlistPage();
  if ($('#homePage')?.classList.contains('active-page')) renderHomeProducts();
  if (!window.__storeProductUrlHandled) {
    window.__storeProductUrlHandled = true;
    handleProductUrlOnLoad();
  }
}

function syncCartWithProducts() {
  cartItems.forEach(item => {
    const p = allProducts.find(x => x.id === item.productId);
    if (p) {
      const pi = getEffectivePrice(p);
      item.maxQty = p.quantity;
      item.name = p.name;
      item.originalPrice = pi.basePrice;
      item.finalPrice = pi.finalPrice;
      item.hasDiscount = pi.hasDiscount;
      item.discountLabel = pi.discountLabel;
      if (p.image && p.image !== item.image) item.image = p.image;
    }
  });
}

// ============================================================
// ===== Flash Sale =====
// ============================================================
let flashSaleSettings = { status: 'inactive', count: 4, endTime: null };

// وقت السيرفر (مش ساعة جهاز العميل) عشان الوقت يكون واحد عند كل المستخدمين
function flashNow() { return Date.now() + (typeof promoServerOffset === 'number' ? promoServerOffset : 0); }

function parseFlashTime(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v < 1e11 ? v * 1000 : v;
  if (typeof v === 'string') {
    const t = v.trim();
    if (/^\d+(\.\d+)?$/.test(t)) { const n = Number(t); return n < 1e11 ? n * 1000 : n; }
    const d = Date.parse(t);
    return Number.isFinite(d) ? d : null;
  }
  return null;
}

// وقت الانتهاء بييجي من قاعدة البيانات فقط، ومفيش وقت افتراضي بيتولّد عند فتح الموقع.
function flashEndFromData(d) {
  if (!d || typeof d !== 'object') return null;
  for (const k of ['endTime', 'endAt', 'endsAt', 'end', 'expiresAt', 'expiry', 'endDate']) {
    const t = parseFlashTime(d[k]);
    if (t) return t;
  }
  const st = parseFlashTime(d.startTime ?? d.startedAt ?? d.startAt ?? d.start);
  let dur = null;
  if (Number(d.durationMs) > 0) dur = Number(d.durationMs);
  else if (Number(d.durationMinutes) > 0) dur = Number(d.durationMinutes) * 60000;
  else if (Number(d.durationHours) > 0 || Number(d.hours) > 0) dur = Number(d.durationHours || d.hours) * 3600000;
  else if (Number(d.duration) > 0) dur = Number(d.duration) <= 720 ? Number(d.duration) * 3600000 : Number(d.duration);
  if (st && dur) return st + dur;
  console.warn('⚠️ settings/flashSale ليس فيه وقت انتهاء صالح (endTime بالميلي ثانية):', d);
  return null;
}

function applyFlashSaleData(snap) {
  if (snap && snap.exists()) {
    const data = snap.val() || {};
    flashSaleSettings.status = data.status || 'inactive';
    flashSaleSettings.count = data.count || 4;
    flashSaleSettings.endTime = flashEndFromData(data);
  } else {
    flashSaleSettings = { status: 'inactive', count: 4, endTime: null };
  }
}

// مستمع واحد فقط لإعدادات الخصم السريع (كان بيتكرر مع كل تحديث للمنتجات)
let flashSaleListenerBound = false;
function bindFlashSaleListener() {
  if (flashSaleListenerBound || !database) return;
  flashSaleListenerBound = true;
  onValue(ref(database, 'settings/flashSale'), (snap) => {
    applyFlashSaleData(snap);
    updateFlashSaleDisplay();
    updateFlashSaleTimer();
  });
}

function renderFlashSale() {
  const container = document.getElementById('flashSaleProducts');
  const section = document.getElementById('flashSaleSection');
  if (!container || !section) return;
  bindFlashSaleListener();
  updateFlashSaleDisplay();
  updateFlashSaleTimer();
}

function updateFlashSaleDisplay() {
  const container = document.getElementById('flashSaleProducts');
  const section = document.getElementById('flashSaleSection');
  if (!container || !section) return;
  const isActive = flashSaleSettings.status === 'active';
  const hasEnd = Number.isFinite(flashSaleSettings.endTime) && flashSaleSettings.endTime > 0;
  const isExpired = hasEnd && flashNow() > flashSaleSettings.endTime;
  const hasProducts = allProducts.some(p => p.discountType !== 'none' && parseFloat(p.discountValue) > 0);
  
  if (isActive && !isExpired && hasProducts) {
    section.classList.add('active');
    section.style.display = 'block';
  } else {
    section.classList.remove('active');
    section.style.display = 'none';
    return;
  }
  
  const count = flashSaleSettings.count || 4;
  const saleProducts = allProducts
    .filter(p => (p.discountType !== 'none' && parseFloat(p.discountValue) > 0))
    .sort((a, b) => (parseFloat(b.discountValue) || 0) - (parseFloat(a.discountValue) || 0))
    .slice(0, count);
  
  if (saleProducts.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,0.7);padding:20px;">لا توجد عروض حالياً</div>';
    return;
  }
  
  container.innerHTML = saleProducts.map(p => {
    const pi = getEffectivePrice(p);
    const img = getThumbnailUrl(p.image, 200);
    return `
      <div class="product-card" style="background:rgba(255,255,255,0.95);">
        <div class="product-img-wrap" style="aspect-ratio:1/1;padding:8px;cursor:pointer;" onclick="window.openProductDetail('${p.id}')">
          ${img ? `<img src="${img}" alt="${escapeStoreHtml(p.name)}" loading="lazy" decoding="async" onerror="this.style.display='none';">` : `<i class="fas ${p.icon || 'fa-box'} product-img-placeholder"></i>`}
          <span class="discount-badge">🔥 ${pi.discountLabel}</span>
        </div>
        <div class="product-info">
          <div class="product-name">${escapeStoreHtml(p.name)}</div>
          <div class="price-row">
            <div class="price-container">
              <span class="original-price">${pi.basePrice.toFixed(2)} ج</span>
              <span class="discounted-price">${pi.finalPrice.toFixed(2)} <small>ج</small></span>
            </div>
            <button class="add-btn" data-add-id="${p.id}"><i class="fa-solid fa-cart-plus"></i> أضف للسلة</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  container.querySelectorAll('[data-add-id]').forEach(b => 
    b.addEventListener('click', () => addToCart(b.getAttribute('data-add-id')))
  );
}

function updateFlashSaleTimer() {
  const timerEl = document.getElementById('flashSaleTimer');
  if (!timerEl) return;
  const hasEnd = Number.isFinite(flashSaleSettings.endTime) && flashSaleSettings.endTime > 0;
  timerEl.style.display = hasEnd ? '' : 'none';
  if (!hasEnd) return;
  const diff = Math.max(0, flashSaleSettings.endTime - flashNow());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  const fsDays = document.getElementById('fsDays');
  const fsHours = document.getElementById('fsHours');
  const fsMinutes = document.getElementById('fsMinutes');
  const fsSeconds = document.getElementById('fsSeconds');
  
  if (fsDays) fsDays.textContent = String(days).padStart(2, '0');
  if (fsHours) fsHours.textContent = String(hours).padStart(2, '0');
  if (fsMinutes) fsMinutes.textContent = String(minutes).padStart(2, '0');
  if (fsSeconds) fsSeconds.textContent = String(seconds).padStart(2, '0');
  
  // عند انتهاء الوقت المحدد في قاعدة البيانات: يختفي العرض ولا يُعاد تشغيله تلقائياً.
  if (diff <= 0) updateFlashSaleDisplay();
}

window.__tick(updateFlashSaleTimer, 1000);

// ============================================================
// ===== Filter & Sort =====
// ============================================================
function getStoreCategoryKey(category) {
  const c = String(category || '').trim();
  if (c === 'بقالة' || c === 'مستلزمات شخصية') return 'مستلزمات شخصية';
  if (c === 'ألعاب و اكسسوارات' || c === 'العاب و اكسسوارات' || c === 'ألعاب وإكسسوارات') return 'ألعاب وإكسسوارات';
  return c;
}

function getStoreCategoryLabel(category) {
  const c = getStoreCategoryKey(category);
  return c === 'مستلزمات شخصية' ? 'البقالة' : (c || 'أجهزة شخصية');
}

function findCategoryFromSearch(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return null;
  const aliases = [
    {key:'مستلزمات شخصية', terms:['بقالة','بقاله','مستلزمات شخصية','مستلزمات شخصيه','سوبر ماركت','سوبرماركت']},
    {key:'أجهزة كهربائية', terms:['أجهزة كهربائية','اجهزة كهربائية','أجهزة كهربائيه','اجهزة كهربائيه']},
    {key:'أجهزة شخصية', terms:['أجهزة شخصية','اجهزة شخصية','أجهزة شخصيه','اجهزة شخصيه']},
    {key:'عناية طبيعية', terms:['عناية طبيعية','عنايه طبيعيه']},
    {key:'ملابس', terms:['ملابس','ملابس رجالي','ملابس حريمي','ملابس اطفال']},
    {key:'ألعاب وإكسسوارات', terms:['العاب','ألعاب','اكسسوارات','إكسسوارات','العاب و اكسسوارات','ألعاب و اكسسوارات','ألعاب وإكسسوارات']}
  ];
  const hit=aliases.find(x=>x.terms.some(t=>q===t || (q.includes(t)&&t.length>=4)));
  return hit ? hit.key : null;
}

function normalizeStoreSearchText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getProductSearchText(p) {
  return normalizeStoreSearchText([
    p.name, p.description, p.category, p.brand, p.manufacturer, p.model,
    p.barcode, p.sku, p.code
  ].filter(Boolean).join(' '));
}

function getSearchTokens(query) {
  return normalizeStoreSearchText(query).split(' ').filter(Boolean);
}

function tokenMatchesProduct(token, p, corpus) {
  if (corpus.includes(token)) return true;

  const genericCategoryMap = {
    'هاتف': ['أجهزة شخصية','هاتف','موبايل','جوال','تليفون'],
    'موبايل': ['أجهزة شخصية','هاتف','موبايل','جوال','تليفون'],
    'جوال': ['أجهزة شخصية','هاتف','موبايل','جوال','تليفون'],
    'تليفون': ['أجهزة شخصية','هاتف','موبايل','جوال','تليفون'],
    'لابتوب': ['أجهزة شخصية','كمبيوتر','لابتوب','حاسوب'],
    'كمبيوتر': ['أجهزة شخصية','كمبيوتر','لابتوب','حاسوب'],
    'العاب': ['ألعاب وإكسسوارات'],
    'ألعاب': ['ألعاب وإكسسوارات'],
    'اكسسوارات': ['ألعاب وإكسسوارات'],
    'إكسسوارات': ['ألعاب وإكسسوارات']
  };
  const aliases = genericCategoryMap[token];
  if (aliases) {
    const cat = getStoreCategoryKey(p.category || '');
    if (aliases.some(x => normalizeStoreSearchText(x) === normalizeStoreSearchText(cat) || corpus.includes(normalizeStoreSearchText(x)))) return true;
  }
  return false;
}

function getSearchMatches(query) {
  const q = String(query || '').trim();
  if (!q) return [];
  const normalized = normalizeStoreSearchText(q);
  const categoryFromSearch = findCategoryFromSearch(normalized);
  if (categoryFromSearch) {
    return allProducts.filter(p => getStoreCategoryKey(p.category || 'أجهزة شخصية') === categoryFromSearch);
  }

  // أرقام البحث تُعامل كجزء من الباركود: أثناء الكتابة، اعرض كل المنتجات
  // التي يبدأ باركودها بنفس الأرقام المكتوبة، حتى قبل اكتمال الـ 13 رقمًا.
  const barcode = normalizeStoreBarcode(q).toLowerCase();
  if (/^\d+$/.test(barcode) && barcode.length <= 13) {
    const barcodeMatches = allProducts.filter(p => {
      const productBarcode = normalizeStoreBarcode(p.barcode || '').toLowerCase();
      return productBarcode.startsWith(barcode);
    });
    if (barcodeMatches.length) return barcodeMatches;
    // لا نُسقط البحث الرقمي على الاسم إذا كان المستخدم يكتب باركودًا.
    return [];
  }

  const tokens = getSearchTokens(q);
  return allProducts.filter(p => {
    const corpus = getProductSearchText(p);
    return tokens.length > 0 && tokens.every(token => tokenMatchesProduct(token, p, corpus));
  });
}

function facetDiscountPct(p) {
  const e = getEffectivePrice(p);
  return e.hasDiscount && e.basePrice > 0 ? Math.round((1 - e.finalPrice / e.basePrice) * 100) : 0;
}

// ===== هل تقصد؟ (تصحيح إملائي بسيط) =====
function editDistance(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return dp[a.length][b.length];
}
function didYouMean(query) {
  const q = normalizeStoreSearchText(query);
  if (q.length < 3) return '';
  const words = new Map();
  allProducts.forEach(p => {
    String(p.name || '').split(/\s+/).forEach(w => { const n = normalizeStoreSearchText(w); if (n.length >= 3) words.set(n, w); });
    const c = getStoreCategoryLabel(p.category || ''); const nc = normalizeStoreSearchText(c); if (nc) words.set(nc, c);
  });
  const qTokens = q.split(/\s+/).filter(Boolean);
  const fixed = qTokens.map(t => {
    if (words.has(t) || t.length < 3) return t;
    let best = null, bd = 3;
    words.forEach((orig, n) => { const d = editDistance(t, n); if (d < bd && d <= (t.length >= 6 ? 2 : 1)) { bd = d; best = n; } });
    return best || t;
  });
  const out = fixed.join(' ');
  if (out === q) return '';
  const original = qTokens.map((t, i) => (words.get(fixed[i]) || fixed[i]));
  return getSearchMatches(out).length ? original.join(' ') : '';
}

// ===== سجل البحث للمدير (searchLogs): خفيف، ويتوقف تلقائياً لو القواعد ترفض الكتابة =====
let lastSearchLogAt = 0, lastLoggedQuery = '';
function logSearchQuery(q, n) {
  try {
    if (!database || String(q).length < 2 || /^\d+$/.test(q)) return;
    if (Date.now() < Number(localStorage.getItem('search_log_off_until') || 0)) return;
    if (Date.now() - lastSearchLogAt < 10000) return;
    if (q === lastLoggedQuery) return;
    lastLoggedQuery = q;
    lastSearchLogAt = Date.now();
    push(ref(database, 'searchLogs'), { q: String(q).slice(0, 60), n: Number(n) || 0, t: Date.now() })
      .catch(() => { try { localStorage.setItem('search_log_off_until', String(Date.now() + 24 * 3600 * 1000)); } catch (_) {} });
  } catch (_) {}
}

window.__facets = {
  state: () => ({ cats: [...storeFacets.cats], rating: storeFacets.rating, inStock: storeFacets.inStock, discount: storeFacets.discount, min: currentPriceMin, max: currentPriceMax, sort: currentSort }),
  activeCount: () => (storeFacets.cats.size ? 1 : 0) + (storeFacets.rating ? 1 : 0) + (storeFacets.inStock ? 1 : 0) + (storeFacets.discount ? 1 : 0) + ((currentPriceMin !== null || currentPriceMax !== null) ? 1 : 0),
  categories: () => {
    const m = new Map();
    allProducts.forEach(p => { const k = getStoreCategoryKey(p.category || 'أجهزة شخصية'); m.set(k, (m.get(k) || 0) + 1); });
    return [...m].map(([key, count]) => ({ key, label: getStoreCategoryLabel(key), count })).sort((a, b) => b.count - a.count);
  },
  priceBounds: () => { const v = allProducts.map(p => getEffectivePrice(p).finalPrice).filter(x => x > 0); return v.length ? [Math.floor(Math.min(...v)), Math.ceil(Math.max(...v))] : [0, 1000]; },
  preview: (t) => {
    const keep = { c: new Set(storeFacets.cats), r: storeFacets.rating, s: storeFacets.inStock, d: storeFacets.discount, mn: currentPriceMin, mx: currentPriceMax };
    storeFacets.cats = new Set(t.cats || []); storeFacets.rating = t.rating || 0; storeFacets.inStock = !!t.inStock; storeFacets.discount = t.discount || 0;
    currentPriceMin = t.min ?? null; currentPriceMax = t.max ?? null;
    let n = 0; try { n = getFilteredAndSortedProducts().length; } finally {
      storeFacets.cats = keep.c; storeFacets.rating = keep.r; storeFacets.inStock = keep.s; storeFacets.discount = keep.d; currentPriceMin = keep.mn; currentPriceMax = keep.mx;
    }
    return n;
  },
  apply: (t) => {
    storeFacets.cats = new Set(t.cats || []); storeFacets.rating = t.rating || 0; storeFacets.inStock = !!t.inStock; storeFacets.discount = t.discount || 0;
    currentPriceMin = (t.min === null || t.min === undefined || isNaN(t.min)) ? null : Number(t.min);
    currentPriceMax = (t.max === null || t.max === undefined || isNaN(t.max)) ? null : Number(t.max);
    if (storeFacets.cats.size) { currentCategory = 'all'; try { syncCategoryControls('all'); } catch (_) {} }
    const pm = document.getElementById('priceMin'), px = document.getElementById('priceMax');
    if (pm) pm.value = currentPriceMin ?? ''; if (px) px.value = currentPriceMax ?? '';
    homeVisibleLimit = 20;
    if (t.sort && t.sort !== currentSort) {
      const opt = document.querySelector('[data-select-id="sortSelect"] .pretty-select-option[data-value="' + t.sort + '"]');
      currentSort = t.sort;
      if (opt) opt.click();
    }
    if (document.getElementById('searchPage')?.classList.contains('active-page')) renderSearchPage(); else renderHomeProducts();
    const sp = document.getElementById('searchPageSortSelect'); if (sp && t.sort) sp.value = t.sort;
  },
  reset: () => window.__facets.apply({ cats: [], rating: 0, inStock: false, discount: 0, min: null, max: null, sort: currentSort }),
  didYouMean
};

function getFilteredAndSortedProducts() {
  let f = [...allProducts];

  if (currentCategory !== 'all') {
    const selected = getStoreCategoryKey(currentCategory);
    f = f.filter(p => getStoreCategoryKey(p.category || 'أجهزة شخصية') === selected);
  }

  if (currentSearchQuery) {
    const matches = getSearchMatches(currentSearchQuery);
    const ids = new Set(matches.map(p => String(p.id)));
    f = f.filter(p => ids.has(String(p.id)));
  }

  if (currentPriceMin !== null && !isNaN(currentPriceMin)) {
    f = f.filter(p => getEffectivePrice(p).finalPrice >= currentPriceMin);
  }
  if (currentPriceMax !== null && !isNaN(currentPriceMax)) {
    f = f.filter(p => getEffectivePrice(p).finalPrice <= currentPriceMax);
  }

  // ===== فلاتر متقدمة (Facets) =====
  if (storeFacets.cats.size) f = f.filter(p => storeFacets.cats.has(getStoreCategoryKey(p.category || 'أجهزة شخصية')));
  if (storeFacets.rating) f = f.filter(p => (p.rating?.count || 0) > 0 && (p.rating?.average || 0) >= storeFacets.rating);
  if (storeFacets.inStock) f = f.filter(p => (p.quantity ?? 1) > 0);
  if (storeFacets.discount) f = f.filter(p => facetDiscountPct(p) >= storeFacets.discount);

  switch (currentSort) {
    case 'discount': f.sort((a,b) => facetDiscountPct(b) - facetDiscountPct(a) || (b.createdAt||0) - (a.createdAt||0)); break;
    case 'rating': f.sort((a,b) => ((b.rating?.average||0) - (a.rating?.average||0)) || ((b.rating?.count||0) - (a.rating?.count||0))); break;
    case 'newest': f.sort((a,b) => (b.createdAt||0) - (a.createdAt||0)); break;
    case 'oldest': f.sort((a,b) => (a.createdAt||0) - (b.createdAt||0)); break;
    case 'price-asc': f.sort((a,b) => getEffectivePrice(a).finalPrice - getEffectivePrice(b).finalPrice); break;
    case 'price-desc': f.sort((a,b) => getEffectivePrice(b).finalPrice - getEffectivePrice(a).finalPrice); break;
    case 'name-asc': f.sort((a,b) => (a.name||'').localeCompare(b.name||'','ar')); break;
    default: f.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  }
  return f;
}

// ============================================================
// ===== Render Home Products =====
// ============================================================
var homeAppendFrom = 0; // var لتفادي خطأ الاستدعاء المبكر
function renderHomeProducts() {
  const g = $('#productsContainer');
  const rc = $('#resultsCount');
  if (!g) return;
  
  let f = getFilteredAndSortedProducts();
  
  // أثناء البحث لا نغيّر ترتيب الشبكة ولا نعزل المنتج المطابق؛
  // الإطار الذهبي فقط هو الذي يوضح النتيجة.
  if (!currentSearchQuery) {
    if (Array.isArray(targetProductIds) && targetProductIds.length > 0) {
      const linked = targetProductIds
        .map(id => allProducts.find(p => String(p.id) === String(id)))
        .filter(Boolean);
      if (linked.length > 0) {
        const linkedIds = new Set(linked.map(p => String(p.id)));
        f = [...linked, ...f.filter(p => !linkedIds.has(String(p.id)))];
      }
    } else if (targetProductId) {
      const targetProduct = allProducts.find(p => p.id === targetProductId);
      if (targetProduct && (targetProduct.category === currentCategory || currentCategory === 'all')) {
        f = f.filter(p => p.id !== targetProductId);
        f.unshift(targetProduct);
      }
    }
  }
  
  const totalMatches = f.length;
  const visibleProducts = f.slice(0, homeVisibleLimit);
  if (rc) rc.textContent = `${totalMatches} منتج`;
  
  if (allProducts.length === 0) { 
    g.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1;"><i class="fa-solid fa-spinner fa-spin"></i> جاري تحميل المنتجات...</div>'; 
    return; 
  }
  
  if (f.length === 0) { 
    g.innerHTML = `
      <div class="search-no-results">
        <span class="icon">🔍</span>
        <h3>لا توجد نتائج</h3>
        <button type="button" class="btn btn-outline" id="noResultsResetBtn">إعادة ضبط</button>
      </div>
    `; 
    document.getElementById('noResultsResetBtn')?.addEventListener('click', e=>{
      e.preventDefault();
      window.resetAllFilters();
    });
    return; 
  }
  
  let cardsArr = visibleProducts.map(p => {
    const av = (p.quantity || 0) > 0;
    const img = getThumbnailUrl(p.image, 400);
    const hi = p.image && p.image.length > 0;
    const pi = getEffectivePrice(p);
    const cn = p.category || 'أجهزة شخصية';
    const ci = CATEGORIES.find(c => c.id === cn)?.icon || 'fa-box';
    const inWishlist = wishlist.includes(p.id);
    const rating = p.rating || { average: 0, count: 0 };
    const stars = '★'.repeat(Math.round(rating.average)) + '☆'.repeat(5 - Math.round(rating.average));
    
    let ph = pi.hasDiscount 
      ? `<div class="price-container">
          <span class="original-price">${pi.basePrice.toFixed(2)} ج</span>
          <span class="discounted-price">${pi.finalPrice.toFixed(2)} <small>ج</small></span>
          <span class="discount-label">🏷️ ${pi.discountLabel}</span>
        </div>` 
      : `<span class="price">${pi.basePrice.toFixed(2)} <small>ج</small></span>`;
    
    const isHighlighted = (targetProductId && String(p.id) === String(targetProductId))
      || (Array.isArray(targetProductIds) && targetProductIds.some(id => String(id) === String(p.id)));
    const highlightClass = isHighlighted ? 'highlighted-product' : '';
    
    return `
      <div class="product-card ${highlightClass}" id="product-${p.id}" 
        style="${isHighlighted ? 'border-color: var(--accent); box-shadow: 0 0 0 4px rgba(201,169,110,0.4), 0 8px 28px rgba(201,169,110,0.2); transition: all 0.5s ease;' : ''}">
        <button class="wishlist-btn ${inWishlist ? 'active' : ''}" data-wishlist-id="${p.id}">
          <i class="fa-${inWishlist ? 'solid' : 'regular'} fa-heart"></i>
        </button>
        <div class="product-img-wrap" onclick="window.openProductDetail('${p.id}')">
          ${hi ? `<img src="${img}" alt="${escapeStoreHtml(p.name || '')}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
          <i class="fas ${p.icon || 'fa-box'} product-img-placeholder" style="${hi ? 'display:none;' : ''}"></i>
          ${pi.hasDiscount ? `<span class="discount-badge"><i class="fa-solid fa-tag"></i> ${pi.discountLabel}</span>` : ''}

          <span class="category-badge"><i class="fa-solid ${ci}"></i> ${getStoreCategoryLabel(cn)}</span>
        </div>
        <div class="product-info">
          <div class="product-name">${escapeStoreHtml(p.name || '')}</div>
          <div class="product-meta"><div class="product-rating"><span class="stars">${stars}</span> (${rating.count})</div><button type="button" class="compare-btn-mini" title="مقارنة" aria-label="مقارنة" data-compare-id="${p.id}"><i class="fa-solid fa-scale-balanced"></i><span>قارن</span></button></div>
          <div class="product-desc">${escapeStoreHtml(p.description || '')}</div>
          ${(() => {
            const qty = Number(p.quantity ?? 0);
            const status = qty <= 0
              ? { cls: 'stock-out', text: '✗ نفذ' }
              : qty <= 5
                ? { cls: 'stock-low', text: '🔥 متبقي ' + qty + ' فقط' }
                : { cls: 'stock-available', text: '✓ متوفر' };
            return `<div class="stock-badge ${status.cls}">${status.text}</div>`;
          })()}
          <div class="price-row">
            ${ph}
            <button class="add-btn" ${!av ? 'disabled' : ''} data-add-id="${p.id}">
              <i class="fa-solid fa-cart-plus"></i> أضف للسلة
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  // وضع الإضافة فقط: نُبقي البطاقات الحالية كما هي ونضيف الجديدة بعدها
  const appendFrom = homeAppendFrom; homeAppendFrom = 0;
  const existingCards = g.querySelectorAll(':scope > .product-card');
  const canAppend = appendFrom > 0
    && existingCards.length === appendFrom
    && cardsArr.length > appendFrom
    && existingCards[appendFrom - 1].id === 'product-' + visibleProducts[appendFrom - 1].id;
  let bindRoot = g;
  if (canAppend) {
    const tmp = document.createElement('div');
    tmp.innerHTML = cardsArr.slice(appendFrom).join('');
    bindRoot = document.createDocumentFragment();
    while (tmp.firstChild) bindRoot.appendChild(tmp.firstChild);
    const newNodes = [...bindRoot.querySelectorAll('.product-card')];
    g.appendChild(bindRoot);
    bindRoot = { querySelectorAll: sel => newNodes.flatMap(n => [...n.querySelectorAll(sel)]) };
  } else {
    g.innerHTML = cardsArr.join('');
  }

  const moreWrap=document.getElementById('loadMoreWrap');
  const moreBtn=document.getElementById('loadMoreBtn');
  const moreCount=document.getElementById('loadMoreCount');
  const hasMore=totalMatches>homeVisibleLimit;
  if(moreWrap) moreWrap.hidden=!hasMore;
  if(moreBtn) moreBtn.disabled=!hasMore;
  if(moreCount) moreCount.textContent=hasMore?`عرض ${visibleProducts.length} من ${totalMatches} منتج`:'';

  bindRoot.querySelectorAll('[data-add-id]').forEach(b => 
    b.addEventListener('click', () => addToCart(b.getAttribute('data-add-id')))
  );
  bindRoot.querySelectorAll('[data-wishlist-id]').forEach(b => 
    b.addEventListener('click', () => toggleWishlist(b.getAttribute('data-wishlist-id')))
  );
  bindRoot.querySelectorAll('[data-compare-id]').forEach(b => 
    b.addEventListener('click', (e) => {
      e.stopPropagation(); 
      toggleCompare(b.getAttribute('data-compare-id'));
    })
  );
  
  const activeTargetIds = Array.isArray(targetProductIds) && targetProductIds.length
    ? targetProductIds.map(String)
    : (targetProductId ? [String(targetProductId)] : []);

  if (activeTargetIds.length > 0 && !isTargetingProduct) {
    isTargetingProduct = true;
    setTimeout(() => {
      const targetElement = activeTargetIds
        .map(id => document.getElementById(`product-${id}`))
        .find(Boolean);

      if (targetElement) {
        // Keep the selected product fully visible below the fixed header.
        // Store the exact resulting position so later page navigation can restore it.
        const headerOffset = Math.max(72, document.querySelector('header')?.getBoundingClientRect().height || 0) + 12;
        const targetTop = window.scrollY + targetElement.getBoundingClientRect().top - headerOffset;
        const finalTop = Math.max(0, targetTop);
        window.scrollTo({ top: finalTop, behavior: 'smooth' });
        setHomeProductRestoreAnchor(targetElement.id.replace(/^product-/, ''), finalTop);
      }

      setTimeout(() => {
        if (targetProductId) targetProductId = null;
        targetProductIds = [];
        isTargetingProduct = false;
        captureHomeRestoreState();
      }, 5000);
    }, 250);
  } else if (activeTargetIds.length === 0) {
    isTargetingProduct = false;
  }
}

// ============================================================
// ===== Add to Cart =====
// ============================================================
function addToCart(pid) {
  const p = allProducts.find(x => x.id === pid);
  if (p && p.needsDetails === true && (p.quantity || 0) > 0) {
    // المنتج يحتاج تفاصيل (رقم / لون ...) فنطلبها من العميل أولًا
    return askProductDetails(p).then(note => (note === null ? false : addToCartCore(pid, note)));
  }
  return addToCartCore(pid, '');
}

function productQtyInCart(pid, exceptIdx = -1) {
  return cartItems.reduce((s, i, k) => s + (i.productId === pid && k !== exceptIdx ? (i.quantity || 0) : 0), 0);
}

function addToCartCore(pid, note = '') {
  const p = allProducts.find(x => x.id === pid);
  if (!p) { 
    NotificationSystem.error('المنتج غير موجود'); 
    return false; 
  }
  if ((p.quantity || 0) < 1) { 
    NotificationSystem.warning(`"${p.name}" غير متوفر`); 
    return false; 
  }
  note = String(note || '').trim().slice(0, 120);
  const pi = getEffectivePrice(p);
  // نفس المنتج بتفاصيل مختلفة (رقم 1 / رقم 5) يكون سطرًا مستقلًا في السلة
  const ei = cartItems.findIndex(i => i.productId === pid && String(i.note || '') === note);
  const label = note ? ` (${note})` : '';
  
  if (productQtyInCart(pid) >= (p.quantity || 0)) {
    NotificationSystem.warning(`الحد الأقصى لـ"${p.name}"`);
    return false;
  }
  if (ei >= 0) {
    const item = cartItems[ei];
    item.quantity = (item.quantity || 0) + 1;
    item.originalPrice = pi.basePrice;
    item.finalPrice = pi.finalPrice;
    item.hasDiscount = pi.hasDiscount;
    item.discountLabel = pi.discountLabel;
    saveCart();
    NotificationSystem.success(`تمت زيادة "${p.name}"${label}`);
  } else {
    cartItems.push({
      productId: p.id,
      name: p.name,
      originalPrice: pi.basePrice,
      finalPrice: pi.finalPrice,
      price: pi.finalPrice,
      hasDiscount: pi.hasDiscount,
      discountLabel: pi.discountLabel,
      image: p.image || '',
      icon: p.icon || 'fa-box',
      quantity: 1,
      maxQty: p.quantity || 99,
      ...(note ? { note } : {}),
      ...(p.needsDetails === true ? { detailsLabel: p.detailsLabel || '', detailsOptions: Array.isArray(p.detailsOptions) ? p.detailsOptions : [] } : {})
    });
    saveCart();
    NotificationSystem.success(`تمت إضافة "${p.name}"${label}`);
  }
  if ($('#cartPage')?.classList.contains('active-page')) renderCartPage();
  return true;
}

// نافذة جميلة تطلب من العميل تفاصيل المنتج. تُرجع النص أو null عند الإلغاء.
function askProductDetails(p, current = '') {
  return new Promise(resolve => {
    const label = String(p.detailsLabel || 'اكتب التفاصيل المطلوبة (مثال: الرقم أو اللون)');
    const options = Array.isArray(p.detailsOptions) ? p.detailsOptions.filter(Boolean) : [];
    const ov = document.createElement('div');
    ov.className = 'pd-overlay';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = `
      <div class="pd-box">
        <div class="pd-icon"><i class="fa-solid fa-pen-to-square"></i></div>
        <div class="pd-title">تفاصيل طلبك</div>
        <div class="pd-prod">${escapeStoreHtml(p.name || '')}</div>
        <label class="pd-label" for="pdInput">${escapeStoreHtml(label)}</label>
        ${options.length ? `<div class="pd-chips">${options.map(o => `<button type="button" class="pd-chip" data-v="${escapeStoreHtml(o)}">${escapeStoreHtml(o)}</button>`).join('')}</div>` : ''}
        <input id="pdInput" class="pd-input" type="text" maxlength="120" autocomplete="off" placeholder="${options.length ? 'أو اكتب تفاصيل أخرى...' : 'اكتب هنا...'}">
        <div class="pd-error" id="pdError"></div>
        <div class="pd-actions">
          <button type="button" class="pd-ok"><i class="fa-solid fa-cart-plus"></i> ${current ? 'حفظ التفاصيل' : 'إضافة للسلة'}</button>
          <button type="button" class="pd-cancel">إلغاء</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('show'));
    const input = ov.querySelector('#pdInput');
    const err = ov.querySelector('#pdError');
    input.value = current || '';
    const sync = () => ov.querySelectorAll('.pd-chip').forEach(c => c.classList.toggle('on', c.dataset.v === input.value.trim()));
    sync();
    ov.querySelectorAll('.pd-chip').forEach(c => c.addEventListener('click', () => { input.value = c.dataset.v; err.textContent = ''; sync(); input.focus(); }));
    input.addEventListener('input', () => { err.textContent = ''; sync(); });
    let done = false;
    const close = v => {
      if (done) return; done = true;
      document.removeEventListener('keydown', onKey, true);
      ov.classList.remove('show'); setTimeout(() => ov.remove(), 220);
      resolve(v);
    };
    const submit = () => {
      const v = input.value.trim();
      if (!v) { err.textContent = '⚠️ من فضلك اكتب التفاصيل المطلوبة أولاً'; input.focus(); input.classList.add('shake'); setTimeout(() => input.classList.remove('shake'), 400); return; }
      close(v);
    };
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(null); }
      else if (e.key === 'Enter' && document.activeElement === input) { e.preventDefault(); submit(); }
    };
    document.addEventListener('keydown', onKey, true);
    ov.querySelector('.pd-ok').addEventListener('click', submit);
    ov.querySelector('.pd-cancel').addEventListener('click', () => close(null));
    ov.addEventListener('click', e => { if (e.target === ov) close(null); });
    setTimeout(() => input.focus(), 120);
  });
}

// ============================================================
// ===== Wishlist =====
// ============================================================
function toggleWishlist(pid) {
  const idx = wishlist.indexOf(pid);
  if (idx >= 0) { 
    wishlist.splice(idx, 1); 
    NotificationSystem.info('تمت الإزالة من المفضلة'); 
  } else { 
    wishlist.push(pid); 
    NotificationSystem.success('تمت الإضافة إلى المفضلة'); 
  }
  saveWishlist();
  const __inList = wishlist.includes(pid);
  const __onList = document.getElementById('wishlistPage')?.classList.contains('active-page');
  const __onDeals = document.getElementById('dealsPage')?.classList.contains('active-page');
  if (!__onList && !__onDeals) {
    document.querySelectorAll('.wishlist-btn[data-wishlist-id]').forEach(b => {
      if (String(b.getAttribute('data-wishlist-id')) !== String(pid)) return;
      b.classList.toggle('active', __inList);
      b.setAttribute('aria-pressed', __inList ? 'true' : 'false');
      b.setAttribute('aria-label', __inList ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة');
      const ic = b.querySelector('i');
      if (ic) { ic.classList.toggle('fa-solid', __inList); ic.classList.toggle('fa-regular', !__inList); }
    });
    return;
  }
  if (document.getElementById('dealsPage')?.classList.contains('active-page')) {
    renderDealsPage();
  } else if (document.getElementById('searchPage')?.classList.contains('active-page')) {
    renderSearchPage();
  } else if (document.getElementById('wishlistPage')?.classList.contains('active-page')) {
    renderWishlistPage();
  } else {
    renderHomeProducts();
  }
}

// ============================================================
// ===== Setup Categories & Filters =====
// ============================================================
function syncCategoryControls(value) {
  currentCategory=value||'all';
  const a=document.getElementById('categorySelect');
  const b=document.getElementById('sortCategorySelect');
  if(a) a.value=currentCategory;
  if(b) b.value=currentCategory;
}

function setupPrettySelects(){
  document.querySelectorAll('.pretty-select-wrap').forEach(w=>{
    if(w.dataset.prettyReady==='1') return;
    const native=w.querySelector('.pretty-select-native'), trigger=w.querySelector('.pretty-select-trigger'), valueEl=w.querySelector('.pretty-select-value'), options=[...w.querySelectorAll('.pretty-select-option')];
    if(!native||!trigger||!valueEl||!options.length) return;
    const sync=()=>{const val=native.value,opt=options.find(x=>x.dataset.value===val)||options[0];options.forEach(x=>x.classList.toggle('active',x===opt));valueEl.textContent=opt.textContent.replace(/✓/g,'').trim();};
    trigger.addEventListener('click',e=>{e.stopPropagation();document.querySelectorAll('.pretty-select-wrap.open').forEach(x=>{if(x!==w)x.classList.remove('open')});w.classList.toggle('open');trigger.setAttribute('aria-expanded',w.classList.contains('open')?'true':'false');});
    options.forEach(opt=>opt.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();native.value=opt.dataset.value;native.dispatchEvent(new Event('change',{bubbles:true}));sync();w.classList.remove('open');trigger.setAttribute('aria-expanded','false');}));
    native.addEventListener('change',sync); sync(); w.dataset.prettyReady='1';
  });
  if(!window.__prettySelectOutside){document.addEventListener('click',()=>document.querySelectorAll('.pretty-select-wrap.open').forEach(w=>w.classList.remove('open')));window.__prettySelectOutside=true;}
}

function setupCategoriesAndFilters() {
  const categoryHandler=value=>{
    syncCategoryControls(value);
    homeVisibleLimit=20;
    targetProductId=null;
    isTargetingProduct=false;
    renderHomeProducts();
  };
  $('#categorySelect')?.addEventListener('change',e=>categoryHandler(e.target.value));
  $('#sortCategorySelect')?.addEventListener('change',e=>categoryHandler(e.target.value));
  $('#sortSelect')?.addEventListener('change',function(){
    currentSort=this.value;
    homeVisibleLimit=20;
    renderHomeProducts();
  });
  $('#applyPriceFilter')?.addEventListener('click',()=>{
    const mn=$('#priceMin')?.value, mx=$('#priceMax')?.value;
    currentPriceMin=mn!==''&&!isNaN(parseFloat(mn))?parseFloat(mn):null;
    currentPriceMax=mx!==''&&!isNaN(parseFloat(mx))?parseFloat(mx):null;
    if(currentPriceMin!==null&&currentPriceMax!==null&&currentPriceMin>currentPriceMax){
      NotificationSystem.warning('السعر الأدنى أكبر من الأعلى');return;
    }
    homeVisibleLimit=20;
    targetProductId=null;isTargetingProduct=false;
    renderHomeProducts();
  });
  $('#resetFilters')?.addEventListener('click',resetAllFilters);
  $('#loadMoreBtn')?.addEventListener('click',()=>{
    // إضافة المنتجات الجديدة فقط بعد آخر منتج ظاهر دون إعادة بناء الشبكة (بلا اهتزاز ولا قفز)
    homeAppendFrom=document.querySelectorAll('#productsContainer > .product-card').length;
    homeVisibleLimit+=20;
    targetProductId=null;targetProductIds=[];isTargetingProduct=false;
    renderHomeProducts();
  });
}

window.resetAllFilters = function() {
  storeFacets.cats.clear(); storeFacets.rating = 0; storeFacets.inStock = false; storeFacets.discount = 0;
  currentCategory='all';
  currentSort='newest';
  currentPriceMin=null;
  currentPriceMax=null;
  currentSearchQuery='';
  homeVisibleLimit=20;
  isSearchResultsMode=false;
  targetProductId=null;
  targetProductIds=[];
  isTargetingProduct=false;
  syncCategoryControls('all');
  const ss=$('#sortSelect');
  if(ss) ss.value='newest';
  document.querySelectorAll('.pretty-select-wrap').forEach(w=>{
    const native=w.querySelector('.pretty-select-native');
    const valueEl=w.querySelector('.pretty-select-value');
    const options=[...w.querySelectorAll('.pretty-select-option')];
    if(!native || !valueEl || !options.length) return;
    const opt=options.find(x=>x.dataset.value===native.value)||options[0];
    options.forEach(x=>x.classList.toggle('active',x===opt));
    if(opt) valueEl.textContent=opt.textContent.replace(/✓/g,'').trim();
  });

  const pm=$('#priceMin'), px=$('#priceMax'); if(pm) pm.value=''; if(px) px.value='';
  const si=$('#searchInput'); if(si) si.value='';
  const sc=$('#searchClear'); if(sc) sc.classList.remove('visible');
  setBarcodeSearchStatus('');
  updateSearchResultsMode(false);
  renderSearchSuggestions('');
  renderSearchSuggestions('','searchPageSuggestions');
  renderHomeProducts();
};

// ============================================================
// ===== Search =====
// ============================================================
function updateSearchResultsMode(active){
  isSearchResultsMode=!!active;
  const heading=document.getElementById('searchResultsHeading');
  const title=document.getElementById('searchResultsTitle');
  if(heading) heading.hidden=!active;
  if(title) title.textContent=currentSearchQuery?`نتائج البحث عن «${currentSearchQuery}»`:'نتائج البحث';
  document.body.classList.toggle('search-results-mode',!!active);
  document.getElementById('homePage')?.classList.toggle('is-search-results',!!active);
}

function closeSearchSuggestions(blur){
  clearTimeout(sugDebounceT);
  ['searchSuggestions','searchPageSuggestions'].forEach(id=>{
    const b=document.getElementById(id);
    if(b){ b.hidden=true; b.innerHTML=''; b.classList.remove('is-history'); }
  });
  if(blur){
    ['searchInput','searchPageInput'].forEach(id=>{
      const i=document.getElementById(id);
      if(i && document.activeElement===i) i.blur();
    });
  }
}
window.closeSearchSuggestions=closeSearchSuggestions;

function renderSearchSuggestions(query, targetId='searchSuggestions') {
  const box=document.getElementById(targetId);
  if(!box) return;
  const q=String(query||'').trim();
  if(!q){
    const inpEl=document.getElementById('searchInput');
    if(targetId==='searchSuggestions' && inpEl && document.activeElement===inpEl){ renderSearchHistory(box); return; }
    box.hidden=true;
    box.innerHTML='';
    box.classList.remove('is-history');
    return;
  }
  box.classList.remove('is-history');

  const normalized=normalizeStoreSearchText(q);
  const category=findCategoryFromSearch(normalized);
  const matches=getSearchMatches(q);
  const preview=matches.slice(0,5);
  let html='';

  if(category){
    html+=`<button type="button" class="search-suggestion-category" data-search-category="${escapeStoreHtml(category)}">
      <span class="suggestion-icon"><i class="fa-solid fa-layer-group"></i></span>
      <span><strong>عرض قسم ${escapeStoreHtml(getStoreCategoryLabel(category))}</strong><small>${matches.length} منتج مطابق</small></span>
      <i class="fa-solid fa-arrow-left"></i>
    </button>`;
  }

  preview.forEach(p=>{
    const img=getThumbnailUrl(p.image,120);
    const pi=getEffectivePrice(p);
    const hasImg=!!p.image;
    html+=`<button type="button" class="search-suggestion-item" data-search-product="${escapeStoreHtml(String(p.id))}">
      <span class="suggestion-thumb">${hasImg?`<img loading="lazy" decoding="async" src="${img}" alt="${escapeStoreHtml(p.name||'')}">`:`<i class="fas ${p.icon||'fa-box'}"></i>`}</span>
      <span class="suggestion-info"><strong>${escapeStoreHtml(p.name||'منتج')}</strong><small>${escapeStoreHtml(getStoreCategoryLabel(p.category||''))} • ${pi.finalPrice.toFixed(2)} ج</small></span>
      <i class="fa-solid fa-chevron-left suggestion-arrow"></i>
    </button>`;
  });

  if(matches.length>preview.length){
    html+=`<button type="button" class="search-suggestion-all" data-search-all="1">
      <span>عرض كل النتائج (${matches.length})</span><i class="fa-solid fa-arrow-left"></i>
    </button>`;
  }

  if(!html){
    const dym=didYouMean(q);
    html=`<div class="search-suggestion-empty"><i class="fa-solid fa-magnifying-glass"></i><span>لا توجد نتائج مطابقة</span></div>`;
    if(dym) html+=`<button type="button" class="search-suggestion-item search-dym" data-dym="${escapeStoreHtml(dym)}"><span class="suggestion-info"><strong>هل تقصد: ${escapeStoreHtml(dym)}؟</strong><small>اضغط لعرض النتائج</small></span><i class="fa-solid fa-chevron-left suggestion-arrow"></i></button>`;
  }

  box.innerHTML=html;
  box.hidden=false;

  box.querySelector('[data-dym]')?.addEventListener('click',(ev)=>{
    const v=ev.currentTarget.dataset.dym; const i=document.getElementById('searchInput'); if(i) i.value=v; saveSearchHistory(v); openSearchResultsPage(v);
  });
  box.querySelector('[data-search-category]')?.addEventListener('click',()=>{
    openSearchResultsPage(q);
  });
  box.querySelectorAll('[data-search-product]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const p=allProducts.find(x=>String(x.id)===String(btn.dataset.searchProduct));
      closeSearchSuggestions(true);
      if(p) showSingleSearchResult(p);
    });
  });
  box.querySelector('[data-search-all]')?.addEventListener('click',()=>openSearchResultsPage(q));
}

function activateStoreSearch(query){
  currentSearchQuery=String(query||'').trim();
  homeVisibleLimit=20;
  targetProductId=null;
  targetProductIds=[];
  isTargetingProduct=false;
  updateSearchResultsMode(!!currentSearchQuery);
  if($('#homePage')?.classList.contains('active-page')) renderHomeProducts();
}

function showSingleSearchResult(product){
  currentSearchQuery='';
  isSearchResultsMode=false;
  updateSearchResultsMode(false);
  currentCategory='all';
  currentPriceMin=null;
  currentPriceMax=null;
  currentSort='newest';
  homeVisibleLimit=20;
  targetProductId=product?.id || null;
  targetProductIds=product ? [product.id] : [];
  isTargetingProduct=false;
  syncCategoryControls('all');
  const ss=document.getElementById('sortSelect'); if(ss) ss.value='newest';
  const pm=document.getElementById('priceMin'),px=document.getElementById('priceMax');
  if(pm) pm.value=''; if(px) px.value='';
  const inp=document.getElementById('searchInput'),clr=document.getElementById('searchClear');
  if(inp) inp.value='';
  if(clr) clr.classList.remove('visible');
  closeSearchSuggestions(true);
  switchPage('home');
  if(document.getElementById('homePage')?.classList.contains('active-page')) renderHomeProducts();
  setTimeout(()=>{
    const el=document.getElementById(`product-${product?.id}`);
    if(el){
      const headerOffset=Math.max(72,document.querySelector('header')?.getBoundingClientRect().height||0)+12;
      const top=Math.max(0,window.scrollY+el.getBoundingClientRect().top-headerOffset);
      window.scrollTo({top,behavior:'smooth'});
      setHomeProductRestoreAnchor(product?.id, top);
      setTimeout(() => captureHomeRestoreState(), 850);
    }
  },260);
}

function openSearchResultsPage(query){
  const q=String(query||'').trim();
  if(!q) return;
  closeSearchSuggestions(true);

  const matches=getSearchMatches(q);
  const categoryFromSearch=findCategoryFromSearch(normalizeStoreSearchText(q));

  // البحث عن قسم (مثل "بقالة") يفتح صفحة القسم كاملة، بنفس ترتيب المتجر
  // وليس نتيجة واحدة أو شبكة معزولة.
  if(categoryFromSearch){
    currentSearchQuery='';
    currentCategory=categoryFromSearch;
  } else if(matches.length===1){
    // البحث عن منتج محدد فقط يبقي سلوك التمييز الحالي.
    showSingleSearchResult(matches[0]);
    return;
  } else {
    // البحث عن اسم/ماركة (مثل Samsung) يعرض جميع المنتجات المطابقة.
    currentSearchQuery=q;
    currentCategory='all';
  }

  homeVisibleLimit=20;
  targetProductId=null;
  targetProductIds=[];
  isTargetingProduct=false;
  updateSearchResultsMode(false);
  populateSearchPageControls();
  switchPage('search');
  renderSearchPage();
}

function syncSearchPageControls(){
  const cat=document.getElementById('searchPageCategorySelect');
  const sort=document.getElementById('searchPageSortSelect');
  const mn=document.getElementById('searchPagePriceMin');
  const mx=document.getElementById('searchPagePriceMax');
  if(cat) cat.value=currentCategory;
  if(sort) sort.value=currentSort;
  if(mn) mn.value=currentPriceMin ?? '';
  if(mx) mx.value=currentPriceMax ?? '';
}

function populateSearchPageControls(){
  // القوائم الأساسية موجودة كـ <select> HTML لتستفيد من CSS الأصلي
  // ولا يتم إنشاء قائمة بديلة من JavaScript.
  syncSearchPageControls();
}

function renderSearchPage(){
  const container=document.getElementById('searchPageProductsContainer');
  if(!container) return;
  populateSearchPageControls();

  // صفحة نتائج البحث لا تحتاج اختيار قسم مرة أخرى؛ القسم/الاسم الذي بحث عنه العميل
  // هو بالفعل سبب فتح هذه الصفحة. نُبقي فقط الترتيب والسعر كأدوات إضافية.
  const filterBar=document.getElementById('searchPageFilterBar');
  const categoryGroup=filterBar?.querySelector('.filter-group:first-child');
  if(categoryGroup) categoryGroup.style.display='none';

  const title=document.getElementById('searchPageTitle');
  const subtitle=document.getElementById('searchPageSubtitle');
  const hint=document.getElementById('searchPageResultHint');
  const input=document.getElementById('searchPageInput');
  const matches=getFilteredAndSortedProducts();
  const total=matches.length;
  const visible=matches.slice(0,homeVisibleLimit);
  const searchLabel=currentSearchQuery || (currentCategory!=='all' ? getStoreCategoryLabel(currentCategory) : '');

  if(input && currentSearchQuery && input.value!==currentSearchQuery) input.value=currentSearchQuery;
  if(title) title.textContent=`نتائج البحث عن «${searchLabel}»`;
  if(subtitle) subtitle.textContent=`${total} منتج متاح — استخدم الترتيب والسعر للوصول لما تريد`;
  if(hint) hint.textContent=total?`${total} نتيجة`:'';
  const count=document.getElementById('searchPageResultsCount');
  if(count) count.textContent=`${total} منتج`;

  if(currentSearchQuery) logSearchQuery(currentSearchQuery, total);
  if(!total){
    container.innerHTML=`<div class="search-no-results search-page-empty"><span class="icon">🔍</span><h3>لم نجد منتجات مطابقة</h3><p>جرّب اسمًا آخر أو امسح التصفية.</p>${(()=>{const d=didYouMean(currentSearchQuery);return d?`<p>هل تقصد: <a href="#" id="searchPageDym" style="font-weight:900;color:var(--accent-dark)">${escapeStoreHtml(d)}</a>؟</p>`:'';})()}<button class="btn btn-outline" type="button" id="searchPageEmptyReset">إعادة ضبط التصفية</button></div>`;
    document.getElementById('searchPageEmptyReset')?.addEventListener('click',resetSearchPageFilters);
    document.getElementById('searchPageDym')?.addEventListener('click',(ev)=>{ev.preventDefault();openSearchResultsPage(ev.currentTarget.textContent);});
  }else{
    container.innerHTML=renderProductCardsHtml(visible);
    bindProductGridEvents(container);
  }

  renderSearchSimilar(matches);
  const wrap=document.getElementById('searchPageLoadMoreWrap');
  const btn=document.getElementById('searchPageLoadMoreBtn');
  const more=document.getElementById('searchPageLoadMoreCount');
  const hasMore=total>homeVisibleLimit;
  if(wrap) wrap.hidden=!hasMore;
  if(btn) btn.disabled=!hasMore;
  if(more) more.textContent=hasMore?`عرض ${visible.length} من ${total} منتج`:'';
}

function renderSearchSimilar(matches){
  const anchor=document.getElementById('searchPageLoadMoreWrap');
  if(!anchor) return;
  let wrap=document.getElementById('searchSimilarWrap');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='searchSimilarWrap';
    wrap.className='sim-wrap search-sim-wrap';
    anchor.insertAdjacentElement('afterend',wrap);
  }
  let list=[], title='منتجات مشابهة لنتائج بحثك';
  try{
    const have=new Set(matches.map(m=>m.id));
    const seen=new Set();
    (matches.slice(0,3)).forEach(m=>{
      findSimilarProducts(m,allProducts,{catKey:x=>getStoreCategoryKey(x.category||''),price:x=>getEffectivePrice(x).finalPrice||0,max:12})
        .forEach(x=>{ if(!have.has(x.id)&&!seen.has(x.id)){seen.add(x.id);list.push(x);} });
    });
    if(!matches.length){
      title='قد يعجبك أيضاً';
      const cat=currentCategory!=='all'?currentCategory:null;
      list=allProducts.filter(x=>(x.quantity||0)>0&&(!cat||getStoreCategoryKey(x.category||'')===cat)).slice(0,12);
    }
  }catch(e){ list=[]; }
  list=list.slice(0,16);
  if(!list.length){ wrap.hidden=true; wrap.innerHTML=''; return; }
  wrap.innerHTML=`<div class="sim-title"><i class="fa-solid fa-layer-group"></i> ${title}</div><div class="sim-row">${list.map(x=>{
    const pi=getEffectivePrice(x), oos=(x.quantity||0)<=0;
    return `<div class="sim-card${oos?' out':''}" data-sim-id="${escapeStoreHtml(String(x.id))}"><div class="im">${x.image?`<img loading="lazy" decoding="async" src="${getThumbnailUrl(x.image,240)}" alt="">`:`<i class="fas ${x.icon||'fa-box'}"></i>`}</div><div class="nm">${escapeStoreHtml(x.name||'')}</div><div class="pr">${oos?'<small style="color:var(--discount);font-weight:800">نفد</small>':`${pi.hasDiscount?`<s>${pi.basePrice.toFixed(0)}</s> `:''}${pi.finalPrice.toFixed(2)} ج`}</div></div>`;
  }).join('')}</div>`;
  wrap.hidden=false;
  wrap.querySelectorAll('[data-sim-id]').forEach(el=>el.addEventListener('click',()=>openProductDetail(el.getAttribute('data-sim-id'))));
}

function renderProductCardsHtml(products){
  return products.map(p=>{
    const av=(p.quantity||0)>0;
    const img=getThumbnailUrl(p.image,400);
    const hi=!!p.image;
    const pi=getEffectivePrice(p);
    const cn=p.category||'أجهزة شخصية';
    const ci=CATEGORIES.find(c=>getStoreCategoryKey(c.id)===getStoreCategoryKey(cn))?.icon||'fa-box';
    const inWishlist=wishlist.includes(p.id);
    const rating=p.rating||{average:0,count:0};
    const stars='★'.repeat(Math.round(rating.average))+'☆'.repeat(5-Math.round(rating.average));
    const ph=pi.hasDiscount
      ? `<div class="price-container"><span class="original-price">${pi.basePrice.toFixed(2)} ج</span><span class="discounted-price">${pi.finalPrice.toFixed(2)} <small>ج</small></span><span class="discount-label">🏷️ ${escapeStoreHtml(pi.discountLabel)}</span></div>`
      : `<span class="price">${pi.basePrice.toFixed(2)} <small>ج</small></span>`;
    return `<div class="product-card" id="search-product-${escapeStoreHtml(String(p.id))}">
      <button class="wishlist-btn ${inWishlist?'active':''}" data-wishlist-id="${escapeStoreHtml(String(p.id))}"><i class="fa-${inWishlist?'solid':'regular'} fa-heart"></i></button>
      <div class="product-img-wrap" data-open-product="${escapeStoreHtml(String(p.id))}">
        ${hi?`<img src="${img}" alt="${escapeStoreHtml(p.name||'')}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`:''}
        <i class="fas ${p.icon||'fa-box'} product-img-placeholder" style="${hi?'display:none;':''}"></i>
        ${pi.hasDiscount?`<span class="discount-badge"><i class="fa-solid fa-tag"></i> ${escapeStoreHtml(pi.discountLabel)}</span>`:''}
        <span class="category-badge"><i class="fa-solid ${ci}"></i> ${escapeStoreHtml(getStoreCategoryLabel(cn))}</span>
      </div>
      <div class="product-info">
        <div class="product-name">${escapeStoreHtml(p.name||'')}</div>
        <div class="product-meta"><div class="product-rating"><span class="stars">${stars}</span> (${rating.count})</div><button type="button" class="compare-btn-mini" title="مقارنة" aria-label="مقارنة" data-compare-id="${escapeStoreHtml(String(p.id))}"><i class="fa-solid fa-scale-balanced"></i><span>قارن</span></button></div>
        <div class="product-desc">${escapeStoreHtml(p.description||'')}</div>
        ${(()=>{const qty=Number(p.quantity??0);const st=qty<=0?{cls:'stock-out',text:'✗ نفذ'}:qty<=5?{cls:'stock-low',text:'🔥 متبقي '+qty+' فقط'}:{cls:'stock-available',text:'✓ متوفر'};return `<div class="stock-badge ${st.cls}">${st.text}</div>`;})()}
        <div class="price-row">${ph}<button class="add-btn" ${!av?'disabled':''} data-add-id="${escapeStoreHtml(String(p.id))}"><i class="fa-solid fa-cart-plus"></i> أضف للسلة</button></div>
      </div>
    </div>`;
  }).join('');
}

function bindProductGridEvents(container){
  container.querySelectorAll('[data-add-id]').forEach(b=>b.addEventListener('click',()=>addToCart(b.getAttribute('data-add-id'))));
  container.querySelectorAll('[data-wishlist-id]').forEach(b=>b.addEventListener('click',()=>toggleWishlist(b.getAttribute('data-wishlist-id'))));
  container.querySelectorAll('[data-compare-id]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();toggleCompare(b.getAttribute('data-compare-id'));}));
  container.querySelectorAll('[data-open-product]').forEach(el=>el.addEventListener('click',()=>openProductDetail(el.getAttribute('data-open-product'))));
}

function resetSearchPageFilters(){
  storeFacets.cats.clear(); storeFacets.rating = 0; storeFacets.inStock = false; storeFacets.discount = 0;
  currentCategory='all';
  currentSort='newest';
  currentPriceMin=null;
  currentPriceMax=null;
  currentSearchQuery='';
  homeVisibleLimit=20;
  targetProductId=null;
  targetProductIds=[];
  isTargetingProduct=false;
  const inp=document.getElementById('searchInput');
  const clr=document.getElementById('searchClear');
  if(inp) inp.value='';
  if(clr) clr.classList.remove('visible');
  syncCategoryControls('all');
  const ss=document.getElementById('sortSelect');
  if(ss) ss.value='newest';
  const pm=document.getElementById('priceMin'), px=document.getElementById('priceMax');
  if(pm) pm.value='';
  if(px) px.value='';
  updateSearchResultsMode(false);
  renderSearchSuggestions('');
  renderSearchSuggestions('','searchPageSuggestions');
  switchPage('home');
  renderHomeProducts();
}

function setupSearch() {
  const inp=$('#searchInput'), clr=$('#searchClear');
  if(!inp||!clr) return;
  let t;

  const handleTyping=(value, inputEl, clearEl, suggestionId)=>{
    const q=String(value||'').trim();
    clearEl?.classList.toggle('visible',q.length>0);
    clearTimeout(t);
    if(!q){
      renderSearchSuggestions('',suggestionId);
      return;
    }
    clearTimeout(sugDebounceT);
    sugDebounceT = setTimeout(() => renderSearchSuggestions(q,suggestionId), 200);

    // الباركود يُتعرف عليه من الكتابة أيضاً: أظهر المنتجات التي يبدأ باركودها بالأرقام المكتوبة.
    const normalizedBarcode = normalizeStoreBarcode(q);
    if (/^\d{1,13}$/.test(normalizedBarcode)) {
      currentSearchQuery = q;
      currentCategory = 'all';
      currentPriceMin = null;
      currentPriceMax = null;
      homeVisibleLimit = 20;
      targetProductId = null;
      targetProductIds = [];
      isTargetingProduct = false;
      updateSearchResultsMode(true);
      renderHomeProducts();
      return;
    }

    t=setTimeout(()=>{
      const exact=findProductByBarcode(normalizeStoreBarcode(q));
      if(exact) return;
      const matches=getSearchMatches(q);
      if(matches.length===1){
        // Keep the home page intact while the user is still typing.
        return;
      }
    },180);
  };

  inp.addEventListener('input',function(){handleTyping(this.value,inp,clr,'searchSuggestions');});
  inp.addEventListener('focus',()=>{ if(!inp.value.trim()) renderSearchSuggestions('', 'searchSuggestions'); });
  inp.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      e.preventDefault();
      const q=inp.value.trim();
      if(!q) return;
      closeSearchSuggestions(true);
      saveSearchHistory(q);
      const normalizedBarcode = normalizeStoreBarcode(q);
      const exact=findProductByBarcode(normalizedBarcode);
      if(/^\d{13}$/.test(normalizedBarcode) && exact){
        // عند اكتمال 13 رقم: أظهر المنتج داخل باقي المنتجات وانتقل إليه.
        showSingleSearchResult(exact);
        return;
      }
      if(exact && /^\d+$/.test(normalizedBarcode)){
        showSingleSearchResult(exact);
        return;
      }
      const matches=getSearchMatches(q);
      if(matches.length===1){showSingleSearchResult(matches[0]);return;}
      openSearchResultsPage(q);
    }
  });

  clr.addEventListener('click',()=>{
    inp.value='';
    clr.classList.remove('visible');
    currentSearchQuery='';
    currentCategory='all';
    currentPriceMin=null;
    currentPriceMax=null;
    currentSort='newest';
    targetProductId=null;
    targetProductIds=[];
    isTargetingProduct=false;
    homeVisibleLimit=20;
    syncCategoryControls('all');
    const ss=document.getElementById('sortSelect');
    if(ss) ss.value='newest';
    const pm=document.getElementById('priceMin'), px=document.getElementById('priceMax');
    if(pm) pm.value='';
    if(px) px.value='';
    updateSearchResultsMode(false);
    setBarcodeSearchStatus('');
    renderSearchSuggestions('');
    if($('#homePage')?.classList.contains('active-page')) renderHomeProducts();
    inp.focus();
  });

  const pageInput=document.getElementById('searchPageInput');
  const pageClear=document.getElementById('searchPageClear');
  pageInput?.addEventListener('input',function(){
    const q=this.value.trim();
    pageClear?.classList.toggle('visible',!!q);
    renderSearchSuggestions(q,'searchPageSuggestions');
  });
  pageInput?.addEventListener('keydown',e=>{
    if(e.key!=='Enter') return;
    e.preventDefault();
    const q=pageInput.value.trim();
    if(!q) return;
    closeSearchSuggestions(true);
    const exact=findProductByBarcode(normalizeStoreBarcode(q));
    if(exact){searchStoreByBarcode(normalizeStoreBarcode(q),true);return;}
    const matches=getSearchMatches(q);
    if(matches.length===1){showSingleSearchResult(matches[0]);return;}
    currentSearchQuery=q;
    currentCategory='all';
    homeVisibleLimit=20;
    renderSearchPage();
  });
  pageClear?.addEventListener('click',()=>{
    pageInput.value='';
    pageClear.classList.remove('visible');
    currentSearchQuery='';
    currentCategory='all';
    currentPriceMin=null;
    currentPriceMax=null;
    currentSort='newest';
    homeVisibleLimit=20;
    targetProductId=null;
    targetProductIds=[];
    isTargetingProduct=false;
    renderSearchSuggestions('','searchPageSuggestions');
    switchPage('home');
  });

  document.getElementById('searchPageCategorySelect')?.addEventListener('change',e=>{
    currentCategory=e.target.value;
    homeVisibleLimit=20;
    renderSearchPage();
  });
  document.getElementById('searchPageSortSelect')?.addEventListener('change',e=>{
    currentSort=e.target.value;
    homeVisibleLimit=20;
    renderSearchPage();
  });
  document.getElementById('searchPageApplyPrice')?.addEventListener('click',()=>{
    const mn=document.getElementById('searchPagePriceMin')?.value;
    const mx=document.getElementById('searchPagePriceMax')?.value;
    currentPriceMin=mn!==''&&!isNaN(parseFloat(mn))?parseFloat(mn):null;
    currentPriceMax=mx!==''&&!isNaN(parseFloat(mx))?parseFloat(mx):null;
    if(currentPriceMin!==null&&currentPriceMax!==null&&currentPriceMin>currentPriceMax){
      NotificationSystem.warning('السعر الأدنى أكبر من الأعلى');return;
    }
    homeVisibleLimit=20;
    renderSearchPage();
  });
  document.getElementById('searchPageResetFilters')?.addEventListener('click',resetSearchPageFilters);
  document.getElementById('searchPageLoadMoreBtn')?.addEventListener('click',()=>{
    homeVisibleLimit+=20;
    renderSearchPage();
  });

  // Camera barcode buttons share the existing scanner implementation.
  const cameraBtn=document.getElementById('barcodeSearchCameraBtn');
  const pageCameraBtn=document.getElementById('searchPageCameraBtn');
  const readerModal=document.getElementById('storeBarcodeReaderModal');
  const readerFile=document.getElementById('storeBarcodeImageInput');
  const startScanner=()=>startStoreBarcodeCamera();
  cameraBtn?.addEventListener('click',startScanner);
  pageCameraBtn?.addEventListener('click',startScanner);
  document.getElementById('restartStoreBarcodeReader')?.addEventListener('click',startScanner);
  document.getElementById('closeStoreBarcodeReader')?.addEventListener('click',closeStoreBarcodeReader);
  document.getElementById('uploadStoreBarcodeImage')?.addEventListener('click',()=>readerFile?.click());
  readerFile?.addEventListener('change',()=>{
    const f=readerFile.files?.[0];
    if(f) handleStoreBarcodeImage(f);
    readerFile.value='';
  });
  readerModal?.addEventListener('click',e=>{if(e.target===readerModal)closeStoreBarcodeReader();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeStoreBarcodeReader();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopStoreBarcodeCamera();});
}
// ============================================================
// ===== Logo =====
// ============================================================
// ============================================================
// ===== صفحة العروض والخصومات =====
// ============================================================
let dealsMin = 0, dealsSort = 'disc', dealsTimer = null;
function dealPct(p) {
  const pi = getEffectivePrice(p);
  return pi.hasDiscount && pi.basePrice > 0 ? Math.round((1 - pi.finalPrice / pi.basePrice) * 100) : 0;
}
function dealsCountdownText() {
  const end = window.__store && window.__store.flashEnd;
  if (!end) return null;
  const d = Math.max(0, end - flashNow()), z = v => String(v).padStart(2, '0');
  const days = Math.floor(d / 86400000);
  return `${days ? days + 'ي ' : ''}${z(Math.floor(d % 86400000 / 3600000))}:${z(Math.floor(d % 3600000 / 60000))}:${z(Math.floor(d % 60000 / 1000))}`;
}
function startDealsTimer() {
  window.__untick(dealsTimer);
  const tick = () => {
    const el = document.getElementById('dealsCd');
    if (!el || !document.getElementById('dealsPage')?.classList.contains('active-page')) { window.__untick(dealsTimer); return; }
    const t = dealsCountdownText();
    el.textContent = t || '';
    const box = el.closest('.dl-cd'); if (box) box.style.display = t ? '' : 'none';
  };
  tick(); dealsTimer = window.__tick(tick, 1000);
}
function renderDealsPage() {
  const root = document.getElementById('dealsPageContent');
  if (!root) return;
  const all = allProducts.filter(p => dealPct(p) > 0);
  const cnt = m => all.filter(p => dealPct(p) >= m).length;
  let list = all.filter(p => dealPct(p) >= dealsMin);
  const price = p => getEffectivePrice(p).finalPrice;
  if (dealsSort === 'disc') list.sort((a, b) => dealPct(b) - dealPct(a));
  else if (dealsSort === 'low') list.sort((a, b) => price(a) - price(b));
  else if (dealsSort === 'high') list.sort((a, b) => price(b) - price(a));
  else list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const tabs = [[0, 'كل العروض'], [10, '10% فأكثر'], [25, '25% فأكثر'], [50, '50% فأكثر']];
  const save = list.reduce((t, p) => t + (getEffectivePrice(p).basePrice - price(p)), 0);
  root.innerHTML = `
    <div class="dl-hero">
      <div><div class="dl-eyebrow">⚡ عروض اليوم</div><h2>خصومات حصرية على منتجاتك المفضلة</h2>
      <p>${all.length} منتج مخفّض${all.length ? ` — وفّر حتى ${Math.max(0, ...all.map(dealPct))}%` : ''}</p></div>
      <div class="dl-cd"><small>ينتهي العرض خلال</small><b id="dealsCd">--:--:--</b></div>
    </div>
    <div class="dl-bar">
      <div class="dl-tabs">${tabs.map(t => `<button type="button" class="${dealsMin === t[0] ? 'on' : ''}" data-min="${t[0]}">${t[1]} <em>${cnt(t[0])}</em></button>`).join('')}</div>
      <select id="dealsSortSel" aria-label="ترتيب العروض">
        <option value="disc">الأعلى خصماً</option><option value="low">الأقل سعراً</option><option value="high">الأعلى سعراً</option><option value="new">الأحدث</option>
      </select>
    </div>
    ${list.length ? `<div class="dl-note">🏷️ ${list.length} عرض ظاهر — إجمالي التوفير لو اشتريت الكل ${save.toFixed(2)} ج</div>` : ''}
    <div class="products-grid" id="dealsGrid">${list.length ? renderProductCardsHtml(list) : `<div class="search-no-results"><span class="icon">🏷️</span><h3>لا توجد عروض في هذا النطاق حالياً</h3><button type="button" class="btn btn-outline" id="dealsResetBtn">عرض كل العروض</button></div>`}</div>`;
  root.querySelector('#dealsSortSel').value = dealsSort;
  root.querySelector('#dealsSortSel').addEventListener('change', e => { dealsSort = e.target.value; renderDealsPage(); });
  root.querySelectorAll('[data-min]').forEach(b => b.addEventListener('click', () => { dealsMin = Number(b.dataset.min); renderDealsPage(); }));
  root.querySelector('#dealsResetBtn')?.addEventListener('click', () => { dealsMin = 0; renderDealsPage(); });
  bindProductGridEvents(root.querySelector('#dealsGrid'));
  startDealsTimer();
}

function setupStoreSocialLinks(){
  const box=document.getElementById('storeSocialLinks');
  if(!box||!database) return;
  get(ref(database,'settings/contact')).then(snap=>{
    if(!snap.exists()) return;
    const d=snap.val()||{};
    const phoneRaw=String(d.phone||'').trim();
    const phoneDigits=phoneRaw.replace(/[^0-9+]/g,'');
    storeWhatsappNumber=String(d.whatsapp||'').replace(/[^0-9]/g,'');window.__waNum=storeWhatsappNumber;
    const links={
      phone:phoneDigits?`tel:${phoneDigits}`:'',
      whatsapp:d.whatsapp?`https://wa.me/${String(d.whatsapp).replace(/[^0-9]/g,'')}`:'',
      facebook:/^https?:\/\//i.test(d.facebook||'')?d.facebook:'',
      instagram:/^https?:\/\//i.test(d.instagram||'')?d.instagram:'',
      email:d.email?`mailto:${d.email}`:''
    };
    box.querySelectorAll('[data-social]').forEach(a=>{
      const url=links[a.dataset.social]||'';
      if(url){a.href=url;if(!url.startsWith('mailto:')){a.target='_blank';a.rel='noopener noreferrer';}}
      else a.style.display='none';
    });
  }).catch(()=>{});
}

function loadLogo() {
  if (!database) return;
  try {
    loadSettingCached('settings/logo', 60 * 60 * 1000, d => {
      const l = $('#logoDisplay');
      if (d && l) {
        let u = d.url ? getThumbnailUrl(d.url, 100) : (d.base64 || '');
        if (u) {
          l.innerHTML = `<img src="${u}" alt="Logo" style="width:100%;height:auto;object-fit:contain;" loading="lazy">`;
        }
      }
    });
  } catch (e) {}
}

// ============================================================
// ===== Language =====
// ============================================================
function setupLanguage() {
  $$('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      $$('.lang-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const lang = this.dataset.lang;
      if (lang === 'en') {
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = 'en';
        const mainEl = document.querySelector('.brand-name .main');
        const subEl = document.querySelector('.brand-name .sub');
        const subEnEl = document.querySelector('.brand-name .sub-en');
        if (mainEl) mainEl.innerHTML = 'Professional Souq <span class="highlight">✦</span>';
        if (subEl) subEl.textContent = 'Premium Store';
        if (subEnEl) subEnEl.textContent = 'سوق بروفيشنال • تنوع • جودة';
      } else {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
        const mainEl = document.querySelector('.brand-name .main');
        const subEl = document.querySelector('.brand-name .sub');
        const subEnEl = document.querySelector('.brand-name .sub-en');
        if (mainEl) mainEl.innerHTML = 'سوق بروفيشنال <span class="highlight">✦</span>';
        if (subEl) subEl.textContent = 'Professional Souq';
        if (subEnEl) subEnEl.textContent = 'Premium • Quality • Luxury';
      }
    });
  });
}

// ============================================================
// ===== About Page =====
// ============================================================
function renderAboutPage() {
  const container = document.getElementById('aboutContent');
  if (!container) return;
  if (database) {
    get(ref(database, 'settings/about')).then((snap) => {
      if (snap.exists()) {
        const data = snap.val();
        container.innerHTML = `
          <h2>${data.title || 'من نحن'}</h2>
          <p>${data.content || 'نحن سوق بروفيشنال نقدم لكم أفضل المنتجات الفاخرة والعصرية بجودة عالية وأسعار تنافسية.'}</p>
          ${data.extra ? `<p>${data.extra}</p>` : ''}
        `;
      } else {
        container.innerHTML = `
          <h2>من نحن</h2>
          <p>نحن سوق بروفيشنال نقدم لكم أفضل المنتجات الفاخرة والعصرية بجودة عالية وأسعار تنافسية. نسعى دائماً لتوفير تجربة تسوق مميزة لعملائنا الكرام.</p>
          <p>نؤمن بأن الجودة هي أساس الثقة، ولذلك نختار بعناية كل منتج نضيفه إلى متجرنا.</p>
        `;
      }
    }).catch(() => {
      container.innerHTML = `
        <h2>من نحن</h2>
        <p>نحن سوق بروفيشنال نقدم لكم أفضل المنتجات الفاخرة والعصرية بجودة عالية وأسعار تنافسية. نسعى دائماً لتوفير تجربة تسوق مميزة لعملائنا الكرام.</p>
      `;
    });
  } else {
    container.innerHTML = `
      <h2>من نحن</h2>
      <p>نحن سوق بروفيشنال نقدم لكم أفضل المنتجات الفاخرة والعصرية بجودة عالية وأسعار تنافسية.</p>
    `;
  }
}

// ============================================================
// ===== Contact Page =====
// ============================================================
function renderContactPage() {
  const grid = document.getElementById('contactInfoGrid');
  if (!grid) return;
  if (database) {
    get(ref(database, 'settings/contact')).then((snap) => {
      if (snap.exists()) {
        const data = snap.val();
        grid.innerHTML = `
          <a href="tel:${data.phone || ''}" class="contact-info-item">
            <i class="fa-solid fa-phone"></i>
            <div class="contact-text">
              <div class="info-label">📞 هاتف</div>
              <div class="info-value">${data.phone || 'غير متوفر'}</div>
            </div>
          </a>
          <a href="https://wa.me/${(data.whatsapp || '').replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer" class="contact-info-item">
            <i class="fa-brands fa-whatsapp" style="color:#25D366;"></i>
            <div class="contact-text">
              <div class="info-label">💬 واتساب</div>
              <div class="info-value">${data.whatsapp || 'غير متوفر'}</div>
            </div>
          </a>
          <a href="${/^https?:\/\//i.test(data.facebook||'')?data.facebook:'#'}" target="_blank" rel="noopener noreferrer" class="contact-info-item">
            <i class="fa-brands fa-facebook" style="color:#1877F2;"></i>
            <div class="contact-text">
              <div class="info-label">📘 فيسبوك</div>
              <div class="info-value">${data.facebook ? 'صفحتنا على فيسبوك' : 'غير متوفر'}</div>
            </div>
          </a>
          <a href="mailto:${data.email || ''}" class="contact-info-item">
            <i class="fa-solid fa-envelope"></i>
            <div class="contact-text">
              <div class="info-label">✉️ بريد إلكتروني</div>
              <div class="info-value">${data.email || 'غير متوفر'}</div>
            </div>
          </a>
        `;
      } else {
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--primary-light);">
            <i class="fa-solid fa-info-circle" style="font-size:40px;display:block;margin-bottom:10px;"></i>
            <p>لا توجد بيانات تواصل حالياً</p>
          </div>
        `;
      }
    }).catch(() => {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--primary-light);">
          <p>لا توجد بيانات تواصل حالياً</p>
        </div>
      `;
    });
  } else {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--primary-light);">
        <p>لا توجد بيانات تواصل حالياً</p>
      </div>
    `;
  }
}

// ===== Contact Form Submit =====
document.getElementById('sendContactBtn')?.addEventListener('click', async function() {
  const email = document.getElementById('contactEmail')?.value.trim();
  const subject = document.getElementById('contactSubject')?.value.trim();
  const message = document.getElementById('contactMessage')?.value.trim();
  
  if (!email || !subject || !message) { 
    NotificationSystem.warning('⚠️ يرجى ملء جميع الحقول'); 
    return; 
  }
  if (!email.includes('@') || !email.includes('.')) { 
    NotificationSystem.warning('⚠️ بريد إلكتروني غير صحيح'); 
    return; 
  }
  
  const btn = this;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';
  
  try {
    if (database) {
      const contactRef = push(ref(database, 'contactMessages'));
      await set(contactRef, { 
        email, 
        subject, 
        message, 
        createdAt: Date.now(), 
        read: false 
      });
      NotificationSystem.success('✅ تم إرسال رسالتك بنجاح!');
      document.getElementById('contactEmail').value = '';
      document.getElementById('contactSubject').value = '';
      document.getElementById('contactMessage').value = '';
    } else {
      const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
      messages.push({ email, subject, message, createdAt: Date.now() });
      localStorage.setItem('contact_messages', JSON.stringify(messages));
      NotificationSystem.success('✅ تم حفظ رسالتك محلياً!');
    }
  } catch (e) { 
    NotificationSystem.error('❌ فشل إرسال الرسالة'); 
  }
  
  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> إرسال';
});

// ============================================================
// ===== Refresh Orders Status =====
// ============================================================
async function refreshOrdersStatus() {
  if (!database || myOrders.length === 0) return;
  const ordersSnapshot = [...myOrders];

  const results = await Promise.all(ordersSnapshot.map(async (o) => {
    try {
      const snap = await get(ref(database, `orders/${o.orderId}`));
      return { order: o, snap };
    } catch (_) {
      return { order: o, snap: null };
    }
  }));

  let changed = false;
  for (const {order:o, snap} of results) {
    try {
      if (snap?.exists()) {
        const d = snap.val() || {};
        const os = o.status;
        const oldLedger = JSON.stringify(o.returnedQuantities || {});

        if (syncOrderContents(o, d)) changed = true;
        o.status = d.status || o.status || 'pending';
        o.rejectionReason = d.rejectionReason || '';
        if (d.deliveredAt) o.deliveredAt = Number(d.deliveredAt);
        if (d.returnedAt) o.returnedAt = Number(d.returnedAt);
        if (d.returnedAt) o.status = 'returned';
        if (d.returnedQuantities) o.returnedQuantities = d.returnedQuantities;

        if (o.status === 'delivered' && os !== 'delivered') {
          o.deliveredAt = Number(d.deliveredAt || o.deliveredAt || Date.now());
          OrderTimerManager.startDeliveredTimer(o.orderId);
        }
        if (o.status === 'rejected' && os !== 'rejected') {
          o.rejectedAt = Number(d.rejectedAt || Date.now());
          OrderTimerManager.startRejectedTimer(o.orderId);
        }

        if (os !== o.status) {
          const stored = phoneNotificationStatusMemory[String(o.orderId || '')];
          if (stored == null) markInitialOrderNotificationStatus(o.orderId, o.status);
          else if (stored !== o.status) {
            markInitialOrderNotificationStatus(o.orderId, o.status);
            notifyOrderStatusChange(o, stored, o.status).catch(() => {});
          }
        }
        if (os !== o.status || oldLedger !== JSON.stringify(o.returnedQuantities || {})) changed = true;
      } else if (snap) {
        OrderTimerManager.clearTimer(o.orderId);
        myOrders = myOrders.filter(x => x.orderId !== o.orderId);
        changed = true;
      }
    } catch (_) {}
  }

  if (changed) {
    saveOrders();
    if ($('#cartPage')?.classList.contains('active-page')) renderCartPage();
    if ($('#returnsPage')?.classList.contains('active-page')) renderReturnsPage();
  }

  // لو اكتملت/تغيرت قائمة الطلبات، اربط أي طلب جديد بالمستمع فورًا.
  if ('Notification' in window && Notification.permission === 'granted' && database) {
    setupOrderPhoneNotificationListeners();
  }
}

// ============================================================
// ===== Render Wishlist =====
// ============================================================
function renderWishlistPage() {
  const container = document.getElementById('wishlistContainer');
  if (!container) return;
  
  if (wishlist.length === 0) {
    const t1 = document.getElementById('wlTools'); if (t1) t1.style.display = 'none';
    const c1 = document.getElementById('wlCount'); if (c1) c1.textContent = '';
    container.innerHTML = `
      <div style="grid-column:1/-1;">
        <div class="wishlist-empty">
          <span class="empty-icon">💔</span>
          <h3>لا توجد منتجات في المفضلة</h3>
          <p>استعرض المنتجات وأضف ما يعجبك إلى المفضلة ❤️</p>
          <button class="btn btn-primary" onclick="window.switchPage('home')">🛍️ تسوق الآن</button>
        </div>
      </div>
    `;
    return;
  }
  
  let wishlistProducts = allProducts.filter(p => wishlist.includes(p.id));
  {
    const mode = window.__wlSort || 'new';
    const price = p => getEffectivePrice(p).finalPrice;
    if (mode === 'new') wishlistProducts.sort((a, b) => wishlist.indexOf(b.id) - wishlist.indexOf(a.id));
    else if (mode === 'low') wishlistProducts.sort((a, b) => price(a) - price(b));
    else if (mode === 'high') wishlistProducts.sort((a, b) => price(b) - price(a));
    else if (mode === 'avail') wishlistProducts.sort((a, b) => ((b.quantity || 0) > 0) - ((a.quantity || 0) > 0));
    const tools = document.getElementById('wlTools'), cnt = document.getElementById('wlCount');
    if (tools) tools.style.display = wishlistProducts.length ? 'flex' : 'none';
    if (cnt) cnt.textContent = wishlistProducts.length ? wishlistProducts.length + ' منتج' : '';
    const sortEl = document.getElementById('wlSort');
    if (sortEl && !sortEl.__b) {
      sortEl.__b = 1;
      sortEl.addEventListener('change', () => { window.__wlSort = sortEl.value; renderWishlistPage(); });
      document.getElementById('wlAddAll')?.addEventListener('click', () => {
        const list = allProducts.filter(p => wishlist.includes(p.id) && (p.quantity || 0) > 0 && !p.needsDetails);
        const skipped = allProducts.filter(p => wishlist.includes(p.id) && (p.quantity || 0) > 0 && p.needsDetails).length;
        if (!list.length) { NotificationSystem.warning('لا توجد منتجات متاحة للإضافة مباشرة'); return; }
        list.forEach(p => { try { addToCart(p.id); } catch (e) {} });
        if (skipped) NotificationSystem.info(`${skipped} منتج يحتاج اختيار تفاصيل، أضفه بشكل منفصل`);
      });
      document.getElementById('wlClear')?.addEventListener('click', async () => {
        if (!await window.proConfirm('مسح كل المنتجات من المفضلة؟')) return;
        wishlist = []; saveWishlist();
        NotificationSystem.success('تم مسح المفضلة');
      });
    }
    if (sortEl) sortEl.value = mode;
  }
  if (wishlistProducts.length === 0) {
    const t0 = document.getElementById('wlTools'); if (t0) t0.style.display = 'none';
    container.innerHTML = `
      <div style="grid-column:1/-1;">
        <div class="wishlist-empty">
          <span class="empty-icon">🔍</span>
          <h3>المنتجات غير متوفرة</h3>
          <p>بعض المنتجات التي أضفتها قد تكون غير متوفرة حالياً</p>
          <button class="btn btn-primary" onclick="window.switchPage('home')">🛍️ تصفح المنتجات</button>
        </div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = wishlistProducts.map(p => {
    const av = (p.quantity || 0) > 0;
    const img = getThumbnailUrl(p.image, 400);
    const hi = p.image && p.image.length > 0;
    const pi = getEffectivePrice(p);
    const cn = p.category || 'أجهزة شخصية';
    const ci = CATEGORIES.find(c => c.id === cn)?.icon || 'fa-box';
    const rating = p.rating || { average: 0, count: 0 };
    const stars = '★'.repeat(Math.round(rating.average)) + '☆'.repeat(5 - Math.round(rating.average));
    
    let ph = pi.hasDiscount 
      ? `<div class="price-container">
          <span class="original-price">${pi.basePrice.toFixed(2)} ج</span>
          <span class="discounted-price">${pi.finalPrice.toFixed(2)} <small>ج</small></span>
          <span class="discount-label">🏷️ ${pi.discountLabel}</span>
        </div>` 
      : `<span class="price">${pi.basePrice.toFixed(2)} <small>ج</small></span>`;
    
    return `<div class="product-card">
      <button class="wishlist-btn active" data-wishlist-id="${p.id}">
        <i class="fa-solid fa-heart"></i>
      </button>
      <div class="product-img-wrap" onclick="window.openProductDetail('${p.id}')">
        ${hi ? `<img src="${img}" alt="${escapeStoreHtml(p.name || '')}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
        <i class="fas ${p.icon || 'fa-box'} product-img-placeholder" style="${hi ? 'display:none;' : ''}"></i>
        ${pi.hasDiscount ? `<span class="discount-badge"><i class="fa-solid fa-tag"></i> ${pi.discountLabel}</span>` : ''}
        <span class="category-badge"><i class="fa-solid ${ci}"></i> ${cn}</span>
        <span class="stock-badge ${av ? 'stock-available' : 'stock-out'}">${av ? '✓ متوفر' : '✗ نفذ'}</span>
      </div>
      <div class="product-info">
        <div class="product-name" role="button" tabindex="0" onclick="window.openProductDetail('${p.id}')">${escapeStoreHtml(p.name || '')}</div>
        <div class="product-rating"><span class="stars">${stars}</span> (${rating.count})</div>
        <div class="product-desc">${escapeStoreHtml(p.description || '')}</div>
        <div class="price-row">
          ${ph}
          <button class="add-btn" ${!av ? 'disabled' : ''} data-add-id="${p.id}"><i class="fa-solid fa-cart-plus"></i> أضف للسلة</button>
        </div>
      </div>
    </div>`;
  }).join('');
  
  container.querySelectorAll('[data-add-id]').forEach(b => b.addEventListener('click', () => addToCart(b.getAttribute('data-add-id'))));
  container.querySelectorAll('[data-wishlist-id]').forEach(b => b.addEventListener('click', () => toggleWishlist(b.getAttribute('data-wishlist-id'))));
}

// ============================================================
// ===== Product Reviews =====
// ============================================================
function renderReviewSummary(a) {
  const c = [0, 0, 0, 0, 0];
  a.forEach(r => {
    const n = Math.max(1, Math.min(5, Number(r.rating) || 0));
    c[n - 1]++;
  });
  const total = a.length;
  const avg = total ? a.reduce((s, r) => s + (Number(r.rating) || 0), 0) / total : 0;
  
  const reviewAverage = $('#reviewAverage');
  const reviewAverageStars = $('#reviewAverageStars');
  const reviewCount = $('#reviewCount');
  const ratingBars = $('#ratingBars');
  
  if (reviewAverage) reviewAverage.textContent = avg.toFixed(1);
  if (reviewAverageStars) reviewAverageStars.textContent = starsText(avg);
  if (reviewCount) reviewCount.textContent = `${total} تقييم`;
  
  if (ratingBars) {
    ratingBars.innerHTML = [5, 4, 3, 2, 1].map(n => {
      const x = c[n - 1];
      const p = total ? Math.round(x / total * 100) : 0;
      return `<div class="rating-bar-row">
        <b>${n}★</b>
        <div class="rating-bar"><span style="width:${p}%"></span></div>
        <span>${x}</span>
      </div>`;
    }).join('');
  }
  
  const r = $('#detailRating');
  if (r) r.innerHTML = `<span class="stars">${starsText(avg)}</span> <span class="rating-text">(${total} تقييم)</span>`;
  if (currentDetailProduct) currentDetailProduct.rating = { average: avg, count: total };
}

function renderReviewList(a) {
  const b = $('#reviewList');
  if (!b) return;
  if (!a.length) {
    b.innerHTML = '<div class="review-empty">⭐ لا توجد تقييمات بعد. كن أول من يقيّم هذا المنتج.</div>';
    return;
  }
  b.innerHTML = [...a].sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0)).map(r => `
    <div class="review-item">
      <div class="review-head">
        <div>
          <span class="reviewer-name">${escReview(r.name || 'عميل')}</span>
          ${r.verifiedPurchase ? '<span class="verified-review"><i class="fa-solid fa-circle-check"></i> شراء موثّق</span>' : ''}
        </div>
        <span class="review-date">${r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-EG') : ''}</span>
      </div>
      <div class="review-stars" style="font-size:14px">${starsText(r.rating)}</div>
      <div class="review-body">${escReview(r.text)}</div>
    </div>
  `).join('');
}

function loadProductReviews(pid) {
  const b = $('#reviewList');
  if (b) {
    b.innerHTML = '<div class="review-loading"><i class="fa-solid fa-spinner fa-spin"></i> جاري تحميل التقييمات...</div>';
  }
  if (!database) {
    currentProductReviews = loadFromStorage('reviews_' + pid, []);
    renderReviewSummary(currentProductReviews);
    renderReviewList(currentProductReviews);
    return;
  }
  try {
    onValue(ref(database, 'reviews/' + pid), s => {
      const a = [];
      if (s.exists()) {
        const d = s.val();
        Object.keys(d).forEach(k => a.push({ id: k, ...d[k] }));
      }
      currentProductReviews = a;
      renderReviewSummary(a);
      renderReviewList(a);
    });
  } catch (e) {
    renderReviewList([]);
  }
}

function selectReviewRating(n) {
  selectedReviewRating = Number(n) || 5;
  document.querySelectorAll('#starPicker button').forEach(b => 
    b.classList.toggle('active', Number(b.dataset.rating) <= selectedReviewRating)
  );
}

async function submitProductReview() {
  if (!currentDetailProduct) return;
  const pid = String(currentDetailProduct.id);
  const text = $('#reviewText').value.trim();
  const id = getCustomerIdentity();
  
  if (!text || text.length < 3) {
    NotificationSystem.warning('اكتب تعليقاً قصيراً عن تجربتك');
    return;
  }
  
  if (currentProductReviews.some(r => r.customerId === id.customerId)) {
    NotificationSystem.warning('لقد قيّمت هذا المنتج من قبل');
    return;
  }
  
  const p = getCheckoutProfile();
  const review = {
    customerId: id.customerId,
    name: p.name || 'عميل',
    rating: selectedReviewRating,
    text: text.slice(0, 500),
    verifiedPurchase: isCustomerVerifiedBuyer(pid),
    createdAt: Date.now()
  };
  
  const btn = $('#submitReviewBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';
  
  try {
    if (database) {
      const nr = push(ref(database, 'reviews/' + pid));
      await set(nr, review);
      try {
        const s = await get(ref(database, 'reviews/' + pid));
        const d = s.exists() ? s.val() : {};
        const a = Object.values(d);
        const avg = a.length ? a.reduce((z, r) => z + (Number(r.rating) || 0), 0) / a.length : 0;
        await update(ref(database, 'products/' + pid), { 
          rating: { average: Number(avg.toFixed(2)), count: a.length } 
        });
      } catch (e) {
        console.warn('ملخص المنتج لم يحدث، التقييم محفوظ', e);
      }
    } else {
      const a = loadFromStorage('reviews_' + pid, []);
      a.push(review);
      localStorage.setItem('reviews_' + pid, JSON.stringify(a));
      currentProductReviews = a;
      renderReviewSummary(a);
      renderReviewList(a);
    }
    $('#reviewText').value = '';
    selectReviewRating(5);
    NotificationSystem.success('تم نشر تقييمك، شكراً لتجربتك ❤️');
  } catch (e) {
    NotificationSystem.error('تعذر حفظ التقييم حالياً');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> إرسال التقييم';
  }
}

// ============================================================
// ===== GLOBAL COMMERCE UPGRADE v2 =====
// ============================================================
let compareProducts = JSON.parse(localStorage.getItem('ps_compare_products') || '[]');
let recentlyViewed = JSON.parse(localStorage.getItem('ps_recently_viewed') || '[]');
let discoveryMode = 'all';

function persistCommerceUX() {
  localStorage.setItem('ps_compare_products', JSON.stringify(compareProducts.slice(0, 3)));
  localStorage.setItem('ps_recently_viewed', JSON.stringify(recentlyViewed.slice(0, 3)));
}

function rememberRecentlyViewed(pid) {
  recentlyViewed = [String(pid), ...recentlyViewed.map(String).filter(id => String(id) !== String(pid))].slice(0, 3);
  persistCommerceUX();
}

function renderRecentlyViewed() {
  const section = document.getElementById('recentSection');
  const box = document.getElementById('recentProductsContainer');
  if (!section || !box) return;
  const products = recentlyViewed
    .map(id => allProducts.find(p => String(p.id) === String(id)))
    .filter(Boolean)
    .slice(0, 3);
  if (!products.length) { 
    section.style.display = 'none'; 
    box.innerHTML = ''; 
    return; 
  }
  section.style.display = 'block';
  box.innerHTML = products.map(p => {
    const pi = getEffectivePrice(p);
    const img = getThumbnailUrl(p.image, 160);
    return `<div class="recent-card" data-recent-id="${p.id}">
      ${img ? `<img src="${img}" alt="${escapeStoreHtml(p.name || '')}" loading="lazy">` : `<span class="recent-icon"><i class="fas ${p.icon || 'fa-box'}"></i></span>`}
      <div>
        <div class="recent-name">${escapeStoreHtml(p.name || 'منتج')}</div>
        <div class="recent-price">${pi.finalPrice.toFixed(2)} ج</div>
      </div>
    </div>`;
  }).join('');
  box.querySelectorAll('[data-recent-id]').forEach(el => 
    el.addEventListener('click', () => openProductDetail(el.dataset.recentId))
  );
}

function clearRecentlyViewed() {
  recentlyViewed = [];
  persistCommerceUX();
  renderRecentlyViewed();
  NotificationSystem.info('تم مسح المنتجات التي شاهدتها مؤخراً');
}

function updateCompareFloating() {
  const wrap = document.getElementById('compareFloating');
  const count = document.getElementById('compareCount');
  if (!wrap || !count) return;
  count.textContent = String(compareProducts.length);
  wrap.classList.toggle('show', compareProducts.length > 0);
  document.querySelectorAll('[data-compare-id]').forEach(btn => {
    btn.classList.toggle('active', compareProducts.includes(String(btn.dataset.compareId)));
  });
}

function toggleCompare(pid) {
  pid = String(pid);
  if (compareProducts.includes(pid)) {
    compareProducts = compareProducts.filter(id => id !== pid);
  } else {
    if (compareProducts.length >= 3) {
      NotificationSystem.warning('يمكنك مقارنة 3 منتجات كحد أقصى');
      return;
    }
    const p = allProducts.find(x => String(x.id) === pid);
    if (!p) return;
    compareProducts.push(pid);
    NotificationSystem.success(`تمت إضافة "${p.name}" للمقارنة`);
  }
  persistCommerceUX();
  updateCompareFloating();
}

function renderCompare() {
  const box = document.getElementById('compareContent');
  if (!box) return;
  const products = compareProducts.map(id => allProducts.find(p => String(p.id) === id)).filter(Boolean);
  if (!products.length) {
    box.innerHTML = '<div class="empty-state"><span class="empty-icon">⚖️</span><h3>لا توجد منتجات للمقارنة</h3><p>اختر حتى 3 منتجات من بطاقات المنتجات.</p></div>';
    return;
  }
  const rows = [
    ['المنتج', ...products.map(p => p.name || 'منتج')],
    ['السعر', ...products.map(p => `${getEffectivePrice(p).finalPrice.toFixed(2)} ج`)],
    ['التقييم', ...products.map(p => `⭐ ${(p.rating?.average || 0).toFixed(1)} (${p.rating?.count || 0})`)],
    ['القسم', ...products.map(p => p.category || '—')],
    ['التوفر', ...products.map(p => (p.quantity || 0) > 0 ? `متوفر (${p.quantity})` : 'غير متوفر')],
    ['الوصف', ...products.map(p => p.description || '—')]
  ];
  box.innerHTML = `<table class="compare-modal-table"><tbody>${rows.map((r, i) => 
    `<tr><td>${r[0]}</td>${r.slice(1).map(v => `<td>${v}</td>`).join('')}</tr>`
  ).join('')}</tbody></table>`;
}

function openCompare() {
  if (!compareProducts.length) { 
    NotificationSystem.info('أضف منتجات إلى المقارنة أولاً'); 
    return; 
  }
  renderCompare();
  document.getElementById('compareModal')?.classList.add('show');
}

function closeCompare() { 
  document.getElementById('compareModal')?.classList.remove('show'); 
}

function clearCompare() {
  compareProducts = [];
  persistCommerceUX();
  updateCompareFloating();
  closeCompare();
}

function applyDiscovery(mode) {
  discoveryMode = mode;
  currentSearchQuery = '';
  const search = document.getElementById('searchInput');
  if (search) search.value = '';
  currentPriceMin = null;
  currentPriceMax = null;
  if (document.getElementById('priceMin')) document.getElementById('priceMin').value = '';
  if (document.getElementById('priceMax')) document.getElementById('priceMax').value = '';
  const buttons = {
    rated: document.getElementById('showBestRatedBtn'),
    discount: document.getElementById('showDiscountsBtn'),
    available: document.getElementById('showAvailableBtn')
  };
  Object.values(buttons).forEach(b => b?.classList.remove('active'));
  buttons[mode]?.classList.add('active');
  renderHomeProductsEnhanced();
}

function renderHomeProductsEnhanced() {
  if (discoveryMode === 'all') { 
    renderHomeProducts(); 
    return; 
  }
  let modeProducts = [...allProducts];
  if (discoveryMode === 'rated') {
    modeProducts.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
  }
  if (discoveryMode === 'discount') {
    modeProducts.sort((a, b) => getEffectivePrice(b).discountValue - getEffectivePrice(a).discountValue);
  }
  if (discoveryMode === 'available') {
    modeProducts = modeProducts.filter(p => (p.quantity || 0) > 0).sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
  }
  const g = document.getElementById('productsContainer');
  const rc = document.getElementById('resultsCount');
  if (!g) return;
  if (rc) rc.textContent = `${modeProducts.length} منتج`;
  const oldSearch = currentSearchQuery;
  const oldCat = currentCategory;
  const oldMin = currentPriceMin;
  const oldMax = currentPriceMax;
  const oldSort = currentSort;
  currentSearchQuery = '';
  currentCategory = 'all';
  currentPriceMin = null;
  currentPriceMax = null;
  currentSort = 'newest';
  renderHomeProducts();
  currentSearchQuery = oldSearch;
  currentCategory = oldCat;
  currentPriceMin = oldMin;
  currentPriceMax = oldMax;
  currentSort = oldSort;
  const cards = [...g.children];
  cards.sort((a, b) => {
    const ai = modeProducts.findIndex(p => String(p.id) === a.id?.replace('product-', ''));
    const bi = modeProducts.findIndex(p => String(p.id) === b.id?.replace('product-', ''));
    return ai - bi;
  });
  cards.forEach(c => g.appendChild(c));
}

function setupGlobalCommerceUX() {
  document.getElementById('showBestRatedBtn')?.addEventListener('click', () => applyDiscovery('rated'));
  document.getElementById('showDiscountsBtn')?.addEventListener('click', () => applyDiscovery('discount'));
  document.getElementById('showAvailableBtn')?.addEventListener('click', () => applyDiscovery('available'));
  document.getElementById('clearDiscoveryBtn')?.addEventListener('click', () => {
    discoveryMode = 'all';
    document.querySelectorAll('.discovery-btn').forEach(b => b.classList.remove('active'));
    renderHomeProducts();
  });
  document.getElementById('clearRecentBtn')?.addEventListener('click', clearRecentlyViewed);
  document.getElementById('openCompareBtn')?.addEventListener('click', openCompare);
  document.getElementById('clearCompareBtn')?.addEventListener('click', clearCompare);
  document.getElementById('closeCompareBtn')?.addEventListener('click', closeCompare);
  document.getElementById('compareModal')?.addEventListener('click', e => {
    if (e.target.id === 'compareModal') closeCompare();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCompare();
  });
  renderRecentlyViewed();
  updateCompareFloating();
}

// Re-render hook
const _renderHomeProductsOriginal = renderHomeProducts;
renderHomeProducts = function() {
  _renderHomeProductsOriginal();
  updateCompareFloating();
  renderRecentlyViewed();
};

// ============================================================
// ===== Promotional Carousel =====
// ============================================================
let promotionalSlides = [];
let autoPlayTimer = null;
let isUserInteracting = false;
let resumeTimeout = null;
let currentSlideIndex = 0;
const PROMO_DEFAULT_INTERVAL_SECONDS = 5;
let promoServerOffset = 0;
let promoRenderedMode = '';

// عدد العروض اللي بتتشاف مرة واحدة حسب عرض الشاشة (نفس نقاط CSS)
function promoVisibleCount() {
  const w = window.innerWidth;
  return w >= 1024 ? 4 : w >= 768 ? 3 : w >= 480 ? 2 : 1;
}
function promoIsStatic() {
  return promotionalSlides.length > 0 && promotionalSlides.length <= promoVisibleCount();
}
// جدول زمني موحّد: الموضع الحالي بيتحدد من ساعة السيرفر وليس من وقت فتح الموقع،
// فكل الزوار بيشوفوا نفس العرض في نفس اللحظة، والمدة المتبقية دقيقة.
function promoSchedule() {
  const list = promotionalSlides;
  if (list.length < 2) return { index: 0, remaining: 0 };
  const durs = list.map(getPromotionalInterval);
  const cycle = durs.reduce((a, b) => a + b, 0);
  const now = Date.now() + promoServerOffset;
  let t = ((now % cycle) + cycle) % cycle;
  for (let i = 0; i < durs.length; i++) {
    if (t < durs[i]) return { index: i, remaining: Math.max(250, durs[i] - t) };
    t -= durs[i];
  }
  return { index: 0, remaining: durs[0] };
}

function loadPromotionalSlides() {
  console.log('🔄 جاري تحميل العروض الترويجية (Carousel)...');
  
  if (!database) {
    // لا توجد قاعدة بيانات متاحة، لذلك لا نعرض عرضًا وهميًا.
    promotionalSlides = [];
    currentSlideIndex = 0;
    stopAutoPlay();
    renderPromotionalCarousel();
    return;
  }
  
  try {
    onValue(ref(database, '.info/serverTimeOffset'), (o) => {
      const v = Number(o.val());
      if (Number.isFinite(v) && Math.abs(v - promoServerOffset) > 300) {
        promoServerOffset = v;
        if (promotionalSlides.length > 1) renderPromotionalCarousel();
      }
    });
  } catch (e) {}
  const promoRef = ref(database, 'settings/promotionalSlides');
  onValue(promoRef, (snap) => {
    const slides = [];
    if (snap.exists()) {
      const data = snap.val();
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const slide = data[key] || {};
          if (slide.active !== false) {
            const parsedInterval = Number(slide.interval);
            slides.push({
              id: key,
              title: slide.title || 'عرض مميز',
              description: slide.description || '',
              image: slide.image || '',
              category: slide.category || 'all',
              linkedProductId: slide.linkedProductId || null,
              linkedProductName: slide.linkedProductName || null,
              linkedProductIds: Array.isArray(slide.linkedProductIds)
                ? slide.linkedProductIds.filter(Boolean).map(String)
                : (slide.linkedProductIds && typeof slide.linkedProductIds === 'object'
                    ? Object.values(slide.linkedProductIds).filter(Boolean).map(String)
                    : (slide.linkedProductId ? [String(slide.linkedProductId)] : [])),
              // Firebase value from the control panel is authoritative.
              // Only missing/invalid values use the same 5-second default as the panel.
              interval: Number.isFinite(parsedInterval) && parsedInterval > 0 ? parsedInterval : PROMO_DEFAULT_INTERVAL_SECONDS,
              order: Number.isFinite(Number(slide.order)) ? Number(slide.order) : 0,
              active: slide.active !== false
            });
          }
        }
      }
    }
    
    slides.sort((a, b) => a.order - b.order);
    
    // هذا هو منطق لوحة التحكم:
    // لا توجد عروض حصرية ظاهرة إلا إذا كان هناك عرض محفوظ وحالته active ليست false.
    // العروض المحذوفة أو المعطلة لا تُستبدل بعرض افتراضي.
    promotionalSlides = slides;

    // أي تحديث من لوحة التحكم يعيد العرض لأول شريحة ويبدأ مؤقتًا واحدًا جديدًا فقط.
    currentSlideIndex = 0;
    isUserInteracting = false;
    clearTimeout(resumeTimeout);
    stopAutoPlay();
    renderPromotionalCarousel();
  }, (error) => {
    console.error('❌ خطأ في تحميل العروض الترويجية:', error);
    // عند تعذر قراءة العروض من Firebase لا نعرض عرضًا وهميًا.
    promotionalSlides = [];
    currentSlideIndex = 0;
    stopAutoPlay();
    renderPromotionalCarousel();
  });
}

function getSlideImageUrl(slide) {
  if (slide.image && typeof slide.image === 'string' && slide.image.trim().length > 5) {
    return slide.image.trim();
  }
  const defaultImages = {
    'ملابس': 'https://via.placeholder.com/800x400/4A2C17/C9A96E?text=👔+عرض+ملابس+فاخرة',
    'أجهزة شخصية': 'https://via.placeholder.com/800x400/1A0F07/C9A96E?text=📱+عرض+أجهزة+حديثة',
    'أجهزة كهربائية': 'https://via.placeholder.com/800x400/6B3A2A/C9A96E?text=⚡+عرض+أجهزة+كهربائية',
    'عناية طبيعية': 'https://via.placeholder.com/800x400/2E7D32/C9A96E?text=🌿+عرض+عناية+طبيعية',
    'مستلزمات شخصية': 'https://via.placeholder.com/800x400/7B3FAF/C9A96E?text=🧴+عرض+مستلزمات+شخصية'
  };
  return defaultImages[slide.category] || 'https://via.placeholder.com/800x400/4A2C17/C9A96E?text=🏪+عرض+مميز';
}

function renderPromotionalCarousel() {
  const wrapper = document.getElementById('promoCarouselWrapper');
  const section = document.getElementById('promoCarousel');
  const prevBtn = document.getElementById('promoCarouselPrev');
  const nextBtn = document.getElementById('promoCarouselNext');
  
  if (!wrapper || !section) return;
  
  if (promotionalSlides.length === 0) {
    // لا توجد عروض حصرية نشطة/موجودة: أخفِ القسم بالكامل وأوقف المؤقت.
    section.classList.remove('active');
    stopAutoPlay();
    return;
  }
  
  wrapper.innerHTML = '';
  const staticMode = promoIsStatic();
  wrapper.dataset.static = staticMode ? '1' : '0';
  wrapper.dataset.count = String(promotionalSlides.length);
  section.classList.toggle('promo-static', staticMode);
  promoRenderedMode = (staticMode ? 's' : 'l') + promoVisibleCount();
  if (staticMode) stopAutoPlay();
  
  // نكرر العروض (بنفس الترتيب) لحد ما يبقى عندنا 8 عناصر على الأقل،
  // عشان الحلقة تفضل مستمرة حتى لو العروض قليلة (مثلاً 3 صور).
  const PROMO_MIN_ITEMS = 8;
  const loopList = [];
  const repeats = (!staticMode && promotionalSlides.length > 1) ? Math.ceil(PROMO_MIN_ITEMS / promotionalSlides.length) : 1;
  for (let r = 0; r < repeats; r++) {
    promotionalSlides.forEach((s, i) => loopList.push({ slide: s, index: i }));
  }

  // ابدأ الحلقة من العرض اللي المفروض يكون ظاهر دلوقتي حسب الجدول الموحد
  const sched = staticMode ? { index: 0 } : promoSchedule();
  if (!staticMode && sched.index > 0) {
    const j = loopList.findIndex(x => x.index === sched.index);
    if (j > 0) loopList.push(...loopList.splice(0, j));
  }

  loopList.forEach(({ slide, index }) => {
    const item = document.createElement('div');
    item.className = 'promo-carousel-item';
    item.dataset.slideIndex = String(index);
    
    const imageUrl = getSlideImageUrl(slide);
    item.innerHTML = `<img src="${imageUrl}" alt="${slide.title || 'عرض مميز'}" onerror="this.src='https://via.placeholder.com/800x400/4A2C17/C9A96E?text=🏪+عرض+مميز';">`;
    
    item.addEventListener('click', () => {
      const linkedIds = Array.isArray(slide.linkedProductIds)
        ? slide.linkedProductIds.filter(Boolean).map(String)
        : (slide.linkedProductId ? [String(slide.linkedProductId)] : []);
      const linkedProducts = linkedIds
        .map(id => allProducts.find(p => String(p.id) === id))
        .filter(Boolean);

      if (linkedProducts.length > 0) {
        const targetCategory = slide.category || 'all';
        document.querySelectorAll('.category-chip').forEach(chip => {
          chip.classList.toggle('active', chip.dataset.category === targetCategory);
        });
        currentCategory = targetCategory;
        targetProductId = null;
        targetProductIds = linkedProducts.map(p => String(p.id));
        isTargetingProduct = false;
        renderHomeProducts();

        // renderHomeProducts() handles the single exact scroll position and
        // keeps every linked product highlighted with the gold frame.
        setTimeout(() => { targetProductIds = []; }, 1200);
      } else {
        goToCategory(slide.category);
      }
    });

    wrapper.appendChild(item);
  });
  
  section.classList.add('active');
  
  if (prevBtn && nextBtn) {
    prevBtn.onclick = () => manualScrollHelper(-350);
    nextBtn.onclick = () => manualScrollHelper(350);
  }

  currentSlideIndex = sched.index;
  if (staticMode) { wrapper.scrollLeft = 0; return; }
  setTimeout(() => {
    promoNormalize();
    startAutoPlay();
  }, 0);
}

function goToCategory(category) {
  if (!category || category === 'all') {
    window.scrollTo(0, 0);
    targetProductId = null;
    isTargetingProduct = false;
    return;
  }
  const categoryChips = document.querySelectorAll('.category-chip');
  let targetChip = null;
  categoryChips.forEach(chip => {
    if (chip.dataset.category === category) { targetChip = chip; }
  });
  if (targetChip) {
    categoryChips.forEach(c => c.classList.remove('active'));
    targetChip.classList.add('active');
    syncCategoryControls(category);
    homeVisibleLimit = 20;
    targetProductId = null;
    isTargetingProduct = false;
    const categoriesSection = document.querySelector('.categories-section');
    if (categoriesSection) {
      categoriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    renderHomeProducts();
  }
}

function manualScrollHelper(amount) {
  const wrapper = document.getElementById('promoCarouselWrapper');
  if (!wrapper || wrapper.dataset.static === '1' || promotionalSlides.length < 2) return;

  stopAutoPlay();
  isUserInteracting = true;
  clearTimeout(resumeTimeout);

  promoAdvance(amount < 0 ? -1 : 1);

  resumeTimeout = setTimeout(() => {
    isUserInteracting = false;
    startAutoPlay();
  }, 1500);
}

// ===== حلقة لا نهائية =====
// القاعدة: العرض الظاهر دايماً في الخانة رقم 1، وفي خانة 0 العرض السابق له.
// بعد كل حركة بنرتّب العناصر (أول عنصر يروح للآخر أو العكس) ونثبّت الموضع فوراً
// من غير أي حركة مرئية، فالشريط يكمل 1⬅️2⬅️3⬅️1⬅️2⬅️3 من غير ما يرجع للأول.
let promoNormalizeTimer = null;
let promoIsTouching = false;

function promoNearestIndex(wrapper) {
  const wl = wrapper.getBoundingClientRect().left;
  let best = 0, bestDist = Infinity;
  Array.from(wrapper.children).forEach((el, i) => {
    const d = Math.abs(el.getBoundingClientRect().left - wl);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

function promoNormalize() {
  const wrapper = document.getElementById('promoCarouselWrapper');
  if (!wrapper || wrapper.dataset.static === '1' || promotionalSlides.length < 2 || wrapper.children.length < 4) return;

  const k = promoNearestIndex(wrapper);
  if (k !== 1) {
    const wl = wrapper.getBoundingClientRect().left;
    const keepEl = wrapper.children[k];
    // نحفظ مكان العرض الظاهر بالضبط قبل إعادة الترتيب...
    const offsetBefore = keepEl.getBoundingClientRect().left - wl;

    const prevSnap = wrapper.style.scrollSnapType;
    const prevBehavior = wrapper.style.scrollBehavior;
    wrapper.style.scrollSnapType = 'none';
    wrapper.style.scrollBehavior = 'auto';

    if (k > 1) {
      for (let i = 0; i < k - 1; i++) wrapper.appendChild(wrapper.firstElementChild);
    } else {
      wrapper.insertBefore(wrapper.lastElementChild, wrapper.firstElementChild);
    }

    // ...ونرجّعه لنفس المكان بالظبط بعد إعادة الترتيب، فمفيش أي هزة.
    const offsetAfter = keepEl.getBoundingClientRect().left - wrapper.getBoundingClientRect().left;
    const fix = offsetAfter - offsetBefore;
    if (Math.abs(fix) > 0.01) {
      wrapper.scrollBy({ left: fix, top: 0, behavior: 'instant' });
    }

    setTimeout(() => {
      wrapper.style.scrollSnapType = prevSnap;
      wrapper.style.scrollBehavior = prevBehavior;
    }, 60);
  }

  const shown = wrapper.children[1];
  const idx = shown ? Number(shown.dataset.slideIndex) : 0;
  currentSlideIndex = Number.isFinite(idx) ? idx : 0;

  if (!isUserInteracting && !autoPlayTimer) startAutoPlay();
}

function promoAdvance(dir) {
  // dir = 1 → العرض التالي، dir = -1 → العرض السابق
  scrollToPromotionalSlide(dir > 0 ? 2 : 0, true);
}

function getPromotionalInterval(slide) {
  // القيمة القادمة من لوحة تحكم بروفيشنال هي الأساس، بالثواني.
  // لا نستخدم 3 ثوانٍ هنا حتى لا يحدث تعارض مع إعداد اللوحة (5 ثوانٍ أو أي قيمة أخرى).
  const value = Number(slide && slide.interval);
  return Number.isFinite(value) && value > 0 ? value * 1000 : PROMO_DEFAULT_INTERVAL_SECONDS * 1000;
}

function scrollToPromotionalSlide(index, smooth = true) {
  const wrapper = document.getElementById('promoCarouselWrapper');
  if (!wrapper || !wrapper.children[index]) return;

  const item = wrapper.children[index];

  // مهم جدًا: لا نستخدم scrollIntoView هنا.
  // scrollIntoView يمكنه تحريك صفحة المتجر نفسها رأسيًا عندما يكون المستخدم
  // قد نزل لصفحة المنتجات، فيعيده تلقائيًا إلى قسم العروض كلما تغير العرض.
  // المطلوب هو تحريك الـCarousel أفقيًا فقط مع بقاء موضع الصفحة ثابتًا.
  const wrapperRect = wrapper.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const delta = itemRect.left - wrapperRect.left;

  if (Math.abs(delta) < 1) return;

  wrapper.scrollBy({
    left: delta,
    top: 0,
    behavior: smooth ? 'smooth' : 'instant'
  });
}

function startAutoPlay() {
  stopAutoPlay();
  if (!promotionalSlides || promotionalSlides.length < 2 || promoIsStatic()) return;
  if (isUserInteracting) return;
  if (!document.getElementById('promoCarouselWrapper')) return;

  if (currentSlideIndex >= promotionalSlides.length || currentSlideIndex < 0) {
    currentSlideIndex = 0;
  }

  // مؤقت واحد فقط. بعد الانتقال نقرأ مدة الشريحة التالية من Firebase/لوحة التحكم.
  autoPlayTimer = setTimeout(function timerCallback() {
    autoPlayTimer = null;
    if (isUserInteracting || promotionalSlides.length < 2) return;

    // نتحرك للعرض التالي؛ بعد انتهاء الحركة promoNormalize() بترتّب العناصر
    // وتبدأ مؤقت العرض الجديد (بمدته من لوحة التحكم).
    promoAdvance(1);

    // شبكة أمان لو الحركة ما حصلتش لأي سبب.
    setTimeout(() => {
      if (!autoPlayTimer && !isUserInteracting) startAutoPlay();
    }, 1500);
  }, promoSchedule().remaining);
}

let promoResizeT = null;
window.addEventListener('resize', () => {
  clearTimeout(promoResizeT);
  promoResizeT = setTimeout(() => {
    if (!promotionalSlides.length) return;
    const mode = (promoIsStatic() ? 's' : 'l') + promoVisibleCount();
    if (mode !== promoRenderedMode) renderPromotionalCarousel();
  }, 250);
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && promotionalSlides.length > 1 && !promoIsStatic() && !isUserInteracting) renderPromotionalCarousel();
});

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearTimeout(autoPlayTimer);
    autoPlayTimer = null;
  }
}

function setupCarouselInteractions() {
  const section = document.getElementById('promoCarousel');
  if (!section) return;

  section.addEventListener('mouseenter', () => {
    stopAutoPlay();
    isUserInteracting = true;
    clearTimeout(resumeTimeout);
  });

  section.addEventListener('mouseleave', () => {
    isUserInteracting = false;
    clearTimeout(resumeTimeout);
    resumeTimeout = setTimeout(() => {
      startAutoPlay();
    }, 1500);
  });

  section.addEventListener('touchstart', () => {
    promoIsTouching = true;
    stopAutoPlay();
    isUserInteracting = true;
    clearTimeout(resumeTimeout);
  });

  section.addEventListener('touchend', () => {
    promoIsTouching = false;
    clearTimeout(promoNormalizeTimer);
    promoNormalizeTimer = setTimeout(promoNormalize, 250);
    isUserInteracting = false;
    clearTimeout(resumeTimeout);
    resumeTimeout = setTimeout(() => {
      startAutoPlay();
    }, 1500);
  });

  const wrapper = document.getElementById('promoCarouselWrapper');
  if (wrapper) {
    wrapper.addEventListener('scroll', () => {
      clearTimeout(promoNormalizeTimer);
      promoNormalizeTimer = setTimeout(() => { if (!promoIsTouching) promoNormalize(); }, 140);
      // لا نحسب currentSlideIndex من scrollLeft؛ لأن RTL على Android/iOS
      // يستخدم قيمًا مختلفة، وهذا كان سببًا في القفز/التكرار وعدم احترام المؤقت.
      if (isUserInteracting) {
        clearTimeout(resumeTimeout);
        resumeTimeout = setTimeout(() => {
          isUserInteracting = false;
          startAutoPlay();
        }, 1500);
      }
    });
  }
}

// ============================================================
// ===== Periodic Refresh =====
// ============================================================
function startPeriodicRefresh() {
  window.__tick(refreshOrdersStatus, 30000);
  window.__tick(checkAppliedCouponValidity, 30000);
  window.__tick(() => {
    if (document.querySelector('#returnsPage')?.classList.contains('active-page')) {
      renderReturnsPage();
    }
  }, 60000);
}

// ============================================================
// ===== Init =====
// ============================================================
function init() {
  console.log('🚀 بدء تشغيل المتجر...');
  
  loadProducts();
  setupStoreSocialLinks();
  loadLogo();
  loadWalletNumbers();
  loadCODFee();
  loadDeliveryFee();
  loadShippingRates();
  loadCouponsFromFirebase();
  setupPaymentMethods();
  updateBadges();
  updateWishlistBadge();
  setupSearch();
  setupPrettySelects();
setupCategoriesAndFilters();
  syncCategoryControls(currentCategory);
  setupLanguage();
  OrderTimerManager.checkExistingOrders();
  startPeriodicRefresh();
  refreshOrdersStatus();
  setTimeout(() => { try { setupOrderPhoneNotificationListeners(); } catch (e) {} }, 800);
  loadPromotionalSlides();
  bindPhoneNotificationButton();
  if ('Notification' in window && Notification.permission === 'granted') {
    phoneNotificationReady = true;
    setTimeout(async () => {
      setupOrderPhoneNotificationListeners();
      setupReturnPhoneNotificationListener();
      await initFirebaseWebPush();
      if (getSavedFcmToken()) setFcmButtonState();
    }, 500);
  }
  
  setTimeout(setupCarouselInteractions, 2000);
  
  bindFlashSaleListener();
  
  // Expose to window
  window.switchPage = switchPage;
  window.__getCart = () => cartItems;
  window.updateTotalSummary = updateTotalSummary;
  window.addToCart = addToCart;
  window.resetAllFilters = resetAllFilters;
  window.openProductDetail = openProductDetail;
  window.__cart = {
  items: () => cartItems.map(i => ({ ...i })),
  qty: (idx, d) => changeQty(idx, d),
  remove: (idx) => removeItem(idx),
  detach: (idx) => { if (idx < 0 || idx >= cartItems.length) return null; const r = { ...cartItems[idx] }; cartItems.splice(idx, 1); saveCart(); renderCartPage(); return r; },
  restore: (it) => { const p = allProducts.find(x => x.id === it.productId); if (!p || (p.quantity || 0) < 1) { NotificationSystem.warning('المنتج غير متوفر حاليًا'); return false; } const pi = getEffectivePrice(p); const note = String(it.note || ''); const ei = cartItems.findIndex(i => i.productId === it.productId && String(i.note || '') === note); const q = Math.max(1, Math.min(it.quantity || 1, (p.quantity || 1) - productQtyInCart(it.productId))); if (q < 1) { NotificationSystem.warning('الحد الأقصى للكمية'); return false; } if (ei >= 0) cartItems[ei].quantity += q; else cartItems.push({ ...it, quantity: q, originalPrice: pi.basePrice, finalPrice: pi.finalPrice, hasDiscount: pi.hasDiscount, discountLabel: pi.discountLabel }); saveCart(); renderCartPage(); return true; },
  subtotal: () => cartItems.reduce((s, i) => s + (i.finalPrice || i.price || 0) * (i.quantity || 0), 0),
  freeShip: () => ({ enabled: freeShipEnabled, threshold: freeShipThreshold }),
  checkout: () => openCheckoutModal(),
  summary: () => {
    const items = cartItems.map(i => ({ id: i.productId, name: i.name || '', note: i.note || '', quantity: i.quantity || 0, price: Number(i.finalPrice || i.price || 0), original: Number(i.originalPrice || i.price || 0), hasDiscount: !!i.hasDiscount }));
    const subtotal = items.reduce((t, i) => t + i.price * i.quantity, 0);
    const savings = items.reduce((t, i) => t + Math.max(0, i.original - i.price) * i.quantity, 0);
    const couponFree = !!isFreeShipping();
    const free = couponFree || !!isFirstOrderFreeShipping() || !!isThresholdFreeShipping();
    const zoneKey = getSelectedZoneKey();
    const ship = free ? 0 : (zoneKey ? getZoneBaseFee(zoneKey) : null);
    const cf = selectedPaymentMethod === 'cod' ? Number(codFee) || 0 : 0;
    const discount = calculateCouponDiscount(subtotal);
    return { items, subtotal, savings, discount, coupon: appliedCoupon ? appliedCoupon.code : null, free, ship, shipFrom: getZoneBaseFee(''), zoneName: zoneKey ? getZoneName(zoneKey) : '', codFee: cf, total: Math.max(0, subtotal - discount + (ship || 0) + cf) };
  },
  orders: () => myOrders.map(o => ({ ...o })),
  render: () => renderCartPage(),
  fbGet: async (path) => { if (!database) return null; const s = await get(ref(database, path)); return s.exists() ? s.val() : null; }
};
window.__store = { price: (p) => getEffectivePrice(p).finalPrice, toggleWish: (id) => toggleWishlist(id), thumb: getThumbnailUrl, get products(){ return allProducts; }, get wishlist(){ return wishlist; }, get flashEnd(){ return (flashSaleSettings.status === 'active' && Number.isFinite(flashSaleSettings.endTime) && flashSaleSettings.endTime > 0) ? flashSaleSettings.endTime : null; }, now(){ return flashNow(); } };
  window.closeProductDetail = closeProductDetail;
  window.goToCategory = goToCategory;
  window.renderReturnsPage = renderReturnsPage;
  window.submitReturnRequest = submitReturnRequest;
  window.renderCartPage = renderCartPage;
  window.openAuthModal = openAuthModal;
  
  console.log('✅ تم تشغيل المتجر بنجاح');
}

// ============================================================
// ===== Reviews helper =====
// ============================================================
function scrollToReviews() {
  const anchor = document.getElementById('reviewsAnchor');
  const panel = document.getElementById('productReviewPanel');
  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (anchor) {
    anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ============================================================
// ===== Start everything =====
// ============================================================
navigator.serviceWorker?.addEventListener?.('message', (event) => {
  if (event.data?.type === 'OPEN_NOTIFICATION_TARGET') {
    const target = event.data.url || './index.html';
    try {
      const u = new URL(target, location.href);
      if (u.origin === location.origin) { window.location.href = u.href; }
    } catch (_) {}
  }
});

setupGlobalCommerceUX();
init();

// ===== V6 modal scroll lock =====
(function() {
  const modal = document.getElementById('productDetailModal');
  if (!modal) return;
  const sync = () => {
    document.documentElement.classList.toggle('product-modal-open', modal.classList.contains('show'));
    document.body.classList.toggle('product-modal-open', modal.classList.contains('show'));
  };
  new MutationObserver(sync).observe(modal, { attributes: true, attributeFilter: ['class'] });
  sync();
})();

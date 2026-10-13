const FIREBASE_DATABASE_URL = 'https://rashfa-9d95d-default-rtdb.asia-southeast1.firebasedatabase.app';
const CLOUDINARY_CLOUD_NAME = 'dzprjrvu7';
const STORE_URL = 'https://professional-rose.vercel.app';

// ===== إعدادات يمكنك تعديلها =====
// صورة افتراضية للمعاينة عند عدم وجود صورة للمنتج (رابط كامل https، ويفضل 1200x630).
// اتركها فارغة إذا لم تكن لديك صورة.
const DEFAULT_OG_IMAGE = '';
// طريقة ضبط الصورة على مقاس 1200x630:
//   'c_pad,b_white' = تظهر الصورة كاملة مع خلفية بيضاء حولها
//   'c_fill'        = تملأ الصورة المساحة بالكامل مع قص الأطراف
const OG_CROP = 'c_pad,b_white';
// أقصى مدة انتظار لقاعدة Firebase
const FETCH_TIMEOUT_MS = 6000;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeImage(product) {
  let image = product?.image || product?.imageUrl || product?.imageURL || '';

  if (Array.isArray(image)) image = image.find(Boolean) || '';
  if (image && typeof image === 'object') image = image.url || image.src || '';

  if (!image && Array.isArray(product?.images)) {
    image = product.images.find(Boolean) || '';
  }

  if (!image && product?.cloudinary_public_id) {
    image = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${product.cloudinary_public_id}`;
  }

  image = String(image || '').trim();
  if (image.startsWith('//')) image = `https:${image}`;
  if (image.startsWith('/')) image = `${STORE_URL}${image}`;
  return image;
}

function guessImageType(url) {
  const path = String(url).split('?')[0].toLowerCase();
  if (/\.jpe?g$/.test(path)) return 'image/jpeg';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';
  return '';
}

// يبني بيانات صورة المعاينة:
// - صور Cloudinary (بأي شكل رابط، مع أو بدون رقم النسخة v123) تُحوَّل إلى JPG بمقاس 1200x630،
//   وعندها فقط نصرّح بالأبعاد والنوع لأنها مضمونة.
// - أي صورة أخرى تُترك كما هي بدون ادعاء أبعاد أو نوع غير مؤكد.
function buildOgImage(rawImage) {
  const image = rawImage || DEFAULT_OG_IMAGE;
  if (!image) return null;

  const match = image.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/);
  if (match) {
    return {
      url: `${match[1]}f_jpg,w_1200,h_630,${OG_CROP}/${match[2]}`,
      type: 'image/jpeg',
      width: 1200,
      height: 630
    };
  }

  return { url: image, type: guessImageType(image), width: null, height: null };
}

function truncate(text, max = 200) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

// يرجع { product } عند النجاح (قد تكون null إذا المنتج غير موجود)،
// أو { error: true } عند فشل الاتصال/المهلة/رفض الصلاحيات.
async function fetchProduct(productId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${FIREBASE_DATABASE_URL}/products/${encodeURIComponent(productId)}.json`,
      { signal: controller.signal }
    );
    if (!response.ok) return { error: true };
    return { product: await response.json() };
  } catch (_) {
    return { error: true };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  const queryProduct = req?.query?.product;
  const productId = String(Array.isArray(queryProduct) ? queryProduct[0] : queryProduct || '').trim();

  if (!productId) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).send('Missing product id');
  }

  // رابط المتجر الحقيقي (للتوجيه بعد التحميل فقط)
  const productUrl = `${STORE_URL}/index.html?product=${encodeURIComponent(productId)}`;
  // رابط المشاركة نفسه (يجب أن يكون og:url حتى يقرأ فيسبوك الوسوم من هنا)
  const shareUrl = `${STORE_URL}/api/product-share?product=${encodeURIComponent(productId)}`;

  const result = await fetchProduct(productId);

  // عطل مؤقت (Firebase لا يستجيب أو رفض الطلب): 503 حتى لا يحتفظ فيسبوك بصفحة فارغة
  if (result.error) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '60');
    return res.status(503).send('Service temporarily unavailable');
  }

  const product = result.product;

  // المنتج غير موجود فعلاً
  if (!product || typeof product !== 'object') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).send('Product not found');
  }

  const name = product.name || 'منتج في Professional Store';
  const description = truncate(product.description || `شاهد المنتج ${name} في Professional Store`);
  const og = buildOgImage(normalizeImage(product));
  const safeProductUrl = escapeHtml(productUrl);
  const safeShareUrl = escapeHtml(shareUrl);

  const imageTags = og
    ? [
        `<meta property="og:image" content="${escapeHtml(og.url)}">`,
        `<meta property="og:image:secure_url" content="${escapeHtml(og.url)}">`,
        og.type ? `<meta property="og:image:type" content="${og.type}">` : '',
        og.width ? `<meta property="og:image:width" content="${og.width}">` : '',
        og.height ? `<meta property="og:image:height" content="${og.height}">` : '',
        `<meta property="og:image:alt" content="${escapeHtml(name)}">`,
        `<meta name="twitter:image" content="${escapeHtml(og.url)}">`
      ].filter(Boolean).join('\n')
    : '';

  // نرسل OG tags في كل طلب بدون الاعتماد على User-Agent،
  // ثم نوجّه المستخدم العادي للمنتج بواسطة JS فقط (بدون meta refresh).
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  return res.status(200).send(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(name)} | Professional Store</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:site_name" content="Professional Store">
<meta property="og:locale" content="ar_AR">
<meta property="og:type" content="product">
<meta property="og:title" content="${escapeHtml(name)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${safeShareUrl}">
${imageTags}
<meta name="twitter:card" content="${og ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${escapeHtml(name)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
</head>
<body>
<a href="${safeProductUrl}">فتح المنتج</a>
<script>location.replace(${JSON.stringify(productUrl).replace(/</g, '\\u003c')});</script>
</body>
</html>`);
}

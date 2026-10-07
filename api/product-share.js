const FIREBASE_DATABASE_URL = 'https://rashfa-9d95d-default-rtdb.asia-southeast1.firebasedatabase.app';
const CLOUDINARY_CLOUD_NAME = 'dzprjrvu7';
const STORE_URL = 'https://professional-rose.vercel.app';

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

export default async function handler(req, res) {
  const queryProduct = req?.query?.product;
  const productId = String(queryProduct || '').trim();

  if (!productId) {
    return res.status(400).send('Missing product id');
  }

  const productUrl = `${STORE_URL}/index.html?product=${encodeURIComponent(productId)}`;
  let product = null;

  try {
    const response = await fetch(`${FIREBASE_DATABASE_URL}/products/${encodeURIComponent(productId)}.json`);
    if (response.ok) {
      product = await response.json();
    }
  } catch (_) {}

  if (!product || typeof product !== 'object') {
    return res.status(404).send('Product not found');
  }

  const name = product.name || 'منتج في Professional Store';
  const description = product.description || `شاهد المنتج ${name} في Professional Store`;
  const image = normalizeImage(product);
  const safeProductUrl = escapeHtml(productUrl);

  // مهم: لا نعتمد على User-Agent.
  // واتساب قد يستخدم أكثر من User-Agent عند إنشاء معاينة الرابط، لذلك
  // نرسل OG tags في كل طلب، ثم نوجّه المستخدم العادي للمنتج بواسطة JS/meta refresh.
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  return res.status(200).send(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(name)} | Professional Store</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="product">
<meta property="og:title" content="${escapeHtml(name)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${safeProductUrl}">
${image ? `<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:secure_url" content="${escapeHtml(image)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:alt" content="${escapeHtml(name)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(name)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ''}
<meta http-equiv="refresh" content="0;url=${safeProductUrl}">
</head>
<body>
<a href="${safeProductUrl}">فتح المنتج</a>
<script>location.replace(${JSON.stringify(productUrl)});</script>
</body>
</html>`);
}

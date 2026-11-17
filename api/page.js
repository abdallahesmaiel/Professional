// يعرض صفحة المنتج (?product=ID) مع عنوان ووصف وصورة وبيانات Product جاهزة لجوجل داخل HTML نفسه
const fs = require('fs'), path = require('path');
const DB = 'https://rashfa-9d95d-default-rtdb.asia-southeast1.firebasedatabase.app';
const CLOUD = 'dzprjrvu7';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ld = o => JSON.stringify(o).replace(/</g, '\\u003c');

module.exports = async (req, res) => {
  let html;
  try { html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8'); }
  catch (e) { res.statusCode = 500; return res.end('index.html not found'); }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  try {
    const id = String((req.query && req.query.product) || '');
    if (!/^[-\w]{1,80}$/.test(id)) return res.end(html);
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 3000);
    const r = await fetch(`${DB}/products/${id}.json`, { signal: ac.signal }); clearTimeout(t);
    const d = r.ok ? await r.json() : null;
    if (!d || (d.vendorId && (d.approval !== 'approved' || d.vendorSuspended === true))) return res.end(html);
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const origin = 'https://' + host, url = `${origin}/?product=${encodeURIComponent(id)}`;
    const name = String(d.name || 'منتج');
    const desc = String(d.description || ('اشترِ ' + name + ' من متجر بروفيشنال بأفضل سعر مع توصيل سريع.')).replace(/\s+/g, ' ').slice(0, 160);
    let img = d.image || (d.cloudinary_public_id ? `https://res.cloudinary.com/${CLOUD}/image/upload/${d.cloudinary_public_id}` : '');
    if (img && img.startsWith('/')) img = origin + img;
    const price = Number(d.finalPrice || d.price) || 0;
    const stock = d.stock !== undefined ? Number(d.stock) : (d.quantity !== undefined ? Number(d.quantity) : null);
    const avail = (d.inStock === false || (stock !== null && stock <= 0)) ? 'OutOfStock' : 'InStock';
    const title = `${name} | بروفيشنال`;
    const prod = { '@context': 'https://schema.org', '@type': 'Product', name, description: desc, sku: String(d.barcode || id), url,
      ...(img ? { image: [img] } : {}), ...(d.brand ? { brand: { '@type': 'Brand', name: String(d.brand) } } : {}),
      offers: { '@type': 'Offer', url, priceCurrency: 'EGP', price: price.toFixed(2), availability: 'https://schema.org/' + avail, itemCondition: 'https://schema.org/NewCondition' } };
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/<meta name="description"[^>]*>/, '')
      .replace(/<meta property="og:(title|description|type)"[^>]*>/g, '');
    const head = `<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">` +
      `<meta property="og:type" content="product"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">` +
      (img ? `<meta property="og:image" content="${esc(img)}"><meta name="twitter:image" content="${esc(img)}">` : '') +
      `<script type="application/ld+json">${ld(prod)}</script>`;
    html = html.replace('</head>', head + '</head>');
    html = html.replace(/<body([^>]*)>/, `<body$1><noscript><h1>${esc(name)}</h1><p>${esc(desc)}</p>${img ? `<img src="${esc(img)}" alt="${esc(name)}" width="400">` : ''}<p>السعر: ${price} ج.م</p></noscript>`);
  } catch (e) { /* أي خطأ: نعرض الصفحة العادية */ }
  res.end(html);
};

// خريطة الموقع: الرئيسية + كل منتج معتمد (مع صوره) — تتحدث تلقائيًا
const DB = 'https://rashfa-9d95d-default-rtdb.asia-southeast1.firebasedatabase.app';
const CLOUD = 'dzprjrvu7';
const x = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
module.exports = async (req, res) => {
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host);
  let urls = `<url><loc>${origin}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`;
  try {
    const r = await fetch(`${DB}/products.json`); const all = r.ok ? await r.json() : {};
    let n = 0;
    for (const id of Object.keys(all || {})) {
      const d = all[id]; if (!d || n >= 49000) continue;
      if (d.vendorId && (d.approval !== 'approved' || d.vendorSuspended === true)) continue;
      if (!/^[-\w]+$/.test(id)) continue;
      const img = d.image || (d.cloudinary_public_id ? `https://res.cloudinary.com/${CLOUD}/image/upload/${d.cloudinary_public_id}` : '');
      urls += `<url><loc>${origin}/?product=${encodeURIComponent(id)}</loc><changefreq>weekly</changefreq><priority>0.8</priority>` +
        (img && /^https?:/.test(img) ? `<image:image><image:loc>${x(img)}</image:loc><image:title>${x(d.name || '')}</image:title></image:image>` : '') + `</url>`;
      n++;
    }
  } catch (e) {}
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls}</urlset>`);
};

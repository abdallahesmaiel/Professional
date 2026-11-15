// تشغيل:  node generate-sitemap.mjs   (يحتاج Node 18+ واتصال بالإنترنت)
// بيقرأ المنتجات من Firebase ويكتب sitemap.xml جاهز لرفعه بجانب index.html
import { writeFileSync } from 'node:fs';
const SITE = process.env.SITE || 'https://professional-rose.vercel.app';
const DB = 'https://rashfa-9d95d-default-rtdb.asia-southeast1.firebasedatabase.app';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const res = await fetch(`${DB}/products.json`);
if (!res.ok) throw new Error('تعذر قراءة المنتجات: ' + res.status + ' (تأكدي أن قراءة products عامة في القواعد)');
const data = (await res.json()) || {};
const today = new Date().toISOString().slice(0, 10);
const urls = [`<url><loc>${SITE}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>`];
const cats = new Set();
for (const [id, p] of Object.entries(data)) {
  if (!p || (p.vendorId && p.approval !== 'approved')) continue;
  if (p.category) cats.add(p.category);
  const last = p.updatedAt || p.createdAt;
  const lm = last ? new Date(Number(last)).toISOString().slice(0, 10) : today;
  urls.push(`<url><loc>${esc(`${SITE}/?product=${encodeURIComponent(id)}`)}</loc><lastmod>${lm}</lastmod><priority>0.8</priority></url>`);
}
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
console.log(`تم: ${urls.length} رابط (${cats.size} قسم) → sitemap.xml`);

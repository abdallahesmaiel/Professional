module.exports = (req, res) => {
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  res.end(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
};

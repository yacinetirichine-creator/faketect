import { sitemapConfig } from '../src/config/seo.js';

function generateSitemap() {
  const { hostname, routes } = sitemapConfig;
  const today = new Date().toISOString().split('T')[0];

  const urls = routes.map(route => `
  <url>
    <loc>${hostname}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls}
</urlset>`;
}

console.log(generateSitemap());

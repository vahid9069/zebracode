import { readFileSync, writeFileSync } from 'fs';

const tools = JSON.parse(readFileSync('./scripts/tools.json', 'utf-8'));
const BASE_URL = 'https://zebracode.ir';
const today = new Date().toISOString().split('T')[0];

const staticRoutes = [
    { path: '', lastmod: today, priority: 1.0 },
    { path: 'about', lastmod: today, priority: 0.8 },
];

const toolRoutes = tools.map(t => ({ path: t.path, lastmod: t.lastmod || today, priority: 0.9 }));
const faUrls = [...staticRoutes, ...toolRoutes];
const enUrls = faUrls.map(u => ({ ...u, path: u.path ? `en/${u.path}` : 'en' }));
const urls = [...faUrls, ...enUrls];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(u => `  <url>
    <loc>${BASE_URL}/${u.path}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
    ${u.path.startsWith('en/') ? `<xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/${u.path}" />\n    <xhtml:link rel="alternate" hreflang="fa-IR" href="${BASE_URL}/${u.path.replace(/^en\//, '')}" />` : `<xhtml:link rel="alternate" hreflang="fa-IR" href="${BASE_URL}/${u.path}" />\n    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/${u.path}" />`}
  </url>`).join('\n')}
</urlset>`;

writeFileSync('out/sitemap.xml', sitemap, 'utf8');
console.log(`✅ sitemap.xml generated with ${urls.length} URLs`);
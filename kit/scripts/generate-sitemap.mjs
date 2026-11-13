import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const toolsModule = await import('../src/lib/tools.ts');
const { TOOLS } = toolsModule;

const envBase = process.env.NEXT_PUBLIC_BASE_URL || 'https://kit.zebracode.ir';
const BASE_URL = (envBase.includes('localhost') ? 'https://kit.zebracode.ir' : envBase).replace(/\/+$/, '');

const today = new Date().toISOString().split('T')[0];

const urls = [
  { loc: `${BASE_URL}/`, enLoc: `${BASE_URL}/en/`, priority: '1.0', changefreq: 'daily' },
  { loc: `${BASE_URL}/en/`, faLoc: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily' },
  ...TOOLS.flatMap((tool) => [
    {
      loc: `${BASE_URL}/${tool.slug}/`,
      altLoc: `${BASE_URL}/en/${tool.slug}/`,
      altLang: 'en',
      lang: 'fa',
      priority: '0.9',
      changefreq: 'weekly',
    },
    {
      loc: `${BASE_URL}/en/${tool.slug}/`,
      altLoc: `${BASE_URL}/${tool.slug}/`,
      altLang: 'fa',
      lang: 'en',
      priority: '0.9',
      changefreq: 'weekly',
    },
  ]),
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    ${u.altLoc ? `<xhtml:link rel="alternate" hreflang="${u.altLang}" href="${u.altLoc}" />` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

const outPublicDir = join(__dirname, '../public');
mkdirSync(outPublicDir, { recursive: true });
writeFileSync(join(outPublicDir, 'sitemap.xml'), sitemapXml, 'utf8');

try {
  const outBuildDir = join(__dirname, '../out');
  mkdirSync(outBuildDir, { recursive: true });
  writeFileSync(join(outBuildDir, 'sitemap.xml'), sitemapXml, 'utf8');
} catch {
  // out directory might not exist yet
}

console.log(`✓ kit sitemap.xml generated with ${urls.length} URLs (bilingual FA & EN) successfully.`);

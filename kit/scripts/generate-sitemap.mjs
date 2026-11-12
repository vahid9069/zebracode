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
  { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily' },
  ...TOOLS.map((tool) => ({
    loc: `${BASE_URL}/${tool.slug}/`,
    priority: '0.9',
    changefreq: 'weekly',
  })),
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
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

console.log(`✓ kit sitemap.xml generated with ${urls.length} URLs successfully.`);

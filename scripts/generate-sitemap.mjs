import { readFileSync, writeFileSync } from 'fs';

const tools = JSON.parse(readFileSync('./scripts/tools.json', 'utf-8'));
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://zebracode.ir').replace(/\/+$/, '');

const staticRoutes = [
    { path: '', priority: 1.0 },
    { path: 'about', priority: 0.8 },
];

const toolRoutes = tools.map(t => ({ path: t.path, priority: 0.9 }));
const faUrls = [...staticRoutes, ...toolRoutes];
const enUrls = faUrls.map(u => ({ ...u, path: u.path ? `en/${u.path}` : 'en' }));
const urls = [...faUrls, ...enUrls];
const location = (path) => `${BASE_URL}/${path ? `${path}/` : ''}`;
const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(u => `  <url>
    <loc>${escapeXml(location(u.path))}</loc>
    <priority>${u.priority}</priority>
    ${(() => {
        const isEnglish = u.path === 'en' || u.path.startsWith('en/');
        const faPath = isEnglish ? u.path.replace(/^en\/?/, '') : u.path;
        const enPath = isEnglish ? u.path : u.path ? `en/${u.path}` : 'en';
        return `<xhtml:link rel="alternate" hreflang="fa-IR" href="${escapeXml(location(faPath))}" />\n    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(location(enPath))}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(location(faPath))}" />`;
    })()}
  </url>`).join('\n')}
</urlset>`;

writeFileSync('out/sitemap.xml', sitemap, 'utf8');
writeFileSync('out/robots.txt', `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /
User-agent: Claude-Web
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /
# Google-Extended controls Gemini and other Google AI training crawlers.
User-agent: Google-Extended
Allow: /
# Google-CloudVertexBot is used for Gemini grounding in Vertex AI.
User-agent: Google-CloudVertexBot
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: Meta-ExternalAgent
Allow: /
User-agent: Bytespider
Allow: /
User-agent: cohere-ai
Allow: /
User-agent: Amazonbot
Allow: /
User-agent: YouBot
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`, 'utf8');
console.log(`sitemap.xml generated with ${urls.length} URLs`);
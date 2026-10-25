import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import nextEnv from '@next/env';

// Postbuild is a separate Node process: load the same production .env layers as Next.
nextEnv.loadEnvConfig(process.cwd(), false);

const tools = JSON.parse(readFileSync('./scripts/tools.json', 'utf-8'));
const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://zebracode.ir').replace(/\/+$/, '');
const pathUrl = (path) => `${baseUrl}/${path ? `${path}/` : ''}`;

const sections = [
    {
        locale: 'fa',
        heading: 'Persian (fa-IR)',
        home: pathUrl(''),
        about: pathUrl('about'),
        homeLabel: 'خانه زبرا کد',
        aboutLabel: 'درباره زبرا کد',
        title: 'ابزارهای رایگان توسعه‌دهندگان',
        description: 'ابزارهای آنلاین رایگان برای تبدیل و پردازش داده؛ عملیات در مرورگر انجام می‌شود.',
        aboutDescription: 'درباره ZebraCode و ابزارهای توسعه‌دهندگان آن.',
        titleKey: 'titleFa',
        descriptionKey: 'descriptionFa',
        prefix: '',
    },
    {
        locale: 'en',
        heading: 'English (en)',
        home: pathUrl('en'),
        about: pathUrl('en/about'),
        homeLabel: 'ZebraCode Home',
        aboutLabel: 'About ZebraCode',
        title: 'ZebraCode Free Developer Tools',
        description: 'Free online tools for data conversion and processing. Operations run in your browser.',
        aboutDescription: 'Learn about ZebraCode and its developer tools.',
        titleKey: 'titleEn',
        descriptionKey: 'descriptionEn',
        prefix: 'en/',
    },
];

const content = [
    '# ZebraCode',
    '> Free, browser-based developer utilities for data conversion and processing.',
    '',
    '## Detailed tool guides',
    `- [Localized developer utility guides](${baseUrl}/llms-full.txt): Definitions, usage steps, examples, limitations, FAQs and reference links for the 23 new developer utilities in Persian and English.`,
    '',
    ...sections.flatMap((section) => [
        `## ${section.heading}`,
        `- [${section.homeLabel}](${section.home}): ${section.title}. ${section.description}`,
        `- [${section.aboutLabel}](${section.about}): ${section.aboutDescription}`,
        ...tools.map((tool) => {
            const title = tool[section.titleKey] || tool.titleEn || tool.titleFa;
            const description = tool[section.descriptionKey] || tool.descriptionEn || tool.descriptionFa || '';
            const url = pathUrl(`${section.prefix}${tool.path}`);
            return `- [${title}](${url}): ${description}`;
        }),
        '',
    ]),
].join('\n');

mkdirSync('out', { recursive: true });
writeFileSync('public/llms.txt', content, 'utf8');
writeFileSync('out/llms.txt', content, 'utf8');
console.log(`llms.txt generated with ${tools.length} tools in each language`);

// Supplemental plain-text discovery aid; the linked HTML pages remain canonical.
// Reuse the exact same authored content as the visible guides and FAQ schema.
const detailed = [
    '# ZebraCode — Developer Utility Guides',
    '> Public guides for 23 browser-local developer utilities, in Persian and English. Canonical sources are the linked tool pages; this file is a supplemental discovery aid, not a guarantee of indexing or AI citations.',
    '',
];
for (const section of sections) {
    const locale = section.locale;
    const labels = JSON.parse(readFileSync(`./src/dictionaries/${locale}/developer-content-ui.json`, 'utf8'));
    const catalog = {
        ...JSON.parse(readFileSync(`./src/dictionaries/${locale}/developer-content-one.json`, 'utf8')),
        ...JSON.parse(readFileSync(`./src/dictionaries/${locale}/developer-content-two.json`, 'utf8')),
    };
    detailed.push(`## ${section.heading}`, '');
    for (const [slug, guide] of Object.entries(catalog)) {
        if (!tools.some(tool => tool.path === slug)) throw new Error(`Guide has no registered route: ${slug}`);
        detailed.push(`### ${guide.seoTitle}`, '', `Source: ${pathUrl(`${section.prefix}${slug}`)}`, '', guide.answer, '',
            `#### ${labels.steps}`, ...guide.steps.map((step, index) => `${index + 1}. ${step}`), '',
            `#### ${labels.useCases}`, ...guide.useCases.map(useCase => `- ${useCase}`), '',
            `#### ${labels.limitations}`, ...guide.limitations.map(limit => `- ${limit}`), '',
            `#### ${labels.example}`, labels.input, '```text', guide.example.input, '```', labels.output, '```text', guide.example.output, '```', '',
            `#### ${labels.faq}`, ...guide.faq.flatMap(item => [`Q: ${item.question}`, `A: ${item.answer}`, '']),
            `#### ${labels.related}`, ...guide.relatedSlugs.map(related => `- ${pathUrl(`${section.prefix}${related}`)}`), '',
            `#### ${labels.references}`, ...(guide.references || []).map(reference => `- [${reference.label}](${reference.url})`), '');
    }
}
const fullContent = detailed.join('\n');
writeFileSync('public/llms-full.txt', fullContent, 'utf8');
writeFileSync('out/llms-full.txt', fullContent, 'utf8');
console.log('llms-full.txt generated from the 46 localized developer guides');

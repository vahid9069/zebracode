import { mkdirSync, readFileSync, writeFileSync } from 'fs';

const tools = JSON.parse(readFileSync('./scripts/tools.json', 'utf-8'));
const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://zebracode.ir').replace(/\/+$/, '');
const pathUrl = (path) => `${baseUrl}/${path ? `${path}/` : ''}`;

const sections = [
    {
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

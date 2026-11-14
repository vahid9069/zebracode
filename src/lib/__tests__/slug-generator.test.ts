import { describe, it, expect } from 'vitest';
import {
    normalizePersian,
    transliteratePersianToLatin,
    generateSlug,
    generateAllSlugVariants,
    generateBatchSlugs,
    DEFAULT_SLUG_OPTIONS,
} from '../slug-generator/slugger';

describe('slug-generator', () => {
    describe('normalizePersian', () => {
        it('normalizes Arabic characters to Persian and handles zero-width spaces', () => {
            const raw = 'آموزش\u200Cهای يادگيري كدنویسی با چای و قهوة';
            const normalized = normalizePersian(raw);
            expect(normalized).toContain('یادگیری');
            expect(normalized).toContain('کدنویسی');
            expect(normalized).toContain('قهوه');
            expect(normalized).not.toContain('\u200C');
        });
    });

    describe('transliteratePersianToLatin', () => {
        it('transliterates Persian letters phonetically to Latin / Pinglish', () => {
            const result = transliteratePersianToLatin('آموزش برنامه نویسی');
            expect(result).toBe('amvzsh brnamh nvisi');
        });

        it('transliterates Persian digits to Latin numbers', () => {
            const result = transliteratePersianToLatin('نکته ۱۲۳۴۵');
            expect(result).toBe('nkth 12345');
        });
    });

    describe('generateSlug', () => {
        it('generates a clean Persian slug by default with hyphen separator', () => {
            const slug = generateSlug('آموزش جامع جاوااسکریپت در ۲۰۲۶!');
            expect(slug).toBe('آموزش-جامع-جاوااسکریپت-در-2026');
        });

        it('supports transliteration / Pinglish mode', () => {
            const slug = generateSlug('آموزش برنامه نویسی', { mode: 'transliterate' });
            expect(slug).toBe('amvzsh-brnamh-nvisi');
        });

        it('supports ASCII-only mode by stripping non-ASCII characters', () => {
            const slug = generateSlug('Learn Next.js 15 & React برای همه', { mode: 'ascii' });
            expect(slug).toBe('learn-next-js-15-react');
        });

        it('removes stop words in both Persian and English when removeStopWords is enabled', () => {
            const input = 'راهنمای جامع برای یادگیری پایتون در یک هفته و the ultimate guide';
            const slug = generateSlug(input, { removeStopWords: true });
            // 'برای', 'در', 'یک', 'و' and 'the' should be stripped
            expect(slug).not.toContain('برای');
            expect(slug).not.toContain(' the ');
            expect(slug).toContain('راهنمای-جامع-یادگیری-پایتون');
        });

        it('supports different separators: underscore, dot, slash', () => {
            expect(generateSlug('Hello World Test', { separator: '_' })).toBe('hello_world_test');
            expect(generateSlug('Hello World Test', { separator: '.' })).toBe('hello.world.test');
            expect(generateSlug('Hello World Test', { separator: '/' })).toBe('hello/world/test');
        });

        it('respects maxLength and trims cleanly on word boundaries', () => {
            const longTitle = 'this is a very long title that needs to be truncated cleanly without breaking';
            const slug = generateSlug(longTitle, { maxLength: 30 });
            expect(slug.length).toBeLessThanOrEqual(30);
            expect(slug.endsWith('-')).toBe(false);
            expect(slug).toBe('this-is-a-very-long-title');
        });

        it('strips numbers when stripNumbers is true', () => {
            const slug = generateSlug('Top 10 Programming Languages of 2026', { stripNumbers: true });
            expect(slug).not.toMatch(/[0-9]/);
            expect(slug).toBe('top-programming-languages-of');
        });

        it('returns an empty string when given empty or whitespace-only input', () => {
            expect(generateSlug('')).toBe('');
            expect(generateSlug('   \t\n  ')).toBe('');
        });
    });

    describe('generateAllSlugVariants', () => {
        it('returns all slug variants including URL-encoded and full URL', () => {
            const variants = generateAllSlugVariants('طراحی سایت با Next.js', {
                domainPrefix: 'https://example.com/posts/',
            });

            expect(variants.persian).toBe('طراحی-سایت-با-next-js');
            expect(variants.transliterated).toBe('trahi-sait-ba-next-js');
            expect(variants.urlEncoded).toBe(encodeURIComponent('طراحی-سایت-با-next-js'));
            expect(variants.fullUrl).toBe('https://example.com/posts/طراحی-سایت-با-next-js');
        });
    });

    describe('generateBatchSlugs', () => {
        it('processes multiple lines into batch slug items', () => {
            const input = `
                مقاله اول: شروع به کار با نکست جی اس
                آموزش تایپ اسکریپت ۲۰۲۶
                Best Practices for Web Development
            `;

            const batch = generateBatchSlugs(input);
            expect(batch.length).toBe(3);
            expect(batch[0].original).toBe('مقاله اول: شروع به کار با نکست جی اس');
            expect(batch[0].slug).toBe('مقاله-اول-شروع-به-کار-با-نکست-جی-اس');
            expect(batch[1].slug).toBe('آموزش-تایپ-اسکریپت-2026');
            expect(batch[2].slug).toBe('best-practices-for-web-development');
        });
    });
});

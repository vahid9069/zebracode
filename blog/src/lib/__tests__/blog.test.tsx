import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getAllPosts, getCategories, getPostBySlug, getPostSummaries, getPostsByCategory, getRelatedPosts } from '@/lib/repository';
import { filterPosts } from '@/lib/search';
import { absoluteUrl, categoryPath, formatDate, getToolUrl, postPath } from '@/lib/site';
import ArticleCatalog from '@/components/ArticleCatalog';
import ArticleReader from '@/components/ArticleReader';
import ArticlePage, { generateMetadata, generateStaticParams } from '@/app/articles/[slug]/page';
import { generateStaticParams as categoryParams } from '@/app/category/[slug]/page';
import sitemap from '@/app/sitemap';

describe('static Persian blog content', () => {
    it('provides eight complete articles across five populated categories', async () => {
        const posts = await getAllPosts();
        const categories = await getCategories();
        expect(posts).toHaveLength(8);
        expect(categories).toHaveLength(5);
        expect(new Set(posts.map(post => post.slug)).size).toBe(posts.length);
        expect(posts.some(post => post.featured)).toBe(true);
        for (const category of categories) expect(posts.some(post => post.category === category.slug)).toBe(true);
        for (const post of posts) {
            expect(post.excerpt.length).toBeGreaterThan(50);
            expect(post.blocks.filter(block => block.type === 'heading').length).toBeGreaterThanOrEqual(3);
            expect(post.blocks.some(block => block.type === 'code')).toBe(true);
            expect(post.faq.length).toBeGreaterThanOrEqual(2);
            expect(post.tools).toHaveLength(2);
            expect(post.readingMinutes).toBeGreaterThan(0);
            expect(new Date(post.publishedAt).toISOString()).not.toBe('Invalid Date');
            const ids = post.blocks.filter(block => block.type === 'heading').map(block => block.id);
            expect(ids.every(id => /^[a-z][a-z0-9-]+$/.test(id))).toBe(true);
            expect(new Set(ids).size).toBe(ids.length);
        }
    });

    it('returns chronological data with lightweight summaries and safe copies', async () => {
        const posts = await getAllPosts();
        expect(posts.map(post => post.publishedAt)).toEqual(posts.map(post => post.publishedAt).sort().reverse());
        const summaries = await getPostSummaries();
        expect(summaries.every(post => !('blocks' in post) && !('tools' in post) && !('faq' in post))).toBe(true);
        const original = posts[0].title;
        posts[0].title = 'mutated'; posts[0].blocks.length = 0;
        expect((await getPostBySlug(posts[0].slug))?.title).toBe(original);
        expect((await getPostBySlug(posts[0].slug))?.blocks.length).toBeGreaterThan(0);
        expect(await getPostBySlug('not-an-article')).toBeUndefined();
    });

    it('filters categories and prioritizes related articles without self links', async () => {
        const post = (await getPostBySlug('json-to-typescript'))!;
        const related = await getRelatedPosts(post, 3);
        expect(related).toHaveLength(3);
        expect(related.every(item => item.slug !== post.slug)).toBe(true);
        expect(related[0].category).toBe(post.category);
        expect(await getRelatedPosts(post, 0)).toEqual([]);
        expect(await getRelatedPosts(post, -5)).toEqual([]);
        expect((await getPostsByCategory('security')).every(item => item.category === 'security')).toBe(true);
        expect(await getPostsByCategory('missing')).toEqual([]);
    });

    it('normalizes Persian/Arabic letters, half-spaces and diacritics in searches', async () => {
        const posts = await getPostSummaries();
        const sample = { ...posts[0], title: 'کار با نویسه‌های مخفی', excerpt: 'آموزش کاربردی کدنویسی', tags: ['JSON'] };
        expect(filterPosts([sample], 'كار')).toHaveLength(1);
        expect(filterPosts([sample], 'نُوِيسههاي')).toHaveLength(1);
        expect(filterPosts([sample], 'کار JSON')).toHaveLength(1);
        expect(filterPosts([sample], 'کار missing')).toHaveLength(0);
        expect(filterPosts(posts, '  ')).toHaveLength(8);
        expect(filterPosts(posts, '', 'security').every(post => post.category === 'security')).toBe(true);
        expect(filterPosts(posts, 'عبارت-ناموجود-برای-تست')).toEqual([]);
    });
});

describe('blog routing and metadata', () => {
    it('generates every article/category with no API requests', async () => {
        expect(await generateStaticParams()).toHaveLength(8);
        expect(await categoryParams()).toHaveLength(5);
        expect(await sitemap()).toHaveLength(14);
        expect(postPath('json-debugging')).toBe('/articles/json-debugging/');
        expect(categoryPath('data')).toBe('/category/data/');
        expect(new URL(absoluteUrl(postPath('json-debugging'))).pathname).toBe('/blog/articles/json-debugging/');
        expect(new URL(getToolUrl('json-format')).pathname).toBe('/json-format/');
        expect(formatDate('2026-10-17')).not.toContain('Invalid');
    });

    it('sets specific article canonical/social metadata and rejects unknown articles', async () => {
        const post = (await getPostBySlug('json-debugging'))!;
        const metadata = await generateMetadata({ params: Promise.resolve({ slug: post.slug }) });
        expect(metadata.title).toBe(post.title);
        expect(metadata.description).toBe(post.excerpt);
        expect(metadata.alternates?.canonical).toBe(absoluteUrl(postPath(post.slug)));
        expect(metadata.openGraph).toMatchObject({ type: 'article', locale: 'fa_IR' });
        await expect(ArticlePage({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow();
    });
});

describe('server-rendered Persian reading experience', () => {
    it('includes home search, categories and every actual article', async () => {
        const posts = await getPostSummaries(); const categories = await getCategories();
        const html = renderToStaticMarkup(<ArticleCatalog initialPosts={posts} categories={categories} home featured={posts[0]} />);
        expect(html).toContain('role="search"');
        expect(html).toContain('aria-live="polite"');
        expect(html).toContain('aria-pressed="true"');
        expect(html).toContain('کمتر جست‌وجو کن،');
        for (const post of posts) expect(html).toContain(post.slug);
    });

    it('renders readable code, TOC, FAQ and tools for every article with matching JSON-LD', async () => {
        for (const post of await getAllPosts()) {
            const html = renderToStaticMarkup(await ArticlePage({ params: Promise.resolve({ slug: post.slug }) }));
            expect(html.match(/<h1[ >]/g)).toHaveLength(1);
            expect(html).toContain('dir="rtl"');
            expect(html).toContain('dir="ltr"');
            expect(html).toContain('کپی کد');
            expect(html).toContain('id="reading-faq"');
            for (const heading of post.blocks.filter(block => block.type === 'heading')) {
                expect(html).toContain(`id="${heading.id}"`);
                expect(html).toContain(`href="#${heading.id}"`);
            }
            const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
            const article = data['@graph'].find((node: { '@type': string }) => node['@type'] === 'BlogPosting');
            const faq = data['@graph'].find((node: { '@type': string }) => node['@type'] === 'FAQPage');
            expect(article.headline).toBe(post.title);
            expect(article.author.name).toBe(post.author.name);
            expect(faq.mainEntity.map((item: { name: string }) => item.name)).toEqual(post.faq.map(item => item.question));
        }
    });

    it('treats code and body strings as text, never executable markup', async () => {
        const post = (await getPostBySlug('json-debugging'))!;
        post.blocks = [{ type: 'paragraph', text: '<img src=x onerror=alert(1)>' }, { type: 'code', language: 'html', code: '<script>alert(1)</script>' }];
        const html = renderToStaticMarkup(<ArticleReader post={post} categories={await getCategories()} related={[]} />);
        expect(html).toContain('&lt;script&gt;');
        expect(html).toContain('&lt;img');
        expect(html).not.toContain('<img src=x');
        expect(html).not.toContain('<script>alert');
    });
});

import { categories } from '@/content/categories';
import { curlToFetchGuide } from '@/content/curl-to-fetch-guide';
import { envFileGuide } from '@/content/env-file-guide';
import { httpStatusGuide } from '@/content/http-status-guide';
import { invisibleWhitespace } from '@/content/invisible-whitespace';
import { jsonDebugging } from '@/content/json-debugging';
import { jsonToTypescript } from '@/content/json-to-typescript';
import { jwtVerification } from '@/content/jwt-verification';
import { uuidV4V7 } from '@/content/uuid-v4-v7';
import type { Category, Post, PostSummary } from '@/lib/types';

// Static data behind an async repository boundary for a future API; no WordPress connection yet.
const fallbackPosts: Post[] = [
    jsonDebugging, jsonToTypescript, uuidV4V7, jwtVerification,
    curlToFetchGuide, httpStatusGuide, invisibleWhitespace, envFileGuide,
].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));

const remoteCategorySlugs = new Set(['data', 'development', 'security', 'network', 'productivity']);

async function getPosts(): Promise<Post[]> {
    const endpoint = process.env.WORDPRESS_BLOG_API_URL?.trim();
    if (!endpoint) return fallbackPosts;

    try {
        const response = await fetch(endpoint.replace(/\/$/, '') + '/posts?per_page=100', { cache: 'force-cache' });
        if (!response.ok) return fallbackPosts;
        const payload = await response.json() as { items?: unknown[] };
        const remotePosts = (payload.items || []).map(toPost).filter((post): post is Post => post !== undefined);
        return remotePosts.length > 0 ? remotePosts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)) : fallbackPosts;
    } catch {
        return fallbackPosts;
    }
}

function toPost(value: unknown): Post | undefined {
    if (!value || typeof value !== 'object') return undefined;
    const item = value as Record<string, unknown>;
    const slug = typeof item.slug === 'string' ? item.slug : '';
    const title = typeof item.title === 'string' ? item.title : '';
    if (!slug || !title) return undefined;

    const categoryValue = typeof item.category === 'string' && remoteCategorySlugs.has(item.category) ? item.category : 'development';
    const tags = Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === 'string') : [];
    const authorValue = item.author && typeof item.author === 'object' ? item.author as Record<string, unknown> : {};
    const authorName = typeof authorValue.name === 'string' ? authorValue.name : 'تحریریه زبراکد';
    const blocks = htmlToBlocks(typeof item.content === 'string' ? item.content : '');
    const publishedAt = typeof item.published_at === 'string' ? item.published_at : new Date().toISOString();
    const updatedAt = typeof item.updated_at === 'string' ? item.updated_at : undefined;
    const faq = Array.isArray(item.faq) ? item.faq.filter((entry): entry is { question: string; answer: string } => Boolean(entry && typeof entry === 'object' && typeof (entry as Record<string, unknown>).question === 'string' && typeof (entry as Record<string, unknown>).answer === 'string')) : [];
    const relatedTools = Array.isArray(item.related_tools) ? item.related_tools.filter((tool): tool is string => typeof tool === 'string') : [];

    return {
        slug,
        title,
        excerpt: typeof item.excerpt === 'string' ? item.excerpt : '',
        category: categoryValue as Post['category'],
        kind: 'guide',
        level: 'intermediate',
        publishedAt,
        ...(updatedAt ? { updatedAt } : {}),
        readingMinutes: Math.max(1, Math.ceil(blocks.reduce((total, block) => total + (block.type === 'paragraph' ? block.text.split(/\s+/).length : 0), 0) / 220)),
        featured: false,
        cover: categoryValue === 'security' ? 'security' : categoryValue === 'network' ? 'network' : 'code',
        tags,
        author: {
            name: authorName,
            role: typeof authorValue.role === 'string' ? authorValue.role : 'تحریریه زبراکد',
            bio: typeof authorValue.bio === 'string' ? authorValue.bio : 'یادداشت‌های کاربردی برای ساختن نرم‌افزار بهتر.',
            initials: authorName.slice(0, 2),
        },
        blocks,
        tools: relatedTools.map(slug => ({ slug, title: slug, description: 'ابزار مرتبط زبراکد.' })),
        faq,
        references: [],
        ...(typeof item.meta_description === 'string' && item.meta_description.trim() ? { metaDescription: item.meta_description.trim() } : {}),
    };
}

function htmlToBlocks(html: string): Post['blocks'] {
    const blocks: Post['blocks'] = [];
    const pattern = /<(h[2-6]|p|ul|ol|pre)(?:\s[^>]*)?>([\s\S]*?)<\/\1\s*>/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
        const tag = match[1].toLowerCase();
        const inner = match[2];
        if (tag === 'pre') {
            const languageMatch = inner.match(/class=["'][^"']*language-([a-zA-Z0-9_+#.-]+)[^"']*["']/i);
            const code = inner.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
            if (code) blocks.push({ type: 'code', language: languageMatch?.[1] ?? 'text', code });
        } else if (tag === 'ul' || tag === 'ol') {
            const items = [...inner.matchAll(/<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi)].map(item => stripHtml(item[1])).filter(Boolean);
            if (items.length) blocks.push({ type: 'list', items });
        } else if (tag.startsWith('h')) {
            const title = stripHtml(inner);
            if (title) blocks.push({ type: 'heading', id: slugify(title), title });
        } else {
            const text = stripHtml(inner);
            if (text) blocks.push({ type: 'paragraph', text });
        }
    }
    return blocks.length ? blocks : [{ type: 'paragraph', text: stripHtml(html) || 'این مقاله هنوز محتوایی ندارد.' }];
}

function stripHtml(value: string): string {
    return value.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

function slugify(value: string): string {
    return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
}

function summarize(post: Post): PostSummary {
    return {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        kind: post.kind,
        level: post.level,
        publishedAt: post.publishedAt,
        ...(post.updatedAt ? { updatedAt: post.updatedAt } : {}),
        readingMinutes: post.readingMinutes,
        featured: post.featured,
        cover: post.cover,
        tags: [...post.tags],
        author: { ...post.author },
    };
}

export async function getAllPosts(): Promise<Post[]> {
    return structuredClone(await getPosts());
}

export async function getPostSummaries(): Promise<PostSummary[]> {
    return (await getPosts()).map(summarize);
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
    const post = (await getPosts()).find(item => item.slug === slug);
    return post ? structuredClone(post) : undefined;
}

export async function getCategories(): Promise<Category[]> {
    return categories.map(category => ({ ...category }));
}

export async function getPostsByCategory(slug: string): Promise<PostSummary[]> {
    return (await getPosts()).filter(post => post.category === slug).map(summarize);
}

export async function getRelatedPosts(post: Post, limit = 3): Promise<PostSummary[]> {
    const others = (await getPosts()).filter(candidate => candidate.slug !== post.slug);
    const ordered = [
        ...others.filter(candidate => candidate.category === post.category),
        ...others.filter(candidate => candidate.category !== post.category),
    ];
    return ordered.slice(0, Math.max(0, Math.floor(limit))).map(summarize);
}

export { filterPosts } from './search';

import { categories } from '@/content/categories';
import { curlToFetchGuide } from '@/content/curl-to-fetch-guide';
import { envFileGuide } from '@/content/env-file-guide';
import { httpStatusGuide } from '@/content/http-status-guide';
import { invisibleWhitespace } from '@/content/invisible-whitespace';
import { jsonDebugging } from '@/content/json-debugging';
import { jsonToTypescript } from '@/content/json-to-typescript';
import { jwtVerification } from '@/content/jwt-verification';
import { uuidV4V7 } from '@/content/uuid-v4-v7';
import type { Category, FeaturedImage, Post, PostSummary, RankMathSeo } from '@/lib/types';

// Static data behind an async repository boundary for a future API; no WordPress connection yet.
const fallbackPosts: Post[] = [
    jsonDebugging, jsonToTypescript, uuidV4V7, jwtVerification,
    curlToFetchGuide, httpStatusGuide, invisibleWhitespace, envFileGuide,
].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));

const remoteCategorySlugs = new Set(['tech-trends', 'development', 'tools', 'network', 'data', 'security']);

async function getPosts(): Promise<Post[]> {
    const endpoint = process.env.WORDPRESS_BLOG_API_URL?.trim();
    if (!endpoint) return fallbackPosts;

    try {
        const fetchOptions: RequestInit = process.env.NODE_ENV === 'development'
            ? { cache: 'no-store' }
            : { cache: 'force-cache' };
        const response = await fetch(endpoint.replace(/\/$/, '') + '/posts?per_page=100', fetchOptions);
        if (!response.ok) return fallbackPosts;
        const payload = await response.json() as { items?: unknown[] } | unknown[];
        const rawItems = Array.isArray(payload) ? payload : (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown[] }).items) ? (payload as { items: unknown[] }).items : []);
        const remotePosts = rawItems.map(toPost).filter((post): post is Post => post !== undefined);
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Blog API] Connected to WordPress: ${remotePosts.length} post(s) found.`);
        }
        return remotePosts.length > 0 ? remotePosts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)) : fallbackPosts;
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Blog API] Connection failed, using fallback:', err);
        }
        return fallbackPosts;
    }
}

function toPost(value: unknown): Post | undefined {
    if (!value || typeof value !== 'object') return undefined;
    const item = value as Record<string, unknown>;
    let slug = typeof item.slug === 'string' ? item.slug.trim() : '';
    try {
        if (slug.includes('%')) {
            slug = decodeURIComponent(slug);
        }
    } catch {
        // preserve original slug
    }
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    if (!slug || !title) return undefined;

    const categoryValue = typeof item.category === 'string' && item.category.trim()
        ? item.category.trim()
        : 'development';
    const tags = Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === 'string') : [];
    const authorValue = item.author && typeof item.author === 'object' ? item.author as Record<string, unknown> : {};
    const authorName = typeof authorValue.name === 'string' ? authorValue.name : 'تحریریه زبراکد';
    const blocks = htmlToBlocks(typeof item.content === 'string' ? item.content : '');
    const publishedAt = typeof item.published_at === 'string' ? item.published_at : new Date().toISOString();
    const updatedAt = typeof item.updated_at === 'string' ? item.updated_at : undefined;
    const faq = Array.isArray(item.faq) ? item.faq.filter((entry): entry is { question: string; answer: string } => Boolean(entry && typeof entry === 'object' && typeof (entry as Record<string, unknown>).question === 'string' && typeof (entry as Record<string, unknown>).answer === 'string')) : [];
    const relatedTools = Array.isArray(item.related_tools) ? item.related_tools.filter((tool): tool is string => typeof tool === 'string') : [];

    // Parse Featured Image
    let featuredImage: FeaturedImage | undefined;
    if (item.featured_image && typeof item.featured_image === 'object') {
        const fi = item.featured_image as Record<string, unknown>;
        if (typeof fi.url === 'string' && fi.url.trim()) {
            featuredImage = {
                url: fi.url.trim(),
                width: typeof fi.width === 'number' ? fi.width : undefined,
                height: typeof fi.height === 'number' ? fi.height : undefined,
                alt: typeof fi.alt === 'string' ? fi.alt : title,
            };
        }
    }

    // Parse Rank Math SEO metadata
    const seoRaw = item.seo && typeof item.seo === 'object' ? item.seo as Record<string, unknown> : {};
    const metaDescription = typeof seoRaw.description === 'string' && seoRaw.description.trim()
        ? seoRaw.description.trim()
        : typeof item.meta_description === 'string' && item.meta_description.trim()
            ? item.meta_description.trim()
            : undefined;

    const seo: RankMathSeo = {
        title: typeof seoRaw.title === 'string' && seoRaw.title.trim() ? seoRaw.title.trim() : title,
        description: metaDescription,
        focusKeyword: typeof seoRaw.focus_keyword === 'string' ? seoRaw.focus_keyword : undefined,
        canonicalUrl: typeof seoRaw.canonical_url === 'string' && seoRaw.canonical_url.trim() ? seoRaw.canonical_url.trim() : undefined,
        robots: Array.isArray(seoRaw.robots) ? seoRaw.robots.filter((r): r is string => typeof r === 'string') : undefined,
        isNoindex: Boolean(seoRaw.is_noindex),
        isNofollow: Boolean(seoRaw.is_nofollow),
        ogTitle: typeof seoRaw.og_title === 'string' ? seoRaw.og_title : undefined,
        ogDescription: typeof seoRaw.og_description === 'string' ? seoRaw.og_description : undefined,
        ogImage: typeof seoRaw.og_image === 'string' ? seoRaw.og_image : featuredImage?.url,
        twitterTitle: typeof seoRaw.twitter_title === 'string' ? seoRaw.twitter_title : undefined,
        twitterDescription: typeof seoRaw.twitter_description === 'string' ? seoRaw.twitter_description : undefined,
        twitterImage: typeof seoRaw.twitter_image === 'string' ? seoRaw.twitter_image : undefined,
    };

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
        tools: relatedTools.map(toolSlug => ({ slug: toolSlug, title: toolSlug, description: 'ابزار مرتبط زبراکد.' })),
        faq,
        references: [],
        ...(metaDescription ? { metaDescription } : {}),
        ...(featuredImage ? { featuredImage } : {}),
        seo,
    };
}

function htmlToBlocks(html: string): Post['blocks'] {
    const blocks: Post['blocks'] = [];
    const pattern = /<(h[2-6]|p|ul|ol|pre|table|blockquote)(?:\s[^>]*)?>([\s\S]*?)<\/\1\s*>/gi;
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
        } else if (tag === 'table') {
            const headers = [...inner.matchAll(/<th(?:\s[^>]*)?>([\s\S]*?)<\/th>/gi)].map(cell => stripHtml(cell[1])).filter(Boolean);
            const rowMatches = [...inner.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi)];
            const rows: string[][] = [];
            for (const rowMatch of rowMatches) {
                const cells = [...rowMatch[1].matchAll(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/gi)].map(cell => stripHtml(cell[1]));
                if (cells.length > 0) rows.push(cells);
            }
            if (headers.length > 0 || rows.length > 0) {
                blocks.push({ type: 'table', headers: headers.length ? headers : rows[0], rows: headers.length ? rows : rows.slice(1) });
            }
        } else if (tag === 'blockquote') {
            const text = stripHtml(inner);
            if (text) blocks.push({ type: 'callout', title: 'نکته', text, tone: 'note' });
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
        ...(post.featuredImage ? { featuredImage: { ...post.featuredImage } } : {}),
        ...(post.seo ? { seo: { ...post.seo } } : {}),
    };
}

export async function getAllPosts(): Promise<Post[]> {
    return structuredClone(await getPosts());
}

export async function getPostSummaries(): Promise<PostSummary[]> {
    return (await getPosts()).map(summarize);
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
    const endpoint = process.env.WORDPRESS_BLOG_API_URL?.trim();
    if (endpoint) {
        try {
            const singleUrl = `${endpoint.replace(/\/$/, '')}/posts/${encodeURIComponent(slug)}`;
            const fetchOptions: RequestInit = process.env.NODE_ENV === 'development'
                ? { cache: 'no-store' }
                : { cache: 'force-cache' };
            const response = await fetch(singleUrl, fetchOptions);
            if (response.ok) {
                const payload = await response.json() as { post?: unknown; success?: boolean };
                if (payload && payload.post) {
                    const post = toPost(payload.post);
                    if (post) return structuredClone(post);
                }
            }
        } catch {
            // fallback to finding in all posts
        }
    }
    const post = (await getPosts()).find(item => item.slug === slug);
    return post ? structuredClone(post) : undefined;
}

export async function getCategories(): Promise<Category[]> {
    const endpoint = process.env.WORDPRESS_BLOG_API_URL?.trim();
    if (endpoint) {
        try {
            const fetchOptions: RequestInit = process.env.NODE_ENV === 'development'
                ? { cache: 'no-store' }
                : { cache: 'force-cache' };
            const res = await fetch(`${endpoint.replace(/\/$/, '')}/categories`, fetchOptions);
            if (res.ok) {
                const data = await res.json() as { success?: boolean; categories?: Array<{ id: number; name: string; slug: string; count?: number; description?: string }> };
                if (data && Array.isArray(data.categories) && data.categories.length > 0) {
                    const symbolMap: Record<string, string> = {
                        tools: '⚙',
                        programming: '</>',
                        development: '</>',
                        data: '{}',
                        security: '#',
                        network: '↔',
                        productivity: '¶',
                        ai: '✦',
                        'tech-news': '⚡',
                    };
                    return data.categories.map((c) => ({
                        slug: c.slug,
                        name: c.name,
                        description: c.description || `راهنماها و مقالات مرتبط با ${c.name}.`,
                        symbol: symbolMap[c.slug] || '✦',
                        count: c.count,
                    }));
                }
            }
        } catch {
            // fallback
        }
    }
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

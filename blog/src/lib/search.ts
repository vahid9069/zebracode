import type { PostSummary } from '@/lib/types';

function normalizeSearch(value: string): string {
    return value.normalize('NFKC').toLowerCase()
        .replace(/[يى]/gu, 'ی')
        .replace(/ك/gu, 'ک')
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/gu, '')
        .replace(/[\u200C\u200D]/gu, '')
        .replace(/\s+/gu, ' ')
        .trim();
}

/** Client-safe search: never imports article bodies or the future CMS repository. */
export function filterPosts(posts: PostSummary[], query: string, category = 'all'): PostSummary[] {
    const terms = normalizeSearch(query).split(' ').filter(Boolean);
    return posts.filter(post => {
        if (category !== 'all' && post.category !== category) return false;
        const fields = [post.title, post.excerpt, ...post.tags].map(normalizeSearch);
        return terms.every(term => fields.some(field => field.includes(term) || field.replace(/ /gu, '').includes(term)));
    });
}

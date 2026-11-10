import type { MetadataRoute } from 'next';
import { getAllPosts, getCategories } from '@/lib/repository';
import { absoluteUrl, categoryPath, postPath } from '@/lib/site';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [posts, categories] = await Promise.all([getAllPosts(), getCategories()]);
    return [
        { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
        ...categories.map(category => ({ url: absoluteUrl(categoryPath(category.slug)), changeFrequency: 'weekly' as const, priority: .7 })),
        ...posts.map(post => ({ url: absoluteUrl(postPath(post.slug)), lastModified: post.updatedAt || post.publishedAt, priority: .8 })),
    ];
}

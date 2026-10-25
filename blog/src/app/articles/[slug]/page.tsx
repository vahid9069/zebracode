import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArticleReader from '@/components/ArticleReader';
import { getAllPosts, getCategories, getPostBySlug, getRelatedPosts } from '@/lib/repository';
import { absoluteUrl, categoryPath, postPath, site } from '@/lib/site';
import type { ArticleBlock } from '@/lib/types';

interface ArticlePageProps {
    params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
    const posts = await getAllPosts();
    return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);
    if (!post) notFound();
    const url = absoluteUrl(postPath(post.slug));

    return {
        title: post.title,
        description: post.metaDescription ?? post.excerpt,
        alternates: { canonical: url },
        authors: [{ name: post.author.name }],
        keywords: post.tags,
        openGraph: {
            type: 'article',
            locale: 'fa_IR',
            siteName: site.name,
            title: post.title,
                 description: post.metaDescription ?? post.excerpt,
            url,
            publishedTime: post.publishedAt,
            modifiedTime: post.updatedAt ?? post.publishedAt,
            authors: [post.author.name],
            tags: post.tags,
        },
        twitter: { card: 'summary', title: post.title, description: post.excerpt },
    };
}

function blockText(block: ArticleBlock): string {
    switch (block.type) {
        case 'paragraph': return block.text;
        case 'heading': return block.title;
        case 'list': return block.items.join('\n');
        case 'code': return [block.caption, block.code].filter(Boolean).join('\n');
        case 'callout': return `${block.title}\n${block.text}`;
        case 'table': return [block.headers, ...block.rows].map((row) => row.join(' | ')).join('\n');
    }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);
    if (!post) notFound();
    const [categories, related] = await Promise.all([getCategories(), getRelatedPosts(post, 3)]);
    const category = categories.find((item) => item.slug === post.category);
    const url = absoluteUrl(postPath(post.slug));
    const breadcrumbItems = [
        { name: 'وبلاگ', item: absoluteUrl('/') },
        ...(category ? [{ name: category.name, item: absoluteUrl(categoryPath(category.slug)) }] : []),
        { name: post.title, item: url },
    ];
    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BlogPosting',
                '@id': `${url}#article`,
                url,
                mainEntityOfPage: { '@type': 'WebPage', '@id': url },
                headline: post.title,
                description: post.excerpt,
                inLanguage: 'fa-IR',
                datePublished: post.publishedAt,
                dateModified: post.updatedAt ?? post.publishedAt,
                author: { '@type': 'Organization', name: post.author.name, description: post.author.bio },
                publisher: { '@type': 'Organization', name: site.name, url: absoluteUrl('/') },
                ...(category ? { articleSection: category.name } : {}),
                keywords: post.tags.join('، '),
                articleBody: post.blocks.map(blockText).join('\n\n'),
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${url}#breadcrumb`,
                itemListElement: breadcrumbItems.map((item, index) => ({ '@type': 'ListItem', position: index + 1, ...item })),
            },
            ...(post.faq.length > 0 ? [{
                '@type': 'FAQPage',
                '@id': `${url}#reading-faq`,
                mainEntity: post.faq.map((item) => ({
                    '@type': 'Question',
                    name: item.question,
                    acceptedAnswer: { '@type': 'Answer', text: item.answer },
                })),
            }] : []),
        ],
    };

    return (
        <>
            <ArticleReader post={post} categories={categories} related={related} />
            <script type="application/ld+json">{JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>
        </>
    );
}

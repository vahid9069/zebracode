import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getCategories, getPostsByCategory } from '@/lib/repository';
import { absoluteUrl, categoryPath, formatNumber } from '@/lib/site';
import ArticleCatalog from '@/components/ArticleCatalog';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export async function generateStaticParams() { return (await getCategories()).map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const category = (await getCategories()).find((item) => item.slug === slug);
    if (!category) notFound();
    return { title: category.name, description: category.description, alternates: { canonical: absoluteUrl(categoryPath(slug)) }, openGraph: { title: `${category.name} | وبلاگ زبراکد`, description: category.description, url: absoluteUrl(categoryPath(slug)), locale: 'fa_IR', type: 'website' } };
}

export default async function CategoryPage({ params }: Props) {
    const { slug } = await params;
    const categories = await getCategories();
    const category = categories.find((item) => item.slug === slug);
    if (!category) notFound();
    const posts = await getPostsByCategory(slug);
    const featured = posts.find((post) => post.featured) || posts[0];

    return <div className="zc-container zc-category-page"><nav className="zc-breadcrumb" aria-label="مسیر صفحه"><Link href="/">وبلاگ</Link><ChevronLeft size={14} aria-hidden="true" /><span aria-current="page">{category.name}</span></nav><header className="zc-category-header"><span className="zc-category-emblem" aria-hidden="true">{category.symbol}</span><div><span className="zc-eyebrow">موضوعات وبلاگ زبراکد</span><h1>{category.name}</h1><p>{category.description}</p><span className="zc-category-total">{formatNumber(posts.length)} مقاله برای خواندن و به کار گرفتن</span></div></header><ArticleCatalog initialPosts={posts} categories={[category]} initialCategory={category.slug} featured={featured} /><div className="zc-category-return"><Link href="/" className="zc-text-link">دیدن همه موضوعات و مقاله‌ها <ChevronLeft size={16} aria-hidden="true" /></Link></div></div>;
}

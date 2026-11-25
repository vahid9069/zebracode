'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpLeft, Clock3, Search, X } from 'lucide-react';
import type { Category, PostSummary } from '@/lib/types';
import { filterPosts } from '@/lib/search';
import { formatDate, formatNumber, postPath } from '@/lib/site';
import PostArtwork from '@/components/PostArtwork';
import PostCard from '@/components/PostCard';
import { AdBanner } from '@/components/AdBanner';

interface ArticleCatalogProps {
    initialPosts: PostSummary[];
    categories: Category[];
    initialCategory?: string;
    home?: boolean;
    featured?: PostSummary;
}

export default function ArticleCatalog({ initialPosts, categories, initialCategory = 'all', home = false, featured }: ArticleCatalogProps) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState(initialCategory);
    const searchId = useId();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
                event.preventDefault();
                const input = document.querySelector<HTMLInputElement>('.zc-catalog-toolbar input[type="search"]');
                input?.focus();
                input?.select();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const results = useMemo(() => filterPosts(initialPosts, query, category), [initialPosts, query, category]);
    const categoryFor = (slug: string) => categories.find((item) => item.slug === slug);
    const visiblePosts = results;

    const search = () => (
        <form role="search" className="zc-search-field" onSubmit={(event) => event.preventDefault()}>
            <Search size={18} aria-hidden="true" className="zc-search-icon" />
            <input
                id={`${searchId}-catalog`}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جست‌وجو در مقالات... (کلید /)"
                aria-label="جست‌وجو در مقاله‌ها"
                autoComplete="off"
            />
            {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="پاک کردن جست‌وجو" className="zc-search-clear">
                    <X size={16} />
                </button>
            )}
        </form>
    );

    const showFeatured = home && !query.trim() && category === 'all' && Boolean(featured);

    return (
        <>
            {showFeatured && featured && (
                <section className="zc-featured-section" aria-label="مقاله برگزیده">
                    <article className="zc-featured">
                        <Link href={postPath(featured.slug)} className="zc-featured-art" tabIndex={-1} aria-hidden="true">
                            {featured.featuredImage?.url ? (
                                <img
                                    src={featured.featuredImage.url}
                                    alt={featured.featuredImage.alt || featured.title}
                                    className="zc-featured-img"
                                    loading="eager"
                                />
                            ) : (
                                <PostArtwork variant={featured.cover} className="zc-featured-artwork" />
                            )}
                        </Link>
                        <div className="zc-featured-content">
                            <div className="zc-featured-kicker">
                                <span className="zc-kicker-badge">مقاله برگزیده</span>
                                {categoryFor(featured.category) && (
                                    <span className="zc-kicker-category">{categoryFor(featured.category)?.name}</span>
                                )}
                                <span className="zc-kicker-reading">
                                    <Clock3 size={13} aria-hidden="true" />
                                    {formatNumber(featured.readingMinutes)} دقیقه مطالعه
                                </span>
                            </div>
                            <h2>
                                <Link href={postPath(featured.slug)}>
                                    <span>{featured.title}</span>
                                    <ArrowUpLeft size={20} aria-hidden="true" className="zc-featured-arrow" />
                                </Link>
                            </h2>
                            <p>{featured.excerpt}</p>
                            <div className="zc-featured-meta">
                                <span className="zc-post-author">
                                    <span className="zc-author-avatar" aria-hidden="true">
                                        {featured.author.avatarUrl ? <img src={featured.author.avatarUrl} alt={featured.author.name} loading="lazy" /> : featured.author.initials}
                                    </span>
                                    <span className="zc-author-name">{featured.author.name}</span>
                                </span>
                                <time dateTime={featured.publishedAt}>{formatDate(featured.publishedAt)}</time>
                            </div>
                        </div>
                    </article>
                </section>
            )}

            <section className="zc-catalog" id="articles" aria-labelledby="catalog-heading">
                <div className="zc-section-heading">
                    <h2 id="catalog-heading">{home ? 'آخرین مقالات' : 'مقالات این موضوع'}</h2>
                </div>

                <div className="zc-catalog-toolbar" id="article-search">
                    <div className="zc-category-filters" role="group" aria-label="فیلتر موضوع مقاله‌ها">
                        <button
                            type="button"
                            aria-pressed={category === 'all'}
                            onClick={() => setCategory('all')}
                            className="zc-filter-pill"
                        >
                            <span>همه مقاله‌ها</span>
                            <span className="zc-filter-count">{formatNumber(initialPosts.length)}</span>
                        </button>
                        {categories.map((item) => {
                            const count = initialPosts.filter((post) => post.category === item.slug).length;
                            return (
                                <button
                                    key={item.slug}
                                    type="button"
                                    aria-pressed={category === item.slug}
                                    onClick={() => setCategory(item.slug)}
                                    className="zc-filter-pill"
                                >
                                    <span>{item.name}</span>
                                    <span className="zc-filter-count">{formatNumber(count)}</span>
                                </button>
                            );
                        })}
                    </div>
                    {search()}
                </div>

                <AdBanner placement="catalog_top" categorySlug={category !== 'all' ? category : undefined} />

                <p className="zc-results-count" role="status" aria-live="polite">
                    {formatNumber(results.length)} مقاله
                    {query.trim() ? <> برای «{query.trim()}»</> : ''}
                    {category !== 'all' ? <> در {categoryFor(category)?.name}</> : ''}
                </p>

                {visiblePosts.length ? (
                    <div className="zc-post-grid">
                        {visiblePosts.map((post) => (
                            <PostCard key={post.slug} post={post} category={categoryFor(post.category)} />
                        ))}
                    </div>
                ) : (
                    <div className="zc-empty-state">
                        <Search size={32} aria-hidden="true" />
                        <h3>مقاله‌ای پیدا نشد</h3>
                        <p>عبارت دیگری را جست‌وجو کنید یا فیلتر دسته‌بندی را تغییر دهید.</p>
                        <button
                            type="button"
                            className="zc-button"
                            onClick={() => {
                                setQuery('');
                                setCategory('all');
                            }}
                        >
                            پاک کردن جست‌وجو و فیلترها <X size={15} aria-hidden="true" />
                        </button>
                    </div>
                )}

                <AdBanner placement="catalog_bottom" categorySlug={category !== 'all' ? category : undefined} />
            </section>
        </>
    );
}

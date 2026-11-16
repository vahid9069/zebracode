'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowUpLeft, Clock3, Search, X } from 'lucide-react';
import type { Category, PostSummary } from '@/lib/types';
import { filterPosts } from '@/lib/search';
import { categoryPath, formatDate, formatNumber, postPath } from '@/lib/site';
import PostArtwork from '@/components/PostArtwork';
import PostCard from '@/components/PostCard';
import { AdBanner } from '@/components/AdBanner';

interface ArticleCatalogProps {
    initialPosts: PostSummary[];
    categories: Category[];
    initialCategory?: string;
    /** Home adds the editorial hero and linked topic index above the same live catalog. */
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
                const input = document.querySelector<HTMLInputElement>('.zc-catalog-toolbar input[type="search"]')
                    || document.querySelector<HTMLInputElement>('.zc-search-field input[type="search"]');
                input?.focus();
                input?.select();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const results = useMemo(() => filterPosts(initialPosts, query, category), [initialPosts, query, category]);
    const categoryFor = (slug: string) => categories.find((item) => item.slug === slug);
    const visiblePosts = (featured && results.length > 2) ? results.filter((post) => post.slug !== featured.slug) : results;

    const search = (hero = false) => (
        <div className={`zc-search-field ${hero ? 'zc-hero-search' : ''}`}>
            <Search size={18} aria-hidden="true" className="zc-search-icon" />
            <input
                id={`${searchId}-${hero ? 'hero' : 'catalog'}`}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="دنبال چه راه‌حلی می‌گردی؟ (کلید /)"
                aria-label="جست‌وجو در مقاله‌ها"
                autoComplete="off"
            />
            {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="پاک کردن جست‌وجو" className="zc-search-clear">
                    <X size={16} />
                </button>
            )}
            {hero && (
                <button type="submit" className="zc-search-submit" aria-label="نمایش نتیجه‌های جست‌وجو">
                    <ArrowLeft size={18} />
                </button>
            )}
        </div>
    );

    return (
        <>
            {home && (
                <>
                    <section className="zc-hero" aria-labelledby="hero-heading">
                        <div className="zc-hero-copy">
                            <span className="zc-eyebrow">
                                <span />
                                یادداشت‌هایی برای بهتر ساختن
                            </span>
                            <h1 id="hero-heading">
                                کمتر جست‌وجو کن،<br />
                                <span>بهتر بساز.</span>
                            </h1>
                            <p>از یک مفهوم پیچیده تا یک راه‌حل ساده. راهنماهای کاربردی برنامه‌نویسی و ابزارهایی که کار روزمره‌ات را جلو می‌برند.</p>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    document.getElementById('articles')?.scrollIntoView({ block: 'start' });
                                }}
                                role="search"
                            >
                                {search(true)}
                            </form>
                            <div className="zc-hero-footnote">
                                <span>{formatNumber(initialPosts.length)} مقاله کاربردی</span>
                                <i />
                                <span>مثال واقعی، توضیح روشن</span>
                            </div>
                        </div>

                        {featured && (
                            <article className="zc-featured zc-featured-bento">
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
                                        <span className="zc-kicker-badge">
                                            <span className="zc-kicker-dot" />
                                            پیشنهاد سردبیر
                                        </span>
                                        <span className="zc-kicker-category">{categoryFor(featured.category)?.name}</span>
                                        <span className="zc-kicker-reading">
                                            <Clock3 size={13} aria-hidden="true" />
                                            {formatNumber(featured.readingMinutes)} دقیقه
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
                                            <span className="zc-author-avatar" aria-hidden="true">{featured.author.initials}</span>
                                            <span className="zc-author-name">{featured.author.name}</span>
                                        </span>
                                        <time dateTime={featured.publishedAt}>{formatDate(featured.publishedAt)}</time>
                                    </div>
                                </div>
                            </article>
                        )}
                    </section>

                    <section className="zc-topics" id="topics" aria-labelledby="topics-heading">
                        <div className="zc-topics-title">
                            <h2 id="topics-heading">از کجا شروع کنیم؟</h2>
                            <span>مسیر یادگیری‌ات را انتخاب کن</span>
                        </div>
                        <div className="zc-topic-links">
                            {categories.map((item) => (
                                <Link key={item.slug} href={categoryPath(item.slug)} className="zc-topic-pill">
                                    <span className="zc-topic-symbol" aria-hidden="true">{item.symbol}</span>
                                    <span className="zc-topic-name">{item.name}</span>
                                    <span className="zc-topic-count">
                                        {formatNumber(initialPosts.filter((post) => post.category === item.slug).length)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                </>
            )}

            {!home && featured && (
                <section className="zc-listing-lead zc-featured-bento" aria-labelledby="listing-lead-heading">
                    <div className="zc-listing-lead-art">
                        <Link href={postPath(featured.slug)} tabIndex={-1} aria-hidden="true">
                            {featured.featuredImage?.url ? (
                                <img
                                    src={featured.featuredImage.url}
                                    alt={featured.featuredImage.alt || featured.title}
                                    className="zc-listing-lead-img"
                                    loading="lazy"
                                />
                            ) : (
                                <PostArtwork variant={featured.cover} />
                            )}
                        </Link>
                    </div>
                    <div className="zc-listing-lead-content">
                        <div className="zc-featured-kicker">
                            <span className="zc-kicker-badge">
                                <span className="zc-kicker-dot" />
                                مقاله منتخب این موضوع
                            </span>
                            <span className="zc-kicker-reading">
                                <Clock3 size={13} aria-hidden="true" />
                                {formatNumber(featured.readingMinutes)} دقیقه
                            </span>
                        </div>
                        <h2 id="listing-lead-heading">
                            <Link href={postPath(featured.slug)}>
                                <span>{featured.title}</span>
                                <ArrowUpLeft size={20} aria-hidden="true" className="zc-featured-arrow" />
                            </Link>
                        </h2>
                        <p>{featured.excerpt}</p>
                        <div className="zc-featured-meta">
                            <span className="zc-post-author">
                                <span className="zc-author-avatar" aria-hidden="true">{featured.author.initials}</span>
                                <span className="zc-author-name">{featured.author.name}</span>
                            </span>
                            <time dateTime={featured.publishedAt}>{formatDate(featured.publishedAt)}</time>
                        </div>
                    </div>
                </section>
            )}

            <section className="zc-catalog" id="articles" aria-labelledby="catalog-heading">
                <div className="zc-section-heading">
                    <div>
                        <span className="zc-eyebrow">برای مسئله بعدی‌ات</span>
                        <h2 id="catalog-heading">{home ? 'آخرین مقاله‌ها' : 'مقاله‌های تازه این موضوع'}</h2>
                    </div>
                    {home && (
                        <a href="#article-search" className="zc-text-link">
                            جست‌وجو در مقاله‌ها <ArrowDown size={14} aria-hidden="true" />
                        </a>
                    )}
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
                        <p>
                            {featured && !query.trim()
                                ? 'مقاله منتخب بالا قرار دارد؛ یک عبارت جست‌وجو کن یا فیلتر موضوع را تغییر بده.'
                                : 'یک عبارت کوتاه‌تر جست‌وجو کن یا فیلتر موضوع را تغییر بده.'}
                        </p>
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

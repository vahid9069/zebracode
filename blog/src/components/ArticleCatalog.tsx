'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowUpLeft, Search, X } from 'lucide-react';
import type { Category, PostSummary } from '@/lib/types';
import { filterPosts } from '@/lib/search';
import { categoryPath, formatDate, formatNumber, postPath } from '@/lib/site';
import PostArtwork from '@/components/PostArtwork';
import PostCard from '@/components/PostCard';

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
    const results = useMemo(() => filterPosts(initialPosts, query, category), [initialPosts, query, category]);
    const categoryFor = (slug: string) => categories.find((item) => item.slug === slug);
    const visiblePosts = featured ? results.filter((post) => post.slug !== featured.slug) : results;
    const search = (hero = false) => <div className={`zc-search-field ${hero ? 'zc-hero-search' : ''}`}>
        <Search size={20} aria-hidden="true" />
        <input id={`${searchId}-${hero ? 'hero' : 'catalog'}`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="دنبال چه راه‌حلی می‌گردی؟" aria-label="جست‌وجو در مقاله‌ها" autoComplete="off" />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="پاک کردن جست‌وجو"><X size={17} /></button>}
        {hero && <button type="submit" className="zc-search-submit" aria-label="نمایش نتیجه‌های جست‌وجو"><ArrowLeft size={20} /></button>}
    </div>;

    return <>
        {home && <>
            <section className="zc-hero" aria-labelledby="hero-heading">
                <div className="zc-hero-copy"><span className="zc-eyebrow"><span />یادداشت‌هایی برای بهتر ساختن</span>
                    <h1 id="hero-heading">کمتر جست‌وجو کن،<br /><span>بهتر بساز.</span></h1>
                    <p>از یک مفهوم پیچیده تا یک راه‌حل ساده. راهنماهای کاربردی برنامه‌نویسی و ابزارهایی که کار روزمره‌ات را جلو می‌برند.</p>
                    <form onSubmit={(event) => { event.preventDefault(); document.getElementById('articles')?.scrollIntoView({ block: 'start' }); }} role="search">{search(true)}</form>
                    <div className="zc-hero-footnote"><span>{formatNumber(initialPosts.length)} مقاله کاربردی</span><i /><span>مثال واقعی، توضیح روشن</span></div>
                </div>
                {featured && <article className="zc-featured">
                    <Link href={postPath(featured.slug)} className="zc-featured-art" tabIndex={-1} aria-hidden="true"><PostArtwork variant={featured.cover} /></Link>
                    <div className="zc-featured-content"><div className="zc-featured-kicker"><span>پیشنهاد سردبیر</span><span>{categoryFor(featured.category)?.name}</span></div>
                        <h2><Link href={postPath(featured.slug)}>{featured.title}<ArrowUpLeft size={22} aria-hidden="true" /></Link></h2>
                        <p>{featured.excerpt}</p>
                        <div className="zc-featured-meta"><span className="zc-post-author"><span className="zc-author-avatar" aria-hidden="true">{featured.author.initials}</span>{featured.author.name}</span><time dateTime={featured.publishedAt}>{formatDate(featured.publishedAt)}</time></div>
                    </div>
                </article>}
            </section>
            <AdSlot label="جایگاه تبلیغاتی" />
            <section className="zc-topics" id="topics" aria-labelledby="topics-heading"><div className="zc-topics-title"><h2 id="topics-heading">از کجا شروع کنیم؟</h2><span>مسیر یادگیری‌ات را انتخاب کن</span></div>
                <div className="zc-topic-links">{categories.map((item) => <Link key={item.slug} href={categoryPath(item.slug)}><span className="zc-topic-symbol" aria-hidden="true">{item.symbol}</span>{item.name}<span className="zc-topic-count">{formatNumber(initialPosts.filter((post) => post.category === item.slug).length)}</span></Link>)}</div>
            </section>
        </>}
        {!home && featured && <section className="zc-listing-lead" aria-labelledby="listing-lead-heading">
            <div className="zc-listing-lead-art"><Link href={postPath(featured.slug)} tabIndex={-1} aria-hidden="true"><PostArtwork variant={featured.cover} /></Link></div>
            <div className="zc-listing-lead-content">
                <span className="zc-eyebrow"><span />مقاله منتخب این موضوع</span>
                <h2 id="listing-lead-heading"><Link href={postPath(featured.slug)}>{featured.title}<ArrowUpLeft size={22} aria-hidden="true" /></Link></h2>
                <p>{featured.excerpt}</p>
                <div className="zc-featured-meta"><span className="zc-post-author"><span className="zc-author-avatar" aria-hidden="true">{featured.author.initials}</span>{featured.author.name}</span><time dateTime={featured.publishedAt}>{formatDate(featured.publishedAt)}</time></div>
            </div>
        </section>}
        <section className="zc-catalog" id="articles" aria-labelledby="catalog-heading">
            <div className="zc-section-heading"><div><span className="zc-eyebrow">برای مسئله بعدی‌ات</span><h2 id="catalog-heading">{home ? 'آخرین مقاله‌ها' : 'مقاله‌های تازه این موضوع'}</h2></div>{home && <a href="#article-search" className="zc-text-link">جست‌وجو در مقاله‌ها <ArrowDown size={15} aria-hidden="true" /></a>}</div>
            <div className="zc-catalog-toolbar" id="article-search"><div className="zc-category-filters" role="group" aria-label="فیلتر موضوع مقاله‌ها"><button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>همه مقاله‌ها</button>{categories.map((item) => <button key={item.slug} type="button" aria-pressed={category === item.slug} onClick={() => setCategory(item.slug)}>{item.name}</button>)}</div>{search()}</div>
            <p className="zc-results-count" role="status" aria-live="polite">{formatNumber(results.length)} مقاله{query.trim() ? <> برای «{query.trim()}»</> : ''}{category !== 'all' ? <> در {categoryFor(category)?.name}</> : ''}</p>
            {visiblePosts.length ? <div className="zc-post-grid">{visiblePosts.map((post) => <PostCard key={post.slug} post={post} category={categoryFor(post.category)} />)}</div> : <div className="zc-empty-state"><Search size={30} aria-hidden="true" /><h3>مقاله‌ای پیدا نشد</h3><p>{featured && !query.trim() ? 'مقاله منتخب بالا قرار دارد؛ یک عبارت جست‌وجو کن یا فیلتر موضوع را تغییر بده.' : 'یک عبارت کوتاه‌تر جست‌وجو کن یا فیلتر موضوع را تغییر بده.'}</p><button type="button" className="zc-button" onClick={() => { setQuery(''); setCategory('all'); }}>پاک کردن جست‌وجو و فیلترها <X size={16} aria-hidden="true" /></button></div>}
        </section>
    </>;
}

function AdSlot({ label }: { label: string }) {
    return <div className="zc-ad-slot" role="region" aria-label="جایگاه تبلیغات"><span>{label}</span></div>;
}

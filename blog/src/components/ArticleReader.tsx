import Link from 'next/link';
import { Fragment } from 'react';
import CodeBlock from '@/components/CodeBlock';
import PostArtwork from '@/components/PostArtwork';
import { categoryPath, formatDate, formatNumber, getToolUrl, postPath } from '@/lib/site';
import type { ArticleBlock, Category, Post, PostSummary } from '@/lib/types';

interface ArticleReaderProps {
    post: Post;
    categories: Category[];
    related: PostSummary[];
}

function ArticleContentBlock({ block }: { block: ArticleBlock }) {
    switch (block.type) {
        case 'paragraph':
            return <p>{block.text}</p>;
        case 'heading':
            return <h2 id={block.id}>{block.title}</h2>;
        case 'list':
            return <ul>{block.items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
        case 'code':
            return <CodeBlock language={block.language} code={block.code} caption={block.caption} />;
        case 'callout':
            return (
                <aside className={`article-callout article-callout-${block.tone ?? 'note'}`}>
                    <strong>{block.title}</strong>
                    <p>{block.text}</p>
                </aside>
            );
        case 'table':
            return (
                <div className="article-table-scroll" role="region" aria-label={`جدول مقایسه: ${block.headers.join('، ')}`} tabIndex={0}>
                    <table>
                        <thead><tr>{block.headers.map((header, index) => <th key={index} scope="col">{header}</th>)}</tr></thead>
                        <tbody>{block.rows.map((row, index) => (
                            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
                        ))}</tbody>
                    </table>
                </div>
            );
    }
}

function TableOfContents({ post }: { post: Post }) {
    const headings = post.blocks.filter((block) => block.type === 'heading');
    return (
        <ol className="reading-toc-list">
            {headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`}>{heading.title}</a></li>)}
            {post.faq.length > 0 && <li><a href="#reading-faq">پرسش‌های متداول</a></li>}
            {post.references.length > 0 && <li><a href="#reading-references">منابع و مطالعه بیشتر</a></li>}
        </ol>
    );
}

function getAdInsertIndex(blocks: ArticleBlock[]) {
    const headingIndexes = blocks.reduce<number[]>((indexes, block, index) => {
        if (block.type === 'heading') indexes.push(index);
        return indexes;
    }, []);

    // Put the reserved slot after the first complete section, never before the
    // article has established its subject with an opening paragraph.
    return headingIndexes.find((index) => index >= 2) ?? Math.max(1, Math.ceil(blocks.length / 2));
}

function AdvertisementSlot() {
    return (
        <div className="article-ad-slot" role="complementary" aria-label="جایگاه تبلیغاتی">
            <span>جایگاه تبلیغاتی</span>
        </div>
    );
}

export default function ArticleReader({ post, categories, related }: ArticleReaderProps) {
    const category = categories.find((item) => item.slug === post.category);
    const hasContents = post.blocks.some((block) => block.type === 'heading') || post.faq.length > 0 || post.references.length > 0;
    const adInsertIndex = getAdInsertIndex(post.blocks);

    return (
        <div className="article-page" dir="rtl">
            <nav className="article-breadcrumb" aria-label="مسیر صفحه">
                <ol>
                    <li><Link href="/">وبلاگ</Link></li>
                    {category && <li><Link href={categoryPath(category.slug)}>{category.name}</Link></li>}
                    <li aria-current="page">{post.title}</li>
                </ol>
            </nav>

            <article aria-labelledby="article-title">
                <header className="article-header">
                    <div className="article-heading-copy">
                        {category && <Link className="article-category" href={categoryPath(category.slug)}>{category.name}</Link>}
                        <h1 id="article-title">{post.title}</h1>
                        <p className="article-deck">{post.excerpt}</p>
                        <div className="article-meta">
                            <div className="article-byline">
                                <span className="article-avatar" aria-hidden="true">{post.author.initials}</span>
                                <div><strong>{post.author.name}</strong><span>{post.author.role}</span></div>
                            </div>
                            <div className="article-dates">
                                <span>انتشار: <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></span>
                                {post.updatedAt && post.updatedAt !== post.publishedAt && <span>به‌روزرسانی: <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time></span>}
                                <span>{formatNumber(post.readingMinutes)} دقیقه مطالعه</span>
                            </div>
                        </div>
                    </div>
                    <div className="article-hero-art"><PostArtwork variant={post.cover} /></div>
                </header>

                <div className="reading-shell">
                    {hasContents && (
                        <details className="reading-toc" open>
                            <summary>در این مقاله می‌خوانید</summary>
                            <nav aria-label="فهرست مقاله"><TableOfContents post={post} /></nav>
                        </details>
                    )}
                    <div className="article-prose">
                        {post.blocks.map((block, index) => (
                            <Fragment key={block.type === 'heading' ? block.id : index}>
                                {index === adInsertIndex && <AdvertisementSlot />}
                                <ArticleContentBlock block={block} />
                            </Fragment>
                        ))}
                        {post.blocks.length > 0 && adInsertIndex >= post.blocks.length && <AdvertisementSlot />}
                        {post.blocks.length === 0 && <AdvertisementSlot />}

                        {post.faq.length > 0 && (
                            <section className="article-faq" aria-labelledby="reading-faq">
                                <h2 id="reading-faq">پرسش‌های متداول</h2>
                                {post.faq.map((item, index) => (
                                    <details key={index}>
                                        <summary>{item.question}</summary>
                                        <p>{item.answer}</p>
                                    </details>
                                ))}
                            </section>
                        )}

                        {post.references.length > 0 && (
                            <section className="article-references" aria-labelledby="reading-references">
                                <h2 id="reading-references">منابع و مطالعه بیشتر</h2>
                                <ul>{post.references.map((reference, index) => (
                                    <li key={index}><a href={reference.url} rel="noreferrer">{reference.label}<span aria-hidden="true"> ↗</span></a></li>
                                ))}</ul>
                            </section>
                        )}
                    </div>

                    {post.tags.length > 0 && <div className="article-tags" aria-label="موضوع‌های مقاله">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}

                    <section className="article-author" aria-label="درباره نویسنده">
                        <span className="article-avatar" aria-hidden="true">{post.author.initials}</span>
                        <div><span className="article-eyebrow">درباره نویسنده</span><h2>{post.author.name}</h2><p className="article-author-role">{post.author.role}</p><p>{post.author.bio}</p></div>
                    </section>
                </div>
            </article>

            {post.tools.length > 0 && (
                <section className="article-tools" aria-labelledby="reading-tools-title">
                    <div className="article-section-heading">
                        <span className="article-eyebrow">از خواندن به ساختن</span>
                        <h2 id="reading-tools-title">ابزارهای مرتبط</h2>
                        <p>مثال‌ها و ایده‌های این مقاله را با ابزارهای زبراکد امتحان کنید.</p>
                    </div>
                    <ul>{post.tools.map((tool) => <li key={tool.slug}><a href={getToolUrl(tool.slug)}><strong>{tool.title}<span aria-hidden="true"> ↗</span></strong><span>{tool.description}</span></a></li>)}</ul>
                </section>
            )}

            {related.length > 0 && (
                <section className="article-related" aria-labelledby="article-related-title">
                    <div className="article-related-heading"><div><span className="article-eyebrow">قدم بعدی</span><h2 id="article-related-title">برای ادامه مسیر</h2></div><Link href="/">همه مقاله‌ها <span aria-hidden="true">←</span></Link></div>
                    <div className="article-related-grid">{related.map((item) => (
                        <article key={item.slug} className="article-related-card">
                            <div className="article-related-meta"><span>{categories.find((entry) => entry.slug === item.category)?.name ?? 'مقاله'}</span><span>{formatNumber(item.readingMinutes)} دقیقه</span></div>
                            <h3><Link href={postPath(item.slug)}>{item.title}</Link></h3><p>{item.excerpt}</p>
                            <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
                        </article>
                    ))}</div>
                </section>
            )}
        </div>
    );
}

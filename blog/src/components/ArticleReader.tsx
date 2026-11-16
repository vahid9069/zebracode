import Link from 'next/link';
import CodeBlock from '@/components/CodeBlock';
import PostArtwork from '@/components/PostArtwork';
import ArticleReadingBar from '@/components/ArticleReadingBar';
import TableOfContents from '@/components/TableOfContents';
import BackToTop from '@/components/BackToTop';
import { AdBanner } from '@/components/AdBanner';
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
            return block.level === 3 ? (
                <h3 id={block.id}>{block.title}</h3>
            ) : (
                <h2 id={block.id}>{block.title}</h2>
            );
        case 'image':
            return (
                <figure className="article-figure">
                    <img src={block.url} alt={block.alt || ''} loading="lazy" />
                    {block.caption && <figcaption>{block.caption}</figcaption>}
                </figure>
            );
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

export default function ArticleReader({ post, categories, related }: ArticleReaderProps) {
    const category = categories.find((item) => item.slug === post.category);
    const hasContents = post.blocks.some((block) => block.type === 'heading') || post.faq.length > 0 || post.references.length > 0;

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
                    <div className="article-hero-art">
                        {post.featuredImage?.url ? (
                            <img
                                src={post.featuredImage.url}
                                alt={post.featuredImage.alt || post.title}
                                className="article-hero-img"
                                loading="eager"
                            />
                        ) : (
                            <PostArtwork variant={post.cover} />
                        )}
                    </div>
                </header>
                <ArticleReadingBar title={post.title} />

                <div className="reading-shell">
                    <div className="article-main-content">
                        {hasContents && (
                            <details className="reading-toc reading-toc-mobile" open>
                                <summary>در این مقاله می‌خوانید</summary>
                                <nav aria-label="فهرست مقاله"><TableOfContents post={post} /></nav>
                            </details>
                        )}
                        <div className="article-prose">
                            <AdBanner placement="before_content" post={post} categorySlug={post.category} />

                            {post.blocks.map((block, index) => {
                                const isMiddle = index === Math.floor(post.blocks.length / 2) && post.blocks.length > 3;
                                const isAfterParagraph2 = index === 2;
                                return (
                                    <div key={block.type === 'heading' ? block.id : index}>
                                        <ArticleContentBlock block={block} />
                                        {isAfterParagraph2 && (
                                            <AdBanner placement="after_paragraph" paragraphIndex={2} post={post} categorySlug={post.category} />
                                        )}
                                        {isMiddle && (
                                            <AdBanner placement="middle_content" post={post} categorySlug={post.category} />
                                        )}
                                    </div>
                                );
                            })}

                            <AdBanner placement="after_content" post={post} categorySlug={post.category} />

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

                    {hasContents && (
                        <aside className="article-toc-sidebar" aria-label="فهرست مطالب مقاله">
                            <div className="article-toc-sticky-box reading-toc">
                                <span className="toc-sidebar-heading">فهرست محتوا</span>
                                <nav aria-label="فهرست مطالب"><TableOfContents post={post} /></nav>
                            </div>
                        </aside>
                    )}
                </div>
            </article>

            {post.tools.length > 0 && (
                <section className="article-tools" aria-labelledby="reading-tools-title">
                    <div className="article-section-heading">
                        <h2 id="reading-tools-title">ابزارهای مرتبط</h2>
                        <p>مثال‌ها و ایده‌های این مقاله را با ابزارهای زبراکد امتحان کنید.</p>
                    </div>
                    <ul>
                        {post.tools.map((tool) => {
                            const targetHref = tool.url || getToolUrl(tool.slug);
                            const isExternal = Boolean(tool.url);
                            return (
                                <li key={tool.slug}>
                                    <a
                                        href={targetHref}
                                        target={isExternal ? '_blank' : undefined}
                                        rel={isExternal ? 'noopener noreferrer' : undefined}
                                    >
                                        <strong>{tool.title}<span aria-hidden="true"> ↗</span></strong>
                                        <span>{tool.description}</span>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {related.length > 0 && (
                <section className="article-related" aria-labelledby="article-related-title">
                    <div className="article-related-heading">
                        <div>
                            <h2 id="article-related-title">مطالب مرتبط</h2>
                        </div>
                        <Link href="/">همه مقاله‌ها <span aria-hidden="true">←</span></Link>
                    </div>
                    <div className="article-related-grid">{related.map((item) => (
                        <article key={item.slug} className="article-related-card">
                            <div className="article-related-meta"><span>{categories.find((entry) => entry.slug === item.category)?.name ?? 'مقاله'}</span><span>{formatNumber(item.readingMinutes)} دقیقه</span></div>
                            <h3><Link href={postPath(item.slug)}>{item.title}</Link></h3><p>{item.excerpt}</p>
                            <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
                        </article>
                    ))}</div>
                </section>
            )}
            <BackToTop />
        </div>
    );
}

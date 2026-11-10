import type { Metadata } from 'next';
import { ArrowUpLeft, Braces, Check } from 'lucide-react';
import { absoluteUrl, site } from '@/lib/site';
import { getCategories, getPostSummaries } from '@/lib/repository';
import ArticleCatalog from '@/components/ArticleCatalog';

export const metadata: Metadata = {
    title: 'کمتر جست‌وجو کن، بهتر بساز',
    description: site.description,
    alternates: { canonical: absoluteUrl('/') },
    openGraph: { title: 'وبلاگ زبراکد', description: site.description, url: absoluteUrl('/'), locale: 'fa_IR', type: 'website' },
};

export default async function HomePage() {
    const [posts, categories] = await Promise.all([getPostSummaries(), getCategories()]);
    const featured = posts.find((post) => post.featured) || posts[0];

    return <div className="zc-container zc-home">
        <ArticleCatalog initialPosts={posts} categories={categories} home featured={featured} />
        <div className="zc-ad-slot zc-ad-slot-lower" role="region" aria-label="جایگاه تبلیغات"><span>جایگاه تبلیغاتی</span></div>
        <section className="zc-tools-cta" aria-labelledby="tools-heading"><div className="zc-tools-cta-icon" aria-hidden="true"><Braces size={36} /></div><div className="zc-tools-cta-copy"><span className="zc-eyebrow">از یاد گرفتن به انجام دادن</span><h2 id="tools-heading">راه‌حل را خواندی؟ حالا امتحانش کن.</h2><p>ابزارهای زبراکد برای تبدیل داده، کار با متن و ساده‌تر کردن کارهای تکراری کنار تو هستند.</p><span className="zc-tools-privacy"><Check size={15} aria-hidden="true" />پردازش ابزارها در مرورگر شما</span></div><a href={site.toolsUrl} className="zc-button">رفتن به ابزارها <ArrowUpLeft size={18} aria-hidden="true" /></a></section>
    </div>;
}

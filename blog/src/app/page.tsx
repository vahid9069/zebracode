import type { Metadata } from 'next';
import { ArrowUpLeft, Braces, Check } from 'lucide-react';
import { absoluteUrl, site } from '@/lib/site';
import { getCategories, getPostSummaries } from '@/lib/repository';
import ArticleCatalog from '@/components/ArticleCatalog';

export const metadata: Metadata = {
    title: 'وبلاگ زبراکد — مقالات و راهنماهای تخصصی مهندسی نرم‌افزار',
    description: site.description,
    alternates: { canonical: absoluteUrl('/') },
    openGraph: { title: 'وبلاگ زبراکد', description: site.description, url: absoluteUrl('/'), locale: 'fa_IR', type: 'website' },
};

export default async function HomePage() {
    const [posts, categories] = await Promise.all([getPostSummaries(), getCategories()]);
    const featured = posts.find((post) => post.featured) || posts[0];

    return (
        <div className="zc-container zc-home">
            <ArticleCatalog initialPosts={posts} categories={categories} home featured={featured} />
            <section className="zc-tools-cta" aria-labelledby="tools-heading">
                <div className="zc-tools-cta-icon" aria-hidden="true">
                    <Braces size={36} />
                </div>
                <div className="zc-tools-cta-copy">
                    <h2 id="tools-heading">ابزارهای آنلاین و بدون سرور زبراکد</h2>
                    <p>مجموعه‌ای از ابزارهای سبک و سریع برای تبدیل داده، تست و اعتبارسنجی بدون خروج اطلاعات از مرورگر شما.</p>
                    <span className="zc-tools-privacy">
                        <Check size={15} aria-hidden="true" />
                        پردازش امن در مرورگر شما
                    </span>
                </div>
                <a href={site.toolsUrl} className="zc-button">
                    مشاهده ابزارها <ArrowUpLeft size={18} aria-hidden="true" />
                </a>
            </section>
        </div>
    );
}

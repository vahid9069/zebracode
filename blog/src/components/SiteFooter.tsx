import Link from 'next/link';
import { ArrowUpLeft } from 'lucide-react';
import { categories } from '@/content/categories';
import { site } from '@/lib/site';

export default function SiteFooter() {
    return <footer className="zc-site-footer" id="site-footer">
        <div className="zc-container zc-footer-main">
            <div className="zc-footer-about">
                <Link href="/" className="zc-footer-brand" dir="ltr"><span className="zc-footer-mark" aria-hidden="true">&gt;_</span> ZebraCode</Link>
                <p>یادداشت‌های روشن و کاربردی برای ساختن نرم‌افزار بهتر؛ از یک مسئله واقعی تا راه‌حلی که بتوانی همان امروز امتحانش کنی.</p>
            </div>
            <nav className="zc-footer-links" aria-label="پیوندهای پایین صفحه">
                <strong>دسترسی سریع</strong>
                <Link href="/">صفحه اصلی</Link>
                <Link href="/#articles">همه مقاله‌ها</Link>
                <Link href="/#topics">موضوعات وبلاگ</Link>
                <a href={site.toolsUrl}>مجموعه ابزارها <ArrowUpLeft size={14} aria-hidden="true" /></a>
            </nav>
            <nav className="zc-footer-links" aria-label="دسته‌بندی مقاله‌ها">
                <strong>دسته‌بندی‌ها</strong>
                {categories.map((category) => <Link key={category.slug} href={`/category/${category.slug}/`}>{category.name}</Link>)}
            </nav>
            <div className="zc-footer-newsletter">
                <strong>همراه وبلاگ بمان</strong>
                <p>مطالب تازه را با همان ریتم آرام و کاربردی دنبال کن.</p>
                <span className="zc-coming-soon">عضویت ایمیلی به‌زودی</span>
            </div>
        </div>
        <div className="zc-container zc-footer-bottom"><span>ساخته‌شده با دقت، برای ذهن‌های سازنده.</span><span dir="ltr">© ZebraCode Blog</span></div>
    </footer>;
}

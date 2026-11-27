import Link from 'next/link';
import { ArrowUpLeft, Search } from 'lucide-react';
import { site } from '@/lib/site';
import ThemeToggle from '@/components/ThemeToggle';

export default function SiteHeader({ logoUrl }: { logoUrl?: string }) {
    return <header className="zc-site-header" id="site-header">
        <div className="zc-container zc-header-inner">
            <Link href="/" className="zc-brand" aria-label="زبراکد؛ صفحه اصلی وبلاگ">
                {logoUrl ? (
                    <img src={logoUrl} alt={site.name} className="zc-brand-logo-img" />
                ) : (
                    <>
                        <span className="zc-brand-mark" aria-hidden="true" dir="ltr">&gt;_</span>
                        <span className="zc-brand-copy" dir="ltr">Zebra<span className="zc-brand-accent">Code</span><small dir="rtl">برای ذهن‌های سازنده</small></span>
                    </>
                )}
            </Link>
            <nav className="zc-main-nav" aria-label="ناوبری اصلی">
                <Link href="/">خانه</Link>
                <Link href="/#articles" className="zc-nav-active" aria-current="page">بلاگ</Link>
                <Link href="/#topics">صفحه‌ها</Link>
                <a href="#site-footer">تماس</a>
                <a href={site.toolsUrl}>ابزارهای زبراکد <ArrowUpLeft size={14} aria-hidden="true" /></a>
                <a href={site.kitUrl}>ابزارهای عمومی <ArrowUpLeft size={14} aria-hidden="true" /></a>
            </nav>
            <div className="zc-header-actions">
                <Link href="/#article-search" className="zc-header-search" aria-label="جست‌وجو در مقاله‌ها">
                    <Search size={16} aria-hidden="true" />
                    <span>جست‌وجوی مقاله</span>
                    <kbd dir="ltr">/</kbd>
                </Link>
                <ThemeToggle />
            </div>
        </div>
    </header>;
}

import Link from 'next/link';
import { ArrowUpLeft } from 'lucide-react';
import { categories } from '@/content/categories';
import { site } from '@/lib/site';
import type { SiteSocialLinks } from '@/lib/types';

export default function SiteFooter({ logoUrl, socialLinks }: { logoUrl?: string; socialLinks?: SiteSocialLinks }) {
    const socials = [
        { key: 'telegram', label: 'تلگرام', url: socialLinks?.telegram },
        { key: 'bale', label: 'بله', url: socialLinks?.bale },
        { key: 'rubika', label: 'روبیکا', url: socialLinks?.rubika },
        { key: 'github', label: 'گیت‌هاب', url: socialLinks?.github },
    ].filter((s): s is { key: string; label: string; url: string } => Boolean(s.url));

    return <footer className="zc-site-footer" id="site-footer">
        <div className="zc-container zc-footer-main">
            <div className="zc-footer-about">
                <Link href="/" className="zc-footer-brand" dir="ltr">
                    {logoUrl ? (
                        <img src={logoUrl} alt={site.name} className="zc-brand-logo-img" />
                    ) : (
                        <>
                            <span className="zc-footer-mark" aria-hidden="true">&gt;_</span> ZebraCode
                        </>
                    )}
                </Link>
                <p>یادداشت‌های روشن و کاربردی برای ساختن نرم‌افزار بهتر؛ از یک مسئله واقعی تا راه‌حلی که بتوانی همان امروز امتحانش کنی.</p>
                {socials.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2" aria-label="شبکه‌های اجتماعی">
                        {socials.map((s) => (
                            <a
                                key={s.key}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-300"
                            >
                                {s.label}
                                <ArrowUpLeft size={12} aria-hidden="true" />
                            </a>
                        ))}
                    </div>
                )}
            </div>
            <nav className="zc-footer-links" aria-label="پیوندهای پایین صفحه">
                <strong>دسترسی سریع</strong>
                <Link href="/">صفحه اصلی</Link>
                <Link href="/#articles">همه مقاله‌ها</Link>
                <Link href="/#topics">موضوعات وبلاگ</Link>
                <a href={site.toolsUrl}>مجموعه ابزارها <ArrowUpLeft size={14} aria-hidden="true" /></a>
                <a href={site.kitUrl}>ابزارهای عمومی <ArrowUpLeft size={14} aria-hidden="true" /></a>
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

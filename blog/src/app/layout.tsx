import type { Metadata } from 'next';
import localFont from 'next/font/local';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { absoluteUrl, site } from '@/lib/site';
import './globals.css';

// Reuse the project's existing local Persian font; Next bundles it into this app's own assets.
const persian = localFont({ src: '../../../public/fonts/IRANSansWeb.woff2', variable: '--font-persian', display: 'swap' });

export const metadata: Metadata = {
    metadataBase: new URL(site.url),
    title: { default: site.name, template: '%s | وبلاگ زبراکد' },
    description: site.description,
    alternates: { canonical: absoluteUrl('/') },
    robots: { index: site.indexable, follow: true },
    openGraph: { type: 'website', siteName: site.name, locale: 'fa_IR', url: absoluteUrl('/'), title: site.name, description: site.description },
    twitter: { card: 'summary', title: site.name, description: site.description },
};

const initializeTheme = `(function(){try{var p=localStorage.getItem('zebracode-blog-theme');document.documentElement.dataset.theme=(p==='dark'||(!p&&matchMedia('(prefers-color-scheme: dark)').matches))?'dark':'light'}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <html lang="fa" dir="rtl" suppressHydrationWarning className={persian.variable}>
        <head><script dangerouslySetInnerHTML={{ __html: initializeTheme }} /></head>
        <body>
            <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
            {!site.indexable && <div className="demo-notice"><strong>پیش‌نمایش وبلاگ</strong> — مقاله‌ها نمونه‌اند؛ هنوز به وردپرس یا API متصل نیست.</div>}
            <SiteHeader />
            <main id="main-content" tabIndex={-1}>{children}</main>
            <SiteFooter />
        </body>
    </html>;
}

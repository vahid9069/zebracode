import AboutView from '@/components/pages/AboutView';
import SiteStructuredData from '@/components/pages/SiteStructuredData';
import { getDictionary } from '@/i18n/getDictionary';
import type { Metadata } from 'next';
import { getLocalizedUrl } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'درباره ما - زبرا کد',
    description: 'با ZebraCode و مجموعه ابزارهای رایگان آنلاین آن آشنا شوید.',
    alternates: { canonical: getLocalizedUrl('/about'), languages: { 'fa-IR': getLocalizedUrl('/about'), en: getLocalizedUrl('/en/about'), 'x-default': getLocalizedUrl('/about') } },
};

export default async function FaAboutPage() {
    // خواندن دیکشنری در زمان Build
    const dict = await getDictionary('fa');
    
    // ارسال دیتای ترجمه‌شده به کامپوننت مشترک
    return <><SiteStructuredData locale="fa" /><AboutView dict={dict.about} /></>;
}
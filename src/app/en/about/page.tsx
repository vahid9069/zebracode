import AboutView from '@/components/pages/AboutView';
import SiteStructuredData from '@/components/pages/SiteStructuredData';
import { getDictionary } from '@/i18n/getDictionary';
import type { Metadata } from 'next';
import { getLocalizedUrl } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'About Us - ZebraCode',
    description: 'Learn about ZebraCode and its free online developer tools.',
    alternates: { canonical: getLocalizedUrl('/en/about'), languages: { 'fa-IR': getLocalizedUrl('/about'), en: getLocalizedUrl('/en/about'), 'x-default': getLocalizedUrl('/about') } },
};

export default async function EnAboutPage() {
    // خواندن دیکشنری در زمان Build
    const dict = await getDictionary('en');
    
    // ارسال دیتای ترجمه‌شده به کامپوننت مشترک
    return <><SiteStructuredData locale="en" /><AboutView dict={dict.about} /></>;
}
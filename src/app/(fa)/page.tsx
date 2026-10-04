import HomePageClient from '@/components/pages/HomePageClient';
import SiteStructuredData from '@/components/pages/SiteStructuredData';
import { getDictionary } from '@/i18n/getDictionary';
import type { Metadata } from 'next';
import { getLocalizedUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'زبرا کد | ابزارهای آنلاین برنامه‌نویسی',
  description: 'مجموعه‌ای رایگان از ابزارهای آنلاین برنامه‌نویسی و تبدیل داده.',
  alternates: { canonical: getLocalizedUrl('/') , languages: { 'fa-IR': getLocalizedUrl('/'), en: getLocalizedUrl('/en'), 'x-default': getLocalizedUrl('/') } },
  openGraph: { title: 'زبرا کد | ابزارهای آنلاین برنامه‌نویسی', description: 'ابزارهای رایگان توسعه‌دهندگان', url: getLocalizedUrl('/'), siteName: 'ZebraCode', locale: 'fa_IR', type: 'website' },
};

export default async function FaHomePage() {
  const dict = await getDictionary('fa');
  
  // ارسال بخش home از دیکشنری به کلاینت کامپوننت
  return <><SiteStructuredData locale="fa" /><HomePageClient dict={dict} locale="fa" /></>;
}
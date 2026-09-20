import HomePageClient from '@/components/pages/HomePageClient';
import SiteStructuredData from '@/components/pages/SiteStructuredData';
import { getDictionary } from '@/i18n/getDictionary';
import type { Metadata } from 'next';
import { getLocalizedUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'ZebraCode | Online Developer Tools',
  description: 'Free online developer tools for formatting, conversion, generation, and data processing.',
  alternates: { canonical: getLocalizedUrl('/en'), languages: { 'fa-IR': getLocalizedUrl('/'), en: getLocalizedUrl('/en'), 'x-default': getLocalizedUrl('/') } },
  openGraph: { title: 'ZebraCode | Online Developer Tools', description: 'Free tools for developers', url: getLocalizedUrl('/en'), siteName: 'ZebraCode', locale: 'en_US', type: 'website' },
};

export default async function EnHomePage() {
  const dict = await getDictionary('en');
  
  return <><SiteStructuredData locale="en" /><HomePageClient dict={dict} locale="en" /></>;
}
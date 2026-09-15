import HomePageClient from '@/components/pages/HomePageClient';
import { getDictionary } from '@/i18n/getDictionary';

export default async function EnHomePage() {
  const dict = await getDictionary('en');
  
  return <HomePageClient dict={dict} locale="en" />;
}
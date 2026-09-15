import HomePageClient from '@/components/pages/HomePageClient';
import { getDictionary } from '@/i18n/getDictionary';

export default async function FaHomePage() {
  const dict = await getDictionary('fa');
  
  // ارسال بخش home از دیکشنری به کلاینت کامپوننت
  return <HomePageClient dict={dict} locale="fa" />;
}
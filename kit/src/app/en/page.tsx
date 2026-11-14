import { KitHomePageClient } from '@/components/home/KitHomePageClient';
import { getDictionary } from '@/i18n/getDictionary';

export default async function EnHomePage() {
  const dict = await getDictionary('en');
  return <KitHomePageClient locale="en" dict={dict} />;
}

import { KitHomePageClient } from '@/components/home/KitHomePageClient';
import { getDictionary } from '@/i18n/getDictionary';

export default async function HomePage() {
  const dict = await getDictionary('fa');
  return <KitHomePageClient locale="fa" dict={dict} />;
}

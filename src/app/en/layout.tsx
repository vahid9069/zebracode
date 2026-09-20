import { Providers } from "@/components/layout/Providers";
import AppLayout from "@/components/layout/AppLayout";
import { getDictionary } from '@/i18n/getDictionary';

export const metadata = {
  title: 'ZebraCode - Developer Tools',
  description: 'Online tools for developers',
};

export default async function EnRootLayout({ children }: { children: React.ReactNode }) {
  const dict = await getDictionary('en');

  return (
    <div dir="ltr">
        <Providers>
          <AppLayout locale="en" dict={dict}>
            {children}
          </AppLayout>
        </Providers>
    </div>
  );
}
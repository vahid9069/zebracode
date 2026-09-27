import localFont from 'next/font/local';
import { Providers } from "@/components/layout/Providers";
import AppLayout from "@/components/layout/AppLayout";
import { getDictionary } from '@/i18n/getDictionary';

const iransans = localFont({
  src: '../../../public/fonts/IRANSansWeb.woff2',
  display: 'swap',
  variable: '--font-fa',
  fallback: ['Tahoma', 'Segoe UI', 'sans-serif'],
});

export const metadata = {
  title: 'زبرا کد - ابزارهای توسعه‌دهندگان',
  description: 'مجموعه‌ای از ابزارهای آنلاین برنامه‌نویسی',
};

export default async function FaRootLayout({ children }: { children: React.ReactNode }) {
  // دریافت دیکشنری ترجمه‌ها در زمان Build
  const dict = await getDictionary('fa');

  return (
    <div dir="rtl" className={`${iransans.className} ${iransans.variable}`}>
        <Providers>
          <AppLayout locale="fa" dict={dict}>
            {children}
          </AppLayout>
        </Providers>
    </div>
  );
}
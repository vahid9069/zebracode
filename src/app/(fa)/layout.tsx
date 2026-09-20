import { Providers } from "@/components/layout/Providers";
import AppLayout from "@/components/layout/AppLayout";
import { getDictionary } from '@/i18n/getDictionary';

export const metadata = {
  title: 'زبرا کد - ابزارهای توسعه‌دهندگان',
  description: 'مجموعه‌ای از ابزارهای آنلاین برنامه‌نویسی',
};

export default async function FaRootLayout({ children }: { children: React.ReactNode }) {
  // دریافت دیکشنری ترجمه‌ها در زمان Build
  const dict = await getDictionary('fa');

  return (
    <div dir="rtl">
        <Providers>
          {/* ارسال دیکشنری layout به AppLayout */}
          <AppLayout locale="fa" dict={dict}>
            {children}
          </AppLayout>
        </Providers>
    </div>
  );
}
import "@/app/globals.css";
import { Providers } from "@/components/layout/Providers";
import AppLayout from "@/components/layout/AppLayout";
import { getDictionary } from '@/i18n/getDictionary';
import { BASE_URL } from '@/lib/env';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'زبرا کد - ابزارهای توسعه‌دهندگان',
  description: 'مجموعه‌ای از ابزارهای آنلاین برنامه‌نویسی',
};

export default async function FaRootLayout({ children }: { children: React.ReactNode }) {
  // دریافت دیکشنری ترجمه‌ها در زمان Build
  const dict = await getDictionary('fa');

  return (
    <html lang="fa-IR" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('zebracode-theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            } catch (e) {}
          })();
        ` }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {/* ارسال دیکشنری layout به AppLayout */}
          <AppLayout locale="fa" dict={dict}>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
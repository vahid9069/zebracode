import "@/app/globals.css";
// اگر اسکریپت تبلیغاتی (مثل یکتانت) داشتید، می‌توانید کامپوننت Script را ایمپورت کنید
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
    <html lang="fa-IR" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // بررسی و اعمال تم تاریک/روشن
                  var theme = localStorage.getItem('zebracode-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }

                  // ریدایرکت هوشمند زبان (اگر انگلیسی انتخاب شده بود)
                  var savedLang = localStorage.getItem('zebracode-lang');
                  if (savedLang === 'en' && !window.location.pathname.startsWith('/en')) {
                    window.location.replace('/en' + window.location.pathname);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
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
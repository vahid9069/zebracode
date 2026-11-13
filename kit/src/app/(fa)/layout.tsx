import type { Metadata } from 'next';
import '@/app/globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getDictionary } from '@/i18n/getDictionary';

export const metadata: Metadata = {
  metadataBase: new URL('https://kit.zebracode.ir'),
  title: 'زبراکد کیت | جعبه ابزار آنلاین عمومی و محاسباتی',
  description: 'مجموعه ابزارهای آنلاین و روزمره شامل فشرده‌سازی عکس، تبدیل تاریخ، محاسبه وام، ویراستار متن فارسی، QR کد ساز و ادغام PDF بدون ارسال فایل به سرور.',
  alternates: {
    canonical: 'https://kit.zebracode.ir/',
    languages: {
      'fa-IR': 'https://kit.zebracode.ir/',
      'en-US': 'https://kit.zebracode.ir/en/',
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function FaRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = await getDictionary('fa');

  return (
    <html lang="fa-IR" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/IRANSansWeb.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <ThemeProvider>
          <Header locale="fa" dict={dict} />
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
            {children}
          </main>
          <Footer locale="fa" dict={dict} />
        </ThemeProvider>
      </body>
    </html>
  );
}

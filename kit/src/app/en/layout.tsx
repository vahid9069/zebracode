import type { Metadata } from 'next';
import '@/app/globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getDictionary } from '@/i18n/getDictionary';

export const metadata: Metadata = {
  metadataBase: new URL('https://kit.zebracode.ir'),
  title: 'ZebraCode Kit | Free Online Daily & Utility Tools',
  description: 'Fast, client-side, privacy-focused online tools for image compression, file converters, QR code generation, date calculations, and everyday utilities.',
  alternates: {
    canonical: 'https://kit.zebracode.ir/en/',
    languages: {
      'fa-IR': 'https://kit.zebracode.ir/',
      'en-US': 'https://kit.zebracode.ir/en/',
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function EnRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = await getDictionary('en');

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <ThemeProvider>
          <Header locale="en" dict={dict} />
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
            {children}
          </main>
          <Footer locale="en" dict={dict} />
        </ThemeProvider>
      </body>
    </html>
  );
}

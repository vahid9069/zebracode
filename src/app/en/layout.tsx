import "@/app/globals.css";
import { Providers } from "@/components/layout/Providers";
import AppLayout from "@/components/layout/AppLayout";
import { getDictionary } from '@/i18n/getDictionary';
import { BASE_URL } from '@/lib/env';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'ZebraCode - Developer Tools',
  description: 'Online tools for developers',
};

export default async function EnRootLayout({ children }: { children: React.ReactNode }) {
  const dict = await getDictionary('en');

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
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
          <AppLayout locale="en" dict={dict}>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
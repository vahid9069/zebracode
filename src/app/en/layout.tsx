import "@/app/globals.css";
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
    <html lang="en-US" dir="ltr" suppressHydrationWarning>
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

                  // ریدایرکت هوشمند زبان (اگر فارسی انتخاب شده بود)
                  var savedLang = localStorage.getItem('zebracode-lang');
                  if (savedLang === 'fa' && window.location.pathname.startsWith('/en')) {
                    var newPath = window.location.pathname.replace(/^\\/en/, '') || '/';
                    window.location.replace(newPath);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
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
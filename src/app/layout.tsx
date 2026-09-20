import "@/app/globals.css";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
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
        <body className="font-sans antialiased">{children}</body>
        </html>
    );
}
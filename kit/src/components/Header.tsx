import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { Wrench, Code2 } from 'lucide-react';

interface HeaderProps {
  locale?: 'fa' | 'en';
  dict?: any;
}

export function Header({ locale = 'fa', dict }: HeaderProps) {
  const isEn = locale === 'en';
  const homeHref = isEn ? '/en/' : '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={homeHref} className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {isEn ? (
                <>ZebraCode <span className="text-blue-600 dark:text-blue-400">Kit</span></>
              ) : (
                <>زبراکد <span className="text-blue-600 dark:text-blue-400">کیت</span></>
              )}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              {dict?.common?.siteTagline || (isEn ? 'Daily & Utility Tools' : 'جعبه ابزارهای عمومی و روزمره')}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={isEn ? "https://zebracode.ir/en/" : "https://zebracode.ir/"}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 transition-all"
          >
            <Code2 className="w-3.5 h-3.5" />
            {dict?.common?.devToolsLink || (isEn ? 'Developer Tools' : 'ابزارهای برنامه‌نویسی')}
          </a>
          <LanguageToggle currentLocale={locale} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

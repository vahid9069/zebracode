'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  currentLocale: 'fa' | 'en';
}

export function LanguageToggle({ currentLocale }: LanguageToggleProps) {
  const pathname = usePathname() || '/';

  let targetHref = '/';
  let targetLabel = 'English';

  if (currentLocale === 'en') {
    // Current is English, switch to Persian
    targetHref = pathname.replace(/^\/en(\/|$)/, '/$1') || '/';
    if (!targetHref.startsWith('/')) targetHref = '/' + targetHref;
    targetLabel = 'فارسی';
  } else {
    // Current is Persian, switch to English
    targetHref = pathname === '/' ? '/en' : `/en${pathname}`;
    targetLabel = 'English';
  }

  return (
    <Link
      href={targetHref}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 transition-all"
      title={currentLocale === 'en' ? 'تغییر به زبان فارسی' : 'Switch to English'}
    >
      <Globe className="w-3.5 h-3.5 text-slate-500" />
      <span>{targetLabel}</span>
    </Link>
  );
}

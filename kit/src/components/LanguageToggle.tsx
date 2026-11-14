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
    const withoutEn = pathname.replace(/^\/en(\/|$)/, '/');
    const clean = withoutEn.replace(/^\/+|\/+$/g, '');
    targetHref = clean ? `/${clean}/` : '/';
    targetLabel = 'فارسی';
  } else {
    // Current is Persian, switch to English
    const clean = pathname.replace(/^\/+|\/+$/g, '');
    targetHref = clean ? `/en/${clean}/` : '/en/';
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

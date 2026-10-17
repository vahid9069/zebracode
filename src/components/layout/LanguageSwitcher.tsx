'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LanguageSwitcher() {
    const pathname = usePathname();

    // بررسی اینکه آیا کاربر در مسیر انگلیسی است یا خیر
    const isEnglish = pathname.startsWith('/en');

    // ساخت مسیر متقابل (اگر تو /en/about هستیم بریم به /about و برعکس)
    const togglePath = isEnglish
        ? pathname.replace(/^\/en/, '') || '/'  // حذف /en
        : `/en${pathname === '/' ? '' : pathname}`; // اضافه کردن /en

    return (
        <Link
            href={togglePath}
            className="px-3 py-1 border border-border-strong bg-surface text-sm font-medium text-text-muted transition-colors hover:bg-action-soft hover:text-action dark:hover:text-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
            {isEnglish ? 'فارسی' : 'English'}
        </Link>
    );
}

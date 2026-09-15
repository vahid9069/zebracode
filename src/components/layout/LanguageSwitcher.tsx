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
            className="px-3 py-1 border rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
        >
            {isEnglish ? 'فارسی' : 'English'}
        </Link>
    );
}
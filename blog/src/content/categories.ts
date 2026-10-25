import type { Category } from '@/lib/types';

export const categories: Category[] = [
    { slug: 'data', name: 'داده و ساختار', description: 'خواندن، اعتبارسنجی و تبدیل داده با مثال‌های کاربردی JSON و شناسه‌ها.', symbol: '{}' },
    { slug: 'development', name: 'توسعه و کدنویسی', description: 'از تعریف نوع تا تنظیمات پروژه و تبدیل درخواست‌های روزمره.', symbol: '</>' },
    { slug: 'security', name: 'امنیت کاربردی', description: 'درک امضا، توکن و مرزهای اعتماد در جریان توسعه.', symbol: '#' },
    { slug: 'network', name: 'شبکه و وب', description: 'رفتار HTTP و تفسیر پاسخ‌ها برای عیب‌یابی ارتباطات وب.', symbol: '↔' },
    { slug: 'productivity', name: 'متن و بهره‌وری', description: 'جزئیات کوچک متن و فایل که کار روزمره را قابل پیش‌بینی می‌کنند.', symbol: '¶' },
];

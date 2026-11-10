import type { Category } from '@/lib/types';

export const categories: Category[] = [
    { slug: 'tech-trends', name: 'تازه‌ها و ترندهای فناوری', description: 'رصد فناوری‌های نوظهور، هوش مصنوعی و ترندهای موثر در آینده دیجیتال.', symbol: '⚡' },
    { slug: 'development', name: 'توسعه و برنامه‌نویسی', description: 'معماری نرم‌افزار، استانداردهای کدنویسی، فریم‌ورک‌ها و الگوهای توسعه.', symbol: '</>' },
    { slug: 'tools', name: 'ابزارها و بهره‌وری', description: 'ابزارهای خط فرمان، ویرایشگرها، اتوماسیون و ابزارهای افزایش سرعت کار.', symbol: '🛠' },
    { slug: 'network', name: 'شبکه، وب و API', description: 'پروتکل‌های وب، طراحی و مصرف APIها و زیرساخت‌های شبکه مدرن.', symbol: '↔' },
    { slug: 'data', name: 'داده و ساختار', description: 'پایگاه‌داده‌ها، ساختار داده، بهینه‌سازی کوئری‌ها و مدیریت حجم داده.', symbol: '{}' },
    { slug: 'security', name: 'امنیت کاربردی', description: 'امنیت نرم‌افزار، احراز هویت، جلوگیری از آسیب‌پذیری‌ها و ایمن‌سازی سرویس‌ها.', symbol: '#' },
];

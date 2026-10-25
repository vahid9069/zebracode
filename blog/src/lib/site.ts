export const BLOG_BASE_PATH = '/blog';
export const site = {
    name: 'وبلاگ زبراکد',
    description: 'راهنماهای کاربردی برنامه‌نویسی، ابزارهای توسعه و بهره‌وری؛ از مسئله تا راه‌حل، با مثال‌های قابل استفاده.',
    url: (process.env.NEXT_PUBLIC_BLOG_URL || 'https://zebracode.ir/blog').replace(/\/+$/, ''),
    toolsUrl: (process.env.NEXT_PUBLIC_TOOLS_URL || 'https://zebracode.ir').replace(/\/+$/, ''),
    indexable: process.env.NEXT_PUBLIC_BLOG_INDEXABLE === 'true',
};

export const postPath = (slug: string) => `/articles/${encodeURIComponent(slug)}/`;
export const categoryPath = (slug: string) => `/category/${encodeURIComponent(slug)}/`;
export const absoluteUrl = (path = '/') => `${site.url}${path.startsWith('/') ? path : `/${path}`}`;
export const getToolUrl = (slug: string) => `${site.toolsUrl}/${encodeURIComponent(slug)}/`;
export const formatDate = (value: string) => new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran',
}).format(new Date(value));
export const formatNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

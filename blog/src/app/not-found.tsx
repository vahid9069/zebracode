import Link from 'next/link';

export default function NotFound() {
    return <section className="status-page"><code>404</code><h1>این صفحه را پیدا نکردیم.</h1><p>ممکن است نشانی مقاله تغییر کرده باشد. از فهرست مقاله‌ها شروع کنید یا موضوع موردنظرتان را جست‌وجو کنید.</p><Link className="zc-button" href="/">برگشت به وبلاگ</Link></section>;
}

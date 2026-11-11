import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 mt-20 py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <p>
          تمام ابزارها به صورت <span className="text-emerald-600 dark:text-emerald-400 font-medium">۱۰۰٪ سمت مرورگر (Local)</span> و با حفظ کامل حریم خصوصی اجرا می‌شوند.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-blue-600 transition-colors">صفحه اصلی</Link>
          <span>•</span>
          <a href="https://zebracode.ir" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
            زبراکد توسعه‌دهندگان
          </a>
        </div>
      </div>
    </footer>
  );
}

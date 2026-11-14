import Link from 'next/link';

interface FooterProps {
  locale?: 'fa' | 'en';
  dict?: any;
}

export function Footer({ locale = 'fa', dict }: FooterProps) {
  const isEn = locale === 'en';

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 mt-20 py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <p>
          {isEn ? (
            <>
              All tools run <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% Client-Side (Locally)</span> with complete data privacy.
            </>
          ) : (
            <>
              تمام ابزارها به صورت <span className="text-emerald-600 dark:text-emerald-400 font-medium">۱۰۰٪ سمت مرورگر (Local)</span> و با حفظ کامل حریم خصوصی اجرا می‌شوند.
            </>
          )}
        </p>
        <div className="flex items-center gap-4">
          <Link href={isEn ? "/en/" : "/"} className="hover:text-blue-600 transition-colors">
            {isEn ? 'Home' : 'صفحه اصلی'}
          </Link>
          <span>•</span>
          <a
            href={isEn ? "https://zebracode.ir/en/" : "https://zebracode.ir/"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
          >
            {isEn ? 'ZebraCode Developer Tools' : 'زبراکد توسعه‌دهندگان'}
          </a>
        </div>
      </div>
    </footer>
  );
}

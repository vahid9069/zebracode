import React from 'react';
import { Code2, ArrowLeft } from 'lucide-react';

interface Props {
  slug: string;
}

const CROSS_LINKS: Record<string, { title: string; desc: string; url: string; linkText: string }> = {
  'password-generator': {
    title: 'نیاز به توکن‌ها و کلیدهای امنیتی دیتابیس دارید؟',
    desc: 'اگر توسعه‌دهنده هستید و قصد ساخت توکن‌های تصادفی، سکرت‌کی API یا کلیدهای امن برای پایگاه داده دارید:',
    url: 'https://zebracode.ir/password-generator/',
    linkText: 'ورود به ابزار پسورد و توکن توسعه‌دهندگان زبراکد',
  },
  'date-diff': {
    title: 'نیاز به فرمت‌های ISO 8601 یا Unix Timestamp دارید؟',
    desc: 'اگر در پروژه‌های برنامه‌نویسی نیاز به تبدیل زمان سرور، محاسبه میلی‌ثانیه یا لاگ سیستم دارید:',
    url: 'https://zebracode.ir/date-diff/',
    linkText: 'ورود به جعبه‌ابزار زمان و تایم‌استمپ توسعه‌دهندگان',
  },
  'date-converter': {
    title: 'نیاز به تبدیل Unix Timestamp یا فرمت‌های زمان یونیکس دارید؟',
    desc: 'برای تبدیل زمان سیستم به تاریخ شمسی/میلادی در پروژه‌های کدنویسی و دیتابیس:',
    url: 'https://zebracode.ir/timestamp/',
    linkText: 'ورود به مبدل Timestamp یونیکس زبراکد',
  },
  'word-counter': {
    title: 'نیاز به مقایسه تفاوت دو متن یا کد (Text Diff) دارید؟',
    desc: 'برای بررسی خط به خط تغییرات اسناد فنی، کدهای برنامه‌نویسی و لاگ‌ها:',
    url: 'https://zebracode.ir/text-diff/',
    linkText: 'ورود به ابزار مقایسه متن و کد (Diff)',
  },
};

export function CrossLinkBanner({ slug }: Props) {
  const item = CROSS_LINKS[slug];
  if (!item) return null;

  return (
    <div className="mt-12 p-4 sm:p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/70 via-slate-50 to-white dark:from-blue-950/20 dark:via-slate-900/40 dark:to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
          <Code2 className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
        </div>
      </div>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all shadow-2xs"
      >
        <span>{item.linkText}</span>
        <ArrowLeft className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

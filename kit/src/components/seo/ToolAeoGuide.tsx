import React from 'react';
import { HelpCircle, CheckCircle2, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import { Tool } from '@/lib/tools';

interface Props {
  tool: Tool;
  locale?: 'fa' | 'en';
}

export function ToolAeoGuide({ tool, locale = 'fa' }: Props) {
  const isEn = locale === 'en';

  // ساخت سوالات متداول هوشمند و مرتبط
  const defaultFaqsFa = [
    {
      question: `آیا استفاده از ابزار ${tool.title} رایگان است؟`,
      answer: `بله، تمامی ابزارهای زبراکد کیت از جمله ${tool.title} به‌صورت ۱۰۰٪ رایگان، بدون نیاز به ثبت‌نام و بدون محدودیت در دسترس عموم قرار دارند.`,
    },
    {
      question: `آیا اطلاعات من در ابزار ${tool.title} به سرور ارسال می‌شود؟`,
      answer: `خیر. تمامی پردازش‌ها و محاسبات مستقیماً در مرورگر دستگاه شما (Local-First) انجام می‌شود و هیچ داده، فایل، عکس یا اطلاعات متنی به هیچ سروری ارسال یا ذخیره نمی‌شود.`,
    },
    {
      question: `چگونه می‌توان از ${tool.title} در موبایل استفاده کرد؟`,
      answer: `این ابزار کاملاً واکنش‌گرا (Responsive) طراحی شده و در تمام مرورگرهای گوشی‌های اندروید و آیفون (Safari, Chrome, Firefox) با بالاترین سرعت و بدون افت کارایی قابل استفاده است.`,
    },
  ];

  const defaultFaqsEn = [
    {
      question: `Is ${tool.title} completely free to use?`,
      answer: `Yes, all tools on ZebraCode Kit, including ${tool.title}, are 100% free with no registration, no subscriptions, and unlimited usage.`,
    },
    {
      question: `Does ${tool.title} upload my files or data to any server?`,
      answer: `No. All operations and data processing run 100% client-side in your browser. Your text, photos, and files never leave your device.`,
    },
    {
      question: `Can I use ${tool.title} on mobile devices?`,
      answer: `Yes. This tool is built mobile-first and works seamlessly on iOS (Safari) and Android (Chrome, Firefox, Edge) without installing any app.`,
    },
  ];

  const faqs = tool.faq && tool.faq.length > 0 && !isEn ? tool.faq : isEn ? defaultFaqsEn : defaultFaqsFa;

  // ساخت ساختار JSON-LD Schema.org
  const schemaJson = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: tool.title,
        description: tool.shortDescription,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires JavaScript',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: isEn ? 'USD' : 'IRR',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <article className="mt-12 space-y-8 pt-8 border-t border-slate-200 dark:border-slate-800">
      {/* تزریق Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      {/* بخش راهنمای سریع و پاسخ مستقیم */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2>
            {isEn ? `About & How to Use ${tool.title}` : `درباره و نحوه استفاده از ${tool.title}`}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {isEn ? (
            <>
              <strong>{tool.title}</strong> is a free, privacy-focused online utility provided by ZebraCode Kit designed for {tool.shortDescription.toLowerCase()}. All algorithms run client-side to ensure maximum speed, offline readiness, and security.
            </>
          ) : (
            <>
              <strong>{tool.title}</strong> یک ابزار آنلاین و رایگان از مجموعه زبراکد کیت است که جهت {tool.shortDescription.toLowerCase()} طراحی شده است. تمام الگوریتم‌ها بر پایه استانداردهای روز وب پیاده‌سازی شده و بالاترین سطح دقت، سرعت و حفظ حریم خصوصی را برای کاربران فراهم می‌سازد.
            </>
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{isEn ? 'Instant Client-Side Processing' : 'پردازش آنی بدون تاخیر'}</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
            <span>{isEn ? '100% Privacy & Zero Uploads' : 'امنیت کامل و حفظ حریم خصوصی'}</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{isEn ? 'Works on Mobile & Desktop' : 'سازگار با انواع نمایشگرها'}</span>
          </div>
        </div>
      </section>

      {/* بخش سوالات متداول (FAQ) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base mb-2">
          <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3>{isEn ? 'Frequently Asked Questions (FAQ)' : 'سوالات متداول کاربران (FAQ)'}</h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-colors open:bg-slate-50/50 dark:open:bg-slate-800/30"
            >
              <summary className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 cursor-pointer list-none flex items-center justify-between">
                <span>{faq.question}</span>
                <span className="text-blue-600 dark:text-blue-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className={`mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${isEn ? 'pl-2' : 'pr-2'}`}>
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}

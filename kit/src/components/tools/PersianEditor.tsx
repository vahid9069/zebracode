'use client';

import React, { useState, useMemo } from 'react';
import { Copy, Check, Sparkles, Trash2, Clipboard, Download, FileText } from 'lucide-react';

const SAMPLE_TEXT = `این یک متن نمونه است كه دارای غلط های نگارشی مي باشد.
کتاب ها و مقاله ها را مي توان در كتابخانه ها پیدا كرد و بهترين نتیجه را گرفت.
او گفت: "این یک جمله است" و ادامه داد.`;

export function PersianEditor() {
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [copied, setCopied] = useState(false);

  const { processedText, stats } = useMemo(() => {
    let res = input;
    let fixCount = 0;

    // شمارش و تبدیل ی و ک
    const arabicKafCount = (res.match(/ك/g) || []).length;
    const arabicYehCount = (res.match(/ي/g) || []).length;
    res = res.replace(/ي/g, 'ی').replace(/ك/g, 'ک');
    fixCount += arabicKafCount + arabicYehCount;

    // فاصله‌های پشت سر هم
    const multiSpaces = (res.match(/[ ]{2,}/g) || []).length;
    res = res.replace(/[ ]+/g, ' ');
    fixCount += multiSpaces;

    // نیم‌فاصله‌های پیشوندی و پسوندی
    const halfSpace = '\u200c';
    const miCount = (res.match(/\b(می|نمی)\s+/g) || []).length;
    res = res.replace(/\b(می|نمی)\s+/g, `$1${halfSpace}`);
    fixCount += miCount;

    const haCount = (res.match(/\s+(ها|های|هایی|هایم|هایت|هایش|هایمان|هایتان|هایشان)\b/g) || []).length;
    res = res.replace(/\s+(ها|های|هایی|هایم|هایت|هایش|هایمان|هایتان|هایشان)\b/g, `${halfSpace}$1`);
    fixCount += haCount;

    const suffixCount = (res.match(/\s+(تر|ترین|گری|ام|ات|اش|ایم|اید|اند)\b/g) || []).length;
    res = res.replace(/\s+(تر|ترین|گری|ام|ات|اش|ایم|اید|اند)\b/g, `${halfSpace}$1`);
    fixCount += suffixCount;

    // تبدیل گیومه
    res = res.replace(/"([^"]*)"/g, '«$1»');

    // محاسبه آمار
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const chars = input.length;
    const lines = input ? input.split('\n').length : 0;

    return {
      processedText: res,
      stats: { words, chars, lines, fixes: fixCount },
    };
  }, [input]);

  const handleCopy = () => {
    navigator.clipboard.writeText(processedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([processedText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'edited-text.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* دو پنل ادیتور شبیه به استایل تخصصی زبراکد */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* پنل ورودی */}
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* هدر پنل شبیه ابزارهای توسعه‌دهنده */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mr-1">متن ورودی</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePaste}
                title="جای‌گذاری از کلیپ‌بورد"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>پیست</span>
              </button>
              <button
                type="button"
                onClick={() => setInput('')}
                title="پاک کردن متن"
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* بدنه ورودی */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="متن خود را اینجا تایپ یا پیست کنید..."
            rows={12}
            className="w-full p-4 bg-transparent text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none font-sans"
          />

          {/* فوتر آمار متن ورودی */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span>{stats.words.toLocaleString('fa-IR')} کلمه</span>
              <span>•</span>
              <span>{stats.chars.toLocaleString('fa-IR')} کاراکتر</span>
              <span>•</span>
              <span>{stats.lines.toLocaleString('fa-IR')} خط</span>
            </div>
          </div>
        </div>

        {/* پنل خروجی ویرایش‌شده */}
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* هدر خروجی */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                متن استانداردشده
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDownload}
                title="دانلود متن به صورت فایل .txt"
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">دانلود</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد!' : 'کپی متن'}</span>
              </button>
            </div>
          </div>

          {/* بدنه خروجی */}
          <textarea
            readOnly
            value={processedText}
            placeholder="نتیجه ویرایش اینجا نمایش داده می‌شود..."
            rows={12}
            className="w-full p-4 bg-slate-50/50 dark:bg-slate-900/50 text-sm leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none resize-none font-sans"
          />

          {/* فوتر آمار اصلاحات */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {stats.fixes > 0 ? `${stats.fixes.toLocaleString('fa-IR')} مورد اصلاح و بهینه‌سازی شد` : 'متن بدون نیاز به اصلاح'}
            </span>
            <span className="text-slate-400">۱۰۰٪ آفلاین و سمت مرورگر</span>
          </div>
        </div>
      </div>
    </div>
  );
}

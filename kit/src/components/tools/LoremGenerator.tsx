'use client';

import React, { useState } from 'react';
import { Copy, Check, Download, RefreshCw, FileText } from 'lucide-react';

const PERSIAN_WORDS = [
  'لورم', 'ایپسوم', 'متن', 'ساختگی', 'با', 'تولید', 'سادگی', 'نامفهوم', 'از', 'صنعت', 'چاپ',
  'و', 'با', 'استفاده', 'از', 'طراحان', 'گرافیک', 'است', 'چاپگرها', 'و', 'متون', 'بلکه', 'روزنامه',
  'و', 'مجله', 'در', 'ستون', 'و', 'سطرآنچنان', 'که', 'لازم', 'است', 'و', 'برای', 'شرایط', 'فعلی',
  'تکنولوژی', 'مورد', 'نیاز', 'و', 'کاربردهای', 'متنوع', 'با', 'هدف', 'بهبود', 'ابزارهای', 'کاربردی',
  'می‌باشد', 'کتابهای', 'زیادی', 'در', 'شصت', 'و', 'سه', 'درصد', 'گذشته', 'حال', 'و', 'آینده',
  'شناخت', 'فراوان', 'جامعه', 'و', 'متخصصان', 'را', 'می‌طلبد', 'تا', 'با', 'نرم‌افزارها', 'شناخت',
  'بیشتری', 'را', 'برای', 'طراحان', 'رایانه‌ای', 'علی‌الخصوص', 'طراحان', 'خلاقی', 'و', 'فرهنگ',
  'پیشرو', 'در', 'زبان', 'فارسی', 'ایجاد', 'کرد', 'در', 'این', 'صورت', 'می‌توان', 'امید', 'داشت',
  'که', 'تمام', 'و', 'دشواری', 'موجود', 'در', 'ارائه', 'راهکارها', 'و', 'شرایط', 'سخت', 'تایپ',
  'به', 'پایان', 'رسد', 'و', 'زمان', 'مورد', 'نیاز', 'شامل', 'حروفچینی', 'دستاوردهای', 'اصلی',
  'و', 'جوابگوی', 'سوالات', 'پیوسته', 'اهل', 'دنیای', 'موجود', 'طراحی', 'اساسا', 'مورد', 'استفاده',
  'قرار', 'گیرد'
];

const ENGLISH_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
  'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip',
  'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat',
  'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
];

type UnitType = 'paragraphs' | 'sentences' | 'words' | 'lists';
type LangType = 'fa' | 'en';

export function LoremGenerator() {
  const [lang, setLang] = useState<LangType>('fa');
  const [unit, setUnit] = useState<UnitType>('paragraphs');
  const [count, setCount] = useState<number>(3);
  const [asHtml, setAsHtml] = useState<boolean>(false);
  const [startStandard, setStartStandard] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const generateSentence = (wordList: string[], isFirst: boolean): string => {
    const len = Math.floor(Math.random() * 8) + 8;
    const words: string[] = [];

    if (isFirst && startStandard) {
      if (lang === 'fa') {
        return 'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است.';
      } else {
        return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      }
    }

    for (let i = 0; i < len; i++) {
      const idx = Math.floor(Math.random() * wordList.length);
      words.push(wordList[idx]);
    }

    const firstWord = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    words[0] = firstWord;
    return words.join(' ') + ' .';
  };

  const generateParagraph = (wordList: string[], isFirst: boolean): string => {
    const sCount = Math.floor(Math.random() * 3) + 4;
    const sentences: string[] = [];
    for (let i = 0; i < sCount; i++) {
      sentences.push(generateSentence(wordList, isFirst && i === 0));
    }
    return sentences.join(' ');
  };

  const generateText = (): string => {
    const wordList = lang === 'fa' ? PERSIAN_WORDS : ENGLISH_WORDS;
    const targetCount = Math.max(1, Math.min(count, 50));

    if (unit === 'words') {
      const words: string[] = [];
      for (let i = 0; i < targetCount; i++) {
        words.push(wordList[Math.floor(Math.random() * wordList.length)]);
      }
      return words.join(' ');
    }

    if (unit === 'sentences') {
      const sentences: string[] = [];
      for (let i = 0; i < targetCount; i++) {
        sentences.push(generateSentence(wordList, i === 0));
      }
      return sentences.join('\n\n');
    }

    if (unit === 'lists') {
      const items: string[] = [];
      for (let i = 0; i < targetCount; i++) {
        items.push(generateSentence(wordList, false).replace(' .', ''));
      }
      if (asHtml) {
        return `<ul>\n${items.map((it) => `  <li>${it}</li>`).join('\n')}\n</ul>`;
      }
      return items.map((it) => `• ${it}`).join('\n');
    }

    // paragraphs
    const paras: string[] = [];
    for (let i = 0; i < targetCount; i++) {
      paras.push(generateParagraph(wordList, i === 0));
    }

    if (asHtml) {
      return paras.map((p) => `<p>${p}</p>`).join('\n\n');
    }
    return paras.join('\n\n');
  };

  const [generatedText, setGeneratedText] = useState<string>(generateText);

  const handleRegenerate = () => {
    setGeneratedText(generateText());
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lorem-ipsum-${lang}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = generatedText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = generatedText.length;

  return (
    <div className="space-y-6">
      {/* نوار تنظیمات */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* زبان */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">زبان متن</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setLang('fa')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  lang === 'fa'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                فارسی
              </button>
              <button
                onClick={() => setLang('en')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                انگلیسی (Latin)
              </button>
            </div>
          </div>

          {/* نوع خروجی */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">واحد شمارش</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as UnitType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
            >
              <option value="paragraphs">پاراگراف</option>
              <option value="sentences">جمله</option>
              <option value="words">کلمه</option>
              <option value="lists">آیتم‌های لیست (ul/li)</option>
            </select>
          </div>

          {/* تعداد */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">تعداد (۱ تا ۵۰)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-center"
            />
          </div>

          {/* گزینه‌ها */}
          <div className="flex flex-col justify-end space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={asHtml}
                onChange={(e) => setAsHtml(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span>قالب‌بندی HTML (&lt;p&gt;)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={startStandard}
                onChange={(e) => setStartStandard(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span>شروع با عبارت استاندارد</span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            تولید متن لورم ایپسوم
          </button>
        </div>
      </div>

      {/* نمایش متن خروجی */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>کلمات: <strong className="text-slate-800 dark:text-slate-200 font-mono">{wordCount}</strong></span>
            <span>•</span>
            <span>کاراکترها: <strong className="text-slate-800 dark:text-slate-200 font-mono">{charCount}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'کپی شد!' : 'کپی متن'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300"
              title="دانلود فایل .txt"
            >
              <Download className="w-3.5 h-3.5" />
              دانلود
            </button>
          </div>
        </div>

        <div className="p-5">
          <textarea
            readOnly
            value={generatedText}
            dir={lang === 'fa' ? 'rtl' : 'ltr'}
            rows={10}
            className={`w-full bg-transparent border-0 resize-y focus:outline-none text-slate-800 dark:text-slate-200 leading-relaxed text-sm ${
              lang === 'en' ? 'font-sans' : 'font-vazir'
            }`}
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useId } from 'react';
import { Copy, Check, Download, RefreshCw, Sparkles, FileText, Code2, ListOrdered } from 'lucide-react';

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
  'قرار', 'گیرد', 'طراحی', 'گرافیک', 'نرم‌افزار', 'خلاقیت', 'صفحه‌آرایی', 'محتوا', 'پیش‌نویس',
  'قلم', 'تایپوگرافی', 'طراحی‌وب', 'کاربردی', 'توسعه', 'سامانه', 'چاپخانه', 'دیجیتال'
];

const ENGLISH_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
  'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip',
  'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat',
  'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
  'elementum', 'facilisis', 'volutpat', 'dictum', 'cursus', 'rhoncus', 'aliquet', 'phasellus', 'molestie'
];

type UnitType = 'paragraphs' | 'sentences' | 'words' | 'lists' | 'json';
type LangType = 'fa' | 'en';

interface LoremGeneratorProps {
  locale?: string;
  dict?: any;
}

export function LoremGenerator({ locale = 'fa', dict }: LoremGeneratorProps) {
  const isEn = locale === 'en';
  const [lang, setLang] = useState<LangType>(isEn ? 'en' : 'fa');
  const [unit, setUnit] = useState<UnitType>('paragraphs');
  const [count, setCount] = useState<number>(3);
  const [asHtml, setAsHtml] = useState<boolean>(false);
  const [startStandard, setStartStandard] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const generateSentence = (wordList: string[], isFirst: boolean): string => {
    if (isFirst && startStandard) {
      return lang === 'fa'
        ? 'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است.'
        : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
    }

    const len = Math.floor(Math.random() * 8) + 8;
    const words: string[] = [];
    for (let i = 0; i < len; i++) {
      const idx = Math.floor(Math.random() * wordList.length);
      words.push(wordList[idx]);
    }

    if (lang === 'fa') {
      return words.join(' ') + '، که در طراحی صفحه برای تست متن کاربرد دارد.';
    }

    const firstWord = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    words[0] = firstWord;
    return words.join(' ') + '.';
  };

  const generateParagraph = (wordList: string[], isFirst: boolean): string => {
    const sCount = Math.floor(Math.random() * 3) + 3;
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
      if (startStandard) {
        const std = lang === 'fa' ? ['لورم', 'ایپسوم', 'متن', 'ساختگی'] : ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'];
        words.push(...std.slice(0, targetCount));
      }
      while (words.length < targetCount) {
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
        items.push(generateSentence(wordList, false).replace(/\.$/, ''));
      }
      if (asHtml) {
        return `<ul>\n${items.map((it) => `  <li>${it}</li>`).join('\n')}\n</ul>`;
      }
      return items.map((it) => `• ${it}`).join('\n');
    }

    if (unit === 'json') {
      const mockData = Array.from({ length: targetCount }, (_, i) => ({
        id: i + 1,
        title: generateSentence(wordList, false).slice(0, 35).trim(),
        description: generateSentence(wordList, false),
        author: lang === 'fa' ? `کاربر ${i + 1}` : `User ${i + 1}`,
        createdAt: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      }));
      return JSON.stringify(mockData, null, 2);
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
    const ext = unit === 'json' ? 'json' : asHtml ? 'html' : 'txt';
    const mime = unit === 'json' ? 'application/json' : asHtml ? 'text/html' : 'text/plain';
    const blob = new Blob([generatedText], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lorem-ipsum-${lang}-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = generatedText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = generatedText.length;
  const paragraphCount = generatedText.trim().split(/\n\s*\n/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Language Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">
              {isEn ? 'Language' : 'زبان متن'}
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setLang('fa')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  lang === 'fa'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isEn ? 'Persian (فا)' : 'فارسی'}
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isEn ? 'English (Latin)' : 'انگلیسی'}
              </button>
            </div>
          </div>

          {/* Unit Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">
              {isEn ? 'Unit Type' : 'نوع واحد'}
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as UnitType)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="paragraphs">{isEn ? 'Paragraphs' : 'پاراگراف'}</option>
              <option value="sentences">{isEn ? 'Sentences' : 'جمله'}</option>
              <option value="words">{isEn ? 'Words' : 'کلمه'}</option>
              <option value="lists">{isEn ? 'List Items (ul / li)' : 'آیتم‌های لیست'}</option>
              <option value="json">{isEn ? 'JSON Mock Data' : 'آرایه داده ساختگی JSON'}</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">
              {isEn ? 'Quantity (1-50)' : 'تعداد (۱ تا ۵۰)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="30"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <input
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                className="w-16 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-center text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Formatting Options */}
          <div className="flex flex-col justify-center space-y-2.5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={asHtml}
                disabled={unit === 'json' || unit === 'words'}
                onChange={(e) => setAsHtml(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0 disabled:opacity-50"
              />
              <span>{isEn ? 'Wrap in HTML tags' : 'قالب‌بندی کدهای HTML'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={startStandard}
                disabled={unit === 'json'}
                onChange={(e) => setStartStandard(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0 disabled:opacity-50"
              />
              <span>{isEn ? 'Start with standard Lorem' : 'شروع با عبارت استاندارد لورم'}</span>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isEn ? '100% In-browser generation' : 'تولید سریع و بدون نیاز به اینترنت'}</span>
          </div>

          <button
            type="button"
            onClick={handleRegenerate}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isEn ? 'Regenerate Text' : 'تولید مجدد متن'}</span>
          </button>
        </div>
      </div>

      {/* Output Display Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              {isEn ? 'Words: ' : 'کلمات: '}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{wordCount}</strong>
            </span>
            <span>•</span>
            <span>
              {isEn ? 'Characters: ' : 'کاراکترها: '}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{charCount}</strong>
            </span>
            {unit === 'paragraphs' && (
              <>
                <span>•</span>
                <span>
                  {isEn ? 'Paragraphs: ' : 'پاراگراف‌ها: '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{paragraphCount}</strong>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 shadow-sm transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isEn ? 'Copied!' : 'کپی شد!') : (isEn ? 'Copy' : 'کپی')}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 shadow-sm transition-all"
              title={isEn ? 'Download file' : 'دانلود فایل'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isEn ? 'Download' : 'دانلود'}</span>
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="p-6">
          <textarea
            readOnly
            value={generatedText}
            dir={lang === 'fa' && unit !== 'json' ? 'rtl' : 'ltr'}
            rows={12}
            className={`w-full bg-transparent border-0 resize-y focus:outline-none text-slate-800 dark:text-slate-200 leading-relaxed text-sm ${
              unit === 'json' || asHtml ? 'font-mono text-xs' : lang === 'en' ? 'font-sans' : 'font-vazir'
            }`}
          />
        </div>
      </div>
    </div>
  );
}

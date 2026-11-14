'use client';

import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Sparkles,
  Trash2,
  Clipboard,
  Download,
  RotateCcw,
  CheckCircle2,
  Settings2,
  ArrowRightLeft
} from 'lucide-react';

const SAMPLE_TEXT_FA = `این يك متن نمونه است كه دارای غلط های نگارشی مي باشد.
كتاب ها و مقاله ها را مي توان در كتابخانه ها پيدا كرد و بهترين نتیجه را گرفت.
او گفت: "این یک جمله است" و ادامه داد: قیمت کالا 12500 تومان است و در تاریخ 1403/05/20 ثبت شده است.
دانش آموزان مدرسه می توانند با تلاش به موفقیت برسند .`;

const SAMPLE_TEXT_EN = `This is a sample text with incorrect typography and punctuation .
For example , quotes like "this" or 'that' , and unneeded spaces between words .
You can use this tool to standardize Persian and bilingual texts easily .`;

interface PersianEditorProps {
  locale?: string;
  dict?: any;
}

export function PersianEditor({ locale = 'fa', dict }: PersianEditorProps) {
  const isEn = locale === 'en';
  const [input, setInput] = useState<string>(isEn ? SAMPLE_TEXT_EN : SAMPLE_TEXT_FA);
  const [copied, setCopied] = useState<boolean>(false);

  // Options
  const [fixArabicChars, setFixArabicChars] = useState<boolean>(true);
  const [fixHalfSpace, setFixHalfSpace] = useState<boolean>(true);
  const [fixPunctuation, setFixPunctuation] = useState<boolean>(true);
  const [fixQuotes, setFixQuotes] = useState<boolean>(true);
  const [convertDigits, setConvertDigits] = useState<'persian' | 'english' | 'none'>('persian');
  const [cleanSpacing, setCleanSpacing] = useState<boolean>(true);

  const { processedText, stats } = useMemo(() => {
    let res = input;
    let fixCount = 0;

    // 1. Arabic Characters (ي -> ی, ك -> ک, ة -> ه/ت, ؤ, etc.)
    if (fixArabicChars) {
      const arabicYehCount = (res.match(/ي/g) || []).length;
      const arabicKafCount = (res.match(/ك/g) || []).length;
      const arabicTehMarbuta = (res.match(/ة\b/g) || []).length;
      res = res
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/ة\b/g, 'ه')
        .replace(/ؤ/g, 'و');
      fixCount += arabicYehCount + arabicKafCount + arabicTehMarbuta;
    }

    // 2. Extra spaces cleanup
    if (cleanSpacing) {
      const multiSpaces = (res.match(/[ ]{2,}/g) || []).length;
      res = res.replace(/[ ]+/g, ' ');
      // Clean leading and trailing whitespace on each line
      res = res
        .split('\n')
        .map((line) => line.trim())
        .join('\n');
      fixCount += multiSpaces;
    }

    // 3. Half-spaces (ZWNJ \u200c)
    if (fixHalfSpace) {
      const zwnj = '\u200c';

      // Prefixes: می, نمی, بی
      const prefixCount = (res.match(/\b(می|نمی|بی)\s+/g) || []).length;
      res = res.replace(/\b(می|نمی|بی)\s+/g, `$1${zwnj}`);
      fixCount += prefixCount;

      // Suffixes: ها, های, هایم, هایت, هایش, هایمان, هایتان, هایشان
      const haCount = (res.match(/\s+(ها|های|هایی|هایم|هایت|هایش|هایمان|هایتان|هایشان)\b/g) || []).length;
      res = res.replace(/\s+(ها|های|هایی|هایم|هایت|هایش|هایمان|هایتان|هایشان)\b/g, `${zwnj}$1`);
      fixCount += haCount;

      // Suffixes: تر, ترین, ام, ات, اش, ایم, اید, اند, شناس, شناسی, مند, مندی, ساز, سازی, پذیر
      const suffixPattern = /\s+(تر|ترین|ام|ات|اش|ایم|اید|اند|شناس|شناسی|مند|مندی|ساز|سازی|پذیر|پذیری|گر|گری)\b/g;
      const suffixMatches = (res.match(suffixPattern) || []).length;
      res = res.replace(suffixPattern, `${zwnj}$1`);
      fixCount += suffixMatches;

      // Compound words fix: به عنوان, به ویژه, رو به رو
      res = res.replace(/\bبه\s+(ویژه|صورت|عنوان|دلیل|شکل|طور)\b/g, `به$1`);
    }

    // 4. Quotation normalization ("..." -> «...»)
    if (fixQuotes) {
      const quoteMatches = (res.match(/"([^"]*)"/g) || []).length;
      res = res.replace(/"([^"]*)"/g, '«$1»');
      fixCount += quoteMatches;
    }

    // 5. Punctuation spacing (period, comma, colon, semicolon, exclamation, question)
    if (fixPunctuation) {
      // Remove space before punctuation marks, ensure one space after
      const punctBeforeCount = (res.match(/\s+([.,;:!?؟،؛])/g) || []).length;
      res = res.replace(/\s+([.,;:!?؟،؛])/g, '$1');
      res = res.replace(/([.,;:!?؟،؛])([^\s\d.,;:!?؟،؛«»"'\)\]])/g, '$1 $2');
      // Normalize Arabic comma and semicolon in Persian text
      res = res.replace(/,/g, '،').replace(/;/g, '؛').replace(/\?/g, '؟');
      fixCount += punctBeforeCount;
    }

    // 6. Number conversions
    if (convertDigits === 'persian') {
      const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      let digitCount = 0;
      for (let i = 0; i < 10; i++) {
        const matches = (res.match(new RegExp(enDigits[i], 'g')) || []).length;
        digitCount += matches;
        res = res.replace(new RegExp(enDigits[i], 'g'), faDigits[i]);
      }
      fixCount += digitCount;
    } else if (convertDigits === 'english') {
      const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      const arDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      let digitCount = 0;
      for (let i = 0; i < 10; i++) {
        const matches = ((res.match(new RegExp(faDigits[i], 'g')) || []).length) +
                        ((res.match(new RegExp(arDigits[i], 'g')) || []).length);
        digitCount += matches;
        res = res
          .replace(new RegExp(faDigits[i], 'g'), enDigits[i])
          .replace(new RegExp(arDigits[i], 'g'), enDigits[i]);
      }
      fixCount += digitCount;
    }

    // Metrics
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const chars = input.length;
    const lines = input ? input.split('\n').length : 0;

    return {
      processedText: res,
      stats: { words, chars, lines, fixes: fixCount },
    };
  }, [input, fixArabicChars, fixHalfSpace, fixPunctuation, fixQuotes, convertDigits, cleanSpacing]);

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
    element.download = `edited-persian-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleResetSample = () => {
    setInput(isEn ? SAMPLE_TEXT_EN : SAMPLE_TEXT_FA);
  };

  return (
    <div className="space-y-6">
      {/* Settings Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Settings2 className="w-4 h-4 text-blue-500" />
            <span>{isEn ? 'Typography & Editing Rules' : 'قواعد نگارش و ویرایش خودکار'}</span>
          </div>

          <button
            type="button"
            onClick={handleResetSample}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isEn ? 'Reset to Sample' : 'بارگذاری متن نمونه'}</span>
          </button>
        </div>

        {/* Checkbox Options */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={fixArabicChars}
              onChange={(e) => setFixArabicChars(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Fix ي and ك' : 'اصلاح «ي» و «ك»'}</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={fixHalfSpace}
              onChange={(e) => setFixHalfSpace(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Half-spaces (ZWNJ)' : 'نیم‌فاصله‌ هوشمند'}</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={fixPunctuation}
              onChange={(e) => setFixPunctuation(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Persian punctuation' : 'نشانه‌گذاری فارسی (، ؛ ؟)'}</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={fixQuotes}
              onChange={(e) => setFixQuotes(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Quotes («»)' : 'گیومه فارسی «»'}</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={cleanSpacing}
              onChange={(e) => setCleanSpacing(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Clean spaces' : 'حذف فواصل اضافه'}</span>
          </label>

          {/* Digits Mode */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-slate-500 whitespace-nowrap">{isEn ? 'Digits:' : 'ارقام:'}</label>
            <select
              value={convertDigits}
              onChange={(e) => setConvertDigits(e.target.value as any)}
              className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="persian">{isEn ? 'Persian (۰-۹)' : 'فارسی (۰-۹)'}</option>
              <option value="english">{isEn ? 'English (0-9)' : 'انگلیسی (0-9)'}</option>
              <option value="none">{isEn ? 'Keep as is' : 'بدون تغییر'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editor Dual Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input Panel */}
        <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mr-1">
                {isEn ? 'Original Text' : 'متن اصلی (ورودی)'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePaste}
                title={isEn ? 'Paste from clipboard' : 'جای‌گذاری از کلیپ‌بورد'}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>{isEn ? 'Paste' : 'پیست'}</span>
              </button>
              <button
                type="button"
                onClick={() => setInput('')}
                title={isEn ? 'Clear text' : 'پاک کردن متن'}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isEn ? 'Type or paste your text here...' : 'متن خود را اینجا تایپ یا پیست کنید...'}
            rows={12}
            className="w-full p-5 bg-transparent text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none font-vazir"
          />

          <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-3">
              <span>{isEn ? `${stats.words} words` : `${stats.words.toLocaleString('fa-IR')} کلمه`}</span>
              <span>•</span>
              <span>{isEn ? `${stats.chars} chars` : `${stats.chars.toLocaleString('fa-IR')} کاراکتر`}</span>
              <span>•</span>
              <span>{isEn ? `${stats.lines} lines` : `${stats.lines.toLocaleString('fa-IR')} خط`}</span>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {isEn ? 'Standardized Output' : 'متن ویرایش‌شده و استاندارد'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                title={isEn ? 'Download .txt file' : 'دانلود فایل متنی'}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isEn ? 'Download' : 'دانلود'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isEn ? 'Copied!' : 'کپی شد!') : (isEn ? 'Copy' : 'کپی')}</span>
              </button>
            </div>
          </div>

          <textarea
            readOnly
            value={processedText}
            placeholder={isEn ? 'Formatted text will appear here...' : 'نتیجه ویرایش اینجا نمایش داده می‌شود...'}
            rows={12}
            className="w-full p-5 bg-slate-50/40 dark:bg-slate-900/40 text-sm leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none resize-none font-vazir"
          />

          <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {stats.fixes > 0
                ? isEn
                  ? `${stats.fixes} improvements applied`
                  : `${stats.fixes.toLocaleString('fa-IR')} مورد اصلاح و بهینه‌سازی شد`
                : isEn
                ? 'Text conforms to standard'
                : 'متن کاملاً استاندارد است'}
            </span>
            <span className="text-slate-400">{isEn ? '100% In-Browser' : '۱۰۰٪ آفلاین'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

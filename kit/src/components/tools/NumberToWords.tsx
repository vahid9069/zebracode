'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Hash,
  Sparkles,
  Clipboard,
  Trash2,
  Download,
  Languages,
  RotateCcw
} from 'lucide-react';

interface NumberToWordsProps {
  locale?: string;
  dict?: any;
}

// Persian conversion constants
const FA_ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const FA_TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const FA_TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const FA_HUNDREDS = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const FA_THOUSANDS = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون', 'کوادریلیون'];

// English conversion constants
const EN_ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const EN_TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const EN_THOUSANDS = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion'];

function convertThreeDigitsFA(num: number): string {
  if (num === 0) return '';
  const parts: string[] = [];
  const h = Math.floor(num / 100);
  const remainder = num % 100;
  if (h > 0) parts.push(FA_HUNDREDS[h]);

  if (remainder >= 10 && remainder <= 19) {
    parts.push(FA_TEENS[remainder - 10]);
  } else {
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;
    if (t > 0) parts.push(FA_TENS[t]);
    if (o > 0) parts.push(FA_ONES[o]);
  }
  return parts.join(' و ');
}

function numberToPersianWords(clean: string): string {
  if (!clean || clean === '0') return 'صفر';

  const chunks: number[] = [];
  let s = clean;
  while (s.length > 0) {
    chunks.push(parseInt(s.slice(-3), 10));
    s = s.slice(0, -3);
  }

  const wordParts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const val = chunks[i];
    if (val > 0) {
      const text = convertThreeDigitsFA(val);
      const unit = FA_THOUSANDS[i];
      wordParts.push(unit ? `${text} ${unit}` : text);
    }
  }

  return wordParts.join(' و ');
}

function convertThreeDigitsEN(num: number): string {
  if (num === 0) return '';
  const parts: string[] = [];
  const h = Math.floor(num / 100);
  const remainder = num % 100;
  if (h > 0) parts.push(`${EN_ONES[h]} hundred`);

  if (remainder >= 10 && remainder <= 19) {
    parts.push(EN_TEENS[remainder - 10]);
  } else {
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;
    if (t > 0) parts.push(EN_TENS[t]);
    if (o > 0) parts.push(EN_ONES[o]);
  }
  return parts.join(' ');
}

function numberToEnglishWords(clean: string): string {
  if (!clean || clean === '0') return 'zero';

  const chunks: number[] = [];
  let s = clean;
  while (s.length > 0) {
    chunks.push(parseInt(s.slice(-3), 10));
    s = s.slice(0, -3);
  }

  const wordParts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const val = chunks[i];
    if (val > 0) {
      const text = convertThreeDigitsEN(val);
      const unit = EN_THOUSANDS[i];
      wordParts.push(unit ? `${text} ${unit}` : text);
    }
  }

  return wordParts.join(', ');
}

export function NumberToWords({ locale = 'fa', dict }: NumberToWordsProps) {
  const isEn = locale === 'en';
  const [val, setVal] = useState<string>('12500000');
  const [currencyUnit, setCurrencyUnit] = useState<'toman' | 'rial' | 'none'>('toman');
  const [copiedFa, setCopiedFa] = useState<boolean>(false);
  const [copiedEn, setCopiedEn] = useState<boolean>(false);

  // Normalize Persian/Arabic digits to ASCII
  const cleanNum = val
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/\D/g, '');

  const wordsFa = numberToPersianWords(cleanNum);
  const wordsEn = numberToEnglishWords(cleanNum);

  const getFullOutputFa = () => {
    if (!cleanNum) return '';
    if (currencyUnit === 'toman') return `${wordsFa} تومان`;
    if (currencyUnit === 'rial') return `${wordsFa} ریال`;
    return wordsFa;
  };

  const getFullOutputEn = () => {
    if (!cleanNum) return '';
    if (currencyUnit === 'toman') return `${wordsEn} Tomans`;
    if (currencyUnit === 'rial') return `${wordsEn} Rials`;
    return wordsEn;
  };

  const handleCopyFa = () => {
    navigator.clipboard.writeText(getFullOutputFa());
    setCopiedFa(true);
    setTimeout(() => setCopiedFa(false), 2000);
  };

  const handleCopyEn = () => {
    navigator.clipboard.writeText(getFullOutputEn());
    setCopiedEn(true);
    setTimeout(() => setCopiedEn(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isEn ? 'Enter number or currency amount:' : 'عدد یا مبلغ مورد نظر را وارد کنید:'}
          </label>

          {/* Currency Unit Selection */}
          <div className="flex rounded-2xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCurrencyUnit('toman')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                currencyUnit === 'toman'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isEn ? 'Toman' : 'تومان'}
            </button>
            <button
              type="button"
              onClick={() => setCurrencyUnit('rial')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                currencyUnit === 'rial'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isEn ? 'Rial' : 'ریال'}
            </button>
            <button
              type="button"
              onClick={() => setCurrencyUnit('none')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                currencyUnit === 'none'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isEn ? 'Raw Number' : 'بدون واحد (عدد خالص)'}
            </button>
          </div>
        </div>

        {/* Input box */}
        <div className="relative">
          <input
            type="text"
            dir="ltr"
            value={cleanNum ? Number(cleanNum).toLocaleString('en-US') : ''}
            onChange={(e) => setVal(e.target.value.replace(/[^\d]/g, ''))}
            placeholder={isEn ? 'e.g. 12,500,000' : 'مثال: ۵۰,۰۰۰,۰۰۰'}
            className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xl font-mono font-bold tracking-wider text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {cleanNum && (
            <button
              type="button"
              onClick={() => setVal('')}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-rose-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400">{isEn ? 'Quick presets:' : 'مبالغ متداول:'}</span>
          {[1000000, 5000000, 10000000, 50000000, 100000000].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setVal(preset.toString())}
              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 font-mono text-[11px] transition-colors"
            >
              {isEn ? `${(preset / 1000000).toFixed(0)}M` : `${(preset / 1000000).toLocaleString('fa-IR')} میلیون`}
            </button>
          ))}
        </div>
      </div>

      {/* Persian Words Result Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-500" />
            {isEn ? 'Persian Words (حروف فارسی):' : 'معادل حروفی به زبان فارسی:'}
          </span>
          <button
            type="button"
            onClick={handleCopyFa}
            disabled={!cleanNum}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-40 transition-all"
          >
            {copiedFa ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFa ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی متن فارسی')}</span>
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed font-vazir">
          {getFullOutputFa() || (isEn ? 'Enter an amount above...' : 'مبلغ را در کادر بالا وارد کنید...')}
        </div>
      </div>

      {/* English Words Result Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-emerald-500" />
            {isEn ? 'English Words:' : 'معادل حروفی به زبان انگلیسی (Latin):'}
          </span>
          <button
            type="button"
            onClick={handleCopyEn}
            disabled={!cleanNum}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-all"
          >
            {copiedEn ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEn ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی متن انگلیسی')}</span>
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 leading-relaxed font-sans capitalize">
          {getFullOutputEn() || (isEn ? 'Enter an amount above...' : 'Enter amount above...')}
        </div>
      </div>
    </div>
  );
}

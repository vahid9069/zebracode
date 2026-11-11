'use client';

import React, { useState } from 'react';
import { Copy, Check, Hash, Sparkles } from 'lucide-react';

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const THOUSANDS = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

function convertThreeDigits(num: number): string {
  if (num === 0) return '';
  const parts: string[] = [];
  const h = Math.floor(num / 100);
  const remainder = num % 100;
  if (h > 0) parts.push(HUNDREDS[h]);

  if (remainder >= 10 && remainder <= 19) {
    parts.push(TEENS[remainder - 10]);
  } else {
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;
    if (t > 0) parts.push(TENS[t]);
    if (o > 0) parts.push(ONES[o]);
  }
  return parts.join(' و ');
}

function numberToPersianWords(input: string): string {
  const clean = input.replace(/\D/g, '');
  if (!clean || clean === '0') return 'صفر';

  // دسته‌های ۳تایی از راست به چپ
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
      const text = convertThreeDigits(val);
      const unit = THOUSANDS[i];
      wordParts.push(unit ? `${text} ${unit}` : text);
    }
  }

  return wordParts.join(' و ');
}

export function NumberToWords() {
  const [val, setVal] = useState('12500000');
  const [unit, setUnit] = useState<'toman' | 'rial' | 'none'>('toman');
  const [copied, setCopied] = useState(false);

  const cleanNum = val.replace(/\D/g, '');
  const words = numberToPersianWords(cleanNum);

  const finalOutput = () => {
    if (!cleanNum) return '';
    if (unit === 'toman') return `${words} تومان`;
    if (unit === 'rial') return `${words} ریال`;
    return words;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(finalOutput());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          عدد یا مبلغ مورد نظر را وارد کنید:
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            dir="ltr"
            value={val ? Number(val.replace(/\D/g, '')).toLocaleString('fa-IR') : ''}
            onChange={(e) => setVal(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="مثال: 50,000,000"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-lg font-mono font-bold tracking-wider text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setUnit('toman')}
              className={`px-4 py-2 rounded-lg transition-all ${
                unit === 'toman' ? 'bg-white dark:bg-slate-900 font-bold shadow-xs text-blue-600' : 'text-slate-500'
              }`}
            >
              تومان
            </button>
            <button
              type="button"
              onClick={() => setUnit('rial')}
              className={`px-4 py-2 rounded-lg transition-all ${
                unit === 'rial' ? 'bg-white dark:bg-slate-900 font-bold shadow-xs text-blue-600' : 'text-slate-500'
              }`}
            >
              ریال
            </button>
            <button
              type="button"
              onClick={() => setUnit('none')}
              className={`px-4 py-2 rounded-lg transition-all ${
                unit === 'none' ? 'bg-white dark:bg-slate-900 font-bold shadow-xs text-blue-600' : 'text-slate-500'
              }`}
            >
              بدون واحد
            </button>
          </div>
        </div>
      </div>

      {cleanNum && (
        <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              مبلغ به حروف (مناسب چک، سفته و قرارداد):
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد!' : 'کپی متن'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/40 text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
            {finalOutput()}
          </div>
        </div>
      )}
    </div>
  );
}

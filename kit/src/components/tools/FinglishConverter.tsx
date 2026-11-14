'use client';

import React, { useState, useMemo } from 'react';
import {
  Languages,
  Copy,
  Check,
  ArrowRightLeft,
  Sparkles,
  Clipboard,
  Trash2,
  Download,
  RotateCcw
} from 'lucide-react';

interface FinglishConverterProps {
  locale?: string;
  dict?: any;
}

// Pinglish to Persian replacement table
const PINGLISH_TO_PERSIAN_DICT: Record<string, string> = {
  salam: 'سلام',
  chetori: 'چطوری',
  chetore: 'چطوره',
  khobi: 'خوبی',
  khobam: 'خوبم',
  mamnoon: 'ممنون',
  merci: 'مرسی',
  mercy: 'مرسی',
  lotfan: 'لطفاً',
  lotfan_: 'لطفا',
  chakeram: 'چاکرم',
  nokaram: 'نوکرم',
  dorood: 'درود',
  khodahafez: 'خداحافظ',
  khodafez: 'خداحافظ',
  shab: 'شب',
  sobh: 'صبح',
  bekheyr: 'بخیر',
  rooz: 'روز',
  khaste: 'خسته',
  nabashid: 'نباشید',
  bale: 'بله',
  na: 'نه',
  are: 'آره',
  bacheha: 'بچه‌ها',
  dustan: 'دوستان',
  dust: 'دوست',
  iran: 'ایران',
  tehran: 'تهران',
};

const FINGLISH_PHONETIC_RULES: Array<[RegExp, string]> = [
  [/kh/gi, 'خ'],
  [/ch/gi, 'چ'],
  [/sh/gi, 'ش'],
  [/zh/gi, 'ژ'],
  [/gh/gi, 'ق'],
  [/th/gi, 'ث'],
  [/aa/gi, 'آ'],
  [/ee/gi, 'ی'],
  [/oo/gi, 'او'],
  [/ou/gi, 'او'],
  [/^a/gi, 'ا'],
  [/^e/gi, 'ا'],
  [/^o/gi, 'ا'],
  [/b/gi, 'ب'],
  [/p/gi, 'پ'],
  [/t/gi, 'ت'],
  [/j/gi, 'ج'],
  [/h/gi, 'ه'],
  [/d/gi, 'د'],
  [/r/gi, 'ر'],
  [/z/gi, 'ز'],
  [/s/gi, 'س'],
  [/f/gi, 'ف'],
  [/k/gi, 'ک'],
  [/g/gi, 'گ'],
  [/l/gi, 'ل'],
  [/m/gi, 'م'],
  [/n/gi, 'ن'],
  [/v/gi, 'و'],
  [/w/gi, 'و'],
  [/y/gi, 'ی'],
  [/i/gi, 'ی'],
  [/u/gi, 'یو'],
  [/o/gi, 'و'],
  [/e\b/gi, 'ه'],
  [/a\b/gi, 'ه'],
  [/c/gi, 'ک'],
  [/q/gi, 'ق'],
  [/x/gi, 'کس'],
];

// Persian to Pinglish phonetic mapping
const PERSIAN_TO_PINGLISH_MAP: Record<string, string> = {
  آ: 'aa',
  ا: 'a',
  ب: 'b',
  پ: 'p',
  ت: 't',
  ث: 's',
  ج: 'j',
  چ: 'ch',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'z',
  ر: 'r',
  ز: 'z',
  ژ: 'zh',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'z',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'gh',
  ک: 'k',
  گ: 'g',
  ل: 'l',
  م: 'm',
  ن: 'n',
  و: 'v',
  ه: 'h',
  ی: 'y',
  ي: 'y',
  ك: 'k',
  ة: 'h',
  '‌': ' ',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

function pinglishToPersian(input: string): string {
  const words = input.split(/(\s+|[.,!؟?:;()\[\]{}]+)/);
  return words
    .map((token) => {
      const lower = token.toLowerCase();
      if (PINGLISH_TO_PERSIAN_DICT[lower]) {
        return PINGLISH_TO_PERSIAN_DICT[lower];
      }
      let converted = token;
      for (const [pattern, rep] of FINGLISH_PHONETIC_RULES) {
        converted = converted.replace(pattern, rep);
      }
      return converted;
    })
    .join('');
}

function persianToPinglish(input: string): string {
  let result = '';
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (PERSIAN_TO_PINGLISH_MAP[char] !== undefined) {
      result += PERSIAN_TO_PINGLISH_MAP[char];
    } else {
      result += char;
    }
  }
  return result;
}

export function FinglishConverter({ locale = 'fa', dict }: FinglishConverterProps) {
  const isEn = locale === 'en';
  const [mode, setMode] = useState<'toPersian' | 'toFinglish'>('toPersian');
  const [input, setInput] = useState<string>(
    mode === 'toPersian' ? 'salam dustan, haletan chetore? omidvaram khob bashid.' : 'سلام دوستان، حالتون چطوره؟'
  );
  const [copied, setCopied] = useState<boolean>(false);

  const converted = useMemo(() => {
    if (!input.trim()) return '';
    return mode === 'toPersian' ? pinglishToPersian(input) : persianToPinglish(input);
  }, [input, mode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(converted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setInput(clip);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const blob = new Blob([converted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finglish-converted-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleMode = () => {
    if (mode === 'toPersian') {
      setMode('toFinglish');
      setInput(converted || 'سلام خسته نباشید');
    } else {
      setMode('toPersian');
      setInput(converted || 'salam khaste nabashid');
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector and Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('toPersian')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'toPersian'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {isEn ? 'Pinglish ➔ Persian' : 'فینگلیش به خط فارسی'}
            </button>

            <button
              type="button"
              onClick={() => setMode('toFinglish')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'toFinglish'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {isEn ? 'Persian ➔ Pinglish' : 'فارسی به فینگلیش (Pinglish)'}
            </button>
          </div>

          <button
            type="button"
            onClick={toggleMode}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{isEn ? 'Switch Direction' : 'جابجایی دو طرفه'}</span>
          </button>
        </div>
      </div>

      {/* Dual Panel Editor */}
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
                {mode === 'toPersian'
                  ? isEn ? 'Pinglish Input (Latin)' : 'متن ورودی فینگلیش (لاتین)'
                  : isEn ? 'Persian Input (فارسی)' : 'متن ورودی خط فارسی'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>{isEn ? 'Paste' : 'پیست'}</span>
              </button>
              <button
                type="button"
                onClick={() => setInput('')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            dir={mode === 'toPersian' ? 'ltr' : 'rtl'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'toPersian'
                ? 'Type finglish here (e.g. salam chetori)...'
                : 'متن فارسی خود را اینجا وارد کنید...'
            }
            rows={12}
            className={`w-full p-5 bg-transparent text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none ${
              mode === 'toPersian' ? 'font-mono' : 'font-vazir'
            }`}
          />
        </div>

        {/* Output Panel */}
        <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {mode === 'toPersian'
                  ? isEn ? 'Converted Persian Text' : 'متن تبدیل‌شده به خط فارسی'
                  : isEn ? 'Converted Pinglish (Latin)' : 'متن فینگلیش خروجی'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!converted}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isEn ? 'Download' : 'دانلود'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!converted}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-40 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی')}</span>
              </button>
            </div>
          </div>

          <textarea
            readOnly
            dir={mode === 'toPersian' ? 'rtl' : 'ltr'}
            value={converted}
            placeholder={isEn ? 'Conversion appears here...' : 'متن تبدیل‌شده اینجا نمایش داده می‌شود...'}
            rows={12}
            className={`w-full p-5 bg-slate-50/40 dark:bg-slate-900/40 text-sm leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none resize-none ${
              mode === 'toPersian' ? 'font-vazir' : 'font-mono'
            }`}
          />

          <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
            <span>{isEn ? 'Smart Phonetic Engine' : 'موتور ترانویسی آوایی هوشمند'}</span>
            <span className="text-slate-400">{isEn ? '100% In-Browser' : '۱۰۰٪ آفلاین در مرورگر'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

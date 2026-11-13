'use client';

import React, { useState } from 'react';
import {
  Coins,
  Copy,
  Check,
  ArrowLeftRight,
  Sparkles,
  Info,
  Banknote,
  RotateCcw
} from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';

interface TomanRialConverterProps {
  locale?: string;
  dict?: any;
}

export function TomanRialConverter({ locale = 'fa', dict }: TomanRialConverterProps) {
  const isEn = locale === 'en';
  const [mode, setMode] = useState<'tomanToRial' | 'rialToToman'>('tomanToRial');
  const [amount, setAmount] = useState<number>(5000000); // 5M Tomans
  const [copied, setCopied] = useState<string | null>(null);

  const cleanNum = Number(amount) || 0;

  const toman = mode === 'tomanToRial' ? cleanNum : Math.floor(cleanNum / 10);
  const rial = mode === 'tomanToRial' ? cleanNum * 10 : cleanNum;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleMode = () => {
    if (mode === 'tomanToRial') {
      setMode('rialToToman');
      setAmount(cleanNum * 10);
    } else {
      setMode('tomanToRial');
      setAmount(Math.floor(cleanNum / 10));
    }
  };

  return (
    <div className="space-y-6">
      {/* Direction Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setMode('tomanToRial')}
          className={`px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            mode === 'tomanToRial'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>{isEn ? 'Toman to Rial (Add a Zero)' : 'تبدیل تومان به ریال (افزودن یک صفر)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('rialToToman')}
          className={`px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            mode === 'rialToToman'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>{isEn ? 'Rial to Toman (Remove a Zero)' : 'تبدیل ریال به تومان (حذف یک صفر)'}</span>
        </button>
      </div>

      {/* Input Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isEn
              ? `Enter amount in ${mode === 'tomanToRial' ? 'Toman' : 'Rial'}:`
              : `مبلغ را به ${mode === 'tomanToRial' ? 'تومان' : 'ریال'} وارد کنید:`}
          </label>

          <button
            type="button"
            onClick={toggleMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{isEn ? 'Swap Direction' : 'جابجایی دو طرفه'}</span>
          </button>
        </div>

        <div className="max-w-md">
          <NumericInput
            value={amount}
            onChange={(val) => setAmount(val)}
            placeholder={isEn ? 'e.g. 5,000,000' : 'مثال: ۵،۰۰۰،۰۰۰'}
            unit={mode === 'tomanToRial' ? (isEn ? 'Toman' : 'تومان') : (isEn ? 'Rial' : 'ریال')}
          />
        </div>
      </div>

      {/* Comparative Conversion Cards */}
      {cleanNum > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Toman Card */}
          <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1.5">
                <Banknote className="w-4 h-4" />
                <span>{isEn ? 'Amount in Toman:' : 'مبلغ به تومان:'}</span>
              </span>

              <button
                type="button"
                onClick={() => handleCopy(toman.toString(), 'toman')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 transition-colors shadow-xs"
              >
                {copied === 'toman' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'toman' ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی عدد')}</span>
              </button>
            </div>

            <div className="text-3xl sm:text-4xl font-black font-mono text-blue-700 dark:text-blue-300">
              {isEn ? toman.toLocaleString() : toman.toLocaleString('fa-IR')}
              <span className="text-sm font-normal mr-2">{isEn ? ' Toman' : ' تومان'}</span>
            </div>
          </div>

          {/* Rial Card */}
          <div className="p-6 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                <span>{isEn ? 'Amount in Rial:' : 'مبلغ رسمی به ریال:'}</span>
              </span>

              <button
                type="button"
                onClick={() => handleCopy(rial.toString(), 'rial')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 transition-colors shadow-xs"
              >
                {copied === 'rial' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'rial' ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی عدد')}</span>
              </button>
            </div>

            <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              {isEn ? rial.toLocaleString() : rial.toLocaleString('fa-IR')}
              <span className="text-sm font-normal mr-2">{isEn ? ' Rial' : ' ریال'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Helpful Rule Callout */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p>
          {isEn
            ? 'Rule of thumb: 1 Toman equals exactly 10 Iranian Rials. Bank POS receipts and checkbooks in Iran are usually printed in Rials, while daily transactions and prices are quoted in Tomans.'
            : 'قاعده طلایی: هر ۱ تومان دقیقاً برابر با ۱۰ ریال است. در قبوض، چک‌ها و دستگاه‌های پوز بانکی مبالغ به «ریال» درج می‌شوند در حالی که در گفت‌وگوهای روزمره و بازار خرید و فروش، مبالغ به «تومان» بیان می‌شوند.'}
        </p>
      </div>
    </div>
  );
}

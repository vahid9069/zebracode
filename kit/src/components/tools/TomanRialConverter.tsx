'use client';

import React, { useState } from 'react';
import { Coins, Copy, Check, ArrowLeftRight, Sparkles } from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';

export function TomanRialConverter() {
  const [mode, setMode] = useState<'tomanToRial' | 'rialToToman'>('tomanToRial');
  const [amount, setAmount] = useState<number>(5000000); // ۵ میلیون تومان
  const [copied, setCopied] = useState<string | null>(null);

  const cleanNum = Number(amount) || 0;

  const toman = mode === 'tomanToRial' ? cleanNum : Math.floor(cleanNum / 10);
  const rial = mode === 'tomanToRial' ? cleanNum * 10 : cleanNum;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* تب‌های تغییر جهت */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setMode('tomanToRial')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            mode === 'tomanToRial'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          تبدیل تومان به ریال (افزودن یک صفر)
        </button>
        <button
          onClick={() => setMode('rialToToman')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            mode === 'rialToToman'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          تبدیل ریال به تومان (حذف یک صفر)
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          مبلغ به {mode === 'tomanToRial' ? 'تومان' : 'ریال'} را وارد کنید:
        </label>

        <div className="max-w-md">
          <NumericInput
            value={amount}
            onChange={(val) => setAmount(val)}
            placeholder="مثال: ۵،۰۰۰،۰۰۰"
            unit={mode === 'tomanToRial' ? 'تومان' : 'ریال'}
          />
        </div>
      </div>

      {cleanNum > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">مبلغ به تومان:</span>
              <button
                onClick={() => handleCopy(toman.toString(), 'toman')}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                {copied === 'toman' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'toman' ? 'کپی شد' : 'کپی عدد'}
              </button>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-blue-700 dark:text-blue-300" dir="ltr">
              {toman.toLocaleString('fa-IR')}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">مبلغ به ریال:</span>
              <button
                onClick={() => handleCopy(rial.toString(), 'rial')}
                className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                {copied === 'rial' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'rial' ? 'کپی شد' : 'کپی عدد'}
              </button>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-300" dir="ltr">
              {rial.toLocaleString('fa-IR')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

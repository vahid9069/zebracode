'use client';

import React, { useState } from 'react';
import { Binary, RefreshCw, Copy, Check, Sparkles, Filter } from 'lucide-react';

export function RandomNumber() {
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(100);
  const [count, setCount] = useState<number>(1);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [results, setResults] = useState<number[]>([42]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const generateNumbers = () => {
    setIsRolling(true);
    setTimeout(() => {
      const minVal = Math.min(min, max);
      const maxVal = Math.max(min, max);
      const range = maxVal - minVal + 1;
      const targetCount = !allowDuplicates ? Math.min(count, range) : count;

      const generated: number[] = [];

      if (!allowDuplicates) {
        const pool = Array.from({ length: range }, (_, i) => minVal + i);
        for (let i = 0; i < targetCount; i++) {
          const randomIndex = Math.floor(Math.random() * pool.length);
          generated.push(pool[randomIndex]);
          pool.splice(randomIndex, 1);
        }
      } else {
        for (let i = 0; i < targetCount; i++) {
          generated.push(Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal);
        }
      }

      if (sortOrder === 'asc') generated.sort((a, b) => a - b);
      if (sortOrder === 'desc') generated.sort((a, b) => b - a);

      setResults(generated);
      setIsRolling(false);
    }, 200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(results.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (pMin: number, pMax: number, pCount: number) => {
    setMin(pMin);
    setMax(pMax);
    setCount(pCount);
  };

  return (
    <div className="space-y-6">
      {/* کارت نمایش عدد / اعداد تصادفی تولید شده */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm text-center space-y-6">
        {results.length === 1 ? (
          <div className="py-4">
            <span className="text-xs font-bold text-slate-400 block mb-2">عدد تصادفی ایجاد شده:</span>
            <div
              className={`text-7xl sm:text-8xl font-black font-mono text-blue-600 dark:text-blue-400 transition-all duration-300 ${
                isRolling ? 'scale-90 opacity-50 blur-sm' : 'scale-100 opacity-100'
              }`}
            >
              {results[0]}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 block">
              {results.length} عدد تصادفی تولید شد:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 max-h-60 overflow-y-auto p-2">
              {results.map((num, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 font-mono font-bold text-blue-700 dark:text-blue-300 text-sm sm:text-base"
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* دکمه‌های اقدام */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={generateNumbers}
            disabled={isRolling}
            className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
            تولید مجدد
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد!' : 'کپی'}</span>
          </button>
        </div>
      </div>

      {/* تنظیمات و بازه اعداد */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">تنظیمات بازه و فیلترها</h3>

        {/* پیش‌فرض‌های سریع */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">پیش‌فرض‌ها:</span>
          <button
            onClick={() => applyPreset(1, 6, 1)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            تاس (۱ تا ۶)
          </button>
          <button
            onClick={() => applyPreset(1, 100, 1)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            ۱ تا ۱۰۰
          </button>
          <button
            onClick={() => applyPreset(1, 50, 5)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            ۵ عدد از ۱ تا ۵۰ (قرعه‌کشی)
          </button>
          <button
            onClick={() => applyPreset(1000, 9999, 1)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          >
            کد ۴ رقمی
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">حداقل عدد (از)</label>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">حداکثر عدد (تا)</label>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">تعداد اعداد مورد نیاز</label>
            <input
              type="number"
              min="1"
              max="200"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">ترتیب مرتب‌سازی</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'none' | 'asc' | 'desc')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
            >
              <option value="none">ترتیب رندوم</option>
              <option value="asc">صعودی (کم به زیاد)</option>
              <option value="desc">نزولی (زیاد به کم)</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={!allowDuplicates}
              onChange={(e) => setAllowDuplicates(!e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>اعداد تکراری نباشند (مناسب قرعه‌کشی و بدون تکرار)</span>
          </label>
        </div>
      </div>
    </div>
  );
}

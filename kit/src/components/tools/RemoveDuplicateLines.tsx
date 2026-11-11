'use client';

import React, { useState, useMemo } from 'react';
import { CopyCheck, Copy, Check, Clipboard, Trash2, Download } from 'lucide-react';

export function RemoveDuplicateLines() {
  const [text, setText] = useState('تهران\nاصفهان\nشیراز\nتهران\nتبریز\nاصفهان\nمشهد');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimLines, setTrimLines] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [copied, setCopied] = useState(false);

  const { resultText, originalCount, uniqueCount, removedCount } = useMemo(() => {
    const rawLines = text.split('\n');
    const originalCount = rawLines.length;

    const seen = new Set<string>();
    const uniqueLines: string[] = [];

    for (let line of rawLines) {
      if (trimLines) line = line.trim();
      if (removeEmpty && !line) continue;

      const compareKey = caseSensitive ? line : line.toLowerCase();
      if (!seen.has(compareKey)) {
        seen.add(compareKey);
        uniqueLines.push(line);
      }
    }

    return {
      resultText: uniqueLines.join('\n'),
      originalCount,
      uniqueCount: uniqueLines.length,
      removedCount: Math.max(0, originalCount - uniqueLines.length),
    };
  }, [text, caseSensitive, trimLines, removeEmpty]);

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setText(clip);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* آمار خطوط */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500">کل خطوط ورودی</span>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-200">
            {originalCount.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 shadow-sm">
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">خطوط یکتا و منحصربه‌فرد</span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {uniqueCount.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 shadow-sm">
          <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold">تعداد موارد تکراری حذف‌شده</span>
          <div className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
            {removedCount.toLocaleString('fa-IR')}
          </div>
        </div>
      </div>

      {/* تنظیمات فیلتر */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs font-medium">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={trimLines}
            onChange={(e) => setTrimLines(e.target.checked)}
            className="w-4 h-4 accent-blue-600 rounded"
          />
          <span>حذف فاصله‌های ابتدایی و انتهایی خطوط</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={removeEmpty}
            onChange={(e) => setRemoveEmpty(e.target.checked)}
            className="w-4 h-4 accent-blue-600 rounded"
          />
          <span>حذف خطوط خالی</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            className="w-4 h-4 accent-blue-600 rounded"
          />
          <span>حساس به حروف بزرگ و کوچک انگلیسی</span>
        </label>
      </div>

      {/* ادیتور دو پنله */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
            <span>متن اولیه</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePaste}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <Clipboard className="w-3.5 h-3.5" /> پیست
              </button>
              <button
                onClick={() => setText('')}
                className="flex items-center gap-1 px-2 py-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="خطوط متن خود را اینجا قرار دهید..."
            rows={12}
            className="w-full p-4 bg-transparent text-sm leading-relaxed focus:outline-none resize-none font-sans"
          />
        </div>

        <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
            <span className="text-emerald-600">نتیجه بدون موارد تکراری</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'کپی شد' : 'کپی خروجی'}
            </button>
          </div>
          <textarea
            readOnly
            value={resultText}
            placeholder="نتیجه پاک‌سازی شده اینجا نمایش داده می‌شود..."
            rows={12}
            className="w-full p-4 bg-slate-50/50 dark:bg-slate-900/50 text-sm leading-relaxed focus:outline-none resize-none font-sans"
          />
        </div>
      </div>
    </div>
  );
}

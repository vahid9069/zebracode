'use client';

import React, { useState } from 'react';
import { ArrowDownAZ, ArrowUpAZ, Shuffle, Copy, Check, Clipboard, Trash2 } from 'lucide-react';

export function AlphabeticalSort() {
  const [text, setText] = useState('انار\nموز\nسیب\nپرتقال\nهلو\nگیلاس');
  const [copied, setCopied] = useState(false);

  const getLines = () => text.split('\n').filter((l) => l.trim().length > 0);

  const sortAsc = () => {
    const lines = getLines();
    lines.sort((a, b) => a.localeCompare(b, 'fa', { numeric: true }));
    setText(lines.join('\n'));
  };

  const sortDesc = () => {
    const lines = getLines();
    lines.sort((a, b) => b.localeCompare(a, 'fa', { numeric: true }));
    setText(lines.join('\n'));
  };

  const reverseLines = () => {
    const lines = text.split('\n');
    lines.reverse();
    setText(lines.join('\n'));
  };

  const shuffleLines = () => {
    const lines = getLines();
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
    setText(lines.join('\n'));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* نوار دکمه‌های مرتب‌سازی */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <button
          onClick={sortAsc}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ArrowDownAZ className="w-4 h-4" />
          مرتب‌سازی صعودی (الف تا ی / A-Z)
        </button>

        <button
          onClick={sortDesc}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
        >
          <ArrowUpAZ className="w-4 h-4" />
          مرتب‌سازی نزولی (ی تا الف / Z-A)
        </button>

        <button
          onClick={reverseLines}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
        >
          معکوس کردن خطوط
        </button>

        <button
          onClick={shuffleLines}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
        >
          <Shuffle className="w-4 h-4" />
          بُر زدن تصادفی
        </button>
      </div>

      {/* ادیتور متن */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <span>متن ورودی (هر مورد در یک خط):</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setText('')}
              className="text-rose-600 hover:underline px-2 py-1 text-xs"
            >
              پاک‌سازی
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد' : 'کپی کل متن'}</span>
            </button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder="خطوط متن خود را اینجا وارد کنید..."
          className="w-full p-4 bg-transparent text-sm leading-relaxed focus:outline-none resize-none font-sans"
        />

        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          تعداد کل خطوط: {text ? text.split('\n').length.toLocaleString('fa-IR') : 0} ردیف
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Shuffle,
  Copy,
  Check,
  Clipboard,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Hash
} from 'lucide-react';

interface AlphabeticalSortProps {
  locale?: string;
  dict?: any;
}

const SAMPLE_FA = `انار
موز
سیب
پرتقال
هلو
گیلاس
خیار
انگور
توت‌فرنگی
کیوی`;

const SAMPLE_EN = `Banana
Apple
Orange
Mango
Pineapple
Cherry
Blueberry
Peach
Strawberry`;

export function AlphabeticalSort({ locale = 'fa', dict }: AlphabeticalSortProps) {
  const isEn = locale === 'en';
  const [text, setText] = useState<string>(isEn ? SAMPLE_EN : SAMPLE_FA);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [naturalSort, setNaturalSort] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const lines = useMemo(() => {
    return text.split('\n').filter((l) => l.trim().length > 0);
  }, [text]);

  const sortAsc = () => {
    const list = [...lines];
    list.sort((a, b) =>
      a.localeCompare(b, isEn ? 'en' : 'fa', {
        numeric: naturalSort,
        sensitivity: caseSensitive ? 'case' : 'base',
      })
    );
    setText(list.join('\n'));
  };

  const sortDesc = () => {
    const list = [...lines];
    list.sort((a, b) =>
      b.localeCompare(a, isEn ? 'en' : 'fa', {
        numeric: naturalSort,
        sensitivity: caseSensitive ? 'case' : 'base',
      })
    );
    setText(list.join('\n'));
  };

  const sortByLengthAsc = () => {
    const list = [...lines];
    list.sort((a, b) => a.length - b.length || a.localeCompare(b, isEn ? 'en' : 'fa'));
    setText(list.join('\n'));
  };

  const sortByLengthDesc = () => {
    const list = [...lines];
    list.sort((a, b) => b.length - a.length || b.localeCompare(a, isEn ? 'en' : 'fa'));
    setText(list.join('\n'));
  };

  const reverseLines = () => {
    const list = text.split('\n');
    list.reverse();
    setText(list.join('\n'));
  };

  const shuffleLines = () => {
    const list = [...lines];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setText(list.join('\n'));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
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

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sorted-list-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setText(isEn ? SAMPLE_EN : SAMPLE_FA);
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={sortAsc}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-xs sm:text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/20"
          >
            <ArrowDownAZ className="w-4 h-4" />
            <span>{isEn ? 'Sort A to Z (Ascending)' : 'مرتب‌سازی الف تا ی (صعودی)'}</span>
          </button>

          <button
            type="button"
            onClick={sortDesc}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold active:scale-95 transition-all"
          >
            <ArrowUpAZ className="w-4 h-4" />
            <span>{isEn ? 'Sort Z to A (Descending)' : 'مرتب‌سازی ی تا الف (نزولی)'}</span>
          </button>

          <button
            type="button"
            onClick={sortByLengthAsc}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold active:scale-95 transition-all"
          >
            <span>{isEn ? 'Shortest First' : 'کوتاه‌ترین به بلندترین'}</span>
          </button>

          <button
            type="button"
            onClick={sortByLengthDesc}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold active:scale-95 transition-all"
          >
            <span>{isEn ? 'Longest First' : 'بلندترین به کوتاه‌ترین'}</span>
          </button>

          <button
            type="button"
            onClick={reverseLines}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold active:scale-95 transition-all"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>{isEn ? 'Reverse Order' : 'معکوس کردن ترتیب'}</span>
          </button>

          <button
            type="button"
            onClick={shuffleLines}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold active:scale-95 transition-all"
          >
            <Shuffle className="w-4 h-4" />
            <span>{isEn ? 'Random Shuffle' : 'بُر زدن تصادفی'}</span>
          </button>
        </div>

        {/* Options Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={naturalSort}
                onChange={(e) => setNaturalSort(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span>{isEn ? 'Natural numeric sorting (1, 2, 10)' : 'مرتب‌سازی طبیعی اعداد (۱، ۲، ۱۰)'}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span>{isEn ? 'Case sensitive (A-Z before a-z)' : 'حساس به حروف بزرگ و کوچک'}</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isEn ? 'Reset Sample' : 'بارگذاری متن نمونه'}</span>
          </button>
        </div>
      </div>

      {/* Text Editor Box */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mr-1">
              {isEn ? `List items (${lines.length} lines)` : `لیست ورودی (${lines.length.toLocaleString('fa-IR')} خط)`}
            </span>
          </div>

          <div className="flex items-center gap-2">
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
              onClick={handleDownload}
              disabled={!text}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isEn ? 'Download' : 'دانلود'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!text}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-40 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی')}</span>
            </button>
            <button
              type="button"
              onClick={() => setText('')}
              disabled={!text}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isEn ? 'Enter items, one per line...' : 'آیتم‌ها را وارد کنید (هر مورد در یک خط)...'}
          rows={14}
          className="w-full p-5 bg-transparent text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none font-vazir"
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
          <span>{isEn ? `${lines.length} non-empty items` : `${lines.length.toLocaleString('fa-IR')} آیتم شناسایی شد`}</span>
          <span className="text-slate-400">{isEn ? '100% In-Browser' : '۱۰۰٪ در مرورگر'}</span>
        </div>
      </div>
    </div>
  );
}

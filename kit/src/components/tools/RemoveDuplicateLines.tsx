'use client';

import React, { useState, useMemo } from 'react';
import {
  CopyCheck,
  Copy,
  Check,
  Clipboard,
  Trash2,
  Download,
  ArrowUpDown,
  Filter,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface RemoveDuplicateLinesProps {
  locale?: string;
  dict?: any;
}

const SAMPLE_FA = `تهران
اصفهان
شیراز
تهران
تبریز
اصفهان
مشهد
شیراز
کرج
اهواز
تهران`;

const SAMPLE_EN = `apple
banana
orange
apple
grapes
banana
strawberry
orange
watermelon`;

export function RemoveDuplicateLines({ locale = 'fa', dict }: RemoveDuplicateLinesProps) {
  const isEn = locale === 'en';
  const [text, setText] = useState<string>(isEn ? SAMPLE_EN : SAMPLE_FA);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [trimLines, setTrimLines] = useState<boolean>(true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [copied, setCopied] = useState<boolean>(false);

  const { resultText, originalCount, uniqueCount, removedCount } = useMemo(() => {
    const rawLines = text.split('\n');
    const originalCount = text.length === 0 ? 0 : rawLines.length;

    const seen = new Set<string>();
    let uniqueLines: string[] = [];

    for (let line of rawLines) {
      if (trimLines) line = line.trim();
      if (removeEmpty && !line) continue;

      const compareKey = caseSensitive ? line : line.toLowerCase();
      if (!seen.has(compareKey)) {
        seen.add(compareKey);
        uniqueLines.push(line);
      }
    }

    if (sortOrder === 'asc') {
      uniqueLines.sort((a, b) => a.localeCompare(b, isEn ? 'en' : 'fa', { numeric: true }));
    } else if (sortOrder === 'desc') {
      uniqueLines.sort((a, b) => b.localeCompare(a, isEn ? 'en' : 'fa', { numeric: true }));
    }

    return {
      resultText: uniqueLines.join('\n'),
      originalCount,
      uniqueCount: uniqueLines.length,
      removedCount: Math.max(0, originalCount - uniqueLines.length),
    };
  }, [text, caseSensitive, trimLines, removeEmpty, sortOrder, isEn]);

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

  const handleDownload = () => {
    const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deduped-lines-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setText(isEn ? SAMPLE_EN : SAMPLE_FA);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">{isEn ? 'Total Input Lines' : 'کل خطوط ورودی'}</span>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-200 font-mono">
            {isEn ? originalCount : originalCount.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">{isEn ? 'Unique Lines' : 'خطوط یکتا و منحصربه‌فرد'}</span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {isEn ? uniqueCount : uniqueCount.toLocaleString('fa-IR')}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 shadow-sm">
          <span className="text-xs text-rose-700 dark:text-rose-400 font-bold">{isEn ? 'Duplicates Removed' : 'موارد تکراری حذف‌شده'}</span>
          <div className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            {isEn ? removedCount : removedCount.toLocaleString('fa-IR')}
          </div>
        </div>
      </div>

      {/* Options Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Filter className="w-4 h-4 text-blue-500" />
            <span>{isEn ? 'Deduplication & Sorting Options' : 'تنظیمات حذف تکراری‌ها و مرتب‌سازی'}</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={trimLines}
              onChange={(e) => setTrimLines(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Trim whitespace from lines' : 'حذف فواصل ابتدا و انتهای هر خط'}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={removeEmpty}
              onChange={(e) => setRemoveEmpty(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Remove blank/empty lines' : 'حذف خطوط خالی'}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Case sensitive (A vs a)' : 'حساس به حروف بزرگ و کوچک'}</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 whitespace-nowrap">{isEn ? 'Sort:' : 'مرتب‌سازی:'}</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="none">{isEn ? 'Keep original order' : 'ترتیب اصلی ورودی'}</option>
              <option value="asc">{isEn ? 'Ascending (A to Z / الف تا ی)' : 'صعودی (الف تا ی / A-Z)'}</option>
              <option value="desc">{isEn ? 'Descending (Z to A / ی تا الف)' : 'نزولی (ی تا الف / Z-A)'}</option>
            </select>
          </div>
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
                {isEn ? 'Input Lines' : 'خطوط ورودی'}
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
                onClick={() => setText('')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title={isEn ? 'Clear' : 'پاک کردن'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isEn ? 'Paste lines here...' : 'خطوط متن خود را اینجا قرار دهید...'}
            rows={12}
            className="w-full p-5 bg-transparent text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none font-vazir"
          />
        </div>

        {/* Output Panel */}
        <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {isEn ? 'Deduplicated Output' : 'خروجی بدون موارد تکراری'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!resultText}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isEn ? 'Download' : 'دانلود'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!resultText}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-40 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی')}</span>
              </button>
            </div>
          </div>

          <textarea
            readOnly
            value={resultText}
            placeholder={isEn ? 'Deduplicated lines will appear here...' : 'نتیجه پاک‌سازی شده اینجا نمایش داده می‌شود...'}
            rows={12}
            className="w-full p-5 bg-slate-50/40 dark:bg-slate-900/40 text-sm leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none resize-none font-vazir"
          />
        </div>
      </div>
    </div>
  );
}

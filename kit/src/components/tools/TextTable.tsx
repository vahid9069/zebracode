'use client';

import React, { useState, useMemo } from 'react';
import { AlignJustify, Copy, Check, Sparkles } from 'lucide-react';

export function TextTable() {
  const [input, setInput] = useState(`ردیف,نام دوره,تعداد جلسات,شهریه (تومان)
1,آموزش پایتون,20,4,500,000
2,دوره ری‌اکت و نکست,25,5,800,000
3,آموزش طراحی UI/UX,15,3,900,000`);
  const [style, setStyle] = useState<'grid' | 'simple' | 'dots'>('grid');
  const [copied, setCopied] = useState(false);

  const formattedAsciiTable = useMemo(() => {
    const lines = input.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) return '';

    const rows = lines.map((line) => line.split(',').map((c) => c.trim()));
    const colCount = Math.max(...rows.map((r) => r.length));

    // محاسبه حداکثر عرض هر ستون
    const colWidths = Array(colCount).fill(0);
    for (const r of rows) {
      for (let c = 0; c < colCount; c++) {
        const val = r[c] || '';
        // محاسبه طول کاراکتری
        colWidths[c] = Math.max(colWidths[c], val.length);
      }
    }

    const pad = (str: string, len: number) => {
      return str + ' '.repeat(Math.max(0, len - str.length));
    };

    let result = '';

    if (style === 'grid') {
      const separator = '+' + colWidths.map((w) => '-'.repeat(w + 2)).join('+') + '+';
      result += separator + '\n';
      rows.forEach((r, idx) => {
        const cells = colWidths.map((w, cIdx) => ` ${pad(r[cIdx] || '', w)} `);
        result += '|' + cells.join('|') + '|\n';
        if (idx === 0) {
          result += separator + '\n';
        }
      });
      result += separator;
    } else if (style === 'simple') {
      rows.forEach((r, idx) => {
        const cells = colWidths.map((w, cIdx) => pad(r[cIdx] || '', w));
        result += cells.join('   ') + '\n';
        if (idx === 0) {
          result += colWidths.map((w) => '-'.repeat(w)).join('   ') + '\n';
        }
      });
    }

    return result;
  }, [input, style]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedAsciiTable);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
          داده‌های جدول خود را با کاما (CSV) یا خطوط متنی وارد کنید:
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-500">استایل جدول متنی:</span>
          <button
            onClick={() => setStyle('grid')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              style === 'grid' ? 'bg-blue-50 border-blue-600 text-blue-600 font-bold dark:bg-blue-950/60' : 'text-slate-500'
            }`}
          >
            کادر کامل خط‌کشی‌شده (+ - |)
          </button>
          <button
            onClick={() => setStyle('simple')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              style === 'simple' ? 'bg-blue-50 border-blue-600 text-blue-600 font-bold dark:bg-blue-950/60' : 'text-slate-500'
            }`}
          >
            ساده با خط تیره
          </button>
        </div>
      </div>

      {formattedAsciiTable && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
              جدول متنی تراز شده (مناسب ارسال در تلگرام و واتساپ):
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد' : 'کپی جدول'}</span>
            </button>
          </div>
          <pre dir="ltr" className="p-4 text-xs font-mono bg-slate-950 text-emerald-400 overflow-x-auto leading-relaxed">
            {formattedAsciiTable}
          </pre>
        </div>
      )}
    </div>
  );
}

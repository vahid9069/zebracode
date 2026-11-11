'use client';

import React, { useState } from 'react';
import { Code2, Copy, Check, Plus, Trash2, AlignRight, AlignCenter, AlignLeft } from 'lucide-react';

type Align = 'right' | 'center' | 'left';

export function MarkdownTable() {
  const [headers, setHeaders] = useState<string[]>(['ویژگی', 'پلان نقره‌ای', 'پلان طلایی']);
  const [alignments, setAlignments] = useState<Align[]>(['right', 'center', 'center']);
  const [rows, setRows] = useState<string[][]>([
    ['فضای ذخیره‌سازی', '۱۰ گیگابایت', '۵۰ گیگابایت'],
    ['پشتیبانی ۲۴ ساعته', 'ایمیل', 'تلفنی و اختصاصی'],
    ['تعداد کاربر', '۳ نفر', 'نامحدود'],
  ]);
  const [copied, setCopied] = useState(false);

  const addRow = () => {
    setRows([...rows, headers.map(() => '')]);
  };

  const addColumn = () => {
    setHeaders([...headers, `ستون ${headers.length + 1}`]);
    setAlignments([...alignments, 'center']);
    setRows(rows.map((r) => [...r, '']));
  };

  const removeRow = (idx: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== idx));
  };

  const removeColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, i) => i !== colIdx));
    setAlignments(alignments.filter((_, i) => i !== colIdx));
    setRows(rows.map((r) => r.filter((_, i) => i !== colIdx)));
  };

  const toggleAlign = (colIdx: number) => {
    const updated = [...alignments];
    if (updated[colIdx] === 'right') updated[colIdx] = 'center';
    else if (updated[colIdx] === 'center') updated[colIdx] = 'left';
    else updated[colIdx] = 'right';
    setAlignments(updated);
  };

  // تولید کد مارک‌داون
  const generateMarkdown = () => {
    let md = '';
    // Header
    md += '| ' + headers.map((h) => h || ' ').join(' | ') + ' |\n';
    // Alignments
    md += '| ' + alignments.map((a) => {
      if (a === 'center') return ':---:';
      if (a === 'left') return ':---';
      return '---:';
    }).join(' | ') + ' |\n';
    // Rows
    rows.forEach((row) => {
      md += '| ' + row.map((cell) => cell || ' ').join(' | ') + ' |\n';
    });
    return md;
  };

  const markdownCode = generateMarkdown();

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ویرایشگر بصری جدول */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            طراحی بصری جدول (کلیک روی آیکون‌ها برای تغییر تراز متن):
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={addRow}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100"
            >
              <Plus className="w-3.5 h-3.5" /> سطر
            </button>
            <button
              onClick={addColumn}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              <Plus className="w-3.5 h-3.5" /> ستون
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b">
                {headers.map((h, colIdx) => (
                  <th key={colIdx} className="p-2 border-l last:border-l-0">
                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => {
                          const updated = [...headers];
                          updated[colIdx] = e.target.value;
                          setHeaders(updated);
                        }}
                        className="w-full bg-transparent font-bold text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => toggleAlign(colIdx)}
                        title={`تراز: ${alignments[colIdx]}`}
                        className="text-slate-400 hover:text-blue-600 p-0.5 text-xs"
                      >
                        {alignments[colIdx] === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                        {alignments[colIdx] === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {alignments[colIdx] === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                      </button>
                      {headers.length > 1 && (
                        <button
                          onClick={() => removeColumn(colIdx)}
                          className="text-slate-400 hover:text-rose-500 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rI) => (
                <tr key={rI} className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  {row.map((cell, cI) => (
                    <td key={cI} className="p-2 border-l last:border-l-0">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => {
                          const updated = rows.map((r, rowIdx) => {
                            if (rowIdx === rI) {
                              const nr = [...r];
                              nr[cI] = e.target.value;
                              return nr;
                            }
                            return r;
                          });
                          setRows(updated);
                        }}
                        className="w-full bg-transparent text-xs focus:outline-none"
                      />
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeRow(rI)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* خروجی کد مارک‌داون */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Code2 className="w-4 h-4" />
            کد مارک‌داون آماده برای کپی:
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'کپی شد' : 'کپی کد Markdown'}</span>
          </button>
        </div>
        <pre dir="ltr" className="p-4 text-xs font-mono bg-slate-50/60 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 overflow-x-auto">
          {markdownCode}
        </pre>
      </div>
    </div>
  );
}

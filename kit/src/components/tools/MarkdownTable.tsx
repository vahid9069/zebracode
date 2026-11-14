'use client';

import React, { useState, useEffect } from 'react';
import {
  Code2,
  Copy,
  Check,
  Plus,
  Trash2,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Sparkles,
  Download,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';

interface MarkdownTableProps {
  locale?: string;
  dict?: any;
}

type Align = 'left' | 'center' | 'right';

export function MarkdownTable({ locale = 'fa' }: MarkdownTableProps) {
  const isEn = locale === 'en';

  const defaultFaHeaders = ['ویژگی', 'پلان نقره‌ای', 'پلان طلایی', 'سازمانی'];
  const defaultFaAligns: Align[] = ['right', 'center', 'center', 'center'];
  const defaultFaRows = [
    ['فضای ذخیره‌سازی', '۱۰ گیگابایت', '۵۰ گیگابایت', 'نامحدود'],
    ['پشتیبانی ۲۴ ساعته', 'ایمیل', 'تلفنی و ایمیل', 'مدیر حساب اختصاصی'],
    ['تعداد کاربر', '۳ نفر', '۱۰ نفر', 'نامحدود'],
  ];

  const defaultEnHeaders = ['Feature', 'Silver Plan', 'Gold Plan', 'Enterprise'];
  const defaultEnAligns: Align[] = ['left', 'center', 'center', 'center'];
  const defaultEnRows = [
    ['Storage Space', '10 GB', '50 GB', 'Unlimited'],
    ['24/7 Support', 'Email', 'Phone & Email', 'Dedicated Account Manager'],
    ['Team Members', '3 users', '10 users', 'Unlimited'],
  ];

  const [headers, setHeaders] = useState<string[]>(isEn ? defaultEnHeaders : defaultFaHeaders);
  const [alignments, setAlignments] = useState<Align[]>(isEn ? defaultEnAligns : defaultFaAligns);
  const [rows, setRows] = useState<string[][]>(isEn ? defaultEnRows : defaultFaRows);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Generate aligned Markdown code
  const generateMarkdown = () => {
    // Calculate max widths for each column to make markdown visually padded
    const colCount = headers.length;
    const colWidths = Array(colCount).fill(3);

    headers.forEach((h, i) => {
      colWidths[i] = Math.max(colWidths[i], (h || '').length);
    });

    rows.forEach((row) => {
      row.forEach((cell, i) => {
        if (i < colCount) {
          colWidths[i] = Math.max(colWidths[i], (cell || '').length);
        }
      });
    });

    const padCell = (text: string, width: number, align: Align) => {
      const padLen = Math.max(0, width - text.length);
      if (align === 'center') {
        const left = Math.floor(padLen / 2);
        const right = padLen - left;
        return ' '.repeat(left) + text + ' '.repeat(right);
      }
      if (align === 'right') {
        return ' '.repeat(padLen) + text;
      }
      return text + ' '.repeat(padLen);
    };

    let md = '';

    // Header line
    md +=
      '| ' +
      headers.map((h, i) => padCell(h || ' ', colWidths[i], alignments[i] || 'center')).join(' | ') +
      ' |\n';

    // Separator line
    md +=
      '| ' +
      alignments
        .map((a, i) => {
          const w = Math.max(3, colWidths[i]);
          if (a === 'center') return ':' + '-'.repeat(w - 2) + ':';
          if (a === 'right') return '-'.repeat(w - 1) + ':';
          return ':' + '-'.repeat(w - 1);
        })
        .join(' | ') +
      ' |\n';

    // Data rows
    rows.forEach((row) => {
      md +=
        '| ' +
        headers
          .map((_, i) => padCell(row[i] || '', colWidths[i], alignments[i] || 'center'))
          .join(' | ') +
        ' |\n';
    });

    return md;
  };

  const [rawMarkdown, setRawMarkdown] = useState<string>(generateMarkdown());

  // Keep raw markdown in sync with visual table changes
  useEffect(() => {
    setRawMarkdown(generateMarkdown());
  }, [headers, alignments, rows]);

  // Parse raw markdown back into visual state
  const parseRawMarkdown = (text: string) => {
    setRawMarkdown(text);
    const lines = text
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('|') && l.endsWith('|'));

    if (lines.length < 2) return;

    // Header
    const parsedHeaders = lines[0]
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

    // Alignments
    const alignLine = lines[1].slice(1, -1).split('|').map((c) => c.trim());
    const parsedAligns: Align[] = alignLine.map((c) => {
      if (c.startsWith(':') && c.endsWith(':')) return 'center';
      if (c.endsWith(':')) return 'right';
      return 'left';
    });

    // Rows
    const parsedRows = lines.slice(2).map((l) =>
      l
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim())
    );

    if (parsedHeaders.length > 0) {
      setHeaders(parsedHeaders);
      setAlignments(parsedAligns);
      setRows(parsedRows);
    }
  };

  const addRow = () => {
    setRows([...rows, headers.map(() => '')]);
  };

  const addColumn = () => {
    setHeaders([...headers, isEn ? `Col ${headers.length + 1}` : `ستون ${headers.length + 1}`]);
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

  const updateHeader = (colIdx: number, val: string) => {
    const updated = [...headers];
    updated[colIdx] = val;
    setHeaders(updated);
  };

  const updateCell = (rowIdx: number, colIdx: number, val: string) => {
    const updated = rows.map((r, rI) => {
      if (rI === rowIdx) {
        const next = [...r];
        next[colIdx] = val;
        return next;
      }
      return r;
    });
    setRows(updated);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(rawMarkdown);
    setCopiedFormat('md');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isEn ? 'Markdown Table Generator & Formatter' : 'تولیدکننده و فرمت‌کننده جدول مارک‌داون (Markdown)'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Visual table editor with live two-way Markdown syncing and column padding'
                : 'ویرایشگر بصری جدول همراه با همگام‌سازی لحظه‌ای با کد مارک‌داون و تراز ستون‌ها'}
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyMarkdown}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm active:scale-95 transition cursor-pointer"
        >
          {copiedFormat === 'md' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedFormat === 'md' ? (isEn ? 'Copied Markdown!' : 'کد مارک‌داون کپی شد') : (isEn ? 'Copy Markdown' : 'کپی کد Markdown')}</span>
        </button>
      </div>

      {/* Row/Col Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isEn ? 'Add Row' : 'افزودن ردیف'}</span>
          </button>

          <button
            onClick={addColumn}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold hover:bg-purple-100 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isEn ? 'Add Column' : 'افزودن ستون'}</span>
          </button>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          {rows.length} {isEn ? 'rows' : 'ردیف'} × {headers.length} {isEn ? 'columns' : 'ستون'}
        </div>
      </div>

      {/* Visual Table Editor */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-700 dark:text-slate-200 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {headers.map((h, colIdx) => (
                  <th key={colIdx} className="p-2 border-x border-slate-200 dark:border-slate-700/60 min-w-[140px]">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
                        {/* Align toggle */}
                        <button
                          onClick={() => toggleAlign(colIdx)}
                          title={isEn ? 'Toggle Alignment' : 'تغییر جهت چینش'}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition"
                        >
                          {alignments[colIdx] === 'left' ? (
                            <AlignLeft className="w-3.5 h-3.5" />
                          ) : alignments[colIdx] === 'right' ? (
                            <AlignRight className="w-3.5 h-3.5" />
                          ) : (
                            <AlignCenter className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Delete col */}
                        <button
                          onClick={() => removeColumn(colIdx)}
                          disabled={headers.length <= 1}
                          title={isEn ? 'Delete Column' : 'حذف این ستون'}
                          className="p-1 rounded hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 text-slate-400 transition disabled:opacity-30"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={h}
                        onChange={(e) => updateHeader(colIdx, e.target.value)}
                        className={`w-full p-1.5 font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          alignments[colIdx] === 'left'
                            ? 'text-left'
                            : alignments[colIdx] === 'right'
                            ? 'text-right'
                            : 'text-center'
                        }`}
                      />
                    </div>
                  </th>
                ))}
                <th className="w-10 p-2 text-center text-slate-400">#</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  {row.map((cell, colIdx) => (
                    <td key={colIdx} className="p-1 border-x border-slate-100 dark:border-slate-800/60">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                        className={`w-full p-2 rounded-lg bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none ${
                          alignments[colIdx] === 'left'
                            ? 'text-left'
                            : alignments[colIdx] === 'right'
                            ? 'text-right'
                            : 'text-center'
                        }`}
                      />
                    </td>
                  ))}
                  <td className="p-1 text-center">
                    <button
                      onClick={() => removeRow(rowIdx)}
                      disabled={rows.length <= 1}
                      title={isEn ? 'Delete Row' : 'حذف این ردیف'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Markdown Output / Input */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{isEn ? 'Raw Markdown Code (Two-Way Sync):' : 'کد مارک‌داون جدول (همگام دوطرفه):'}</span>
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition"
          >
            {copiedFormat === 'md' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFormat === 'md' ? (isEn ? 'Copied!' : 'کپی شد') : (isEn ? 'Copy' : 'کپی کد')}</span>
          </button>
        </div>

        <textarea
          value={rawMarkdown}
          onChange={(e) => parseRawMarkdown(e.target.value)}
          rows={7}
          className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
          dir="ltr"
        />
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Table as TableIcon,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  FileCode,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  ClipboardCheck
} from 'lucide-react';

interface TableBuilderProps {
  locale?: string;
  dict?: any;
}

type Alignment = 'left' | 'center' | 'right';

export function TableBuilder({ locale = 'fa' }: TableBuilderProps) {
  const isEn = locale === 'en';

  const defaultFaHeaders = ['ردیف', 'نام کالا / خدمت', 'تعداد', 'قیمت واحد (تومان)', 'توضیحات'];
  const defaultFaRows = [
    ['۱', 'طراحی رابط کاربری UI/UX', '۱', '۱۲,۰۰۰,۰۰۰', 'تحویل در فیگما'],
    ['۲', 'توسعه فرانت‌اند با Next.js', '۱', '۲۵,۰۰۰,۰۰۰', 'کاملاً سئو شده و ریسپانسیو'],
    ['۳', 'پشتیبانی فنی و نگهداری ماهانه', '۳', '۴,۰۰۰,۰۰۰', 'شامل مانیتورینگ ۲۴ ساعته'],
  ];

  const defaultEnHeaders = ['#', 'Item / Description', 'Qty', 'Unit Price ($)', 'Notes'];
  const defaultEnRows = [
    ['1', 'UI/UX Design System', '1', '1,200', 'Delivered in Figma'],
    ['2', 'Next.js Frontend Engineering', '1', '2,800', 'Fully responsive & SEO ready'],
    ['3', 'Maintenance & Support', '3', '450', '24/7 uptime monitoring'],
  ];

  const [headers, setHeaders] = useState<string[]>(isEn ? defaultEnHeaders : defaultFaHeaders);
  const [alignments, setAlignments] = useState<Alignment[]>(
    isEn ? ['center', 'left', 'center', 'right', 'left'] : ['center', 'right', 'center', 'right', 'right']
  );
  const [rows, setRows] = useState<string[][]>(isEn ? defaultEnRows : defaultFaRows);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const addRow = () => {
    const emptyRow = headers.map((_, idx) => (idx === 0 ? String(rows.length + 1) : ''));
    setRows([...rows, emptyRow]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    const colName = isEn ? `Column ${headers.length + 1}` : `ستون ${headers.length + 1}`;
    setHeaders([...headers, colName]);
    setAlignments([...alignments, 'center']);
    setRows(rows.map((row) => [...row, '']));
  };

  const removeColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, i) => i !== colIdx));
    setAlignments(alignments.filter((_, i) => i !== colIdx));
    setRows(rows.map((row) => row.filter((_, i) => i !== colIdx)));
  };

  const updateHeader = (colIdx: number, val: string) => {
    const updated = [...headers];
    updated[colIdx] = val;
    setHeaders(updated);
  };

  const updateCell = (rowIdx: number, colIdx: number, val: string) => {
    const updated = rows.map((r, rI) => {
      if (rI === rowIdx) {
        const newRow = [...r];
        newRow[colIdx] = val;
        return newRow;
      }
      return r;
    });
    setRows(updated);
  };

  const toggleAlign = (colIdx: number) => {
    const order: Alignment[] = ['left', 'center', 'right'];
    const current = alignments[colIdx] || 'center';
    const nextIdx = (order.indexOf(current) + 1) % order.length;
    const updated = [...alignments];
    updated[colIdx] = order[nextIdx];
    setAlignments(updated);
  };

  // 1. Generate Rich HTML for Word / Google Docs clipboard
  const copyForWord = () => {
    let html = `<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;font-family:sans-serif;direction:${
      isEn ? 'ltr' : 'rtl'
    };">`;
    html += '<thead style="background:#f1f5f9;font-weight:bold;"><tr>';
    headers.forEach((h, i) => {
      html += `<th style="text-align:${alignments[i] || 'center'};padding:10px;border:1px solid #cbd5e1;">${h}</th>`;
    });
    html += '</tr></thead><tbody>';
    rows.forEach((row, rIdx) => {
      const bg = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
      html += `<tr style="background:${bg};">`;
      row.forEach((c, cIdx) => {
        html += `<td style="text-align:${alignments[cIdx] || 'center'};padding:8px;border:1px solid #cbd5e1;">${c}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';

    const plainText = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');

    try {
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([plainText], { type: 'text/plain' });
      navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        }),
      ]);
      setCopiedFormat('word');
      setTimeout(() => setCopiedFormat(null), 2500);
    } catch {
      navigator.clipboard.writeText(plainText);
      setCopiedFormat('word');
      setTimeout(() => setCopiedFormat(null), 2500);
    }
  };

  // 2. Generate Markdown table
  const copyMarkdown = () => {
    let md = '| ' + headers.map((h) => h || ' ').join(' | ') + ' |\n';
    md +=
      '| ' +
      alignments
        .map((a) => {
          if (a === 'center') return ':---:';
          if (a === 'right') return '---:';
          return ':---';
        })
        .join(' | ') +
      ' |\n';
    rows.forEach((row) => {
      md += '| ' + row.map((c) => c || ' ').join(' | ') + ' |\n';
    });

    navigator.clipboard.writeText(md);
    setCopiedFormat('md');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  // 3. Export CSV
  const downloadCsv = () => {
    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `table-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 4. Copy JSON
  const copyJson = () => {
    const jsonList = rows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h || `col_${i + 1}`] = row[i] || '';
      });
      return obj;
    });

    navigator.clipboard.writeText(JSON.stringify(jsonList, null, 2));
    setCopiedFormat('json');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  // Preset Template Loader
  const loadPreset = (type: 'invoice' | 'comparison' | 'tasks') => {
    if (type === 'invoice') {
      setHeaders(isEn ? defaultEnHeaders : defaultFaHeaders);
      setRows(isEn ? defaultEnRows : defaultFaRows);
    } else if (type === 'comparison') {
      if (isEn) {
        setHeaders(['Feature', 'Free Tier', 'Pro Plan', 'Enterprise']);
        setAlignments(['left', 'center', 'center', 'center']);
        setRows([
          ['Storage', '5 GB', '100 GB', 'Unlimited'],
          ['Team Members', '1', '10', 'Unlimited'],
          ['API Access', 'No', 'Yes', 'Dedicated Rate Limits'],
          ['Support', 'Community', 'Email (24h)', 'Dedicated Slack & Phone'],
        ]);
      } else {
        setHeaders(['ویژگی', 'پلان رایگان', 'پلان حرفه‌ای (Pro)', 'سازمانی (Enterprise)']);
        setAlignments(['right', 'center', 'center', 'center']);
        setRows([
          ['فضای ذخیره‌سازی', '۵ گیگابایت', '۱۰۰ گیگابایت', 'نامحدود'],
          ['تعداد اعضای تیم', '۱ نفر', '۱۰ نفر', 'نامحدود'],
          ['دسترسی به وب‌سرویس', 'ندارد', 'دارد', 'با سقف درخواست نامحدود'],
          ['پشتیبانی', 'انجمن', 'ایمیل ۲۴ ساعته', 'مدیر حساب اختصاصی و تلفنی'],
        ]);
      }
    } else if (type === 'tasks') {
      if (isEn) {
        setHeaders(['Task ID', 'Title', 'Assignee', 'Priority', 'Status']);
        setAlignments(['center', 'left', 'center', 'center', 'center']);
        setRows([
          ['TASK-101', 'Authentication flow', 'David', 'High', 'In Progress'],
          ['TASK-102', 'Payment gateway webhooks', 'Sarah', 'Critical', 'Review'],
          ['TASK-103', 'Dark mode theme polish', 'Alex', 'Medium', 'Done'],
        ]);
      } else {
        setHeaders(['شناسه', 'عنوان تسک', 'مسئول انجام', 'اولویت', 'وضعیت']);
        setAlignments(['center', 'right', 'center', 'center', 'center']);
        setRows([
          ['TSK-101', 'پیاده‌سازی احراز هویت دو مرحله‌ای', 'رضا', 'بالا', 'در حال انجام'],
          ['TSK-102', 'اتصال وب‌هوک‌های درگاه پرداخت', 'سارا', 'بسیار بالا', 'بررسی کد'],
          ['TSK-103', 'بهینه‌سازی قالب دارک‌مود', 'علی', 'متوسط', 'تکمیل شده'],
        ]);
      }
    }
  };

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isEn ? 'Visual Table Builder & Converter' : 'طراحی و ساخت جدول (Table Builder)'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Create custom tables and export directly to Word, Excel, Markdown, CSV, and JSON'
                : 'ساخت جدول‌های تعاملی و خروجی مستقیم به ورد، اکسل، مارک‌داون، CSV و JSON'}
            </p>
          </div>
        </div>

        {/* Template Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">{isEn ? 'Templates:' : 'قالب‌ها:'}</span>
          <button
            onClick={() => loadPreset('invoice')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition text-[11px]"
          >
            {isEn ? 'Invoice' : 'پیش‌فاکتور'}
          </button>
          <button
            onClick={() => loadPreset('comparison')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition text-[11px]"
          >
            {isEn ? 'Comparison' : 'مقایسه'}
          </button>
          <button
            onClick={() => loadPreset('tasks')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition text-[11px]"
          >
            {isEn ? 'Tasks' : 'وظایف'}
          </button>
        </div>
      </div>

      {/* Action Toolbar for Rows/Cols */}
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

        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <span>{rows.length} {isEn ? 'rows' : 'ردیف'}</span>
          <span>×</span>
          <span>{headers.length} {isEn ? 'columns' : 'ستون'}</span>
        </div>
      </div>

      {/* Visual Table Editor */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-700 dark:text-slate-200 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {headers.map((h, colIdx) => (
                  <th key={colIdx} className="p-2 border-x border-slate-200 dark:border-slate-700/60 min-w-[150px]">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
                        {/* Alignment toggle button */}
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

                        {/* Delete Column button */}
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
                        className={`w-full p-1.5 font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
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
                <tr key={rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  {row.map((cell, colIdx) => (
                    <td key={colIdx} className="p-1 border-x border-slate-100 dark:border-slate-800/60">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                        className={`w-full p-2 rounded-lg bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-blue-400 focus:outline-none ${
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

      {/* Export Options Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {isEn ? 'Export & Copy Table in Various Formats:' : 'خروجی و کپی جدول در فرمت‌های گوناگون:'}
        </h3>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Word / Excel rich clipboard copy */}
          <button
            onClick={copyForWord}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm active:scale-95 transition cursor-pointer"
          >
            {copiedFormat === 'word' ? <Check className="w-3.5 h-3.5" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
            <span>
              {copiedFormat === 'word'
                ? (isEn ? 'Copied for Word!' : 'کپی شد (آماده چسباندن در ورد)')
                : (isEn ? 'Copy for Word & Excel' : 'کپی مستقیم برای Word و Excel')}
            </span>
          </button>

          {/* Markdown copy */}
          <button
            onClick={copyMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
          >
            {copiedFormat === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <FileText className="w-3.5 h-3.5" />}
            <span>{copiedFormat === 'md' ? (isEn ? 'Copied Markdown' : 'مارک‌داون کپی شد') : (isEn ? 'Copy Markdown' : 'کپی کد Markdown')}</span>
          </button>

          {/* CSV Download */}
          <button
            onClick={downloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isEn ? 'Download .CSV' : 'دانلود فایل CSV'}</span>
          </button>

          {/* JSON Copy */}
          <button
            onClick={copyJson}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
          >
            {copiedFormat === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <FileCode className="w-3.5 h-3.5" />}
            <span>{copiedFormat === 'json' ? (isEn ? 'Copied JSON' : 'JSON کپی شد') : (isEn ? 'Copy JSON' : 'کپی JSON')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

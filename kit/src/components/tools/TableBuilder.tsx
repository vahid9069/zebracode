'use client';

import React, { useState } from 'react';
import { Table, Plus, Trash2, Download, Copy, Check, FileSpreadsheet } from 'lucide-react';

export function TableBuilder() {
  const [headers, setHeaders] = useState<string[]>(['ردیف', 'نام کالا / خدمت', 'تعداد', 'قیمت واحد (تومان)', 'توضیحات']);
  const [rows, setRows] = useState<string[][]>([
    ['۱', 'لپ‌تاپ مهندسی', '۱', '۴۵,۰۰۰,۰۰۰', 'گارانتی ۱۸ ماهه'],
    ['۲', 'مانیتور ۲۷ اینچ', '۲', '۱۱,۵۰۰,۰۰۰', 'پنل IPS'],
    ['۳', 'کیبورد مکانیکی', '۱', '۳,۲۰۰,۰۰۰', 'نورپردازی RGB'],
  ]);
  const [copied, setCopied] = useState<string | null>(null);

  const addRow = () => {
    const emptyRow = headers.map((_, idx) => (idx === 0 ? String(rows.length + 1) : ''));
    setRows([...rows, emptyRow]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    const colName = `ستون ${headers.length + 1}`;
    setHeaders([...headers, colName]);
    setRows(rows.map((row) => [...row, '']));
  };

  const removeColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, i) => i !== colIdx));
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

  // کپی با فرمت جدول HTML مناسب برای Word
  const copyForWord = () => {
    let html = '<table border="1" style="border-collapse:collapse;width:100%;text-align:right;font-family:Tahoma;">';
    html += '<thead style="background:#f1f5f9;"><tr>';
    headers.forEach((h) => (html += `<th style="padding:8px;">${h}</th>`));
    html += '</tr></thead><tbody>';
    rows.forEach((row) => {
      html += '<tr>';
      row.forEach((c) => (html += `<td style="padding:8px;">${c}</td>`));
      html += '</tr>';
    });
    html += '</tbody></table>';

    const blob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([rows.map((r) => r.join('\t')).join('\n')], { type: 'text/plain' });
    navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blob,
        'text/plain': textBlob,
      }),
    ]);
    setCopied('word');
    setTimeout(() => setCopied(null), 2000);
  };

  // دانلود CSV با UTF-8 BOM تا در اکسل فارسی خراب نشود
  const downloadCsv = () => {
    const all = [headers, ...rows];
    const csvContent = '\uFEFF' + all.map((e) => e.map((x) => `"${x.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'table.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* نوار ابزار بالای جدول */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            افزودن سطر جدید
          </button>
          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            افزودن ستون
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyForWord}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
          >
            {copied === 'word' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied === 'word' ? 'کپی شد' : 'کپی برای Word'}</span>
          </button>
          <button
            onClick={downloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            دانلود فایل اکسل (CSV)
          </button>
        </div>
      </div>

      {/* بوم جدول بصری شبیه اکسل */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-right border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              {headers.map((h, colIdx) => (
                <th key={colIdx} className="p-2 border-l border-slate-200 dark:border-slate-700 last:border-l-0">
                  <div className="flex items-center justify-between gap-1">
                    <input
                      type="text"
                      value={h}
                      onChange={(e) => updateHeader(colIdx, e.target.value)}
                      className="w-full bg-transparent font-bold text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                    {headers.length > 1 && (
                      <button
                        onClick={() => removeColumn(colIdx)}
                        title="حذف این ستون"
                        className="text-slate-400 hover:text-rose-500 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-10 p-2 text-center text-xs text-slate-400">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              >
                {row.map((cell, colIdx) => (
                  <td key={colIdx} className="p-2 border-l border-slate-100 dark:border-slate-800 last:border-l-0">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:bg-blue-50/50 dark:focus:bg-blue-950/30 px-1 py-0.5 rounded"
                    />
                  </td>
                ))}
                <td className="p-2 text-center">
                  <button
                    onClick={() => removeRow(rowIdx)}
                    title="حذف این سطر"
                    className="text-slate-400 hover:text-rose-500 p-1"
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
  );
}

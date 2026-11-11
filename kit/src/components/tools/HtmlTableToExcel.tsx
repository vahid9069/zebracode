'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Clipboard, Sparkles, Copy, Check } from 'lucide-react';

export function HtmlTableToExcel() {
  const [htmlInput, setHtmlInput] = useState('');
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [copied, setCopied] = useState(false);

  const parseHtmlTable = (html: string) => {
    setHtmlInput(html);
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const table = doc.querySelector('table');

      if (!table) {
        // اگر تگ table نداشت، سعی می‌کنیم ردیف‌های tab-separated را بخوانیم
        const lines = html.trim().split('\n').map((l) => l.split('\t').map((c) => c.trim()));
        if (lines.length > 0 && lines[0].length > 1) {
          setParsedData(lines);
        } else {
          setParsedData([]);
        }
        return;
      }

      const rows: string[][] = [];
      const trs = table.querySelectorAll('tr');

      trs.forEach((tr) => {
        const rowData: string[] = [];
        const cells = tr.querySelectorAll('th, td');
        cells.forEach((cell) => {
          rowData.push(cell.textContent?.trim() || '');
        });
        if (rowData.length > 0) {
          rows.push(rowData);
        }
      });

      setParsedData(rows);
    } catch {
      setParsedData([]);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      parseHtmlTable(text);
    } catch {
      // ignore
    }
  };

  const downloadCsv = () => {
    if (parsedData.length === 0) return;
    const csvContent = '\uFEFF' + parsedData.map((e) => e.map((x) => `"${x.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'web-table.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            کد HTML یا جدول کپی‌شده از وب‌سایت را اینجا قرار دهید:
          </label>
          <button
            onClick={handlePaste}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            <Clipboard className="w-3.5 h-3.5" />
            پیست از کلیپ‌بورد
          </button>
        </div>

        <textarea
          value={htmlInput}
          onChange={(e) => parseHtmlTable(e.target.value)}
          placeholder="کد تگ <table>...</table> یا متن کپی‌شده جدول از صفحات وب و ویکی‌پدیا را اینجا قرار دهید..."
          rows={7}
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {parsedData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              جدول با موفقیت شناسایی شد ({parsedData.length} سطر و {parsedData[0].length} ستون)
            </span>

            <button
              onClick={downloadCsv}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              دانلود مستقیم فایل اکسل (CSV)
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-x-auto max-h-96">
            <table className="w-full text-right border-collapse min-w-[500px] text-xs">
              <tbody>
                {parsedData.map((row, rI) => (
                  <tr
                    key={rI}
                    className={`border-b border-slate-100 dark:border-slate-800 ${
                      rI === 0 ? 'bg-slate-100 dark:bg-slate-800/80 font-bold' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {row.map((cell, cI) => (
                      <td key={cI} className="p-3 border-l border-slate-100 dark:border-slate-800 last:border-l-0">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Sheet, Upload, Download, Search, Check, Copy } from 'lucide-react';

export function CsvViewer() {
  const [data, setData] = useState<string[][]>([
    ['کد پرسنلی', 'نام و نام خانوادگی', 'واحد', 'شماره تماس', 'وضعیت'],
    ['101', 'محمد حسینی', 'فروش و بازاریابی', '09121111111', 'فعال'],
    ['102', 'سارا رستمی', 'فناوری اطلاعات', '09122222222', 'فعال'],
    ['103', 'علی احمدی', 'مالی و اداری', '09123333333', 'مرخصی'],
  ]);
  const [search, setSearch] = useState('');
  const [fileName, setFileName] = useState('data.csv');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsv(text);
    };
    // خواندن فایل به صورت متنی
    reader.readAsText(file, 'UTF-8');
  };

  const parseCsv = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const rows = lines.map((line) => {
      // تجزیه با در نظر گرفتن کوتیشن‌ها
      const matches = line.match(/(?:[^\s",]+|"(?:\\.|[^"])*")+/g);
      return (matches || line.split(',')).map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
    });
    if (rows.length > 0) {
      setData(rows);
    }
  };

  const filteredData = data.filter((row, idx) => {
    if (idx === 0) return true; // همیشه هدر بماند
    if (!search.trim()) return true;
    return row.some((cell) => cell.toLowerCase().includes(search.toLowerCase()));
  });

  const downloadFixedCsv = () => {
    const csvContent = '\uFEFF' + data.map((e) => e.map((x) => `"${x.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fixed-${fileName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs cursor-pointer hover:bg-blue-100 transition-colors">
          <Upload className="w-4 h-4" />
          <span>بارگذاری فایل CSV</span>
          <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
        </label>

        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در سطرها..."
              className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={downloadFixedCsv}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          دانلود نسخه اصلاح‌شده (با انکودینگ استاندارد فارسی)
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-x-auto max-h-[500px]">
        <table className="w-full text-right border-collapse min-w-[600px] text-xs">
          <thead>
            {filteredData.length > 0 && (
              <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700">
                {filteredData[0].map((h, i) => (
                  <th key={i} className="p-3 border-l border-slate-200 dark:border-slate-700 last:border-l-0">
                    {h}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {filteredData.slice(1).map((row, rI) => (
              <tr
                key={rI}
                className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
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
  );
}

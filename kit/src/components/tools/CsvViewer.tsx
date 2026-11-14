'use client';

import React, { useState, useMemo } from 'react';
import {
  Sheet,
  Upload,
  Download,
  Search,
  Check,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileCode,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

interface CsvViewerProps {
  locale?: string;
  dict?: any;
}

export function CsvViewer({ locale = 'fa' }: CsvViewerProps) {
  const isEn = locale === 'en';

  const sampleFaData: string[][] = [
    ['کد پرسنلی', 'نام و نام خانوادگی', 'واحد سازمانی', 'شهر', 'وضعیت', 'امتیاز'],
    ['101', 'محمد حسینی', 'فروش و بازاریابی', 'تهران', 'فعال', '94'],
    ['102', 'سارا رستمی', 'فناوری اطلاعات', 'شیراز', 'فعال', '98'],
    ['103', 'علی احمدی', 'مالی و اداری', 'اصفهان', 'مرخصی', '82'],
    ['104', 'مریم کاظمی', 'توسعه محصول', 'مشهد', 'فعال', '91'],
    ['105', 'نیلوفر افشار', 'پشتیبانی مشتریان', 'تبریز', 'فعال', '87'],
    ['106', 'حسین کریمی', 'تحقیق و توسعه', 'تهران', 'غیرفعال', '76'],
    ['107', 'زهرا محمدی', 'منابع انسانی', 'اصفهان', 'فعال', '95'],
    ['108', 'امیر رضایی', 'فناوری اطلاعات', 'تهران', 'فعال', '89'],
  ];

  const sampleEnData: string[][] = [
    ['Employee ID', 'Full Name', 'Department', 'Location', 'Status', 'Score'],
    ['101', 'Alex Morgan', 'Sales & Marketing', 'New York', 'Active', '94'],
    ['102', 'Sarah Connor', 'Information Technology', 'San Francisco', 'Active', '98'],
    ['103', 'Michael Scott', 'Finance & Admin', 'Scranton', 'On Leave', '82'],
    ['104', 'Emma Watson', 'Product Design', 'London', 'Active', '91'],
    ['105', 'James Wilson', 'Customer Support', 'Chicago', 'Active', '87'],
    ['106', 'Daniel Brown', 'Research & Dev', 'Austin', 'Inactive', '76'],
    ['107', 'Sophia Taylor', 'Human Resources', 'Boston', 'Active', '95'],
    ['108', 'Lucas Martin', 'Engineering', 'Seattle', 'Active', '89'],
  ];

  const [data, setData] = useState<string[][]>(isEn ? sampleEnData : sampleFaData);
  const [search, setSearch] = useState('');
  const [fileName, setFileName] = useState('data.csv');
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Auto-detect delimiter and parse CSV
  const parseCsv = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    // Detect delimiter from first line
    const firstLine = lines[0];
    let delimiter = ',';
    const semicolons = (firstLine.match(/;/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;
    const pipes = (firstLine.match(/\|/g) || []).length;

    if (semicolons > commas && semicolons > tabs) delimiter = ';';
    else if (tabs > commas && tabs > semicolons) delimiter = '\t';
    else if (pipes > commas && pipes > semicolons) delimiter = '|';

    const rows: string[][] = [];

    // Robust CSV tokenizer regex for delimiter
    const pattern = new RegExp(
      `(\${delimiter}|\\r?\\n|\\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter}\\r\\n]*))`,
      'gi'
    );

    lines.forEach((line) => {
      // Split by delimiter respecting quotes
      const row: string[] = [];
      let inQuote = false;
      let curVal = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuote && nextChar === '"') {
            curVal += '"';
            i++;
          } else {
            inQuote = !inQuote;
          }
        } else if (char === delimiter && !inQuote) {
          row.push(curVal.trim());
          curVal = '';
        } else {
          curVal += char;
        }
      }
      row.push(curVal.trim());

      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
    });

    if (rows.length > 0) {
      setData(rows);
      setSortCol(null);
      setCurrentPage(1);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsv(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Header & Rows split
  const headers = data[0] || [];
  const rawRows = data.slice(1);

  // Search filtering
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rawRows;
    const q = search.toLowerCase();
    return rawRows.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)));
  }, [rawRows, search]);

  // Sorting
  const sortedRows = useMemo(() => {
    if (sortCol === null) return filteredRows;
    const sorted = [...filteredRows].sort((a, b) => {
      const cellA = a[sortCol] || '';
      const cellB = b[sortCol] || '';
      const numA = Number(cellA);
      const numB = Number(cellB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === 'asc' ? numA - numB : numB - numA;
      }
      return sortDir === 'asc' ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
    });
    return sorted;
  }, [filteredRows, sortCol, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pagedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(colIdx);
      setSortDir('asc');
    }
  };

  // Download fixed clean CSV with UTF-8 BOM
  const downloadFixedCsv = () => {
    const csvContent =
      '\uFEFF' +
      data
        .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName.startsWith('clean-') ? fileName : `clean-${fileName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Export JSON
  const copyJson = () => {
    if (data.length < 2) return;
    const head = data[0];
    const rows = data.slice(1);
    const jsonArr = rows.map((r) => {
      const obj: Record<string, string> = {};
      head.forEach((h, idx) => {
        obj[h || `col_${idx + 1}`] = r[idx] || '';
      });
      return obj;
    });

    navigator.clipboard.writeText(JSON.stringify(jsonArr, null, 2));
    setCopiedFormat('json');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
            <Sheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isEn ? 'CSV Viewer & Cleaner' : 'مشاهده‌گر و تصحیح‌کننده فایل CSV'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Instant in-browser tabular viewer, search, sort, and UTF-8 export for CSV files'
                : 'مشاهده جداول CSV، جستجو در سطرها، مرتب‌سازی ستونی و تصحیح یونیکد برای اکسل بدون ارسال به سرور'}
            </p>
          </div>
        </div>

        {/* Upload Action */}
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer transition active:scale-95">
          <Upload className="w-4 h-4" />
          <span>{isEn ? 'Open CSV File' : 'انتخاب و باز کردن فایل CSV'}</span>
          <input type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={isEn ? 'Filter rows by keyword...' : 'جستجو در تمام ردیف‌ها و ستون‌ها...'}
            className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Export and Stats */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadFixedCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isEn ? 'Export Clean CSV' : 'دانلود CSV استاندارد (UTF-8)'}</span>
          </button>

          <button
            onClick={copyJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition"
          >
            {copiedFormat === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <FileCode className="w-3.5 h-3.5" />}
            <span>{copiedFormat === 'json' ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy JSON' : 'کپی JSON')}</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-700 dark:text-slate-200 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 select-none">
              <tr>
                {headers.map((h, colIdx) => (
                  <th
                    key={colIdx}
                    onClick={() => toggleSort(colIdx)}
                    className="p-3 text-start font-bold border-x border-slate-200 dark:border-slate-700/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{h || (isEn ? `Col ${colIdx + 1}` : `ستون ${colIdx + 1}`)}</span>
                      {sortCol === colIdx ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50 shrink-0" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {pagedRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3 border-x border-slate-100 dark:border-slate-800/60">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div>
            <span>
              {isEn
                ? `Showing ${pagedRows.length} of ${sortedRows.length} entries`
                : `نمایش ${pagedRows.length} از مجموع ${sortedRows.length} سطر`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

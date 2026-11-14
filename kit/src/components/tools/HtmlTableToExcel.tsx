'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Clipboard,
  Sparkles,
  Copy,
  Check,
  Table as TableIcon,
  Trash2,
  FileCode,
  FileText
} from 'lucide-react';

interface HtmlTableToExcelProps {
  locale?: string;
  dict?: any;
}

export function HtmlTableToExcel({ locale = 'fa' }: HtmlTableToExcelProps) {
  const isEn = locale === 'en';

  const defaultSampleFa = `<table border="1">
  <thead>
    <tr>
      <th>ردیف</th>
      <th>نام محصول</th>
      <th>دسته‌بندی</th>
      <th>موجودی انبار</th>
      <th>قیمت واحد (تومان)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>گوشی هوشمند سامسونگ S24</td>
      <td>موبایل</td>
      <td>25</td>
      <td>52,000,000</td>
    </tr>
    <tr>
      <td>2</td>
      <td>مک‌بوک ایر M3</td>
      <td>لپ‌تاپ</td>
      <td>14</td>
      <td>78,500,000</td>
    </tr>
    <tr>
      <td>3</td>
      <td>هدفون سونی WH-1000XM5</td>
      <td>لوازم جانبی</td>
      <td>40</td>
      <td>18,200,000</td>
    </tr>
  </tbody>
</table>`;

  const defaultSampleEn = `<table border="1">
  <thead>
    <tr>
      <th>#</th>
      <th>Product Name</th>
      <th>Category</th>
      <th>In Stock</th>
      <th>Price (USD)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>Samsung Galaxy S24 Ultra</td>
      <td>Smartphone</td>
      <td>25</td>
      <td>$1,299</td>
    </tr>
    <tr>
      <td>2</td>
      <td>MacBook Air M3</td>
      <td>Laptop</td>
      <td>14</td>
      <td>$1,499</td>
    </tr>
    <tr>
      <td>3</td>
      <td>Sony WH-1000XM5 Headphones</td>
      <td>Audio</td>
      <td>40</td>
      <td>$399</td>
    </tr>
  </tbody>
</table>`;

  const [htmlInput, setHtmlInput] = useState(isEn ? defaultSampleEn : defaultSampleFa);
  const [parsedData, setParsedData] = useState<string[][]>([]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const parseHtmlTable = (html: string) => {
    setHtmlInput(html);
    if (!html.trim()) {
      setParsedData([]);
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const table = doc.querySelector('table');

      if (!table) {
        // Fallback: Check if tab-separated or newline-separated
        const lines = html
          .trim()
          .split('\n')
          .map((l) => l.split('\t').map((c) => c.trim()))
          .filter((row) => row.some((c) => c.length > 0));

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
          // Clean text content (remove internal nested tags, normalize whitespace)
          const cleanText = (cell.textContent || '').replace(/\s+/g, ' ').trim();
          rowData.push(cleanText);
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

  // Run initial parse on mount
  React.useEffect(() => {
    parseHtmlTable(isEn ? defaultSampleEn : defaultSampleFa);
  }, [isEn]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      parseHtmlTable(text);
    } catch {
      // ignore
    }
  };

  // 1. Download as Excel (.xls XML Format)
  const downloadExcel = () => {
    if (parsedData.length === 0) return;

    let excelXml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Sheet1">
  <Table>`;

    parsedData.forEach((row) => {
      excelXml += '<Row>';
      row.forEach((cell) => {
        const escaped = cell
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        excelXml += `<Cell><Data ss:Type="String">${escaped}</Data></Cell>`;
      });
      excelXml += '</Row>';
    });

    excelXml += `  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `excel-export-${Date.now()}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 2. Download CSV (UTF-8 with BOM for Excel compatibility)
  const downloadCsv = () => {
    if (parsedData.length === 0) return;
    const csvContent =
      '\uFEFF' +
      parsedData
        .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `table-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 3. Copy JSON
  const copyJson = () => {
    if (parsedData.length < 2) return;
    const headers = parsedData[0];
    const dataRows = parsedData.slice(1);
    const result = dataRows.map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h || `col_${i + 1}`] = r[i] || '';
      });
      return obj;
    });

    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedFormat('json');
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isEn ? 'HTML Table to Excel & CSV Converter' : 'تبدیل جدول HTML به اکسل و CSV'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Convert any webpage table or <table> HTML code directly to Excel (.xls) or UTF-8 CSV'
                : 'تبدیل کدهای جدول وب یا متون جدولی به فایل اکسل (Excel) بدون بهم‌ریختگی حروف فارسی'}
            </p>
          </div>
        </div>

        <button
          onClick={handlePaste}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:bg-blue-100 transition"
        >
          <Clipboard className="w-3.5 h-3.5" />
          <span>{isEn ? 'Paste from Clipboard' : 'چسباندن از کلیپ‌بورد'}</span>
        </button>
      </div>

      {/* Input Code Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>{isEn ? 'HTML Table Code or Tabular Text:' : 'کد جدول HTML یا متن جدول کپی‌شده:'}</span>
          <button
            onClick={() => parseHtmlTable('')}
            className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition text-[11px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isEn ? 'Clear' : 'پاک کردن'}</span>
          </button>
        </div>

        <textarea
          value={htmlInput}
          onChange={(e) => parseHtmlTable(e.target.value)}
          rows={7}
          placeholder={isEn ? 'Paste <table>...</table> code here...' : 'کد <table>...</table> یا متن کپی‌شده جدول را اینجا قرار دهید...'}
          className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y"
          dir="ltr"
        />
      </div>

      {/* Parsed Preview Table & Export Actions */}
      {parsedData.length > 0 ? (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>{isEn ? 'Recognized Table:' : 'جدول شناسایی شده:'} </span>
              <strong className="text-slate-900 dark:text-slate-100 font-mono">
                {parsedData.length} {isEn ? 'rows' : 'ردیف'} × {parsedData[0]?.length || 0} {isEn ? 'columns' : 'ستون'}
              </strong>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={downloadExcel}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isEn ? 'Download Excel (.xls)' : 'دانلود فایل اکسل (.xls)'}</span>
              </button>

              <button
                onClick={downloadCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? 'Download CSV (UTF-8)' : 'دانلود CSV (یونیکد)'}</span>
              </button>

              <button
                onClick={copyJson}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition"
              >
                {copiedFormat === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <FileCode className="w-3.5 h-3.5" />}
                <span>{copiedFormat === 'json' ? (isEn ? 'Copied JSON' : 'JSON کپی شد') : (isEn ? 'Copy JSON' : 'کپی JSON')}</span>
              </button>
            </div>
          </div>

          {/* Table Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs text-slate-700 dark:text-slate-200 border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {parsedData[0].map((th, i) => (
                      <th
                        key={i}
                        className="p-3 text-start font-bold border-x border-slate-200 dark:border-slate-700/60"
                      >
                        {th || (isEn ? `Col ${i + 1}` : `ستون ${i + 1}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedData.slice(1).map((row, rIdx) => (
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
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-400 text-xs">
          <TableIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{isEn ? 'Paste an HTML table above to preview and convert.' : 'کد جدول را در کادر بالا قرار دهید تا پیش‌نمایش و دانلود اکسل فعال شود.'}</p>
        </div>
      )}
    </div>
  );
}

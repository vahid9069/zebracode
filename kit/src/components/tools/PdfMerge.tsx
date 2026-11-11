'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Files, Upload, Download, Trash2, ArrowUp, ArrowDown, FileCode2 } from 'lucide-react';

interface PdfItem {
  id: string;
  name: string;
  size: number;
  file: File;
}

export function PdfMerge() {
  const [pdfList, setPdfList] = useState<PdfItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: PdfItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      file: f,
    }));

    setPdfList((prev) => [...prev, ...newItems]);
    setMergedBlobUrl(null);
  };

  const removeFile = (id: string) => {
    setPdfList((prev) => prev.filter((item) => item.id !== id));
    setMergedBlobUrl(null);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...pdfList];
    const temp = updated[idx - 1];
    updated[idx - 1] = updated[idx];
    updated[idx] = temp;
    setPdfList(updated);
  };

  const moveDown = (idx: number) => {
    if (idx === pdfList.length - 1) return;
    const updated = [...pdfList];
    const temp = updated[idx + 1];
    updated[idx + 1] = updated[idx];
    updated[idx] = temp;
    setPdfList(updated);
  };

  const mergePdfs = async () => {
    if (pdfList.length < 2) return;
    setIsMerging(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of pdfList) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      setMergedBlobUrl(URL.createObjectURL(blob));
    } catch {
      alert('خطا در ادغام فایل‌های PDF. لطفاً از سالم بودن فایل‌ها اطمینان حاصل کنید.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 text-center cursor-pointer bg-white dark:bg-slate-900 transition-all group">
        <label className="cursor-pointer block">
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleFiles}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            انتخاب یا کشیدن فایل‌های PDF به اینجا
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            می‌توانید چند فایل PDF را همزمان انتخاب کرده و ترتیب صفحات آن‌ها را تغییر دهید
          </p>
        </label>
      </div>

      {pdfList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>فایل‌های انتخاب‌شده ({pdfList.length} فایل):</span>
            <button
              onClick={() => {
                setPdfList([]);
                setMergedBlobUrl(null);
              }}
              className="text-rose-600 hover:underline"
            >
              پاک‌سازی لیست
            </button>
          </div>

          <div className="space-y-2">
            {pdfList.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium truncate">{item.name}</span>
                  <span className="text-slate-400 text-[10px]">({(item.size / 1024).toFixed(0)} KB)</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === pdfList.length - 1}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeFile(item.id)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 items-center">
            <button
              onClick={mergePdfs}
              disabled={isMerging || pdfList.length < 2}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all"
            >
              <Files className="w-4 h-4" />
              {isMerging ? 'در حال ادغام صفحات...' : 'شروع ادغام و یکی‌کردن فایل‌ها'}
            </button>

            {mergedBlobUrl && (
              <a
                href={mergedBlobUrl}
                download="merged-document.pdf"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                دانلود فایل PDF ادغام‌شده
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

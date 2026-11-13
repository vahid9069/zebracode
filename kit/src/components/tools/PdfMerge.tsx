'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  Files,
  Upload,
  Download,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileCode2,
  FileText,
  Sparkles,
  RefreshCw,
  Check,
} from 'lucide-react';

interface PdfItem {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  file: File;
}

interface PdfMergeProps {
  locale?: 'fa' | 'en';
  dict?: any;
}

export function PdfMerge({ locale = 'fa', dict }: PdfMergeProps) {
  const isEn = locale === 'en';

  const [pdfList, setPdfList] = useState<PdfItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);
  const [mergedPageCount, setMergedPageCount] = useState<number>(0);
  const [outputFileName, setOutputFileName] = useState<string>('merged-document.pdf');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    const newItems: PdfItem[] = [];

    for (const f of Array.from(files)) {
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) continue;
      try {
        const buffer = await f.arrayBuffer();
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        newItems.push({
          id: `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: f.name,
          size: f.size,
          pageCount: doc.getPageCount(),
          file: f,
        });
      } catch {
        // If password protected or corrupt
        newItems.push({
          id: `${f.name}-${Date.now()}`,
          name: f.name,
          size: f.size,
          pageCount: 1,
          file: f,
        });
      }
    }

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
    setMergedBlobUrl(null);
  };

  const moveDown = (idx: number) => {
    if (idx === pdfList.length - 1) return;
    const updated = [...pdfList];
    const temp = updated[idx + 1];
    updated[idx + 1] = updated[idx];
    updated[idx] = temp;
    setPdfList(updated);
    setMergedBlobUrl(null);
  };

  const mergePdfs = async () => {
    if (pdfList.length < 2) return;
    setIsMerging(true);
    setErrorMessage(null);

    try {
      const mergedPdf = await PDFDocument.create();
      let totalPages = 0;

      for (const item of pdfList) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        totalPages += copiedPages.length;
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      setMergedPageCount(totalPages);
      setMergedBlobUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setErrorMessage(
        isEn
          ? 'Failed to merge PDF files. One or more files may be encrypted or corrupted.'
          : 'خطا در ادغام فایل‌های PDF. ممکن است یکی از فایل‌ها رمزگذاری‌شده یا خراب باشد.'
      );
    } finally {
      setIsMerging(false);
    }
  };

  const totalPagesInList = pdfList.reduce((acc, curr) => acc + curr.pageCount, 0);
  const totalSizeBytes = pdfList.reduce((acc, curr) => acc + curr.size, 0);

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Upload Zone */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 sm:p-12 text-center cursor-pointer bg-white/50 dark:bg-slate-900/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-all group shadow-sm">
        <label className="cursor-pointer block">
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleFiles}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-inner">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEn ? 'Drop your PDF files here or click to browse' : 'انتخاب یا کشیدن فایل‌های PDF به اینجا'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {isEn
              ? 'Select multiple PDF documents to merge into a single file with custom page order.'
              : 'چندین فایل PDF را به دلخواه انتخاب کرده و بدون افت کیفیت با ترتیب دلخواه یکی کنید.'}
          </p>
        </label>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 font-semibold">
          {errorMessage}
        </div>
      )}

      {pdfList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {isEn ? `Selected PDF Documents (${pdfList.length})` : `فایل‌های انتخاب‌شده (${pdfList.length} فایل)`}
              </span>
              <span className="text-xs text-slate-400 block">
                {isEn ? `Total Pages: ~${totalPagesInList} | Total Size: ${formatBytes(totalSizeBytes)}` : `مجموع صفحات: ~${totalPagesInList} صفحه | حجم کل: ${formatBytes(totalSizeBytes)}`}
              </span>
            </div>

            <button
              onClick={() => {
                setPdfList([]);
                setMergedBlobUrl(null);
              }}
              className="text-xs text-rose-600 hover:underline font-semibold self-start sm:self-auto"
            >
              {isEn ? 'Clear All' : 'پاک‌سازی کل لیست'}
            </button>
          </div>

          {/* List items with drag/move reordering */}
          <div className="space-y-2.5">
            {pdfList.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3 truncate max-w-[70%]">
                  <span className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {item.name}
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono">
                      {formatBytes(item.size)} • {item.pageCount} {isEn ? 'pages' : 'صفحه'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                    title={isEn ? 'Move Up' : 'انتقال به بالا'}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === pdfList.length - 1}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                    title={isEn ? 'Move Down' : 'انتقال به پایین'}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title={isEn ? 'Remove' : 'حذف'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
            <button
              type="button"
              onClick={mergePdfs}
              disabled={isMerging || pdfList.length < 2}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all"
            >
              <Files className={`w-4 h-4 ${isMerging ? 'animate-spin' : ''}`} />
              <span>
                {isMerging
                  ? (isEn ? 'Merging PDF pages...' : 'در حال ادغام صفحات...')
                  : (isEn ? 'Merge PDF Files Now' : 'شروع ادغام و یکی‌کردن فایل‌ها')}
              </span>
            </button>

            {mergedBlobUrl && (
              <a
                href={mergedBlobUrl}
                download={outputFileName}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isEn ? `Download Merged PDF (${mergedPageCount} Pages)` : `دانلود فایل PDF ادغام‌شده (${mergedPageCount} صفحه)`}
                </span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

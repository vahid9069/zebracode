'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileSpreadsheet, Upload, Download, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface ImageItem {
  id: string;
  name: string;
  file: File;
  previewUrl: string;
}

export function ImagesToPdf() {
  const [imageList, setImageList] = useState<ImageItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: ImageItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));

    setImageList((prev) => [...prev, ...newItems]);
    setPdfBlobUrl(null);
  };

  const removeImage = (id: string) => {
    setImageList((prev) => prev.filter((item) => item.id !== id));
    setPdfBlobUrl(null);
  };

  const convertToPdf = async () => {
    if (imageList.length === 0) return;
    setIsConverting(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of imageList) {
        const arrayBuffer = await item.file.arrayBuffer();
        let embeddedImage;

        if (item.file.type === 'image/png') {
          embeddedImage = await pdfDoc.embedPng(arrayBuffer);
        } else {
          embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
        }

        const { width, height } = embeddedImage;
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfBlobUrl(URL.createObjectURL(blob));
    } catch {
      alert('خطا در تبدیل تصاویر به PDF. لطفاً از فایل‌های معتبر JPG یا PNG استفاده کنید.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 text-center cursor-pointer bg-white dark:bg-slate-900 transition-all group">
        <label className="cursor-pointer block">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png"
            onChange={handleFiles}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            انتخاب یا کشیدن تصاویر (JPG / PNG)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            تصاویر دلخواه را انتخاب کنید تا به صورت صفحات یک سند PDF ذخیره شوند
          </p>
        </label>
      </div>

      {imageList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>تصاویر انتخاب‌شده ({imageList.length} عکس):</span>
            <button
              onClick={() => {
                setImageList([]);
                setPdfBlobUrl(null);
              }}
              className="text-rose-600 hover:underline"
            >
              پاک‌سازی لیست
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {imageList.map((item, idx) => (
              <div key={item.id} className="relative group rounded-xl border p-1 bg-slate-50 dark:bg-slate-800">
                <img src={item.previewUrl} alt={item.name} className="w-full h-24 object-cover rounded-lg" />
                <button
                  onClick={() => removeImage(item.id)}
                  className="absolute top-2 left-2 p-1 rounded-md bg-rose-600 text-white shadow-xs opacity-80 hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <span className="block text-[10px] text-center truncate pt-1 text-slate-500">
                  صفحه {idx + 1}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 items-center">
            <button
              onClick={convertToPdf}
              disabled={isConverting || imageList.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isConverting ? 'در حال ساخت فایل PDF...' : 'تبدیل به سند PDF'}
            </button>

            {pdfBlobUrl && (
              <a
                href={pdfBlobUrl}
                download="images-document.pdf"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                دانلود فایل PDF آماده
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

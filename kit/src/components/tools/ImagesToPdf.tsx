'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  RefreshCw,
  FileImage,
  Sliders,
} from 'lucide-react';

interface ImageItem {
  id: string;
  name: string;
  file: File;
  previewUrl: string;
}

interface ImagesToPdfProps {
  locale?: 'fa' | 'en';
  dict?: any;
}

type PageOrientation = 'portrait' | 'landscape' | 'auto';
type PageSize = 'fit' | 'a4';

export function ImagesToPdf({ locale = 'fa', dict }: ImagesToPdfProps) {
  const isEn = locale === 'en';

  const [imageList, setImageList] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [margin, setMargin] = useState<number>(20); // Margin in points

  const [isConverting, setIsConverting] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    const newItems: ImageItem[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|bmp|gif)$/i.test(f.name))
      .map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: f.name,
        file: f,
        previewUrl: URL.createObjectURL(f),
      }));

    setImageList((prev) => [...prev, ...newItems]);
    setPdfBlobUrl(null);
  };

  const removeImage = (id: string) => {
    setImageList((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    setPdfBlobUrl(null);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...imageList];
    const temp = updated[idx - 1];
    updated[idx - 1] = updated[idx];
    updated[idx] = temp;
    setImageList(updated);
    setPdfBlobUrl(null);
  };

  const moveDown = (idx: number) => {
    if (idx === imageList.length - 1) return;
    const updated = [...imageList];
    const temp = updated[idx + 1];
    updated[idx + 1] = updated[idx];
    updated[idx] = temp;
    setImageList(updated);
    setPdfBlobUrl(null);
  };

  // Convert image file safely to JPEG ArrayBuffer using canvas so WebP/AVIF won't crash pdf-lib
  const imageToJpegBuffer = (file: File): Promise<{ buffer: ArrayBuffer; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, img.width, img.height);
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const buffer = await blob.arrayBuffer();
                resolve({ buffer, width: img.width, height: img.height });
              } else {
                reject(new Error('Image blob conversion failed'));
              }
            },
            'image/jpeg',
            0.92
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const convertToPdf = async () => {
    if (imageList.length === 0) return;
    setIsConverting(true);
    setErrorMessage(null);

    try {
      const pdfDoc = await PDFDocument.create();

      // Standard A4 dimensions in PDF points (72 DPI): 595.28 x 841.89
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;

      for (const item of imageList) {
        const { buffer, width: imgW, height: imgH } = await imageToJpegBuffer(item.file);
        const embeddedImage = await pdfDoc.embedJpg(buffer);

        if (pageSize === 'fit') {
          // Page size matches exact image dimensions
          const page = pdfDoc.addPage([imgW, imgH]);
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: imgW,
            height: imgH,
          });
        } else {
          // Standard A4 page
          const isLandscape = orientation === 'landscape' || (orientation === 'auto' && imgW > imgH);
          const pWidth = isLandscape ? A4_HEIGHT : A4_WIDTH;
          const pHeight = isLandscape ? A4_WIDTH : A4_HEIGHT;

          const usableW = pWidth - margin * 2;
          const usableH = pHeight - margin * 2;

          const scale = Math.min(usableW / imgW, usableH / imgH);
          const scaledW = imgW * scale;
          const scaledH = imgH * scale;

          const posX = margin + (usableW - scaledW) / 2;
          const posY = margin + (usableH - scaledH) / 2;

          const page = pdfDoc.addPage([pWidth, pHeight]);
          page.drawImage(embeddedImage, {
            x: posX,
            y: posY,
            width: scaledW,
            height: scaledH,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfBlobUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setErrorMessage(
        isEn
          ? 'Failed to convert images to PDF. Please verify all image files.'
          : 'خطا در تبدیل تصاویر به PDF. لطفاً از سالم بودن تصاویر اطمینان حاصل کنید.'
      );
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Upload Zone */}
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 sm:p-12 text-center cursor-pointer bg-white/50 dark:bg-slate-900/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-all group shadow-sm">
        <label className="cursor-pointer block">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFiles}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-inner">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEn ? 'Drop your images here or click to browse' : 'انتخاب یا کشیدن عکس‌ها جهت تبدیل به PDF'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {isEn
              ? 'Convert multiple JPG, PNG, WebP, and AVIF photos into a clean unified PDF document.'
              : 'تبدیل عکس‌های JPG، PNG، WebP و اسکن‌ها به یک فایل PDF با سایز استاندارد A4 بدون آپلود به سرور.'}
          </p>
        </label>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 font-semibold">
          {errorMessage}
        </div>
      )}

      {imageList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Options Bar: Page Size & Orientation */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>{isEn ? 'PDF Page Layout Settings:' : 'تنظیمات چیدمان و ابعاد صفحات PDF:'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">{isEn ? 'Page Size:' : 'اندازه صفحه:'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPageSize('a4')}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      pageSize === 'a4'
                        ? 'border-blue-600 bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isEn ? 'Standard A4' : 'A4 استاندارد'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageSize('fit')}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      pageSize === 'fit'
                        ? 'border-blue-600 bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isEn ? 'Fit Image' : 'هم‌اندازه عکس'}
                  </button>
                </div>
              </div>

              {pageSize === 'a4' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">{isEn ? 'Orientation:' : 'جهت صفحه:'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'portrait', label: isEn ? 'Portrait' : 'عمودی' },
                      { id: 'landscape', label: isEn ? 'Landscape' : 'افقی' },
                      { id: 'auto', label: isEn ? 'Auto' : 'خودکار' },
                    ].map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setOrientation(o.id as PageOrientation)}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                          orientation === o.id
                            ? 'border-blue-600 bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {pageSize === 'a4' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">{isEn ? 'Page Margin:' : 'حاشیه دور صفحه:'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 0, label: isEn ? 'None' : 'بدون حاشیه' },
                      { val: 20, label: isEn ? 'Normal' : 'استاندارد' },
                      { val: 40, label: isEn ? 'Wide' : 'پهن' },
                    ].map((m) => (
                      <button
                        key={m.val}
                        type="button"
                        onClick={() => setMargin(m.val)}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                          margin === m.val
                            ? 'border-blue-600 bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Image List items with thumbnail and reordering */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>{isEn ? `Image Pages (${imageList.length})` : `صفحات تصاویر (${imageList.length} صفحه):`}</span>
              <button
                type="button"
                onClick={() => {
                  imageList.forEach((i) => URL.revokeObjectURL(i.previewUrl));
                  setImageList([]);
                  setPdfBlobUrl(null);
                }}
                className="text-xs text-rose-600 hover:underline"
              >
                {isEn ? 'Clear All' : 'پاک‌سازی همه'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {imageList.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-3 truncate max-w-[70%]">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                      title={isEn ? 'Move Up' : 'انتقال به بالا'}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(idx)}
                      disabled={idx === imageList.length - 1}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                      title={isEn ? 'Move Down' : 'انتقال به پایین'}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(item.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title={isEn ? 'Remove' : 'حذف'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
            <button
              type="button"
              onClick={convertToPdf}
              disabled={isConverting || imageList.length === 0}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all"
            >
              <FileText className={`w-4 h-4 ${isConverting ? 'animate-spin' : ''}`} />
              <span>
                {isConverting
                  ? (isEn ? 'Creating PDF Document...' : 'در حال تولید فایل PDF...')
                  : (isEn ? `Convert ${imageList.length} Photos to PDF` : `تبدیل ${imageList.length} عکس به فایل PDF`)}
              </span>
            </button>

            {pdfBlobUrl && (
              <a
                href={pdfBlobUrl}
                download="images-converted.pdf"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{isEn ? 'Download Converted PDF' : 'دانلود فایل PDF آماده‌شده'}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

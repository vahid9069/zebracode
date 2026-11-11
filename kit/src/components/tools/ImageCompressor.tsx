'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, Sliders, Image as ImageIcon, Sparkles } from 'lucide-react';

export function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(0.7);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (imageFile: File, q: number) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCompressedSize(blob.size);
              setCompressedUrl(URL.createObjectURL(blob));
            }
            setIsProcessing(false);
          },
          'image/jpeg',
          q
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(imageFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setOriginalSize(f.size);
      setOriginalUrl(URL.createObjectURL(f));
      compressImage(f, quality);
    }
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (file) {
      compressImage(file, newQ);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 بایت';
    const k = 1024;
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const savedPercent = originalSize > 0 && compressedSize > 0
    ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-12 text-center cursor-pointer bg-white dark:bg-slate-900 transition-all group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            تصویر مورد نظر را انتخاب یا اینجا رها کنید
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            پشتیبانی از فرمت‌های JPG, PNG و WebP • پردازش ۱۰۰٪ محلی در مرورگر
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* پنل تنظیم کیفیت فشرده‌سازی */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600" />
                کیفیت خروجی و میزان فشرده‌سازی:
              </span>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg">
                {Math.round(quality * 100)}٪
              </span>
            </div>

            <input
              type="range"
              min={0.1}
              max={0.95}
              step={0.05}
              value={quality}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>حجم کمتر (فشرده‌تر)</span>
              <span>کیفیت بالاتر</span>
            </div>
          </div>

          {/* مقایسه حجم و درصد کاهش */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs text-slate-500">حجم فایل اولیه</span>
              <div className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-200">
                {formatBytes(originalSize)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> حجم پس از فشرده‌سازی
              </span>
              <div className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">
                {formatBytes(compressedSize)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center">
              <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">میزان کاهش حجم</span>
              <div className="mt-1 text-xl font-black text-blue-600 dark:text-blue-400">
                {savedPercent}٪ صرفه‌جویی
              </div>
            </div>
          </div>

          {/* پیش‌نمایش تصویر و دکمه دانلود */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-slate-500 block mb-3">تصویر اولیه</span>
              {originalUrl && (
                <img src={originalUrl} alt="Original" className="max-h-64 mx-auto rounded-xl object-contain border" />
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-600 block mb-3">تصویر فشرده‌شده نهایی</span>
                {compressedUrl && (
                  <img src={compressedUrl} alt="Compressed" className="max-h-64 mx-auto rounded-xl object-contain border" />
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <a
                  href={compressedUrl || '#'}
                  download={`compressed-${file.name.replace(/\.[^/.]+$/, '')}.jpg`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  دانلود تصویر فشرده
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setOriginalUrl(null);
                    setCompressedUrl(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  تصویر جدید
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

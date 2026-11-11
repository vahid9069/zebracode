'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, FileImage } from 'lucide-react';

export function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertImage = (f: File, format: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // اگر تبدیل به JPG باشد و عکس شفاف باشد، پس‌زمینه سفید می‌گذاریم
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            setConvertedSize(blob.size);
            setConvertedUrl(URL.createObjectURL(blob));
          }
        }, format, 0.9);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setImgUrl(URL.createObjectURL(f));
      convertImage(f, targetFormat);
    }
  };

  const handleFormatChange = (fmt: 'image/jpeg' | 'image/png' | 'image/webp') => {
    setTargetFormat(fmt);
    if (file) {
      convertImage(file, fmt);
    }
  };

  const getExtension = () => {
    switch (targetFormat) {
      case 'image/jpeg': return 'jpg';
      case 'image/png': return 'png';
      case 'image/webp': return 'webp';
    }
  };

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
            accept="image/*"
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            انتخاب تصویر جهت تبدیل فرمت (JPG, PNG, WebP)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            تبدیل بدون کاهش کیفیت در مرورگر بدون نیاز به آپلود فایل
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* انتخاب فرمت خروجی */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              فرمت خروجی مورد نظر را انتخاب کنید:
            </span>

            <div className="grid grid-cols-3 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => handleFormatChange('image/webp')}
                className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                  targetFormat === 'image/webp'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                فرمت WebP (فشرده‌ترین)
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange('image/png')}
                className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                  targetFormat === 'image/png'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                فرمت PNG (کیفیت بالا)
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange('image/jpeg')}
                className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                  targetFormat === 'image/jpeg'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                فرمت JPG (استاندارد)
              </button>
            </div>
          </div>

          {/* پیش‌نمایش و دانلود */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4">
            <span className="text-xs font-semibold text-slate-500 block">پیش‌نمایش تصویر تبدیل‌شده:</span>
            {convertedUrl && (
              <img src={convertedUrl} alt="Converted" className="max-h-80 mx-auto rounded-xl object-contain border" />
            )}

            <div className="flex justify-center gap-3 pt-3">
              <a
                href={convertedUrl || '#'}
                download={`converted.${getExtension()}`}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                دانلود با پسوند .{getExtension().toUpperCase()}
              </a>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setImgUrl(null);
                  setConvertedUrl(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                تصویر جدید
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

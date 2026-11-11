'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, Lock, Unlock, Scaling, Image as ImageIcon } from 'lucide-react';

export function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [origWidth, setOrigWidth] = useState<number>(0);
  const [origHeight, setOrigHeight] = useState<number>(0);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const url = URL.createObjectURL(f);
      setImgUrl(url);
      const img = new Image();
      img.onload = () => {
        setOrigWidth(img.width);
        setOrigHeight(img.height);
        setTargetWidth(img.width);
        setTargetHeight(img.height);
        processResize(img, img.width, img.height);
      };
      img.src = url;
    }
  };

  const processResize = (img: HTMLImageElement, w: number, h: number) => {
    if (w <= 0 || h <= 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);
    setResizedUrl(canvas.toDataURL('image/png'));
  };

  const updateWidth = (w: number) => {
    setTargetWidth(w);
    if (lockRatio && origWidth > 0) {
      const h = Math.round((w / origWidth) * origHeight);
      setTargetHeight(h);
      rerender(w, h);
    } else {
      rerender(w, targetHeight);
    }
  };

  const updateHeight = (h: number) => {
    setTargetHeight(h);
    if (lockRatio && origHeight > 0) {
      const w = Math.round((h / origHeight) * origWidth);
      setTargetWidth(w);
      rerender(w, h);
    } else {
      rerender(targetWidth, h);
    }
  };

  const rerender = (w: number, h: number) => {
    if (!imgUrl) return;
    const img = new Image();
    img.onload = () => processResize(img, w, h);
    img.src = imgUrl;
  };

  const applyPercent = (p: number) => {
    const w = Math.round((origWidth * p) / 100);
    const h = Math.round((origHeight * p) / 100);
    setTargetWidth(w);
    setTargetHeight(h);
    rerender(w, h);
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
            <Scaling className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            انتخاب تصویر جهت تغییر اندازه و رزولوشن
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            فرمت‌های JPG، PNG، WebP و GIF • بدون ارسال به سرور
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* کنترل ابعاد */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                ابعاد اصلی: {origWidth} × {origHeight} پیکسل
              </span>
              <div className="flex items-center gap-1">
                {[25, 50, 75, 100, 150].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => applyPercent(percent)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors"
                  >
                    {percent}٪
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 max-w-lg">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-500 mb-1">عرض (Width):</label>
                <div className="relative">
                  <input
                    type="number"
                    value={targetWidth}
                    onChange={(e) => updateWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold pl-12"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400">px</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLockRatio(!lockRatio)}
                title={lockRatio ? 'حفظ تناسب ابعاد فعال است' : 'تناسب ابعاد آزاد است'}
                className={`p-2.5 rounded-xl border mt-5 transition-colors ${
                  lockRatio
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                {lockRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>

              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-500 mb-1">ارتفاع (Height):</label>
                <div className="relative">
                  <input
                    type="number"
                    value={targetHeight}
                    onChange={(e) => updateHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold pl-12"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* پیش‌نمایش و دانلود */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4">
            <span className="text-xs font-semibold text-slate-500 block">
              پیش‌نمایش در ابعاد جدید ({targetWidth} × {targetHeight}):
            </span>
            {resizedUrl && (
              <img src={resizedUrl} alt="Resized" className="max-h-80 mx-auto rounded-xl object-contain border" />
            )}

            <div className="flex justify-center gap-3 pt-3">
              <a
                href={resizedUrl || '#'}
                download={`resized-${targetWidth}x${targetHeight}.png`}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                دانلود تصویر در سایز جدید
              </a>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setImgUrl(null);
                  setResizedUrl(null);
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

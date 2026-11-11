'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Crop, Sparkles } from 'lucide-react';

export function CircleAvatar() {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [borderWidth, setBorderWidth] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#3b82f6');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const url = URL.createObjectURL(f);
      setImgUrl(url);
    }
  };

  useEffect(() => {
    if (!imgUrl) return;
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // ترسیم ماسک دایره‌ای
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - borderWidth, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      // رسم تصویر در مرکز
      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2;
      ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);
      ctx.restore();

      // ترسیم حاشیه در صورت وجود
      if (borderWidth > 0) {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - borderWidth / 2, 0, Math.PI * 2, true);
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor;
        ctx.stroke();
      }

      setAvatarUrl(canvas.toDataURL('image/png'));
    };
    img.src = imgUrl;
  }, [imgUrl, borderWidth, borderColor]);

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
            <Crop className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            انتخاب عکس جهت ساخت آواتار دایره‌ای
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            خروجی PNG شفاف (Transparent) برای پروفایل تلگرام، اینستاگرام و رزومه
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* تنظیمات حاشیه دور دایره */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">تنظیمات کادر دور آواتار</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  ضخامت حاشیه (Border): {borderWidth}px
                </label>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={borderWidth}
                  onChange={(e) => setBorderWidth(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {borderWidth > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    رنگ کادر دور:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono">{borderColor}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* پیش‌نمایش آواتار دایره‌ای */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-5">
            <span className="text-xs font-semibold text-slate-500 block">پیش‌نمایش آواتار دایره‌ای:</span>
            {avatarUrl && (
              <div className="w-56 h-56 mx-auto rounded-full shadow-xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center bg-[conic-gradient(#f1f5f9_25%,transparent_0_50%,#f1f5f9_0_75%,transparent_0)] bg-[size:16px_16px]">
                <img src={avatarUrl} alt="Circular Avatar" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex justify-center gap-3 pt-3">
              <a
                href={avatarUrl || '#'}
                download="circle-avatar.png"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                دانلود آواتار با فرمت شفاف PNG
              </a>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setImgUrl(null);
                  setAvatarUrl(null);
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

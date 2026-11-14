'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  Lock,
  Unlock,
  Scaling,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Check,
  Clipboard,
  FileImage,
  Layers,
} from 'lucide-react';

interface ImageResizerProps {
  locale?: 'fa' | 'en';
  dict?: any;
}

interface SocialPreset {
  id: string;
  name: string;
  nameFa: string;
  width: number;
  height: number;
}

const PRESETS: SocialPreset[] = [
  { id: 'insta-square', name: 'Instagram Square (1:1)', nameFa: 'اینستاگرام مربعی (۱:۱)', width: 1080, height: 1080 },
  { id: 'insta-story', name: 'Story / Reel (9:16)', nameFa: 'استوری و ریلز (۹:۱۶)', width: 1080, height: 1920 },
  { id: 'yt-thumb', name: 'YouTube Thumbnail (16:9)', nameFa: 'کاور یوتیوب (۱۶:۹)', width: 1280, height: 720 },
  { id: 'twitter-hdr', name: 'Twitter/X Header (3:1)', nameFa: 'هدر توییتر / X (۳:۱)', width: 1500, height: 500 },
  { id: 'facebook-cvr', name: 'Facebook Cover', nameFa: 'کاور فیسبوک', width: 820, height: 312 },
  { id: 'passport', name: 'ID / Passport Photo', nameFa: 'عکس پرسنلی / پاسپورت', width: 600, height: 800 },
];

export function ImageResizer({ locale = 'fa', dict }: ImageResizerProps) {
  const isEn = locale === 'en';

  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [origWidth, setOrigWidth] = useState<number>(0);
  const [origHeight, setOrigHeight] = useState<number>(0);
  const [origSize, setOrigSize] = useState<number>(0);

  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [quality, setQuality] = useState<number>(0.9);

  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);
  const [resizedSize, setResizedSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const processResize = useCallback(
    (img: HTMLImageElement, w: number, h: number, outFmt: string, q: number) => {
      if (w <= 0 || h <= 0) return;
      setIsProcessing(true);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (outFmt === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }

      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            if (resizedUrl) URL.revokeObjectURL(resizedUrl);
            setResizedBlob(blob);
            setResizedSize(blob.size);
            setResizedUrl(URL.createObjectURL(blob));
          }
          setIsProcessing(false);
        },
        outFmt,
        q
      );
    },
    [resizedUrl]
  );

  const triggerRerender = (w: number, h: number, fmt = format, q = quality) => {
    if (loadedImgRef.current) {
      processResize(loadedImgRef.current, w, h, fmt, q);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setOrigSize(f.size);
      const url = URL.createObjectURL(f);
      setImgUrl(url);

      const img = new Image();
      img.onload = () => {
        loadedImgRef.current = img;
        setOrigWidth(img.width);
        setOrigHeight(img.height);
        setTargetWidth(img.width);
        setTargetHeight(img.height);
        processResize(img, img.width, img.height, format, quality);
      };
      img.src = url;
    }
  };

  const updateWidth = (w: number) => {
    const width = Math.max(1, w);
    setTargetWidth(width);
    if (lockRatio && origWidth > 0) {
      const h = Math.max(1, Math.round((width / origWidth) * origHeight));
      setTargetHeight(h);
      triggerRerender(width, h);
    } else {
      triggerRerender(width, targetHeight);
    }
  };

  const updateHeight = (h: number) => {
    const height = Math.max(1, h);
    setTargetHeight(height);
    if (lockRatio && origHeight > 0) {
      const w = Math.max(1, Math.round((height / origHeight) * origWidth));
      setTargetWidth(w);
      triggerRerender(w, height);
    } else {
      triggerRerender(targetWidth, height);
    }
  };

  const applyPercent = (p: number) => {
    if (origWidth === 0 || origHeight === 0) return;
    const w = Math.max(1, Math.round((origWidth * p) / 100));
    const h = Math.max(1, Math.round((origHeight * p) / 100));
    setTargetWidth(w);
    setTargetHeight(h);
    triggerRerender(w, h);
  };

  const applyPreset = (preset: SocialPreset) => {
    setLockRatio(false);
    setTargetWidth(preset.width);
    setTargetHeight(preset.height);
    triggerRerender(preset.width, preset.height);
  };

  const handleFormatChange = (newFmt: 'image/png' | 'image/jpeg' | 'image/webp') => {
    setFormat(newFmt);
    triggerRerender(targetWidth, targetHeight, newFmt, quality);
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    triggerRerender(targetWidth, targetHeight, format, newQ);
  };

  const handleCopy = async () => {
    if (!resizedBlob || !navigator.clipboard) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': resizedBlob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed', err);
    }
  };

  const handleLoadSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 900;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 1600, 900);
    grad.addColorStop(0, '#2563eb');
    grad.addColorStop(0.5, '#7c3aed');
    grad.addColorStop(1, '#db2777');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1600, 900);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ZebraCode Kit Image Resizer', 800, 420);
    ctx.font = '36px sans-serif';
    ctx.fillText('1600 × 900 High Quality Sample', 800, 500);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'sample-resizer.png', { type: 'image/png' });
        setFile(file);
        setOrigSize(file.size);
        const url = URL.createObjectURL(file);
        setImgUrl(url);

        const img = new Image();
        img.onload = () => {
          loadedImgRef.current = img;
          setOrigWidth(img.width);
          setOrigHeight(img.height);
          setTargetWidth(img.width);
          setTargetHeight(img.height);
          processResize(img, img.width, img.height, format, quality);
        };
        img.src = url;
      }
    }, 'image/png');
  };

  const handleDownload = () => {
    if (!resizedBlob) return;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(resizedBlob);
    a.download = `resized-${targetWidth}x${targetHeight}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-8" dir={isEn ? 'ltr' : 'rtl'}>
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-3xl p-10 sm:p-14 text-center cursor-pointer bg-white/50 dark:bg-slate-900/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-all group shadow-sm"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-inner">
            <Scaling className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEn ? 'Select an image to resize & scale dimensions' : 'انتخاب تصویر جهت تغییر اندازه و رزولوشن'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {isEn
              ? 'Resize by exact pixels, percentage, or social media aspect presets locally in your browser.'
              : 'تغییر سایز بر حسب پیکسل، درصد یا ابعاد استاندارد شبکه‌های اجتماعی بدون آپلود به سرور.'}
          </p>

          <div className="pt-4 flex justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSample();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {isEn ? 'Try Sample Image' : 'تست با تصویر نمونه'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls: Dimensions & Presets */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-400 font-mono block">
                  {isEn ? 'Original Dimensions:' : 'ابعاد اصلی تصویر:'}
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {origWidth} × {origHeight} px ({formatBytes(origSize)})
                </span>
              </div>

              {/* Percentage Quick Scaling */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400 ml-1">{isEn ? 'Scale:' : 'مقیاس:'}</span>
                {[25, 50, 75, 100, 150, 200].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => applyPercent(percent)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors"
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>

            {/* Width and Height Inputs with Lock Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isEn ? 'Target Dimensions (Pixels):' : 'ابعاد مورد نظر خروجی (پیکسل):'}
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4 max-w-xl">
                <div className="flex-1 w-full">
                  <span className="block text-[11px] text-slate-400 mb-1">{isEn ? 'Width' : 'عرض (Width)'}</span>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={targetWidth}
                      onChange={(e) => updateWidth(Number(e.target.value))}
                      className="w-full h-11 px-3 border rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold font-mono pl-10"
                    />
                    <span className="absolute left-3 top-3 text-xs text-slate-400">px</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLockRatio(!lockRatio)}
                  title={lockRatio ? (isEn ? 'Aspect ratio locked' : 'تناسب ابعاد قفل است') : (isEn ? 'Aspect ratio free' : 'تناسب ابعاد آزاد است')}
                  className={`p-3 rounded-xl border mt-5 transition-all ${
                    lockRatio
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {lockRatio ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </button>

                <div className="flex-1 w-full">
                  <span className="block text-[11px] text-slate-400 mb-1">{isEn ? 'Height' : 'ارتفاع (Height)'}</span>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={targetHeight}
                      onChange={(e) => updateHeight(Number(e.target.value))}
                      className="w-full h-11 px-3 border rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold font-mono pl-10"
                    />
                    <span className="absolute left-3 top-3 text-xs text-slate-400">px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Aspect Presets */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isEn ? 'Social Media & Print Presets:' : 'ابعاد آماده شبکه‌های اجتماعی و اسناد:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-white dark:bg-slate-900 text-start transition-all"
                  >
                    <span className="font-bold text-xs block text-slate-800 dark:text-slate-200">
                      {isEn ? p.name : p.nameFa}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.width} × {p.height}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Output Format and Quality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isEn ? 'Output Format:' : 'فرمت خروجی:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'image/png', label: 'PNG' },
                    { id: 'image/jpeg', label: 'JPEG' },
                    { id: 'image/webp', label: 'WebP' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => handleFormatChange(fmt.id as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        format === fmt.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {format !== 'image/png' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>{isEn ? 'Quality:' : 'کیفیت تصویر:'}</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={Math.round(quality * 100)}
                    onChange={(e) => handleQualityChange(parseInt(e.target.value) / 100)}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Preview & Action Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold">
                {isEn ? 'New Resolution Preview:' : 'پیش‌نمایش در ابعاد جدید:'}{' '}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {targetWidth} × {targetHeight} px
                </strong>
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatBytes(resizedSize)}
              </span>
            </div>

            <div className="relative min-h-[250px] max-h-[420px] bg-slate-950/5 dark:bg-slate-950/40 rounded-2xl p-4 flex items-center justify-center overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
              {isProcessing && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              )}
              {resizedUrl && (
                <img
                  src={resizedUrl}
                  alt="Resized"
                  className="max-h-[380px] w-auto max-w-full rounded-xl object-contain shadow-md"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!resizedBlob || isProcessing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isEn ? 'Download Resized Image' : 'دانلود تصویر با ابعاد جدید'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={!resizedBlob}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                title={isEn ? 'Copy image' : 'کپی تصویر'}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                <span>{copied ? (isEn ? 'Copied!' : 'کپی شد!') : (isEn ? 'Copy' : 'کپی')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setImgUrl(null);
                  setResizedUrl(null);
                  loadedImgRef.current = null;
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                {isEn ? 'New Image' : 'تصویر جدید'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

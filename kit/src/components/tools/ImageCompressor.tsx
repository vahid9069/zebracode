'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Upload,
  Download,
  Sliders,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  RefreshCw,
  Archive,
  ArrowDown,
  Eye,
  Check,
  Zap,
  Lock,
  Unlock,
  Clipboard,
  X,
  FileImage,
} from 'lucide-react';
import type {
  CompressionPreset,
  CompressionSettings,
  ImageFileItem,
  ImageOutputFormat,
} from '@/lib/image-compressor/types';
import {
  calculateDimensions,
  compressImage,
  copyImageToClipboard,
  createSampleImage,
  createZipBundle,
  DEFAULT_COMPRESSION_SETTINGS,
  downloadBlob,
  formatBytes,
  formatSavingsPercent,
  getFileExtension,
  getImageMetadata,
} from '@/lib/image-compressor/compressor';

interface ImageCompressorProps {
  locale?: 'fa' | 'en';
  dict?: any;
}

export function ImageCompressor({ locale = 'fa', dict }: ImageCompressorProps) {
  const isEn = locale === 'en';

  const [settings, setSettings] = useState<CompressionSettings>(DEFAULT_COMPRESSION_SETTINGS);
  const [targetSizeKb, setTargetSizeKb] = useState<number>(200);
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);

  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Before/after modal inspection
  const [inspectingItem, setInspectingItem] = useState<ImageFileItem | null>(null);
  const [splitPos, setSplitPos] = useState<number>(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync target size bytes
  useEffect(() => {
    if (settings.preset === 'target-size') {
      setSettings((prev) => ({
        ...prev,
        targetSizeBytes: Math.max(10, targetSizeKb) * 1024,
      }));
    }
  }, [targetSizeKb, settings.preset]);

  // Aggregate metrics
  const totalOriginalBytes = useMemo(
    () => items.reduce((acc, curr) => acc + curr.originalSize, 0),
    [items]
  );
  const totalCompressedBytes = useMemo(
    () => items.reduce((acc, curr) => acc + (curr.compressedSize || curr.originalSize), 0),
    [items]
  );
  const totalSavingsBytes = totalOriginalBytes - totalCompressedBytes;
  const overallSavingsPercent = totalOriginalBytes > 0
    ? Math.max(0, Math.round((totalSavingsBytes / totalOriginalBytes) * 100))
    : 0;
  const completedCount = useMemo(
    () => items.filter((i) => i.status === 'done').length,
    [items]
  );

  // Compress single item
  const processItem = useCallback(
    async (item: ImageFileItem, activeSettings: CompressionSettings) => {
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'compressing', errorMessage: undefined } : it))
      );

      try {
        const itemSettings: CompressionSettings = {
          ...activeSettings,
          ...(item.customSettings || {}),
        };

        const result = await compressImage(item.file, itemSettings);

        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== item.id) return it;
            return {
              ...it,
              status: 'done',
              compressedBlob: result.blob,
              compressedSize: result.size,
              compressedWidth: result.width,
              compressedHeight: result.height,
              compressedType: result.mimeType,
              compressedPreviewUrl: result.previewUrl,
              processingTimeMs: result.durationMs,
            };
          })
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'error', errorMessage: err?.message || 'Compression failed' }
              : it
          )
        );
      }
    },
    []
  );

  // Process all pending items
  const processQueue = useCallback(
    async (fileItems: ImageFileItem[], activeSettings: CompressionSettings) => {
      setIsProcessingQueue(true);
      for (const it of fileItems) {
        await processItem(it, activeSettings);
      }
      setIsProcessingQueue(false);
    },
    [processItem]
  );

  // Add files to queue
  const handleAddFiles = useCallback(
    async (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif|bmp)$/i.test(f.name)
      );

      if (validFiles.length === 0) return;

      const newItems: ImageFileItem[] = [];

      for (const file of validFiles) {
        try {
          const meta = await getImageMetadata(file);
          const previewUrl = URL.createObjectURL(file);
          newItems.push({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            file,
            name: file.name,
            originalSize: file.size,
            originalWidth: meta.width,
            originalHeight: meta.height,
            originalType: file.type || 'image/jpeg',
            originalPreviewUrl: previewUrl,
            status: 'idle',
          });
        } catch {
          // Fallback if metadata read fails
          const previewUrl = URL.createObjectURL(file);
          newItems.push({
            id: `${file.name}-${Date.now()}`,
            file,
            name: file.name,
            originalSize: file.size,
            originalWidth: 0,
            originalHeight: 0,
            originalType: file.type || 'image/jpeg',
            originalPreviewUrl: previewUrl,
            status: 'idle',
          });
        }
      }

      setItems((prev) => [...prev, ...newItems]);
      processQueue(newItems, settings);
    },
    [processQueue, settings]
  );

  // Re-run compression when global settings change
  const handleRecompressAll = () => {
    if (items.length === 0) return;
    processQueue(items, settings);
  };

  const handleDownloadSingle = (item: ImageFileItem) => {
    if (!item.compressedBlob) return;
    const ext = getFileExtension(item.compressedType || item.originalType);
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    downloadBlob(item.compressedBlob, `${baseName}-optimized.${ext}`);
  };

  const handleDownloadZip = async () => {
    if (completedCount === 0 || isZipping) return;
    setIsZipping(true);
    try {
      const completed = items.filter((i) => i.status === 'done' && i.compressedBlob);
      const zipBlob = await createZipBundle(completed);
      downloadBlob(zipBlob, `zebracode-compressed-images-${Date.now()}.zip`);
    } catch (err) {
      console.error('ZIP failed', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.originalPreviewUrl) URL.revokeObjectURL(item.originalPreviewUrl);
      if (item?.compressedPreviewUrl) URL.revokeObjectURL(item.compressedPreviewUrl);
      return prev.filter((i) => i.id !== id);
    });
    if (inspectingItem?.id === id) setInspectingItem(null);
  };

  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.originalPreviewUrl) URL.revokeObjectURL(item.originalPreviewUrl);
      if (item.compressedPreviewUrl) URL.revokeObjectURL(item.compressedPreviewUrl);
    });
    setItems([]);
    setInspectingItem(null);
  };

  const handleLoadSample = async () => {
    const sample = await createSampleImage();
    handleAddFiles([sample]);
  };

  const handleCopy = async (item: ImageFileItem) => {
    if (!item.compressedBlob) return;
    const ok = await copyImageToClipboard(item.compressedBlob);
    if (ok) {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Preset switch
  const handlePresetSelect = (preset: CompressionPreset) => {
    let q = settings.quality;
    if (preset === 'balanced') q = 0.8;
    if (preset === 'high') q = 0.65;
    if (preset === 'max') q = 0.45;

    const next: CompressionSettings = {
      ...settings,
      preset,
      quality: q,
      targetSizeBytes: preset === 'target-size' ? targetSizeKb * 1024 : undefined,
    };
    setSettings(next);
    if (items.length > 0) {
      processQueue(items, next);
    }
  };

  // Split-curtain dragging
  const handleSplitMove = useCallback(
    (clientX: number) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      setSplitPos((x / rect.width) * 100);
    },
    []
  );

  useEffect(() => {
    if (!isDraggingSplit) return;
    const onMouseMove = (e: MouseEvent) => handleSplitMove(e.clientX);
    const onMouseUp = () => setIsDraggingSplit(false);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleSplitMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDraggingSplit, handleSplitMove]);

  return (
    <div className="space-y-8" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files);
        }}
        className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-3xl p-8 sm:p-12 text-center bg-white/50 dark:bg-slate-900/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-all cursor-pointer group shadow-sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleAddFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEn ? 'Drop your images here or click to browse' : 'عکس‌های خود را اینجا رها کنید یا کلیک نمایید'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isEn
                ? 'Supports JPG, PNG, WebP, and AVIF. Batch processing with 100% client-side privacy.'
                : 'پشتیبانی از فرمت‌های JPG، PNG، WebP و AVIF به‌صورت گروهی و کاملاً محلی در مرورگر.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
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
      </div>

      {/* Control Panel: Presets, Quality, Format & Resizing */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {isEn ? 'Compression Settings' : 'تنظیمات بهینه‌سازی و فشرده‌سازی'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRecompressAll}
              disabled={items.length === 0 || isProcessingQueue}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessingQueue ? 'animate-spin' : ''}`} />
              {isEn ? 'Apply to All' : 'اعمال مجدد روی همه'}
            </button>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isEn ? 'Compression Preset:' : 'حالت پیش‌فرض فشرده‌سازی:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'balanced', label: isEn ? 'Balanced (80%)' : 'متعادل (کیفیت ۸۰٪)', desc: isEn ? 'Best for web' : 'بهترین توازن کیفیت و حجم' },
              { id: 'high', label: isEn ? 'High (65%)' : 'فشرده (۶۵٪)', desc: isEn ? 'Smaller size' : 'کاهش حجم بیشتر' },
              { id: 'max', label: isEn ? 'Extreme (45%)' : 'حداکثر (۴۵٪)', desc: isEn ? 'Lowest size' : 'کمترین حجم ممکن' },
              { id: 'target-size', label: isEn ? 'Target KB' : 'حجم مشخص (KB)', desc: isEn ? 'Binary search' : 'رساندن به حجم دلخواه' },
              { id: 'custom', label: isEn ? 'Custom' : 'شخصی‌سازی دستی', desc: isEn ? 'Manual control' : 'کنترل دستی درصد' },
            ].map((p) => {
              const active = settings.preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetSelect(p.id as CompressionPreset)}
                  className={`p-3 rounded-2xl border text-start transition-all flex flex-col justify-between ${
                    active
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-bold text-xs">{p.label}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{p.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality Slider or Target Size Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {settings.preset === 'target-size' ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{isEn ? 'Target File Size (KB):' : 'حجم هدف نهایی (کیلوبایت):'}</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{targetSizeKb} KB</span>
              </label>
              <input
                type="number"
                min={10}
                max={50000}
                value={targetSizeKb}
                onChange={(e) => setTargetSizeKb(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-400">
                {isEn
                  ? 'Binary search automatically finds the exact quality level to hit this size.'
                  : 'سیستم با الگوریتم جستجوی باینری کیفیت مناسب برای رسیدن به این حجم را تعیین می‌کند.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>{isEn ? 'Quality Level:' : 'درصد کیفیت خروجی:'}</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {Math.round(settings.quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                value={Math.round(settings.quality * 100)}
                onChange={(e) => {
                  const val = parseInt(e.target.value) / 100;
                  setSettings((prev) => ({ ...prev, quality: val, preset: 'custom' }));
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>5% ({isEn ? 'Smallest' : 'کمترین حجم'})</span>
                <span>50%</span>
                <span>100% ({isEn ? 'Lossless/Max' : 'حداکثر کیفیت'})</span>
              </div>
            </div>
          )}

          {/* Output Format Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isEn ? 'Output Format:' : 'فرمت فایل خروجی:'}
            </label>
            <select
              value={settings.outputFormat}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, outputFormat: e.target.value as ImageOutputFormat }))
              }
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-blue-600"
            >
              <option value="original">{isEn ? 'Keep Original Format' : 'حفظ فرمت اصلی تصویر'}</option>
              <option value="image/webp">WebP ({isEn ? 'Recommended for Web, -30% smaller' : 'پیشنهادی وب، ۳۰٪ حجم کمتر'})</option>
              <option value="image/avif">AVIF ({isEn ? 'Next-Gen Ultra Compression' : 'نسل جدید، فشرده‌ترین فرمت وب'})</option>
              <option value="image/jpeg">JPEG ({isEn ? 'Universal compatibility' : 'سازگاری کامل با تمام دستگاه‌ها'})</option>
              <option value="image/png">PNG ({isEn ? 'Lossless, supports transparency' : 'بدون افت کیفیت، پشتیبانی از ترنسپرنت'})</option>
            </select>
            <p className="text-[11px] text-slate-400">
              {isEn
                ? 'WebP and AVIF provide significantly smaller file sizes with clear visual quality.'
                : 'فرمت WebP و AVIF تا ۵۰ درصد حجم کمتری نسبت به JPG و PNG بدون افت کیفیت تولید می‌کنند.'}
            </p>
          </div>
        </div>

        {/* Resizing & Dimension Scaling */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{isEn ? 'Dimension Scaling (%):' : 'مقیاس ابعاد تصویر (درصد):'}</span>
            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{settings.scalePercent}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={settings.scalePercent}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, scalePercent: parseInt(e.target.value) || 100 }))
            }
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Aggregate Overview Bar (when files exist) */}
      {items.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 text-center md:text-start">
            <div>
              <span className="text-xs text-blue-100 block">{isEn ? 'Total Files' : 'تعداد کل تصاویر'}</span>
              <span className="text-2xl font-black">{items.length}</span>
            </div>
            <div className="h-8 w-px bg-blue-400/40 hidden sm:block" />
            <div>
              <span className="text-xs text-blue-100 block">{isEn ? 'Original Total' : 'حجم اولیه کل'}</span>
              <span className="text-2xl font-black">{formatBytes(totalOriginalBytes)}</span>
            </div>
            <div className="h-8 w-px bg-blue-400/40 hidden sm:block" />
            <div>
              <span className="text-xs text-blue-100 block">{isEn ? 'Optimized Total' : 'حجم فشرده‌شده'}</span>
              <span className="text-2xl font-black">{formatBytes(totalCompressedBytes)}</span>
            </div>
            <div className="h-8 w-px bg-blue-400/40 hidden sm:block" />
            <div>
              <span className="text-xs text-blue-100 block">{isEn ? 'Total Saved' : 'کل صرفه‌جویی'}</span>
              <span className="text-2xl font-black text-emerald-300">
                {overallSavingsPercent}% ({formatBytes(Math.max(0, totalSavingsBytes))})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={completedCount === 0 || isZipping}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              <Archive className={`w-4 h-4 ${isZipping ? 'animate-spin' : ''}`} />
              <span>{isEn ? 'Download All as ZIP' : 'دانلود یکجای همه (ZIP)'}</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="p-3 rounded-2xl bg-blue-700/60 hover:bg-blue-700 text-white transition-colors"
              title={isEn ? 'Clear all' : 'پاک‌سازی همه'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Files Queue Cards Grid */}
      {items.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <FileImage className="w-4 h-4 text-blue-600" />
            <span>{isEn ? 'Images Queue' : 'فهرست تصاویر پردازش‌شده'}</span>
            <span className="text-xs text-slate-400 font-mono">({items.length})</span>
          </h4>

          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => {
              const savings = formatSavingsPercent(item.originalSize, item.compressedSize || item.originalSize);
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                      <img
                        src={item.compressedPreviewUrl || item.originalPreviewUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.status === 'compressing' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Metadata & Status */}
                    <div className="min-w-0 space-y-1">
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                        {item.name}
                      </h5>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatBytes(item.originalSize)}</span>
                        <span>➔</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {item.compressedSize ? formatBytes(item.compressedSize) : '...'}
                        </span>
                        {item.status === 'done' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            {savings}
                          </span>
                        )}
                        {item.compressedWidth && item.compressedHeight && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({item.compressedWidth} × {item.compressedHeight}px)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setInspectingItem(item)}
                      disabled={!item.compressedPreviewUrl}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-40"
                      title={isEn ? 'Compare Split Curtain' : 'مقایسه پرده‌ای قبل و بعد'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      disabled={!item.compressedBlob}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-40"
                      title={isEn ? 'Copy to clipboard' : 'کپی در کلیپ‌بورد'}
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(item)}
                      disabled={!item.compressedBlob}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors disabled:opacity-40 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Download' : 'دانلود'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title={isEn ? 'Remove' : 'حذف'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Split Curtain Modal for Before/After Inspection */}
      {inspectingItem && inspectingItem.compressedPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>{isEn ? 'Split Comparison Slider' : 'مقایسه پرده‌ای قبل و بعد'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {isEn ? 'Drag the vertical divider to compare visual fidelity.' : 'خط عمودی وسط را بکشید تا تفاوت وضوح تصویر را مقایسه کنید.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Screen Container */}
            <div
              ref={splitContainerRef}
              className="relative w-full flex-1 min-h-[350px] max-h-[500px] bg-slate-950 rounded-2xl overflow-hidden select-none cursor-ew-resize flex items-center justify-center"
              onMouseDown={() => setIsDraggingSplit(true)}
              onTouchStart={() => setIsDraggingSplit(true)}
            >
              {/* After (Compressed) - Base Layer */}
              <img
                src={inspectingItem.compressedPreviewUrl}
                alt="Optimized"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Before (Original) - Clipped Overlay */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
              >
                <img
                  src={inspectingItem.originalPreviewUrl}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              </div>

              {/* Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl pointer-events-none"
                style={{ left: `${splitPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center font-bold text-xs">
                  ↔
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-black/60 text-white text-xs font-semibold backdrop-blur-xs pointer-events-none">
                {isEn ? 'Original' : 'اصلی'}: {formatBytes(inspectingItem.originalSize)}
              </div>
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-emerald-600/80 text-white text-xs font-semibold backdrop-blur-xs pointer-events-none">
                {isEn ? 'Optimized' : 'فشرده‌شده'}: {formatBytes(inspectingItem.compressedSize || 0)}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-mono">
                {inspectingItem.compressedWidth} × {inspectingItem.compressedHeight}px
              </span>
              <button
                type="button"
                onClick={() => handleDownloadSingle(inspectingItem)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isEn ? 'Download Optimized Image' : 'دانلود تصویر بهینه‌شده'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

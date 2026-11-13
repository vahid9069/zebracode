'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Upload,
  Download,
  RefreshCw,
  FileImage,
  Sparkles,
  Trash2,
  Archive,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Check,
  Clipboard,
  Layers,
} from 'lucide-react';
import type {
  ConverterFileItem,
  ConverterTransformOptions,
  TargetImageFormat,
} from '@/lib/image-converter/types';
import {
  convertImage,
  copyConvertedImageToClipboard,
  createConvertedZipBundle,
  createConverterSample,
  DEFAULT_CONVERTER_OPTIONS,
  downloadConvertedBlob,
  formatBytes,
  getConverterImageMetadata,
  getFormatExtension,
  SUPPORTED_TARGET_FORMATS,
} from '@/lib/image-converter/converter';

interface ImageConverterProps {
  locale?: 'fa' | 'en';
  dict?: any;
}

export function ImageConverter({ locale = 'fa', dict }: ImageConverterProps) {
  const isEn = locale === 'en';

  const [settings, setSettings] = useState<ConverterTransformOptions>(DEFAULT_CONVERTER_OPTIONS);
  const [items, setItems] = useState<ConverterFileItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aggregate metrics
  const completedCount = useMemo(() => items.filter((i) => i.status === 'done').length, [items]);
  const totalOriginalBytes = useMemo(() => items.reduce((acc, curr) => acc + curr.originalSize, 0), [items]);
  const totalConvertedBytes = useMemo(
    () => items.reduce((acc, curr) => acc + (curr.convertedSize || curr.originalSize), 0),
    [items]
  );

  // Process single image
  const processItem = useCallback(
    async (item: ConverterFileItem, activeSettings: ConverterTransformOptions) => {
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'converting', errorMessage: undefined } : it))
      );

      try {
        const itemSettings: ConverterTransformOptions = {
          ...activeSettings,
          ...(item.customSettings || {}),
        };

        const result = await convertImage(item.file, itemSettings);

        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== item.id) return it;
            return {
              ...it,
              status: 'done',
              convertedBlob: result.blob,
              convertedSize: result.size,
              convertedWidth: result.width,
              convertedHeight: result.height,
              convertedMimeType: result.mimeType,
              convertedPreviewUrl: result.previewUrl,
              durationMs: result.durationMs,
            };
          })
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'error', errorMessage: err?.message || 'Conversion failed' }
              : it
          )
        );
      }
    },
    []
  );

  // Process queue
  const processQueue = useCallback(
    async (fileItems: ConverterFileItem[], activeSettings: ConverterTransformOptions) => {
      setIsProcessingQueue(true);
      for (const it of fileItems) {
        await processItem(it, activeSettings);
      }
      setIsProcessingQueue(false);
    },
    [processItem]
  );

  // Add files
  const handleAddFiles = useCallback(
    async (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter(
        (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|bmp|svg|ico|gif)$/i.test(f.name)
      );

      if (validFiles.length === 0) return;

      const newItems: ConverterFileItem[] = [];

      for (const file of validFiles) {
        try {
          const meta = await getConverterImageMetadata(file);
          const previewUrl = URL.createObjectURL(file);
          newItems.push({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            file,
            name: file.name,
            originalSize: file.size,
            originalWidth: meta.width,
            originalHeight: meta.height,
            originalMimeType: meta.mimeType,
            originalPreviewUrl: previewUrl,
            status: 'idle',
          });
        } catch {
          const previewUrl = URL.createObjectURL(file);
          newItems.push({
            id: `${file.name}-${Date.now()}`,
            file,
            name: file.name,
            originalSize: file.size,
            originalWidth: 0,
            originalHeight: 0,
            originalMimeType: file.type || 'image/jpeg',
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

  // Re-run conversion when format/settings change
  const handleFormatChange = (fmt: TargetImageFormat) => {
    const next: ConverterTransformOptions = { ...settings, targetFormat: fmt };
    setSettings(next);
    if (items.length > 0) {
      processQueue(items, next);
    }
  };

  const handleReconvertAll = () => {
    if (items.length === 0) return;
    processQueue(items, settings);
  };

  const handleDownloadSingle = (item: ConverterFileItem) => {
    if (!item.convertedBlob) return;
    const ext = getFormatExtension(settings.targetFormat);
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    downloadConvertedBlob(item.convertedBlob, `${baseName}-converted.${ext}`);
  };

  const handleDownloadZip = async () => {
    if (completedCount === 0 || isZipping) return;
    setIsZipping(true);
    try {
      const completed = items.filter((i) => i.status === 'done' && i.convertedBlob);
      const zipBlob = await createConvertedZipBundle(completed, settings.targetFormat);
      downloadConvertedBlob(zipBlob, `zebracode-converted-images-${Date.now()}.zip`);
    } catch (err) {
      console.error('ZIP creation failed', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.originalPreviewUrl) URL.revokeObjectURL(item.originalPreviewUrl);
      if (item?.convertedPreviewUrl) URL.revokeObjectURL(item.convertedPreviewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.originalPreviewUrl) URL.revokeObjectURL(item.originalPreviewUrl);
      if (item.convertedPreviewUrl) URL.revokeObjectURL(item.convertedPreviewUrl);
    });
    setItems([]);
  };

  const handleLoadSample = async () => {
    const sample = await createConverterSample();
    handleAddFiles([sample]);
  };

  const handleCopy = async (item: ConverterFileItem) => {
    if (!item.convertedBlob) return;
    const ok = await copyConvertedImageToClipboard(item.convertedBlob);
    if (ok) {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

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
          accept="image/*,.svg,.bmp,.ico"
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
              {isEn ? 'Drop your images here or click to browse' : 'تصاویر خود را اینجا رها کنید یا کلیک نمایید'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isEn
                ? 'Convert SVG, PNG, JPG, WebP, AVIF, BMP, and Favicon ICO in real-time.'
                : 'تبدیل سریع انواع فرمت‌های SVG، PNG، JPG، WebP، AVIF، BMP و Favicon ICO بدون آپلود به سرور.'}
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
              {isEn ? 'Try Sample SVG' : 'تست با وکتور SVG نمونه'}
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel: Target Format, Quality & Transformations */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {isEn ? 'Target Format & Settings' : 'انتخاب فرمت مقصد و تنظیمات تصویر'}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleReconvertAll}
            disabled={items.length === 0 || isProcessingQueue}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-sm self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessingQueue ? 'animate-spin' : ''}`} />
            {isEn ? 'Reconvert All' : 'تبدیل مجدد همه'}
          </button>
        </div>

        {/* Format Grid Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isEn ? 'Target Format:' : 'فرمت مقصد جهت تبدیل:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {SUPPORTED_TARGET_FORMATS.map((f) => {
              const active = settings.targetFormat === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFormatChange(f.id)}
                  className={`p-3.5 rounded-2xl border text-start transition-all flex flex-col justify-between ${
                    active
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-black text-sm uppercase">{f.label}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {isEn ? f.descEn : f.descFa}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality and Retina Scale options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Quality Slider (for JPG, WebP, AVIF) */}
          {['jpeg', 'webp', 'avif'].includes(settings.targetFormat) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>{isEn ? 'Output Quality:' : 'کیفیت تصویر خروجی:'}</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {Math.round(settings.quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(settings.quality * 100)}
                onChange={(e) => {
                  const val = parseInt(e.target.value) / 100;
                  setSettings((prev) => ({ ...prev, quality: val }));
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          )}

          {/* SVG Raster Scale (1x, 2x Retina, 4x Ultra) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isEn ? 'SVG Vector Raster Scale:' : 'کیفیت رندرسازی وکتورهای SVG:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1, label: '1x (Standard)' },
                { val: 2, label: '2x (Retina HD)' },
                { val: 4, label: '4x (Ultra 4K)' },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, scaleMultiplier: s.val }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    settings.scaleMultiplier === s.val
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Image Transformations: Rotate, Flip, Grayscale */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            {isEn ? 'Transformations & Filters:' : 'چرخش، معکوس‌سازی و فیلترها:'}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({ ...prev, rotationAngle: ((prev.rotationAngle + 90) % 360) as any }))
              }
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                settings.rotationAngle > 0
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isEn ? `Rotate (${settings.rotationAngle}°)` : `چرخش (${settings.rotationAngle} درجه)`}</span>
            </button>

            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, flipHorizontal: !prev.flipHorizontal }))}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                settings.flipHorizontal
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>{isEn ? 'Flip Horizontal' : 'معکوس افقی'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, flipVertical: !prev.flipVertical }))}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                settings.flipVertical
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <FlipVertical className="w-3.5 h-3.5" />
              <span>{isEn ? 'Flip Vertical' : 'معکوس عمودی'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, grayscale: !prev.grayscale }))}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                settings.grayscale
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isEn ? 'Grayscale (Black & White)' : 'سیاه و سفید'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Bar */}
      {items.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 text-center md:text-start">
            <div>
              <span className="text-xs text-blue-100 block">{isEn ? 'Total Files' : 'تعداد فایل‌ها'}</span>
              <span className="text-2xl font-black">{items.length}</span>
            </div>
            <div className="h-8 w-px bg-blue-400/40 hidden sm:block" />
            <div>
              <span className="text-xs text-blue-100 block">{isEn ? 'Target Format' : 'فرمت خروجی'}</span>
              <span className="text-2xl font-black uppercase">{settings.targetFormat}</span>
            </div>
            <div className="h-8 w-px bg-blue-400/40 hidden sm:block" />
            <div>
              <span className="text-xs text-blue-100 block">{isEn ? 'Converted Size' : 'حجم کل خروجی'}</span>
              <span className="text-2xl font-black">{formatBytes(totalConvertedBytes)}</span>
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
              <span>{isEn ? 'Download All as ZIP' : 'دانلود همه (فایل ZIP)'}</span>
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
            <span>{isEn ? 'Converted Images' : 'تصاویر تبدیل‌شده'}</span>
            <span className="text-xs text-slate-400 font-mono">({items.length})</span>
          </h4>

          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                    <img
                      src={item.convertedPreviewUrl || item.originalPreviewUrl}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                    {item.status === 'converting' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                      {item.name}
                    </h5>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatBytes(item.originalSize)}</span>
                      <span>➔</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 font-mono uppercase">
                        {settings.targetFormat}
                      </span>
                      {item.convertedSize && (
                        <span className="font-mono">({formatBytes(item.convertedSize)})</span>
                      )}
                      {item.convertedWidth && item.convertedHeight && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          [{item.convertedWidth} × {item.convertedHeight} px]
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  {settings.targetFormat === 'png' && (
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      disabled={!item.convertedBlob}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-40"
                      title={isEn ? 'Copy PNG to clipboard' : 'کپی تصویر در کلیپ‌بورد'}
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(item)}
                    disabled={!item.convertedBlob}
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

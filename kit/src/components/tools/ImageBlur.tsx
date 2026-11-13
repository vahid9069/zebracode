'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  EyeOff,
  RotateCcw,
  Undo2,
  Sliders,
  Grid3X3,
  Square,
  Sparkles,
  Check,
  Clipboard,
  Layers,
} from 'lucide-react';

interface ImageBlurProps {
  locale?: 'fa' | 'en';
  dict?: any;
}

type CensorMode = 'pixelate' | 'blur' | 'blackout';

export function ImageBlur({ locale = 'fa', dict }: ImageBlurProps) {
  const isEn = locale === 'en';

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [censorMode, setCensorMode] = useState<CensorMode>('blur');
  const [intensity, setIntensity] = useState<number>(15);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      const img = new Image();
      img.onload = () => {
        setImgElement(img);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const setupCanvas = useCallback(() => {
    if (!imgElement || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(imgElement, 0, 0);

    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialData]);
  }, [imgElement]);

  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  const saveStateForUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), data]);
  };

  const applyCensorToRect = (x: number, y: number, w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rx = Math.round(w < 0 ? x + w : x);
    const ry = Math.round(h < 0 ? y + h : y);
    const rw = Math.round(Math.abs(w));
    const rh = Math.round(Math.abs(h));

    if (rw <= 2 || rh <= 2) return;

    saveStateForUndo();

    if (censorMode === 'blackout') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(rx, ry, rw, rh);
      return;
    }

    if (censorMode === 'pixelate') {
      const blockSize = Math.max(4, Math.round(intensity * 1.5));
      const imgData = ctx.getImageData(rx, ry, rw, rh);
      const data = imgData.data;

      for (let py = 0; py < rh; py += blockSize) {
        for (let px = 0; px < rw; px += blockSize) {
          const sampleI = (py * rw + px) * 4;
          const r = data[sampleI];
          const g = data[sampleI + 1];
          const b = data[sampleI + 2];

          for (let subY = 0; subY < blockSize && py + subY < rh; subY++) {
            for (let subX = 0; subX < blockSize && px + subX < rw; subX++) {
              const i = ((py + subY) * rw + (px + subX)) * 4;
              data[i] = r;
              data[i + 1] = g;
              data[i + 2] = b;
            }
          }
        }
      }
      ctx.putImageData(imgData, rx, ry);
      return;
    }

    if (censorMode === 'blur') {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      const downscale = Math.max(0.02, 1 / (intensity * 0.8));
      const downW = Math.max(1, Math.floor(rw * downscale));
      const downH = Math.max(1, Math.floor(rh * downscale));

      tempCanvas.width = downW;
      tempCanvas.height = downH;

      tempCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, downW, downH);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(tempCanvas, 0, 0, downW, downH, rx, ry, rw, rh);
    }
  };

  const applyBlurToEntireImage = () => {
    if (!canvasRef.current) return;
    saveStateForUndo();
    applyCensorToRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleUndo = () => {
    if (history.length <= 1 || !canvasRef.current) return;
    const previous = history[history.length - 2];
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.putImageData(previous, 0, 0);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    if (!history[0] || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.putImageData(history[0], 0, 0);
    setHistory([history[0]]);
  };

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setStartPoint(coords);
    setCurrentPoint(coords);
    setIsSelecting(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isSelecting) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setCurrentPoint(coords);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isSelecting || !startPoint || !currentPoint) {
      setIsSelecting(false);
      return;
    }
    const w = currentPoint.x - startPoint.x;
    const h = currentPoint.y - startPoint.y;
    applyCensorToRect(startPoint.x, startPoint.y, w, h);

    setIsSelecting(false);
    setStartPoint(null);
    setCurrentPoint(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'censored-blurred-image.png';
    link.click();
  };

  const handleCopy = () => {
    const canvas = canvasRef.current;
    if (!canvas || !navigator.clipboard) return;
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.warn('Copy failed', err);
        }
      }
    });
  };

  const handleLoadSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 700;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 700);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 700);

    // Mock Credit Card / Secret Document
    ctx.fillStyle = '#334155';
    ctx.roundRect?.(200, 150, 800, 400, 24);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('CONFIDENTIAL DOCUMENT / اسناد محرمانه', 250, 240);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('Card: 5022 2910 8834 1928', 250, 320);
    ctx.fillText('API Secret: sk_live_9482740192384', 250, 380);
    ctx.fillText('Phone: +98 912 345 6789', 250, 440);

    const src = canvas.toDataURL('image/png');
    setImageSrc(src);
    const img = new Image();
    img.onload = () => setImgElement(img);
    img.src = src;
  };

  const getSelectionBoxStyle = () => {
    if (!isSelecting || !startPoint || !currentPoint || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    const x1 = Math.min(startPoint.x, currentPoint.x) * scaleX;
    const y1 = Math.min(startPoint.y, currentPoint.y) * scaleY;
    const w = Math.abs(currentPoint.x - startPoint.x) * scaleX;
    const h = Math.abs(currentPoint.y - startPoint.y) * scaleY;

    return {
      left: `${x1}px`,
      top: `${y1}px`,
      width: `${w}px`,
      height: `${h}px`,
    };
  };

  const selectionBoxStyle = getSelectionBoxStyle();

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {!imageSrc ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-10 sm:p-14 text-center cursor-pointer bg-white/50 dark:bg-slate-900/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 shadow-sm transition-all group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-inner">
            <EyeOff className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEn ? 'Select an image to blur, censor, or pixelate' : 'انتخاب تصویر جهت مات‌کردن، سانسور یا شطرنجی'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {isEn
              ? 'Easily hide sensitive info, faces, phone numbers, or credit cards directly in your browser.'
              : 'مخفی‌سازی اطلاعات حساس، شماره کارت، چهره افراد و پیام‌های خصوصی با انتخاب محدوده دلخواه بدون ارسال به سرور.'}
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
              {isEn ? 'Try Sample Sensitive Image' : 'تست با تصویر اطلاعات نمونه'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Censor Mode Selector */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'blur', label: isEn ? 'Blur' : 'مات و محو', icon: EyeOff },
                  { id: 'pixelate', label: isEn ? 'Pixelate' : 'شطرنجی (پیکسل)', icon: Grid3X3 },
                  { id: 'blackout', label: isEn ? 'Blackout' : 'کادر سیاه', icon: Square },
                ].map((m) => {
                  const Icon = m.icon;
                  const active = censorMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCensorMode(m.id as CensorMode)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Undo / Reset Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={history.length <= 1}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-40"
                  title={isEn ? 'Undo' : 'بازگشت یک مرحله'}
                >
                  <Undo2 className="w-4 h-4" />
                  <span>{isEn ? 'Undo' : 'بازگشت'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  title={isEn ? 'Reset to original' : 'بازنشانی کامل'}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isEn ? 'Reset' : 'شروع مجدد'}</span>
                </button>

                <button
                  type="button"
                  onClick={applyBlurToEntireImage}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Sliders className="w-4 h-4" />
                  <span>{isEn ? 'Blur All' : 'مات‌کردن کل عکس'}</span>
                </button>
              </div>
            </div>

            {/* Intensity Slider */}
            {censorMode !== 'blackout' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isEn ? 'Blur / Pixel Intensity:' : 'میزان شدت مات‌شدن یا اندازه پیکسل‌ها:'}
                </span>
                <div className="flex items-center gap-3 w-full sm:w-64">
                  <input
                    type="range"
                    min={5}
                    max={40}
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-blue-600 w-8">{intensity}</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Canvas Workspace */}
          <div className="bg-slate-950/5 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 text-center space-y-4">
            <span className="text-xs text-slate-500 font-semibold block">
              {isEn ? 'Click and drag on any part of the image to apply censor effect:' : 'با کلیک و کشیدن ماوس (یا لمس)، روی بخش‌های مورد نظر کادر بکشید تا سانسور شوند:'}
            </span>

            <div className="relative inline-block overflow-hidden rounded-2xl shadow-md border border-slate-300 dark:border-slate-700 max-w-full select-none touch-none">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="max-h-[500px] w-auto max-w-full cursor-crosshair block"
              />

              {/* Selection box indicator */}
              {selectionBoxStyle && (
                <div
                  style={selectionBoxStyle}
                  className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
                />
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{isEn ? 'Download Censored Image (PNG)' : 'دانلود تصویر سانسورشده (PNG)'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                title={isEn ? 'Copy image' : 'کپی تصویر'}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                <span>{copied ? (isEn ? 'Copied!' : 'کپی شد!') : (isEn ? 'Copy' : 'کپی')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImageSrc(null);
                  setImgElement(null);
                  setHistory([]);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                {isEn ? 'Choose Another Photo' : 'تصویر جدید'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

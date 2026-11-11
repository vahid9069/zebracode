'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, EyeOff, RotateCcw, Undo2, Sliders, Grid3X3, Square, Sparkles } from 'lucide-react';

type CensorMode = 'pixelate' | 'blur' | 'blackout';

export function ImageBlur() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [censorMode, setCensorMode] = useState<CensorMode>('blur');
  const [intensity, setIntensity] = useState<number>(15); // شدت مات‌شدن یا اندازه پیکسل‌ها
  const [history, setHistory] = useState<ImageData[]>([]);

  // انتخاب مستطیلی با ماوس
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

  // رسم تصویر روی بوم به محض بارگذاری
  const setupCanvas = useCallback(() => {
    if (!imgElement || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(imgElement, 0, 0);

    // ذخیره وضعیت اولیه در تاریخچه
    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialData]);
  }, [imgElement]);

  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  // ذخیره وضعیت قبل از اعمال فیلتر برای Undo
  const saveStateForUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), data]); // نگه‌داری تا ۱۰ گام گذشته
  };

  // اعمال سانسور روی محدوده مستطیل
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
      // ایجاد افکت مات روان از طریق کوچک و بزرگ کردن ناحیه
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      const downscale = Math.max(0.02, 1 / (intensity * 0.8));
      const downW = Math.max(1, Math.floor(rw * downscale));
      const downH = Math.max(1, Math.floor(rh * downscale));

      tempCanvas.width = downW;
      tempCanvas.height = downH;

      // ترسیم نسخه مینیاتوری تار شده
      tempCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, downW, downH);

      // برگرداندن به ابعاد اصلی با اعمال انترپولاسیون تار
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(tempCanvas, 0, 0, downW, downH, rx, ry, rw, rh);
    }
  };

  // مات کردن کل تصویر
  const applyBlurToEntireImage = () => {
    if (!canvasRef.current) return;
    saveStateForUndo();
    applyCensorToRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // بازگشت به یک مرحله قبل (Undo)
  const handleUndo = () => {
    if (history.length <= 1 || !canvasRef.current) return;
    const previous = history[history.length - 2];
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.putImageData(previous, 0, 0);
    setHistory((prev) => prev.slice(0, -1));
  };

  // بازنشانی کامل به تصویر اول
  const handleReset = () => {
    if (!history[0] || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.putImageData(history[0], 0, 0);
    setHistory([history[0]]);
  };

  // محاسبه مختصات واقعی روی Canvas از رویداد ماوس یا لمس
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

  // ابعاد کادر پیش‌نمایش هنگام کشیدن ماوس
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
    <div className="space-y-6">
      {!imageSrc ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-12 text-center cursor-pointer bg-white dark:bg-slate-900 shadow-sm transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <EyeOff className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            تصویر مورد نظر را انتخاب یا اینجا رها کنید
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            مات کردن چهره، پلاک ماشین، اطلاعات حساس بانکی و شخصی به صورت ۱۰۰٪ امن در مرورگر
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* نوار تنظیمات ابزار سانسور */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            {/* انتخاب حالت سانسور */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setCensorMode('blur')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  censorMode === 'blur'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                مات روان (Blur)
              </button>
              <button
                onClick={() => setCensorMode('pixelate')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  censorMode === 'pixelate'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                شطرنجی (Pixelate)
              </button>
              <button
                onClick={() => setCensorMode('blackout')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  censorMode === 'blackout'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                نوار مشکی
              </button>
            </div>

            {/* اسلایدر شدت */}
            {censorMode !== 'blackout' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">شدت:</span>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="w-24 sm:w-32 accent-blue-600 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 w-6">
                  {intensity}
                </span>
              </div>
            )}

            {/* دکمه‌های اقدام */}
            <div className="flex items-center gap-2">
              <button
                onClick={applyBlurToEntireImage}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                title="مات کردن یکدست تمام تصویر"
              >
                مات کردن کل تصویر
              </button>
              <button
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                title="مرحله قبل (Undo)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                title="بازنشانی تصویر اولیه"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                دانلود تصویر
              </button>
              <button
                onClick={() => {
                  setImageSrc(null);
                  setImgElement(null);
                  setHistory([]);
                }}
                className="text-xs text-rose-500 hover:underline px-2"
              >
                تعویض عکس
              </button>
            </div>
          </div>

          {/* راهنمای تعاملی */}
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-2.5 rounded-xl text-center">
            با کشیدن ماوس (یا انگشت روی صفحه لمسی) یک کادر روی نقطه مورد نظر بکشید تا فوراً مات شود.
          </div>

          {/* بوم نمایش با کادر پیش‌نمایش زنده */}
          <div className="relative bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-auto max-h-[75vh] flex items-center justify-center select-none">
            <div className="relative inline-block">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="max-w-full h-auto cursor-crosshair rounded-lg shadow-md border touch-none block"
              />

              {/* کادر انتخابی تعاملی هنگام درگ کردن */}
              {selectionBoxStyle && (
                <div
                  className="absolute pointer-events-none border-2 border-dashed border-blue-500 bg-blue-500/20 rounded shadow-sm"
                  style={selectionBoxStyle}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

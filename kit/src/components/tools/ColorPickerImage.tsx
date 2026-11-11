'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Pipette, Upload, Copy, Check, Image as ImageIcon, Sparkles, Trash2 } from 'lucide-react';

interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
}

export function ColorPickerImage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<ColorInfo>({
    hex: '#2563EB',
    rgb: 'rgb(37, 99, 235)',
    hsl: 'hsl(221, 83%, 53%)',
  });
  const [palette, setPalette] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // تنظیم اندازه canvas متناسب با تصویر ولی محدود به حداکثر عرض
      const maxW = 800;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // استخراج پالت رنگ‌های غالب (نمونه‌برداری شبکه‌ای)
      extractPalette(ctx, canvas.width, canvas.height);
    };
  }, [imageSrc]);

  const extractPalette = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imgData = ctx.getImageData(0, 0, width, height).data;
    const colorCounts: Record<string, number> = {};

    // نمونه‌برداری هر ۲۰ پیکسل
    for (let i = 0; i < imgData.length; i += 4 * 20) {
      const r = Math.round(imgData[i] / 32) * 32;
      const g = Math.round(imgData[i + 1] / 32) * 32;
      const b = Math.round(imgData[i + 2] / 32) * 32;
      const hex = rgbToHex(Math.min(255, r), Math.min(255, g), Math.min(255, b));
      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    }

    const sorted = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([hex]) => hex);

    setPalette(sorted);
  };

  const pickColorFromCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const hex = rgbToHex(r, g, b);
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const hsl = rgbToHsl(r, g, b);

    setPickedColor({ hex, rgb, hsl });
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* باکس بارگذاری تصویر */}
      {!imageSrc ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-12 text-center cursor-pointer transition-all bg-white dark:bg-slate-900 shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            تصویر مورد نظر را اینجا بکشید یا برای انتخاب کلیک کنید
          </h3>
          <p className="text-xs text-slate-400 mt-1">پشتیبانی از فرمت‌های PNG، JPG، WebP، SVG بدون ارسال به سرور</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* نوار بالایی ابزار با رنگ انتخاب شده */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div
                className="w-16 h-16 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md shrink-0 transition-colors"
                style={{ backgroundColor: pickedColor.hex }}
              />
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Pipette className="w-3.5 h-3.5" />
                  رنگ انتخابی:
                </span>
                <div className="font-mono font-black text-xl text-slate-900 dark:text-white" dir="ltr">
                  {pickedColor.hex}
                </div>
              </div>
            </div>

            {/* کدهای رنگ با دکمه کپی */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleCopy(pickedColor.hex, 'hex')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold hover:bg-slate-100 transition-colors"
              >
                {copiedKey === 'hex' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{pickedColor.hex}</span>
              </button>
              <button
                onClick={() => handleCopy(pickedColor.rgb, 'rgb')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold hover:bg-slate-100 transition-colors"
              >
                {copiedKey === 'rgb' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{pickedColor.rgb}</span>
              </button>
              <button
                onClick={() => handleCopy(pickedColor.hsl, 'hsl')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold hover:bg-slate-100 transition-colors"
              >
                {copiedKey === 'hsl' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{pickedColor.hsl}</span>
              </button>

              <button
                onClick={() => setImageSrc(null)}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="تغییر یا حذف تصویر"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* پالت رنگ‌های غالب استخراج شده */}
          {palette.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>پالت رنگ‌های اصلی و غالب استخراج شده از تصویر:</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {palette.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopy(color, `pal-${idx}`)}
                    className="group relative flex flex-col items-center gap-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:scale-105 transition-all"
                  >
                    <div
                      className="w-full h-10 rounded-lg shadow-inner"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-blue-600">
                      {copiedKey === `pal-${idx}` ? 'کپی شد' : color}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* بوم نمایش تصویر تعاملی (Canvas) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm overflow-hidden flex flex-col items-center">
            <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
              <Pipette className="w-3.5 h-3.5" />
              روی هر نقطه از عکس کلیک کنید تا کد رنگ آن استخراج شود:
            </p>
            <div className="max-w-full overflow-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <canvas
                ref={canvasRef}
                onClick={pickColorFromCanvas}
                className="cursor-crosshair max-w-full h-auto block"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

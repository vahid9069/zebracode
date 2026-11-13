'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pipette,
  Upload,
  Copy,
  Check,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Code,
  Download,
} from 'lucide-react';

interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
}

interface ColorPickerImageProps {
  locale?: 'fa' | 'en';
  dict?: any;
}

export function ColorPickerImage({ locale = 'fa', dict }: ColorPickerImageProps) {
  const isEn = locale === 'en';

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<ColorInfo>({
    hex: '#2563EB',
    rgb: 'rgb(37, 99, 235)',
    hsl: 'hsl(221, 83%, 53%)',
  });
  const [palette, setPalette] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Loupe magnifier state
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number; hoverColor: string } | null>(null);

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

  const extractPalette = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imgData = ctx.getImageData(0, 0, width, height).data;
    const colorCounts: Record<string, number> = {};

    for (let i = 0; i < imgData.length; i += 4 * 16) {
      const r = Math.round(imgData[i] / 24) * 24;
      const g = Math.round(imgData[i + 1] / 24) * 24;
      const b = Math.round(imgData[i + 2] / 24) * 24;
      const a = imgData[i + 3];
      if (a > 128) {
        const hex = rgbToHex(Math.min(255, r), Math.min(255, g), Math.min(255, b));
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }
    }

    const sorted = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([hex]) => hex);

    setPalette(sorted);
  };

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const maxW = 900;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      extractPalette(ctx, canvas.width, canvas.height);
    };
  }, [imageSrc]);

  const getColorAtEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const hex = rgbToHex(r, g, b);
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const hsl = rgbToHsl(r, g, b);

    return { hex, rgb, hsl, clientX: e.clientX, clientY: e.clientY };
  };

  const pickColorFromCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const color = getColorAtEvent(e);
    if (color) {
      setPickedColor({ hex: color.hex, rgb: color.rgb, hsl: color.hsl });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const color = getColorAtEvent(e);
    if (color) {
      setHoverCoords({ x: color.clientX, y: color.clientY, hoverColor: color.hex });
    } else {
      setHoverCoords(null);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleNativeEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          const hex = result.sRGBHex.toUpperCase();
          const r = parseInt(hex.slice(1, 3), 16) || 0;
          const g = parseInt(hex.slice(3, 5), 16) || 0;
          const b = parseInt(hex.slice(5, 7), 16) || 0;
          setPickedColor({
            hex,
            rgb: `rgb(${r}, ${g}, ${b})`,
            hsl: rgbToHsl(r, g, b),
          });
        }
      } catch {
        // User cancelled eye dropper
      }
    }
  };

  const handleCopyPaletteCss = () => {
    const css = palette.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n');
    handleCopy(`:root {\n${css}\n}`, 'css');
  };

  const handleLoadSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 700;
    const ctx = canvas.getContext('2d')!;

    // Sunset gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 700);
    grad.addColorStop(0, '#f97316');
    grad.addColorStop(0.3, '#ec4899');
    grad.addColorStop(0.6, '#8b5cf6');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 700);

    // Decorative circles
    const colors = ['#fde047', '#38bdf8', '#4ade80', '#fb7185', '#a855f7'];
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(200 + i * 200, 350 + (i % 2 === 0 ? 50 : -50), 90, 0, Math.PI * 2);
      ctx.fill();
    });

    const src = canvas.toDataURL('image/png');
    setImageSrc(src);
  };

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {!imageSrc ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all bg-white/50 dark:bg-slate-900/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 shadow-sm group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-inner">
            <Pipette className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEn ? 'Upload an image to pick colors & extract dominant palette' : 'آپلود تصویر جهت استخراج کد رنگ و پالت رنگ‌های اصلی'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {isEn
              ? 'Click anywhere on the photo to extract HEX, RGB, and HSL codes, or copy the auto-generated color palette.'
              : 'قطره‌چکان آنلاین برای استخراج کدهای HEX، RGB و HSL با کلیک روی هر نقطه و ساخت پالت اختصاصی رنگ‌ها.'}
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
              {isEn ? 'Try Sample Color Palette Image' : 'تست با تصویر رنگارنگ نمونه'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Picked Color Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div
                className="w-16 h-16 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md shrink-0 transition-colors"
                style={{ backgroundColor: pickedColor.hex }}
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Pipette className="w-3.5 h-3.5 text-blue-600" />
                  {isEn ? 'Active Selected Color:' : 'رنگ انتخابی:'}
                </span>
                <div className="font-mono font-black text-2xl text-slate-900 dark:text-white" dir="ltr">
                  {pickedColor.hex}
                </div>
              </div>
            </div>

            {/* Formatted Code Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(pickedColor.hex, 'hex')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold hover:border-blue-500 transition-colors"
              >
                {copiedKey === 'hex' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{pickedColor.hex}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopy(pickedColor.rgb, 'rgb')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold hover:border-blue-500 transition-colors"
              >
                {copiedKey === 'rgb' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{pickedColor.rgb}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopy(pickedColor.hsl, 'hsl')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold hover:border-blue-500 transition-colors"
              >
                {copiedKey === 'hsl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{pickedColor.hsl}</span>
              </button>

              {typeof window !== 'undefined' && 'EyeDropper' in window && (
                <button
                  type="button"
                  onClick={handleNativeEyeDropper}
                  className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1"
                  title={isEn ? 'Pick color from anywhere on screen' : 'قطره‌چکان کل صفحه'}
                >
                  <Pipette className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Screen Eyedropper' : 'قطره‌چکان'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setImageSrc(null)}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title={isEn ? 'Change image' : 'حذف و تغییر تصویر'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Extracted Dominant Palette */}
          {palette.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{isEn ? 'Dominant Color Palette:' : 'پالت رنگ‌های اصلی و غالب استخراج شده:'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPaletteCss}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {copiedKey === 'css' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Code className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'css' ? (isEn ? 'Copied CSS!' : 'کپی شد!') : (isEn ? 'Copy CSS Variables' : 'کپی متغیرهای CSS')}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
                {palette.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const r = parseInt(color.slice(1, 3), 16) || 0;
                      const g = parseInt(color.slice(3, 5), 16) || 0;
                      const b = parseInt(color.slice(5, 7), 16) || 0;
                      setPickedColor({
                        hex: color,
                        rgb: `rgb(${r}, ${g}, ${b})`,
                        hsl: rgbToHsl(r, g, b),
                      });
                      handleCopy(color, `pal-${idx}`);
                    }}
                    className="group relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:scale-105 transition-all bg-white dark:bg-slate-900"
                  >
                    <div
                      className="w-full h-12 rounded-xl shadow-inner border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 group-hover:text-blue-600 font-bold">
                      {copiedKey === `pal-${idx}` ? (isEn ? 'Copied' : 'کپی شد') : color}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Canvas Workspace */}
          <div className="bg-slate-950/5 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 text-center space-y-4">
            <span className="text-xs text-slate-500 font-semibold block flex items-center justify-center gap-1.5">
              <Pipette className="w-3.5 h-3.5 text-blue-600" />
              {isEn ? 'Click anywhere on the image to inspect and pick exact color:' : 'روی هر نقطه از تصویر کلیک کنید تا کد رنگ دقیق آن استخراج شود:'}
            </span>

            <div className="relative inline-block overflow-hidden rounded-2xl shadow-lg border border-slate-300 dark:border-slate-700 max-w-full">
              <canvas
                ref={canvasRef}
                onClick={pickColorFromCanvas}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverCoords(null)}
                className="cursor-crosshair max-w-full h-auto block"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, EyeOff, RotateCcw } from 'lucide-react';

export function ImageBlur() {
  const [file, setFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [blurMode, setBlurMode] = useState<'pixelate' | 'blur'>('pixelate');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const image = new Image();
      image.onload = () => {
        setImg(image);
        initCanvas(image);
      };
      image.src = URL.createObjectURL(f);
    }
  };

  const initCanvas = (image: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(image, 0, 0);
  };

  const resetImage = () => {
    if (img) {
      initCanvas(img);
    }
  };

  const applyPixelate = (x: number, y: number, w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blockSize = Math.max(10, Math.floor(Math.min(Math.abs(w), Math.abs(h)) / 10));
    const startX = w < 0 ? x + w : x;
    const startY = h < 0 ? y + h : y;
    const absW = Math.abs(w);
    const absH = Math.abs(h);

    const imgData = ctx.getImageData(startX, startY, absW, absH);
    const data = imgData.data;

    for (let py = 0; py < absH; py += blockSize) {
      for (let px = 0; px < absW; px += blockSize) {
        const i = (py * absW + px) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        for (let subY = 0; subY < blockSize && py + subY < absH; subY++) {
          for (let subX = 0; subX < blockSize && px + subX < absW; subX++) {
            const subI = ((py + subY) * absW + (px + subX)) * 4;
            data[subI] = r;
            data[subI + 1] = g;
            data[subI + 2] = b;
          }
        }
      }
    }
    ctx.putImageData(imgData, startX, startY);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    setStartPos({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
    setIsDrawing(true);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const endX = (e.clientX - rect.left) * scaleX;
    const endY = (e.clientY - rect.top) * scaleY;

    applyPixelate(startPos.x, startPos.y, endX - startPos.x, endY - startPos.y);
    setIsDrawing(false);
    setStartPos(null);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'censored-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-12 text-center cursor-pointer bg-white dark:bg-slate-900 transition-all group">
          <label className="cursor-pointer block">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <EyeOff className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              انتخاب عکس جهت شطرنجی یا مات‌کردن بخش‌های حساس
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              روی تصویر کادر بکشید تا آن بخش فوراً سانسور شود
            </p>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-xs text-slate-600 dark:text-slate-300">
              با ماوس یا لمس، روی بخش‌هایی از عکس که می‌خواهید مخفی شود <strong>کادر بکشید</strong>.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetImage}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                بازنشانی اولیه
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
              >
                <Download className="w-4 h-4" />
                دانلود تصویر نهایی
              </button>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-auto max-h-[70vh] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              className="max-w-full h-auto cursor-crosshair rounded-lg shadow-md border"
            />
          </div>
        </div>
      )}
    </div>
  );
}

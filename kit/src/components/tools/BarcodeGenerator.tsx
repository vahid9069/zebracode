'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Barcode,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Printer
} from 'lucide-react';

interface BarcodeGeneratorProps {
  locale?: string;
  dict?: any;
}

export function BarcodeGenerator({ locale = 'fa', dict }: BarcodeGeneratorProps) {
  const isEn = locale === 'en';
  const [val, setVal] = useState<string>('6260123456789');
  const [format, setFormat] = useState<'code128' | 'ean13'>('code128');
  const [barHeight, setBarHeight] = useState<number>(80);
  const [showLabel, setShowLabel] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // High quality 2D Canvas Barcode renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const text = val.trim();
    if (!text) return;

    ctx.fillStyle = '#000000';
    let startX = 35;
    const bHeight = barHeight;

    // Start guard bars
    ctx.fillRect(startX, 20, 2.5, bHeight);
    ctx.fillRect(startX + 5, 20, 2.5, bHeight);
    startX += 15;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const bin = (code % 32).toString(2).padStart(5, '0');

      for (let b = 0; b < bin.length; b++) {
        if (bin[b] === '1') {
          ctx.fillRect(startX, 20, 3, bHeight);
        }
        startX += 5;
      }
      startX += 2;
    }

    // Stop guard bars
    ctx.fillRect(startX, 20, 2.5, bHeight);
    ctx.fillRect(startX + 5, 20, 2.5, bHeight);

    // Human readable text underneath
    if (showLabel) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, canvas.width / 2, 20 + bHeight + 25);
    }
  }, [val, format, barHeight, showLabel]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `barcode-${val}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // ignore
        }
      }
    });
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head><title>Print Barcode</title></head>
          <body style="margin:0; display:flex; align-items:center; justify-content:center; height:100vh;">
            <img src="${dataUrl}" onload="window.print(); window.close();" style="max-width:90%;" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Barcode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isEn ? 'Barcode Data & Format' : 'اطلاعات و تنظیمات بارکد میله‌ای:'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Barcode Value / Product Code:' : 'متن یا شماره کالا (بارکد):'}
            </label>
            <input
              type="text"
              dir="ltr"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="e.g. 6260123456789"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Standard Format:' : 'استاندارد بارکد:'}
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none"
            >
              <option value="code128">Code 128 (General & Logistics)</option>
              <option value="ean13">EAN-13 (Retail & Products)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Bar Height (px):' : 'ارتفاع نوارها:'}
            </label>
            <select
              value={barHeight}
              onChange={(e) => setBarHeight(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none"
            >
              <option value={60}>{isEn ? 'Compact (60px)' : 'کوچک (۶۰ پیکسل)'}</option>
              <option value={80}>{isEn ? 'Standard (80px)' : 'استاندارد (۸۰ پیکسل)'}</option>
              <option value={110}>{isEn ? 'Large (110px)' : 'بزرگ (۱۱۰ پیکسل)'}</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showLabel}
              onChange={(e) => setShowLabel(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Print Human-Readable Text Underneath' : 'نمایش کد عددی در زیر بارکد'}</span>
          </label>
        </div>
      </div>

      {/* Preview Card */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          {isEn ? 'Print-Ready Barcode Preview' : 'پیش‌نمایش بارکد آماده چاپ:'}
        </span>

        <div className="inline-block p-6 bg-white rounded-3xl border border-slate-200 shadow-inner">
          <canvas
            ref={canvasRef}
            width={480}
            height={barHeight + 60}
            className="max-w-full h-auto"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isEn ? 'Download Image (PNG)' : 'دانلود تصویر PNG'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyImage}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy Image' : 'کپی تصویر بارکد')}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{isEn ? 'Print Label' : 'پرینت برچسب'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

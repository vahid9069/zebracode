'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Barcode, Download, Copy, Check } from 'lucide-react';

export function BarcodeGenerator() {
  const [val, setVal] = useState('123456789012');
  const [format, setFormat] = useState<'code128' | 'ean13'>('code128');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // تولید بارکد میله‌ای ساده روی بوم با استفاده از الگوهای باینری
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const text = val.trim();
    if (!text) return;

    // الگوریتم ساده شبیه‌ساز نوارهای بارکد بر مبنای کاراکترها
    ctx.fillStyle = '#000000';
    let startX = 30;
    const barHeight = 80;

    // خطوط شروع
    ctx.fillRect(startX, 20, 2, barHeight);
    ctx.fillRect(startX + 4, 20, 2, barHeight);
    startX += 12;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const bin = (code % 32).toString(2).padStart(5, '0');

      for (let b = 0; b < bin.length; b++) {
        if (bin[b] === '1') {
          ctx.fillRect(startX, 20, 3, barHeight);
        }
        startX += 5;
      }
      startX += 2;
    }

    // خطوط پایان
    ctx.fillRect(startX, 20, 2, barHeight);
    ctx.fillRect(startX + 4, 20, 2, barHeight);

    // چاپ متن زیر بارکد
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, 120);
  }, [val, format]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `barcode-${val}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          متن یا شماره کالا جهت تولید بارکد میله‌ای:
        </label>

        <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <input
            type="text"
            dir="ltr"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="مثال: 6260123456789"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold tracking-wider"
          />

          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="code128">استاندارد Code 128 (انبارداری و عمومی)</option>
            <option value="ean13">استاندارد EAN-13 (فروشگاهی و کالا)</option>
          </select>
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-5">
        <span className="text-xs font-semibold text-slate-500 block">پیش‌نمایش بارکد آماده چاپ:</span>
        <div className="inline-block p-4 bg-white rounded-xl border shadow-xs">
          <canvas ref={canvasRef} width={400} height={140} className="max-w-full h-auto" />
        </div>

        <div>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            دانلود بارکد با کیفیت تصویر PNG
          </button>
        </div>
      </div>
    </div>
  );
}

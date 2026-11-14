'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Download,
  Crop,
  Sparkles,
  RefreshCw,
  ZoomIn,
  Move,
  Palette,
  Check,
  Clipboard,
  ShieldCheck,
  Circle,
  Square,
} from 'lucide-react';

interface CircleAvatarProps {
  locale?: 'fa' | 'en';
  dict?: any;
}

type AvatarShape = 'circle' | 'squircle' | 'hexagon';

export function CircleAvatar({ locale = 'fa', dict }: CircleAvatarProps) {
  const isEn = locale === 'en';

  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  // Crop & Transform State
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [shape, setShape] = useState<AvatarShape>('circle');

  // Border & Effects
  const [borderWidth, setBorderWidth] = useState<number>(8);
  const [borderColor, setBorderColor] = useState<string>('#3b82f6');
  const [bgColor, setBgColor] = useState<string>('transparent');

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Render canvas
  const renderAvatar = useCallback(() => {
    const img = loadedImgRef.current;
    if (!img) return;

    const size = 600; // High quality 600x600 avatar canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    // Optional background fill
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);
    }

    ctx.save();

    // Shape clipping mask
    const center = size / 2;
    const radius = center - borderWidth;

    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(center, center, radius, 0, Math.PI * 2, true);
    } else if (shape === 'squircle') {
      const r = 120; // Corner radius for squircle
      const x = borderWidth;
      const y = borderWidth;
      const w = size - borderWidth * 2;
      const h = size - borderWidth * 2;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
    } else if (shape === 'hexagon') {
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const hx = center + radius * Math.cos(angle);
        const hy = center + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
    }
    ctx.clip();

    // Draw image centered with zoom & pan
    const scale = Math.max(size / img.width, size / img.height) * zoom;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = center - drawW / 2 + panX;
    const drawY = center - drawH / 2 + panY;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    ctx.restore();

    // Border stroke
    if (borderWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = borderColor;

      if (shape === 'circle') {
        ctx.arc(center, center, center - borderWidth / 2, 0, Math.PI * 2, true);
      } else if (shape === 'squircle') {
        const r = 120;
        const x = borderWidth / 2;
        const y = borderWidth / 2;
        const w = size - borderWidth;
        const h = size - borderWidth;
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
      } else if (shape === 'hexagon') {
        const strokeRadius = center - borderWidth / 2;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 - Math.PI / 6;
          const hx = center + strokeRadius * Math.cos(angle);
          const hy = center + strokeRadius * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
      }
      ctx.stroke();
      ctx.restore();
    }

    canvas.toBlob((blob) => {
      if (blob) {
        if (avatarUrl) URL.revokeObjectURL(avatarUrl);
        setAvatarBlob(blob);
        setAvatarUrl(URL.createObjectURL(blob));
      }
    }, 'image/png');
  }, [borderWidth, borderColor, bgColor, shape, zoom, panX, panY, avatarUrl]);

  useEffect(() => {
    renderAvatar();
  }, [renderAvatar]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const url = URL.createObjectURL(f);
      setImgUrl(url);

      const img = new Image();
      img.onload = () => {
        loadedImgRef.current = img;
        setZoom(1);
        setPanX(0);
        setPanY(0);
        renderAvatar();
      };
      img.src = url;
    }
  };

  const handleLoadSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(400, 350, 50, 400, 400, 400);
    grad.addColorStop(0, '#f43f5e');
    grad.addColorStop(0.5, '#8b5cf6');
    grad.addColorStop(1, '#0ea5e9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 800);

    // Draw mock avatar silhouette
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(400, 320, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(400, 720, 260, 0, Math.PI * 2);
    ctx.fill();

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'avatar-sample.png', { type: 'image/png' });
        setFile(file);
        const url = URL.createObjectURL(file);
        setImgUrl(url);

        const img = new Image();
        img.onload = () => {
          loadedImgRef.current = img;
          setZoom(1);
          setPanX(0);
          setPanY(0);
          renderAvatar();
        };
        img.src = url;
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPanX(e.clientX - dragStartRef.current.x);
    setPanY(e.clientY - dragStartRef.current.y);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCopy = async () => {
    if (!avatarBlob || !navigator.clipboard) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': avatarBlob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  const handleDownload = () => {
    if (!avatarBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(avatarBlob);
    a.download = `avatar-${shape}-600x600.png`;
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
            <Crop className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEn ? 'Upload a photo to create circular profile avatar' : 'آپلود تصویر برای ساخت آواتار گرد و پروفایل'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {isEn
              ? 'Crop circular or squircle avatars for Instagram, Telegram, LinkedIn, and resumes with transparent backgrounds.'
              : 'برش دایره‌ای، مربعی گرد (Squircle) یا شش‌ضلعی با حاشیه رنگی و پس‌زمینه شفاف بدون ارسال به سرور.'}
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
              {isEn ? 'Try Sample Avatar' : 'تست با تصویر نمونه'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel (6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600" />
              <span>{isEn ? 'Avatar Customization' : 'شخصی‌سازی شکل و حاشیه آواتار'}</span>
            </h3>

            {/* Shape Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isEn ? 'Avatar Shape:' : 'فرم و برش آواتار:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'circle', label: isEn ? 'Circle (1:1)' : 'دایره کامل' },
                  { id: 'squircle', label: isEn ? 'Squircle' : 'مربع گرد (iOS)' },
                  { id: 'hexagon', label: isEn ? 'Hexagon' : 'شش‌ضلعی مدرن' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShape(s.id as AvatarShape)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      shape === s.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" />
                  {isEn ? 'Zoom / Scale:' : 'بزرگ‌نمایی تصویر:'}
                </span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Border Width & Color */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{isEn ? 'Border Width:' : 'ضخامت کادر حاشیه:'}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {borderWidth} px
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={borderWidth}
                  onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {borderWidth > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {isEn ? 'Border Color:' : 'رنگ کادر دور آواتار:'}
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#ffffff', '#0f172a'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBorderColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          borderColor === c ? 'scale-125 border-blue-500 shadow-md' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                    ))}
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Reset Pan / New Photo Button */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setPanX(0);
                  setPanY(0);
                  setZoom(1);
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {isEn ? 'Reset Position' : 'بازنشانی کادربندی به مرکز'}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                {isEn ? 'Change Photo' : 'تعویض عکس'}
              </button>
            </div>
          </div>

          {/* Interactive Preview Canvas Area (6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-blue-600" />
                {isEn ? 'Click & Drag to Reposition:' : 'عکس را با موس بکشید تا جابجا شود:'}
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                600 × 600 px (PNG)
              </span>
            </div>

            {/* Drag Container */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto rounded-3xl p-3 bg-slate-950/5 dark:bg-slate-950/50 flex items-center justify-center cursor-grab active:cursor-grabbing select-none border border-slate-200/60 dark:border-slate-800/60"
            >
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="w-full h-full object-contain pointer-events-none drop-shadow-lg"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!avatarBlob}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isEn ? 'Download Avatar (PNG)' : 'دانلود آواتار باکیفیت (PNG)'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={!avatarBlob}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                title={isEn ? 'Copy to clipboard' : 'کپی آواتار'}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                <span>{copied ? (isEn ? 'Copied!' : 'کپی شد!') : (isEn ? 'Copy' : 'کپی')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

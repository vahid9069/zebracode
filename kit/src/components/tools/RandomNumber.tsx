'use client';

import React, { useState } from 'react';
import {
  Binary,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Volume2,
  VolumeX,
  Trash2,
  BarChart2,
  Dice5,
  Dices
} from 'lucide-react';

interface RandomNumberProps {
  locale?: string;
  dict?: any;
}

export function RandomNumber({ locale = 'fa' }: RandomNumberProps) {
  const isEn = locale === 'en';

  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(100);
  const [count, setCount] = useState<number>(1);
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [results, setResults] = useState<number[]>([42]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [history, setHistory] = useState<Array<{ date: string; numbers: number[] }>>([]);

  const playClickSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext might be blocked
    }
  };

  // Secure CSPRNG integer generator in [minVal, maxVal]
  const getSecureRandomInt = (minVal: number, maxVal: number): number => {
    const range = maxVal - minVal + 1;
    if (range <= 1) return minVal;

    if (typeof window !== 'undefined' && window.crypto) {
      const maxUint32 = 0xffffffff;
      const bucketSize = Math.floor(maxUint32 / range) * range;
      const buf = new Uint32Array(1);
      let rand: number;
      do {
        window.crypto.getRandomValues(buf);
        rand = buf[0];
      } while (rand >= bucketSize);
      return minVal + (rand % range);
    }
    return Math.floor(Math.random() * range) + minVal;
  };

  const generateNumbers = () => {
    setIsRolling(true);
    playClickSound();

    setTimeout(() => {
      const minVal = Math.min(min, max);
      const maxVal = Math.max(min, max);
      const range = maxVal - minVal + 1;
      const targetCount = !allowDuplicates ? Math.min(count, range) : count;

      const generated: number[] = [];

      if (!allowDuplicates) {
        const pool = Array.from({ length: range }, (_, i) => minVal + i);
        for (let i = 0; i < targetCount; i++) {
          const randomIndex = getSecureRandomInt(0, pool.length - 1);
          generated.push(pool[randomIndex]);
          pool.splice(randomIndex, 1);
        }
      } else {
        for (let i = 0; i < targetCount; i++) {
          generated.push(getSecureRandomInt(minVal, maxVal));
        }
      }

      if (sortOrder === 'asc') generated.sort((a, b) => a - b);
      if (sortOrder === 'desc') generated.sort((a, b) => b - a);

      setResults(generated);
      setIsRolling(false);

      const timeStr = new Date().toLocaleTimeString(isEn ? 'en-US' : 'fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setHistory((prev) => [{ date: timeStr, numbers: generated }, ...prev.slice(0, 9)]);
    }, 180);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(results.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (pMin: number, pMax: number, pCount: number, pDuplicates = false) => {
    setMin(pMin);
    setMax(pMax);
    setCount(pCount);
    setAllowDuplicates(pDuplicates);
  };

  // Stats calculation
  const sum = results.reduce((acc, curr) => acc + curr, 0);
  const avg = results.length > 0 ? (sum / results.length).toFixed(1) : 0;
  const minResult = results.length > 0 ? Math.min(...results) : 0;
  const maxResult = results.length > 0 ? Math.max(...results) : 0;
  const evenCount = results.filter((n) => n % 2 === 0).length;
  const oddCount = results.length - evenCount;

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isEn ? 'CSPRNG Random Number Generator' : 'تولید عدد تصادفی رمزنگاری‌شده (CSPRNG)'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn
                ? 'True cryptographic entropy for cryptography, giveaways, math, and simulations'
                : 'تولید تصادفی با آنتروپی رمزنگاری بدون سوگیری آماری و کاملاً مستقل'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            soundEnabled
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundEnabled ? (isEn ? 'Sound ON' : 'صدا فعال') : (isEn ? 'Muted' : 'بی‌صدا')}</span>
        </button>
      </div>

      {/* Main Big Result Display */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm text-center space-y-6">
        {results.length === 1 ? (
          <div className="py-4">
            <span className="text-xs font-bold text-slate-400 block mb-2">
              {isEn ? 'Generated Random Number:' : 'عدد تصادفی تولید شده:'}
            </span>
            <div
              className={`text-7xl sm:text-9xl font-black font-mono text-blue-600 dark:text-blue-400 transition-all duration-300 select-all ${
                isRolling ? 'scale-90 opacity-40 blur-sm' : 'scale-100 opacity-100'
              }`}
            >
              {results[0]}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>{isEn ? `Generated List (${results.length} numbers):` : `لیست اعداد تولید شده (${results.length} عدد):`}</span>
              <span>{isEn ? 'Click any number to copy all' : 'برای کپی کلیک کنید'}</span>
            </div>
            <div
              className={`flex flex-wrap items-center justify-center gap-2.5 max-h-64 overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition-all ${
                isRolling ? 'opacity-40 blur-sm' : 'opacity-100'
              }`}
            >
              {results.map((num, idx) => (
                <span
                  key={idx}
                  className="font-mono text-lg sm:text-xl font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={generateNumbers}
            disabled={isRolling}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
            <span>{isEn ? 'Generate Again' : 'تولید مجدد عدد'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (isEn ? 'Copied!' : 'کپی شد') : (isEn ? 'Copy' : 'کپی اعداد')}</span>
          </button>
        </div>

        {/* Statistical Summary when > 1 */}
        {results.length > 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
              <span className="text-slate-400 block">{isEn ? 'Sum' : 'مجموع'}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sum}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
              <span className="text-slate-400 block">{isEn ? 'Average' : 'میانگین'}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{avg}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
              <span className="text-slate-400 block">{isEn ? 'Min' : 'حداقل'}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{minResult}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
              <span className="text-slate-400 block">{isEn ? 'Max' : 'حداکثر'}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{maxResult}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
              <span className="text-slate-400 block">{isEn ? 'Even' : 'زوج'}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{evenCount}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
              <span className="text-slate-400 block">{isEn ? 'Odd' : 'فرد'}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{oddCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Settings & Presets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Settings Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isEn ? 'Generation Settings' : 'تنظیمات بازه و تعداد'}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                {isEn ? 'Minimum (From):' : 'حداقل (از):'}
              </label>
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                {isEn ? 'Maximum (To):' : 'حداکثر (تا):'}
              </label>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                {isEn ? 'Number of Items:' : 'تعداد اعداد:'}
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(500, Number(e.target.value))))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                {isEn ? 'Sort Order:' : 'مرتب‌سازی خروجی:'}
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'none' | 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none"
              >
                <option value="none">{isEn ? 'Random Order' : 'به ترتیب تولید (نامرتب)'}</option>
                <option value="asc">{isEn ? 'Ascending (1 → 100)' : 'صعودی (کوچک به بزرگ)'}</option>
                <option value="desc">{isEn ? 'Descending (100 → 1)' : 'نزولی (بزرگ به کوچک)'}</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none pt-2 border-t border-slate-100 dark:border-slate-800">
            <input
              type="checkbox"
              checked={allowDuplicates}
              onChange={(e) => setAllowDuplicates(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 rounded border-slate-300 dark:border-slate-700"
            />
            <span>{isEn ? 'Allow duplicate numbers' : 'تکرار اعداد مجاز باشد'}</span>
          </label>
        </div>

        {/* Presets Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isEn ? 'Popular Presets' : 'الگوهای پرکاربرد'}
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => applyPreset(1, 6, 1)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-start transition"
            >
              <span className="font-bold block text-slate-800 dark:text-slate-200">
                {isEn ? 'Single Die (1-6)' : 'تاس تکی (۱ تا ۶)'}
              </span>
              <span className="text-[11px] text-slate-400">{isEn ? 'Range: 1 to 6' : 'بازه ۱ تا ۶'}</span>
            </button>

            <button
              onClick={() => applyPreset(1, 20, 1)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-start transition"
            >
              <span className="font-bold block text-slate-800 dark:text-slate-200">
                {isEn ? 'D20 Die (1-20)' : 'تاس بیست‌وجهی D20'}
              </span>
              <span className="text-[11px] text-slate-400">{isEn ? 'For RPGs' : 'بازی‌های رول‌پلینگ'}</span>
            </button>

            <button
              onClick={() => applyPreset(1, 100, 1)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-start transition"
            >
              <span className="font-bold block text-slate-800 dark:text-slate-200">
                {isEn ? 'Percent (1-100)' : 'درصد (۱ تا ۱۰۰)'}
              </span>
              <span className="text-[11px] text-slate-400">{isEn ? 'Standard percentile' : 'استاندارد درصد'}</span>
            </button>

            <button
              onClick={() => applyPreset(0, 255, 1)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-start transition"
            >
              <span className="font-bold block text-slate-800 dark:text-slate-200">
                {isEn ? 'Byte (0-255)' : 'یک بایت (۰ تا ۲۵۵)'}
              </span>
              <span className="text-[11px] text-slate-400">{isEn ? '8-bit binary' : '۸ بیتی برنامه‌نویسی'}</span>
            </button>

            <button
              onClick={() => applyPreset(1, 49, 6, false)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-start transition"
            >
              <span className="font-bold block text-slate-800 dark:text-slate-200">
                {isEn ? 'Lottery (6 of 49)' : 'لاتاری ۶ از ۴۹'}
              </span>
              <span className="text-[11px] text-slate-400">{isEn ? '6 unique numbers' : '۶ عدد بدون تکرار'}</span>
            </button>

            <button
              onClick={() => applyPreset(1000, 9999, 1)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-start transition"
            >
              <span className="font-bold block text-slate-800 dark:text-slate-200">
                {isEn ? '4-Digit PIN' : 'پین ۴ رقمی'}
              </span>
              <span className="text-[11px] text-slate-400">{isEn ? '1000 to 9999' : '۱۰۰۰ تا ۹۹۹۹'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>{isEn ? 'Recent Roll History:' : 'تاریخچه اعداد تولید شده:'}</span>
            <button
              onClick={() => setHistory([])}
              className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition text-[11px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isEn ? 'Clear' : 'پاک کردن'}</span>
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-slate-400 text-[11px]">{h.date}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                    {h.numbers.join(', ')}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold shrink-0">
                  {h.numbers.length} {isEn ? 'num' : 'عدد'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

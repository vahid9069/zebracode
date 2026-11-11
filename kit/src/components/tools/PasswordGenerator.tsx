'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { KeyRound, Copy, Check, RefreshCw, ShieldCheck, History } from 'lucide-react';

export function PasswordGenerator() {
  const [length, setLength] = useState<number>(16);
  const [useUpper, setUseUpper] = useState<boolean>(true);
  const [useLower, setUseLower] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(true);

  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);

  const generate = useCallback(() => {
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let nums = '0123456789';
    let syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeAmbiguous) {
      upper = upper.replace(/[IO]/g, '');
      lower = lower.replace(/[l]/g, '');
      nums = nums.replace(/[01]/g, '');
    }

    let charPool = '';
    if (useUpper) charPool += upper;
    if (useLower) charPool += lower;
    if (useNumbers) charPool += nums;
    if (useSymbols) charPool += syms;

    if (!charPool) {
      setPassword('');
      return;
    }

    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charPool[array[i] % charPool.length];
    }

    setPassword(result);
    setHistory((prev) => [result, ...prev.filter((p) => p !== result)].slice(0, 5));
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // محاسبه قدرت رمز عبور
  const getStrength = () => {
    let score = 0;
    if (length >= 12) score += 2;
    else if (length >= 8) score += 1;
    if (length >= 16) score += 1;
    if (useUpper) score += 1;
    if (useLower) score += 1;
    if (useNumbers) score += 1;
    if (useSymbols) score += 1;

    if (score <= 3) return { label: 'ضعیف', color: 'bg-rose-500', text: 'text-rose-500' };
    if (score <= 5) return { label: 'متوسط', color: 'bg-amber-500', text: 'text-amber-500' };
    if (score <= 6) return { label: 'قوی', color: 'bg-blue-500', text: 'text-blue-500' };
    return { label: 'بسیار امن و غیرقابل نفوذ', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const strength = getStrength();

  return (
    <div className="space-y-6">
      {/* باکس نمایش رمز عبور تولید شده */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <input
            type="text"
            readOnly
            dir="ltr"
            value={password}
            className="w-full bg-transparent text-lg sm:text-2xl font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none tracking-wider selection:bg-blue-600 selection:text-white"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={generate}
              title="تولید رمز جدید"
              className="p-2.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'کپی شد' : 'کپی رمز'}</span>
            </button>
          </div>
        </div>

        {/* نوار قدرت رمز */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">سطح امنیت رمز عبور:</span>
          <span className={`font-bold ${strength.text}`}>{strength.label}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: length >= 16 ? '100%' : length >= 12 ? '75%' : '40%' }} />
        </div>
      </div>

      {/* تنظیمات سفارشی‌سازی */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-600" />
          تنظیمات کاراکترها و طول رمز:
        </h3>

        {/* طول رمز */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <span>طول رمز عبور:</span>
            <span className="font-mono text-blue-600 dark:text-blue-400 text-sm">{length} کاراکتر</span>
          </div>
          <input
            type="range"
            min={6}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full cursor-pointer accent-blue-600"
          />
        </div>

        {/* گزینه‌های انتخابی */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={useUpper}
              onChange={(e) => setUseUpper(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span>حروف بزرگ انگلیسی (A-Z)</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={useLower}
              onChange={(e) => setUseLower(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span>حروف کوچک انگلیسی (a-z)</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={useNumbers}
              onChange={(e) => setUseNumbers(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span>شامل اعداد (0-9)</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={useSymbols}
              onChange={(e) => setUseSymbols(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span>شامل نمادهای خاص (!@#$%^&*)</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer sm:col-span-2">
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={(e) => setExcludeAmbiguous(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
            <span>حذف کاراکترهای گیج‌کننده و مشابه (مانند l, 1, I, 0, O)</span>
          </label>
        </div>
      </div>

      {/* تاریخچه رمزهای اخیر در این نشست */}
      {history.length > 1 && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            رمزهای اخیر تولید شده در این نشست:
          </h4>
          <div className="space-y-1.5">
            {history.slice(1).map((pass, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-mono">
                <span className="truncate max-w-[80%]">{pass}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pass);
                  }}
                  className="text-blue-600 hover:underline font-sans text-[11px]"
                >
                  کپی
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

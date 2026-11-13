'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  History,
  Lock,
  Sparkles,
  Sliders,
  Eye,
  EyeOff
} from 'lucide-react';

interface PasswordGeneratorProps {
  locale?: string;
  dict?: any;
}

export function PasswordGenerator({ locale = 'fa', dict }: PasswordGeneratorProps) {
  const isEn = locale === 'en';
  const [length, setLength] = useState<number>(16);
  const [useUpper, setUseUpper] = useState<boolean>(true);
  const [useLower, setUseLower] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(true);

  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]);

  // Cryptographically secure pseudorandom generator (CSPRNG)
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

  const getStrength = () => {
    let score = 0;
    if (length >= 12) score += 2;
    else if (length >= 8) score += 1;
    if (length >= 16) score += 1;
    if (useUpper) score += 1;
    if (useLower) score += 1;
    if (useNumbers) score += 1;
    if (useSymbols) score += 1;

    if (score <= 3) {
      return {
        label: isEn ? 'Weak' : 'ضعیف',
        color: 'bg-rose-500',
        text: 'text-rose-500',
        crackTime: isEn ? 'Few seconds' : 'چند ثانیه',
      };
    }
    if (score <= 5) {
      return {
        label: isEn ? 'Medium' : 'متوسط',
        color: 'bg-amber-500',
        text: 'text-amber-500',
        crackTime: isEn ? '~3 months' : 'حدود ۳ ماه',
      };
    }
    if (score <= 6) {
      return {
        label: isEn ? 'Strong' : 'قوی',
        color: 'bg-blue-500',
        text: 'text-blue-500',
        crackTime: isEn ? '~1,000 years' : 'حدود ۱,۰۰۰ سال',
      };
    }
    return {
      label: isEn ? 'Very Strong & Bulletproof' : 'بسیار امن و غیرقابل نفوذ',
      color: 'bg-emerald-500',
      text: 'text-emerald-500',
      crackTime: isEn ? 'Millions of years' : 'میلیون‌ها سال',
    };
  };

  const strength = getStrength();

  return (
    <div className="space-y-6">
      {/* Password Display Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <input
            type={showPassword ? 'text' : 'password'}
            readOnly
            dir="ltr"
            value={password}
            className="w-full bg-transparent text-xl sm:text-2xl font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none tracking-wider selection:bg-blue-600 selection:text-white"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title={showPassword ? (isEn ? 'Hide' : 'مخفی کردن') : (isEn ? 'Show' : 'نمایش')}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={generate}
              title={isEn ? 'Generate new password' : 'تولید مجدد'}
              className="p-2.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy' : 'کپی رمز')}</span>
            </button>
          </div>
        </div>

        {/* Strength Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{isEn ? 'Security Level:' : 'سطح امنیت:'}</span>
              <span className={`font-bold ${strength.text}`}>{strength.label}</span>
            </div>
            <span className="text-slate-400 text-[11px]">
              {isEn ? `Est. Crack Time: ${strength.crackTime}` : `تخمین زمان کرک شدن: ${strength.crackTime}`}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className={`h-full ${strength.color} transition-all duration-300 rounded-full`} />
          </div>
        </div>
      </div>

      {/* Settings Options Card */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>{isEn ? 'Password Length:' : 'طول رمز عبور:'}</span>
            <span className="text-base text-blue-600 dark:text-blue-400 font-mono">
              {isEn ? `${length} characters` : `${length.toLocaleString('fa-IR')} کاراکتر`}
            </span>
          </div>

          <input
            type="range"
            min="6"
            max="64"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Checkbox Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useUpper}
              onChange={(e) => setUseUpper(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Uppercase Letters (A-Z)' : 'حروف بزرگ انگلیسی (A-Z)'}</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useLower}
              onChange={(e) => setUseLower(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Lowercase Letters (a-z)' : 'حروف کوچک انگلیسی (a-z)'}</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useNumbers}
              onChange={(e) => setUseNumbers(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Numbers (0-9)' : 'اعداد و ارقام (0-9)'}</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useSymbols}
              onChange={(e) => setUseSymbols(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Symbols & Special (!@#$)' : 'علامت‌ها و کاراکترهای خاص (!@#$)'}</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 sm:col-span-2">
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={(e) => setExcludeAmbiguous(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>{isEn ? 'Exclude Ambiguous Characters (e.g. 0, O, 1, l, I)' : 'حذف کاراکترهای مشابه و گیج‌کننده (مانند 0, O, 1, l, I)'}</span>
          </label>
        </div>
      </div>

      {/* History */}
      {history.length > 1 && (
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold">
            <History className="w-4 h-4" />
            <span>{isEn ? 'Recently Generated Passwords:' : 'تاریخچه پسوردهای اخیر تولیدشده:'}</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.slice(1).map((p, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center font-mono">
                <span className="text-slate-600 dark:text-slate-400" dir="ltr">{p}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(p);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline font-sans"
                >
                  {isEn ? 'Copy' : 'کپی'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

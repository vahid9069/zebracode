'use client';

import React, { useState } from 'react';
import jalaali from 'jalaali-js';
import {
  ArrowLeftRight,
  Calendar,
  Copy,
  Check,
  Compass,
  Sparkles,
  Clock
} from 'lucide-react';

interface DateConverterProps {
  locale?: string;
  dict?: any;
}

const FA_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند',
];

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS_FA = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function DateConverter({ locale = 'fa', dict }: DateConverterProps) {
  const isEn = locale === 'en';
  const [mode, setMode] = useState<'shamsiToMiladi' | 'miladiToShamsi'>('shamsiToMiladi');
  const [copied, setCopied] = useState<string | null>(null);

  const now = new Date();
  const todayJ = jalaali.toJalaali(now);

  // Shamsi inputs
  const [jYear, setJYear] = useState<number>(todayJ.jy);
  const [jMonth, setJMonth] = useState<number>(todayJ.jm);
  const [jDay, setJDay] = useState<number>(todayJ.jd);

  // Gregorian inputs
  const [gYear, setGYear] = useState<number>(now.getFullYear());
  const [gMonth, setGMonth] = useState<number>(now.getMonth() + 1);
  const [gDay, setGDay] = useState<number>(now.getDate());

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSetToday = () => {
    const today = new Date();
    const j = jalaali.toJalaali(today);
    setJYear(j.jy);
    setJMonth(j.jm);
    setJDay(j.jd);
    setGYear(today.getFullYear());
    setGMonth(today.getMonth() + 1);
    setGDay(today.getDate());
  };

  let convertedResult = null;

  if (mode === 'shamsiToMiladi') {
    try {
      const g = jalaali.toGregorian(Number(jYear), Number(jMonth), Number(jDay));
      const gDate = new Date(g.gy, g.gm - 1, g.gd);
      const dayIdx = gDate.getDay();
      const weekday = isEn ? WEEKDAYS_EN[dayIdx] : WEEKDAYS_FA[dayIdx];
      const isLeap = jalaali.isLeapJalaaliYear(Number(jYear));

      convertedResult = {
        formatted: `${g.gy}/${String(g.gm).padStart(2, '0')}/${String(g.gd).padStart(2, '0')}`,
        isoFormatted: `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`,
        verbose: `${g.gd} ${EN_MONTHS[g.gm - 1]} ${g.gy}`,
        weekday,
        isLeap: isLeap ? (isEn ? 'Leap Year' : 'سال کبیسه است') : (isEn ? 'Normal Year' : 'سال عادی است'),
        sourceDate: `${jDay} ${FA_MONTHS[jMonth - 1]} ${jYear}`,
      };
    } catch {
      convertedResult = null;
    }
  } else {
    try {
      const j = jalaali.toJalaali(Number(gYear), Number(gMonth), Number(gDay));
      const gDate = new Date(Number(gYear), Number(gMonth) - 1, Number(gDay));
      const dayIdx = gDate.getDay();
      const weekday = isEn ? WEEKDAYS_EN[dayIdx] : WEEKDAYS_FA[dayIdx];
      const isLeap = jalaali.isLeapJalaaliYear(j.jy);

      convertedResult = {
        formatted: `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`,
        isoFormatted: `${j.jy}-${String(j.jm).padStart(2, '0')}-${String(j.jd).padStart(2, '0')}`,
        verbose: `${j.jd} ${FA_MONTHS[j.jm - 1]} ${j.jy}`,
        weekday,
        isLeap: isLeap ? (isEn ? 'Leap Year' : 'سال کبیسه است') : (isEn ? 'Normal Year' : 'سال عادی است'),
        sourceDate: `${gDay} ${EN_MONTHS[gMonth - 1]} ${gYear}`,
      };
    } catch {
      convertedResult = null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Direction Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setMode('shamsiToMiladi')}
          className={`px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            mode === 'shamsiToMiladi'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{isEn ? 'Shamsi to Gregorian (Solar ➔ AD)' : 'تبدیل شمسی به میلادی'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('miladiToShamsi')}
          className={`px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            mode === 'miladiToShamsi'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>{isEn ? 'Gregorian to Shamsi (AD ➔ Solar)' : 'تبدیل میلادی به شمسی'}</span>
        </button>
      </div>

      {/* Input Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {mode === 'shamsiToMiladi'
              ? isEn ? 'Enter Solar Hijri (Shamsi) Date:' : 'تاریخ شمسی مورد نظر را وارد کنید:'
              : isEn ? 'Enter Gregorian Date:' : 'تاریخ میلادی مورد نظر را وارد کنید:'}
          </label>

          <button
            type="button"
            onClick={handleSetToday}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isEn ? 'Today Date' : 'تنظیم روی تاریخ امروز'}</span>
          </button>
        </div>

        {mode === 'shamsiToMiladi' ? (
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{isEn ? 'Day' : 'روز'}</label>
              <input
                type="number"
                min={1}
                max={31}
                value={jDay}
                onChange={(e) => setJDay(Math.max(1, Math.min(31, Number(e.target.value))))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{isEn ? 'Month' : 'ماه'}</label>
              <select
                value={jMonth}
                onChange={(e) => setJMonth(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-xs sm:text-sm font-semibold focus:outline-none"
              >
                {FA_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{isEn ? 'Year' : 'سال'}</label>
              <input
                type="number"
                min={1200}
                max={1500}
                value={jYear}
                onChange={(e) => setJYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{isEn ? 'Day' : 'روز'}</label>
              <input
                type="number"
                min={1}
                max={31}
                value={gDay}
                onChange={(e) => setGDay(Math.max(1, Math.min(31, Number(e.target.value))))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{isEn ? 'Month' : 'ماه'}</label>
              <select
                value={gMonth}
                onChange={(e) => setGMonth(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-xs sm:text-sm font-semibold focus:outline-none"
              >
                {EN_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{isEn ? 'Year' : 'سال'}</label>
              <input
                type="number"
                min={1800}
                max={2100}
                value={gYear}
                onChange={(e) => setGYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {convertedResult && (
        <div className="space-y-6">
          {/* Main Converted Output Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-600/20 text-center space-y-4">
            <span className="text-xs uppercase tracking-widest text-blue-200 font-bold">
              {mode === 'shamsiToMiladi'
                ? isEn ? 'Converted Gregorian Equivalent' : 'معادل تاریخ میلادی'
                : isEn ? 'Converted Shamsi Equivalent' : 'معادل تاریخ خورشیدی (شمسی)'}
            </span>

            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight" dir="ltr">
              {convertedResult.formatted}
            </div>

            <div className="text-sm font-medium text-blue-100 font-vazir">
              {convertedResult.verbose}
            </div>

            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(convertedResult.formatted, 'formatted')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all"
              >
                {copied === 'formatted' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'formatted' ? (isEn ? 'Copied' : 'کپی شد') : (isEn ? 'Copy YYYY/MM/DD' : 'کپی تاریخ عددی')}</span>
              </button>
            </div>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500">{isEn ? 'Day of the Week' : 'روز هفته'}</span>
              <div className="mt-2 text-xl font-bold text-slate-800 dark:text-slate-100">{convertedResult.weekday}</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500">{isEn ? 'Leap Year Status' : 'وضعیت سال'}</span>
              <div className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">{convertedResult.isLeap}</div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500">{isEn ? 'ISO Format' : 'فرمت استاندارد بین‌المللی'}</span>
              <div className="mt-2 text-base font-bold font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                {convertedResult.isoFormatted}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

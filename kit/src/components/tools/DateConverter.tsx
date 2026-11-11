'use client';

import React, { useState, useId } from 'react';
import jalaali from 'jalaali-js';
import { ArrowLeftRight, Calendar, Copy, Check } from 'lucide-react';

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند',
];

const GREGORIAN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PERSIAN_WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

export function DateConverter() {
  const [mode, setMode] = useState<'shamsiToMiladi' | 'miladiToShamsi'>('shamsiToMiladi');
  const [copied, setCopied] = useState<string | null>(null);

  const jYearId = useId();
  const jMonthId = useId();
  const jDayId = useId();
  const gYearId = useId();
  const gMonthId = useId();
  const gDayId = useId();

  // تاریخ روز
  const now = new Date();
  const todayJ = jalaali.toJalaali(now);

  // ورودی‌های شمسی
  const [jYear, setJYear] = useState(todayJ.jy);
  const [jMonth, setJMonth] = useState(todayJ.jm);
  const [jDay, setJDay] = useState(todayJ.jd);

  // ورودی‌های میلادی
  const [gYear, setGYear] = useState(now.getFullYear());
  const [gMonth, setGMonth] = useState(now.getMonth() + 1);
  const [gDay, setGDay] = useState(now.getDate());

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // محاسبات
  let convertedResult = null;

  if (mode === 'shamsiToMiladi') {
    try {
      const g = jalaali.toGregorian(Number(jYear), Number(jMonth), Number(jDay));
      const gDate = new Date(g.gy, g.gm - 1, g.gd);
      const weekday = PERSIAN_WEEKDAYS[gDate.getDay()];
      const isLeap = jalaali.isLeapJalaaliYear(Number(jYear));

      convertedResult = {
        formatted: `${g.gy}/${String(g.gm).padStart(2, '0')}/${String(g.gd).padStart(2, '0')}`,
        verbose: `${g.gd} ${GREGORIAN_MONTHS[g.gm - 1]} ${g.gy}`,
        weekday,
        isLeap: isLeap ? 'سال کبیسه است' : 'سال عادی است',
        sourceDate: `${jDay} ${PERSIAN_MONTHS[jMonth - 1]} ${jYear}`,
      };
    } catch {
      convertedResult = null;
    }
  } else {
    try {
      const j = jalaali.toJalaali(Number(gYear), Number(gMonth), Number(gDay));
      const gDate = new Date(Number(gYear), Number(gMonth) - 1, Number(gDay));
      const weekday = PERSIAN_WEEKDAYS[gDate.getDay()];
      const isLeap = jalaali.isLeapJalaaliYear(j.jy);

      convertedResult = {
        formatted: `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`,
        verbose: `${j.jd} ${PERSIAN_MONTHS[j.jm - 1]} ${j.jy}`,
        weekday,
        isLeap: isLeap ? 'سال کبیسه است' : 'سال عادی است',
        sourceDate: `${gDay} ${GREGORIAN_MONTHS[gMonth - 1]} ${gYear}`,
      };
    } catch {
      convertedResult = null;
    }
  }

  return (
    <div className="space-y-6">
      {/* تب‌های تغییر حالت */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setMode('shamsiToMiladi')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            mode === 'shamsiToMiladi'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          تبدیل شمسی به میلادی
        </button>
        <button
          onClick={() => setMode('miladiToShamsi')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            mode === 'miladiToShamsi'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          تبدیل میلادی به شمسی
        </button>
      </div>

      {/* فرم ورودی */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
          {mode === 'shamsiToMiladi' ? 'تاریخ شمسی مورد نظر:' : 'تاریخ میلادی مورد نظر:'}
        </h3>

        {mode === 'shamsiToMiladi' ? (
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div>
              <label htmlFor={jDayId} className="block text-xs font-medium text-slate-500 mb-1">روز</label>
              <input
                id={jDayId}
                type="number"
                min={1}
                max={31}
                value={jDay}
                onChange={(e) => setJDay(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
              />
            </div>
            <div>
              <label htmlFor={jMonthId} className="block text-xs font-medium text-slate-500 mb-1">ماه</label>
              <select
                id={jMonthId}
                value={jMonth}
                onChange={(e) => setJMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-medium"
              >
                {PERSIAN_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={jYearId} className="block text-xs font-medium text-slate-500 mb-1">سال</label>
              <input
                id={jYearId}
                type="number"
                min={1200}
                max={1500}
                value={jYear}
                onChange={(e) => setJYear(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div>
              <label htmlFor={gDayId} className="block text-xs font-medium text-slate-500 mb-1">Day</label>
              <input
                id={gDayId}
                type="number"
                min={1}
                max={31}
                value={gDay}
                onChange={(e) => setGDay(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
              />
            </div>
            <div>
              <label htmlFor={gMonthId} className="block text-xs font-medium text-slate-500 mb-1">Month</label>
              <select
                id={gMonthId}
                value={gMonth}
                onChange={(e) => setGMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-medium"
              >
                {GREGORIAN_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={gYearId} className="block text-xs font-medium text-slate-500 mb-1">Year</label>
              <input
                id={gYearId}
                type="number"
                min={1800}
                max={2100}
                value={gYear}
                onChange={(e) => setGYear(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* کارت‌های نتیجه */}
      {convertedResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 relative">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">تاریخ معادل عددی</span>
            <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400 font-mono" dir="ltr">
              {convertedResult.formatted}
            </div>
            <button
              onClick={() => handleCopy(convertedResult?.formatted || '', 'formatted')}
              className="mt-3 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {copied === 'formatted' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === 'formatted' ? 'کپی شد' : 'کپی تاریخ'}
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">تاریخ به حروف و روز هفته</span>
            <div className="mt-2 text-lg font-bold text-emerald-800 dark:text-emerald-300">
              {convertedResult.weekday}، {convertedResult.verbose}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">روز هفته: {convertedResult.weekday}</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">وضعیت سال</span>
            <div className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-200">
              {convertedResult.isLeap}
            </div>
            <p className="text-xs text-slate-500 mt-2">مبتنی بر گاه‌شماری رسمی خورشیدی</p>
          </div>
        </div>
      )}
    </div>
  );
}

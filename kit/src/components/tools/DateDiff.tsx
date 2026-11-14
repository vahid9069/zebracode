'use client';

import React, { useState, useMemo } from 'react';
import jalaali from 'jalaali-js';
import {
  Calendar,
  Clock,
  Hourglass,
  ArrowRightLeft,
  Briefcase,
  Coffee,
  Sparkles
} from 'lucide-react';

interface DateDiffProps {
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

export function DateDiff({ locale = 'fa', dict }: DateDiffProps) {
  const isEn = locale === 'en';
  const now = new Date();
  const todayJ = jalaali.toJalaali(now);

  // Start Date
  const [startYear, setStartYear] = useState<number>(todayJ.jy);
  const [startMonth, setStartMonth] = useState<number>(1);
  const [startDay, setStartDay] = useState<number>(1);

  // End Date
  const [endYear, setEndYear] = useState<number>(todayJ.jy);
  const [endMonth, setEndMonth] = useState<number>(todayJ.jm);
  const [endDay, setEndDay] = useState<number>(todayJ.jd);

  const calculateDifference = useMemo(() => {
    try {
      const g1 = jalaali.toGregorian(Number(startYear), Number(startMonth), Number(startDay));
      const g2 = jalaali.toGregorian(Number(endYear), Number(endMonth), Number(endDay));

      const d1 = new Date(g1.gy, g1.gm - 1, g1.gd);
      const d2 = new Date(g2.gy, g2.gm - 1, g2.gd);

      const diffMs = d2.getTime() - d1.getTime();
      const isNegative = diffMs < 0;
      const absDiffMs = Math.abs(diffMs);

      const totalDays = Math.round(absDiffMs / (1000 * 60 * 60 * 24));
      const totalWeeks = Math.floor(totalDays / 7);
      const remainingDaysInWeek = totalDays % 7;
      const totalHours = totalDays * 24;
      const totalMinutes = totalHours * 60;

      // Iranian business days (Saturday to Wednesday) vs Weekends (Thursday and Friday)
      let weekends = 0;
      let weekdays = 0;
      const start = new Date(Math.min(d1.getTime(), d2.getTime()));
      const end = new Date(Math.max(d1.getTime(), d2.getTime()));
      const cur = new Date(start);

      while (cur <= end) {
        const dayOfWeek = cur.getDay(); // 0 is Sunday, 4 is Thursday, 5 is Friday
        if (dayOfWeek === 4 || dayOfWeek === 5) {
          weekends++;
        } else {
          weekdays++;
        }
        cur.setDate(cur.getDate() + 1);
      }

      // Exact breakdown into Years, Months, Days
      let earlierDate = d1 < d2 ? d1 : d2;
      let laterDate = d1 < d2 ? d2 : d1;

      let yDiff = laterDate.getFullYear() - earlierDate.getFullYear();
      let mDiff = laterDate.getMonth() - earlierDate.getMonth();
      let dDiff = laterDate.getDate() - earlierDate.getDate();

      if (dDiff < 0) {
        mDiff -= 1;
        const prevMonthDays = new Date(laterDate.getFullYear(), laterDate.getMonth(), 0).getDate();
        dDiff += prevMonthDays;
      }
      if (mDiff < 0) {
        yDiff -= 1;
        mDiff += 12;
      }

      return {
        totalDays,
        totalWeeks,
        remainingDaysInWeek,
        totalHours,
        totalMinutes,
        weekdays,
        weekends,
        isNegative,
        breakdown: {
          years: yDiff,
          months: mDiff,
          days: dDiff,
        },
      };
    } catch {
      return null;
    }
  }, [startYear, startMonth, startDay, endYear, endMonth, endDay]);

  const swapDates = () => {
    const sY = startYear;
    const sM = startMonth;
    const sD = startDay;
    setStartYear(endYear);
    setStartMonth(endMonth);
    setStartDay(endDay);
    setEndYear(sY);
    setEndMonth(sM);
    setEndDay(sD);
  };

  return (
    <div className="space-y-6">
      {/* Date Pickers Dual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Start Date */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{isEn ? 'Start Date (Solar Hijri):' : 'تاریخ شروع (تقویم شمسی):'}</span>
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{isEn ? 'Day' : 'روز'}</label>
              <input
                type="number"
                min={1}
                max={31}
                value={startDay}
                onChange={(e) => setStartDay(Math.max(1, Math.min(31, Number(e.target.value))))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{isEn ? 'Month' : 'ماه'}</label>
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
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
                min={1300}
                max={1450}
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* End Date */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isEn ? 'End Date (Solar Hijri):' : 'تاریخ پایان (تقویم شمسی):'}</span>
            </h3>

            <button
              type="button"
              onClick={swapDates}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isEn ? 'Swap Dates' : 'جابجایی تاریخ‌ها'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{isEn ? 'Day' : 'روز'}</label>
              <input
                type="number"
                min={1}
                max={31}
                value={endDay}
                onChange={(e) => setEndDay(Math.max(1, Math.min(31, Number(e.target.value))))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{isEn ? 'Month' : 'ماه'}</label>
              <select
                value={endMonth}
                onChange={(e) => setEndMonth(Number(e.target.value))}
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
                min={1300}
                max={1450}
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {calculateDifference && (
        <div className="space-y-6">
          {/* Main Difference Highlight */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-600/20 text-center space-y-3">
            <span className="text-xs uppercase tracking-widest text-blue-200 font-bold">
              {isEn ? 'Total Exact Duration' : 'فاصله دقیق زمانی بین دو تاریخ'}
            </span>

            <div className="text-3xl sm:text-5xl font-black font-mono tracking-tight">
              {isEn ? (
                `${calculateDifference.totalDays.toLocaleString()} Days`
              ) : (
                `${calculateDifference.totalDays.toLocaleString('fa-IR')} روز`
              )}
            </div>

            <p className="text-sm text-blue-100 font-medium">
              {isEn
                ? `Equivalent to ${calculateDifference.breakdown.years} years, ${calculateDifference.breakdown.months} months, and ${calculateDifference.breakdown.days} days`
                : `معادل ${calculateDifference.breakdown.years.toLocaleString('fa-IR')} سال و ${calculateDifference.breakdown.months.toLocaleString('fa-IR')} ماه و ${calculateDifference.breakdown.days.toLocaleString('fa-IR')} روز`}
            </p>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500">{isEn ? 'Weeks' : 'هفته‌ها'}</span>
              <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {isEn ? calculateDifference.totalWeeks : calculateDifference.totalWeeks.toLocaleString('fa-IR')}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {isEn
                  ? `+ ${calculateDifference.remainingDaysInWeek} days`
                  : `+ ${calculateDifference.remainingDaysInWeek.toLocaleString('fa-IR')} روز`}
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500">{isEn ? 'Total Hours' : 'کل ساعت‌ها'}</span>
              <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {isEn ? calculateDifference.totalHours.toLocaleString() : calculateDifference.totalHours.toLocaleString('fa-IR')}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {isEn ? 'Working Days (FA)' : 'روزهای کاری (شنبه-چهارشنبه)'}
              </span>
              <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {isEn ? calculateDifference.weekdays.toLocaleString() : calculateDifference.weekdays.toLocaleString('fa-IR')}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                <Coffee className="w-3.5 h-3.5" />
                {isEn ? 'Weekend Days' : 'روزهای تعطیل پایان هفته'}
              </span>
              <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {isEn ? calculateDifference.weekends.toLocaleString() : calculateDifference.weekends.toLocaleString('fa-IR')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

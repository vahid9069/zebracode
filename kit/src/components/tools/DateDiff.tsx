'use client';

import React, { useState, useId } from 'react';
import jalaali from 'jalaali-js';
import { Calendar, Clock, Hourglass } from 'lucide-react';

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند',
];

export function DateDiff() {
  const now = new Date();
  const todayJ = jalaali.toJalaali(now);

  const startDayId = useId();
  const startMonthId = useId();
  const startYearId = useId();
  const endDayId = useId();
  const endMonthId = useId();
  const endYearId = useId();

  // تاریخ شروع (پیش‌فرض اول سال جاری)
  const [startYear, setStartYear] = useState(todayJ.jy);
  const [startMonth, setStartMonth] = useState(1);
  const [startDay, setStartDay] = useState(1);

  // تاریخ پایان (پیش‌فرض امروز)
  const [endYear, setEndYear] = useState(todayJ.jy);
  const [endMonth, setEndMonth] = useState(todayJ.jm);
  const [endDay, setEndDay] = useState(todayJ.jd);

  const calculateDifference = () => {
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

      // محاسبه روزهای کاری و تعطیل (پنجشنبه و جمعه در ایران)
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

      return {
        totalDays,
        totalWeeks,
        remainingDaysInWeek,
        totalHours,
        weekdays,
        weekends,
        isNegative,
      };
    } catch {
      return null;
    }
  };

  const diff = calculateDifference();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* تاریخ شروع */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            تاریخ شروع:
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor={startDayId} className="block text-xs font-medium text-slate-500 mb-1">روز</label>
              <input
                id={startDayId}
                type="number"
                min={1}
                max={31}
                value={startDay}
                onChange={(e) => setStartDay(Number(e.target.value))}
                className="w-full px-2.5 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold text-sm"
              />
            </div>
            <div>
              <label htmlFor={startMonthId} className="block text-xs font-medium text-slate-500 mb-1">ماه</label>
              <select
                id={startMonthId}
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
                className="w-full px-2.5 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center text-xs font-medium"
              >
                {PERSIAN_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={startYearId} className="block text-xs font-medium text-slate-500 mb-1">سال</label>
              <input
                id={startYearId}
                type="number"
                min={1300}
                max={1500}
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="w-full px-2.5 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold text-sm"
              />
            </div>
          </div>
        </div>

        {/* تاریخ پایان */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Hourglass className="w-4 h-4 text-emerald-600" />
            تاریخ پایان:
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor={endDayId} className="block text-xs font-medium text-slate-500 mb-1">روز</label>
              <input
                id={endDayId}
                type="number"
                min={1}
                max={31}
                value={endDay}
                onChange={(e) => setEndDay(Number(e.target.value))}
                className="w-full px-2.5 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold text-sm"
              />
            </div>
            <div>
              <label htmlFor={endMonthId} className="block text-xs font-medium text-slate-500 mb-1">ماه</label>
              <select
                id={endMonthId}
                value={endMonth}
                onChange={(e) => setEndMonth(Number(e.target.value))}
                className="w-full px-2.5 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center text-xs font-medium"
              >
                {PERSIAN_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={endYearId} className="block text-xs font-medium text-slate-500 mb-1">سال</label>
              <input
                id={endYearId}
                type="number"
                min={1300}
                max={1500}
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="w-full px-2.5 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* نتایج اختلاف زمانی */}
      {diff && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">مجموع تعداد روزها</span>
            <div className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400">
              {diff.totalDays.toLocaleString('fa-IR')} <span className="text-xs font-normal">روز</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">فاصله دقیق تقویمی</p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">بر حسب هفته و روز</span>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {diff.totalWeeks.toLocaleString('fa-IR')} <span className="text-xs font-normal">هفته</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              و {diff.remainingDaysInWeek.toLocaleString('fa-IR')} روز باقی‌مانده
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-center">
            <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">روزهای کاری (شنبه تا چهارشنبه)</span>
            <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
              {diff.weekdays.toLocaleString('fa-IR')} <span className="text-xs font-normal">روز کاری</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              و {diff.weekends.toLocaleString('fa-IR')} روز پنج‌شنبه/جمعه
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" /> بر حسب ساعت
            </span>
            <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
              {diff.totalHours.toLocaleString('fa-IR')} <span className="text-xs font-normal">ساعت</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">معادل مدت زمان کل</p>
          </div>
        </div>
      )}
    </div>
  );
}

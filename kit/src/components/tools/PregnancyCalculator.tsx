'use client';

import React, { useState } from 'react';
import jalaali from 'jalaali-js';
import { Baby, Calendar, Heart, Clock, Sparkles } from 'lucide-react';

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند',
];

export function PregnancyCalculator() {
  const now = new Date();
  const todayJ = jalaali.toJalaali(now);

  const [year, setYear] = useState(todayJ.jy);
  const [month, setMonth] = useState(Math.max(1, todayJ.jm - 3));
  const [day, setDay] = useState(1);

  const calculatePregnancy = () => {
    try {
      const g = jalaali.toGregorian(Number(year), Number(month), Number(day));
      const lmpDate = new Date(g.gy, g.gm - 1, g.gd);

      const diffTime = now.getTime() - lmpDate.getTime();
      const passedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (passedDays < 0 || passedDays > 300) {
        return null;
      }

      const currentWeek = Math.floor(passedDays / 7);
      const currentRemainingDays = passedDays % 7;

      // محاسبه تاریخ زایمان (۲۸۰ روز از تاریخ LMP)
      const dueDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
      const dueJ = jalaali.toJalaali(dueDate);
      const remainingDaysToBirth = Math.max(0, Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      let trimester = 'سه‌ماهه اول (هفته ۱ تا ۱۲)';
      if (currentWeek >= 13 && currentWeek <= 27) {
        trimester = 'سه‌ماهه دوم (هفته ۱۳ تا ۲۷)';
      } else if (currentWeek >= 28) {
        trimester = 'سه‌ماهه سوم (هفته ۲۸ تا زایمان)';
      }

      return {
        currentWeek,
        currentRemainingDays,
        passedDays,
        dueJDate: `${dueJ.jd} ${PERSIAN_MONTHS[dueJ.jm - 1]} ${dueJ.jy}`,
        remainingDaysToBirth,
        trimester,
      };
    } catch {
      return null;
    }
  };

  const res = calculatePregnancy();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Baby className="w-4 h-4 text-pink-500" />
          اولین روز از آخرین دوره قاعدگی (LMP) را وارد کنید:
        </h3>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">روز:</label>
            <input
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">ماه:</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-medium text-xs"
            >
              {PERSIAN_MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">سال:</label>
            <input
              type="number"
              min={1400}
              max={1410}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold text-sm"
            />
          </div>
        </div>
      </div>

      {res ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/60 text-center">
              <span className="text-xs text-pink-700 dark:text-pink-300 font-semibold">سن دقیق بارداری امروز</span>
              <div className="mt-2 text-3xl font-black text-pink-600 dark:text-pink-400">
                هفته {res.currentWeek}
              </div>
              <p className="text-xs text-slate-500 mt-1">و {res.currentRemainingDays} روز (مجموع {res.passedDays} روز)</p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">تاریخ تقریبی زایمان (EDD)</span>
              <div className="mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {res.dueJDate}
              </div>
              <p className="text-xs text-slate-500 mt-1">حدود {res.remainingDaysToBirth} روز مانده تا تولد</p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-center flex flex-col justify-center">
              <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold">مرحله بارداری</span>
              <div className="mt-2 text-sm font-bold text-purple-800 dark:text-purple-200">
                {res.trimester}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs text-center">
          لطفاً یک تاریخ معتبر از دوره بارداری جاری وارد کنید.
        </div>
      )}
    </div>
  );
}

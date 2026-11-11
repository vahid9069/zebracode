'use client';

import React, { useState, useId } from 'react';
import jalaali from 'jalaali-js';
import { Calendar, Cake, Clock } from 'lucide-react';

export function AgeCalculator() {
  const currentJDate = jalaali.toJalaali(new Date());
  const yearId = useId();
  const monthId = useId();
  const dayId = useId();

  const [year, setYear] = useState(1375);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);

  const calculateAge = () => {
    try {
      const birthG = jalaali.toGregorian(Number(year), Number(month), Number(day));
      const birthDate = new Date(birthG.gy, birthG.gm - 1, birthG.gd);
      const now = new Date();

      if (birthDate > now) {
        return null;
      }

      let years = now.getFullYear() - birthDate.getFullYear();
      let months = now.getMonth() - birthDate.getMonth();
      let days = now.getDate() - birthDate.getDate();

      if (days < 0) {
        months -= 1;
        const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        days += prevMonthDays;
      }

      if (months < 0) {
        years -= 1;
        months += 12;
      }

      const diffTime = Math.abs(now.getTime() - birthDate.getTime());
      const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const totalHours = Math.floor(diffTime / (1000 * 60 * 60));

      // روز تولد بعدی
      let nextBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      if (nextBirthday < now) {
        nextBirthday = new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
      }
      const daysToNextBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        years,
        months,
        days,
        totalDays,
        totalHours,
        daysToNextBirthday,
      };
    } catch {
      return null;
    }
  };

  const result = calculateAge();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          تاریخ تولد خود را بر اساس تقویم شمسی وارد کنید:
        </h3>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          <div>
            <label htmlFor={dayId} className="block text-xs font-medium text-slate-500 mb-1">روز</label>
            <input
              id={dayId}
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
            />
          </div>
          <div>
            <label htmlFor={monthId} className="block text-xs font-medium text-slate-500 mb-1">ماه</label>
            <select
              id={monthId}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-medium"
            >
              {[
                'فروردین', 'اردیبهشت', 'خرداد',
                'تیر', 'مرداد', 'شهریور',
                'مهر', 'آبان', 'آذر',
                'دی', 'بهمن', 'اسفند'
              ].map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={yearId} className="block text-xs font-medium text-slate-500 mb-1">سال</label>
            <input
              id={yearId}
              type="number"
              min={1300}
              max={currentJDate.jy}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
            />
          </div>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">سن دقیق شما</span>
            <div className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400">
              {result.years} <span className="text-sm font-normal">سال</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              و {result.months} ماه و {result.days} روز
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center justify-center gap-1">
              <Cake className="w-4 h-4" /> تا تولد بعدی
            </span>
            <div className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">
              {result.daysToNextBirthday} <span className="text-sm font-normal">روز</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">مانده تا فوت کردن شمع‌ها!</p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" /> زمان سپری شده
            </span>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {result.totalDays.toLocaleString('fa-IR')} <span className="text-xs font-normal">روز</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              معادل {result.totalHours.toLocaleString('fa-IR')} ساعت زندگی
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

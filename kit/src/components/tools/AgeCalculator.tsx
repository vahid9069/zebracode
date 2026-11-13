'use client';

import React, { useState, useMemo } from 'react';
import jalaali from 'jalaali-js';
import {
  Calendar,
  Cake,
  Clock,
  Sparkles,
  Heart,
  Compass,
  Hourglass,
  Milestone
} from 'lucide-react';

interface AgeCalculatorProps {
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

const WEEKDAYS_FA = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Chinese zodiac animals associated with years
const ZODIAC_ANIMALS_FA = ['موش', 'گاو', 'ببر', 'خرگوش', 'نهنگ / اژدها', 'مار', 'اسب', 'گوسفند / بز', 'میمون', 'مرغ / خروس', 'سگ', 'خوک'];
const ZODIAC_ANIMALS_EN = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];

export function AgeCalculator({ locale = 'fa', dict }: AgeCalculatorProps) {
  const isEn = locale === 'en';
  const [calendarMode, setCalendarMode] = useState<'shamsi' | 'gregorian'>(isEn ? 'gregorian' : 'shamsi');

  const [shamsiYear, setShamsiYear] = useState<number>(1375);
  const [shamsiMonth, setShamsiMonth] = useState<number>(1);
  const [shamsiDay, setShamsiDay] = useState<number>(1);

  const [gregYear, setGregYear] = useState<number>(1996);
  const [gregMonth, setGregMonth] = useState<number>(3);
  const [gregDay, setGregDay] = useState<number>(21);

  const calculation = useMemo(() => {
    try {
      let birthDate: Date;
      let birthShamsiYear = shamsiYear;

      if (calendarMode === 'shamsi') {
        const g = jalaali.toGregorian(shamsiYear, shamsiMonth, shamsiDay);
        birthDate = new Date(g.gy, g.gm - 1, g.gd);
      } else {
        birthDate = new Date(gregYear, gregMonth - 1, gregDay);
        const j = jalaali.toJalaali(gregYear, gregMonth, gregDay);
        birthShamsiYear = j.jy;
      }

      const now = new Date();
      if (birthDate > now) return null;

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
      const totalWeeks = Math.floor(totalDays / 7);
      const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
      const totalMinutes = Math.floor(diffTime / (1000 * 60));

      // Day of week born
      const dayOfWeekIdx = birthDate.getDay();
      const birthDayOfWeek = isEn ? WEEKDAYS_EN[dayOfWeekIdx] : WEEKDAYS_FA[dayOfWeekIdx];

      // Next Birthday
      let nextBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      if (nextBirthday < now) {
        nextBirthday = new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
      }
      const daysToNextBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Chinese Zodiac Animal (offset based on 1900 Rat or Shamsi year)
      const animalIdx = (birthShamsiYear - 1300 + 7) % 12;
      const zodiacAnimal = isEn ? ZODIAC_ANIMALS_EN[animalIdx] : ZODIAC_ANIMALS_FA[animalIdx];

      // Heartbeats estimate (~80 bpm) & breaths (~16 bpm)
      const totalHeartbeats = totalMinutes * 80;

      return {
        years,
        months,
        days,
        totalDays,
        totalWeeks,
        totalHours,
        totalMinutes,
        birthDayOfWeek,
        daysToNextBirthday,
        zodiacAnimal,
        totalHeartbeats,
      };
    } catch {
      return null;
    }
  }, [calendarMode, shamsiYear, shamsiMonth, shamsiDay, gregYear, gregMonth, gregDay, isEn]);

  return (
    <div className="space-y-6">
      {/* Calendar Mode Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setCalendarMode('shamsi')}
          className={`px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            calendarMode === 'shamsi'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{isEn ? 'Solar Hijri (Shamsi)' : 'تقویم خورشیدی (شمسی)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCalendarMode('gregorian')}
          className={`px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            calendarMode === 'gregorian'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{isEn ? 'Gregorian Calendar' : 'تقویم میلادی (Gregorian)'}</span>
        </button>
      </div>

      {/* Inputs Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Cake className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>
            {calendarMode === 'shamsi'
              ? isEn ? 'Enter your Solar Hijri birth date:' : 'تاریخ تولد خود را بر اساس تقویم شمسی وارد کنید:'
              : isEn ? 'Enter your Gregorian birth date:' : 'تاریخ تولد خود را بر اساس تقویم میلادی وارد کنید:'}
          </span>
        </h3>

        {calendarMode === 'shamsi' ? (
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">{isEn ? 'Day' : 'روز'}</label>
              <input
                type="number"
                min={1}
                max={31}
                value={shamsiDay}
                onChange={(e) => setShamsiDay(Math.max(1, Math.min(31, Number(e.target.value))))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">{isEn ? 'Month' : 'ماه'}</label>
              <select
                value={shamsiMonth}
                onChange={(e) => setShamsiMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-xs sm:text-sm font-semibold focus:outline-none"
              >
                {FA_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">{isEn ? 'Year' : 'سال'}</label>
              <input
                type="number"
                min={1300}
                max={1410}
                value={shamsiYear}
                onChange={(e) => setShamsiYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">{isEn ? 'Day' : 'روز'}</label>
              <input
                type="number"
                min={1}
                max={31}
                value={gregDay}
                onChange={(e) => setGregDay(Math.max(1, Math.min(31, Number(e.target.value))))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">{isEn ? 'Month' : 'ماه'}</label>
              <select
                value={gregMonth}
                onChange={(e) => setGregMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-xs sm:text-sm font-semibold focus:outline-none"
              >
                {EN_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">{isEn ? 'Year' : 'سال'}</label>
              <input
                type="number"
                min={1920}
                max={2030}
                value={gregYear}
                onChange={(e) => setGregYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {calculation && (
        <div className="space-y-6">
          {/* Main Age Highlight */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-blue-600/20 text-center relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <span className="text-xs uppercase tracking-widest text-blue-200 font-bold">
                {isEn ? 'Your Exact Calculated Age' : 'سن دقیق شما تا این لحظه'}
              </span>
              <div className="text-3xl sm:text-5xl font-black font-mono tracking-tight pt-2">
                {isEn ? (
                  `${calculation.years} Years, ${calculation.months} Months, ${calculation.days} Days`
                ) : (
                  `${calculation.years.toLocaleString('fa-IR')} سال و ${calculation.months.toLocaleString('fa-IR')} ماه و ${calculation.days.toLocaleString('fa-IR')} روز`
                )}
              </div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500">{isEn ? 'Total Days Lived' : 'کل روزهای سپری‌شده'}</span>
              <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {isEn ? calculation.totalDays.toLocaleString() : calculation.totalDays.toLocaleString('fa-IR')}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500">{isEn ? 'Total Weeks' : 'کل هفته‌ها'}</span>
              <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {isEn ? calculation.totalWeeks.toLocaleString() : calculation.totalWeeks.toLocaleString('fa-IR')}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500">{isEn ? 'Total Hours' : 'کل ساعت‌های زندگی'}</span>
              <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {isEn ? calculation.totalHours.toLocaleString() : calculation.totalHours.toLocaleString('fa-IR')}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500">{isEn ? 'Days to Next Birthday' : 'روزهای مانده تا تولد بعدی'}</span>
              <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {isEn ? calculation.daysToNextBirthday : calculation.daysToNextBirthday.toLocaleString('fa-IR')}
              </div>
            </div>
          </div>

          {/* Fun facts row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">{isEn ? 'Day of Week Born' : 'روز هفته تولد:'}</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{calculation.birthDayOfWeek}</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">{isEn ? 'Zodiac Animal' : 'نماد حیوان سال تولد:'}</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{calculation.zodiacAnimal}</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">{isEn ? 'Estimated Heartbeats' : 'تخمین ضربان قلب:'}</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                  {isEn ? `~${calculation.totalHeartbeats.toLocaleString()}` : `~${calculation.totalHeartbeats.toLocaleString('fa-IR')}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

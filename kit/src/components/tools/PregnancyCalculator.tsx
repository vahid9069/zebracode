'use client';

import React, { useState, useMemo } from 'react';
import jalaali from 'jalaali-js';
import {
  Baby,
  Calendar,
  Heart,
  Clock,
  Sparkles,
  Milestone,
  CheckCircle2,
  Info
} from 'lucide-react';

interface PregnancyCalculatorProps {
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

export function PregnancyCalculator({ locale = 'fa', dict }: PregnancyCalculatorProps) {
  const isEn = locale === 'en';
  const now = new Date();
  const todayJ = jalaali.toJalaali(now);

  // Default LMP ~ 12 weeks ago
  const [year, setYear] = useState<number>(todayJ.jy);
  const [month, setMonth] = useState<number>(Math.max(1, todayJ.jm - 3));
  const [day, setDay] = useState<number>(1);

  const calculation = useMemo(() => {
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

      // Estimated Due Date (EDD = LMP + 280 days / 40 weeks)
      const dueDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
      const dueJ = jalaali.toJalaali(dueDate);
      const remainingDaysToBirth = Math.max(0, Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      const progressPercent = Math.min(100, Math.round((passedDays / 280) * 100));

      let trimesterFa = 'سه‌ماهه اول (هفته ۱ تا ۱۲)';
      let trimesterEn = 'First Trimester (Weeks 1 to 12)';
      let babySizeFa = 'به اندازه یک دانه کنجد یا عدس';
      let babySizeEn = 'Size of a poppy seed / lentil';

      if (currentWeek >= 13 && currentWeek <= 27) {
        trimesterFa = 'سه‌ماهه دوم (هفته ۱۳ تا ۲۷)';
        trimesterEn = 'Second Trimester (Weeks 13 to 27)';
        babySizeFa = 'به اندازه یک هلو یا بلال';
        babySizeEn = 'Size of a peach / corn';
      } else if (currentWeek >= 28) {
        trimesterFa = 'سه‌ماهه سوم (هفته ۲۸ تا ۴۰)';
        trimesterEn = 'Third Trimester (Weeks 28 to 40)';
        babySizeFa = 'به اندازه آناناس یا هندوانه';
        babySizeEn = 'Size of a pineapple / watermelon';
      }

      // Important Milestones
      const milestones = [
        {
          week: 6,
          title: isEn ? 'First Heartbeat Detectable' : 'تشخیص ضربان قلب جنین (سونوگرافی)',
          reached: currentWeek >= 6,
        },
        {
          week: 12,
          title: isEn ? 'End of 1st Trimester & NT Scan' : 'پایان سه‌ماهه اول و غربالگری اول (NT)',
          reached: currentWeek >= 12,
        },
        {
          week: 18,
          title: isEn ? 'Anomaly Scan & First Movements' : 'سونوگرافی آنومالی و حس اولین حرکات',
          reached: currentWeek >= 18,
        },
        {
          week: 24,
          title: isEn ? 'Fetal Viability & Glucose Test' : 'قابلیت حیات و تست غربالگری قند بارداری',
          reached: currentWeek >= 24,
        },
        {
          week: 37,
          title: isEn ? 'Full Term Pregnancy' : 'رسیدن به تکامل کامل (فول ترم)',
          reached: currentWeek >= 37,
        },
        {
          week: 40,
          title: isEn ? 'Estimated Delivery Date (EDD)' : 'موعد زایمان پیش‌بینی‌شده',
          reached: currentWeek >= 40,
        },
      ];

      return {
        currentWeek,
        currentRemainingDays,
        passedDays,
        dueJDate: `${dueJ.jd} ${FA_MONTHS[dueJ.jm - 1]} ${dueJ.jy}`,
        dueGDate: `${dueDate.getDate()} ${EN_MONTHS[dueDate.getMonth()]} ${dueDate.getFullYear()}`,
        remainingDaysToBirth,
        progressPercent,
        trimester: isEn ? trimesterEn : trimesterFa,
        babySize: isEn ? babySizeEn : babySizeFa,
        milestones,
      };
    } catch {
      return null;
    }
  }, [year, month, day, isEn]);

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Baby className="w-5 h-5 text-pink-500" />
          <span>
            {isEn
              ? 'Enter First Day of Last Menstrual Period (LMP):'
              : 'اولین روز از آخرین دوره قاعدگی (LMP) را بر اساس تقویم شمسی وارد کنید:'}
          </span>
        </h3>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{isEn ? 'Day' : 'روز'}</label>
            <input
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) => setDay(Math.max(1, Math.min(31, Number(e.target.value))))}
              className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{isEn ? 'Month' : 'ماه'}</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
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
              min={1400}
              max={1415}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 border rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {calculation && (
        <div className="space-y-6">
          {/* Main Stage Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white shadow-xl shadow-pink-500/20 text-center space-y-3">
            <span className="text-xs uppercase tracking-widest text-pink-100 font-bold">
              {isEn ? 'Current Gestational Age' : 'سن کنونی بارداری شما'}
            </span>

            <div className="text-3xl sm:text-5xl font-black font-mono tracking-tight">
              {isEn ? (
                `Week ${calculation.currentWeek} + ${calculation.currentRemainingDays} Days`
              ) : (
                `هفته ${calculation.currentWeek.toLocaleString('fa-IR')} و ${calculation.currentRemainingDays.toLocaleString('fa-IR')} روز`
              )}
            </div>

            <p className="text-sm text-pink-100 font-semibold">{calculation.trimester}</p>

            {/* Progress bar */}
            <div className="max-w-md mx-auto pt-2 space-y-1">
              <div className="flex justify-between text-[11px] text-pink-100 font-bold">
                <span>{isEn ? 'LMP Start' : 'شروع بارداری'}</span>
                <span>{calculation.progressPercent}٪</span>
                <span>{isEn ? 'Estimated Delivery' : 'موعد زایمان'}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500 rounded-full"
                  style={{ width: `${calculation.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Secondary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                {isEn ? 'Estimated Due Date (EDD)' : 'تاریخ تقریبی زایمان'}
              </span>
              <div className="mt-2 text-xl font-black text-pink-600 dark:text-pink-400">
                {isEn ? calculation.dueGDate : calculation.dueJDate}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {isEn ? calculation.dueJDate : calculation.dueGDate}
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                {isEn ? 'Days Remaining to Birth' : 'روزهای مانده تا تولد نوزاد'}
              </span>
              <div className="mt-2 text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {isEn ? calculation.remainingDaysToBirth : calculation.remainingDaysToBirth.toLocaleString('fa-IR')}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {isEn ? `Out of 280 full days` : `از کل ۲۸۰ روز بارداری کامل`}
              </span>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                {isEn ? 'Fetal Size Comparison' : 'تخمین اندازه جنین'}
              </span>
              <div className="mt-2 text-base font-bold text-slate-800 dark:text-slate-100">{calculation.babySize}</div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {isEn ? 'Approximate weekly comparison' : 'مقایسه تقریبی هفتگی'}
              </span>
            </div>
          </div>

          {/* Key Milestones List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Milestone className="w-4 h-4 text-pink-500" />
              <span>{isEn ? 'Pregnancy Timeline & Clinical Milestones' : 'چک‌پوینت‌ها و مراحل کلیدی بارداری:'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {calculation.milestones.map((m) => (
                <div
                  key={m.week}
                  className={`p-4 rounded-2xl border text-xs flex items-center gap-3 transition-all ${
                    m.reached
                      ? 'bg-pink-50/60 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900/50'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      m.reached ? 'bg-pink-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {isEn ? `${m.week}w` : `${m.week.toLocaleString('fa-IR')}`}
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{m.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

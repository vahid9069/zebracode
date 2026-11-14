'use client';

import React, { useState } from 'react';
import {
  Droplets,
  GlassWater,
  Activity,
  Sun,
  Check,
  RotateCcw,
  Sparkles,
  Heart,
  Plus,
  Minus
} from 'lucide-react';

interface WaterIntakeProps {
  locale?: string;
  dict?: any;
}

export function WaterIntake({ locale = 'fa', dict }: WaterIntakeProps) {
  const isEn = locale === 'en';
  const [weight, setWeight] = useState<number>(70);
  const [exerciseMinutes, setExerciseMinutes] = useState<number>(30);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [climate, setClimate] = useState<'normal' | 'hot'>('normal');

  // Interactive daily glasses tracker
  const [drankGlasses, setDrankGlasses] = useState<number>(0);

  // Standard clinical formula:
  // Baseline: 35ml per kg body weight
  // Exercise: +350ml per 30 minutes of training
  // Hot Climate / Summer: +500ml
  // Male baseline adjustment: +200ml
  const baseMl = weight * 35;
  const exerciseMl = (exerciseMinutes / 30) * 350;
  const climateMl = climate === 'hot' ? 500 : 0;
  const genderMl = gender === 'male' ? 200 : 0;

  const totalMl = Math.round(baseMl + exerciseMl + climateMl + genderMl);
  const totalLiters = (totalMl / 1000).toFixed(1);
  const totalGlasses = Math.ceil(totalMl / 250); // standard 250ml cup

  const percentDrank = Math.min(100, Math.round((drankGlasses / totalGlasses) * 100));

  return (
    <div className="space-y-6">
      {/* Inputs Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Droplets className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isEn ? 'Personal Hydration Biometrics' : 'مشخصات بدنی و شرایط محیطی مصرف آب:'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Weight */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Body Weight (kg):' : 'وزن بدن (کیلوگرم):'}
            </label>
            <input
              type="number"
              min={30}
              max={250}
              value={weight}
              onChange={(e) => setWeight(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold font-mono text-sm focus:outline-none"
            />
          </div>

          {/* Exercise Minutes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Exercise (Minutes/Day):' : 'ورزش و فعالیت (دقیقه در روز):'}
            </label>
            <input
              type="number"
              min={0}
              max={300}
              value={exerciseMinutes}
              onChange={(e) => setExerciseMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold font-mono text-sm focus:outline-none"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Gender:' : 'جنسیت:'}
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  gender === 'male'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {isEn ? 'Male' : 'آقا'}
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  gender === 'female'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {isEn ? 'Female' : 'خانم'}
              </button>
            </div>
          </div>

          {/* Climate */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Climate & Season:' : 'آب‌وهوا و فصل:'}
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setClimate('normal')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  climate === 'normal'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {isEn ? 'Moderate' : 'معتدل'}
              </button>
              <button
                type="button"
                onClick={() => setClimate('hot')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  climate === 'hot'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {isEn ? 'Hot / Summer' : 'گرم / تابستان'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Target Water Result Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Volume */}
        <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-center shadow-sm space-y-1">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block">
            {isEn ? 'Total Daily Water Need' : 'حجم کل آب مورد نیاز بدن'}
          </span>
          <div className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {isEn ? `${totalLiters} Liters` : `${Number(totalLiters).toLocaleString('fa-IR')} لیتر`}
          </div>
          <span className="text-[11px] text-slate-400 block font-mono">
            {isEn ? `(${totalMl.toLocaleString()} ml)` : `(${totalMl.toLocaleString('fa-IR')} میلی‌لیتر)`}
          </span>
        </div>

        {/* Glasses Count */}
        <div className="p-6 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center shadow-sm space-y-1">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
            {isEn ? 'Standard Glasses (250ml)' : 'تعداد لیوان آب استاندارد'}
          </span>
          <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {isEn ? `${totalGlasses} Glasses` : `${totalGlasses.toLocaleString('fa-IR')} لیوان`}
          </div>
          <span className="text-[11px] text-slate-400 block">
            {isEn ? '250ml per glass throughout the day' : 'هر لیوان معادل ۲۵۰ سی‌سی'}
          </span>
        </div>

        {/* Progress Tracker */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-500 block">
            {isEn ? 'Daily Progress Log' : 'درصد تحقق هدف امروز شما'}
          </span>
          <div className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {percentDrank}٪
          </div>
          <span className="text-[11px] text-slate-400 block">
            {isEn
              ? `${drankGlasses} of ${totalGlasses} drank`
              : `${drankGlasses.toLocaleString('fa-IR')} از ${totalGlasses.toLocaleString('fa-IR')} لیوان نوشیده شد`}
          </span>
        </div>
      </div>

      {/* Interactive Daily Glass Tracker */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GlassWater className="w-5 h-5 text-blue-500" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isEn ? 'Interactive Water Tracker (Click glasses as you drink):' : 'ردیاب لیوان‌های آب امروز (با هر بار نوشیدن کلیک کنید):'}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrankGlasses((prev) => Math.max(0, prev - 1))}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              title={isEn ? 'Decrease' : 'کاهش'}
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDrankGlasses((prev) => Math.min(totalGlasses, prev + 1))}
              className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              title={isEn ? 'Add Glass' : 'افزودن لیوان'}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDrankGlasses(0)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title={isEn ? 'Reset' : 'صفر کردن'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Glasses Visual Buttons */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          {Array.from({ length: totalGlasses }).map((_, idx) => {
            const isDrank = idx < drankGlasses;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setDrankGlasses(idx + 1 === drankGlasses ? idx : idx + 1)}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center gap-1.5 active:scale-95 ${
                  isDrank
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                <GlassWater className="w-5 h-5" />
                <span className="text-[10px] font-mono font-bold">
                  {isEn ? idx + 1 : (idx + 1).toLocaleString('fa-IR')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

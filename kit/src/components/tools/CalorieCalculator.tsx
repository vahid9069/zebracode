'use client';

import React, { useState, useMemo } from 'react';
import {
  Flame,
  Activity,
  Target,
  Dumbbell,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

interface CalorieCalculatorProps {
  locale?: string;
  dict?: any;
}

export function CalorieCalculator({ locale = 'fa', dict }: CalorieCalculatorProps) {
  const isEn = locale === 'en';
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(28);
  const [weight, setWeight] = useState<number>(75); // kg
  const [height, setHeight] = useState<number>(178); // cm
  const [activity, setActivity] = useState<number>(1.375); // Light exercise

  const activityOptions = [
    {
      factor: 1.2,
      labelFa: 'کم‌تحرک و پشت‌میزنشین (بدون ورزش)',
      labelEn: 'Sedentary (Little or no exercise)',
    },
    {
      factor: 1.375,
      labelFa: 'فعالیت سبک (۱ تا ۳ روز ورزش در هفته)',
      labelEn: 'Lightly Active (Exercise 1-3 days/week)',
    },
    {
      factor: 1.55,
      labelFa: 'فعالیت متوسط (۳ تا ۵ روز ورزش در هفته)',
      labelEn: 'Moderately Active (Exercise 3-5 days/week)',
    },
    {
      factor: 1.725,
      labelFa: 'بسیار فعال (۶ تا ۷ روز ورزش سنگین)',
      labelEn: 'Very Active (Hard exercise 6-7 days/week)',
    },
    {
      factor: 1.9,
      labelFa: 'فوق‌العاده فعال (ورزشکار حرفه‌ای یا شغل بدنی)',
      labelEn: 'Extra Active (Physical job or 2x/day training)',
    },
  ];

  const calculation = useMemo(() => {
    const W = Number(weight);
    const H = Number(height);
    const A = Number(age);

    if (W <= 0 || H <= 0 || A <= 0) return null;

    // Clinically validated Mifflin-St Jeor Equation
    let bmr = 10 * W + 6.25 * H - 5 * A;
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const tdee = Math.round(bmr * activity);

    return {
      bmr: Math.round(bmr),
      maintain: tdee,
      mildLoss: Math.round(tdee - 300), // ~0.25 kg/week
      weightLoss: Math.round(tdee - 500), // ~0.5 kg/week (standard deficit)
      fastLoss: Math.round(tdee - 800), // ~0.8 kg/week
      mildGain: Math.round(tdee + 300), // lean bulk
      weightGain: Math.round(tdee + 500), // bulk
    };
  }, [gender, age, weight, height, activity]);

  return (
    <div className="space-y-6">
      {/* Parameters Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Flame className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isEn ? 'Biometrics & Daily Physical Activity' : 'مشخصات بدنی و سطح فعالیت روزانه:'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Gender:' : 'جنسیت:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2.5 text-xs font-bold rounded-2xl border transition-all ${
                  gender === 'male'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {isEn ? 'Male' : 'آقا'}
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2.5 text-xs font-bold rounded-2xl border transition-all ${
                  gender === 'female'
                    ? 'border-pink-600 bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {isEn ? 'Female' : 'خانم'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Age (Years):' : 'سن (سال):'}
            </label>
            <input
              type="number"
              min={12}
              max={110}
              value={age}
              onChange={(e) => setAge(Math.max(1, Math.min(120, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Height (cm):' : 'قد (سانتی‌متر):'}
            </label>
            <input
              type="number"
              min={100}
              max={250}
              value={height}
              onChange={(e) => setHeight(Math.max(50, Math.min(250, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Weight (kg):' : 'وزن (کیلوگرم):'}
            </label>
            <input
              type="number"
              min={30}
              max={300}
              step={0.5}
              value={weight}
              onChange={(e) => setWeight(Math.max(10, Math.min(300, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* Activity Level Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
            {isEn ? 'Daily Exercise & Activity Level:' : 'سطح تحرک و فعالیت بدنی روزانه:'}
          </label>
          <select
            value={activity}
            onChange={(e) => setActivity(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            {activityOptions.map((opt) => (
              <option key={opt.factor} value={opt.factor}>
                {isEn ? opt.labelEn : opt.labelFa}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Breakdown Cards */}
      {calculation && (
        <div className="space-y-6">
          {/* Main Maintenance Highlight */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/20 text-center space-y-3">
            <span className="text-xs uppercase tracking-widest text-amber-100 font-bold">
              {isEn ? 'Daily Maintenance Energy (TDEE)' : 'کالری روزانه تثبیت وزن کنونی (TDEE)'}
            </span>

            <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight">
              {isEn ? calculation.maintain.toLocaleString() : calculation.maintain.toLocaleString('fa-IR')}
              <span className="text-lg font-normal mr-2">{isEn ? ' kcal/day' : ' کالری در روز'}</span>
            </div>

            <p className="text-xs text-amber-100">
              {isEn
                ? `Basal Metabolic Rate (BMR at rest): ${calculation.bmr} kcal`
                : `میزان متابولیسم پایه بدون تحرک (BMR): ${calculation.bmr.toLocaleString('fa-IR')} کالری`}
            </p>
          </div>

          {/* Goal Targets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Weight Loss */}
            <div className="p-6 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center shadow-sm space-y-3">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                <TrendingDown className="w-4 h-4" />
                <span>{isEn ? 'Weight Loss (~0.5 kg/week)' : 'کاهش وزن اصولی (نیم کیلو در هفته)'}</span>
              </span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {isEn ? calculation.weightLoss.toLocaleString() : calculation.weightLoss.toLocaleString('fa-IR')}
              </div>
              <span className="text-[11px] text-slate-500 block">
                {isEn ? `${calculation.mildLoss} kcal for mild loss` : `کاهش ملایم: ${calculation.mildLoss.toLocaleString('fa-IR')} کالری`}
              </span>
            </div>

            {/* Extreme Loss */}
            <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-center shadow-sm space-y-3">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center justify-center gap-1.5">
                <Target className="w-4 h-4" />
                <span>{isEn ? 'Rapid Loss (~0.8 kg/week)' : 'کاهش وزن سریع (نزدیک ۱ کیلو)'}</span>
              </span>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {isEn ? calculation.fastLoss.toLocaleString() : calculation.fastLoss.toLocaleString('fa-IR')}
              </div>
              <span className="text-[11px] text-slate-500 block">
                {isEn ? 'Deficit of ~800 kcal/day' : 'کسری ۸۰۰ کالری در روز'}
              </span>
            </div>

            {/* Muscle / Weight Gain */}
            <div className="p-6 rounded-3xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 text-center shadow-sm space-y-3">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center justify-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>{isEn ? 'Muscle & Weight Gain' : 'افزایش وزن و عضله‌سازی'}</span>
              </span>
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {isEn ? calculation.weightGain.toLocaleString() : calculation.weightGain.toLocaleString('fa-IR')}
              </div>
              <span className="text-[11px] text-slate-500 block">
                {isEn ? `Lean bulk: ${calculation.mildGain} kcal` : `افزایش ملایم: ${calculation.mildGain.toLocaleString('fa-IR')} کالری`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

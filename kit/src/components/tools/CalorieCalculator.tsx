'use client';

import React, { useState } from 'react';
import { Flame, Activity, Target } from 'lucide-react';

export function CalorieCalculator() {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(28);
  const [weight, setWeight] = useState<number>(75); // kg
  const [height, setHeight] = useState<number>(178); // cm
  const [activity, setActivity] = useState<number>(1.375); // ورزش سبک

  const calculateCalories = () => {
    const W = Number(weight);
    const H = Number(height);
    const A = Number(age);

    if (W <= 0 || H <= 0 || A <= 0) return null;

    // فرمول میفلین-سنت جور (Mifflin-St Jeor Equation)
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
      mildLoss: Math.round(tdee - 300), // کاهش ملایم
      fastLoss: Math.round(tdee - 600), // کاهش سریع
      gain: Math.round(tdee + 400), // افزایش وزن
    };
  };

  const res = calculateCalories();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          مشخصات فردی و سطح فعالیت:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">جنسیت:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  gender === 'male' ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                آقا
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  gender === 'female' ? 'border-pink-600 bg-pink-50 dark:bg-pink-950/60 text-pink-600' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                خانم
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">سن (سال):</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">قد (سانتی‌متر):</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">وزن (کیلوگرم):</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">میزان تحرک و ورزش در هفته:</label>
          <select
            value={activity}
            onChange={(e) => setActivity(Number(e.target.value))}
            className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
          >
            <option value={1.2}>بی‌تحرک و پشت‌میز‌نشین (بدون ورزش)</option>
            <option value={1.375}>فعالیت سبک (۱ تا ۳ روز ورزش در هفته)</option>
            <option value={1.55}>فعالیت متوسط (۳ تا ۵ روز ورزش باشگاهی)</option>
            <option value={1.725}>ورزش سنگین و حرفه‌ای (۶ تا ۷ روز ورزش)</option>
          </select>
        </div>
      </div>

      {res && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">تثبیت وزن فعلی</span>
            <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
              {res.maintain.toLocaleString('fa-IR')} <span className="text-xs font-normal">کالری/روز</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">بدون تغییر وزن</p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">کاهش وزن ملایم (ایده‌آل)</span>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {res.mildLoss.toLocaleString('fa-IR')} <span className="text-xs font-normal">کالری/روز</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">حدود ۰.۵ کیلو لاغری در هفته</p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold">کاهش وزن سریع</span>
            <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
              {res.fastLoss.toLocaleString('fa-IR')} <span className="text-xs font-normal">کالری/روز</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">حدود ۱ کیلو لاغری در هفته</p>
          </div>

          <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-center">
            <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold">افزایش وزن و حجم</span>
            <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
              {res.gain.toLocaleString('fa-IR')} <span className="text-xs font-normal">کالری/روز</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">برای عضله‌سازی و چاقی</p>
          </div>
        </div>
      )}
    </div>
  );
}

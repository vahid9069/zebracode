'use client';

import React, { useState } from 'react';
import { Droplets, GlassWater, Activity, Sun, Check, RotateCcw, AlertCircle } from 'lucide-react';

export function WaterIntake() {
  const [weight, setWeight] = useState<number>(70);
  const [exerciseMinutes, setExerciseMinutes] = useState<number>(30);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [climate, setClimate] = useState<'normal' | 'hot'>('normal');

  // ردیاب تعاملی لیوان‌های آب مصرفی
  const [drankGlasses, setDrankGlasses] = useState<number>(0);

  // فرمول استاندارد پزشکی:
  // پایه: ۳۵ میلی‌لیتر به ازای هر کیلوگرم وزن بدن
  // برای هر ۳۰ دقیقه ورزش شدید: حدود ۳۵۰ میلی‌لیتر آب اضافی
  // اقلیم گرم/تابستان: حدود ۵۰۰ میلی‌لیتر آب اضافی
  const baseMl = weight * 35;
  const exerciseMl = (exerciseMinutes / 30) * 350;
  const climateMl = climate === 'hot' ? 500 : 0;
  const genderMl = gender === 'male' ? 200 : 0;

  const totalMl = Math.round(baseMl + exerciseMl + climateMl + genderMl);
  const totalLiters = (totalMl / 1000).toFixed(1);
  const totalGlasses = Math.ceil(totalMl / 250); // هر لیوان استاندارد ۲۵۰ میلی‌لیتر

  const percentDrank = Math.min(100, Math.round((drankGlasses / totalGlasses) * 100));

  return (
    <div className="space-y-6">
      {/* فرم ورودی */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {/* وزن */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">وزن بدن (کیلوگرم)</label>
            <input
              type="number"
              min="30"
              max="200"
              value={weight}
              onChange={(e) => setWeight(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-sm"
            />
          </div>

          {/* مدت ورزش روزانه */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">ورزش و فعالیت (دقیقه در روز)</label>
            <input
              type="number"
              min="0"
              max="300"
              value={exerciseMinutes}
              onChange={(e) => setExerciseMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-sm"
            />
          </div>

          {/* جنسیت */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">جنسیت</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setGender('male')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  gender === 'male' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                مرد
              </button>
              <button
                onClick={() => setGender('female')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  gender === 'female' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                زن
              </button>
            </div>
          </div>

          {/* آب‌وهوا */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">فصل و شرایط آب‌وهوا</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setClimate('normal')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  climate === 'normal' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                معتدل
              </button>
              <button
                onClick={() => setClimate('hot')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  climate === 'hot' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                گرم / تابستان
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* کارت نتیجه محاسبات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg shadow-cyan-500/20 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-cyan-100 flex items-center gap-1.5">
              <Droplets className="w-5 h-5" />
              حجم آب پیشنهادی روزانه
            </span>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">استاندارد جهانی WHO</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-black font-mono tracking-tight">{totalLiters}</span>
            <span className="text-xl font-bold">لیتر در روز</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-cyan-100 bg-black/10 p-3 rounded-xl backdrop-blur-sm">
            <GlassWater className="w-5 h-5 text-white shrink-0" />
            <span>
              معادل با <strong>{totalGlasses} لیوان</strong> استاندارد (۲۵۰ میلی‌لیتری)
            </span>
          </div>
        </div>

        {/* ثبت و پیگیری لیوان‌های مصرفی روزانه */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">ثبت لیوان‌های نوشیده شده امروز</h4>
            <button
              onClick={() => setDrankGlasses(0)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ریست
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
              <span>میزان پیشرفت روزانه:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{percentDrank}٪ ({drankGlasses} از {totalGlasses} لیوان)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentDrank}%` }}
              />
            </div>
          </div>

          {/* دکمه‌های لیوان‌ها */}
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from({ length: totalGlasses }).map((_, idx) => {
              const isChecked = idx < drankGlasses;
              return (
                <button
                  key={idx}
                  onClick={() => setDrankGlasses(isChecked && idx === drankGlasses - 1 ? idx : idx + 1)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    isChecked
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                  }`}
                  title={`لیوان شماره ${idx + 1}`}
                >
                  {isChecked ? <Check className="w-4 h-4" /> : idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* برنامه پیشنهادی زمان‌بندی هیدراتاسیون */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-cyan-500" />
          بهترین زمان‌بندی برای نوشیدن آب در طول شبانه‌روز:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
            <strong className="block text-slate-800 dark:text-slate-200 mb-1">۱. بلافاصله پس از بیداری</strong>
            <p className="text-slate-500">۲ لیوان آب ولرم برای فعال‌سازی اندام‌های داخلی و گوارش</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
            <strong className="block text-slate-800 dark:text-slate-200 mb-1">۲. نیم‌ساعت قبل از وعده‌های غذایی</strong>
            <p className="text-slate-500">۱ لیوان جهت آماده‌سازی معده و بهبود هضم غذا</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
            <strong className="block text-slate-800 dark:text-slate-200 mb-1">۳. قبل، حین و بعد از فعالیت</strong>
            <p className="text-slate-500">جبران آب از دست رفته ناشی از تعریق و حفظ انرژی ماهیچه‌ها</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
            <strong className="block text-slate-800 dark:text-slate-200 mb-1">۴. یک ساعت قبل از خواب</strong>
            <p className="text-slate-500">۱ لیوان آب جهت پیشگیری از کم‌آبی و غلظت خون شبانه</p>
          </div>
        </div>
      </div>
    </div>
  );
}

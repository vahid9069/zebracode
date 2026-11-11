'use client';

import React, { useState } from 'react';
import { Activity, Heart, Scale, User } from 'lucide-react';

export function BmiCalculator() {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState<number>(175); // cm
  const [weight, setWeight] = useState<number>(72); // kg
  const [age, setAge] = useState<number>(28);

  const calculateBmi = () => {
    const hM = height / 100;
    if (hM <= 0 || weight <= 0) return null;

    const bmi = weight / (hM * hM);
    const idealWeightMin = 18.5 * (hM * hM);
    const idealWeightMax = 24.9 * (hM * hM);
    const idealWeightAvg = 22 * (hM * hM);

    let status = '';
    let statusColor = '';
    let advice = '';

    if (bmi < 18.5) {
      status = 'کمبود وزن (لاغر)';
      statusColor = 'text-amber-500';
      advice = `برای رسیدن به وزن نرمال، بهتر است حدود ${(idealWeightMin - weight).toFixed(1)} کیلوگرم وزن اضافه کنید.`;
    } else if (bmi >= 18.5 && bmi < 25) {
      status = 'وزن طبیعی و ایده‌آل (نرمال)';
      statusColor = 'text-emerald-500';
      advice = 'تبریک! شاخص بدنی شما در محدوده سلامت کامل قرار دارد. با ورزش و رژیم فعلی آن را حفظ کنید.';
    } else if (bmi >= 25 && bmi < 30) {
      status = 'اضافه وزن';
      statusColor = 'text-amber-500';
      advice = `شما حدود ${(weight - idealWeightMax).toFixed(1)} کیلوگرم اضافه وزن دارید و با کمی ورزش و کنترل کالری به وزن نرمال می‌رسید.`;
    } else if (bmi >= 30 && bmi < 35) {
      status = 'چاقی درجه ۱';
      statusColor = 'text-rose-500';
      advice = `شما حدود ${(weight - idealWeightMax).toFixed(1)} کیلوگرم بالاتر از محدوده نرمال هستید. مشاوره با متخصص تغذیه پیشنهاد می‌شود.`;
    } else {
      status = 'چاقی مفرط (درجه ۲ یا ۳)';
      statusColor = 'text-rose-600';
      advice = 'شاخص بدنی شما در محدوده پرخطر است و نیازمند پیگیری جدی پزشکی و رژیم اصولی می‌باشد.';
    }

    return {
      bmi: Number(bmi.toFixed(1)),
      status,
      statusColor,
      advice,
      idealWeightRange: `${idealWeightMin.toFixed(0)} تا ${idealWeightMax.toFixed(0)} کیلوگرم`,
      idealWeightAvg: idealWeightAvg.toFixed(1),
    };
  };

  const res = calculateBmi();

  return (
    <div className="space-y-6">
      {/* فرم مشخصات فیزیکی */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          مشخصات فیزیکی خود را وارد کنید:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              جنسیت:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  gender === 'male'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600'
                }`}
              >
                آقا
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  gender === 'female'
                    ? 'border-pink-600 bg-pink-50 dark:bg-pink-950/60 text-pink-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600'
                }`}
              >
                خانم
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              قد (سانتی‌متر):
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              وزن (کیلوگرم):
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              سن (سال):
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
          </div>
        </div>
      </div>

      {/* نتایج و ارزیابی شاخص بدنی */}
      {res && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs text-slate-500 font-medium">عدد شاخص BMI شما</span>
              <div className="mt-2 text-4xl font-black text-blue-600 dark:text-blue-400">
                {res.bmi}
              </div>
              <p className={`text-sm font-bold mt-2 ${res.statusColor}`}>{res.status}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs text-slate-500 font-medium">محدوده وزن ایده‌آل برای قد شما</span>
              <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {res.idealWeightRange}
              </div>
              <p className="text-xs text-slate-500 mt-2">میانگین وزن عالی: حدود {res.idealWeightAvg} کیلوگرم</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-center shadow-sm text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 mb-1">
                <Heart className="w-4 h-4 text-rose-500" />
                توصیه سلامت:
              </div>
              <p>{res.advice}</p>
            </div>
          </div>

          {/* نوار گرافیکی مقایسه */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500 block mb-2">طیف شاخص توده بدنی:</span>
            <div className="grid grid-cols-4 gap-1 text-[11px] font-bold text-center text-white">
              <div className="py-2 rounded-lg bg-amber-400">کمتر از ۱۸.۵<br/><span className="text-[10px] font-normal">کم‌وزن</span></div>
              <div className="py-2 rounded-lg bg-emerald-500">۱۸.۵ تا ۲۴.۹<br/><span className="text-[10px] font-normal">نرمال</span></div>
              <div className="py-2 rounded-lg bg-amber-500">۲۵ تا ۲۹.۹<br/><span className="text-[10px] font-normal">اضافه وزن</span></div>
              <div className="py-2 rounded-lg bg-rose-500">بیشتر از ۳۰<br/><span className="text-[10px] font-normal">چاقی</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

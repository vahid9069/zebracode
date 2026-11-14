'use client';

import React, { useState, useMemo } from 'react';
import {
  Activity,
  Heart,
  Scale,
  User,
  Sparkles,
  TrendingUp,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface BmiCalculatorProps {
  locale?: string;
  dict?: any;
}

export function BmiCalculator({ locale = 'fa', dict }: BmiCalculatorProps) {
  const isEn = locale === 'en';
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState<number>(175); // cm
  const [weight, setWeight] = useState<number>(72); // kg
  const [age, setAge] = useState<number>(28);

  const calculation = useMemo(() => {
    const hM = height / 100;
    if (hM <= 0 || weight <= 0) return null;

    const bmi = weight / (hM * hM);
    const idealWeightMin = 18.5 * (hM * hM);
    const idealWeightMax = 24.9 * (hM * hM);
    const idealWeightAvg = 22 * (hM * hM);

    let statusFa = '';
    let statusEn = '';
    let category: 'underweight' | 'normal' | 'overweight' | 'obese' = 'normal';
    let statusColor = '';
    let adviceFa = '';
    let adviceEn = '';

    if (bmi < 18.5) {
      statusFa = 'کمبود وزن (لاغر)';
      statusEn = 'Underweight';
      category = 'underweight';
      statusColor = 'text-amber-500';
      const toGain = (idealWeightMin - weight).toFixed(1);
      adviceFa = `برای رسیدن به وزن نرمال، بهتر است حدود ${toGain} کیلوگرم وزن با رژیم پرکالری و سالم اضافه کنید.`;
      adviceEn = `To reach normal weight, you may aim to gain approximately ${toGain} kg with healthy nutrition.`;
    } else if (bmi >= 18.5 && bmi < 25) {
      statusFa = 'وزن طبیعی و ایده‌آل (نرمال)';
      statusEn = 'Normal & Healthy Weight';
      category = 'normal';
      statusColor = 'text-emerald-500';
      adviceFa = 'تبریک! شاخص توده بدنی شما در محدوده سلامت کامل قرار دارد. با حفظ تغذیه مناسب و تحرک روزانه آن را تثبیت کنید.';
      adviceEn = 'Congratulations! Your BMI is within the optimal healthy range. Maintain your current active lifestyle and balanced diet.';
    } else if (bmi >= 25 && bmi < 30) {
      statusFa = 'اضافه وزن';
      statusEn = 'Overweight';
      category = 'overweight';
      statusColor = 'text-amber-500';
      const toLose = (weight - idealWeightMax).toFixed(1);
      adviceFa = `شما حدود ${toLose} کیلوگرم اضافه وزن دارید و با کمی ورزش روزانه و کنترل کالری دریافتی به وزن ایده‌آل می‌رسید.`;
      adviceEn = `You are approximately ${toLose} kg above the normal range. Regular cardio exercise and portion control are recommended.`;
    } else if (bmi >= 30 && bmi < 35) {
      statusFa = 'چاقی درجه ۱';
      statusEn = 'Obesity Class I';
      category = 'obese';
      statusColor = 'text-rose-500';
      const toLose = (weight - idealWeightMax).toFixed(1);
      adviceFa = `شما حدود ${toLose} کیلوگرم بالاتر از محدوده نرمال هستید. اصلاح سبک زندگی و مشاوره با کارشناس تغذیه توصیه می‌شود.`;
      adviceEn = `You are approximately ${toLose} kg above normal. Consulting a certified nutritionist or physician is recommended.`;
    } else {
      statusFa = 'چاقی مفرط (درجه ۲ یا ۳)';
      statusEn = 'Severe Obesity Class II/III';
      category = 'obese';
      statusColor = 'text-rose-600';
      adviceFa = 'شاخص بدنی شما در محدوده پرخطر قرار دارد و نیازمند پیگیری جدی پزشکی و رژیم اصولی و درمانی است.';
      adviceEn = 'Your BMI is in the high-risk category. Medical supervision and clinical weight management are strongly advised.';
    }

    // Gauge position (scale from 15 to 40)
    const gaugePercent = Math.max(0, Math.min(100, ((bmi - 15) / (40 - 15)) * 100));

    return {
      bmi: Number(bmi.toFixed(1)),
      status: isEn ? statusEn : statusFa,
      statusColor,
      category,
      advice: isEn ? adviceEn : adviceFa,
      idealWeightRange: isEn
        ? `${idealWeightMin.toFixed(0)} to ${idealWeightMax.toFixed(0)} kg`
        : `${idealWeightMin.toFixed(0)} تا ${idealWeightMax.toFixed(0)} کیلوگرم`,
      idealWeightAvg: idealWeightAvg.toFixed(1),
      gaugePercent,
    };
  }, [height, weight, age, gender, isEn]);

  return (
    <div className="space-y-6">
      {/* Parameters Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isEn ? 'Physical Biometric Parameters' : 'مشخصات فیزیکی و بیومتریک بدن:'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Gender */}
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

          {/* Height */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Height (cm):' : 'قد (سانتی‌متر):'}
            </label>
            <input
              type="number"
              min={80}
              max={250}
              value={height}
              onChange={(e) => setHeight(Math.max(50, Math.min(250, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Weight (kg):' : 'وزن (کیلوگرم):'}
            </label>
            <input
              type="number"
              min={20}
              max={300}
              step={0.5}
              value={weight}
              onChange={(e) => setWeight(Math.max(10, Math.min(300, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Age (Years):' : 'سن (سال):'}
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={age}
              onChange={(e) => setAge(Math.max(1, Math.min(120, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {calculation && (
        <div className="space-y-6">
          {/* Main Score Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-600/20 text-center space-y-4">
            <span className="text-xs uppercase tracking-widest text-blue-200 font-bold">
              {isEn ? 'Body Mass Index (BMI)' : 'شاخص توده بدنی (BMI) شما'}
            </span>

            <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight">
              {isEn ? calculation.bmi : calculation.bmi.toLocaleString('fa-IR')}
            </div>

            <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-sm font-bold backdrop-blur-xs">
              {calculation.status}
            </div>

            {/* Visual Gauge Bar */}
            <div className="max-w-md mx-auto pt-3 space-y-2">
              <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden relative">
                <div
                  className="h-full bg-white transition-all duration-500 rounded-full"
                  style={{ width: `${calculation.gaugePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-blue-200 font-bold">
                <span>{isEn ? '< 18.5 (Under)' : 'کمتر از ۱۸.۵'}</span>
                <span>{isEn ? '18.5 - 24.9 (Normal)' : '۱۸.۵ تا ۲۴.۹'}</span>
                <span>{isEn ? '25 - 29.9 (Over)' : '۲۵ تا ۲۹.۹'}</span>
                <span>{isEn ? '> 30 (Obese)' : 'بیشتر از ۳۰'}</span>
              </div>
            </div>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 block">
                {isEn ? 'Healthy Weight Range for Your Height:' : 'محدوده وزن ایده‌آل برای قد شما:'}
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {calculation.idealWeightRange}
              </div>
              <p className="text-xs text-slate-400">
                {isEn
                  ? `Target median: ~${calculation.idealWeightAvg} kg`
                  : `وزن میانگین مطلوب: حدود ${Number(calculation.idealWeightAvg).toLocaleString('fa-IR')} کیلوگرم`}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 block">
                {isEn ? 'Health & Nutrition Advice:' : 'توصیه سلامت و مدیریت وزن:'}
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {calculation.advice}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

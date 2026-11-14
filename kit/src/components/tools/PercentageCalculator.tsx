'use client';

import React, { useState } from 'react';
import {
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Calculator,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface PercentageCalculatorProps {
  locale?: string;
  dict?: any;
}

export function PercentageCalculator({ locale = 'fa', dict }: PercentageCalculatorProps) {
  const isEn = locale === 'en';

  // Card 1: What is X% of Y?
  const [p1, setP1] = useState<number>(20);
  const [val1, setVal1] = useState<number>(500000);

  // Card 2: X is what percent of Y?
  const [num2, setNum2] = useState<number>(75);
  const [total2, setTotal2] = useState<number>(300);

  // Card 3: Discount & Price Increase
  const [basePrice, setBasePrice] = useState<number>(1200000);
  const [discPercent, setDiscPercent] = useState<number>(15);

  // Card 4: Percentage Change (Old to New)
  const [oldVal, setOldVal] = useState<number>(100);
  const [newVal, setNewVal] = useState<number>(140);

  // Calculations
  const res1 = (val1 * p1) / 100;
  const res2 = total2 !== 0 ? (num2 / total2) * 100 : 0;

  const discountAmount = (basePrice * discPercent) / 100;
  const priceAfterDiscount = basePrice - discountAmount;
  const priceAfterIncrease = basePrice + discountAmount;

  const diff4 = newVal - oldVal;
  const changePercent4 = oldVal !== 0 ? (diff4 / oldVal) * 100 : 0;
  const isIncrease = diff4 >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: X% of Y */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Percent className="w-4 h-4" />
            </div>
            <span>{isEn ? 'Calculate X% of a Number' : 'محاسبه مقدار درصد از یک عدد'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="relative w-24">
              <input
                type="number"
                value={p1}
                onChange={(e) => setP1(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 font-bold">%</span>
            </div>
            <span>{isEn ? 'of' : 'درصد از عدد'}</span>
            <input
              type="number"
              value={val1}
              onChange={(e) => setVal1(Number(e.target.value))}
              className="flex-1 min-w-[120px] px-3.5 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-center">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-bold">{isEn ? 'Result:' : 'نتیجه حاصل:'}</span>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1.5">
              {isEn ? res1.toLocaleString() : res1.toLocaleString('fa-IR')}
            </div>
          </div>
        </div>

        {/* Card 2: X is what % of Y */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calculator className="w-4 h-4" />
            </div>
            <span>{isEn ? 'Ratio & Share Percentage' : 'محاسبه سهم و نسبت درصدی'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>{isEn ? 'Number' : 'عدد'}</span>
            <input
              type="number"
              value={num2}
              onChange={(e) => setNum2(Number(e.target.value))}
              className="w-24 px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <span>{isEn ? 'is what % of' : 'چند درصد از'}</span>
            <input
              type="number"
              value={total2}
              onChange={(e) => setTotal2(Number(e.target.value))}
              className="flex-1 min-w-[120px] px-3.5 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <span>{isEn ? '?' : 'است؟'}</span>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">{isEn ? 'Percentage Share:' : 'نسبت درصدی:'}</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1.5">
              {res2.toFixed(2)}٪
            </div>
          </div>
        </div>

        {/* Card 3: Discount & Price Increase */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Tag className="w-4 h-4" />
            </div>
            <span>{isEn ? 'Discount & Tax/Markup Calculator' : 'محاسبه تخفیف خرید یا افزایش قیمت'}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
            <div>
              <label className="block text-slate-500 mb-1">{isEn ? 'Base Price:' : 'قیمت اصلی:'}</label>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full px-3.5 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">{isEn ? 'Percentage (%):' : 'درصد (%):'}</label>
              <input
                type="number"
                value={discPercent}
                onChange={(e) => setDiscPercent(Number(e.target.value))}
                className="w-full px-3.5 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block mb-1">
                {isEn ? `With ${discPercent}% Discount` : `با ${discPercent}٪ تخفیف`}
              </span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {isEn ? priceAfterDiscount.toLocaleString() : priceAfterDiscount.toLocaleString('fa-IR')}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isEn ? `Saves: ${discountAmount.toLocaleString()}` : `سود: ${discountAmount.toLocaleString('fa-IR')}`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-center">
              <span className="text-xs text-amber-700 dark:text-amber-400 font-bold block mb-1">
                {isEn ? `With ${discPercent}% Markup` : `با ${discPercent}٪ افزایش`}
              </span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {isEn ? priceAfterIncrease.toLocaleString() : priceAfterIncrease.toLocaleString('fa-IR')}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isEn ? `Added: +${discountAmount.toLocaleString()}` : `افزوده‌شده: +${discountAmount.toLocaleString('fa-IR')}`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Percentage Difference / Growth */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <div className={`p-2 rounded-xl ${isIncrease ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
              {isIncrease ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
            <span>{isEn ? 'Percentage Growth / Change' : 'درصد رشد و تغییرات (قدیم به جدید)'}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
            <div>
              <label className="block text-slate-500 mb-1">{isEn ? 'Initial / Old Value:' : 'مقدار اولیه (قدیم):'}</label>
              <input
                type="number"
                value={oldVal}
                onChange={(e) => setOldVal(Number(e.target.value))}
                className="w-full px-3.5 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">{isEn ? 'Final / New Value:' : 'مقدار نهایی (جدید):'}</label>
              <input
                type="number"
                value={newVal}
                onChange={(e) => setNewVal(Number(e.target.value))}
                className="w-full px-3.5 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className={`p-5 rounded-2xl text-center border ${
            isIncrease
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
          }`}>
            <span className={`text-xs font-bold block ${isIncrease ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {isIncrease ? (isEn ? 'Percentage Growth (+)' : 'درصد افزایش و رشد (+)') : (isEn ? 'Percentage Decrease (-)' : 'درصد کاهش (-)')}
            </span>
            <div className={`text-2xl sm:text-3xl font-black font-mono mt-1.5 ${isIncrease ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isIncrease ? '+' : ''}{changePercent4.toFixed(2)}٪
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {isEn ? `Absolute difference: ${diff4}` : `اختلاف عددی: ${diff4.toLocaleString('fa-IR')}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

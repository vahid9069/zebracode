'use client';

import React, { useState } from 'react';
import { Percent, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

export function PercentageCalculator() {
  // فرم ۱: X درصد از Y
  const [p1, setP1] = useState<number>(20);
  const [val1, setVal1] = useState<number>(500000);

  // فرم ۲: X چند درصد از Y است؟
  const [num2, setNum2] = useState<number>(75);
  const [total2, setTotal2] = useState<number>(300);

  // فرم ۳: تخفیف / افزایش درصدی
  const [basePrice, setBasePrice] = useState<number>(1200000);
  const [discPercent, setDiscPercent] = useState<number>(15);

  // فرم ۴: درصد تغییر
  const [oldVal, setOldVal] = useState<number>(100);
  const [newVal, setNewVal] = useState<number>(140);

  // محاسبات
  const res1 = (val1 * p1) / 100;
  const res2 = total2 !== 0 ? (num2 / total2) * 100 : 0;

  const discountAmount = (basePrice * discPercent) / 100;
  const priceAfterDiscount = basePrice - discountAmount;
  const priceAfterIncrease = basePrice + discountAmount;

  const diff4 = newVal - oldVal;
  const changePercent4 = oldVal !== 0 ? (diff4 / oldVal) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* کارت ۱: محاسبه X درصد از Y */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            <Percent className="w-4 h-4 text-blue-600" />
            <span>محاسبه مقدار درصد از یک عدد</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <input
              type="number"
              value={p1}
              onChange={(e) => setP1(Number(e.target.value))}
              className="w-20 px-2.5 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
            />
            <span>درصد از عدد</span>
            <input
              type="number"
              value={val1}
              onChange={(e) => setVal1(Number(e.target.value))}
              className="flex-1 px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
            />
          </div>

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center">
            <span className="text-xs text-blue-700 dark:text-blue-300">نتیجه:</span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {res1.toLocaleString('fa-IR')}
            </div>
          </div>
        </div>

        {/* کارت ۲: X چند درصد از Y است */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            <Percent className="w-4 h-4 text-emerald-600" />
            <span>نسبت درصدی دو عدد</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span>عدد</span>
            <input
              type="number"
              value={num2}
              onChange={(e) => setNum2(Number(e.target.value))}
              className="w-24 px-2.5 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
            />
            <span>چند درصد از</span>
            <input
              type="number"
              value={total2}
              onChange={(e) => setTotal2(Number(e.target.value))}
              className="flex-1 px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
            />
            <span>است؟</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
            <span className="text-xs text-emerald-700 dark:text-emerald-300">نسبت درصدی:</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {res2.toFixed(2)}٪
            </div>
          </div>
        </div>

        {/* کارت ۳: تخفیف و افزایش درصدی */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            <Tag className="w-4 h-4 text-amber-600" />
            <span>محاسبه تخفیف یا افزایش درصدی</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">مبلغ اولیه:</label>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">درصد تخفیف/افزایش:</label>
              <input
                type="number"
                value={discPercent}
                onChange={(e) => setDiscPercent(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
              <span className="text-rose-700 dark:text-rose-400">پس از {discPercent}٪ تخفیف:</span>
              <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-1">
                {priceAfterDiscount.toLocaleString('fa-IR')}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
              <span className="text-emerald-700 dark:text-emerald-400">پس از {discPercent}٪ افزایش:</span>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {priceAfterIncrease.toLocaleString('fa-IR')}
              </div>
            </div>
          </div>
        </div>

        {/* کارت ۴: درصد رشد یا افت (تغییر) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            {changePercent4 >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            )}
            <span>محاسبه درصد تغییر و رشد/افت</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">مقدار قدیم (اولیه):</label>
              <input
                type="number"
                value={oldVal}
                onChange={(e) => setOldVal(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">مقدار جدید:</label>
              <input
                type="number"
                value={newVal}
                onChange={(e) => setNewVal(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold"
              />
            </div>
          </div>

          <div className={`p-4 rounded-xl border text-center ${
            changePercent4 >= 0
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
          }`}>
            <span className={`text-xs ${changePercent4 >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
              {changePercent4 >= 0 ? 'میزان رشد (افزایش):' : 'میزان کاهش (افت):'}
            </span>
            <div className={`text-2xl font-black mt-1 ${changePercent4 >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {Math.abs(changePercent4).toFixed(2)}٪
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

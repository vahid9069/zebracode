'use client';

import React, { useState } from 'react';
import { PiggyBank, Calculator, Calendar } from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';

export function BankDepositInterest() {
  const [deposit, setDeposit] = useState<number>(100000000); // ۱۰۰ میلیون تومان
  const [rate, setRate] = useState<number>(22.5); // ۲۲.۵ درصد سالانه مصوب
  const [term, setTerm] = useState<'monthly' | 'yearly'>('monthly');

  const calculateInterest = () => {
    const P = Number(deposit) || 0;
    const r = Number(rate) || 0;

    if (P <= 0 || r <= 0) return null;

    // سود یک سال کامل
    const yearly = Math.round((P * r) / 100);
    // سود یک ماه (فرمول مصوب ۳۰ روزه: (P * r * 30) / 36500)
    const monthly = Math.round((P * r * 30) / 36500);
    // سود یک روز
    const daily = Math.round((P * r) / 36500);

    return {
      monthly,
      yearly,
      daily,
      totalWithInterestYearly: P + yearly,
    };
  };

  const res = calculateInterest();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-blue-600" />
          مشخصات سپرده بانکی:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              مبلغ سپرده‌گذاری (تومان):
            </label>
            <NumericInput
              value={deposit}
              onChange={(val) => setDeposit(val)}
              unit="تومان"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {(deposit).toLocaleString('fa-IR')} تومان
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              نرخ سود اسمی سالانه (%):
            </label>
            <input
              type="number"
              step={0.5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">معمولاً ۲۰.۵٪ تا ۲۳٪</span>
          </div>
        </div>
      </div>

      {res && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">سود دریافتی هر ماه</span>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {res.monthly.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">واریز ماهانه به حساب شما</p>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">مجموع سود در یک سال</span>
            <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
              {res.yearly.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">سود کل در ۳۶۵ روز</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">سود معادل هر روز</span>
            <div className="mt-2 text-xl font-bold text-slate-800 dark:text-slate-200">
              {res.daily.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">بر مبنای فرمول بانک مرکزی</p>
          </div>
        </div>
      )}
    </div>
  );
}

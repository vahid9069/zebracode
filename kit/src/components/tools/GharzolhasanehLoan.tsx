'use client';

import React, { useState } from 'react';
import { Percent, Calculator, HelpCircle } from 'lucide-react';

export function GharzolhasanehLoan() {
  const [amount, setAmount] = useState<number>(50000000); // ۵۰ میلیون تومان
  const [months, setMonths] = useState<number>(24); // ۲۴ ماه

  const calculateLoan = () => {
    const P = Number(amount) || 0;
    const n = Number(months) || 1;

    if (P <= 0 || n <= 0) return null;

    // اصل قسط ماهانه بدون کارمزد
    const monthlyPrincipal = Math.round(P / n);

    // محاسبه کارمزد سالانه ۴٪ طبق رویه بانک مهر ایران و رسالت:
    // سال اول: ۴٪ کل مبلغ وام
    // سال‌های بعد: ۴٪ مانده اصل وام در ابتدای هر سال
    const years = Math.ceil(n / 12);
    let totalFee = 0;
    const yearlyFees: number[] = [];

    for (let y = 0; y < years; y++) {
      const remainingPrincipal = Math.max(0, P - y * 12 * monthlyPrincipal);
      const fee = Math.round(remainingPrincipal * 0.04);
      yearlyFees.push(fee);
      totalFee += fee;
    }

    return {
      monthlyPrincipal,
      totalFee,
      totalRepayment: P + totalFee,
      firstMonthFee: yearlyFees[0] || 0,
      secondYearFee: yearlyFees[1] || 0,
      years,
    };
  };

  const res = calculateLoan();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Percent className="w-4 h-4 text-emerald-600" />
          مشخصات وام قرض‌الحسنه (بانک مهر ایران و رسالت):
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              مبلغ وام (تومان):
            </label>
            <input
              type="number"
              step={5000000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {(amount).toLocaleString('fa-IR')} تومان
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              مدت بازپرداخت (ماه):
            </label>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
            >
              <option value={12}>۱۲ ماه (یک ساله)</option>
              <option value={24}>۲۴ ماه (دو ساله)</option>
              <option value={36}>۳۶ ماه (سه ساله)</option>
              <option value={48}>۴۸ ماه (چهار ساله)</option>
              <option value={60}>۶۰ ماه (پنج ساله)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">کارمزد ثابت: ۴٪ سالانه</span>
          </div>
        </div>
      </div>

      {res && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">مبلغ قسط عادی ماهانه</span>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {res.monthlyPrincipal.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">قسط ماهانه بازپرداخت اصل وام</p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold">کارمزد سال اول (ماه اول)</span>
            <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
              {res.firstMonthFee.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">کارمزد ۴٪ سال اول در قسط اول دریافت می‌شود</p>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">مجموع کارمزد کل دوره</span>
            <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
              {res.totalFee.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">کل بازپرداخت: {res.totalRepayment.toLocaleString('fa-IR')} تومان</p>
          </div>
        </div>
      )}
    </div>
  );
}

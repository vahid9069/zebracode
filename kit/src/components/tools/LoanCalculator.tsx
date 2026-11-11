'use client';

import React, { useState } from 'react';
import { CreditCard, Calculator } from 'lucide-react';

export function LoanCalculator() {
  const [amount, setAmount] = useState<number>(100000000); // 100 million Tomans
  const [rate, setRate] = useState<number>(23); // 23% bank rate
  const [months, setMonths] = useState<number>(36); // 36 months

  const calculateLoan = () => {
    const P = Number(amount);
    const r = (Number(rate) / 100) / 12;
    const n = Number(months);

    if (P <= 0 || n <= 0) return null;

    if (r === 0) {
      const monthly = P / n;
      return {
        monthlyInstallment: Math.round(monthly),
        totalInterest: 0,
        totalPayment: P,
      };
    }

    // فرمول استاندارد بانک مرکزی ایران
    const monthlyInstallment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = monthlyInstallment * n;
    const totalInterest = totalPayment - P;

    return {
      monthlyInstallment: Math.round(monthlyInstallment),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
    };
  };

  const result = calculateLoan();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              مبلغ وام (تومان):
            </label>
            <input
              type="number"
              step={1000000}
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
              نرخ سود سالانه (درصد):
            </label>
            <input
              type="number"
              step={0.5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">معمولاً ۱۸٪ تا ۲۳٪</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              مدت بازپرداخت (ماه):
            </label>
            <input
              type="number"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">{(months / 12).toFixed(1)} سال</span>
          </div>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center justify-center gap-1">
              <CreditCard className="w-4 h-4" /> مبلغ هر قسط ماهانه
            </span>
            <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
              {result.monthlyInstallment.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center justify-center gap-1">
              <Calculator className="w-4 h-4" /> کل سود پرداختی
            </span>
            <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
              {result.totalInterest.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">مجموع اصل و سود</span>
            <div className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-200">
              {result.totalPayment.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

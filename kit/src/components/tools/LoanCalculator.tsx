'use client';

import React, { useState } from 'react';
import { CreditCard, Calculator } from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';

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
            <NumericInput
              value={amount}
              onChange={(val) => setAmount(val)}
              unit="تومان"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono focus:outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              مصوب بانک مرکزی (معمولاً ۲۳٪ یا قرض‌الحسنه ۴٪)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              مدت بازپرداخت (ماه):
            </label>
            <input
              type="number"
              min={1}
              max={360}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono focus:outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              معادل {Math.floor(months / 12)} سال {months % 12 > 0 ? `و ${months % 12} ماه` : ''}
            </span>
          </div>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-100 dark:border-slate-700 rounded-2xl p-5 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              مبلغ هر قسط ماهانه
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {result.monthlyInstallment.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">تومان</span>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/60 border border-amber-100 dark:border-slate-700 rounded-2xl p-5 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              کل سود پرداختی به بانک
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {result.totalInterest.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">تومان</span>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/60 border border-emerald-100 dark:border-slate-700 rounded-2xl p-5 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              مجموع بازپرداخت (اصل + سود)
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {result.totalPayment.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">تومان</span>
          </div>
        </div>
      )}
    </div>
  );
}

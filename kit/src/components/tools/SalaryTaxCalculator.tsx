'use client';

import React, { useState } from 'react';
import { Receipt, Calculator, ShieldCheck } from 'lucide-react';

export function SalaryTaxCalculator() {
  const [grossSalary, setGrossSalary] = useState<number>(25000000); // ۲۵ میلیون تومان

  const calculateTax = () => {
    const salary = Number(grossSalary) || 0;
    if (salary <= 0) return null;

    // پله‌های مالیاتی ماهانه (تومان) طبق قانون بودجه
    const B1 = 12000000; // سقف معافیت
    const B2 = 16500000; // پله اول (۱۰٪)
    const B3 = 27000000; // پله دوم (۱۵٪)
    const B4 = 40000000; // پله سوم (۲۰٪)

    let tax = 0;

    if (salary > B1) {
      if (salary <= B2) {
        tax += (salary - B1) * 0.1;
      } else {
        tax += (B2 - B1) * 0.1;
        if (salary <= B3) {
          tax += (salary - B2) * 0.15;
        } else {
          tax += (B3 - B2) * 0.15;
          if (salary <= B4) {
            tax += (salary - B3) * 0.2;
          } else {
            tax += (B4 - B3) * 0.2;
            tax += (salary - B4) * 0.3;
          }
        }
      }
    }

    const roundedTax = Math.round(tax);
    const netSalary = salary - roundedTax;
    const effectiveRate = ((roundedTax / salary) * 100).toFixed(1);

    return {
      tax: roundedTax,
      netSalary,
      effectiveRate,
      isExempt: roundedTax === 0,
    };
  };

  const res = calculateTax();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-blue-600" />
          مبلغ حقوق ناخالص مشمول مالیات:
        </h3>

        <div className="max-w-md">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            حقوق و مزایای ماهانه (تومان):
          </label>
          <input
            type="number"
            step={1000000}
            value={grossSalary}
            onChange={(e) => setGrossSalary(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            {(grossSalary).toLocaleString('fa-IR')} تومان
          </span>
        </div>
      </div>

      {res && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center">
            <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold">مالیات کسر شده ماهانه</span>
            <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
              {res.tax.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {res.isExempt ? 'حقوق شما در محدوده معافیت مالیاتی قرار دارد' : `نرخ موثر مالیات: ${res.effectiveRate}٪`}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">خالص دریافتی کارمند</span>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {res.netSalary.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">مبلغ واریزی پس از کسر مالیات</p>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center flex flex-col justify-center">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">سقف معافیت مالیاتی سالانه</span>
            <div className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-200">
              ۱۲ میلیون تومان در ماه
            </div>
            <p className="text-[11px] text-slate-500 mt-1">معادل ۱۴۴ میلیون تومان در سال</p>
          </div>
        </div>
      )}
    </div>
  );
}

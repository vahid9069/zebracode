'use client';

import React, { useState } from 'react';
import { Briefcase, Calculator, HelpCircle } from 'lucide-react';

export function SeveranceCalculator() {
  const [baseSalary, setBaseSalary] = useState<number>(12000000); // ۱۲ میلیون پایه حقوق
  const [workedMonths, setWorkedMonths] = useState<number>(12); // کارکرد در سال جاری
  const [totalYears, setTotalYears] = useState<number>(1); // سابقه کار برای سنوات

  // محاسبه طبق قانون کار ایران
  const calculateLabor = () => {
    const salary = Number(baseSalary) || 0;
    const months = Number(workedMonths) || 0;
    const years = Number(totalYears) || 0;

    // عیدی پایان سال: معادل دو ماه حقوق پایه به شرط کارکرد ۱۲ ماه
    // قانون: عیدی نباید از ۳ برابر حداقل دستمزد بیشتر شود
    const rawBonus = salary * 2;
    const bonus = Math.round((rawBonus / 12) * months);

    // سنوات پایان خدمت: معادل یک ماه آخرین حقوق به ازای هر سال سابقه
    const severance = Math.round(salary * (years + months / 12));

    return {
      bonus,
      severance,
      total: bonus + severance,
    };
  };

  const res = calculateLabor();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-600" />
          اطلاعات شغلی و حقوقی کارگر/کارمند:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              حقوق پایه ماهانه (تومان):
            </label>
            <input
              type="number"
              step={500000}
              value={baseSalary}
              onChange={(e) => setBaseSalary(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {(baseSalary).toLocaleString('fa-IR')} تومان
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              تعداد ماه‌های کارکرد در سال جاری:
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={workedMonths}
              onChange={(e) => setWorkedMonths(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">از ۱ تا ۱۲ ماه</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              کل سابقه کار قبلی (سال):
            </label>
            <input
              type="number"
              min={0}
              max={40}
              value={totalYears}
              onChange={(e) => setTotalYears(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">جهت محاسبه حق سنوات</span>
          </div>
        </div>
      </div>

      {res && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-center">
            <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold">مبلغ عیدی و پاداش سالانه</span>
            <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
              {res.bonus.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">معادل دو برابر حقوق پایه به نسبت کارکرد</p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">مبلغ کل حق سنوات</span>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {res.severance.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">یک ماه آخرین حقوق به ازای هر سال</p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-center">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold">مجموع عیدی + سنوات</span>
            <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
              {res.total.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">کل طلب پایان سال کارگر</p>
          </div>
        </div>
      )}
    </div>
  );
}

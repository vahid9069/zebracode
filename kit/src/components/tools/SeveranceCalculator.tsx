'use client';

import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Calculator,
  HelpCircle,
  Gift,
  Award,
  Wallet,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';

interface SeveranceCalculatorProps {
  locale?: string;
  dict?: any;
}

export function SeveranceCalculator({ locale = 'fa', dict }: SeveranceCalculatorProps) {
  const isEn = locale === 'en';
  const [baseSalary, setBaseSalary] = useState<number>(12000000); // 12M Tomans monthly base salary
  const [workedMonths, setWorkedMonths] = useState<number>(12); // Months worked in current fiscal year
  const [workedDays, setWorkedDays] = useState<number>(0); // Extra days
  const [totalYears, setTotalYears] = useState<number>(2); // Previous service years for severance
  const [includeMinMaxCheck, setIncludeMinMaxCheck] = useState<boolean>(true);

  // Iran Labor Law thresholds (1403 minimum wage context: ~7,166,184 base daily/monthly)
  // Min bonus: 60 days of base wage (2x minimum wage)
  // Max bonus: 90 days of base wage (3x minimum wage)
  const MIN_WAGE_BASE = 7166184; // Monthly minimum base wage 1403
  const MIN_BONUS_CEILING = MIN_WAGE_BASE * 2;
  const MAX_BONUS_CEILING = MIN_WAGE_BASE * 3;

  const result = useMemo(() => {
    const salary = Number(baseSalary) || 0;
    const months = Number(workedMonths) || 0;
    const days = Number(workedDays) || 0;
    const years = Number(totalYears) || 0;

    if (salary <= 0) return null;

    // Fractional year in current period
    const currentFraction = months / 12 + days / 365;

    // 1. Annual Bonus (Eydi & Padash):
    // Standard rule: 60 days of daily base wage (2x monthly base) per full year
    // Law constraint: Cannot be less than 2x minimum wage and cannot exceed 3x minimum wage (for 12 months)
    let fullYearBonus = salary * 2;
    let isCappedByMax = false;

    if (includeMinMaxCheck) {
      if (fullYearBonus > MAX_BONUS_CEILING) {
        fullYearBonus = MAX_BONUS_CEILING;
        isCappedByMax = true;
      } else if (fullYearBonus < MIN_BONUS_CEILING) {
        fullYearBonus = MIN_BONUS_CEILING;
      }
    }

    const calculatedBonus = Math.round(fullYearBonus * currentFraction);

    // 2. Severance (Sanavat Payan Khedmat):
    // Standard rule: 30 days of last base salary per year of service
    const totalServiceYears = years + currentFraction;
    const calculatedSeverance = Math.round(salary * totalServiceYears);

    // 3. Unused Leave Settlement (Bazkharid Morakhasi):
    // Assuming remaining unused annual leave days (standard 26 days/year ~ 2.16 days/month)
    const dailyWage = Math.round(salary / 30);

    return {
      bonus: calculatedBonus,
      severance: calculatedSeverance,
      totalPayment: calculatedBonus + calculatedSeverance,
      dailyWage,
      totalServiceYears: totalServiceYears.toFixed(2),
      isCappedByMax,
    };
  }, [baseSalary, workedMonths, workedDays, totalYears, includeMinMaxCheck]);

  return (
    <div className="space-y-6">
      {/* Information Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {isEn ? 'Employee & Labor Details' : 'مشخصات شغلی و حقوقی کارگر یا کارمند:'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Base Salary */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Monthly Base Salary (Toman):' : 'حقوق پایه ماهانه (تومان):'}
            </label>
            <NumericInput
              value={baseSalary}
              onChange={(val) => setBaseSalary(val)}
              unit={isEn ? 'Toman' : 'تومان'}
            />
            <span className="text-[11px] text-slate-400 mt-1 block font-mono">
              {isEn ? `${baseSalary.toLocaleString()} Toman` : `${baseSalary.toLocaleString('fa-IR')} تومان`}
            </span>
          </div>

          {/* Current Year Worked Months */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Months Worked This Year:' : 'تعداد ماه‌های کارکرد در سال جاری:'}
            </label>
            <input
              type="number"
              min={0}
              max={12}
              value={workedMonths}
              onChange={(e) => setWorkedMonths(Math.max(0, Math.min(12, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isEn ? 'Between 0 and 12 months' : 'بین ۰ تا ۱۲ ماه برای عیدی سال'}
            </span>
          </div>

          {/* Extra Days */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Extra Days Worked:' : 'روزهای اضافی کارکرد:'}
            </label>
            <input
              type="number"
              min={0}
              max={30}
              value={workedDays}
              onChange={(e) => setWorkedDays(Math.max(0, Math.min(30, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isEn ? '0 to 30 days' : 'کسری از ماه جهت دقت بیشتر'}
            </span>
          </div>

          {/* Total Previous Service Years */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              {isEn ? 'Total Past Service (Years):' : 'کل سابقه کار قبلی (سال کامل):'}
            </label>
            <input
              type="number"
              min={0}
              max={40}
              value={totalYears}
              onChange={(e) => setTotalYears(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isEn ? 'For severance calculation' : 'مبنای محاسبه سنوات پایان خدمت'}
            </span>
          </div>
        </div>

        {/* Legal options */}
        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeMinMaxCheck}
              onChange={(e) => setIncludeMinMaxCheck(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0"
            />
            <span>
              {isEn
                ? 'Apply Labor Law Maximum Bonus Ceiling (3x Minimum Wage)'
                : 'اعمال سقف قانونی عیدی (حداکثر ۳ برابر حداقل دستمزد قانون کار)'}
            </span>
          </label>
        </div>
      </div>

      {/* Results Cards */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Eydi Bonus */}
            <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 font-bold mb-1">
                <Gift className="w-4 h-4" />
                <span>{isEn ? 'Annual Bonus (Eydi)' : 'مبلغ عیدی و پاداش سالانه'}</span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {isEn ? result.bonus.toLocaleString() : result.bonus.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {result.isCappedByMax
                  ? isEn
                    ? 'Capped by statutory ceiling (3x min wage)'
                    : 'سقف مصوب قانونی ۳ برابر حداقل حقوق اعمال شد'
                  : isEn
                  ? 'Based on 60 days of base wage'
                  : 'معادل دو ماه پایه حقوق به نسبت کارکرد'}
              </p>
            </div>

            {/* Severance (Sanavat) */}
            <div className="p-6 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                <Award className="w-4 h-4" />
                <span>{isEn ? 'End-of-Service Severance' : 'مبلغ سنوات پایان خدمت'}</span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {isEn ? result.severance.toLocaleString() : result.severance.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {isEn
                  ? `For ${result.totalServiceYears} total service years`
                  : `برای مجموعاً ${result.totalServiceYears} سال سابقه کار`}
              </p>
            </div>

            {/* Total Settlement */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-center shadow-lg shadow-blue-500/20">
              <div className="flex items-center justify-center gap-1.5 text-xs text-blue-100 font-bold mb-1">
                <Wallet className="w-4 h-4" />
                <span>{isEn ? 'Total Payable Settlement' : 'مجموع مطالبات (عیدی + سنوات)'}</span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black font-mono">
                {isEn ? result.totalPayment.toLocaleString() : result.totalPayment.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-[11px] text-blue-100/80 mt-2">
                {isEn ? 'Payable upon annual settlement or resignation' : 'مجموع پرداختی به کارمند در پایان سال'}
              </p>
            </div>
          </div>

          {/* Legal Notes */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'Statutory Reference:' : 'مستندات قانونی محاسبات:'}
              </p>
              <p>
                {isEn
                  ? 'Calculated pursuant to Article 24 of Iran Labor Law (Severance) and the 1370 Supreme Labor Council Statute on Annual Bonuses.'
                  : 'محاسبه سنوات طبق ماده ۲۴ قانون کار (معادل یک ماه آخرین حقوق به ازای هر سال سابقه) و محاسبه عیدی بر اساس قانون نحوه پرداخت عیدی سال ۱۳۷۰ مصوب مجلس شورای اسلامی انجام شده است.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

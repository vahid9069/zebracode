'use client';

import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Calculator,
  ShieldCheck,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { NumericInput } from '@/components/ui/NumericInput';

interface SalaryTaxCalculatorProps {
  locale?: string;
  dict?: any;
}

export function SalaryTaxCalculator({ locale = 'fa', dict }: SalaryTaxCalculatorProps) {
  const isEn = locale === 'en';
  const [grossSalary, setGrossSalary] = useState<number>(25000000); // 25M Tomans
  const [year, setYear] = useState<'1403' | '1404'>('1403');
  const [deductInsurance, setDeductInsurance] = useState<boolean>(true); // 7% worker social security insurance

  // Tax Brackets according to Iranian Annual Budget Law (in Tomans monthly)
  // 1403: Exemption up to 12,000,000 Toman
  // 1404: Exemption proposed up to 24,000,000 Toman (or 144M/288M annual)
  const BRACKETS = {
    '1403': {
      exemption: 12000000,
      tiers: [
        { max: 16500000, rate: 0.10, label: isEn ? '12M to 16.5M (10%)' : '۱۲ تا ۱۶.۵ میلیون (۱۰٪)' },
        { max: 27000000, rate: 0.15, label: isEn ? '16.5M to 27M (15%)' : '۱۶.۵ تا ۲۷ میلیون (۱۵٪)' },
        { max: 40000000, rate: 0.20, label: isEn ? '27M to 40M (20%)' : '۲۷ تا ۴۰ میلیون (۲۰٪)' },
        { max: Infinity, rate: 0.30, label: isEn ? 'Over 40M (30%)' : 'بیش از ۴۰ میلیون (۳۰٪)' },
      ],
    },
    '1404': {
      exemption: 24000000,
      tiers: [
        { max: 30000000, rate: 0.10, label: isEn ? '24M to 30M (10%)' : '۲۴ تا ۳۰ میلیون (۱۰٪)' },
        { max: 38000000, rate: 0.15, label: isEn ? '30M to 38M (15%)' : '۳۰ تا ۳۸ میلیون (۱۵٪)' },
        { max: 50000000, rate: 0.20, label: isEn ? '38M to 50M (20%)' : '۳۸ تا ۵۰ میلیون (۲۰٪)' },
        { max: 66000000, rate: 0.25, label: isEn ? '50M to 66M (25%)' : '۵۰ تا ۶۶ میلیون (۲۵٪)' },
        { max: Infinity, rate: 0.30, label: isEn ? 'Over 66M (30%)' : 'بیش از ۶۶ میلیون (۳۰٪)' },
      ],
    },
  };

  const calculation = useMemo(() => {
    const salary = Number(grossSalary) || 0;
    if (salary <= 0) return null;

    const currentRules = BRACKETS[year];
    const exemption = currentRules.exemption;

    // 1. Social Security (7% share of employee, capped at maximum insurable salary ~ 7x minimum base)
    // 1403 max insurable base ~ 50-60M
    const insuranceDeduction = deductInsurance ? Math.round(Math.min(salary, 60000000) * 0.07) : 0;

    // 2. Tax calculation step-by-step
    let remainingTaxable = salary;
    let totalTax = 0;
    const tierBreakdown: Array<{ label: string; taxableInTier: number; taxAmount: number }> = [];

    let previousMax = exemption;

    if (salary > exemption) {
      for (const tier of currentRules.tiers) {
        if (salary > previousMax) {
          const taxableInThisTier = Math.min(salary - previousMax, tier.max - previousMax);
          const taxInThisTier = taxableInThisTier * tier.rate;
          totalTax += taxInThisTier;

          tierBreakdown.push({
            label: tier.label,
            taxableInTier: Math.round(taxableInThisTier),
            taxAmount: Math.round(taxInThisTier),
          });

          previousMax = tier.max;
        } else {
          break;
        }
      }
    }

    const roundedTax = Math.round(totalTax);
    const netSalary = salary - roundedTax - insuranceDeduction;
    const effectiveTaxRate = salary > 0 ? ((roundedTax / salary) * 100).toFixed(1) : '0';

    return {
      tax: roundedTax,
      insurance: insuranceDeduction,
      netSalary,
      effectiveTaxRate,
      isExempt: roundedTax === 0,
      tierBreakdown,
      exemption,
    };
  }, [grossSalary, year, deductInsurance]);

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {isEn ? 'Salary & Fiscal Year Settings' : 'مشخصات حقوق و سال مالیاتی:'}
            </h3>
          </div>

          {/* Year selector tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setYear('1403')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                year === '1403'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isEn ? 'Fiscal Year 1403' : 'قانون بودجه ۱۴۰۳'}
            </button>
            <button
              type="button"
              onClick={() => setYear('1404')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                year === '1404'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isEn ? 'Fiscal Year 1404 (Proposed)' : 'لایحه بودجه ۱۴۰۴'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gross Salary */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              {isEn ? 'Gross Monthly Salary & Benefits (Toman):' : 'حقوق و مزایای ناخالص ماهانه (تومان):'}
            </label>
            <NumericInput
              value={grossSalary}
              onChange={(val) => setGrossSalary(val)}
              unit={isEn ? 'Toman' : 'تومان'}
            />
            <span className="text-[11px] text-slate-400 mt-1.5 block font-mono">
              {isEn ? `${grossSalary.toLocaleString()} Toman` : `${grossSalary.toLocaleString('fa-IR')} تومان`}
            </span>
          </div>

          {/* Insurance toggle */}
          <div className="flex flex-col justify-center space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={deductInsurance}
                onChange={(e) => setDeductInsurance(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span>{isEn ? 'Deduct 7% Social Security Insurance' : 'کسر ۷٪ سهم بیمه تامین اجتماعی کارمند'}</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {isEn
                ? 'Standard employee contribution deducted before bank transfer'
                : 'سهم بیمه کارمند از حقوق ناخالص کسر و به حساب تامین اجتماعی واریز می‌شود'}
            </span>
          </div>
        </div>
      </div>

      {/* Results */}
      {calculation && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tax */}
            <div className="p-6 rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-center shadow-sm">
              <span className="text-xs text-rose-700 dark:text-rose-300 font-bold block mb-1">
                {isEn ? 'Monthly Salary Tax' : 'مالیات کسر شده ماهانه'}
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {isEn ? calculation.tax.toLocaleString() : calculation.tax.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {calculation.isExempt
                  ? isEn ? 'Salary within tax-exempt threshold' : 'حقوق در محدوده معافیت مالیاتی قرار دارد'
                  : isEn
                  ? `Effective Tax Rate: ${calculation.effectiveTaxRate}%`
                  : `نرخ موثر مالیات: ${calculation.effectiveTaxRate}٪`}
              </p>
            </div>

            {/* Insurance */}
            <div className="p-6 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-center shadow-sm">
              <span className="text-xs text-amber-700 dark:text-amber-300 font-bold block mb-1">
                {isEn ? '7% Social Security Insurance' : 'بیمه تامین اجتماعی (۷٪)'}
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {isEn ? calculation.insurance.toLocaleString() : calculation.insurance.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {isEn ? 'Employee pension & health contribution' : 'حق بیمه سهم کارمند بازنشستگی و درمان'}
              </p>
            </div>

            {/* Net Salary */}
            <div className="p-6 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center shadow-sm">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block mb-1">
                {isEn ? 'Net Take-Home Salary' : 'خالص دریافتی کارمند (واریزی)'}
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {isEn ? calculation.netSalary.toLocaleString() : calculation.netSalary.toLocaleString('fa-IR')}
                <span className="text-xs font-normal mr-1">{isEn ? ' Toman' : ' تومان'}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {isEn ? 'Actual amount deposited to bank account' : 'مبلغ واریزی نهایی به حساب بانکی'}
              </p>
            </div>
          </div>

          {/* Tax Tiers Breakdown Table */}
          {calculation.tierBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {isEn ? 'Tax Brackets Breakdown' : 'محاسبه پله به پله مالیات بر حقوق'}
                </h4>
                <span className="text-xs text-slate-400">
                  {isEn
                    ? `Tax-Exempt Base: ${calculation.exemption.toLocaleString()} Toman`
                    : `سقف معافیت: ${calculation.exemption.toLocaleString('fa-IR')} تومان`}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {calculation.tierBreakdown.map((t, idx) => (
                  <div key={idx} className="px-6 py-3 flex items-center justify-between font-mono">
                    <span className="text-slate-600 dark:text-slate-400">{t.label}</span>
                    <div className="flex items-center gap-6">
                      <span className="text-slate-400 text-[11px]">
                        {isEn
                          ? `Taxable: ${t.taxableInTier.toLocaleString()} Toman`
                          : `مشمول: ${t.taxableInTier.toLocaleString('fa-IR')} تومان`}
                      </span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {isEn
                          ? `Tax: ${t.taxAmount.toLocaleString()} Toman`
                          : `مالیات: ${t.taxAmount.toLocaleString('fa-IR')} تومان`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
